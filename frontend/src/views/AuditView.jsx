import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import {
  ShieldAlert,
  Search,
  Filter,
  User,
  Clock,
  CheckCircle2,
  Calendar,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export const AuditView = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);

  const loadAuditEvents = async () => {
    try {
      setLoading(true);
      const res = await api.getAuditTrail({
        search,
        action: actionFilter
      });
      setEvents(res.events || []);
    } catch (err) {
      console.error('Failed to load audit trail:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditEvents();
  }, [actionFilter]);

  return (
    <div className="page-scrollable-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '4px' }}>System Audit Trail</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.885rem' }}>
            Compliance records of user actions, AI approvals, dispatch outcomes, and configuration edits (Rule IAM-06).
          </p>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={loadAuditEvents}>
          <RefreshCw size={14} /> Refresh Log
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px' }}>
        <div style={{ position: 'relative', width: '320px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 11 }} />
          <input
            type="text"
            className="input"
            placeholder="Search details, actor, ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadAuditEvents()}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
          />
        </div>

        <select
          className="select"
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          style={{ width: 'auto', height: '38px', fontSize: '0.82rem', padding: '6px 14px' }}
        >
          <option value="ALL">All Actions</option>
          <option value="APPROVE_AND_SEND_REPLY">Approve & Send Reply</option>
          <option value="GENERATE_AI_SUGGESTION">Generate AI Suggestion</option>
          <option value="REJECT_AI_SUGGESTION">Reject AI Suggestion</option>
          <option value="PUBLISH_CONTENT">Publish Content</option>
          <option value="SCHEDULE_CONTENT">Schedule Content</option>
          <option value="UPDATE_BRAND_VOICE">Update Brand Voice</option>
          <option value="USER_LOGIN">User Login</option>
        </select>
      </div>

      {/* Events Table / Timeline */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: '170px 180px 140px 1fr',
          padding: '12px 20px',
          background: 'rgba(15, 23, 42, 0.7)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.75rem',
          fontWeight: 700,
          color: '#94a3b8',
          letterSpacing: '0.04em'
        }}>
          <span>TIMESTAMP</span>
          <span>ACTION TYPE</span>
          <span>ACTOR</span>
          <span>OPERATIONAL DETAILS</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          {events.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No audit events found matching filters.
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.id}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '170px 180px 140px 1fr',
                  padding: '14px 20px',
                  borderBottom: '1px solid rgba(255,255,255,0.05)',
                  fontSize: '0.82rem',
                  alignItems: 'center',
                  transition: 'background 150ms ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                {/* Timestamp */}
                <span style={{ color: '#64748b', fontSize: '0.78rem' }}>
                  {new Date(ev.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'medium' })}
                </span>

                {/* Action Badge */}
                <div>
                  <span className={`badge ${
                    ev.action.includes('APPROVE') ? 'badge-positive' :
                    ev.action.includes('REJECT') || ev.action.includes('FAILED') ? 'badge-negative' :
                    ev.action.includes('GENERATE') ? 'badge-normal' : 'badge-high'
                  }`} style={{ fontSize: '0.65rem' }}>
                    {ev.action}
                  </span>
                </div>

                {/* Actor */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <User size={13} color="#94a3b8" />
                  <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{ev.actorName}</span>
                </div>

                {/* Details */}
                <span style={{ color: '#cbd5e1', lineHeight: 1.4 }}>
                  {ev.details}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
