from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


# ---------- Auth ----------
class LoginRequest(BaseModel):
    email: EmailStr
    password: str


# ---------- Users ----------
class UserOut(BaseModel):
    id: int
    email: str
    name: str
    role: str
    is_active: bool = True
    teacher_id: int | None = None

    class Config:
        from_attributes = True


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut


# ---------- Departments ----------
class DepartmentOut(BaseModel):
    id: int
    code: str
    name: str

    class Config:
        from_attributes = True


# ---------- Teachers ----------
class TeacherBase(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: str = ""
    employee_code: str = ""
    designation: str = ""
    max_weekly_load: int = Field(default=24, ge=1, le=60)
    unavailable_slots: list[str] = Field(default_factory=list)
    is_active: bool = True


class TeacherCreate(TeacherBase):
    department_id: int


class TeacherUpdate(TeacherBase):
    pass


class TeacherOut(TeacherBase):
    id: int
    department_id: int

    class Config:
        from_attributes = True


class WorkloadOut(TeacherOut):
    assigned_periods: int


# ---------- Semesters ----------
class SemesterCreate(BaseModel):
    number: int = Field(ge=1, le=12)
    academic_year: str = Field(min_length=4, max_length=16)
    department_id: int


class SemesterOut(SemesterCreate):
    id: int

    class Config:
        from_attributes = True


# ---------- Sections ----------
class SectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=16)
    strength: int = Field(default=60, ge=1)
    department_id: int
    semester_id: int


class SectionOut(SectionCreate):
    id: int

    class Config:
        from_attributes = True


# ---------- Rooms ----------
class RoomCreate(BaseModel):
    name: str = Field(min_length=1, max_length=64)
    room_type: str = Field(pattern="^(classroom|lab)$")
    capacity: int = Field(default=60, ge=1)
    has_projector: bool = False
    department_id: int


class RoomOut(RoomCreate):
    id: int

    class Config:
        from_attributes = True


# ---------- Subjects ----------
class SubjectCreate(BaseModel):
    code: str = Field(min_length=1, max_length=32)
    name: str = Field(min_length=1, max_length=120)
    department_id: int
    semester_id: int
    hours_per_week: int = Field(default=3, ge=1, le=20)
    requires_lab: bool = False
    # optional elective-group name: subjects sharing a group may run in parallel
    elective_group: str | None = Field(default=None, max_length=64)


class SubjectOut(SubjectCreate):
    id: int
    elective_group: str | None = None

    class Config:
        from_attributes = True


# ---------- Timetables ----------
class TimetableCreate(BaseModel):
    department_id: int
    semester_id: int
    section_id: int
    notes: str = ""


class TimetableEntryCreate(BaseModel):
    day_of_week: int = Field(ge=1, le=6)
    period: int = Field(ge=1, le=8)
    subject_id: int
    teacher_id: int
    room_id: int


class TimetableEntryOut(TimetableEntryCreate):
    id: int
    timetable_id: int

    class Config:
        from_attributes = True


class TimetableOut(BaseModel):
    id: int
    department_id: int
    semester_id: int
    section_id: int
    status: str
    version: int
    notes: str
    published_at: datetime | None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConflictOut(BaseModel):
    type: str
    message: str


class SaveEntryResponse(BaseModel):
    entry: TimetableEntryOut
    conflicts: list[ConflictOut]


class PublicTimetableRequest(BaseModel):
    department: str
    semester: int
    section: str
