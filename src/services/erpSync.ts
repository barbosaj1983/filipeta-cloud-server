
import fs from 'node:fs';
import { parse } from 'csv-parse';
import { prisma } from '../db/client.js';

type Row = { gtin: string; name: string; category?: string; brand?: string; price?: string };

export async function importCatalogFromCSV(path: string) {
  const rows: Row[] = await new Promise((resolve, reject) => {
    const out: Row[] = [];
    fs.createReadStream(path)
      .pipe(parse({ columns: true, trim: true }))
      .on('data', (r: any) => out.push(r))
      .on('end', () => resolve(out))
      .on('error', reject);
  });

  let upserts = 0;
  for (const r of rows) {
    if (!r.gtin || !r.name) continue;
    await prisma.product.upsert({
      where: { gtin: r.gtin },
      create: {
        gtin: r.gtin,
        name: r.name,
        category: r.category || null,
        brand: r.brand || null,
        price: r.price ? Number(r.price) : null
      },
      update: {
        name: r.name,
        category: r.category || null,
        brand: r.brand || null,
        price: r.price ? Number(r.price) : null,
        is_active: true
      }
    });
    upserts++;
  }
  return { upserts };
}
