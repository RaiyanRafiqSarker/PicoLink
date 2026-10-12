# ⚡ PicoLink — High-Performance URL Shortener & Admin Studio
### Built with Django REST Framework (Backend) + Next.js (Frontend) + PostgreSQL + Redis

PicoLink is a high-performance, enterprise-grade URL Shortener and real-time click analytics platform engineered with **Django 6 (Django REST Framework & SimpleJWT)**, **Next.js (App Router, Tailwind CSS, TypeScript)**, **PostgreSQL**, **Redis Cache-Aside**, and an **Asynchronous Click Consumer Worker**.

---

## 🏗️ Architecture Overview

```
                      +---------------------------------------+
                      |       Next.js 15 Frontend Client      |
                      |       (http://localhost:3000)         |
                      +---------------------------------------+
                           |                              |
            Shorten / Stats / Auth               Superuser Admin Panel
                           |                              |
                           v                              v
                      +---------------------------------------+
                      |         Django REST Framework         |
                      |       (http://localhost:8000)         |
                      +---------------------------------------+
                                  |                 |
                   +--------------+                 +---------------+
                   |                                                |
                   v                                                v
          +-------------------+                           +--------------------+
          |    PostgreSQL     |                           |    Redis Cache     |
          |  Sequence Offset  |                           |     url:{code}     |
          |   >= 100,000,000  |                           |  'click_events'    |
          +-------------------+                           +--------------------+
                                                                    |
                                                                    v
                                                          +--------------------+
                                                          | Background Worker  |
                                                          |  (Python Consumer) |
                                                          +--------------------+
```

---

## 🔑 Superuser & Authentication Out-of-the-Box

The system includes pre-configured Superuser support:
* **Username**: `admin`
* **Password**: `admin123456`
* **Email**: `admin@picolink.dev`

### Ways to Manage as Superuser:
1. **Interactive Next.js Admin Console**:
   - Navigate to **[http://localhost:3000/](http://localhost:3000/)**
   - Click the **Superuser Console** tab and sign in.
   - Enjoy real-time search, click statistics, deletion, and one-click URL killswitches.
2. **Native Django Admin**:
   - Access **[http://localhost:8000/admin/](http://localhost:8000/admin/)**
   - Manage URLs, Link Clicks, Users, Groups, and Permissions directly.
3. **CLI Command**:
   ```bash
   cd backend
   venv\Scripts\python.exe manage.py createsuperuser
   ```

---

## 🚀 Key Architectural Features

1. **Base62 Key Generation with Sequence Offset**:
   - Offset sequence starting at `100,000,000` $\rightarrow$ guarantees compact, predictable 5–6 character codes (`6LAze`, etc.).
   - Reversible without collisions.
   - Supports user-defined custom vanity slugs with reserved keyword blocking.
2. **High-Speed Cache-Aside Redirection**:
   - `GET /<short_code>` verifies Redis cache (`url:{code}`) first.
   - Cache hit immediately redirects (HTTP 302) and pushes an asynchronous event to Redis queue (`LPUSH click_events`).
   - Cache miss queries PostgreSQL, caches with 24h TTL, and redirects.
3. **Asynchronous Click Consumer Worker**:
   - `backend/shortener/worker.py` drains `click_events` queue in batches of 50–100 records and bulk-inserts to `link_clicks`.
4. **SSRF Defense Firewall**:
   - Blocks `localhost`, `127.0.0.1`, loopback addresses, private IP subnets (`10.0.0.0/8`, `192.168.0.0/16`, `172.16.0.0/12`), and non-HTTP(S) schemes.
5. **Reserved System Slug Blacklist**:
   - Rejects slugs such as `api`, `admin`, `health`, `dashboard`, `login`, `robots.txt`, etc.

---

## 🛠️ Quickstart Instructions

### 1. Local Development

#### Backend (Django REST Framework):
```bash
cd backend
# Create and activate virtual environment
py -3 -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run migrations and seed superuser
python manage.py migrate
python manage.py init_superuser

# Start Django development server
python manage.py runserver 0.0.0.0:8000
```
Backend runs at: **http://localhost:8000**
Django Admin at: **http://localhost:8000/admin**

#### Frontend (Next.js 15):
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: **http://localhost:3000**

#### Background Click Worker:
```bash
cd backend
venv\Scripts\python.exe shortener/worker.py
```

---

### 2. Full Containerized Deployment (Docker Compose)

To spin up the entire cluster (Django + Next.js + PostgreSQL 16 + Redis 7 + Click Worker):
```bash
docker compose up --build -d
```

---

## 📡 API Reference

| Method | Endpoint | Description |
| :--- | :--- | :--- |
| `POST` | `/api/v1/shorten` | Shorten a long URL (supports `custom_slug` & `expires_in_days`) |
| `GET` | `/<short_code>` | HTTP 302 Redirection & async click dispatch |
| `GET` | `/api/v1/stats/<short_code>` | Real-time analytics (total clicks, referrers, timeline) |
| `GET` | `/healthz` | Liveness probe (PostgreSQL & Redis health check) |
| `POST` | `/api/v1/auth/token` | JWT login (returns `access` & `refresh` tokens) |
| `GET` | `/api/v1/auth/me` | Current authenticated user profile |
| `GET` | `/api/v1/admin/urls` | **(Superuser)** List and search all shortened links |
| `PATCH` | `/api/v1/admin/urls/<id>/toggle` | **(Superuser)** Toggle link active status (killswitch) |
| `DELETE` | `/api/v1/admin/urls/<id>` | **(Superuser)** Permanently delete a link & invalidate cache |

---

## 🧪 Testing

To run the Django test suite:
```bash
cd backend
venv\Scripts\python.exe manage.py test shortener
```
All unit, integration, Base62, SSRF, and superuser authentication tests will execute and validate.
