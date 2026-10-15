"""Initial demo data + admin account. Runs on startup if the database is empty."""

from sqlalchemy.orm import Session

from app.core.config import get_settings
from app.core.security import hash_password
from app.models import Department, Room, Section, Semester, Subject, Teacher, User

settings = get_settings()


def seed(db: Session) -> None:
    if db.query(User).first() is not None:
        return

    db.add(
        User(
            email=settings.ADMIN_EMAIL,
            name="Administrator",
            hashed_password=hash_password(settings.ADMIN_PASSWORD),
            role="admin",
        )
    )
    cse = Department(code="CSE", name="Computer Science & Engineering")
    ece = Department(code="ECE", name="Electronics & Communication Engineering")
    db.add_all([cse, ece])
    db.flush()

    sem3 = Semester(number=3, academic_year="2026-27", department_id=cse.id)
    sem5 = Semester(number=5, academic_year="2026-27", department_id=cse.id)
    db.add_all([sem3, sem5])
    db.flush()

    sec_a = Section(name="A", strength=60, department_id=cse.id, semester_id=sem3.id)
    sec_b = Section(name="B", strength=58, department_id=cse.id, semester_id=sem3.id)
    db.add_all([sec_a, sec_b])

    db.add_all(
        [
            Room(name="C101", room_type="classroom", capacity=70, department_id=cse.id),
            Room(name="C102", room_type="classroom", capacity=60, department_id=cse.id),
            Room(name="CS-Lab-1", room_type="lab", capacity=60, department_id=cse.id),
            Room(name="CS-Lab-2", room_type="lab", capacity=40, department_id=cse.id),
        ]
    )

    db.add_all(
        [
            Teacher(
                name="Dr. Meera Iyer",
                email="meera@schedflow.edu",
                employee_code="CSE001",
                designation="Professor",
                department_id=cse.id,
                max_weekly_load=20,
            ),
            Teacher(
                name="Prof. Arjun Rao",
                email="arjun@schedflow.edu",
                employee_code="CSE002",
                designation="Associate Professor",
                department_id=cse.id,
                max_weekly_load=24,
                unavailable_slots=["1-1", "6-8"],
            ),
            Teacher(
                name="Prof. Sara Khan",
                email="sara@schedflow.edu",
                employee_code="CSE003",
                designation="Assistant Professor",
                department_id=cse.id,
                max_weekly_load=24,
            ),
        ]
    )
    db.flush()

    db.add_all(
        [
            Subject(code="CS301", name="Data Structures", department_id=cse.id, semester_id=sem3.id, hours_per_week=4),
            Subject(code="CS302", name="Operating Systems", department_id=cse.id, semester_id=sem3.id, hours_per_week=3),
            Subject(code="CS303", name="Data Structures Lab", department_id=cse.id, semester_id=sem3.id, hours_per_week=2, requires_lab=True),
        ]
    )

    # demo teacher portal login linked to Dr. Meera Iyer
    meera = db.query(Teacher).filter(Teacher.employee_code == "CSE001").first()
    if meera:
        db.add(
            User(
                email="meera@schedflow.edu",
                name="Dr. Meera Iyer",
                hashed_password=hash_password("teacher123"),
                role="teacher",
                teacher_id=meera.id,
            )
        )

    db.commit()
