const express = require('express');
const router = express.Router();

// Import controllers
const auditController = require('../controllers/audit.Controller');

// Import middleware
const { protect, authorize } = require('../middleware/auth');


// ===========================================================================================================================
// ================================================ Audit Routes =============================================================
// ===========================================================================================================================

// ===========================================================================================================================
// -------------------------------------------------- Core Audit Operations -------------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Create audit log entry
 * @route   POST /api/audit/log
 * @access  Private (System/Admin use)
 */
router.post('/log',
  protect,
  authorize('Admin', 'System'),
  auditController.createAuditLog
);

/**
 * @desc    Get audit logs with filtering and pagination
 * @route   GET /api/audit/logs
 * @access  Private (Admin/Compliance only)
 */
router.get('/logs',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getAuditLogs
);

/**
 * @desc    Get specific audit log entry by ID
 * @route   GET /api/audit/logs/:eventId
 * @access  Private (Admin/Compliance only)
 */
router.get('/logs/:eventId',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getAuditById
);

/**
 * @desc    Export audit logs
 * @route   GET /api/audit/logs/export
 * @access  Private (Admin/Compliance only)
 */
router.get('/logs/export',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.exportAuditLogs
);

/**
 * @desc    Get audit log statistics
 * @route   GET /api/audit/logs/statistics
 * @access  Private (Admin/Compliance only)
 */
router.get('/logs/statistics',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getAuditStatistics
);

// ===========================================================================================================================
// -------------------------------------------------- User Activity Tracking -----------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Log user action for audit trail
 * @route   POST /api/audit/user-action
 * @access  Private (Middleware use)
 */
router.post('/user-action',
  protect,
  validateRequest,
  auditController.logUserAction
);

/**
 * @desc    Get user's activity history
 * @route   GET /api/audit/user/:userId
 * @access  Private (Self or Admin only)
 */
router.get('/user/:userId',
  protect,
  auditController.getUserActivity
);

/**
 * @desc    Get current user's activity
 * @route   GET /api/audit/user/me/activity
 * @access  Private
 */
router.get('/user/me/activity',
  protect,
  auditController.getCurrentUserActivity
);

/**
 * @desc    Get user session history (login/logout events)
 * @route   GET /api/audit/user/:userId/sessions
 * @access  Private (Self or Admin only)
 */
router.get('/user/:userId/sessions',
  protect,
  auditController.getUserSessionHistory
);

/**
 * @desc    Get current user's session history
 * @route   GET /api/audit/user/me/sessions
 * @access  Private
 */
router.get('/user/me/sessions',
  protect,
  auditController.getCurrentUserSessions
);

/**
 * @desc    Get user activity summary
 * @route   GET /api/audit/user/:userId/summary
 * @access  Private (Self or Admin only)
 */
router.get('/user/:userId/summary',
  protect,
  auditController.getUserActivitySummary
);

/**
 * @desc    Get user's recent activities
 * @route   GET /api/audit/user/:userId/recent
 * @access  Private (Self or Admin only)
 */
router.get('/user/:userId/recent',
  protect,
  auditController.getUserRecentActivities
);

// ===========================================================================================================================
// -------------------------------------------------- System Activity Monitoring --------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Log system-level events
 * @route   POST /api/audit/system-event
 * @access  Private (System/Admin use)
 */
router.post('/system-event',
  protect,
  authorize('Admin', 'System'),
  validateRequest,
  auditController.logSystemEvent
);

/**
 * @desc    Get system audit logs
 * @route   GET /api/audit/system
 * @access  Private (Admin only)
 */
router.get('/system',
  protect,
  authorize('Admin'),
  auditController.getSystemAuditLogs
);

/**
 * @desc    Get system health metrics
 * @route   GET /api/audit/system/health
 * @access  Private (Admin only)
 */
router.get('/system/health',
  protect,
  authorize('Admin'),
  auditController.getSystemHealthMetrics
);

