from sqlalchemy.orm import Session

from app.models import AuditLog


def log_action(db: Session, user_email: str, action: str, entity: str, detail: str) -> None:
    """Record an auditable change. Called after a successful commit's data is staged."""
    db.add(
        AuditLog(
            user_email=user_email,
            action=action,
            entity=entity,
            detail=detail[:255],
        )
    )
    db.commit()
