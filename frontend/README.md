# Darukaa.Earth

> A full-stack geospatial analytics platform for managing and visualizing carbon and biodiversity projects.

Built as a submission for the **Darukaa.Earth Full-Stack Developer Hackathon**.

---

## Live Demo

**Live Application:**
https://darukaa-earth-wheat.vercel.app

### Demo Credentials

| Field    | Value              |
| -------- | ------------------ |
| Email    | `demo@darukaa.com` |
| Password | `password123`      |

### Demo Flow

1. Log in using the demo credentials.
2. View projects and sites on an interactive satellite map.
3. Explore site polygons and their calculated areas.
4. Open an individual site to view carbon and biodiversity analytics.
5. Explore 12 months of site performance data through interactive charts.

---

## Screenshots

### Login

![Darukaa.Earth Login](docs/screenshots/login.png)

### Dashboard

![Darukaa.Earth Dashboard](docs/screenshots/dashboard.png)

### Site Details & Analytics

![Darukaa.Earth Site Details](docs/screenshots/site-detail.png)

---

# Overview

Darukaa.Earth is a full-stack geospatial analytics application designed to help users manage environmental projects and visualize the performance of individual sites.

The platform combines:

- Interactive satellite mapping
- Geospatial polygon management
- Project and site organization
- Carbon metrics
- Biodiversity metrics
- Time-series analytics
- JWT-based authentication
- PostgreSQL + PostGIS
- REST APIs
- Automated testing and CI/CD

The application is built as a single monorepo containing a React frontend and FastAPI backend.

---

# Key Features

## Authentication

- User login using email and password
- JWT-based authentication
- Protected API routes
- Current-user resolution on the backend
- Axios interceptor for authenticated requests

## Project Management

- Project-based organization of environmental sites
- User-specific project access
- Project ownership through database relationships
- Cascade deletion for related project data

## Geospatial Mapping

- Interactive Mapbox satellite map
- Site polygons displayed as GeoJSON
- Polygon drawing support
- Site name and area information
- PostGIS-powered spatial data storage
- Server-side geospatial area calculation

## Environmental Analytics

Each site can contain time-series metrics including:

- Carbon stored in tons
- Biodiversity index
- Monthly recorded measurements
- Historical performance visualization

## Developer Experience

- FastAPI automatic API documentation
- SQLAlchemy ORM
- GeoAlchemy2 for PostGIS integration
- Alembic database migrations
- Pytest test suite
- Ruff and Black
- ESLint and Prettier
- Husky and lint-staged
- GitHub Actions CI/CD

---

# High-Level Architecture

