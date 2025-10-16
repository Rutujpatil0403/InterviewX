const Template = require('../models/Template');
const AppError = require('../utils/AppError');
const asyncHandler = require('express-async-handler');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');

// ===========================================================================================================================
// -------------------------------------------------- Create Template --------------------------------------------------------
// ===========================================================================================================================

const createTemplate = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Template creation validation failed', {
      errors: errors.array(),
      userId: req.user.userId
    });
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  // Only recruiters and admins can create templates
  if (!['Recruiter', 'Admin'].includes(req.user.role)) {
    throw new AppError('Only recruiters and admins can create templates', 403);
  }

  const templateData = {
    ...req.body,
    createdBy: req.user.userId
  };

  console.log("template : ", templateData);

  const template = await Template.create(templateData);

  logger.info('Template created', { 
    templateId: template._id, 
    createdBy: req.user.userId,
    title: template.title 
  });

  res.status(201).json({
    success: true,
    message: 'Template created successfully',
    data: {
      template
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Get All Templates ------------------------------------------------------
// ===========================================================================================================================

const getAllTemplates = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    category,
    difficulty,
    search,
    createdBy,
    durationMin,
    durationMax
  } = req.query;

  // Build query filters
  const query = { isActive: true };
  
  if (category) query.category = category;
  if (difficulty) query.difficulty = difficulty;
  if (createdBy) query.createdBy = createdBy;
  if (durationMin && durationMax) {
    query.estimatedDuration = {
      $gte: parseInt(durationMin),
      $lte: parseInt(durationMax)
    };
  }
  
  // Search functionality
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [templates, total] = await Promise.all([
    Template.find(query)
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Template.countDocuments(query)
  ]);

  res.status(200).json({
    success: true,
    data: {
      templates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTemplates: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Get Template by ID -----------------------------------------------------
// ===========================================================================================================================

const getTemplateById = asyncHandler(async (req, res) => {
  const { templateId } = req.params;

  const template = await Template.findById(templateId)
    .populate('createdBy', 'name email')
    .lean();

  if (!template) {
    throw new AppError('Template not found', 404);
  }

  res.status(200).json({
    success: true,
    data: {
      template
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Update Template --------------------------------------------------------
// ===========================================================================================================================

const updateTemplate = asyncHandler(async (req, res) => {
  // Check for validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }

  const { templateId } = req.params;

  // Get the template first to check ownership
  const existingTemplate = await Template.findById(templateId);
  
  if (!existingTemplate) {
    throw new AppError('Template not found', 404);
  }

  // Check if user owns the template or is admin
  if (req.user.role !== 'Admin' && existingTemplate.createdBy.toString() !== req.user.userId) {
    throw new AppError('You can only update your own templates', 403);
  }

  // Update the template
  const updateData = { ...req.body, updatedAt: new Date() };
  const updatedTemplate = await Template.findByIdAndUpdate(
    templateId, 
    updateData, 
    { new: true, runValidators: true }
  ).populate('createdBy', 'name email').lean();

  logger.info('Template updated', { 
    templateId, 
    updatedBy: req.user.userId,
    updatedFields: Object.keys(req.body)
  });

  res.status(200).json({
    success: true,
    message: 'Template updated successfully',
    data: {
      template: updatedTemplate
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Delete Template --------------------------------------------------------
// ===========================================================================================================================

const deleteTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const { permanent = false } = req.query; // Query param to determine hard vs soft delete

  // Get the template first to check ownership
  const existingTemplate = await Template.findById(templateId);
  
  if (!existingTemplate) {
    throw new AppError('Template not found', 404);
  }

  // Check if user owns the template or is admin
  if (req.user.role !== 'Admin' && existingTemplate.createdBy.toString() !== req.user.userId) {
    throw new AppError('You can only delete your own templates', 403);
  }

  let deleteAction;
  let deleteMessage;

  if (permanent === 'true' || permanent === true) {
    // Hard delete - permanently remove from database
    await Template.findByIdAndDelete(templateId);
    deleteAction = 'permanently deleted';
    deleteMessage = 'Template permanently deleted';
  } else {
    // Soft delete - set isActive to false
    await Template.findByIdAndUpdate(templateId, { 
      isActive: false, 
      updatedAt: new Date() 
    });
    deleteAction = 'deactivated';
    deleteMessage = 'Template deactivated successfully';
  }

  logger.info('Template deleted', { 
    templateId, 
    deletedBy: req.user.userId,
    templateTitle: existingTemplate.title,
    deleteType: permanent ? 'hard' : 'soft'
  });

  res.status(200).json({
    success: true,
    message: deleteMessage,
    data: {
      templateId,
      action: deleteAction,
      permanent: permanent === 'true' || permanent === true
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Restore Template -------------------------------------------------------
// ===========================================================================================================================

const restoreTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;

  // Get the template first to check ownership
  const existingTemplate = await Template.findById(templateId);
  
  if (!existingTemplate) {
    throw new AppError('Template not found', 404);
  }

  // Check if user owns the template or is admin
  if (req.user.role !== 'Admin' && existingTemplate.createdBy.toString() !== req.user.userId) {
    throw new AppError('You can only restore your own templates', 403);
  }

  if (existingTemplate.isActive) {
    throw new AppError('Template is already active', 400);
  }

  // Restore template by setting isActive to true
  const restoredTemplate = await Template.findByIdAndUpdate(
    templateId, 
    { 
      isActive: true, 
      updatedAt: new Date() 
    },
    { new: true }
  ).populate('createdBy', 'name email').lean();

  logger.info('Template restored', { 
    templateId, 
    restoredBy: req.user.userId,
    templateTitle: existingTemplate.title
  });

  res.status(200).json({
    success: true,
    message: 'Template restored successfully',
    data: {
      template: restoredTemplate
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Get My Templates -------------------------------------------------------
// ===========================================================================================================================

const getMyTemplates = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;

  const skip = (parseInt(page) - 1) * parseInt(limit);
  
  const [templates, total] = await Promise.all([
    Template.find({ createdBy: req.user.userId })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean(),
    Template.countDocuments({ createdBy: req.user.userId })
  ]);

  res.status(200).json({
    success: true,
    data: {
      templates,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalTemplates: total,
        hasNext: skip + parseInt(limit) < total,
        hasPrev: parseInt(page) > 1
      }
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Clone Template ---------------------------------------------------------
// ===========================================================================================================================

const cloneTemplate = asyncHandler(async (req, res) => {
  const { templateId } = req.params;
  const { title } = req.body;

  // Only recruiters and admins can clone templates
  if (!['Recruiter', 'Admin'].includes(req.user.role)) {
    throw new AppError('Only recruiters and admins can clone templates', 403);
  }

  // Get the original template
  const originalTemplate = await Template.findById(templateId);
  
  if (!originalTemplate) {
    throw new AppError('Template not found', 404);
  }

  // Create cloned template data
  const cloneData = {
    title: title || `Copy of ${originalTemplate.title}`,
    description: originalTemplate.description,
    questions: originalTemplate.questions,
    category: originalTemplate.category,
    difficulty: originalTemplate.difficulty,
    estimatedDuration: originalTemplate.estimatedDuration,
    isActive: true,
    createdBy: req.user.userId
  };

  const clonedTemplate = await Template.create(cloneData);

  logger.info('Template cloned', { 
    originalTemplateId: templateId,
    clonedTemplateId: clonedTemplate._id,
    clonedBy: req.user.userId
  });

  res.status(201).json({
    success: true,
    message: 'Template cloned successfully',
    data: {
      template: clonedTemplate
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Get Popular Templates --------------------------------------------------
// ===========================================================================================================================

const getPopularTemplates = asyncHandler(async (req, res) => {
  const { limit = 10 } = req.query;

  // Get templates sorted by usage count (you might want to implement a usage counter)
  const templates = await Template.find({ isActive: true })
    .populate('createdBy', 'name email')
    .sort({ createdAt: -1 }) // For now, sort by newest
    .limit(parseInt(limit))
    .lean();

  res.status(200).json({
    success: true,
    data: {
      templates
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Get Template Categories ------------------------------------------------
// ===========================================================================================================================

const getCategories = asyncHandler(async (req, res) => {
  // Get distinct categories from active templates
  const categories = await Template.distinct('category', { isActive: true });

  res.status(200).json({
    success: true,
    data: {
      categories: categories.sort()
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Get Template Statistics ------------------------------------------------
// ===========================================================================================================================

const getTemplateStatistics = asyncHandler(async (req, res) => {
  // Only admins can view template statistics
  if (req.user.role !== 'Admin') {
    throw new AppError('Access denied. Admin privileges required.', 403);
  }

  const [
    totalTemplates,
    activeTemplates,
    inactiveTemplates,
    categoryStats,
    difficultyStats
  ] = await Promise.all([
    Template.countDocuments(),
    Template.countDocuments({ isActive: true }),
    Template.countDocuments({ isActive: false }),
    Template.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]),
    Template.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$difficulty', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ])
  ]);

  const statistics = {
    totalTemplates,
    activeTemplates,
    inactiveTemplates,
    categoryBreakdown: categoryStats,
    difficultyBreakdown: difficultyStats
  };

  res.status(200).json({
    success: true,
    data: {
      statistics
    }
  });
});

// ===========================================================================================================================
// -------------------------------------------------- Export Module ----------------------------------------------------------
// ===========================================================================================================================

module.exports = {
  createTemplate,
  getAllTemplates,
  getTemplateById,
  updateTemplate,
  deleteTemplate,
  restoreTemplate,
  getMyTemplates,
  cloneTemplate,
  getPopularTemplates,
  getCategories,
  getTemplateStatistics
};
