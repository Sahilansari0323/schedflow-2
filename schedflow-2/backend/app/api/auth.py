from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.database import get_db
from app.core.security import create_access_token, verify_password
from app.models import User
from app.schemas import LoginRequest, TokenResponse, UserOut

router = APIRouter(prefix="/api/auth", tags=["auth"])


def _authenticate(db: Session, email: str, password: str) -> User:
    user = db.query(User).filter(User.email == email).first()
    if user is None or not verify_password(password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")
    return user


@router.post("/login", response_model=TokenResponse)
def login_json(payload: LoginRequest, db: Session = Depends(get_db)):
    user = _authenticate(db, payload.email, payload.password)
    return TokenResponse(access_token=create_access_token(user.email), user=UserOut.model_validate(user))


@router.post("/login-form", response_model=TokenResponse)
def login_form(form: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = _authenticate(db, form.username, form.password)
    return TokenResponse(access_token=create_access_token(user.email), user=UserOut.model_validate(user))


@router.get("/me", response_model=UserOut)
def me(current_user: User = Depends(get_current_user)):
    return current_user
