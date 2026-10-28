import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  MessageSquare,
  Sparkles,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  ArrowRight,
  Flame,
  Send,
  Building,
  RefreshCw
} from 'lucide-react';
import { Instagram, Facebook } from '../components/SocialIcons';

export const DashboardView = () => {
  const {
    currentUser,
    selectedBusinessId,
    selectedBrandId,
    setCurrentView,
    showToast,
    refreshStats,
    loadInitialData
  } = useApp();

  const [analytics, setAnalytics] = useState(null);
  const [urgentInteractions, setUrgentInteractions] = useState([]);
  const [scheduledPosts, setScheduledPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadDashboardData = async (isManualClick = false) => {
    try {
      if (isManualClick) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      const [anaRes, urgentRes, postsRes] = await Promise.all([
        api.getAnalytics(selectedBusinessId, selectedBrandId),
        api.getInteractions({
          businessId: selectedBusinessId,
          brandId: selectedBrandId,
          replyStatus: 'NEEDS_RESPONSE',
          limit: 3
        }),
        api.getContents({
          businessId: selectedBusinessId,
          brandId: selectedBrandId,
          status: 'SCHEDULED',
          limit: 3
        })
      ]);

      setAnalytics(anaRes);
      setUrgentInteractions(urgentRes.items || []);
      setScheduledPosts(postsRes || []);

      if (isManualClick) {
        if (refreshStats) await refreshStats();
        if (loadInitialData) await loadInitialData();
        showToast('Dashboard data & metrics refreshed successfully!');
      }
    } catch (err) {
      console.error('Error loading dashboard:', err);
      if (isManualClick) {
        showToast('Failed to refresh dashboard: ' + err.message, 'error');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadDashboardData(false);
  }, [selectedBusinessId, selectedBrandId]);

  return (
    <div className="page-scrollable-content">
      {/* Welcome Banner */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15) 0%, rgba(139, 92, 246, 0.1) 50%, rgba(17, 24, 39, 0.8) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.25)',
        borderRadius: '16px',
        padding: '24px 32px',
        marginBottom: '28px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
            <span style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: '#a5b4fc', fontWeight: 700, letterSpacing: '0.05em' }}>
              Operations Command Center
            </span>
            <span style={{ background: '#10b981', width: 6, height: 6, borderRadius: '50%' }} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>
            Welcome back, {currentUser?.name || 'Operator'}
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.9rem', maxWidth: '620px' }}>
            Unified Facebook & Instagram operations across all brands. AI suggestions prepared with mandatory human approval guardrails active.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '12px', zIndex: 2 }}>
          <button 
            className="btn btn-secondary" 
            onClick={() => loadDashboardData(true)}
            disabled={refreshing}
            style={{ gap: '6px' }}
            title="Refresh dashboard metrics, urgent queue and pipeline"
            id="dashboard-refresh-btn"
          >
            <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            className="btn btn-primary"
            onClick={() => setCurrentView('studio')}
            style={{ gap: '6px' }}
          >
            <Sparkles size={16} /> Compose AI Post
          </button>
        </div>
      </div>

      {/* KPI Stat Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">TOTAL INTERACTIONS</span>
            <MessageSquare size={18} color="#818cf8" />
          </div>
          <div className="stat-value">{analytics?.totalInteractions ?? 7}</div>
          <div className="stat-subtext" style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: 4 }}>
            <TrendingUp size={12} /> {analytics?.unreadCount || 4} unread items require review
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">AI APPROVAL RATE</span>
            <CheckCircle2 size={18} color="#10b981" />
          </div>
          <div className="stat-value" style={{ color: '#34d399' }}>
            {analytics?.aiMetrics?.approvalRate ?? 92}%
          </div>
          <div className="stat-subtext">
            {analytics?.aiMetrics?.approvedSent ?? 2} approved by human team members
          </div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">AVG RESPONSE TIME</span>
            <Clock size={18} color="#f59e0b" />
          </div>
          <div className="stat-value" style={{ color: '#fbbf24' }}>
            {analytics?.avgResponseTimeMinutes ?? 8.5}m
          </div>
          <div className="stat-subtext">Target SLA: Under 15 minutes</div>
        </div>

        <div className="stat-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span className="stat-label">SCHEDULED POSTS</span>
            <Calendar size={18} color="#ec4899" />
          </div>
          <div className="stat-value">
            {analytics?.publishingStats?.scheduled ?? 2}
          </div>
          <div className="stat-subtext">
            {analytics?.publishingStats?.published ?? 1} posts published successfully
          </div>
        </div>
      </div>

      {/* Priority Inbound Attention & Upcoming Scheduled Posts */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: '24px' }}>
        
        {/* Urgent Needs Response Section */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={18} color="#ef4444" />
              <h3 style={{ fontSize: '1.1rem' }}>Priority Action Items</h3>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentView('inbox')}
              style={{ fontSize: '0.78rem' }}
            >
              Open Unified Inbox <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {urgentInteractions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                <CheckCircle2 size={28} color="#10b981" style={{ margin: '0 auto 8px' }} />
                <p>All priority interactions resolved or up to date!</p>
              </div>
            ) : (
              urgentInteractions.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setCurrentView('inbox')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.borderColor = 'rgba(99,102,241,0.4)'}
                  onMouseLeave={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge ${item.platform === 'INSTAGRAM' ? 'badge-ig' : 'badge-fb'}`}>
                        {item.platform === 'INSTAGRAM' ? <Instagram size={11} /> : <Facebook size={11} />}
                        {item.interactionType}
                      </span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#e2e8f0' }}>
                        {item.authorName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                        for {item.brandName}
                      </span>
                    </div>

                    <span className={`badge ${item.priority === 'URGENT' ? 'badge-urgent' : 'badge-high'}`}>
                      {item.priority}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.4, margin: '4px 0 8px' }}>
                    "{item.content}"
                  </p>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.72rem', color: '#64748b' }}>
                    <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    <span style={{ color: '#818cf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Sparkles size={12} /> AI draft ready to review
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Upcoming Scheduled Posts */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Calendar size={18} color="#818cf8" />
              <h3 style={{ fontSize: '1.1rem' }}>Scheduled Content Pipeline</h3>
            </div>
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => setCurrentView('calendar')}
              style={{ fontSize: '0.78rem' }}
            >
              Full Calendar <ArrowRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {scheduledPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '28px', color: '#64748b' }}>
                <Calendar size={28} style={{ margin: '0 auto 8px' }} />
                <p>No posts currently scheduled for publication.</p>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setCurrentView('studio')}
                  style={{ marginTop: '10px' }}
                >
                  Create New Post Draft
                </button>
              </div>
            ) : (
              scheduledPosts.map((post) => (
                <div
                  key={post.id}
                  onClick={() => setCurrentView('calendar')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.02)',
                    border: '1px solid rgba(255, 255, 255, 0.07)',
                    borderRadius: '10px',
                    padding: '14px 16px',
                    cursor: 'pointer',
                    display: 'flex',
                    gap: '14px',
                    alignItems: 'center'
                  }}
                >
                  {post.mediaUrls && post.mediaUrls[0] && (
                    <img
                      src={post.mediaUrls[0]}
                      alt={post.title}
                      style={{ width: 56, height: 56, borderRadius: '8px', objectFit: 'cover' }}
                    />
                  )}
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <span className="badge badge-normal" style={{ fontSize: '0.68rem' }}>
                        {post.brandName}
                      </span>
                      <span style={{ fontSize: '0.75rem', color: '#93c5fd', fontWeight: 600 }}>
                        {new Date(post.scheduledFor).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.885rem', fontWeight: 600, color: '#f8fafc', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {post.title}
                    </div>
                    <div style={{ fontSize: '0.78rem', color: '#94a3b8', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '300px' }}>
                      {post.bodyText}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
