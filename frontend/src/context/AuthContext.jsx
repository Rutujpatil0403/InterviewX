// src/context/AuthContext.jsx
import React, { createContext, useReducer, useEffect } from 'react';
import { authAPI } from '../services';
import Cookies from 'js-cookie';
import toast from 'react-hot-toast';

const AuthContext = createContext();

const authReducer = (state, action) => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_USER':
      return { ...state, user: action.payload, isAuthenticated: !!action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'LOGOUT':
      return { user: null, isAuthenticated: false, loading: false, error: null };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, {
    user: null,
    isAuthenticated: false,
    loading: true,
    error: null,
  });

  // Check if user is authenticated on app load
  useEffect(() => {
    const initializeAuth = async () => {
      const token = Cookies.get('token') || localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (token && savedUser) {
        try {
          const user = JSON.parse(savedUser);
          dispatch({ type: 'SET_USER', payload: user });
          
          // Verify token is still valid
          await authAPI.verifyToken();
        } catch (error) {
          console.error('Token verification failed:', error);
          logout();
        }
      }
      
      dispatch({ type: 'SET_LOADING', payload: false });
    };

    initializeAuth();
  }, []);

  const login = async (credentials) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      // Real API login
      const response = await authAPI.login(credentials);
      const { token, user } = response.data.data;
      
      // Store token and user data
      Cookies.set('token', token, { expires: 7 });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      
      dispatch({ type: 'SET_USER', payload: user });
      toast.success('Login successful!');
      
      return { success: true };
      
    } catch (error) {
      const message = error.response?.data?.message || 'Login failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const register = async (userData) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });

      const response = await authAPI.register(userData);
      const { token, user } = response.data.data;

      // Store token and user data
      Cookies.set('token', token, { expires: 7 });
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));

      dispatch({ type: 'SET_USER', payload: user });
      toast.success('Registration successful!');
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Registration failed';
      dispatch({ type: 'SET_ERROR', payload: message });
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all auth data
      Cookies.remove('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      dispatch({ type: 'LOGOUT' });
      toast.success('Logged out successfully');
    }
  };

  const updateProfile = async (data) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      const response = await authAPI.updateProfile(data);
      const updatedUser = response.data.user;
      
      localStorage.setItem('user', JSON.stringify(updatedUser));
      dispatch({ type: 'SET_USER', payload: updatedUser });
      toast.success('Profile updated successfully');
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Profile update failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const changePassword = async (data) => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      
      await authAPI.changePassword(data);
      toast.success('Password changed successfully');
      
      return { success: true };
    } catch (error) {
      const message = error.response?.data?.message || 'Password change failed';
      toast.error(message);
      return { success: false, error: message };
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const value = {
    ...state,
    login,
    register,
    logout,
    updateProfile,
    changePassword,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
