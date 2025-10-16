const { body, query, param, validationResult } = require('express-validator');

// User validation rules
const validateUserRegistration = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('role')
    .isIn(['Admin', 'Recruiter', 'Candidate'])
    .withMessage('Role must be Admin, Recruiter, or Candidate'),
  
  body('profilePicture')
    .optional()
    .isURL()
    .withMessage('Profile picture must be a valid URL')
];

const validateUserLogin = [
  body('email')
    .isEmail()
    .withMessage('Please provide a valid email address')
    .normalizeEmail(),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateUserUpdate = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 })
    .withMessage('Phone number must be less than 20 characters'),
    
  body('department')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Department must be less than 100 characters'),
    
  body('company')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Company must be less than 100 characters'),
  
  body('profilePicture')
    .optional()
    .custom((value) => {
      // Allow URL or let the upload middleware handle file uploads
      if (typeof value === 'string' && value.length > 0) {
        const urlRegex = /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i;
        if (!urlRegex.test(value)) {
          throw new Error('Profile picture must be a valid URL');
        }
      }
      return true;
    })
];

const validatePasswordChange = [
  body('oldPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character')
];

// Template validation rules
const validateTemplateCreation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required')
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  
  body('questions.*.question')
    .trim()
    .notEmpty()
    .withMessage('Question text is required'),
  
  body('questions.*.type')
    .isIn(['text', 'multiple-choice', 'coding', 'video'])
    .withMessage('Question type must be text, multiple-choice, coding, or video'),
  
  body('category')
    .trim()
    .notEmpty()
    .withMessage('Category is required')
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  
  body('difficulty')
    .notEmpty()
    .withMessage('Difficulty is required')
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  
  body('estimatedDuration')
    .isInt({ min: 1, max: 300 })
    .withMessage('Estimated duration must be between 1 and 300 minutes'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

const validateTemplateUpdate = [
  body('title')
    .optional()
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Title must be between 3 and 100 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  
  body('questions')
    .optional()
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  
  body('questions.*.question')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Question text is required'),
  
  body('questions.*.type')
    .optional()
    .isIn(['text', 'multiple-choice', 'coding', 'video'])
    .withMessage('Question type must be text, multiple-choice, coding, or video'),
  
  body('category')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Category must be between 1 and 50 characters'),
  
  body('difficulty')
    .optional()
    .isIn(['Easy', 'Medium', 'Hard'])
    .withMessage('Difficulty must be Easy, Medium, or Hard'),
  
  body('estimatedDuration')
    .optional()
    .isInt({ min: 1, max: 300 })
    .withMessage('Estimated duration must be between 1 and 300 minutes'),
  
  body('isActive')
    .optional()
    .isBoolean()
    .withMessage('isActive must be a boolean value')
];

// Interview validation rules
const validateInterviewCreation = [
  body('candidateEmail')
    .trim()
    .isEmail()
    .withMessage('Valid candidate email is required')
    .normalizeEmail(),
  
  body('candidateName')
    .trim()
    .notEmpty()
    .withMessage('Candidate name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Candidate name must be between 2 and 100 characters'),
  
  body('position')
    .trim()
    .notEmpty()
    .withMessage('Position is required'),
  
  body('interviewDate')
    .notEmpty()
    .withMessage('Interview date is required')
    .isDate()
    .withMessage('Valid interview date is required'),
  
  body('interviewTime')
    .notEmpty()
    .withMessage('Interview time is required')
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid interview time is required'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('templateId')
    .optional()
    .isMongoId()
    .withMessage('Invalid template ID'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];


const templateValidation = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 3, max: 200 }).withMessage('Title must be between 3 and 200 characters'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Description cannot exceed 1000 characters'),
  
  body('category')
    .trim()
    .notEmpty().withMessage('Category is required'),
  
  body('difficulty')
    .notEmpty().withMessage('Difficulty is required')
    .isIn(['Easy', 'Medium', 'Hard']).withMessage('Difficulty must be Easy, Medium, or Hard'),
  
  body('estimatedDuration')
    .isInt({ min: 1, max: 600 }).withMessage('Estimated duration must be between 1 and 600 minutes'),
  
  body('questions')
    .isArray({ min: 1 }).withMessage('At least one question is required'),
  
  body('questions.*.question')
    .trim()
    .notEmpty().withMessage('Question text is required'),
  
  body('questions.*.type')
    .optional()
    .isIn(['technical', 'behavioral', 'situational', 'coding'])
    .withMessage('Invalid question type'),
  
  body('questions.*.expectedDuration')
    .optional()
    .isInt({ min: 1 }).withMessage('Expected duration must be a positive number'),
  
  body('isActive')
    .optional()
    .isBoolean().withMessage('isActive must be a boolean')
];

