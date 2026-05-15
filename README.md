# Team Task Manager

Full-stack web application for teams to manage projects and tasks with role-based access control.

## Tech Stack

- **Frontend**: React (Vite), JavaScript, React Router, Axios
- **Backend**: Node.js, Express
- **Database**: PostgreSQL
- **Auth**: JWT, bcryptjs

## Features

- Authentication (Signup/Login)
- Project & team management (add/remove members)
- Task creation, assignment, and status tracking (Pending / In Progress / Completed)
- Dashboard with task summaries, overdue alerts, and recent activity
- Role-based access control (Admin / Member)
- Priority levels (Low / Medium / High)

## Local Setup

### Prerequisites

- Node.js v18+
- PostgreSQL running locally

### 1. Clone & Install

```bash
git clone <your-repo-url>
cd team-task-manager

# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Database

Create a PostgreSQL database:

```bash
createdb team_task_manager
```

Configure `server/.env`:

```
PORT=5000
DATABASE_URL=postgresql://postgres:password@localhost:5432/team_task_manager
JWT_SECRET=your_jwt_secret_key_change_in_production
```

Run migrations:

```bash
cd server
npm run migrate
```

### 3. Run

```bash
# Terminal 1 - Backend
cd server
npm run dev

# Terminal 2 - Frontend
cd client
npm run dev
```

App runs at `http://localhost:3000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Register |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| GET | `/api/dashboard/stats` | Dashboard statistics |
| GET | `/api/dashboard/users` | List all users |
| POST | `/api/projects` | Create project |
| GET | `/api/projects` | List my projects |
| GET | `/api/projects/:id` | Get project details |
| PUT | `/api/projects/:id` | Update project |
| DELETE | `/api/projects/:id` | Delete project |
| GET | `/api/projects/:id/members` | List project members |
| POST | `/api/projects/:id/members` | Add member |
| DELETE | `/api/projects/:id/members/:memberId` | Remove member |
| POST | `/api/tasks/project/:projectId` | Create task |
| GET | `/api/tasks/project/:projectId` | List project tasks |
| PUT | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

## Deployment (Railway)

1. Push code to GitHub
2. Create a Railway project
3. Add a PostgreSQL database service (Railway provides the connection string)
4. Add a service for the backend:
   - Root directory: `server`
   - Start command: `npm start`
   - Set environment variables: `DATABASE_URL` (from Railway Postgres), `JWT_SECRET`
5. Add a service for the frontend:
   - Root directory: `client`
   - Build command: `npm run build`
   - Start command: `npx serve dist`
6. Run migrations on Railway: `npm run migrate`
