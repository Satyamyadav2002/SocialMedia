import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import {
  Building2,
  Layers,
  Share2,
  ShieldCheck,
  Plus,
  Edit3,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  HelpCircle,
  Sparkles,
  Link2
} from 'lucide-react';
import { Instagram, Facebook } from '../components/SocialIcons';

export const BrandsView = () => {
  const {
    businesses,
    brands,
    selectedBusinessId,
    loadInitialData,
    showToast
  } = useApp();

  const [activeTab, setActiveTab] = useState('brands'); // 'brands' | 'accounts' | 'voice' | 'businesses'
  const [selectedBrand, setSelectedBrand] = useState(brands[0] || null);
  const [voiceProfile, setVoiceProfile] = useState(null);
  const [socialAccounts, setSocialAccounts] = useState([]);
  const [loadingVoice, setLoadingVoice] = useState(false);

  // Modals
  const [isAddBizOpen, setIsAddBizOpen] = useState(false);
  const [isAddBrandOpen, setIsAddBrandOpen] = useState(false);
  const [isConnectAccountOpen, setIsConnectAccountOpen] = useState(false);

  // Form states
  const [newBizName, setNewBizName] = useState('');
  const [newBizCode, setNewBizCode] = useState('');
  const [newBizIndustry, setNewBizIndustry] = useState('');

  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandBizId, setNewBrandBizId] = useState(businesses[0]?.id || '');
  const [newBrandDesc, setNewBrandDesc] = useState('');

  const [newAccPlatform, setNewAccPlatform] = useState('INSTAGRAM');
  const [newAccName, setNewAccName] = useState('');
  const [newAccHandle, setNewAccHandle] = useState('');
  const [newAccBrandId, setNewAccBrandId] = useState(brands[0]?.id || '');

  // Voice editor state
  const [tone, setTone] = useState('');
  const [style, setStyle] = useState('');
  const [audience, setAudience] = useState('');
  const [terminology, setTerminology] = useState('');
  const [policies, setPolicies] = useState('');
  const [faqQ, setFaqQ] = useState('');
  const [faqA, setFaqA] = useState('');

  // Load social accounts
  const loadAccounts = async () => {
    try {
      const res = await api.getSocialAccounts();
      setSocialAccounts(res || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    loadAccounts();
  }, []);

  // Update selectedBrand when brands load
  useEffect(() => {
    if (!selectedBrand && brands.length > 0) {
      setSelectedBrand(brands[0]);
    }
  }, [brands]);

  // Load voice profile for selected brand
  useEffect(() => {
    if (!selectedBrand) return;

    const fetchVoice = async () => {
      try {
        setLoadingVoice(true);
        const res = await api.getBrandVoice(selectedBrand.id);
        setVoiceProfile(res);
        setTone(res.tone || '');
        setStyle(res.style || '');
        setAudience(res.targetAudience || '');
        setTerminology(res.terminology || '');
        setPolicies(res.policies || '');
      } catch (err) {
        console.error('Error fetching voice:', err);
      } finally {
        setLoadingVoice(false);
      }
    };

    fetchVoice();
  }, [selectedBrand]);

  // Save Voice Profile (VOICE-01, VOICE-02, VOICE-06)
  const handleSaveVoice = async () => {
    if (!selectedBrand) return;
    try {
      const updated = await api.updateBrandVoice(selectedBrand.id, {
        tone,
        style,
        targetAudience: audience,
        terminology,
        policies
      });
      setVoiceProfile(updated);
      showToast(`Brand voice guidelines updated for ${selectedBrand.name}!`);
      loadInitialData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Add FAQ to Brand
  const handleAddFaq = async () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    const currentFaqs = voiceProfile?.faqs || [];
    const updatedFaqs = [...currentFaqs, { q: faqQ.trim(), a: faqA.trim() }];
    try {
      const updated = await api.updateBrandVoice(selectedBrand.id, { faqs: updatedFaqs });
      setVoiceProfile(updated);
      setFaqQ('');
      setFaqA('');
      showToast('Brand FAQ saved.');
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create Business (BRD-01)
  const handleCreateBusiness = async (e) => {
    e.preventDefault();
    if (!newBizName || !newBizCode) return;
    try {
      await api.createBusiness({
        name: newBizName,
        code: newBizCode,
        industry: newBizIndustry
      });
      showToast(`Business "${newBizName}" created successfully.`);
      setIsAddBizOpen(false);
      setNewBizName('');
      setNewBizCode('');
      loadInitialData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Create Brand (BRD-02)
  const handleCreateBrand = async (e) => {
    e.preventDefault();
    if (!newBrandName || !newBrandBizId) return;
    try {
      await api.createBrand({
        businessId: newBrandBizId,
        name: newBrandName,
        description: newBrandDesc
      });
      showToast(`Brand "${newBrandName}" registered.`);
      setIsAddBrandOpen(false);
      setNewBrandName('');
      setNewBrandDesc('');
      loadInitialData();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Connect Social Account (INT-01 to INT-04)
  const handleConnectAccount = async (e) => {
    e.preventDefault();
    if (!newAccName || !newAccBrandId) return;
    const targetBrand = brands.find(b => b.id === newAccBrandId);
    try {
      await api.connectAccount({
        businessId: targetBrand?.businessId,
        brandId: newAccBrandId,
        platform: newAccPlatform,
        accountName: newAccName,
        handle: newAccHandle || newAccName.toLowerCase().replace(/\s+/g, '_')
      });
      showToast(`Connected ${newAccPlatform} account "${newAccName}".`);
      setIsConnectAccountOpen(false);
      setNewAccName('');
      setNewAccHandle('');
      loadAccounts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Test Connection (INT-06)
  const handleTestConnection = async (accId) => {
    try {
      const health = await api.testConnection(accId);
      showToast(`Account valid! Permissions: ${health.permissions.length} granted.`);
      loadAccounts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Disconnect Account (INT-05)
  const handleDisconnect = async (accId) => {
    if (!window.confirm('Disconnect this account? Stored OAuth tokens will be safely cleared.')) return;
    try {
      await api.disconnectAccount(accId);
      showToast('Account disconnected.');
      loadAccounts();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="page-scrollable-content">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '1.65rem', marginBottom: '4px' }}>Businesses, Brands & Integrations</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.885rem' }}>
            Manage the multi-business hierarchy, brand voice instructions, and connected Meta social assets.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsAddBizOpen(true)}>
            <Plus size={14} /> Add Business
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => setIsAddBrandOpen(true)}>
            <Plus size={14} /> Add Brand
          </button>
          <button className="btn btn-primary btn-sm" onClick={() => setIsConnectAccountOpen(true)}>
            <Link2 size={14} /> Connect Meta Account
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-header">
        <button
          className={`tab-btn ${activeTab === 'brands' ? 'active' : ''}`}
          onClick={() => setActiveTab('brands')}
        >
          Brands & Voice Guidelines ({brands.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'accounts' ? 'active' : ''}`}
          onClick={() => setActiveTab('accounts')}
        >
          Connected Social Accounts ({socialAccounts.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'businesses' ? 'active' : ''}`}
          onClick={() => setActiveTab('businesses')}
        >
          Businesses Master ({businesses.length})
        </button>
      </div>

      {/* TAB 1: BRANDS & VOICE PROFILE */}
      {activeTab === 'brands' && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '24px' }}>
          
          {/* Brand List */}
          <div className="glass-card" style={{ padding: '16px' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', display: 'block', marginBottom: '12px' }}>
              SELECT BRAND PROFILE
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {brands.map((brand) => {
                const isSelected = selectedBrand?.id === brand.id;
                return (
                  <div
                    key={brand.id}
                    onClick={() => setSelectedBrand(brand)}
                    style={{
                      padding: '12px 14px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      background: isSelected ? 'rgba(99, 102, 241, 0.15)' : 'rgba(255, 255, 255, 0.02)',
                      border: isSelected ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.06)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '12px',
                      transition: 'all 150ms ease'
                    }}
                  >
                    <img
                      src={brand.logoUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
                      alt={brand.name}
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div style={{ flex: 1 }}>
                      <span style={{ fontSize: '0.885rem', fontWeight: 600, color: '#ffffff', display: 'block' }}>
                        {brand.name}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: '#64748b' }}>
                        @{brand.handle}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Voice Guidelines Editor */}
          {selectedBrand && (
            <div className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                <div>
                  <h3 style={{ fontSize: '1.2rem', margin: 0 }}>
                    Brand Voice & AI Profile: {selectedBrand.name}
                  </h3>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    Rule VOICE-02: AI reply generation strictly references these parameters.
                  </span>
                </div>
                <button className="btn btn-primary" onClick={handleSaveVoice}>
                  Save Guidelines
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    TONE OF VOICE (VOICE-01)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={tone}
                    onChange={(e) => setTone(e.target.value)}
                    placeholder="e.g. Energetic, motivational, supportive, direct"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    WRITING STYLE & EMOJI RULES (VOICE-01)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    placeholder="e.g. Short punchy sentences, empowerment terms, fitness emojis"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    TARGET AUDIENCE PROFILE
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={audience}
                    onChange={(e) => setAudience(e.target.value)}
                    placeholder="e.g. Busy urban professionals, fitness lovers"
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    TERMINOLOGY & VOCABULARY GUARDRAILS
                  </label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={terminology}
                    onChange={(e) => setTerminology(e.target.value)}
                    placeholder="Words to use vs words to avoid..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    ESCALATION & RETURN POLICIES
                  </label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={policies}
                    onChange={(e) => setPolicies(e.target.value)}
                    placeholder="Cancellation rules, refund instructions..."
                  />
                </div>

                {/* FAQs Section */}
                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '10px',
                  padding: '16px'
                }}>
                  <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#f8fafc', display: 'block', marginBottom: '10px' }}>
                    Brand Knowledge FAQs ({voiceProfile?.faqs?.length || 0})
                  </span>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '14px' }}>
                    {(voiceProfile?.faqs || []).map((faq, idx) => (
                      <div
                        key={idx}
                        style={{
                          background: 'rgba(15, 23, 42, 0.6)',
                          padding: '10px 12px',
                          borderRadius: '6px',
                          fontSize: '0.8rem'
                        }}
                      >
                        <strong style={{ color: '#cbd5e1' }}>Q: {faq.q}</strong>
                        <p style={{ margin: '3px 0 0', color: '#94a3b8' }}>A: {faq.a}</p>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: '8px' }}>
                    <input
                      type="text"
                      className="input"
                      placeholder="Question..."
                      value={faqQ}
                      onChange={(e) => setFaqQ(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                    <input
                      type="text"
                      className="input"
                      placeholder="Approved Answer..."
                      value={faqA}
                      onChange={(e) => setFaqA(e.target.value)}
                      style={{ fontSize: '0.8rem' }}
                    />
                    <button className="btn btn-secondary btn-sm" onClick={handleAddFaq}>
                      Add FAQ
                    </button>
                  </div>
                </div>

              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: CONNECTED SOCIAL ACCOUNTS */}
      {activeTab === 'accounts' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {socialAccounts.map((acc) => {
            const isIg = acc.platform === 'INSTAGRAM';
            const isValid = acc.tokenStatus === 'VALID';

            return (
              <div key={acc.id} className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <img
                      src={acc.profilePictureUrl || 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100'}
                      alt={acc.accountName}
                      style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover' }}
                    />
                    <div>
                      <h3 style={{ fontSize: '0.98rem', margin: 0 }}>{acc.accountName}</h3>
                      <span style={{ fontSize: '0.78rem', color: '#64748b' }}>@{acc.handle}</span>
                    </div>
                  </div>

                  <span className={`badge ${isIg ? 'badge-ig' : 'badge-fb'}`}>
                    {isIg ? <Instagram size={11} /> : <Facebook size={11} />}
                    {acc.platform}
                  </span>
                </div>

                <div style={{
                  background: 'rgba(255,255,255,0.02)',
                  padding: '10px 12px',
                  borderRadius: '8px',
                  fontSize: '0.78rem',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '4px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Brand:</span>
                    <strong style={{ color: '#cbd5e1' }}>{acc.brandName}</strong>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Token Health (INT-06):</span>
                    <span style={{ color: isValid ? '#34d399' : '#f87171', fontWeight: 600 }}>
                      {isValid ? 'VALID' : 'REAUTH NEEDED'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: '#64748b' }}>Last Synced:</span>
                    <span style={{ color: '#94a3b8' }}>
                      {new Date(acc.lastSyncedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => handleTestConnection(acc.id)}
                    style={{ gap: '6px' }}
                  >
                    <RefreshCw size={12} /> Test Health
                  </button>

                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDisconnect(acc.id)}
                  >
                    Disconnect
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 3: BUSINESSES MASTER */}
      {activeTab === 'businesses' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '20px' }}>
          {businesses.map((biz) => (
            <div key={biz.id} className="glass-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                <span className="badge badge-normal" style={{ letterSpacing: '0.05em' }}>
                  CODE: {biz.code}
                </span>
                <span className="badge badge-positive">ACTIVE</span>
              </div>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '6px' }}>{biz.name}</h3>
              <p style={{ fontSize: '0.85rem', color: '#94a3b8', marginBottom: '14px' }}>
                {biz.description}
              </p>

              <div style={{
                borderTop: '1px solid rgba(255,255,255,0.06)',
                paddingTop: '12px',
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '0.78rem',
                color: '#64748b'
              }}>
                <span>Industry: <strong>{biz.industry}</strong></span>
                <span>Brands: <strong>{biz.brandCount || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* MODAL: ADD BUSINESS */}
      {isAddBizOpen && (
        <div className="modal-overlay" onClick={() => setIsAddBizOpen(false)}>
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <form onSubmit={handleCreateBusiness}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: 0 }}>Create Business Master Record</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    BUSINESS NAME
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={newBizName}
                    onChange={(e) => setNewBizName(e.target.value)}
                    placeholder="e.g. Apex Holdings Ltd"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    SHORT CODE
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={newBizCode}
                    onChange={(e) => setNewBizCode(e.target.value)}
                    placeholder="e.g. APEX"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    INDUSTRY
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newBizIndustry}
                    onChange={(e) => setNewBizIndustry(e.target.value)}
                    placeholder="e.g. Retail, Health & Wellness"
                  />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddBizOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Create Business</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD BRAND */}
      {isAddBrandOpen && (
        <div className="modal-overlay" onClick={() => setIsAddBrandOpen(false)}>
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <form onSubmit={handleCreateBrand}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: 0 }}>Register New Brand Master</h3>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PARENT BUSINESS (BRD-01)
                  </label>
                  <select
                    className="select"
                    value={newBrandBizId}
                    onChange={(e) => setNewBrandBizId(e.target.value)}
                  >
                    {businesses.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    BRAND NAME
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g. Apex Fitness Studio"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    DESCRIPTION
                  </label>
                  <textarea
                    className="textarea"
                    rows={2}
                    value={newBrandDesc}
                    onChange={(e) => setNewBrandDesc(e.target.value)}
                    placeholder="High-end functional boutique gym..."
                  />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsAddBrandOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Brand</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CONNECT META ACCOUNT (INT-01) */}
      {isConnectAccountOpen && (
        <div className="modal-overlay" onClick={() => setIsConnectAccountOpen(false)}>
          <div className="modal-window" onClick={e => e.stopPropagation()} style={{ maxWidth: '480px' }}>
            <form onSubmit={handleConnectAccount}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                <h3 style={{ margin: 0 }}>Connect Facebook or Instagram Account</h3>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: '4px 0 0' }}>
                  Simulates Meta OAuth 2.0 authorization with page and messaging permissions.
                </p>
              </div>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    TARGET BRAND
                  </label>
                  <select
                    className="select"
                    value={newAccBrandId}
                    onChange={(e) => setNewAccBrandId(e.target.value)}
                  >
                    {brands.map((b) => (
                      <option key={b.id} value={b.id}>{b.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    PLATFORM TYPE
                  </label>
                  <select
                    className="select"
                    value={newAccPlatform}
                    onChange={(e) => setNewAccPlatform(e.target.value)}
                  >
                    <option value="INSTAGRAM">Instagram Professional Account</option>
                    <option value="FACEBOOK">Facebook Page</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    DISPLAY NAME
                  </label>
                  <input
                    type="text"
                    className="input"
                    required
                    value={newAccName}
                    onChange={(e) => setNewAccName(e.target.value)}
                    placeholder="e.g. Apex Fitness Official"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#94a3b8', display: 'block', marginBottom: '4px' }}>
                    HANDLE
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={newAccHandle}
                    onChange={(e) => setNewAccHandle(e.target.value)}
                    placeholder="e.g. apexfitness.official"
                  />
                </div>
              </div>
              <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setIsConnectAccountOpen(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Authorize & Connect</button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
