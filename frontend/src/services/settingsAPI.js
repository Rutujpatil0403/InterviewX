// Settings management API services
import apiClient from './api';

export const settingsAPI = {
  // ==================== USER PROFILE SETTINGS ====================
  
  // Get user profile
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // Update user profile (matches backend route with file upload support)
  updateProfile: async (profileData) => {
    const formData = new FormData();
    
    // Add text fields to form data
    Object.keys(profileData).forEach(key => {
      if (profileData[key] !== null && profileData[key] !== undefined && key !== 'profilePicture') {
        formData.append(key, profileData[key]);
      }
    });

    // Add profile picture if provided
    if (profileData.profilePicture && profileData.profilePicture instanceof File) {
      formData.append('profilePicture', profileData.profilePicture);
    }

    const response = await apiClient.patch('/users/profile', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Upload avatar (matches backend route)
  uploadAvatar: async (imageFile) => {
    const formData = new FormData();
    formData.append('avatar', imageFile);
    
    const response = await apiClient.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // ==================== SECURITY SETTINGS ====================
  
  // Change password (matches backend route)
  changePassword: async (oldPassword, newPassword) => {
    const response = await apiClient.post('/users/change-password', {
      oldPassword,
      newPassword
    });
    return response.data;
  },

  // ==================== NOTIFICATION PREFERENCES ====================
  
  // Get notification preferences (part of user profile)
  getNotificationPreferences: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data.data.user?.notificationPreferences || {};
  },

  // Update notification preferences
  updateNotificationPreferences: async (preferences) => {
    const response = await apiClient.patch('/users/profile', {
      notificationPreferences: preferences
    });
    return response.data;
  },

  // Update specific notification category
  updateNotificationCategory: async (category, settings) => {
    const currentPrefs = await settingsAPI.getNotificationPreferences();
    const updatedPrefs = {
      ...currentPrefs,
      [category]: {
        ...currentPrefs[category],
        ...settings
      }
    };
    
    return await settingsAPI.updateNotificationPreferences(updatedPrefs);
  },

  // ==================== SYSTEM SETTINGS (Admin Only) ====================
  
  // Get system settings (if backend route exists)
  getSystemSettings: async () => {
    try {
      const response = await apiClient.get('/settings/system');
      return response.data;
    } catch (error) {
      // Fallback if system settings endpoint doesn't exist
      return {
        maintenance: false,
        registrationEnabled: true,
        emailNotifications: true,
        maxFileSize: '10MB',
        sessionTimeout: '24h'
      };
    }
  },

  // Update system settings (if backend route exists)
  updateSystemSettings: async (settings) => {
    try {
      const response = await apiClient.patch('/settings/system', settings);
      return response.data;
    } catch (error) {
      throw new Error('System settings update not available');
    }
  },

  // ==================== APPEARANCE & PREFERENCES ====================
  
  // Get user preferences (stored in localStorage for now)
  getUserPreferences: () => {
    const prefs = localStorage.getItem('userPreferences');
    return prefs ? JSON.parse(prefs) : {
      theme: 'light',
      language: 'en',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      dateFormat: 'MM/dd/yyyy',
      timeFormat: '12h',
      pageSize: 10,
      autoSave: true,
      compactMode: false
    };
  },

  // Update user preferences (stored in localStorage for now)
  updateUserPreferences: (preferences) => {
    const currentPrefs = settingsAPI.getUserPreferences();
    const updatedPrefs = { ...currentPrefs, ...preferences };
    localStorage.setItem('userPreferences', JSON.stringify(updatedPrefs));
    return Promise.resolve(updatedPrefs);
  },

  // ==================== PRIVACY SETTINGS ====================
  
  // Get privacy settings (part of user profile or separate endpoint)
  getPrivacySettings: async () => {
    try {
      const response = await apiClient.get('/users/privacy');
      return response.data;
    } catch (error) {
      // Fallback privacy settings
      return {
        profileVisibility: 'public',
        showEmail: false,
        showPhone: false,
        allowDirectMessages: true,
        dataCollection: true,
        analytics: true
      };
    }
  },

  // Update privacy settings
  updatePrivacySettings: async (privacyData) => {
    try {
      const response = await apiClient.patch('/users/privacy', privacyData);
      return response.data;
    } catch (error) {
      // Store in localStorage as fallback
      localStorage.setItem('privacySettings', JSON.stringify(privacyData));
      return Promise.resolve(privacyData);
    }
  },

  // ==================== EXPORT & IMPORT ====================
  
  // Export user data
  exportUserData: async () => {
    try {
      const response = await apiClient.get('/users/export', {
        responseType: 'blob'
      });
      return response.data;
    } catch (error) {
      throw new Error('Data export not available');
    }
  },

  // Delete user account
  deleteAccount: async (password) => {
    const response = await apiClient.delete('/users/account', {
      data: { password }
    });
    return response.data;
  },

  // ==================== HELPER METHODS ====================
  
  // Reset all settings to defaults
  resetToDefaults: async () => {
    // Clear localStorage settings
    localStorage.removeItem('userPreferences');
    localStorage.removeItem('privacySettings');
    
    // Reset server-side notification preferences
    const defaultNotifications = {
      email: {
        interviewReminders: true,
        evaluationAlerts: true,
        systemNotifications: true,
        weeklyDigest: false
      },
      push: {
        interviewReminders: true,
        evaluationAlerts: true,
        systemNotifications: false,
        instantMessages: true
      },
      categories: {
        interview: true,
        evaluation: true,
        system: true,
        general: true,
        security: true
      },
      frequency: {
        immediate: true,
        digest: false,
        weekly: false
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      }
    };
    
    await settingsAPI.updateNotificationPreferences(defaultNotifications);
    
    return {
      message: 'All settings reset to defaults',
      preferences: settingsAPI.getUserPreferences(),
      notifications: defaultNotifications
    };
  }
};
