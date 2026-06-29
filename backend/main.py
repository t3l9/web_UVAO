import sys
import logging
import threading

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

# Отключаем буферизацию stdout — print() сразу появляется в консоли
sys.stdout.reconfigure(line_buffering=True)

# HTTP-логи uvicorn
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(name)s] %(levelname)s: %(message)s',
    datefmt='%H:%M:%S',
    handlers=[logging.StreamHandler(sys.stdout)],
)
logging.getLogger('uvicorn').setLevel(logging.INFO)
logging.getLogger('uvicorn.access').setLevel(logging.INFO)

app = FastAPI(title='web_UVAO API', version='2.0.0')

app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

# Подключаем все роутеры
from .routers.auth import router as auth_router
from .routers.reports import router as reports_router
from .routers.statistics import router as statistics_router
from .routers.overdue import router as overdue_router
from .routers.admin import router as admin_router

app.include_router(auth_router)
app.include_router(reports_router)
app.include_router(statistics_router)
app.include_router(overdue_router)
app.include_router(admin_router)


def run_app():
    uvicorn.run(app, host='0.0.0.0', port=5000)


if __name__ == '__main__':
    from .tunnel import tunnel_manager
    from .scheduler import run_scheduled_tasks

    # Запуск менеджера SSH туннеля
    tunnel_thread = threading.Thread(
        target=tunnel_manager,
        args=[30],
        daemon=True
    )
    tunnel_thread.start()
    print("✅ [Tunnel] Поток менеджера запущен")

    # Запуск планировщика задач в отдельном потоке
    scheduler_thread = threading.Thread(target=run_scheduled_tasks)
    scheduler_thread.daemon = True
    scheduler_thread.start()

    run_app()
