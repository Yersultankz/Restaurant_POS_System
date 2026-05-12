# Architecture Overview - Mubin POS

## Tech Stack
- **Frontend**: React, TypeScript, Vite, TailwindCSS
- **Backend**: Node.js, Express, Prisma (v7), Better-SQLite3
- **Communication**: REST API (HTTP), Real-time updates (Socket.io)

## Directory Structure
```
/
├── docs/                # Documentation
├── server/              # Backend Application
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth & Logger
│   │   ├── routes/      # API Route definitions
│   │   ├── validators/  # Data validation schemas (Zod)
│   │   └── index.ts     # Entry point
│   └── prisma/          # Database schema & migrations
└── src/                 # Frontend Application
    ├── components/      # UI components
    ├── modules/         # Business modules (Orders, Analytics, etc.)
    ├── context/         # Global state management
    └── services/        # API communication logic
```

## Data Flow
1. User interacts with Frontend.
2. Frontend sends REST request to Backend.
3. Backend validates request using Zod.
4. Backend interacts with SQLite via Prisma.
5. Backend emits Socket.io events for real-time updates (KDS, Analytics).
6. Frontend receives updates and updates UI state.
