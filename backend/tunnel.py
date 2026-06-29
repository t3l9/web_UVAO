import os
import subprocess
import time
from datetime import datetime, timedelta

from .config import PROJECT_ROOT


def tunnel_manager(restart_interval_minutes=30):
    """
    Управляет процессом SSH туннеля.
    - Запускает start-ssh-tunnel.bat
    - Перезапускает каждые N минут
    - Перезапускает если процесс упал
    """
    process = None
    next_restart = datetime.now() + timedelta(minutes=restart_interval_minutes)

    print(f"🚀 [Tunnel] Менеджер запущен (перезапуск каждые {restart_interval_minutes} мин)")

    while True:
        # Если процесс не запущен или завершился
        if process is None or process.poll() is not None:
            print("🔄 [Tunnel] Процесс не активен, запускаем...")
            try:
                # Путь к BAT файлу
                bat_path = os.path.join(os.path.expanduser('~'), 'Desktop', 'start-ssh-tunnel.bat')

                if not os.path.exists(bat_path):
                    print(f"❌ [Tunnel] BAT файл не найден: {bat_path}")
                else:
                    process = subprocess.Popen(
                        [bat_path],
                        shell=True,
                        creationflags=subprocess.CREATE_NEW_CONSOLE  # Отдельное окно
                    )
                    print(f"✅ [Tunnel] Туннель запущен (PID: {process.pid})")

            except Exception as e:
                print(f"❌ [Tunnel] Ошибка запуска: {e}")

        # Проверка времени на плановый перезапуск
        if datetime.now() >= next_restart:
            print("⏰ [Tunnel] Плановый перезапуск туннеля...")

            try:
                # Корректное завершение
                if process and process.poll() is None:
                    process.terminate()
                    try:
                        process.wait(timeout=5)
                        print("✅ [Tunnel] Старый процесс завершён")
                    except subprocess.TimeoutExpired:
                        process.kill()
                        print("✅ [Tunnel] Старый процесс уничтожен (timeout)")

                # Запуск нового
                bat_path = os.path.join(PROJECT_ROOT, 'start-ssh-tunnel.bat')
                process = subprocess.Popen(
                    [bat_path],
                    shell=True,
                    creationflags=subprocess.CREATE_NEW_CONSOLE
                )
                next_restart = datetime.now() + timedelta(minutes=restart_interval_minutes)
                print(f"✅ [Tunnel] Туннель перезапущен (след. перезапуск в {restart_interval_minutes} мин)")

            except Exception as e:
                print(f"❌ [Tunnel] Ошибка перезапуска: {e}")

        time.sleep(60)  # Проверка каждую минуту