/**
 * @desc    Get system performance metrics
 * @route   GET /api/audit/system/performance
 * @access  Private (Admin only)
 */
router.get('/system/performance',
  protect,
  authorize('Admin'),
  auditController.getSystemPerformanceMetrics
);

/**
 * @desc    Log API access for monitoring
 * @route   POST /api/audit/api-access
 * @access  Private (Middleware use)
 */
router.post('/api-access',
  protect,
  validateRequest,
  auditController.logAPIAccess
);

/**
 * @desc    Get API access statistics
 * @route   GET /api/audit/api/statistics
 * @access  Private (Admin only)
 */
router.get('/api/statistics',
  protect,
  authorize('Admin'),
  auditController.getAPIAccessStatistics
);

/**
 * @desc    Get API usage analytics
 * @route   GET /api/audit/api/analytics
 * @access  Private (Admin only)
 */
router.get('/api/analytics',
  protect,
  authorize('Admin'),
  auditController.getAPIUsageAnalytics
);

// ===========================================================================================================================
// -------------------------------------------------- Security Monitoring ---------------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Log security events and incidents
 * @route   POST /api/audit/security-event
 * @access  Private (System/Admin use)
 */
router.post('/security-event',
  protect,
  authorize('Admin', 'System'),
  validateRequest,
  auditController.logSecurityEvent
);

/**
 * @desc    Get security events
 * @route   GET /api/audit/security/events
 * @access  Private (Admin only)
 */
router.get('/security/events',
  protect,
  authorize('Admin'),
  auditController.getSecurityEvents
);

/**
 * @desc    Get failed login attempts for security analysis
 * @route   GET /api/audit/security/failed-logins
 * @access  Private (Admin only)
 */
router.get('/security/failed-logins',
  protect,
  authorize('Admin'),
  auditController.getFailedLoginAttempts
);

/**
 * @desc    Get suspicious activities
 * @route   GET /api/audit/security/suspicious-activities
 * @access  Private (Admin only)
 */
router.get('/security/suspicious-activities',
  protect,
  authorize('Admin'),
  auditController.getSuspiciousActivities
);

/**
 * @desc    Get permission and role changes for audit
 * @route   GET /api/audit/security/permission-changes
 * @access  Private (Admin only)
 */
router.get('/security/permission-changes',
  protect,
  authorize('Admin'),
  auditController.getPermissionChanges
);

/**
 * @desc    Get security alerts
 * @route   GET /api/audit/security/alerts
 * @access  Private (Admin only)
 */
router.get('/security/alerts',
  protect,
  authorize('Admin'),
  auditController.getSecurityAlerts
);

/**
 * @desc    Acknowledge security alert
 * @route   PUT /api/audit/security/alerts/:alertId/acknowledge
 * @access  Private (Admin only)
 */
router.put('/security/alerts/:alertId/acknowledge',
  protect,
  authorize('Admin'),
  validateRequest,
  auditController.acknowledgeSecurityAlert
);

/**
 * @desc    Get security dashboard data
 * @route   GET /api/audit/security/dashboard
 * @access  Private (Admin only)
 */
router.get('/security/dashboard',
  protect,
  authorize('Admin'),
  auditController.getSecurityDashboard
);

// ===========================================================================================================================
// -------------------------------------------------- Data Protection & Privacy -----------------------------------------
// ===========================================================================================================================

/**
 * @desc    Log data access for privacy compliance
 * @route   POST /api/audit/data-access
 * @access  Private (Middleware use)
 */
router.post('/data-access',
  protect,
  validateRequest,
  auditController.logDataAccess
);

/**
 * @desc    Get data access logs
 * @route   GET /api/audit/data-access/logs
 * @access  Private (Admin/Compliance only)
 */
router.get('/data-access/logs',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getDataAccessLogs
);

