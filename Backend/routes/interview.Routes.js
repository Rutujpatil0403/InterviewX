const express = require('express');
const router = express.Router();
const interviewController = require('../controllers/interview.Controller');
const { authenticateToken, requireRole, checkOwnership } = require('../middleware/auth');
const { 
  validateInterviewCreation,
  validateInterviewUpdate,
  validatePagination,
  validateDateRange,
  validateAnswerSubmission,
  validateAnswerUpdate,
  validateAnswerScoring
} = require('../middleware/validate');

// Public routes
router.get('/test', (req, res) => {
    res.json({ 
        message: 'Interview routes working',
        timestamp: new Date().toISOString()
    });
});

// Protected routes - all require authentication
router.use(authenticateToken);

// Create interview - Admin/Recruiter only
router.post('/', 
    requireRole(['Admin', 'Recruiter']),
    validateInterviewCreation,
    interviewController.createInterview
);

// Get all interviews with filtering and pagination
router.get('/',
    validatePagination,
    interviewController.getAllInterviews
);

// Get all interviews with filtering and pagination
router.get('/user/:userId/:role',
    validatePagination,
    interviewController.getInterviewByUser
);

// Get interview statistics
router.get('/statistics',
    interviewController.getInterviewStatistics
);


// Get interview statistics
router.get('/stats/user/:userId/:role',
    interviewController.getInterviewStatisticsByUser
);

// Get interviews by date range
router.get('/date-range',
    validateDateRange,
    interviewController.getInterviewsByDateRange
);

// Get specific interview by ID
router.get('/:interviewId',
    interviewController.getInterviewById
);

// Update interview - Admin/Recruiter only
router.put('/:interviewId',
    requireRole(['Admin', 'Recruiter']),
    validateInterviewUpdate,
    interviewController.updateInterview
);

// Delete interview - Admin/Recruiter only
router.delete('/:interviewId',
    // requireRole(['Admin', 'Recruiter']),
    interviewController.deleteInterview
);

// Start interview - All authenticated users can start their own interviews
router.patch('/:interviewId/start',
    interviewController.startInterview
);

// End interview - All authenticated users can end their own interviews
router.patch('/:interviewId/end',
    interviewController.endInterview
);

// ==================== ANSWER MANAGEMENT ROUTES ====================

// Submit an answer to an interview question - Candidates only during active interviews
router.post('/:interviewId/answers',
    validateAnswerSubmission,
    interviewController.submitAnswer
);

// Update/edit an answer - Candidates can edit their own answers
router.put('/:interviewId/answers/:questionId',
    validateAnswerUpdate,
    interviewController.updateAnswer
);

// Score an answer - Recruiters/Admins can score candidate answers
router.put('/:interviewId/answers/:questionId/score',
    requireRole(['Admin', 'Recruiter']),
    validateAnswerScoring,
    interviewController.scoreAnswer
);

// Get all answers for an interview - View Q&A pairs
router.get('/:interviewId/answers',
    interviewController.getAnswers
);

// Get interview completion statistics - Progress tracking
router.get('/:interviewId/completion',
    interviewController.getCompletionStats
);

module.exports = router;
