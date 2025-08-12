
import { Router } from 'express';
import { prisma } from '../db/client.js';

export const products = Router();

products.get('/:gtin', async (req, res) => {
  const p = await prisma.product.findUnique({ where: { gtin: req.params.gtin } });
  if (!p) return res.status(404).json({ error: 'Produto não encontrado' });
  res.json(p);
});
