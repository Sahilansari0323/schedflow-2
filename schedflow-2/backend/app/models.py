from datetime import date, datetime, timezone


def _utcnow():
    """Naive UTC timestamp (MySQL DATETIME columns are timezone-naive)."""
    return datetime.now(timezone.utc).replace(tzinfo=None)

from sqlalchemy import (
    JSON,
    Boolean,
    Date,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Days are 1=Monday .. 6=Saturday; periods are 1..PERIODS_PER_DAY.
DAYS = {1: "Monday", 2: "Tuesday", 3: "Wednesday", 4: "Thursday", 5: "Friday", 6: "Saturday"}
PERIODS_PER_DAY = 8


class Substitution(Base):
    __tablename__ = "substitutions"

    id: Mapped[int] = mapped_column(primary_key=True)
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"))
    start_date: Mapped[date] = mapped_column(Date)
    end_date: Mapped[date] = mapped_column(Date)
    note: Mapped[str] = mapped_column(String(255), default="")
    # active | reverted
    status: Mapped[str] = mapped_column(String(16), default="active")
    created_by: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)

    teacher: Mapped["Teacher"] = relationship()
    assignments: Mapped[list["SubstitutionAssignment"]] = relationship(
        back_populates="substitution", cascade="all, delete-orphan"
    )


class SubstitutionAssignment(Base):
    __tablename__ = "substitution_assignments"

    id: Mapped[int] = mapped_column(primary_key=True)
    substitution_id: Mapped[int] = mapped_column(ForeignKey("substitutions.id"), index=True)
    entry_id: Mapped[int] = mapped_column(ForeignKey("timetable_entries.id"))
    original_teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"))
    substitute_teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"))
    day_of_week: Mapped[int] = mapped_column(Integer)
    period: Mapped[int] = mapped_column(Integer)

    substitution: Mapped["Substitution"] = relationship(back_populates="assignments")
    entry: Mapped["TimetableEntry"] = relationship()


class Announcement(Base):
    __tablename__ = "announcements"

    id: Mapped[int] = mapped_column(primary_key=True)
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(Text, default="")
    # NULL department_id = visible to every department
    department_id: Mapped[int | None] = mapped_column(ForeignKey("departments.id"), nullable=True)
    pinned: Mapped[bool] = mapped_column(Boolean, default=False)
    active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_by: Mapped[str] = mapped_column(String(120), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class Notification(Base):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_email: Mapped[str] = mapped_column(String(120), index=True)
    title: Mapped[str] = mapped_column(String(160))
    body: Mapped[str] = mapped_column(String(400), default="")
    category: Mapped[str] = mapped_column(String(30), default="general")  # substitution | feedback | announcement | general
    read: Mapped[bool] = mapped_column(Boolean, default=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class FeedbackReport(Base):
    __tablename__ = "feedback_reports"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_code: Mapped[str] = mapped_column(String(16), default="")
    semester_number: Mapped[int | None] = mapped_column(Integer, nullable=True)
    section_name: Mapped[str] = mapped_column(String(16), default="")
    reporter_name: Mapped[str] = mapped_column(String(120), default="Student")
    category: Mapped[str] = mapped_column(String(30), default="other")  # wrong_room | wrong_teacher | absent_teacher | other
    message: Mapped[str] = mapped_column(Text, default="")
    # open | resolved | dismissed
    status: Mapped[str] = mapped_column(String(16), default="open", index=True)
    admin_note: Mapped[str] = mapped_column(String(255), default="")
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)


class AuditLog(Base):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(primary_key=True)
    user_email: Mapped[str] = mapped_column(String(120), index=True)
    action: Mapped[str] = mapped_column(String(20), index=True)  # created | updated | deleted | published
    entity: Mapped[str] = mapped_column(String(30), index=True)  # teacher | subject | ...
    detail: Mapped[str] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, index=True)


class Department(Base):
    __tablename__ = "departments"

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(16), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120))

    teachers: Mapped[list["Teacher"]] = relationship(back_populates="department")
    subjects: Mapped[list["Subject"]] = relationship(back_populates="department")


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(primary_key=True)
    email: Mapped[str] = mapped_column(String(120), unique=True, index=True)
    name: Mapped[str] = mapped_column(String(120), default="")
    hashed_password: Mapped[str] = mapped_column(String(255))
    # admin | coordinator | teacher
    role: Mapped[str] = mapped_column(String(20), default="admin")
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    # teacher-role users are linked to their faculty record
    teacher_id: Mapped[int | None] = mapped_column(ForeignKey("teachers.id"), nullable=True)


