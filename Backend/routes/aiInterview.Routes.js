const express = require('express');
const router = express.Router();

// Import middleware
const { protect, authorize } = require('../middleware/auth');
const {
  validateInterviewId,
  validateNotificationCreation,
  handleValidationErrors
} = require('../middleware/validate');
const { body, param, query } = require('express-validator');

// Import controller
const aiInterviewController = require('../controllers/aiInterview.Controller');

// ===========================================================================================================================
// ================================================= AI Interview Validation Rules ======================================
// ===========================================================================================================================

// Validation for starting AI interview
const validateStartAIInterview = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('aiPersonality')
    .optional()
    .isIn(['professional', 'friendly', 'technical', 'casual', 'formal'])
    .withMessage('AI personality must be one of: professional, friendly, technical, casual, formal'),
  body('interviewStyle')
    .optional()
    .isIn(['balanced', 'technical', 'behavioral', 'mixed'])
    .withMessage('Interview style must be one of: balanced, technical, behavioral, mixed'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes')
];

// Validation for creating AI interview from template
const validateCreateAIInterviewFromTemplate = [
  body('templateId')
    .isMongoId()
    .withMessage('Valid template ID is required'),
  body('candidateEmail')
    .isEmail()
    .withMessage('Valid candidate email is required'),
  body('candidateName')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Candidate name is required and must be between 2 and 100 characters'),
  body('position')
    .notEmpty()
    .isLength({ min: 2, max: 100 })
    .withMessage('Position is required and must be between 2 and 100 characters'),
  body('aiPersonality')
    .optional()
    .isIn(['professional', 'friendly', 'technical', 'casual', 'formal'])
    .withMessage('AI personality must be one of: professional, friendly, technical, casual, formal'),
  body('interviewStyle')
    .optional()
    .isIn(['balanced', 'technical', 'behavioral', 'mixed'])
    .withMessage('Interview style must be one of: balanced, technical, behavioral, mixed'),
  body('duration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Duration must be between 15 and 180 minutes'),
  body('notes')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('Notes must be less than 1000 characters')
];

// Validation for AI question generation
const validateAskQuestion = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('previousAnswer')
    .optional()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Answer must be between 1 and 5000 characters'),
  body('responseTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Response time must be a positive integer (seconds)')
];

// Validation for answer analysis
const validateAnalyzeAnswer = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('answer')
    .notEmpty()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Answer is required and must be between 1 and 5000 characters'),
  body('questionId')
    .notEmpty()
    .withMessage('Question ID is required'),
  body('responseTime')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Response time must be a positive integer (seconds)'),
  body('isPartial')
    .optional()
    .isBoolean()
    .withMessage('isPartial must be a boolean value')
];

// Validation for difficulty adjustment
const validateDifficultyAdjustment = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('newDifficulty')
    .notEmpty()
    .isIn(['easy', 'medium', 'hard', 'expert'])
    .withMessage('Difficulty must be one of: easy, medium, hard, expert'),
  body('reason')
    .optional()
    .isLength({ max: 200 })
    .withMessage('Reason must be less than 200 characters')
];

// Validation for follow-up questions
const validateFollowUp = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('basedOnAnswer')
    .notEmpty()
    .isLength({ min: 1, max: 2000 })
    .withMessage('Base answer is required and must be between 1 and 2000 characters'),
  body('followUpType')
    .optional()
    .isIn(['clarification', 'deeper', 'example', 'alternative'])
    .withMessage('Follow-up type must be one of: clarification, deeper, example, alternative')
];

// Validation for AI personality settings
const validatePersonalitySettings = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('personality')
    .optional()
    .isIn(['professional', 'friendly', 'technical', 'casual', 'formal'])
    .withMessage('Personality must be one of: professional, friendly, technical, casual, formal'),
  body('traits')
    .optional()
    .isObject()
    .withMessage('Traits must be an object'),
  body('communicationStyle')
    .optional()
    .isIn(['balanced', 'direct', 'supportive', 'challenging'])
    .withMessage('Communication style must be one of: balanced, direct, supportive, challenging'),
  body('questioningApproach')
    .optional()
    .isIn(['adaptive', 'structured', 'exploratory', 'focused'])
    .withMessage('Questioning approach must be one of: adaptive, structured, exploratory, focused')
];

