from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import require_staff, get_current_user
from app.core.database import get_db
from app.models import DAYS, Section, Semester, Subject, Timetable, TimetableEntry, User
from app.schemas import (
    ConflictOut,
    SaveEntryResponse,
    TimetableCreate,
    TimetableEntryCreate,
    TimetableEntryOut,
    TimetableOut,
)
from app.services.audit import log_action
from app.services.conflicts import find_conflicts, validate_timetable
from app.services.generator import generate_draft

router = APIRouter(prefix="/api/timetables", tags=["timetables"], dependencies=[Depends(require_staff)])


def _get_timetable(db: Session, timetable_id: int) -> Timetable:
    tt = db.get(Timetable, timetable_id)
    if tt is None:
        raise HTTPException(404, "Timetable not found")
    return tt


def _slot_label(entry: TimetableEntry) -> str:
    return f"{DAYS[entry.day_of_week]} P{entry.period}"


@router.get("", response_model=list[TimetableOut])
def list_timetables(db: Session = Depends(get_db), department_id: int | None = None):
    q = db.query(Timetable).order_by(Timetable.updated_at.desc())
    if department_id is not None:
        q = q.filter(Timetable.department_id == department_id)
    return q.all()


def _slot_taken(db: Session, timetable_id: int, day: int, period: int, exclude_entry_id=None):
    """Core/exclusive slot occupancy: any existing entry at the slot blocks a new
    core class; elective-group entries only block other core classes (elective
    options may share the slot)."""
    q = db.query(TimetableEntry).filter(
        TimetableEntry.timetable_id == timetable_id,
        TimetableEntry.day_of_week == day,
        TimetableEntry.period == period,
    )
    if exclude_entry_id is not None:
        q = q.filter(TimetableEntry.id != exclude_entry_id)
    return q.all()


