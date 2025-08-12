import express from 'express';
import cron from 'node-cron';
import { admin } from './routes/admin.js';
import { products } from './routes/products.js';
import { recommendRoute } from './routes/recommend.js';
import { sales } from './routes/sales.js';
import { requireStoreApiKey } from './routes/middleware.js';
import { recomputeCooccurrence } from './services/cooccurrence.js';

const app = express();
app.use(express.json());

// health simples — não tocar no DB aqui
app.get('/admin/health-inline', (_req, res) => res.json({ ok: true, hint: 'inline' }));

// rotas por loja
app.use('/api/products', requireStoreApiKey, products);
app.use('/api/recommend', requireStoreApiKey, recommendRoute);
app.use('/api/sales', requireStoreApiKey, sales);

// rotas admin
app.use('/admin', admin);

// cron noturno (02:00 TZ Campo Grande)
cron.schedule(
  '0 2 * * *',
  async () => {
    try {
      await recomputeCooccurrence();
      console.log('[cron] cooccurrence recomputed');
    } catch (e) {
      console.error('[cron] failed', e);
    }
  },
  { timezone: process.env.CRON_TZ || 'America/Campo_Grande' }
);

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`Cloud API on :${PORT}`);
});
