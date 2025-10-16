// User management API services
import apiClient from './api';

export const userAPI = {
  // Get all users with pagination and filters
  getUsers: async (params = {}) => {
    const { page = 1, limit = 10, search = '', role = '', status = '' } = params;
    const response = await apiClient.get('/users/all', {
      params: { page, limit, search, role, status }
    });
    return response.data;
  },

  // Search users (for candidate suggestions)
  searchUsers: async (params = {}) => {
    const { search = '', limit = 10, role = '' } = params;
    const response = await apiClient.get('/users/search', {
      params: { search, limit, role }
    });
    return response.data;
  },

  // Get user by ID
  getUserById: async (id) => {
    const response = await apiClient.get(`/users/${id}`);
    return response.data;
  },

  // Get current user profile
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  // Create new user
  createUser: async (userData) => {
    const response = await apiClient.post('/users', userData);
    return response.data;
  },

  // Update user
  updateUser: async (id, userData) => {
    const response = await apiClient.put(`/users/${id}`, userData);
    return response.data;
  },

  // Update user profile
  updateProfile: async (profileData) => {
    const response = await apiClient.patch('/users/profile', profileData);
    return response.data;
  },

  // Delete user
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  },

  // Activate/Deactivate user
  toggleUserStatus: async (id) => {
    const response = await apiClient.patch(`/users/${id}/toggle-status`);
    return response.data;
  },

  // Upload profile picture
  uploadProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    const response = await apiClient.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get user statistics
  getUserStats: async () => {
    const response = await apiClient.get('/users/stats');
    return response.data;
  },

  // Bulk operations
  bulkDeleteUsers: async (userIds) => {
    const response = await apiClient.delete('/users/bulk', {
      data: { userIds }
    });
    return response.data;
  },

  // Export users data
  exportUsers: async (format = 'csv') => {
    const response = await apiClient.get('/users/export', {
      params: { format },
      responseType: 'blob'
    });
    return response.data;
  }
};