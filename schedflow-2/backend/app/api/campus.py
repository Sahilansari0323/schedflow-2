from collections import defaultdict
from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session

from app.api.deps import require_staff, require_teacher, get_current_user
from app.core.database import get_db
from app.models import (
    Announcement,
    DAYS,
    FeedbackReport,
    Notification,
    Room,
    Section,
    Semester,
    Subject,
    Teacher,
    Timetable,
    TimetableEntry,
    User,
)
from app.services.audit import log_action
from app.services.conflicts import find_conflicts

router = APIRouter(prefix="/api", tags=["campus"], dependencies=[Depends(require_staff)])
# routes every signed-in user (incl. teachers) may use
user_router = APIRouter(prefix="/api", tags=["campus-user"], dependencies=[Depends(get_current_user)])
# teacher portal routes
teacher_router = APIRouter(prefix="/api/teacher", tags=["teacher-portal"], dependencies=[Depends(require_teacher)])


def notify_all(db: Session, title: str, body: str, category: str):
    for u in db.query(User).filter(User.is_active == True).all():  # noqa: E712
        db.add(Notification(user_email=u.email, title=title, body=body[:400], category=category))
    db.commit()


# ============================ announcements ============================

class AnnouncementIn(BaseModel):
    title: str = Field(min_length=1, max_length=160)
    body: str = ""
    department_id: int | None = None
    pinned: bool = False


@router.get("/announcements")
def list_announcements(db: Session = Depends(get_db)):
    rows = (
        db.query(Announcement)
        .order_by(Announcement.pinned.desc(), Announcement.created_at.desc())
        .all()
    )
    return [
        {
            "id": a.id, "title": a.title, "body": a.body,
            "department_id": a.department_id, "pinned": a.pinned,
            "active": a.active, "created_by": a.created_by,
            "created_at": a.created_at,
        }
        for a in rows
    ]


