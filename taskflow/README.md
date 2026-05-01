# 🚀 TaskFlow — Team Task Manager

A full-stack team task management web app with role-based access control, built with **Node.js + Express + PostgreSQL** (backend) and **React + Vite** (frontend).

---

## 🌐 Live Demo

> **URL:** `https://your-app.railway.app`  
> **Demo Admin:** `admin@demo.com` / `password123`  
> **Demo Member:** `member@demo.com` / `password123`

---

## ✨ Features

### Authentication
- JWT-based signup & login
- Role selection: **Admin** or **Member**
- Protected routes & persistent sessions

### Role-Based Access Control
| Feature | Admin | Member |
|---|---|---|
| View all projects | ✅ | ❌ (own only) |
| Create projects | ✅ | ✅ |
| Delete any project | ✅ | ❌ |
| Manage project members | ✅ | ❌ |
| Create/edit tasks | ✅ | ✅ (in own projects) |
| Update task status | ✅ | ✅ (assigned tasks) |
| Change user roles | ✅ | ❌ |

### Projects
- Create, view, update & delete projects
- Color coding & due dates
- Progress bar (completed tasks / total)
- Member management with project-level roles

### Tasks
- Create tasks with title, description, status, priority, due date & assignee
- Status: `todo` → `in_progress` → `in_review` → `done`
- Priority levels: `low`, `medium`, `high`, `urgent`
- Inline status updates from any view
- Filter by status, priority, project, or "My Tasks"

### Dashboard
- Stats: total tasks, my tasks, overdue, due today
- Status breakdown with progress bars
- Overdue tasks highlight
- My assigned tasks list

### Team
- View all team members
- Admin can change user roles
- Member count stats

---

## 🛠 Tech Stack

**Backend**
- Node.js + Express
- PostgreSQL + Sequelize ORM
- JWT Authentication
- bcryptjs password hashing
- express-validator

**Frontend**
- React 18 + Vite
- React Router v6
- Axios
- Custom CSS (no UI library — fully hand-crafted dark theme)

---

## 📁 Project Structure

```
taskflow/
├── backend/
│   ├── src/
│   │   ├── config/         # DB connection
│   │   ├── controllers/    # Business logic
│   │   ├── middleware/     # Auth middleware
│   │   ├── models/         # Sequelize models
│   │   ├── routes/         # API routes
│   │   └── index.js        # App entry point
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/     # Layout, shared UI
│   │   ├── context/        # Auth & Toast context
│   │   ├── pages/          # All page components
│   │   └── utils/          # API client, helpers
│   ├── .env.example
│   └── package.json
├── railway.toml
├── Procfile
└── README.md
```

---

## ⚙️ Local Setup

### Prerequisites
- Node.js 18+
- PostgreSQL 14+

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/taskflow.git
cd taskflow

# Install backend deps
cd backend && npm install && cd ..

# Install frontend deps
cd frontend && npm install && cd ..
```

### 2. Configure Environment

**Backend** (`backend/.env`):
```env
DATABASE_URL=postgresql://postgres:password@localhost:5432/taskflow
JWT_SECRET=your-super-secret-key-min-32-chars
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:5173
```

**Frontend** (`frontend/.env`):
```env
VITE_API_URL=http://localhost:5000/api
```

### 3. Create Database

```bash
psql -U postgres -c "CREATE DATABASE taskflow;"
```

The app auto-syncs Sequelize models on startup.

### 4. Run Dev Servers

```bash
# Terminal 1 — Backend
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm run dev
```

App runs at: **http://localhost:5173**

---

## 🚂 Deploy on Railway

### Step 1: Create Railway Project
1. Go to [railway.app](https://railway.app) → New Project
2. Connect your GitHub repo

### Step 2: Add PostgreSQL
- Click **+ New** → **Database** → **PostgreSQL**
- Railway auto-sets `DATABASE_URL`

### Step 3: Set Environment Variables
In your service settings → Variables:

```
JWT_SECRET=your-very-long-random-secret-here
NODE_ENV=production
CLIENT_URL=https://your-app-name.railway.app
```

### Step 4: Deploy
Railway auto-detects `railway.toml` and runs:
- Build: installs deps + builds React frontend
- Start: runs Express server which serves the built frontend

### Step 5: Seed Demo Data (Optional)
After deploy, use the API to create an admin account:
```bash
curl -X POST https://your-app.railway.app/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"name":"Admin User","email":"admin@demo.com","password":"password123","role":"admin"}'
```

---

## 📡 API Reference

### Auth
```
POST /api/auth/signup    — Register
POST /api/auth/login     — Login
GET  /api/auth/me        — Current user
```

### Projects
```
GET    /api/projects         — List projects
POST   /api/projects         — Create project
GET    /api/projects/:id     — Project details + tasks
PUT    /api/projects/:id     — Update project
DELETE /api/projects/:id     — Delete project
POST   /api/projects/:id/members         — Add member
DELETE /api/projects/:id/members/:userId — Remove member
```

### Tasks
```
GET    /api/tasks        — List tasks (filterable)
POST   /api/tasks        — Create task
PUT    /api/tasks/:id    — Update task
DELETE /api/tasks/:id    — Delete task
```

### Dashboard & Users
```
GET /api/dashboard   — Stats + recent data
GET /api/users       — All users
PUT /api/users/:id   — Update user (admin: change role)
```

---

## 🔐 Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Secret for signing JWTs (32+ chars) |
| `PORT` | ❌ | Server port (default: 5000) |
| `NODE_ENV` | ❌ | `production` or `development` |
| `CLIENT_URL` | ❌ | Frontend URL for CORS |
| `VITE_API_URL` | Frontend | Backend API base URL |

---

## 📸 Screenshots

> Dashboard, Projects, Task board, Team page — all with dark theme UI.

---

## 📦 Submission Checklist

- [x] Live URL on Railway
- [x] GitHub repository
- [x] README with setup & deploy instructions
- [x] REST API with PostgreSQL
- [x] JWT Authentication
- [x] Role-Based Access Control (Admin/Member)
- [x] Project & Team management
- [x] Task creation, assignment & status tracking
- [x] Dashboard with stats & overdue tracking
- [x] Input validation & error handling
- [x] Responsive design

---

## 👨‍💻 Author

Built as a full-stack assignment — **TaskFlow** by [Your Name]

> Timeline: ~10 hours
