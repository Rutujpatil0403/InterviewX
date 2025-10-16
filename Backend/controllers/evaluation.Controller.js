const asyncHandler = require('express-async-handler');
const Evaluation = require('../models/Evaluation');
const Interview = require('../models/Interview');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class EvaluationController {
  // ===========================================================================================================================
  // -------------------------------------------------- Create Evaluation ------------------------------------------------------
  // ===========================================================================================================================

  createEvaluation = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Evaluation creation validation failed', {
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
      overallScore,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      feedback,
      strengths,
      weaknesses,
      recommendations,
      isPublished = false
    } = req.body;

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check if user has permission to evaluate this interview
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only evaluate your own interviews', 403);
    }

    // Check if evaluation already exists for this interview and evaluator
    const existingEvaluation = await Evaluation.findOne({
      interviewId,
      evaluatedBy: req.user.userId
    });

    if (existingEvaluation) {
      throw new AppError('You have already evaluated this interview', 400);
    }

    // Create evaluation
    const evaluationData = {
      interviewId,
      evaluatedBy: req.user.userId,
      overallScore,
      technicalScore,
      communicationScore,
      problemSolvingScore,
      feedback,
      strengths,
      weaknesses,
      recommendations,
      isPublished
    };

    const evaluation = await Evaluation.create(evaluationData);
    
    // Populate evaluatedBy field
    await evaluation.populate('evaluatedBy', 'name email');
    await evaluation.populate('interviewId', 'candidateId recruiterId status');

    logger.info('Evaluation created', {
      evaluationId: evaluation._id,
      interviewId,
      evaluatedBy: req.user.userId,
      overallScore
    });

    res.status(201).json({
      success: true,
      message: 'Evaluation created successfully',
      data: {
        evaluation
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get All Evaluations ---------------------------------------------------
  // ===========================================================================================================================

  getAllEvaluations = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      interviewId,
      evaluatedBy,
      minScore,
      maxScore,
      isPublished,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build query filters
    const query = {};
    
    if (interviewId) query.interviewId = interviewId;
    if (evaluatedBy) query.evaluatedBy = evaluatedBy;
    if (isPublished !== undefined) query.isPublished = isPublished === 'true';
    
    if (minScore && maxScore) {
      query.overallScore = {
        $gte: parseInt(minScore),
        $lte: parseInt(maxScore)
      };
    } else if (minScore) {
      query.overallScore = { $gte: parseInt(minScore) };
    } else if (maxScore) {
      query.overallScore = { $lte: parseInt(maxScore) };
    }

    // If user is not admin, only show evaluations they can access
    if (req.user.role === 'Recruiter') {
      // Recruiters can see evaluations for their interviews
      const recruiterInterviews = await Interview.find({ 
        recruiterId: req.user.userId 
      }).select('_id');
      
      const interviewIds = recruiterInterviews.map(interview => interview._id);
      query.interviewId = { $in: interviewIds };
    } else if (req.user.role === 'Candidate') {
      // Candidates can see published evaluations for their interviews
      const candidateInterviews = await Interview.find({ 
        candidateId: req.user.userId 
      }).select('_id');
      
      const interviewIds = candidateInterviews.map(interview => interview._id);
      query.interviewId = { $in: interviewIds };
      query.isPublished = true;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [evaluations, total] = await Promise.all([
      Evaluation.find(query)
        .populate('evaluatedBy', 'name email role')
        .populate('interviewId', 'candidateId recruiterId status interviewDate')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Evaluation.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        evaluations,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalEvaluations: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Evaluation by ID --------------------------------------------------
  // ===========================================================================================================================

  getEvaluationById = asyncHandler(async (req, res) => {
    const { evaluationId } = req.params;

    const evaluation = await Evaluation.findById(evaluationId)
      .populate('evaluatedBy', 'name email role')
      .populate({
        path: 'interviewId',
        select: 'candidateId recruiterId status interviewDate',
        populate: [
          { path: 'candidateId', select: 'name email' },
          { path: 'recruiterId', select: 'name email' }
        ]
      })
      .lean();

    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    // Check permissions
    const interview = evaluation.interviewId;
    if (req.user.role === 'Recruiter' && interview.recruiterId._id.toString() !== req.user.userId) {
      throw new AppError('You can only view evaluations for your own interviews', 403);
    } else if (req.user.role === 'Candidate') {
      if (interview.candidateId._id.toString() !== req.user.userId) {
        throw new AppError('You can only view evaluations for your own interviews', 403);
      }
      if (!evaluation.isPublished) {
        throw new AppError('This evaluation is not published yet', 403);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        evaluation
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Update Evaluation -----------------------------------------------------
  // ===========================================================================================================================

  updateEvaluation = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { evaluationId } = req.params;

    // Get existing evaluation
    const existingEvaluation = await Evaluation.findById(evaluationId);
    
    if (!existingEvaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    // Check permissions - only the evaluator or admin can update
    if (req.user.role !== 'Admin' && existingEvaluation.evaluatedBy.toString() !== req.user.userId) {
      throw new AppError('You can only update your own evaluations', 403);
    }

    // Update evaluation
    const updateData = { ...req.body, updatedAt: new Date() };
    const updatedEvaluation = await Evaluation.findByIdAndUpdate(
      evaluationId,
      updateData,
      { new: true, runValidators: true }
    )
      .populate('evaluatedBy', 'name email role')
      .populate('interviewId', 'candidateId recruiterId status')
      .lean();

    logger.info('Evaluation updated', {
      evaluationId,
      updatedBy: req.user.userId,
      updatedFields: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation updated successfully',
      data: {
        evaluation: updatedEvaluation
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Delete Evaluation -----------------------------------------------------
  // ===========================================================================================================================

  deleteEvaluation = asyncHandler(async (req, res) => {
    const { evaluationId } = req.params;

    // Get existing evaluation
    const existingEvaluation = await Evaluation.findById(evaluationId);
    
    if (!existingEvaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    // Check permissions - only the evaluator or admin can delete
    if (req.user.role !== 'Admin' && existingEvaluation.evaluatedBy.toString() !== req.user.userId) {
      throw new AppError('You can only delete your own evaluations', 403);
    }

    // Delete evaluation
    await Evaluation.findByIdAndDelete(evaluationId);

    logger.info('Evaluation deleted', {
      evaluationId,
      deletedBy: req.user.userId,
      interviewId: existingEvaluation.interviewId
    });

    res.status(200).json({
      success: true,
      message: 'Evaluation deleted successfully'
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Evaluations by Interview ------------------------------------------
  // ===========================================================================================================================

  getEvaluationsByInterview = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Check if interview exists
    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only view evaluations for your own interviews', 403);
    } else if (req.user.role === 'Candidate') {
      if (interview.candidateId.toString() !== req.user.userId) {
        throw new AppError('You can only view evaluations for your own interviews', 403);
      }
    }

    // Build query
    const query = { interviewId };
    
    // Candidates can only see published evaluations
    if (req.user.role === 'Candidate') {
      query.isPublished = true;
    }

    const evaluations = await Evaluation.find(query)
      .populate('evaluatedBy', 'name email role')
      .sort({ createdAt: -1 })
      .lean();

    res.status(200).json({
      success: true,
      data: {
        evaluations,
        totalEvaluations: evaluations.length
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Evaluation Statistics ---------------------------------------------
  // ===========================================================================================================================

  getEvaluationStatistics = asyncHandler(async (req, res) => {
    // Only admins can view evaluation statistics
    if (req.user.role !== 'Admin') {
      throw new AppError('Access denied. Admin privileges required.', 403);
    }

    const [
      totalEvaluations,
      publishedEvaluations,
      unpublishedEvaluations,
      averageScores,
      scoreDistribution,
      evaluationsByMonth
    ] = await Promise.all([
      Evaluation.countDocuments(),
      Evaluation.countDocuments({ isPublished: true }),
      Evaluation.countDocuments({ isPublished: false }),
      Evaluation.aggregate([
        {
          $group: {
            _id: null,
            avgOverallScore: { $avg: '$overallScore' },
            avgTechnicalScore: { $avg: '$technicalScore' },
            avgCommunicationScore: { $avg: '$communicationScore' },
            avgProblemSolvingScore: { $avg: '$problemSolvingScore' }
          }
        }
      ]),
      Evaluation.aggregate([
        {
          $bucket: {
            groupBy: '$overallScore',
            boundaries: [0, 20, 40, 60, 80, 100],
            default: 'Other',
            output: {
              count: { $sum: 1 },
              averageScore: { $avg: '$overallScore' }
            }
          }
        }
      ]),
      Evaluation.aggregate([
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            count: { $sum: 1 },
            avgScore: { $avg: '$overallScore' }
          }
        },
        { $sort: { '_id.year': -1, '_id.month': -1 } },
        { $limit: 12 }
      ])
    ]);

    const statistics = {
      totalEvaluations,
      publishedEvaluations,
      unpublishedEvaluations,
      averageScores: averageScores[0] || {
        avgOverallScore: 0,
        avgTechnicalScore: 0,
        avgCommunicationScore: 0,
        avgProblemSolvingScore: 0
      },
      scoreDistribution,
      evaluationsByMonth
    };

    res.status(200).json({
      success: true,
      data: {
        statistics
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Publish/Unpublish Evaluation -----------------------------------------
  // ===========================================================================================================================

  togglePublishStatus = asyncHandler(async (req, res) => {
    const { evaluationId } = req.params;

    // Get existing evaluation
    const existingEvaluation = await Evaluation.findById(evaluationId);
    
    if (!existingEvaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    // Check permissions - only the evaluator or admin can publish
    if (req.user.role !== 'Admin' && existingEvaluation.evaluatedBy.toString() !== req.user.userId) {
      throw new AppError('You can only publish your own evaluations', 403);
    }

    // Toggle publish status
    const updatedEvaluation = await Evaluation.findByIdAndUpdate(
      evaluationId,
      { 
        isPublished: !existingEvaluation.isPublished,
        updatedAt: new Date()
      },
      { new: true }
    )
      .populate('evaluatedBy', 'name email role')
      .populate('interviewId', 'candidateId recruiterId status')
      .lean();

    const action = updatedEvaluation.isPublished ? 'published' : 'unpublished';

    logger.info('Evaluation publish status changed', {
      evaluationId,
      updatedBy: req.user.userId,
      action,
      isPublished: updatedEvaluation.isPublished
    });

    res.status(200).json({
      success: true,
      message: `Evaluation ${action} successfully`,
      data: {
        evaluation: updatedEvaluation
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Evaluations Analytics ---------------------------------------------
  // ===========================================================================================================================

  getEvaluationAnalytics = asyncHandler(async (req, res) => {
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

    const analytics = await Evaluation.aggregate([
      { $match: dateFilter },
      {
        $group: {
          _id: groupStage,
          count: { $sum: 1 },
          avgOverallScore: { $avg: '$overallScore' },
          avgTechnicalScore: { $avg: '$technicalScore' },
          avgCommunicationScore: { $avg: '$communicationScore' },
          avgProblemSolvingScore: { $avg: '$problemSolvingScore' },
          publishedCount: {
            $sum: { $cond: ['$isPublished', 1, 0] }
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
  // -------------------------------------------------- Get Evaluations by Candidate ------------------------------------------
  // ===========================================================================================================================

  getEvaluationsByCandidate = asyncHandler(async (req, res) => {
    const { candidateId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check permissions
    if (req.user.role === 'Candidate' && candidateId !== req.user.userId) {
      throw new AppError('You can only view your own evaluations', 403);
    }

    // Check if candidate exists
    const candidate = await User.findById(candidateId);
    if (!candidate || candidate.role !== 'Candidate') {
      throw new AppError('Candidate not found', 404);
    }

    // Get candidate's interviews
    const candidateInterviews = await Interview.find({ 
      candidateId 
    }).select('_id');
    
    const interviewIds = candidateInterviews.map(interview => interview._id);

    if (interviewIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: {
          evaluations: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalEvaluations: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    // Build query
    const query = { interviewId: { $in: interviewIds } };
    
    // Candidates can only see published evaluations
    if (req.user.role === 'Candidate') {
      query.isPublished = true;
    }

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [evaluations, total] = await Promise.all([
      Evaluation.find(query)
        .populate('evaluatedBy', 'name email role')
        .populate('interviewId', 'recruiterId status interviewDate')
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Evaluation.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        evaluations,
        candidateInfo: {
          candidateId,
          candidateName: candidate.name,
          totalInterviews: interviewIds.length
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalEvaluations: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Evaluations by Recruiter ------------------------------------------
  // ===========================================================================================================================

  getEvaluationsByRecruiter = asyncHandler(async (req, res) => {
    const { recruiterId } = req.params;
    const {
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Check permissions - recruiters can only view their own evaluations
    if (req.user.role === 'Recruiter' && recruiterId !== req.user.userId) {
      throw new AppError('You can only view your own evaluations', 403);
    }

    // Check if recruiter exists
    const recruiter = await User.findById(recruiterId);
    if (!recruiter || recruiter.role !== 'Recruiter') {
      throw new AppError('Recruiter not found', 404);
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
          evaluations: [],
          pagination: {
            currentPage: 1,
            totalPages: 0,
            totalEvaluations: 0,
            hasNext: false,
            hasPrev: false
          }
        }
      });
    }

    // Build query
    const query = { interviewId: { $in: interviewIds } };

    // Pagination
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    // Sort configuration
    const sortConfig = {};
    sortConfig[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const [evaluations, total] = await Promise.all([
      Evaluation.find(query)
        .populate('evaluatedBy', 'name email role')
        .populate({
          path: 'interviewId',
          select: 'candidateId status interviewDate',
          populate: {
            path: 'candidateId',
            select: 'name email'
          }
        })
        .sort(sortConfig)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Evaluation.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      data: {
        evaluations,
        recruiterInfo: {
          recruiterId,
          recruiterName: recruiter.name,
          totalInterviews: interviewIds.length
        },
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / parseInt(limit)),
          totalEvaluations: total,
          hasNext: skip + parseInt(limit) < total,
          hasPrev: parseInt(page) > 1
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Calculate Overall Score -----------------------------------------------
  // ===========================================================================================================================

  calculateOverallScore = asyncHandler(async (req, res) => {
    const { evaluationId } = req.params;
    const { weights = {} } = req.body;

    // Default weights if not provided
    const defaultWeights = {
      technical: 0.4,
      communication: 0.3,
      problemSolving: 0.3
    };

    const finalWeights = { ...defaultWeights, ...weights };

    // Validate weights sum to 1
    const totalWeight = Object.values(finalWeights).reduce((sum, weight) => sum + weight, 0);
    if (Math.abs(totalWeight - 1) > 0.01) {
      throw new AppError('Weights must sum to 1.0', 400);
    }

    const evaluation = await Evaluation.findById(evaluationId);
    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    // Check permissions
    if (req.user.role !== 'Admin' && evaluation.evaluatedBy.toString() !== req.user.userId) {
      throw new AppError('You can only calculate scores for your own evaluations', 403);
    }

    // Calculate weighted overall score
    const calculatedOverallScore = 
      (evaluation.technicalScore || 0) * finalWeights.technical +
      (evaluation.communicationScore || 0) * finalWeights.communication +
      (evaluation.problemSolvingScore || 0) * finalWeights.problemSolving;

    // Update the evaluation with calculated score
    const updatedEvaluation = await Evaluation.findByIdAndUpdate(
      evaluationId,
      { 
        overallScore: Math.round(calculatedOverallScore * 100) / 100,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('evaluatedBy', 'name email role')
      .populate('interviewId', 'candidateId recruiterId status')
      .lean();

    logger.info('Overall score calculated', {
      evaluationId,
      calculatedBy: req.user.userId,
      weights: finalWeights,
      calculatedScore: calculatedOverallScore
    });

    res.status(200).json({
      success: true,
      message: 'Overall score calculated successfully',
      data: {
        evaluation: updatedEvaluation,
        calculation: {
          weights: finalWeights,
          breakdown: {
            technical: evaluation.technicalScore * finalWeights.technical,
            communication: evaluation.communicationScore * finalWeights.communication,
            problemSolving: evaluation.problemSolvingScore * finalWeights.problemSolving
          },
          calculatedScore: Math.round(calculatedOverallScore * 100) / 100
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Get Score Breakdown ---------------------------------------------------
  // ===========================================================================================================================

  getScoreBreakdown = asyncHandler(async (req, res) => {
    const { evaluationId } = req.params;

    const evaluation = await Evaluation.findById(evaluationId)
      .populate('evaluatedBy', 'name email role')
      .populate({
        path: 'interviewId',
        select: 'candidateId recruiterId status interviewDate',
        populate: [
          { path: 'candidateId', select: 'name email' },
          { path: 'recruiterId', select: 'name email' }
        ]
      })
      .lean();

    if (!evaluation) {
      throw new AppError('Evaluation not found', 404);
    }

    // Check permissions
    const interview = evaluation.interviewId;
    if (req.user.role === 'Recruiter' && interview.recruiterId._id.toString() !== req.user.userId) {
      throw new AppError('You can only view breakdowns for your own interviews', 403);
    } else if (req.user.role === 'Candidate') {
      if (interview.candidateId._id.toString() !== req.user.userId) {
        throw new AppError('You can only view breakdowns for your own interviews', 403);
      }
      if (!evaluation.isPublished) {
        throw new AppError('This evaluation is not published yet', 403);
      }
    }

    // Calculate detailed breakdown
    const breakdown = {
      overallScore: evaluation.overallScore,
      individualScores: {
        technical: {
          score: evaluation.technicalScore || 0,
          percentage: evaluation.technicalScore || 0,
          category: this.getScoreCategory(evaluation.technicalScore || 0)
        },
        communication: {
          score: evaluation.communicationScore || 0,
          percentage: evaluation.communicationScore || 0,
          category: this.getScoreCategory(evaluation.communicationScore || 0)
        },
        problemSolving: {
          score: evaluation.problemSolvingScore || 0,
          percentage: evaluation.problemSolvingScore || 0,
          category: this.getScoreCategory(evaluation.problemSolvingScore || 0)
        }
      },
      overallCategory: this.getScoreCategory(evaluation.overallScore),
      strengths: evaluation.strengths || [],
      weaknesses: evaluation.weaknesses || [],
      recommendations: evaluation.recommendations || [],
      feedback: evaluation.feedback
    };

    res.status(200).json({
      success: true,
      data: {
        evaluation,
        breakdown
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Compare Evaluations ---------------------------------------------------
  // ===========================================================================================================================

  compareEvaluations = asyncHandler(async (req, res) => {
    const { evaluationIds } = req.body;

    if (!Array.isArray(evaluationIds) || evaluationIds.length < 2) {
      throw new AppError('At least 2 evaluation IDs are required for comparison', 400);
    }

    if (evaluationIds.length > 5) {
      throw new AppError('Maximum 5 evaluations can be compared at once', 400);
    }

    const evaluations = await Evaluation.find({
      _id: { $in: evaluationIds }
    })
      .populate('evaluatedBy', 'name email role')
      .populate({
        path: 'interviewId',
        select: 'candidateId recruiterId status interviewDate',
        populate: [
          { path: 'candidateId', select: 'name email' },
          { path: 'recruiterId', select: 'name email' }
        ]
      })
      .lean();

    if (evaluations.length !== evaluationIds.length) {
      throw new AppError('One or more evaluations not found', 404);
    }

    // Check permissions for each evaluation
    for (const evaluation of evaluations) {
      const interview = evaluation.interviewId;
      if (req.user.role === 'Recruiter' && interview.recruiterId._id.toString() !== req.user.userId) {
        throw new AppError('You can only compare evaluations from your own interviews', 403);
      } else if (req.user.role === 'Candidate') {
        if (interview.candidateId._id.toString() !== req.user.userId) {
          throw new AppError('You can only compare your own evaluations', 403);
        }
        if (!evaluation.isPublished) {
          throw new AppError('All evaluations must be published for comparison', 403);
        }
      }
    }

    // Calculate comparison metrics
    const comparison = {
      evaluations,
      summary: {
        averageOverallScore: evaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) / evaluations.length,
        averageTechnicalScore: evaluations.reduce((sum, evaluation) => sum + (evaluation.technicalScore || 0), 0) / evaluations.length,
        averageCommunicationScore: evaluations.reduce((sum, evaluation) => sum + (evaluation.communicationScore || 0), 0) / evaluations.length,
        averageProblemSolvingScore: evaluations.reduce((sum, evaluation) => sum + (evaluation.problemSolvingScore || 0), 0) / evaluations.length,
        scoreRange: {
          min: Math.min(...evaluations.map(evaluation => evaluation.overallScore)),
          max: Math.max(...evaluations.map(evaluation => evaluation.overallScore))
        }
      },
      insights: this.generateComparisonInsights(evaluations)
    };

    res.status(200).json({
      success: true,
      data: {
        comparison
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Generate Evaluation Report --------------------------------------------
  // ===========================================================================================================================

  generateEvaluationReport = asyncHandler(async (req, res) => {
    const { 
      format = 'json',
      startDate,
      endDate,
      includeDetails = true
    } = req.query;

    // Build date filter
    const dateFilter = {};
    if (startDate && endDate) {
      dateFilter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // Permission check - limit data based on role
    if (req.user.role === 'Recruiter') {
      const recruiterInterviews = await Interview.find({ 
        recruiterId: req.user.userId 
      }).select('_id');
      
      const interviewIds = recruiterInterviews.map(interview => interview._id);
      dateFilter.interviewId = { $in: interviewIds };
    }

    const evaluations = await Evaluation.find(dateFilter)
      .populate('evaluatedBy', 'name email role')
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
        totalEvaluations: evaluations.length
      },
      summary: {
        averageOverallScore: evaluations.length > 0 
          ? evaluations.reduce((sum, evaluation) => sum + evaluation.overallScore, 0) / evaluations.length 
          : 0,
        averageTechnicalScore: evaluations.length > 0
          ? evaluations.reduce((sum, evaluation) => sum + (evaluation.technicalScore || 0), 0) / evaluations.length 
          : 0,
        averageCommunicationScore: evaluations.length > 0
          ? evaluations.reduce((sum, evaluation) => sum + (evaluation.communicationScore || 0), 0) / evaluations.length 
          : 0,
        averageProblemSolvingScore: evaluations.length > 0
          ? evaluations.reduce((sum, evaluation) => sum + (evaluation.problemSolvingScore || 0), 0) / evaluations.length 
          : 0,
        publishedCount: evaluations.filter(evaluation => evaluation.isPublished).length,
        unpublishedCount: evaluations.filter(evaluation => !evaluation.isPublished).length
      },
      evaluations: includeDetails === 'true' ? evaluations : []
    };

    if (format === 'csv') {
      // Generate CSV format
      const csvData = this.generateCSVReport(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=evaluation_report.csv');
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

  getScoreCategory(score) {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Good';
    if (score >= 70) return 'Average';
    if (score >= 60) return 'Below Average';
    return 'Poor';
  }

  generateComparisonInsights(evaluations) {
    const insights = [];
    
    // Score trend analysis
    const scores = evaluations.map(evaluation => evaluation.overallScore);
    const isImproving = scores.every((score, i) => i === 0 || score >= scores[i - 1]);
    const isDeclining = scores.every((score, i) => i === 0 || score <= scores[i - 1]);
    
    if (isImproving) {
      insights.push('Candidate shows consistent improvement across evaluations');
    } else if (isDeclining) {
      insights.push('Candidate performance shows declining trend');
    } else {
      insights.push('Candidate performance varies across evaluations');
    }
    
    // Strength consistency
    const allStrengths = evaluations.flatMap(evaluation => evaluation.strengths || []);
    const strengthCounts = {};
    allStrengths.forEach(strength => {
      strengthCounts[strength] = (strengthCounts[strength] || 0) + 1;
    });
    
    const consistentStrengths = Object.entries(strengthCounts)
      .filter(([, count]) => count > 1)
      .map(([strength]) => strength);
    
    if (consistentStrengths.length > 0) {
      insights.push(`Consistent strengths: ${consistentStrengths.join(', ')}`);
    }
    
    return insights;
  }

  generateCSVReport(reportData) {
    const headers = [
      'Evaluation ID',
      'Interview Date',
      'Candidate Name',
      'Recruiter Name',
      'Evaluator Name',
      'Overall Score',
      'Technical Score',
      'Communication Score',
      'Problem Solving Score',
      'Published Status',
      'Created At'
    ];
    
    const rows = reportData.evaluations.map(evaluation => [
      evaluation._id,
      evaluation.interviewId.interviewDate,
      evaluation.interviewId.candidateId?.name || 'N/A',
      evaluation.interviewId.recruiterId?.name || 'N/A',
      evaluation.evaluatedBy?.name || 'N/A',
      evaluation.overallScore,
      evaluation.technicalScore || 0,
      evaluation.communicationScore || 0,
      evaluation.problemSolvingScore || 0,
      evaluation.isPublished ? 'Published' : 'Unpublished',
      evaluation.createdAt
    ]);
    
    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }
}

module.exports = new EvaluationController();
