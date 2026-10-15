from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models import User

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")

STAFF_ROLES = {"admin", "coordinator"}


def get_current_user(
    token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)
) -> User:
    credentials_error = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Invalid or expired credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    email = decode_access_token(token)
    if email is None:
        raise credentials_error
    user = db.query(User).filter(User.email == email).first()
    if user is None or not user.is_active:
        raise credentials_error
    return user


def require_staff(user: User = Depends(get_current_user)) -> User:
    """Admin-portal access: admins and coordinators only."""
    if user.role not in STAFF_ROLES:
        raise HTTPException(status_code=403, detail="This area is restricted to department staff.")
    return user


def require_teacher(user: User = Depends(get_current_user)) -> User:
    """Teacher portal access."""
    if user.role != "teacher":
        raise HTTPException(status_code=403, detail="This area is for teacher accounts.")
    if user.teacher_id is None:
        raise HTTPException(status_code=400, detail="This account is not linked to a teacher record.")
    return user
