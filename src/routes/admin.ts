--- file: ./src/routes/admin.ts ---
import { Router } from 'express';
import { recomputeCooccurrence } from '../services/cooccurrence.js';

export const admin = Router();

// protege essas rotas com API_KEY global (seu middleware atual já deve validar)
admin.post('/recompute/cooccurrence', async (_req, res) => {
  await recomputeCooccurrence();
  res.json({ ok: true });
});

// ... mantenha o /admin/import/catalog que você já tem
