// Interview Room API Services
import apiClient from './api';

export const interviewRoomAPI = {
  // Get interview room details
  getRoomDetails: async (roomId) => {
    const response = await apiClient.get(`/interviews/${roomId}`);
    return response.data;
  },

  // Join interview room
  joinRoom: async (roomId) => {
    const response = await apiClient.post(`/interviews/${roomId}/join`);
    return response.data;
  },

  // Leave interview room
  leaveRoom: async (roomId) => {
    const response = await apiClient.post(`/interviews/${roomId}/leave`);
    return response.data;
  },

  // Start interview
  startInterview: async (roomId) => {
    const response = await apiClient.post(`/interviews/${roomId}/start`);
    return response.data;
  },

  // End interview
  endInterview: async (roomId, data = {}) => {
    const response = await apiClient.post(`/interviews/${roomId}/end`, data);
    return response.data;
  },

  // Update interview status
  updateStatus: async (roomId, status) => {
    const response = await apiClient.patch(`/interviews/${roomId}/status`, { status });
    return response.data;
  },

  // Save interview notes
  saveNotes: async (roomId, notes) => {
    const response = await apiClient.post(`/interviews/${roomId}/notes`, { notes });
    return response.data;
  },

  // Get interview notes
  getNotes: async (roomId) => {
    const response = await apiClient.get(`/interviews/${roomId}/notes`);
    return response.data;
  },

  // Start recording
  startRecording: async (roomId) => {
    const response = await apiClient.post(`/interviews/${roomId}/recording/start`);
    return response.data;
  },

  // Stop recording
  stopRecording: async (roomId) => {
    const response = await apiClient.post(`/interviews/${roomId}/recording/stop`);
    return response.data;
  },

  // Get recording status
  getRecordingStatus: async (roomId) => {
    const response = await apiClient.get(`/interviews/${roomId}/recording/status`);
    return response.data;
  },

  // Get participants
  getParticipants: async (roomId) => {
    const response = await apiClient.get(`/interviews/${roomId}/participants`);
    return response.data;
  },

  // Send invitation
  sendInvitation: async (roomId, email) => {
    const response = await apiClient.post(`/interviews/${roomId}/invite`, { email });
    return response.data;
  }
};

export const chatRoomAPI = {
  // Create chat room for interview
  createChatRoom: async (interviewId) => {
    const response = await apiClient.post('/chat/rooms', {
      type: 'interview',
      interviewId,
      name: `Interview ${interviewId} Chat`
    });
    return response.data;
  },

  // Get chat room for interview
  getChatRoom: async (interviewId) => {
    const response = await apiClient.get(`/chat/rooms?interview=${interviewId}`);
    return response.data;
  },

  // Send message
  sendMessage: async (roomId, message) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/messages`, {
      content: message.content,
      type: message.type || 'text',
      metadata: message.metadata
    });
    return response.data;
  },

  // Get message history
  getMessageHistory: async (roomId, params = {}) => {
    const response = await apiClient.get(`/chat/rooms/${roomId}/messages`, { params });
    return response.data;
  },

  // Delete message
  deleteMessage: async (roomId, messageId) => {
    const response = await apiClient.delete(`/chat/rooms/${roomId}/messages/${messageId}`);
    return response.data;
  },

  // Edit message
  editMessage: async (roomId, messageId, content) => {
    const response = await apiClient.put(`/chat/rooms/${roomId}/messages/${messageId}`, {
      content
    });
    return response.data;
  },

  // Join chat room
  joinChatRoom: async (roomId) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/join`);
    return response.data;
  },

  // Leave chat room
  leaveChatRoom: async (roomId) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/leave`);
    return response.data;
  },

  // Get room participants
  getRoomParticipants: async (roomId) => {
    const response = await apiClient.get(`/chat/rooms/${roomId}/participants`);
    return response.data;
  }
};

export const mediaAPI = {
  // Upload avatar/profile picture
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await apiClient.post('/users/upload-avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Upload interview recording
  uploadRecording: async (roomId, file) => {
    const formData = new FormData();
    formData.append('recording', file);
    
    const response = await apiClient.post(`/interviews/${roomId}/recording/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Upload file attachment
  uploadAttachment: async (file, type = 'document') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);
    
    const response = await apiClient.post('/upload/attachment', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },

  // Get file download URL
  getDownloadUrl: async (fileId) => {
    const response = await apiClient.get(`/files/${fileId}/download`);
    return response.data;
  }
};

export const notificationAPI = {
  // Send notification
  sendNotification: async (data) => {
    const response = await apiClient.post('/notifications', data);
    return response.data;
  },

  // Get notifications
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Subscribe to push notifications
  subscribe: async (subscription) => {
    const response = await apiClient.post('/notifications/subscribe', subscription);
    return response.data;
  },

  // Unsubscribe from push notifications
  unsubscribe: async () => {
    const response = await apiClient.post('/notifications/unsubscribe');
    return response.data;
  }
};