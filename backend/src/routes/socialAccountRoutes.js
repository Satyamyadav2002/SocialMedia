import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { logAuditEvent } from '../services/auditService.js';
import { metaService } from '../services/metaService.js';
import { triggerSyncForAccount } from '../workers/syncWorker.js';

const router = express.Router();

// List social accounts
router.get('/', (req, res) => {
  const { businessId, brandId } = req.query;
  let accounts = db.getTable('socialAccounts');

  if (businessId && businessId !== 'ALL') {
    accounts = accounts.filter(a => a.businessId === businessId);
  }
  if (brandId && brandId !== 'ALL') {
    accounts = accounts.filter(a => a.brandId === brandId);
  }

  // Enrich with brand and business name
  const businesses = db.getTable('businesses');
  const brands = db.getTable('brands');

  const enriched = accounts.map(acc => {
    const biz = businesses.find(b => b.id === acc.businessId);
    const brd = brands.find(b => b.id === acc.brandId);
    return {
      ...acc,
      businessName: biz ? biz.name : 'Unknown Business',
      brandName: brd ? brd.name : 'Unknown Brand'
    };
  });

  res.json(enriched);
});

// Connect account (OAuth completion simulation / manual connection)
router.post('/connect', (req, res) => {
  const { businessId, brandId, platform, accountType, accountName, handle } = req.body;
  if (!businessId || !brandId || !platform || !accountName) {
    return res.status(400).json({ error: 'businessId, brandId, platform, and accountName are required' });
  }

  const brand = db.findById('brands', brandId);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const newAcc = {
    id: `acc_${uuidv4().slice(0, 8)}`,
    businessId,
    brandId,
    platform: platform.toUpperCase(),
    accountType: accountType || (platform.toUpperCase() === 'FACEBOOK' ? 'FACEBOOK_PAGE' : 'INSTAGRAM_PROFESSIONAL'),
    accountName,
    handle: handle || accountName.toLowerCase().replace(/\s+/g, '_'),
    externalId: `${platform.toLowerCase()}_${Date.now()}`,
    profilePictureUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=100',
    tokenStatus: 'VALID',
    tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString(), // 60 days
    permissionsGranted: platform.toUpperCase() === 'FACEBOOK'
      ? ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_messaging']
      : ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages'],
    lastSyncedAt: new Date().toISOString(),
    createdAt: new Date().toISOString()
  };

  db.insert('socialAccounts', newAcc);

  logAuditEvent({
    businessId,
    brandId,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'CONNECT_SOCIAL_ACCOUNT',
    entityType: 'SOCIAL_ACCOUNT',
    entityId: newAcc.id,
    details: `Connected ${newAcc.platform} account "${newAcc.accountName}" (@${newAcc.handle}) to ${brand.name}`
  });

  res.status(201).json(newAcc);
});

// Disconnect account (INT-05)
router.post('/:id/disconnect', (req, res) => {
  const { id } = req.params;
  const account = db.findById('socialAccounts', id);
  if (!account) return res.status(404).json({ error: 'Account not found' });

  db.delete('socialAccounts', id);

  logAuditEvent({
    businessId: account.businessId,
    brandId: account.brandId,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'DISCONNECT_SOCIAL_ACCOUNT',
    entityType: 'SOCIAL_ACCOUNT',
    entityId: id,
    details: `Disconnected ${account.platform} account "${account.accountName}" (@${account.handle})`
  });

  res.json({ success: true, message: 'Account safely disconnected.' });
});

// Test connection / validate token health (INT-06, INT-07)
router.post('/:id/test-connection', (req, res) => {
  const { id } = req.params;
  try {
    const health = metaService.validateAccount(id);
    res.json(health);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Trigger manual sync for account
router.post('/:id/sync', (req, res) => {
  const { id } = req.params;
  try {
    const job = triggerSyncForAccount(id);
    res.json({ success: true, job });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