// Validation for interview style configuration
const validateStyleConfiguration = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('style')
    .optional()
    .isIn(['balanced', 'technical', 'behavioral', 'creative', 'mixed'])
    .withMessage('Style must be one of: balanced, technical, behavioral, creative, mixed'),
  body('focusAreas')
    .optional()
    .isArray()
    .withMessage('Focus areas must be an array'),
  body('pacing')
    .optional()
    .isIn(['slow', 'medium', 'fast', 'adaptive'])
    .withMessage('Pacing must be one of: slow, medium, fast, adaptive'),
  body('depth')
    .optional()
    .isIn(['shallow', 'medium', 'deep', 'comprehensive'])
    .withMessage('Depth must be one of: shallow, medium, deep, comprehensive'),
  body('adaptivity')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage('Adaptivity must be one of: low, medium, high')
];

// Validation for duration settings
const validateDurationSettings = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('totalDuration')
    .optional()
    .isInt({ min: 15, max: 180 })
    .withMessage('Total duration must be between 15 and 180 minutes'),
  body('timeWarnings')
    .optional()
    .isBoolean()
    .withMessage('Time warnings must be a boolean value'),
  body('flexibleTiming')
    .optional()
    .isBoolean()
    .withMessage('Flexible timing must be a boolean value'),
  body('breakAllowed')
    .optional()
    .isBoolean()
    .withMessage('Break allowed must be a boolean value')
];

// Validation for question type customization
const validateQuestionTypes = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('preferredTypes')
    .optional()
    .isArray()
    .withMessage('Preferred types must be an array'),
  body('avoidTypes')
    .optional()
    .isArray()
    .withMessage('Avoid types must be an array'),
  body('difficultyDistribution')
    .optional()
    .isIn(['easy', 'balanced', 'hard', 'adaptive'])
    .withMessage('Difficulty distribution must be one of: easy, balanced, hard, adaptive'),
  body('categoryWeights')
    .optional()
    .isObject()
    .withMessage('Category weights must be an object')
];

// Validation for scoring requests
const validateScoring = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('answer')
    .notEmpty()
    .isLength({ min: 1, max: 5000 })
    .withMessage('Answer is required and must be between 1 and 5000 characters'),
  body('questionId')
    .notEmpty()
    .withMessage('Question ID is required'),
  body('scoringCriteria')
    .optional()
    .isIn(['comprehensive', 'technical', 'communication', 'quick'])
    .withMessage('Scoring criteria must be one of: comprehensive, technical, communication, quick')
];

// Validation for feedback generation
const validateFeedbackGeneration = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('feedbackType')
    .optional()
    .isIn(['comprehensive', 'strengths', 'improvements', 'summary'])
    .withMessage('Feedback type must be one of: comprehensive, strengths, improvements, summary'),
  body('includeImprovement')
    .optional()
    .isBoolean()
    .withMessage('Include improvement must be a boolean value')
];

// Validation for keyword analysis
const validateKeywordAnalysis = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('text')
    .notEmpty()
    .isLength({ min: 1, max: 10000 })
    .withMessage('Text is required and must be between 1 and 10000 characters'),
  body('context')
    .optional()
    .isIn(['answer', 'question', 'conversation'])
    .withMessage('Context must be one of: answer, question, conversation')
];

// Validation for sync with reviewer
const validateSyncReviewer = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('reviewerId')
    .isMongoId()
    .withMessage('Valid reviewer ID is required'),
  body('syncType')
    .optional()
    .isIn(['full', 'summary', 'scores_only', 'recommendation_only'])
    .withMessage('Sync type must be one of: full, summary, scores_only, recommendation_only'),
  body('includeRecommendation')
    .optional()
    .isBoolean()
    .withMessage('Include recommendation must be a boolean value')
];

// Validation for report generation
const validateReportGeneration = [
  param('id').isMongoId().withMessage('Valid interview ID is required'),
  body('reportType')
    .optional()
    .isIn(['comprehensive', 'summary', 'technical', 'behavioral'])
    .withMessage('Report type must be one of: comprehensive, summary, technical, behavioral'),
  body('includeRecommendation')
    .optional()
    .isBoolean()
    .withMessage('Include recommendation must be a boolean value'),
  body('includeTranscript')
    .optional()
    .isBoolean()
    .withMessage('Include transcript must be a boolean value'),
  body('format')
    .optional()
    .isIn(['json', 'pdf', 'docx', 'html'])
    .withMessage('Format must be one of: json, pdf, docx, html')
];

// ===========================================================================================================================
// ================================================= AI Interview Session Management ====================================
// ===========================================================================================================================

