import { Router } from 'express';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { validateCPF } from '../services/cpf.js';
export const sales = Router();
sales.post('/commit', async (req, res) => {
    const schema = z.object({
        cpf: z.string().optional(),
        items: z.array(z.object({ gtin: z.string(), qty: z.number().positive(), price: z.number().nonnegative() }))
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    const cpf = parsed.data.cpf?.replace(/\D/g, '');
    let customerId = null;
    if (cpf && validateCPF(cpf)) {
        const c = await prisma.customer.upsert({ where: { cpf }, update: {}, create: { cpf } });
        customerId = c.id;
    }
    const tx = await prisma.transaction.create({ data: { customer_id: customerId } });
    for (const it of parsed.data.items) {
        await prisma.transactionItem.create({
            data: { transaction_id: tx.id, gtin: it.gtin, qty: it.qty, price: it.price }
        });
    }
    res.json({ ok: true, transactionId: tx.id });
});
