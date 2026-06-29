import hashlib

from ..config import ADMIN_LOGINS


def hash_password(password: str) -> str:
    sha256 = hashlib.sha256()
    sha256.update(password.encode('utf-8'))
    return sha256.hexdigest()


def verify_admin(login: str) -> bool:
    """Проверяет, имеет ли пользователь права администратора"""
    return login in ADMIN_LOGINS
