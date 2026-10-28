import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './views/DashboardView';
import { InboxView } from './views/InboxView';
import { ContentStudioView } from './views/ContentStudioView';
import { CalendarView } from './views/CalendarView';
import { BrandsView } from './views/BrandsView';
import { AnalyticsView } from './views/AnalyticsView';
import { AuditView } from './views/AuditView';
import { SettingsView } from './views/SettingsView';
import { CheckCircle2, AlertCircle } from 'lucide-react';

const MainLayout = () => {
  const { currentView, toast } = useApp();

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView />;
      case 'inbox':
        return <InboxView />;
      case 'studio':
        return <ContentStudioView />;
      case 'calendar':
        return <CalendarView />;
      case 'brands':
        return <BrandsView />;
      case 'analytics':
        return <AnalyticsView />;
      case 'audit':
        return <AuditView />;
      case 'settings':
        return <SettingsView />;
      default:
        return <DashboardView />;
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="main-content-area">
        {/* Top Navbar */}
        <Navbar />

        {/* Dynamic View Body */}
        <main style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          {renderView()}
        </main>

        {/* Global Toast Notification */}
        {toast && (
          <div style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: toast.type === 'error' ? '#ef4444' : '#10b981',
            color: '#ffffff',
            padding: '12px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '0.885rem',
            fontWeight: 600,
            zIndex: 999,
            animation: 'fadeIn 200ms ease'
          }}>
            {toast.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
            {toast.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
