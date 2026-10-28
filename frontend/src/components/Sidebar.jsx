import React from 'react';
import { useApp } from '../context/AppContext';
import {
  LayoutDashboard,
  Inbox,
  Sparkles,
  CalendarDays,
  Building,
  BarChart3,
  ShieldAlert,
  Settings,
  Bot
} from 'lucide-react';

export const Sidebar = () => {
  const { currentView, setCurrentView, unreadCount, currentUser } = useApp();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'inbox', label: 'Unified Inbox', icon: Inbox, badge: unreadCount > 0 ? unreadCount : null },
    { id: 'studio', label: 'AI Content Studio', icon: Sparkles },
    { id: 'calendar', label: 'Content Calendar', icon: CalendarDays },
    { id: 'brands', label: 'Businesses & Brands', icon: Building },
    { id: 'analytics', label: 'Analytics & Reports', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: ShieldAlert },
    { id: 'settings', label: 'Settings & Admin', icon: Settings, adminOnly: false }
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand-header">
        <div className="brand-logo-icon">
          <Bot size={22} color="#ffffff" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="brand-title">OmniSocial</span>
            <span className="brand-badge">AI</span>
          </div>
          <span style={{ fontSize: '0.68rem', color: '#64748b', fontWeight: 500 }}>
            Multi-Brand Operations
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="sidebar-nav-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;

          return (
            <button
              key={item.id}
              className={`nav-item ${isActive ? 'active' : ''}`}
              onClick={() => setCurrentView(item.id)}
            >
              <Icon size={18} />
              <span style={{ flex: 1, textAlign: 'left' }}>{item.label}</span>
              {item.badge && (
                <span
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    fontSize: '0.7rem',
                    fontWeight: 700,
                    padding: '2px 7px',
                    borderRadius: '12px',
                    minWidth: '18px',
                    textAlign: 'center'
                  }}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer Info */}
      <div className="sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '0.72rem', color: '#cbd5e1', fontWeight: 600 }}>Internal Operations</span>
            <span style={{ fontSize: '0.65rem', color: '#64748b' }}>FB & IG API v21.0</span>
          </div>
          <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#10b981' }} />
        </div>
      </div>
    </aside>
  );
};
