import os
import threading
from dotenv import load_dotenv

load_dotenv()

# Базовая директория проекта
PROJECT_ROOT = os.path.dirname(os.path.abspath(__file__))
# Базовая директория, где находятся папки NG, MWI, MM, Pref, MWIS
BASE_DIR = os.path.join(PROJECT_ROOT, 'public')
# Пути к базам данных SQLite
DATABASE_PATH = os.path.join(PROJECT_ROOT, 'Databases', 'BD_work')  # Основная БД
DB_DELAYS_PATH = os.path.join(PROJECT_ROOT, 'Databases', 'requests.db')  # БД для переносов
# Получаем домашнюю директорию пользователя
home_dir = os.path.expanduser("~")
# Путь к папке загрузок
directory = os.path.join(home_dir, "Downloads")

excluded_dates = [
    # Майские праздники (1-3 мая и 9-11 мая)
    "01.05.2026", "02.05.2026", "03.05.2026",
    "09.05.2026", "10.05.2026", "11.05.2026",
    # Май (добавлены только неохваченные)
    "16.05.2026", "17.05.2026", "23.05.2026", "24.05.2026", "30.05.2026", "31.05.2026",
    # Июнь (добавлены только неохваченные)
    "06.06.2026", "07.06.2026", "20.06.2026", "21.06.2026", "27.06.2026", "28.06.2026", "12.06.2026", "13.06.2026", "14.06.2026",
    # Июль
    "04.07.2026", "05.07.2026", "11.07.2026", "12.07.2026", "18.07.2026", "19.07.2026", "25.07.2026", "26.07.2026",
    # Август
    "01.08.2026", "02.08.2026", "08.08.2026", "09.08.2026", "15.08.2026", "16.08.2026", "22.08.2026", "23.08.2026",
    "29.08.2026", "30.08.2026",
    # Сентябрь
    "05.09.2026", "06.09.2026", "12.09.2026", "13.09.2026", "19.09.2026", "20.09.2026", "26.09.2026", "27.09.2026",
    # Октябрь (добавлены только неохваченные)
    "10.10.2026", "11.10.2026", "17.10.2026", "18.10.2026", "24.10.2026", "25.10.2026",
    # Ноябрь (добавлены только неохваченные)
    "14.11.2026", "15.11.2026", "21.11.2026", "22.11.2026", "28.11.2026", "29.11.2026",
    # Декабрь
    "05.12.2026", "06.12.2026", "12.12.2026", "13.12.2026", "19.12.2026", "20.12.2026", "26.12.2026", "27.12.2026",
    # Канун Нового 2027 года
    "31.12.2026"
]

# Конфигурация
REPORTS_CONFIG = {
    'server_ip': "5.129.206.66",
    'server_user': "root",
    'ssh_key': os.path.join(os.path.expanduser("~"), '.ssh', 'id_ed25519'),
    'remote_reports_path': "/var/www/reports",  # Путь к папке отчётов на сервере
}

login_NG = os.environ['LOGIN_NG']
password_NG = os.environ['PASSWORD_NG']
login_MM = os.environ['LOGIN_MM']
password_MM = os.environ['PASSWORD_MM']
login_TSAFAP = os.environ['LOGIN_TSAFAP']
password_TSAFAP = os.environ['PASSWORD_TSAFAP']

# Список логинов с правами администратора
ADMIN_LOGINS = [
    "Admin1",  # Главный администратор
    # Добавьте другие логины здесь:
    # "username1",
    # "username2",
]

_REPORT_KEYS = ('mm', 'ng', 'mwi', 'mwis', 'tsafap', 'oati')

# Защита от параллельных запусков одного оркестратора
_running = {k: False for k in _REPORT_KEYS}

# Кэш для /api/report-status (TTL 30 сек)
_status_cache: dict = {'data': None, 'ts': 0.0}

# Telegram / file-upload constants
REPORT_GROUP_ID = 3154843254637819
TOKEN = ''
rest = 'https://api.tdm.mos.ru'
FILE_UPLOAD_URL = 'https://fileupload.tdm.mos.ru'
