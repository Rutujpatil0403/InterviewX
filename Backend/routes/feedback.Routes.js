const express = require('express');
const router = express.Router();
const feedbackController = require('../controllers/feedback.Controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { param } = require('express-validator');
const {
  validateFeedbackCreation,
  validateFeedbackUpdate,
  validateFeedbackId,
  validatePagination
} = require('../middleware/validate');

// Apply authentication to all routes
router.use(authenticateToken);

// ===========================================================================================================================
// -------------------------------------------------- Feedback Routes -------------------------------------------------------
// ===========================================================================================================================

/**
 * @route   POST /api/feedback
 * @desc    Create new feedback
 * @access  Private (Candidate only)
 */
router.post(
  '/',
  requireRole(['Candidate']),
  validateFeedbackCreation,
  feedbackController.createFeedback
);

/**
 * @route   GET /api/feedback
 * @desc    Get all feedback with filtering and pagination
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/',
  requireRole(['Admin', 'Recruiter']),
  validatePagination,
  feedbackController.getAllFeedback
);

/**
 * @route   GET /api/feedback/statistics
 * @desc    Get feedback statistics (admin only)
 * @access  Private (Admin)
 */
router.get(
  '/statistics',
  requireRole(['Admin']),
  feedbackController.getFeedbackStatistics
);

/**
 * @route   GET /api/feedback/analytics
 * @desc    Get feedback analytics
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/analytics',
  requireRole(['Admin', 'Recruiter']),
  feedbackController.getFeedbackAnalytics
);

/**
 * @route   GET /api/feedback/export
 * @desc    Export comprehensive feedback report
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/export',
  requireRole(['Admin', 'Recruiter']),
  feedbackController.exportFeedbackReport
);

/**
 * @route   POST /api/feedback/ai/generate
 * @desc    Generate AI-powered feedback for an interview
 * @access  Private (Admin, Recruiter)
 */
router.post(
  '/ai/generate',
  requireRole(['Admin', 'Recruiter']),
  feedbackController.generateAIFeedback
);

/**
 * @route   POST /api/feedback/:feedbackId/ai/enhance
 * @desc    Enhance existing feedback with AI insights
 * @access  Private (Admin, Recruiter)
 */
router.post(
  '/:feedbackId/ai/enhance',
  [
    param('feedbackId')
      .isMongoId()
      .withMessage('Feedback ID must be a valid MongoDB ObjectId')
  ],
  requireRole(['Admin', 'Recruiter']),
  feedbackController.enhanceFeedbackWithAI
);

/**
 * @route   GET /api/feedback/candidate/:candidateId
 * @desc    Get all feedback for a specific candidate
 * @access  Private (Admin, Candidate - own feedback only)
 */
router.get(
  '/candidate/:candidateId',
  [
    param('candidateId')
      .isMongoId()
      .withMessage('Candidate ID must be a valid MongoDB ObjectId')
  ],
  requireRole(['Admin', 'Candidate']),
  validatePagination,
  feedbackController.getFeedbackByCandidate
);

/**
 * @route   GET /api/feedback/candidate/:candidateId/strength-analysis
 * @desc    Generate AI-powered strength analysis for candidate
 * @access  Private (Admin, Candidate - own analysis only)
 */
router.get(
  '/candidate/:candidateId/strength-analysis',
  [
    param('candidateId')
      .isMongoId()
      .withMessage('Candidate ID must be a valid MongoDB ObjectId')
  ],
  requireRole(['Admin', 'Candidate']),
  feedbackController.generateStrengthAnalysis
);

/**
 * @route   GET /api/feedback/candidate/:candidateId/improvement-plan
 * @desc    Generate personalized improvement plan for candidate
 * @access  Private (Admin, Candidate - own plan only)
 */
router.get(
  '/candidate/:candidateId/improvement-plan',
  [
    param('candidateId')
      .isMongoId()
      .withMessage('Candidate ID must be a valid MongoDB ObjectId')
  ],
  requireRole(['Admin', 'Candidate']),
  feedbackController.generateImprovementPlan
);

/**
 * @route   GET /api/feedback/interview/:interviewId/rating
 * @desc    Get comprehensive rating analysis for an interview
 * @access  Private (Admin, Recruiter, Candidate - own interview only)
 */
router.get(
  '/interview/:interviewId/rating',
  [
    param('interviewId')
      .isMongoId()
      .withMessage('Interview ID must be a valid MongoDB ObjectId')
  ],
  feedbackController.getInterviewRating
);

/**
 * @route   POST /api/feedback/:feedbackId/deliver
 * @desc    Deliver feedback to candidate
 * @access  Private (Admin, Recruiter)
 */
router.post(
  '/:feedbackId/deliver',
  [
    param('feedbackId')
      .isMongoId()
      .withMessage('Feedback ID must be a valid MongoDB ObjectId')
  ],
  requireRole(['Admin', 'Recruiter']),
  feedbackController.deliverFeedbackToCandidate
);

/**
 * @route   POST /api/feedback/:feedbackId/schedule-followup
 * @desc    Schedule follow-up communication for feedback
 * @access  Private (Admin, Recruiter)
 */
router.post(
  '/:feedbackId/schedule-followup',
  [
    param('feedbackId')
      .isMongoId()
      .withMessage('Feedback ID must be a valid MongoDB ObjectId')
  ],
  requireRole(['Admin', 'Recruiter']),
  feedbackController.scheduleFollowUp
);

/**
 * @route   GET /api/feedback/:feedbackId/delivery-status
 * @desc    Get delivery status of feedback
 * @access  Private (Admin, Recruiter, Candidate - own feedback only)
 */
router.get(
  '/:feedbackId/delivery-status',
  [
    param('feedbackId')
      .isMongoId()
      .withMessage('Feedback ID must be a valid MongoDB ObjectId')
  ],
  feedbackController.getFeedbackDeliveryStatus
);

/**
 * @route   GET /api/feedback/recruiter/:recruiterId/summary
 * @desc    Get feedback summary for a specific recruiter
 * @access  Private (Admin, Recruiter - own summary only)
 */
router.get(
  '/recruiter/:recruiterId/summary',
  [
    param('recruiterId')
      .isMongoId()
      .withMessage('Recruiter ID must be a valid MongoDB ObjectId')
  ],
  requireRole(['Admin', 'Recruiter']),
  feedbackController.getRecruiterFeedbackSummary
);

/**
 * @route   GET /api/feedback/recruiter/summary
 * @desc    Get feedback summary for current recruiter
 * @access  Private (Recruiter)
 */
router.get(
  '/recruiter/summary',
  requireRole(['Recruiter']),
  feedbackController.getRecruiterFeedbackSummary
);

/**
 * @route   GET /api/feedback/:feedbackId
 * @desc    Get feedback by ID
 * @access  Private (Admin, Recruiter, Candidate - own feedback only)
 */
router.get(
  '/:feedbackId',
  validateFeedbackId,
  feedbackController.getFeedbackById
);

/**
 * @route   PUT /api/feedback/:feedbackId
 * @desc    Update feedback
 * @access  Private (Admin, Candidate who created feedback)
 */
router.put(
  '/:feedbackId',
  validateFeedbackId,
  validateFeedbackUpdate,
  feedbackController.updateFeedback
);

/**
 * @route   DELETE /api/feedback/:feedbackId
 * @desc    Delete feedback
 * @access  Private (Admin, Candidate who created feedback)
 */
router.delete(
  '/:feedbackId',
  validateFeedbackId,
  feedbackController.deleteFeedback
);

/**
 * @route   GET /api/feedback/interview/:interviewId
 * @desc    Get feedback by interview ID
 * @access  Private (Admin, Recruiter, Candidate - limited access)
 */
router.get(
  '/interview/:interviewId',
  [
    param('interviewId')
      .isMongoId()
      .withMessage('Interview ID must be a valid MongoDB ObjectId')
  ],
  feedbackController.getFeedbackByInterview
);

module.exports = router;
