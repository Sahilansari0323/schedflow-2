"""Data-driven assistant: answers scheduling questions from live data.

Rule-based intent matching over the real database — no external AI service
required. Handles: room availability (with today/tomorrow + projector),
free teachers at a slot, a teacher's schedule/load, a section's day plan,
conflict scans, workload caps, announcements and the feedback queue.
Unknown questions fall back to a capability list.
"""

import re
from collections import defaultdict
from datetime import date, timedelta

from sqlalchemy.orm import Session

from app.models import (
    Announcement,
    DAYS,
    FeedbackReport,
    Room,
    Section,
    Teacher,
    Timetable,
    TimetableEntry,
)
from app.services.scan import scan_all

DAY_ALIASES = {
    "monday": 1, "mon": 1, "tuesday": 2, "tue": 2, "tues": 2,
    "wednesday": 3, "wed": 3, "thursday": 4, "thu": 4, "thurs": 4,
    "friday": 5, "fri": 5, "saturday": 6, "sat": 6,
}


def _fmt12(t24: str) -> str:
    parts = t24.split(":")
    h, m = int(parts[0]), int(parts[1]) if len(parts) > 1 else 0
    suffix = "PM" if h >= 12 else "AM"
    hr = h % 12 or 12
    return f"{hr}:{m:02d} {suffix}"


def _slot_label(day: int, period: int) -> str:
    start = f"{9 + (period - 1):02d}:00"
    end = f"{9 + period:02d}:00"
    return f"{DAYS[day]} P{period} ({_fmt12(start)} – {_fmt12(end)})"


def _parse_day(text: str) -> int | None:
    lowered = text.lower()
    if re.search(r"\btoday\b", lowered):
        wd = date.today().weekday() + 1
        return wd if wd <= 6 else None
    if re.search(r"\btomorrow\b", lowered):
        wd = (date.today() + timedelta(days=1)).weekday() + 1
        return wd if wd <= 6 else None
    for alias, val in DAY_ALIASES.items():
        if re.search(rf"\b{alias}\b", lowered):
            return val
    return None


def _parse_period(text: str) -> int | None:
    m = re.search(r"\bperiod\s*(\d)\b|\bp\s*(\d)\b|\b(\d)(?:st|nd|rd|th)\s+period\b", text.lower())
    if m:
        val = m.group(1) or m.group(2) or m.group(3)
        p = int(val)
        return p if 1 <= p <= 8 else None
    return None


def _find_teacher(db: Session, text: str):
    lowered = text.lower()
    candidates = []
    for t in db.query(Teacher).all():
        name = t.name.lower()
        score = 0
        if name and name in lowered:
            score = 100
        elif t.email and t.email.split("@")[0].lower() in lowered:
            score = 80
        else:
            for token in re.split(r"[.\s]+", name):
                if len(token) >= 4 and token in lowered:
                    score = max(score, 60)
        if score:
            candidates.append((score, t))
    candidates.sort(key=lambda c: -c[0])
    return candidates[0][1] if candidates else None


def _find_section(db: Session, text: str):
    m = re.search(r"section\s+([a-z0-9]+)\b", text.lower())
    if not m:
        return None
    return db.query(Section).filter(Section.name.ilike(m.group(1))).first()


def _teacher_summary(db: Session, teacher: Teacher) -> str:
    entries = db.query(TimetableEntry).filter(TimetableEntry.teacher_id == teacher.id).all()
    per_day = defaultdict(list)
    for e in entries:
        per_day[e.day_of_week].append(e)
    detail = "; ".join(
        f"{DAYS[d]} {len(ps)} class(es) ({', '.join(sorted(e.subject.code for e in ps))})"
        for d, ps in sorted(per_day.items())
    ) or "no classes scheduled"
    free_days = [name for d, name in DAYS.items() if d not in per_day]
    free = f" Completely free on: {', '.join(free_days)}." if free_days else ""
    return (
        f"{teacher.name} ({teacher.designation or 'faculty'}) has {len(entries)} class(es) this week "
        f"against a cap of {teacher.max_weekly_load}. {detail}.{free}"
    )


