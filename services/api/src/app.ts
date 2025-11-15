import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializePrisma } from './db/index';
import eventsRoutes from './routes/events';
import workflowsRoutes from './routes/workflows';
import analyticsRoutes from './routes/analytics';

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializePrisma();

// Routes
app.use('/api/v1/events', eventsRoutes);
app.use('/api/v1/workflows', workflowsRoutes);
app.use('/api/v1/analytics', analyticsRoutes);

// Health checks
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

app.get('/ready', (req: Request, res: Response) => {
  res.json({ ready: true });
});

export default app;
