import logging
import sqlite3

from fastapi import APIRouter, HTTPException

from ..config import DATABASE_PATH

logger = logging.getLogger(__name__)
router = APIRouter()


@router.get('/api/ng_overdue')
def get_ng_overdue():
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ID, PublishDate, District, Deadline, PreparationStatus,
                   Address, Problem, MonitorOverdue, Day, Status
            FROM NG_prosrok
            ORDER BY Deadline ASC
        """)
        rows = cursor.fetchall()

        return [
            {
                'id': row[0],
                'publishDate': row[1],
                'district': row[2],
                'deadline': row[3],
                'preparationStatus': row[4],
                'address': row[5],
                'problem': row[6],
                'monitorOverdue': row[7] or 'Нет признака',
                'day': row[8],
                'status': row[9],
            }
            for row in rows
        ]

    except sqlite3.OperationalError:
        # Таблица ещё не создана — выгрузок ng() пока не было
        return []
    except Exception:
        logger.exception('get_ng_overdue error')
        raise HTTPException(status_code=500, detail='Внутренняя ошибка сервера')
    finally:
        if conn:
            conn.close()
