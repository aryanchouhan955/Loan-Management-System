import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import User from '../models/User.model';

const signToken = (id: string, email: string, role: string, fullName: string) => {
  return jwt.sign(
    { id, email, role, fullName },
    process.env.JWT_SECRET || 'secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' } as jwt.SignOptions
  );
};

export const signup = async (req: Request, res: Response): Promise<void> => {
  try {
    const { fullName, email, password } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ message: 'fullName, email, and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    const user = await User.create({
      fullName,
      email,
      passwordHash: password,
      role: 'borrower',
    });

    const token = signToken(user._id.toString(), user.email, user.role, user.fullName);
    res.status(201).json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        personalDetailsSubmitted: user.personalDetailsSubmitted,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid email or password' });
      return;
    }

    const token = signToken(user._id.toString(), user.email, user.role, user.fullName);
    res.json({
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        personalDetailsSubmitted: user.personalDetailsSubmitted,
        pan: user.pan,
        dob: user.dob,
        monthlySalary: user.monthlySalary,
        employmentMode: user.employmentMode,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: (err as Error).message });
  }
};

export const getMe = async (req: Request & { user?: { id: string } }, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user?.id).select('-passwordHash');
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    res.json({ user });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};
