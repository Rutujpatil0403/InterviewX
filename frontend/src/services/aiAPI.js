// AI Interview and Chat API services
import apiClient from './api';

export const aiInterviewAPI = {
  // Create AI interview from template
  createFromTemplate: async (templateData) => {
    const response = await apiClient.post('/ai-interviews/create-from-template', templateData);
    return response.data;
  },

  // Start AI interview session
  startAIInterview: async (interviewId, sessionData = {}) => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/start`, sessionData);
    return response.data;
  },

  // Get AI interview by ID
  getAIInterview: async (id) => {
    const response = await apiClient.get(`/ai-interviews/${id}`);
    return response.data;
  },

  // Ask next question (AI generates based on previous answers)
  askNextQuestion: async (interviewId, answerData = null, responseTime = 0) => {
    let payload;
    
    // Handle both old format (string) and new format (conversationLogEntry object)
    if (typeof answerData === 'string') {
      // Old format - convert to new format for backward compatibility
      payload = {
        previousAnswer: answerData,
        responseTime
      };
    } else if (answerData && typeof answerData === 'object') {
      // New format - send conversationLogEntry
      payload = {
        conversationLogEntry: answerData
      };
    } else {
      // No answer data
      payload = {};
    }
    
    console.log('aiAPI.askNextQuestion sending payload:', payload);
    
    const response = await apiClient.post(`/ai-interviews/${interviewId}/ask-question`, payload);
    return response.data;
  },

  // Analyze answer in real-time
  analyzeAnswer: async (interviewId, answer, questionId, responseTime = 0) => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/analyze`, {
      answer,
      questionId,
      responseTime,
      isPartial: false
    });
    return response.data;
  },

  // Get conversation insights
  getInsights: async (interviewId) => {
    const response = await apiClient.get(`/ai-interviews/${interviewId}/insights`);
    return response.data;
  },

  // Pause AI interview
  pauseAIInterview: async (interviewId, reason = 'user_requested') => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/pause`, { reason });
    return response.data;
  },

  // Resume AI interview
  resumeAIInterview: async (interviewId) => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/resume`);
    return response.data;
  },

  // End AI interview session
  endAIInterview: async (interviewId, reason = 'completed') => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/end`, { 
      reason,
      generateReport: true 
    });
    return response.data;
  },

  // Skip current question
  skipQuestion: async (interviewId, reason = 'candidate_request') => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/skip-question`, { reason });
    return response.data;
  },

  // Save questions and answers data
  saveQAData: async (interviewId, questionsAndAnswers) => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/save-qa`, { 
      questionsAndAnswers 
    });
    return response.data;
  },

  // Get interview summary
  getSummary: async (interviewId) => {
    const response = await apiClient.get(`/ai-interviews/${interviewId}/summary`);
    return response.data;
  },

  // Get AI feedback
  getFeedback: async (interviewId, feedbackType = 'comprehensive') => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/feedback`, { feedbackType });
    return response.data;
  },

  // Submit answer to AI interview
  submitAnswer: async (interviewId, questionId, answer) => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/answer`, {
      questionId,
      answer
    });
    return response.data;
  },

  // Get next question in AI interview
  getNextQuestion: async (interviewId) => {
    const response = await apiClient.get(`/ai-interviews/${interviewId}/next-question`);
    return response.data;
  },

  // Complete AI interview
  completeAIInterview: async (interviewId) => {
    const response = await apiClient.post(`/ai-interviews/${interviewId}/complete`);
    return response.data;
  },

  // Get AI interview results
  getAIResults: async (interviewId) => {
    const response = await apiClient.get(`/ai-interviews/${interviewId}/results`);
    return response.data;
  },

  // Get AI interview analytics
  getAIAnalytics: async (params = {}) => {
    const response = await apiClient.get('/ai-interviews/analytics', { params });
    return response.data;
  }
};

export const chatAPI = {
  // Get chat rooms for user
  getChatRooms: async () => {
    const response = await apiClient.get('/chat/rooms');
    return response.data;
  },

  // Get chat room by ID
  getChatRoom: async (roomId) => {
    const response = await apiClient.get(`/chat/rooms/${roomId}`);
    return response.data;
  },

  // Create new chat room
  createChatRoom: async (roomData) => {
    const response = await apiClient.post('/chat/rooms', roomData);
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

  // Get chat messages
  getMessages: async (roomId, params = {}) => {
    const { page = 1, limit = 50 } = params;
    const response = await apiClient.get(`/chat/rooms/${roomId}/messages`, {
      params: { page, limit }
    });
    return response.data;
  },

  // Send message
  sendMessage: async (roomId, messageData) => {
    const response = await apiClient.post(`/chat/rooms/${roomId}/messages`, messageData);
    return response.data;
  },

  // Mark messages as read
  markAsRead: async (roomId, messageIds) => {
    const response = await apiClient.patch(`/chat/rooms/${roomId}/read`, { messageIds });
    return response.data;
  },

  // Upload file to chat
  uploadFile: async (roomId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const response = await apiClient.post(`/chat/rooms/${roomId}/upload`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }
};

export const notificationAPI = {
  // Get user notifications
  getNotifications: async (params = {}) => {
    const { page = 1, limit = 20, unreadOnly = false } = params;
    const response = await apiClient.get('/notifications', {
      params: { page, limit, unreadOnly }
    });
    return response.data;
  },

  // Mark notification as read
  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  // Mark all notifications as read
  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/mark-all-read');
    return response.data;
  },

  // Delete notification
  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  // Get notification count
  getNotificationCount: async () => {
    const response = await apiClient.get('/notifications/count');
    return response.data;
  },

  // Update notification preferences
  updatePreferences: async (preferences) => {
    const response = await apiClient.put('/notifications/preferences', preferences);
    return response.data;
  },

  // Get notification preferences
  getPreferences: async () => {
    const response = await apiClient.get('/notifications/preferences');
    return response.data;
  },

  // Send custom notification
  sendNotification: async (notificationData) => {
    const response = await apiClient.post('/notifications/send', notificationData);
    return response.data;
  }
};