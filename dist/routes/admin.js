import { Router } from 'express';
import { requireApiKey } from './middleware.js';
import { importCatalogFromCSV } from '../services/erpSync.js';
import { recomputeCooccurrence } from '../services/cooccurrence.js';
import { ENV } from '../utils/env.js';
export const admin = Router();
admin.use(requireApiKey);
admin.post('/import/catalog', async (_req, res) => {
    const { upserts } = await importCatalogFromCSV(ENV.ERP_URL);
    res.json({ ok: true, upserts });
});
admin.post('/recompute/cooccurrence', async (_req, res) => {
    await recomputeCooccurrence();
    res.json({ ok: true });
});
