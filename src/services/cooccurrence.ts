import { prisma } from '../db/client.js';

/** Recalcula coocorrência para UMA loja */
export async function recomputeCooccurrenceForStore(storeId: string) {
  await prisma.$executeRawUnsafe(
    `DELETE FROM "Cooccurrence" WHERE store_id = $1`,
    storeId
  );

  const supports = await prisma.$queryRawUnsafe<{ gtin: string; support: number }[]>(
    `
    SELECT ti.gtin, COUNT(*)::int AS support
    FROM "Transaction" t
    JOIN "TransactionItem" ti ON ti.transaction_id = t.id
    WHERE t.store_id = $1
    GROUP BY ti.gtin
  `,
    storeId
  );

  const supportMap = new Map(supports.map(r => [r.gtin, r.support]));
  const totalTx = await prisma.$queryRawUnsafe<{ n: number }[]>(
    `SELECT COUNT(*)::int AS n FROM "Transaction" WHERE store_id = $1`,
    storeId
  ).then(r => r[0]?.n ?? 1);

  const pairs = await prisma.$queryRawUnsafe<{ a: string; b: string; support_ab: number }[]>(
    `
    SELECT LEAST(ti1.gtin, ti2.gtin) AS a,
           GREATEST(ti1.gtin, ti2.gtin) AS b,
           COUNT(*)::int AS support_ab
    FROM "Transaction" t
    JOIN "TransactionItem" ti1 ON ti1.transaction_id = t.id
    JOIN "TransactionItem" ti2 ON ti2.transaction_id = t.id AND ti2.gtin > ti1.gtin
    WHERE t.store_id = $1
    GROUP BY 1,2
    HAVING COUNT(*) > 0
  `,
    storeId
  );

  const rows = pairs.map(({ a, b, support_ab }) => {
    const support_a = supportMap.get(a) ?? 0;
    const support_b = supportMap.get(b) ?? 0;
    const confidence = support_ab / Math.max(1, support_a);
    const lift = confidence / Math.max(1e-9, support_b / totalTx);
    return {
      store_id: storeId,
      gtin_a: a,
      gtin_b: b,
      support_ab,
      support_a,
      support_b,
      confidence,
      lift,
    };
  });

  if (rows.length) {
    await prisma.cooccurrence.createMany({ data: rows, skipDuplicates: true });
  }
}

/** Recalcula coocorrência para TODAS as lojas */
export async function recomputeCooccurrence() {
  const stores = await prisma.store.findMany({ select: { id: true } });
  for (const st of stores) {
    await recomputeCooccurrenceForStore(st.id);
  }
}
