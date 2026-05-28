import rateLimit from 'express-rate-limit'
import type { Request, Response, NextFunction } from 'express'

const noop = (_req: Request, _res: Response, next: NextFunction) => next()
const isTest = process.env.NODE_ENV === 'test'

export const standardLimiter = isTest ? noop : rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again in a minute.' },
})

export const writeLimiter = isTest ? noop : rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many write requests, please slow down.' },
})
