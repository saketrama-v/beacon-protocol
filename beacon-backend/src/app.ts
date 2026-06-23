import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';

const app = express();

app.use(helmet());
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json());

import agentsRoutes from './api/routes/agents';
import signalsRoutes from './api/routes/signals';
import resolutionsRoutes from './api/routes/resolutions';
import webhooksRoutes from './api/routes/webhooks';
import dashboardRoutes from './api/routes/dashboard';

app.use('/api/v1/agents', agentsRoutes);
app.use('/api/v1/signals', signalsRoutes);
app.use('/api/v1/resolutions', resolutionsRoutes);
app.use('/api/v1/webhooks', webhooksRoutes);
app.use('/api/v1/dashboard', dashboardRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Global Error Handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

export default app;