def _section_day_text(db: Session, section: Section, day: int | None) -> str:
    tt_ids = [t.id for t in db.query(Timetable).filter(Timetable.section_id == section.id).all()]
    if not tt_ids:
        return f"Section {section.name} has no timetable yet."
    q = db.query(TimetableEntry).filter(TimetableEntry.timetable_id.in_(tt_ids))
    if day is not None:
        q = q.filter(TimetableEntry.day_of_week == day)
    entries = q.order_by(TimetableEntry.day_of_week, TimetableEntry.period).all()
    if not entries:
        return (
            f"Section {section.name} has no classes on {DAYS[day]}."
            if day is not None
            else f"Section {section.name} has no classes scheduled."
        )
    grouped = defaultdict(list)
    for e in entries:
        grouped[(e.day_of_week, e.period)].append(e)
    lines = []
    for (d, p), es in sorted(grouped.items()):
        names = " / ".join(
            f"{e.subject.code} ({e.teacher.name}, {e.room.name})" + (" [elective]" if e.elective_group_id else "")
            for e in es
        )
        lines.append(f"• {_slot_label(d, p)}: {names}")
    head = f"Section {section.name}" + (f" on {DAYS[day]}" if day is not None else " — full week") + ":"
    more = f"\n…and {len(lines) - 14} more slots." if len(lines) > 14 else ""
    return head + "\n" + "\n".join(lines[:14]) + more