```text
                         HTTPS + JWT
┌─────────────────────┐                 ┌──────────────────────┐
│                     │                 │                      │
│   React 18 / Vite   │ ─────────────► │   FastAPI / Python   │
│                     │                 │                      │
│  • React Router     │                 │  • JWT Authentication│
│  • Axios            │                 │  • Pydantic          │
│  • Mapbox GL JS     │                 │  • SQLAlchemy        │
│  • Chart.js         │                 │  • GeoAlchemy2       │
│                     │                 │                      │
└─────────────────────┘                 └───────────┬──────────┘
                                                    │
                                                    │ SQL
                                                    ▼
                                      ┌─────────────────────────┐
                                      │                         │
                                      │ PostgreSQL + PostGIS    │
                                      │                         │
                                      │  • users                │
                                      │  • projects             │
                                      │  • sites                │
                                      │  • site_metrics         │
                                      │  • POLYGON geometries   │
                                      │                         │
                                      └─────────────────────────┘
Request Flow
User
 │
 ▼
React Frontend
 │
 │ POST /api/auth/login
 ▼
FastAPI Backend
 │
 │ JWT issued
 ▼
Frontend stores token
 │
 │ Authorization: Bearer <token>
 ▼
Protected API endpoints
 │
 ▼
PostgreSQL + PostGIS
 │
 ▼
GeoJSON + Analytics
 │
 ▼
Mapbox + Chart.js
Detailed Flow
The user authenticates through POST /api/auth/login.
The backend validates the credentials and returns a JWT.
The frontend stores the token in localStorage.
Axios automatically attaches the token to authenticated API requests.
FastAPI validates the JWT and resolves the current user.
Database queries are scoped to the authenticated user's projects.
Site geometries are stored as PostGIS polygons using SRID 4326.
Site areas are calculated server-side using PostGIS.
The frontend converts site data to GeoJSON for Mapbox.
Site metrics are displayed using Chart.js time-series charts.
Technology Stack
Layer	Technology
Frontend	React 18 + Vite
Routing	React Router
HTTP Client	Axios
Mapping	Mapbox GL JS
React Mapping	react-map-gl
Polygon Drawing	@mapbox/mapbox-gl-draw
Charts	Chart.js + react-chartjs-2
Backend	Python 3.11 + FastAPI
Validation	Pydantic
ORM	SQLAlchemy
Geospatial ORM	GeoAlchemy2
Database	PostgreSQL 16
Geospatial Database	PostGIS 3.4
Authentication	JWT / HS256
Password Hashing	bcrypt
Migrations	Alembic
Testing	Pytest
Python Linting	Ruff
Python Formatting	Black
Frontend Linting	ESLint
Frontend Formatting	Prettier
Git Hooks	Husky + lint-staged + pre-commit
CI/CD	GitHub Actions
Frontend Deployment	Vercel
Backend Deployment	Render
Database Hosting	Neon
Database Schema

The application uses four primary tables.

Users

Stores authentication and user information.

Column	Type	Description
id	UUID	Primary key
email	varchar	Unique login identifier
hashed_password	varchar	bcrypt password hash
created_at	timestamp	Account creation time
Projects

Stores environmental projects owned by users.

Column	Type	Description
id	UUID	Primary key
name	varchar	Project name
description	text	Optional project description
owner_id	UUID	Foreign key to users.id
created_at	timestamp	Project creation time

Relationship:

User
 │
 └──► Projects
Sites

Stores individual geographical sites belonging to projects.

Column	Type	Description
id	UUID	Primary key
project_id	UUID	Foreign key to projects.id
name	varchar	Site name
geom	geometry(POLYGON, 4326)	PostGIS polygon geometry
area_hectares	float	Server-side calculated area
created_at	timestamp	Site creation time

The geometry column uses a GIST spatial index for efficient spatial queries.

Site Metrics

Stores time-series environmental measurements.

Column	Type	Description
id	UUID	Primary key
site_id	UUID	Foreign key to sites.id
recorded_at	timestamp	Measurement date
carbon_tons	float	Carbon measurement
biodiversity_index	float	Biodiversity score from 0–1

Relationship:

Project
   │
   └──► Sites
           │
           └──► Site Metrics
Database Design Decisions
UUID Primary Keys

UUIDs provide non-sequential identifiers that can safely be exposed through API URLs.

PostGIS Polygon Geometry

Sites use:

geometry(POLYGON, 4326)

This aligns the stored spatial data with GeoJSON and Mapbox conventions.

A GIST index is used for spatial queries.

Server-Side Area Calculation

Polygon area is calculated on the backend using PostGIS rather than calculating it directly in JavaScript.

The implementation uses:

ST_Area(ST_GeogFromText(...))

This allows area calculations using geographic coordinates on the WGS84 ellipsoid.

Stored Area

The calculated area is stored in area_hectares rather than recalculated on every read.

The value is updated when the site's geometry changes.

Cascade Deletes

Database relationships use cascade deletion so related data remains consistent.

For example:

User
 └── Projects
      └── Sites
           └── Site Metrics

Deleting a parent record removes its dependent records in the same transaction.

Local Development
Prerequisites

Install the following:

Node.js 20+
Python 3.11+
Docker Desktop
Mapbox account and public access token
1. Clone the Repository
git clone https://github.com/YOUR_USERNAME/darukaa-earth.git
cd darukaa-earth
2. Start PostgreSQL + PostGIS

Start the database container:

docker compose up -d

Create the PostGIS extension:

docker exec -it darukaa_db psql -U darukaa -d darukaa -c "CREATE EXTENSION IF NOT EXISTS postgis;"

Verify PostGIS:

docker exec -it darukaa_db psql -U darukaa -d darukaa -c "SELECT PostGIS_Version();"

The final command should return the installed PostGIS version.

Backend Setup
3. Create Python Virtual Environment
cd backend
python -m venv .venv
Windows
.venv\Scripts\activate
macOS / Linux
source .venv/bin/activate

Install dependencies:

pip install -r requirements.txt
4. Configure Backend Environment

Create:

backend/.env

Use the following configuration:

DATABASE_URL=postgresql+psycopg2://darukaa:darukaa@localhost:5432/darukaa
JWT_SECRET=replace-with-a-long-random-string-at-least-32-chars
CORS_ORIGINS=http://localhost:5173

For production, use a strong randomly generated JWT secret.

5. Run Database Migrations
alembic upgrade head
6. Seed Demo Data
python scripts/seed.py

The seed script creates demo projects, sites, coordinates, and 12 months of environmental metrics.

7. Start the Backend
uvicorn app.main:app --reload --port 8000

Backend:

http://localhost:8000

Interactive API documentation:

http://localhost:8000/docs
Frontend Setup
8. Install Dependencies

Open a new terminal:

cd frontend
npm install
9. Configure Frontend Environment

Create:

frontend/.env

Add:

VITE_API_URL=http://localhost:8000
VITE_MAPBOX_TOKEN=pk.your_mapbox_public_token_here

Replace the Mapbox placeholder with your public Mapbox access token.

10. Start the Frontend
npm run dev

Frontend:

http://localhost:5173
Demo Login

Use the seeded demo account:

Email:    demo@darukaa.com
Password: password123
CI/CD

The project uses GitHub Actions for continuous integration and deployment hooks for continuous deployment.

Backend Pipeline

Workflow:

.github/workflows/backend.yml
Triggers
Push to main when backend files change
Pull requests
Pipeline
Code Push
   │
   ▼
PostGIS Service Container
   │
   ▼
Python 3.11
   │
   ▼
Install Dependencies
   │
   ▼
Ruff
   │
   ▼
Black Check
   │
   ▼
Pytest
   │
   ▼
Render Deploy Hook

The backend pipeline:

Starts a postgis/postgis:16-3.4 service container.
Installs Python 3.11.
Installs dependencies.
Runs Ruff.
Checks Black formatting.
Runs Pytest against PostGIS.
Triggers the Render deployment hook after a successful main build.
Frontend Pipeline

Workflow:

.github/workflows/frontend.yml
Pipeline
Code Push
   │
   ▼
Node 20
   │
   ▼
npm ci
   │
   ▼
ESLint + Prettier
   │
   ▼
Production Build
   │
   ▼
Vercel Deployment

The frontend pipeline:

Uses Node.js 20.
Uses npm caching.
Runs npm ci.
Runs linting and formatting checks.
Runs the production build.
Vercel's GitHub integration deploys successful main builds.
Pre-Commit Hooks

The project uses:

Husky
lint-staged
pre-commit
Prettier
ESLint
Ruff
Black
Trailing whitespace checks
End-of-file checks
Private key detection
Frontend Hooks

Prettier formats:

frontend/**/*.{js,jsx,json,css,md}

ESLint automatically fixes applicable JavaScript and JSX issues.

Python Hooks

Python commits run:

Ruff
Black
Trailing whitespace check
End-of-file fixer
Private key detection
Install Hooks

From the repository root:

npm install
npx husky init

Then:

cd backend
pre-commit install

CI repeats the important checks on every push.

Technical Trade-offs
FastAPI vs Flask / Django

FastAPI provides:

Request validation through Pydantic
Automatic OpenAPI documentation
Async endpoint support

For this API-focused application, FastAPI keeps the backend lightweight while SQLAlchemy and Alembic provide database functionality.

SQLAlchemy + GeoAlchemy2 vs Raw SQL

GeoAlchemy2 provides clean integration between SQLAlchemy and PostGIS.

Benefits include:

Typed geometry columns
Spatial helper functions
ORM integration
Alembic support

The trade-off is additional configuration around PostGIS system tables and explicit spatial index creation.

Mapbox GL JS vs Leaflet

Mapbox was selected because it provides:

Satellite basemaps
WebGL rendering
Vector tiles
Polygon drawing support

The trade-off is the requirement for a Mapbox API token and a somewhat steeper API.

Chart.js vs Highcharts

Chart.js provides the required chart functionality while using an MIT license.

The project requires:

Time-series line charts
Dual-axis visualization
Filled chart areas

The trade-off is that Chart.js provides fewer specialized chart types than Highcharts.

Server-Side Geospatial Calculations

Calculating polygon areas directly from latitude/longitude values in JavaScript is not appropriate because geographic coordinates are expressed in degrees.

The backend therefore uses PostGIS geographic calculations:

ST_Area(ST_GeogFromText(...))

This provides area measurements in square metres using the WGS84 ellipsoid.

JWT in localStorage

For the hackathon implementation, JWTs are stored in localStorage.

Advantages:

Simple frontend integration
Easy Axios interceptor implementation
No CSRF token machinery required
No refresh-token flow required

Trade-off:

localStorage tokens can be exposed if an XSS vulnerability exists.

For a production implementation, short-lived access tokens with secure HTTP-only refresh cookies would be preferable.

UUID Primary Keys

UUIDs are used instead of sequential integers.

Benefits:

Non-sequential identifiers
Safe to expose through URLs
No simple ID enumeration

Trade-off:

UUIDs consume more storage than integer identifiers and produce somewhat larger indexes.

Monorepo Architecture

The project uses a single repository:

backend/
frontend/

Benefits:

Shared project context
Atomic commits
One CI configuration
Simplified repository setup
Easy coordination between API and frontend changes

The trade-off is the need for CI path filtering so unrelated frontend/backend changes do not unnecessarily trigger each other's workflows.

Repository Structure
darukaa-earth/
│
├── .github/
│   └── workflows/
│       ├── backend.yml
│       └── frontend.yml
│
├── .husky/
│   └── pre-commit
│
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── projects.py
│   │   │   └── sites.py
│   │   │
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── database.py
│   │   ├── models.py
│   │   ├── schemas.py
│   │   ├── security.py
│   │   ├── deps.py
│   │   └── main.py
│   │
│   ├── alembic/
│   ├── scripts/
│   │   └── seed.py
│   ├── tests/
│   ├── Dockerfile
│   ├── requirements.txt
│   ├── pyproject.toml
│   └── .env.example
│
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   │   └── client.js
│   │   │
│   │   ├── context/
│   │   │   └── AuthContext.jsx
│   │   │
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── MapView.jsx
│   │   │   ├── DrawControl.jsx
│   │   │   └── MetricsChart.jsx
│   │   │
│   │   └── pages/
│   │       ├── Login.jsx
│   │       ├── Dashboard.jsx
│   │       └── SiteDetail.jsx
│   │
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── docs/
│   ├── architecture.md
│   ├── database-schema.md
│   └── screenshots/
│       ├── login.png
│       ├── dashboard.png
│       └── site-detail.png
│
├── docker-compose.yml
├── .pre-commit-config.yaml
├── .gitignore
└── README.md
Datasets

The demo seed data uses real geographic coordinates representing three Indian ecosystems.

Western Ghats

Use case: Evergreen forest restoration

Locations include:

Kodagu
Agumbe
Sundarbans

Use case: Mangrove blue carbon

Locations include:

Core Zone
Buffer Zone
Aravalli

Use case: Dry deciduous restoration

Locations include:

Alwar
Sariska
Why Real Coordinates?

Real geographic coordinates allow the application to demonstrate PostGIS spatial functionality using meaningful locations.

They also ensure that the polygons appear in geographically relevant regions on the Mapbox map.

Why Synthetic Metrics?

The platform is designed to accept arbitrary time-series environmental data.

The demo therefore generates 12 months of:

Carbon measurements
Biodiversity measurements

This keeps the repository:

Self-contained
Easy to clone
Independent of external APIs
Immediately demo-able

No external data API is required for the demo.

Using Real Environmental Data

The seed data can be replaced with a real dataset loader.

Potential compatible data sources include:

Global Forest Watch
NASA FIRMS
India Biodiversity Portal

The existing schema is designed to support tabular time-series data through:

site_metrics.recorded_at
site_metrics.carbon_tons
site_metrics.biodiversity_index
API Overview

The backend exposes REST endpoints for authentication, projects, sites, and site metrics.

Authentication
POST /api/auth/register
POST /api/auth/login
Projects
CRUD /api/projects
Sites
CRUD /api/sites

Site APIs support geospatial data and metrics.

API Documentation

When running locally:

http://localhost:8000/docs

FastAPI automatically provides interactive OpenAPI documentation.

Security Considerations

The application includes:

JWT authentication
bcrypt password hashing
Protected API routes
User-scoped database queries
Environment-based secrets
CORS configuration
Private key detection through pre-commit hooks
Production Considerations

For a production deployment, the authentication implementation could be strengthened further by using:

Short-lived access tokens
HTTP-only refresh cookies
SameSite=Strict
Strong production secrets
Additional rate limiting
Comprehensive security headers
More extensive authentication testing
Deployment

The application is structured for separate deployment of the frontend, backend, and database.

Component	Platform
Frontend	Vercel
Backend	Render
Database	Neon
CI/CD	GitHub Actions
Production Frontend
https://darukaa-earth-wheat.vercel.app

The production frontend communicates with the deployed backend through the configured API URL.

Demo Architecture
                    ┌───────────────────────┐
                    │       Vercel          │
                    │   React Frontend      │
                    └───────────┬───────────┘
                                │
                                │ HTTPS
                                ▼
                    ┌───────────────────────┐
                    │       Render          │
                    │   FastAPI Backend     │
                    └───────────┬───────────┘
                                │
                                │ PostgreSQL
                                ▼
                    ┌───────────────────────┐
                    │        Neon           │
                    │ PostgreSQL + PostGIS  │
                    └───────────────────────┘
Project Highlights
Area	Implementation
Authentication	JWT + bcrypt
Geospatial data	PostGIS
Map visualization	Mapbox GL JS
Polygon drawing	Mapbox GL Draw
Analytics	Chart.js
Backend API	FastAPI
Database ORM	SQLAlchemy + GeoAlchemy2
Migrations	Alembic
Testing	Pytest
Code quality	Ruff + Black + ESLint + Prettier
Git hooks	Husky + lint-staged + pre-commit
CI/CD	GitHub Actions
Frontend hosting	Vercel
Backend hosting	Render
Database hosting	Neon
License

Unpublished.

Built as a hackathon submission for Darukaa.Earth.

```
