import { prisma } from '../db/client.js';
export async function requireStoreApiKey(req, res, next) {
    const key = req.header('x-api-key');
    if (!key)
        return res.status(401).json({ error: 'missing_store_key' });
    const api = await prisma.apiKey.findUnique({ where: { key } });
    if (!api)
        return res.status(401).json({ error: 'invalid_store_key' });
    req.storeId = api.store_id;
    next();
}
