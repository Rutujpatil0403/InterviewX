const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analytics.Controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  validatePagination,
  validateDateRange,
  validateAnalyticsQuery,
  validateAnalyticsDateRange,
  validateRecruiterAnalytics,
  validateComparisonAnalytics,
  validatePredictiveAnalytics,
  validateCustomAnalytics,
  validateExportReport,
  validateScheduleReports,
  validateUserActivityAnalytics,
  validateTemplateId,
  handleValidationErrors
} = require('../middleware/validate');

// Apply authentication to all routes
router.use(authenticateToken);

// ===========================================================================================================================
// -------------------------------------------------- Analytics Routes ------------------------------------------------------
// ===========================================================================================================================

/**
 * @route   GET /api/analytics/dashboard
 * @desc    Get dashboard statistics and overview
 * @access  Private (All authenticated users)
 */
router.get(
  '/dashboard',
  validateAnalyticsQuery,
  handleValidationErrors,
  analyticsController.getDashboardStats
);

/**
 * @route   GET /api/analytics/real-time
 * @desc    Get real-time metrics and live statistics
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/real-time',
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getRealtimeMetrics
);

/**
 * @route   GET /api/analytics/kpi
 * @desc    Get key performance indicators with period comparison
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/kpi',
  validateAnalyticsQuery,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getKPIMetrics
);

/**
 * @route   GET /api/analytics/interviews
 * @desc    Get comprehensive interview analytics
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/interviews',
  validateAnalyticsDateRange,
  validateRecruiterAnalytics,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getInterviewAnalytics
);

/**
 * @route   GET /api/analytics/interviews/success-rates
 * @desc    Get interview success rates and completion statistics
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/interviews/success-rates',
  validateDateRange,
  validateRecruiterAnalytics,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getInterviewSuccessRates
);

/**
 * @route   GET /api/analytics/interviews/duration
 * @desc    Get average interview duration analytics
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/interviews/duration',
  validateDateRange,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getAverageInterviewDuration
);

/**
 * @route   GET /api/analytics/interviewers/performance
 * @desc    Get interviewer performance metrics and ratings
 * @access  Private (Admin, Recruiter - own stats only)
 */
router.get(
  '/interviewers/performance',
  validateDateRange,
  validateRecruiterAnalytics,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getInterviewerPerformance
);

/**
 * @route   GET /api/analytics/candidates
 * @desc    Get candidate analytics and performance trends
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/candidates',
  validateAnalyticsDateRange,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getCandidateAnalytics
);

/**
 * @route   GET /api/analytics/candidates/sources
 * @desc    Get candidate source analytics and conversion rates
 * @access  Private (Admin only)
 */
router.get(
  '/candidates/sources',
  validateDateRange,
  handleValidationErrors,
  requireRole(['Admin']),
  analyticsController.getCandidateSourceAnalytics
);

/**
 * @route   GET /api/analytics/candidates/journey
 * @desc    Get candidate journey analytics and conversion funnel
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/candidates/journey',
  validateDateRange,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getCandidateJourneyAnalytics
);

/**
 * @route   GET /api/analytics/templates
 * @desc    Get template usage analytics and effectiveness
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/templates',
  validateDateRange,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getTemplateUsageAnalytics
);

/**
 * @route   GET /api/analytics/questions/performance
 * @desc    Get question performance analytics and effectiveness
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/questions/performance',
  validateDateRange,
  validateTemplateId,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getQuestionPerformanceAnalytics
);

/**
 * @route   GET /api/analytics/questions/difficulty
 * @desc    Get question difficulty analysis and performance correlation
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/questions/difficulty',
  validateDateRange,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getDifficultyAnalytics
);

/**
 * @route   GET /api/analytics/system-health
 * @desc    Get system health metrics and performance indicators
 * @access  Private (Admin only)
 */
router.get(
  '/system-health',
  requireRole(['Admin']),
  analyticsController.getSystemHealthMetrics
);

/**
 * @route   GET /api/analytics/user-activity
 * @desc    Get user activity analytics and engagement metrics
 * @access  Private (Admin only)
 */
router.get(
  '/user-activity',
  validateDateRange,
  validateUserActivityAnalytics,
  handleValidationErrors,
  requireRole(['Admin']),
  analyticsController.getUserActivityAnalytics
);

/**
 * @route   GET /api/analytics/api-usage
 * @desc    Get API usage statistics and performance metrics
 * @access  Private (Admin only)
 */
router.get(
  '/api-usage',
  validateDateRange,
  handleValidationErrors,
  requireRole(['Admin']),
  analyticsController.getAPIUsageAnalytics
);

/**
 * @route   GET /api/analytics/predictive
 * @desc    Get ML-powered predictive analytics and forecasts
 * @access  Private (Admin only)
 */
router.get(
  '/predictive',
  validatePredictiveAnalytics,
  handleValidationErrors,
  requireRole(['Admin']),
  analyticsController.getPredictiveAnalytics
);

/**
 * @route   GET /api/analytics/comparison
 * @desc    Get period comparison analytics
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/comparison',
  validateComparisonAnalytics,
  validateAnalyticsQuery,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getComparisonAnalytics
);

/**
 * @route   POST /api/analytics/custom
 * @desc    Get custom analytics based on user-defined parameters
 * @access  Private (Admin, Recruiter)
 */
router.post(
  '/custom',
  validateCustomAnalytics,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getCustomAnalytics
);

/**
 * @route   POST /api/analytics/export
 * @desc    Generate and export analytics report
 * @access  Private (Admin, Recruiter)
 */
router.post(
  '/export',
  validateExportReport,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.exportAnalyticsReport
);

/**
 * @route   POST /api/analytics/schedule-reports
 * @desc    Schedule automated report generation
 * @access  Private (Admin only)
 */
router.post(
  '/schedule-reports',
  validateScheduleReports,
  handleValidationErrors,
  requireRole(['Admin']),
  analyticsController.scheduleReports
);

/**
 * @route   GET /api/analytics/interview-answers
 * @desc    Get interview answers with candidate profiles
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/interview-answers',
  validatePagination,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getInterviewAnswers
);

/**
 * @route   GET /api/analytics/ai-results
 * @desc    Get AI interview results and analysis
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/ai-results',
  validatePagination,
  handleValidationErrors,
  requireRole(['Admin', 'Recruiter']),
  analyticsController.getAIInterviewResults
);

module.exports = router;
