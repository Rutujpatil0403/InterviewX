const asyncHandler = require('express-async-handler');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

// Import models
const Interview = require('../models/Interview');
const User = require('../models/User');
const Template = require('../models/Template');
const Notification = require('../models/Notification');

// Import utilities
const AppError = require('../utils/AppError');

// ===========================================================================================================================
// ================================================ AI Interview Controller =================================================
// ===========================================================================================================================

class AIInterviewController {

  // ===========================================================================================================================
  // -------------------------------------------------- AI Interview Creation from Template -------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Create AI interview from template
   * @route   POST /api/ai-interviews/create-from-template
   * @access  Private (Admin/Recruiter only)
   */
  createAIInterviewFromTemplate = asyncHandler(async (req, res) => {
    console.log('createAIInterviewFromTemplate called with:', {
      body: req.body,
      user: req.user,
      userRole: req.user?.role
    });

    const { 
      templateId, 
      candidateEmail, 
      candidateName, 
      position, 
      aiPersonality = 'professional',
      interviewStyle = 'balanced',
      duration = 60,
      notes 
    } = req.body;

    const recruiterId = req.user.userId;

    try {
      console.log('Step 1: Verifying template...');
      // 1. Verify template exists and is active
      const template = await Template.findById(templateId);
      if (!template) {
        return res.status(404).json({
          success: false,
          message: 'Template not found'
        });
      }

      if (!template.isActive) {
        return res.status(400).json({
          success: false,
          message: 'Template is not active'
        });
      }

      console.log('Step 2: Finding/creating candidate user...');
      // 2. Find or create candidate user
      let candidate = await User.findOne({ email: candidateEmail });
      let isNewCandidate = false;
      
      if (!candidate) {
        isNewCandidate = true;
        // Create candidate user with basic info
        candidate = await User.create({
          name: candidateName,
          email: candidateEmail,
          role: 'Candidate',
          isActive: true,
          passwordHash: bcrypt.hashSync(Math.random().toString(36).slice(-8), 10),
          phone: null,
          department: null,
          company: null,
          profilePicture: null
        });
      }

      console.log('Step 3: Creating interview record...');
      // 3. Create interview record with basic AI session data
      const interviewData = {
        templateId: templateId,
        candidateId: candidate._id,
        recruiterId: recruiterId,
        interviewDate: new Date(),
        interviewTime: new Date().toTimeString().slice(0, 5),
        status: 'Scheduled',
        notes: notes || '',
        duration: duration || 60,
        
        // Minimal AI session initialization - only required fields
        aiSession: {
          aiPersonality: aiPersonality || 'professional',
          interviewStyle: interviewStyle || 'balanced',
          estimatedDuration: duration || 60,
          difficultyLevel: 'medium' // Default safe value
        }
      };

      console.log('Step 4: Validating interview data...');
      console.log('Interview data to create:', JSON.stringify(interviewData, null, 2));
      
      // Validate required fields
      if (!interviewData.candidateId || !interviewData.recruiterId || !interviewData.templateId) {
        throw new Error('Missing required fields: candidateId, recruiterId, or templateId');
      }

      console.log('Step 5: Creating interview in database...');
      const interview = await Interview.create(interviewData);
      console.log('Step 6: Interview created successfully, ID:', interview._id);

      // 4. Process template questions and add to conversation log
      if (template.questions && template.questions.length > 0) {
        const processedQuestions = template.questions.map((question, index) => ({
          timestamp: new Date(),
          type: 'ai_question',
          content: typeof question === 'string' ? question : question.question || question.text,
          questionId: `template_${templateId}_${index}`,
          metadata: {
            fromTemplate: true,
            templateId: templateId,
            originalIndex: index,
            category: template.category,
            difficulty: template.difficulty,
            questionType: typeof question === 'object' ? question.type : 'open-ended',
            expectedDuration: typeof question === 'object' ? question.duration : Math.floor(duration / template.questions.length)
          }
        }));

        // Add initial system message
        const systemMessage = {
          timestamp: new Date(),
          type: 'system_event',
          content: `AI Interview initialized from template: ${template.title}`,
          questionId: null,
          metadata: {
            templateId: templateId,
            templateTitle: template.title,
            totalQuestions: template.questions.length,
            estimatedDuration: duration,
            aiPersonality: aiPersonality,
            interviewStyle: interviewStyle
          }
        };

        // Update interview with processed questions
        await Interview.findByIdAndUpdate(interview._id, {
          $push: {
            'aiSession.conversationLog': {
              $each: [systemMessage, ...processedQuestions]
            }
          },
          $set: {
            'aiSession.totalQuestionsAsked': template.questions.length,
            'aiSession.lastUpdated': new Date()
          }
        });
      }

      // 5. Create notification for candidate
      console.log('Step 7: Creating notification for candidate...');
      await Notification.create({
        recipientId: candidate._id, // Fixed: Use recipientId instead of userId
        senderId: recruiterId, // Added: Include sender information
        type: 'interview_scheduled',
        title: 'AI Interview Scheduled',
        message: `You have been invited to an AI-powered interview for the ${position} position. The interview will be based on the ${template.title} template.`,
        data: {
          interviewId: interview._id,
          templateId: templateId,
          isAIInterview: true,
          estimatedDuration: duration
        },
        priority: 'normal'
      });
      console.log('Step 8: Notification created successfully');

      // 6. Populate the response data
      const populatedInterview = await Interview.findById(interview._id)
        .populate('candidateId', 'name email profile')
        .populate('recruiterId', 'name email')
        .populate('templateId', 'title description category difficulty estimatedDuration');

      res.status(201).json({
        success: true,
        message: 'AI Interview created successfully from template',
        data: {
          interview: populatedInterview,
          candidateAccount: {
            isNew: isNewCandidate,
            email: candidate.email,
            name: candidate.name
          },
          aiConfiguration: {
            personality: aiPersonality,
            style: interviewStyle,
            duration: duration,
            questionsCount: template.questions?.length || 0
          }
        }
      });

    } catch (error) {
      console.error('Error creating AI interview from template:', {
        message: error.message,
        stack: error.stack,
        templateId,
        candidateEmail,
        recruiterId
      });
      res.status(500).json({
        success: false,
        message: 'Failed to create AI interview from template',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- AI Interview Session Management -----------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Initialize AI interview session
   * @route   POST /api/ai-interviews/:id/start
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  startAIInterview = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { aiPersonality = 'professional', interviewStyle = 'balanced', duration = 60 } = req.body;

    // Validate interview exists and user has access
    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email')
      .populate('templateId');

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    const isCandidate = req.user.userId === interview.candidateId._id.toString();
    const isRecruiter = req.user.userId === interview.recruiterId._id.toString();
    const isAdmin = req.user.role === 'Admin';

    if (!isCandidate && !isRecruiter && !isAdmin) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    // Check if interview is in valid state to start
    if (interview.status !== 'Scheduled') {
      throw new AppError('Interview cannot be started in current state', 400);
    }

    // Initialize AI session data
    const aiSessionData = {
      startTime: new Date(),
      aiPersonality,
      interviewStyle,
      estimatedDuration: duration,
      currentQuestionIndex: 0,
      difficultyLevel: 'medium',
      totalQuestionsAsked: 0,
      averageResponseTime: 0,
      engagementScore: 0,
      confidenceScore: 0,
      conversationLog: [],
      realTimeInsights: {
        keywordFrequency: {},
        sentimentScore: 0,
        communicationStyle: 'unknown',
        technicalDepth: 0,
        problemSolvingApproach: 'unknown'
      },
      aiAnalysis: {
        strengths: [],
        weaknesses: [],
        recommendations: [],
        overallScore: 0,
        categoryScores: {
          technical: 0,
          communication: 0,
          problemSolving: 0,
          cultural: 0
        }
      }
    };

    // Update interview with AI session data
    interview.status = 'In Progress';
    interview.aiSession = aiSessionData;
    interview.actualStartTime = new Date();
    await interview.save();

    // Generate welcome message and first question
    const welcomeMessage = await this.generateWelcomeMessage(interview, aiPersonality);
    const firstQuestion = await this.generateFirstQuestion(interview);

    // Log conversation start
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'ai_message',
      content: welcomeMessage,
      metadata: { messageType: 'welcome' }
    });

    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'ai_question',
      content: firstQuestion.question,
      questionId: firstQuestion.id,
      metadata: {
        difficulty: firstQuestion.difficulty,
        category: firstQuestion.category,
        expectedDuration: firstQuestion.expectedDuration
      }
    });

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'AI Interview session started successfully',
      data: {
        interview: {
          id: interview._id,
          status: interview.status,
          aiPersonality,
          interviewStyle,
          estimatedDuration: duration
        },
        session: {
          welcomeMessage,
          firstQuestion: firstQuestion.question,
          questionId: firstQuestion.id,
          difficulty: firstQuestion.difficulty,
          sessionId: interview.aiSession.startTime.getTime()
        }
      }
    });
  });

  /**
   * @desc    Pause AI interview session
   * @route   POST /api/ai-interviews/:id/pause
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  pauseAIInterview = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { reason = 'user_requested' } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    if (interview.status !== 'In Progress') {
      throw new AppError('Interview is not in progress', 400);
    }

    // Update session with pause information
    interview.aiSession.pausedAt = new Date();
    interview.aiSession.pauseReason = reason;
    interview.status = 'Paused';

    // Log pause event
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'system_event',
      content: `Interview paused: ${reason}`,
      metadata: { eventType: 'pause', reason }
    });

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview paused successfully',
      data: {
        status: 'Paused',
        pausedAt: interview.aiSession.pausedAt,
        reason
      }
    });
  });

  /**
   * @desc    Resume AI interview session
   * @route   POST /api/ai-interviews/:id/resume
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  resumeAIInterview = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    if (interview.status !== 'Paused') {
      throw new AppError('Interview is not paused', 400);
    }

    // Calculate pause duration
    const pauseDuration = new Date() - new Date(interview.aiSession.pausedAt);
    interview.aiSession.totalPauseDuration = (interview.aiSession.totalPauseDuration || 0) + pauseDuration;

    // Resume session
    interview.status = 'In Progress';
    interview.aiSession.resumedAt = new Date();
    delete interview.aiSession.pausedAt;
    delete interview.aiSession.pauseReason;

    // Log resume event
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'system_event',
      content: 'Interview resumed',
      metadata: { 
        eventType: 'resume',
        pauseDuration: Math.round(pauseDuration / 1000) // in seconds
      }
    });

    await interview.save();

    // Generate continuation message
    const continuationMessage = "Welcome back! Let's continue where we left off.";

    res.status(200).json({
      success: true,
      message: 'Interview resumed successfully',
      data: {
        status: 'In Progress',
        resumedAt: interview.aiSession.resumedAt,
        continuationMessage,
        pauseDuration: Math.round(pauseDuration / 1000)
      }
    });
  });

  /**
   * @desc    End AI interview session
   * @route   POST /api/ai-interviews/:id/end
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  endAIInterview = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { reason = 'completed', generateReport = true } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    if (!['In Progress', 'Paused'].includes(interview.status)) {
      throw new AppError('Interview is not active', 400);
    }

    // Calculate session duration
    const endTime = new Date();
    const startTime = new Date(interview.aiSession.startTime);
    const totalDuration = Math.round((endTime - startTime) / 1000); // in seconds
    const activeDuration = totalDuration - (interview.aiSession.totalPauseDuration || 0);

    // Finalize AI analysis
    const finalAnalysis = await this.generateFinalAnalysis(interview);
    const overallScore = await this.calculateOverallScore(interview);
    const recommendation = await this.generateRecommendation(interview, overallScore);

    // Update interview status and final data
    interview.status = 'Completed';
    interview.actualEndTime = endTime;
    interview.aiSession.endTime = endTime;
    interview.aiSession.totalDuration = totalDuration;
    interview.aiSession.activeDuration = activeDuration;
    interview.aiSession.finalAnalysis = finalAnalysis;
    interview.aiSession.overallScore = overallScore;
    interview.aiSession.recommendation = recommendation;
    interview.aiSession.completionReason = reason;

    // Log session end
    interview.aiSession.conversationLog.push({
      timestamp: endTime,
      type: 'system_event',
      content: `Interview ended: ${reason}`,
      metadata: { 
        eventType: 'end',
        reason,
        totalDuration,
        activeDuration,
        questionsAsked: interview.aiSession.totalQuestionsAsked
      }
    });

    await interview.save();

    // Generate summary report if requested
    let summaryReport = null;
    if (generateReport) {
      summaryReport = await this.generateInterviewSummary(interview);
    }

    res.status(200).json({
      success: true,
      message: 'AI Interview completed successfully',
      data: {
        status: 'Completed',
        endTime,
        duration: {
          total: totalDuration,
          active: activeDuration
        },
        finalAnalysis,
        overallScore,
        recommendation,
        summaryReport
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Adaptive Questioning ----------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    AI generates next question based on previous answers
   * @route   POST /api/ai-interviews/:id/ask-question
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  askNextQuestion = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    
    // Handle both old format (previousAnswer, responseTime) and new format (conversationLogEntry)
    let previousAnswer, responseTime;
    
    if (req.body.conversationLogEntry) {
      // New format with conversationLogEntry
      const entry = req.body.conversationLogEntry;
      previousAnswer = entry.content;
      responseTime = entry.metadata?.duration || 30;
      
      console.log('Processing new format conversationLogEntry:', {
        type: entry.type,
        content: entry.content,
        questionId: entry.questionId,
        timestamp: entry.timestamp,
        metadata: entry.metadata
      });
    } else {
      // Old format for backward compatibility
      previousAnswer = req.body.previousAnswer;
      responseTime = req.body.responseTime;
      
      console.log('Processing old format:', { previousAnswer, responseTime });
    }

    const interview = await Interview.findById(interviewId).populate('templateId');
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    if (interview.status !== 'In Progress') {
      throw new AppError('Interview is not active', 400);
    }

    // Process previous answer if provided
    if (previousAnswer) {
      // Handle new format by adding full conversationLog entry
      if (req.body.conversationLogEntry) {
        const entry = req.body.conversationLogEntry;
        interview.aiSession.conversationLog.push({
          timestamp: new Date(entry.timestamp),
          type: entry.type,
          content: entry.content,
          questionId: entry.questionId,
          metadata: entry.metadata || {}
        });
        
        // Update average response time
        const candidateAnswers = interview.aiSession.conversationLog.filter(log => log.type === 'candidate_answer');
        const totalAnswers = candidateAnswers.length;
        interview.aiSession.averageResponseTime = (
          (interview.aiSession.averageResponseTime * (totalAnswers - 1) + responseTime) / totalAnswers
        );
      } else {
        // Use old processing method
        await this.processAnswer(interview, previousAnswer, responseTime);
      }
    }

    // Generate next question using AI logic
    const nextQuestion = await this.generateAdaptiveQuestion(interview);
    
    console.log('Generated next question:', nextQuestion);
    
    if (!nextQuestion) {
      return res.status(200).json({
        success: true,
        message: 'No more questions available',
        data: {
          hasMoreQuestions: false,
          suggestEnd: true
        }
      });
    }

    // Validate that nextQuestion has all required fields
    if (!nextQuestion.question || typeof nextQuestion.question !== 'string') {
      console.error('Invalid nextQuestion structure:', nextQuestion);
      throw new AppError('Generated question is invalid', 500);
    }

    // Update conversation log
    const conversationLogEntry = {
      timestamp: new Date(),
      type: 'ai_question',
      content: nextQuestion.question,
      questionId: nextQuestion.id,
      metadata: {
        difficulty: nextQuestion.difficulty,
        category: nextQuestion.category,
        expectedDuration: nextQuestion.expectedDuration,
        adaptationReason: nextQuestion.adaptationReason
      }
    };
    
    console.log('Adding conversationLog entry:', conversationLogEntry);
    
    interview.aiSession.conversationLog.push(conversationLogEntry);

    interview.aiSession.currentQuestionIndex++;
    interview.aiSession.totalQuestionsAsked++;
    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Next question generated successfully',
      data: {
        question: nextQuestion.question,
        questionId: nextQuestion.id,
        difficulty: nextQuestion.difficulty,
        category: nextQuestion.category,
        expectedDuration: nextQuestion.expectedDuration,
        questionNumber: interview.aiSession.totalQuestionsAsked,
        adaptationReason: nextQuestion.adaptationReason
      }
    });
  });

  /**
   * @desc    Generate dynamic follow-up question
   * @route   POST /api/ai-interviews/:id/followup
   * @access  Private (Admin/Recruiter only)
   */
  generateFollowUpQuestion = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { basedOnAnswer, followUpType = 'clarification' } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admins and recruiters can generate follow-ups
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to generate follow-up questions', 403);
    }

    if (interview.status !== 'In Progress') {
      throw new AppError('Interview is not active', 400);
    }

    // Generate follow-up question based on previous answer
    const followUpQuestion = await this.generateFollowUp(interview, basedOnAnswer, followUpType);

    // Log follow-up question
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'ai_followup',
      content: followUpQuestion.question,
      questionId: followUpQuestion.id,
      metadata: {
        followUpType,
        basedOnAnswer: basedOnAnswer.substring(0, 100) + '...',
        generatedBy: req.user.userId
      }
    });

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Follow-up question generated successfully',
      data: {
        question: followUpQuestion.question,
        questionId: followUpQuestion.id,
        followUpType,
        suggestedResponseTime: followUpQuestion.suggestedResponseTime
      }
    });
  });

  /**
   * @desc    Adjust difficulty level based on candidate performance
   * @route   PUT /api/ai-interviews/:id/difficulty
   * @access  Private (AI system or Admin/Recruiter)
   */
  adjustDifficultyLevel = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { newDifficulty, reason = 'performance_based' } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to modify this interview', 403);
    }

    if (interview.status !== 'In Progress') {
      throw new AppError('Interview is not active', 400);
    }

    // Validate difficulty level
    const validDifficulties = ['easy', 'medium', 'hard', 'expert'];
    if (!validDifficulties.includes(newDifficulty)) {
      throw new AppError('Invalid difficulty level', 400);
    }

    const previousDifficulty = interview.aiSession.difficultyLevel;
    interview.aiSession.difficultyLevel = newDifficulty;

    // Log difficulty change
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'system_event',
      content: `Difficulty adjusted from ${previousDifficulty} to ${newDifficulty}`,
      metadata: {
        eventType: 'difficulty_adjustment',
        previousDifficulty,
        newDifficulty,
        reason,
        adjustedBy: req.user.userId
      }
    });

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Difficulty level adjusted successfully',
      data: {
        previousDifficulty,
        newDifficulty,
        reason,
        adjustedAt: new Date()
      }
    });
  });

  /**
   * @desc    Skip current question and move to next
   * @route   POST /api/ai-interviews/:id/skip-question
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  skipQuestion = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { reason = 'candidate_request', skipType = 'temporary' } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to modify this interview', 403);
    }

    if (interview.status !== 'In Progress') {
      throw new AppError('Interview is not active', 400);
    }

    // Log question skip
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'system_event',
      content: `Question skipped: ${reason}`,
      metadata: {
        eventType: 'question_skip',
        reason,
        skipType,
        skippedBy: req.user.userId,
        questionIndex: interview.aiSession.currentQuestionIndex
      }
    });

    // Generate next question
    const nextQuestion = await this.generateAdaptiveQuestion(interview);
    
    if (nextQuestion) {
      interview.aiSession.conversationLog.push({
        timestamp: new Date(),
        type: 'ai_question',
        content: nextQuestion.question,
        questionId: nextQuestion.id,
        metadata: {
          difficulty: nextQuestion.difficulty,
          category: nextQuestion.category,
          expectedDuration: nextQuestion.expectedDuration,
          followsSkip: true
        }
      });

      interview.aiSession.currentQuestionIndex++;
      interview.aiSession.totalQuestionsAsked++;
    }

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Question skipped successfully',
      data: {
        skipped: true,
        reason,
        nextQuestion: nextQuestion ? {
          question: nextQuestion.question,
          questionId: nextQuestion.id,
          difficulty: nextQuestion.difficulty,
          category: nextQuestion.category
        } : null,
        hasMoreQuestions: !!nextQuestion
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Real-time Analysis ------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Analyze answer in real-time
   * @route   POST /api/ai-interviews/:id/analyze
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  analyzeAnswerRealTime = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { answer, questionId, responseTime, isPartial = false } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    if (interview.status !== 'In Progress') {
      throw new AppError('Interview is not active', 400);
    }

    // Perform real-time analysis
    const analysis = await this.performRealTimeAnalysis(answer, questionId, interview);
    
    // Update real-time insights
    if (!isPartial) {
      // Only update for complete answers
      interview.aiSession.realTimeInsights = this.updateRealTimeInsights(
        interview.aiSession.realTimeInsights,
        analysis,
        responseTime
      );

      // Log the answer and analysis
      interview.aiSession.conversationLog.push({
        timestamp: new Date(),
        type: 'candidate_answer',
        content: answer,
        questionId,
        metadata: {
          responseTime,
          analysis: {
            sentimentScore: analysis.sentimentScore,
            keywordCount: analysis.keywords.length,
            technicalDepth: analysis.technicalDepth,
            confidence: analysis.confidence
          }
        }
      });

      await interview.save();
    }

    res.status(200).json({
      success: true,
      message: 'Answer analyzed successfully',
      data: {
        analysis: {
          sentimentScore: analysis.sentimentScore,
          confidence: analysis.confidence,
          technicalDepth: analysis.technicalDepth,
          keywords: analysis.keywords,
          strengths: analysis.strengths,
          areas_for_improvement: analysis.areas_for_improvement,
          score: analysis.score
        },
        realTimeInsights: interview.aiSession.realTimeInsights,
        isPartial
      }
    });
  });

  /**
   * @desc    Get real-time conversation insights
   * @route   GET /api/ai-interviews/:id/insights
   * @access  Private (Admin/Recruiter for any, Candidate for own)
   */
  getConversationInsights = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    const insights = await this.generateConversationInsights(interview);

    res.status(200).json({
      success: true,
      message: 'Conversation insights retrieved successfully',
      data: {
        insights: {
          overall: insights.overall,
          performance: insights.performance,
          engagement: insights.engagement,
          communication: insights.communication,
          technical: insights.technical,
          trends: insights.trends
        },
        realTimeMetrics: interview.aiSession.realTimeInsights,
        sessionDuration: Math.round((new Date() - new Date(interview.aiSession.startTime)) / 1000),
        questionsAsked: interview.aiSession.totalQuestionsAsked
      }
    });
  });

  /**
   * @desc    Detect candidate engagement level
   * @route   GET /api/ai-interviews/:id/engagement
   * @access  Private (Admin/Recruiter for monitoring)
   */
  detectCandidateEngagement = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admin and recruiters can monitor engagement
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to monitor engagement', 403);
    }

    const engagement = await this.analyzeEngagement(interview);

    res.status(200).json({
      success: true,
      message: 'Engagement analysis completed',
      data: {
        engagementLevel: engagement.level,
        score: engagement.score,
        indicators: engagement.indicators,
        recommendations: engagement.recommendations,
        trend: engagement.trend,
        lastUpdated: new Date()
      }
    });
  });

  /**
   * @desc    Extract and analyze keywords from answers
   * @route   POST /api/ai-interviews/:id/keywords
   * @access  Private (Admin/Recruiter for any, Candidate for own)
   */
  identifyKeywords = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { text, context = 'answer' } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    const keywordAnalysis = await this.extractKeywords(text, context, interview);

    res.status(200).json({
      success: true,
      message: 'Keywords identified successfully',
      data: {
        keywords: keywordAnalysis.keywords,
        technicalTerms: keywordAnalysis.technicalTerms,
        skillsIdentified: keywordAnalysis.skills,
        sentiment: keywordAnalysis.sentiment,
        relevanceScore: keywordAnalysis.relevance,
        context
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- AI Scoring & Evaluation -------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Score answer using AI algorithms
   * @route   POST /api/ai-interviews/:id/score-answer
   * @access  Private (Admin/Recruiter for any, system for automatic)
   */
  scoreAnswerWithAI = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { answer, questionId, scoringCriteria = 'comprehensive' } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to score this interview', 403);
    }

    const aiScore = await this.calculateAIScore(answer, questionId, interview, scoringCriteria);

    res.status(200).json({
      success: true,
      message: 'Answer scored successfully',
      data: {
        score: aiScore.overall,
        breakdown: {
          technical: aiScore.technical,
          communication: aiScore.communication,
          problemSolving: aiScore.problemSolving,
          creativity: aiScore.creativity
        },
        confidence: aiScore.confidence,
        feedback: aiScore.feedback,
        scoringCriteria
      }
    });
  });

  /**
   * @desc    Generate automated AI feedback
   * @route   POST /api/ai-interviews/:id/feedback
   * @access  Private (Admin/Recruiter for any, Candidate for own)
   */
  generateAIFeedback = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { feedbackType = 'comprehensive', includeImprovement = true } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    const feedback = await this.generateAutomatedFeedback(interview, feedbackType, includeImprovement);

    res.status(200).json({
      success: true,
      message: 'AI feedback generated successfully',
      data: {
        feedback: {
          overall: feedback.overall,
          strengths: feedback.strengths,
          improvements: feedback.improvements,
          recommendations: feedback.recommendations
        },
        scores: feedback.scores,
        feedbackType,
        generatedAt: new Date()
      }
    });
  });

  /**
   * @desc    Calculate AI confidence score
   * @route   GET /api/ai-interviews/:id/confidence
   * @access  Private (Admin/Recruiter for monitoring)
   */
  calculateConfidenceScore = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admin and recruiters can check confidence scores
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to view confidence scores', 403);
    }

    const confidence = await this.computeConfidenceScore(interview);

    res.status(200).json({
      success: true,
      message: 'Confidence score calculated successfully',
      data: {
        overallConfidence: confidence.overall,
        breakdown: {
          dataQuality: confidence.dataQuality,
          responseConsistency: confidence.responseConsistency,
          analysisReliability: confidence.analysisReliability,
          predictionAccuracy: confidence.predictionAccuracy
        },
        factors: confidence.factors,
        reliability: confidence.reliability,
        calculatedAt: new Date()
      }
    });
  });

  /**
   * @desc    Get AI hiring recommendation
   * @route   GET /api/ai-interviews/:id/recommendation
   * @access  Private (Admin/Recruiter only)
   */
  getRecommendation = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { includeJustification = true } = req.query;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admin and recruiters can get recommendations
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to view recommendations', 403);
    }

    const recommendation = await this.generateHiringRecommendation(interview, includeJustification === 'true');

    res.status(200).json({
      success: true,
      message: 'Recommendation generated successfully',
      data: {
        recommendation: recommendation.decision,
        confidence: recommendation.confidence,
        score: recommendation.score,
        reasoning: recommendation.reasoning,
        keyFactors: recommendation.keyFactors,
        risks: recommendation.risks,
        strengths: recommendation.strengths,
        generatedAt: new Date()
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Interview Customization -------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Set AI personality for the interview
   * @route   PUT /api/ai-interviews/:id/personality
   * @access  Private (Admin/Recruiter for setup, Candidate with permission)
   */
  setAIPersonality = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { 
      personality = 'professional',
      traits = {},
      communicationStyle = 'balanced',
      questioningApproach = 'adaptive'
    } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to modify this interview', 403);
    }

    // Validate personality settings
    const validPersonalities = ['professional', 'friendly', 'technical', 'casual', 'formal'];
    if (!validPersonalities.includes(personality)) {
      throw new AppError('Invalid personality type', 400);
    }

    // Update AI personality settings
    interview.aiSession.aiPersonality = personality;
    interview.aiSession.personalityTraits = {
      warmth: traits.warmth || 'medium',
      formality: traits.formality || 'medium',
      patience: traits.patience || 'high',
      encouragement: traits.encouragement || 'medium',
      directness: traits.directness || 'medium'
    };
    interview.aiSession.communicationStyle = communicationStyle;
    interview.aiSession.questioningApproach = questioningApproach;

    // Log personality change
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'system_event',
      content: `AI personality updated to ${personality}`,
      metadata: {
        eventType: 'personality_change',
        personality,
        traits,
        communicationStyle,
        questioningApproach,
        updatedBy: req.user.userId
      }
    });

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'AI personality updated successfully',
      data: {
        personality,
        traits: interview.aiSession.personalityTraits,
        communicationStyle,
        questioningApproach,
        updatedAt: new Date()
      }
    });
  });

  /**
   * @desc    Configure interview style and approach
   * @route   PUT /api/ai-interviews/:id/style
   * @access  Private (Admin/Recruiter for setup)
   */
  configureInterviewStyle = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const {
      style = 'balanced',
      focusAreas = [],
      pacing = 'medium',
      depth = 'medium',
      adaptivity = 'high'
    } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admin and recruiters can configure style
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to configure interview style', 403);
    }

    // Update interview style configuration
    interview.aiSession.interviewStyle = style;
    interview.aiSession.styleConfiguration = {
      focusAreas,
      pacing,
      depth,
      adaptivity,
      lastModified: new Date(),
      modifiedBy: req.user.userId
    };

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview style configured successfully',
      data: {
        style,
        configuration: interview.aiSession.styleConfiguration
      }
    });
  });

  /**
   * @desc    Set interview duration and time management
   * @route   PUT /api/ai-interviews/:id/duration
   * @access  Private (Admin/Recruiter for setup)
   */
  setInterviewDuration = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const {
      totalDuration = 60,
      timeWarnings = true,
      flexibleTiming = false,
      breakAllowed = false
    } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admin and recruiters can set duration
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to set interview duration', 403);
    }

    // Update duration settings
    interview.aiSession.estimatedDuration = totalDuration;
    interview.aiSession.timeManagement = {
      totalDuration,
      timeWarnings,
      flexibleTiming,
      breakAllowed,
      warningTimes: [
        Math.round(totalDuration * 0.75), // 75% warning
        Math.round(totalDuration * 0.9)   // 90% warning
      ]
    };

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview duration configured successfully',
      data: {
        totalDuration,
        timeManagement: interview.aiSession.timeManagement
      }
    });
  });

  /**
   * @desc    Customize question types and preferences
   * @route   PUT /api/ai-interviews/:id/question-types
   * @access  Private (Admin/Recruiter for setup)
   */
  customizeQuestionTypes = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const {
      preferredTypes = [],
      avoidTypes = [],
      difficultyDistribution = 'balanced',
      categoryWeights = {}
    } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admin and recruiters can customize question types
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to customize question types', 403);
    }

    // Update question preferences
    interview.aiSession.questionPreferences = {
      preferredTypes,
      avoidTypes,
      difficultyDistribution,
      categoryWeights,
      lastModified: new Date(),
      modifiedBy: req.user.userId
    };

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Question preferences updated successfully',
      data: {
        preferences: interview.aiSession.questionPreferences
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Integration & Export -----------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Get comprehensive interview summary
   * @route   GET /api/ai-interviews/:id/summary
   * @access  Private (Admin/Recruiter for any, Candidate for own)
   */
  getInterviewSummary = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { includeTranscript = false, includeAnalysis = true } = req.query;

    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email')
      .populate('templateId', 'title description');

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    const summary = await this.generateInterviewSummary(interview, {
      includeTranscript: includeTranscript === 'true',
      includeAnalysis: includeAnalysis === 'true'
    });

    res.status(200).json({
      success: true,
      message: 'Interview summary generated successfully',
      data: {
        summary,
        generatedAt: new Date(),
        generatedBy: req.user.userId
      }
    });
  });

  /**
   * @desc    Export full conversation transcript
   * @route   GET /api/ai-interviews/:id/transcript
   * @access  Private (Admin/Recruiter for any, Candidate for own)
   */
  exportTranscript = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { format = 'json', includeMetadata = true } = req.query;

    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    const transcript = await this.generateTranscript(interview, {
      format,
      includeMetadata: includeMetadata === 'true'
    });

    // Set appropriate content type based on format
    const contentTypes = {
      json: 'application/json',
      txt: 'text/plain',
      pdf: 'application/pdf',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    };

    res.setHeader('Content-Type', contentTypes[format] || 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="interview_transcript_${interviewId}.${format}"`);

    res.status(200).json({
      success: true,
      message: 'Transcript exported successfully',
      data: {
        transcript,
        format,
        exportedAt: new Date(),
        exportedBy: req.user.userId
      }
    });
  });

  /**
   * @desc    Sync interview data with human reviewer
   * @route   POST /api/ai-interviews/:id/sync-reviewer
   * @access  Private (Admin/Recruiter only)
   */
  syncWithHumanReviewer = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { reviewerId, syncType = 'full', includeRecommendation = true } = req.body;

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admin and recruiters can sync with reviewers
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to sync with reviewers', 403);
    }

    // Validate reviewer exists
    const reviewer = await User.findById(reviewerId);
    if (!reviewer || !['Admin', 'Recruiter'].includes(reviewer.role)) {
      throw new AppError('Invalid reviewer specified', 400);
    }

    // Prepare sync data
    const syncData = await this.prepareSyncData(interview, syncType, includeRecommendation);

    // Create notification for reviewer
    await Notification.create({
      recipientId: reviewerId,
      senderId: req.user.userId,
      title: 'AI Interview Ready for Review',
      message: `AI Interview for ${interview.candidateId.name} is ready for human review`,
      type: 'info',
      category: 'interview',
      priority: 'high',
      actionUrl: `/interviews/${interviewId}/review`,
      metadata: {
        interviewId,
        syncType,
        candidateId: interview.candidateId._id
      }
    });

    // Log sync event
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'system_event',
      content: `Interview synced with human reviewer`,
      metadata: {
        eventType: 'reviewer_sync',
        reviewerId,
        syncType,
        syncedBy: req.user.userId
      }
    });

    await interview.save();

    res.status(200).json({
      success: true,
      message: 'Interview synced with human reviewer successfully',
      data: {
        syncData,
        reviewer: {
          id: reviewer._id,
          name: reviewer.name,
          email: reviewer.email
        },
        syncType,
        syncedAt: new Date()
      }
    });
  });

  /**
   * @desc    Generate comprehensive interview report
   * @route   POST /api/ai-interviews/:id/report
   * @access  Private (Admin/Recruiter for generation)
   */
  generateInterviewReport = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const {
      reportType = 'comprehensive',
      includeRecommendation = true,
      includeTranscript = false,
      format = 'json'
    } = req.body;

    const interview = await Interview.findById(interviewId)
      .populate('candidateId', 'name email phone')
      .populate('recruiterId', 'name email')
      .populate('templateId');

    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Only admin and recruiters can generate reports
    if (!['Admin', 'Recruiter'].includes(req.user.role)) {
      throw new AppError('Not authorized to generate reports', 403);
    }

    const report = await this.generateComprehensiveReport(interview, {
      reportType,
      includeRecommendation,
      includeTranscript,
      format
    });

    res.status(200).json({
      success: true,
      message: 'Interview report generated successfully',
      data: {
        report,
        metadata: {
          reportType,
          format,
          generatedAt: new Date(),
          generatedBy: req.user.userId,
          interviewId
        }
      }
    });
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Helper Methods ----------------------------------------------------
  // ===========================================================================================================================

  /**
   * Check if user has access to the interview
   */
  hasInterviewAccess = (user, interview) => {
    const isCandidate = user.userId === interview.candidateId.toString();
    const isRecruiter = user.userId === interview.recruiterId.toString();
    const isAdmin = user.role === 'Admin';
    return isCandidate || isRecruiter || isAdmin;
  };

  /**
   * Generate welcome message based on AI personality
   */
  generateWelcomeMessage = async (interview, personality) => {
    const personalityMessages = {
      professional: "Hello! I'm your AI interviewer today. I'll be conducting a comprehensive interview to assess your qualifications. Let's begin with some questions about your background and experience.",
      friendly: "Hi there! I'm excited to chat with you today. I'm an AI interviewer, and I'll be asking you some questions to get to know you better. Don't worry, just be yourself and we'll have a great conversation!",
      technical: "Greetings. I am an AI system designed to evaluate technical competencies. Today's session will focus on assessing your technical skills and problem-solving abilities. Please provide detailed responses.",
      casual: "Hey! Ready for our chat? I'm your AI interviewer, and we're going to have a relaxed conversation about your skills and experience. Just answer naturally and we'll get through this together.",
      formal: "Good day. I am conducting this interview on behalf of the recruitment team. Today's session will follow a structured format to evaluate your suitability for the position. Please respond thoughtfully to each question."
    };

    return personalityMessages[personality] || personalityMessages.professional;
  };

  /**
   * Generate first question based on template and candidate
   */
  generateFirstQuestion = async (interview) => {
    // This would integrate with AI service to generate contextual first question
    return {
      id: 'q1_intro',
      question: "Let's start with a brief introduction. Could you tell me about yourself and what brought you to apply for this position?",
      difficulty: 'easy',
      category: 'introduction',
      expectedDuration: 120 // 2 minutes
    };
  };

  /**
   * Process candidate answer and update session data
   */
  processAnswer = async (interview, answer, responseTime) => {
    // Log the answer
    interview.aiSession.conversationLog.push({
      timestamp: new Date(),
      type: 'candidate_answer',
      content: answer,
      metadata: {
        responseTime,
        wordCount: answer.split(' ').length,
        questionIndex: interview.aiSession.currentQuestionIndex
      }
    });

    // Update average response time
    const totalAnswers = interview.aiSession.conversationLog.filter(log => log.type === 'candidate_answer').length;
    interview.aiSession.averageResponseTime = (
      (interview.aiSession.averageResponseTime * (totalAnswers - 1) + responseTime) / totalAnswers
    );

    return true;
  };

  /**
   * Generate adaptive question based on performance and template
   */
  generateAdaptiveQuestion = async (interview) => {
    const questionsAsked = interview.aiSession.totalQuestionsAsked;
    
    console.log('generateAdaptiveQuestion called:', {
      questionsAsked,
      hasTemplate: !!interview.templateId,
      templateQuestions: interview.templateId?.questions?.length || 0
    });

    // End interview after reasonable number of questions
    if (questionsAsked >= 10) {
      console.log('Ending interview - maximum questions reached');
      return null;
    }

    // Use template questions if available
    if (interview.templateId?.questions && interview.templateId.questions.length > 0) {
      const templateQuestions = interview.templateId.questions;
      
      // If we haven't gone through all template questions yet, use the next one
      if (questionsAsked < templateQuestions.length) {
        const nextQuestion = templateQuestions[questionsAsked];
        
        // Handle different question formats and log the structure
        console.log('Raw template question:', { index: questionsAsked, nextQuestion });
        
        let questionText;
        if (typeof nextQuestion === 'string') {
          questionText = nextQuestion;
        } else if (typeof nextQuestion === 'object') {
          // Try different possible field names
          questionText = nextQuestion.questionText || 
                        nextQuestion.text || 
                        nextQuestion.question || 
                        nextQuestion.content;
        }
        
        console.log('Using template question:', { index: questionsAsked, questionText });
        
        // If we still don't have a valid question text, provide a fallback
        if (!questionText || typeof questionText !== 'string' || questionText.trim() === '') {
          console.warn('Invalid template question, using fallback');
          questionText = `Can you tell me about your experience with ${interview.templateId.category || 'this topic'}?`;
        }
        
        return {
          id: `template_${interview.templateId._id}_${questionsAsked}`,
          question: questionText,
          difficulty: interview.aiSession.difficultyLevel,
          category: interview.templateId.category || 'general',
          expectedDuration: typeof nextQuestion === 'object' ? nextQuestion.duration : 120,
          adaptationReason: `Template question ${questionsAsked + 1} of ${templateQuestions.length}`
        };
      }
      
      // If we've used all template questions, generate follow-up questions
      console.log('All template questions used, generating follow-up');
    }

    // Fallback: Generate diverse adaptive questions based on question count
    const adaptiveQuestions = [
      {
        question: "Can you describe a challenging project you worked on and how you overcame the obstacles?",
        category: 'experience',
        difficulty: 'medium'
      },
      {
        question: "What motivates you in your work, and how do you stay productive during difficult periods?",
        category: 'motivation',
        difficulty: 'easy'
      },
      {
        question: "How do you approach learning new technologies or skills in your field?",
        category: 'learning',
        difficulty: 'medium'
      },
      {
        question: "Describe a time when you had to work with a difficult team member. How did you handle it?",
        category: 'teamwork',
        difficulty: 'medium'
      },
      {
        question: "What do you see as the biggest trends or changes coming to your industry?",
        category: 'industry_knowledge',
        difficulty: 'hard'
      },
      {
        question: "How do you prioritize tasks when you have multiple deadlines approaching?",
        category: 'time_management',
        difficulty: 'easy'
      },
      {
        question: "Can you walk me through your problem-solving process when facing a complex technical challenge?",
        category: 'problem_solving',
        difficulty: 'hard'
      }
    ];

    // Select question based on questions asked to ensure variety
    const questionIndex = questionsAsked % adaptiveQuestions.length;
    const selectedQuestion = adaptiveQuestions[questionIndex];
    
    console.log('Using adaptive question:', { questionIndex, selectedQuestion });

    return {
      id: `adaptive_${questionsAsked + 1}`,
      question: selectedQuestion.question,
      difficulty: selectedQuestion.difficulty,
      category: selectedQuestion.category,
      expectedDuration: selectedQuestion.difficulty === 'hard' ? 180 : selectedQuestion.difficulty === 'medium' ? 120 : 90,
      adaptationReason: `Adaptive question ${questionsAsked + 1} - ${selectedQuestion.category} focus`
    };
  };

  /**
   * Perform real-time analysis of answer
   */
  performRealTimeAnalysis = async (answer, questionId, interview) => {
    // This would integrate with AI/ML services for real analysis
    // Mock implementation for demonstration
    const words = answer.toLowerCase().split(' ');
    const technicalKeywords = ['algorithm', 'database', 'api', 'framework', 'architecture'];
    const techWords = words.filter(word => technicalKeywords.includes(word));

    return {
      sentimentScore: 0.7, // Positive sentiment
      confidence: 0.85,
      technicalDepth: techWords.length > 3 ? 'high' : techWords.length > 1 ? 'medium' : 'low',
      keywords: techWords,
      strengths: ['Clear communication', 'Technical knowledge'],
      areas_for_improvement: ['Could provide more specific examples'],
      score: 7.5
    };
  };

  /**
   * Update real-time insights with new analysis
   */
  updateRealTimeInsights = (currentInsights, newAnalysis, responseTime) => {
    // Update keyword frequency
    newAnalysis.keywords.forEach(keyword => {
      currentInsights.keywordFrequency[keyword] = (currentInsights.keywordFrequency[keyword] || 0) + 1;
    });

    // Update average scores
    const weight = 0.3; // Weight for new data
    currentInsights.sentimentScore = (currentInsights.sentimentScore * (1 - weight)) + (newAnalysis.sentimentScore * weight);

    return currentInsights;
  };

  // Additional helper methods would be implemented here...
  // (generateConversationInsights, analyzeEngagement, extractKeywords, etc.)
  
  generateConversationInsights = async (interview) => {
    // Mock implementation - would integrate with AI analysis
    return {
      overall: {
        score: 7.5,
        trend: 'improving',
        consistency: 'good'
      },
      performance: {
        technicalKnowledge: 8.0,
        communication: 7.0,
        problemSolving: 7.5
      },
      engagement: {
        level: 'high',
        indicators: ['Active participation', 'Detailed responses']
      },
      communication: {
        clarity: 'excellent',
        structure: 'good',
        enthusiasm: 'moderate'
      },
      technical: {
        depth: 'good',
        accuracy: 'high',
        breadth: 'moderate'
      },
      trends: {
        performance: 'stable',
        confidence: 'increasing',
        engagement: 'consistent'
      }
    };
  };

  analyzeEngagement = async (interview) => {
    // Mock engagement analysis
    return {
      level: 'high',
      score: 8.2,
      indicators: [
        'Consistent response times',
        'Detailed answers',
        'Active participation'
      ],
      recommendations: [
        'Maintain current engagement level',
        'Consider increasing question complexity'
      ],
      trend: 'stable'
    };
  };

  extractKeywords = async (text, context, interview) => {
    // Mock keyword extraction
    const words = text.toLowerCase().split(' ');
    return {
      keywords: words.slice(0, 5), // Mock keywords
      technicalTerms: words.filter(w => w.length > 6),
      skills: ['JavaScript', 'Problem Solving', 'Communication'],
      sentiment: 'positive',
      relevance: 0.85
    };
  };

  generateInterviewSummary = async (interview, options = {}) => {
    // Mock summary generation
    return {
      interview: {
        id: interview._id,
        candidate: interview.candidateId.name,
        duration: Math.round((new Date() - new Date(interview.aiSession.startTime)) / 1000),
        status: interview.status
      },
      performance: {
        overallScore: 7.5,
        technicalScore: 8.0,
        communicationScore: 7.0,
        recommendation: 'Proceed to next round'
      },
      highlights: [
        'Strong technical knowledge',
        'Good problem-solving approach',
        'Clear communication style'
      ],
      areasForImprovement: [
        'Could provide more specific examples',
        'Consider deeper technical explanations'
      ]
    };
  };

  // ===========================================================================================================================
  // -------------------------------------------------- Get AI Interview ------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Get AI interview by ID
   * @route   GET /api/ai-interviews/:id
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  getAIInterview = asyncHandler(async (req, res) => {
    const { id } = req.params;
    const userId = req.user.userId;
    const userRole = req.user.role;

    try {
      // Find the interview
      const interview = await Interview.findById(id)
        .populate('templateId', 'title description category difficulty questions')
        .populate('candidateId', 'name email')
        .populate('recruiterId', 'name email')
        .lean();

      if (!interview) {
        return res.status(404).json({
          success: false,
          message: 'AI interview not found'
        });
      }

      // Check if this is actually an AI interview
      if (!interview.aiSession) {
        return res.status(400).json({
          success: false,
          message: 'This is not an AI interview'
        });
      }

      // Check permissions
      const isCandidate = userRole === 'Candidate' && interview.candidateId._id.toString() === userId;
      const isRecruiterOrAdmin = ['Admin', 'Recruiter'].includes(userRole);
      const isOwnInterview = interview.recruiterId._id.toString() === userId;

      if (!isCandidate && !isRecruiterOrAdmin && !isOwnInterview) {
        return res.status(403).json({
          success: false,
          message: 'Access denied. You can only access your own interviews.'
        });
      }

      // Return the interview data
      res.status(200).json({
        success: true,
        data: interview,
        message: 'AI interview retrieved successfully'
      });

    } catch (error) {
      console.error('Error in getAIInterview:', error);
      
      if (error.name === 'CastError') {
        return res.status(400).json({
          success: false,
          message: 'Invalid interview ID format'
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retrieve AI interview',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  // ===========================================================================================================================
  // -------------------------------------------------- Save Q&A Data -----------------------------------------------------
  // ===========================================================================================================================

  /**
   * @desc    Save questions and answers data to interview
   * @route   POST /api/ai-interviews/:id/save-qa
   * @access  Private (Candidate for own interview, Admin/Recruiter for any)
   */
  saveQAData = asyncHandler(async (req, res) => {
    const { id: interviewId } = req.params;
    const { questionsAndAnswers } = req.body;

    if (!questionsAndAnswers || !Array.isArray(questionsAndAnswers)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid questions and answers data'
      });
    }

    const interview = await Interview.findById(interviewId);
    if (!interview) {
      throw new AppError('Interview not found', 404);
    }

    // Authorization check
    if (!this.hasInterviewAccess(req.user, interview)) {
      throw new AppError('Not authorized to access this interview', 403);
    }

    try {
      // Process and store Q&A data
      const processedAnswers = questionsAndAnswers.map(qa => ({
        questionId: qa.questionId,
        questionText: qa.questionText,
        answerText: qa.answerText,
        answerTimestamp: qa.answerTimestamp || new Date(),
        duration: qa.duration || null,
        score: qa.score || null,
        difficulty: qa.difficulty || 'medium',
        skipped: qa.skipped || false,
        incomplete: qa.incomplete || false,
        recruiterNotes: qa.recruiterNotes || null
      }));

      // Update interview with Q&A data
      interview.answers = [...(interview.answers || []), ...processedAnswers];

      // Add system event for Q&A data save (don't add qa_pair entries as they're not valid enum values)
      interview.aiSession.conversationLog.push({
        timestamp: new Date(),
        type: 'system_event',
        content: `Saved ${questionsAndAnswers.length} Q&A pairs`,
        metadata: {
          eventType: 'qa_data_save',
          qaCount: questionsAndAnswers.length,
          savedBy: req.user.userId,
          skippedCount: questionsAndAnswers.filter(qa => qa.skipped).length,
          incompleteCount: questionsAndAnswers.filter(qa => qa.incomplete).length
        }
      });

      await interview.save();

      res.status(200).json({
        success: true,
        message: 'Questions and answers saved successfully',
        data: {
          savedCount: questionsAndAnswers.length,
          totalAnswers: interview.answers.length,
          skippedCount: questionsAndAnswers.filter(qa => qa.skipped).length,
          incompleteCount: questionsAndAnswers.filter(qa => qa.incomplete).length,
          savedAt: new Date()
        }
      });

    } catch (error) {
      console.error('Error saving Q&A data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to save questions and answers',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
      });
    }
  });

  /**
   * Generate final analysis for completed interview
   */
  generateFinalAnalysis = async (interview) => {
    const conversationLog = interview.aiSession.conversationLog || [];
    const answers = conversationLog.filter(log => log.type === 'candidate_answer');
    const totalQuestions = interview.aiSession.totalQuestionsAsked || 0;
    
    // Calculate analysis metrics
    const avgResponseTime = interview.aiSession.averageResponseTime || 0;
    const totalWordCount = answers.reduce((total, answer) => {
      return total + (answer.content ? answer.content.split(' ').length : 0);
    }, 0);
    
    const avgWordsPerAnswer = answers.length > 0 ? Math.round(totalWordCount / answers.length) : 0;
    
    // Analyze communication patterns
    const communicationStyles = {
      detailed: answers.filter(a => a.content && a.content.split(' ').length > 50).length,
      concise: answers.filter(a => a.content && a.content.split(' ').length <= 20).length,
      balanced: answers.filter(a => a.content && a.content.split(' ').length > 20 && a.content.split(' ').length <= 50).length
    };
    
    const dominantStyle = Object.keys(communicationStyles).reduce((a, b) => 
      communicationStyles[a] > communicationStyles[b] ? a : b
    );
    
    return {
      totalQuestions,
      answersProvided: answers.length,
      completionRate: totalQuestions > 0 ? Math.round((answers.length / totalQuestions) * 100) : 0,
      averageResponseTime: Math.round(avgResponseTime),
      averageWordsPerAnswer: avgWordsPerAnswer,
      totalWordCount,
      communicationStyle: dominantStyle,
      responseConsistency: answers.length > 2 ? 'consistent' : 'limited_data',
      engagementLevel: avgWordsPerAnswer > 30 ? 'high' : avgWordsPerAnswer > 15 ? 'medium' : 'low',
      analysisTimestamp: new Date()
    };
  };

  /**
   * Calculate overall interview score
   */
  calculateOverallScore = async (interview) => {
    const analysis = interview.aiSession.finalAnalysis;
    if (!analysis) return 5.0; // Default score
    
    let score = 5.0; // Base score
    
    // Completion rate factor (30% weight)
    const completionFactor = (analysis.completionRate / 100) * 3;
    
    // Response quality factor (40% weight)
    let qualityFactor = 2.0; // Base quality
    if (analysis.averageWordsPerAnswer > 40) qualityFactor = 4.0;
    else if (analysis.averageWordsPerAnswer > 25) qualityFactor = 3.5;
    else if (analysis.averageWordsPerAnswer > 15) qualityFactor = 3.0;
    else if (analysis.averageWordsPerAnswer > 8) qualityFactor = 2.5;
    
    // Engagement factor (20% weight)
    let engagementFactor = 1.0;
    if (analysis.engagementLevel === 'high') engagementFactor = 2.0;
    else if (analysis.engagementLevel === 'medium') engagementFactor = 1.5;
    
    // Response time factor (10% weight)
    let timeFactor = 1.0;
    if (analysis.averageResponseTime < 60) timeFactor = 1.0; // Very quick
    else if (analysis.averageResponseTime < 120) timeFactor = 0.9; // Quick
    else if (analysis.averageResponseTime < 180) timeFactor = 0.8; // Moderate
    else timeFactor = 0.7; // Slow
    
    // Calculate weighted score
    const finalScore = completionFactor + qualityFactor + engagementFactor + timeFactor;
    
    // Ensure score is within 0-10 range
    return Math.min(Math.max(finalScore, 0), 10);
  };

  /**
   * Generate hiring recommendation
   */
  generateRecommendation = async (interview, overallScore) => {
    const analysis = interview.aiSession.finalAnalysis;
    
    let decision = 'maybe';
    let confidence = 0.5;
    let reasoning = [];
    let keyFactors = [];
    let risks = [];
    let strengths = [];
    
    // Decision logic based on score
    if (overallScore >= 8.0) {
      decision = 'hire';
      confidence = 0.85;
      reasoning.push('Excellent performance across all evaluation criteria');
    } else if (overallScore >= 6.5) {
      decision = 'hire';
      confidence = 0.75;
      reasoning.push('Strong performance with good potential');
    } else if (overallScore >= 5.0) {
      decision = 'maybe';
      confidence = 0.6;
      reasoning.push('Moderate performance, requires further evaluation');
    } else if (overallScore >= 3.5) {
      decision = 'maybe';
      confidence = 0.4;
      reasoning.push('Below average performance, significant concerns');
    } else {
      decision = 'reject';
      confidence = 0.8;
      reasoning.push('Poor performance, does not meet minimum requirements');
    }
    
    // Analyze specific factors
    if (analysis) {
      // Completion rate analysis
      if (analysis.completionRate >= 90) {
        strengths.push('Excellent interview completion rate');
        keyFactors.push('High engagement and commitment');
      } else if (analysis.completionRate < 50) {
        risks.push('Low interview completion rate');
        keyFactors.push('Potential engagement issues');
      }
      
      // Communication analysis
      if (analysis.averageWordsPerAnswer > 30) {
        strengths.push('Detailed and thorough responses');
      } else if (analysis.averageWordsPerAnswer < 10) {
        risks.push('Very brief responses, may lack detail');
      }
      
      // Response time analysis
      if (analysis.averageResponseTime > 300) {
        risks.push('Slow response times may indicate hesitation or lack of knowledge');
      } else if (analysis.averageResponseTime < 30) {
        keyFactors.push('Quick responses demonstrate confidence');
      }
      
      // Communication style analysis
      if (analysis.communicationStyle === 'detailed') {
        strengths.push('Comprehensive communication style');
      } else if (analysis.communicationStyle === 'balanced') {
        strengths.push('Well-balanced communication approach');
      }
    }
    
    // Default factors if analysis is limited
    if (strengths.length === 0) {
      strengths.push('Completed AI interview process');
    }
    
    if (keyFactors.length === 0) {
      keyFactors.push('Overall interview performance');
    }
    
    return {
      decision,
      confidence: Math.round(confidence * 100) / 100,
      reasoning: reasoning.join('. '),
      keyFactors,
      risks,
      strengths,
      recommendationDate: new Date(),
      interviewScore: overallScore
    };
  };
}

module.exports = new AIInterviewController();
