import React, { useState } from 'react';
import { 
  ShieldCheck, 
  Send, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  User 
} from 'lucide-react';
import { Instagram, Facebook } from './SocialIcons';

export const HumanApprovalModal = ({
  isOpen,
  onClose,
  onConfirmApprove,
  interaction,
  initialReplyText,
  isSubmitting
}) => {
  if (!isOpen || !interaction) return null;

  const [text, setText] = useState(initialReplyText || '');
  const [confirmedCheck, setConfirmedCheck] = useState(false);

  const handleSend = () => {
    if (!text.trim()) return;
    onConfirmApprove(text.trim());
  };

  const isInstagram = interaction.platform === 'INSTAGRAM';

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div 
        className="modal-window" 
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '620px' }}
      >
        {/* Header */}
        <div style={{
          padding: '20px 24px',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(99, 102, 241, 0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'rgba(16, 185, 129, 0.2)',
              color: '#34d399',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.1rem', margin: 0 }}>Human Approval Required</h3>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0 }}>
                Rule SAFE-01: AI replies must be approved by an internal team member before dispatch.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="btn btn-secondary btn-icon"
            style={{ padding: '6px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          
          {/* Destination Details (SAFE-05) */}
          <div style={{
            background: 'rgba(255,255,255,0.02)',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: '10px',
            padding: '14px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>TARGET PLATFORM</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '3px' }}>
                {isInstagram ? (
                  <span className="badge badge-ig" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                    <Instagram size={12} /> Instagram Professional
                  </span>
                ) : (
                  <span className="badge badge-fb" style={{ fontSize: '0.75rem', padding: '3px 8px' }}>
                    <Facebook size={12} /> Facebook Page
                  </span>
                )}
              </div>
            </div>

            <div>
              <span style={{ fontSize: '0.72rem', color: '#64748b', display: 'block' }}>RECIPIENT & CHANNEL</span>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#f8fafc', display: 'flex', alignItems: 'center', gap: '5px', marginTop: '3px' }}>
                <User size={13} color="#94a3b8" /> {interaction.authorName} (@{interaction.authorHandle})
              </span>
            </div>
          </div>

          {/* Original Customer Message */}
          <div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
              Original {interaction.interactionType === 'COMMENT' ? 'Public Comment' : 'Direct Message'}
            </span>
            <div style={{
              marginTop: '6px',
              padding: '12px 14px',
              borderRadius: '8px',
              background: 'rgba(15, 23, 42, 0.6)',
              border: '1px solid rgba(255,255,255,0.06)',
              fontSize: '0.885rem',
              color: '#cbd5e1',
              fontStyle: 'italic'
            }}>
              "{interaction.content}"
            </div>
          </div>

          {/* Final Reply Text (Editable before sending AI-04) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#818cf8', textTransform: 'uppercase' }}>
                Final Approved Response (Editable)
              </span>
              <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                {text.length} characters
              </span>
            </div>
            <textarea
              className="textarea"
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Review or edit final reply text here..."
              style={{ fontSize: '0.9rem', lineHeight: 1.5 }}
            />
          </div>

          {/* Mandatory verification check */}
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.82rem',
            color: '#cbd5e1',
            cursor: 'pointer',
            padding: '10px 12px',
            borderRadius: '8px',
            background: 'rgba(99, 102, 241, 0.05)',
            border: '1px solid rgba(99, 102, 241, 0.15)'
          }}>
            <input
              type="checkbox"
              checked={confirmedCheck}
              onChange={(e) => setConfirmedCheck(e.target.checked)}
              style={{ width: '16px', height: '16px', accentColor: '#6366f1' }}
            />
            <span>
              I confirm that I have reviewed this response and verify it complies with <strong>{interaction.brandName}</strong> guidelines and tone.
            </span>
          </label>
        </div>

        {/* Footer */}
        <div style={{
          padding: '16px 24px',
          background: 'rgba(15, 23, 42, 0.8)',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          justifyContent: 'flex-end',
          gap: '12px'
        }}>
          <button 
            type="button" 
            className="btn btn-secondary" 
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel / Save Draft
          </button>

          <button
            type="button"
            className="btn btn-primary"
            onClick={handleSend}
            disabled={!confirmedCheck || !text.trim() || isSubmitting}
            style={{ minWidth: '160px' }}
          >
            {isSubmitting ? (
              'Dispatching to Meta...'
            ) : (
              <>
                <Send size={15} />
                Approve & Send
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
