import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const triggerSyncForAccount = (socialAccountId) => {
  const account = db.findById('socialAccounts', socialAccountId);
  if (!account) throw new Error('Account not found');

  const now = new Date().toISOString();
  db.update('socialAccounts', socialAccountId, { lastSyncedAt: now });

  const syncJob = {
    id: `sync_${uuidv4().slice(0, 8)}`,
    businessId: account.businessId,
    brandId: account.brandId,
    socialAccountId: account.id,
    platform: account.platform,
    jobType: 'MANUAL_RECONCILIATION',
    status: 'SUCCESS',
    itemsProcessed: Math.floor(Math.random() * 5) + 1,
    errorDetails: null,
    startedAt: now,
    completedAt: new Date().toISOString()
  };

  db.insert('syncJobs', syncJob);
  return syncJob;
};

export const startSyncWorker = (intervalMs = 60000) => {
  console.log('[Sync Worker] Initialized. Background reconciliation running every ' + (intervalMs / 1000) + 's.');

  setInterval(() => {
    try {
      const accounts = db.findAll('socialAccounts', a => a.tokenStatus === 'VALID');
      if (accounts.length > 0) {
        // pick an account to refresh
        const target = accounts[Math.floor(Math.random() * accounts.length)];
        triggerSyncForAccount(target.id);
      }
    } catch (e) {
      console.error('[Sync Worker] Periodic sync error:', e);
    }
  }, intervalMs);
};
