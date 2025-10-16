// Frontend useAPI.js In hooks



// Custom hooks for API integration
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  authAPI,
  userAPI,
  interviewAPI,
  templateAPI,
  analyticsAPI,
  notificationAPI,
  uploadAPI
} from '../services';
import { aiInterviewAPI } from '../services/aiAPI';
import { settingsAPI } from '../services/settingsAPI';
import toast from 'react-hot-toast';

// Auth hooks
export const useLogin = () => {
  return useMutation({
    mutationFn: authAPI.login,
    onSuccess: () => {
      toast.success('Logged in successfully');
      // Store token and redirect handled by AuthContext
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Login failed');
    }
  });
};

export const useRegister = () => {
  return useMutation({
    mutationFn: authAPI.register,
    onSuccess: () => {
      toast.success('Account created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Registration failed');
    }
  });
};

export const useVerifyToken = () => {
  return useQuery({
    queryKey: ['auth', 'verify'],
    queryFn: authAPI.verifyToken,
    retry: false,
    staleTime: 5 * 60 * 1000 // 5 minutes
  });
};

// User hooks
export const useUsers = (params = {}) => {
  return useQuery({
    queryKey: ['users', params],
    queryFn: () => userAPI.getUsers(params),
    keepPreviousData: true
  });
};

export const useUser = (userId) => {
  return useQuery({
    queryKey: ['users', userId],
    queryFn: () => userAPI.getUser(userId),
    enabled: !!userId
  });
};

export const useUpdateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, userData }) => userAPI.updateUser(id, userData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['users']);
      queryClient.setQueryData(['users', data.id], data);
      toast.success('User updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userAPI.createUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Creation failed');
    }
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: userAPI.deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      toast.success('User deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Deletion failed');
    }
  });
};

// Interview hooks
export const useInterviews = (params = {}) => {
  return useQuery({
    queryKey: ['interviews', params],
    queryFn: () => interviewAPI.getInterviews(params),
    keepPreviousData: true
  });
};

export const useInterview = (interviewId) => {
  return useQuery({
    queryKey: ['interviews', interviewId],
    queryFn: () => interviewAPI.getInterviewById(interviewId),
    enabled: !!interviewId
  });
};

export const useCreateInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: interviewAPI.createInterview,
    onSuccess: () => {
      queryClient.invalidateQueries(['interviews']);
      toast.success('Interview scheduled successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Scheduling failed');
    }
  });
};

export const useUpdateInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, interviewData }) => interviewAPI.updateInterview(id, interviewData),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['interviews']);
      queryClient.setQueryData(['interviews', data.id], data);
      toast.success('Interview updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Update failed');
    }
  });
};

export const useStartInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: interviewAPI.startInterview,
    onSuccess: (data) => {
      queryClient.setQueryData(['interviews', data.id], data);
      toast.success('Interview started');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start interview');
    }
  });
};

export const useDeleteInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: interviewAPI.deleteInterview,
    onSuccess: () => {
      queryClient.invalidateQueries(['interviews']);
      toast.success('Interview deleted successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete interview');
    }
  });
};

// Note: Cancel interview functionality not implemented in backend
export const useCancelInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, reason }) => interviewAPI.cancelInterview(id, reason),
    onSuccess: (data) => {
      queryClient.invalidateQueries(['interviews']);
      queryClient.setQueryData(['interviews', data.id], data);
      toast.success('Interview cancelled');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to cancel interview');
    }
  });
};

export const useInterviewStats = (params = {}) => {
  return useQuery({
    queryKey: ['interviews', 'statistics', params],
    queryFn: () => interviewAPI.getInterviewStatistics(params),
    keepPreviousData: true
  });
};

// AI Interview hooks
export const useCreateAIInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: aiInterviewAPI.createFromTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries(['interviews']);
      queryClient.invalidateQueries(['ai-interviews']);
      toast.success('AI Interview created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to create AI interview');
    }
  });
};

export const useStartAIInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (interviewData) => aiInterviewAPI.startAIInterview(interviewData),
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-interviews', data.id], data);
      toast.success('AI Interview started');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start AI interview');
    }
  });
};

export const useAIInterview = (interviewId) => {
  return useQuery({
    queryKey: ['ai-interviews', interviewId],
    queryFn: () => aiInterviewAPI.getAIInterview(interviewId),
    enabled: !!interviewId,
    refetchInterval: 5000 // Auto-refresh for real-time updates
  });
};

export const useSubmitAIAnswer = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ interviewId, questionId, answer }) => 
      aiInterviewAPI.submitAnswer(interviewId, questionId, answer),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['ai-interviews', variables.interviewId], data);
      queryClient.invalidateQueries(['ai-interviews', variables.interviewId]);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to submit answer');
    }
  });
};

export const useCompleteAIInterview = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: aiInterviewAPI.completeAIInterview,
    onSuccess: (data) => {
      queryClient.setQueryData(['ai-interviews', data.id], data);
      queryClient.invalidateQueries(['interviews']);
      toast.success('AI Interview completed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to complete AI interview');
    }
  });
};

// Template hooks
export const useTemplates = (params = {}) => {
  return useQuery({
    queryKey: ['templates', params],
    queryFn: () => templateAPI.getTemplates(params),
    keepPreviousData: true
  });
};

export const useTemplate = (templateId) => {
  return useQuery({
    queryKey: ['templates', templateId],
    queryFn: () => templateAPI.getTemplateById(templateId),
    enabled: !!templateId
  });
};

export const useCreateTemplate = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: templateAPI.createTemplate,
    onSuccess: () => {
      queryClient.invalidateQueries(['templates']);
      toast.success('Template created successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Creation failed');
    }
  });
};

