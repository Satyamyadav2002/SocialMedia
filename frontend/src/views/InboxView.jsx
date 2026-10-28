import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { HumanApprovalModal } from '../components/HumanApprovalModal';
import {
  Search,
  Filter,
  Sparkles,
  Send,
  AlertTriangle,
  CheckCircle,
  Clock,
  User,
  MessageSquare,
  ShieldAlert,
  ThumbsDown,
  RefreshCw,
  Edit3,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { Instagram, Facebook } from '../components/SocialIcons';

export const InboxView = () => {
  const {
    currentUser,
    selectedBusinessId,
    selectedBrandId,
    availableUsers,
    showToast,
    refreshStats
  } = useApp();

  const [interactions, setInteractions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [filterPlatform, setFilterPlatform] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');
  const [filterReplyStatus, setFilterReplyStatus] = useState('ALL');
  const [filterPriority, setFilterPriority] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // AI Assistant State
  const [aiSuggestions, setAiSuggestions] = useState(null);
  const [selectedSuggestionIdx, setSelectedSuggestionIdx] = useState(0);
  const [draftReplyText, setDraftReplyText] = useState('');
  const [generatingAi, setGeneratingAi] = useState(false);

  // Internal Notes & Assignee
  const [internalNotes, setInternalNotes] = useState('');
  const [assignedUserId, setAssignedUserId] = useState('');

  // Human Approval Modal
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load interactions
  const loadInteractions = async () => {
    try {
      setLoading(true);
      const res = await api.getInteractions({
        businessId: selectedBusinessId,
        brandId: selectedBrandId,
        platform: filterPlatform,
        interactionType: filterType,
        replyStatus: filterReplyStatus,
        priority: filterPriority,
        search: searchQuery
      });

      setInteractions(res.items || []);
      if (res.items && res.items.length > 0) {
        if (!selectedId || !res.items.some(i => i.id === selectedId)) {
          setSelectedId(res.items[0].id);
        }
      } else {
        setSelectedId(null);
        setActiveItem(null);
      }
    } catch (err) {
      console.error('Failed to load interactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInteractions();
  }, [selectedBusinessId, selectedBrandId, filterPlatform, filterType, filterReplyStatus, filterPriority]);

  // Load full details for selected item
  useEffect(() => {
    if (!selectedId) return;

    const fetchDetail = async () => {
      try {
        const item = await api.getInteractionById(selectedId);
        setActiveItem(item);
        setInternalNotes(item.internalNotes || '');
        setAssignedUserId(item.assignedToUserId || '');

        // If draft already exists, set it
        const pendingDraft = (item.replies || []).find(r => r.status === 'DRAFT_READY');
        if (pendingDraft) {
          setDraftReplyText(pendingDraft.draftText || '');
        } else {
          setDraftReplyText('');
        }

        // Reset AI suggestion options
        setAiSuggestions(null);
        setSelectedSuggestionIdx(0);

        // Mark as read if unread
        if (item.readStatus === 'UNREAD') {
          await api.updateInteractionStatus(selectedId, { readStatus: 'READ' });
          refreshStats();
        }
      } catch (err) {
        console.error('Failed to load interaction detail:', err);
      }
    };

    fetchDetail();
  }, [selectedId]);

  // Trigger AI Suggestion Generator
  const handleGenerateAiReplies = async () => {
    if (!selectedId) return;
    try {
      setGeneratingAi(true);
      const res = await api.getReplySuggestions(selectedId);
      setAiSuggestions(res);
      setSelectedSuggestionIdx(0);
      if (res.suggestions && res.suggestions.length > 0) {
        setDraftReplyText(res.suggestions[0].text);
      }
      showToast('Generated brand-aware response options.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGeneratingAi(false);
    }
  };

  // Reject / Discard AI Suggestion (AI-07, AI-11)
  const handleRejectSuggestion = async () => {
    if (!selectedId) return;
    try {
      await api.rejectReplySuggestion(selectedId, 'Operator preferred manual response or different wording.');
      setAiSuggestions(null);
      setDraftReplyText('');
      showToast('AI suggestion discarded. Feedback logged.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Save Internal Notes & Assignee (TEAM-03, TEAM-05)
  const handleSaveNotesAndAssignee = async () => {
    if (!selectedId) return;
    try {
      await api.updateInteractionStatus(selectedId, {
        internalNotes,
        assignedToUserId: assignedUserId || null
      });
      showToast('Internal notes & assignment updated.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Execute Human Approved Send (SAFE-01, AI-06)
  const handleConfirmApprovalSend = async (approvedText) => {
    if (!selectedId) return;
    try {
      setIsSending(true);
      const res = await api.approveAndSendReply(selectedId, approvedText);
      showToast(`Reply sent successfully to ${activeItem.authorName} via Meta API.`);
      setIsApprovalModalOpen(false);
      // Reload detail and list
      loadInteractions();
      const updated = await api.getInteractionById(selectedId);
      setActiveItem(updated);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="page-scrollable-content" style={{ padding: '16px 24px', height: '100%' }}>
      {/* Search & Filters Bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        marginBottom: '16px',
        flexWrap: 'wrap'
      }}>
        {/* Search */}
        <div style={{ position: 'relative', width: '280px' }}>
          <Search size={16} color="#64748b" style={{ position: 'absolute', left: 12, top: 12 }} />
          <input
            type="text"
            className="input"
            placeholder="Search messages, authors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadInteractions()}
            style={{ paddingLeft: '36px', height: '38px', fontSize: '0.85rem' }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Platform */}
          <select
            className="select"
            value={filterPlatform}
            onChange={(e) => setFilterPlatform(e.target.value)}
            style={{ width: 'auto', height: '38px', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <option value="ALL">All Platforms</option>
            <option value="INSTAGRAM">Instagram</option>
            <option value="FACEBOOK">Facebook</option>
          </select>

          {/* Type */}
          <select
            className="select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{ width: 'auto', height: '38px', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <option value="ALL">All Types</option>
            <option value="COMMENT">Comments</option>
            <option value="DM">Direct Messages (DMs)</option>
          </select>

          {/* Reply Status */}
          <select
            className="select"
            value={filterReplyStatus}
            onChange={(e) => setFilterReplyStatus(e.target.value)}
            style={{ width: 'auto', height: '38px', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <option value="ALL">All Statuses</option>
            <option value="NEEDS_RESPONSE">Needs Response</option>
            <option value="DRAFT_READY">Draft Ready</option>
            <option value="APPROVED_SENT">Resolved & Sent</option>
          </select>

          {/* Priority */}
          <select
            className="select"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            style={{ width: 'auto', height: '38px', fontSize: '0.8rem', padding: '6px 12px' }}
          >
            <option value="ALL">All Priorities</option>
            <option value="URGENT">Urgent Escalations</option>
            <option value="HIGH">High Priority</option>
            <option value="NORMAL">Normal</option>
          </select>

          <button
            className="btn btn-secondary"
            onClick={loadInteractions}
            style={{ height: '38px', padding: '6px 12px' }}
            title="Refresh list"
          >
            <RefreshCw size={14} />
          </button>
        </div>
      </div>

      {/* Main Split Pane Container (INB-01, INB-07) */}
      <div className="inbox-split-container">
        
        {/* Left: Interactions List */}
        <div className="inbox-list-pane">
          <div style={{
            padding: '12px 18px',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'rgba(11, 15, 25, 0.4)'
          }}>
            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#94a3b8' }}>
              INTERACTIONS ({interactions.length})
            </span>
            <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
              Real-time feed
            </span>
          </div>

          <div style={{ flex: 1, overflowY: 'auto' }}>
            {interactions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b' }}>
                <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.5 }} />
                <p style={{ fontSize: '0.88rem' }}>No interactions match current filters.</p>
              </div>
            ) : (
              interactions.map((item) => {
                const isSelected = item.id === selectedId;
                const isUnread = item.readStatus === 'UNREAD';

                return (
                  <div
                    key={item.id}
                    className={`inbox-item-row ${isSelected ? 'selected' : ''} ${isUnread ? 'unread' : ''}`}
                    onClick={() => setSelectedId(item.id)}
                  >
                    {/* Top Row: Badges and Time */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className={`badge ${item.platform === 'INSTAGRAM' ? 'badge-ig' : 'badge-fb'}`}>
                          {item.platform === 'INSTAGRAM' ? <Instagram size={10} /> : <Facebook size={10} />}
                          {item.interactionType}
                        </span>
                        <span className="badge badge-normal" style={{ fontSize: '0.65rem' }}>
                          {item.brandName}
                        </span>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {isUnread && (
                          <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#6366f1' }} />
                        )}
                        <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                          {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>

                    {/* Author & Preview */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <img
                        src={item.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=50'}
                        alt={item.authorName}
                        style={{ width: 26, height: 26, borderRadius: '50%', objectFit: 'cover' }}
                      />
                      <span style={{ fontSize: '0.85rem', fontWeight: isUnread ? 700 : 600, color: '#f8fafc' }}>
                        {item.authorName}
                      </span>
                    </div>

                    <p style={{
                      fontSize: '0.82rem',
                      color: isUnread ? '#e2e8f0' : '#94a3b8',
                      lineHeight: 1.35,
                      margin: 0,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden'
                    }}>
                      {item.content}
                    </p>

                    {/* Bottom Status Indicators */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '4px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {item.priority === 'URGENT' && (
                          <span className="badge badge-urgent">URGENT</span>
                        )}
                        {item.classification?.sentiment && (
                          <span className={`badge ${
                            item.classification.sentiment === 'POSITIVE' ? 'badge-positive' :
                            item.classification.sentiment === 'NEGATIVE' ? 'badge-negative' : 'badge-neutral'
                          }`}>
                            {item.classification.sentiment}
                          </span>
                        )}
                      </div>

                      <span style={{
                        fontSize: '0.72rem',
                        fontWeight: 600,
                        color: item.replyStatus === 'APPROVED_SENT' ? '#34d399' :
                               item.replyStatus === 'DRAFT_READY' ? '#818cf8' : '#f59e0b'
                      }}>
                        {item.replyStatus === 'APPROVED_SENT' ? 'Sent' :
                         item.replyStatus === 'DRAFT_READY' ? 'Draft Ready' : 'Needs Response'}
                      </span>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Interaction Detail & AI Reply Assistant */}
        <div className="inbox-detail-pane">
          {!activeItem ? (
            <div style={{ textAlign: 'center', margin: 'auto', padding: '40px', color: '#64748b' }}>
              <MessageSquare size={48} style={{ opacity: 0.3, margin: '0 auto 16px' }} />
              <h3>Select an interaction to view conversation context</h3>
              <p style={{ fontSize: '0.85rem', maxWidth: '380px', margin: '8px auto 0' }}>
                Manage comments and direct messages with AI suggestions and mandatory human approval.
              </p>
            </div>
          ) : (
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
              
              {/* Interaction Header */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                paddingBottom: '16px',
                borderBottom: '1px solid rgba(255,255,255,0.08)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={activeItem.authorAvatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100'}
                    alt={activeItem.authorName}
                    style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h2 style={{ fontSize: '1.15rem', margin: 0 }}>{activeItem.authorName}</h2>
                      <span style={{ fontSize: '0.82rem', color: '#64748b' }}>@{activeItem.authorHandle}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <span className={`badge ${activeItem.platform === 'INSTAGRAM' ? 'badge-ig' : 'badge-fb'}`}>
                        {activeItem.platform} {activeItem.interactionType}
                      </span>
                      <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                        Account: <strong>{activeItem.socialAccount?.accountName || activeItem.brand?.name}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                    {new Date(activeItem.timestamp).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                  <span className={`badge ${activeItem.priority === 'URGENT' ? 'badge-urgent' : 'badge-high'}`}>
                    {activeItem.priority} PRIORITY
                  </span>
                </div>
              </div>

              {/* Sensitive Escalation Banner (SAFE-02, SAFE-03, CLS-07) */}
              {activeItem.isSensitive && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  borderRadius: '10px',
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                  <AlertTriangle size={24} color="#ef4444" style={{ flexShrink: 0 }} />
                  <div>
                    <h4 style={{ color: '#f87171', fontSize: '0.885rem', margin: '0 0 2px' }}>
                      Sensitive Topic / Escalation Detected (Rule SAFE-03)
                    </h4>
                    <p style={{ color: '#cbd5e1', fontSize: '0.78rem', margin: 0 }}>
                      This interaction mentions financial billing, legal terms, or serious complaint keywords. Use high empathy and verify with senior management before approving any message.
                    </p>
                  </div>
                </div>
              )}

              {/* Source Post Context (if comment) */}
              {activeItem.postTitle && (
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    {activeItem.postMediaUrl && (
                      <img
                        src={activeItem.postMediaUrl}
                        alt="Parent post"
                        style={{ width: 40, height: 40, borderRadius: '6px', objectFit: 'cover' }}
                      />
                    )}
                    <div>
                      <span style={{ fontSize: '0.7rem', color: '#64748b', textTransform: 'uppercase', display: 'block' }}>
                        Source Social Post
                      </span>
                      <span style={{ fontSize: '0.85rem', color: '#cbd5e1', fontWeight: 500 }}>
                        {activeItem.postTitle}
                      </span>
                    </div>
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: 4 }}>
                    Public Feed <ExternalLink size={12} />
                  </span>
                </div>
              )}

              {/* Customer Message Bubble */}
              <div style={{
                background: 'rgba(15, 23, 42, 0.7)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '12px',
                padding: '18px 20px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8', fontWeight: 600 }}>
                    INBOUND MESSAGE
                  </span>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {activeItem.classification?.isQuestion && (
                      <span className="badge badge-normal" style={{ fontSize: '0.65rem' }}>Question</span>
                    )}
                    {activeItem.classification?.isPricingInquiry && (
                      <span className="badge badge-high" style={{ fontSize: '0.65rem' }}>Pricing Inquiry</span>
                    )}
                  </div>
                </div>
                <p style={{ fontSize: '0.95rem', color: '#f8fafc', lineHeight: 1.5, margin: 0 }}>
                  "{activeItem.content}"
                </p>
              </div>

              {/* AI Reply Assistant Box (AI-01, AI-02, AI-03, AI-04) */}
              <div className="ai-suggestion-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{
                      width: 28,
                      height: 28,
                      borderRadius: '8px',
                      background: 'var(--accent-gradient)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}>
                      <Sparkles size={16} color="#ffffff" />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.98rem', margin: 0 }}>AI Reply Assistant</h3>
                      <span style={{ fontSize: '0.72rem', color: '#a5b4fc' }}>
                        Tuned with <strong>{activeItem.brand?.name}</strong> guidelines
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={handleGenerateAiReplies}
                      disabled={generatingAi}
                      style={{ gap: '6px' }}
                    >
                      <RefreshCw size={13} className={generatingAi ? 'animate-spin' : ''} />
                      {generatingAi ? 'Generating...' : 'Generate New Suggestions'}
                    </button>
                    {aiSuggestions && (
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={handleRejectSuggestion}
                        title="Discard AI suggestion and log feedback"
                      >
                        <ThumbsDown size={13} /> Discard
                      </button>
                    )}
                  </div>
                </div>

                {/* Multiple Suggestion Variants (AI-02) */}
                {aiSuggestions && aiSuggestions.suggestions && (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: `repeat(${aiSuggestions.suggestions.length}, 1fr)`,
                    gap: '10px',
                    marginBottom: '14px'
                  }}>
                    {aiSuggestions.suggestions.map((sug, idx) => {
                      const isSelected = selectedSuggestionIdx === idx;
                      return (
                        <div
                          key={sug.id}
                          className={`ai-suggestion-option-card ${isSelected ? 'selected' : ''}`}
                          onClick={() => {
                            setSelectedSuggestionIdx(idx);
                            setDraftReplyText(sug.text);
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: isSelected ? '#a5b4fc' : '#cbd5e1' }}>
                              Option {idx + 1}: {sug.label}
                            </span>
                            {isSelected && <CheckCircle size={13} color="#6366f1" />}
                          </div>
                          <span style={{ fontSize: '0.68rem', color: '#64748b', display: 'block', marginBottom: '6px' }}>
                            Tone: {sug.tone}
                          </span>
                          <p style={{
                            fontSize: '0.78rem',
                            color: '#94a3b8',
                            lineHeight: 1.35,
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden'
                          }}>
                            {sug.text}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Editable Response Editor (AI-04, AI-10 Manual Reply) */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                      Response Composer (AI Assisted or Manual)
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      {draftReplyText.length} characters
                    </span>
                  </div>

                  <textarea
                    className="textarea"
                    rows={4}
                    value={draftReplyText}
                    onChange={(e) => setDraftReplyText(e.target.value)}
                    placeholder={`Compose reply as ${activeItem.brand?.name} or click "Generate New Suggestions"...`}
                    style={{ fontSize: '0.885rem' }}
                  />

                  {/* Actions & Mandatory Approval Trigger (SAFE-01, AI-06) */}
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginTop: '12px'
                  }}>
                    <span style={{ fontSize: '0.75rem', color: '#a5b4fc', display: 'flex', alignItems: 'center', gap: 5 }}>
                      <ShieldCheck size={14} /> Rule SAFE-01: AI cannot send autonomously.
                    </span>

                    <button
                      className="btn btn-primary"
                      onClick={() => setIsApprovalModalOpen(true)}
                      disabled={!draftReplyText.trim()}
                      style={{ padding: '8px 20px', gap: '8px' }}
                    >
                      <Send size={15} />
                      Review & Approve to Send
                    </button>
                  </div>
                </div>

              </div>

              {/* Internal Notes & Assignment (TEAM-03, TEAM-05, INB-12) */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <FileText size={16} color="#818cf8" />
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc' }}>
                      Team Internal Notes & Assignment
                    </span>
                  </div>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={handleSaveNotesAndAssignee}
                  >
                    Save Notes
                  </button>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 200px', gap: '12px' }}>
                  <input
                    type="text"
                    className="input"
                    placeholder="Add internal notes (e.g. customer called desk, voucher offered)..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  />

                  <select
                    className="select"
                    value={assignedUserId}
                    onChange={(e) => setAssignedUserId(e.target.value)}
                    style={{ fontSize: '0.82rem' }}
                  >
                    <option value="">Unassigned</option>
                    {availableUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} ({u.role})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Reply History / Audit Trail for this thread (AI-09) */}
              {activeItem.replies && activeItem.replies.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>
                    Sent Response History & Audit
                  </span>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {activeItem.replies.filter(r => r.status === 'SENT').map((rep) => (
                      <div
                        key={rep.id}
                        style={{
                          background: 'rgba(16, 185, 129, 0.05)',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          borderRadius: '8px',
                          padding: '12px 16px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '0.75rem', color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <CheckCircle size={13} /> Dispatched to {activeItem.platform}
                          </span>
                          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
                            {new Date(rep.sentAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.885rem', color: '#f8fafc', margin: '4px 0' }}>
                          "{rep.approvedText}"
                        </p>
                        <span style={{ fontSize: '0.7rem', color: '#94a3b8' }}>
                          {rep.auditNotes}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>

      </div>

      {/* Mandatory Human Approval Modal (SAFE-01) */}
      <HumanApprovalModal
        isOpen={isApprovalModalOpen}
        onClose={() => setIsApprovalModalOpen(false)}
        onConfirmApprove={handleConfirmApprovalSend}
        interaction={activeItem}
        initialReplyText={draftReplyText}
        isSubmitting={isSending}
      />
    </div>
  );
};
