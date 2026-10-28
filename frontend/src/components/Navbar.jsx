import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { 
  Building2, 
  Layers, 
  UserCheck, 
  RefreshCw, 
  ShieldCheck, 
  Sparkles,
  ChevronDown
} from 'lucide-react';

export const Navbar = () => {
  const {
    currentUser,
    availableUsers,
    switchUser,
    businesses,
    filteredBrands,
    selectedBusinessId,
    setSelectedBusinessId,
    selectedBrandId,
    setSelectedBrandId,
    refreshStats,
    loadInitialData,
    showToast
  } = useApp();

  const [syncing, setSyncing] = useState(false);

  const handleManualSync = async () => {
    if (syncing) return;
    try {
      setSyncing(true);
      showToast('Initiating Meta Graph API live reconciliation...', 'info');
      await api.triggerGlobalSync();
      if (refreshStats) await refreshStats();
      if (loadInitialData) await loadInitialData();
      showToast('Meta sync check completed successfully.');
    } catch (e) {
      showToast('Sync check failed: ' + e.message, 'error');
    } finally {
      setSyncing(false);
    }
  };

  return (
    <header className="top-nav">
      {/* Left: Global Business & Brand Selector (BRD-04) */}
      <div className="top-nav-left">
        {/* Business Selector */}
        <div className="business-selector-wrapper">
          <Building2 size={16} color="#818cf8" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Business:</span>
          <select
            className="business-selector-select"
            value={selectedBusinessId}
            onChange={(e) => setSelectedBusinessId(e.target.value)}
          >
            <option value="ALL">🏢 All Businesses (Shared View)</option>
            {businesses.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Brand Selector */}
        <div className="business-selector-wrapper">
          <Layers size={16} color="#c084fc" />
          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 600 }}>Brand:</span>
          <select
            className="business-selector-select"
            value={selectedBrandId}
            onChange={(e) => setSelectedBrandId(e.target.value)}
          >
            <option value="ALL">✨ All Brands</option>
            {filteredBrands.map((brand) => (
              <option key={brand.id} value={brand.id}>
                {brand.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Right: Sync Status, Demo Switcher, Active User */}
      <div className="top-nav-right">
        {/* Live sync indicator button */}
        <button
          className="btn btn-secondary btn-sm"
          onClick={handleManualSync}
          disabled={syncing}
          title="Click to trigger Meta API reconciliation"
          style={{ gap: '6px', fontSize: '0.75rem' }}
        >
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
          {syncing ? 'Syncing...' : 'Meta Sync: Live'}
          <RefreshCw size={12} className={syncing ? 'animate-spin' : ''} />
        </button>

        {/* Rapid User Switcher (for testing Administrator vs Team Member roles) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 600 }}>SWITCH ROLE:</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            {availableUsers.map((u) => {
              const isActive = currentUser?.id === u.id;
              return (
                <button
                  key={u.id}
                  onClick={() => switchUser(u.id)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '0.72rem',
                    fontWeight: 600,
                    borderRadius: '6px',
                    border: isActive ? '1px solid #6366f1' : '1px solid rgba(255,255,255,0.08)',
                    background: isActive ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.02)',
                    color: isActive ? '#ffffff' : '#94a3b8',
                    cursor: 'pointer',
                    transition: 'all 150ms ease'
                  }}
                  title={`Switch to ${u.name} (${u.role})`}
                >
                  {u.role === 'ADMIN' ? '👑 Admin' : '👤 Team'} ({u.name.split(' ')[0]})
                </button>
              );
            })}
          </div>
        </div>

        {/* Current User Card */}
        {currentUser && (
          <div className="user-profile-widget">
            <img
              src={currentUser.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100'}
              alt={currentUser.name}
              className="user-avatar"
            />
            <div className="user-info">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role-badge">
                {currentUser.role === 'ADMIN' ? (
                  <span style={{ color: '#fbbf24', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <ShieldCheck size={11} /> Administrator
                  </span>
                ) : (
                  <span style={{ color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 3 }}>
                    <UserCheck size={11} /> Team Member
                  </span>
                )}
              </span>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
