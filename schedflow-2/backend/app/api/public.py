from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models import Announcement, Department, FeedbackReport, Section, Semester, Timetable
from app.schemas import DepartmentOut

router = APIRouter(prefix="/api/public", tags=["public"])


@router.get("/departments", response_model=list[DepartmentOut])
def public_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.code).all()


@router.get("/structure")
def public_structure(db: Session = Depends(get_db)):
    """Departments with their semesters and sections, for building the public selectors.

    Loads all semesters and sections once and groups them in memory instead of
    issuing one query per department and one per semester (N+1 avoidance).
    """
    from collections import defaultdict

    departments = db.query(Department).order_by(Department.code).all()
    semesters = db.query(Semester).order_by(Semester.department_id, Semester.number).all()
    sections = db.query(Section).order_by(Section.name).all()

    semesters_by_dept: dict = defaultdict(list)
    for s in semesters:
        semesters_by_dept[s.department_id].append(s)
    sections_by_sem: dict = defaultdict(list)
    for sec in sections:
        sections_by_sem[sec.semester_id].append(sec)

    return [
        {
            "id": d.id,
            "code": d.code,
            "name": d.name,
            "semesters": [
                {
                    "id": s.id,
                    "number": s.number,
                    "academic_year": s.academic_year,
                    "sections": [
                        {"id": sec.id, "name": sec.name}
                        for sec in sections_by_sem.get(s.id, [])
                    ],
                }
                for s in semesters_by_dept.get(d.id, [])
            ],
        }
        for d in departments
    ]


@router.get("/timetable")
def public_timetable(department: str, semester: int, section: str, db: Session = Depends(get_db)):
    """Latest published timetable (with entry details) for department + semester number + section name."""
    dept = db.query(Department).filter(Department.code.ilike(department)).first()
    if dept is None:
        raise HTTPException(404, "Department not found")
    sem = (
        db.query(Semester)
        .filter(Semester.department_id == dept.id, Semester.number == semester)
        .order_by(Semester.academic_year.desc())
        .first()
    )
    if sem is None:
        raise HTTPException(404, "Semester not found")
    sec = (
        db.query(Section)
        .filter(Section.semester_id == sem.id, Section.name.ilike(section))
        .first()
    )
    if sec is None:
        raise HTTPException(404, "Section not found")
    tt = (
        db.query(Timetable)
        .filter(Timetable.section_id == sec.id, Timetable.status == "published")
        .order_by(Timetable.version.desc())
        .first()
    )
    if tt is None:
        raise HTTPException(404, "No published timetable available for this section yet.")
    from app.models import TimetableEntry

    entries = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.timetable_id == tt.id)
        .order_by(TimetableEntry.day_of_week, TimetableEntry.period)
        .all()
    )
    return {
        "timetable": {
            "id": tt.id,
            "status": tt.status,
            "version": tt.version,
            "published_at": tt.published_at,
        },
        "section": {"name": sec.name, "strength": sec.strength},
        "semester": {"number": sem.number, "academic_year": sem.academic_year},
        "department": {"code": dept.code, "name": dept.name},
        "entries": [
            {
                "day_of_week": e.day_of_week,
                "period": e.period,
                "subject_code": e.subject.code,
                "subject_name": e.subject.name,
                "teacher_name": e.teacher.name,
                "room_name": e.room.name,
                "is_lab": e.subject.requires_lab,
                "elective": e.elective_group.name if e.elective_group else None,
            }
            for e in entries
        ],
    }


@router.get("/announcements")
def public_announcements(department: str | None = None, db: Session = Depends(get_db)):
    """Active announcements: global ones plus (optionally) one department's."""
    q = db.query(Announcement).filter(Announcement.active == True)  # noqa: E712
    if department:
        dept = db.query(Department).filter(Department.code.ilike(department)).first()
        if dept is not None:
            q = q.filter((Announcement.department_id == dept.id) | (Announcement.department_id.is_(None)))
    rows = q.order_by(Announcement.pinned.desc(), Announcement.created_at.desc()).limit(10).all()
    return [
        {"id": a.id, "title": a.title, "body": a.body, "pinned": a.pinned, "created_at": a.created_at}
        for a in rows
    ]


class FeedbackPublic(BaseModel):
    department_code: str = ""
    semester_number: int | None = None
    section_name: str = ""
    reporter_name: str = Field(default="Student", max_length=120)
    category: str = Field(default="other", pattern="^(wrong_room|wrong_teacher|absent_teacher|other)$")
    message: str = Field(min_length=3, max_length=1000)


@router.post("/feedback", status_code=201)
def submit_feedback(payload: FeedbackPublic, db: Session = Depends(get_db)):
    """Open endpoint — students report timetable problems without an account."""
    f = FeedbackReport(**payload.model_dump())
    db.add(f)
    db.commit()
    from app.api.campus import notify_all

    notify_all(
        db,
        "New student report",
        f"{payload.category.replace('_', ' ')} reported for {payload.department_code} "
        f"Sem {payload.semester_number or '?'} Sec {payload.section_name}: {payload.message[:120]}",
        "feedback",
    )
    return {"ok": True}
