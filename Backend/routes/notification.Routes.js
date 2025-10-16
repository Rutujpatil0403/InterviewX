const express = require('express');
const router = express.Router();

// Import middleware
const { authenticateToken, requireRole } = require('../middleware/auth');
const {
  validateNotificationCreation,
  validateNotificationUpdate,
  validateBroadcastNotification,
  validateNotificationPreferences,
  validateNotificationId,
  handleValidationErrors
} = require('../middleware/validate');

// Import controller
const notificationController = require('../controllers/notification.Controller');

// ===========================================================================================================================
// =================================================== Core Notification Routes =============================================
// ===========================================================================================================================

/**
 * @route   POST /api/notifications
 * @desc    Create a new notification
 * @access  Private (Users can create notifications for themselves, Admins for anyone)
 * @body    { recipientId, title, message, type?, category?, priority?, actionUrl?, metadata? }
 */
router.post('/',
  authenticateToken,
  validateNotificationCreation,
  handleValidationErrors,
  notificationController.createNotification
);

/**
 * @route   GET /api/notifications
 * @desc    Get all notifications for the authenticated user
 * @access  Private
 * @query   { page?, limit?, category?, type?, isRead?, priority?, sortBy?, sortOrder? }
 */
router.get('/',
  authenticateToken,
  notificationController.getAllNotifications
);

/**
 * @route   GET /api/notifications/unread-count
 * @desc    Get count of unread notifications
 * @access  Private
 * @query   { category?, type?, priority? }
 */
router.get('/unread-count',
  authenticateToken,
  notificationController.getUnreadCount
);

/**
 * @route   GET /api/notifications/categories
 * @desc    Get available notification categories and types
 * @access  Private
 */
router.get('/categories',
  authenticateToken,
  notificationController.getNotificationCategories
);

/**
 * @route   GET /api/notifications/statistics
 * @desc    Get notification statistics for the user
 * @access  Private (Admins can specify userId)
 * @query   { period?, userId?, category?, type? }
 */
router.get('/statistics',
  authenticateToken,
  notificationController.getNotificationStatistics
);

/**
 * @route   GET /api/notifications/:id
 * @desc    Get a specific notification by ID
 * @access  Private (Own notifications only, unless Admin)
 */
router.get('/:id',
  authenticateToken,
  validateNotificationId,
  handleValidationErrors,
  notificationController.getNotificationById
);

/**
 * @route   PATCH /api/notifications/:id/read
 * @desc    Mark a notification as read
 * @access  Private (Own notifications only)
 */
router.patch('/:id/read',
  authenticateToken,
  validateNotificationId,
  handleValidationErrors,
  notificationController.markAsRead
);

/**
 * @route   PATCH /api/notifications/mark-all-read
 * @desc    Mark all notifications as read
 * @access  Private
 * @body    { category?, type? }
 */
router.patch('/mark-all-read',
  authenticateToken,
  notificationController.markAllAsRead
);

/**
 * @route   DELETE /api/notifications/:id
 * @desc    Delete a notification
 * @access  Private (Own notifications only, unless Admin)
 */
router.delete('/:id',
  authenticateToken,
  validateNotificationId,
  handleValidationErrors,
  notificationController.deleteNotification
);

// ===========================================================================================================================
// =================================================== Real-time & Broadcasting Routes ===================================
// ===========================================================================================================================

/**
 * @route   POST /api/notifications/broadcast
 * @desc    Broadcast notification to multiple users
 * @access  Admin only
 * @body    { title, message, targetRoles?, type?, category?, priority?, actionUrl?, metadata? }
 */
router.post('/broadcast',
  authenticateToken,
  requireRole(['Admin']),
  validateBroadcastNotification,
  handleValidationErrors,
  notificationController.broadcastNotification
);

/**
 * @route   POST /api/notifications/system
 * @desc    Send system notification to users by role
 * @access  Admin only
 * @body    { targetRole?, title, message, priority?, actionUrl?, metadata? }
 */
