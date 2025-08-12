import { Router } from 'express';
import { prisma } from '../db/client.js';
import crypto from 'node:crypto';

export const sales = Router();

type SaleItem = { gtin: string; qty: number; price: number };
type SaleBody = { cpf?: string; items: SaleItem[] };

sales.post('/commit', async (req, res) => {
  try {
    const storeId = (req as any).storeId as string | undefined;
    if (!storeId) return res.status(401).json({ error: 'missing_store' });

    const { cpf, items } = (req.body ?? {}) as SaleBody;
    if (!items?.length) return res.status(400).json({ error: 'empty_items' });

    // cliente (opcional)
    let customerId: string | null = null;
    if (cpf) {
      const c = await prisma.customer.upsert({
        where: { cpf },
        update: {},
        create: { id: crypto.randomUUID(), cpf },
      });
      customerId = c.id;
    }

    // cria transação COM store_id
    const tx = await prisma.transaction.create({
      data: {
        id: crypto.randomUUID(),
        store_id: storeId,
        customer_id: customerId,
      },
    });

    // itens
    await prisma.transactionItem.createMany({
      data: items.map(it => ({
        id: crypto.randomUUID(),
        transaction_id: tx.id,
        gtin: it.gtin,
        qty: it.qty,
        price: it.price,
      })),
    });

    res.json({ ok: true, id: tx.id });
  } catch (e: any) {
    console.error('[sales/commit] error', e);
    res.status(500).json({ error: 'commit_failed', detail: String(e?.message || e) });
  }
});