/**
 * @route   GET /api/ai-interviews/:id
 * @desc    Get AI interview by ID
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.get('/:id',
  protect,
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.getAIInterview
);

/**
 * @route   POST /api/ai-interviews/create-from-template
 * @desc    Create and setup AI interview from template
 * @access  Private (Admin/Recruiter only)
 */
router.post('/create-from-template',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateCreateAIInterviewFromTemplate,
  handleValidationErrors,
  aiInterviewController.createAIInterviewFromTemplate
);

/**
 * @route   POST /api/ai-interviews/:id/start
 * @desc    Start AI interview session
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.post('/:id/start',
  protect,
  validateStartAIInterview,
  handleValidationErrors,
  aiInterviewController.startAIInterview
);

/**
 * @route   POST /api/ai-interviews/:id/pause
 * @desc    Pause AI interview session
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.post('/:id/pause',
  protect,
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.pauseAIInterview
);

/**
 * @route   POST /api/ai-interviews/:id/resume
 * @desc    Resume AI interview session
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.post('/:id/resume',
  protect,
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.resumeAIInterview
);

/**
 * @route   POST /api/ai-interviews/:id/end
 * @desc    End AI interview session
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.post('/:id/end',
  protect,
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.endAIInterview
);

// ===========================================================================================================================
// ================================================= Adaptive Questioning ==============================================
// ===========================================================================================================================

/**
 * @route   POST /api/ai-interviews/:id/ask-question
 * @desc    AI asks next question based on previous answers
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.post('/:id/ask-question',
  protect,
  validateAskQuestion,
  handleValidationErrors,
  aiInterviewController.askNextQuestion
);

/**
 * @route   POST /api/ai-interviews/:id/followup
 * @desc    Generate dynamic follow-up question
 * @access  Private (Admin/Recruiter only)
 */
router.post('/:id/followup',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateFollowUp,
  handleValidationErrors,
  aiInterviewController.generateFollowUpQuestion
);

/**
 * @route   PUT /api/ai-interviews/:id/difficulty
 * @desc    Adjust difficulty level based on candidate performance
 * @access  Private (AI system or Admin/Recruiter)
 */
router.put('/:id/difficulty',
  protect,
  validateDifficultyAdjustment,
  handleValidationErrors,
  aiInterviewController.adjustDifficultyLevel
);

/**
 * @route   POST /api/ai-interviews/:id/skip-question
 * @desc    Skip current question and move to next
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.post('/:id/skip-question',
  protect,
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.skipQuestion
);

/**
 * @route   POST /api/ai-interviews/:id/save-qa
 * @desc    Save questions and answers data to interview
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.post('/:id/save-qa',
  protect,
  validateInterviewId,
  [
    body('questionsAndAnswers')
      .isArray({ min: 1 })
      .withMessage('Questions and answers array is required'),
    body('questionsAndAnswers.*.questionId')
      .notEmpty()
      .withMessage('Question ID is required for each Q&A pair'),
    body('questionsAndAnswers.*.questionText')
      .notEmpty()
      .withMessage('Question text is required for each Q&A pair'),
    body('questionsAndAnswers.*.answerText')
      .notEmpty()
      .withMessage('Answer text is required for each Q&A pair')
  ],
  handleValidationErrors,
  aiInterviewController.saveQAData
);

// ===========================================================================================================================
// ================================================= Real-time Analysis =============================================
// ===========================================================================================================================

/**
 * @route   POST /api/ai-interviews/:id/analyze
 * @desc    Analyze answer in real-time
 * @access  Private (Candidate for own interview, Admin/Recruiter for any)
 */
router.post('/:id/analyze',
  protect,
  validateAnalyzeAnswer,
  handleValidationErrors,
  aiInterviewController.analyzeAnswerRealTime
);

/**
 * @route   GET /api/ai-interviews/:id/insights
 * @desc    Get real-time conversation insights
 * @access  Private (Admin/Recruiter for any, Candidate for own)
 */
router.get('/:id/insights',
  protect,
  (req, res) => {
    // Simple test response
    const { id } = req.params;
    res.status(200).json({
      success: true,
      message: 'AI Interview insights endpoint is working',
      data: {
        interviewId: id,
        timestamp: new Date(),
        status: 'Endpoint accessible',
        note: 'This is a test response to verify route functionality'
      }
    });
  }
);

/**
 * @route   GET /api/ai-interviews/:id/engagement
 * @desc    Detect candidate engagement level
 * @access  Private (Admin/Recruiter for monitoring)
 */
