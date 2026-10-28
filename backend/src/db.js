import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_FILE = path.join(__dirname, '..', 'data', 'db.json');

// Default Seed Data
const createInitialSeedData = () => {
  const salt = bcrypt.genSaltSync(10);
  const passwordHash = bcrypt.hashSync('password123', salt);

  const users = [
    {
      id: 'usr_admin',
      name: 'Sarah Connor',
      email: 'admin@company.internal',
      passwordHash,
      role: 'ADMIN',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      createdAt: '2026-01-15T08:00:00.000Z'
    },
    {
      id: 'usr_alex',
      name: 'Alex Rivera',
      email: 'alex@company.internal',
      passwordHash,
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      createdAt: '2026-02-01T09:30:00.000Z'
    },
    {
      id: 'usr_priya',
      name: 'Priya Sharma',
      email: 'priya@company.internal',
      passwordHash,
      role: 'TEAM_MEMBER',
      status: 'ACTIVE',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      createdAt: '2026-02-15T11:00:00.000Z'
    }
  ];

  const businesses = [
    {
      id: 'biz_apex',
      name: 'Apex Holdings',
      code: 'APEX',
      description: 'Health, wellness & lifestyle portfolio operations',
      industry: 'Health & Wellness',
      status: 'ACTIVE',
      createdAt: '2026-01-10T10:00:00.000Z'
    },
    {
      id: 'biz_velox',
      name: 'Velox Retail Group',
      code: 'VELOX',
      description: 'Modern consumer fashion, streetwear & modern home living brands',
      industry: 'Fashion & Consumer Goods',
      status: 'ACTIVE',
      createdAt: '2026-01-12T14:00:00.000Z'
    }
  ];

  const brands = [
    {
      id: 'brd_apex_fit',
      businessId: 'biz_apex',
      name: 'Apex Fitness Studio',
      handle: 'apexfitness',
      description: 'High-end functional fitness, group HIIT, and personalized wellness coaching.',
      logoUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'brd_pure_bite',
      businessId: 'biz_apex',
      name: 'PureBite Nutrition',
      handle: 'purebite_eats',
      description: 'Clean-label organic protein snacks, meal preps, and dietary supplements.',
      logoUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'brd_velox_kicks',
      businessId: 'biz_velox',
      name: 'Velox Footwear',
      handle: 'velox_kicks',
      description: 'Urban streetwear sneakers, sustainable athletic shoes, and limited drop collabs.',
      logoUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=150',
      status: 'ACTIVE'
    },
    {
      id: 'brd_aura_home',
      businessId: 'biz_velox',
      name: 'Aura Home Living',
      handle: 'aurahomeliving',
      description: 'Scandinavian minimalist home decor, linen bedding, and architectural ceramics.',
      logoUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=150',
      status: 'ACTIVE'
    }
  ];

  const brandVoiceProfiles = [
    {
      id: 'bvp_apex_fit',
      brandId: 'brd_apex_fit',
      tone: 'Energetic, motivational, knowledgeable, supportive yet direct',
      style: 'Concise sentences, empowering coaching phrases, fitness-oriented emojis (🔥, 💪, ⚡)',
      targetAudience: 'Fitness enthusiasts, busy professionals seeking high-impact workouts, beginner gym-goers',
      terminology: 'Use: "Team", "Athlete", "Training session", "Crush your goals". Avoid: "Cheap", "Hardcore pain", "Guarantee weight loss".',
      bannedKeywords: ['steroids', 'diet pill', 'guaranteed cure', 'refund immediately'],
      policies: 'Always offer a free 1-day pass for newcomers. For membership cancellations, kindly direct to member desk email support@apexfitness.internal.',
      faqs: [
        { q: 'What are gym opening hours?', a: 'Monday to Friday: 5:00 AM - 11:00 PM. Weekends: 6:00 AM - 9:00 PM.' },
        { q: 'How much is a monthly pass?', a: 'All-access starts at $79/month with unlimited group classes and locker amenities.' },
        { q: 'Do you offer personal training?', a: 'Yes! Certified trainers provide 1-on-1 assessment and customized routines.' }
      ],
      approvedFacts: [
        'Locations in downtown Metro and Uptown district.',
        'Olympic lifting platforms and sauna facilities available.'
      ],
      exampleGoodReplies: [
        'Hey @user! Thanks for reaching out 💪 We would love to have you for a trial session. Check your DM for a complimentary day pass!',
        'Great question! Our coaches are on the floor from 6 AM to guide your form. Drop by anytime!'
      ],
      exampleBadReplies: [
        'Idk check our website.',
        'You will lose 10kg in 10 days guaranteed.'
      ],
      updatedAt: '2026-02-20T10:00:00.000Z'
    },
    {
      id: 'bvp_pure_bite',
      brandId: 'brd_pure_bite',
      tone: 'Wellness-focused, science-backed, friendly, clear and transparent',
      style: 'Warm, informative, clean phrasing with gentle health emojis (🌱, 🥗, ✨)',
      targetAudience: 'Health-conscious consumers, vegans, athletes requiring clean protein',
      terminology: 'Use: "Clean fuel", "Wholesome ingredients", "Non-GMO", "Plant-powered". Avoid: "Miracle snack", "Zero carb magic".',
      bannedKeywords: ['cure diabetes', 'anti-cancer', 'artificial junk'],
      policies: 'All nutrition claims must refer to the USDA organic certification. Unopened returns accepted within 14 days.',
      faqs: [
        { q: 'Are your protein bars gluten-free?', a: 'Yes! All PureBite snack bars are certified 100% gluten-free and processed in a certified facility.' },
        { q: 'Where do you ship?', a: 'We ship across the continental US and Canada with standard 2-3 business day delivery.' }
      ],
      approvedFacts: ['100% plant-based protein', 'Zero artificial sweeteners or palm oil'],
      exampleGoodReplies: [
        'Hi there! 🌱 Every PureBite bar delivers 20g of clean organic protein with only 3g of sugar. We’d love for you to try the Almond Crunch!'
      ],
      exampleBadReplies: ['Our snacks cure fatigue instantly.'],
      updatedAt: '2026-02-21T11:00:00.000Z'
    },
    {
      id: 'bvp_velox_kicks',
      brandId: 'brd_velox_kicks',
      tone: 'Streetwise, trendy, confident, snappy and youth-centric',
      style: 'Fast-paced, modern streetwear slang, crisp visual references (👟, 🚀, ⚡)',
      targetAudience: 'Sneakerheads, Gen Z & Millennials, urban style trendsetters',
      terminology: 'Use: "Drop", "Fresh pair", "Silhouette", "Restock alert". Avoid: "Formal footwear", "Elderly orthotics".',
      bannedKeywords: ['replica', 'fake', 'cheap shoes'],
      policies: 'Drops sell on a first-come, first-served basis. Exchanges for sizing allowed within 30 days if unworn in original box.',
      faqs: [
        { q: 'When is the next drop?', a: 'Every Friday at 10:00 AM EST on our official storefront and app.' },
        { q: 'How do the shoes fit?', a: 'Our silhouettes run true to size (TTS). For wide feet, we recommend going half a size up.' }
      ],
      approvedFacts: ['Made with 40% recycled ocean plastics', 'Shock-absorbing dual-density foam'],
      exampleGoodReplies: [
        'Appreciate the love! 👟 Sizing runs true to size. If you want a little extra room, half-size up is the way to go.'
      ],
      exampleBadReplies: ['We will send you a free pair right now.'],
      updatedAt: '2026-02-22T14:30:00.000Z'
    },
    {
      id: 'bvp_aura_home',
      brandId: 'brd_aura_home',
      tone: 'Sophisticated, calming, aesthetic, warm and inspiring',
      style: 'Gentle, refined, focused on intentional living and craftsmanship (🕯️, 🌿, 🏡)',
      targetAudience: 'Interior design lovers, homeowners seeking serene minimalism',
      terminology: 'Use: "Crafted", "Tactile texture", "Sanctuary", "Curated space".',
      bannedKeywords: ['discount blowout', 'cheap plastic'],
      policies: 'Handcrafted ceramic items have slight natural variations in glaze.',
      faqs: [
        { q: 'Are ceramic vases watertight?', a: 'Yes, all our interior vessels are high-fire glazed and safe for fresh floral arrangements.' }
      ],
      approvedFacts: ['Ethically sourced French linen', 'Lead-free stoneware clay'],
      exampleGoodReplies: [
        'Thank you so much! 🌿 The Luna Vase is hand-thrown with textured stoneware to bring warmth to any reading corner.'
      ],
      exampleBadReplies: ['Buy two get three free today only.'],
      updatedAt: '2026-02-23T16:00:00.000Z'
    }
  ];

  const socialAccounts = [
    {
      id: 'acc_apex_fb',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      platform: 'FACEBOOK',
      accountType: 'FACEBOOK_PAGE',
      accountName: 'Apex Fitness Studio Official',
      handle: 'apexfitness.official',
      externalId: 'fb_page_1029384756',
      profilePictureUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=100',
      tokenStatus: 'VALID',
      tokenExpiresAt: '2026-12-31T23:59:59.000Z',
      permissionsGranted: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts', 'pages_messaging'],
      lastSyncedAt: '2026-10-27T10:45:00.000Z',
      createdAt: '2026-01-20T10:00:00.000Z'
    },
    {
      id: 'acc_apex_ig',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      platform: 'INSTAGRAM',
      accountType: 'INSTAGRAM_PROFESSIONAL',
      accountName: 'Apex Fitness IG',
      handle: 'apexfitness_official',
      externalId: 'ig_user_8839201938',
      profilePictureUrl: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=100',
      tokenStatus: 'VALID',
      tokenExpiresAt: '2026-12-31T23:59:59.000Z',
      permissionsGranted: ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages'],
      lastSyncedAt: '2026-10-27T11:00:00.000Z',
      createdAt: '2026-01-20T10:15:00.000Z'
    },
    {
      id: 'acc_pure_ig',
      businessId: 'biz_apex',
      brandId: 'brd_pure_bite',
      platform: 'INSTAGRAM',
      accountType: 'INSTAGRAM_PROFESSIONAL',
      accountName: 'PureBite Nutrition',
      handle: 'purebite_eats',
      externalId: 'ig_user_7726354812',
      profilePictureUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=100',
      tokenStatus: 'VALID',
      tokenExpiresAt: '2026-12-31T23:59:59.000Z',
      permissionsGranted: ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages'],
      lastSyncedAt: '2026-10-27T09:30:00.000Z',
      createdAt: '2026-01-22T14:00:00.000Z'
    },
    {
      id: 'acc_velox_fb',
      businessId: 'biz_velox',
      brandId: 'brd_velox_kicks',
      platform: 'FACEBOOK',
      accountType: 'FACEBOOK_PAGE',
      accountName: 'Velox Footwear Global',
      handle: 'veloxshoes',
      externalId: 'fb_page_5564738291',
      profilePictureUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100',
      tokenStatus: 'VALID',
      tokenExpiresAt: '2026-12-31T23:59:59.000Z',
      permissionsGranted: ['pages_show_list', 'pages_read_engagement', 'pages_manage_posts'],
      lastSyncedAt: '2026-10-27T10:15:00.000Z',
      createdAt: '2026-02-01T12:00:00.000Z'
    },
    {
      id: 'acc_velox_ig',
      businessId: 'biz_velox',
      brandId: 'brd_velox_kicks',
      platform: 'INSTAGRAM',
      accountType: 'INSTAGRAM_PROFESSIONAL',
      accountName: 'Velox Kicks Instagram',
      handle: 'velox_kicks',
      externalId: 'ig_user_4439281729',
      profilePictureUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100',
      tokenStatus: 'VALID',
      tokenExpiresAt: '2026-12-31T23:59:59.000Z',
      permissionsGranted: ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages'],
      lastSyncedAt: '2026-10-27T10:50:00.000Z',
      createdAt: '2026-02-01T12:30:00.000Z'
    },
    {
      id: 'acc_aura_ig',
      businessId: 'biz_velox',
      brandId: 'brd_aura_home',
      platform: 'INSTAGRAM',
      accountType: 'INSTAGRAM_PROFESSIONAL',
      accountName: 'Aura Home Living',
      handle: 'aurahomeliving',
      externalId: 'ig_user_2239481722',
      profilePictureUrl: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?w=100',
      tokenStatus: 'VALID',
      tokenExpiresAt: '2026-12-31T23:59:59.000Z',
      permissionsGranted: ['instagram_basic', 'instagram_manage_comments', 'instagram_manage_messages'],
      lastSyncedAt: '2026-10-27T08:20:00.000Z',
      createdAt: '2026-02-05T09:00:00.000Z'
    }
  ];

  const interactions = [
    {
      id: 'int_001',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      socialAccountId: 'acc_apex_ig',
      platform: 'INSTAGRAM',
      interactionType: 'COMMENT',
      externalId: 'ig_cmt_9918237461',
      parentExternalId: 'ig_post_110293847',
      postTitle: 'High-Intensity interval coach training session highlight 🔥',
      postMediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300',
      authorName: 'Marcus Bennett',
      authorHandle: 'marcus_fit99',
      authorAvatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100',
      content: 'Do you offer a guest pass or day trial for tourists visiting town this weekend? Looking for a solid place to train on Saturday morning!',
      timestamp: '2026-10-27T08:15:00.000Z',
      readStatus: 'UNREAD',
      replyStatus: 'NEEDS_RESPONSE',
      priority: 'HIGH',
      internalNotes: 'Prospective member visiting town. Prioritize quick turnaround.',
      assignedToUserId: 'usr_alex',
      isSensitive: false
    },
    {
      id: 'int_002',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      socialAccountId: 'acc_apex_fb',
      platform: 'FACEBOOK',
      interactionType: 'DM',
      externalId: 'fb_dm_773645281',
      parentExternalId: null,
      postTitle: 'Direct Message',
      postMediaUrl: null,
      authorName: 'Elena Rostova',
      authorHandle: 'elena.rostova.55',
      authorAvatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100',
      content: 'Hi! I wanted to inquire about personal training packages for rehabilitation after knee arthroscopy. Do coaches have physical therapy credentials?',
      timestamp: '2026-10-27T09:20:00.000Z',
      readStatus: 'READ',
      replyStatus: 'DRAFT_READY',
      priority: 'NORMAL',
      internalNotes: 'Coach David specializes in post-op rehab.',
      assignedToUserId: 'usr_priya',
      isSensitive: false
    },
    {
      id: 'int_003',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      socialAccountId: 'acc_apex_ig',
      platform: 'INSTAGRAM',
      interactionType: 'COMMENT',
      externalId: 'ig_cmt_882736152',
      parentExternalId: 'ig_post_110293847',
      postTitle: 'High-Intensity interval coach training session highlight 🔥',
      postMediaUrl: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=300',
      authorName: 'Dave Miller',
      authorHandle: 'dave_m_lift',
      authorAvatar: 'https://images.unsplash.com/photo-1522075469751-3a6694fb2f61?w=100',
      content: 'I requested to cancel my auto-renew membership two weeks ago and your desk still charged me $79 yesterday! This is unacceptable, fix this immediately or I am filing a bank dispute.',
      timestamp: '2026-10-27T10:05:00.000Z',
      readStatus: 'UNREAD',
      replyStatus: 'NEEDS_RESPONSE',
      priority: 'URGENT',
      internalNotes: 'Billing complaint escalated. Needs immediate human empathy and refund check.',
      assignedToUserId: 'usr_admin',
      isSensitive: true
    },
    {
      id: 'int_004',
      businessId: 'biz_velox',
      brandId: 'brd_velox_kicks',
      socialAccountId: 'acc_velox_ig',
      platform: 'INSTAGRAM',
      interactionType: 'COMMENT',
      externalId: 'ig_cmt_334958172',
      parentExternalId: 'ig_post_44920192',
      postTitle: 'The Phantom Carbon Runner - Drops this Friday 10AM EST ⚡',
      postMediaUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300',
      authorName: 'Jordan Vance',
      authorHandle: 'jvance_kicks',
      authorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100',
      content: 'Will these drop in size US 13? Also does it ship to the UK or US only?',
      timestamp: '2026-10-27T10:30:00.000Z',
      readStatus: 'UNREAD',
      replyStatus: 'NEEDS_RESPONSE',
      priority: 'HIGH',
      internalNotes: 'Check UK shipping rates and size 13 stock allocation.',
      assignedToUserId: null,
      isSensitive: false
    },
    {
      id: 'int_005',
      businessId: 'biz_velox',
      brandId: 'brd_velox_kicks',
      socialAccountId: 'acc_velox_fb',
      platform: 'FACEBOOK',
      interactionType: 'COMMENT',
      externalId: 'fb_cmt_119283746',
      parentExternalId: 'fb_post_88920194',
      postTitle: 'Recycled Ocean Thread Collection Launch',
      postMediaUrl: 'https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=300',
      authorName: 'Clara Oswald',
      authorHandle: 'clara.oswald.fb',
      authorAvatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      content: 'Love this initiative! Truly inspiring to see eco-friendly sneaker construction that still looks slick.',
      timestamp: '2026-10-27T07:45:00.000Z',
      readStatus: 'READ',
      replyStatus: 'APPROVED_SENT',
      priority: 'NORMAL',
      internalNotes: 'Already responded with brand appreciation.',
      assignedToUserId: 'usr_alex',
      isSensitive: false
    },
    {
      id: 'int_006',
      businessId: 'biz_velox',
      brandId: 'brd_aura_home',
      socialAccountId: 'acc_aura_ig',
      platform: 'INSTAGRAM',
      interactionType: 'DM',
      externalId: 'ig_dm_665432198',
      parentExternalId: null,
      postTitle: 'Direct Message',
      postMediaUrl: null,
      authorName: 'Sophia Lindqvist',
      authorHandle: 'nordic_living_sophia',
      authorAvatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=100',
      content: 'Hello Aura team! We are styling an architectural photoshoot in Malibu next week. Are you open to loaning 3 ceramic pieces in exchange for featured photography credits and tags?',
      timestamp: '2026-10-27T10:40:00.000Z',
      readStatus: 'UNREAD',
      replyStatus: 'NEEDS_RESPONSE',
      priority: 'HIGH',
      internalNotes: 'Influencer / PR collab inquiry. Check Malibu delivery logistics.',
      assignedToUserId: 'usr_sarah',
      isSensitive: false
    },
    {
      id: 'int_007',
      businessId: 'biz_apex',
      brandId: 'brd_pure_bite',
      socialAccountId: 'acc_pure_ig',
      platform: 'INSTAGRAM',
      interactionType: 'COMMENT',
      externalId: 'ig_cmt_552194821',
      parentExternalId: 'ig_post_99201948',
      postTitle: 'Matcha Crisp & Almond Crunch Protein Bars are back in stock 🌱',
      postMediaUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=300',
      authorName: 'Liam Chen',
      authorHandle: 'liam_eats_clean',
      authorAvatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      content: 'Are these sweetened with Stevia or monk fruit? Stevia usually leaves a bitter aftertaste for me.',
      timestamp: '2026-10-27T09:50:00.000Z',
      readStatus: 'UNREAD',
      replyStatus: 'NEEDS_RESPONSE',
      priority: 'NORMAL',
      internalNotes: 'Clarify sweetener profile (organic monk fruit & date paste).',
      assignedToUserId: null,
      isSensitive: false
    }
  ];

  const classifications = [
    {
      id: 'cls_001',
      interactionId: 'int_001',
      sentiment: 'POSITIVE',
      isQuestion: true,
      isPricingInquiry: false,
      isLeadIntent: true,
      isSensitive: false,
      priority: 'HIGH',
      manuallyOverridden: false
    },
    {
      id: 'cls_002',
      interactionId: 'int_002',
      sentiment: 'NEUTRAL',
      isQuestion: true,
      isPricingInquiry: true,
      isLeadIntent: true,
      isSensitive: false,
      priority: 'NORMAL',
      manuallyOverridden: false
    },
    {
      id: 'cls_003',
      interactionId: 'int_003',
      sentiment: 'NEGATIVE',
      isQuestion: false,
      isPricingInquiry: false,
      isLeadIntent: false,
      isSensitive: true,
      priority: 'URGENT',
      manuallyOverridden: false
    },
    {
      id: 'cls_004',
      interactionId: 'int_004',
      sentiment: 'NEUTRAL',
      isQuestion: true,
      isPricingInquiry: false,
      isLeadIntent: true,
      isSensitive: false,
      priority: 'HIGH',
      manuallyOverridden: false
    },
    {
      id: 'cls_005',
      interactionId: 'int_005',
      sentiment: 'POSITIVE',
      isQuestion: false,
      isPricingInquiry: false,
      isLeadIntent: false,
      isSensitive: false,
      priority: 'NORMAL',
      manuallyOverridden: false
    },
    {
      id: 'cls_006',
      interactionId: 'int_006',
      sentiment: 'POSITIVE',
      isQuestion: true,
      isPricingInquiry: false,
      isLeadIntent: true,
      isSensitive: false,
      priority: 'HIGH',
      manuallyOverridden: false
    },
    {
      id: 'cls_007',
      interactionId: 'int_007',
      sentiment: 'NEUTRAL',
      isQuestion: true,
      isPricingInquiry: false,
      isLeadIntent: false,
      isSensitive: false,
      priority: 'NORMAL',
      manuallyOverridden: false
    }
  ];

  const replies = [
    {
      id: 'rep_002',
      interactionId: 'int_002',
      draftText: 'Hi Elena! Yes, our senior trainers work closely with physical therapy protocols for post-op mobility and strength rebuilding. Coach David holds specialized post-rehab certifications. Would you like us to schedule a brief 10-minute consult call with him?',
      approvedText: null,
      status: 'DRAFT_READY',
      approvedByUserId: null,
      approvedAt: null,
      sentAt: null,
      failureReason: null,
      feedbackRating: null,
      auditNotes: 'AI drafted with brand voice guidelines. Awaiting human approval.'
    },
    {
      id: 'rep_005',
      interactionId: 'int_005',
      draftText: 'Thank you Clara! 🌿 We believe high performance and planet care can go hand in hand. Appreciate your support!',
      approvedText: 'Thank you Clara! 🌿 We believe high performance and planet care can go hand in hand. Appreciate your support!',
      status: 'SENT',
      approvedByUserId: 'usr_alex',
      approvedAt: '2026-10-27T08:00:00.000Z',
      sentAt: '2026-10-27T08:00:02.000Z',
      failureReason: null,
      feedbackRating: 'POSITIVE',
      auditNotes: 'Approved by Alex Rivera and dispatched via Meta Graph API.'
    }
  ];

  const contents = [
    {
      id: 'cnt_001',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      title: 'Weekend Morning HIIT Blast Kickoff',
      bodyText: 'Push past your comfort zone this Saturday! ⚡ Our head coaches are running a high-energy team conditioning circuit at 8:30 AM. Complimentary hydration boosters on deck for every athlete. Drop a 🔥 in the comments if we will see you on the floor!',
      mediaUrls: ['https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600'],
      platforms: ['INSTAGRAM', 'FACEBOOK'],
      formats: ['FEED_POST'],
      hashtags: ['#ApexFitness', '#HIITWorkout', '#Conditioning', '#FitnessCommunity', '#SaturdaySweat'],
      callToAction: 'Book your spot via the bio link or comment below!',
      status: 'SCHEDULED',
      scheduledFor: '2026-10-28T03:00:00.000Z', // Tomorrow
      publishedAt: null,
      platformPostId: null,
      platformPostUrl: null,
      createdAt: '2026-10-26T14:00:00.000Z'
    },
    {
      id: 'cnt_002',
      businessId: 'biz_velox',
      brandId: 'brd_velox_kicks',
      title: 'Phantom Carbon Runner Official Reveal',
      bodyText: 'Precision engineered from 40% ocean plastics with dual-density foam propulsion. 🚀 The Phantom Carbon Runner drops this Friday at 10 AM EST. Limited quantities per size. Set your reminder now.',
      mediaUrls: ['https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600'],
      platforms: ['INSTAGRAM'],
      formats: ['REEL', 'FEED_POST'],
      hashtags: ['#VeloxKicks', '#SneakerDrop', '#StreetwearStyle', '#SustainableKicks', '#Sneakerhead'],
      callToAction: 'Tap the link in bio to join the priority SMS drop list.',
      status: 'SCHEDULED',
      scheduledFor: '2026-10-30T14:00:00.000Z',
      publishedAt: null,
      platformPostId: null,
      platformPostUrl: null,
      createdAt: '2026-10-25T11:00:00.000Z'
    },
    {
      id: 'cnt_003',
      businessId: 'biz_velox',
      brandId: 'brd_aura_home',
      title: 'Morning Light & Minimalist Stoneware',
      bodyText: 'Curating a serene sanctuary begins with small, intentional details. 🌿 Hand-thrown with natural clay glazes, each Luna Vase brings organic harmony to quiet mornings.',
      mediaUrls: ['https://images.unsplash.com/photo-1513694203232-719a280e022f?w=600'],
      platforms: ['INSTAGRAM'],
      formats: ['FEED_POST'],
      hashtags: ['#AuraHomeLiving', '#MinimalistDecor', '#CeramicArt', '#QuietLuxury', '#SlowLiving'],
      callToAction: 'Discover the full Autumn Ceramics collection on our website.',
      status: 'PUBLISHED',
      scheduledFor: '2026-10-26T16:00:00.000Z',
      publishedAt: '2026-10-26T16:00:04.000Z',
      platformPostId: 'ig_post_aur_77491',
      platformPostUrl: 'https://instagram.com/p/aur_77491',
      createdAt: '2026-10-25T10:00:00.000Z'
    },
    {
      id: 'cnt_004',
      businessId: 'biz_apex',
      brandId: 'brd_pure_bite',
      title: 'Fueling Your Afternoon Brainpower',
      bodyText: 'Say goodbye to 3 PM sugar crashes 🌱 PureBite Organic Matcha Crisp packs 20g of clean plant protein and real stone-ground Japanese matcha for clean, sustained energy.',
      mediaUrls: ['https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600'],
      platforms: ['INSTAGRAM'],
      formats: ['FEED_POST'],
      hashtags: ['#PureBite', '#PlantProtein', '#MatchaEnergy', '#CleanSnacks', '#HealthyLiving'],
      callToAction: 'Order the sample 6-pack today with free standard shipping!',
      status: 'DRAFT',
      scheduledFor: null,
      publishedAt: null,
      platformPostId: null,
      platformPostUrl: null,
      createdAt: '2026-10-27T07:00:00.000Z'
    }
  ];

  const auditEvents = [
    {
      id: 'aud_001',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      actorId: 'usr_admin',
      actorName: 'Sarah Connor',
      actorRole: 'ADMIN',
      action: 'USER_LOGIN',
      entityType: 'SESSION',
      entityId: 'sess_1',
      details: 'Administrator logged into shared operations dashboard.',
      timestamp: '2026-10-27T08:00:00.000Z'
    },
    {
      id: 'aud_002',
      businessId: 'biz_velox',
      brandId: 'brd_velox_kicks',
      actorId: 'usr_alex',
      actorName: 'Alex Rivera',
      actorRole: 'TEAM_MEMBER',
      action: 'APPROVE_REPLY',
      entityType: 'REPLY',
      entityId: 'rep_005',
      details: 'Human approved AI suggestion for interaction int_005 and dispatched to Meta API.',
      timestamp: '2026-10-27T08:00:02.000Z'
    },
    {
      id: 'aud_003',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      actorId: 'usr_priya',
      actorName: 'Priya Sharma',
      actorRole: 'TEAM_MEMBER',
      action: 'GENERATE_AI_REPLY',
      entityType: 'REPLY',
      entityId: 'rep_002',
      details: 'Generated 3 brand-tailored draft suggestions for DM from Elena Rostova.',
      timestamp: '2026-10-27T09:25:00.000Z'
    },
    {
      id: 'aud_004',
      businessId: 'biz_velox',
      brandId: 'brd_aura_home',
      actorId: 'usr_admin',
      actorName: 'Sarah Connor',
      actorRole: 'ADMIN',
      action: 'PUBLISH_CONTENT',
      entityType: 'CONTENT',
      entityId: 'cnt_003',
      details: 'Post successfully published to Instagram account @aurahomeliving.',
      timestamp: '2026-10-26T16:00:04.000Z'
    }
  ];

  const syncJobs = [
    {
      id: 'sync_001',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      socialAccountId: 'acc_apex_ig',
      platform: 'INSTAGRAM',
      jobType: 'INCREMENTAL_SYNC',
      status: 'SUCCESS',
      itemsProcessed: 14,
      errorDetails: null,
      startedAt: '2026-10-27T11:00:00.000Z',
      completedAt: '2026-10-27T11:00:03.000Z'
    },
    {
      id: 'sync_002',
      businessId: 'biz_velox',
      brandId: 'brd_velox_kicks',
      socialAccountId: 'acc_velox_ig',
      platform: 'INSTAGRAM',
      jobType: 'INCREMENTAL_SYNC',
      status: 'SUCCESS',
      itemsProcessed: 9,
      errorDetails: null,
      startedAt: '2026-10-27T10:50:00.000Z',
      completedAt: '2026-10-27T10:50:02.000Z'
    }
  ];

  const publishingJobs = [
    {
      id: 'pub_001',
      contentId: 'cnt_001',
      businessId: 'biz_apex',
      brandId: 'brd_apex_fit',
      socialAccountId: 'acc_apex_ig',
      scheduledFor: '2026-10-28T03:00:00.000Z',
      status: 'QUEUED',
      attempts: 0,
      lastAttemptAt: null,
      errorLog: null
    },
    {
      id: 'pub_002',
      contentId: 'cnt_002',
      businessId: 'biz_velox',
      brandId: 'brd_velox_kicks',
      socialAccountId: 'acc_velox_ig',
      scheduledFor: '2026-10-30T14:00:00.000Z',
      status: 'QUEUED',
      attempts: 0,
      lastAttemptAt: null,
      errorLog: null
    }
  ];

  const systemSettings = {
    metaAppId: 'meta_app_99182374619',
    metaApiVersion: 'v21.0',
    metaWebhookVerifyToken: 'agy_meta_webhook_secure_token_2026',
    aiProvider: 'GEMINI',
    aiModel: 'gemini-1.5-pro',
    enforceHumanApproval: true,
    autoSyncIntervalMinutes: 5,
    rateLimitThreshold: 200,
    maxRetries: 3
  };

  return {
    users,
    businesses,
    brands,
    brandVoiceProfiles,
    socialAccounts,
    interactions,
    classifications,
    replies,
    contents,
    auditEvents,
    syncJobs,
    publishingJobs,
    systemSettings
  };
};

