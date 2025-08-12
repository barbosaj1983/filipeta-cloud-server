import { Router, Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { recomputeCooccurrence } from '../services/cooccurrence.js';

export const admin = Router();

/** middleware admin simples: exige header x-api-key igual à ENV API_KEY */
function requireAdmin(req: Request, res: Response, next: Function) {
  const k = req.header('x-api-key');
  if (!k || k !== process.env.API_KEY) {
    return res.status(401).json({ error: 'admin_unauthorized' });
  }
  next();
}

/** health do admin (debug) */
admin.get('/health', (_req, res) => res.json({ ok: true, scope: 'admin' }));

/** recomputa coocorrência para TODAS as lojas */
admin.post('/recompute/cooccurrence', requireAdmin, async (_req, res) => {
  await recomputeCooccurrence();
  res.json({ ok: true });
});

/** lista todas as lojas + total de keys (conveniente) */
admin.get('/stores', requireAdmin, async (_req, res) => {
  const stores = await prisma.store.findMany({
    include: { apiKeys: { select: { key: true } } },
    orderBy: { code: 'asc' },
  });
  res.json(
    stores.map(s => ({
      id: s.id,
      code: s.code,
      name: s.name,
      keys: s.apiKeys.map(k => k.key),
    }))
  );
});

/** retorna uma loja por code + todas as keys */
admin.get('/stores/:code', requireAdmin, async (req, res) => {
  const code = req.params.code;
  const store = await prisma.store.findUnique({
    where: { code },
    include: { apiKeys: { select: { key: true, created_at: true } } },
  });
  if (!store) return res.status(404).json({ error: 'store_not_found' });
  res.json({
    id: store.id,
    code: store.code,
    name: store.name,
    keys: store.apiKeys.map(k => k.key),
  });
});

/** gera/rotaciona nova key para a loja (mantém as antigas válidas) */
admin.post('/stores/:code/rotate', requireAdmin, async (req, res) => {
  const code = req.params.code;
  const store = await prisma.store.findUnique({ where: { code } });
  if (!store) return res.status(404).json({ error: 'store_not_found' });
  const crypto = await import('node:crypto');
  const newKey = crypto.randomBytes(24).toString('hex');
  await prisma.apiKey.create({
    data: { id: crypto.randomUUID(), key: newKey, store_id: store.id },
  });
  res.json({ ok: true, key: newKey });
});
