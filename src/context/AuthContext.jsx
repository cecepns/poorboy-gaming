import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState({
    isVisible: false,
    type: 'info',
    message: ''
  });

  // Set up axios defaults
  // const API_BASE_URL = 'http://localhost:5000/api';
  const API_BASE_URL = 'https://api-inventory.isavralabel.com/api/poorboygaming';
  axios.defaults.baseURL = API_BASE_URL;

  // Show notification function
  const showNotification = (type, message, duration = 5000) => {
    setNotification({
      isVisible: true,
      type,
      message
    });
    
    if (duration > 0) {
      setTimeout(() => {
        setNotification(prev => ({ ...prev, isVisible: false }));
      }, duration);
    }
  };

  // Close notification function
  const closeNotification = () => {
    setNotification(prev => ({ ...prev, isVisible: false }));
  };

  // Validate token by making a test API call
  const validateToken = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return false;
      
      // Make a simple API call to validate token
      await axios.get('/auth/validate');
      return true;
    } catch (error) {
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
        return false;
      }
      // For other errors, assume token is still valid
      return true;
    }
  };

  // Periodic token validation
  useEffect(() => {
    if (!user) return;

    const validateTokenPeriodically = async () => {
      const isValid = await validateToken();
      if (!isValid) {
        showNotification('warning', 'Sesi Anda telah berakhir. Silakan login kembali.', 3000);
        logout();
        setTimeout(() => {
          window.location.href = '/login';
        }, 1000);
      }
    };

    // Check token every 5 minutes
    const interval = setInterval(validateTokenPeriodically, 5 * 60 * 1000);

    return () => clearInterval(interval);
  }, [user]);

  // Axios request interceptor to add token to all requests
  useEffect(() => {
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        const token = localStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Axios response interceptor to handle token expiration
    const responseInterceptor = axios.interceptors.response.use(
      (response) => {
        return response;
      },
      (error) => {
        // If we get 401 (Unauthorized) or 403 (Forbidden), token is likely expired
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Only logout if we have a user (to avoid infinite loops during login)
          if (user) {
            showNotification('warning', 'Sesi Anda telah berakhir. Silakan login kembali.', 3000);
            logout();
            // Redirect to login page after a short delay
            setTimeout(() => {
              window.location.href = '/login';
            }, 1000);
          }
        }
        return Promise.reject(error);
      }
    );

    // Cleanup interceptors on unmount
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, [user]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Verify token validity by checking user data
      const userData = localStorage.getItem('user');
      if (userData) {
        try {
          const parsedUser = JSON.parse(userData);
          // Check if subscription is still valid for users
          if (parsedUser.role === 'user' && parsedUser.subscription_expiry) {
            if (new Date(parsedUser.subscription_expiry) <= new Date()) {
              // Subscription expired
              showNotification('error', 'Berlangganan Anda telah berakhir. Silakan perpanjang berlangganan.', 3000);
              logout();
              setLoading(false);
              return;
            }
          }
          setUser(parsedUser);
        } catch (error) {
          logout();
        }
      }
    }
    setLoading(false);
  }, []);

  const login = async (username, password) => {
    try {
      const response = await axios.post('/auth/login', { username, password });
      const { token, user: userData } = response.data;
      
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      setUser(userData);
      showNotification('success', 'Login berhasil!', 2000);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Login failed' 
      };
    }
  };

  const register = async (userData) => {
    try {
      await axios.post('/auth/register', userData);
      showNotification('success', 'Registrasi berhasil! Silakan login.', 3000);
      return { success: true };
    } catch (error) {
      return { 
        success: false, 
        error: error.response?.data?.error || 'Registration failed' 
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete axios.defaults.headers.common['Authorization'];
    setUser(null);
  };

  const value = {
    user,
    login,
    register,
    logout,
    loading,
    notification,
    showNotification,
    closeNotification,
    validateToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};