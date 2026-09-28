# CollabSpace - Real-Time Collaborative Workspace

A modern, full-stack collaborative workspace web application enabling multi-user real-time document editing, live cursor telemetry, presence tracking, thread comments with @mentions, and role-based access control.

## Key Features

- **Real-Time Collaborative Editing:** Sub-50ms synchronization across all connected clients via Socket.IO with conflict-free updates.
- **Live Presence & Cursors:** View active collaborators, real-time cursor pointers with colored flags, and live selection highlights.
- **Role-Based Access Control (RBAC):**
  - **Owner:** Manage workspace settings, invite members, modify roles, create/edit/delete documents.
  - **Editor:** Create, edit, and duplicate documents, add comments, collaborate live.
  - **Viewer:** View documents, comment, read activity logs, read-only document editor.
- **Threaded Discussions:** Highlight text to anchor comments, mention users with `@username`, reply in threads, and resolve topics.
- **Organization & Search:** Folders, favorites, trash bin, instant global search across documents, folders, comments, and members.
- **Activity & Notifications:** Real-time workspace audit log and user notifications.
- **Dark & Light Mode:** Polished SaaS interface designed with Tailwind CSS.

---

## Architecture Overview

```
real-time-workspace/
├── backend/
│   ├── db/              # Persistent relational database store & seed data
│   ├── middleware/      # JWT authentication & Workspace RBAC authorization
│   ├── routes/          # RESTful endpoints (Auth, Workspaces, Members, Documents, Comments, Folders, Notifications)
│   └── websocket/       # Real-time Socket.IO handler (Presence, Cursors, Selections, Deltas)
├── src/
│   ├── components/      # Modular UI components (Editor, Sidebar, Header, Modals, Presence)
│   ├── context/         # React Contexts (Auth, Socket, Theme, Toast)
│   └── pages/           # Views (Dashboard, DocumentEditor, Members, Settings, Auth)
├── prisma/
│   └── schema.prisma    # Complete Prisma schema
├── server.ts            # Unified Express + Socket.IO + Vite development/production server
├── Dockerfile           # Production container configuration
└── docker-compose.yml   # Multi-container orchestration with PostgreSQL
```

---

## Quickstart & Local Development

### 1. Prerequisites
- Node.js 18+ or 20+
- npm 9+

### 2. Setup Environment Variables
Create `.env` based on `.env.example`:
```bash
cp .env.example .env
```

Default variables:
```env
PORT=3000
JWT_SECRET=collabspace-super-secret-jwt-key-2026
NODE_ENV=development
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Start Development Server
```bash
npm run dev
```
The server will start at `http://localhost:3000`.

### 5. Demo Accounts
The database automatically initializes with sample users (password: `password123`):
- **Alice Chen (Owner):** `alice@collab.io`
- **Bob Miller (Editor):** `bob@collab.io`
- **Sarah Connor (Designer/Viewer):** `sarah@collab.io`

You can use the **1-Click Demo Switcher** directly in the top bar to simulate multiple users in separate tabs and witness real-time typing and cursor tracking instantly.

---

## Production Deployment with Docker

### Using Docker Compose (App + PostgreSQL)
```bash
docker-compose up --build -d
```
The application will be live at `http://localhost:3000` with PostgreSQL on `localhost:5432`.

---

## REST API Specification

### Authentication
- `POST /api/auth/register` - Create new user account and default workspace
- `POST /api/auth/login` - Authenticate and receive JWT token
- `POST /api/auth/logout` - Invalidate current session
- `GET  /api/auth/me` - Retrieve current user profile
- `GET  /api/auth/demo-users` - Retrieve available demo test accounts

### Workspaces
- `GET    /api/workspaces` - List workspaces user has access to
- `POST   /api/workspaces` - Create new workspace
- `GET    /api/workspaces/:id` - Get workspace details, members, and documents
- `PATCH  /api/workspaces/:id` - Update workspace name, description, or icon (Owner)
- `DELETE /api/workspaces/:id` - Delete workspace (Owner)
- `GET    /api/workspaces/:id/search?q=...` - Global workspace search
- `GET    /api/workspaces/:id/activity` - Workspace audit log

### Workspace Members
- `GET    /api/workspaces/:id/members` - List workspace members
- `POST   /api/workspaces/:id/invite` - Invite new collaborator by email
- `PATCH  /api/workspaces/:id/members/:userId` - Update member role (Owner)
- `DELETE /api/workspaces/:id/members/:userId` - Remove member from workspace (Owner)

### Documents
- `GET    /api/workspaces/:id/documents` - List workspace documents
- `POST   /api/workspaces/:id/documents` - Create new document (Owner/Editor)
- `GET    /api/documents/:id` - Get document content and metadata
- `PATCH  /api/documents/:id` - Update document title, content, folder, favorite, trash
- `DELETE /api/documents/:id` - Delete document permanently
- `POST   /api/documents/:id/duplicate` - Duplicate document

### Comments
- `GET    /api/documents/:id/comments` - List comments on document
- `POST   /api/documents/:id/comments` - Add inline comment with selection context
- `PATCH  /api/comments/:id` - Resolve or edit comment
- `DELETE /api/comments/:id` - Delete comment
- `POST   /api/comments/:id/replies` - Reply to comment thread

---

## Real-Time WebSocket Protocol

| Event | Direction | Payload Description |
|---|---|---|
| `document:join` | Client -> Server | Join document room (`{ documentId, workspaceId }`) |
| `presence:sync` | Server -> Client | List of currently active collaborators in room |
| `user:online` | Server -> Client | Notifies peers of newly joined collaborator |
| `document:update` | Bidirectional | Incremental delta & full HTML content update |
| `cursor:update` | Bidirectional | Live caret coordinates (`{ offset, line, ch, x, y }`) |
| `selection:update` | Bidirectional | Highlighted selection bounds (`{ start, end, text }`) |
| `user:status` | Bidirectional | Typing/editing indicator badge |
| `comment:new` | Server -> Client | Real-time comment addition broadcast |
| `user:offline` | Server -> Client | Notifies peers when collaborator disconnects |