def answer(db: Session, message: str) -> str:
    text = message.lower().strip()

    # ---------- help / greeting ----------
    if re.search(r"\b(help|what can you|hello|hi|hey|good (morning|evening))\b", text) and len(text) < 40:
        return (
            "I answer from live timetable data. Try:\n"
            "• \"Which rooms are free on Monday period 3?\"\n"
            "• \"Who is free on Tuesday P1?\"\n"
            "• \"What does section A have on Wednesday?\"\n"
            "• \"How many classes does Meera have this week?\"\n"
            "• \"Any conflicts right now?\" / \"Who is over their workload cap?\"\n"
            "• \"Latest announcements\" / \"Open feedback reports\""
        )

    # ---------- announcements ----------
    if re.search(r"announcement|notice", text):
        rows = (
            db.query(Announcement)
            .filter(Announcement.active == True)  # noqa: E712
            .order_by(Announcement.pinned.desc(), Announcement.created_at.desc())
            .limit(3)
            .all()
        )
        if not rows:
            return "No active announcements."
        return "Latest announcements:\n" + "\n".join(
            f"• {a.title}{' (pinned)' if a.pinned else ''} — {a.body or 'no details'}" for a in rows
        )

    # ---------- feedback queue ----------
    if re.search(r"feedback|report", text):
        open_n = db.query(FeedbackReport).filter(FeedbackReport.status == "open").count()
        total = db.query(FeedbackReport).count()
        return (
            f"The feedback queue has {open_n} open report(s) out of {total} total. "
            "Open the Feedback page to review, resolve or dismiss them."
        )

    # ---------- conflicts (real scan) ----------
    if re.search(r"conflict|clash", text):
        conflicts = scan_all(db)
        if not conflicts:
            return "✅ No conflicts anywhere — every teacher, room, section, availability, lab and workload check passes."
        high = sum(1 for c in conflicts if c["severity"] == "high")
        by_type = defaultdict(int)
        for c in conflicts:
            by_type[c["type"]] += 1
        breakdown = ", ".join(f"{v} {k}" for k, v in sorted(by_type.items()))
        first = conflicts[0]
        return (
            f"⚠️ {len(conflicts)} conflict(s) found ({breakdown}; {high} high severity). "
            f"Most severe: {first['message']} — open AI Resolver for ranked fixes."
        )

    # ---------- workload ----------
    if re.search(r"workload|over.*cap|\bload\b", text):
        loads = defaultdict(int)
        teachers = {}
        for e in db.query(TimetableEntry).all():
            loads[e.teacher_id] += 1
            teachers[e.teacher_id] = e.teacher
        over = [
            f"{teachers[tid].name} ({count}/{teachers[tid].max_weekly_load})"
            for tid, count in loads.items()
            if count > teachers[tid].max_weekly_load
        ]
        top = sorted(loads.items(), key=lambda kv: -kv[1])[:3]
        top_s = ", ".join(f"{teachers[tid].name}: {count}" for tid, count in top) or "no classes scheduled yet"
        if re.search(r"over|cap|exceed", text):
            return f"Over their workload cap: {', '.join(over)}." if over else "Nobody is over their workload cap. 🎉"
        return f"Top loads — {top_s}." + (f" Over cap: {', '.join(over)}." if over else "")

    # ---------- who is free at a slot ----------
    if re.search(r"who is free|who's free|which teachers? (are |is )?free|available teachers", text):
        day, period = _parse_day(text), _parse_period(text)
        if day is None or period is None:
            return "Tell me the slot — e.g. \"who is free on Tuesday P1?\""
        busy = {
            e.teacher_id
            for e in db.query(TimetableEntry).filter(
                TimetableEntry.day_of_week == day, TimetableEntry.period == period
            ).all()
        }
        free = [
            t.name for t in db.query(Teacher).filter(Teacher.is_active == True).all()  # noqa: E712
            if t.id not in busy and f"{day}-{period}" not in (t.unavailable_slots or [])
        ]
        return (
            f"{len(free)} teacher(s) free on {_slot_label(day, period)}: "
            + (", ".join(free[:10]) if free else "none")
            + "."
        )

    # ---------- section day plan ----------
    if re.search(r"\bsection\b", text):
        section = _find_section(db, text)
        if section is not None:
            return _section_day_text(db, section, _parse_day(text))

    # ---------- teacher schedule ----------
    teacher = _find_teacher(db, text)
    if teacher is not None and re.search(
        r"schedule|class|teach|load|periods|free|when|has|is|does|busy", text
    ):
        return _teacher_summary(db, teacher)

    # ---------- room availability ----------
    if re.search(r"\broom|\bfree\b|\blab\b|projector", text):
        day, period = _parse_day(text), _parse_period(text)
        if day is None and period is None:
            return (
                "Tell me a day and period — e.g. \"which rooms are free on Monday period 3?\" "
                "You can also ask \"who is free on Tuesday P1?\" or \"what does section A have on Wednesday?\""
            )
        busy_rooms = {
            e.room_id
            for e in db.query(TimetableEntry).filter(
                TimetableEntry.day_of_week == day if day is not None else TimetableEntry.day_of_week >= 1,
                TimetableEntry.period == period if period is not None else TimetableEntry.period >= 1,
            ).all()
        }
        want_projector = "projector" in text
        rooms_q = db.query(Room)
        if want_projector:
            rooms_q = rooms_q.filter(Room.has_projector == True)  # noqa: E712
        rooms = rooms_q.all()
        free = [r.name for r in rooms if r.id not in busy_rooms]
        want = "projector rooms" if want_projector else "rooms"
        label = _slot_label(day, period) if (day is not None and period is not None) else (
            DAYS[day] if day is not None else f"period {period}"
        )
        extra = f" ({len(free)} of {len(rooms)} {want})" if want_projector else ""
        return (
            f"{len(free)} {want} free on {label}{extra}: "
            + (", ".join(free) if free else "none — every room is booked")
            + "."
        )

    return (
        "I'm not sure I understood. I can answer about room availability, free teachers, section and "
        "teacher schedules, conflicts, workload caps, make-up classes, announcements and the feedback "
        "queue — or type \"help\"."
    )
