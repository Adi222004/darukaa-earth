# Darukaa.Earth

A full-stack geospatial analytics platform for managing and visualizing carbon and biodiversity projects.

Built as a submission for the **Darukaa.Earth Full-Stack Developer Hackathon**.

---

## Live Demo

**URL:** *[paste the Vercel URL here after deployment]*

**Demo credentials:**

| Field    | Value              |
| -------- | ------------------ |
| Email    | `demo@darukaa.com` |
| Password | `password123`      |

**What you can do in the demo:**

1. Log in with the credentials above.
2. See all 3 projects and 6 sites on a satellite map.
3. Click any polygon to see the site name and area.
4. Navigate to a site to view 12 months of carbon and biodiversity analytics.

---

## Screenshots

> Add screenshots to `docs/screenshots/` and reference them here.

* `docs/screenshots/login.png` — Login page
* `docs/screenshots/dashboard.png` — Dashboard with map and site polygons
* `docs/screenshots/site-detail.png` — Site detail with performance chart

---

## 1. High-Level Architecture

```text
┌────────────────────┐         ┌─────────────────────┐
│   React (Vite)     │  HTTPS  │   FastAPI (Python)  │
│  ────────────────  │ ──────► │  ───────────────    │
│  • React Router    │  JWT    │  • SQLAlchemy ORM   │
│  • Axios           │         │  • JWT auth         │
│  • Mapbox GL JS    │         │  • GeoAlchemy2      │
│  • Chart.js        │         │  • Pydantic         │
└────────────────────┘         └──────────┬──────────┘
                                          │
                                ┌──────────▼──────────┐
                                │ PostgreSQL+PostGIS  │
                                │  ───────────────    │
                                │  • users            │
                                │  • projects         │
                                │  • sites (POLYGON)  │
                                │  • site_metrics     │
                                └─────────────────────┘
```

### Request flow

1. User authenticates via `POST /api/auth/login` and receives a JWT.
2. The frontend stores the token in `localStorage` and sends it as `Authorization: Bearer <token>` on every request via an Axios interceptor.
3. The backend validates the token, resolves the current user, and scopes every query to that user's projects.
4. Sites are stored as PostGIS `POLYGON` geometries (SRID 4326). Area is computed server-side using `ST_Area(ST_GeogFromText(...))` for spheroidal accuracy.
5. The frontend renders sites as GeoJSON polygons on Mapbox GL JS and site metrics as Chart.js line charts.

### Stack

| Layer              | Technology                                               |
| ------------------ | -------------------------------------------------------- |
| Frontend framework | React 18 (Vite)                                          |
| Mapping            | Mapbox GL JS + `react-map-gl` + `@mapbox/mapbox-gl-draw` |
| Charting           | Chart.js via `react-chartjs-2`                           |
| Backend            | Python 3.11 + FastAPI                                    |
| Database           | PostgreSQL 16 + PostGIS 3.4                              |
| Auth               | JWT (HS256) via `python-jose`                            |
| ORM                | SQLAlchemy + GeoAlchemy2                                 |
| Migrations         | Alembic                                                  |
| CI/CD              | GitHub Actions                                           |
| Deployment         | Render (backend), Vercel (frontend), Neon (DB)           |

---

## 2. Database Schema

### `users`

| Column            | Type                      | Notes            |
| ----------------- | ------------------------- | ---------------- |
| `id`              | UUID                      | Primary key      |
| `email`           | varchar (unique, indexed) | Login identifier |
| `hashed_password` | varchar                   | bcrypt hash      |
| `created_at`      | timestamp                 |                  |

### `projects`

| Column        | Type      | Notes                               |
| ------------- | --------- | ----------------------------------- |
| `id`          | UUID      | Primary key                         |
| `name`        | varchar   |                                     |
| `description` | text      | nullable                            |
| `owner_id`    | UUID      | FK → `users.id` (ON DELETE CASCADE) |
| `created_at`  | timestamp |                                     |

### `sites`

| Column          | Type                      | Notes                                                    |
| --------------- | ------------------------- | -------------------------------------------------------- |
| `id`            | UUID                      | Primary key                                              |
| `project_id`    | UUID                      | FK → `projects.id` (ON DELETE CASCADE)                   |
| `name`          | varchar                   |                                                          |
| `geom`          | `geometry(POLYGON, 4326)` | PostGIS geometry with **GIST index**                     |
| `area_hectares` | float                     | Computed server-side via `ST_Area(ST_GeogFromText(...))` |
| `created_at`    | timestamp                 |                                                          |

### `site_metrics`

| Column               | Type      | Notes                               |
| -------------------- | --------- | ----------------------------------- |
| `id`                 | UUID      | Primary key                         |
| `site_id`            | UUID      | FK → `sites.id` (ON DELETE CASCADE) |
| `recorded_at`        | timestamp |                                     |
| `carbon_tons`        | float     |                                     |
| `biodiversity_index` | float     | Range 0–1                           |