@router.post("/announcements", status_code=201)
def create_announcement(payload: AnnouncementIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    a = Announcement(**payload.model_dump(), created_by=user.email)
    db.add(a)
    db.commit()
    db.refresh(a)
    notify_all(db, f"Announcement: {a.title}", a.body[:200] or "New announcement published.", "announcement")
    log_action(db, user.email, "created", "announcement", f"Published announcement '{a.title}'")
    return {"id": a.id}


@router.put("/announcements/{aid}/status")
def set_announcement_status(aid: int, active: bool, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    a = db.get(Announcement, aid)
    if a is None:
        raise HTTPException(404, "Announcement not found")
    a.active = active
    db.commit()
    verb = "Activated" if active else "Archived"
    log_action(db, user.email, "updated", "announcement", f"{verb} announcement '{a.title}'")
    return {"ok": True}


@router.delete("/announcements/{aid}", status_code=204)
def delete_announcement(aid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    a = db.get(Announcement, aid)
    if a is None:
        raise HTTPException(404, "Announcement not found")
    title = a.title
    db.delete(a)
    db.commit()
    log_action(db, user.email, "deleted", "announcement", f"Deleted announcement '{title}'")


# ============================ notifications ============================

@user_router.get("/notifications")
def list_notifications(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    rows = (
        db.query(Notification)
        .filter(Notification.user_email == user.email)
        .order_by(Notification.created_at.desc(), Notification.id.desc())
        .limit(30)
        .all()
    )
    unread = (
        db.query(func.count(Notification.id))
        .filter(Notification.user_email == user.email, Notification.read == False)  # noqa: E712
        .scalar()
    )
    return {
        "unread": unread or 0,
        "items": [
            {"id": n.id, "title": n.title, "body": n.body, "category": n.category, "read": n.read, "created_at": n.created_at}
            for n in rows
        ],
    }


@user_router.delete("/notifications/{nid}")
def delete_notification(nid: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    n = db.get(Notification, nid)
    if n is None or n.user_email != user.email:
        raise HTTPException(404, "Notification not found")
    db.delete(n)
    db.commit()
    return {"ok": True}


@user_router.post("/notifications/read-all")
def read_all(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    db.query(Notification).filter(Notification.user_email == user.email, Notification.read == False).update({"read": True})  # noqa: E712
    db.commit()
    return {"ok": True}


# ============================== analytics ==============================

@router.get("/analytics")
def analytics(db: Session = Depends(get_db)):
    entries = db.query(TimetableEntry).all()
    rooms = db.query(Room).all()
    teachers = db.query(Teacher).all()
    sections = db.query(Section).all()

    total_slots = 6 * 8
    room_use: dict = defaultdict(int)
    teacher_load: dict = defaultdict(int)
    teacher_day: dict = defaultdict(lambda: defaultdict(int))
    section_fill: dict = defaultdict(int)
    for e in entries:
        room_use[e.room_id] += 1
        teacher_load[e.teacher_id] += 1
        teacher_day[e.teacher_id][e.day_of_week] += 1
        section_fill[e.timetable.section_id] += 1

    # gap analysis: free periods between first and last class per teacher/day
    gaps = {}
    for t in teachers:
        per_day = defaultdict(list)
        for e in entries:
            if e.teacher_id == t.id:
                per_day[e.day_of_week].append(e.period)
        g = 0
        busy_days = 0
        for d, periods in per_day.items():
            periods.sort()
            g += (periods[-1] - periods[0] + 1) - len(periods)
            busy_days += 1
        gaps[t.name] = {"gaps": g, "busy_days": busy_days}

    return {
        "rooms": [
            {"name": r.name, "room_type": r.room_type, "used": room_use.get(r.id, 0),
             "utilization": round(room_use.get(r.id, 0) / total_slots * 100)}
            for r in sorted(rooms, key=lambda x: -room_use.get(x.id, 0))
        ],
        "teachers": [
            {"name": t.name, "assigned": teacher_load.get(t.id, 0), "max": t.max_weekly_load,
             "days": teacher_day.get(t.id, {})}
            for t in sorted(teachers, key=lambda x: -teacher_load.get(x.id, 0))
        ],
        "gaps": sorted(gaps.items(), key=lambda kv: -kv[1]["gaps"]),
        "sections": [
            {"name": s.name, "semester": s.semester.number, "filled": section_fill.get(s.id, 0),
             "fill_pct": round(section_fill.get(s.id, 0) / total_slots * 100)}
            for s in sections
        ],
    }


# =============================== views =================================

@router.get("/views/master")
def master_view(day: int, department_id: int | None = None, db: Session = Depends(get_db)):
    """For one day: every section's periods side by side."""
    q = (
        db.query(TimetableEntry)
        .join(Timetable, TimetableEntry.timetable_id == Timetable.id)
        .filter(TimetableEntry.day_of_week == day)
    )
    if department_id is not None:
        q = q.filter(Timetable.department_id == department_id)
    entries = q.all()
    sections = db.query(Section).order_by(Section.department_id, Section.semester_id, Section.name).all()
    grid = {}
    for e in entries:
        grid.setdefault(e.timetable.section_id, {})[e.period] = {
            "code": e.subject.code,
            "teacher": e.teacher.name,
            "room": e.room.name,
            "elective": e.elective_group_id is not None,
        }
    return {
        "day": day,
        "day_name": DAYS[day],
        "sections": [
            {"id": s.id, "name": s.name, "semester": s.semester.number,
             "dept": s.semester.department_id, "periods": grid.get(s.id, {})}
            for s in sections
        ],
    }


@router.get("/views/room/{room_id}")
def room_view(room_id: int, db: Session = Depends(get_db)):
    room = db.get(Room, room_id)
    if room is None:
        raise HTTPException(404, "Room not found")
    entries = db.query(TimetableEntry).filter(TimetableEntry.room_id == room_id).all()
    return {
        "room": {"id": room.id, "name": room.name, "room_type": room.room_type, "capacity": room.capacity},
        "entries": [
            {"day_of_week": e.day_of_week, "period": e.period,
             "subject_code": e.subject.code, "teacher_name": e.teacher.name,
             "section_name": e.timetable.section.name}
            for e in sorted(entries, key=lambda x: (x.day_of_week, x.period))
        ],
    }


# ============================ feedback =================================

class FeedbackIn(BaseModel):
    department_code: str = ""
    semester_number: int | None = None
    section_name: str = ""
    reporter_name: str = Field(default="Student", max_length=120)
    category: str = Field(default="other", pattern="^(wrong_room|wrong_teacher|absent_teacher|other)$")
    message: str = Field(min_length=3, max_length=1000)


@router.get("/feedback")
def list_feedback(status: str | None = None, db: Session = Depends(get_db)):
    q = db.query(FeedbackReport).order_by(FeedbackReport.created_at.desc())
    if status:
        q = q.filter(FeedbackReport.status == status)
    return [
        {
            "id": f.id, "department_code": f.department_code, "semester_number": f.semester_number,
            "section_name": f.section_name, "reporter_name": f.reporter_name, "category": f.category,
            "message": f.message, "status": f.status, "admin_note": f.admin_note, "created_at": f.created_at,
        }
        for f in q.limit(200).all()
    ]


@router.post("/feedback/{fid}/resolve")
def resolve_feedback(fid: int, note: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    f = db.get(FeedbackReport, fid)
    if f is None:
        raise HTTPException(404, "Report not found")
    f.status = "resolved"
    f.admin_note = note[:255]
    db.commit()
    log_action(db, user.email, "updated", "feedback", f"Resolved feedback #{fid} ({f.category})")
    return {"ok": True}


@router.post("/feedback/{fid}/dismiss")
def dismiss_feedback(fid: int, note: str = "", db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    f = db.get(FeedbackReport, fid)
    if f is None:
        raise HTTPException(404, "Report not found")
    f.status = "dismissed"
    f.admin_note = note[:255]
    db.commit()
    log_action(db, user.email, "updated", "feedback", f"Dismissed feedback #{fid} ({f.category})")
    return {"ok": True}


# =============================== import ================================

def _safe_positive_int(value, default: int, label: str, errors: list) -> int | None:
    """Parse a positive integer from an imported cell; log instead of raising."""
    try:
        parsed = int(value) if value not in (None, "") else default
        if parsed < 1:
            raise ValueError
        return parsed
    except (TypeError, ValueError):
        errors.append(f"{label}: must be a positive number (got '{value}')")
        return None


class ImportPayload(BaseModel):
    department_id: int
    semester_id: int
    teachers: list[dict] = []
    subjects: list[dict] = []


@router.post("/import")
def import_data(payload: ImportPayload, db: Session = Depends(get_db), user: User = Depends(require_staff)):
    created_t, created_s, errors = 0, 0, []
    for row in payload.teachers:
        name = (row.get("name") or "").strip()
        if not name:
            continue
        max_load = _safe_positive_int(row.get("max_weekly_load"), 24, f"teacher '{name}': max_weekly_load", errors)
        if max_load is None:
            continue
        db.add(Teacher(
            name=name,
            email=(row.get("email") or "").strip(),
            employee_code=(row.get("employee_code") or "").strip(),
            designation=(row.get("designation") or "").strip(),
            max_weekly_load=max_load,
            department_id=payload.department_id,
        ))
        created_t += 1

    for row in payload.subjects:
        code = (row.get("code") or "").strip().upper()
        name = (row.get("name") or "").strip()
        if not code or not name:
            continue
        if db.query(Subject).filter(Subject.department_id == payload.department_id, Subject.code == code).first():
            errors.append(f"subject '{code}': code already exists in this department")
            continue
        hours = _safe_positive_int(row.get("hours_per_week"), 3, f"subject '{code}': hours_per_week", errors)
        if hours is None:
            continue
        db.add(Subject(
            code=code, name=name,
            department_id=payload.department_id,
            semester_id=payload.semester_id,
            hours_per_week=hours,
            requires_lab=str(row.get("requires_lab", "")).lower() in ("1", "true", "yes", "lab"),
        ))
        created_s += 1

    db.commit()
    log_action(
        db, user.email, "created", "import",
        f"Imported {created_t} teacher(s) and {created_s} subject(s)"
        + (f", {len(errors)} skipped" if errors else ""),
    )
    return {"teachers_created": created_t, "subjects_created": created_s, "errors": errors[:20]}


# ============================ teacher portal ============================

@teacher_router.get("/me")
def teacher_me(db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    t = db.get(Teacher, user.teacher_id)
    if t is None:
        raise HTTPException(404, "Linked teacher record not found")
    return {
        "user": {"name": user.name, "email": user.email},
        "teacher": {"id": t.id, "name": t.name, "designation": t.designation,
                    "department_id": t.department_id, "max_weekly_load": t.max_weekly_load},
    }


@teacher_router.get("/me/schedule")
def teacher_me_schedule(db: Session = Depends(get_db), user: User = Depends(require_teacher)):
    """The teacher's personal weekly schedule across all sections."""
    rows = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.teacher_id == user.teacher_id)
        .order_by(TimetableEntry.day_of_week, TimetableEntry.period)
        .all()
    )
    from app.services.conflicts import teacher_workload
    me = db.get(Teacher, user.teacher_id)
    return {
        "assigned_periods": teacher_workload(db, user.teacher_id),
        "max_weekly_load": me.max_weekly_load,
        "entries": [
            {
                "day_of_week": e.day_of_week, "period": e.period,
                "subject_code": e.subject.code, "subject_name": e.subject.name,
                "is_lab": e.subject.requires_lab,
                "section_name": e.timetable.section.name,
                "semester_number": e.timetable.semester.number,
                "room_name": e.room.name,
                "status": e.timetable.status,
            }
            for e in rows
        ],
    }


# ============================ AI assistant =============================

class AskIn(BaseModel):
    message: str = Field(min_length=1, max_length=300)


@router.post("/assistant/ask")
def assistant_ask(payload: AskIn, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    from app.services.assistant import answer

    return {"reply": answer(db, payload.message)}


@router.get("/settings/mail")
def mail_status():
    from app.core.config import get_settings

    s = get_settings()
    return {"enabled": bool(s.SMTP_HOST), "host": s.SMTP_HOST or "(not configured)", "from": s.EMAIL_FROM}
