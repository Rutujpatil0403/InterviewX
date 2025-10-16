// Analytics and reporting API services
import apiClient from './api';

export const analyticsAPI = {
  // Get dashboard overview statistics
  getDashboardStats: async (timeRange = '30') => {
    const response = await apiClient.get('/analytics/dashboard', {
      params: { period: parseInt(timeRange) }
    });
    return response.data;
  },

  // Get interview analytics
  getInterviewAnalytics: async (params = {}) => {
    const { 
      startDate, 
      endDate, 
      department = '', 
      position = '',
      interviewer = '' 
    } = params;
    const response = await apiClient.get('/analytics/interviews', {
      params: { startDate, endDate, department, position, interviewer }
    });
    return response.data;
  },

  // Get user performance analytics
  getUserAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics/users', { params });
    return response.data;
  },

  // Get template usage analytics
  getTemplateAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics/templates', { params });
    return response.data;
  },

  // Get hiring funnel data
  getHiringFunnel: async (params = {}) => {
    const response = await apiClient.get('/analytics/funnel', { params });
    return response.data;
  },

  // Get success rate trends
  getSuccessRateTrends: async (params = {}) => {
    const response = await apiClient.get('/analytics/success-rate', { params });
    return response.data;
  },

  // Get interview duration analytics
  getDurationAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics/duration', { params });
    return response.data;
  },

  // Get candidate feedback analytics
  getFeedbackAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics/feedback', { params });
    return response.data;
  },

  // Get interviewer performance
  getInterviewerPerformance: async (params = {}) => {
    const response = await apiClient.get('/analytics/interviewer-performance', { params });
    return response.data;
  },

  // Get department wise analytics
  getDepartmentAnalytics: async (params = {}) => {
    const response = await apiClient.get('/analytics/departments', { params });
    return response.data;
  },

  // Get time-based trends
  getTimeTrends: async (metric, params = {}) => {
    const response = await apiClient.get(`/analytics/trends/${metric}`, { params });
    return response.data;
  },

  // Get comparison data
  getComparisonData: async (metrics, params = {}) => {
    const response = await apiClient.post('/analytics/compare', {
      metrics,
      ...params
    });
    return response.data;
  },

  // Export analytics report
  exportReport: async (reportType, params = {}, format = 'pdf') => {
    const response = await apiClient.post('/analytics/export', {
      reportType,
      params,
      format
    }, {
      responseType: 'blob'
    });
    return response.data;
  },

  // Get real-time analytics
  getRealTimeStats: async () => {
    const response = await apiClient.get('/analytics/realtime');
    return response.data;
  },

  // Get custom analytics query
  customQuery: async (queryParams) => {
    const response = await apiClient.post('/analytics/custom', queryParams);
    return response.data;
  },

  // Get interview answers with candidate profiles
  getInterviewAnswers: async (params = {}) => {
    const response = await apiClient.get('/analytics/interview-answers', { params });
    return response.data;
  },

  // Get AI interview results and analysis
  getAIInterviewResults: async (params = {}) => {
    const response = await apiClient.get('/analytics/ai-results', { params });
    return response.data;
  },

  // Get detailed interview analysis
  getInterviewDetails: async (interviewId) => {
    const response = await apiClient.get(`/analytics/interview-details/${interviewId}`);
    return response.data;
  },

  // Get candidate performance analysis
  getCandidatePerformance: async (candidateId, params = {}) => {
    const response = await apiClient.get(`/analytics/candidate-performance/${candidateId}`, { params });
    return response.data;
  }
};