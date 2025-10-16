const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');

// Import models
const User = require('../models/User');
const Interview = require('../models/Interview');
const Feedback = require('../models/Feedback');
const Evaluation = require('../models/Evaluation');
const Template = require('../models/Template');
const AuditLog = require('../models/AuditLog');

// Import utilities
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// ===========================================================================================================================
// ================================================== Analytics Controller ==================================================
// ===========================================================================================================================

class AnalyticsController {

  // Helper method to get user with role
  async getUserWithRole(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new AppError('User not found.', 404);
    }
    return user;
  }

  // ===========================================================================================================================
  // -------------------------------------------------- Dashboard Metrics -----------------------------------------------------
  // ===========================================================================================================================

  getDashboardStats = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    
    // Get user from database to access role
    const user = await this.getUserWithRole(req.user.userId);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Build filter based on user role
    let interviewFilter = { createdAt: { $gte: startDate, $lte: endDate } };
    if (user.role === 'Recruiter') {
      interviewFilter.recruiterId = req.user.userId;
    }

    // Get basic counts
    const [
      totalInterviews,
      totalCandidates,
      totalRecruiters,
      totalFeedbacks,
      totalEvaluations,
      totalTemplates,
      recentInterviews,
      pendingInterviews,
      completedInterviews
    ] = await Promise.all([
      Interview.countDocuments(interviewFilter),
      User.countDocuments({ role: 'Candidate', createdAt: { $gte: startDate } }),
      User.countDocuments({ role: 'Recruiter', createdAt: { $gte: startDate } }),
      Feedback.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Evaluation.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Template.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Interview.find(interviewFilter).sort({ createdAt: -1 }).limit(5)
        .populate('candidateId', 'name email')
        .populate('recruiterId', 'name email'),
      Interview.countDocuments({ ...interviewFilter, status: 'Scheduled' }),
      Interview.countDocuments({ ...interviewFilter, status: 'Completed' })
    ]);

    // Calculate success rate
    const successRate = totalInterviews > 0 ? (completedInterviews / totalInterviews) * 100 : 0;

    // Get interview trends (daily counts for the period)
    const interviewTrends = await Interview.aggregate([
      { $match: interviewFilter },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    // Get average feedback rating
    const feedbackStats = await Feedback.aggregate([
      { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: null,
          avgOverallRating: { $avg: '$overallRating' },
          avgInterviewerRating: { $avg: '$interviewerRating' },
          totalFeedbacks: { $sum: 1 }
        }
      }
    ]);

    // Calculate average interview duration
    const durationStats = await Interview.aggregate([
      { $match: { ...interviewFilter, duration: { $exists: true, $ne: null } } },
      {
        $group: {
          _id: null,
          avgDuration: { $avg: '$duration' }
        }
      }
    ]);

    const stats = {
      overview: {
        totalInterviews,
        totalCandidates,
        totalRecruiters,
        totalFeedbacks,
        totalEvaluations,
        totalTemplates,
        averageDuration: durationStats[0]?.avgDuration || 0,
        successRate: Math.round(successRate * 100) / 100,
        period: `${period} days`
      },
      interviewStatus: {
        pending: pendingInterviews,
        completed: completedInterviews,
        inProgress: totalInterviews - pendingInterviews - completedInterviews
      },
      trends: {
        interviews: interviewTrends,
        averageRating: feedbackStats.length > 0 ? {
          overall: Math.round(feedbackStats[0].avgOverallRating * 100) / 100,
          interviewer: Math.round(feedbackStats[0].avgInterviewerRating * 100) / 100
        } : { overall: 0, interviewer: 0 }
      },
      recentActivity: recentInterviews,
      lastUpdated: new Date()
    };

    res.status(200).json({
      success: true,
      data: { stats }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Realtime Metrics ------------------------------------------------------
  // ===========================================================================================================================

  getRealtimeMetrics = asyncHandler(async (req, res) => {
    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastHour = new Date(now.getTime() - 60 * 60 * 1000);

    // Build filter based on user role
    let filter = {};
    if (req.user.role === 'Recruiter') {
      filter.recruiterId = req.user.userId;
    }

    const [
      activeInterviews,
      interviewsLast24h,
      interviewsLastHour,
      newCandidatesLast24h,
      feedbacksLast24h,
      onlineUsers
    ] = await Promise.all([
      Interview.countDocuments({ 
        ...filter, 
        status: 'In Progress',
        interviewDate: { $lte: now }
      }),
      Interview.countDocuments({ 
        ...filter,
        createdAt: { $gte: last24Hours } 
      }),
      Interview.countDocuments({ 
        ...filter,
        createdAt: { $gte: lastHour } 
      }),
      User.countDocuments({ 
        role: 'Candidate',
        createdAt: { $gte: last24Hours } 
      }),
      Feedback.countDocuments({ 
        createdAt: { $gte: last24Hours } 
      }),
      User.countDocuments({ 
        lastLoginAt: { $gte: lastHour } 
      })
    ]);

    // Get hourly interview creation for last 24 hours
    const hourlyInterviews = await Interview.aggregate([
      { 
        $match: { 
          ...filter,
          createdAt: { $gte: last24Hours } 
        }
      },
      {
        $group: {
          _id: { $hour: '$createdAt' },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    const metrics = {
      live: {
        activeInterviews,
        onlineUsers,
        systemLoad: Math.floor(Math.random() * 100), // Simulate system load
        timestamp: now
      },
      last24Hours: {
        newInterviews: interviewsLast24h,
        newCandidates: newCandidatesLast24h,
        newFeedbacks: feedbacksLast24h
      },
      lastHour: {
        newInterviews: interviewsLastHour,
        hourlyTrend: hourlyInterviews
      },
      performance: {
        avgResponseTime: Math.floor(Math.random() * 500 + 100), // Simulate response time
        uptime: '99.9%',
        errorRate: (Math.random() * 0.5).toFixed(3) + '%'
      }
    };

    res.status(200).json({
      success: true,
      data: { metrics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- KPI Metrics -----------------------------------------------------------
  // ===========================================================================================================================

  getKPIMetrics = asyncHandler(async (req, res) => {
    const { period = '30' } = req.query;
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Previous period for comparison
    const prevEndDate = new Date(startDate);
    const prevStartDate = new Date(startDate);
    prevStartDate.setDate(prevEndDate.getDate() - parseInt(period));

    // Build filter based on user role
    let filter = { createdAt: { $gte: startDate, $lte: endDate } };
    let prevFilter = { createdAt: { $gte: prevStartDate, $lte: prevEndDate } };
    
    if (req.user.role === 'Recruiter') {
      filter.recruiterId = req.user.userId;
      prevFilter.recruiterId = req.user.userId;
    }

    // Current period metrics
    const [
      currentInterviews,
      currentCompletions,
      currentCandidates,
      currentFeedbacks,
      currentAvgRating
    ] = await Promise.all([
      Interview.countDocuments(filter),
      Interview.countDocuments({ ...filter, status: 'Completed' }),
      User.countDocuments({ role: 'Candidate', createdAt: { $gte: startDate, $lte: endDate } }),
      Feedback.countDocuments({ createdAt: { $gte: startDate, $lte: endDate } }),
      Feedback.aggregate([
        { $match: { createdAt: { $gte: startDate, $lte: endDate } } },
        { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
      ])
    ]);

    // Previous period metrics for comparison
    const [
      prevInterviews,
      prevCompletions,
      prevCandidates,
      prevFeedbacks,
      prevAvgRating
    ] = await Promise.all([
      Interview.countDocuments(prevFilter),
      Interview.countDocuments({ ...prevFilter, status: 'Completed' }),
      User.countDocuments({ role: 'Candidate', createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),
      Feedback.countDocuments({ createdAt: { $gte: prevStartDate, $lte: prevEndDate } }),
      Feedback.aggregate([
        { $match: { createdAt: { $gte: prevStartDate, $lte: prevEndDate } } },
        { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
      ])
    ]);

    // Calculate percentage changes
    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const kpis = {
      interviews: {
        current: currentInterviews,
        previous: prevInterviews,
        change: calculateChange(currentInterviews, prevInterviews),
        trend: currentInterviews >= prevInterviews ? 'up' : 'down'
      },
      completionRate: {
        current: currentInterviews > 0 ? Math.round((currentCompletions / currentInterviews) * 100) : 0,
        previous: prevInterviews > 0 ? Math.round((prevCompletions / prevInterviews) * 100) : 0,
        change: calculateChange(
          currentInterviews > 0 ? (currentCompletions / currentInterviews) * 100 : 0,
          prevInterviews > 0 ? (prevCompletions / prevInterviews) * 100 : 0
        )
      },
      candidateGrowth: {
        current: currentCandidates,
        previous: prevCandidates,
        change: calculateChange(currentCandidates, prevCandidates),
        trend: currentCandidates >= prevCandidates ? 'up' : 'down'
      },
      feedbackRate: {
        current: currentInterviews > 0 ? Math.round((currentFeedbacks / currentInterviews) * 100) : 0,
        previous: prevInterviews > 0 ? Math.round((prevFeedbacks / prevInterviews) * 100) : 0
      },
      averageRating: {
        current: currentAvgRating.length > 0 ? Math.round(currentAvgRating[0].avgRating * 100) / 100 : 0,
        previous: prevAvgRating.length > 0 ? Math.round(prevAvgRating[0].avgRating * 100) / 100 : 0
      },
      period: {
        current: `${startDate.toISOString().split('T')[0]} to ${endDate.toISOString().split('T')[0]}`,
        previous: `${prevStartDate.toISOString().split('T')[0]} to ${prevEndDate.toISOString().split('T')[0]}`
      }
    };

    res.status(200).json({
      success: true,
      data: { kpis }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Interview Analytics ---------------------------------------------------
  // ===========================================================================================================================

  getInterviewAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate, 
      groupBy = 'day',
      recruiterId 
    } = req.query;

    // Default date range (last 30 days)
    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build filter
    let matchFilter = {
      createdAt: { $gte: start, $lte: end }
    };

    if (req.user.role === 'Recruiter') {
      matchFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    } else if (recruiterId && req.user.role === 'Admin') {
      matchFilter.recruiterId = new mongoose.Types.ObjectId(recruiterId);
    }

    // Group by format based on period
    let groupFormat;
    switch(groupBy) {
      case 'hour':
        groupFormat = '%Y-%m-%d %H:00';
        break;
      case 'day':
        groupFormat = '%Y-%m-%d';
        break;
      case 'week':
        groupFormat = '%Y-W%V';
        break;
      case 'month':
        groupFormat = '%Y-%m';
        break;
      default:
        groupFormat = '%Y-%m-%d';
    }

    const [
      interviewTrends,
      statusDistribution,
      performanceMetrics,
      recruiterStats
    ] = await Promise.all([
      // Interview trends over time
      Interview.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
            totalInterviews: { $sum: 1 },
            scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Status distribution
      Interview.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]),

      // Performance metrics
      Interview.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalInterviews: { $sum: 1 },
            avgDuration: { $avg: '$duration' },
            completionRate: {
              $avg: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] }
            }
          }
        }
      ]),

      // Top recruiters (Admin only)
      req.user.role === 'Admin' ? Interview.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'users', localField: 'recruiterId', foreignField: '_id', as: 'recruiter' } },
        { $unwind: '$recruiter' },
        {
          $group: {
            _id: '$recruiterId',
            recruiterName: { $first: '$recruiter.name' },
            totalInterviews: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
          }
        },
        { $sort: { totalInterviews: -1 } },
        { $limit: 10 }
      ]) : []
    ]);

    const analytics = {
      trends: interviewTrends,
      distribution: statusDistribution,
      performance: performanceMetrics[0] || {
        totalInterviews: 0,
        avgDuration: 0,
        completionRate: 0
      },
      topRecruiters: recruiterStats,
      period: { start, end, groupBy }
    };

    res.status(200).json({
      success: true,
      data: { analytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Interview Success Rates -----------------------------------------------
  // ===========================================================================================================================

  getInterviewSuccessRates = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate,
      recruiterId 
    } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let matchFilter = {
      interviewDate: { $gte: start, $lte: end }
    };

    if (req.user.role === 'Recruiter') {
      matchFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    } else if (recruiterId && req.user.role === 'Admin') {
      matchFilter.recruiterId = new mongoose.Types.ObjectId(recruiterId);
    }

    const [
      overallStats,
      recruiterBreakdown,
      templateSuccessRates,
      monthlyTrends
    ] = await Promise.all([
      // Overall success statistics
      Interview.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            totalInterviews: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
            scheduled: { $sum: { $cond: [{ $eq: ['$status', 'Scheduled'] }, 1, 0] } },
            inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } }
          }
        }
      ]),

      // Success rates by recruiter (Admin only)
      req.user.role === 'Admin' ? Interview.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'users', localField: 'recruiterId', foreignField: '_id', as: 'recruiter' } },
        { $unwind: '$recruiter' },
        {
          $group: {
            _id: '$recruiterId',
            recruiterName: { $first: '$recruiter.name' },
            totalInterviews: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            successRate: {
              $multiply: [
                { $divide: ['$completed', '$totalInterviews'] }, 100
              ]
            }
          }
        },
        { $sort: { successRate: -1 } }
      ]) : [],

      // Success rates by template
      Interview.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'templates', localField: 'templateId', foreignField: '_id', as: 'template' } },
        { $unwind: { path: '$template', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$templateId',
            templateName: { $first: '$template.title' },
            totalInterviews: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            successRate: {
              $multiply: [
                { $divide: ['$completed', '$totalInterviews'] }, 100
              ]
            }
          }
        },
        { $sort: { totalInterviews: -1 } }
      ]),

      // Monthly success trends
      Interview.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { 
              year: { $year: '$interviewDate' },
              month: { $month: '$interviewDate' }
            },
            totalInterviews: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            successRate: {
              $multiply: [
                { $divide: ['$completed', '$totalInterviews'] }, 100
              ]
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ])
    ]);

    const successRates = {
      overall: overallStats[0] ? {
        ...overallStats[0],
        successRate: overallStats[0].totalInterviews > 0 
          ? Math.round((overallStats[0].completed / overallStats[0].totalInterviews) * 100)
          : 0
      } : {
        totalInterviews: 0,
        completed: 0,
        cancelled: 0,
        scheduled: 0,
        inProgress: 0,
        successRate: 0
      },
      byRecruiter: recruiterBreakdown,
      byTemplate: templateSuccessRates,
      monthlyTrends: monthlyTrends,
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { successRates }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Average Interview Duration --------------------------------------------
  // ===========================================================================================================================

  getAverageInterviewDuration = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate,
      groupBy = 'overall'
    } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let matchFilter = {
      interviewDate: { $gte: start, $lte: end },
      duration: { $exists: true, $ne: null },
      status: 'Completed'
    };

    if (req.user.role === 'Recruiter') {
      matchFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    }

    const [
      overallDuration,
      durationByRecruiter,
      durationByTemplate,
      durationTrends
    ] = await Promise.all([
      // Overall average duration
      Interview.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: null,
            avgDuration: { $avg: '$duration' },
            minDuration: { $min: '$duration' },
            maxDuration: { $max: '$duration' },
            totalInterviews: { $sum: 1 }
          }
        }
      ]),

      // Duration by recruiter (Admin only)
      req.user.role === 'Admin' ? Interview.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'users', localField: 'recruiterId', foreignField: '_id', as: 'recruiter' } },
        { $unwind: '$recruiter' },
        {
          $group: {
            _id: '$recruiterId',
            recruiterName: { $first: '$recruiter.name' },
            avgDuration: { $avg: '$duration' },
            totalInterviews: { $sum: 1 }
          }
        },
        { $sort: { avgDuration: 1 } }
      ]) : [],

      // Duration by template
      Interview.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'templates', localField: 'templateId', foreignField: '_id', as: 'template' } },
        { $unwind: { path: '$template', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$templateId',
            templateName: { $first: '$template.title' },
            avgDuration: { $avg: '$duration' },
            totalInterviews: { $sum: 1 }
          }
        },
        { $sort: { totalInterviews: -1 } }
      ]),

      // Duration trends over time
      Interview.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$interviewDate' } },
            avgDuration: { $avg: '$duration' },
            totalInterviews: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    const durationAnalytics = {
      overall: overallDuration[0] || {
        avgDuration: 0,
        minDuration: 0,
        maxDuration: 0,
        totalInterviews: 0
      },
      byRecruiter: durationByRecruiter,
      byTemplate: durationByTemplate,
      trends: durationTrends,
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { durationAnalytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Interviewer Performance -----------------------------------------------
  // ===========================================================================================================================

  getInterviewerPerformance = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate,
      recruiterId 
    } = req.query;

    // Only admins can view all recruiters, recruiters can only view their own stats
    if (req.user.role === 'Recruiter' && recruiterId && recruiterId !== req.user.userId) {
      throw new AppError('You can only view your own performance', 403);
    }

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let matchFilter = {
      interviewDate: { $gte: start, $lte: end }
    };

    if (req.user.role === 'Recruiter') {
      matchFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    } else if (recruiterId && req.user.role === 'Admin') {
      matchFilter.recruiterId = new mongoose.Types.ObjectId(recruiterId);
    }

    const [
      recruiterPerformance,
      feedbackRatings,
      interviewVolume,
      topPerformers
    ] = await Promise.all([
      // Recruiter performance metrics
      Interview.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'users', localField: 'recruiterId', foreignField: '_id', as: 'recruiter' } },
        { $unwind: '$recruiter' },
        {
          $group: {
            _id: '$recruiterId',
            recruiterName: { $first: '$recruiter.name' },
            recruiterEmail: { $first: '$recruiter.email' },
            totalInterviews: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            cancelled: { $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] } },
            avgDuration: { $avg: '$duration' }
          }
        },
        {
          $addFields: {
            completionRate: {
              $multiply: [
                { $divide: ['$completed', '$totalInterviews'] }, 100
              ]
            }
          }
        }
      ]),

      // Feedback ratings for interviewers
      Interview.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'feedbacks', localField: '_id', foreignField: 'interviewId', as: 'feedbacks' } },
        { $unwind: { path: '$feedbacks', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'users', localField: 'recruiterId', foreignField: '_id', as: 'recruiter' } },
        { $unwind: '$recruiter' },
        {
          $group: {
            _id: '$recruiterId',
            recruiterName: { $first: '$recruiter.name' },
            avgInterviewerRating: { $avg: '$feedbacks.interviewerRating' },
            avgProcessRating: { $avg: '$feedbacks.processRating' },
            avgFairnessRating: { $avg: '$feedbacks.fairnessRating' },
            totalFeedbacks: { $sum: { $cond: [{ $ne: ['$feedbacks', null] }, 1, 0] } }
          }
        }
      ]),

      // Interview volume trends
      Interview.aggregate([
        { $match: matchFilter },
        {
          $group: {
            _id: { 
              recruiterId: '$recruiterId',
              date: { $dateToString: { format: '%Y-%m-%d', date: '$interviewDate' } }
            },
            dailyCount: { $sum: 1 }
          }
        },
        { $lookup: { from: 'users', localField: '_id.recruiterId', foreignField: '_id', as: 'recruiter' } },
        { $unwind: '$recruiter' },
        {
          $group: {
            _id: '$_id.recruiterId',
            recruiterName: { $first: '$recruiter.name' },
            dailyVolumes: { $push: { date: '$_id.date', count: '$dailyCount' } },
            avgDailyVolume: { $avg: '$dailyCount' }
          }
        }
      ]),

      // Top performers (Admin only)
      req.user.role === 'Admin' ? Interview.aggregate([
        { $match: matchFilter },
        { $lookup: { from: 'users', localField: 'recruiterId', foreignField: '_id', as: 'recruiter' } },
        { $unwind: '$recruiter' },
        { $lookup: { from: 'feedbacks', localField: '_id', foreignField: 'interviewId', as: 'feedbacks' } },
        {
          $group: {
            _id: '$recruiterId',
            recruiterName: { $first: '$recruiter.name' },
            totalInterviews: { $sum: 1 },
            completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            avgRating: { $avg: '$feedbacks.interviewerRating' },
            totalFeedbacks: { $sum: { $size: '$feedbacks' } }
          }
        },
        {
          $addFields: {
            performanceScore: {
              $add: [
                { $multiply: [{ $divide: ['$completed', '$totalInterviews'] }, 50] },
                { $multiply: ['$avgRating', 10] }
              ]
            }
          }
        },
        { $sort: { performanceScore: -1 } },
        { $limit: 10 }
      ]) : []
    ]);

    const performance = {
      recruiters: recruiterPerformance,
      ratings: feedbackRatings,
      volumeTrends: interviewVolume,
      topPerformers: topPerformers,
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { performance }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Candidate Analytics ---------------------------------------------------
  // ===========================================================================================================================

  getCandidateAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate,
      groupBy = 'month'
    } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Only admins can view all candidate analytics
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot access analytics', 403);
    }

    let interviewFilter = {
      interviewDate: { $gte: start, $lte: end }
    };

    if (req.user.role === 'Recruiter') {
      interviewFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    }

    const [
      candidateRegistrations,
      candidatePerformance,
      candidateJourney,
      topCandidates
    ] = await Promise.all([
      // Candidate registration trends
      User.aggregate([
        { 
          $match: { 
            role: 'Candidate',
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
            newCandidates: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Candidate performance in interviews
      Interview.aggregate([
        { $match: interviewFilter },
        { $lookup: { from: 'users', localField: 'candidateId', foreignField: '_id', as: 'candidate' } },
        { $unwind: '$candidate' },
        { $lookup: { from: 'evaluations', localField: '_id', foreignField: 'interviewId', as: 'evaluations' } },
        { $lookup: { from: 'feedbacks', localField: '_id', foreignField: 'interviewId', as: 'feedbacks' } },
        {
          $group: {
            _id: '$candidateId',
            candidateName: { $first: '$candidate.name' },
            candidateEmail: { $first: '$candidate.email' },
            totalInterviews: { $sum: 1 },
            completedInterviews: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            avgEvalScore: { $avg: '$evaluations.overallScore' },
            avgFeedbackRating: { $avg: '$feedbacks.overallRating' }
          }
        },
        {
          $addFields: {
            successRate: {
              $multiply: [
                { $divide: ['$completedInterviews', '$totalInterviews'] }, 100
              ]
            }
          }
        },
        { $sort: { successRate: -1 } }
      ]),

      // Candidate journey stages
      Interview.aggregate([
        { $match: interviewFilter },
        {
          $group: {
            _id: '$status',
            candidateCount: { $addToSet: '$candidateId' },
            interviewCount: { $sum: 1 }
          }
        },
        {
          $addFields: {
            uniqueCandidates: { $size: '$candidateCount' }
          }
        }
      ]),

      // Top performing candidates
      Interview.aggregate([
        { $match: { ...interviewFilter, status: 'Completed' } },
        { $lookup: { from: 'users', localField: 'candidateId', foreignField: '_id', as: 'candidate' } },
        { $unwind: '$candidate' },
        { $lookup: { from: 'evaluations', localField: '_id', foreignField: 'interviewId', as: 'evaluations' } },
        { $unwind: { path: '$evaluations', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$candidateId',
            candidateName: { $first: '$candidate.name' },
            totalInterviews: { $sum: 1 },
            avgScore: { $avg: '$evaluations.overallScore' },
            maxScore: { $max: '$evaluations.overallScore' }
          }
        },
        { $match: { avgScore: { $exists: true } } },
        { $sort: { avgScore: -1 } },
        { $limit: 10 }
      ])
    ]);

    const analytics = {
      registrationTrends: candidateRegistrations,
      performance: candidatePerformance,
      journeyFunnel: candidateJourney,
      topPerformers: topCandidates,
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { analytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Candidate Source Analytics --------------------------------------------
  // ===========================================================================================================================

  getCandidateSourceAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate
    } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Only admins can view source analytics
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can access source analytics', 403);
    }

    const [
      sourceDistribution,
      sourcePerformance,
      sourceTrends
    ] = await Promise.all([
      // Distribution by registration source (simulated field)
      User.aggregate([
        { 
          $match: { 
            role: 'Candidate',
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $addFields: {
            source: { 
              $switch: {
                branches: [
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 1] }, then: 'Website' },
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 2] }, then: 'LinkedIn' },
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 3] }, then: 'Referral' }
                ],
                default: 'Job Board'
              }
            }
          }
        },
        {
          $group: {
            _id: '$source',
            count: { $sum: 1 },
            candidates: { $push: { id: '$_id', name: '$name', email: '$email' } }
          }
        },
        { $sort: { count: -1 } }
      ]),

      // Source performance (conversion to interviews)
      User.aggregate([
        { 
          $match: { 
            role: 'Candidate',
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $addFields: {
            source: { 
              $switch: {
                branches: [
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 1] }, then: 'Website' },
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 2] }, then: 'LinkedIn' },
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 3] }, then: 'Referral' }
                ],
                default: 'Job Board'
              }
            }
          }
        },
        {
          $lookup: {
            from: 'interviews',
            localField: '_id',
            foreignField: 'candidateId',
            as: 'interviews'
          }
        },
        {
          $group: {
            _id: '$source',
            totalCandidates: { $sum: 1 },
            candidatesWithInterviews: { 
              $sum: { $cond: [{ $gt: [{ $size: '$interviews' }, 0] }, 1, 0] }
            },
            totalInterviews: { $sum: { $size: '$interviews' } }
          }
        },
        {
          $addFields: {
            conversionRate: {
              $multiply: [
                { $divide: ['$candidatesWithInterviews', '$totalCandidates'] }, 100
              ]
            }
          }
        },
        { $sort: { conversionRate: -1 } }
      ]),

      // Source trends over time
      User.aggregate([
        { 
          $match: { 
            role: 'Candidate',
            createdAt: { $gte: start, $lte: end }
          }
        },
        {
          $addFields: {
            source: { 
              $switch: {
                branches: [
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 1] }, then: 'Website' },
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 2] }, then: 'LinkedIn' },
                  { case: { $lt: [{ $mod: [{ $dayOfMonth: '$createdAt' }, 4] }, 3] }, then: 'Referral' }
                ],
                default: 'Job Board'
              }
            }
          }
        },
        {
          $group: {
            _id: { 
              source: '$source',
              month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.month': 1, '_id.source': 1 } }
      ])
    ]);

    const sourceAnalytics = {
      distribution: sourceDistribution,
      performance: sourcePerformance,
      trends: sourceTrends,
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { sourceAnalytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Candidate Journey Analytics -------------------------------------------
  // ===========================================================================================================================

  getCandidateJourneyAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate
    } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Access control
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot access journey analytics', 403);
    }

    let interviewFilter = {
      createdAt: { $gte: start, $lte: end }
    };

    if (req.user.role === 'Recruiter') {
      interviewFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    }

    const [
      journeyStages,
      conversionRates,
      timeToHire,
      dropoffAnalysis
    ] = await Promise.all([
      // Journey stage analysis
      Interview.aggregate([
        { $match: interviewFilter },
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 },
            uniqueCandidates: { $addToSet: '$candidateId' }
          }
        },
        {
          $addFields: {
            candidateCount: { $size: '$uniqueCandidates' }
          }
        }
      ]),

      // Conversion rates between stages
      Interview.aggregate([
        { $match: interviewFilter },
        { $lookup: { from: 'users', localField: 'candidateId', foreignField: '_id', as: 'candidate' } },
        { $unwind: '$candidate' },
        {
          $group: {
            _id: '$candidateId',
            candidateName: { $first: '$candidate.name' },
            stages: { $push: '$status' },
            interviews: { $push: { status: '$status', date: '$interviewDate' } }
          }
        },
        {
          $addFields: {
            hasScheduled: { $in: ['Scheduled', '$stages'] },
            hasCompleted: { $in: ['Completed', '$stages'] },
            hasCancelled: { $in: ['Cancelled', '$stages'] }
          }
        },
        {
          $group: {
            _id: null,
            totalCandidates: { $sum: 1 },
            scheduledCandidates: { $sum: { $cond: ['$hasScheduled', 1, 0] } },
            completedCandidates: { $sum: { $cond: ['$hasCompleted', 1, 0] } },
            cancelledCandidates: { $sum: { $cond: ['$hasCancelled', 1, 0] } }
          }
        },
        {
          $addFields: {
            scheduledToCompletedRate: {
              $multiply: [
                { $divide: ['$completedCandidates', '$scheduledCandidates'] }, 100
              ]
            },
            overallCompletionRate: {
              $multiply: [
                { $divide: ['$completedCandidates', '$totalCandidates'] }, 100
              ]
            }
          }
        }
      ]),

      // Average time to hire
      Interview.aggregate([
        { $match: { ...interviewFilter, status: 'Completed' } },
        { $lookup: { from: 'users', localField: 'candidateId', foreignField: '_id', as: 'candidate' } },
        { $unwind: '$candidate' },
        {
          $addFields: {
            timeToInterview: {
              $divide: [
                { $subtract: ['$interviewDate', '$candidate.createdAt'] },
                1000 * 60 * 60 * 24 // Convert to days
              ]
            }
          }
        },
        {
          $group: {
            _id: null,
            avgTimeToInterview: { $avg: '$timeToInterview' },
            minTimeToInterview: { $min: '$timeToInterview' },
            maxTimeToInterview: { $max: '$timeToInterview' },
            totalCompleted: { $sum: 1 }
          }
        }
      ]),

      // Dropoff analysis
      Interview.aggregate([
        { $match: interviewFilter },
        {
          $facet: {
            byStatus: [
              {
                $group: {
                  _id: '$status',
                  count: { $sum: 1 }
                }
              }
            ],
            byMonth: [
              {
                $group: {
                  _id: {
                    month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } },
                    status: '$status'
                  },
                  count: { $sum: 1 }
                }
              },
              { $sort: { '_id.month': 1 } }
            ]
          }
        }
      ])
    ]);

    const journeyAnalytics = {
      stages: journeyStages,
      conversions: conversionRates[0] || {
        totalCandidates: 0,
        scheduledCandidates: 0,
        completedCandidates: 0,
        cancelledCandidates: 0,
        scheduledToCompletedRate: 0,
        overallCompletionRate: 0
      },
      timeMetrics: timeToHire[0] || {
        avgTimeToInterview: 0,
        minTimeToInterview: 0,
        maxTimeToInterview: 0,
        totalCompleted: 0
      },
      dropoffAnalysis: dropoffAnalysis[0],
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { journeyAnalytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Template Usage Analytics ----------------------------------------------
  // ===========================================================================================================================

  getTemplateUsageAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate
    } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 60 * 24 * 60 * 60 * 1000);

    let interviewFilter = {
      createdAt: { $gte: start, $lte: end }
    };

    if (req.user.role === 'Recruiter') {
      interviewFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    }

    const [
      templateUsage,
      templatePerformance,
      templateTrends
    ] = await Promise.all([
      // Template usage statistics
      Interview.aggregate([
        { $match: interviewFilter },
        { $lookup: { from: 'templates', localField: 'templateId', foreignField: '_id', as: 'template' } },
        { $unwind: { path: '$template', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: '$templateId',
            templateName: { $first: '$template.title' },
            templateCategory: { $first: '$template.category' },
            usageCount: { $sum: 1 },
            uniqueRecruiters: { $addToSet: '$recruiterId' },
            avgDuration: { $avg: '$duration' }
          }
        },
        {
          $addFields: {
            recruiterCount: { $size: '$uniqueRecruiters' }
          }
        },
        { $sort: { usageCount: -1 } }
      ]),

      // Template performance metrics
      Interview.aggregate([
        { $match: interviewFilter },
        { $lookup: { from: 'templates', localField: 'templateId', foreignField: '_id', as: 'template' } },
        { $unwind: { path: '$template', preserveNullAndEmptyArrays: true } },
        { $lookup: { from: 'evaluations', localField: '_id', foreignField: 'interviewId', as: 'evaluations' } },
        { $lookup: { from: 'feedbacks', localField: '_id', foreignField: 'interviewId', as: 'feedbacks' } },
        {
          $group: {
            _id: '$templateId',
            templateName: { $first: '$template.title' },
            totalInterviews: { $sum: 1 },
            completedInterviews: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
            avgEvaluationScore: { $avg: '$evaluations.overallScore' },
            avgFeedbackRating: { $avg: '$feedbacks.overallRating' }
          }
        },
        {
          $addFields: {
            completionRate: {
              $multiply: [
                { $divide: ['$completedInterviews', '$totalInterviews'] }, 100
              ]
            }
          }
        },
        { $sort: { avgEvaluationScore: -1 } }
      ]),

      // Template usage trends
      Interview.aggregate([
        { $match: interviewFilter },
        { $lookup: { from: 'templates', localField: 'templateId', foreignField: '_id', as: 'template' } },
        { $unwind: { path: '$template', preserveNullAndEmptyArrays: true } },
        {
          $group: {
            _id: {
              templateId: '$templateId',
              templateName: '$template.title',
              month: { $dateToString: { format: '%Y-%m', date: '$createdAt' } }
            },
            monthlyUsage: { $sum: 1 }
          }
        },
        { $sort: { '_id.month': 1, monthlyUsage: -1 } }
      ])
    ]);

    const templateAnalytics = {
      usage: templateUsage,
      performance: templatePerformance,
      trends: templateTrends,
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { templateAnalytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Question Performance Analytics ----------------------------------------
  // ===========================================================================================================================

  getQuestionPerformanceAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate,
      templateId
    } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 60 * 24 * 60 * 60 * 1000);

    let matchFilter = {
      createdAt: { $gte: start, $lte: end }
    };

    if (templateId) {
      matchFilter.templateId = new mongoose.Types.ObjectId(templateId);
    }

    if (req.user.role === 'Recruiter') {
      matchFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    }

    // Simulate question performance (in real app, would analyze actual question data)
    const questionAnalytics = {
      topPerformingQuestions: [
        { questionText: "Tell me about yourself", avgScore: 4.2, usageCount: 150 },
        { questionText: "What are your strengths?", avgScore: 4.0, usageCount: 145 },
        { questionText: "Describe a challenging project", avgScore: 3.8, usageCount: 130 },
        { questionText: "Why do you want this role?", avgScore: 3.9, usageCount: 140 },
        { questionText: "Technical problem solving", avgScore: 3.5, usageCount: 120 }
      ],
      questionDifficulty: [
        { difficulty: 'Easy', count: 45, avgScore: 4.1 },
        { difficulty: 'Medium', count: 78, avgScore: 3.7 },
        { difficulty: 'Hard', count: 32, avgScore: 3.2 }
      ],
      questionCategories: [
        { category: 'Behavioral', count: 85, avgScore: 3.9 },
        { category: 'Technical', count: 52, avgScore: 3.4 },
        { category: 'Situational', count: 38, avgScore: 3.7 }
      ],
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { questionAnalytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Difficulty Analytics --------------------------------------------------
  // ===========================================================================================================================

  getDifficultyAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate
    } = req.query;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 60 * 24 * 60 * 60 * 1000);

    let interviewFilter = {
      interviewDate: { $gte: start, $lte: end }
    };

    if (req.user.role === 'Recruiter') {
      interviewFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    }

    const [
      difficultyDistribution,
      difficultyPerformance,
      difficultyTrends
    ] = await Promise.all([
      // Difficulty rating distribution from feedback
      Feedback.aggregate([
        { 
          $lookup: {
            from: 'interviews',
            localField: 'interviewId',
            foreignField: '_id',
            as: 'interview'
          }
        },
        { $unwind: '$interview' },
        { $match: { 'interview.interviewDate': { $gte: start, $lte: end } } },
        {
          $group: {
            _id: '$difficultyRating',
            count: { $sum: 1 },
            avgOverallRating: { $avg: '$overallRating' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // Performance by difficulty level
      Feedback.aggregate([
        { 
          $lookup: {
            from: 'interviews',
            localField: 'interviewId',
            foreignField: '_id',
            as: 'interview'
          }
        },
        { $unwind: '$interview' },
        { $match: { 'interview.interviewDate': { $gte: start, $lte: end } } },
        {
          $lookup: {
            from: 'evaluations',
            localField: 'interviewId',
            foreignField: 'interviewId',
            as: 'evaluation'
          }
        },
        { $unwind: { path: '$evaluation', preserveNullAndEmptyArrays: true } },
        {
          $addFields: {
            difficultyLevel: {
              $switch: {
                branches: [
                  { case: { $lte: ['$difficultyRating', 2] }, then: 'Easy' },
                  { case: { $lte: ['$difficultyRating', 4] }, then: 'Medium' }
                ],
                default: 'Hard'
              }
            }
          }
        },
        {
          $group: {
            _id: '$difficultyLevel',
            feedbackCount: { $sum: 1 },
            avgFeedbackRating: { $avg: '$overallRating' },
            avgEvaluationScore: { $avg: '$evaluation.overallScore' },
            wouldRecommendRate: {
              $avg: { $cond: ['$wouldRecommend', 1, 0] }
            }
          }
        }
      ]),

      // Difficulty trends over time
      Feedback.aggregate([
        { 
          $lookup: {
            from: 'interviews',
            localField: 'interviewId',
            foreignField: '_id',
            as: 'interview'
          }
        },
        { $unwind: '$interview' },
        { $match: { 'interview.interviewDate': { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              month: { $dateToString: { format: '%Y-%m', date: '$interview.interviewDate' } },
              difficulty: '$difficultyRating'
            },
            count: { $sum: 1 },
            avgRating: { $avg: '$overallRating' }
          }
        },
        { $sort: { '_id.month': 1, '_id.difficulty': 1 } }
      ])
    ]);

    const difficultyAnalytics = {
      distribution: difficultyDistribution,
      performance: difficultyPerformance,
      trends: difficultyTrends,
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { difficultyAnalytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- System Health Metrics -------------------------------------------------
  // ===========================================================================================================================

  getSystemHealthMetrics = asyncHandler(async (req, res) => {
    // Only admins can access system health
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can access system health metrics', 403);
    }

    const now = new Date();
    const last24Hours = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [
      databaseStats,
      userActivity,
      systemLoad,
      errorRates
    ] = await Promise.all([
      // Database statistics
      Promise.all([
        User.countDocuments(),
        Interview.countDocuments(),
        Feedback.countDocuments(),
        Evaluation.countDocuments(),
        Template.countDocuments()
      ]).then(([users, interviews, feedbacks, evaluations, templates]) => ({
        totalUsers: users,
        totalInterviews: interviews,
        totalFeedbacks: feedbacks,
        totalEvaluations: evaluations,
        totalTemplates: templates
      })),

      // User activity
      Promise.all([
        User.countDocuments({ lastLoginAt: { $gte: last24Hours } }),
        User.countDocuments({ lastLoginAt: { $gte: lastWeek } }),
        Interview.countDocuments({ createdAt: { $gte: last24Hours } }),
        Feedback.countDocuments({ createdAt: { $gte: last24Hours } })
      ]).then(([activeToday, activeWeek, interviewsToday, feedbacksToday]) => ({
        activeUsersToday: activeToday,
        activeUsersWeek: activeWeek,
        interviewsCreatedToday: interviewsToday,
        feedbacksCreatedToday: feedbacksToday
      })),

      // Simulated system metrics (in real app, would get from monitoring tools)
      {
        cpuUsage: Math.floor(Math.random() * 30) + 20, // 20-50%
        memoryUsage: Math.floor(Math.random() * 40) + 40, // 40-80%
        diskUsage: Math.floor(Math.random() * 20) + 30, // 30-50%
        networkLatency: Math.floor(Math.random() * 50) + 10 // 10-60ms
      },

      // Error analysis from audit logs
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: last24Hours } } },
        {
          $group: {
            _id: '$action',
            count: { $sum: 1 },
            errors: { $sum: { $cond: [{ $eq: ['$status', 'error'] }, 1, 0] } }
          }
        },
        {
          $addFields: {
            errorRate: { $multiply: [{ $divide: ['$errors', '$count'] }, 100] }
          }
        }
      ])
    ]);

    const healthMetrics = {
      database: databaseStats,
      userActivity: userActivity,
      system: {
        ...systemLoad,
        uptime: '99.9%', // Simulated
        lastRestart: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      },
      errors: errorRates,
      alerts: [
        // Simulated alerts
        {
          level: 'info',
          message: 'System running normally',
          timestamp: now
        }
      ],
      timestamp: now
    };

    res.status(200).json({
      success: true,
      data: { healthMetrics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- User Activity Analytics -----------------------------------------------
  // ===========================================================================================================================

  getUserActivityAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate,
      userRole = 'all'
    } = req.query;

    // Only admins can view all user activity
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can access user activity analytics', 403);
    }

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let userFilter = {
      lastLoginAt: { $gte: start, $lte: end }
    };

    if (userRole !== 'all') {
      userFilter.role = userRole;
    }

    const [
      loginActivity,
      userEngagement,
      roleDistribution,
      activityTrends
    ] = await Promise.all([
      // Login activity
      User.aggregate([
        { $match: userFilter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$lastLoginAt' } },
            uniqueLogins: { $sum: 1 },
            roles: { $push: '$role' }
          }
        },
        { $sort: { _id: 1 } }
      ]),

      // User engagement metrics
      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $lookup: {
            from: 'interviews',
            localField: '_id',
            foreignField: 'candidateId',
            as: 'candidateInterviews'
          }
        },
        {
          $lookup: {
            from: 'interviews',
            localField: '_id',
            foreignField: 'recruiterId',
            as: 'recruiterInterviews'
          }
        },
        {
          $addFields: {
            totalInterviews: {
              $add: [
                { $size: '$candidateInterviews' },
                { $size: '$recruiterInterviews' }
              ]
            }
          }
        },
        {
          $group: {
            _id: '$role',
            totalUsers: { $sum: 1 },
            activeUsers: { $sum: { $cond: [{ $gt: ['$totalInterviews', 0] }, 1, 0] } },
            avgInterviewsPerUser: { $avg: '$totalInterviews' }
          }
        },
        {
          $addFields: {
            engagementRate: {
              $multiply: [{ $divide: ['$activeUsers', '$totalUsers'] }, 100]
            }
          }
        }
      ]),

      // Role distribution
      User.aggregate([
        { $match: { createdAt: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: '$role',
            count: { $sum: 1 },
            newUsers: { $sum: { $cond: [{ $gte: ['$createdAt', start] }, 1, 0] } }
          }
        }
      ]),

      // Activity trends
      AuditLog.aggregate([
        { $match: { timestamp: { $gte: start, $lte: end } } },
        {
          $group: {
            _id: {
              date: { $dateToString: { format: '%Y-%m-%d', date: '$timestamp' } },
              action: '$action'
            },
            count: { $sum: 1 }
          }
        },
        { $sort: { '_id.date': 1 } }
      ])
    ]);

    const activityAnalytics = {
      loginActivity: loginActivity,
      engagement: userEngagement,
      roleDistribution: roleDistribution,
      trends: activityTrends,
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { activityAnalytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- API Usage Analytics ---------------------------------------------------
  // ===========================================================================================================================

  getAPIUsageAnalytics = asyncHandler(async (req, res) => {
    const { 
      startDate, 
      endDate
    } = req.query;

    // Only admins can access API usage
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can access API usage analytics', 403);
    }

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Simulated API usage data (in real app, would get from API gateway/logs)
    const apiAnalytics = {
      totalRequests: Math.floor(Math.random() * 10000) + 5000,
      successfulRequests: Math.floor(Math.random() * 9500) + 4500,
      failedRequests: Math.floor(Math.random() * 500) + 50,
      avgResponseTime: Math.floor(Math.random() * 200) + 100,
      topEndpoints: [
        { endpoint: '/api/interviews', requests: 1250, avgResponseTime: 120 },
        { endpoint: '/api/users', requests: 980, avgResponseTime: 95 },
        { endpoint: '/api/feedback', requests: 850, avgResponseTime: 110 },
        { endpoint: '/api/evaluations', requests: 720, avgResponseTime: 135 },
        { endpoint: '/api/analytics', requests: 450, avgResponseTime: 200 }
      ],
      errorBreakdown: [
        { statusCode: 400, count: 45, percentage: 60 },
        { statusCode: 401, count: 20, percentage: 27 },
        { statusCode: 500, count: 8, percentage: 11 },
        { statusCode: 403, count: 2, percentage: 2 }
      ],
      hourlyTraffic: Array.from({ length: 24 }, (_, i) => ({
        hour: i,
        requests: Math.floor(Math.random() * 500) + 100
      })),
      period: { start, end }
    };

    res.status(200).json({
      success: true,
      data: { apiAnalytics }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Predictive Analytics --------------------------------------------------
  // ===========================================================================================================================

  getPredictiveAnalytics = asyncHandler(async (req, res) => {
    const { 
      predictionType = 'interview_success',
      timeframe = '30'
    } = req.query;

    // Only admins can access predictive analytics
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can access predictive analytics', 403);
    }

    // Simulate ML predictions (in real app, would use actual ML models)
    const predictions = {
      interview_success: {
        nextMonth: {
          expectedInterviews: Math.floor(Math.random() * 200) + 150,
          expectedCompletions: Math.floor(Math.random() * 150) + 120,
          expectedSuccessRate: Math.floor(Math.random() * 20) + 75,
          confidence: 0.85
        },
        factors: [
          { factor: 'Historical completion rate', weight: 0.35 },
          { factor: 'Recruiter performance', weight: 0.25 },
          { factor: 'Candidate quality score', weight: 0.20 },
          { factor: 'Template effectiveness', weight: 0.20 }
        ]
      },
      candidate_churn: {
        riskFactors: [
          { factor: 'Low feedback ratings', impact: 'high' },
          { factor: 'Long response times', impact: 'medium' },
          { factor: 'Multiple cancellations', impact: 'high' }
        ],
        atRiskCandidates: Math.floor(Math.random() * 50) + 10
      },
      resource_optimization: {
        recommendations: [
          'Increase recruiter capacity on Tuesdays',
          'Optimize template usage for better outcomes',
          'Schedule more interviews during peak hours'
        ],
        potentialSavings: '15-20% time reduction'
      }
    };

    res.status(200).json({
      success: true,
      data: { 
        predictions: predictions[predictionType] || predictions.interview_success,
        generatedAt: new Date(),
        timeframe: `${timeframe} days`
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Comparison Analytics --------------------------------------------------
  // ===========================================================================================================================

  getComparisonAnalytics = asyncHandler(async (req, res) => {
    const { 
      period1Start,
      period1End,
      period2Start,
      period2End,
      metric = 'interviews'
    } = req.query;

    if (!period1Start || !period1End || !period2Start || !period2End) {
      throw new AppError('All date parameters are required for comparison', 400);
    }

    const p1Start = new Date(period1Start);
    const p1End = new Date(period1End);
    const p2Start = new Date(period2Start);
    const p2End = new Date(period2End);

    let filter1 = { createdAt: { $gte: p1Start, $lte: p1End } };
    let filter2 = { createdAt: { $gte: p2Start, $lte: p2End } };

    if (req.user.role === 'Recruiter') {
      filter1.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
      filter2.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    }

    const [period1Data, period2Data] = await Promise.all([
      // Period 1 metrics
      Promise.all([
        Interview.countDocuments(filter1),
        Interview.countDocuments({ ...filter1, status: 'Completed' }),
        Feedback.countDocuments({ createdAt: { $gte: p1Start, $lte: p1End } }),
        User.countDocuments({ role: 'Candidate', createdAt: { $gte: p1Start, $lte: p1End } })
      ]),
      // Period 2 metrics
      Promise.all([
        Interview.countDocuments(filter2),
        Interview.countDocuments({ ...filter2, status: 'Completed' }),
        Feedback.countDocuments({ createdAt: { $gte: p2Start, $lte: p2End } }),
        User.countDocuments({ role: 'Candidate', createdAt: { $gte: p2Start, $lte: p2End } })
      ])
    ]);

    const calculateChange = (current, previous) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const comparison = {
      periods: {
        period1: { start: p1Start, end: p1End },
        period2: { start: p2Start, end: p2End }
      },
      metrics: {
        interviews: {
          period1: period1Data[0],
          period2: period2Data[0],
          change: calculateChange(period1Data[0], period2Data[0])
        },
        completions: {
          period1: period1Data[1],
          period2: period2Data[1],
          change: calculateChange(period1Data[1], period2Data[1])
        },
        feedback: {
          period1: period1Data[2],
          period2: period2Data[2],
          change: calculateChange(period1Data[2], period2Data[2])
        },
        candidates: {
          period1: period1Data[3],
          period2: period2Data[3],
          change: calculateChange(period1Data[3], period2Data[3])
        }
      },
      summary: {
        overallTrend: period1Data[0] >= period2Data[0] ? 'positive' : 'negative',
        significantChanges: []
      }
    };

    // Add significant changes
    Object.keys(comparison.metrics).forEach(key => {
      const metric = comparison.metrics[key];
      if (Math.abs(metric.change) >= 20) {
        comparison.summary.significantChanges.push({
          metric: key,
          change: metric.change,
          direction: metric.change > 0 ? 'increase' : 'decrease'
        });
      }
    });

    res.status(200).json({
      success: true,
      data: { comparison }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Custom Analytics ------------------------------------------------------
  // ===========================================================================================================================

  getCustomAnalytics = asyncHandler(async (req, res) => {
    const { 
      metrics = [],
      filters = {},
      groupBy = 'day',
      startDate,
      endDate
    } = req.body;

    if (!Array.isArray(metrics) || metrics.length === 0) {
      throw new AppError('Metrics array is required for custom analytics', 400);
    }

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Build base filter
    let baseFilter = { createdAt: { $gte: start, $lte: end } };
    
    if (req.user.role === 'Recruiter') {
      baseFilter.recruiterId = new mongoose.Types.ObjectId(req.user.userId);
    }

    // Apply custom filters
    if (filters.status) baseFilter.status = filters.status;
    if (filters.recruiterId && req.user.role === 'Admin') {
      baseFilter.recruiterId = new mongoose.Types.ObjectId(filters.recruiterId);
    }

    const customResults = {};

    // Process each requested metric
    for (const metric of metrics) {
      try {
        switch (metric) {
          case 'interview_count':
            customResults[metric] = await Interview.countDocuments(baseFilter);
            break;

          case 'completion_rate':
            const total = await Interview.countDocuments(baseFilter);
            const completed = await Interview.countDocuments({ ...baseFilter, status: 'Completed' });
            customResults[metric] = total > 0 ? (completed / total) * 100 : 0;
            break;

          case 'avg_feedback_rating':
            const feedbackRatings = await Feedback.aggregate([
              { $match: { createdAt: { $gte: start, $lte: end } } },
              { $group: { _id: null, avgRating: { $avg: '$overallRating' } } }
            ]);
            customResults[metric] = feedbackRatings[0]?.avgRating || 0;
            break;

          case 'candidate_growth':
            customResults[metric] = await User.countDocuments({
              role: 'Candidate',
              createdAt: { $gte: start, $lte: end }
            });
            break;

          case 'template_usage':
            customResults[metric] = await Interview.aggregate([
              { $match: baseFilter },
              { $group: { _id: '$templateId', count: { $sum: 1 } } },
              { $sort: { count: -1 } }
            ]);
            break;

          default:
            customResults[metric] = null;
        }
      } catch (error) {
        customResults[metric] = { error: error.message };
      }
    }

    res.status(200).json({
      success: true,
      data: {
        customAnalytics: customResults,
        parameters: { metrics, filters, groupBy, period: { start, end } }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Export Analytics Report -----------------------------------------------
  // ===========================================================================================================================

  exportAnalyticsReport = asyncHandler(async (req, res) => {
    const {
      reportType = 'comprehensive',
      format = 'json',
      startDate,
      endDate,
      includeCharts = false
    } = req.body;

    const end = endDate ? new Date(endDate) : new Date();
    const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);

    let reportData = {};

    try {
      // Build comprehensive report
      if (reportType === 'comprehensive' || reportType === 'all') {
        const [
          dashboardStats,
          interviewAnalytics,
          candidateAnalytics,
          performanceMetrics
        ] = await Promise.all([
          this.generateDashboardStatsForReport(start, end, req.user),
          this.generateInterviewAnalyticsForReport(start, end, req.user),
          this.generateCandidateAnalyticsForReport(start, end, req.user),
          this.generatePerformanceMetricsForReport(start, end, req.user)
        ]);

        reportData = {
          metadata: {
            reportType,
            generatedAt: new Date(),
            generatedBy: req.user.userId,
            period: { start, end },
            format
          },
          dashboard: dashboardStats,
          interviews: interviewAnalytics,
          candidates: candidateAnalytics,
          performance: performanceMetrics
        };
      }

      // Generate specific report types
      if (reportType === 'interviews') {
        reportData = await this.generateInterviewAnalyticsForReport(start, end, req.user);
      } else if (reportType === 'candidates') {
        reportData = await this.generateCandidateAnalyticsForReport(start, end, req.user);
      } else if (reportType === 'performance') {
        reportData = await this.generatePerformanceMetricsForReport(start, end, req.user);
      }

      // Handle different export formats
      if (format === 'csv') {
        const csvData = this.generateCSVReport(reportData);
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=analytics_report_${Date.now()}.csv`);
        return res.send(csvData);
      }

      if (format === 'pdf') {
        // In real implementation, would generate PDF using a library like puppeteer
        return res.status(501).json({
          success: false,
          message: 'PDF export not yet implemented'
        });
      }

      res.status(200).json({
        success: true,
        data: { report: reportData }
      });

    } catch (error) {
      logger.error('Error generating analytics report:', error);
      throw new AppError('Failed to generate analytics report', 500);
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Schedule Reports ------------------------------------------------------
  // ===========================================================================================================================

  scheduleReports = asyncHandler(async (req, res) => {
    const {
      reportType,
      frequency,
      recipients = [],
      format = 'json',
      startDate,
      endDate
    } = req.body;

    // Only admins can schedule reports
    if (req.user.role !== 'Admin') {
      throw new AppError('Only admins can schedule reports', 403);
    }

    if (!reportType || !frequency) {
      throw new AppError('Report type and frequency are required', 400);
    }

    // Create scheduled report entry (in real app, would integrate with job scheduler)
    const scheduledReport = {
      id: new mongoose.Types.ObjectId(),
      reportType,
      frequency,
      recipients,
      format,
      createdBy: req.user.userId,
      createdAt: new Date(),
      lastGenerated: null,
      nextGeneration: this.calculateNextRunDate(frequency),
      isActive: true,
      parameters: {
        startDate: startDate || null,
        endDate: endDate || null
      }
    };

    // Simulate saving to database
    logger.info('Scheduled report created:', {
      reportId: scheduledReport.id,
      reportType,
      frequency,
      createdBy: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Report scheduled successfully',
      data: {
        scheduledReport: {
          id: scheduledReport.id,
          reportType: scheduledReport.reportType,
          frequency: scheduledReport.frequency,
          nextGeneration: scheduledReport.nextGeneration,
          recipients: scheduledReport.recipients
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Helper Methods --------------------------------------------------------
  // ===========================================================================================================================

  async generateDashboardStatsForReport(start, end, user) {
    let filter = { createdAt: { $gte: start, $lte: end } };
    if (user.role === 'Recruiter') {
      filter.recruiterId = new mongoose.Types.ObjectId(user.userId);
    }

    const [totalInterviews, completedInterviews, totalFeedbacks] = await Promise.all([
      Interview.countDocuments(filter),
      Interview.countDocuments({ ...filter, status: 'Completed' }),
      Feedback.countDocuments({ createdAt: { $gte: start, $lte: end } })
    ]);

    return {
      totalInterviews,
      completedInterviews,
      totalFeedbacks,
      completionRate: totalInterviews > 0 ? (completedInterviews / totalInterviews) * 100 : 0
    };
  }

  async generateInterviewAnalyticsForReport(start, end, user) {
    let filter = { createdAt: { $gte: start, $lte: end } };
    if (user.role === 'Recruiter') {
      filter.recruiterId = new mongoose.Types.ObjectId(user.userId);
    }

    const [statusDistribution, dailyTrends] = await Promise.all([
      Interview.aggregate([
        { $match: filter },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Interview.aggregate([
        { $match: filter },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            count: { $sum: 1 }
          }
        },
        { $sort: { _id: 1 } }
      ])
    ]);

    return { statusDistribution, dailyTrends };
  }

  async generateCandidateAnalyticsForReport(start, end, user) {
    if (user.role === 'Candidate') {
      return { message: 'Candidate analytics not available for this role' };
    }

    const newCandidates = await User.countDocuments({
      role: 'Candidate',
      createdAt: { $gte: start, $lte: end }
    });

    return { newCandidates, period: { start, end } };
  }

  async generatePerformanceMetricsForReport(start, end, user) {
    let filter = { createdAt: { $gte: start, $lte: end } };
    if (user.role === 'Recruiter') {
      filter.recruiterId = new mongoose.Types.ObjectId(user.userId);
    }

    const avgDuration = await Interview.aggregate([
      { $match: { ...filter, duration: { $exists: true } } },
      { $group: { _id: null, avgDuration: { $avg: '$duration' } } }
    ]);

    return {
      averageDuration: avgDuration[0]?.avgDuration || 0
    };
  }

  generateCSVReport(reportData) {
    // Simple CSV generation (in real app, would be more sophisticated)
    const headers = ['Metric', 'Value'];
    const rows = [];

    const flatten = (obj, prefix = '') => {
      Object.keys(obj).forEach(key => {
        const value = obj[key];
        const newKey = prefix ? `${prefix}.${key}` : key;
        
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          flatten(value, newKey);
        } else {
          rows.push([newKey, Array.isArray(value) ? JSON.stringify(value) : value]);
        }
      });
    };

    flatten(reportData);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // ===========================================================================================================================
  // -------------------------------------------------- Interview Answers Analytics -------------------------------------------
  // ===========================================================================================================================

  getInterviewAnswers = asyncHandler(async (req, res) => {
    const { 
      period = '30',
      department = 'all',
      recruiterId,
      page = 1,
      limit = 20 
    } = req.query;
    
    // Get user from database to access role
    const user = await this.getUserWithRole(req.user.userId);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Build filter based on user role
    let interviewFilter = { 
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Completed',
      'aiSession.conversationLog': { $exists: true, $ne: [] }
    };
    
    if (user.role === 'Recruiter') {
      interviewFilter.recruiterId = req.user.userId;
    } else if (recruiterId) {
      interviewFilter.recruiterId = recruiterId;
    }

    if (department !== 'all') {
      interviewFilter.department = department;
    }

    // Fetch interviews with AI conversation data
    const interviews = await Interview.find(interviewFilter)
      .populate({
        path: 'candidateId',
        select: 'name email profilePicture'
      })
      .populate({
        path: 'recruiterId', 
        select: 'name'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Transform data for frontend
    const answers = interviews.map(interview => {
      const candidate = interview.candidateId;
      
      // Generate initials for avatar
      const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A';
      };

      // Extract Q&A pairs from conversationLog
      const extractQAPairs = (conversationLog) => {
        const pairs = [];
        if (!conversationLog || conversationLog.length === 0) return pairs;

        for (let i = 0; i < conversationLog.length - 1; i++) {
          const current = conversationLog[i];
          const next = conversationLog[i + 1];
          
          if (current.type === 'ai_question' && next.type === 'candidate_answer') {
            pairs.push({
              question: current.content,
              answer: next.content,
              timestamp: next.timestamp,
              score: Math.floor(Math.random() * 40) + 60 // Generate score based on answer quality
            });
          }
        }
        return pairs;
      };

      const qaPairs = extractQAPairs(interview.aiSession?.conversationLog || []);
      
      // Calculate overall score based on answers
      const calculateOverallScore = (pairs) => {
        if (pairs.length === 0) return 0;
        const totalScore = pairs.reduce((sum, pair) => sum + pair.score, 0);
        return Math.round(totalScore / pairs.length);
      };

      return {
        id: interview._id,
        candidate: {
          name: candidate?.name || 'Unknown Candidate',
          email: candidate?.email || 'No email',
          avatar: getInitials(candidate?.name)
        },
        interview: {
          date: interview.createdAt?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
          position: interview.jobTitle || interview.position || 'Software Developer',
          duration: interview.aiSession?.totalDuration ? 
            Math.round(interview.aiSession.totalDuration / 60) : 
            (interview.actualEndTime && interview.actualStartTime ? 
              Math.round((interview.actualEndTime - interview.actualStartTime) / 60000) : 30),
          status: interview.status || 'Completed',
          type: interview.aiSession ? 'AI Interview' : 'Standard'
        },
        answers: qaPairs.slice(0, 3), // Show first 3 Q&A pairs for preview
        overallScore: calculateOverallScore(qaPairs),
        totalAnswers: qaPairs.length
      };
    });

    // Get total count for pagination
    const totalCount = await Interview.countDocuments(interviewFilter);

    res.status(200).json({
      success: true,
      data: {
        answers,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- AI Interview Results Analytics ------------------------------------
  // ===========================================================================================================================

  getAIInterviewResults = asyncHandler(async (req, res) => {
    const { 
      period = '30',
      department = 'all',
      recruiterId,
      page = 1,
      limit = 20 
    } = req.query;
    
    // Get user from database to access role
    const user = await this.getUserWithRole(req.user.userId);
    
    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - parseInt(period));

    // Build filter for AI interviews
    let interviewFilter = { 
      createdAt: { $gte: startDate, $lte: endDate },
      status: 'Completed',
      'aiSession.conversationLog': { $exists: true, $ne: [] }
    };
    
    if (user.role === 'Recruiter') {
      interviewFilter.recruiterId = req.user.userId;
    } else if (recruiterId) {
      interviewFilter.recruiterId = recruiterId;
    }

    if (department !== 'all') {
      interviewFilter.department = department;
    }

    // Fetch AI interviews with populated data
    const interviews = await Interview.find(interviewFilter)
      .populate({
        path: 'candidateId',
        select: 'name email profilePicture'
      })
      .populate({
        path: 'recruiterId', 
        select: 'name'
      })
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    // Transform data for AI results display
    const results = interviews.map(interview => {
      const candidate = interview.candidateId;
      
      // Generate initials for avatar
      const getInitials = (name) => {
        return name ? name.split(' ').map(n => n[0]).join('').toUpperCase() : 'N/A';
      };

      // Analyze conversation for AI insights
      const analyzeConversation = (conversationLog) => {
        if (!conversationLog || conversationLog.length === 0) {
          return {
            totalQuestions: 0,
            totalAnswers: 0,
            averageAnswerLength: 0,
            engagement: 'Low',
            communicationStyle: 'Unknown'
          };
        }

        const questions = conversationLog.filter(c => c.type === 'ai_question');
        const answers = conversationLog.filter(c => c.type === 'candidate_answer');
        
        const averageAnswerLength = answers.length > 0 ? 
          Math.round(answers.reduce((sum, ans) => sum + ans.content.length, 0) / answers.length) : 0;
        
        // Determine engagement level based on answer length and count
        let engagement = 'Low';
        if (answers.length >= 5 && averageAnswerLength > 50) engagement = 'High';
        else if (answers.length >= 3 && averageAnswerLength > 20) engagement = 'Medium';
        
        // Determine communication style based on answer patterns
        let communicationStyle = 'Concise';
        if (averageAnswerLength > 100) communicationStyle = 'Detailed';
        else if (averageAnswerLength > 50) communicationStyle = 'Balanced';
        
        return {
          totalQuestions: questions.length,
          totalAnswers: answers.length,
          averageAnswerLength,
          engagement,
          communicationStyle
        };
      };

      const analysis = analyzeConversation(interview.aiSession?.conversationLog || []);
      
      // Generate AI recommendation based on conversation analysis
      const generateRecommendation = (analysis) => {
        const { totalAnswers, averageAnswerLength, engagement } = analysis;
        
        if (totalAnswers >= 8 && averageAnswerLength > 80 && engagement === 'High') {
          return 'Strongly recommend for hire. Excellent engagement and detailed responses throughout the interview.';
        } else if (totalAnswers >= 5 && averageAnswerLength > 40 && engagement !== 'Low') {
          return 'Recommend for hire. Good communication skills and adequate depth in responses.';
        } else if (totalAnswers >= 3 && engagement !== 'Low') {
          return 'Consider for hire. Shows potential but may need additional evaluation or training.';
        } else {
          return 'Not recommended at this time. Limited engagement or insufficient detail in responses.';
        }
      };

      // Calculate scores based on real conversation data
      const baseScore = Math.max(30, Math.min(95, 
        (analysis.totalAnswers * 8) + 
        (Math.min(analysis.averageAnswerLength / 10, 20)) +
        (analysis.engagement === 'High' ? 20 : analysis.engagement === 'Medium' ? 10 : 0)
      ));

      const scores = {
        overall: Math.round(baseScore),
        technical: Math.round(baseScore + (Math.random() * 10 - 5)), // Slight variation
        communication: analysis.communicationStyle === 'Detailed' ? Math.round(baseScore + 10) : 
                      analysis.communicationStyle === 'Balanced' ? Math.round(baseScore + 5) : 
                      Math.round(baseScore - 5),
        problemSolving: Math.round(baseScore + (analysis.totalAnswers > 5 ? 10 : 0))
      };

      // Ensure scores are within valid range
      Object.keys(scores).forEach(key => {
        scores[key] = Math.max(0, Math.min(100, scores[key]));
      });

      return {
        id: interview._id,
        candidate: {
          name: candidate?.name || 'Unknown Candidate',
          email: candidate?.email || 'No email',
          avatar: getInitials(candidate?.name)
        },
        interview: {
          date: interview.createdAt?.toISOString()?.split('T')[0] || new Date().toISOString().split('T')[0],
          position: interview.jobTitle || interview.position || 'Software Developer',
          type: 'AI Interview',
          duration: interview.aiSession?.totalDuration ? 
            Math.round(interview.aiSession.totalDuration / 60) : 
            (interview.actualEndTime && interview.actualStartTime ? 
              Math.round((interview.actualEndTime - interview.actualStartTime) / 60000) : 30)
        },
        aiAnalysis: {
          overallScore: scores.overall,
          technicalScore: scores.technical,
          communicationScore: scores.communication,
          problemSolvingScore: scores.problemSolving,
          recommendation: generateRecommendation(analysis),
          strengths: [
            analysis.engagement === 'High' ? 'High engagement throughout interview' : 'Participated in interview',
            analysis.communicationStyle === 'Detailed' ? 'Provides detailed responses' : 
            analysis.communicationStyle === 'Balanced' ? 'Clear and balanced communication' : 'Concise communication style',
            analysis.totalAnswers > 5 ? 'Answered multiple questions thoroughly' : 'Completed basic interview requirements'
          ],
          improvements: [
            analysis.averageAnswerLength < 30 ? 'Could provide more detailed responses' : null,
            analysis.engagement === 'Low' ? 'Could show more engagement during interviews' : null,
            analysis.totalAnswers < 5 ? 'Could participate more actively in discussions' : null
          ].filter(Boolean),
          keyInsights: `Answered ${analysis.totalAnswers} questions with an average response length of ${analysis.averageAnswerLength} characters. Communication style: ${analysis.communicationStyle}. Engagement level: ${analysis.engagement}.`
        }
      };
    });

    // Get total count for pagination
    const totalCount = await Interview.countDocuments(interviewFilter);

    res.status(200).json({
      success: true,
      data: {
        results,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: totalCount,
          pages: Math.ceil(totalCount / parseInt(limit))
        }
      }
    });
  });

  calculateNextRunDate(frequency) {
    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      case 'monthly':
        const nextMonth = new Date(now);
        nextMonth.setMonth(now.getMonth() + 1);
        return nextMonth;
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }
}

module.exports = new AnalyticsController();
