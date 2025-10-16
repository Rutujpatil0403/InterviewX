const express = require('express');
const router = express.Router();
const evaluationController = require('../controllers/evaluation.Controller');
const { authenticateToken, requireRole } = require('../middleware/auth');
const { param } = require('express-validator');
const {
    validateEvaluationCreation,
    validateEvaluationUpdate,
    validateEvaluationId,
    validatePagination
} = require('../middleware/validate');

// Apply authentication to all routes
router.use(authenticateToken);

// ===========================================================================================================================
// -------------------------------------------------- Evaluation Routes -----------------------------------------------------
// ===========================================================================================================================

/**
 * @route   POST /api/evaluations
 * @desc    Create a new evaluation
 * @access  Private (Admin, Recruiter)
 */
router.post(
    '/',
    requireRole(['Admin', 'Recruiter']),
    validateEvaluationCreation,
    evaluationController.createEvaluation
);

/**
 * @route   GET /api/evaluations
 * @desc    Get all evaluations with filtering and pagination
 * @access  Private (Admin, Recruiter, Candidate - limited access)
 */
router.get(
    '/',
    validatePagination,
    evaluationController.getAllEvaluations
);

/**
 * @route   GET /api/evaluations/statistics
 * @desc    Get evaluation statistics (admin only)
 * @access  Private (Admin)
 */
router.get(
    '/statistics',
    requireRole(['Admin']),
    evaluationController.getEvaluationStatistics
);

/**
 * @route   GET /api/evaluations/analytics
 * @desc    Get evaluation analytics
 * @access  Private (Admin, Recruiter)
 */
router.get(
    '/analytics',
    requireRole(['Admin', 'Recruiter']),
    evaluationController.getEvaluationAnalytics
);

/**
 * @route   GET /api/evaluations/:evaluationId
 * @desc    Get evaluation by ID
 * @access  Private (Admin, Recruiter, Candidate - limited access)
 */
router.get(
    '/:evaluationId',
    validateEvaluationId,
    evaluationController.getEvaluationById
);

/**
 * @route   PUT /api/evaluations/:evaluationId
 * @desc    Update evaluation
 * @access  Private (Admin, Evaluator)
 */
router.put(
    '/:evaluationId',
    validateEvaluationId,
    validateEvaluationUpdate,
    evaluationController.updateEvaluation
);

/**
 * @route   DELETE /api/evaluations/:evaluationId
 * @desc    Delete evaluation
 * @access  Private (Admin, Evaluator)
 */
router.delete(
    '/:evaluationId',
    validateEvaluationId,
    evaluationController.deleteEvaluation
);

/**
 * @route   PATCH /api/evaluations/:evaluationId/publish
 * @desc    Toggle publish status of evaluation
 * @access  Private (Admin, Evaluator)
 */
router.patch(
    '/:evaluationId/publish',
    validateEvaluationId,
    evaluationController.togglePublishStatus
);

/**
 * @route   GET /api/evaluations/interview/:interviewId
 * @desc    Get evaluations by interview ID
 * @access  Private (Admin, Recruiter, Candidate - limited access)
 */
router.get(
    '/interview/:interviewId',
    [
        param('interviewId')
            .isMongoId()
            .withMessage('Interview ID must be a valid MongoDB ObjectId')
    ],
    evaluationController.getEvaluationsByInterview
);

/**
 * @route   GET /api/evaluations/candidate/:candidateId
 * @desc    Get evaluations by candidate ID
 * @access  Private (Admin, Recruiter, Candidate - own evaluations only)
 */
router.get(
  '/candidate/:candidateId',
  [
    param('candidateId')
      .isMongoId()
      .withMessage('Candidate ID must be a valid MongoDB ObjectId')
  ],
  evaluationController.getEvaluationsByCandidate
);

/**
 * @route   GET /api/evaluations/recruiter/:recruiterId
 * @desc    Get evaluations by recruiter ID
 * @access  Private (Admin, Recruiter - own evaluations only)
 */
router.get(
  '/recruiter/:recruiterId',
  [
    param('recruiterId')
      .isMongoId()
      .withMessage('Recruiter ID must be a valid MongoDB ObjectId')
  ],
  requireRole(['Admin', 'Recruiter']),
  evaluationController.getEvaluationsByRecruiter
);

/**
 * @route   POST /api/evaluations/:evaluationId/calculate-score
 * @desc    Calculate overall score with custom weights
 * @access  Private (Admin, Evaluator)
 */
router.post(
  '/:evaluationId/calculate-score',
  validateEvaluationId,
  evaluationController.calculateOverallScore
);

/**
 * @route   GET /api/evaluations/:evaluationId/breakdown
 * @desc    Get detailed score breakdown
 * @access  Private (Admin, Recruiter, Candidate - limited access)
 */
router.get(
  '/:evaluationId/breakdown',
  validateEvaluationId,
  evaluationController.getScoreBreakdown
);

/**
 * @route   POST /api/evaluations/compare
 * @desc    Compare multiple evaluations
 * @access  Private (Admin, Recruiter, Candidate - limited access)
 */
router.post(
  '/compare',
  evaluationController.compareEvaluations
);

/**
 * @route   GET /api/evaluations/reports/generate
 * @desc    Generate evaluation report
 * @access  Private (Admin, Recruiter)
 */
router.get(
  '/reports/generate',
  requireRole(['Admin', 'Recruiter']),
  evaluationController.generateEvaluationReport
);

module.exports = router;
