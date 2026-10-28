import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Users,
  Shield,
  Key,
  RefreshCw,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Play,
  Lock,
  Globe,
  Radio
} from 'lucide-react';

export const SettingsView = () => {
  const { currentUser, brands, showToast, loadInitialData } = useApp();

  const [users, setUsers] = useState([]);
  const [settings, setSettings] = useState(null);
  const [syncJobs, setSyncJobs] = useState([]);
  const [publishingJobs, setPublishingJobs] = useState([]);

  // Add User Modal
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserRole, setNewUserRole] = useState('TEAM_MEMBER');

  // Webhook Simulator State
  const [simBrandId, setSimBrandId] = useState(brands[0]?.id || '');
  const [simPlatform, setSimPlatform] = useState('INSTAGRAM');
  const [simType, setSimType] = useState('COMMENT');
  const [simAuthor, setSimAuthor] = useState('Taylor Brooks');
  const [simContent, setSimContent] = useState('What are your opening hours on Saturday? Looking forward to visiting!');
  const [simulating, setSimulating] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  const loadData = async () => {
    try {
      const [uRes, sRes, syncRes, pubRes] = await Promise.all([
        api.getUsers().catch(() => []),
        api.getSystemSettings().catch(() => null),
        api.getSyncJobs().catch(() => []),
        api.getPublishingJobs().catch(() => [])
      ]);
      setUsers(uRes);
      setSettings(sRes);
      setSyncJobs(syncRes);
      setPublishingJobs(pubRes);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Update simBrandId when brands load
  useEffect(() => {
    if (!simBrandId && brands.length > 0) {
      setSimBrandId(brands[0].id);
    }
  }, [brands]);

  // Create User (IAM-02)
  const handleCreateUser = async (e) => {
    e.preventDefault();
    if (!newUserName || !newUserEmail) return;
    try {
      await api.createUser({
        name: newUserName,
        email: newUserEmail,
        role: newUserRole
      });
      showToast(`User ${newUserName} added to team.`);
      setIsAddUserOpen(false);
      setNewUserName('');
      setNewUserEmail('');
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Toggle User Active / Inactive (IAM-02, IAM-07)
  const handleToggleUserStatus = async (user) => {
    const nextStatus = user.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await api.updateUser(user.id, { status: nextStatus });
      showToast(`User ${user.name} is now ${nextStatus}.`);
      loadData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Simulate Webhook Inbound Message (SYNC-06)
  const handleSimulateWebhook = async () => {
    if (!simBrandId || !simContent.trim()) return;
    try {
      setSimulating(true);
      await api.simulateWebhook({
        brandId: simBrandId,
        platform: simPlatform,
        interactionType: simType,
        authorName: simAuthor,
        contentText: simContent.trim()
      });
      showToast(`Simulated ${simPlatform} ${simType} received and ingested into Unified Inbox!`);
      loadInitialData();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSimulating(false);
    }
  };

  return (
    <div className="page-scrollable-content">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', marginBottom: '4px' }}>System Settings & Administration</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.885rem' }}>
          User access management (IAM), Meta integration endpoints, background workers, and webhook simulation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '24px' }}>
        
        {/* Left Column: Team Management (IAM-02, IAM-03) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="glass-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Users size={18} color="#818cf8" />
                <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Internal Team Members</h3>
              </div>

              {isAdmin ? (
                <button className="btn btn-primary btn-sm" onClick={() => setIsAddUserOpen(true)}>
                  <Plus size={14} /> Add User
                </button>
              ) : (
                <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Lock size={12} /> Admin privileges required to edit
                </span>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {users.map((u) => {
                const isActive = u.status === 'ACTIVE';
                return (
                  <div
                    key={u.id}
                    style={{
                      padding: '12px 14px',
                      background: 'rgba(255,255,255,0.02)',
                      border: '1px solid rgba(255,255,255,0.06)',
                      borderRadius: '8px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={u.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
                        alt={u.name}
                        style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '0.885rem', fontWeight: 600, color: '#f8fafc' }}>
                            {u.name}
                          </span>
                          <span className={`badge ${u.role === 'ADMIN' ? 'badge-urgent' : 'badge-normal'}`} style={{ fontSize: '0.65rem' }}>
                            {u.role}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.75rem', color: '#64748b' }}>{u.email}</span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span className={`badge ${isActive ? 'badge-positive' : 'badge-negative'}`} style={{ fontSize: '0.65rem' }}>
                        {u.status}
                      </span>

                      {isAdmin && u.id !== currentUser?.id && (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleToggleUserStatus(u)}
                          style={{ fontSize: '0.75rem', padding: '4px 8px' }}
                        >
                          {isActive ? 'Deactivate' : 'Activate'}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Meta API & Webhook Configuration (IAM-05) */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1.05rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Globe size={18} color="#818cf8" /> Meta Graph API & Webhook Parameters
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '0.82rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Meta App ID:</span>
                <strong style={{ color: '#cbd5e1' }}>{settings?.metaAppId || 'meta_app_99182374619'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>API Version:</span>
                <strong style={{ color: '#cbd5e1' }}>{settings?.metaApiVersion || 'v21.0'}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Webhook Verify Token:</span>
                <code style={{ color: '#a5b4fc', fontSize: '0.75rem' }}>{settings?.metaWebhookVerifyToken || 'agy_secure_token'}</code>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(255,255,255,0.02)', borderRadius: '6px' }}>
                <span style={{ color: '#94a3b8' }}>Mandatory Human Approval (SAFE-01):</span>
                <span style={{ color: '#34d399', fontWeight: 700 }}>ACTIVE (Enforced)</span>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Webhook Simulator & Background Jobs Monitor (OPS-01, OPS-02) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Live Webhook Simulator (SYNC-06) */}
          <div className="glass-card" style={{ border: '1px solid rgba(99,102,241,0.3)', background: 'rgba(99, 102, 241, 0.05)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <Radio size={18} color="#ec4899" />
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>Live Webhook Simulator (SYNC-06)</h3>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: '0 0 14px' }}>
              Dispatch a test Facebook or Instagram interaction into the system to verify real-time ingestion, sentiment classification, and AI reply drafting.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>BRAND</label>
                  <select
                    className="select"
                    value={simBrandId}
                    onChange={(e) => setSimBrandId(e.target.value)}
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                  >
                    {brands.map(b => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>PLATFORM & TYPE</label>
                  <select
                    className="select"
                    value={`${simPlatform}_${simType}`}
                    onChange={(e) => {
                      const [p, t] = e.target.value.split('_');
                      setSimPlatform(p);
                      setSimType(t);
                    }}
                    style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                  >
                    <option value="INSTAGRAM_COMMENT">Instagram Comment</option>
                    <option value="INSTAGRAM_DM">Instagram Direct Message</option>
                    <option value="FACEBOOK_COMMENT">Facebook Comment</option>
                    <option value="FACEBOOK_DM">Facebook Direct Message</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>AUTHOR NAME</label>
                <input
                  type="text"
                  className="input"
                  value={simAuthor}
                  onChange={(e) => setSimAuthor(e.target.value)}
                  style={{ fontSize: '0.8rem', padding: '6px 10px' }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>INTERACTION TEXT</label>
                <textarea
                  className="textarea"
                  rows={2}
                  value={simContent}
                  onChange={(e) => setSimContent(e.target.value)}
                  style={{ fontSize: '0.8rem' }}
                />
              </div>

              <button
                className="btn btn-primary"
                onClick={handleSimulateWebhook}
                disabled={simulating}
                style={{ gap: '6px', marginTop: '4px' }}
              >
                <Play size={14} /> {simulating ? 'Injecting...' : 'Dispatch Simulated Webhook'}
              </button>
            </div>
          </div>

          {/* Sync Jobs Monitor (OPS-01) */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '12px' }}>Background Sync Monitor (OPS-01)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {syncJobs.slice(0, 4).map(job => (
                <div
                  key={job.id}
                  style={{
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    fontSize: '0.78rem'
                  }}
                >
                  <div>
                    <span style={{ fontWeight: 600, color: '#e2e8f0' }}>{job.platform} Sync</span>
                    <span style={{ color: '#64748b', marginLeft: '6px' }}>({job.itemsProcessed} items)</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ color: '#10b981', fontWeight: 600 }}>SUCCESS</span>
                    <span style={{ color: '#64748b', fontSize: '0.72rem' }}>
                      {new Date(job.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* MODAL: ADD USER (IAM-02) */}
      {isAddUserOpen && (
        <div className="modal-overlay" onClick={() => setIsAddUserOpen(false)}>
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '440px' }}>
            <form onSubmit={handleCreateUser}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: 0 }}>Add Team Member</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    FULL NAME
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    placeholder="e.g. Jordan Lee"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    EMAIL ADDRESS
                  </label>
                  <input
                    type="email"
                    className="input"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    placeholder="jordan@company.internal"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    ROLE (IAM-03)
                  </label>
                  <select
                    className="select"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value)}
                  >
                    <option value="TEAM_MEMBER">Team Member (Shared business access)</option>
                    <option value="ADMIN">Administrator (Full admin settings & user mgmt)</option>
                  </select>
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddUserOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create User</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
