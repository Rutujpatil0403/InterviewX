const express = require('express');
const templateController = require('../controllers/template.Controller');
const router = express.Router();
const { authenticateToken, requireRole } = require('../middleware/auth');
const { 
  validateTemplateCreation,
  validateTemplateUpdate, 
  validateTemplateId,
  templateValidation,
  validatePagination,
  handleValidationErrors
} = require('../middleware/validate');

// Apply authentication to all routes
router.use(authenticateToken);

// Public template routes (for authenticated users)
router.get('/', validatePagination, templateController.getAllTemplates);
router.get('/popular', templateController.getPopularTemplates);
router.get('/categories', templateController.getCategories);
router.get('/my-templates', validatePagination, templateController.getMyTemplates);
router.get('/:templateId', validateTemplateId, templateController.getTemplateById);

// Recruiter and Admin only routes
router.post('/', requireRole(['Recruiter', 'Admin']), templateValidation, handleValidationErrors, templateController.createTemplate);
router.put('/:templateId', requireRole(['Recruiter', 'Admin']), validateTemplateId, validateTemplateUpdate, handleValidationErrors, templateController.updateTemplate);
router.delete('/:templateId', requireRole(['Recruiter', 'Admin']), validateTemplateId, templateController.deleteTemplate);
router.patch('/:templateId/restore', requireRole(['Recruiter', 'Admin']), validateTemplateId, templateController.restoreTemplate);
router.post('/:templateId/clone', requireRole(['Recruiter', 'Admin']), validateTemplateId, templateController.cloneTemplate);

// Admin only routes
router.get('/admin/statistics', requireRole(['Admin']), templateController.getTemplateStatistics);

module.exports = router;