### Design decisions

* **UUID primary keys** — safe to expose in URLs, easy to generate without DB round-trips, no enumeration risk.
* **`geom` as `POLYGON, SRID 4326`** — matches Mapbox/GeoJSON conventions. The GIST index enables fast viewport queries and `ST_Within` filters.
* **`area_hectares` is stored, not computed on read** — avoids recomputing `ST_Area` on every list query. Recomputed only when the geometry changes.
* **Cascade deletes** — deleting a user wipes projects → sites → metrics in a single transaction, keeping the DB consistent.
* **PostGIS system tables** (`spatial_ref_sys`, Tiger geocoder) are excluded from Alembic autogenerate via a custom `include_object` hook.

---

## 3. Local Setup

### Prerequisites

* **Node.js 20+**
* **Python 3.11+**
* **Docker Desktop**
* A free **Mapbox account** for a public access token

### Step 1 — Clone and open

```bash
git clone https://github.com/YOUR_USERNAME/darukaa-earth.git
cd darukaa-earth
```

### Step 2 — Start the database

```bash
docker compose up -d
docker exec -it darukaa_db psql -U darukaa -d darukaa -c "CREATE EXTENSION IF NOT EXISTS postgis;"
docker exec -it darukaa_db psql -U darukaa -d darukaa -c "SELECT PostGIS_Version();"
```

The last command should print a PostGIS version string.

### Step 3 — Backend setup

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS / Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `backend/.env` by copying from `backend/.env.example`:

```env
DATABASE_URL=postgresql+psycopg2://darukaa:darukaa@localhost:5432/darukaa
JWT_SECRET=replace-with-a-long-random-string-at-least-32-chars
CORS_ORIGINS=http://localhost:5173
```

Apply migrations, seed demo data, and start the API:

```bash
alembic upgrade head
python scripts/seed.py
uvicorn app.main:app --reload --port 8000
```

Backend runs on:

```text
http://localhost:8000
```

Interactive API docs:

```text
http://localhost:8000/docs
```

### Step 4 — Frontend setup

Open a **new terminal**:

```bash
cd frontend
npm install
```

Create `frontend/.env` by copying from `frontend/.env.example`:

```env
VITE_API_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token_here
```

Start the development server:

```bash
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

### Step 5 — Log in

```text
Email:    demo@darukaa.com
Password: password123
```

---

## 4. CI/CD Pipeline

The project uses **GitHub Actions** for continuous integration and **platform deploy hooks** for continuous deployment.

### `.github/workflows/backend.yml`

**Triggers:** push to `main` when `backend/**` changes, plus all pull requests.

**Steps:**

1. Spin up a `postgis/postgis:16-3.4` service container.
2. Install Python 3.11 and dependencies from `requirements.txt`.
3. Run `ruff check .` and `black --check .`.
4. Run `pytest` against the live PostGIS service.
5. On a successful `main` build, POST to `RENDER_DEPLOY_HOOK` stored as a GitHub secret to trigger a Render deploy.

### `.github/workflows/frontend.yml`

**Triggers:** push to `main` when `frontend/**` changes, plus all pull requests.

**Steps:**

1. Node 20 with npm cache.
2. `npm ci` for reproducible installation from the lockfile.
3. `npm run lint` for ESLint + Prettier checks.
4. `npm run build` to verify the production build.
5. Vercel's GitHub integration auto-deploys on green `main` builds.

### Pre-commit hooks

The project uses Husky + lint-staged and pre-commit.

* **Husky + lint-staged** at the repo root — runs on every `git commit`:

  * Prettier formats `frontend/**/*.{js,jsx,json,css,md}`.
  * ESLint auto-fixes JS/JSX issues.
* **pre-commit** for Python — runs on every `git commit`:

  * Ruff lint + auto-fix.
  * Black formatting.
  * Trailing whitespace removal.
  * End-of-file fixer.
  * Private key detection.

### Install locally once after cloning

```bash
npm install
npx husky init

