// Feedback and Evaluation API services
import apiClient from './api';

export const feedbackAPI = {
  // Create feedback
  createFeedback: async (feedbackData) => {
    const response = await apiClient.post('/feedback', feedbackData);
    return response.data;
  },

  // Get feedback by ID
  getFeedback: async (id) => {
    const response = await apiClient.get(`/feedback/${id}`);
    return response.data;
  },

  // Get all feedback
  getAllFeedback: async (params = {}) => {
    const { 
      page = 1, 
      limit = 20, 
      interviewId, 
      userId, 
      rating,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    const response = await apiClient.get('/feedback', {
      params: { page, limit, interviewId, userId, rating, sortBy, sortOrder }
    });
    return response.data;
  },

  // Update feedback
  updateFeedback: async (id, feedbackData) => {
    const response = await apiClient.put(`/feedback/${id}`, feedbackData);
    return response.data;
  },

  // Delete feedback
  deleteFeedback: async (id) => {
    const response = await apiClient.delete(`/feedback/${id}`);
    return response.data;
  },

  // Get feedback for interview
  getInterviewFeedback: async (interviewId) => {
    const response = await apiClient.get(`/feedback/interview/${interviewId}`);
    return response.data;
  },

  // Get feedback statistics
  getFeedbackStats: async (params = {}) => {
    const response = await apiClient.get('/feedback/stats', { params });
    return response.data;
  },

  // Respond to feedback
  respondToFeedback: async (id, responseData) => {
    const response = await apiClient.post(`/feedback/${id}/respond`, responseData);
    return response.data;
  },

  // Mark feedback as resolved
  markAsResolved: async (id) => {
    const response = await apiClient.patch(`/feedback/${id}/resolve`);
    return response.data;
  },

  // Export feedback to CSV
  exportFeedback: async (params = {}) => {
    const response = await apiClient.get('/feedback/export', {
      params,
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'feedback-export.csv';
    link.click();
    window.URL.revokeObjectURL(url);
  }
};

export const evaluationAPI = {
  // Create evaluation
  createEvaluation: async (evaluationData) => {
    const response = await apiClient.post('/evaluations', evaluationData);
    return response.data;
  },

  // Get evaluation by ID
  getEvaluation: async (id) => {
    const response = await apiClient.get(`/evaluations/${id}`);
    return response.data;
  },

  // Get all evaluations
  getAllEvaluations: async (params = {}) => {
    const { 
      page = 1, 
      limit = 20, 
      interviewId, 
      evaluatorId, 
      candidateId,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = params;
    
    const response = await apiClient.get('/evaluations', {
      params: { page, limit, interviewId, evaluatorId, candidateId, status, sortBy, sortOrder }
    });
    return response.data;
  },

  // Update evaluation
  updateEvaluation: async (id, evaluationData) => {
    const response = await apiClient.put(`/evaluations/${id}`, evaluationData);
    return response.data;
  },

  // Delete evaluation
  deleteEvaluation: async (id) => {
    const response = await apiClient.delete(`/evaluations/${id}`);
    return response.data;
  },

  // Submit evaluation
  submitEvaluation: async (id) => {
    const response = await apiClient.post(`/evaluations/${id}/submit`);
    return response.data;
  },

  // Get evaluation for interview
  getInterviewEvaluation: async (interviewId) => {
    const response = await apiClient.get(`/evaluations/interview/${interviewId}`);
    return response.data;
  },

  // Get evaluations by evaluator
  getEvaluatorEvaluations: async (evaluatorId, params = {}) => {
    const response = await apiClient.get(`/evaluations/evaluator/${evaluatorId}`, { params });
    return response.data;
  },

  // Get evaluations for candidate
  getCandidateEvaluations: async (candidateId, params = {}) => {
    const response = await apiClient.get(`/evaluations/candidate/${candidateId}`, { params });
    return response.data;
  },

  // Add evaluation criteria
  addCriteria: async (evaluationId, criteriaData) => {
    const response = await apiClient.post(`/evaluations/${evaluationId}/criteria`, criteriaData);
    return response.data;
  },

  // Update evaluation criteria
  updateCriteria: async (evaluationId, criteriaId, criteriaData) => {
    const response = await apiClient.put(`/evaluations/${evaluationId}/criteria/${criteriaId}`, criteriaData);
    return response.data;
  },

  // Delete evaluation criteria
  deleteCriteria: async (evaluationId, criteriaId) => {
    const response = await apiClient.delete(`/evaluations/${evaluationId}/criteria/${criteriaId}`);
    return response.data;
  },

  // Get evaluation statistics
  getEvaluationStats: async (params = {}) => {
    const response = await apiClient.get('/evaluations/stats', { params });
    return response.data;
  },

  // Get evaluation trends
  getEvaluationTrends: async (params = {}) => {
    const response = await apiClient.get('/evaluations/trends', { params });
    return response.data;
  },

  // Export evaluation to PDF
  exportEvaluation: async (id) => {
    const response = await apiClient.get(`/evaluations/${id}/export`, {
      responseType: 'blob'
    });
    
    const blob = new Blob([response.data], { type: 'application/pdf' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `evaluation-${id}.pdf`;
    link.click();
    window.URL.revokeObjectURL(url);
  },

  // Bulk export evaluations
  bulkExportEvaluations: async (evaluationIds) => {
    const response = await apiClient.post('/evaluations/bulk-export', 
      { evaluationIds },
      { responseType: 'blob' }
    );
    
    const blob = new Blob([response.data], { type: 'application/zip' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'evaluations-export.zip';
    link.click();
    window.URL.revokeObjectURL(url);
  }
};