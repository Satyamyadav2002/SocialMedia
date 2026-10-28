import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AppContext = createContext(null);

export const AppProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedBusinessId, setSelectedBusinessId] = useState('ALL');
  const [selectedBrandId, setSelectedBrandId] = useState('ALL');
  const [currentView, setCurrentView] = useState('dashboard');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  // Load initial session and business master data
  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Fetch or default to admin
      const meRes = await api.getMe().catch(() => null);
      if (meRes && meRes.user) {
        setCurrentUser(meRes.user);
      }

      // Fetch users
      const usersRes = await api.getUsers().catch(() => []);
      setAvailableUsers(usersRes);

      // Fetch businesses and brands
      const bizRes = await api.getBusinesses().catch(() => []);
      setBusinesses(bizRes);

      const brandsRes = await api.getBrands().catch(() => []);
      setBrands(brandsRes);

      // Fetch unread count
      const interactionsRes = await api.getInteractions({ readStatus: 'UNREAD' }).catch(() => ({ total: 0 }));
      setUnreadCount(interactionsRes.total || 0);

    } catch (err) {
      console.error('Failed to load initial app context:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Switch demo user (Admin <-> Team Member)
  const switchUser = async (userId) => {
    try {
      const res = await api.switchDemoUser(userId);
      localStorage.setItem('omni_token', res.token);
      setCurrentUser(res.user);
      showToast(`Switched active user to ${res.user.name} (${res.user.role})`);
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // Refresh counts
  const refreshStats = async () => {
    try {
      const res = await api.getInteractions({ readStatus: 'UNREAD' });
      setUnreadCount(res.total || 0);
    } catch (e) {
      // quiet fail
    }
  };

  // Filtered brands for current business selection
  const filteredBrands = selectedBusinessId === 'ALL'
    ? brands
    : brands.filter(b => b.businessId === selectedBusinessId);

  // If business changes, ensure selectedBrandId is valid
  const handleBusinessChange = (bizId) => {
    setSelectedBusinessId(bizId);
    setSelectedBrandId('ALL');
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        availableUsers,
        switchUser,
        businesses,
        brands,
        filteredBrands,
        selectedBusinessId,
        setSelectedBusinessId: handleBusinessChange,
        selectedBrandId,
        setSelectedBrandId,
        currentView,
        setCurrentView,
        unreadCount,
        refreshStats,
        loadInitialData,
        showToast,
        toast,
        loading
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
