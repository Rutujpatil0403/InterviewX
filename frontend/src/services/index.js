// Central export file for all API services
import { authAPI } from './authAPI';
import { userAPI } from './userAPI';
import { interviewAPI } from './interviewAPI';
import { templateAPI } from './templateAPI';
import { analyticsAPI } from './analyticsAPI';
import { aiInterviewAPI, chatAPI, notificationAPI } from './aiAPI';
import { feedbackAPI, evaluationAPI } from './evaluationAPI';
import { uploadAPI, auditAPI } from './utilityAPI';
import socketService from './socketService';
import apiClient from './api';

// Re-export all services
export { 
  authAPI,
  userAPI,
  interviewAPI,
  templateAPI,
  analyticsAPI,
  aiInterviewAPI,
  chatAPI,
  notificationAPI,
  feedbackAPI,
  evaluationAPI,
  uploadAPI,
  auditAPI,
  socketService,
  apiClient
};

// Combined API object for easy access
export const API = {
  auth: authAPI,
  users: userAPI,
  interviews: interviewAPI,
  templates: templateAPI,
  analytics: analyticsAPI,
  aiInterviews: aiInterviewAPI,
  chat: chatAPI,
  notifications: notificationAPI,
  feedback: feedbackAPI,
  evaluations: evaluationAPI,
  upload: uploadAPI,
  audit: auditAPI,
  socket: socketService
};