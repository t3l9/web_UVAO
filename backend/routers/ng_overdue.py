import logging
import os
import sqlite3
from datetime import datetime
from io import BytesIO

import pandas as pd
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

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
                   Address, Problem, MonitorOverdue, Day, Status, WithdrawalDate
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
                'withdrawalDate': row[10],
            }
            for row in rows
        ]

    except sqlite3.OperationalError:
        return []
    except Exception:
        logger.exception('get_ng_overdue error')
        raise HTTPException(status_code=500, detail='Внутренняя ошибка сервера')
    finally:
        if conn:
            conn.close()


@router.get('/api/ng_overdue/export')
def export_ng_overdue():
    conn = None
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()
        cursor.execute("""
            SELECT ID, Day, Status, PublishDate, WithdrawalDate, District,
                   Deadline, PreparationStatus, Address, Problem, MonitorOverdue
            FROM NG_prosrok
            ORDER BY Deadline ASC
        """)
        rows = cursor.fetchall()

        df = pd.DataFrame(rows, columns=[
            'Номер сообщения', 'День', 'Статус', 'Дата публикации',
            'Дата для выноса', 'Район', 'Регл. срок (Портал)',
            'Статус ответа', 'Адрес', 'Проблемная тема', 'Просрок (Монитор)',
        ])

        buf = BytesIO()
        with pd.ExcelWriter(buf, engine='openpyxl') as writer:
            df.to_excel(writer, sheet_name='Дашборд НГ', index=False)
            ws = writer.sheets['Дашборд НГ']
            col_widths = [22, 10, 12, 18, 18, 18, 22, 30, 35, 35, 20]
            for i, w in enumerate(col_widths, start=1):
                ws.column_dimensions[ws.cell(row=1, column=i).column_letter].width = w
        buf.seek(0)

        filename = f"ng_overdue_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
        return StreamingResponse(
            buf,
            media_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            headers={'Content-Disposition': f'attachment; filename="{filename}"'},
        )

    except sqlite3.OperationalError:
        raise HTTPException(status_code=404, detail='Данные ещё не загружены')
    except Exception:
        logger.exception('export_ng_overdue error')
        raise HTTPException(status_code=500, detail='Внутренняя ошибка сервера')
    finally:
        if conn:
            conn.close()
