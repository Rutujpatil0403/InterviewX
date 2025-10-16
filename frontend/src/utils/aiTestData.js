// Test utility to create sample AI interview data for testing
export const sampleAIInterview = {
  _id: "test-ai-interview-123",
  candidateId: {
    _id: "candidate-123",
    name: "John Doe",
    email: "john.doe@example.com"
  },
  recruiterId: {
    _id: "recruiter-123", 
    name: "Jane Smith",
    email: "jane.smith@company.com"
  },
  templateId: {
    _id: "template-123",
    title: "Software Engineer Interview",
    description: "Technical interview for software engineering position",
    category: "Technical",
    difficulty: "Medium",
    questions: [
      {
        _id: "q1",
        text: "Explain the difference between let, const, and var in JavaScript",
        type: "technical",
        difficulty: "medium"
      },
      {
        _id: "q2", 
        text: "How would you implement a binary search algorithm?",
        type: "technical",
        difficulty: "hard"
      }
    ]
  },
  position: "Senior Software Engineer",
  status: "Scheduled",
  aiSession: {
    personality: "professional",
    style: "technical", 
    duration: 60,
    status: "ready",
    conversationLog: [],
    currentQuestionIndex: 0,
    insights: {
      engagementScore: 0,
      communicationStyle: "analyzing",
      technicalScore: 0,
      overallScore: 0
    }
  },
  scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
  createdAt: new Date(),
  updatedAt: new Date()
};

// Mock API responses for testing
export const mockAIAPIResponses = {
  // eslint-disable-next-line no-unused-vars
  getAIInterview: (id) => ({
    success: true,
    data: sampleAIInterview,
    message: "AI interview retrieved successfully"
  }),
  
  // eslint-disable-next-line no-unused-vars
  startAIInterview: (id) => ({
    success: true,
    data: {
      session: {
        sessionId: "session-123",
        welcomeMessage: "Welcome to your AI-powered interview! I'm your AI interviewer and I'll be asking you questions based on the Software Engineer position. Let's begin when you're ready.",
        firstQuestion: "To start, could you please tell me about your experience with JavaScript and what draws you to software engineering?",
        questionId: "q-start-1",
        difficulty: "easy"
      }
    },
    message: "AI interview session started successfully"
  }),
  
  // eslint-disable-next-line no-unused-vars
  askNextQuestion: (id, answer) => ({
    success: true,
    data: {
      nextQuestion: {
        id: "q-next-2",
        question: "That's great! Now, can you explain the difference between let, const, and var in JavaScript? Please provide examples of when you would use each.",
        difficulty: "medium"
      },
      insights: {
        engagementScore: 8.5,
        communicationStyle: "clear and confident",
        technicalAccuracy: 7.0
      }
    },
    message: "Next question generated successfully"
  }),
  
  // eslint-disable-next-line no-unused-vars
  pauseAIInterview: (id) => ({
    success: true,
    data: {
      sessionStatus: "paused",
      pausedAt: new Date()
    },
    message: "Interview paused successfully"
  }),
  
  // eslint-disable-next-line no-unused-vars
  resumeAIInterview: (id) => ({
    success: true,
    data: {
      sessionStatus: "active",
      resumedAt: new Date()
    },
    message: "Interview resumed successfully"
  }),
  
  // eslint-disable-next-line no-unused-vars
  endAIInterview: (id) => ({
    success: true,
    data: {
      sessionStatus: "completed",
      endedAt: new Date(),
      summary: {
        totalQuestions: 8,
        totalTime: "32:45",
        overallScore: 8.2,
        recommendation: "Strong candidate - proceed to next round"
      }
    },
    message: "Interview ended successfully"
  })
};