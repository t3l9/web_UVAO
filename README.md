# web_UVAO

### Created by tel9 & GNAVA4

Система аналитики для Префектуры ЮВАО г. Москвы. Автоматически собирает данные с порталов (Монитор Мэра, Наш Город, МЖИ, ОАТИ, ЦАФАП), обрабатывает их через Excel/Word, публикует отчёты в формате PDF/XLSX и предоставляет доступ через защищённый веб-интерфейс.

---

## Стек технологий

| Слой              | Технология                                              |
|-------------------|---------------------------------------------------------|
| Frontend          | React 18, TypeScript, Vite, Tailwind CSS                |
| Backend           | Python 3.11+, FastAPI, Uvicorn                          |
| Auth              | JWT (python-jose HS256), bcrypt (passlib)               |
| Rate limiting     | slowapi                                                 |
| Базы данных       | SQLite (`BD_work`, `requests.db`)                       |
| Excel/Word        | win32com (COM-автоматизация), openpyxl, pandas          |
| Браузерная авт.   | Selenium 4, webdriver-manager, ChromeDriver             |
| Планировщик       | schedule + threading (фоновые потоки)                   |
| Деплой            | SSH + SCP (paramiko), nginx, Let's Encrypt              |
| Мессенджер        | TDM (корпоративный мессенджер Москвы)                   |

---

## Структура проекта

```
web_UVAO/
├── run.py                   Точка входа: запускает FastAPI + туннель + планировщик
├── deploy_full.py           Сборка React и деплой frontend на сервер
├── deploy_full.bat          Запуск деплоя из Windows
├── .env                     Секреты (не попадает в git)
│
├── backend/
│   ├── main.py              FastAPI app, роутеры, slowapi middleware
│   ├── config.py            Все константы и пути — читаются из .env
│   ├── scheduler.py         Планировщик: запускает парсеры по расписанию
│   ├── tunnel.py            Менеджер SSH reverse-туннеля
│   ├── requirements.txt
│   │
│   ├── parsers/             Парсеры — скрапят порталы, генерируют Excel/PDF
│   │   ├── mm.py            Монитор Мэра
│   │   ├── ng.py            Наш Город
│   │   ├── mwi.py           СВОД МЖИ
│   │   ├── mwis.py          Статистика МЖИ
│   │   ├── tsafap.py        Нарушения ЦАФАП
│   │   ├── oati.py          Нарушения ОАТИ (использует парсер ЦАФАП)
│   │   └── transfers.py     Статистика переносов
│   │
│   ├── routers/             HTTP-маршруты
│   │   ├── auth.py          POST /api/auth/login → JWT
│   │   ├── reports.py       Статус, архив, файлы, раздача отчётов
│   │   ├── statistics.py    Переносы, графики, диапазон дат
│   │   ├── overdue.py       Последний визит, удаление просрочек (MM_prosrok)
│   │   ├── ng_overdue.py    Дашборд просроков «Наш Город» (NG_prosrok)
│   │   ├── admin.py         CRUD пользователей, запуск отчётов
│   │   └── schemas.py       Pydantic-модели запросов
│   │
│   ├── utils/
│   │   ├── auth.py          bcrypt, JWT, Depends(get_current_user/admin)
│   │   ├── helpers.py       Excel, SCP-загрузка, Telegram, ChromeDriver
│   │   ├── limiter.py       slowapi Limiter (rate limiting)
│   │   └── status.py        Состояние и статус генерации отчётов
│   │
│   ├── public/              Сгенерированные отчёты (MM, NG, MWI, MWIS, Pref, OATI, TSAFAP)
│   └── Databases/           SQLite базы данных
│
└── frontend/
    ├── src/
    │   ├── components/      React-компоненты (Dashboard, AdminPanel, ReportViewer и др.)
    │   ├── utils/api.ts     Axios-инстанс с Bearer-токеном + fetchWithAuth
    │   ├── types.ts         TypeScript-типы
    │   └── App.tsx          Роутинг, управление сессией
    ├── public/
    │   ├── baza/            Файлы базы знаний (PDF, docx, xlsx)
    │   └── files/           Скрипты ответов (xlsx)
    └── dist/                Сборка (генерируется при npm run build)
```

