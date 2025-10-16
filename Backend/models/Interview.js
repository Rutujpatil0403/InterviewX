const mongoose = require('mongoose');

// Ensure Template model is loaded
require('./Template');

const interviewSchema = new mongoose.Schema({
  templateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: false,
    ref: 'Template',
    default: null,
  },
  candidateId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  recruiterId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User',
  },
  interviewDate: {
    type: Date,
    required: true,
  },
  interviewTime: {
    type: String,
    required: true,
  },
  startTime: {
    type: Date,
    default: null,
  },
  endTime: {
    type: Date,
    default: null,
  },
  status: {
    type: String,
    required: true,
    enum: ['Scheduled', 'In Progress', 'Paused', 'Completed', 'Cancelled', 'Deleted'],
  },
  questionOrder: {
    type: Array,
    default: null,
  },
  answers: [{
    questionId: {
      type: String,
      required: true,
    },
    questionText: {
      type: String,
      required: true,
    },
    answerText: {
      type: String,
      required: true,
    },
    answerTimestamp: {
      type: Date,
      required: true,
      default: Date.now,
    },
    score: {
      type: Number,
      min: 0,
      max: 10,
      default: null,
    },
    recruiterNotes: {
      type: String,
      default: null,
    },
    duration: {
      type: Number, // Time taken to answer in seconds
      default: null,
    }
  }],
  notes: {
    type: String,
    default: null,
  },
  // AI Interview Session Data
  aiSession: {
    // Session Control
    startTime: { type: Date, default: null },
    endTime: { type: Date, default: null },
    pausedAt: { type: Date, default: null },
    resumedAt: { type: Date, default: null },
    totalDuration: { type: Number, default: 0 }, // in seconds
    activeDuration: { type: Number, default: 0 }, // excluding pauses
    totalPauseDuration: { type: Number, default: 0 },
    
    // AI Configuration
    aiPersonality: {
      type: String,
      enum: ['professional', 'friendly', 'technical', 'casual', 'formal'],
      default: 'professional'
    },
    interviewStyle: {
      type: String,
      enum: ['balanced', 'technical', 'behavioral', 'mixed'],
      default: 'balanced'
    },
    estimatedDuration: { type: Number, default: 60 }, // in minutes
    
    // Question Management
    currentQuestionIndex: { type: Number, default: 0 },
    totalQuestionsAsked: { type: Number, default: 0 },
    difficultyLevel: {
      type: String,
      enum: ['easy', 'medium', 'hard', 'expert'],
      default: 'medium'
    },
    
    // Performance Metrics
    averageResponseTime: { type: Number, default: 0 }, // in seconds
    engagementScore: { type: Number, default: 0, min: 0, max: 10 },
    confidenceScore: { type: Number, default: 0, min: 0, max: 1 },
    
    // Conversation Log
    conversationLog: [{
      timestamp: { type: Date, required: true },
      type: {
        type: String,
        enum: ['ai_message', 'ai_question', 'ai_followup', 'candidate_answer', 'system_event'],
        required: true
      },
      content: { type: String, required: true },
      questionId: { type: String, default: null },
      metadata: { type: mongoose.Schema.Types.Mixed, default: {} }
    }],
    
    // Real-time Insights
    realTimeInsights: {
      keywordFrequency: { type: Map, of: Number, default: new Map() },
      sentimentScore: { type: Number, default: 0, min: -1, max: 1 },
      communicationStyle: {
        type: String,
        enum: ['unknown', 'direct', 'detailed', 'concise', 'storytelling'],
        default: 'unknown'
      },
      technicalDepth: { type: Number, default: 0, min: 0, max: 10 },
      problemSolvingApproach: {
        type: String,
        enum: ['unknown', 'analytical', 'creative', 'methodical', 'intuitive'],
        default: 'unknown'
      }
    },
    
    // AI Analysis Results
    aiAnalysis: {
      strengths: [{ type: String }],
      weaknesses: [{ type: String }],
      recommendations: [{ type: String }],
      overallScore: { type: Number, default: 0, min: 0, max: 10 },
      categoryScores: {
        technical: { type: Number, default: 0, min: 0, max: 10 },
        communication: { type: Number, default: 0, min: 0, max: 10 },
        problemSolving: { type: Number, default: 0, min: 0, max: 10 },
        cultural: { type: Number, default: 0, min: 0, max: 10 }
      }
    },
    
    // Customization Settings
    personalityTraits: {
      warmth: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      formality: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      patience: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
      encouragement: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
      directness: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
    },
    
    communicationStyle: {
      type: String,
      enum: ['balanced', 'direct', 'supportive', 'challenging'],
      default: 'balanced'
    },
    
    questioningApproach: {
      type: String,
      enum: ['adaptive', 'structured', 'exploratory', 'focused'],
      default: 'adaptive'
    },
    
    styleConfiguration: {
      focusAreas: [{ type: String }],
      pacing: { type: String, enum: ['slow', 'medium', 'fast', 'adaptive'], default: 'medium' },
      depth: { type: String, enum: ['shallow', 'medium', 'deep', 'comprehensive'], default: 'medium' },
      adaptivity: { type: String, enum: ['low', 'medium', 'high'], default: 'high' },
      lastModified: { type: Date, default: Date.now },
      modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    
    timeManagement: {
      totalDuration: { type: Number, default: 60 }, // in minutes
      timeWarnings: { type: Boolean, default: true },
      flexibleTiming: { type: Boolean, default: false },
      breakAllowed: { type: Boolean, default: false },
      warningTimes: [{ type: Number }] // array of minute marks for warnings
    },
    
    questionPreferences: {
      preferredTypes: [{ type: String }],
      avoidTypes: [{ type: String }],
      difficultyDistribution: {
        type: String,
        enum: ['easy', 'balanced', 'hard', 'adaptive'],
        default: 'balanced'
      },
      categoryWeights: { type: Map, of: Number, default: new Map() },
      lastModified: { type: Date, default: Date.now },
      modifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }
    },
    
    // Final Results
    finalAnalysis: { type: mongoose.Schema.Types.Mixed, default: null },
    overallScore: { type: Number, default: 0, min: 0, max: 10 },
    recommendation: {
      decision: { type: String, enum: ['hire', 'reject', 'maybe', 'next_round'], default: null },
      confidence: { type: Number, default: 0, min: 0, max: 1 },
      reasoning: { type: String, default: null },
      keyFactors: [{ type: String }],
      risks: [{ type: String }],
      strengths: [{ type: String }]
    },
    
    completionReason: {
      type: String,
      enum: ['completed', 'timeout', 'candidate_ended', 'technical_issue', 'interviewer_ended'],
      default: null
    },
    
    // Metadata
    aiVersion: { type: String, default: '1.0' },
    modelUsed: { type: String, default: 'gpt-4' },
    lastUpdated: { type: Date, default: Date.now }
  },
  
  // Additional fields for AI interviews
  actualStartTime: { type: Date, default: null },
  actualEndTime: { type: Date, default: null },
  pauseReason: { type: String, default: null },
  
  createdAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
}, {
  indexes: [
    { key: { candidateId: 1 } },
    { key: { recruiterId: 1 } },
    { key: { interviewDate: 1 } },
    { key: { status: 1 } },
    { key: { interviewDate: 1, interviewTime: 1 } },
  ],
});

