const asyncHandler = require('express-async-handler');
const Feedback = require('../models/Feedback');
const Interview = require('../models/Interview');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class FeedbackController {
  // ===========================================================================================================================
  // -------------------------------------------------- Create Feedback -------------------------------------------------------
  // ===========================================================================================================================

  createFeedback = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Feedback creation validation failed', {
        errors: errors.array(),
        userId: req.user.userId
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const {
      interviewId,
      overallRating,
      interviewerRating,
      processRating,
      difficultyRating,
      fairnessRating,
      comments,
      wouldRecommend,
      isAnonymous = false
    } = req.body;

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only candidates can give feedback
    if (req.user.role !== 'Candidate') {
      throw new AppError('Only candidates can provide feedback', 403);
    }

    // Check if this is the candidate's interview
    if (interview.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only provide feedback for your own interviews', 403);
    }

    // Check if feedback already exists for this interview
    const existingFeedback = await Feedback.findOne({
      interviewId,
      candidateId: req.user.userId
    });

    if (existingFeedback) {
      throw new AppError('You have already provided feedback for this interview', 400);
    }

    // Create feedback
    const feedbackData = {
      interviewId,
      candidateId: req.user.userId,
      overallRating,
      interviewerRating,
      processRating,
      difficultyRating,
      fairnessRating,
      comments,
      wouldRecommend,
      isAnonymous
    };

    const feedback = await Feedback.create(feedbackData);

    // Populate candidateId field only if not anonymous
    const populateQuery = isAnonymous ? '' : 'candidateId';
    await feedback.populate(populateQuery, 'name email');
    await feedback.populate('interviewId', 'recruiterId status interviewDate');

    logger.info('Feedback created', {
      feedbackId: feedback._id,
      interviewId,
      candidateId: req.user.userId,
      overallRating,
      isAnonymous
    });

    res.status(201).json({
      success: true,
      message: 'Feedback submitted successfully',
      data: {
        feedback
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get All Feedback ------------------------------------------------------
  // ===========================================================================================================================

  getAllFeedback = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      interviewId,
      candidateId,
      minRating,
      maxRating,
      isAnonymous,
      wouldRecommend,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Only admins and recruiters can view feedback
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot access this resource', 403);
    }

    // Build query filters
    const query = {};

    if (interviewId) query.interviewId = interviewId;
    if (candidateId) query.candidateId = candidateId;
    if (isAnonymous !== undefined) query.isAnonymous = isAnonymous === 'true';
    if (wouldRecommend !== undefined) query.wouldRecommend = wouldRecommend === 'true';

    if (minRating && maxRating) {
      query.overallRating = {
        $gte: parseInt(minRating),
        $lte: parseInt(maxRating)
      };
    } else if (minRating) {
      query.overallRating = { $gte: parseInt(minRating) };
    } else if (maxRating) {
      query.overallRating = { $lte: parseInt(maxRating) };
    }

    // If user is recruiter, only show feedback for their interviews
    if (req.user.role === 'Recruiter') {
      const recruiterInterviews = await Interview.find({
        recruiterId: req.user.userId
      }).select('_id');

      const interviewIds = recruiterInterviews.map(interview => interview._id);
      query.interviewId = { $in: interviewIds };
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query)
        .populate({
          path: 'candidateId',
          select: 'name email',
          match: { $expr: { $eq: ['$isAnonymous', false] } } // Only populate if not anonymous
        })
        .populate('interviewId', 'recruiterId candidateId status interviewDate')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Feedback.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalFeedbacks: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Feedback by ID ----------------------------------------------------
  // ===========================================================================================================================

  getFeedbackById = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId)
      .populate({
        path: 'candidateId',
        select: 'name email',
        match: { $expr: { $eq: ['$isAnonymous', false] } }
      })
      .populate({
        path: 'interviewId',
        select: 'candidateId recruiterId status interviewDate',
        populate: [
          { path: 'candidateId', select: 'name email' },
          { path: 'recruiterId', select: 'name email' }
        ]
      })
      .lean();

    if (!feedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Check permissions
    const interview = feedback.interviewId;

    if (req.user.role === 'Candidate') {
      // Candidates can only view their own feedback
      if (feedback.candidateId && feedback.candidateId._id.toString() !== req.user.userId) {
        throw new AppError('You can only view your own feedback', 403);
      }
    } else if (req.user.role === 'Recruiter') {
      // Recruiters can view feedback for their interviews
      if (interview.recruiterId._id.toString() !== req.user.userId) {
        throw new AppError('You can only view feedback for your own interviews', 403);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        feedback
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Update Feedback -------------------------------------------------------
  // ===========================================================================================================================

  updateFeedback = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { feedbackId } = req.params;

    // Get existing feedback
    const existingFeedback = await Feedback.findById(feedbackId);

    if (!existingFeedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Check permissions - only the candidate who gave feedback or admin can update
    if (req.user.role !== 'Admin' && existingFeedback.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only update your own feedback', 403);
    }

    // Update feedback
    const updateData = { ...req.body, updatedAt: new Date() };
    const updatedFeedback = await Feedback.findByIdAndUpdate(
      feedbackId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('candidateId', 'name email')
      .populate('interviewId', 'candidateId recruiterId status')
      .lean();

    logger.info('Feedback updated', {
      feedbackId,
      updatedBy: req.user.userId,
      updatedFields: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      message: 'Feedback updated successfully',
      data: {
        feedback: updatedFeedback
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Delete Feedback -------------------------------------------------------
  // ===========================================================================================================================

  deleteFeedback = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    // Get existing feedback
    const existingFeedback = await Feedback.findById(feedbackId);

    if (!existingFeedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Check permissions - only the candidate who gave feedback or admin can delete
    if (req.user.role !== 'Admin' && existingFeedback.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only delete your own feedback', 403);
    }

    // Delete feedback
    await Feedback.findByIdAndDelete(feedbackId);

    logger.info('Feedback deleted', {
      feedbackId,
      deletedBy: req.user.userId,
      interviewId: existingFeedback.interviewId
    });

    res.status(200).json({
      success: true,
      message: 'Feedback deleted successfully'
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Feedback by Interview ---------------------------------------------
  // ===========================================================================================================================

  getFeedbackByInterview = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only view feedback for your own interviews', 403);
    } else if (req.user.role === 'Candidate') {
      if (interview.candidateId.toString() !== req.user.userId) {
        throw new AppError('You can only view feedback for your own interviews', 403);
      }
    }

    const feedbacks = await Feedback.find({ interviewId })
      .populate({
        path: 'candidateId',
        select: 'name email',
        match: { $expr: { $eq: ['$isAnonymous', false] } }
      })
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        totalFeedbacks: feedbacks.length
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Feedback Statistics -----------------------------------------------
  // ===========================================================================================================================

  getFeedbackStatistics = asyncHandler(async (req, res) => {
    // Only admins can view feedback statistics
    if (req.user.role !== 'Admin') {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    const [
      totalFeedbacks,
      anonymousFeedbacks,
      averageRatings,
      ratingDistribution,
      recommendationStats,
      feedbackByMonth
    ] = await Promise.all([
      Feedback.countDocuments(),
      Feedback.countDocuments({ isAnonymous: true }),
      Feedback.aggregate([
        {
          $group: {
            _id: null,
            avgOverallRating: { $avg: '$overallRating' },
            avgInterviewerRating: { $avg: '$interviewerRating' },
            avgProcessRating: { $avg: '$processRating' },
            avgDifficultyRating: { $avg: '$difficultyRating' },
            avgFairnessRating: { $avg: '$fairnessRating' }
          }
        }
      ]),
      Feedback.aggregate([
        {
          $bucket: {
            groupBy: '$overallRating',
            boundaries: [1, 2, 3, 4, 5, 6],
            default: 'Other',
            output: {
              count: { $sum: 1 }
            }
          }
        }
      ]),
      Feedback.aggregate([
        {
          $group: {
            _id: '$wouldRecommend',
            count: { $sum: 1 }
          }
        }
      ]),
      Feedback.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            avgRating: { $avg: '$overallRating' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    const statistics = {
      totalFeedbacks,
      anonymousFeedbacks,
      publicFeedbacks: totalFeedbacks - anonymousFeedbacks,
      averageRatings: averageRatings[0] || {
        avgOverallRating: 0,
        avgInterviewerRating: 0,
        avgProcessRating: 0,
        avgDifficultyRating: 0,
        avgFairnessRating: 0
      },
      ratingDistribution,
      recommendationStats,
      feedbackByMonth
    };

    res.status(200).json({
      success: true,
      data: {
        statistics
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Recruiter Feedback Summary ------------------------------------
  // ===========================================================================================================================

  getRecruiterFeedbackSummary = asyncHandler(async (req, res) => {
    const { recruiterId = req.user.userId } = req.params;

    // Check permissions - recruiters can only view their own summary
    if (req.user.role === 'Recruiter' && recruiterId !== req.user.userId) {
      throw new AppError('You can only view your own feedback summary', 403);
    }

    // Get recruiter's interviews
    const recruiterInterviews = await Interview.find({
      recruiterId
    }).select('_id');

    const interviewIds = recruiterInterviews.map(interview => interview._id);

    if (interviewIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          summary: {
            totalFeedbacks: 0,
            averageRatings: {
              overall: 0,
              interviewer: 0,
              process: 0,
              difficulty: 0,
              fairness: 0
            },
            recommendationRate: 0,
            recentFeedbacks: []
          }
        }
      });
    }

    const [
      totalFeedbacks,
      averageRatings,
      recommendationStats,
      recentFeedbacks
    ] = await Promise.all([
      Feedback.countDocuments({ interviewId: { $in: interviewIds } }),
      Feedback.aggregate([
        { $match: { interviewId: { $in: interviewIds } } },
        {
          $group: {
            _id: null,
            avgOverallRating: { $avg: '$overallRating' },
            avgInterviewerRating: { $avg: '$interviewerRating' },
            avgProcessRating: { $avg: '$processRating' },
            avgDifficultyRating: { $avg: '$difficultyRating' },
            avgFairnessRating: { $avg: '$fairnessRating' }
          }
        }
      ]),
      Feedback.aggregate([
        { $match: { interviewId: { $in: interviewIds } } },
        {
          $group: {
            _id: '$wouldRecommend',
            count: { $sum: 1 }
          }
        }
      ]),
      Feedback.find({ interviewId: { $in: interviewIds } })
        .populate({
          path: 'candidateId',
          select: 'name email',
          match: { $expr: { $eq: ['$isAnonymous', false] } }
        })
        .populate('interviewId', 'status interviewDate')
        .sort({ createdAt: -1 })
        .limit(5)
        .lean()
    ]);

    const recommendationRate = recommendationStats.length > 0
      ? (recommendationStats.find(stat => stat._id === true)?.count || 0) / totalFeedbacks * 100
      : 0;

    const summary = {
      totalFeedbacks,
      averageRatings: {
        overall: averageRatings[0]?.avgOverallRating || 0,
        interviewer: averageRatings[0]?.avgInterviewerRating || 0,
        process: averageRatings[0]?.avgProcessRating || 0,
        difficulty: averageRatings[0]?.avgDifficultyRating || 0,
        fairness: averageRatings[0]?.avgFairnessRating || 0
      },
      recommendationRate: Math.round(recommendationRate * 100) / 100,
      recentFeedbacks
    };

    res.status(200).json({
      success: true,
      data: {
        summary
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Feedback Analytics --------------------------------------------
  // ===========================================================================================================================

  getFeedbackAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate, groupBy = 'month' } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Permission check - users can only see their own analytics
    if (req.user.role === 'Recruiter') {
      const recruiterInterviews = await Interview.find({
        recruiterId: req.user.userId
      }).select('_id');

      const interviewIds = recruiterInterviews.map(interview => interview._id);
      dateFilter.interviewId = { $in: interviewIds };
    }

    let groupStage;
    if (groupBy === 'day') {
      groupStage = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' },
        day: { $dayOfMonth: '$createdAt' }
      };
    } else if (groupBy === 'week') {
      groupStage = {
        year: { $year: '$createdAt' },
        week: { $week: '$createdAt' }
      };
    } else { // month
      groupStage = {
        year: { $year: '$createdAt' },
        month: { $month: '$createdAt' }
      };
    }

    const analytics = await Feedback.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupStage,
          count: { $sum: 1 },
          avgOverallRating: { $avg: '$overallRating' },
          avgInterviewerRating: { $avg: '$interviewerRating' },
          avgProcessRating: { $avg: '$processRating' },
          avgDifficultyRating: { $avg: '$difficultyRating' },
          avgFairnessRating: { $avg: '$fairnessRating' },
          recommendationCount: {
            $sum: { $cond: ['$wouldRecommend', 1, 0] }
          },
          anonymousCount: {
            $sum: { $cond: ['$isAnonymous', 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': -1, '_id.month': -1, '_id.day': -1, '_id.week': -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: {
        analytics,
        groupBy,
        period: { startDate, endDate }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Feedback by Candidate ---------------------------------------------
  // ===========================================================================================================================

  getFeedbackByCandidate = asyncHandler(async (req, res) => {
    const { candidateId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check permissions
    if (req.user.role === 'Candidate' && candidateId !== req.user.userId) {
      throw new AppError('You can only view your own feedback', 403);
    } else if (req.user.role === 'Recruiter') {
      throw new AppError('Recruiters cannot access candidate feedback directly', 403);
    }

    // Check if candidate exists
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'Candidate') {
      throw new AppError('Candidate not found', 404);
    }

    // Build query
    const query = { candidateId };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [feedbacks, total] = await Promise.all([
      Feedback.find(query)
        .populate({
          path: 'candidateId',
          select: 'name email',
          match: { $expr: { $eq: ['$isAnonymous', false] } }
        })
        .populate('interviewId', 'recruiterId status interviewDate')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Feedback.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        feedbacks,
        candidateInfo: {
          candidateId,
          candidateName: candidate.name,
          totalFeedbacks: total
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalFeedbacks: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Interview Rating --------------------------------------------------
  // ===========================================================================================================================

  getInterviewRating = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Check if interview exists
    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
      
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions
    if (req.user.role === 'Recruiter' && interview.recruiterId._id.toString() !== req.user.userId) {
      throw new AppError('You can only view ratings for your own interviews', 403);
    } else if (req.user.role === 'Candidate' && interview.candidateId._id.toString() !== req.user.userId) {
      throw new AppError('You can only view ratings for your own interviews', 403);
    }

    // Get feedback for the interview
    const feedbacks = await Feedback.find({ interviewId }).lean();

    if (feedbacks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          interviewInfo: {
            interviewId,
            candidateName: interview.candidateId.name,
            recruiterName: interview.recruiterId.name,
            interviewDate: interview.interviewDate,
            status: interview.status
          },
          rating: {
            averageOverallRating: 0,
            averageInterviewerRating: 0,
            averageProcessRating: 0,
            averageDifficultyRating: 0,
            averageFairnessRating: 0,
            totalFeedbacks: 0,
            recommendationRate: 0
          }
        }
      });
    }

    // Calculate average ratings
    const averageOverallRating = feedbacks.reduce((sum, feedback) => sum + feedback.overallRating, 0) / feedbacks.length;
    const averageInterviewerRating = feedbacks.reduce((sum, feedback) => sum + (feedback.interviewerRating || 0), 0) / feedbacks.length;
    const averageProcessRating = feedbacks.reduce((sum, feedback) => sum + (feedback.processRating || 0), 0) / feedbacks.length;
    const averageDifficultyRating = feedbacks.reduce((sum, feedback) => sum + (feedback.difficultyRating || 0), 0) / feedbacks.length;
    const averageFairnessRating = feedbacks.reduce((sum, feedback) => sum + (feedback.fairnessRating || 0), 0) / feedbacks.length;
    
    const recommendationCount = feedbacks.filter(feedback => feedback.wouldRecommend === true).length;
    const recommendationRate = (recommendationCount / feedbacks.length) * 100;

    res.status(200).json({
      success: true,
      data: {
        interviewInfo: {
          interviewId,
          candidateName: interview.candidateId.name,
          recruiterName: interview.recruiterId.name,
          interviewDate: interview.interviewDate,
          status: interview.status
        },
        rating: {
          averageOverallRating: Math.round(averageOverallRating * 100) / 100,
          averageInterviewerRating: Math.round(averageInterviewerRating * 100) / 100,
          averageProcessRating: Math.round(averageProcessRating * 100) / 100,
          averageDifficultyRating: Math.round(averageDifficultyRating * 100) / 100,
          averageFairnessRating: Math.round(averageFairnessRating * 100) / 100,
          totalFeedbacks: feedbacks.length,
          recommendationRate: Math.round(recommendationRate * 100) / 100
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Generate AI Feedback --------------------------------------------------
  // ===========================================================================================================================

  generateAIFeedback = asyncHandler(async (req, res) => {
    const { interviewId, candidateId } = req.body;

    // Only admins and recruiters can generate AI feedback
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot generate AI feedback', 403);
    }

    // Check if interview exists
    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
      
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions for recruiters
    if (req.user.role === 'Recruiter' && interview.recruiterId._id.toString() !== req.user.userId) {
      throw new AppError('You can only generate AI feedback for your own interviews', 403);
    }

    // Simulate AI feedback generation (in real implementation, this would call an AI service)
    const aiFeedback = this.generateAIInsights(interview);

    logger.info('AI feedback generated', {
      interviewId,
      generatedBy: req.user.userId,
      candidateId: interview.candidateId._id
    });

    res.status(200).json({
      success: true,
      message: 'AI feedback generated successfully',
      data: {
        aiFeedback,
        interviewInfo: {
          interviewId,
          candidateName: interview.candidateId.name,
          recruiterName: interview.recruiterId.name,
          interviewDate: interview.interviewDate
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Enhance Feedback with AI ----------------------------------------------
  // ===========================================================================================================================

  enhanceFeedbackWithAI = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId)
      .populate('candidateId', 'name email')
      .populate('interviewId', 'candidateId recruiterId status interviewDate');

    if (!feedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Check permissions
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot enhance feedback with AI', 403);
    }

    const interview = feedback.interviewId;
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only enhance feedback for your own interviews', 403);
    }

    // Generate AI enhancements
    const aiEnhancements = this.generateAIEnhancements(feedback);

    logger.info('Feedback enhanced with AI', {
      feedbackId,
      enhancedBy: req.user.userId,
      interviewId: interview._id
    });

    res.status(200).json({
      success: true,
      message: 'Feedback enhanced with AI insights successfully',
      data: {
        originalFeedback: feedback,
        aiEnhancements
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Generate Strength Analysis --------------------------------------------
  // ===========================================================================================================================

  generateStrengthAnalysis = asyncHandler(async (req, res) => {
    const { candidateId } = req.params;

    // Check permissions
    if (req.user.role === 'Candidate' && candidateId !== req.user.userId) {
      throw new AppError('You can only view your own strength analysis', 403);
    }

    // Check if candidate exists
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'Candidate') {
      throw new AppError('Candidate not found', 404);
    }

    // Get all feedback for the candidate
    const feedbacks = await Feedback.find({ candidateId })
      .populate('interviewId', 'recruiterId interviewDate status')
      .lean();

    if (feedbacks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          candidateInfo: {
            candidateId,
            candidateName: candidate.name
          },
          analysis: {
            message: 'No feedback available for strength analysis',
            totalFeedbacks: 0
          }
        }
      });
    }

    // Generate strength analysis
    const strengthAnalysis = this.analyzeStrengths(feedbacks, candidate);

    res.status(200).json({
      success: true,
      data: {
        candidateInfo: {
          candidateId,
          candidateName: candidate.name
        },
        analysis: strengthAnalysis
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Generate Improvement Plan ---------------------------------------------
  // ===========================================================================================================================

  generateImprovementPlan = asyncHandler(async (req, res) => {
    const { candidateId } = req.params;

    // Check permissions
    if (req.user.role === 'Candidate' && candidateId !== req.user.userId) {
      throw new AppError('You can only view your own improvement plan', 403);
    }

    // Check if candidate exists
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'Candidate') {
      throw new AppError('Candidate not found', 404);
    }

    // Get all feedback for the candidate
    const feedbacks = await Feedback.find({ candidateId })
      .populate('interviewId', 'recruiterId interviewDate status')
      .lean();

    if (feedbacks.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          candidateInfo: {
            candidateId,
            candidateName: candidate.name
          },
          plan: {
            message: 'No feedback available for improvement plan generation',
            totalFeedbacks: 0
          }
        }
      });
    }

    // Generate personalized improvement plan
    const improvementPlan = this.generatePersonalizedPlan(feedbacks, candidate);

    res.status(200).json({
      success: true,
      data: {
        candidateInfo: {
          candidateId,
          candidateName: candidate.name
        },
        plan: improvementPlan
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Deliver Feedback to Candidate ----------------------------------------
  // ===========================================================================================================================

  deliverFeedbackToCandidate = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;
    const { message, deliveryMethod = 'email' } = req.body;

    const feedback = await Feedback.findById(feedbackId)
      .populate('candidateId', 'name email')
      .populate('interviewId', 'recruiterId status interviewDate');

    if (!feedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Check permissions
    const interview = feedback.interviewId;
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only deliver feedback for your own interviews', 403);
    }

    // Simulate feedback delivery (in real implementation, this would send email/notification)
    const deliveryResult = await this.simulateFeedbackDelivery(feedback, message, deliveryMethod);

    // Update feedback with delivery information
    await Feedback.findByIdAndUpdate(feedbackId, {
      deliveryStatus: 'delivered',
      deliveredAt: new Date(),
      deliveredBy: req.user.userId,
      deliveryMethod: deliveryMethod
    });

    logger.info('Feedback delivered to candidate', {
      feedbackId,
      candidateId: feedback.candidateId._id,
      deliveredBy: req.user.userId,
      deliveryMethod
    });

    res.status(200).json({
      success: true,
      message: 'Feedback delivered successfully to candidate',
      data: {
        deliveryResult,
        feedbackId,
        candidateInfo: {
          candidateId: feedback.candidateId._id,
          candidateName: feedback.candidateId.name,
          candidateEmail: feedback.candidateId.email
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Schedule Follow Up ----------------------------------------------------
  // ===========================================================================================================================

  scheduleFollowUp = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;
    const { followUpDate, followUpType = 'email', notes } = req.body;

    const feedback = await Feedback.findById(feedbackId)
      .populate('candidateId', 'name email')
      .populate('interviewId', 'recruiterId status interviewDate');

    if (!feedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Check permissions
    const interview = feedback.interviewId;
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only schedule follow-ups for your own interviews', 403);
    }

    // Validate follow-up date
    const followUpDateTime = new Date(followUpDate);
    if (followUpDateTime <= new Date()) {
      throw new AppError('Follow-up date must be in the future', 400);
    }

    // Create follow-up record (in real implementation, this would integrate with a scheduling system)
    const followUp = {
      feedbackId,
      candidateId: feedback.candidateId._id,
      scheduledBy: req.user.userId,
      scheduledDate: followUpDateTime,
      followUpType,
      notes,
      status: 'scheduled',
      createdAt: new Date()
    };

    logger.info('Follow-up scheduled', {
      feedbackId,
      candidateId: feedback.candidateId._id,
      scheduledBy: req.user.userId,
      followUpDate: followUpDateTime,
      followUpType
    });

    res.status(201).json({
      success: true,
      message: 'Follow-up scheduled successfully',
      data: {
        followUp,
        candidateInfo: {
          candidateId: feedback.candidateId._id,
          candidateName: feedback.candidateId.name,
          candidateEmail: feedback.candidateId.email
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Feedback Delivery Status --------------------------------------
  // ===========================================================================================================================

  getFeedbackDeliveryStatus = asyncHandler(async (req, res) => {
    const { feedbackId } = req.params;

    const feedback = await Feedback.findById(feedbackId)
      .populate('candidateId', 'name email')
      .populate('interviewId', 'recruiterId status interviewDate')
      .lean();

    if (!feedback) {
      throw new AppError('Feedback not found', 404);
    }

    // Check permissions
    const interview = feedback.interviewId;
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only check delivery status for your own interviews', 403);
    } else if (req.user.role === 'Candidate' && feedback.candidateId._id.toString() !== req.user.userId) {
      throw new AppError('You can only check delivery status for your own feedback', 403);
    }

    const deliveryStatus = {
      feedbackId,
      deliveryStatus: feedback.deliveryStatus || 'not_delivered',
      deliveredAt: feedback.deliveredAt || null,
      deliveredBy: feedback.deliveredBy || null,
      deliveryMethod: feedback.deliveryMethod || null,
      candidateInfo: {
        candidateId: feedback.candidateId._id,
        candidateName: feedback.candidateId.name,
        candidateEmail: feedback.candidateId.email
      }
    };

    res.status(200).json({
      success: true,
      data: {
        deliveryStatus
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Export Feedback Report ------------------------------------------------
  // ===========================================================================================================================

  exportFeedbackReport = asyncHandler(async (req, res) => {
    const { 
      format = 'json',
      startDate,
      endDate,
      includeDetails = true,
      recruiterId
    } = req.query;

    // Only admins and recruiters can export reports
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot export feedback reports', 403);
    }

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Filter by recruiter if specified
    if (recruiterId) {
      const recruiterInterviews = await Interview.find({ 
        recruiterId 
      }).select('_id');
      
      const interviewIds = recruiterInterviews.map(interview => interview._id);
      dateFilter.interviewId = { $in: interviewIds };
    } else if (req.user.role === 'Recruiter') {
      // Recruiters can only export their own data
      const recruiterInterviews = await Interview.find({ 
        recruiterId: req.user.userId 
      }).select('_id');
      
      const interviewIds = recruiterInterviews.map(interview => interview._id);
      dateFilter.interviewId = { $in: interviewIds };
    }

    const feedbacks = await Feedback.find(dateFilter)
      .populate({
        path: 'candidateId',
        select: 'name email',
        match: { $expr: { $eq: ['$isAnonymous', false] } }
      })
      .populate({
        path: 'interviewId',
        select: 'candidateId recruiterId status interviewDate',
        populate: [
          { path: 'candidateId', select: 'name email' },
          { path: 'recruiterId', select: 'name email' }
        ]
      })
      .sort({ createdAt: -1 })
      .lean();

    // Generate report data
    const reportData = {
      metadata: {
        generatedAt: new Date(),
        generatedBy: req.user.userId,
        period: { startDate, endDate },
        totalFeedbacks: feedbacks.length
      },
      summary: {
        averageOverallRating: feedbacks.length > 0 
          ? feedbacks.reduce((sum, feedback) => sum + feedback.overallRating, 0) / feedbacks.length 
          : 0,
        averageInterviewerRating: feedbacks.length > 0
          ? feedbacks.reduce((sum, feedback) => sum + (feedback.interviewerRating || 0), 0) / feedbacks.length 
          : 0,
        averageProcessRating: feedbacks.length > 0
          ? feedbacks.reduce((sum, feedback) => sum + (feedback.processRating || 0), 0) / feedbacks.length 
          : 0,
        averageDifficultyRating: feedbacks.length > 0
          ? feedbacks.reduce((sum, feedback) => sum + (feedback.difficultyRating || 0), 0) / feedbacks.length 
          : 0,
        averageFairnessRating: feedbacks.length > 0
          ? feedbacks.reduce((sum, feedback) => sum + (feedback.fairnessRating || 0), 0) / feedbacks.length 
          : 0,
        recommendationRate: feedbacks.length > 0
          ? (feedbacks.filter(feedback => feedback.wouldRecommend).length / feedbacks.length) * 100
          : 0,
        anonymousFeedbacks: feedbacks.filter(feedback => feedback.isAnonymous).length
      },
      feedbacks: includeDetails === 'true' ? feedbacks : []
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = this.generateFeedbackCSVReport(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=feedback_report.csv');
      return res.send(csvData);
    }

    res.status(200).json({
      success: true,
      data: {
        report: reportData
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Helper Methods --------------------------------------------------------
  // ===========================================================================================================================

  generateAIInsights(interview) {
    // Simulate AI analysis (in real implementation, this would call an AI service)
    return {
      overallRating: Math.floor(Math.random() * 2) + 4, // 4-5 rating
      interviewerRating: Math.floor(Math.random() * 2) + 4,
      processRating: Math.floor(Math.random() * 2) + 4,
      difficultyRating: Math.floor(Math.random() * 3) + 3, // 3-5 rating
      fairnessRating: 5,
      comments: `Based on AI analysis of the interview with ${interview.candidateId.name}, the candidate demonstrated strong technical skills and good communication. The interview process was well-structured and fair.`,
      wouldRecommend: true,
      aiGeneratedInsights: [
        'Candidate showed excellent problem-solving skills',
        'Communication was clear and professional',
        'Technical knowledge appears strong',
        'Good cultural fit based on responses'
      ],
      confidenceScore: Math.floor(Math.random() * 20) + 80 // 80-100% confidence
    };
  }

  generateAIEnhancements(feedback) {
    return {
      sentimentAnalysis: {
        overallSentiment: 'positive',
        sentimentScore: 0.8,
        keyWords: ['professional', 'skilled', 'communication', 'technical']
      },
      suggestedImprovements: [
        'Consider providing more specific examples in technical discussions',
        'Practice explaining complex concepts in simpler terms',
        'Continue developing leadership experience'
      ],
      strengthsIdentified: [
        'Strong technical foundation',
        'Good problem-solving approach',
        'Professional communication style'
      ],
      recommendedActions: [
        'Schedule follow-up technical assessment',
        'Provide coding challenge resources',
        'Connect with senior team members for mentoring'
      ],
      aiConfidence: Math.floor(Math.random() * 15) + 85 // 85-100% confidence
    };
  }

  analyzeStrengths(feedbacks, candidate) {
    const totalFeedbacks = feedbacks.length;
    
    // Analyze ratings
    const avgRatings = {
      overall: feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / totalFeedbacks,
      interviewer: feedbacks.reduce((sum, f) => sum + (f.interviewerRating || 0), 0) / totalFeedbacks,
      process: feedbacks.reduce((sum, f) => sum + (f.processRating || 0), 0) / totalFeedbacks,
      difficulty: feedbacks.reduce((sum, f) => sum + (f.difficultyRating || 0), 0) / totalFeedbacks,
      fairness: feedbacks.reduce((sum, f) => sum + (f.fairnessRating || 0), 0) / totalFeedbacks
    };

    // Identify top strengths
    const strengths = [];
    if (avgRatings.overall >= 4) strengths.push('Consistently high performance');
    if (avgRatings.interviewer >= 4) strengths.push('Excellent interpersonal skills');
    if (avgRatings.process >= 4) strengths.push('Adapts well to interview processes');
    if (avgRatings.fairness >= 4) strengths.push('Values fair and ethical practices');

    return {
      totalFeedbacks,
      averageRatings: avgRatings,
      topStrengths: strengths,
      recommendationRate: (feedbacks.filter(f => f.wouldRecommend).length / totalFeedbacks) * 100,
      improvementTrend: this.calculateTrend(feedbacks),
      summary: `${candidate.name} shows consistent ${avgRatings.overall >= 4 ? 'excellent' : avgRatings.overall >= 3 ? 'good' : 'fair'} performance across ${totalFeedbacks} interview${totalFeedbacks > 1 ? 's' : ''}.`
    };
  }

  generatePersonalizedPlan(feedbacks, candidate) {
    const latestFeedback = feedbacks[feedbacks.length - 1];
    const avgRatings = {
      overall: feedbacks.reduce((sum, f) => sum + f.overallRating, 0) / feedbacks.length,
      interviewer: feedbacks.reduce((sum, f) => sum + (f.interviewerRating || 0), 0) / feedbacks.length,
      process: feedbacks.reduce((sum, f) => sum + (f.processRating || 0), 0) / feedbacks.length
    };

    const improvements = [];
    const actions = [];

    if (avgRatings.overall < 4) {
      improvements.push('Focus on overall interview performance');
      actions.push('Practice common interview questions');
      actions.push('Seek feedback from mentors');
    }

    if (avgRatings.interviewer < 4) {
      improvements.push('Enhance interpersonal and communication skills');
      actions.push('Practice active listening techniques');
      actions.push('Work on non-verbal communication');
    }

    if (avgRatings.process < 4) {
      improvements.push('Better preparation for interview processes');
      actions.push('Research company culture and values');
      actions.push('Prepare thoughtful questions for interviewers');
    }

    return {
      totalFeedbacks: feedbacks.length,
      currentPerformance: avgRatings,
      areasForImprovement: improvements,
      recommendedActions: actions,
      timeline: '3-6 months',
      nextSteps: [
        'Review feedback patterns',
        'Create practice schedule',
        'Track improvement metrics',
        'Schedule follow-up assessment'
      ],
      resources: [
        'Interview skills workshops',
        'Communication training courses',
        'Mock interview sessions',
        'Professional coaching services'
      ]
    };
  }

  calculateTrend(feedbacks) {
    if (feedbacks.length < 2) return 'insufficient_data';
    
    const recent = feedbacks.slice(-3);
    const older = feedbacks.slice(0, -3);
    
    if (older.length === 0) return 'insufficient_data';
    
    const recentAvg = recent.reduce((sum, f) => sum + f.overallRating, 0) / recent.length;
    const olderAvg = older.reduce((sum, f) => sum + f.overallRating, 0) / older.length;
    
    const difference = recentAvg - olderAvg;
    
    if (difference > 0.5) return 'improving';
    if (difference < -0.5) return 'declining';
    return 'stable';
  }

  async simulateFeedbackDelivery(feedback, message, method) {
    // Simulate email/notification delivery
    return {
      status: 'delivered',
      deliveredAt: new Date(),
      method: method,
      recipient: feedback.candidateId.email,
      message: message || 'Your interview feedback is now available.',
      deliveryId: `delivery_${Date.now()}`
    };
  }

  generateFeedbackCSVReport(reportData) {
    const headers = [
      'Feedback ID',
      'Interview Date',
      'Candidate Name',
      'Recruiter Name',
      'Overall Rating',
      'Interviewer Rating',
      'Process Rating',
      'Difficulty Rating',
      'Fairness Rating',
      'Would Recommend',
      'Is Anonymous',
      'Created At'
    ];
    
    const rows = reportData.feedbacks.map(feedback => [
      feedback._id,
      feedback.interviewId?.interviewDate || 'N/A',
      feedback.candidateId?.name || (feedback.isAnonymous ? 'Anonymous' : 'N/A'),
      feedback.interviewId?.recruiterId?.name || 'N/A',
      feedback.overallRating,
      feedback.interviewerRating || 0,
      feedback.processRating || 0,
      feedback.difficultyRating || 0,
      feedback.fairnessRating || 0,
      feedback.wouldRecommend ? 'Yes' : 'No',
      feedback.isAnonymous ? 'Yes' : 'No',
      feedback.createdAt
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new FeedbackController();
