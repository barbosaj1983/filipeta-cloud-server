
import { Request, Response, NextFunction } from 'express';
import { ENV } from '../utils/env.js';

export function requireApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.header('x-api-key');
  if (key !== ENV.API_KEY) return res.status(401).json({ error: 'unauthorized' });
  next();
}
