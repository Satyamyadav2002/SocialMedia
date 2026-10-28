import express from 'express';
import { generateReplySuggestions, generateSocialContent } from '../services/aiService.js';
import { metaService } from '../services/metaService.js';
import { db } from '../db.js';
import { logAuditEvent } from '../services/auditService.js';

const router = express.Router();

// Generate AI reply suggestions for an interaction (AI-01, AI-02, AI-03)
router.post('/suggest-reply', async (req, res) => {
  const { interactionId } = req.body;
  if (!interactionId) {
    return res.status(400).json({ error: 'interactionId is required' });
  }

  try {
    const result = await generateReplySuggestions(interactionId);

    // Save initial draft reply in db
    if (result.suggestions && result.suggestions.length > 0) {
      const topSuggestion = result.suggestions[0].text;
      const existingReplies = db.findAll('replies', r => r.interactionId === interactionId && r.status === 'DRAFT_READY');
      if (existingReplies.length === 0) {
        db.insert('replies', {
          id: `rep_${Date.now()}`,
          interactionId,
          draftText: topSuggestion,
          approvedText: null,
          status: 'DRAFT_READY',
          approvedByUserId: null,
          approvedAt: null,
          sentAt: null,
          failureReason: null,
          feedbackRating: null,
          auditNotes: 'AI drafted suggestions created.'
        });
        db.update('interactions', interactionId, { replyStatus: 'DRAFT_READY' });
      }
    }

    logAuditEvent({
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'GENERATE_AI_SUGGESTION',
      entityType: 'INTERACTION',
      entityId: interactionId,
      details: `Generated ${result.suggestions.length} brand-aware reply variants for interaction ${interactionId}.`
    });

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve and send reply (SAFE-01: Mandatory Human Approval, AI-06, SAFE-05, SAFE-06)
router.post('/approve-reply', async (req, res) => {
  const { interactionId, replyText, humanApproved } = req.body;

  if (!humanApproved) {
    return res.status(400).json({
      error: 'CRITICAL SAFETY GUARD: AI-generated replies CANNOT be sent autonomously. Explicit human approval confirmation is mandatory (SAFE-01).'
    });
  }

  if (!interactionId || !replyText || !replyText.trim()) {
    return res.status(400).json({ error: 'interactionId and replyText are required' });
  }

  try {
    const sendResult = await metaService.sendReply({
      interactionId,
      replyText: replyText.trim(),
      actor: req.user
    });

    res.json(sendResult);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Reject suggestion & record feedback (AI-07, AI-11)
router.post('/reject-reply', (req, res) => {
  const { interactionId, reason } = req.body;
  if (!interactionId) {
    return res.status(400).json({ error: 'interactionId is required' });
  }

  // Update reply draft if any
  const drafts = db.findAll('replies', r => r.interactionId === interactionId && r.status === 'DRAFT_READY');
  drafts.forEach(d => {
    db.update('replies', d.id, {
      status: 'REJECTED',
      failureReason: reason || 'Discarded by user',
      feedbackRating: 'NEGATIVE'
    });
  });

  db.update('interactions', interactionId, { replyStatus: 'NEEDS_RESPONSE' });

  logAuditEvent({
    actorId: req.user.id,
    actorName: req.user.name,
    actorRole: req.user.role,
    action: 'REJECT_AI_SUGGESTION',
    entityType: 'INTERACTION',
    entityId: interactionId,
    details: `User rejected AI suggestion. Feedback note: ${reason || 'No specific feedback'}`
  });

  res.json({ success: true, message: 'Suggestion discarded. You can write manually or regenerate.' });
});

// AI Content Studio Generator (CNT-01 to CNT-08)
router.post('/generate-content', async (req, res) => {
  const { businessId, brandId, topic, platform, format, toneOverride, campaignObjective } = req.body;
  if (!brandId) {
    return res.status(400).json({ error: 'brandId is required' });
  }

  try {
    const contentPackage = await generateSocialContent({
      businessId,
      brandId,
      topic,
      platform,
      format,
      toneOverride,
      campaignObjective
    });

    logAuditEvent({
      businessId,
      brandId,
      actorId: req.user.id,
      actorName: req.user.name,
      actorRole: req.user.role,
      action: 'GENERATE_AI_CONTENT',
      entityType: 'BRAND',
      entityId: brandId,
      details: `Generated social content options for topic "${topic || 'General'}" on ${platform}.`
    });

    res.json(contentPackage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
