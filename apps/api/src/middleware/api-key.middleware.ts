import { Request, Response, NextFunction } from 'express';

const VALID_API_KEYS = new Set([
  'inst-key-123',
  'partner-key-456'
]);

export const apiKeyMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const apiKey = req.header('X-API-KEY');

  if (!apiKey || !VALID_API_KEYS.has(apiKey)) {
    return res.status(401).json({ error: 'Unauthorized: Invalid API Key' });
  }

  next();
};
