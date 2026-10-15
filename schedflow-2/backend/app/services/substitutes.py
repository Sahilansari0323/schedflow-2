"""AI substitute selection for faculty absences.

For every class the absent teacher would take during the leave window, the
engine picks the best replacement using a scored heuristic:
  - must be in the same department, active, and not the absent teacher
  - must be free at that slot across ALL timetables
  - must not be marked unavailable at that slot
  - must stay under the weekly workload cap
  - ranked by: already teaches the same subject (+30), most spare load
"""

from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import DAYS, Substitution, SubstitutionAssignment, Teacher, TimetableEntry


def _weekday_set(start, end) -> set[int]:
    days = set()
    d = start
    while d <= end:
        days.add(d.weekday() + 1)  # model convention: 1=Mon .. 6=Sat
        d += timedelta(days=1)
    return days


def assign_substitutes(db: Session, substitution) -> list[dict]:
    """Apply the best substitute to every affected class. Returns per-class results."""
    absent_id = substitution.teacher_id
    weekdays = _weekday_set(substitution.start_date, substitution.end_date)

    entries = (
        db.query(TimetableEntry)
        .filter(TimetableEntry.teacher_id == absent_id, TimetableEntry.day_of_week.in_(weekdays))
        .order_by(TimetableEntry.day_of_week, TimetableEntry.period)
        .all()
    )

    # live occupancy + load
    teacher_busy: dict = defaultdict(set)  # (day, period) -> {teacher_id}
    loads: dict = defaultdict(int)
    subject_teachers: dict = defaultdict(set)  # subject_id -> {teacher_id}
    for e in db.query(TimetableEntry).all():
        teacher_busy[(e.day_of_week, e.period)].add(e.teacher_id)
        loads[e.teacher_id] += 1
        subject_teachers[e.subject_id].add(e.teacher_id)

    absent = db.get(Teacher, absent_id)
    results = []

    for e in entries:
        candidates = (
            db.query(Teacher)
            .filter(
                Teacher.department_id == absent.department_id,
                Teacher.is_active == True,  # noqa: E712
                Teacher.id != absent_id,
            )
            .all()
        )
        best = None
        best_score = -1
        for t in candidates:
            if t.id in teacher_busy.get((e.day_of_week, e.period), set()):
                continue
            if f"{e.day_of_week}-{e.period}" in (t.unavailable_slots or []):
                continue
            if loads.get(t.id, 0) >= t.max_weekly_load:
                continue
            score = min(t.max_weekly_load - loads.get(t.id, 0), 20)
            if t.id in subject_teachers.get(e.subject_id, set()):
                score += 30  # already teaches this subject
            if score > best_score:
                best, best_score = t, score

        slot = f"{DAYS[e.day_of_week]} P{e.period}"
        if best is None:
            results.append({
                "entry_id": e.id,
                "day": e.day_of_week,
                "period": e.period,
                "slot": slot,
                "subject_code": e.subject.code,
                "section_name": e.timetable.section.name,
                "room_name": e.room.name,
                "status": "unresolved",
                "substitute": None,
                "reason": "No teacher is free, eligible and under the load cap at this slot.",
            })
            continue

        db.add(SubstitutionAssignment(
            substitution_id=substitution.id,
            entry_id=e.id,
            original_teacher_id=absent_id,
            substitute_teacher_id=best.id,
            day_of_week=e.day_of_week,
            period=e.period,
        ))
        e.teacher_id = best.id
        loads[best.id] += 1
        teacher_busy[(e.day_of_week, e.period)].add(best.id)
        results.append({
            "entry_id": e.id,
            "day": e.day_of_week,
            "period": e.period,
            "slot": slot,
            "subject_code": e.subject.code,
            "subject_name": e.subject.name,
            "section_name": e.timetable.section.name,
            "room_name": e.room.name,
            "status": "assigned",
            "substitute": {"id": best.id, "name": best.name},
        })

    db.commit()
    return results


def auto_revert_expired(db: Session) -> int:
    """Restore originals for any active substitution whose leave window has
    passed. Makes the timetable mutation genuinely temporary: the entries are
    rewritten only while the leave is current, and automatically reverted the
    next time substitutions are touched after the window ends."""
    today = date.today()
    expired = (
        db.query(Substitution)
        .filter(Substitution.status == "active", Substitution.end_date < today)
        .all()
    )
    for s in expired:
        revert(db, s)
    return len(expired)


def revert(db: Session, substitution) -> None:
    """Restore the original teacher on every assignment of this substitution."""
    for a in substitution.assignments:
        entry = db.get(TimetableEntry, a.entry_id)
        if entry is not None and entry.teacher_id == a.substitute_teacher_id:
            entry.teacher_id = a.original_teacher_id
    substitution.status = "reverted"
    db.commit()