/**
 * @desc    Get data modification logs for audit trail
 * @route   GET /api/audit/data-modifications
 * @access  Private (Admin/Compliance only)
 */
router.get('/data-modifications',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getDataModificationLogs
);

/**
 * @desc    Log data export activities for compliance
 * @route   POST /api/audit/data-export
 * @access  Private (Middleware use)
 */
router.post('/data-export',
  protect,
  validateRequest,
  auditController.logExportActivities
);

/**
 * @desc    Get data export logs
 * @route   GET /api/audit/data-export/logs
 * @access  Private (Admin/Compliance only)
 */
router.get('/data-export/logs',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getDataExportLogs
);

/**
 * @desc    Get GDPR compliance report
 * @route   GET /api/audit/compliance/gdpr
 * @access  Private (Admin/Compliance only)
 */
router.get('/compliance/gdpr',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getGDPRComplianceReport
);

/**
 * @desc    Get data retention compliance
 * @route   GET /api/audit/compliance/retention
 * @access  Private (Admin/Compliance only)
 */
router.get('/compliance/retention',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getDataRetentionCompliance
);

/**
 * @desc    Get privacy audit trail
 * @route   GET /api/audit/privacy/trail/:userId
 * @access  Private (Self or Admin/Compliance only)
 */
router.get('/privacy/trail/:userId',
  protect,
  auditController.getPrivacyAuditTrail
);

// ===========================================================================================================================
// -------------------------------------------------- Interview Audit Tracking ----------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Log interview activity
 * @route   POST /api/audit/interview/:interviewId/activity
 * @access  Private
 */
router.post('/interview/:interviewId/activity',
  protect,
  validateRequest,
  auditController.logInterviewActivity
);

/**
 * @desc    Get interview audit logs
 * @route   GET /api/audit/interview/:interviewId/logs
 * @access  Private (Participants or Admin)
 */
router.get('/interview/:interviewId/logs',
  protect,
  auditController.getInterviewAuditLogs
);

/**
 * @desc    Get interview access history
 * @route   GET /api/audit/interview/:interviewId/access-history
 * @access  Private (Admin/HR only)
 */
router.get('/interview/:interviewId/access-history',
  protect,
  authorize('Admin', 'HR'),
  auditController.getInterviewAccessHistory
);

/**
 * @desc    Get interview completion audit
 * @route   GET /api/audit/interview/:interviewId/completion
 * @access  Private (Admin/HR only)
 */
router.get('/interview/:interviewId/completion',
  protect,
  authorize('Admin', 'HR'),
  auditController.getInterviewCompletionAudit
);

/**
 * @desc    Log interview scoring activity
 * @route   POST /api/audit/interview/:interviewId/scoring
 * @access  Private (Interviewer only)
 */
router.post('/interview/:interviewId/scoring',
  protect,
  validateRequest,
  auditController.logInterviewScoringActivity
);

/**
 * @desc    Get interview evaluation audit
 * @route   GET /api/audit/interview/:interviewId/evaluation
 * @access  Private (Admin/HR only)
 */
router.get('/interview/:interviewId/evaluation',
  protect,
  authorize('Admin', 'HR'),
  auditController.getInterviewEvaluationAudit
);

// ===========================================================================================================================
// -------------------------------------------------- Compliance Reporting --------------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Generate compliance report
 * @route   POST /api/audit/compliance/report
 * @access  Private (Admin/Compliance only)
 */
router.post('/compliance/report',
  protect,
  authorize('Admin', 'Compliance'),
  validateRequest,
  auditController.generateComplianceReport
);

/**
 * @desc    Get compliance dashboard
 * @route   GET /api/audit/compliance/dashboard
 * @access  Private (Admin/Compliance only)
 */
router.get('/compliance/dashboard',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getComplianceDashboard
);

/**
 * @desc    Get audit trail for specific entity
 * @route   GET /api/audit/trail/:entityType/:entityId
 * @access  Private (Admin/Compliance only)
 */
