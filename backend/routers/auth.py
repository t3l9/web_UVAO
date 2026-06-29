import sqlite3

from fastapi import APIRouter, HTTPException

from ..config import DATABASE_PATH
from ..utils.auth import hash_password
from .schemas import LoginBody

router = APIRouter()


@router.post('/api/auth/login')
def login_endpoint(body: LoginBody):
    conn = None
    try:
        login_val = body.login
        password = body.password

        if not login_val or not password:
            raise HTTPException(status_code=400, detail="Логин и пароль обязательны")

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                Users.ID,
                Users.Name,
                Organizations.Org_name,
                Dutys.Duty_name,
                Users.Login,
                Users.Password
            FROM Users
            LEFT JOIN Organizations ON Users.ID_organization = Organizations.ID_organization
            LEFT JOIN Dutys ON Users.ID_duty = Dutys.ID_duty
            WHERE Users.Login = ?
        """, (login_val,))
        user = cursor.fetchone()

        if user is None:
            raise HTTPException(status_code=401, detail="Неверный логин или пароль")

        user_id, name, org_name, duty_name, db_login, db_password_hash = user

        if hash_password(password) != db_password_hash:
            raise HTTPException(status_code=401, detail="Неверный логин или пароль")

        return {
            "user": {
                "id": user_id,
                "name": name,
                "organization": org_name,
                "duty": duty_name,
                "login": db_login
            }
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if conn:
            conn.close()
