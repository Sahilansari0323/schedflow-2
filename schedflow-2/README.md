# SchedFlow

Web-based academic scheduling platform for colleges: a public timetable viewer for students and a secure admin portal for managing teachers, subjects, semesters, sections, rooms/labs, and timetables — with conflict detection and publishing.

## Stack

| Layer     | Technology |
|-----------|------------|
| Frontend  | React 18 + Vite + Tailwind CSS + React Router + Framer Motion |
| Backend   | FastAPI (Python) + SQLAlchemy 2 |
| Database  | MySQL 8 (any SQLAlchemy URL works — SQLite for quick local dev) |
| Auth      | JWT (Bearer tokens, bcrypt password hashing) |



## How to run the project:
# One-time setup (already done on this machine, needed only on a fresh clone):
cd backend
python -m venv .venv
.venv\Scripts\pip install -r requirements.txt
copy .env.example .env
## Terminal 1 — start the API:
cd backend
.venv\Scripts\python -m uvicorn app.main:app --reload
## Terminal 2 — start the frontend:
cd frontend
npm install   # first time only
npm run dev


# Terminal 1
cd backend && .venv\Scripts\python -m uvicorn app.main:app --reload
# Terminal 2
cd frontend && npm run dev





## Quick start (local development)
1. **Backend** (FastAPI on port 8000):

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows
pip install -r requirements.txt
copy .env.example .env            # defaults to a local SQLite file for dev
uvicorn app.main:app --reload
```

> For real MySQL, set `DATABASE_URL=mysql+pymysql://user:pass@localhost:3306/schedflow?charset=utf8mb4` in `backend/.env`.
> Tables are created and demo data is seeded automatically on first start.

2. **Frontend** (Vite dev server on port 5173, proxies `/api` to the backend):

```bash
cd frontend
npm install
npm run dev
```

3. Open **http://localhost:5173**

- Landing page: `/`
- Student/Visitor timetable view: `/timetable`
- Admin login: `/admin/login` — default credentials (override via `ADMIN_EMAIL` / `ADMIN_PASSWORD`):

```
Email:    admin@schedflow.edu
Password: admin123
```

API docs: http://localhost:8000/docs

## Features (V1)

### Landing page
Professional marketing-style landing with animated hero, feature showcase, workflow section, and calls to action for the public timetable viewer and the admin portal.

### Student / Visitor side
- Pick department → semester → section and view the **latest published** timetable (Mon–Sat, 8 periods) with subject, teacher, and room.
- No login required.

### Admin portal (JWT-protected)
- **Dashboard:** animated stat cards, teacher weekly-load bars, recent timetables.
- **Teachers:** CRUD, max weekly load cap, per-slot unavailability grid, workload tracking.
- **Subjects:** CRUD with hours/week and "requires lab" flag.
- **Semesters / Sections / Rooms & Labs:** CRUD with per-department scoping.
- **Timetable builder:** click any day×period cell to assign subject/teacher/room; edit or clear slots.
- **Publishing:** validate-then-publish flow; published versions become visible on the public view; version counter increments per publish.

### Conflict detection
When a slot is saved and again before publishing, the system checks **across all timetables**:
- Teacher double-booking (same teacher, same slot)
- Classroom/lab double-booking
- Section double-booking
- Teacher unavailability (slot-level)
- Lab requirement vs room type
- Teacher weekly workload cap

The builder surfaces each conflict with a human-readable message. Publishing is blocked while conflicts exist.

## API overview

Base path `/api`. Interactive docs at `/docs`.

| Method | Path | Auth | Purpose |
|--------|------|------|---------|
| POST | `/auth/login` | – | Get JWT |
| GET | `/public/structure` | – | Departments/semesters/sections tree |
| GET | `/public/timetable` | – | Latest published timetable + entries |
| GET/POST/PUT/DELETE | `/teachers`, `/subjects`, `/semesters`, `/sections`, `/rooms` | JWT | Master data CRUD |
| GET | `/teachers-workload` | JWT | Weekly assigned periods per teacher |
| GET/POST/DELETE | `/timetables` | JWT | Timetable CRUD |
| GET/POST/PUT/DELETE | `/timetables/{id}/entries[...]` | JWT | Slot entries (returns conflicts on save) |
| GET | `/timetables/{id}/validate` | JWT | Full conflict re-validation |
| POST | `/timetables/{id}/publish` | JWT | Publish (blocked on conflicts) |

## Architecture notes (future-proofing)

- **Backend layering:** `app/core` (config/db/security), `app/models.py`, `app/schemas.py`, `app/api` (routers + auth dependency), `app/services` (business logic such as conflict detection). New features (substitutes, analytics, generator) slot in as new routers/services without touching existing ones.
- **Config via environment:** `DATABASE_URL`, `SECRET_KEY`, `ADMIN_*`, `CORS_ORIGINS` are all env-driven — deployment config (AWS, containers, CI/CD) can be added later without code changes.
- **Frontend:** thin API client (`src/api.js`) + page components; routes already split public (`/`, `/timetable`) vs `/admin`.
- Deliberately **not** implemented in V1 (kept for later phases): auto-generation, absence/substitutes, analytics dashboards, version history UI, audit logs, multi-tenancy, containerized deployment.

## Project layout

```
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── main.py            # FastAPI app, routers, startup
│       ├── models.py          # SQLAlchemy models
│       ├── schemas.py         # Pydantic schemas
│       ├── seed.py            # demo data + admin user
│       ├── core/              # config, database, security (JWT)
│       ├── api/               # auth, master data, timetables, public
│       └── services/          # conflict detection
└── frontend/
    └── src/
        ├── api.js, auth.jsx, App.jsx
        ├── components/        # Layout, Modal, TimetableGrid, landing sections
        └── pages/             # Landing, PublicView, Login, Dashboard, Teachers,
                               # Subjects, Semesters, Sections, Rooms,
                               # Timetables, Builder
```