const validateInterviewUpdate = [
  body('interviewDate')
    .optional()
    .isDate()
    .withMessage('Valid interview date is required'),
  
  body('interviewTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Valid interview time is required'),
  
  body('duration')
    .optional()
    .isInt({ min: 15, max: 480 })
    .withMessage('Duration must be between 15 and 480 minutes'),
  
  body('status')
    .optional()
    .isIn(['Scheduled', 'In Progress', 'Completed', 'Cancelled'])
    .withMessage('Invalid status'),
  
  body('notes')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Notes must not exceed 1000 characters')
];

// Answer validation rules
const validateAnswerSubmission = [
  body('questionId')
    .isMongoId()
    .withMessage('Valid question ID is required'),
  
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer is required')
    .isLength({ max: 5000 })
    .withMessage('Answer must not exceed 5000 characters')
];

const validateAnswerUpdate = [
  body('answer')
    .trim()
    .notEmpty()
    .withMessage('Answer is required')
    .isLength({ max: 5000 })
    .withMessage('Answer must not exceed 5000 characters')
];



const validateAnswerScoring = [
  body('score')
    .isInt({ min: 0, max: 10 })
    .withMessage('Score must be between 0 and 10'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Feedback must not exceed 2000 characters')
];



// Evaluation validation rules
const validateEvaluationCreation = [
  body('interviewId')
    .isMongoId()
    .withMessage('Valid interview ID is required'),
  
  body('overallScore')
    .isFloat({ min: 0, max: 100 })
    .withMessage('Overall score must be between 0 and 100'),
  
  body('technicalScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Technical score must be between 0 and 100'),
  
  body('communicationScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Communication score must be between 0 and 100'),
  
  body('problemSolvingScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Problem solving score must be between 0 and 100'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Feedback must be less than 2000 characters'),
  
  body('strengths')
    .optional()
    .isArray()
    .withMessage('Strengths must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (const strength of value) {
          if (typeof strength !== 'string' || strength.trim().length === 0) {
            throw new Error('Each strength must be a non-empty string');
          }
        }
      }
      return true;
    }),
  
  body('weaknesses')
    .optional()
    .isArray()
    .withMessage('Weaknesses must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (const weakness of value) {
          if (typeof weakness !== 'string' || weakness.trim().length === 0) {
            throw new Error('Each weakness must be a non-empty string');
          }
        }
      }
      return true;
    }),
  
  body('recommendations')
    .optional()
    .isArray()
    .withMessage('Recommendations must be an array')
    .custom((value) => {
      if (value && value.length > 0) {
        for (const recommendation of value) {
          if (typeof recommendation !== 'string' || recommendation.trim().length === 0) {
            throw new Error('Each recommendation must be a non-empty string');
          }
        }
      }
      return true;
    }),
  
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('IsPublished must be a boolean value')
];