cd backend
pre-commit install
```

CI re-runs the same checks on every push, so bypassing hooks locally with `--no-verify` won't get past the pipeline.

---

## 5. Trade-offs

Documented technical decisions and their reasoning:

### FastAPI over Flask / Django

FastAPI gives us Pydantic request validation, automatic OpenAPI docs, and async endpoints out of the box. Flask would need all three bolted on. Django is heavyweight for an API-only service; SQLAlchemy + Alembic covers the same ground without the framework overhead.

### SQLAlchemy + GeoAlchemy2 over raw SQL

GeoAlchemy2 integrates PostGIS types cleanly with the ORM — typed `Geometry` columns, `from_shape` / `to_shape` helpers, and Alembic autogenerate support.

Trade-off: autogenerate needs a small `include_object` hook to skip PostGIS system tables, and the spatial index must be created explicitly (`spatial_index=False` on the column plus a manual `op.create_index`).

### Mapbox GL JS over Leaflet

Mapbox offers vector tiles, WebGL rendering, satellite basemaps, and a first-class draw plugin (`@mapbox/mapbox-gl-draw`) which made the polygon-drawing flow straightforward.

Trade-off: requires an API token and has a slightly steeper API.

### Chart.js over Highcharts

Chart.js is MIT-licensed; Highcharts requires a commercial license for non-personal use.

The chart types we need, including dual-axis lines with fill, are supported natively by Chart.js.

Trade-off: fewer chart types than Highcharts if the product later needs candlestick charts or heatmaps.

### Area computed server-side in PostGIS

Computing polygon area in JavaScript in degrees is geometrically meaningless. Casting to `geography` and using `ST_Area(ST_GeogFromText(...))` gives metres² on the WGS84 ellipsoid.

Trade-off: one extra DB round-trip per site creation — acceptable since site creation is not a hot path.

### JWT in `localStorage` over HTTP-only cookies

This is simpler for a hackathon submission: no CSRF token machinery, no refresh-token flow, and it works with the fetch/axios pattern.

Trade-off: XSS exposure. For production, we would switch to short-lived access tokens + refresh cookies with `HttpOnly` + `SameSite=Strict`.

### UUID primary keys

Non-sequential, non-guessable, safe to expose in URLs.

Trade-off: 16 bytes versus 4 bytes for integers, and slightly larger indexes — negligible at this scale.

### Single monorepo (`backend/` + `frontend/`)

Enables atomic commits across the API contract and its consumer, one CI dashboard, and one clone.

Trade-off: requires careful CI path filtering (`paths:` on workflow triggers) so backend changes don't re-run frontend builds, and vice versa.

---

## 6. Repository Structure

```text
darukaa-earth/
├── .github/
│   └── workflows/
│       ├── backend.yml              # Backend CI + Render deploy hook
│       └── frontend.yml             # Frontend CI + Vercel build check
├── .husky/
│   └── pre-commit                   # Runs lint-staged on every commit
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py              # POST /register, POST /login
│   │   │   ├── projects.py          # CRUD /api/projects
│   │   │   └── sites.py             # CRUD /api/sites (GeoJSON + metrics)
│   │   ├── __init__.py
│   │   ├── config.py                # Pydantic Settings (env vars)
│   │   ├── database.py              # SQLAlchemy engine + session
│   │   ├── models.py                # User, Project, Site, SiteMetric
│   │   ├── schemas.py               # Pydantic request/response schemas
│   │   ├── security.py              # bcrypt + JWT
│   │   ├── deps.py                  # get_current_user dependency
│   │   └── main.py                  # FastAPI app + CORS + routers
│   ├── alembic/                     # DB migrations
│   ├── scripts/
│   │   └── seed.py                  # Demo data seeder
│   ├── tests/                       # Pytest suite
│   ├── Dockerfile                   # Production image for Render
│   ├── requirements.txt
│   ├── pyproject.toml               # Ruff + Black config
│   └── .env.example
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js            # Axios + JWT interceptor
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Global auth state
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── MapView.jsx          # Mapbox GL map with sites
│   │   │   ├── DrawControl.jsx      # Polygon drawing plugin
│   │   │   └── MetricsChart.jsx     # Chart.js line chart
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx        # Projects + all-sites map
│   │       └── SiteDetail.jsx       # Chart + mini-map for one site
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   └── screenshots/
├── docker-compose.yml               # Local PostGIS container
├── .pre-commit-config.yaml          # Ruff + Black + hygiene hooks
├── .gitignore
└── README.md
```

---

## 7. Datasets

The seed script (`backend/scripts/seed.py`) inserts demo data using **real coordinates** for three Indian ecosystems:

* **Western Ghats** — evergreen forest restoration (Kodagu, Agumbe)
* **Sundarbans** — mangrove blue carbon (Core Zone, Buffer Zone)
* **Aravalli** — dry deciduous restoration (Alwar, Sariska)

**Why real coordinates:** they exercise PostGIS's spheroidal area computation meaningfully and produce a visually sensible map, with polygons falling in the right regions rather than on blank ocean.

**Why synthetic metrics:** the platform is designed to accept arbitrary time-series data. Generating 12 months of carbon and biodiversity readings in the seed script keeps the repository self-contained — no external API keys, no network dependency, and a fresh clone is instantly demo-able.

**How to swap in real data:** replace `scripts/seed.py` with a loader for a real dataset. Compatible sources include Global Forest Watch, NASA FIRMS, and the India Biodiversity Portal. The schema (`site_metrics.recorded_at`, `carbon_tons`, `biodiversity_index`) already accommodates any tabular time-series.

---

## 8. License

Unpublished. Built as a hackathon submission for Darukaa.Earth.
