from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_staff, get_current_user
from app.core.database import get_db
from app.models import (
    Department,
    ElectiveGroup,
    Room,
    Section,
    Semester,
    Subject,
    Teacher,
    Timetable,
    TimetableEntry,
    User,
)
from app.schemas import (
    DepartmentOut,
    RoomCreate,
    RoomOut,
    SectionCreate,
    SectionOut,
    SemesterCreate,
    SemesterOut,
    SubjectCreate,
    SubjectOut,
    TeacherCreate,
    TeacherOut,
    TeacherUpdate,
    WorkloadOut,
)
from app.services.audit import log_action
from app.services.conflicts import teacher_workload

router = APIRouter(prefix="/api", tags=["master-data"], dependencies=[Depends(require_staff)])


def _not_found(name: str):
    return HTTPException(status_code=404, detail=f"{name} not found")


# ---------- Departments (read-only; public list is separate) ----------
@router.get("/departments", response_model=list[DepartmentOut])
def list_departments(db: Session = Depends(get_db)):
    return db.query(Department).order_by(Department.code).all()


# ---------- Teachers ----------
@router.get("/teachers", response_model=list[TeacherOut])
def list_teachers(department_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Teacher).order_by(Teacher.name)
    if department_id is not None:
        q = q.filter(Teacher.department_id == department_id)
    return q.all()


