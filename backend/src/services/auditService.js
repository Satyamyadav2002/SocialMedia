import { db } from '../db.js';
import { v4 as uuidv4 } from 'uuid';

export const logAuditEvent = ({
  businessId = null,
  brandId = null,
  actorId = 'system',
  actorName = 'System',
  actorRole = 'SYSTEM',
  action,
  entityType,
  entityId,
  details
}) => {
  const event = {
    id: `aud_${uuidv4().slice(0, 8)}`,
    businessId,
    brandId,
    actorId,
    actorName,
    actorRole,
    action,
    entityType,
    entityId,
    details,
    timestamp: new Date().toISOString()
  };

  db.insert('auditEvents', event);
  return event;
};
