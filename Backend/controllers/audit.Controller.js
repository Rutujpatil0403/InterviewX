const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs').promises;

// Import models
const User = require('../models/User');
const Interview = require('../models/Interview');

// Import utilities
const AppError = require('../utils/AppError');

// ===========================================================================================================================
// ================================================ Audit Controller =========================================================
// ===========================================================================================================================

class AuditController {

  // ===========================================================================================================================
  // -------------------------------------------------- Core Audit Operations -------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Create audit log entry
   * @route   POST /api/audit/log
   * @access  Private (System/Admin use)
   */
  createAuditLog = asyncHandler(async (req, res) => {
    const {
      eventType,
      category,
      severity = 'info',
      description,
      targetUserId = null,
      targetResourceId = null,
      targetResourceType = null,
      metadata = {},
      ipAddress = null,
      userAgent = null
    } = req.body;

    // Validate required fields
    if (!eventType || !category || !description) {
      throw new AppError('Event type, category, and description are required', 400);
    }

    // Create audit log entry
    const auditLog = {
      _id: new mongoose.Types.ObjectId(),
      eventId: crypto.randomUUID(),
      eventType,
      category,
      severity,
      description,
      userId: req.user?.userId || null,
      userName: req.user?.name || 'System',
      userRole: req.user?.role || 'System',
      targetUserId,
      targetResourceId,
      targetResourceType,
      timestamp: new Date(),
      ipAddress: ipAddress || req.ip || null,
      userAgent: userAgent || req.get('User-Agent') || null,
      sessionId: req.sessionID || null,
      metadata: {
        ...metadata,
        requestId: req.headers['x-request-id'] || crypto.randomUUID(),
        correlationId: req.headers['x-correlation-id'] || null,
        source: 'api',
        environment: process.env.NODE_ENV || 'development'
      },
      createdAt: new Date()
    };

    // Save audit log
    await this.saveAuditLog(auditLog);

    // For high-severity events, trigger alerts
    if (['critical', 'high'].includes(severity)) {
      await this.triggerSecurityAlert(auditLog);
    }

    res.status(201).json({
      success: true,
      message: 'Audit log created successfully',
      data: {
        eventId: auditLog.eventId,
        eventType: auditLog.eventType,
        category: auditLog.category,
        severity: auditLog.severity,
        timestamp: auditLog.timestamp,
        description: auditLog.description
      }
    });
  });

