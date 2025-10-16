// Template management API services
import apiClient from './api';

export const templateAPI = {
  // Get all templates with pagination and filters
  getTemplates: async (params = {}) => {
    const { 
      page = 1, 
      limit = 10, 
      search = '', 
      category = '', 
      difficulty = '',
      createdBy = '' 
    } = params;
    const response = await apiClient.get('/templates', {
      params: { page, limit, search, category, difficulty, createdBy }
    });
    return response.data;
  },

  // Get template by ID
  getTemplateById: async (id) => {
    const response = await apiClient.get(`/templates/${id}`);
    return response.data;
  },

  // Create new template
  createTemplate: async (templateData) => {
    const response = await apiClient.post('/templates', templateData);
    return response.data;
  },

  // Update template
  updateTemplate: async (id, templateData) => {
    const response = await apiClient.put(`/templates/${id}`, templateData);
    return response.data;
  },

  // Delete template
  deleteTemplate: async (id) => {
    const response = await apiClient.delete(`/templates/${id}`);
    return response.data;
  },

  // Clone template (matches backend route)
  cloneTemplate: async (id, newData = {}) => {
    const response = await apiClient.post(`/templates/${id}/clone`, newData);
    return response.data;
  },

  // Get template categories (matches backend route)
  getCategories: async () => {
    const response = await apiClient.get('/templates/categories');
    return response.data;
  },

  // Get popular templates (matches backend route)
  getPopularTemplates: async (limit = 5) => {
    const response = await apiClient.get('/templates/popular', {
      params: { limit }
    });
    return response.data;
  },

  // Get user's own templates (matches backend route)
  getMyTemplates: async (params = {}) => {
    const response = await apiClient.get('/templates/my-templates', { params });
    return response.data;
  },

  // Get admin template statistics (Admin only - matches backend route)
  getTemplateStatistics: async () => {
    const response = await apiClient.get('/templates/admin/statistics');
    return response.data;
  },

  // Restore deleted template (matches backend route)
  restoreTemplate: async (id) => {
    const response = await apiClient.patch(`/templates/${id}/restore`);
    return response.data;
  },

  // Note: The following routes exist in frontend but not in backend
  // They should be removed or backend routes should be added if needed:
  
  // Search templates (NOT IMPLEMENTED IN BACKEND)
  // searchTemplates: async (query) => {
  //   const response = await apiClient.get('/templates/search', {
  //     params: { q: query }
  //   });
  //   return response.data;
  // },

  // Template question management (NOT IMPLEMENTED IN BACKEND)
  // addQuestion, updateQuestion, deleteQuestion, reorderQuestions
  
  // Template publishing (NOT IMPLEMENTED IN BACKEND)
  // publishTemplate, unpublishTemplate
  
  // Template import/export (NOT IMPLEMENTED IN BACKEND)
  // importTemplate, exportTemplate
};