@router.post("", response_model=TimetableOut, status_code=201)
def create_timetable(
    payload: TimetableCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    section = db.get(Section, payload.section_id)
    if section is None:
        raise HTTPException(404, "Section not found")
    timetable = Timetable(**payload.model_dump())
    db.add(timetable)
    db.commit()
    db.refresh(timetable)
    log_action(db, user.email, "created", "timetable", f"Created timetable #{timetable.id} for section {section.name}")
    return timetable


@router.get("/{timetable_id}", response_model=TimetableOut)
def get_timetable(timetable_id: int, db: Session = Depends(get_db)):
    return _get_timetable(db, timetable_id)


@router.delete("/{timetable_id}", status_code=204)
def delete_timetable(
    timetable_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tt = _get_timetable(db, timetable_id)
    db.delete(tt)
    db.commit()
    log_action(db, user.email, "deleted", "timetable", f"Deleted timetable #{timetable_id} with all its entries")


@router.get("/{timetable_id}/entries", response_model=list[TimetableEntryOut])
def list_entries(timetable_id: int, db: Session = Depends(get_db)):
    _get_timetable(db, timetable_id)
    return (
        db.query(TimetableEntry)
        .filter(TimetableEntry.timetable_id == timetable_id)
        .order_by(TimetableEntry.day_of_week, TimetableEntry.period)
        .all()
    )


@router.post("/{timetable_id}/entries", response_model=SaveEntryResponse, status_code=201)
def create_entry(
    timetable_id: int,
    payload: TimetableEntryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tt = _get_timetable(db, timetable_id)
    subject = db.get(Subject, payload.subject_id)
    if subject is None:
        raise HTTPException(404, "Subject not found")
    existing = _slot_taken(db, timetable_id, payload.day_of_week, payload.period)
    is_elective = subject.elective_group_id is not None
    same_group = is_elective and any(e.elective_group_id == subject.elective_group_id for e in existing)
    if existing and not same_group:
        raise HTTPException(409, f"Slot {DAYS[payload.day_of_week]} P{payload.period} is already filled.")
    conflicts = find_conflicts(
        db, tt, payload.day_of_week, payload.period, payload.subject_id, payload.teacher_id, payload.room_id
    )
    entry = TimetableEntry(
        timetable_id=timetable_id,
        elective_group_id=subject.elective_group_id,
        **payload.model_dump(),
    )
    db.add(entry)
    db.commit()
    db.refresh(entry)
    log_action(
        db, user.email, "created", "class",
        f"Scheduled {entry.subject.code} with {entry.teacher.name} in {entry.room.name} "
        f"({DAYS[entry.day_of_week]} P{entry.period}, timetable #{timetable_id})"
        + (" [elective]" if is_elective else ""),
    )
    return SaveEntryResponse(entry=entry, conflicts=[ConflictOut(**c) for c in conflicts])


@router.put("/{timetable_id}/entries/{entry_id}", response_model=SaveEntryResponse)
def update_entry(
    timetable_id: int,
    entry_id: int,
    payload: TimetableEntryCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tt = _get_timetable(db, timetable_id)
    entry = db.get(TimetableEntry, entry_id)
    if entry is None or entry.timetable_id != timetable_id:
        raise HTTPException(404, "Entry not found")
    subject = db.get(Subject, payload.subject_id)
    if subject is None:
        raise HTTPException(404, "Subject not found")
    existing = _slot_taken(db, timetable_id, payload.day_of_week, payload.period, exclude_entry_id=entry_id)
    is_elective = subject.elective_group_id is not None
    same_group = is_elective and any(e.elective_group_id == subject.elective_group_id for e in existing)
    if existing and not same_group:
        raise HTTPException(409, f"Slot {DAYS[payload.day_of_week]} P{payload.period} is already filled.")
    conflicts = find_conflicts(
        db,
        tt,
        payload.day_of_week,
        payload.period,
        payload.subject_id,
        payload.teacher_id,
        payload.room_id,
        exclude_entry_id=entry_id,
    )
    for field, value in payload.model_dump().items():
        setattr(entry, field, value)
    entry.elective_group_id = subject.elective_group_id
    db.commit()
    db.refresh(entry)
    log_action(
        db, user.email, "updated", "class",
        f"Edited {_slot_label(entry)} → {entry.subject.code} / {entry.teacher.name} / {entry.room.name} "
        f"(timetable #{timetable_id})",
    )
    return SaveEntryResponse(entry=entry, conflicts=[ConflictOut(**c) for c in conflicts])


@router.delete("/{timetable_id}/entries/{entry_id}", status_code=204)
def delete_entry(
    timetable_id: int,
    entry_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    _get_timetable(db, timetable_id)
    entry = db.get(TimetableEntry, entry_id)
    if entry is None or entry.timetable_id != timetable_id:
        raise HTTPException(404, "Entry not found")
    label = f"{_slot_label(entry)} ({entry.subject.code}, timetable #{timetable_id})"
    db.delete(entry)
    db.commit()
    log_action(db, user.email, "deleted", "class", f"Cleared {label}")


@router.get("/{timetable_id}/validate", response_model=list[ConflictOut])
def validate(timetable_id: int, db: Session = Depends(get_db)):
    _get_timetable(db, timetable_id)
    return [ConflictOut(**c) for c in validate_timetable(db, timetable_id)]


@router.post("/{timetable_id}/generate")
def generate(timetable_id: int, db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    """AI generator: auto-draft core classes for this timetable from subjects + hours."""
    tt = _get_timetable(db, timetable_id)
    result = generate_draft(db, tt)
    log_action(
        db, user.email, "updated", "timetable",
        f"AI generator drafted {result['placed']} classes for timetable #{timetable_id}"
        + (f", {len(result['unplaced'])} subject-hours unplaced" if result["unplaced"] else " — fully placed"),
    )
    return result


@router.post("/{timetable_id}/publish", response_model=TimetableOut)
def publish(
    timetable_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    tt = _get_timetable(db, timetable_id)
    entries = db.query(TimetableEntry).filter(TimetableEntry.timetable_id == timetable_id).count()
    if entries == 0:
        raise HTTPException(400, "Cannot publish an empty timetable.")
    conflicts = validate_timetable(db, timetable_id)
    if conflicts:
        raise HTTPException(
            409,
            detail={"message": "Timetable has conflicts and cannot be published.", "conflicts": conflicts},
        )
    tt.status = "published"
    tt.published_at = datetime.now(timezone.utc).replace(tzinfo=None)
    tt.version += 1
    db.commit()
    db.refresh(tt)
    log_action(
        db, user.email, "published", "timetable",
        f"Published timetable #{timetable_id} as version {tt.version} — now visible to students",
    )
    return tt