  /**
   * @desc    Get audit logs with filtering and pagination
   * @route   GET /api/audit/logs
   * @access  Private (Admin/Compliance only)
   */
  getAuditLogs = asyncHandler(async (req, res) => {
    // Only admins and compliance roles can access audit logs
    if (!['Admin', 'Compliance'].includes(req.user.role)) {
      throw new AppError('Not authorized to access audit logs', 403);
    }

    const {
      page = 1,
      limit = 50,
      category = null,
      eventType = null,
      severity = null,
      userId = null,
      dateFrom = null,
      dateTo = null,
      search = null,
      sortBy = 'timestamp',
      sortOrder = 'desc'
    } = req.query;

    // Build filter criteria
    const filters = {};
    
    if (category) filters.category = category;
    if (eventType) filters.eventType = eventType;
    if (severity) filters.severity = severity;
    if (userId) filters.userId = userId;
    
    if (dateFrom || dateTo) {
      filters.timestamp = {};
      if (dateFrom) filters.timestamp.$gte = new Date(dateFrom);
      if (dateTo) filters.timestamp.$lte = new Date(dateTo);
    }

    if (search) {
      filters.$or = [
        { description: { $regex: search, $options: 'i' } },
        { userName: { $regex: search, $options: 'i' } },
        { eventType: { $regex: search, $options: 'i' } }
      ];
    }

    // Get audit logs
    const auditLogs = await this.queryAuditLogs(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    });

    // Get total count for pagination
    const totalLogs = await this.countAuditLogs(filters);
    const totalPages = Math.ceil(totalLogs / limit);

    // Format response
    const formattedLogs = auditLogs.map(log => ({
      eventId: log.eventId,
      eventType: log.eventType,
      category: log.category,
      severity: log.severity,
      description: log.description,
      userId: log.userId,
      userName: log.userName,
      userRole: log.userRole,
      targetUserId: log.targetUserId,
      targetResourceType: log.targetResourceType,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      metadata: {
        source: log.metadata?.source,
        requestId: log.metadata?.requestId
      }
    }));

    res.status(200).json({
      success: true,
      message: 'Audit logs retrieved successfully',
      data: {
        logs: formattedLogs,
        pagination: {
          currentPage: parseInt(page),
          totalPages,
          totalLogs,
          hasNext: page < totalPages,
          hasPrevious: page > 1,
          limit: parseInt(limit)
        },
        filters: {
          category,
          eventType,
          severity,
          userId,
          dateFrom,
          dateTo,
          search
        },
        retrievedAt: new Date()
      }
    });
  });

  /**
   * @desc    Get specific audit log entry by ID
   * @route   GET /api/audit/logs/:eventId
   * @access  Private (Admin/Compliance only)
   */
  getAuditById = asyncHandler(async (req, res) => {
    const { eventId } = req.params;

    // Only admins and compliance roles can access audit logs
    if (!['Admin', 'Compliance'].includes(req.user.role)) {
      throw new AppError('Not authorized to access audit logs', 403);
    }

    // Get audit log by event ID
    const auditLog = await this.getAuditLogByEventId(eventId);
    if (!auditLog) {
      throw new AppError('Audit log not found', 404);
    }

    // Format detailed response
    const detailedLog = {
      eventId: auditLog.eventId,
      eventType: auditLog.eventType,
      category: auditLog.category,
      severity: auditLog.severity,
      description: auditLog.description,
      userId: auditLog.userId,
      userName: auditLog.userName,
      userRole: auditLog.userRole,
      targetUserId: auditLog.targetUserId,
      targetResourceId: auditLog.targetResourceId,
      targetResourceType: auditLog.targetResourceType,
      timestamp: auditLog.timestamp,
      ipAddress: auditLog.ipAddress,
      userAgent: auditLog.userAgent,
      sessionId: auditLog.sessionId,
      metadata: auditLog.metadata,
      createdAt: auditLog.createdAt
    };

    // Get related events (same session or user within timeframe)
    const relatedEvents = await this.getRelatedAuditEvents(auditLog);

    res.status(200).json({
      success: true,
      message: 'Audit log retrieved successfully',
      data: {
        auditLog: detailedLog,
        relatedEvents: relatedEvents.slice(0, 10), // Limit to 10 related events
        retrievedAt: new Date()
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- User Activity Tracking -----------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Log user action for audit trail
   * @route   POST /api/audit/user-action
   * @access  Private (Middleware use)
   */
  logUserAction = asyncHandler(async (req, res) => {
    const {
      action,
      targetResourceType = null,
      targetResourceId = null,
      changes = {},
      result = 'success',
      errorMessage = null
    } = req.body;

    if (!action) {
      throw new AppError('Action is required', 400);
    }

    // Determine severity based on action type
    const getSeverityForAction = (actionType) => {
      const highSeverityActions = ['delete', 'ban', 'permission_change', 'role_change'];
      const mediumSeverityActions = ['create', 'update', 'export', 'download'];
      
      if (highSeverityActions.some(a => actionType.toLowerCase().includes(a))) return 'high';
      if (mediumSeverityActions.some(a => actionType.toLowerCase().includes(a))) return 'medium';
      return 'info';
    };

    const severity = getSeverityForAction(action);

    // Create user action log
    const userActionLog = {
      _id: new mongoose.Types.ObjectId(),
      eventId: crypto.randomUUID(),
      eventType: 'user_action',
      category: 'user_activity',
      severity,
      description: `User performed action: ${action}`,
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      targetUserId: null,
      targetResourceId,
      targetResourceType,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      metadata: {
        action,
        changes,
        result,
        errorMessage,
        requestId: req.headers['x-request-id'] || crypto.randomUUID(),
        endpoint: req.originalUrl,
        method: req.method,
        source: 'user_action'
      },
      createdAt: new Date()
    };

    // Save user action log
    await this.saveAuditLog(userActionLog);

    res.status(201).json({
      success: true,
      message: 'User action logged successfully',
      data: {
        eventId: userActionLog.eventId,
        action,
        result,
        timestamp: userActionLog.timestamp
      }
    });
  });

  /**
   * @desc    Get user's activity history
   * @route   GET /api/audit/user/:userId
   * @access  Private (Self or Admin only)
   */
  getUserActivity = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      dateFrom = null,
      dateTo = null,
      action = null,
      category = null
    } = req.query;

    // Users can only view their own activity unless they're admin
    if (userId !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('Not authorized to view this user\'s activity', 403);
    }

    // Validate user exists
    const user = await User.findById(userId).select('name email role');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Build filters
    const filters = { userId };
    
    if (dateFrom || dateTo) {
      filters.timestamp = {};
      if (dateFrom) filters.timestamp.$gte = new Date(dateFrom);
      if (dateTo) filters.timestamp.$lte = new Date(dateTo);
    }

    if (action) filters['metadata.action'] = { $regex: action, $options: 'i' };
    if (category) filters.category = category;

    // Get user activity logs
    const activityLogs = await this.queryAuditLogs(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    const totalActivity = await this.countAuditLogs(filters);

    // Format activity data
    const formattedActivity = activityLogs.map(log => ({
      eventId: log.eventId,
      action: log.metadata?.action || log.eventType,
      description: log.description,
      targetResourceType: log.targetResourceType,
      targetResourceId: log.targetResourceId,
      result: log.metadata?.result || 'success',
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      endpoint: log.metadata?.endpoint,
      method: log.metadata?.method
    }));

    // Get activity statistics
    const activityStats = await this.getUserActivityStats(userId, dateFrom, dateTo);

    res.status(200).json({
      success: true,
      message: 'User activity retrieved successfully',
      data: {
        user: {
          userId: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        },
        activity: formattedActivity,
        statistics: activityStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalActivity / limit),
          totalActivity,
          limit: parseInt(limit)
        },
        retrievedAt: new Date()
      }
    });
  });

  /**
   * @desc    Get user session history (login/logout events)
   * @route   GET /api/audit/user/:userId/sessions
   * @access  Private (Self or Admin only)
   */
  getUserSessionHistory = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const {
      page = 1,
      limit = 20,
      dateFrom = null,
      dateTo = null
    } = req.query;

    // Users can only view their own sessions unless they're admin
    if (userId !== req.user.userId && req.user.role !== 'Admin') {
      throw new AppError('Not authorized to view this user\'s sessions', 403);
    }

    // Build filters for session events
    const filters = {
      userId,
      eventType: { $in: ['user_login', 'user_logout', 'session_expired', 'password_changed'] }
    };

    if (dateFrom || dateTo) {
      filters.timestamp = {};
      if (dateFrom) filters.timestamp.$gte = new Date(dateFrom);
      if (dateTo) filters.timestamp.$lte = new Date(dateTo);
    }

    // Get session history
    const sessionLogs = await this.queryAuditLogs(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    const totalSessions = await this.countAuditLogs(filters);

    // Format session data with device/location info
    const formattedSessions = sessionLogs.map(log => ({
      eventId: log.eventId,
      eventType: log.eventType,
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      sessionId: log.sessionId,
      deviceInfo: this.parseUserAgent(log.userAgent),
      location: log.metadata?.location || 'Unknown',
      loginMethod: log.metadata?.loginMethod || 'password',
      success: log.metadata?.result === 'success',
      failureReason: log.metadata?.errorMessage
    }));

    // Calculate session statistics
    const sessionStats = {
      totalSessions: sessionLogs.filter(s => s.eventType === 'user_login').length,
      failedLogins: sessionLogs.filter(s => s.eventType === 'user_login' && s.metadata?.result === 'failure').length,
      uniqueIPs: [...new Set(sessionLogs.map(s => s.ipAddress))].length,
      uniqueDevices: [...new Set(sessionLogs.map(s => s.userAgent))].length,
      lastLogin: sessionLogs.find(s => s.eventType === 'user_login')?.timestamp || null
    };

    res.status(200).json({
      success: true,
      message: 'User session history retrieved successfully',
      data: {
        sessions: formattedSessions,
        statistics: sessionStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalSessions / limit),
          totalSessions,
          limit: parseInt(limit)
        },
        retrievedAt: new Date()
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- System Activity Monitoring --------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Log system-level events
   * @route   POST /api/audit/system-event
   * @access  Private (System/Admin use)
   */
  logSystemEvent = asyncHandler(async (req, res) => {
    const {
      eventType,
      severity = 'info',
      description,
      component = null,
      metadata = {}
    } = req.body;

    if (!eventType || !description) {
      throw new AppError('Event type and description are required', 400);
    }

    // Create system event log
    const systemEventLog = {
      _id: new mongoose.Types.ObjectId(),
      eventId: crypto.randomUUID(),
      eventType,
      category: 'system',
      severity,
      description,
      userId: null, // System events have no user
      userName: 'System',
      userRole: 'System',
      targetUserId: null,
      targetResourceId: null,
      targetResourceType: null,
      timestamp: new Date(),
      ipAddress: null,
      userAgent: null,
      sessionId: null,
      metadata: {
        ...metadata,
        component,
        serverInfo: {
          hostname: require('os').hostname(),
          platform: process.platform,
          nodeVersion: process.version,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage()
        },
        source: 'system'
      },
      createdAt: new Date()
    };

    // Save system event log
    await this.saveAuditLog(systemEventLog);

    res.status(201).json({
      success: true,
      message: 'System event logged successfully',
      data: {
        eventId: systemEventLog.eventId,
        eventType: systemEventLog.eventType,
        severity: systemEventLog.severity,
        timestamp: systemEventLog.timestamp
      }
    });
  });

  /**
   * @desc    Get system audit logs
   * @route   GET /api/audit/system
   * @access  Private (Admin only)
   */
  getSystemAuditLogs = asyncHandler(async (req, res) => {
    // Only admins can access system logs
    if (req.user.role !== 'Admin') {
      throw new AppError('Not authorized to access system logs', 403);
    }

    const {
      page = 1,
      limit = 50,
      severity = null,
      component = null,
      dateFrom = null,
      dateTo = null,
      eventType = null
    } = req.query;

    // Build filters for system events
    const filters = { category: 'system' };
    
    if (severity) filters.severity = severity;
    if (eventType) filters.eventType = eventType;
    if (component) filters['metadata.component'] = component;
    
    if (dateFrom || dateTo) {
      filters.timestamp = {};
      if (dateFrom) filters.timestamp.$gte = new Date(dateFrom);
      if (dateTo) filters.timestamp.$lte = new Date(dateTo);
    }

    // Get system logs
    const systemLogs = await this.queryAuditLogs(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    const totalLogs = await this.countAuditLogs(filters);

    // Format system logs
    const formattedLogs = systemLogs.map(log => ({
      eventId: log.eventId,
      eventType: log.eventType,
      severity: log.severity,
      description: log.description,
      component: log.metadata?.component,
      timestamp: log.timestamp,
      serverInfo: log.metadata?.serverInfo,
      metadata: log.metadata
    }));

    // Get system health summary
    const systemHealth = await this.getSystemHealthSummary();

    res.status(200).json({
      success: true,
      message: 'System audit logs retrieved successfully',
      data: {
        logs: formattedLogs,
        systemHealth,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalLogs / limit),
          totalLogs,
          limit: parseInt(limit)
        },
        retrievedAt: new Date()
      }
    });
  });

  /**
   * @desc    Log API access for monitoring
   * @route   POST /api/audit/api-access
   * @access  Private (Middleware use)
   */
  logAPIAccess = asyncHandler(async (req, res) => {
    const {
      endpoint,
      method,
      responseStatus,
      responseTime,
      requestSize = 0,
      responseSize = 0
    } = req.body;

    if (!endpoint || !method || !responseStatus) {
      throw new AppError('Endpoint, method, and response status are required', 400);
    }

    // Determine severity based on status code
    const getSeverityForStatus = (status) => {
      if (status >= 500) return 'high';
      if (status >= 400) return 'medium';
      if (status >= 300) return 'low';
      return 'info';
    };

    // Create API access log
    const apiAccessLog = {
      _id: new mongoose.Types.ObjectId(),
      eventId: crypto.randomUUID(),
      eventType: 'api_access',
      category: 'api',
      severity: getSeverityForStatus(responseStatus),
      description: `API ${method} ${endpoint} - ${responseStatus}`,
      userId: req.user?.userId || null,
      userName: req.user?.name || 'Anonymous',
      userRole: req.user?.role || 'Guest',
      targetUserId: null,
      targetResourceId: null,
      targetResourceType: 'api_endpoint',
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      metadata: {
        endpoint,
        method,
        responseStatus,
        responseTime,
        requestSize,
        responseSize,
        requestHeaders: req.headers,
        queryParams: req.query,
        source: 'api_access'
      },
      createdAt: new Date()
    };

    // Save API access log
    await this.saveAuditLog(apiAccessLog);

    res.status(201).json({
      success: true,
      message: 'API access logged successfully',
      data: {
        eventId: apiAccessLog.eventId,
        endpoint,
        method,
        responseStatus,
        timestamp: apiAccessLog.timestamp
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Security Monitoring ---------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Log security events and incidents
   * @route   POST /api/audit/security-event
   * @access  Private (System/Admin use)
   */
  logSecurityEvent = asyncHandler(async (req, res) => {
    const {
      securityEventType,
      severity = 'high',
      description,
      targetUserId = null,
      threat = null,
      actionTaken = null,
      metadata = {}
    } = req.body;

    if (!securityEventType || !description) {
      throw new AppError('Security event type and description are required', 400);
    }

    // Create security event log
    const securityLog = {
      _id: new mongoose.Types.ObjectId(),
      eventId: crypto.randomUUID(),
      eventType: 'security_incident',
      category: 'security',
      severity,
      description,
      userId: req.user?.userId || null,
      userName: req.user?.name || 'System',
      userRole: req.user?.role || 'System',
      targetUserId,
      targetResourceId: null,
      targetResourceType: 'security',
      timestamp: new Date(),
      ipAddress: req.ip || metadata.ipAddress,
      userAgent: req.get('User-Agent') || metadata.userAgent,
      sessionId: req.sessionID,
      metadata: {
        ...metadata,
        securityEventType,
        threat,
        actionTaken,
        riskLevel: this.calculateRiskLevel(securityEventType, severity),
        source: 'security_monitoring'
      },
      createdAt: new Date()
    };

    // Save security log
    await this.saveAuditLog(securityLog);

    // Trigger immediate security alert for critical events
    if (severity === 'critical') {
      await this.triggerSecurityAlert(securityLog);
    }

    res.status(201).json({
      success: true,
      message: 'Security event logged successfully',
      data: {
        eventId: securityLog.eventId,
        securityEventType,
        severity,
        riskLevel: securityLog.metadata.riskLevel,
        timestamp: securityLog.timestamp
      }
    });
  });

  /**
   * @desc    Get failed login attempts for security analysis
   * @route   GET /api/audit/security/failed-logins
   * @access  Private (Admin only)
   */
  getFailedLoginAttempts = asyncHandler(async (req, res) => {
    // Only admins can access security analytics
    if (req.user.role !== 'Admin') {
      throw new AppError('Not authorized to access security analytics', 403);
    }

    const {
      hours = 24,
      groupBy = 'ip',
      threshold = 5
    } = req.query;

    const timeFrame = new Date(Date.now() - (parseInt(hours) * 60 * 60 * 1000));

    // Get failed login attempts
    const filters = {
      eventType: 'user_login',
      'metadata.result': 'failure',
      timestamp: { $gte: timeFrame }
    };

    const failedLogins = await this.queryAuditLogs(filters, {
      limit: 1000,
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    // Group and analyze failed attempts
    const groupedAttempts = {};
    const suspiciousActivity = [];

    failedLogins.forEach(attempt => {
      const key = groupBy === 'ip' ? attempt.ipAddress : attempt.userId || 'anonymous';
      
      if (!groupedAttempts[key]) {
        groupedAttempts[key] = {
          key,
          count: 0,
          attempts: [],
          firstAttempt: attempt.timestamp,
          lastAttempt: attempt.timestamp,
          uniqueUsers: new Set(),
          patterns: {}
        };
      }

      groupedAttempts[key].count++;
      groupedAttempts[key].attempts.push({
        timestamp: attempt.timestamp,
        userId: attempt.userId,
        ipAddress: attempt.ipAddress,
        userAgent: attempt.userAgent,
        reason: attempt.metadata?.errorMessage
      });

      if (attempt.timestamp > groupedAttempts[key].lastAttempt) {
        groupedAttempts[key].lastAttempt = attempt.timestamp;
      }

      if (attempt.userId) {
        groupedAttempts[key].uniqueUsers.add(attempt.userId);
      }
    });

    // Identify suspicious activity
    Object.values(groupedAttempts).forEach(group => {
      if (group.count >= threshold) {
        suspiciousActivity.push({
          ...group,
          uniqueUsers: Array.from(group.uniqueUsers),
          riskLevel: group.count >= threshold * 2 ? 'high' : 'medium',
          timeSpan: group.lastAttempt - group.firstAttempt
        });
      }
    });

    // Calculate security metrics
    const securityMetrics = {
      totalFailedAttempts: failedLogins.length,
      uniqueIPs: [...new Set(failedLogins.map(f => f.ipAddress))].length,
      uniqueUsers: [...new Set(failedLogins.map(f => f.userId).filter(Boolean))].length,
      suspiciousActivityCount: suspiciousActivity.length,
      highRiskIPs: suspiciousActivity.filter(s => s.riskLevel === 'high').length,
      timeFrame: `Last ${hours} hours`
    };

    res.status(200).json({
      success: true,
      message: 'Failed login attempts retrieved successfully',
      data: {
        suspiciousActivity: suspiciousActivity.slice(0, 20), // Top 20 suspicious
        metrics: securityMetrics,
        allAttempts: groupedAttempts,
        analysis: {
          threshold,
          timeFrame: `${hours} hours`,
          groupBy,
          generatedAt: new Date()
        }
      }
    });
  });

  /**
   * @desc    Get permission and role changes for audit
   * @route   GET /api/audit/security/permission-changes
   * @access  Private (Admin only)
   */
  getPermissionChanges = asyncHandler(async (req, res) => {
    // Only admins can access permission audit
    if (req.user.role !== 'Admin') {
      throw new AppError('Not authorized to access permission audit', 403);
    }

    const {
      page = 1,
      limit = 50,
      dateFrom = null,
      dateTo = null,
      targetUserId = null
    } = req.query;

    // Build filters for permission-related events
    const filters = {
      eventType: { $in: ['role_changed', 'permission_granted', 'permission_revoked', 'user_promoted', 'user_demoted'] }
    };

    if (dateFrom || dateTo) {
      filters.timestamp = {};
      if (dateFrom) filters.timestamp.$gte = new Date(dateFrom);
      if (dateTo) filters.timestamp.$lte = new Date(dateTo);
    }

    if (targetUserId) {
      filters.targetUserId = targetUserId;
    }

    // Get permission change logs
    const permissionChanges = await this.queryAuditLogs(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    const totalChanges = await this.countAuditLogs(filters);

    // Format permission changes with details
    const formattedChanges = await Promise.all(
      permissionChanges.map(async (change) => {
        const targetUser = change.targetUserId ? 
          await User.findById(change.targetUserId).select('name email role') : null;

        return {
          eventId: change.eventId,
          eventType: change.eventType,
          description: change.description,
          performedBy: {
            userId: change.userId,
            name: change.userName,
            role: change.userRole
          },
          targetUser: targetUser ? {
            userId: targetUser._id,
            name: targetUser.name,
            email: targetUser.email,
            currentRole: targetUser.role
          } : null,
          changes: change.metadata?.changes || {},
          previousState: change.metadata?.previousState || {},
          newState: change.metadata?.newState || {},
          timestamp: change.timestamp,
          ipAddress: change.ipAddress
        };
      })
    );

    // Get permission change statistics
    const changeStats = {
      totalChanges: totalChanges,
      roleChanges: permissionChanges.filter(c => c.eventType.includes('role')).length,
      permissionGrants: permissionChanges.filter(c => c.eventType === 'permission_granted').length,
      permissionRevocations: permissionChanges.filter(c => c.eventType === 'permission_revoked').length,
      uniqueAdmins: [...new Set(permissionChanges.map(c => c.userId))].length,
      uniqueTargets: [...new Set(permissionChanges.map(c => c.targetUserId).filter(Boolean))].length
    };

    res.status(200).json({
      success: true,
      message: 'Permission changes retrieved successfully',
      data: {
        changes: formattedChanges,
        statistics: changeStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalChanges / limit),
          totalChanges,
          limit: parseInt(limit)
        },
        retrievedAt: new Date()
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Data Protection & Privacy -----------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Log data access for privacy compliance
   * @route   POST /api/audit/data-access
   * @access  Private (Middleware use)
   */
  logDataAccess = asyncHandler(async (req, res) => {
    const {
      dataType,
      operation,
      recordId = null,
      fieldAccessed = null,
      purpose = null,
      legalBasis = null
    } = req.body;

    if (!dataType || !operation) {
      throw new AppError('Data type and operation are required', 400);
    }

    // Create data access log
    const dataAccessLog = {
      _id: new mongoose.Types.ObjectId(),
      eventId: crypto.randomUUID(),
      eventType: 'data_access',
      category: 'data_protection',
      severity: 'info',
      description: `Data access: ${operation} on ${dataType}`,
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      targetUserId: null,
      targetResourceId: recordId,
      targetResourceType: dataType,
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      metadata: {
        dataType,
        operation,
        recordId,
        fieldAccessed,
        purpose,
        legalBasis,
        dataClassification: this.classifyDataSensitivity(dataType, fieldAccessed),
        complianceFlags: this.getComplianceFlags(dataType, operation),
        source: 'data_access_monitoring'
      },
      createdAt: new Date()
    };

    // Save data access log
    await this.saveAuditLog(dataAccessLog);

    res.status(201).json({
      success: true,
      message: 'Data access logged successfully',
      data: {
        eventId: dataAccessLog.eventId,
        dataType,
        operation,
        timestamp: dataAccessLog.timestamp,
        dataClassification: dataAccessLog.metadata.dataClassification
      }
    });
  });

  /**
   * @desc    Get data modification logs for audit trail
   * @route   GET /api/audit/data-modifications
   * @access  Private (Admin/Compliance only)
   */
  getDataModificationLogs = asyncHandler(async (req, res) => {
    // Only admins and compliance roles can access data modification logs
    if (!['Admin', 'Compliance'].includes(req.user.role)) {
      throw new AppError('Not authorized to access data modification logs', 403);
    }

    const {
      page = 1,
      limit = 50,
      dataType = null,
      userId = null,
      dateFrom = null,
      dateTo = null,
      operation = null
    } = req.query;

    // Build filters for data modification events
    const filters = {
      category: 'data_protection',
      'metadata.operation': { $in: ['create', 'update', 'delete'] }
    };

    if (dataType) filters['metadata.dataType'] = dataType;
    if (userId) filters.userId = userId;
    if (operation) filters['metadata.operation'] = operation;

    if (dateFrom || dateTo) {
      filters.timestamp = {};
      if (dateFrom) filters.timestamp.$gte = new Date(dateFrom);
      if (dateTo) filters.timestamp.$lte = new Date(dateTo);
    }

    // Get data modification logs
    const modificationLogs = await this.queryAuditLogs(filters, {
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy: 'timestamp',
      sortOrder: 'desc'
    });

    const totalModifications = await this.countAuditLogs(filters);

    // Format modification logs
    const formattedLogs = modificationLogs.map(log => ({
      eventId: log.eventId,
      dataType: log.metadata?.dataType,
      operation: log.metadata?.operation,
      recordId: log.targetResourceId,
      fieldAccessed: log.metadata?.fieldAccessed,
      user: {
        userId: log.userId,
        name: log.userName,
        role: log.userRole
      },
      timestamp: log.timestamp,
      ipAddress: log.ipAddress,
      purpose: log.metadata?.purpose,
      legalBasis: log.metadata?.legalBasis,
      dataClassification: log.metadata?.dataClassification,
      complianceFlags: log.metadata?.complianceFlags
    }));

    // Calculate data modification statistics
    const modificationStats = {
      totalModifications,
      byOperation: {
        create: modificationLogs.filter(l => l.metadata?.operation === 'create').length,
        update: modificationLogs.filter(l => l.metadata?.operation === 'update').length,
        delete: modificationLogs.filter(l => l.metadata?.operation === 'delete').length
      },
      byDataType: {},
      uniqueUsers: [...new Set(modificationLogs.map(l => l.userId))].length,
      sensitiveDataAccess: modificationLogs.filter(l => 
        l.metadata?.dataClassification === 'sensitive' || 
        l.metadata?.dataClassification === 'restricted'
      ).length
    };

    // Group by data type
    modificationLogs.forEach(log => {
      const dataType = log.metadata?.dataType || 'unknown';
      modificationStats.byDataType[dataType] = (modificationStats.byDataType[dataType] || 0) + 1;
    });

    res.status(200).json({
      success: true,
      message: 'Data modification logs retrieved successfully',
      data: {
        modifications: formattedLogs,
        statistics: modificationStats,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(totalModifications / limit),
          totalModifications,
          limit: parseInt(limit)
        },
        retrievedAt: new Date()
      }
    });
  });

  /**
   * @desc    Log data export activities for compliance
   * @route   POST /api/audit/data-export
   * @access  Private (Middleware use)
   */
  logExportActivities = asyncHandler(async (req, res) => {
    const {
      exportType,
      dataTypes = [],
      recordCount = 0,
      format = null,
      purpose = null,
      recipientInfo = null
    } = req.body;

    if (!exportType) {
      throw new AppError('Export type is required', 400);
    }

    // Create export activity log
    const exportLog = {
      _id: new mongoose.Types.ObjectId(),
      eventId: crypto.randomUUID(),
      eventType: 'data_export',
      category: 'data_protection',
      severity: 'medium', // Data exports are always medium severity for compliance
      description: `Data export: ${exportType} (${recordCount} records)`,
      userId: req.user.userId,
      userName: req.user.name,
      userRole: req.user.role,
      targetUserId: null,
      targetResourceId: null,
      targetResourceType: 'data_export',
      timestamp: new Date(),
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID,
      metadata: {
        exportType,
        dataTypes,
        recordCount,
        format,
        purpose,
        recipientInfo,
        exportSize: req.body.exportSize || null,
        retentionPeriod: req.body.retentionPeriod || null,
        complianceNotes: req.body.complianceNotes || null,
        source: 'data_export_monitoring'
      },
      createdAt: new Date()
    };

    // Save export log
    await this.saveAuditLog(exportLog);

    res.status(201).json({
      success: true,
      message: 'Data export activity logged successfully',
      data: {
        eventId: exportLog.eventId,
        exportType,
        recordCount,
        timestamp: exportLog.timestamp
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Helper Methods --------------------------------------------------------
  // ===========================================================================================================================

  /**
   * Parse User Agent string for device information
   */
  parseUserAgent = (userAgent) => {
    if (!userAgent) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
    
    // Simple user agent parsing (would use a proper library like 'useragent' in production)
    const browser = userAgent.includes('Chrome') ? 'Chrome' :
                   userAgent.includes('Firefox') ? 'Firefox' :
                   userAgent.includes('Safari') ? 'Safari' :
                   userAgent.includes('Edge') ? 'Edge' : 'Unknown';
    
    const os = userAgent.includes('Windows') ? 'Windows' :
              userAgent.includes('Mac') ? 'macOS' :
              userAgent.includes('Linux') ? 'Linux' :
              userAgent.includes('Android') ? 'Android' :
              userAgent.includes('iOS') ? 'iOS' : 'Unknown';
    
    const device = userAgent.includes('Mobile') ? 'Mobile' :
                  userAgent.includes('Tablet') ? 'Tablet' : 'Desktop';
    
    return { browser, os, device };
  };

  /**
   * Calculate risk level for security events
   */
  calculateRiskLevel = (eventType, severity) => {
    const highRiskEvents = ['brute_force', 'unauthorized_access', 'data_breach', 'privilege_escalation'];
    const mediumRiskEvents = ['failed_login', 'suspicious_activity', 'rate_limit_exceeded'];
    
    if (severity === 'critical' || highRiskEvents.includes(eventType)) return 'critical';
    if (severity === 'high' || mediumRiskEvents.includes(eventType)) return 'high';
    if (severity === 'medium') return 'medium';
    return 'low';
  };

  /**
   * Classify data sensitivity for compliance
   */
  classifyDataSensitivity = (dataType, field) => {
    const restrictedData = ['ssn', 'credit_card', 'bank_account', 'passport'];
    const sensitiveData = ['email', 'phone', 'address', 'salary', 'medical'];
    const internalData = ['employee_id', 'department', 'manager'];
    
    if (restrictedData.some(r => (dataType + field).toLowerCase().includes(r))) return 'restricted';
    if (sensitiveData.some(s => (dataType + field).toLowerCase().includes(s))) return 'sensitive';
    if (internalData.some(i => (dataType + field).toLowerCase().includes(i))) return 'internal';
    return 'public';
  };

  /**
   * Get compliance flags for data operations
   */
  getComplianceFlags = (dataType, operation) => {
    const flags = [];
    
    if (['user', 'candidate', 'employee'].includes(dataType)) {
      flags.push('GDPR_APPLICABLE');
    }
    
    if (operation === 'delete') {
      flags.push('RIGHT_TO_ERASURE');
    }
    
    if (operation === 'export') {
      flags.push('DATA_PORTABILITY');
    }
    
    return flags;
  };

  /**
   * Mock database operations (would be replaced with actual database calls)
   */
  saveAuditLog = async (auditLog) => {
    // Would save to AuditLog collection
    console.log('Saving audit log:', auditLog.eventId);
    return auditLog;
  };

  queryAuditLogs = async (filters, options) => {
    // Would query AuditLog collection with filters and pagination
    console.log('Querying audit logs:', filters, options);
    return []; // Mock empty array
  };

  countAuditLogs = async (filters) => {
    // Would count matching audit logs
    console.log('Counting audit logs:', filters);
    return 0;
  };

  getAuditLogByEventId = async (eventId) => {
    // Would get specific audit log by event ID
    console.log('Getting audit log by event ID:', eventId);
    return null;
  };

  getRelatedAuditEvents = async (auditLog) => {
    // Would find related audit events
    return [];
  };

  getUserActivityStats = async (userId, dateFrom, dateTo) => {
    // Would calculate user activity statistics
    return {
      totalActions: 0,
      loginCount: 0,
      lastActivity: null,
      mostActiveHour: null,
      deviceCount: 0
    };
  };

  getSystemHealthSummary = async () => {
    // Would get system health metrics
    return {
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      errorRate: 0,
      responseTime: 0
    };
  };

  triggerSecurityAlert = async (auditLog) => {
    // Would trigger security alert notifications
    console.log('Security alert triggered for event:', auditLog.eventId);
    return true;
  };
}

module.exports = new AuditController();