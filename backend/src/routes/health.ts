import { Router, Request, Response } from 'express';

export const healthRoutes = Router();

healthRoutes.get('/', (req: Request, res: Response) => {
  res.set('Cache-Control', 'no-store');
  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: 'connected', // Phase 1: add actual DB health check
  });
});

healthRoutes.head('/', (req: Request, res: Response) => {
  res.status(200).end();
});

export default healthRoutes;
