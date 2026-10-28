import { db } from '../db.js';
import { metaService } from '../services/metaService.js';
import { logAuditEvent } from '../services/auditService.js';

let isRunning = false;

export const startPublishingWorker = (intervalMs = 15000) => {
  console.log('[Publishing Worker] Initialized. Polling every ' + (intervalMs / 1000) + 's.');

  setInterval(async () => {
    if (isRunning) return;
    isRunning = true;

    try {
      const now = new Date();
      const scheduledPosts = db.findAll('contents', c => 
        c.status === 'SCHEDULED' && c.scheduledFor && new Date(c.scheduledFor) <= now
      );

      for (const post of scheduledPosts) {
        console.log(`[Publishing Worker] Processing due post: ${post.id} (${post.title})`);

        // Mark as publishing
        db.update('contents', post.id, { status: 'PUBLISHING' });

        try {
          // Attempt publish via meta service
          const result = await metaService.publishPost({
            contentId: post.id,
            actor: { id: 'worker_auto', name: 'Background Scheduler', role: 'SYSTEM' }
          });

          console.log(`[Publishing Worker] Post ${post.id} successfully published to ${result.platform}: ${result.postUrl}`);
        } catch (err) {
          console.error(`[Publishing Worker] Failed to publish post ${post.id}:`, err.message);
          db.update('contents', post.id, { 
            status: 'FAILED',
            failureReason: err.message
          });

          logAuditEvent({
            businessId: post.businessId,
            brandId: post.brandId,
            actorId: 'worker_auto',
            actorName: 'Background Scheduler',
            actorRole: 'SYSTEM',
            action: 'PUBLISH_FAILED',
            entityType: 'CONTENT',
            entityId: post.id,
            details: `Failed to publish scheduled post: ${err.message}`
          });
        }
      }
    } catch (workerErr) {
      console.error('[Publishing Worker] Error during poll cycle:', workerErr);
    } finally {
      isRunning = false;
    }
  }, intervalMs);
};
