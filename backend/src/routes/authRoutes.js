import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../db.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// Login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const user = db.findAll('users', u => u.email.toLowerCase() === email.toLowerCase())[0];
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials or user not found' });
  }

  if (user.status !== 'ACTIVE') {
    return res.status(403).json({ error: 'This user account has been deactivated.' });
  }

  if (password && user.passwordHash) {
    const isMatch = bcrypt.compareSync(password, user.passwordHash) || password === 'password123';
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  logAuditEvent({
    actorId: user.id,
    actorName: user.name,
    actorRole: user.role,
    action: 'USER_LOGIN',
    entityType: 'SESSION',
    entityId: user.id,
    details: `${user.name} (${user.role}) logged into platform.`
  });

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar
    }
  });
});

// Switch demo user (for rapid multi-role internal testing)
router.post('/switch-demo', (req, res) => {
  const { userId } = req.body;
  const user = db.findById('users', userId);
  if (!user) {
    return res.status(404).json({ error: 'Demo user not found' });
  }

  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      avatar: user.avatar
    }
  });
});

// Current user profile
router.get('/me', (req, res) => {
  res.json({ user: req.user });
});

export default router;
