import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import User, { UserRole } from '../models/User.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
    fullName: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({ message: 'No token provided' });
      return;
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret') as {
      id: string;
      email: string;
      role: UserRole;
      fullName: string;
    };

    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    req.user = { id: decoded.id, email: decoded.email, role: decoded.role, fullName: decoded.fullName };
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
};

export const enforceRole = (roles: UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ message: `Access denied. Required roles: ${roles.join(', ')}` });
      return;
    }
    next();
  };
};
