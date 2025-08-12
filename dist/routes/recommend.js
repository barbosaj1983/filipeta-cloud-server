import { Router } from 'express';
import { z } from 'zod';
import { recommend } from '../services/recommender/index.js';
import { prisma } from '../db/client.js';
import { validateCPF } from '../services/cpf.js';
export const recommendRoute = Router();
recommendRoute.post('/', async (req, res) => {
    const schema = z.object({
        cpf: z.string().optional(),
        items: z.array(z.object({ gtin: z.string(), qty: z.number().min(1) })),
        top: z.number().min(1).max(20).default(5)
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success)
        return res.status(400).json({ error: parsed.error.flatten() });
    let customerId = null;
    if (parsed.data.cpf && validateCPF(parsed.data.cpf)) {
        const customer = await prisma.customer.upsert({
            where: { cpf: parsed.data.cpf.replace(/\D/g, '') },
            update: {},
            create: { cpf: parsed.data.cpf.replace(/\D/g, '') }
        });
        customerId = customer.id;
    }
    const recs = await recommend(parsed.data.items, customerId, parsed.data.top);
    res.json({ recommendations: recs });
});
