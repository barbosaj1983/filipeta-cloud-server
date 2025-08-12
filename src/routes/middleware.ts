--- file: ./src/routes/middleware.ts ---
import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db/client.js';

export async function requireStoreApiKey(req: Request, res: Response, next: NextFunction) {
  const key = req.header('x-api-key');
  if (!key) return res.status(401).json({ error: 'missing_store_key' });

  const api = await prisma.apiKey.findUnique({ where: { key } });
  if (!api) return res.status(401).json({ error: 'invalid_store_key' });

  (req as any).storeId = api.store_id;
  next();
}
