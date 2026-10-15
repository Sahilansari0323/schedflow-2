"""System-wide conflict scan + resolution suggestion engine.

The scan reuses the same rules as the builder's live validation but works
globally: teacher, room and section double-bookings across every timetable,
availability violations, lab mismatches, and workload overruns. The resolver
generates ranked, concrete fix options (move slot / change room / reassign
teacher) using a heuristic score: keep the same day, keep lab requirements
satisfied, prefer teachers with the most spare load.
"""

from collections import defaultdict

from sqlalchemy import func
from sqlalchemy.orm import Session

from app.models import DAYS, PERIODS_PER_DAY, Room, Section, Subject, Teacher, TimetableEntry

ALL_SLOTS = [(d, p) for d in range(1, len(DAYS) + 1) for p in range(1, PERIODS_PER_DAY + 1)]


def _detail(e: TimetableEntry) -> dict:
    return {
        "entry_id": e.id,
        "timetable_id": e.timetable_id,
        "day": e.day_of_week,
        "period": e.period,
        "subject_code": e.subject.code,
        "subject_name": e.subject.name,
        "teacher_id": e.teacher_id,
        "teacher_name": e.teacher.name,
        "room_id": e.room_id,
        "room_name": e.room.name,
        "section_name": e.timetable.section.name,
        "status": e.timetable.status,
    }


def _slot_text(day: int, period: int) -> str:
    return f"{DAYS[day]} P{period}"


def scan_all(db: Session) -> list[dict]:
    entries = db.query(TimetableEntry).all()
    conflicts: list[dict] = []
    counter = [0]

    def add(ctype, severity, message, ents, **extra):
        c = {"id": f"cf{counter[0]}", "type": ctype, "severity": severity, "message": message, "entries": ents}
        c.update(extra)
        conflicts.append(c)
        counter[0] += 1

    by_teacher: dict = defaultdict(list)
    by_room: dict = defaultdict(list)
    by_section: dict = defaultdict(list)
    for e in entries:
        key = (e.day_of_week, e.period)
        by_teacher[(key, e.teacher_id)].append(e)
        by_room[(key, e.room_id)].append(e)
        by_section[(key, e.timetable.section_id)].append(e)

    for (_, tid), group in by_teacher.items():
        if len(group) > 1:
            add(
                "teacher", "high",
                f"{group[0].teacher.name} is booked in {len(group)} places at "
                f"{_slot_text(group[0].day_of_week, group[0].period)}",
                [_detail(e) for e in group],
                teacher_name=group[0].teacher.name,
            )

    for (_, rid), group in by_room.items():
        if len(group) > 1:
            add(
                "room", "high",
                f"Room {group[0].room.name} is double-booked at "
                f"{_slot_text(group[0].day_of_week, group[0].period)}",
                [_detail(e) for e in group],
                room_name=group[0].room.name,
            )

    for (_, sid), group in by_section.items():
        # Elective options may legitimately share a slot; a section clash
        # exists only when a core (non-elective) class overlaps anything else.
        if len(group) > 1 and any(e.elective_group_id is None for e in group):
            add(
                "section", "high",
                f"Section {group[0].timetable.section.name} has {len(group)} classes at "
                f"{_slot_text(group[0].day_of_week, group[0].period)} across its timetables",
                [_detail(e) for e in group],
            )

    for e in entries:
        if f"{e.day_of_week}-{e.period}" in (e.teacher.unavailable_slots or []):
            add(
                "availability", "medium",
                f"{e.teacher.name} teaches {e.subject.code} at {_slot_text(e.day_of_week, e.period)} "
                f"but is marked unavailable then",
                [_detail(e)],
                teacher_name=e.teacher.name,
            )
        if e.subject.requires_lab and e.room.room_type != "lab":
            add(
                "lab", "medium",
                f"{e.subject.code} needs a lab but is placed in classroom {e.room.name} "
                f"at {_slot_text(e.day_of_week, e.period)}",
                [_detail(e)],
            )

    load: dict = defaultdict(int)
    teachers: dict = {}
    for e in entries:
        load[e.teacher_id] += 1
        teachers[e.teacher_id] = e.teacher
    for tid, count in load.items():
        t = teachers[tid]
        if count > t.max_weekly_load:
            theirs = [_detail(e) for e in entries if e.teacher_id == tid][:6]
            add(
                "workload", "low",
                f"{t.name} carries {count} periods, over the weekly cap of {t.max_weekly_load}",
                theirs,
                teacher_name=t.name,
                over_by=count - t.max_weekly_load,
            )

    order = {"high": 0, "medium": 1, "low": 2}
    conflicts.sort(key=lambda c: order[c["severity"]])
    return conflicts


# ------------------------------- resolver ---------------------------------

def _occupancy(db: Session):
    teacher_busy: dict = defaultdict(set)   # (day,period) -> {teacher_id}
    room_busy: dict = defaultdict(set)
    section_busy: dict = defaultdict(set)
    timetable_slot: set = set()             # {(timetable_id, day, period)}
    for e in db.query(TimetableEntry).all():
        k = (e.day_of_week, e.period)
        teacher_busy[k].add(e.teacher_id)
        room_busy[k].add(e.room_id)
        section_busy[k].add(e.timetable.section_id)
        timetable_slot.add((e.timetable_id, e.day_of_week, e.period))
    return teacher_busy, room_busy, section_busy, timetable_slot


