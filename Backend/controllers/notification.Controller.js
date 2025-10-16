const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Import models
const Notification = require('../models/Notification');
const User = require('../models/User');
const Interview = require('../models/Interview');
const Evaluation = require('../models/Evaluation');

// Import utilities
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ===========================================================================================================================
// ================================================ Notification Controller =================================================
// ===========================================================================================================================

class NotificationController {

  // ===========================================================================================================================
  // -------------------------------------------------- Core Notification Management ------------------------------------------
  // ===========================================================================================================================

  createNotification = asyncHandler(async (req, res) => {
    const {
      recipientId,
      title,
      message,
      type = 'info',
      category = 'general',
      priority = 'normal',
      actionUrl,
      metadata = {}
    } = req.body;

    // Validate recipient exists
    const recipient = await User.findById(recipientId);
    if (!recipient) {
      throw new AppError('Recipient not found', 404);
    }

    // Only admins can send notifications to other users, users can only send to themselves
    if (req.user.role !== 'Admin' && recipientId !== req.user.userId) {
      throw new AppError('You can only create notifications for yourself', 403);
    }

    const notification = await Notification.create({
      recipientId,
      senderId: req.user.userId,
      title,
      message,
      type,
      category,
      priority,
      actionUrl,
      metadata,
      isRead: false,
      createdAt: new Date()
    });

    // Send real-time notification if WebSocket is available
    await this.sendRealtimeNotification(notification);

    logger.info('Notification created', {
      notificationId: notification._id,
      recipientId,
      senderId: req.user.userId,
      type,
      category
    });

    res.status(201).json({
      success: true,
      message: 'Notification created successfully',
      data: { notification }
    });
  });

  getAllNotifications = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 20,
      category,
      type,
      isRead,
      priority,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query for user's notifications
    const query = { recipientId: req.user.userId };

