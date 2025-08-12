import express from 'express';
import cron from 'node-cron';
import { ENV } from './utils/env.js';
import { products } from './routes/products.js';
import { recommendRoute } from './routes/recommend.js';
import { sales } from './routes/sales.js';
import { admin } from './routes/admin.js';
import { recomputeCooccurrence } from './services/cooccurrence.js';
import { importCatalogFromCSV } from './services/erpSync.js';
const app = express();
app.use(express.json());
app.get('/health', (_req, res) => res.json({ ok: true }));
app.use('/api/products', products);
app.use('/api/recommend', recommendRoute);
app.use('/api/sales', sales);
app.use('/admin', admin);
cron.schedule('0 2 * * *', async () => {
    try {
        console.log('[CRON] Import ERP start');
        if (ENV.ERP_SOURCE === 'csv')
            await importCatalogFromCSV(ENV.ERP_URL);
        console.log('[CRON] Recompute cooccurrence start');
        await recomputeCooccurrence();
        console.log('[CRON] Done');
    }
    catch (e) {
        console.error('[CRON] Failed', e);
    }
}, { timezone: ENV.CRON_TZ });
app.listen(ENV.PORT, () => console.log(`Cloud API on :${ENV.PORT}`));
