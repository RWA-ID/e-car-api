import type { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key']
  if (apiKey && apiKey === process.env.API_KEY) {
    next()
    return
  }

  const authHeader = req.headers['authorization']
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' })
    return
  }

  try {
    const token = authHeader.slice(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET ?? 'dev-secret')
    ;(req as Request & { user: unknown }).user = payload
    next()
  } catch {
    res.status(401).json({ error: 'Invalid token' })
  }
}
