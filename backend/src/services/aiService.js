import { db } from '../db.js';

// Sensitive topics & escalation keywords detector
export const detectSafetyFlags = (text = '') => {
  const lower = text.toLowerCase();
  const escalationKeywords = [
    'dispute', 'charge', 'refund', 'unacceptable', 'lawyer', 'legal', 
    'sue', 'police', 'stolen', 'fraud', 'bank', 'scam', 'injured', 'allergic', 'hospital'
  ];
  const pricingKeywords = ['price', 'pricing', 'cost', 'how much', 'fee', 'rates', '$', 'expensive', 'discount', 'quote'];
  const questionKeywords = ['?', 'how', 'what', 'when', 'where', 'why', 'who', 'can i', 'do you', 'is there'];

  const foundEscalation = escalationKeywords.filter(k => lower.includes(k));
  const isPricing = pricingKeywords.some(k => lower.includes(k));
  const isQuestion = questionKeywords.some(k => lower.includes(k));
  const isUrgent = foundEscalation.length > 0;

  return {
    isSensitive: foundEscalation.length > 0,
    escalationReasons: foundEscalation,
    isPricingInquiry: isPricing,
    isQuestion: isQuestion,
    priority: isUrgent ? 'URGENT' : (isPricing ? 'HIGH' : 'NORMAL'),
    sentiment: foundEscalation.length > 0 ? 'NEGATIVE' : (lower.includes('love') || lower.includes('awesome') || lower.includes('great') || lower.includes('thanks') || lower.includes('inspiring') ? 'POSITIVE' : 'NEUTRAL')
  };
};

// Generate multiple brand-aware reply suggestions
export const generateReplySuggestions = async (interactionId) => {
  const interaction = db.findById('interactions', interactionId);
  if (!interaction) {
    throw new Error('Interaction not found');
  }

  const brand = db.findById('brands', interaction.brandId);
  const voiceProfiles = db.findAll('brandVoiceProfiles', p => p.brandId === interaction.brandId);
  const voiceProfile = voiceProfiles[0] || {};

  const safety = detectSafetyFlags(interaction.content);

  // Fallback context & intelligent synthesis matching brand identity
  const brandName = brand ? brand.name : 'Our Brand';
  const author = interaction.authorName || `@${interaction.authorHandle}` || 'there';
  const firstName = author.split(' ')[0];

  // Tailored multi-variant generation
  let suggestions = [];

  if (safety.isSensitive) {
    suggestions = [
      {
        id: 'sug_opt_1',
        label: 'Empathetic & Escalation Support',
        tone: 'Empathetic & Swift Resolution',
        text: `Hi ${firstName}, we deeply apologize for this frustration. This is definitely not the standard we strive for. Our management team is reviewing your account right now. Please DM us your phone number or email, or contact us directly at support@${brand?.handle || 'company'}.internal so we can resolve this immediately.`,
        rationale: 'Addresses frustration with high empathy and routes to dedicated support without public confrontation.'
      },
      {
        id: 'sug_opt_2',
        label: 'Direct Management Contact',
        tone: 'Executive Assurance',
        text: `Hello ${firstName}, thank you for bringing this to our direct attention. We take this very seriously and want to make this right for you today. We have flagged this with our operations manager—please send us a DM with your account details so we can investigate and process your resolution.`,
        rationale: 'Assures executive follow-up and keeps communication private.'
      }
    ];
  } else if (safety.isPricingInquiry || interaction.content.toLowerCase().includes('pass') || interaction.content.toLowerCase().includes('hours')) {
    // Check brand FAQs for relevant answers
    let relevantFaq = (voiceProfile.faqs || []).find(f => 
      interaction.content.toLowerCase().includes('pass') && f.q.toLowerCase().includes('pass') ||
      interaction.content.toLowerCase().includes('hour') && f.q.toLowerCase().includes('hour') ||
      interaction.content.toLowerCase().includes('rate') || interaction.content.toLowerCase().includes('cost')
    );

    const answerSnippet = relevantFaq ? relevantFaq.a : 'We offer flexible packages and complimentary introductory passes!';

    suggestions = [
      {
        id: 'sug_opt_1',
        label: 'Engaging & Welcoming',
        tone: voiceProfile.tone || 'Friendly & Energetic',
        text: `Hey ${firstName}! Great to hear from you. ${answerSnippet} We would love to welcome you in—drop us a DM and we will get you set up right away! 💪`,
        rationale: 'Combines direct factual response with brand energy and call-to-action.'
      },
      {
        id: 'sug_opt_2',
        label: 'Concise & Informative',
        tone: 'Clear & Professional',
        text: `Hi ${firstName}, thanks for asking! ${answerSnippet} You can also check full details on our bio link or shoot us a direct message anytime.`,
        rationale: 'Clean and informative for quick decision making.'
      },
      {
        id: 'sug_opt_3',
        label: 'Warm Invitation',
        tone: 'Personal & Hospitable',
        text: `Hello ${firstName}! We’d love to have you. ${answerSnippet} Feel free to stop by or send us a message here with any specific dates!`,
        rationale: 'Hospitable and low pressure.'
      }
    ];
  } else {
    // General engagement or inquiry
    suggestions = [
      {
        id: 'sug_opt_1',
        label: 'Brand Signature Voice',
        tone: voiceProfile.tone || 'Engaging & Authentic',
        text: `Thanks so much for reaching out, ${firstName}! We appreciate your support and interest in ${brandName}. Let us know if you have any questions or if we can help you with anything else!`,
        rationale: 'Reinforces brand appreciation and maintains friendly dialogue.'
      },
      {
        id: 'sug_opt_2',
        label: 'Snappy & Community-Focused',
        tone: 'Community Builder',
        text: `Love this, ${firstName}! Always a pleasure connecting with our community. Stay tuned for exciting updates coming up! ✨`,
        rationale: 'Builds community hype and positive sentiment.'
      },
      {
        id: 'sug_opt_3',
        label: 'Direct & Helpful',
        tone: 'Solution-Focused',
        text: `Hi ${firstName}, thank you for your comment! If you need any specific details or recommendations, our team is always here to assist.`,
        rationale: 'Helpful and service-oriented.'
      }
    ];
  }

  return {
    interactionId,
    brandId: brand?.id,
    brandName: brand?.name,
    brandTone: voiceProfile.tone || 'Default Brand Voice',
    safetyNotice: safety.isSensitive ? 'Sensitive topic / complaint detected. Mandatory human review with escalation.' : null,
    isSensitive: safety.isSensitive,
    suggestions
  };
};

