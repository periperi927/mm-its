import os

from app.config import settings
from app.db.session import SessionLocal
from app.models import User
from app.core.security import get_password_hash


def main() -> None:
    if settings.MMITS_ENVIRONMENT.lower() == "production":
        raise RuntimeError("This development account script cannot run in production.")

    username = os.getenv("DEV_ADMIN_USERNAME", "admin")
    email = os.getenv("DEV_ADMIN_EMAIL")
    password = os.getenv("DEV_ADMIN_PASSWORD")
    if not email or not password or len(password) < 12:
        raise RuntimeError(
            "Set DEV_ADMIN_EMAIL and a DEV_ADMIN_PASSWORD of at least 12 characters."
        )

    with SessionLocal() as db:
        dev_user = db.query(User).filter(User.username == username).first()
        if dev_user:
            print(f"Development user {username!r} already exists.")
            return

        if db.query(User).filter(User.email == email).first():
            raise RuntimeError("DEV_ADMIN_EMAIL is already assigned to another account.")

        db.add(User(
            username=username,
            email=email,
            hashed_password=get_password_hash(password),
            is_active=True,
        ))
        db.commit()
        print(f"Development user {username!r} created.")


if __name__ == "__main__":
    main()