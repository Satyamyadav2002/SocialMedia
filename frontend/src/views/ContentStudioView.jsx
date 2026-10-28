import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Sparkles,
  Send,
  Calendar,
  Image,
  Hash,
  CheckCircle,
  Copy,
  RefreshCw,
  Sliders,
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Instagram, Facebook } from '../components/SocialIcons';

export const ContentStudioView = () => {
  const {
    filteredBrands,
    selectedBrandId,
    setSelectedBrandId,
    selectedBusinessId,
    businesses,
    showToast,
    setCurrentView
  } = useApp();

  const [activeBrandId, setActiveBrandId] = useState(
    selectedBrandId !== 'ALL' ? selectedBrandId : (filteredBrands[0]?.id || '')
  );
  const [topic, setTopic] = useState('');
  const [targetPlatform, setTargetPlatform] = useState('INSTAGRAM');
  const [format, setFormat] = useState('FEED_POST');
  const [toneOverride, setToneOverride] = useState('');
  const [generating, setGenerating] = useState(false);
  const [generatedOptions, setGeneratedOptions] = useState([]);
  const [selectedOptionIdx, setSelectedOptionIdx] = useState(0);

  // Editor fields
  const [postTitle, setPostTitle] = useState('');
  const [postCaption, setPostCaption] = useState('');
  const [postHashtags, setPostHashtags] = useState('');
  const [postCta, setPostCta] = useState('');
  const [mediaUrl, setMediaUrl] = useState('https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=600');
  const [scheduleDate, setScheduleDate] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Sync activeBrandId if global selectedBrandId changes
  useEffect(() => {
    if (selectedBrandId !== 'ALL') {
      setActiveBrandId(selectedBrandId);
    } else if (filteredBrands.length > 0) {
      setActiveBrandId(filteredBrands[0].id);
    }
  }, [selectedBrandId, filteredBrands]);

  const currentBrand = filteredBrands.find(b => b.id === activeBrandId);

  // Generate Post with AI
  const handleGenerate = async () => {
    if (!activeBrandId) {
      showToast('Please select a target brand first.', 'error');
      return;
    }

    try {
      setGenerating(true);
      const res = await api.generateSocialContent({
        businessId: currentBrand?.businessId,
        brandId: activeBrandId,
        topic: topic.trim() || 'Exciting new updates and community spotlight',
        platform: targetPlatform,
        format,
        toneOverride: toneOverride || null
      });

      setGeneratedOptions(res.options || []);
      setSelectedOptionIdx(0);

      if (res.options && res.options.length > 0) {
        const top = res.options[0];
        setPostTitle(top.title);
        setPostCaption(top.bodyText);
        setPostHashtags(top.hashtags.join(' '));
        setPostCta(top.callToAction);
      }

      showToast('AI content options generated according to brand guidelines.');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setGenerating(false);
    }
  };

  // Switch between AI generated variants
  const handleSelectOption = (idx) => {
    setSelectedOptionIdx(idx);
    const opt = generatedOptions[idx];
    if (opt) {
      setPostTitle(opt.title);
      setPostCaption(opt.bodyText);
      setPostHashtags(opt.hashtags.join(' '));
      setPostCta(opt.callToAction);
    }
  };

  // Save Draft
  const handleSaveDraft = async () => {
    if (!postTitle || !postCaption) {
      showToast('Title and caption are required to save draft.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createContent({
        businessId: currentBrand?.businessId,
        brandId: activeBrandId,
        title: postTitle,
        bodyText: postCaption,
        mediaUrls: [mediaUrl],
        platforms: [targetPlatform],
        formats: [format],
        hashtags: postHashtags,
        callToAction: postCta,
        scheduledFor: null,
        publishImmediately: false
      });

      showToast('Post saved as draft in content calendar.');
      setCurrentView('calendar');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Schedule Post (PUB-02, CAL-04)
  const handleSchedulePost = async () => {
    if (!postTitle || !postCaption) {
      showToast('Title and caption are required.', 'error');
      return;
    }
    if (!scheduleDate) {
      showToast('Please select a scheduled date and time.', 'error');
      return;
    }

    try {
      setIsSubmitting(true);
      await api.createContent({
        businessId: currentBrand?.businessId,
        brandId: activeBrandId,
        title: postTitle,
        bodyText: postCaption,
        mediaUrls: [mediaUrl],
        platforms: [targetPlatform],
        formats: [format],
        hashtags: postHashtags,
        callToAction: postCta,
        scheduledFor: scheduleDate,
        publishImmediately: false
      });

      showToast(`Post scheduled for ${new Date(scheduleDate).toLocaleString()}.`);
      setCurrentView('calendar');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish Now with destination confirmation (PUB-01, PUB-03, PUB-04)
  const handlePublishNow = async () => {
    if (!postTitle || !postCaption) {
      showToast('Title and caption are required.', 'error');
      return;
    }

    const confirmed = window.confirm(
      `Confirm Publication to Meta API:\n\nBrand: ${currentBrand?.name}\nPlatform: ${targetPlatform}\n\nAre you sure you want to publish immediately?`
    );

    if (!confirmed) return;

    try {
      setIsSubmitting(true);
      await api.createContent({
        businessId: currentBrand?.businessId,
        brandId: activeBrandId,
        title: postTitle,
        bodyText: postCaption,
        mediaUrls: [mediaUrl],
        platforms: [targetPlatform],
        formats: [format],
        hashtags: postHashtags,
        callToAction: postCta,
        publishImmediately: true
      });

      showToast(`Post published immediately to ${targetPlatform}!`);
      setCurrentView('calendar');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="page-scrollable-content">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.65rem', marginBottom: '6px' }}>AI Content Studio</h1>
        <p style={{ color: '#94a3b8', fontSize: '0.885rem' }}>
          Generate brand-tailored social captions, hashtags, and visual concepts with strict destination validation.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '28px' }}>
        
        {/* Left Column: Generator Form & Editor */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          
          {/* Target Brand & Platform Controls */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '14px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Layers size={16} color="#818cf8" /> Brand Profile & Destination
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  SELECT BRAND (CNT-01)
                </label>
                <select
                  className="select"
                  value={activeBrandId}
                  onChange={(e) => setActiveBrandId(e.target.value)}
                >
                  {filteredBrands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  TARGET PLATFORM (CNT-05)
                </label>
                <select
                  className="select"
                  value={targetPlatform}
                  onChange={(e) => setTargetPlatform(e.target.value)}
                >
                  <option value="INSTAGRAM">Instagram Professional</option>
                  <option value="FACEBOOK">Facebook Page</option>
                </select>
              </div>
            </div>

            {currentBrand?.voiceProfile && (
              <div style={{
                marginTop: '12px',
                padding: '10px 14px',
                borderRadius: '8px',
                background: 'rgba(99, 102, 241, 0.08)',
                border: '1px solid rgba(99, 102, 241, 0.2)',
                fontSize: '0.78rem',
                color: '#cbd5e1'
              }}>
                <span style={{ color: '#a5b4fc', fontWeight: 600 }}>Active Voice Tone: </span>
                {currentBrand.voiceProfile.tone}
              </div>
            )}
          </div>

          {/* AI Generator Box */}
          <div className="ai-suggestion-box">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={18} color="#818cf8" />
                <h3 style={{ fontSize: '0.98rem', margin: 0 }}>Content Generator</h3>
              </div>
              <button
                className="btn btn-primary btn-sm"
                onClick={handleGenerate}
                disabled={generating}
                style={{ gap: '6px' }}
              >
                <Sparkles size={14} className={generating ? 'animate-spin' : ''} />
                {generating ? 'Drafting...' : 'Generate with AI'}
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  TOPIC OR CAMPAIGN OBJECTIVE (CNT-02)
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Weekend high-intensity group workout, limited drop preview, healthy recipe tip..."
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    FORMAT
                  </label>
                  <select
                    className="select"
                    value={format}
                    onChange={(e) => setFormat(e.target.value)}
                  >
                    <option value="FEED_POST">Feed Post</option>
                    <option value="REEL">Reel / Video</option>
                    <option value="STORY">Story</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    TONE OVERRIDE (OPTIONAL)
                  </label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Leave empty for brand default"
                    value={toneOverride}
                    onChange={(e) => setToneOverride(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Generated Variants Switcher */}
            {generatedOptions.length > 0 && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                {generatedOptions.map((opt, idx) => (
                  <button
                    key={idx}
                    className={`btn btn-sm ${selectedOptionIdx === idx ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleSelectOption(idx)}
                    style={{ fontSize: '0.75rem' }}
                  >
                    Concept #{idx + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Post Content Editor */}
          <div className="glass-card">
            <h3 style={{ fontSize: '1rem', marginBottom: '14px' }}>Edit & Refine Post</h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  POST TITLE / INTERNAL REF
                </label>
                <input
                  type="text"
                  className="input"
                  value={postTitle}
                  onChange={(e) => setPostTitle(e.target.value)}
                  placeholder="Internal post title..."
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  CAPTION TEXT (CNT-03)
                </label>
                <textarea
                  className="textarea"
                  rows={5}
                  value={postCaption}
                  onChange={(e) => setPostCaption(e.target.value)}
                  placeholder="Write or edit social caption..."
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    HASHTAGS (CNT-04)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={postHashtags}
                    onChange={(e) => setPostHashtags(e.target.value)}
                    placeholder="#brand #wellness #fitness"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    CALL TO ACTION (CTA)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={postCta}
                    onChange={(e) => setPostCta(e.target.value)}
                    placeholder="Tap link in bio to book..."
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                  MEDIA IMAGE URL (PUB-09)
                </label>
                <input
                  type="text"
                  className="input"
                  value={mediaUrl}
                  onChange={(e) => setMediaUrl(e.target.value)}
                  placeholder="https://..."
                />
              </div>

              {/* Schedule Date & Publication Bar */}
              <div style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '10px',
                padding: '14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px'
              }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    SCHEDULE DATE & TIME (PUB-02)
                  </label>
                  <input
                    type="datetime-local"
                    className="input"
                    value={scheduleDate}
                    onChange={(e) => setScheduleDate(e.target.value)}
                    style={{ width: '220px', fontSize: '0.82rem' }}
                  />
                </div>

                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    className="btn btn-secondary"
                    onClick={handleSaveDraft}
                    disabled={isSubmitting}
                  >
                    Save Draft
                  </button>

                  <button
                    className="btn btn-primary"
                    onClick={scheduleDate ? handleSchedulePost : handlePublishNow}
                    disabled={isSubmitting}
                    style={{ gap: '6px' }}
                  >
                    {scheduleDate ? (
                      <>
                        <Calendar size={15} /> Schedule Post
                      </>
                    ) : (
                      <>
                        <Send size={15} /> Publish Now
                      </>
                    )}
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Live Mockup Preview */}
        <div>
          <div style={{ position: 'sticky', top: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase' }}>
                Platform Feed Preview
              </span>
              <span className={`badge ${targetPlatform === 'INSTAGRAM' ? 'badge-ig' : 'badge-fb'}`}>
                {targetPlatform}
              </span>
            </div>

            {/* Social Post Mockup Card */}
            <div style={{
              background: '#0d1322',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '16px',
              overflow: 'hidden',
              boxShadow: 'var(--shadow-md)'
            }}>
              {/* Post Header */}
              <div style={{
                padding: '12px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '1px solid rgba(255,255,255,0.06)'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img
                    src={currentBrand?.logoUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
                    alt={currentBrand?.name}
                    style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                  />
                  <div>
                    <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#ffffff', display: 'block' }}>
                      {currentBrand?.name || 'Brand Name'}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                      @{currentBrand?.handle || 'brand'}
                    </span>
                  </div>
                </div>

                {targetPlatform === 'INSTAGRAM' ? (
                  <Instagram size={18} color="#e1306c" />
                ) : (
                  <Facebook size={18} color="#1877f2" />
                )}
              </div>

              {/* Media Preview */}
              <div style={{ width: '100%', height: '280px', background: '#090d16', position: 'relative' }}>
                {mediaUrl ? (
                  <img
                    src={mediaUrl}
                    alt="Post visual"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#64748b' }}>
                    <Image size={36} />
                  </div>
                )}
              </div>

              {/* Post Body & Captions */}
              <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{
                  fontSize: '0.885rem',
                  color: '#f8fafc',
                  lineHeight: 1.45,
                  margin: 0,
                  whiteSpace: 'pre-line'
                }}>
                  {postCaption || 'Your generated social caption will preview here...'}
                </p>

                {postCta && (
                  <div style={{ fontSize: '0.82rem', fontWeight: 600, color: '#818cf8', marginTop: '4px' }}>
                    👉 {postCta}
                  </div>
                )}

                {postHashtags && (
                  <div style={{ fontSize: '0.8rem', color: '#38bdf8', lineHeight: 1.4, marginTop: '4px' }}>
                    {postHashtags}
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
