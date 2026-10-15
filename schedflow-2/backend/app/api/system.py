from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr, Field
from sqlalchemy.orm import Session

from app.api.deps import require_staff, get_current_user
from app.core.database import get_db
from app.core.security import hash_password, verify_password
from app.models import AuditLog, User
from app.schemas import UserOut
from app.services.audit import log_action

router = APIRouter(prefix="/api", tags=["system"], dependencies=[Depends(get_current_user)])


# ---------- Version history (audit log) ----------
@router.get("/audit")
def list_audit(action: str | None = None, limit: int = 120, db: Session = Depends(get_db)):
    """Most recent system changes, newest first."""
    q = db.query(AuditLog).order_by(AuditLog.created_at.desc(), AuditLog.id.desc())
    if action is not None:
        q = q.filter(AuditLog.action == action)
    rows = q.limit(min(limit, 500)).all()
    return [
        {
            "id": a.id,
            "user": a.user_email,
            "action": a.action,
            "entity": a.entity,
            "detail": a.detail,
            "created_at": a.created_at,
        }
        for a in rows
    ]


# ---------- Settings ----------
class ProfileUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=120)


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=6, max_length=72)


@router.get("/settings/profile", response_model=UserOut)
def get_profile(user: User = Depends(get_current_user)):
    return user


@router.put("/settings/profile", response_model=UserOut)
def update_profile(
    payload: ProfileUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    user.name = payload.name.strip()
    db.commit()
    db.refresh(user)
    log_action(db, user.email, "updated", "settings", f"Changed display name to '{user.name}'")
    return user


@router.put("/settings/password")
def change_password(
    payload: PasswordChange,
    db: Session = Depends(get_db),
    user: User = Depends(get_current_user),
):
    if not verify_password(payload.current_password, user.hashed_password):
        raise HTTPException(400, "Current password is incorrect.")
    if payload.current_password == payload.new_password:
        raise HTTPException(400, "New password must be different from the current one.")
    user.hashed_password = hash_password(payload.new_password)
    db.commit()
    log_action(db, user.email, "updated", "settings", "Changed account password")
    return {"ok": True}


# ---------- Team (user management) ----------
class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    role: str = Field(default="admin", pattern="^(admin|coordinator|teacher)$")
    teacher_id: int | None = None


class StatusUpdate(BaseModel):
    is_active: bool


@router.get("/settings/users", response_model=list[UserOut])
def list_users(db: Session = Depends(get_db), user: User = Depends(require_staff)):
    return db.query(User).order_by(User.id).all()


@router.post("/settings/users", response_model=UserOut, status_code=201)
def create_user(
    payload: UserCreate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff),
):
    email = payload.email.lower()
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(409, "A user with this email already exists.")
    if payload.role == "teacher":
        if payload.teacher_id is None:
            raise HTTPException(400, "Link the account to a teacher record.")
        if db.query(User).filter(User.teacher_id == payload.teacher_id).first():
            raise HTTPException(409, "This teacher already has a portal login.")
        from app.models import Teacher

        if db.get(Teacher, payload.teacher_id) is None:
            raise HTTPException(404, "Teacher record not found.")
    new_user = User(
        email=email,
        name=payload.name.strip(),
        hashed_password=hash_password(payload.password),
        role=payload.role,
        teacher_id=payload.teacher_id if payload.role == "teacher" else None,
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)
    log_action(db, user.email, "created", "user", f"Added portal user {new_user.name} ({new_user.email}, {new_user.role})")
    return new_user


@router.put("/settings/users/{user_id}/status", response_model=UserOut)
def set_user_status(
    user_id: int,
    payload: StatusUpdate,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff),
):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(404, "User not found")
    if target.id == user.id and not payload.is_active:
        raise HTTPException(400, "You cannot deactivate your own account.")
    active_admins = db.query(User).filter(User.role == "admin", User.is_active == True).count()  # noqa: E712
    if target.role == "admin" and target.is_active and not payload.is_active and active_admins <= 1:
        raise HTTPException(400, "Cannot deactivate the last active admin.")
    target.is_active = payload.is_active
    db.commit()
    db.refresh(target)
    verb = "Activated" if payload.is_active else "Deactivated"
    log_action(db, user.email, "updated", "user", f"{verb} portal user {target.name} ({target.email})")
    return target


@router.delete("/settings/users/{user_id}", status_code=204)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    user: User = Depends(require_staff),
):
    target = db.get(User, user_id)
    if target is None:
        raise HTTPException(404, "User not found")
    if target.id == user.id:
        raise HTTPException(400, "You cannot delete your own account.")
    active_admins = db.query(User).filter(User.role == "admin", User.is_active == True).count()  # noqa: E712
    if target.role == "admin" and target.is_active and active_admins <= 1:
        raise HTTPException(400, "Cannot delete the last active admin.")
    email = target.email
    db.delete(target)
    db.commit()
    log_action(db, user.email, "deleted", "user", f"Removed portal user {email}")
