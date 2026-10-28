import express from 'express';
import { db } from '../db.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// List interactions with rich filtering
router.get('/', (req, res) => {
  const {
    businessId,
    brandId,
    socialAccountId,
    platform,
    interactionType,
    readStatus,
    replyStatus,
    priority,
    search,
    limit = 50,
    offset = 0
  } = req.query;

  let list = db.getTable('interactions');

  if (businessId && businessId !== 'ALL') {
    list = list.filter(i => i.businessId === businessId);
  }
  if (brandId && brandId !== 'ALL') {
    list = list.filter(i => i.brandId === brandId);
  }
  if (socialAccountId && socialAccountId !== 'ALL') {
    list = list.filter(i => i.socialAccountId === socialAccountId);
  }
  if (platform && platform !== 'ALL') {
    list = list.filter(i => i.platform === platform);
  }
  if (interactionType && interactionType !== 'ALL') {
    list = list.filter(i => i.interactionType === interactionType);
  }
  if (readStatus && readStatus !== 'ALL') {
    list = list.filter(i => i.readStatus === readStatus);
  }
  if (replyStatus && replyStatus !== 'ALL') {
    list = list.filter(i => i.replyStatus === replyStatus);
  }
  if (priority && priority !== 'ALL') {
    list = list.filter(i => i.priority === priority);
  }
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(i =>
      i.content.toLowerCase().includes(q) ||
      i.authorName.toLowerCase().includes(q) ||
      i.authorHandle.toLowerCase().includes(q) ||
      (i.postTitle && i.postTitle.toLowerCase().includes(q))
    );
  }

  // Sort: newest first, but keep urgent on top if sorted by priority
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  const total = list.length;
  const paginated = list.slice(Number(offset), Number(offset) + Number(limit));

  // Enrich with classifications, brands, and latest reply
  const classifications = db.getTable('classifications');
  const brands = db.getTable('brands');
  const businesses = db.getTable('businesses');
  const users = db.getTable('users');
  const replies = db.getTable('replies');

  const items = paginated.map(item => {
    const cls = classifications.find(c => c.interactionId === item.id) || null;
    const brd = brands.find(b => b.id === item.brandId) || null;
    const biz = businesses.find(b => b.id === item.businessId) || null;
    const assignedUser = item.assignedToUserId ? users.find(u => u.id === item.assignedToUserId) : null;
    const itemReplies = replies.filter(r => r.interactionId === item.id);
    const latestReply = itemReplies.length > 0 ? itemReplies[0] : null;

    return {
      ...item,
      classification: cls,
      brandName: brd ? brd.name : 'Unknown Brand',
      businessName: biz ? biz.name : 'Unknown Business',
      assignedUser: assignedUser ? { id: assignedUser.id, name: assignedUser.name, avatar: assignedUser.avatar } : null,
      latestReply
    };
  });

  res.json({
    total,
    items
  });
});

// Get interaction by ID
router.get('/:id', (req, res) => {
  const { id } = req.params;
  const item = db.findById('interactions', id);
  if (!item) return res.status(404).json({ error: 'Interaction not found' });

  const cls = db.findAll('classifications', c => c.interactionId === id)[0] || null;
  const brd = db.findById('brands', item.brandId);
  const biz = db.findById('businesses', item.businessId);
  const acc = db.findById('socialAccounts', item.socialAccountId);
  const replies = db.findAll('replies', r => r.interactionId === id);
  const assignedUser = item.assignedToUserId ? db.findById('users', item.assignedToUserId) : null;

  res.json({
    ...item,
    classification: cls,
    brand: brd,
    business: biz,
    socialAccount: acc,
    assignedUser: assignedUser ? { id: assignedUser.id, name: assignedUser.name, avatar: assignedUser.avatar } : null,
    replies
  });
});

// Update status, notes, or assignment (TEAM-01, TEAM-03, TEAM-05, INB-05)
router.patch('/:id/status', (req, res) => {
  const { id } = req.params;
  const { readStatus, replyStatus, priority, internalNotes, assignedToUserId } = req.body;

  const interaction = db.findById('interactions', id);
  if (!interaction) return res.status(404).json({ error: 'Interaction not found' });

  const updates = {};
  if (readStatus !== undefined) updates.readStatus = readStatus;
  if (replyStatus !== undefined) updates.replyStatus = replyStatus;
  if (priority !== undefined) updates.priority = priority;
  if (internalNotes !== undefined) updates.internalNotes = internalNotes;
  if (assignedToUserId !== undefined) updates.assignedToUserId = assignedToUserId;

  const updated = db.update('interactions', id, updates);

  logAuditEvent({
    businessId: interaction.businessId,
    brandId: interaction.brandId,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'UPDATE_INTERACTION_STATUS',
    entityType: 'INTERACTION',
    entityId: id,
    details: `Updated interaction ${id} state: readStatus=${updated.readStatus}, replyStatus=${updated.replyStatus}`
  });

  res.json(updated);
});

// Manual classification override (CLS-06)
router.patch('/:id/classification', (req, res) => {
  const { id } = req.params;
  const { sentiment, isQuestion, isPricingInquiry, isLeadIntent, isSensitive, priority } = req.body;

  let cls = db.findAll('classifications', c => c.interactionId === id)[0];
  if (!cls) {
    cls = {
      id: `cls_${id}`,
      interactionId: id,
      sentiment: sentiment || 'NEUTRAL',
      isQuestion: !!isQuestion,
      isPricingInquiry: !!isPricingInquiry,
      isLeadIntent: !!isLeadIntent,
      isSensitive: !!isSensitive,
      priority: priority || 'NORMAL',
      manuallyOverridden: true
    };
    db.insert('classifications', cls);
  } else {
    cls = db.update('classifications', cls.id, {
      sentiment: sentiment || cls.sentiment,
      isQuestion: isQuestion !== undefined ? isQuestion : cls.isQuestion,
      isPricingInquiry: isPricingInquiry !== undefined ? isPricingInquiry : cls.isPricingInquiry,
      isLeadIntent: isLeadIntent !== undefined ? isLeadIntent : cls.isLeadIntent,
      isSensitive: isSensitive !== undefined ? isSensitive : cls.isSensitive,
      priority: priority || cls.priority,
      manuallyOverridden: true
    });
  }

  // Sync priority & sensitivity to interaction record as well
  db.update('interactions', id, {
    priority: cls.priority,
    isSensitive: cls.isSensitive
  });

  logAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'OVERRIDE_CLASSIFICATION',
    entityType: 'CLASSIFICATION',
    entityId: cls.id,
    details: `Manual classification updated for interaction ${id}: sentiment=${cls.sentiment}, priority=${cls.priority}`
  });

  res.json(cls);
});

export default router;