@router.post("/teachers", response_model=TeacherOut, status_code=201)
def create_teacher(
    payload: TeacherCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    teacher = Teacher(**payload.model_dump())
    db.add(teacher)
    db.commit()
    db.refresh(teacher)
    log_action(db, user.email, "created", "teacher", f"Added teacher {teacher.name}")
    return teacher


@router.get("/teachers/{teacher_id}", response_model=WorkloadOut)
def get_teacher(teacher_id: int, db: Session = Depends(get_db)):
    teacher = db.get(Teacher, teacher_id)
    if teacher is None:
        raise _not_found("Teacher")
    out = TeacherOut.model_validate(teacher).model_dump()
    out["assigned_periods"] = teacher_workload(db, teacher_id)
    return out


@router.put("/teachers/{teacher_id}", response_model=TeacherOut)
def update_teacher(
    teacher_id: int,
    payload: TeacherUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    teacher = db.get(Teacher, teacher_id)
    if teacher is None:
        raise _not_found("Teacher")
    for field, value in payload.model_dump().items():
        setattr(teacher, field, value)
    db.commit()
    db.refresh(teacher)
    log_action(db, user.email, "updated", "teacher", f"Updated teacher {teacher.name}")
    return teacher


@router.delete("/teachers/{teacher_id}", status_code=204)
def delete_teacher(
    teacher_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    teacher = db.get(Teacher, teacher_id)
    if teacher is None:
        raise _not_found("Teacher")
    in_use = teacher_workload(db, teacher_id)
    if in_use > 0:
        raise HTTPException(
            409,
            f"Teacher is assigned to {in_use} timetable periods. Remove those entries first.",
        )
    name = teacher.name
    db.delete(teacher)
    db.commit()
    log_action(db, user.email, "deleted", "teacher", f"Removed teacher {name}")


@router.get("/teachers-workload")
def teachers_workload(department_id: int | None = None, db: Session = Depends(get_db)):
    """Map of teacher_id -> assigned weekly periods, for load monitoring."""
    q = db.query(TimetableEntry.teacher_id, func.count(TimetableEntry.id)).group_by(
        TimetableEntry.teacher_id
    )
    counts = {tid: cnt for tid, cnt in q.all()}
    teachers = db.query(Teacher)
    if department_id is not None:
        teachers = teachers.filter(Teacher.department_id == department_id)
    return [
        {
            "id": t.id,
            "name": t.name,
            "max_weekly_load": t.max_weekly_load,
            "assigned_periods": counts.get(t.id, 0),
        }
        for t in teachers.order_by(Teacher.name).all()
    ]


@router.get("/teachers/{teacher_id}/timetable")
def teacher_timetable(teacher_id: int, db: Session = Depends(get_db)):
    """A teacher's personal weekly schedule across all sections and timetables."""
    teacher = db.get(Teacher, teacher_id)
    if teacher is None:
        raise _not_found("Teacher")
    rows = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.teacher_id == teacher_id)
        .order_by(TimetableEntry.day_of_week, TimetableEntry.period)
        .all()
    )
    return {
        "teacher": {
            "id": teacher.id,
            "name": teacher.name,
            "designation": teacher.designation,
            "max_weekly_load": teacher.max_weekly_load,
        },
        "assigned_periods": len(rows),
        "entries": [
            {
                "day_of_week": e.day_of_week,
                "period": e.period,
                "subject_code": e.subject.code,
                "subject_name": e.subject.name,
                "is_lab": e.subject.requires_lab,
                "section_name": e.timetable.section.name,
                "semester_number": e.timetable.semester.number,
                "room_name": e.room.name,
                "status": e.timetable.status,
            }
            for e in rows
        ],
    }


@router.get("/availability")
def slot_availability(
    day: int,
    period: int,
    department_id: int | None = None,
    has_projector: bool | None = None,
    db: Session = Depends(get_db),
):
    """Who and what is free at a given day+period — for manual scheduling and room hunting."""
    if not 1 <= day <= 6:
        raise HTTPException(400, "Day must be 1 (Mon) .. 6 (Sat)")
    entries = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.day_of_week == day, TimetableEntry.period == period)
        .all()
    )
    busy_room = {e.room_id: e for e in entries}
    busy_teacher = {e.teacher_id: e for e in entries}

    rooms_q = db.query(Room)
    teachers_q = db.query(Teacher).filter(Teacher.is_active == True)  # noqa: E712
    if department_id is not None:
        rooms_q = rooms_q.filter(Room.department_id == department_id)
        teachers_q = teachers_q.filter(Teacher.department_id == department_id)
    if has_projector is not None:
        rooms_q = rooms_q.filter(Room.has_projector == has_projector)

    rooms = rooms_q.order_by(Room.name).all()
    teachers = teachers_q.order_by(Teacher.name).all()

    def room_out(r):
        e = busy_room.get(r.id)
        return {
            "id": r.id, "name": r.name, "room_type": r.room_type, "capacity": r.capacity,
            "has_projector": r.has_projector,
            "busy": e is not None,
            "used_by": f"{e.subject.code} · Sec {e.timetable.section.name} · {e.teacher.name}" if e else None,
        }

    def teacher_out(t):
        e = busy_teacher.get(t.id)
        return {
            "id": t.id, "name": t.name, "designation": t.designation,
            "max_weekly_load": t.max_weekly_load,
            "busy": e is not None,
            "teaching": f"{e.subject.code} · Sec {e.timetable.section.name}" if e else None,
        }

    return {
        "day": day,
        "period": period,
        "rooms": [room_out(r) for r in rooms],
        "teachers": [teacher_out(t) for t in teachers],
        "free_room_count": sum(1 for r in rooms if r.id not in busy_room),
        "free_teacher_count": sum(1 for t in teachers if t.id not in busy_teacher),
    }


# ---------- Semesters ----------
@router.get("/semesters", response_model=list[SemesterOut])
def list_semesters(department_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Semester).order_by(Semester.department_id, Semester.number)
    if department_id is not None:
        q = q.filter(Semester.department_id == department_id)
    return q.all()