    // Apply filters
    if (category) query.category = category;
    if (type) query.type = type;
    if (isRead !== undefined) query.isRead = isRead === 'true';
    if (priority) query.priority = priority;

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .populate('senderId', 'username email role')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: req.user.userId, isRead: false })
    ]);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalNotifications: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        },
        summary: {
          totalNotifications: total,
          unreadCount,
          readCount: total - unreadCount
        }
      }
    });
  });

  getNotificationById = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId)
      .populate('senderId', 'username email role')
      .populate('recipientId', 'username email role');

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    // Check if user can access this notification
    if (notification.recipientId._id.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('You can only access your own notifications', 403);
    }

    res.status(200).json({
      success: true,
      data: { notification }
    });
  });

  markAsRead = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    // Check if user owns this notification
    if (notification.recipientId.toString() !== req.user.userId) {
      throw new AppError('You can only mark your own notifications as read', 403);
    }

    if (notification.isRead) {
      return res.status(200).json({
        success: true,
        message: 'Notification is already marked as read',
        data: { notification }
      });
    }

    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();

    logger.info('Notification marked as read', {
      notificationId,
      userId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: 'Notification marked as read',
      data: { notification }
    });
  });

  markAllAsRead = asyncHandler(async (req, res) => {
    const { category, type } = req.body;

    // Build query for user's unread notifications
    const query = {
      recipientId: req.user.userId,
      isRead: false
    };

    // Apply optional filters
    if (category) query.category = category;
    if (type) query.type = type;

    const result = await Notification.updateMany(
      query,
      {
        isRead: true,
        readAt: new Date()
      }
    );

    logger.info('Multiple notifications marked as read', {
      userId: req.user.userId,
      modifiedCount: result.modifiedCount,
      filters: { category, type }
    });

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notifications marked as read`,
      data: {
        modifiedCount: result.modifiedCount,
        filters: { category, type }
      }
    });
  });

  deleteNotification = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    // Check if user owns this notification or is admin
    if (notification.recipientId.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('You can only delete your own notifications', 403);
    }

    await Notification.findByIdAndDelete(notificationId);

    logger.info('Notification deleted', {
      notificationId,
      deletedBy: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: 'Notification deleted successfully'
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Real-time Operations --------------------------------------------------
  // ===========================================================================================================================

  sendRealtimeNotification = async (notification) => {
    try {
      // In a real implementation, this would integrate with WebSocket service
      // For now, we'll simulate the real-time notification
      const realtimePayload = {
        id: notification._id,
        recipientId: notification.recipientId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        actionUrl: notification.actionUrl,
        createdAt: notification.createdAt,
        timestamp: new Date()
      };

      // Simulate WebSocket emission
      logger.info('Real-time notification sent', {
        notificationId: notification._id,
        recipientId: notification.recipientId,
        type: notification.type
      });

      return realtimePayload;
    } catch (error) {
      logger.error('Failed to send real-time notification:', error);
      return null;
    }
  };

  broadcastNotification = asyncHandler(async (req, res) => {
    const {
      recipientIds = [],
      title,
      message,
      type = 'info',
      category = 'system',
      priority = 'normal',
      actionUrl,
      metadata = {}
    } = req.body;

    // Only admins can broadcast notifications
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can broadcast notifications', 403);
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      throw new AppError('Recipient IDs array is required', 400);
    }

    // Validate all recipients exist
    const recipients = await User.find({ _id: { $in: recipientIds } });
    if (recipients.length !== recipientIds.length) {
      throw new AppError('Some recipient IDs are invalid', 400);
    }

    // Create notifications for all recipients
    const notificationPromises = recipientIds.map(recipientId =>
      Notification.create({
        recipientId,
        senderId: req.user.userId,
        title,
        message,
        type,
        category,
        priority,
        actionUrl,
        metadata,
        isRead: false,
        createdAt: new Date()
      })
    );

    const notifications = await Promise.all(notificationPromises);

    // Send real-time notifications
    const realtimePromises = notifications.map(notification =>
      this.sendRealtimeNotification(notification)
    );
    await Promise.all(realtimePromises);

    logger.info('Broadcast notification sent', {
      senderId: req.user.userId,
      recipientCount: recipientIds.length,
      type,
      category
    });

    res.status(201).json({
      success: true,
      message: `Notification broadcast to ${recipientIds.length} users`,
      data: {
        notificationCount: notifications.length,
        recipients: recipientIds
      }
    });
  });

  sendSystemNotification = asyncHandler(async (req, res) => {
    const {
      targetRole = 'all',
      title,
      message,
      priority = 'high',
      actionUrl,
      metadata = {}
    } = req.body;

    // Only admins can send system notifications
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can send system notifications', 403);
    }

    // Build user query based on target role
    const userQuery = targetRole === 'all' ? {} : { role: targetRole };
    const users = await User.find(userQuery).select('_id');

    if (users.length === 0) {
      throw new AppError('No users found for the specified role', 404);
    }

    // Create system notifications for all target users
    const notificationPromises = users.map(user =>
      Notification.create({
        recipientId: user._id,
        senderId: req.user.userId,
        title,
        message,
        type: 'system',
        category: 'system',
        priority,
        actionUrl,
        metadata: {
          ...metadata,
          isSystemNotification: true,
          targetRole
        },
        isRead: false,
        createdAt: new Date()
      })
    );

    const notifications = await Promise.all(notificationPromises);

    // Send real-time notifications
    const realtimePromises = notifications.map(notification =>
      this.sendRealtimeNotification(notification)
    );
    await Promise.all(realtimePromises);

    logger.info('System notification sent', {
      senderId: req.user.userId,
      targetRole,
      recipientCount: users.length,
      priority
    });

    res.status(201).json({
      success: true,
      message: `System notification sent to ${users.length} users`,
      data: {
        notificationCount: notifications.length,
        targetRole,
        recipientCount: users.length
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Email Integration -----------------------------------------------------
  // ===========================================================================================================================

  sendEmailNotification = asyncHandler(async (req, res) => {
    const {
      recipientEmail,
      recipientId,
      subject,
      message,
      template = 'default',
      metadata = {}
    } = req.body;

    let recipient;
    if (recipientId) {
      recipient = await User.findById(recipientId);
      if (!recipient) {
        throw new AppError('Recipient not found', 404);
      }
    } else if (recipientEmail) {
      recipient = await User.findOne({ email: recipientEmail });
      if (!recipient) {
        throw new AppError('User with this email not found', 404);
      }
    } else {
      throw new AppError('Either recipientId or recipientEmail is required', 400);
    }

    // Check permissions
    if (req.user.role !== 'Admin' && recipient._id.toString() !== req.user.userId) {
      throw new AppError('You can only send emails to yourself', 403);
    }

    // Simulate email sending (in real implementation, would integrate with email service)
    const emailResult = await this.simulateEmailDelivery({
      to: recipient.email,
      subject,
      message,
      template,
      metadata: {
        ...metadata,
        recipientId: recipient._id,
        senderId: req.user.userId,
        sentAt: new Date()
      }
    });

    // Create notification record
    const notification = await Notification.create({
      recipientId: recipient._id,
      senderId: req.user.userId,
      title: subject,
      message,
      type: 'email',
      category: 'email',
      priority: 'normal',
      metadata: {
        ...metadata,
        emailDeliveryId: emailResult.deliveryId,
        emailStatus: emailResult.status,
        template
      },
      isRead: false,
      createdAt: new Date()
    });

    logger.info('Email notification sent', {
      notificationId: notification._id,
      recipientEmail: recipient.email,
      senderId: req.user.userId,
      deliveryId: emailResult.deliveryId
    });

    res.status(200).json({
      success: true,
      message: 'Email notification sent successfully',
      data: {
        notification,
        emailDelivery: emailResult
      }
    });
  });

  queueEmailNotifications = asyncHandler(async (req, res) => {
    const {
      recipientIds = [],
      subject,
      message,
      template = 'default',
      scheduleTime,
      metadata = {}
    } = req.body;

    // Only admins can queue batch emails
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can queue batch email notifications', 403);
    }

    if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
      throw new AppError('Recipient IDs array is required', 400);
    }

    // Validate recipients
    const recipients = await User.find({ _id: { $in: recipientIds } });
    if (recipients.length !== recipientIds.length) {
      throw new AppError('Some recipient IDs are invalid', 400);
    }

    const scheduledTime = scheduleTime ? new Date(scheduleTime) : new Date();

    // Create queued email records
    const queuedEmails = await Promise.all(
      recipients.map(recipient =>
        Notification.create({
          recipientId: recipient._id,
          senderId: req.user.userId,
          title: subject,
          message,
          type: 'email',
          category: 'email',
          priority: 'normal',
          metadata: {
            ...metadata,
            isQueued: true,
            scheduledTime,
            template,
            recipientEmail: recipient.email
          },
          isRead: false,
          createdAt: new Date()
        })
      )
    );

    logger.info('Email notifications queued', {
      senderId: req.user.userId,
      recipientCount: recipients.length,
      scheduledTime,
      template
    });

    res.status(201).json({
      success: true,
      message: `${recipients.length} email notifications queued successfully`,
      data: {
        queuedCount: queuedEmails.length,
        scheduledTime,
        recipients: recipients.map(r => ({
          id: r._id,
          email: r.email,
          name: r.name
        }))
      }
    });
  });

  getEmailDeliveryStatus = asyncHandler(async (req, res) => {
    const { notificationId } = req.params;

    const notification = await Notification.findById(notificationId);

    if (!notification) {
      throw new AppError('Notification not found', 404);
    }

    // Check permissions
    if (notification.recipientId.toString() !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('You can only check delivery status of your own notifications', 403);
    }

    if (notification.type !== 'email') {
      throw new AppError('This notification is not an email notification', 400);
    }

    // Simulate delivery status check
    const deliveryStatus = {
      notificationId,
      emailDeliveryId: notification.metadata?.emailDeliveryId,
      status: notification.metadata?.emailStatus || 'unknown',
      recipientEmail: notification.metadata?.recipientEmail,
      sentAt: notification.metadata?.sentAt,
      deliveredAt: notification.metadata?.deliveredAt,
      openedAt: notification.metadata?.openedAt,
      clickedAt: notification.metadata?.clickedAt,
      lastChecked: new Date()
    };

    res.status(200).json({
      success: true,
      data: { deliveryStatus }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- User Preferences ------------------------------------------------------
  // ===========================================================================================================================

  getUserPreferences = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;

    // Check permissions
    if (targetUserId !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('You can only access your own notification preferences', 403);
    }

    const user = await User.findById(targetUserId).select('notificationPreferences');
    
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Default preferences if none exist
    const defaultPreferences = {
      email: {
        interviewReminders: true,
        evaluationAlerts: true,
        systemNotifications: true,
        weeklyDigest: false
      },
      push: {
        interviewReminders: true,
        evaluationAlerts: true,
        systemNotifications: false,
        instantMessages: true
      },
      categories: {
        interview: true,
        evaluation: true,
        system: true,
        general: true,
        security: true
      },
      frequency: {
        immediate: true,
        digest: false,
        weekly: false
      },
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
        timezone: 'UTC'
      }
    };

    const preferences = user.notificationPreferences || defaultPreferences;

    res.status(200).json({
      success: true,
      data: {
        userId: targetUserId,
        preferences,
        lastUpdated: user.notificationPreferencesUpdated || user.createdAt
      }
    });
  });

  updatePreferences = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const targetUserId = userId || req.user.userId;
    const { preferences } = req.body;

    // Check permissions
    if (targetUserId !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('You can only update your own notification preferences', 403);
    }

    if (!preferences || typeof preferences !== 'object') {
      throw new AppError('Valid preferences object is required', 400);
    }

    const user = await User.findById(targetUserId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Update preferences
    user.notificationPreferences = {
      ...user.notificationPreferences,
      ...preferences
    };
    user.notificationPreferencesUpdated = new Date();

    await user.save();

    logger.info('Notification preferences updated', {
      userId: targetUserId,
      updatedBy: req.user.userId,
      preferences: Object.keys(preferences)
    });

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        userId: targetUserId,
        preferences: user.notificationPreferences,
        lastUpdated: user.notificationPreferencesUpdated
      }
    });
  });

  getNotificationCategories = asyncHandler(async (req, res) => {
    const categories = [
      {
        id: 'interview',
        name: 'Interview Related',
        description: 'Notifications about interview scheduling, reminders, and updates',
        defaultEnabled: true
      },
      {
        id: 'evaluation',
        name: 'Evaluation & Feedback',
        description: 'Notifications about evaluation results and feedback',
        defaultEnabled: true
      },
      {
        id: 'system',
        name: 'System Notifications',
        description: 'Important system updates and maintenance notifications',
        defaultEnabled: true
      },
      {
        id: 'security',
        name: 'Security Alerts',
        description: 'Security-related notifications and alerts',
        defaultEnabled: true
      },
      {
        id: 'general',
        name: 'General',
        description: 'General platform updates and information',
        defaultEnabled: false
      },
      {
        id: 'email',
        name: 'Email Notifications',
        description: 'Email-based notifications and newsletters',
        defaultEnabled: false
      }
    ];

    const notificationTypes = [
      { id: 'info', name: 'Information', color: '#007bff' },
      { id: 'success', name: 'Success', color: '#28a745' },
      { id: 'warning', name: 'Warning', color: '#ffc107' },
      { id: 'error', name: 'Error', color: '#dc3545' },
      { id: 'system', name: 'System', color: '#6c757d' }
    ];

    const priorities = [
      { id: 'low', name: 'Low Priority', urgency: 1 },
      { id: 'normal', name: 'Normal Priority', urgency: 2 },
      { id: 'high', name: 'High Priority', urgency: 3 },
      { id: 'urgent', name: 'Urgent', urgency: 4 }
    ];

    res.status(200).json({
      success: true,
      data: {
        categories,
        types: notificationTypes,
        priorities
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Analytics & Management ------------------------------------------------
  // ===========================================================================================================================

  getNotificationStatistics = asyncHandler(async (req, res) => {
    const { period = '30d', userId, category, type } = req.query;

    // Only admins can view other users' statistics
    const targetUserId = userId && req.user.role === 'Admin' ? userId : req.user.userId;

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    
    switch (period) {
      case '7d':
        startDate.setDate(endDate.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(endDate.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(endDate.getDate() - 90);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }

    // Build query
    const query = {
      recipientId: targetUserId,
      createdAt: { $gte: startDate, $lte: endDate }
    };

    if (category) query.category = category;
    if (type) query.type = type;

    const [
      totalStats,
      categoryStats,
      typeStats,
      dailyStats,
      readStats
    ] = await Promise.all([
      // Total statistics
      Notification.aggregate([
        { $match: query },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            read: { $sum: { $cond: ['$isRead', 1, 0] } },
            unread: { $sum: { $cond: ['$isRead', 0, 1] } }
          }
        }
      ]),

      // Category breakdown
      Notification.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            readCount: { $sum: { $cond: ['$isRead', 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Type breakdown
      Notification.aggregate([
        { $match: query },
        {
          $group: {
            _id: '$type',
            count: { $sum: 1 },
            readCount: { $sum: { $cond: ['$isRead', 1, 0] } }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Daily statistics
      Notification.aggregate([
        { $match: query },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 },
            readCount: { $sum: { $cond: ['$isRead', 1, 0] } }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
      ]),

      // Read rate statistics
      Notification.aggregate([
        { $match: { recipientId: targetUserId } },
        {
          $group: {
            _id: null,
            avgReadTime: {
              $avg: {
                $cond: [
                  { $and: ['$isRead', '$readAt'] },
                  { $subtract: ['$readAt', '$createdAt'] },
                  null
                ]
              }
            },
            totalNotifications: { $sum: 1 },
            readNotifications: { $sum: { $cond: ['$isRead', 1, 0] } }
          }
        }
      ])
    ]);

    const statistics = {
      period,
      dateRange: { startDate, endDate },
      totals: totalStats[0] || { total: 0, read: 0, unread: 0 },
      readRate: readStats[0] ? {
        percentage: ((readStats[0].readNotifications / readStats[0].totalNotifications) * 100).toFixed(2),
        averageReadTime: readStats[0].avgReadTime ? Math.round(readStats[0].avgReadTime / (1000 * 60)) : null // in minutes
      } : { percentage: 0, averageReadTime: null },
      breakdown: {
        byCategory: categoryStats,
        byType: typeStats
      },
      timeline: dailyStats.map(day => ({
        date: `${day._id.year}-${day._id.month.toString().padStart(2, '0')}-${day._id.day.toString().padStart(2, '0')}`,
        count: day.count,
        readCount: day.readCount,
        readRate: ((day.readCount / day.count) * 100).toFixed(2)
      }))
    };

    res.status(200).json({
      success: true,
      data: { statistics }
    });
  });

  getUnreadCount = asyncHandler(async (req, res) => {
    const { category, type, priority } = req.query;

    // Build query
    const query = {
      recipientId: req.user.userId,
      isRead: false
    };

    if (category) query.category = category;
    if (type) query.type = type;
    if (priority) query.priority = priority;

    const [totalUnread, categoryBreakdown] = await Promise.all([
      Notification.countDocuments(query),
      Notification.aggregate([
        { $match: { recipientId: mongoose.Types.ObjectId(req.user.userId), isRead: false } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            highPriority: { $sum: { $cond: [{ $in: ['$priority', ['high', 'urgent']] }, 1, 0] } }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        totalUnread,
        filters: { category, type, priority },
        breakdown: categoryBreakdown.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            highPriority: item.highPriority
          };
          return acc;
        }, {})
      }
    });
  });

  cleanupOldNotifications = asyncHandler(async (req, res) => {
    const { olderThanDays = 90, category, onlyRead = true } = req.body;

    // Only admins can perform cleanup
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can perform notification cleanup', 403);
    }

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));

    // Build query
    const query = {
      createdAt: { $lt: cutoffDate }
    };

    if (category) query.category = category;
    if (onlyRead) query.isRead = true;

    const deleteResult = await Notification.deleteMany(query);

    logger.info('Notification cleanup completed', {
      performedBy: req.user.userId,
      deletedCount: deleteResult.deletedCount,
      olderThanDays,
      category,
      onlyRead
    });

    res.status(200).json({
      success: true,
      message: `Cleanup completed: ${deleteResult.deletedCount} notifications deleted`,
      data: {
        deletedCount: deleteResult.deletedCount,
        criteria: {
          olderThanDays,
          category,
          onlyRead,
          cutoffDate
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Integration Hooks -----------------------------------------------------
  // ===========================================================================================================================

  triggerInterviewReminder = async (interviewId, reminderType = 'upcoming') => {
    try {
      const interview = await Interview.findById(interviewId)
        .populate('candidateId', 'name email')
        .populate('recruiterId', 'name email');

      if (!interview) {
        throw new Error('Interview not found');
      }

      const reminderMessages = {
        upcoming: {
          title: 'Interview Reminder',
          message: `Your interview "${interview.title}" is scheduled for ${new Date(interview.scheduledAt).toLocaleString()}`,
          priority: 'normal'
        },
        soon: {
          title: 'Interview Starting Soon',
          message: `Your interview "${interview.title}" starts in 15 minutes`,
          priority: 'high'
        },
        overdue: {
          title: 'Interview Overdue',
          message: `Your interview "${interview.title}" was scheduled for ${new Date(interview.scheduledAt).toLocaleString()}`,
          priority: 'urgent'
        }
      };

      const reminder = reminderMessages[reminderType];

      // Send to candidate
      const candidateNotification = await Notification.create({
        recipientId: interview.candidateId._id,
        title: reminder.title,
        message: reminder.message,
        type: 'info',
        category: 'interview',
        priority: reminder.priority,
        actionUrl: `/interviews/${interviewId}`,
        metadata: {
          interviewId,
          reminderType,
          scheduledAt: interview.scheduledAt
        }
      });

      // Send to interviewer
      const interviewerNotification = await Notification.create({
        recipientId: interview.recruiterId._id,
        title: reminder.title,
        message: reminder.message.replace('Your interview', 'Interview'),
        type: 'info',
        category: 'interview',
        priority: reminder.priority,
        actionUrl: `/interviews/${interviewId}`,
        metadata: {
          interviewId,
          reminderType,
          scheduledAt: interview.scheduledAt,
          candidateId: interview.candidateId._id
        }
      });

      // Send real-time notifications
      await Promise.all([
        this.sendRealtimeNotification(candidateNotification),
        this.sendRealtimeNotification(interviewerNotification)
      ]);

      logger.info('Interview reminder sent', {
        interviewId,
        reminderType,
        candidateId: interview.candidateId._id,
        recruiterId: interview.recruiterId._id
      });

      return {
        success: true,
        candidateNotification,
        interviewerNotification
      };
    } catch (error) {
      logger.error('Failed to send interview reminder:', error);
      throw error;
    }
  };

  triggerEvaluationAlert = async (evaluationId, alertType = 'completed') => {
    try {
      const evaluation = await Evaluation.findById(evaluationId)
        .populate('candidateId', 'name email')
        .populate('evaluatorId', 'name email')
        .populate('interviewId', 'title');

      if (!evaluation) {
        throw new Error('Evaluation not found');
      }

      const alertMessages = {
        completed: {
          title: 'Evaluation Completed',
          message: `Evaluation for interview "${evaluation.interviewId.title}" has been completed`,
          priority: 'normal'
        },
        updated: {
          title: 'Evaluation Updated',
          message: `Evaluation for interview "${evaluation.interviewId.title}" has been updated`,
          priority: 'normal'
        },
        reminder: {
          title: 'Evaluation Pending',
          message: `Please complete the evaluation for interview "${evaluation.interviewId.title}"`,
          priority: 'high'
        }
      };

      const alert = alertMessages[alertType];

      // Send to candidate (for completed evaluations)
      if (alertType === 'completed') {
        const candidateNotification = await Notification.create({
          recipientId: evaluation.candidateId._id,
          title: 'Your Evaluation is Ready',
          message: `Your evaluation for interview "${evaluation.interviewId.title}" is now available`,
          type: 'success',
          category: 'evaluation',
          priority: alert.priority,
          actionUrl: `/evaluations/${evaluationId}`,
          metadata: {
            evaluationId,
            interviewId: evaluation.interviewId._id,
            alertType
          }
        });

        await this.sendRealtimeNotification(candidateNotification);
      }

      // Send to evaluator/admin
      const evaluatorNotification = await Notification.create({
        recipientId: evaluation.evaluatorId._id,
        title: alert.title,
        message: alert.message,
        type: alertType === 'completed' ? 'success' : 'info',
        category: 'evaluation',
        priority: alert.priority,
        actionUrl: `/evaluations/${evaluationId}`,
        metadata: {
          evaluationId,
          interviewId: evaluation.interviewId._id,
          candidateId: evaluation.candidateId._id,
          alertType
        }
      });

      await this.sendRealtimeNotification(evaluatorNotification);

      logger.info('Evaluation alert sent', {
        evaluationId,
        alertType,
        candidateId: evaluation.candidateId._id,
        evaluatorId: evaluation.evaluatorId._id
      });

      return {
        success: true,
        evaluatorNotification,
        candidateNotification: alertType === 'completed' ? true : false
      };
    } catch (error) {
      logger.error('Failed to send evaluation alert:', error);
      throw error;
    }
  };

  triggerSystemAlert = async (alertData) => {
    try {
      const {
        title,
        message,
        severity = 'info',
        targetRole = 'Admin',
        actionUrl,
        metadata = {}
      } = alertData;

      // Find target users
      const users = await User.find({ role: targetRole }).select('_id');

      if (users.length === 0) {
        throw new Error(`No users found with role: ${targetRole}`);
      }

      // Create system alert notifications
      const notificationPromises = users.map(user =>
        Notification.create({
          recipientId: user._id,
          title,
          message,
          type: 'system',
          category: 'system',
          priority: severity === 'critical' ? 'urgent' : severity === 'warning' ? 'high' : 'normal',
          actionUrl,
          metadata: {
            ...metadata,
            isSystemAlert: true,
            severity,
            targetRole
          }
        })
      );

      const notifications = await Promise.all(notificationPromises);

      // Send real-time notifications
      const realtimePromises = notifications.map(notification =>
        this.sendRealtimeNotification(notification)
      );
      await Promise.all(realtimePromises);

      logger.info('System alert sent', {
        title,
        severity,
        targetRole,
        recipientCount: users.length
      });

      return {
        success: true,
        notificationCount: notifications.length,
        targetRole,
        severity
      };
    } catch (error) {
      logger.error('Failed to send system alert:', error);
      throw error;
    }
  };

  // ===========================================================================================================================
  // -------------------------------------------------- Utility Methods -------------------------------------------------------
  // ===========================================================================================================================

  simulateEmailDelivery = async (emailData) => {
    // Simulate email service integration
    const deliveryId = `email_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Simulate delivery status
    const deliveryStatuses = ['sent', 'delivered', 'failed'];
    const status = deliveryStatuses[Math.floor(Math.random() * deliveryStatuses.length)];

    return {
      deliveryId,
      status,
      timestamp: new Date(),
      recipient: emailData.to,
      subject: emailData.subject
    };
  };

  // Test notification endpoint
  sendTestNotification = asyncHandler(async (req, res) => {
    const {
      recipientId = req.user.userId,
      title = 'Test Notification',
      message = 'This is a test notification to verify the system is working correctly.',
      type = 'info',
      category = 'test',
      priority = 'normal'
    } = req.body;

    // Create test notification
    const notification = await Notification.create({
      recipientId,
      senderId: req.user.userId,
      title,
      message,
      type,
      category,
      priority,
      metadata: {
        isTestNotification: true,
        generatedAt: new Date()
      }
    });

    // Send real-time notification
    await this.sendRealtimeNotification(notification);

    logger.info('Test notification sent', {
      notificationId: notification._id,
      recipientId,
      senderId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Test notification sent successfully',
      data: { notification }
    });
  });
}

// Export the controller instance
module.exports = new NotificationController();