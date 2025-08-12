
import { describe, it, expect, vi } from 'vitest';
import * as db from '../src/db/client';
import { recommend } from '../src/services/recommender';

describe('recommend', () => {
  it('empty items -> empty recs', async () => {
    const res = await recommend([], null, 5);
    expect(res).toEqual([]);
  });

  it('uses lift', async () => {
    vi.spyOn(db, 'prisma', 'get').mockReturnValue({
      product: { findMany: vi.fn().mockResolvedValue([{ gtin:'A', category:'analgesico' }]) },
      cooccurrence: { findMany: vi.fn().mockResolvedValue([{ gtin_a:'A', gtin_b:'B', lift:2, support_ab:10, support_a:20, support_b:30, id:'1', confidence:0.5, updated_at: new Date() }]) },
      $queryRawUnsafe: vi.fn().mockResolvedValue([])
    } as any);
    const out = await recommend([{ gtin:'A', qty:1 }], null, 5);
    expect(out[0].gtin).toBe('B');
  });
});
