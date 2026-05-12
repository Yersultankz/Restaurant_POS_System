# Restaurant POS Fullstack System

This repository is organized as a fullstack POS system.

## Structure

- `frontend/` - React + Vite POS interface
- `backend/` - Express + Prisma API server
- `docs/` - setup and architecture documentation
- `scripts/` - backup and deployment helper scripts
- `tests/` - unit, integration, and e2e test placeholders
- `docker/` - Docker deployment placeholders

## Development

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

## Environment Variables

Frontend values use Vite and must start with `VITE_`.

```env
VITE_API_URL=http://localhost:4000/api
VITE_TABLE_COUNT=16
VITE_VAT_RATE=0.16
```

Backend values are read by Node.js through `process.env`.

```env
DATABASE_URL=file:./database/dev.db
JWT_SECRET=habi-pos-dev-secret-change-me
PORT=4000
```