// Static method to create new interview
interviewSchema.statics.create = async function(interviewData) {
  try {
    const interview = new this(interviewData);
    await interview.save();
    
    // Populate the created interview with related data
    const populateOptions = [
      { path: 'candidateId', select: 'name email' },
      { path: 'recruiterId', select: 'name email' }
    ];
    
    // Only populate templateId if it exists
    if (interview.templateId) {
      populateOptions.push({ path: 'templateId', select: 'name' });
    }
    
    const populatedInterview = await this.findById(interview._id)
      .populate(populateOptions);
      
    return populatedInterview;
  } catch (error) {
    console.error('Error creating interview:', error);
    throw error;
  }
};

// Static method to get all interviews with filtering and pagination
interviewSchema.statics.getAll = async function(filters, page, limit) {
  try {
    const skip = (page - 1) * limit;
    const query = {};
    
    // Build query based on filters
    if (filters.status) query.status = filters.status;
    if (filters.templateId) query.templateId = filters.templateId;
    if (filters.recruiterId) query.recruiterId = filters.recruiterId;
    if (filters.candidateId) query.candidateId = filters.candidateId;
    
    // Handle date range filtering
    if (filters.date_from || filters.date_to) {
      query.interviewDate = {};
      if (filters.date_from) query.interviewDate.$gte = new Date(filters.date_from);
      if (filters.date_to) query.interviewDate.$lte = new Date(filters.date_to);
    }
    
    const interviews = await this.find(query)
      .populate({
        path: 'templateId',
        select: 'name',
        options: { strictPopulate: false }
      })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email')
      .skip(skip)
      .limit(limit)
      .sort({ interviewDate: -1, interviewTime: -1 });
      
    const total = await this.countDocuments(query);
    
    return {
      interviews,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalInterviews: total,
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1
      }
    };
  } catch (error) {
    console.error('Error getting interviews:', error);
    throw error;
  }
};

