# Installation Guide

Follow these steps to set up the Email Campaign Management System locally.

## Prerequisites
- Node.js (v18+)
- MySQL (v8.0+)
- npm or yarn

## 1. Clone the repository

```bash
git clone https://github.com/your-username/Atreal-cso.git
cd Atreal-cso
```

## 2. Backend Setup

```bash
cd backend
npm install
```

Copy the environment file and configure your database:
```bash
cp .env.example .env
```

Ensure your MySQL server is running, then run Prisma migrations:
```bash
npx prisma migrate dev --name init
```

Start the backend development server:
```bash
npm run dev
```
The backend will run on `http://localhost:5000`.

## 3. Frontend Setup

In a new terminal window:
```bash
cd frontend
npm install
```

Start the frontend development server:
```bash
npm run dev
```
The frontend will run on `http://localhost:5173`.

## 4. Default Credentials

Once both servers are running, you can register a new account on the frontend or create an admin user via the database.