router.get('/trail/:entityType/:entityId',
  protect,
  authorize('Admin', 'Compliance'),
  auditController.getEntityAuditTrail
);

/**
 * @desc    Validate data integrity
 * @route   POST /api/audit/integrity/validate
 * @access  Private (Admin only)
 */
router.post('/integrity/validate',
  protect,
  authorize('Admin'),
  validateRequest,
  auditController.validateDataIntegrity
);

/**
 * @desc    Get integrity violations
 * @route   GET /api/audit/integrity/violations
 * @access  Private (Admin only)
 */
router.get('/integrity/violations',
  protect,
  authorize('Admin'),
  auditController.getIntegrityViolations
);

// ===========================================================================================================================
// -------------------------------------------------- Advanced Analytics ----------------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Get audit analytics dashboard
 * @route   GET /api/audit/analytics/dashboard
 * @access  Private (Admin only)
 */
router.get('/analytics/dashboard',
  protect,
  authorize('Admin'),
  auditController.getAuditAnalyticsDashboard
);

/**
 * @desc    Get trend analysis
 * @route   GET /api/audit/analytics/trends
 * @access  Private (Admin only)
 */
router.get('/analytics/trends',
  protect,
  authorize('Admin'),
  auditController.getTrendAnalysis
);

/**
 * @desc    Get anomaly detection results
 * @route   GET /api/audit/analytics/anomalies
 * @access  Private (Admin only)
 */
router.get('/analytics/anomalies',
  protect,
  authorize('Admin'),
  auditController.getAnomalyDetection
);

/**
 * @desc    Get risk assessment report
 * @route   GET /api/audit/analytics/risk-assessment
 * @access  Private (Admin only)
 */
router.get('/analytics/risk-assessment',
  protect,
  authorize('Admin'),
  auditController.getRiskAssessmentReport
);

/**
 * @desc    Get behavioral patterns
 * @route   GET /api/audit/analytics/behavioral-patterns
 * @access  Private (Admin only)
 */
router.get('/analytics/behavioral-patterns',
  protect,
  authorize('Admin'),
  auditController.getBehavioralPatterns
);

// ===========================================================================================================================
// -------------------------------------------------- Audit Configuration ---------------------------------------------------
// ===========================================================================================================================

/**
 * @desc    Get audit configuration
 * @route   GET /api/audit/config
 * @access  Private (Admin only)
 */
router.get('/config',
  protect,
  authorize('Admin'),
  auditController.getAuditConfiguration
);

/**
 * @desc    Update audit configuration
 * @route   PUT /api/audit/config
 * @access  Private (Admin only)
 */
router.put('/config',
  protect,
  authorize('Admin'),
  validateRequest,
  auditController.updateAuditConfiguration
);

/**
 * @desc    Get audit retention policies
 * @route   GET /api/audit/config/retention
 * @access  Private (Admin only)
 */
router.get('/config/retention',
  protect,
  authorize('Admin'),
  auditController.getAuditRetentionPolicies
);

/**
 * @desc    Update audit retention policies
 * @route   PUT /api/audit/config/retention
 * @access  Private (Admin only)
 */
router.put('/config/retention',
  protect,
  authorize('Admin'),
  validateRequest,
  auditController.updateAuditRetentionPolicies
);

/**
 * @desc    Archive old audit logs
 * @route   POST /api/audit/maintenance/archive
 * @access  Private (Admin only)
 */
router.post('/maintenance/archive',
  protect,
  authorize('Admin'),
  validateRequest,
  auditController.archiveOldAuditLogs
);

/**
 * @desc    Purge archived logs
 * @route   DELETE /api/audit/maintenance/purge
 * @access  Private (Admin only)
 */
router.delete('/maintenance/purge',
  protect,
  authorize('Admin'),
  validateRequest,
  auditController.purgeArchivedLogs
);

module.exports = router;
