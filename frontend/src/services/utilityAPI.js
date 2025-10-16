// Upload and File Management API services
import apiClient from './api';

export const uploadAPI = {
  // Upload profile avatar
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiClient.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Upload interview recording
  uploadRecording: async (interviewId, file, onProgress) => {
    const formData = new FormData();
    formData.append('recording', file);
    formData.append('interviewId', interviewId);
    
    const response = await apiClient.post('/upload/recording', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    });
    return response.data;
  },

  // Upload document/attachment
  uploadDocument: async (file, category = 'documents') => {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('category', category);
    
    const response = await apiClient.post('/upload/document', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Upload multiple files
  uploadMultiple: async (files, category = 'documents', onProgress) => {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append(`files`, file);
    });
    formData.append('category', category);
    
    const response = await apiClient.post('/upload/multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: onProgress
    });
    return response.data;
  },

  // Get upload progress
  getUploadProgress: async (uploadId) => {
    const response = await apiClient.get(`/upload/progress/${uploadId}`);
    return response.data;
  },

  // Delete uploaded file
  deleteFile: async (fileId) => {
    const response = await apiClient.delete(`/upload/file/${fileId}`);
    return response.data;
  },

  // Get user files
  getUserFiles: async (params = {}) => {
    const { 
      page = 1, 
      limit = 20, 
      category, 
      fileType,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    const response = await apiClient.get('/upload/files', {
      params: { page, limit, category, fileType, sortBy, sortOrder }
    });
    return response.data;
  },

  // Get file metadata
  getFileMetadata: async (fileId) => {
    const response = await apiClient.get(`/upload/file/${fileId}/metadata`);
    return response.data;
  },

  // Generate signed URL for direct upload
  generateSignedUrl: async (filename, contentType, category = 'documents') => {
    const response = await apiClient.post('/upload/signed-url', {
      filename,
      contentType,
      category
    });
    return response.data;
  },

  // Process uploaded file
  processFile: async (fileId, processingOptions = {}) => {
    const response = await apiClient.post(`/upload/file/${fileId}/process`, processingOptions);
    return response.data;
  }
};

export const auditAPI = {
  // Get audit logs
  getAuditLogs: async (params = {}) => {
    const { 
      page = 1, 
      limit = 20, 
      userId, 
      action, 
      resource,
      startDate,
      endDate,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = params;
    
    const response = await apiClient.get('/audit/logs', {
      params: { page, limit, userId, action, resource, startDate, endDate, sortBy, sortOrder }
    });
    return response.data;
  },

  // Get audit log by ID
  getAuditLog: async (id) => {
    const response = await apiClient.get(`/audit/logs/${id}`);
    return response.data;
  },

  // Get user activity logs
  getUserActivity: async (userId, params = {}) => {
    const response = await apiClient.get(`/audit/user/${userId}/activity`, { params });
    return response.data;
  },

  // Get system activity summary
  getSystemActivity: async (params = {}) => {
    const response = await apiClient.get('/audit/system/activity', { params });
    return response.data;
  },

  // Get security events
  getSecurityEvents: async (params = {}) => {
    const response = await apiClient.get('/audit/security/events', { params });
    return response.data;
  },

  // Get login history
  getLoginHistory: async (userId, params = {}) => {
    const response = await apiClient.get(`/audit/user/${userId}/login-history`, { params });
    return response.data;
  },

  // Export audit logs
  exportAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/audit/logs/export', {
      params,
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'audit-logs-export.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  },

  // Create manual audit entry
  createAuditEntry: async (auditData) => {
    const response = await apiClient.post('/audit/logs', auditData);
    return response.data;
  },

  // Get audit statistics
  getAuditStats: async (params = {}) => {
    const response = await apiClient.get('/audit/stats', { params });
    return response.data;
  },

  // Configure audit settings
  updateAuditSettings: async (settings) => {
    const response = await apiClient.put('/audit/settings', settings);
    return response.data;
  },

  // Get audit settings
  getAuditSettings: async () => {
    const response = await apiClient.get('/audit/settings');
    return response.data;
  }
};