def _room_options(db: Session, e: TimetableEntry, busy_rooms: set) -> list[dict]:
    rooms = (
        db.query(Room)
        .filter(Room.department_id == e.subject.department_id)
        .all()
    )
    strength = e.timetable.section.strength
    options = []
    for r in rooms:
        if r.id == e.room_id or r.id in busy_rooms:
            continue
        if e.subject.requires_lab and r.room_type != "lab":
            continue
        score = 50
        if (r.room_type == "lab") == bool(e.subject.requires_lab):
            score += 20
        if r.capacity >= strength:
            score += 15
        score += min(r.capacity, strength) // 10
        options.append({
            "action": "change_room",
            "entry_id": e.id,
            "room_id": r.id,
            "label": f"Move to {r.name}",
            "detail": f"{r.room_type} · capacity {r.capacity} · free at {_slot_text(e.day_of_week, e.period)}",
            "score": score,
        })
    options.sort(key=lambda o: -o["score"])
    return options


def _teacher_options(db: Session, e: TimetableEntry, busy: set, loads: dict, exclude_id: int) -> list[dict]:
    key = (e.day_of_week, e.period)
    teachers = db.query(Teacher).filter(
        Teacher.department_id == e.subject.department_id,
        Teacher.is_active == True,  # noqa: E712
    ).all()
    options = []
    for t in teachers:
        if t.id == exclude_id or t.id in busy.get(key, set()):
            continue
        if f"{e.day_of_week}-{e.period}" in (t.unavailable_slots or []):
            continue
        if loads.get(t.id, 0) >= t.max_weekly_load:
            continue
        spare = t.max_weekly_load - loads.get(t.id, 0)
        options.append({
            "action": "change_teacher",
            "entry_id": e.id,
            "teacher_id": t.id,
            "label": f"Reassign to {t.name}",
            "detail": f"free at {_slot_text(e.day_of_week, e.period)} · {spare} spare periods this week",
            "score": 40 + min(spare, 20),
        })
    options.sort(key=lambda o: -o["score"])
    return options


def _slot_options(db: Session, e: TimetableEntry, occ, limit: int = 4) -> list[dict]:
    teacher_busy, room_busy, section_busy, timetable_slot = occ
    loads = dict(
        db.query(TimetableEntry.teacher_id, func.count(TimetableEntry.id))
        .group_by(TimetableEntry.teacher_id)
        .all()
    )
    options = []
    day, period = e.day_of_week, e.period

    def rank(slot):
        d, p = slot
        if d == day:
            return abs(p - period)          # same day, nearest period
        return 100 + abs(d - day) * 10 + abs(p - period)

    for (d, p) in sorted(ALL_SLOTS, key=rank):
        if (d, p) == (day, period):
            continue
        if (e.timetable_id, d, p) in timetable_slot:
            continue
        if e.teacher_id in teacher_busy.get((d, p), set()):
            continue
        if e.room_id in room_busy.get((d, p), set()):
            continue
        if section_busy.get((d, p), set()) and e.timetable.section_id in section_busy[(d, p)]:
            continue
        if f"{d}-{p}" in (e.teacher.unavailable_slots or []):
            continue
        if loads.get(e.teacher_id, 0) > e.teacher.max_weekly_load:
            pass  # moving doesn't change load; still allow
        options.append({
            "action": "move_slot",
            "entry_id": e.id,
            "to_day": d,
            "to_period": p,
            "label": f"Move to {DAYS[d]} P{p}",
            "detail": f"teacher, room and section all free · {'same day' if d == day else DAYS[d]}",
            "score": 60 - rank((d, p)) // 4,
        })
        if len(options) >= limit:
            break
    return options


def suggest_resolutions(db: Session, conflict: dict, max_options: int = 5) -> list[dict]:
    """Ranked fix options for one conflict.

    Only actions that actually eliminate the conflict type are offered:
    a teacher clash needs a slot move or teacher swap (not a room change),
    a room/lab conflict needs a slot move or room swap, and a section
    clash (two classes for the same students) can only be resolved by
    moving one of them to a free slot.
    """
    allowed = {
        "teacher": {"move_slot", "change_teacher"},
        "availability": {"move_slot", "change_teacher"},
        "room": {"move_slot", "change_room"},
        "lab": {"move_slot", "change_room"},
        "section": {"move_slot"},
        "workload": {"change_teacher"},
    }.get(conflict["type"], {"move_slot"})

    occ = _occupancy(db)
    key = (conflict["entries"][0]["day"], conflict["entries"][0]["period"]) if conflict["entries"] else None
    busy_rooms = set()
    if key:
        busy_rooms = {
            e.room_id
            for e in db.query(TimetableEntry).filter(
                TimetableEntry.day_of_week == key[0], TimetableEntry.period == key[1]
            ).all()
        }
    loads = dict(
        db.query(TimetableEntry.teacher_id, func.count(TimetableEntry.id))
        .group_by(TimetableEntry.teacher_id)
        .all()
    )

    options: list[dict] = []
    if conflict["type"] in ("teacher", "room", "section", "availability", "lab"):
        # resolve around the last entry (the one most recently scheduled)
        e = db.get(TimetableEntry, conflict["entries"][-1]["entry_id"])
        if e is not None:
            if "move_slot" in allowed:
                options += _slot_options(db, e, occ, limit=3)
            if "change_room" in allowed:
                options += _room_options(db, e, busy_rooms)[:2]
            if "change_teacher" in allowed:
                options += _teacher_options(db, e, occ[0], loads, exclude_id=e.teacher_id)[:2]
    elif conflict["type"] == "workload":
        for ent in conflict["entries"][:3]:
            e = db.get(TimetableEntry, ent["entry_id"])
            if e is not None:
                options += _teacher_options(db, e, occ[0], loads, exclude_id=e.teacher_id)[:2]

    options.sort(key=lambda o: -o["score"])
    return options[:max_options]
