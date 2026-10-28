import express from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { requireAdmin } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// Get all internal users
router.get('/', (req, res) => {
  const users = db.getTable('users').map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    status: u.status,
    avatar: u.avatar,
    createdAt: u.createdAt
  }));
  res.json(users);
});

// Create new internal user (Admin only)
router.post('/', requireAdmin, (req, res) => {
  const { name, email, role = 'TEAM_MEMBER', password = 'password123' } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  const existing = db.findAll('users', u => u.email.toLowerCase() === email.toLowerCase());
  if (existing.length > 0) {
    return res.status(400).json({ error: 'User with this email already exists' });
  }

  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync(password, salt);

  const newUser = {
    id: `usr_${uuidv4().slice(0, 8)}`,
    name,
    email,
    passwordHash,
    role: role === 'ADMIN' ? 'ADMIN' : 'TEAM_MEMBER',
    status: 'ACTIVE',
    avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}`,
    createdAt: new Date().toISOString()
  };

  db.insert('users', newUser);

  logAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'CREATE_USER',
    entityType: 'USER',
    entityId: newUser.id,
    details: `Created new user ${newUser.name} (${newUser.email}) with role ${newUser.role}.`
  });

  const { passwordHash: _, ...safeUser } = newUser;
  res.status(201).json(safeUser);
});

// Update user role or active/inactive status (Admin only)
router.patch('/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { role, status } = req.body;

  const targetUser = db.findById('users', id);
  if (!targetUser) {
    return res.status(404).json({ error: 'User not found' });
  }

  const updates = {};
  if (role) updates.role = role;
  if (status) updates.status = status;

  const updated = db.update('users', id, updates);

  logAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'UPDATE_USER',
    entityType: 'USER',
    entityId: id,
    details: `Updated user ${targetUser.name}: status=${updated.status}, role=${updated.role}.`
  });

  const { passwordHash: _, ...safeUser } = updated;
  res.json(safeUser);
});

export default router;
