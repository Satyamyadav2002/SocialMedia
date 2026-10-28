import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { metaService } from '../services/metaService.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// Get content list (with business, brand, and status filters)
router.get('/', (req, res) => {
  const { businessId, brandId, status, platform } = req.query;
  let items = db.getTable('contents');

  if (businessId && businessId !== 'ALL') {
    items = items.filter(c => c.businessId === businessId);
  }
  if (brandId && brandId !== 'ALL') {
    items = items.filter(c => c.brandId === brandId);
  }
  if (status && status !== 'ALL') {
    items = items.filter(c => c.status === status);
  }
  if (platform && platform !== 'ALL') {
    items = items.filter(c => c.platforms.includes(platform));
  }

  // Enrich with brand and business info
  const brands = db.getTable('brands');
  const businesses = db.getTable('businesses');

  const enriched = items.map(c => {
    const brd = brands.find(b => b.id === c.brandId);
    const biz = businesses.find(b => b.id === c.businessId);
    return {
      ...c,
      brandName: brd ? brd.name : 'Unknown Brand',
      businessName: biz ? biz.name : 'Unknown Business'
    };
  });

  // Sort: scheduled / published date or created date
  enriched.sort((a, b) => {
    const timeA = new Date(a.scheduledFor || a.publishedAt || a.createdAt).getTime();
    const timeB = new Date(b.scheduledFor || b.publishedAt || b.createdAt).getTime();
    return timeB - timeA;
  });

  res.json(enriched);
});

// Create new content (Draft or Scheduled) - CNT-08, PUB-02, PUB-03
router.post('/', (req, res) => {
  const {
    businessId,
    brandId,
    title,
    bodyText,
    mediaUrls = [],
    platforms = ['INSTAGRAM'],
    formats = ['FEED_POST'],
    hashtags = [],
    callToAction = '',
    scheduledFor = null,
    publishImmediately = false
  } = req.body;

  if (!businessId || !brandId || !title || !bodyText) {
    return res.status(400).json({ error: 'businessId, brandId, title, and bodyText are required' });
  }

  const brand = db.findById('brands', brandId);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const status = publishImmediately ? 'PUBLISHING' : (scheduledFor ? 'SCHEDULED' : 'DRAFT');

  const newPost = {
    id: `cnt_${uuidv4().slice(0, 8)}`,
    businessId,
    brandId,
    title,
    bodyText,
    mediaUrls: mediaUrls.length > 0 ? mediaUrls : ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600'],
    platforms,
    formats,
    hashtags: Array.isArray(hashtags) ? hashtags : (typeof hashtags === 'string' ? hashtags.split(/[\s,]+/).filter(Boolean) : []),
    callToAction,
    status,
    scheduledFor: scheduledFor ? new Date(scheduledFor).toISOString() : null,
    publishedAt: null,
    platformPostId: null,
    platformPostUrl: null,
    createdAt: new Date().toISOString()
  };

  db.insert('contents', newPost);

  // If immediate publish requested (PUB-01)
  if (publishImmediately) {
    metaService.publishPost({
      contentId: newPost.id,
      actor: req.user
    }).then(result => {
      console.log('Post published immediately:', result);
    }).catch(err => {
      console.error('Immediate publish failed:', err);
      db.update('contents', newPost.id, { status: 'FAILED', failureReason: err.message });
    });
  } else if (scheduledFor) {
    // Queue background publishing job (PUB-05)
    db.insert('publishingJobs', {
      id: `pub_${uuidv4().slice(0, 8)}`,
      contentId: newPost.id,
      businessId,
      brandId,
      socialAccountId: null,
      scheduledFor: newPost.scheduledFor,
      status: 'QUEUED',
      attempts: 0,
      lastAttemptAt: null,
      errorLog: null
    });
  }

  logAuditEvent({
    businessId,
    brandId,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: publishImmediately ? 'PUBLISH_CONTENT_IMMEDIATE' : (scheduledFor ? 'SCHEDULE_CONTENT' : 'CREATE_DRAFT'),
    entityType: 'CONTENT',
    entityId: newPost.id,
    details: `Created content "${newPost.title}" (${status}) for ${brand.name}.`
  });

  res.status(201).json(newPost);
});

// Update content item (CAL-08)
router.put('/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  const content = db.findById('contents', id);
  if (!content) return res.status(404).json({ error: 'Content item not found' });

  const updated = db.update('contents', id, updates);

  logAuditEvent({
    businessId: updated.businessId,
    brandId: updated.brandId,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'UPDATE_CONTENT',
    entityType: 'CONTENT',
    entityId: id,
    details: `Updated content item "${updated.title}"`
  });

  res.json(updated);
});

// Reschedule content item (CAL-06)
router.post('/:id/reschedule', (req, res) => {
  const { id } = req.params;
  const { scheduledFor } = req.body;

  if (!scheduledFor) {
    return res.status(400).json({ error: 'scheduledFor date is required' });
  }

  const content = db.findById('contents', id);
  if (!content) return res.status(404).json({ error: 'Content item not found' });

  const updated = db.update('contents', id, {
    scheduledFor: new Date(scheduledFor).toISOString(),
    status: 'SCHEDULED'
  });

  logAuditEvent({
    businessId: updated.businessId,
    brandId: updated.brandId,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'RESCHEDULE_CONTENT',
    entityType: 'CONTENT',
    entityId: id,
    details: `Rescheduled "${updated.title}" to ${updated.scheduledFor}`
  });

  res.json(updated);
});

// Publish now (PUB-01, PUB-03: Destination confirmation)
router.post('/:id/publish-now', async (req, res) => {
  const { id } = req.params;
  const { confirmed } = req.body;

  if (!confirmed) {
    return res.status(400).json({ error: 'Explicit destination confirmation required before publishing (PUB-03).' });
  }

  try {
    const result = await metaService.publishPost({
      contentId: id,
      actor: req.user
    });
    res.json(result);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Delete content item
router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const content = db.findById('contents', id);
  if (!content) return res.status(404).json({ error: 'Content item not found' });

  db.delete('contents', id);

  logAuditEvent({
    businessId: content.businessId,
    brandId: content.brandId,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'DELETE_CONTENT',
    entityType: 'CONTENT',
    entityId: id,
    details: `Deleted content item "${content.title}"`
  });

  res.json({ success: true, message: 'Content item deleted.' });
});

export default router;
