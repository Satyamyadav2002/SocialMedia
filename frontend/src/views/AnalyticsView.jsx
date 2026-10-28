import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  BarChart3,
  TrendingUp,
  Clock,
  Sparkles,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowUpRight,
  Smile,
  Meh,
  Frown
} from 'lucide-react';
import { Instagram, Facebook } from '../components/SocialIcons';

export const AnalyticsView = () => {
  const { selectedBusinessId, selectedBrandId } = useApp();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const res = await api.getAnalytics(selectedBusinessId, selectedBrandId);
        setData(res);
      } catch (err) {
        console.error('Failed to load analytics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [selectedBusinessId, selectedBrandId]);

  if (loading || !data) {
    return (
      <div className="page-scrollable-content" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div style={{ color: '#94a3b8' }}>Loading analytics metrics...</div>
      </div>
    );
  }

  const {
    totalInteractions,
    platformBreakdown,
    sentimentStats,
    aiMetrics,
    publishingStats,
    avgResponseTimeMinutes,
    trend
  } = data;

  const igPercent = totalInteractions > 0 ? Math.round(((platformBreakdown?.instagram || 0) / totalInteractions) * 100) : 60;
  const fbPercent = 100 - igPercent;

  const totalSentiment = (sentimentStats?.positive || 0) + (sentimentStats?.neutral || 0) + (sentimentStats?.negative || 0) || 1;
  const posPct = Math.round(((sentimentStats?.positive || 0) / totalSentiment) * 100);
  const neuPct = Math.round(((sentimentStats?.neutral || 0) / totalSentiment) * 100);
  const negPct = Math.round(((sentimentStats?.negative || 0) / totalSentiment) * 100);

  return (
    <div className="page-scrollable-content">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', marginBottom: '6px' }}>Operations Analytics & Reporting</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.885rem' }}>
          Response times, AI approval performance, sentiment breakdown, and channel activity.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-label">TOTAL VOLUME (ANA-01)</span>
          <div className="stat-value">{totalInteractions}</div>
          <div className="stat-subtext" style={{ color: '#34d399' }}>
            {data.commentsCount} comments • {data.dmsCount} direct messages
          </div>
        </div>

        <div className="stat-card">
          <span className="stat-label">AVG RESPONSE TIME (ANA-02)</span>
          <div className="stat-value" style={{ color: '#38bdf8' }}>{avgResponseTimeMinutes}m</div>
          <div className="stat-subtext">35% faster than previous week</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">AI APPROVAL RATE (ANA-03)</span>
          <div className="stat-value" style={{ color: '#34d399' }}>{aiMetrics.approvalRate}%</div>
          <div className="stat-subtext">{aiMetrics.approvedSent} approved / {aiMetrics.totalSuggested} suggested</div>
        </div>

        <div className="stat-card">
          <span className="stat-label">CONTENT OUTPUT (ANA-07)</span>
          <div className="stat-value">{publishingStats.total}</div>
          <div className="stat-subtext">{publishingStats.published} published • {publishingStats.scheduled} scheduled</div>
        </div>
      </div>

      {/* Grid: Charts & Distributions */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '24px', marginBottom: '24px' }}>
        
        {/* Weekly Trend Bar Chart */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div>
              <h3 style={{ fontSize: '1.05rem', margin: 0 }}>7-Day Interaction Trend</h3>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>Daily interaction count vs AI approved replies</span>
            </div>
            <div style={{ display: 'flex', gap: '12px', fontSize: '0.75rem' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#818cf8' }}>
                <span style={{ width: 8, height: 8, background: '#6366f1', borderRadius: '2px' }} /> Volume
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#34d399' }}>
                <span style={{ width: 8, height: 8, background: '#10b981', borderRadius: '2px' }} /> AI Approved
              </span>
            </div>
          </div>

          {/* Bar Chart Simulation */}
          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            height: '200px',
            paddingTop: '20px',
            borderBottom: '1px solid rgba(255,255,255,0.08)'
          }}>
            {trend.map((t, idx) => {
              const maxVal = 50;
              const hVol = (t.volume / maxVal) * 160;
              const hAppr = (t.aiApproved / maxVal) * 160;

              return (
                <div key={idx} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px', flex: 1 }}>
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'flex-end', height: '160px' }}>
                    <div
                      style={{
                        width: '14px',
                        height: `${hVol}px`,
                        background: 'linear-gradient(180deg, #6366f1 0%, #4f46e5 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 300ms ease'
                      }}
                      title={`Volume: ${t.volume}`}
                    />
                    <div
                      style={{
                        width: '14px',
                        height: `${hAppr}px`,
                        background: 'linear-gradient(180deg, #10b981 0%, #059669 100%)',
                        borderRadius: '4px 4px 0 0',
                        transition: 'height 300ms ease'
                      }}
                      title={`Approved: ${t.aiApproved}`}
                    />
                  </div>
                  <span style={{ fontSize: '0.72rem', color: '#94a3b8', fontWeight: 600 }}>{t.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Platform Share (ANA-04) & Sentiment (CLS-01) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Platform Share */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Platform Distribution (ANA-04)</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                    <Instagram size={14} color="#e1306c" /> Instagram
                  </span>
                  <strong>{igPercent}% ({platformBreakdown?.instagram || 0})</strong>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${igPercent}%`, height: '100%', background: 'var(--meta-ig-gradient)' }} />
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '4px' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: '#e2e8f0' }}>
                    <Facebook size={14} color="#1877f2" /> Facebook
                  </span>
                  <strong>{fbPercent}% ({platformBreakdown?.facebook || 0})</strong>
                </div>
                <div style={{ width: '100%', height: '8px', background: 'rgba(255,255,255,0.06)', borderRadius: '4px', overflow: 'hidden' }}>
                  <div style={{ width: `${fbPercent}%`, height: '100%', background: 'var(--meta-fb-color)' }} />
                </div>
              </div>
            </div>
          </div>

          {/* Sentiment Distribution */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Audience Sentiment (CLS-01)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px', textAlign: 'center' }}>
              <div style={{ padding: '12px 8px', background: 'rgba(16, 185, 129, 0.08)', borderRadius: '8px', border: '1px solid rgba(16, 185, 129, 0.2)' }}>
                <Smile size={20} color="#34d399" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#34d399' }}>{posPct}%</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Positive</span>
              </div>

              <div style={{ padding: '12px 8px', background: 'rgba(148, 163, 184, 0.08)', borderRadius: '8px', border: '1px solid rgba(148, 163, 184, 0.2)' }}>
                <Meh size={20} color="#cbd5e1" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#cbd5e1' }}>{neuPct}%</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Neutral</span>
              </div>

              <div style={{ padding: '12px 8px', background: 'rgba(239, 68, 68, 0.08)', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                <Frown size={20} color="#f87171" style={{ margin: '0 auto 4px' }} />
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f87171' }}>{negPct}%</div>
                <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>Escalated</span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
