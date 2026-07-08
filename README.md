# Chit-Chat App

Chit-Chat App is a full-stack real-time communication platform built with Next.js (frontend) and Express.js (backend). It features robust user authentication, real-time messaging using Socket.IO, structured discussion threads, image uploads via Cloudinary, and persistent storage managed by Prisma and PostgreSQL.

## 🚀 Features

- **Real-time Communication**: Instant messaging and live updates powered by Socket.IO.
- **Authentication**: Secure user management and authentication handled by Clerk.
- **Threaded Discussions**: Categorized threads and replies for organized conversations.
- **Direct Messaging**: Private one-on-one real-time conversations.
- **Media Uploads**: Image sharing capability integrated with Cloudinary.
- **Notifications**: System alerts for mentions, replies, and messages.
- **Responsive UI**: Modern, accessible interfaces built with Shadcn UI and Base UI on top of Tailwind CSS.

## 🛠️ Tech Stack

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn UI, Base UI (@base-ui/react), Lucide React
- **State Management & Data Fetching**: React Hooks, Axios
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Client**: Socket.IO Client
- **Authentication**: Clerk Next.js SDK

### Backend
- **Framework**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma Client
- **Real-time Server**: Socket.IO
- **Authentication Validation**: Clerk Express SDK
- **File Uploads**: Multer & Cloudinary
- **Validation**: Zod
- **Logging**: Winston

## 📂 Project Structure

The project is structured as a monorepo containing two main workspaces: `frontend` and `backend`.

```
chit-chat-app/
├── backend/          # Express.js REST API and Socket.IO server
│   ├── prisma/       # Database schema and migrations
│   └── src/          # Backend source code (routes, modules, middleware)
├── frontend/         # Next.js web application
│   ├── public/       # Static assets
│   └── src/          # Frontend source code (app router, components, lib)
└── docs/             # Detailed project documentation
```

## 📖 Documentation

Comprehensive documentation has been separated into the following files to help you understand and contribute to the project:

- [Architecture & Flow](docs/architecture.md) - Overall system design, real-time flow, and authentication.
- [Frontend Documentation](docs/frontend.md) - Next.js setup, state management, components, and routing.
- [Backend Documentation](docs/backend.md) - Express setup, API routes, middleware, and project structure.
- [Database Schema](docs/database.md) - Prisma schema, models, relationships, and migration workflows.
- [Deployment & Configuration](docs/deployment.md) - Environment variables and production setup.

## 🏎️ Quick Start (Running Locally)

### Prerequisites
- Node.js (v20+ recommended)
- PostgreSQL running locally or remotely
- A Clerk account for authentication
- A Cloudinary account for image uploads

### 1. Clone and Install Dependencies

```bash
# Install frontend dependencies
cd frontend
npm install

# Install backend dependencies
cd ../backend
npm install
```

### 2. Environment Configuration

You will need `.env` files in both the `frontend` and `backend` directories. Refer to [Deployment & Configuration](docs/deployment.md) for detailed variable lists.

### 3. Setup Database (Backend)

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 4. Run Development Servers

**Run Backend Server:**
```bash
cd backend
npm run dev
# Runs on https://chit-chat-backend-0bjd.onrender.com (or the port defined in .env)
```

**Run Frontend Application:**
```bash
cd frontend
npm run dev
# Runs on https://chit-chat-frontend-gilt.vercel.app
```

Open [https://chit-chat-frontend-gilt.vercel.app](https://chit-chat-frontend-gilt.vercel.app) in your browser to interact with the application.

---

*This documentation is intended for developers seeking to understand, maintain, or extend the Chit-Chat App codebase.*
