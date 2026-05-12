import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

import path from 'path';
import { PrismaClient } from '@prisma/client';
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3';
import http from 'http';
import { Server } from 'socket.io';

import { createOrderRoutes } from './routes/orders';
import { createUserRoutes } from './routes/users';
import { createMenuRoutes } from './routes/menu';
import { createUploadRoutes } from './routes/upload';
import { createAnalyticsRoutes } from './routes/analytics';
import { authMiddleware } from './middleware/auth';
import { requireRoles } from './middleware/rbac.middleware';
import { loggerMiddleware } from './middleware/logger.middleware';
import { errorMiddleware } from './middleware/error.middleware';

import { databaseConfig, testDatabaseConfig } from './config/database';

// Prisma adapter initialization
const isTest = process.env.NODE_ENV === 'test';
const dbConfig = isTest ? testDatabaseConfig : databaseConfig;

const adapter = new PrismaBetterSqlite3({
  url: isTest ? 'file:./database/test.db' : dbConfig.url
});
const prisma = new PrismaClient({ adapter });

const app = express();
const httpServer = http.createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(loggerMiddleware);

app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/orders', authMiddleware, createOrderRoutes(prisma, io));
app.use('/api/users', createUserRoutes(prisma));
app.use('/api/menu', createMenuRoutes(prisma, io));
app.use('/api/upload', authMiddleware, createUploadRoutes());
app.use('/api/analytics', authMiddleware, requireRoles(['boss', 'admin']), createAnalyticsRoutes(prisma));

// Health check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use(errorMiddleware);

// Socket.io connection handling
io.on('connection', (socket) => {
  console.log(`[Socket] Client connected: ${socket.id}`);

  socket.on('subscribe:analytics', () => {
    socket.join('analytics');
    console.log(`[Socket] Client ${socket.id} subscribed to analytics`);
  });

  socket.on('disconnect', () => {
    console.log(`[Socket] Client disconnected: ${socket.id}`);
  });
});

export { app, httpServer, prisma, io };
