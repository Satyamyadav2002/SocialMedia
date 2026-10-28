import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';
import { logAuditEvent } from './auditService.js';

// Idempotency cache to prevent duplicate sends (SAFE-06)
const sentIdempotencyKeys = new Set();

export const metaService = {
  // Validate account connection & token
  validateAccount: (socialAccountId) => {
    const account = db.findById('socialAccounts', socialAccountId);
    if (!account) {
      throw new Error('Social account not found');
    }
    const isValid = account.tokenStatus === 'VALID';
    return {
      accountId: account.id,
      platform: account.platform,
      handle: account.handle,
      status: account.tokenStatus,
      expiresAt: account.tokenExpiresAt,
      permissions: account.permissionsGranted,
      isHealthy: isValid
    };
  },

  // Send a comment reply or DM through Meta API (with human approval validation)
  sendReply: async ({ interactionId, replyText, actor, idempotencyKey = null }) => {
    // Duplicate prevention check
    const dedupKey = idempotencyKey || `${interactionId}_${replyText.trim()}`;
    if (sentIdempotencyKeys.has(dedupKey)) {
      throw new Error('Duplicate reply prevented: This reply has already been sent to this interaction.');
    }

    const interaction = db.findById('interactions', interactionId);
    if (!interaction) {
      throw new Error('Interaction not found');
    }

    const account = db.findById('socialAccounts', interaction.socialAccountId);
    if (!account) {
      throw new Error('Associated social account not found');
    }

    if (account.tokenStatus !== 'VALID') {
      throw new Error(`Cannot send: Meta token is ${account.tokenStatus}. Please reauthorize the account in settings.`);
    }

    // Record idempotency
    sentIdempotencyKeys.add(dedupKey);

    // Simulate network delay & Graph API response
    const externalReplyId = interaction.platform === 'INSTAGRAM' 
      ? `ig_rep_${Date.now()}` 
      : `fb_rep_${Date.now()}`;

    // Update reply in database
    const replyRecord = {
      id: `rep_${uuidv4().slice(0, 8)}`,
      interactionId,
      draftText: replyText,
      approvedText: replyText,
      status: 'SENT',
      approvedByUserId: actor.id,
      approvedAt: new Date().toISOString(),
      sentAt: new Date().toISOString(),
      failureReason: null,
      feedbackRating: 'APPROVED',
      auditNotes: `Approved and sent by ${actor.name} (${actor.role}) via ${account.platform} Graph API.`
    };

    db.insert('replies', replyRecord);

    // Update interaction status
    db.update('interactions', interactionId, {
      replyStatus: 'APPROVED_SENT',
      readStatus: 'READ'
    });

    // Log audit event (IAM-06)
    logAuditEvent({
      businessId: interaction.businessId,
      brandId: interaction.brandId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'APPROVE_AND_SEND_REPLY',
      entityType: 'INTERACTION',
      entityId: interactionId,
      details: `Sent approved response to ${interaction.authorName} on ${interaction.platform}: "${replyText.slice(0, 60)}..."`
    });

    return {
      success: true,
      externalReplyId,
      replyRecord,
      timestamp: new Date().toISOString()
    };
  },

  // Publish content directly to Meta (Facebook Page or Instagram Feed)
  publishPost: async ({ contentId, actor }) => {
    const content = db.findById('contents', contentId);
    if (!content) {
      throw new Error('Content item not found');
    }

    const brand = db.findById('brands', content.brandId);
    // Find connected account for this brand
    const accounts = db.findAll('socialAccounts', a => a.brandId === content.brandId && a.tokenStatus === 'VALID');
    if (accounts.length === 0) {
      throw new Error(`No active social accounts connected for brand ${brand?.name || content.brandId}`);
    }

    const targetAccount = accounts[0];
    const postId = `${targetAccount.platform.toLowerCase()}_post_${Date.now()}`;
    const postUrl = targetAccount.platform === 'INSTAGRAM'
      ? `https://instagram.com/p/${postId.slice(-8)}`
      : `https://facebook.com/${targetAccount.handle}/posts/${postId.slice(-8)}`;

    const now = new Date().toISOString();

    db.update('contents', contentId, {
      status: 'PUBLISHED',
      publishedAt: now,
      platformPostId: postId,
      platformPostUrl: postUrl
    });

    logAuditEvent({
      businessId: content.businessId,
      brandId: content.brandId,
      actorId: actor.id,
      actorName: actor.name,
      actorRole: actor.role,
      action: 'PUBLISH_CONTENT',
      entityType: 'CONTENT',
      entityId: contentId,
      details: `Post "${content.title}" successfully published to ${targetAccount.platform} (${targetAccount.accountName}). URL: ${postUrl}`
    });

    return {
      success: true,
      postId,
      postUrl,
      targetAccount: targetAccount.accountName,
      platform: targetAccount.platform,
      publishedAt: now
    };
  },

  // Simulate receiving a live webhook interaction from Meta (SYNC-06)
  simulateIncomingWebhook: ({ brandId, platform = 'INSTAGRAM', interactionType = 'COMMENT', authorName, contentText }) => {
    const brand = db.findById('brands', brandId);
    if (!brand) throw new Error('Brand not found');

    const accounts = db.findAll('socialAccounts', a => a.brandId === brandId && a.platform === platform);
    const account = accounts[0] || db.findAll('socialAccounts', a => a.brandId === brandId)[0];

    const newId = `int_${uuidv4().slice(0, 8)}`;
    const interaction = {
      id: newId,
      businessId: brand.businessId,
      brandId: brand.id,
      socialAccountId: account ? account.id : 'acc_apex_ig',
      platform,
      interactionType,
      externalId: `${platform.toLowerCase()}_${Date.now()}`,
      parentExternalId: interactionType === 'COMMENT' ? 'post_mock_parent' : null,
      postTitle: interactionType === 'COMMENT' ? 'Recent Community Post' : 'Direct Conversation',
      postMediaUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=300',
      authorName: authorName || 'Social User',
      authorHandle: (authorName || 'social_user').toLowerCase().replace(/\s+/g, '_'),
      authorAvatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100',
      content: contentText || 'Hello! Excited to learn more about your brand and products.',
      timestamp: new Date().toISOString(),
      readStatus: 'UNREAD',
      replyStatus: 'NEEDS_RESPONSE',
      priority: 'NORMAL',
      internalNotes: '',
      assignedToUserId: null,
      isSensitive: false
    };

    // Auto classify
    const lower = interaction.content.toLowerCase();
    const isQuestion = lower.includes('?') || lower.includes('how') || lower.includes('what');
    const isPricing = lower.includes('price') || lower.includes('cost') || lower.includes('$');
    const isComplaint = lower.includes('cancel') || lower.includes('refund') || lower.includes('scam') || lower.includes('terrible');

    const classification = {
      id: `cls_${uuidv4().slice(0, 8)}`,
      interactionId: newId,
      sentiment: isComplaint ? 'NEGATIVE' : (lower.includes('love') || lower.includes('great') ? 'POSITIVE' : 'NEUTRAL'),
      isQuestion,
      isPricingInquiry: isPricing,
      isLeadIntent: isPricing || lower.includes('order') || lower.includes('buy'),
      isSensitive: isComplaint,
      priority: isComplaint ? 'URGENT' : (isPricing ? 'HIGH' : 'NORMAL'),
      manuallyOverridden: false
    };

    interaction.priority = classification.priority;
    interaction.isSensitive = classification.isSensitive;

    db.insert('interactions', interaction);
    db.insert('classifications', classification);

    logAuditEvent({
      businessId: brand.businessId,
      brandId: brand.id,
      actorId: 'meta_webhook',
      actorName: 'Meta Webhook Receiver',
      actorRole: 'SYSTEM',
      action: 'WEBHOOK_INTERACTION_RECEIVED',
      entityType: 'INTERACTION',
      entityId: newId,
      details: `Received inbound ${platform} ${interactionType} from ${interaction.authorName}.`
    });

    return interaction;
  }
};
