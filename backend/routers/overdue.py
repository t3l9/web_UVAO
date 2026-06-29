import sqlite3
from typing import Optional

from fastapi import APIRouter, HTTPException, Header

from ..config import DATABASE_PATH
from ..utils.auth import verify_admin
from .schemas import UpdateLastVisitBody

router = APIRouter()


@router.post('/api/update-last-visit')
def update_last_visit(body: UpdateLastVisitBody):
    try:
        user_id = body.userId
        last_visit = body.lastVisit

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM Users WHERE ID = ?", (user_id,))
        if cursor.fetchone() is None:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")

        cursor.execute("UPDATE Users SET Last_visit = ? WHERE ID = ?", (last_visit, user_id))
        conn.commit()
        conn.close()

        return {"status": "success"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")


@router.delete('/api/overdue/{request_id}')
def delete_overdue(
    request_id: str,
    x_user_login: Optional[str] = Header(None),
):
    try:
        user_login = x_user_login

        if not user_login or not verify_admin(user_login):
            raise HTTPException(status_code=403, detail="Доступ запрещён")

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT ID FROM MM_prosrok WHERE ID = ?", (request_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="Запись не найдена")

        cursor.execute("DELETE FROM MM_prosrok WHERE ID = ?", (request_id,))
        conn.commit()
        conn.close()

        return {"message": "Запись удалена"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in delete_overdue: {e}")
        raise HTTPException(status_code=500, detail=str(e))
