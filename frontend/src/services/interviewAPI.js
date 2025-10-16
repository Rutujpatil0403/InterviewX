// Interview management API services
import apiClient from './api';

export const interviewAPI = {
  // Get all interviews with pagination and filters
  getInterviews: async (params = {}) => {
    const {
      page = 1,
      limit = 10,
      search = '',
      status = '',
      date = '',
      interviewer = '',
      candidate = ''
    } = params;
    const response = await apiClient.get('/interviews', {
      params: { page, limit, search, status, date, interviewer, candidate }
    });
    return response.data;
  },

  // Get interview by ID
  getInterviewById: async (id) => {
    const response = await apiClient.get(`/interviews/${id}`);
    console.log("Interview By ID:", response.data.data.interview);
    return response.data.data.interview;

  },

  // Get interview by User
  getInterviewByUser: async (userId, role) => {
    const response = await apiClient.get(`/interviews/user/${userId}/${role}`);
    console.log("Interview By ID:", response.data.data.interview);
    return response.data;

  },

  // Create new interview
  createInterview: async (interviewData) => {
    const response = await apiClient.post('/interviews', interviewData);
    return response.data;
  },

  // Update interview
  updateInterview: async (id, interviewData) => {
    const response = await apiClient.put(`/interviews/${id}`, interviewData);
    return response.data;
  },

  // Delete interview
  deleteInterview: async (id) => {
    const response = await apiClient.delete(`/interviews/${id}`);
    return response.data;
  },

  // Start interview (matches backend route)
  startInterview: async (id) => {
    console.log("Start Interview : ", id)
    const response = await apiClient.patch(`/interviews/${id}/start`);
    return response.data;
  },

  // End interview (matches backend route - was complete)
  endInterview: async (id) => {
    const response = await apiClient.patch(`/interviews/${id}/end`);
    return response.data;
  },

  // Get interview statistics by User (matches backend route)
  getInterviewStatisticsByUser: async (userId, role) => {
    const response = await apiClient.get(`/interviews/stats/user/${userId}/${role}`);
    return response.data;
  },

  // Get interview statistics (matches backend route)
  getInterviewStatistics: async (params = {}) => {
    const response = await apiClient.get('/interviews/statistics', { params });
    return response.data.data.statistics;
  },

  // Get interviews by date range (matches backend route)
  getInterviewsByDateRange: async (params = {}) => {
    const response = await apiClient.get('/interviews/date-range', { params });
    return response.data;
  },

  // ==================== ANSWER MANAGEMENT ====================

  // Submit an answer to an interview question
  submitAnswer: async (interviewId, answerData) => {
    const response = await apiClient.post(`/interviews/${interviewId}/answers`, answerData);
    return response.data;
  },

  // Update/edit an answer
  updateAnswer: async (interviewId, questionId, answerData) => {
    const response = await apiClient.put(`/interviews/${interviewId}/answers/${questionId}`, answerData);
    return response.data;
  },

  // Score an answer (Recruiters/Admins only)
  scoreAnswer: async (interviewId, questionId, scoreData) => {
    const response = await apiClient.put(`/interviews/${interviewId}/answers/${questionId}/score`, scoreData);
    return response.data;
  },

  // Get all answers for an interview
  getAnswers: async (interviewId) => {
    const response = await apiClient.get(`/interviews/${interviewId}/answers`);
    return response.data;
  },

  // Get interview completion statistics
  getCompletionStats: async (interviewId) => {
    const response = await apiClient.get(`/interviews/${interviewId}/completion`);
    return response.data;
  }
};