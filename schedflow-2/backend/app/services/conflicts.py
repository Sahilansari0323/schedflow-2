"""Conflict detection for timetable entries.

Checks are performed across all timetables so a draft being edited is
validated against published schedules and other drafts alike.
"""

from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from app.models import DAYS, PERIODS_PER_DAY, Room, Subject, Teacher, Timetable, TimetableEntry


def _day_period(day: int, period: int) -> str:
    return f"{day}-{period}"


def find_conflicts(
    db: Session,
    timetable: Timetable,
    day: int,
    period: int,
    subject_id: int,
    teacher_id: int,
    room_id: int,
    exclude_entry_id: int | None = None,
) -> list[dict]:
    """Return a list of conflict dicts for a would-be entry in `timetable`."""
    conflicts: list[dict] = []

    subject = db.get(Subject, subject_id)
    teacher = db.get(Teacher, teacher_id)
    room = db.get(Room, room_id)
    if subject is None or teacher is None or room is None:
        conflicts.append({"type": "invalid", "message": "Subject, teacher or room does not exist."})
        return conflicts

    base = (
        db.query(TimetableEntry, Timetable)
        .join(Timetable, TimetableEntry.timetable_id == Timetable.id)
        .filter(
            TimetableEntry.day_of_week == day,
            TimetableEntry.period == period,
        )
    )
    if exclude_entry_id is not None:
        base = base.filter(TimetableEntry.id != exclude_entry_id)

    # Same teacher cannot teach two classes in the same slot.
    teacher_clash = base.filter(TimetableEntry.teacher_id == teacher_id).first()
    if teacher_clash is not None:
        entry, tt = teacher_clash
        conflicts.append(
            {
                "type": "teacher",
                "message": f"{teacher.name} is already teaching {entry.subject.code} "
                f"in section '{tt.section.name}' on {DAYS[day]} period {period}.",
            }
        )

    # Same room cannot host two classes in the same slot.
    room_clash = base.filter(TimetableEntry.room_id == room_id).first()
    if room_clash is not None:
        entry, tt = room_clash
        conflicts.append(
            {
                "type": "room",
                "message": f"Room {room.name} is already occupied by {entry.subject.code} "
                f"(section '{tt.section.name}') on {DAYS[day]} period {period}.",
            }
        )

    # A section cannot attend two core classes in the same slot. Elective
    # subjects may share a slot with other electives (students pick one
    # option), but an elective still clashes with a remaining CORE class, and
    # the check spans every timetable of the section - including this one -
    # so validation also catches races that bypass the slot guards.
    q = (
        db.query(TimetableEntry)
        .join(Timetable, TimetableEntry.timetable_id == Timetable.id)
        .filter(
            Timetable.section_id == timetable.section_id,
            TimetableEntry.day_of_week == day,
            TimetableEntry.period == period,
        )
    )
    if exclude_entry_id is not None:
        q = q.filter(TimetableEntry.id != exclude_entry_id)
    if subject.elective_group_id is None:
        # core class: clashes with anything the section attends at this slot
        own_section_clash = q.first()
    else:
        # elective: only a remaining core class is a clash
        own_section_clash = q.filter(TimetableEntry.elective_group_id.is_(None)).first()
    if own_section_clash is not None:
            conflicts.append(
                {
                    "type": "section",
                    "message": f"Section '{timetable.section.name}' already has a class "
                    f"({own_section_clash.subject.code}) on {DAYS[day]} period {period}.",
                }
            )

    # Teacher availability.
    if _day_period(day, period) in (teacher.unavailable_slots or []):
        conflicts.append(
            {
                "type": "availability",
                "message": f"{teacher.name} is marked unavailable on {DAYS[day]} period {period}.",
            }
        )

    # Lab requirement vs room type.
    if subject.requires_lab and room.room_type != "lab":
        conflicts.append(
            {
                "type": "lab",
                "message": f"Subject {subject.code} requires a lab but room {room.name} is a classroom.",
            }
        )

    # Teacher weekly workload cap (count excluding the entry being replaced).
    q = db.query(func.count(TimetableEntry.id)).filter(TimetableEntry.teacher_id == teacher_id)
    if exclude_entry_id is not None:
        q = q.filter(TimetableEntry.id != exclude_entry_id)
    assigned = q.scalar() or 0
    if assigned >= teacher.max_weekly_load:
        conflicts.append(
            {
                "type": "workload",
                "message": f"{teacher.name} is at the weekly load cap ({assigned}/{teacher.max_weekly_load} periods).",
            }
        )

    return conflicts


def validate_timetable(db: Session, timetable_id: int) -> list[dict]:
    """Re-validate every entry of a timetable; used before publishing."""
    conflicts: list[dict] = []
    entries = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.timetable_id == timetable_id)
        .order_by(TimetableEntry.day_of_week, TimetableEntry.period)
        .all()
    )
    seen_pairs: set[tuple] = set()
    for e in entries:
        found = find_conflicts(db, e.timetable, e.day_of_week, e.period, e.subject_id, e.teacher_id, e.room_id, exclude_entry_id=e.id)
        # find_conflicts excludes this entry's own id, so clashes from other
        # timetables are reported; duplicates from iterating entries are trimmed.
        for c in found:
            key = (c["type"], c["message"])
            if key not in seen_pairs:
                seen_pairs.add(key)
                conflicts.append(c)
    return conflicts


def teacher_workload(db: Session, teacher_id: int) -> int:
    return (
        db.query(func.count(TimetableEntry.id))
        .filter(TimetableEntry.teacher_id == teacher_id)
        .scalar()
        or 0
    )
