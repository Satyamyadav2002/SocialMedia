// OmniSocial API Client

const BASE_URL = '/api';

const getHeaders = () => {
  const token = localStorage.getItem('omni_token');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {})
  };
};

const handleResponse = async (res) => {
  if (!res.ok) {
    let errorMsg = 'API request failed';
    try {
      const data = await res.json();
      errorMsg = data.error || errorMsg;
    } catch (e) {
      errorMsg = res.statusText || errorMsg;
    }
    throw new Error(errorMsg);
  }
  return res.json();
};

export const api = {
  // Auth
  login: async (email, password) => {
    const res = await fetch(`${BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    return handleResponse(res);
  },
  switchDemoUser: async (userId) => {
    const res = await fetch(`${BASE_URL}/auth/switch-demo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId })
    });
    return handleResponse(res);
  },
  getMe: async () => {
    const res = await fetch(`${BASE_URL}/auth/me`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Users (Admin only)
  getUsers: async () => {
    const res = await fetch(`${BASE_URL}/users`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createUser: async (userData) => {
    const res = await fetch(`${BASE_URL}/users`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },
  updateUser: async (userId, updates) => {
    const res = await fetch(`${BASE_URL}/users/${userId}`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  // Businesses & Brands
  getBusinesses: async () => {
    const res = await fetch(`${BASE_URL}/businesses`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createBusiness: async (data) => {
    const res = await fetch(`${BASE_URL}/businesses`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getBrands: async (businessId) => {
    const query = businessId ? `?businessId=${businessId}` : '';
    const res = await fetch(`${BASE_URL}/brands${query}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createBrand: async (data) => {
    const res = await fetch(`${BASE_URL}/brands`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  getBrandVoice: async (brandId) => {
    const res = await fetch(`${BASE_URL}/brands/${brandId}/voice`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateBrandVoice: async (brandId, updates) => {
    const res = await fetch(`${BASE_URL}/brands/${brandId}/voice`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },

  // Social Accounts
  getSocialAccounts: async (businessId, brandId) => {
    let params = new URLSearchParams();
    if (businessId) params.append('businessId', businessId);
    if (brandId) params.append('brandId', brandId);
    const res = await fetch(`${BASE_URL}/social-accounts?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  connectAccount: async (data) => {
    const res = await fetch(`${BASE_URL}/social-accounts/connect`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  },
  disconnectAccount: async (accountId) => {
    const res = await fetch(`${BASE_URL}/social-accounts/${accountId}/disconnect`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  testConnection: async (accountId) => {
    const res = await fetch(`${BASE_URL}/social-accounts/${accountId}/test-connection`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Interactions & Inbox
  getInteractions: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v);
    });
    const res = await fetch(`${BASE_URL}/interactions?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getInteractionById: async (id) => {
    const res = await fetch(`${BASE_URL}/interactions/${id}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateInteractionStatus: async (id, updates) => {
    const res = await fetch(`${BASE_URL}/interactions/${id}/status`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },
  overrideClassification: async (id, classification) => {
    const res = await fetch(`${BASE_URL}/interactions/${id}/classification`, {
      method: 'PATCH',
      headers: getHeaders(),
      body: JSON.stringify(classification)
    });
    return handleResponse(res);
  },

  // AI Assistant & Safety
  getReplySuggestions: async (interactionId) => {
    const res = await fetch(`${BASE_URL}/ai/suggest-reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ interactionId })
    });
    return handleResponse(res);
  },
  approveAndSendReply: async (interactionId, replyText) => {
    const res = await fetch(`${BASE_URL}/ai/approve-reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        interactionId,
        replyText,
        humanApproved: true
      })
    });
    return handleResponse(res);
  },
  rejectReplySuggestion: async (interactionId, reason) => {
    const res = await fetch(`${BASE_URL}/ai/reject-reply`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ interactionId, reason })
    });
    return handleResponse(res);
  },
  generateSocialContent: async (params) => {
    const res = await fetch(`${BASE_URL}/ai/generate-content`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(params)
    });
    return handleResponse(res);
  },

  // Content & Calendar
  getContents: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.append(k, v);
    });
    const res = await fetch(`${BASE_URL}/content?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  createContent: async (contentData) => {
    const res = await fetch(`${BASE_URL}/content`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(contentData)
    });
    return handleResponse(res);
  },
  updateContent: async (id, updates) => {
    const res = await fetch(`${BASE_URL}/content/${id}`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(updates)
    });
    return handleResponse(res);
  },
  rescheduleContent: async (id, scheduledFor) => {
    const res = await fetch(`${BASE_URL}/content/${id}/reschedule`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ scheduledFor })
    });
    return handleResponse(res);
  },
  publishContentNow: async (id) => {
    const res = await fetch(`${BASE_URL}/content/${id}/publish-now`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ confirmed: true })
    });
    return handleResponse(res);
  },
  deleteContent: async (id) => {
    const res = await fetch(`${BASE_URL}/content/${id}`, {
      method: 'DELETE',
      headers: getHeaders()
    });
    return handleResponse(res);
  },

  // Analytics
  getAnalytics: async (businessId, brandId) => {
    let params = new URLSearchParams();
    if (businessId) params.append('businessId', businessId);
    if (brandId) params.append('brandId', brandId);
    const res = await fetch(`${BASE_URL}/analytics/overview?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },

  // Operations & Audit
  getAuditTrail: async (filters = {}) => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.append(k, v);
    });
    const res = await fetch(`${BASE_URL}/ops/audit-trail?${params.toString()}`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getSyncJobs: async () => {
    const res = await fetch(`${BASE_URL}/ops/sync-jobs`, { headers: getHeaders() });
    return handleResponse(res);
  },
  triggerGlobalSync: async () => {
    const res = await fetch(`${BASE_URL}/ops/trigger-sync`, {
      method: 'POST',
      headers: getHeaders()
    });
    return handleResponse(res);
  },
  simulateWebhook: async (payload) => {
    const res = await fetch(`${BASE_URL}/ops/simulate-webhook`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    return handleResponse(res);
  },
  getPublishingJobs: async () => {
    const res = await fetch(`${BASE_URL}/ops/publishing-jobs`, { headers: getHeaders() });
    return handleResponse(res);
  },
  getSystemSettings: async () => {
    const res = await fetch(`${BASE_URL}/ops/system-settings`, { headers: getHeaders() });
    return handleResponse(res);
  },
  updateSystemSettings: async (settings) => {
    const res = await fetch(`${BASE_URL}/ops/system-settings`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(settings)
    });
    return handleResponse(res);
  }
};
