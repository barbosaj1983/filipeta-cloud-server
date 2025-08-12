import { Router, Request, Response } from 'express';
import { prisma } from '../db/client.js';
import { recomputeCooccurrence } from '../services/cooccurrence.js';

export const admin = Router();

function requireAdmin(req: Request, res: Response, next: Function) {
  const k = req.header('x-api-key');
  if (!k || k !== process.env.API_KEY) {
    return res.status(401).json({ error: 'admin_unauthorized' });
  }
  next();
}

// health admin (sem tocar no DB)
admin.get('/health', (_req, res) => res.json({ ok: true, scope: 'admin' }));

// novo: teste de DB detalhado
admin.get('/db-check', requireAdmin, async (_req, res) => {
  try {
    const r = await prisma.$queryRawUnsafe<{ ok: number }[]>(`select 1 as ok`);
    res.json({ ok: true, result: r });
  } catch (e: any) {
    console.error('[admin/db-check] error', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// recomputa coocorrência
admin.post('/recompute/cooccurrence', requireAdmin, async (_req, res) => {
  try {
    await recomputeCooccurrence();
    res.json({ ok: true });
  } catch (e: any) {
    console.error('[admin/recompute] error', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// lista lojas
admin.get('/stores', requireAdmin, async (_req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: { apiKeys: { select: { key: true, created_at: true } } }, // ajuste aqui se seu relation se chama diferente
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
  } catch (e: any) {
    console.error('[admin/stores] error', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// loja por code
admin.get('/stores/:code', requireAdmin, async (req, res) => {
  try {
    const code = req.params.code;
    const store = await prisma.store.findUnique({
      where: { code },
      include: { apiKeys: { select: { key: true, created_at: true } } }, // ajuste o nome da relação se necessário
    });
    if (!store) return res.status(404).json({ error: 'store_not_found' });
    res.json({
      id: store.id,
      code: store.code,
      name: store.name,
      keys: store.apiKeys.map(k => k.key),
    });
  } catch (e: any) {
    console.error('[admin/stores/:code] error', e);
    res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
});

// rotaciona key
admin.post('/stores/:code/rotate', requireAdmin, async (req, res) => {
  try {
    const code = req.params.code;
    const store = await prisma.store.findUnique({ where: { code } });
    if (!store) return res.status(404).json({ error: 'store_not_found' });
    const crypto = await import('node:crypto');
    const newKey = crypto.randomBytes(24).toString('hex');
    await prisma.apiKey.create({
      data: { id: crypto.randomUUID(), key: newKey, store_id: store.id },
    });
    res.json({