class Database {
  constructor() {
    this.data = null;
    this.init();
  }

  init() {
    try {
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        this.data = JSON.parse(raw);
      } else {
        this.data = createInitialSeedData();
        this.save();
      }
    } catch (err) {
      console.error('Error loading DB file, recreating seed data:', err);
      this.data = createInitialSeedData();
      this.save();
    }
  }

  save() {
    try {
      const dir = path.dirname(DATA_FILE);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error saving DB:', err);
    }
  }

  // Generic helpers
  getTable(tableName) {
    if (!this.data[tableName]) {
      this.data[tableName] = [];
    }
    return this.data[tableName];
  }

  findAll(tableName, predicate = () => true) {
    return this.getTable(tableName).filter(predicate);
  }

  findById(tableName, id) {
    return this.getTable(tableName).find(item => item.id === id);
  }

  insert(tableName, item) {
    this.getTable(tableName).unshift(item);
    this.save();
    return item;
  }

  update(tableName, id, updates) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) return null;
    table[index] = { ...table[index], ...updates };
    this.save();
    return table[index];
  }

  delete(tableName, id) {
    const table = this.getTable(tableName);
    const index = table.findIndex(item => item.id === id);
    if (index === -1) return false;
    table.splice(index, 1);
    this.save();
    return true;
  }
}

export const db = new Database();
