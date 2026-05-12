# Setup Guide - Mubin POS

This guide will help you set up and run the Mubin Restaurant POS system.

## Prerequisites
- Node.js (v18 or higher)
- npm or yarn

## Project Structure
- `/frontend`: Frontend (Vite + React + Tailwind)
- `/backend`: Backend (Express + Prisma + Socket.io)

## Backend Setup
1. Enter the backend directory: `cd backend`
2. Install dependencies: `npm install`
3. Copy the environment template: `copy .env.example .env`
4. Initialize the database: `npm run prisma:migrate`
5. Seed the database: `npx prisma db seed --schema src/models/prisma/schema.prisma`
6. Start development server: `npm run dev`

## Frontend Setup
1. Enter the frontend directory: `cd frontend`
2. Install dependencies: `npm install`
3. Copy the environment template: `copy .env.example .env`
4. Start development server: `npm run dev`

## Environment Variables

Frontend `.env`:

```env
VITE_API_URL=http://localhost:4000/api
VITE_TABLE_COUNT=16
VITE_VAT_RATE=0.16
```

Backend `.env`:

```env
DATABASE_URL=file:./database/dev.db
JWT_SECRET=mubin-pos-dev-secret-change-me
PORT=4000
```

For production, keep the same variable names and replace only the values, for example:

```env
VITE_API_URL=https://mubin-pos.com/api
DATABASE_URL=postgresql://...
JWT_SECRET=your-production-secret
```

## Default Credentials
- **Boss Admin**: PIN: `admin`
- **Chef**: PIN: `1234`
- **Waiter**: PIN: `1111`
- **Cashier**: PIN: `2222`
