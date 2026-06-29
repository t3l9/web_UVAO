# web_UVAO
### Created by tel9

Система аналитики для ЮВАО Москвы. Автоматически собирает данные с порталов («Монитор Мэра», «Наш Город», МЖИ, ОАТИ, ЦАФАП), строит отчёты Excel/PDF и раздаёт их через веб-интерфейс.

---

## Структура проекта

```
web_UVAO/
├── frontend/               React + TypeScript + Vite
│   ├── src/
│   ├── public/             Статика (логотип, PDF-документы)
│   ├── dist/               Сборка (генерируется при npm run build)
│   ├── package.json
│   └── vite.config.ts
│
├── backend/                FastAPI + Python (пакет)
│   ├── main.py             Точка входа: FastAPI app, роутеры, запуск uvicorn
│   ├── config.py           Константы, пути, переменные окружения
│   ├── tunnel.py           Менеджер SSH туннеля
│   ├── scheduler.py        Планировщик задач (schedule)
│   ├── requirements.txt
│   │
│   ├── parsers/            Парсеры и обработчики отчётов
│   │   ├── mm.py           Монитор Мэра
│   │   ├── ng.py           Наш Город
│   │   ├── mwi.py          СВОД МЖИ
│   │   ├── mwis.py         Статистика МЖИ
│   │   ├── tsafap.py       Нарушения ЦАФАП
│   │   ├── oati.py         Нарушения ОАТИ
│   │   └── transfers.py    Статистика переносов
│   │
│   ├── routers/            API-маршруты
│   │   ├── schemas.py      Pydantic-модели запросов
│   │   ├── auth.py         POST /api/auth/login
│   │   ├── reports.py      Статус отчётов, архив, файлы
│   │   ├── statistics.py   Переносы, графики, диапазон дат
│   │   ├── overdue.py      Просрочки, последний визит
│   │   └── admin.py        Панель администратора
│   │
│   ├── utils/              Вспомогательные утилиты
│   │   ├── helpers.py      Excel, SCP, Telegram, ChromeDriver
│   │   ├── status.py       Failure state, статус отчётов
│   │   └── auth.py         Хэш пароля, проверка прав
│   │
│   ├── public/             Сгенерированные отчёты (MM, NG, MWI, MWIS, Pref, OATI, TSAFAP)
│   └── Databases/          SQLite базы данных
│
├── deploy_full.py          Сборка React и деплой на сервер
├── deploy_full.bat         Запуск деплоя из Windows
└── nginx_config.txt        Конфиг nginx для справки
```

---

## Технологический стек

| Слой | Технология |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| Backend | Python 3.11+, FastAPI, uvicorn |
| Базы данных | SQLite (`BD_work`, `requests.db`) |
| Автоматизация | win32com (Excel/Word), Selenium (браузер) |
| Планировщик | `schedule` (фоновый поток) |
| Деплой | SSH + SCP, nginx |

---

## Запуск

### Backend

```bash
cd backend
pip install -r requirements.txt
python -m backend.main
```

API поднимается на `http://localhost:5000`.  
Документация: `http://localhost:5000/docs`

### Frontend (разработка)

```bash
cd frontend
npm install
npm run dev
```

Дев-сервер на `http://localhost:5173`. Запросы к `/api` проксируются на порт 5000.

### Frontend (сборка для деплоя)

```bash
cd frontend
npm run build
```

Собранные файлы — в `frontend/dist/`.

---

## Деплой на сервер

```bash
python deploy_full.py
```

Скрипт выполняет:
1. `npm run build` в папке `frontend/`
2. Очищает папки отчётов из `dist/` (они раздаются через backend)
3. Загружает `dist/` по SCP на сервер
4. Перезапускает nginx

Отчёты (`backend/public/`) деплоятся **отдельно** — автоматически из `app.py` после каждого парсинга через `upload_reports_to_server()`.

---

## API

Все эндпоинты доступны по `http://localhost:5000/api/...`.  
Интерактивная документация: `http://localhost:5000/docs`

| Метод | Путь | Описание |
|---|---|---|
| GET | `/api/report-status` | Статус последних отчётов |
| GET | `/api/transfer-statistics` | Статистика переносов |
| GET | `/api/transfer-statistics/export` | Экспорт статистики в Excel |
| POST | `/api/auth/login` | Авторизация |
| GET | `/api/archive` | Список архивных отчётов |
| GET | `/api/archive/download` | Скачать файл из архива |
| GET | `/api/files` | Последние файлы в папке |
| POST | `/api/update-last-visit` | Обновить время последнего визита |
| GET | `/api/chart_data` | Данные для графиков (MM_prosrok) |
| GET | `/api/chart_filters` | Фильтры для графиков |
| DELETE | `/api/overdue/{id}` | Удалить просрочку (только admin) |
| GET | `/api/date_range` | Диапазон дат в MM_prosrok |
| POST | `/api/admin/verify` | Проверить права администратора |
| POST | `/api/admin/generate-report` | Запустить генерацию отчёта вручную |
| GET | `/api/admin/users` | Список пользователей |
| POST | `/api/admin/users` | Создать пользователя |
| PUT | `/api/admin/users/{id}` | Обновить пользователя |
| DELETE | `/api/admin/users/{id}` | Удалить пользователя |
| GET | `/api/admin/organizations` | Список организаций |
| GET | `/api/admin/dutys` | Список должностей |
| GET | `/api/admin/activity` | Активность пользователей |

---

## Требования

- Python 3.11+
- Node.js 18+
- Windows (backend использует win32com для автоматизации Excel/Word)
- Настроенный SSH-ключ для деплоя (`~/.ssh/id_ed25519`)