// Static method to get interview by ID
interviewSchema.statics.getById = async function(interviewId) {
  try {
    const interview = await this.findById(interviewId)
      .populate({
        path: 'templateId',
        select: 'name questions',
        options: { strictPopulate: false }
      })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
    return interview;
  } catch (error) {
    console.error('Error getting interview by ID:', error);
    throw error;
  }
};

// Static method to update interview
interviewSchema.statics.update = async function(interviewId, updateData) {
  try {
    const updatedInterview = await this.findByIdAndUpdate(
      interviewId,
      { ...updateData, updatedAt: new Date() },
      { new: true, runValidators: true }
    ).populate({
        path: 'templateId',
        select: 'name',
        options: { strictPopulate: false }
      })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
    return updatedInterview;
  } catch (error) {
    console.error('Error updating interview:', error);
    throw error;
  }
};

// Static method to delete interview
interviewSchema.statics.delete = async function(interviewId) {
  try {
    await this.findByIdAndDelete(interviewId);
    return true;
  } catch (error) {
    console.error('Error deleting interview:', error);
    throw error;
  }
};

// Static method to start interview
interviewSchema.statics.startInterview = async function(interviewId) {
  try {
    const updatedInterview = await this.findByIdAndUpdate(
      interviewId,
      { 
        status: 'In Progress',
        startTime: new Date(),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate({
        path: 'templateId',
        select: 'name questions',
        options: { strictPopulate: false }
      })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
    return updatedInterview;
  } catch (error) {
    console.error('Error starting interview:', error);
    throw error;
  }
};

// Static method to end interview
interviewSchema.statics.endInterview = async function(interviewId) {
  try {
    const updatedInterview = await this.findByIdAndUpdate(
      interviewId,
      { 
        status: 'Completed',
        endTime: new Date(),
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate({
        path: 'templateId',
        select: 'name questions',
        options: { strictPopulate: false }
      })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
    return updatedInterview;
  } catch (error) {
    console.error('Error ending interview:', error);
    throw error;
  }
};

// Static method to get interviews by date range
interviewSchema.statics.getByDateRange = async function(startDate, endDate, userId, role) {
  try {
    const query = {
      interviewDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    };
    
    // Apply role-based filtering
    if (role === 'Recruiter') {
      query.recruiterId = userId;
    } else if (role === 'Candidate') {
      query.candidateId = userId;
    }
    
    const interviews = await this.find(query)
      .populate({
        path: 'templateId',
        select: 'name',
        options: { strictPopulate: false }
      })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email')
      .sort({ interviewDate: 1, interviewTime: 1 });
      
    return interviews;
  } catch (error) {
    console.error('Error getting interviews by date range:', error);
    throw error;
  }
};

// Static method to get interview statistics
interviewSchema.statics.getStats = async function(filters = {}) {
  try {
    const query = {};
    if (filters.recruiterId) query.recruiterId = filters.recruiterId;
    if (filters.candidateId) query.candidateId = filters.candidateId;
    
    const totalInterviews = await this.countDocuments(query);
    const scheduledInterviews = await this.countDocuments({ ...query, status: 'Scheduled' });
    const inProgressInterviews = await this.countDocuments({ ...query, status: 'In Progress' });
    const completedInterviews = await this.countDocuments({ ...query, status: 'Completed' });
    const cancelledInterviews = await this.countDocuments({ ...query, status: 'Cancelled' });
    
    const recentInterviews = await this.countDocuments({
      ...query,
      createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
    });
    
    const upcomingInterviews = await this.countDocuments({
      ...query,
      interviewDate: { $gte: new Date() },
      status: 'Scheduled'
    });
    
    return {
      totalInterviews,
      scheduledInterviews,
      inProgressInterviews,
      completedInterviews,
      cancelledInterviews,
      recentInterviews,
      upcomingInterviews
    };
  } catch (error) {
    console.error('Error getting interview statistics:', error);
    throw error;
  }
};

// Static method to add an answer to interview
interviewSchema.statics.addAnswer = async function(interviewId, answerData) {
  try {
    const { questionId, questionText, answerText, score = null, recruiterNotes = null, duration = null } = answerData;
    
    const updatedInterview = await this.findByIdAndUpdate(
      interviewId,
      {
        $push: {
          answers: {
            questionId,
            questionText,
            answerText,
            answerTimestamp: new Date(),
            score,
            recruiterNotes,
            duration
          }
        },
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).populate({
        path: 'templateId',
        select: 'name questions',
        options: { strictPopulate: false }
      })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
    
    return updatedInterview;
  } catch (error) {
    console.error('Error adding answer to interview:', error);
    throw error;
  }
};

// Static method to update an answer
interviewSchema.statics.updateAnswer = async function(interviewId, questionId, updateData) {
  try {
    const updatedInterview = await this.findOneAndUpdate(
      { 
        _id: interviewId, 
        'answers.questionId': questionId 
      },
      {
        $set: {
          'answers.$.answerText': updateData.answerText || undefined,
          'answers.$.score': updateData.score !== undefined ? updateData.score : undefined,
          'answers.$.recruiterNotes': updateData.recruiterNotes || undefined,
          'answers.$.duration': updateData.duration || undefined,
          updatedAt: new Date()
        }
      },
      { new: true, runValidators: true }
    ).populate({
        path: 'templateId',
        select: 'name questions',
        options: { strictPopulate: false }
      })
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
    
    return updatedInterview;
  } catch (error) {
    console.error('Error updating answer in interview:', error);
    throw error;
  }
};

// Static method to get answers for an interview
interviewSchema.statics.getAnswers = async function(interviewId) {
  try {
    const interview = await this.findById(interviewId)
      .select('answers candidateId recruiterId')
      .populate('candidateId', 'name email')
      .populate('recruiterId', 'name email');
    
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    return {
      interviewId,
      candidate: interview.candidateId,
      recruiter: interview.recruiterId,
      answers: interview.answers
    };
  } catch (error) {
    console.error('Error getting answers for interview:', error);
    throw error;
  }
};

// Static method to calculate interview completion percentage
interviewSchema.statics.getCompletionStats = async function(interviewId) {
  try {
    const interview = await this.findById(interviewId)
      .populate({
        path: 'templateId',
        select: 'questions',
        options: { strictPopulate: false }
      });
    
    if (!interview) {
      throw new Error('Interview not found');
    }
    
    const totalQuestions = interview.templateId?.questions?.length || 0;
    const answeredQuestions = interview.answers?.length || 0;
    const completionPercentage = totalQuestions > 0 ? Math.round((answeredQuestions / totalQuestions) * 100) : 0;
    
    return {
      totalQuestions,
      answeredQuestions,
      completionPercentage,
      remainingQuestions: totalQuestions - answeredQuestions
    };
  } catch (error) {
    console.error('Error calculating completion stats:', error);
    throw error;
  }
};

module.exports = mongoose.model('Interview', interviewSchema);