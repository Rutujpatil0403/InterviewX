// src/utils/api.js
import axios from 'axios';
import { API_BASE_URL } from './constants';
import Cookies from 'js-cookie';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = Cookies.get('token') || localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth data and redirect to login
      Cookies.remove('token');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  register: (userData) => api.post('/users/register', userData),
  login: (credentials) => api.post('/users/login', credentials),
  logout: () => api.post('/users/logout'),
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data) => api.patch('/users/profile', data),
  changePassword: (data) => api.post('/users/change-password', data),
  verifyToken: () => api.get('/users/verify-token'),
};

// Users API calls
export const usersAPI = {
  getAllUsers: (params) => api.get('/users/all', { params }),
  getUserById: (id) => api.get(`/users/${id}`),
  deleteUser: (id) => api.delete(`/users/${id}`),
  getUserStatistics: () => api.get('/users/admin/statistics'),
};

// Interviews API calls
export const interviewsAPI = {
  createInterview: (data) => api.post('/interviews', data),
  getInterviews: (params) => api.get('/interviews', { params }),
  getInterviewById: (id) => api.get(`/interviews/${id}`),
  updateInterview: (id, data) => api.put(`/interviews/${id}`, data),
  deleteInterview: (id) => api.delete(`/interviews/${id}`),
  getMyInterviews: (params) => api.get('/interviews/my', { params }),
  startInterview: (id) => api.post(`/interviews/${id}/start`),
  endInterview: (id) => api.post(`/interviews/${id}/end`),
  joinInterview: (id) => api.post(`/interviews/${id}/join`),
  getInterviewStatistics: () => api.get('/interviews/statistics'),
};

// Templates API calls
export const templatesAPI = {
  createTemplate: (data) => api.post('/templates', data),
  getTemplates: (params) => api.get('/templates', { params }),
  getTemplateById: (id) => api.get(`/templates/${id}`),
  updateTemplate: (id, data) => api.put(`/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/templates/${id}`),
  getMyTemplates: (params) => api.get('/templates/my', { params }),
};

// Evaluations API calls
export const evaluationsAPI = {
  createEvaluation: (data) => api.post('/evaluations', data),
  getEvaluations: (params) => api.get('/evaluations', { params }),
  getEvaluationById: (id) => api.get(`/evaluations/${id}`),
  updateEvaluation: (id, data) => api.put(`/evaluations/${id}`, data),
  deleteEvaluation: (id) => api.delete(`/evaluations/${id}`),
  getMyEvaluations: (params) => api.get('/evaluations/my', { params }),
  getEvaluationsByInterview: (interviewId) => api.get(`/evaluations/interview/${interviewId}`),
};

// Feedback API calls
export const feedbackAPI = {
  createFeedback: (data) => api.post('/feedback', data),
  getFeedback: (params) => api.get('/feedback', { params }),
  getFeedbackById: (id) => api.get(`/feedback/${id}`),
  updateFeedback: (id, data) => api.put(`/feedback/${id}`, data),
  deleteFeedback: (id) => api.delete(`/feedback/${id}`),
  getMyFeedback: (params) => api.get('/feedback/my', { params }),
  getFeedbackByInterview: (interviewId) => api.get(`/feedback/interview/${interviewId}`),
};

// Analytics API calls
export const analyticsAPI = {
  getDashboardData: () => api.get('/analytics/dashboard'),
  getInterviewAnalytics: (params) => api.get('/analytics/interviews', { params }),
  getUserAnalytics: (params) => api.get('/analytics/users', { params }),
  getPerformanceMetrics: (params) => api.get('/analytics/performance', { params }),
  getReports: (params) => api.get('/analytics/reports', { params }),
};

export default api;
