// Authentication API services
import apiClient from './api';

export const authAPI = {
    // Login user
    login: async (credentials) => {
        const response = await apiClient.post('/users/login', credentials);
        return response;
    },

    // Register user
    register: async (userData) => {
        console.log('🔵 authAPI.register called with:', userData);
        const response = await apiClient.post('/users/register', userData);
        console.log('🟢 authAPI.register response:', response);
        return response; // Changed from response.data to response
    },

    // Verify token (matches backend route)
    verifyToken: async () => {
        const response = await apiClient.get('/users/verify-token');
        return response.data;
    },

    // Refresh token
    refreshToken: async () => {
        const response = await apiClient.post('/users/refresh');
        return response.data;
    },

    // Logout user
    logout: async () => {
        const response = await apiClient.post('/users/logout');
        return response.data;
    },

    // Forgot password
    forgotPassword: async (email) => {
        const response = await apiClient.post('/users/forgot-password', { email });
        return response.data;
    },

    // Reset password
    resetPassword: async (token, password) => {
        const response = await apiClient.post('/users/reset-password', { token, password });
        return response.data;
    },

    // Change password (matches backend route - POST method)
    changePassword: async (oldPassword, newPassword) => {
        const response = await apiClient.post('/users/change-password', {
            oldPassword,
            newPassword
        });
        return response.data;
    },

    // Get user profile (matches backend route)
    getProfile: async () => {
        const response = await apiClient.get('/users/profile');
        return response.data;
    },

    // Update user profile (matches backend route)
    updateProfile: async (profileData) => {
        const formData = new FormData();
        
        // Add text fields to form data
        Object.keys(profileData).forEach(key => {
            if (profileData[key] !== null && profileData[key] !== undefined) {
                formData.append(key, profileData[key]);
            }
        });

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

    // Get user by ID (matches backend route)
    getUserById: async (userId) => {
        const response = await apiClient.get(`/users/${userId}`);
        return response.data;
    },

    // Admin: Get all users (matches backend route)
    getAllUsers: async () => {
        const response = await apiClient.get('/users/all');
        return response.data;
    },

    // Admin: Delete user (matches backend route)
    deleteUser: async (userId) => {
        const response = await apiClient.delete(`/users/${userId}`);
        return response.data;
    },

    // Admin: Get user statistics (matches backend route)
    getUserStatistics: async () => {
        const response = await apiClient.get('/users/admin/statistics');
        return response.data;
    }
};