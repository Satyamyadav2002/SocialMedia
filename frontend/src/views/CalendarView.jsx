import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Send,
  Trash2,
  ExternalLink,
  CheckCircle,
  AlertCircle,
  Edit2
} from 'lucide-react';

export const CalendarView = () => {
  const {
    selectedBusinessId,
    selectedBrandId,
    showToast,
    setCurrentView
  } = useApp();

  const [contents, setContents] = useState([]);
  const [currentDate, setCurrentDate] = useState(new Date(2026, 9, 27)); // Oct 2026
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedPost, setSelectedPost] = useState(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load calendar content items
  const loadContents = async () => {
    try {
      const res = await api.getContents({
        businessId: selectedBusinessId,
        brandId: selectedBrandId,
        status: statusFilter
      });
      setContents(res || []);
    } catch (err) {
      console.error('Failed to load calendar content:', err);
    }
  };

  useEffect(() => {
    loadContents();
  }, [selectedBusinessId, selectedBrandId, statusFilter]);

  // Calendar calculations
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };
  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Map contents to date string 'YYYY-MM-DD'
  const postsByDate = {};
  contents.forEach(post => {
    const rawDate = post.scheduledFor || post.publishedAt || post.createdAt;
    if (rawDate) {
      const d = new Date(rawDate);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      if (!postsByDate[key]) postsByDate[key] = [];
      postsByDate[key].push(post);
    }
  });

  // Handle Reschedule (CAL-06)
  const handleReschedule = async () => {
    if (!selectedPost || !rescheduleDate) return;
    try {
      setIsSubmitting(true);
      await api.rescheduleContent(selectedPost.id, rescheduleDate);
      showToast('Post rescheduled successfully.');
      setSelectedPost(null);
      loadContents();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Publish Now (PUB-01)
  const handlePublishNow = async (id) => {
    try {
      setIsSubmitting(true);
      await api.publishContentNow(id);
      showToast('Post published immediately to Meta!');
      setSelectedPost(null);
      loadContents();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Post
  const handleDeletePost = async (id) => {
    if (!window.confirm('Are you sure you want to delete this scheduled post?')) return;
    try {
      await api.deleteContent(id);
      showToast('Post removed from calendar.');
      setSelectedPost(null);
      loadContents();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-scrollable-content">
      {/* Calendar Header Controls */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <CalendarIcon size={24} color="#6366f1" />
            <h1 style={{ fontSize: '1.6rem', margin: 0 }}>
              {monthNames[month]} {year}
            </h1>
          </div>

          <div style={{ display: 'flex', gap: '4px' }}>
            <button className="btn btn-secondary btn-icon" onClick={prevMonth} title="Previous Month">
              <ChevronLeft size={16} />
            </button>
            <button className="btn btn-secondary btn-icon" onClick={nextMonth} title="Next Month">
              <ChevronRight size={16} />
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status filter */}
          <select
            className="select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: 'auto', fontSize: '0.82rem', padding: '6px 14px' }}
          >
            <option value="ALL">All Publication Statuses</option>
            <option value="SCHEDULED">Scheduled Only</option>
            <option value="PUBLISHED">Published Only</option>
            <option value="DRAFT">Drafts Only</option>
          </select>

          <button
            className="btn btn-primary"
            onClick={() => setCurrentView('studio')}
            style={{ gap: '6px' }}
          >
            <Plus size={16} /> Create Content
          </button>
        </div>
      </div>

      {/* Monthly Calendar Grid (CAL-01) */}
      <div className="calendar-grid">
        {/* Days of week header */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="calendar-day-header">
            {d}
          </div>
        ))}

        {/* Empty cells for leading days */}
        {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
          <div key={`empty-${idx}`} style={{ minHeight: '110px', opacity: 0.3, background: 'rgba(255,255,255,0.01)' }} />
        ))}

        {/* Days of current month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isToday = dayNum === 27 && month === 9 && year === 2026;
          const posts = postsByDate[dateStr] || [];

          return (
            <div
              key={dateStr}
              className={`calendar-cell ${isToday ? 'calendar-cell-today' : ''}`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span className="calendar-date-number" style={{ color: isToday ? '#a5b4fc' : '#94a3b8' }}>
                  {dayNum} {isToday ? '• Today' : ''}
                </span>
                {posts.length > 0 && (
                  <span style={{ fontSize: '0.65rem', color: '#64748b' }}>
                    {posts.length} {posts.length === 1 ? 'post' : 'posts'}
                  </span>
                )}
              </div>

              {/* Post Chips */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '4px', flex: 1, overflowY: 'auto' }}>
                {posts.map(post => {
                  const isScheduled = post.status === 'SCHEDULED';
                  const isPublished = post.status === 'PUBLISHED';

                  return (
                    <div
                      key={post.id}
                      className={`calendar-post-chip ${
                        isScheduled ? 'calendar-post-scheduled' :
                        isPublished ? 'calendar-post-published' : 'calendar-post-draft'
                      }`}
                      onClick={() => {
                        setSelectedPost(post);
                        setRescheduleDate(post.scheduledFor ? post.scheduledFor.slice(0, 16) : '');
                      }}
                      title={`${post.title} (${post.status})`}
                    >
                      <span style={{ marginRight: '4px' }}>
                        {post.platforms?.includes('INSTAGRAM') ? '📸' : '📘'}
                      </span>
                      {post.title}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Post Detail & Reschedule Modal (CAL-06, CAL-08, PUB-01) */}
      {selectedPost && (
        <div className="modal-overlay" onClick={() => setSelectedPost(null)}>
          <div className="modal-window" onClick={e => e.stopPropagation()}>
            <div style={{
              padding: '20px 24px',
              borderBottom: '1px solid rgba(255,255,255,0.08)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="badge badge-normal">{selectedPost.brandName}</span>
                <span className={`badge ${selectedPost.status === 'PUBLISHED' ? 'badge-positive' : 'badge-high'}`}>
                  {selectedPost.status}
                </span>
              </div>
              <button className="btn btn-secondary btn-icon" onClick={() => setSelectedPost(null)}>
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{selectedPost.title}</h3>
                <p style={{ fontSize: '0.9rem', color: '#cbd5e1', lineHeight: 1.45, whiteSpace: 'pre-line' }}>
                  {selectedPost.bodyText}
                </p>
              </div>

              {selectedPost.mediaUrls && selectedPost.mediaUrls[0] && (
                <img
                  src={selectedPost.mediaUrls[0]}
                  alt="Post preview"
                  style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '8px' }}
                />
              )}

              {/* Published post link if published */}
              {selectedPost.platformPostUrl && (
                <div style={{
                  padding: '10px 14px',
                  background: 'rgba(16, 185, 129, 0.1)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <span style={{ fontSize: '0.8rem', color: '#34d399', fontWeight: 600 }}>
                    Live on Social Platform
                  </span>
                  <a
                    href={selectedPost.platformPostUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.8rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}
                  >
                    View Post <ExternalLink size={12} />
                  </a>
                </div>
              )}

              {/* Reschedule control (CAL-06) */}
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  RESCHEDULE PUBLICATION DATE & TIME
                </label>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <input
                    type="datetime-local"
                    className="input"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={handleReschedule}
                    disabled={isSubmitting || !rescheduleDate}
                  >
                    Reschedule
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '16px 24px',
              borderTop: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(15, 23, 42, 0.8)',
              display: 'flex',
              justifyContent: 'space-between'
            }}>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDeletePost(selectedPost.id)}
              >
                <Trash2 size={14} /> Delete
              </button>

              <div style={{ display: 'flex', gap: '8px' }}>
                {selectedPost.status !== 'PUBLISHED' && (
                  <button
                    className="btn btn-primary btn-sm"
                    onClick={() => handlePublishNow(selectedPost.id)}
                    disabled={isSubmitting}
                  >
                    <Send size={14} /> Publish Now
                  </button>
                )}
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => setSelectedPost(null)}
                >
                  Close
                </button>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
