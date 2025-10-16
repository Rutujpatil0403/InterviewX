const asyncHandler = require("express-async-handler");
const Interview = require('../models/Interview');
const User = require('../models/User'); // ← ADD THIS IMPORT
const AppError = require('../utils/AppError');
const { validationResult } = require('express-validator');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

class InterviewController {
  // Create a new interview
  createInterview = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Interview creation validation failed', {
        errors: errors.array(),
        userId: req.user.userId,
        payload: req.body
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
        payload: req.body
      });
    }

    const {
      candidateEmail,
      candidateName,
      position,
      interviewDate,
      interviewTime,
      duration,
      templateId,
      notes
    } = req.body;

    console.log("got data from frontend!", req.body);

    // Check if user has permission to create interviews
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot create interviews', 403);
    }

    try {
      // Find or create candidate by email
      let candidate = await User.findOne({
        email: candidateEmail,
        role: 'Candidate'
      });

      if (!candidate) {
        // Check if email exists with different role
        const existingUser = await User.findOne({ email: candidateEmail });
        if (existingUser) {
          logger.error('Candidate creation failed: email exists with different role', {
            candidateEmail,
            existingRole: existingUser.role,
            userId: req.user.userId
          });
          throw new AppError(`User with email ${candidateEmail} already exists with role ${existingUser.role}`, 400);
        }

        // Create new candidate user
        candidate = await User.create({
          email: candidateEmail,
          name: candidateName,
          role: 'Candidate',
          password: Math.random().toString(36).slice(-8) + 'A1@',
          isEmailVerified: false
        });

        logger.info('New candidate created during interview scheduling', {
          candidateId: candidate._id,
          email: candidateEmail,
          userId: req.user.userId
        });
      }

      // Determine recruiter ID
      const recruiterId = req.user.userId;

      // Parse interview date and time
      const scheduledDate = new Date(`${interviewDate}T${interviewTime}`);
      logger.info('Parsed interview date/time', {
        interviewDate,
        interviewTime,
        scheduledDate,
        now: new Date()
      });

      // Validate future date
      if (scheduledDate < new Date()) {
        logger.error('Interview creation failed: date not in future', {
          interviewDate,
          interviewTime,
          scheduledDate,
          now: new Date(),
          userId: req.user.userId
        });
        throw new AppError('Interview date must be in the future', 400);
      }

      // Create interview data object
      const interviewData = {
        candidateId: candidate._id,
        recruiterId: recruiterId,
        interviewDate: new Date(interviewDate), // Store as Date object
        interviewTime: interviewTime, // Store as string "HH:MM"
        status: 'Scheduled',
        duration: duration || 60
      };

      // Add optional fields
      if (templateId) interviewData.templateId = templateId;
      if (notes) interviewData.notes = notes;
      if (position) interviewData.position = position; // If your schema has position field

      console.log('Creating interview with data:', interviewData);

      let interview;
      try {
        interview = await Interview.create(interviewData);
      } catch (err) {
        logger.error('Interview model create failed', {
          error: err.message,
          stack: err.stack,
          interviewData,
          userId: req.user.userId
        });
        throw err;
      }

      // Populate candidate and recruiter details for response
      await interview.populate([
        { path: 'candidateId', select: 'name email' },
        { path: 'recruiterId', select: 'name email' },
        { path: 'templateId', select: 'title' }
      ]);

      logger.info('Interview created', {
        interviewId: interview._id,
        recruiterId: interview.recruiterId,
        candidateId: interview.candidateId,
        createdBy: req.user.userId,
        position: position
      });

      // TODO: Send email notification to candidate
      // TODO: Send calendar invite

      res.status(201).json({
        success: true,
        message: 'Interview scheduled successfully',
        data: {
          interview
        }
      });

    } catch (error) {
      logger.error('Interview creation failed', {
        error: error.message,
        stack: error.stack,
        userId: req.user.userId
      });
      throw error;
    }
  });

  // Get interviews for the logged-in user
  getInterviewByUser = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    const { role } = req.params; // Candidate, Recruiter, Admin
    console.log("User Role : ", role);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid User ID format', 400);
    }

    let filter = {};

    if (role === "Candidate") {
      filter = { candidateId: userId };
    } else if (role === "Recruiter") {
      filter = { recruiterId: userId };
    } else if (role === "Admin") {
      // Admin can see all interviews
      filter = {};
    }

    const interviews = await Interview.find(filter)
      .populate("candidateId", "name email")   // optional: include candidate details
      .populate("recruiterId", "name email");  // optional: include recruiter details

    console.log(interviews)

    if (!interviews || interviews.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No interviews found for this user"
      });
    }

    res.status(200).json({
      success: true,
      count: interviews.length,
      data: interviews
    });
  });



  // Get all interviews with filtering and pagination
  getAllInterviews = asyncHandler(async (req, res) => {
    const {
      page = 1,
      limit = 10,
      status,
      recruiterId,
      candidateId,
      date_from,
      date_to,
      templateId
    } = req.query;

    // console.log(`recruiterID : ${recruiterId} CandidateID : ${candidateId} status : ${status}`);

    const filters = {};
    if (status) filters.status = status;
    if (templateId) filters.templateId = templateId;
    if (date_from) filters.date_from = date_from;
    if (date_to) filters.date_to = date_to;

    // Apply user-specific filters based on role
    if (req.user.role === 'Recruiter') {
      filters.recruiterId = req.user.userId;
    } else if (req.user.role === 'Candidate') {
      filters.candidateId = req.user.userId;
    } else {
      // Admin can see all interviews, apply optional filters
      if (recruiterId) filters.recruiterId = recruiterId;
      if (candidateId) filters.candidateId = candidateId;
    }

    const result = await Interview.getAll(
      filters,
      parseInt(page) || 1,
      parseInt(limit) || 10
    );

    res.status(200).json({
      success: true,
      data: result
    });
  });

  // Get interview by ID
  getInterviewById = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check if user has permission to view this interview
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only view your own interviews', 403);
    }
    if (req.user.role === 'Candidate' && interview.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only view your own interviews', 403);
    }

    res.status(200).json({
      success: true,
      data: {
        interview
      }
    });
  });

  // Update interview
  updateInterview = asyncHandler(async (req, res) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      logger.warn('Interview update validation failed', {
        errors: errors.array(),
        userId: req.user.userId,
        interviewId: req.params.interviewId
      });
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { interviewId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only update your own interviews', 403);
    }
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot update interviews', 403);
    }

    const updatedInterview = await Interview.update(interviewId, req.body);

    logger.info('Interview updated', {
      interviewId,
      updatedBy: req.user.userId,
      updatedFields: Object.keys(req.body)
    });

    res.status(200).json({
      success: true,
      message: 'Interview updated successfully',
      data: {
        interview: updatedInterview
      }
    });
  });

  // Delete interview
  deleteInterview = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only delete your own interviews', 403);
    }
    if (req.user.role === 'Candidate') {
      throw new AppError('Candidates cannot delete interviews', 403);
    }

    await Interview.delete(interviewId);

    logger.info('Interview deleted', {
      interviewId,
      deletedBy: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: 'Interview deleted successfully'
    });
  });

  // Start interview
  startInterview = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions - both recruiter and candidate can start
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only start your own interviews', 403);
    }
    if (req.user.role === 'Candidate' && interview.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only start your own interviews', 403);
    }

    const startedInterview = await Interview.startInterview(interviewId);

    logger.info('Interview started', {
      interviewId,
      startedBy: req.user.userId,
      userRole: req.user.role
    });

    res.status(200).json({
      success: true,
      message: 'Interview started successfully',
      data: {
        interview: startedInterview
      }
    });
  });

  // End interview
  endInterview = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions - both recruiter and candidate can end
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only end your own interviews', 403);
    }
    if (req.user.role === 'Candidate' && interview.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only end your own interviews', 403);
    }

    const endedInterview = await Interview.endInterview(interviewId);

    logger.info('Interview ended', {
      interviewId,
      endedBy: req.user.userId,
      userRole: req.user.role
    });

    res.status(200).json({
      success: true,
      message: 'Interview ended successfully',
      data: {
        interview: endedInterview
      }
    });
  });

  // Get interviews by date range
  getInterviewsByDateRange = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      throw new AppError('Start date and end date are required', 400);
    }

    let userId = null;
    let role = null;

    // Apply user-specific filters based on role
    if (req.user.role !== 'Admin') {
      userId = req.user.userId;
      role = req.user.role;
    }

    const interviews = await Interview.getByDateRange(startDate, endDate, userId, role);

    res.status(200).json({
      success: true,
      data: {
        interviews,
        dateRange: { startDate, endDate }
      }
    });
  });

  // Get interview statistics
  getInterviewStatistics = asyncHandler(async (req, res) => {
    let userId = null;
    let role = null;

    // Apply user-specific filters based on role
    if (req.user.role !== 'Admin') {
      userId = req.user.userId;
      role = req.user.role;
    }

    const statistics = await Interview.getStats({
      recruiterId: req.user.role === 'Recruiter' ? req.user.userId : undefined,
      candidateId: req.user.role === 'Candidate' ? req.user.userId : undefined
    });

    res.status(200).json({
      success: true,
      data: {
        statistics
      }
    });
  });


  // Get interview statistics for a specific user
  getInterviewStatisticsByUser = asyncHandler(async (req, res) => {
    const { userId, role } = req.params;

    console.log("Getting stats for User ID:", userId, "Role:", role);

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      throw new AppError('Invalid User ID format', 400);
    }

    let filter = {};

    if (role === "Candidate") {
      filter.candidateId = userId;
    } else if (role === "Recruiter") {
      filter.recruiterId = userId;
    } else if (role === "Admin") {
      // Admin gets all stats
      filter = {};
    }

    console.log("Filter:", filter);

    // Use your existing Interview model's countDocuments
    const totalInterviews = await Interview.countDocuments(filter);
    const scheduledInterviews = await Interview.countDocuments({ ...filter, status: 'Scheduled' });
    const completedInterviews = await Interview.countDocuments({ ...filter, status: 'Completed' });
    const inProgressInterviews = await Interview.countDocuments({ ...filter, status: 'In Progress' });
    const cancelledInterviews = await Interview.countDocuments({ ...filter, status: 'Cancelled' });
    const pausedInterviews = await Interview.countDocuments({ ...filter, status: 'Paused' });

    const statistics = {
      totalInterviews,
      scheduledInterviews,
      completedInterviews,
      inProgressInterviews,
      cancelledInterviews,
      pausedInterviews
    };

    console.log("User Statistics:", statistics);

    res.status(200).json({
      success: true,
      data: statistics
    });
  });


  // Submit an answer for an interview question
  submitAnswer = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;
    const { questionId, questionText, answerText, duration } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    // Validate required fields
    if (!questionId || !questionText || !answerText) {
      throw new AppError('Question ID, question text, and answer text are required', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check if user is the candidate for this interview
    if (req.user.role === 'Candidate' && interview.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only submit answers for your own interviews', 403);
    }

    // Check if interview is in progress
    if (interview.status !== 'In Progress') {
      throw new AppError('Answers can only be submitted during active interviews', 400);
    }

    const answerData = {
      questionId,
      questionText,
      answerText,
      duration: duration || null
    };

    const updatedInterview = await Interview.addAnswer(interviewId, answerData);

    logger.info('Answer submitted', {
      interviewId,
      questionId,
      candidateId: req.user.userId
    });

    res.status(201).json({
      success: true,
      message: 'Answer submitted successfully',
      data: {
        interview: updatedInterview,
        submittedAnswer: updatedInterview.answers[updatedInterview.answers.length - 1]
      }
    });
  });

  // Update an answer (for candidates to edit their responses)
  updateAnswer = asyncHandler(async (req, res) => {
    const { interviewId, questionId } = req.params;
    const { answerText, duration } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check if user is the candidate for this interview
    if (req.user.role === 'Candidate' && interview.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only update answers for your own interviews', 403);
    }

    // Check if interview is in progress or recently completed (allow editing within timeframe)
    if (!['In Progress', 'Completed'].includes(interview.status)) {
      throw new AppError('Answers can only be updated during active interviews', 400);
    }

    const updateData = {};
    if (answerText) updateData.answerText = answerText;
    if (duration) updateData.duration = duration;

    const updatedInterview = await Interview.updateAnswer(interviewId, questionId, updateData);

    if (!updatedInterview) {
      throw new AppError('Answer not found for this question', 404);
    }

    logger.info('Answer updated', {
      interviewId,
      questionId,
      candidateId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: 'Answer updated successfully',
      data: {
        interview: updatedInterview
      }
    });
  });

  // Score an answer (for recruiters)
  scoreAnswer = asyncHandler(async (req, res) => {
    const { interviewId, questionId } = req.params;
    const { score, recruiterNotes } = req.body;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    // Validate score
    if (score !== null && (score < 0 || score > 10)) {
      throw new AppError('Score must be between 0 and 10', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check if user is the recruiter for this interview or admin
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only score answers for your own interviews', 403);
    }

    const updateData = {};
    if (score !== undefined) updateData.score = score;
    if (recruiterNotes !== undefined) updateData.recruiterNotes = recruiterNotes;

    const updatedInterview = await Interview.updateAnswer(interviewId, questionId, updateData);

    if (!updatedInterview) {
      throw new AppError('Answer not found for this question', 404);
    }

    logger.info('Answer scored', {
      interviewId,
      questionId,
      score,
      recruiterId: req.user.userId
    });

    res.status(200).json({
      success: true,
      message: 'Answer scored successfully',
      data: {
        interview: updatedInterview
      }
    });
  });

  // Get answers for an interview
  getAnswers = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only view answers for your own interviews', 403);
    }
    if (req.user.role === 'Candidate' && interview.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only view answers for your own interviews', 403);
    }

    const answersData = await Interview.getAnswers(interviewId);

    res.status(200).json({
      success: true,
      data: answersData
    });
  });

  // Get interview completion statistics
  getCompletionStats = asyncHandler(async (req, res) => {
    const { interviewId } = req.params;

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(interviewId)) {
      throw new AppError('Invalid interview ID format', 400);
    }

    const interview = await Interview.getById(interviewId);

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Check permissions
    if (req.user.role === 'Recruiter' && interview.recruiterId.toString() !== req.user.userId) {
      throw new AppError('You can only view completion stats for your own interviews', 403);
    }
    if (req.user.role === 'Candidate' && interview.candidateId.toString() !== req.user.userId) {
      throw new AppError('You can only view completion stats for your own interviews', 403);
    }

    const completionStats = await Interview.getCompletionStats(interviewId);

    res.status(200).json({
      success: true,
      data: completionStats
    });
  });
}

module.exports = new InterviewController();