router.post('/system',
  authenticateToken,
  requireRole(['Admin']),
  validateBroadcastNotification,
  handleValidationErrors,
  notificationController.sendSystemNotification
);

// ===========================================================================================================================
// =================================================== Email Integration Routes ==========================================
// ===========================================================================================================================

/**
 * @route   POST /api/notifications/email
 * @desc    Send email notification
 * @access  Private (Users can send to themselves, Admins to anyone)
 * @body    { recipientEmail OR recipientId, subject, message, template?, metadata? }
 */
router.post('/email',
  authenticateToken,
  validateNotificationCreation,
  handleValidationErrors,
  notificationController.sendEmailNotification
);

/**
 * @route   POST /api/notifications/email/queue
 * @desc    Queue batch email notifications
 * @access  Admin only
 * @body    { recipientIds, subject, message, template?, scheduleTime?, metadata? }
 */
router.post('/email/queue',
  authenticateToken,
  requireRole(['Admin']),
  validateBroadcastNotification,
  handleValidationErrors,
  notificationController.queueEmailNotifications
);

/**
 * @route   GET /api/notifications/:id/email-status
 * @desc    Get email delivery status for a notification
 * @access  Private (Own notifications only, unless Admin)
 */
router.get('/:id/email-status',
  authenticateToken,
  validateNotificationId,
  handleValidationErrors,
  notificationController.getEmailDeliveryStatus
);

// ===========================================================================================================================
// =================================================== User Preferences Routes ===========================================
// ===========================================================================================================================

/**
 * @route   GET /api/notifications/preferences
 * @desc    Get notification preferences for current user
 * @access  Private
 */
router.get('/preferences',
  authenticateToken,
  notificationController.getUserPreferences
);

/**
 * @route   PUT /api/notifications/preferences
 * @desc    Update notification preferences for current user
 * @access  Private
 * @body    { email?, push?, categories?, doNotDisturb? }
 */
router.put('/preferences',
  authenticateToken,
  validateNotificationPreferences,
  handleValidationErrors,
  notificationController.updatePreferences
);

/**
 * @route   GET /api/notifications/preferences/:userId
 * @desc    Get notification preferences for a specific user (Admin only)
 * @access  Admin only
 */
router.get('/preferences/:userId',
  authenticateToken,
  requireRole(['Admin']),
  notificationController.getUserPreferences
);

/**
 * @route   PUT /api/notifications/preferences/:userId
 * @desc    Update notification preferences for a specific user (Admin only)
 * @access  Admin only
 * @body    { email?, push?, categories?, doNotDisturb? }
 */
router.put('/preferences/:userId',
  authenticateToken,
  requireRole(['Admin']),
  validateNotificationPreferences,
  handleValidationErrors,
  notificationController.updatePreferences
);

// ===========================================================================================================================
// =================================================== Management & Testing Routes =====================================
// ===========================================================================================================================

/**
 * @route   POST /api/notifications/test
 * @desc    Send a test notification
 * @access  Private
 * @body    { recipientId?, title?, message?, type?, category?, priority? }
 */
router.post('/test',
  authenticateToken,
  validateNotificationCreation,
  handleValidationErrors,
  notificationController.sendTestNotification
);

/**
 * @route   DELETE /api/notifications/cleanup
 * @desc    Clean up old notifications (Admin only)
 * @access  Admin only
 * @body    { olderThanDays?, category?, onlyRead? }
 */
router.delete('/cleanup',
  authenticateToken,
  requireRole(['Admin']),
  notificationController.cleanupOldNotifications
);

// ===========================================================================================================================
// =================================================== Interview Specific Routes ======================================
// ===========================================================================================================================

/**
 * @route   POST /api/notifications/interview-reminder
 * @desc    Trigger interview reminder notification
 * @access  Admin, Recruiter
 * @body    { interviewId, reminderType?, customMessage? }
 */
router.post('/interview-reminder',
  authenticateToken,
  requireRole(['Admin', 'Recruiter']),
  notificationController.triggerInterviewReminder
);

// ===========================================================================================================================
// =================================================== Export Routes =====================================================
// ===========================================================================================================================

module.exports = router;