class Teacher(Base):
    __tablename__ = "teachers"

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(120))
    email: Mapped[str] = mapped_column(String(120), default="")
    employee_code: Mapped[str] = mapped_column(String(32), default="", index=True)
    designation: Mapped[str] = mapped_column(String(80), default="")
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    max_weekly_load: Mapped[int] = mapped_column(Integer, default=24)
    # JSON list of "day-period" strings (e.g. ["1-1", "6-8"]) when the teacher is unavailable.
    unavailable_slots: Mapped[list] = mapped_column(JSON, default=list)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    department: Mapped["Department"] = relationship(back_populates="teachers")


class Semester(Base):
    __tablename__ = "semesters"
    __table_args__ = (UniqueConstraint("department_id", "number", "academic_year", name="uq_semester"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    number: Mapped[int] = mapped_column(Integer)
    academic_year: Mapped[str] = mapped_column(String(16))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))


class Section(Base):
    __tablename__ = "sections"
    __table_args__ = (UniqueConstraint("semester_id", "name", name="uq_section"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(16))
    strength: Mapped[int] = mapped_column(Integer, default=60)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    semester_id: Mapped[int] = mapped_column(ForeignKey("semesters.id"))

    semester: Mapped["Semester"] = relationship()


class Room(Base):
    __tablename__ = "rooms"
    __table_args__ = (UniqueConstraint("department_id", "name", name="uq_room"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    room_type: Mapped[str] = mapped_column(String(16), default="classroom")  # classroom | lab
    capacity: Mapped[int] = mapped_column(Integer, default=60)
    has_projector: Mapped[bool] = mapped_column(Boolean, default=False)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))


class ElectiveGroup(Base):
    __tablename__ = "elective_groups"
    __table_args__ = (UniqueConstraint("department_id", "semester_id", "name", name="uq_elective_group"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str] = mapped_column(String(64))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    semester_id: Mapped[int] = mapped_column(ForeignKey("semesters.id"))


class Subject(Base):
    __tablename__ = "subjects"
    __table_args__ = (UniqueConstraint("department_id", "code", name="uq_subject"),)

    id: Mapped[int] = mapped_column(primary_key=True)
    code: Mapped[str] = mapped_column(String(32))
    name: Mapped[str] = mapped_column(String(120))
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"))
    semester_id: Mapped[int] = mapped_column(ForeignKey("semesters.id"))
    hours_per_week: Mapped[int] = mapped_column(Integer, default=3)
    requires_lab: Mapped[bool] = mapped_column(Boolean, default=False)
    # subjects in the same elective group may run in parallel for one section
    elective_group_id: Mapped[int | None] = mapped_column(ForeignKey("elective_groups.id"), nullable=True)

    elective_group: Mapped["ElectiveGroup | None"] = relationship()

    department: Mapped["Department"] = relationship(back_populates="subjects")


class Timetable(Base):
    __tablename__ = "timetables"

    id: Mapped[int] = mapped_column(primary_key=True)
    department_id: Mapped[int] = mapped_column(ForeignKey("departments.id"), index=True)
    semester_id: Mapped[int] = mapped_column(ForeignKey("semesters.id"))
    section_id: Mapped[int] = mapped_column(ForeignKey("sections.id"), index=True)
    # draft | published
    status: Mapped[str] = mapped_column(String(16), default="draft", index=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    notes: Mapped[str] = mapped_column(Text, default="")
    published_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=_utcnow, onupdate=_utcnow)

    section: Mapped["Section"] = relationship()
    semester: Mapped["Semester"] = relationship()
    entries: Mapped[list["TimetableEntry"]] = relationship(
        back_populates="timetable", cascade="all, delete-orphan"
    )


class TimetableEntry(Base):
    __tablename__ = "timetable_entries"

    id: Mapped[int] = mapped_column(primary_key=True)
    timetable_id: Mapped[int] = mapped_column(ForeignKey("timetables.id"), index=True)
    day_of_week: Mapped[int] = mapped_column(Integer)  # 1=Mon .. 6=Sat
    period: Mapped[int] = mapped_column(Integer)
    subject_id: Mapped[int] = mapped_column(ForeignKey("subjects.id"))
    teacher_id: Mapped[int] = mapped_column(ForeignKey("teachers.id"))
    room_id: Mapped[int] = mapped_column(ForeignKey("rooms.id"))
    # set when this entry belongs to an elective group (may share a slot with
    # other elective options); NULL = core class. Slot exclusivity is enforced
    # in the API layer, not by a DB unique index, so electives can co-exist.
    elective_group_id: Mapped[int | None] = mapped_column(ForeignKey("elective_groups.id"), nullable=True)

    timetable: Mapped["Timetable"] = relationship(back_populates="entries")
    subject: Mapped["Subject"] = relationship()
    teacher: Mapped["Teacher"] = relationship()
    room: Mapped["Room"] = relationship()
    elective_group: Mapped["ElectiveGroup | None"] = relationship()
