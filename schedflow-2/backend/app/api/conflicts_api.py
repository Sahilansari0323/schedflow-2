from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import require_staff, get_current_user
from app.core.database import get_db
from app.models import DAYS, Room, Teacher, TimetableEntry, User
from app.schemas import ConflictOut
from app.services.audit import log_action
from app.services.conflicts import find_conflicts
from app.services.scan import scan_all, suggest_resolutions

router = APIRouter(prefix="/api/conflicts", tags=["conflicts"], dependencies=[Depends(require_staff)])


@router.get("/scan")
def run_scan(db: Session = Depends(get_db)):
    """Full system scan: every conflict across all timetables, with ranked fix suggestions."""
    conflicts = scan_all(db)
    for c in conflicts:
        c["suggestions"] = suggest_resolutions(db, c)
    summary = {
        "total": len(conflicts),
        "high": sum(1 for c in conflicts if c["severity"] == "high"),
        "medium": sum(1 for c in conflicts if c["severity"] == "medium"),
        "low": sum(1 for c in conflicts if c["severity"] == "low"),
        "by_type": {},
    }
    for c in conflicts:
        summary["by_type"][c["type"]] = summary["by_type"].get(c["type"], 0) + 1
    return {"summary": summary, "conflicts": conflicts}


class ApplyFix(BaseModel):
    entry_id: int
    action: str = Field(pattern="^(move_slot|change_room|change_teacher)$")
    to_day: int | None = Field(default=None, ge=1, le=6)
    to_period: int | None = Field(default=None, ge=1, le=8)
    room_id: int | None = None
    teacher_id: int | None = None


@router.post("/apply")
def apply_fix(payload: ApplyFix, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """Apply a resolver suggestion: move a class to another slot, or swap its room/teacher."""
    entry = db.get(TimetableEntry, payload.entry_id)
    if entry is None:
        raise HTTPException(404, "Entry not found")

    day, period = entry.day_of_week, entry.period
    room_id, teacher_id = entry.room_id, entry.teacher_id
    moved = ""

    if payload.action == "move_slot":
        if payload.to_day is None or payload.to_period is None:
            raise HTTPException(400, "Target day and period are required.")
        taken = (
            db.query(TimetableEntry)
            .filter(
                TimetableEntry.timetable_id == entry.timetable_id,
                TimetableEntry.day_of_week == payload.to_day,
                TimetableEntry.period == payload.to_period,
                TimetableEntry.id != entry.id,
            )
            .first()
        )
        if taken is not None:
            raise HTTPException(
                409,
                f"Timetable #{entry.timetable_id} already has a class on {DAYS[payload.to_day]} P{payload.to_period}.",
            )
        day, period = payload.to_day, payload.to_period
        moved = f"moved to {DAYS[day]} P{period}"
    elif payload.action == "change_room":
        if payload.room_id is None:
            raise HTTPException(400, "Target room is required.")
        if db.get(Room, payload.room_id) is None:
            raise HTTPException(404, "Room not found")
        room_id = payload.room_id
        moved = f"moved to room {db.get(Room, room_id).name}"
    elif payload.action == "change_teacher":
        if payload.teacher_id is None:
            raise HTTPException(400, "Target teacher is required.")
        if db.get(Teacher, payload.teacher_id) is None:
            raise HTTPException(404, "Teacher not found")
        teacher_id = payload.teacher_id
        moved = f"reassigned to {db.get(Teacher, teacher_id).name}"

    conflicts = find_conflicts(
        db, entry.timetable, day, period, entry.subject_id, teacher_id, room_id, exclude_entry_id=entry.id
    )
    entry.day_of_week, entry.period = day, period
    entry.room_id, entry.teacher_id = room_id, teacher_id
    db.commit()
    log_action(
        db, user.email, "resolved", "conflict",
        f"AI resolver: {entry.subject.code} {moved} (timetable #{entry.timetable_id})"
        + (f" — {len(conflicts)} conflicts remain on this slot" if conflicts else " — slot now clean"),
    )
    return {
        "ok": True,
        "remaining_conflicts": [ConflictOut(**c).model_dump() for c in conflicts],
    }