@router.post("/semesters", response_model=SemesterOut, status_code=201)
def create_semester(
    payload: SemesterCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.get(Department, payload.department_id) is None:
        raise _not_found("Department")
    dup = db.query(Semester).filter(
        Semester.department_id == payload.department_id,
        Semester.number == payload.number,
        Semester.academic_year == payload.academic_year,
    ).first()
    if dup:
        raise HTTPException(409, "This semester already exists for the department.")
    semester = Semester(**payload.model_dump())
    db.add(semester)
    db.commit()
    db.refresh(semester)
    log_action(
        db, user.email, "created", "semester",
        f"Added semester {semester.number} ({semester.academic_year})",
    )
    return semester


@router.put("/semesters/{semester_id}", response_model=SemesterOut)
def update_semester(
    semester_id: int,
    payload: SemesterCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    semester = db.get(Semester, semester_id)
    if semester is None:
        raise _not_found("Semester")
    if db.get(Department, payload.department_id) is None:
        raise _not_found("Department")
    for field, value in payload.model_dump().items():
        setattr(semester, field, value)
    db.commit()
    db.refresh(semester)
    log_action(
        db, user.email, "updated", "semester",
        f"Updated semester {semester.number} ({semester.academic_year})",
    )
    return semester


@router.delete("/semesters/{semester_id}", status_code=204)
def delete_semester(
    semester_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    semester = db.get(Semester, semester_id)
    if semester is None:
        raise _not_found("Semester")
    if db.query(Subject).filter(Subject.semester_id == semester_id).first():
        raise HTTPException(409, "Semester has subjects assigned; remove them first.")
    if db.query(Section).filter(Section.semester_id == semester_id).first():
        raise HTTPException(409, "Semester has sections assigned; remove them first.")
    label = f"semester {semester.number} ({semester.academic_year})"
    db.delete(semester)
    db.commit()
    log_action(db, user.email, "deleted", "semester", f"Removed {label}")


# ---------- Sections ----------
@router.get("/sections", response_model=list[SectionOut])
def list_sections(
    department_id: int | None = None,
    semester_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Section).order_by(Section.department_id, Section.semester_id, Section.name)
    if department_id is not None:
        q = q.filter(Section.department_id == department_id)
    if semester_id is not None:
        q = q.filter(Section.semester_id == semester_id)
    return q.all()


@router.post("/sections", response_model=SectionOut, status_code=201)
def create_section(
    payload: SectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.get(Semester, payload.semester_id) is None:
        raise _not_found("Semester")
    dup = db.query(Section).filter(
        Section.semester_id == payload.semester_id, Section.name == payload.name
    ).first()
    if dup:
        raise HTTPException(409, f"Section '{payload.name}' already exists in this semester.")
    section = Section(**payload.model_dump())
    db.add(section)
    db.commit()
    db.refresh(section)
    log_action(db, user.email, "created", "section", f"Added section {section.name} ({section.strength} students)")
    return section


@router.put("/sections/{section_id}", response_model=SectionOut)
def update_section(
    section_id: int,
    payload: SectionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    section = db.get(Section, section_id)
    if section is None:
        raise _not_found("Section")
    if db.get(Semester, payload.semester_id) is None:
        raise _not_found("Semester")
    for field, value in payload.model_dump().items():
        setattr(section, field, value)
    db.commit()
    db.refresh(section)
    log_action(db, user.email, "updated", "section", f"Updated section {section.name} ({section.strength} students)")
    return section


@router.delete("/sections/{section_id}", status_code=204)
def delete_section(
    section_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    section = db.get(Section, section_id)
    if section is None:
        raise _not_found("Section")
    if db.query(Timetable).filter(Timetable.section_id == section_id).first():
        raise HTTPException(409, "Section has timetables; delete those timetables first.")
    name = section.name
    db.delete(section)
    db.commit()
    log_action(db, user.email, "deleted", "section", f"Removed section {name}")


# ---------- Rooms ----------
@router.get("/rooms", response_model=list[RoomOut])
def list_rooms(department_id: int | None = None, db: Session = Depends(get_db)):
    q = db.query(Room).order_by(Room.department_id, Room.name)
    if department_id is not None:
        q = q.filter(Room.department_id == department_id)
    return q.all()


@router.post("/rooms", response_model=RoomOut, status_code=201)
def create_room(
    payload: RoomCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    dup = db.query(Room).filter(
        Room.department_id == payload.department_id, Room.name == payload.name
    ).first()
    if dup:
        raise HTTPException(409, f"Room '{payload.name}' already exists in this department.")
    room = Room(**payload.model_dump())
    db.add(room)
    db.commit()
    db.refresh(room)
    log_action(db, user.email, "created", "room", f"Added {room.room_type} {room.name} (cap {room.capacity})")
    return room


@router.put("/rooms/{room_id}", response_model=RoomOut)
def update_room(
    room_id: int,
    payload: RoomCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    room = db.get(Room, room_id)
    if room is None:
        raise _not_found("Room")
    for field, value in payload.model_dump().items():
        setattr(room, field, value)
    db.commit()
    db.refresh(room)
    log_action(db, user.email, "updated", "room", f"Updated {room.room_type} {room.name}")
    return room


@router.delete("/rooms/{room_id}", status_code=204)
def delete_room(
    room_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    room = db.get(Room, room_id)
    if room is None:
        raise _not_found("Room")
    if db.query(TimetableEntry).filter(TimetableEntry.room_id == room_id).first():
        raise HTTPException(409, "Room is used in timetable entries; remove them first.")
    name = room.name
    db.delete(room)
    db.commit()
    log_action(db, user.email, "deleted", "room", f"Removed room {name}")


def _resolve_elective_group(db: Session, name: str | None, department_id: int, semester_id: int):
    """Find or create the ElectiveGroup for a subject form value."""
    if not name or not name.strip():
        return None
    name = name.strip()
    group = (
        db.query(ElectiveGroup)
        .filter(
            ElectiveGroup.department_id == department_id,
            ElectiveGroup.semester_id == semester_id,
            ElectiveGroup.name == name,
        )
        .first()
    )
    if group is None:
        group = ElectiveGroup(name=name, department_id=department_id, semester_id=semester_id)
        db.add(group)
        db.flush()
    return group.id


def _subject_out(s: Subject) -> dict:
    return {
        "id": s.id, "code": s.code, "name": s.name,
        "department_id": s.department_id, "semester_id": s.semester_id,
        "hours_per_week": s.hours_per_week, "requires_lab": s.requires_lab,
        "elective_group": s.elective_group.name if s.elective_group else None,
    }


# ---------- Subjects ----------
@router.get("/subjects", response_model=list[SubjectOut])
def list_subjects(
    department_id: int | None = None,
    semester_id: int | None = None,
    db: Session = Depends(get_db),
):
    q = db.query(Subject).order_by(Subject.department_id, Subject.code)
    if department_id is not None:
        q = q.filter(Subject.department_id == department_id)
    if semester_id is not None:
        q = q.filter(Subject.semester_id == semester_id)
    return [_subject_out(s) for s in q.all()]


@router.post("/subjects", response_model=SubjectOut, status_code=201)
def create_subject(
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if db.get(Semester, payload.semester_id) is None:
        raise _not_found("Semester")
    dup = db.query(Subject).filter(
        Subject.department_id == payload.department_id, Subject.code == payload.code
    ).first()
    if dup:
        raise HTTPException(409, f"Subject code '{payload.code}' already exists in this department.")
    data = payload.model_dump()
    group_name = data.pop("elective_group", None)
    subject = Subject(**data)
    subject.elective_group_id = _resolve_elective_group(db, group_name, payload.department_id, payload.semester_id)
    db.add(subject)
    db.commit()
    db.refresh(subject)
    log_action(
        db, user.email, "created", "subject",
        f"Added subject {subject.code} — {subject.name}"
        + (f" (elective: {group_name})" if group_name else ""),
    )
    return _subject_out(subject)


@router.put("/subjects/{subject_id}", response_model=SubjectOut)
def update_subject(
    subject_id: int,
    payload: SubjectCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise _not_found("Subject")
    if db.get(Semester, payload.semester_id) is None:
        raise _not_found("Semester")
    data = payload.model_dump()
    group_name = data.pop("elective_group", None)
    for field, value in data.items():
        setattr(subject, field, value)
    subject.elective_group_id = _resolve_elective_group(db, group_name, payload.department_id, payload.semester_id)
    db.commit()
    db.refresh(subject)
    log_action(db, user.email, "updated", "subject", f"Updated subject {subject.code} — {subject.name}")
    return _subject_out(subject)


@router.delete("/subjects/{subject_id}", status_code=204)
def delete_subject(
    subject_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    subject = db.get(Subject, subject_id)
    if subject is None:
        raise _not_found("Subject")
    if db.query(TimetableEntry).filter(TimetableEntry.subject_id == subject_id).first():
        raise HTTPException(409, "Subject is used in timetable entries; remove them first.")
    code = subject.code
    db.delete(subject)
    db.commit()
    log_action(db, user.email, "deleted", "subject", f"Removed subject {code}")