---

## Безопасность

| Механизм               | Реализация                                                         |
|------------------------|--------------------------------------------------------------------|
| Аутентификация         | JWT HS256, срок действия 8 часов                                   |
| Хэширование паролей    | bcrypt; автоматическая миграция со старых SHA-256 хэшей при входе  |
| Rate limiting          | 10 запросов/мин на `/api/auth/login` (slowapi)                     |
| Защита от timing-атак  | `hmac.compare_digest` при сравнении устаревших SHA-256 хэшей       |
| Авторизация            | `Depends(get_current_user)` / `Depends(get_current_admin)` на всех защищённых маршрутах |
| Пароли в ответах       | Хэши паролей не возвращаются ни в одном API-ответе                 |
| 500-ошибки             | Клиент получает только "Внутренняя ошибка сервера", детали — в логах |
| Секреты                | Все ключи, токены и пароли в `.env`, не попадают в git             |

---

## Производственная архитектура

```
Браузер
  └── nginx (analytics-uvao.ru, HTTPS/443)
       ├── /              → /var/www/dist     (React SPA)
       ├── /reports/*     → /var/www/reports/ (отчёты, статические файлы)
       └── /api/*         → 127.0.0.1:5000   (FastAPI через SSH reverse-туннель)
                                                      |
                                             Windows-машина
                                             ├── FastAPI (порт 5000)
                                             ├── Планировщик парсеров
                                             └── SSH reverse-туннель → сервер
```

Парсеры запускаются на Windows (требуют Excel/Word + Selenium). После генерации файлы копируются по SCP в `/var/www/reports/` на сервере.

---

## Дашборд просроков «Наш Город»

Аналог дашборда просроков ММ, но на уровне отдельных сообщений портала «Наш Город», с автоматическим трекингом статуса между выгрузками.

**Источник данных.** Каждый запуск `ng()` (раз в час) после построения финальной таблицы «Ответы в работе» (`process_ng_prosroki_file` в [backend/parsers/ng.py](backend/parsers/ng.py)) синхронизирует её построчно в таблицу `NG_prosrok` (БД `BD_work`, файл `backend/Databases/BD_work`).

**Уникальность.** Строки идентифицируются по `Номер заявки` — `UPSERT` (`INSERT ... ON CONFLICT(ID) DO UPDATE`), повторов быть не может.

**Правило 8 рабочих дней.** День (`1 день` … `8 день` либо `Просрок`) вычисляется не отдельной логикой, а напрямую из тех же дат (`day_8…day_5, date4…date1`), которые парсер уже считает для сводных Excel-листов — с учётом `excluded_dates` (выходные/праздники из [backend/config.py](backend/config.py)). Это гарантирует, что день в дашборде всегда совпадает с днём в Excel-отчёте.

**Статус.** При каждой синхронизации:
- сообщение есть в текущей выгрузке → `Статус = В работе`;
- сообщение было в БД, но отсутствует в текущей выгрузке → `Статус = Устранено` (запись не удаляется, только помечается).

**Пустой «Просрок (Монитор)».** На уровне API (`GET /api/ng_overdue`) пустое значение заменяется на `Нет признака`.

**Подсветка в интерфейсе** ([frontend/src/components/Analytics/NgOverdueDashboard.tsx](frontend/src/components/Analytics/NgOverdueDashboard.tsx)):
- `Просрок` — пастельный красный (более насыщенный);
- `6–8 день` — пастельный красный (мягче);
- остальные дни — без подсветки.

Доступ к разделу — только пользователям с `duty = 'Префектура'`, как и у дашборда просроков ММ.

