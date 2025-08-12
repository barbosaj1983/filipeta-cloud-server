
import { prisma } from '../db/client.js';

export async function recomputeCooccurrence() {
  await prisma.$executeRawUnsafe(`TRUNCATE TABLE "Cooccurrence";`);

  const supports = await prisma.$queryRawUnsafe<{ gtin: string; support: number }[]>(`
    SELECT ti.gtin, COUNT(*) AS support
    FROM "TransactionItem" ti
    GROUP BY ti.gtin
  `);
  const supportMap = new Map(supports.map(s => [s.gtin, Number(s.support)]));

  const pairs = await prisma.$queryRawUnsafe<{ gtin_a: string; gtin_b: string; support_ab: number }[]>(`
    SELECT a.gtin AS gtin_a, b.gtin AS gtin_b, COUNT(*) AS support_ab
    FROM "TransactionItem" a
    JOIN "TransactionItem" b ON a.transaction_id = b.transaction_id AND a.gtin < b.gtin
    GROUP BY a.gtin, b.gtin
    HAVING COUNT(*) >= 2
  `);

  const totalA = Array.from(supportMap.values()).reduce((acc, v) => acc + v, 0) || 1;
  for (const p of pairs) {
    const sa = supportMap.get(p.gtin_a) || 1;
    const sb = supportMap.get(p.gtin_b) || 1;
    const confidence = p.support_ab / sa;
    const lift = confidence / (sb / totalA);
    await prisma.cooccurrence.create({
      data: {
        gtin_a: p.gtin_a, gtin_b: p.gtin_b,
        support_ab: Number(p.support_ab),
        support_a: sa, support_b: sb,
        confidence, lift
      }
    });
    const confidenceBA = p.support_ab / sb;
    const liftBA = confidenceBA / (sa / totalA);
    await prisma.cooccurrence.create({
      data: {
        gtin_a: p.gtin_b, gtin_b: p.gtin_a,
        support_ab: Number(p.support_ab),
        support_a: sb, support_b: sa,
        confidence: confidenceBA, lift: liftBA
      }
    });
  }
}
