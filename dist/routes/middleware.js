import { ENV } from '../utils/env.js';
export function requireApiKey(req, res, next) {
    const key = req.header('x-api-key');
    if (key !== ENV.API_KEY)
        return res.status(401).json({ error: 'unauthorized' });
    next();
}
