"""Constraint-based timetable generator (backtracking search with propagation).

Treats scheduling as a CSP:
  variables  — one instance per subject-hour (subject with hours_per_week=N
               contributes N instances)
  domain     — the 48 weekly slots
  hard constraints —
    * section exclusivity: one core class per slot per section
    * teacher: not busy elsewhere at the slot, slot not in their
      unavailability windows, weekly total stays under their cap
    * room: not double-booked, labs only for lab-requiring subjects
    * spread: a subject meets at most MAX_PER_DAY times on one day
  search     — MRV-style ordering (hardest subject first), least-constraining
               teacher/room choice, backtracking with a node budget so the
               API always answers quickly; the best partial schedule is kept
               if a complete one can't be found in budget.
"""

import random
from collections import defaultdict

from sqlalchemy.orm import Session

from app.models import DAYS, PERIODS_PER_DAY, Room, Subject, Teacher, Timetable, TimetableEntry

MAX_PER_DAY = 2          # a subject meets at most twice on one day
NODE_BUDGET = 20000      # backtracking steps before settling for best partial


class _State:
    def __init__(self, db: Session, timetable: Timetable, teachers: list[Teacher], rooms: list[Room]):
        self.teacher_busy: set = set()          # {(teacher_id, day, period)}
        self.room_busy: set = set()             # {(room_id, day, period)}
        self.section_slots: set = set()         # {(day, period)}
        self.loads: dict = {t.id: 0 for t in teachers}
        self.per_day: dict = defaultdict(int)   # {(subject_id, day) -> count}
        self.teachers = teachers
        self.rooms = rooms
        self.lab_rooms = [r for r in rooms if r.room_type == "lab"]
        self.class_rooms = [r for r in rooms if r.room_type != "lab"]
        self.unavail = {t.id: set(t.unavailable_slots or []) for t in teachers}

        # seed occupancy from every other timetable in the system
        for e in db.query(TimetableEntry).all():
            self.teacher_busy.add((e.teacher_id, e.day_of_week, e.period))
            self.room_busy.add((e.room_id, e.day_of_week, e.period))
            self.loads[e.teacher_id] = self.loads.get(e.teacher_id, 0) + 1
            if e.timetable.section_id == timetable.section_id:
                self.section_slots.add((e.day_of_week, e.period))


def generate_draft(db: Session, timetable: Timetable, seed: int | None = None) -> dict:
    rng = random.Random(seed)
    db.query(TimetableEntry).filter(TimetableEntry.timetable_id == timetable.id).delete()
    db.commit()

    subjects = (
        db.query(Subject)
        .filter(
            Subject.department_id == timetable.department_id,
            Subject.semester_id == timetable.semester_id,
            Subject.elective_group_id.is_(None),
        )
        .all()
    )
    teachers = (
        db.query(Teacher)
        .filter(Teacher.department_id == timetable.department_id, Teacher.is_active == True)  # noqa: E712
        .all()
    )
    rooms = db.query(Room).filter(Room.department_id == timetable.department_id).all()

    if not rooms:
        return {"placed": 0, "total": 0, "unplaced": ["No rooms registered for this department."], "solver": "no-rooms"}
    if not teachers:
        return {"placed": 0, "total": 0, "unplaced": ["No active teachers registered."], "solver": "no-teachers"}

    state = _State(db, timetable, teachers, rooms)

    # instances: hardest first (most weekly hours), tie-break random
    instances = []
    for s in subjects:
        instances.extend([s] * s.hours_per_week)
    total = len(instances)
    instances.sort(key=lambda s: (-s.hours_per_week, rng.random()))

    assignment: list = []   # [(subject, day, period, teacher, room)]
    best_assignment: list = []
    nodes = [0]

    def eligible_teachers(subject, day, period):
        cands = [
            t for t in state.teachers
            if (t.id, day, period) not in state.teacher_busy
            and f"{day}-{period}" not in state.unavail[t.id]
            and state.loads[t.id] < t.max_weekly_load
        ]
        # least-constraining: most spare capacity first
        cands.sort(key=lambda t: t.max_weekly_load - state.loads[t.id], reverse=True)
        return cands

    def free_room(subject, day, period):
        pool = state.lab_rooms if subject.requires_lab else state.class_rooms
        return next((r for r in pool if (r.id, day, period) not in state.room_busy), None)

    def slot_ok(subject, day, period):
        if (day, period) in state.section_slots:
            return False
        if state.per_day[(subject.id, day)] >= MAX_PER_DAY:
            return False
        if free_room(subject, day, period) is None:
            return False
        return any(True for _ in eligible_teachers(subject, day, period))

    def backtrack(idx):
        if nodes[0] > NODE_BUDGET:
            return False
        nodes[0] += 1
        if len(assignment) > len(best_assignment):
            best_assignment.clear()
            best_assignment.extend(assignment)
        if idx == len(instances):
            return True

        subject = instances[idx]
        # order slots: prefer days this subject hasn't met yet (spread), then random
        slots = [(d, p) for d in range(1, len(DAYS) + 1) for p in range(1, PERIODS_PER_DAY + 1)]
        slots.sort(key=lambda sp: (state.per_day[(subject.id, sp[0])], rng.random()))
        # forward-check: prune slots that are already invalid
        slots = [sp for sp in slots if slot_ok(subject, *sp)]

        for (day, period) in slots:
            for teacher in eligible_teachers(subject, day, period)[:3]:
                room = free_room(subject, day, period)
                if room is None:
                    continue
                # assign
                state.teacher_busy.add((teacher.id, day, period))
                state.room_busy.add((room.id, day, period))
                state.section_slots.add((day, period))
                state.loads[teacher.id] += 1
                state.per_day[(subject.id, day)] += 1
                assignment.append((subject, day, period, teacher, room))
                if backtrack(idx + 1):
                    return True
                # undo
                assignment.pop()
                state.per_day[(subject.id, day)] -= 1
                state.loads[teacher.id] -= 1
                state.section_slots.discard((day, period))
                state.room_busy.discard((room.id, day, period))
                state.teacher_busy.discard((teacher.id, day, period))
        return False

    solved = backtrack(0)
    final = assignment if solved else best_assignment

    for (subject, day, period, teacher, room) in final:
        db.add(TimetableEntry(
            timetable_id=timetable.id, day_of_week=day, period=period,
            subject_id=subject.id, teacher_id=teacher.id, room_id=room.id,
        ))
    db.commit()

    placed_counts = defaultdict(int)
    for (s, *_rest) in final:
        placed_counts[s.id] += 1
    unplaced = []
    for s in subjects:
        missing = s.hours_per_week - placed_counts.get(s.id, 0)
        if missing >= s.hours_per_week:
            unplaced.append(f"{s.code} ({s.name})")
        elif missing > 0:
            unplaced.append(
                f"{s.code} ({s.name}) - {missing} of {s.hours_per_week} hour(s) unplaced"
            )

    return {
        "placed": len(final),
        "total": total,
        "unplaced": unplaced,
        "solver": "solved" if solved else "best-partial",
        "nodes_explored": nodes[0],
    }
