import { Router } from 'express';
import { recomputeCooccurrence } from '../services/cooccurrence.js';

export const admin = Router();

// recomputa coocorrência (usa API_KEY global via outro middleware seu, se houver)
admin.post('/recompute/cooccurrence', async (_req, res) => {
  await recomputeCooccurrence();
  res.json({ ok: true });
});

// mantenha aqui o /admin/import/catalog que você já tem
