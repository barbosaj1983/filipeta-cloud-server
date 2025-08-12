import { prisma } from '../../db/client.js';
import { ruleBoost } from '../rules.js';
export async function recommend(items, customerId, top = 5) {
    if (!items.length)
        return [];
    const gtins = items.map(i => i.gtin);
    const products = await prisma.product.findMany({ where: { gtin: { in: gtins } } });
    const categories = Array.from(new Set(products.map(p => p.category).filter(Boolean)));
    const coocs = await prisma.cooccurrence.findMany({
        where: { gtin_a: { in: gtins } },
        orderBy: [{ lift: 'desc' }],
        take: 200
    });
    const byLift = coocs.map(c => ({
        gtin: c.gtin_b,
        score: c.lift,
        reason: [`lift:${c.lift.toFixed(2)}`]
    }));
    let personal = [];
    if (customerId) {
        const rows = await prisma.$queryRawUnsafe(`
      SELECT ti.gtin, COUNT(*)::int AS freq
      FROM "Transaction" t
      JOIN "TransactionItem" ti ON ti.transaction_id = t.id
      WHERE t.customer_id = $1
      GROUP BY ti.gtin
      ORDER BY freq DESC
      LIMIT 200
    `, customerId);
        personal = rows.map(r => ({
            gtin: r.gtin,
            score: Math.log(1 + r.freq),
            reason: [`freq:${r.freq}`]
        }));
    }
    const map = new Map();
    for (const c of [...byLift, ...personal]) {
        const prev = map.get(c.gtin);
        const base = !prev || c.score > (prev?.score ?? 0) ? c : prev;
        map.set(c.gtin, base);
    }
    for (const [gtin, c] of map) {
        const boost = ruleBoost(categories, gtin);
        if (boost)
            map.set(gtin, { ...c, score: c.score + boost, reason: [...c.reason, `rule:+${boost}`] });
    }
    const inBasket = new Set(gtins);
    const arr = Array.from(map.values()).filter(c => !inBasket.has(c.gtin));
    const max = Math.max(...arr.map(a => a.score), 0.0001);
    return arr.sort((a, b) => b.score - a.score).slice(0, top)
        .map(a => ({ ...a, score: Number((a.score / max).toFixed(4)) }));
}