router.get('/:id/engagement',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.detectCandidateEngagement
);

/**
 * @route   POST /api/ai-interviews/:id/keywords
 * @desc    Extract and analyze keywords from answers
 * @access  Private (Admin/Recruiter for any, Candidate for own)
 */
router.post('/:id/keywords',
  protect,
  validateKeywordAnalysis,
  handleValidationErrors,
  aiInterviewController.identifyKeywords
);

// ===========================================================================================================================
// ================================================= AI Scoring & Evaluation ========================================
// ===========================================================================================================================

/**
 * @route   POST /api/ai-interviews/:id/score-answer
 * @desc    Score answer using AI algorithms
 * @access  Private (Admin/Recruiter for any, system for automatic)
 */
router.post('/:id/score-answer',
  protect,
  validateScoring,
  handleValidationErrors,
  aiInterviewController.scoreAnswerWithAI
);

/**
 * @route   POST /api/ai-interviews/:id/feedback
 * @desc    Generate automated AI feedback
 * @access  Private (Admin/Recruiter for any, Candidate for own)
 */
router.post('/:id/feedback',
  protect,
  validateFeedbackGeneration,
  handleValidationErrors,
  aiInterviewController.generateAIFeedback
);

/**
 * @route   GET /api/ai-interviews/:id/confidence
 * @desc    Calculate AI confidence score
 * @access  Private (Admin/Recruiter for monitoring)
 */
router.get('/:id/confidence',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.calculateConfidenceScore
);

/**
 * @route   GET /api/ai-interviews/:id/recommendation
 * @desc    Get AI hiring recommendation
 * @access  Private (Admin/Recruiter only)
 */
router.get('/:id/recommendation',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.getRecommendation
);

// ===========================================================================================================================
// ================================================= Interview Customization ====================================
// ===========================================================================================================================

/**
 * @route   PUT /api/ai-interviews/:id/personality
 * @desc    Set AI personality for the interview
 * @access  Private (Admin/Recruiter for setup, Candidate with permission)
 */
router.put('/:id/personality',
  protect,
  validatePersonalitySettings,
  handleValidationErrors,
  aiInterviewController.setAIPersonality
);

/**
 * @route   PUT /api/ai-interviews/:id/style
 * @desc    Configure interview style and approach
 * @access  Private (Admin/Recruiter for setup)
 */
router.put('/:id/style',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateStyleConfiguration,
  handleValidationErrors,
  aiInterviewController.configureInterviewStyle
);

/**
 * @route   PUT /api/ai-interviews/:id/duration
 * @desc    Set interview duration and time management
 * @access  Private (Admin/Recruiter for setup)
 */
router.put('/:id/duration',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateDurationSettings,
  handleValidationErrors,
  aiInterviewController.setInterviewDuration
);

/**
 * @route   PUT /api/ai-interviews/:id/question-types
 * @desc    Customize question types and preferences
 * @access  Private (Admin/Recruiter for setup)
 */
router.put('/:id/question-types',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateQuestionTypes,
  handleValidationErrors,
  aiInterviewController.customizeQuestionTypes
);

// ===========================================================================================================================
// ================================================= Integration & Export ========================================
// ===========================================================================================================================

/**
 * @route   GET /api/ai-interviews/:id/summary
 * @desc    Get comprehensive interview summary
 * @access  Private (Admin/Recruiter for any, Candidate for own)
 */
router.get('/:id/summary',
  protect,
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.getInterviewSummary
);

/**
 * @route   GET /api/ai-interviews/:id/transcript
 * @desc    Export full conversation transcript
 * @access  Private (Admin/Recruiter for any, Candidate for own)
 */
router.get('/:id/transcript',
  protect,
  validateInterviewId,
  handleValidationErrors,
  aiInterviewController.exportTranscript
);

/**
 * @route   POST /api/ai-interviews/:id/sync-reviewer
 * @desc    Sync interview data with human reviewer
 * @access  Private (Admin/Recruiter only)
 */
router.post('/:id/sync-reviewer',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateSyncReviewer,
  handleValidationErrors,
  aiInterviewController.syncWithHumanReviewer
);

/**
 * @route   POST /api/ai-interviews/:id/report
 * @desc    Generate comprehensive interview report
 * @access  Private (Admin/Recruiter for generation)
 */
router.post('/:id/report',
  protect,
  authorize(['Admin', 'Recruiter']),
  validateReportGeneration,
  handleValidationErrors,
  aiInterviewController.generateInterviewReport
);

module.exports = router;