---

## Переменные окружения (.env)

```env
# Парсеры
LOGIN_NG=...
PASSWORD_NG=...
LOGIN_MM=...
PASSWORD_MM=...
LOGIN_TSAFAP=...
PASSWORD_TSAFAP=...

# JWT — сгенерировать: python -c "import secrets; print(secrets.token_hex(32))"
JWT_SECRET_KEY=...

# TDM (корпоративный мессенджер)
TDM_TOKEN=...
TDM_REPORT_GROUP_ID=...
TDM_REST_URL=https://api.tdm.mos.ru
TDM_FILE_UPLOAD_URL=https://fileupload.tdm.mos.ru

# Сервер
SERVER_IP=...
SERVER_USER=root
REMOTE_REPORTS_PATH=/var/www/reports
```

---

## Запуск

### Backend

```bash
pip install -r backend/requirements.txt
python run.py
```

API: `http://localhost:5000`
Документация (Swagger): `http://localhost:5000/docs`

### Frontend (разработка)

```bash
cd frontend
npm install
npm run dev
```

Дев-сервер: `http://localhost:5173`
Запросы к `/api` проксируются на порт 5000.

### Деплой на сервер

```bash
python deploy_full.py
```

Выполняет: `npm run build` → очистка → загрузка `dist/` по SCP → перезапуск nginx.

---

## API

| Метод  | Путь                              | Auth          | Описание                               |
|--------|-----------------------------------|---------------|----------------------------------------|
| POST   | `/api/auth/login`                 | —             | Вход, возвращает JWT                   |
| GET    | `/api/report-status`              | —             | Статус последних генераций             |
| GET    | `/api/files`                      | —             | Последние файлы в папке                |
| GET    | `/api/archive`                    | —             | Список архивных отчётов                |
| GET    | `/api/archive/download`           | —             | Скачать файл из архива                 |
| GET    | `/reports/{folder}/{file}`        | —             | Раздача файлов отчётов                 |
| POST   | `/api/update-last-visit`          | user (JWT)    | Обновить время последнего визита       |
| GET    | `/api/transfer-statistics`        | —             | Статистика переносов                   |
| GET    | `/api/transfer-statistics/export` | —             | Экспорт статистики в Excel             |
| GET    | `/api/chart_data`                 | —             | Данные для графиков (MM_prosrok)       |
| GET    | `/api/chart_filters`              | —             | Фильтры для графиков                   |
| GET    | `/api/date_range`                 | —             | Диапазон дат в MM_prosrok              |
| DELETE | `/api/overdue/{id}`               | admin (JWT)   | Удалить просрочку (MM_prosrok)         |
| GET    | `/api/ng_overdue`                 | —             | Сообщения НГ в работе (NG_prosrok)     |
| GET    | `/api/admin/verify`               | admin (JWT)   | Проверить права администратора         |
| POST   | `/api/admin/generate-report`      | admin (JWT)   | Запустить генерацию отчёта вручную     |
| GET    | `/api/admin/users`                | admin (JWT)   | Список пользователей                   |
| POST   | `/api/admin/users`                | admin (JWT)   | Создать пользователя                   |
| PUT    | `/api/admin/users/{id}`           | admin (JWT)   | Обновить пользователя                  |
| DELETE | `/api/admin/users/{id}`           | admin (JWT)   | Удалить пользователя                   |
| GET    | `/api/admin/organizations`        | admin (JWT)   | Список организаций                     |
| GET    | `/api/admin/dutys`                | admin (JWT)   | Список должностей                      |
| GET    | `/api/admin/activity`             | admin (JWT)   | Активность пользователей               |

---

## Требования

- Python 3.11+ (Windows — для Excel/Word автоматизации)
- Node.js 18+
- Google Chrome + ChromeDriver (управляется автоматически через webdriver-manager)
- Настроенный SSH-ключ `~/.ssh/id_ed25519` для деплоя
