import sqlite3
import threading
from datetime import datetime

from fastapi import APIRouter, HTTPException

from ..config import DATABASE_PATH
from ..utils.auth import hash_password, verify_admin
from .schemas import AdminVerifyBody, AdminGenerateReportBody, CreateUserBody, UpdateUserBody

router = APIRouter()


@router.post('/api/admin/verify')
def admin_verify(body: AdminVerifyBody):
    try:
        is_admin = verify_admin(body.login)
        return {"is_admin": is_admin}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/admin/generate-report')
def admin_generate_report(body: AdminGenerateReportBody):
    try:
        login_val = body.login
        report_type = body.report_type

        if not login_val or not verify_admin(login_val):
            raise HTTPException(status_code=403, detail='Доступ запрещён')

        from ..parsers.ng import ng
        from ..parsers.mm import mm
        from ..parsers.mwi import mwi
        from ..parsers.mwis import mwis
        from ..parsers.tsafap import tsafap
        from ..parsers.oati import oati

        report_functions = {
            'our-city':         ng,
            'mayor-monitor':    mm,
            'prefect':          ng,
            'mzhi':             mwi,
            'mzhi-statistics':  mwis,
            'tsafap':           tsafap,
            'oati':             oati,
        }

        if report_type not in report_functions:
            raise HTTPException(status_code=400, detail=f'Неизвестный тип отчёта: {report_type}')

        func = report_functions[report_type]
        thread = threading.Thread(target=func, daemon=True)
        thread.start()

        return {'status': 'started', 'message': 'Генерация отчёта запущена в фоне'}

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/admin/users')
def admin_get_users():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                Users.ID,
                Users.Name,
                Users.Login,
                Users.Password,
                Organizations.Org_name,
                Dutys.Duty_name,
                Users.Last_visit
            FROM Users
            LEFT JOIN Organizations ON Users.ID_organization = Organizations.ID_organization
            LEFT JOIN Dutys ON Users.ID_duty = Dutys.ID_duty
            ORDER BY Users.ID
        """)

        users = []
        for row in cursor.fetchall():
            users.append({
                "id": row[0],
                "name": row[1],
                "login": row[2],
                "password": row[3],
                "organization": row[4] or "Не указана",
                "duty": row[5] or "Не указана",
                "last_visit": row[6] or "Никогда"
            })

        conn.close()
        return {"users": users}

    except Exception as e:
        print(f"Error in admin_get_users: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post('/api/admin/users', status_code=201)
def admin_create_user(body: CreateUserBody):
    try:
        name = body.name
        login_val = body.login
        password = body.password
        id_organization = body.id_organization
        id_duty = body.id_duty

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT ID FROM Users WHERE Login = ?", (login_val,))
        if cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=400, detail="User with this login already exists")

        hashed_password = hash_password(password)
        current_date = datetime.now().strftime("%d.%m.%Y %H:%M")

        cursor.execute("""
            INSERT INTO Users (Name, Login, Password, ID_organization, ID_duty, Date_of_create)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (name, login_val, hashed_password, id_organization, id_duty, current_date))

        conn.commit()
        new_user_id = cursor.lastrowid
        conn.close()

        return {"message": "User created successfully", "user_id": new_user_id}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in admin_create_user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put('/api/admin/users/{user_id}')
def admin_update_user(user_id: int, body: UpdateUserBody):
    try:
        name = body.name
        login_val = body.login
        password = body.password
        id_organization = body.id_organization
        id_duty = body.id_duty

        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT ID FROM Users WHERE ID = ?", (user_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")

        updates = []
        values = []

        if name is not None:
            updates.append("Name = ?")
            values.append(name)
        if login_val is not None:
            cursor.execute("SELECT ID FROM Users WHERE Login = ? AND ID != ?", (login_val, user_id))
            if cursor.fetchone():
                conn.close()
                raise HTTPException(status_code=400, detail="User with this login already exists")
            updates.append("Login = ?")
            values.append(login_val)
        if password is not None and password != "":
            updates.append("Password = ?")
            values.append(hash_password(password))
        if id_organization is not None:
            updates.append("ID_organization = ?")
            values.append(id_organization)
        if id_duty is not None:
            updates.append("ID_duty = ?")
            values.append(id_duty)

        if updates:
            values.append(user_id)
            query = f"UPDATE Users SET {', '.join(updates)} WHERE ID = ?"
            cursor.execute(query, values)
            conn.commit()

        conn.close()
        return {"message": "User updated successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in admin_update_user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete('/api/admin/users/{user_id}')
def admin_delete_user(user_id: int):
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT ID FROM Users WHERE ID = ?", (user_id,))
        if not cursor.fetchone():
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")

        cursor.execute("DELETE FROM Users WHERE ID = ?", (user_id,))
        conn.commit()
        conn.close()

        return {"message": "User deleted successfully"}

    except HTTPException:
        raise
    except Exception as e:
        print(f"Error in admin_delete_user: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/admin/organizations')
def admin_get_organizations():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT ID_organization, Org_name FROM Organizations ORDER BY Org_name")
        organizations = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]

        conn.close()
        return {"organizations": organizations}

    except Exception as e:
        print(f"Error in admin_get_organizations: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/admin/dutys')
def admin_get_dutys():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("SELECT ID_duty, Duty_name FROM Dutys ORDER BY Duty_name")
        dutys = [{"id": row[0], "name": row[1]} for row in cursor.fetchall()]

        conn.close()
        return {"dutys": dutys}

    except Exception as e:
        print(f"Error in admin_get_dutys: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get('/api/admin/activity')
def admin_get_activity():
    try:
        conn = sqlite3.connect(DATABASE_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                Users.ID,
                Users.Name,
                Users.Login,
                Users.Last_visit,
                Organizations.Org_name,
                Dutys.Duty_name
            FROM Users
            LEFT JOIN Organizations ON Users.ID_organization = Organizations.ID_organization
            LEFT JOIN Dutys ON Users.ID_duty = Dutys.ID_duty
            WHERE Users.Last_visit IS NOT NULL
            ORDER BY Users.Last_visit DESC
        """)

        activities = []
        for row in cursor.fetchall():
            activities.append({
                "id": row[0],
                "name": row[1],
                "login": row[2],
                "last_visit": row[3],
                "organization": row[4] or "Не указана",
                "duty": row[5] or "Не указана"
            })

        conn.close()
        return {"activities": activities}

    except Exception as e:
        print(f"Error in admin_get_activity: {e}")
        raise HTTPException(status_code=500, detail=str(e))
