import { createContext, useContext, useState, useEffect } from 'react';
import api from '../utils/api';
import { initializeSocket, disconnectSocket } from '../utils/socket';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);

  useEffect(() => {
    // Initialize from sessionStorage (per-tab, not shared across tabs)
    if (typeof window !== 'undefined') {
      // Always prefer sessionStorage (per-tab session) - allows multiple accounts in different tabs
      const sessionToken = sessionStorage.getItem('token');
      const sessionUser = sessionStorage.getItem('user');
      
      if (sessionToken && sessionUser) {
        // SessionStorage has token - use it (this tab's session)
        setToken(sessionToken);
        try {
          const userData = JSON.parse(sessionUser);
          setUser(userData);
          // Initialize socket with session user
          initializeSocket(userData._id);
          // Verify token is still valid by loading user from API
          // This will update user data and re-initialize socket if needed
          loadUser();
        } catch (e) {
          // If session user is invalid, load from API
          setToken(sessionToken);
          loadUser();
        }
      } else {
        // No sessionStorage - check localStorage (for backward compatibility)
        const localToken = localStorage.getItem('token');
        if (localToken) {
          setToken(localToken);
          loadUser();
        } else {
          setLoading(false);
        }
      }
    } else {
      setLoading(false);
    }
  }, []);

  const loadUser = async () => {
    try {
      const response = await api.get('/api/auth/me');
      const userData = response.data;
      setUser(userData);
      
      // Update sessionStorage if we have a session token
      const sessionToken = sessionStorage.getItem('token');
      if (sessionToken) {
        sessionStorage.setItem('user', JSON.stringify(userData));
      }
      
      // Initialize socket connection (will reuse if same user)
      initializeSocket(userData._id);
    } catch (error) {
      logout();
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData) => {
    try {
      const response = await api.post('/api/auth/register', userData);
      const { token, ...user } = response.data;
      
      // Use ONLY sessionStorage for per-tab sessions (allows multiple accounts in different tabs)
      // Don't update localStorage to prevent conflicts between tabs
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      // Initialize socket connection
      initializeSocket(user._id);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  const login = async (credentials) => {
    try {
      const response = await api.post('/api/auth/login', credentials);
      const { token, ...user } = response.data;
      
      // Use ONLY sessionStorage for per-tab sessions (allows multiple accounts in different tabs)
      // Don't update localStorage to prevent conflicts between tabs
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('user', JSON.stringify(user));
      
      setToken(token);
      setUser(user);
      
      // Initialize socket connection
      initializeSocket(user._id);
      
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  const logout = async () => {
    try {
      await api.post('/api/auth/logout');
    } catch (error) {
      // Logout error
    } finally {
      // Clear both sessionStorage and localStorage
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      setToken(null);
      setUser(null);
      
      // Disconnect socket
      disconnectSocket();
    }
  };

  const updateAvatar = async (avatarUrl) => {
    try {
      const response = await api.put('/api/auth/avatar', { avatar: avatarUrl });
      setUser(response.data);
      // Update sessionStorage (primary storage)
      if (sessionStorage.getItem('token')) {
        sessionStorage.setItem('user', JSON.stringify(response.data));
      }
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        message: error.response?.data?.message || 'Failed to update avatar' 
      };
    }
  };

  const value = {
    user,
    loading,
    register,
    login,
    logout,
    updateAvatar,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
