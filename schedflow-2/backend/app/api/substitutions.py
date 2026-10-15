from datetime import date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from sqlalchemy.orm import Session

from app.api.deps import require_staff, get_current_user
from app.core.database import get_db
from app.models import Notification, Substitution, Teacher, User
from app.services.audit import log_action
from app.services.substitutes import assign_substitutes, auto_revert_expired, revert

router = APIRouter(prefix="/api/substitutions", tags=["substitutions"], dependencies=[Depends(require_staff)])


class SubstitutionCreate(BaseModel):
    teacher_id: int
    start_date: date
    end_date: date
    note: str = Field(default="", max_length=255)


def _serialize(db: Session, s: Substitution) -> dict:
    return {
        "id": s.id,
        "teacher": {"id": s.teacher_id, "name": s.teacher.name},
        "start_date": s.start_date.isoformat(),
        "end_date": s.end_date.isoformat(),
        "note": s.note,
        "status": s.status,
        "created_by": s.created_by,
        "created_at": s.created_at,
        "assignments": [
            {
                "entry_id": a.entry_id,
                "day_of_week": a.day_of_week,
                "period": a.period,
                "original_teacher_id": a.original_teacher_id,
                "substitute_teacher_id": a.substitute_teacher_id,
            }
            for a in s.assignments
        ],
    }


@router.get("")
def list_substitutions(db: Session = Depends(get_db)):
    expired = auto_revert_expired(db)
    subs = db.query(Substitution).order_by(Substitution.created_at.desc()).all()
    return [_serialize(db, s) for s in subs]


@router.post("", status_code=201)
def create_substitution(
    payload: SubstitutionCreate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if payload.start_date > payload.end_date:
        raise HTTPException(400, "Leave start date must be on or before the end date.")
    absent = db.get(Teacher, payload.teacher_id)
    if absent is None:
        raise HTTPException(404, "Teacher not found")
    auto_revert_expired(db)

    sub = Substitution(
        teacher_id=payload.teacher_id,
        start_date=payload.start_date,
        end_date=payload.end_date,
        note=payload.note,
        created_by=user.email,
    )
    db.add(sub)
    db.commit()
    db.refresh(sub)

    results = assign_substitutes(db, sub)
    assigned = [r for r in results if r["status"] == "assigned"]
    unresolved = [r for r in results if r["status"] == "unresolved"]
    log_action(
        db, user.email, "substituted", "substitution",
        f"AI substitute: {absent.name} on leave {payload.start_date} → {payload.end_date} — "
        f"{len(assigned)} class(es) covered"
        + (f", {len(unresolved)} unresolved" if unresolved else ""),
    )
    # email each substitute teacher their coverage (per-substitute grouping)
    from collections import defaultdict

    from app.services.mailer import send_email, substitution_email_html

    by_substitute = defaultdict(list)
    for r in assigned:
        by_substitute[r["substitute"]["id"]].append(r)
    email_status = {}
    for tid, items in by_substitute.items():
        t = db.get(Teacher, tid)
        if t is None or not t.email:
            email_status[tid] = "skipped (no email on record)"
            continue
        status = send_email(
            t.email,
            f"SchedFlow substitution - you cover {absent.name} ({len(items)} class/es)",
            substitution_email_html(t.name, items, absent.name),
        )
        email_status[tid] = f"{status}: {t.email}"

    # in-app notification for portal users linked to the substitute
    from app.models import User as UserModel, Notification as NotificationModel

    for tid in by_substitute:
        for u in db.query(UserModel).filter(UserModel.teacher_id == tid, UserModel.is_active == True).all():  # noqa: E712
            db.add(NotificationModel(
                user_email=u.email,
                title="You have a substitution assignment",
                body=f"You cover {len(by_substitute[tid])} class(es) for {absent.name} "
                     f"({payload.start_date} -> {payload.end_date}).",
                category="substitution",
            ))
    db.commit()

    return {"substitution": _serialize(db, sub), "results": results, "email_status": email_status}


@router.post("/{substitution_id}/revert")
def revert_substitution(
    substitution_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    sub = db.get(Substitution, substitution_id)
    if sub is None:
        raise HTTPException(404, "Substitution not found")
    if sub.status != "active":
        raise HTTPException(400, "This substitution was already reverted.")
    absent_name = sub.teacher.name
    n = len(sub.assignments)
    revert(db, sub)
    log_action(db, user.email, "reverted", "substitution", f"Reverted substitution for {absent_name} — {n} class(es) restored")
    return {"ok": True}


@router.delete("/{substitution_id}", status_code=204)
def delete_substitution(substitution_id: int, db: Session = Depends(get_db)):
    sub = db.get(Substitution, substitution_id)
    if sub is None:
        raise HTTPException(404, "Substitution not found")
    if sub.status == "active":
        raise HTTPException(409, "Revert this substitution before deleting it.")
    db.delete(sub)
    db.commit()
