import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../../config.json';

export interface AuthRequest extends Request {
  user?: { id: number; role: string; email: string };
}

export function authenticate(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const header = req.headers['authorization'];
  const token  = header && header.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'No token provided. Please log in.' });
    return;
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret) as any;
    req.user = { id: payload.id, role: payload.role, email: payload.email };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
}

export function authorizeAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (req.user?.role !== 'Admin') {
    res.status(403).json({ message: 'Admin access required.' });
    return;
  }
  next();
}