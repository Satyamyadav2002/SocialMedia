import express from 'express';
import { v4 as uuidv4 } from 'uuid';
import { db } from '../db.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// Get all businesses with summary metadata
router.get('/businesses', (req, res) => {
  const businesses = db.getTable('businesses');
  const brands = db.getTable('brands');
  const accounts = db.getTable('socialAccounts');

  const result = businesses.map(biz => {
    const bizBrands = brands.filter(b => b.businessId === biz.id);
    const bizAccounts = accounts.filter(a => a.businessId === biz.id);
    return {
      ...biz,
      brandCount: bizBrands.length,
      accountCount: bizAccounts.length,
      brands: bizBrands
    };
  });

  res.json(result);
});

// Create business
router.post('/businesses', (req, res) => {
  const { name, code, description, industry } = req.body;
  if (!name || !code) {
    return res.status(400).json({ error: 'Business name and code are required' });
  }

  const newBiz = {
    id: `biz_${code.toLowerCase()}_${uuidv4().slice(0, 4)}`,
    name,
    code: code.toUpperCase(),
    description: description || '',
    industry: industry || 'General',
    status: 'ACTIVE',
    createdAt: new Date().toISOString()
  };

  db.insert('businesses', newBiz);

  logAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'CREATE_BUSINESS',
    entityType: 'BUSINESS',
    entityId: newBiz.id,
    details: `Created new business entity: ${newBiz.name} (${newBiz.code})`
  });

  res.status(201).json(newBiz);
});

// Update business
router.put('/businesses/:id', (req, res) => {
  const { id } = req.params;
  const updates = req.body;
  const updated = db.update('businesses', id, updates);
  if (!updated) return res.status(404).json({ error: 'Business not found' });

  logAuditEvent({
    businessId: id,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'UPDATE_BUSINESS',
    entityType: 'BUSINESS',
    entityId: id,
    details: `Updated business profile: ${updated.name}`
  });

  res.json(updated);
});

// Get all brands (with optional businessId filter)
router.get('/brands', (req, res) => {
  const { businessId } = req.query;
  let brands = db.getTable('brands');
  if (businessId && businessId !== 'ALL') {
    brands = brands.filter(b => b.businessId === businessId);
  }

  const accounts = db.getTable('socialAccounts');
  const profiles = db.getTable('brandVoiceProfiles');

  const enriched = brands.map(b => {
    const brandAccounts = accounts.filter(a => a.brandId === b.id);
    const voiceProfile = profiles.find(p => p.brandId === b.id);
    return {
      ...b,
      accounts: brandAccounts,
      voiceProfile: voiceProfile || null
    };
  });

  res.json(enriched);
});

// Create brand under a business
router.post('/brands', (req, res) => {
  const { businessId, name, handle, description, logoUrl } = req.body;
  if (!businessId || !name) {
    return res.status(400).json({ error: 'businessId and name are required' });
  }

  const business = db.findById('businesses', businessId);
  if (!business) return res.status(404).json({ error: 'Parent business not found' });

  const newBrand = {
    id: `brd_${uuidv4().slice(0, 8)}`,
    businessId,
    name,
    handle: handle || name.toLowerCase().replace(/\s+/g, '_'),
    description: description || '',
    logoUrl: logoUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150',
    status: 'ACTIVE'
  };

  db.insert('brands', newBrand);

  // Initialize default brand voice profile
  const defaultVoice = {
    id: `bvp_${newBrand.id}`,
    brandId: newBrand.id,
    tone: 'Professional, friendly, and engaging',
    style: 'Clear, modern, and helpful with authentic expressions',
    targetAudience: 'Core brand consumers and online community',
    terminology: 'Approved phrases and positive messaging',
    bannedKeywords: ['spam', 'guaranteed cure', 'discount code free'],
    policies: 'Standard customer care escalation policies.',
    faqs: [
      { q: 'How can I contact support?', a: 'You can reach our team via direct message or official support email.' }
    ],
    approvedFacts: ['Officially verified brand account'],
    exampleGoodReplies: ['Thanks for reaching out! We would be delighted to assist you.'],
    exampleBadReplies: ['No comment.'],
    updatedAt: new Date().toISOString()
  };

  db.insert('brandVoiceProfiles', defaultVoice);

  logAuditEvent({
    businessId,
    brandId: newBrand.id,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'CREATE_BRAND',
    entityType: 'BRAND',
    entityId: newBrand.id,
    details: `Created new brand ${newBrand.name} under ${business.name}`
  });

  res.status(201).json({ ...newBrand, voiceProfile: defaultVoice });
});

// Get voice profile for a brand
router.get('/brands/:brandId/voice', (req, res) => {
  const { brandId } = req.params;
  const profile = db.findAll('brandVoiceProfiles', p => p.brandId === brandId)[0];
  if (!profile) {
    return res.status(404).json({ error: 'Brand voice profile not found' });
  }
  res.json(profile);
});

// Update voice profile for a brand (VOICE-01, VOICE-02, VOICE-06)
router.put('/brands/:brandId/voice', (req, res) => {
  const { brandId } = req.params;
  const updates = req.body;

  let profile = db.findAll('brandVoiceProfiles', p => p.brandId === brandId)[0];
  if (!profile) {
    profile = {
      id: `bvp_${brandId}`,
      brandId,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    db.insert('brandVoiceProfiles', profile);
  } else {
    profile = db.update('brandVoiceProfiles', profile.id, {
      ...updates,
      updatedAt: new Date().toISOString()
    });
  }

  const brand = db.findById('brands', brandId);

  logAuditEvent({
    businessId: brand?.businessId,
    brandId,
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'UPDATE_BRAND_VOICE',
    entityType: 'BRAND_VOICE',
    entityId: profile.id,
    details: `Updated brand voice, FAQs, and guidelines for ${brand?.name || brandId}.`
  });

  res.json(profile);
});

export default router;
