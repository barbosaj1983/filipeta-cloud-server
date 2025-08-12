
import 'dotenv/config';

function req(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  if (v === undefined) throw new Error(`Missing env: ${name}`);
  return v;
}

export const ENV = {
  PORT: Number(process.env.PORT || 8080),
  DATABASE_URL: req('DATABASE_URL'),
  API_KEY: req('API_KEY', 'dev-key'),
  CRON_TZ: process.env.CRON_TZ || 'America/Campo_Grande',
  ERP_SOURCE: process.env.ERP_SOURCE || 'csv',
  ERP_URL: process.env.ERP_URL || './data/catalog.csv'
};