const validateEvaluationUpdate = [
  body('overallScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Overall score must be between 0 and 100'),
  
  body('technicalScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Technical score must be between 0 and 100'),
  
  body('communicationScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Communication score must be between 0 and 100'),
  
  body('problemSolvingScore')
    .optional()
    .isFloat({ min: 0, max: 100 })
    .withMessage('Problem solving score must be between 0 and 100'),
  
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Feedback must be less than 2000 characters'),
  
  body('strengths')
    .optional()
    .isArray()
    .withMessage('Strengths must be an array'),
  
  body('weaknesses')
    .optional()
    .isArray()
    .withMessage('Weaknesses must be an array'),
  
  body('recommendations')
    .optional()
    .isArray()
    .withMessage('Recommendations must be an array'),
  
  body('isPublished')
    .optional()
    .isBoolean()
    .withMessage('IsPublished must be a boolean value')
];

// Feedback validation rules
const validateFeedbackCreation = [
  body('interviewId')
    .isMongoId()
    .withMessage('Valid interview ID is required'),
  
  body('overallRating')
    .isInt({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1 and 5'),
  
  body('interviewerRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Interviewer rating must be between 1 and 5'),
  
  body('processRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Process rating must be between 1 and 5'),
  
  body('difficultyRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Difficulty rating must be between 1 and 5'),
  
  body('fairnessRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Fairness rating must be between 1 and 5'),
  
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comments must be less than 2000 characters'),
  
  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend must be a boolean value'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('IsAnonymous must be a boolean value')
];

const validateFeedbackUpdate = [
  body('overallRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Overall rating must be between 1 and 5'),
  
  body('interviewerRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Interviewer rating must be between 1 and 5'),
  
  body('processRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Process rating must be between 1 and 5'),
  
  body('difficultyRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Difficulty rating must be between 1 and 5'),
  
  body('fairnessRating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('Fairness rating must be between 1 and 5'),
  
  body('comments')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Comments must be less than 2000 characters'),
  
  body('wouldRecommend')
    .optional()
    .isBoolean()
    .withMessage('Would recommend must be a boolean value'),
  
  body('isAnonymous')
    .optional()
    .isBoolean()
    .withMessage('IsAnonymous must be a boolean value')
];

// Common validation rules
const validatePagination = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100')
];

const validateDateRange = [
  query('startDate')
    .optional()
    .isDate()
    .withMessage('Valid start date is required'),
  
  query('endDate')
    .optional()
    .isDate()
    .withMessage('Valid end date is required')
];


const validateAnalyticsQuery = [
  query('period')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Period must be between 1 and 365 days'),
  
  query('metric')
    .optional()
    .isIn(['interviews', 'candidates', 'feedback', 'performance'])
    .withMessage('Metric must be interviews, candidates, feedback, or performance')
];

const validateAnalyticsDateRange = [
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
    .custom((value, { req }) => {
      if (req.query.startDate && value && new Date(value) < new Date(req.query.startDate)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  
  query('groupBy')
    .optional()
    .isIn(['hour', 'day', 'week', 'month'])
    .withMessage('Group by must be hour, day, week, or month')
];

const validateRecruiterAnalytics = [
  query('recruiterId')
    .optional()
    .isMongoId()
    .withMessage('Recruiter ID must be a valid MongoDB ObjectId')
];

const validateComparisonAnalytics = [
  query('period1Start')
    .notEmpty()
    .isISO8601()
    .withMessage('Period 1 start date is required and must be valid'),
  query('period1End')
    .notEmpty()
    .isISO8601()
    .withMessage('Period 1 end date is required and must be valid'),
  query('period2Start')
    .notEmpty()
    .isISO8601()
    .withMessage('Period 2 start date is required and must be valid'),
  query('period2End')
    .notEmpty()
    .isISO8601()
    .withMessage('Period 2 end date is required and must be valid')
];

const validatePredictiveAnalytics = [
  query('predictionType')
    .optional()
    .isIn(['interview_success', 'candidate_churn', 'resource_optimization'])
    .withMessage('Prediction type must be interview_success, candidate_churn, or resource_optimization'),
  query('timeframe')
    .optional()
    .isInt({ min: 1, max: 365 })
    .withMessage('Timeframe must be between 1 and 365 days')
];

const validateCustomAnalytics = [
  body('metrics')
    .isArray({ min: 1 })
    .withMessage('Metrics must be a non-empty array'),
  body('metrics.*')
    .isIn(['interview_count', 'completion_rate', 'avg_feedback_rating', 'candidate_growth', 'template_usage'])
    .withMessage('Invalid metric specified'),
  body('filters')
    .optional()
    .isObject()
    .withMessage('Filters must be an object'),
  body('groupBy')
    .optional()
    .isIn(['day', 'week', 'month'])
    .withMessage('Group by must be day, week, or month'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

const validateExportReport = [
  body('reportType')
    .optional()
    .isIn(['comprehensive', 'interviews', 'candidates', 'performance', 'all'])
    .withMessage('Report type must be comprehensive, interviews, candidates, performance, or all'),
  body('format')
    .optional()
    .isIn(['json', 'csv', 'pdf'])
    .withMessage('Format must be json, csv, or pdf'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('includeCharts')
    .optional()
    .isBoolean()
    .withMessage('Include charts must be a boolean')
];

const validateScheduleReports = [
  body('reportType')
    .notEmpty()
    .isIn(['comprehensive', 'interviews', 'candidates', 'performance'])
    .withMessage('Report type is required and must be valid'),
  body('frequency')
    .notEmpty()
    .isIn(['daily', 'weekly', 'monthly'])
    .withMessage('Frequency is required and must be daily, weekly, or monthly'),
  body('recipients')
    .isArray()
    .withMessage('Recipients must be an array'),
  body('recipients.*')
    .isEmail()
    .withMessage('All recipients must be valid email addresses'),
  body('format')
    .optional()
    .isIn(['json', 'csv', 'pdf'])
    .withMessage('Format must be json, csv, or pdf'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date')
];

// Notification validation rules
const validateNotificationCreation = [
  body('recipientId')
    .optional()
    .isMongoId()
    .withMessage('Recipient ID must be a valid MongoDB ObjectId'),
  
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'error', 'system'])
    .withMessage('Type must be one of: info, success, warning, error, system'),
  
  body('category')
    .optional()
    .isIn(['interview', 'evaluation', 'template', 'user', 'system', 'reminder', 'announcement'])
    .withMessage('Category must be one of: interview, evaluation, template, user, system, reminder, announcement'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent'),
  
  body('actionUrl')
    .optional()
    .isURL()
    .withMessage('Action URL must be a valid URL'),
  
  body('metadata')
    .optional()
    .isObject()
    .withMessage('Metadata must be an object')
];

const validateNotificationUpdate = [
  body('isRead')
    .optional()
    .isBoolean()
    .withMessage('isRead must be a boolean value'),
  
  body('isArchived')
    .optional()
    .isBoolean()
    .withMessage('isArchived must be a boolean value')
];

const validateBroadcastNotification = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ min: 1, max: 200 })
    .withMessage('Title must be between 1 and 200 characters'),
  
  body('message')
    .trim()
    .notEmpty()
    .withMessage('Message is required')
    .isLength({ min: 1, max: 1000 })
    .withMessage('Message must be between 1 and 1000 characters'),
  
  body('targetRoles')
    .optional()
    .isArray()
    .withMessage('Target roles must be an array'),
  
  body('targetRoles.*')
    .optional()
    .isIn(['Admin', 'Recruiter', 'Candidate'])
    .withMessage('Each target role must be one of: Admin, Recruiter, Candidate'),
  
  body('type')
    .optional()
    .isIn(['info', 'success', 'warning', 'error', 'system'])
    .withMessage('Type must be one of: info, success, warning, error, system'),
  
  body('category')
    .optional()
    .isIn(['interview', 'evaluation', 'template', 'user', 'system', 'reminder', 'announcement'])
    .withMessage('Category must be one of: interview, evaluation, template, user, system, reminder, announcement'),
  
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Priority must be one of: low, medium, high, urgent')
];

const validateNotificationPreferences = [
  body('email')
    .optional()
    .isBoolean()
    .withMessage('Email preference must be a boolean value'),
  
  body('push')
    .optional()
    .isBoolean()
    .withMessage('Push preference must be a boolean value'),
  
  body('categories.interview')
    .optional()
    .isBoolean()
    .withMessage('Interview category preference must be a boolean value'),
  
  body('categories.evaluation')
    .optional()
    .isBoolean()
    .withMessage('Evaluation category preference must be a boolean value'),
  
  body('categories.template')
    .optional()
    .isBoolean()
    .withMessage('Template category preference must be a boolean value'),
  
  body('categories.system')
    .optional()
    .isBoolean()
    .withMessage('System category preference must be a boolean value'),
  
  body('categories.reminder')
    .optional()
    .isBoolean()
    .withMessage('Reminder category preference must be a boolean value'),
  
  body('categories.announcement')
    .optional()
    .isBoolean()
    .withMessage('Announcement category preference must be a boolean value'),
  
  body('doNotDisturb.enabled')
    .optional()
    .isBoolean()
    .withMessage('Do not disturb enabled must be a boolean value'),
  
  body('doNotDisturb.startTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('Start time must be in HH:MM format'),
  
  body('doNotDisturb.endTime')
    .optional()
    .matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
    .withMessage('End time must be in HH:MM format')
];

const validateNotificationId = [
  param('id')
    .isMongoId()
    .withMessage('Notification ID must be a valid MongoDB ObjectId')
];

const validateUserActivityAnalytics = [
  query('userRole')
    .optional()
    .isIn(['all', 'Admin', 'Recruiter', 'Candidate'])
    .withMessage('User role must be all, Admin, Recruiter, or Candidate')
];

// ID parameter validation
const validateId = [
  param('id')
    .isInt({ min: 1 })
    .withMessage('ID must be a positive integer')
];

const validateUserId = [
  param('userId')
    .isMongoId()
    .withMessage('User ID must be a valid MongoDB ObjectId')
];

const validateTemplateId = [
  param('templateId')
    .isMongoId()
    .withMessage('Template ID must be a valid MongoDB ObjectId')
];

const validateInterviewId = [
  param('id')
    .isMongoId()
    .withMessage('Interview ID must be a valid MongoDB ObjectId')
];

const validateEvaluationId = [
  param('evaluationId')
    .isMongoId()
    .withMessage('Evaluation ID must be a valid MongoDB ObjectId')
];

const validateFeedbackId = [
  param('feedbackId')
    .isMongoId()
    .withMessage('Feedback ID must be a valid MongoDB ObjectId')
];

// Error handling middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

module.exports = {
  // User validations
  validateUserRegistration,
  validateUserLogin,
  validateUserUpdate,
  validatePasswordChange,
  
  // Template validations
  validateTemplateCreation,
  validateTemplateUpdate,
  templateValidation,
  
  // Interview validations
  validateInterviewCreation,
  validateInterviewUpdate,
  
  // Answer validations
  validateAnswerSubmission,
  validateAnswerUpdate,
  validateAnswerScoring,
  
  // Evaluation validations
  validateEvaluationCreation,
  validateEvaluationUpdate,
  
  // Feedback validations
  validateFeedbackCreation,
  validateFeedbackUpdate,
  
  // Notification validations
  validateNotificationCreation,
  validateNotificationUpdate,
  validateBroadcastNotification,
  validateNotificationPreferences,
  validateNotificationId,
  
  // Common validations
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
  
  // ID validations
  validateId,
  validateUserId,
  validateTemplateId,
  validateInterviewId,
  validateEvaluationId,
  validateFeedbackId,
  
  // Error handler
  handleValidationErrors
};