// Analytics hooks
export const useDashboardStats = () => {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: () => analyticsAPI.getDashboardStats(),
    refetchInterval: 30000, // Refetch every 30 seconds
    retry: (failureCount, error) => {
      // Don't retry on auth errors
      if (error?.response?.status === 401 || error?.response?.status === 403) {
        return false;
      }
      return failureCount < 3;
    },
    // Return mock data on error for development
    onError: (error) => {
      if (error?.response?.status === 401) {
        console.log('Dashboard stats: Authentication required');
      }
    }
  });
};

export const useInterviewAnalytics = (params = {}) => {
  return useQuery({
    queryKey: ['analytics', 'interviews', params],
    queryFn: () => analyticsAPI.getInterviewAnalytics(params),
    keepPreviousData: true
  });
};

// Notification hooks
export const useNotifications = (params = {}) => {
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationAPI.getNotifications(params),
    refetchInterval: 60000 // Refetch every minute
  });
};

export const useNotificationCount = () => {
  return useQuery({
    queryKey: ['notifications', 'count'],
    queryFn: notificationAPI.getNotificationCount,
    refetchInterval: 30000 // Refetch every 30 seconds
  });
};

export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: notificationAPI.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });
};

// Upload hooks
export const useUploadFile = () => {
  const [uploadProgress, setUploadProgress] = useState(0);
  
  const mutation = useMutation({
    mutationFn: ({ file, category }) => 
      uploadAPI.uploadDocument(file, category, (progressEvent) => {
        const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        setUploadProgress(progress);
      }),
    onSuccess: () => {
      toast.success('File uploaded successfully');
      setUploadProgress(0);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Upload failed');
      setUploadProgress(0);
    }
  });

  return {
    ...mutation,
    uploadProgress
  };
};

// Custom hook for real-time updates
export const useRealTimeUpdates = (entityType, entityId) => {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    // This would integrate with Socket.io for real-time updates
    // For now, we'll use polling as a fallback
    const interval = setInterval(() => {
      queryClient.invalidateQueries([entityType, entityId]);
    }, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, [queryClient, entityType, entityId]);
};

// Optimistic updates hook
export const useOptimisticUpdate = (queryKey, updateFn) => {
  const queryClient = useQueryClient();
  
  return {
    updateOptimistically: (newData) => {
      queryClient.setQueryData(queryKey, (oldData) => {
        return updateFn(oldData, newData);
      });
    },
    revert: () => {
      queryClient.invalidateQueries(queryKey);
    }
  };
};

// ==================== SETTINGS HOOKS ====================

// Profile settings hooks
export const useProfile = () => {
  return useQuery({
    queryKey: ['profile'],
    queryFn: settingsAPI.getProfile,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateProfile = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsAPI.updateProfile,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      queryClient.invalidateQueries(['auth']);
      toast.success('Profile updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    }
  });
};

export const useUploadAvatar = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsAPI.uploadAvatar,
    onSuccess: (data) => {
      queryClient.setQueryData(['profile'], data);
      queryClient.invalidateQueries(['auth']);
      toast.success('Avatar updated successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to upload avatar');
    }
  });
};

// Security settings hooks
export const useChangePassword = () => {
  return useMutation({
    mutationFn: ({ oldPassword, newPassword }) => 
      settingsAPI.changePassword(oldPassword, newPassword),
    onSuccess: () => {
      toast.success('Password changed successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to change password');
    }
  });
};

// Notification settings hooks
export const useNotificationPreferences = () => {
  return useQuery({
    queryKey: ['notification-preferences'],
    queryFn: settingsAPI.getNotificationPreferences,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdateNotificationPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsAPI.updateNotificationPreferences,
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-preferences']);
      toast.success('Notification preferences updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update preferences');
    }
  });
};

// User preferences hooks (localStorage-based)
export const useUserPreferences = () => {
  return useQuery({
    queryKey: ['user-preferences'],
    queryFn: settingsAPI.getUserPreferences,
    staleTime: Infinity, // Never goes stale since it's localStorage
  });
};

export const useUpdateUserPreferences = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsAPI.updateUserPreferences,
    onSuccess: (data) => {
      queryClient.setQueryData(['user-preferences'], data);
      toast.success('Preferences saved');
    },
    onError: () => {
      toast.error('Failed to save preferences');
    }
  });
};

// System settings hooks (Admin only)
export const useSystemSettings = () => {
  return useQuery({
    queryKey: ['system-settings'],
    queryFn: settingsAPI.getSystemSettings,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUpdateSystemSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsAPI.updateSystemSettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['system-settings']);
      toast.success('System settings updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update system settings');
    }
  });
};

// Privacy settings hooks
export const usePrivacySettings = () => {
  return useQuery({
    queryKey: ['privacy-settings'],
    queryFn: settingsAPI.getPrivacySettings,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

export const useUpdatePrivacySettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsAPI.updatePrivacySettings,
    onSuccess: () => {
      queryClient.invalidateQueries(['privacy-settings']);
      toast.success('Privacy settings updated');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update privacy settings');
    }
  });
};

// Settings utility hooks
export const useResetSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: settingsAPI.resetToDefaults,
    onSuccess: () => {
      // Invalidate all settings-related queries
      queryClient.invalidateQueries(['notification-preferences']);
      queryClient.invalidateQueries(['user-preferences']);
      queryClient.invalidateQueries(['privacy-settings']);
      toast.success('All settings reset to defaults');
    },
    onError: () => {
      toast.error('Failed to reset settings');
    }
  });
};