// Generate AI Social Media Content (Captions, Ideas, Hashtags, CTAs)
export const generateSocialContent = async ({
  businessId,
  brandId,
  topic = '',
  platform = 'INSTAGRAM',
  format = 'FEED_POST',
  toneOverride = null,
  campaignObjective = 'ENGAGEMENT'
}) => {
  const brand = db.findById('brands', brandId);
  const voiceProfiles = db.findAll('brandVoiceProfiles', p => p.brandId === brandId);
  const profile = voiceProfiles[0] || {};

  const tone = toneOverride || profile.tone || 'Energetic and inspiring';
  const brandName = brand ? brand.name : 'Our Brand';
  const audience = profile.targetAudience || 'Modern consumers';

  // Generate 2 post options with captions, hashtags, and CTAs
  const cleanTopic = topic.trim() || 'Latest highlights, tips, and product spotlight';

  const option1 = {
    title: `${cleanTopic} - Community Highlight`,
    bodyText: platform === 'INSTAGRAM'
      ? `✨ ${cleanTopic}\n\nAt ${brandName}, we believe every step counts when you are striving for excellence. Built with intention for our ${audience}, this is your reminder to show up for your goals today.\n\nDrop a comment below with your favorite tip or tag someone who needs this energy! 👇`
      : `${cleanTopic} | Spotlight from ${brandName}\n\nWe are passionate about bringing you the best in quality and craft. What are you focusing on this week? Let us know in the comments!`,
    hashtags: [
      `#${brandName.replace(/\s+/g, '')}`,
      '#CommunityFirst',
      '#DailyInspiration',
      '#QualityMatters',
      '#Innovation'
    ],
    callToAction: platform === 'INSTAGRAM' ? 'Tap link in bio to explore more or send us a DM!' : 'Visit our official website to learn more.',
    imagePrompt: `High-end commercial editorial photo of ${cleanTopic.toLowerCase()} representing ${brandName}, clean modern aesthetic, natural lighting, shot on 35mm lens.`
  };

  const option2 = {
    title: `${cleanTopic} - Behind The Scenes & Focus`,
    bodyText: platform === 'INSTAGRAM'
      ? `🔥 Behind the scenes with ${brandName}!\n\nHere’s how we tackle ${cleanTopic}: focused execution, clean ingredients, and zero compromises. Whether you’re just starting or leveling up, we’ve got your back.\n\nSave this post for later and share with your team! 🚀`
      : `Behind the scenes at ${brandName}: ${cleanTopic}. Discover what drives our commitment to our community. Check out the link below.`,
    hashtags: [
      `#${brandName.replace(/\s+/g, '')}`,
      '#BehindTheScenes',
      '#Motivation',
      '#Excellence',
      '#Trending'
    ],
    callToAction: 'Save this post and join our VIP newsletter list.',
    imagePrompt: `Cinematic lifestyle photography showing ${brandName} team and products in dynamic studio lighting.`
  };

  return {
    brandName,
    platform,
    format,
    toneApplied: tone,
    audienceTargeted: audience,
    options: [option1, option2]
  };
};
