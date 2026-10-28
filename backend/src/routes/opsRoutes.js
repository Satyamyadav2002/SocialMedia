import express from 'express';
import { db } from '../db.js';
import { metaService } from '../services/metaService.js';
import { requireAdmin } from '../middleware/auth.js';
import { logAuditEvent } from '../services/auditService.js';
import { triggerSyncForAccount } from '../workers/syncWorker.js';

const router = express.Router();

// Search & filter audit trail (IAM-06)
router.get('/audit-trail', (req, res) => {
  const { action, actorId, search, limit = 50 } = req.query;
  let events = db.getTable('auditEvents');

  if (action && action !== 'ALL') {
    events = events.filter(e => e.action === action);
  }
  if (actorId && actorId !== 'ALL') {
    events = events.filter(e => e.actorId === actorId);
  }
  if (search) {
    const q = search.toLowerCase();
    events = events.filter(e =>
      e.details.toLowerCase().includes(q) ||
      e.action.toLowerCase().includes(q) ||
      e.actorName.toLowerCase().includes(q)
    );
  }

  // Newest first
  events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({
    total: events.length,
    events: events.slice(0, Number(limit))
  });
});

// Sync jobs monitoring (OPS-01)
router.get('/sync-jobs', (req, res) => {
  const jobs = db.getTable('syncJobs');
  jobs.sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());
  res.json(jobs);
});

// Trigger full or account sync (SYNC-05)
router.post('/trigger-sync', (req, res) => {
  const { socialAccountId } = req.body;
  if (socialAccountId) {
    try {
      const job = triggerSyncForAccount(socialAccountId);
      return res.json({ success: true, jobs: [job] });
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // Sync all valid accounts
  const accounts = db.findAll('socialAccounts', a => a.tokenStatus === 'VALID');
  const results = accounts.map(a => triggerSyncForAccount(a.id));

  logAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'TRIGGER_GLOBAL_SYNC',
    entityType: 'SYNC_JOB',
    entityId: 'global',
    details: `Triggered synchronization across ${results.length} active Meta social accounts.`
  });

  res.json({ success: true, count: results.length, jobs: results });
});

// Simulate incoming webhook event (SYNC-06)
router.post('/simulate-webhook', (req, res) => {
  const { brandId, platform, interactionType, authorName, contentText } = req.body;
  if (!brandId) {
    return res.status(400).json({ error: 'brandId is required to simulate webhook event' });
  }

  try {
    const interaction = metaService.simulateIncomingWebhook({
      brandId,
      platform: platform || 'INSTAGRAM',
      interactionType: interactionType || 'COMMENT',
      authorName: authorName || 'Taylor Brooks',
      contentText: contentText || 'Loved your recent launch! Could you share when this item will be available for pickup?'
    });

    res.json({ success: true, message: 'Simulated webhook received and indexed.', interaction });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Publishing jobs queue monitor (OPS-02)
router.get('/publishing-jobs', (req, res) => {
  const jobs = db.getTable('publishingJobs');
  jobs.sort((a, b) => new Date(b.scheduledFor || 0).getTime() - new Date(a.scheduledFor || 0).getTime());
  res.json(jobs);
});

// Get system settings (IAM-05)
router.get('/system-settings', (req, res) => {
  const settings = db.getTable('systemSettings');
  res.json(settings);
});

// Update system settings (Admin only IAM-05)
router.put('/system-settings', requireAdmin, (req, res) => {
  const updates = req.body;
  const current = db.getTable('systemSettings');
  const updated = { ...current, ...updates };
  db.data.systemSettings = updated;
  db.save();

  logAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'UPDATE_SYSTEM_SETTINGS',
    entityType: 'SYSTEM_SETTINGS',
    entityId: 'settings',
    details: 'Administrator modified system integration and AI parameters.'
  });

  res.json(updated);
});

export default router;
