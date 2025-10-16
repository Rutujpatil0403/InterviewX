import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Bot, 
  Send, 
  Phone, 
  SkipForward,
  MessageCircle,
  Brain,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { aiInterviewAPI } from '../../services/aiAPI';
import { useAuth } from '../../hooks/useAuth';

// Styled Components
const AIInterviewContainer = styled.div`
  display: flex;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  overflow: hidden;
`;

const MainPanel = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  background: white;
  margin: 1rem;
  border-radius: 1rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const Header = styled.div`
  background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
  color: white;
  padding: 1.5rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const AIAvatar = styled.div`
  width: 3rem;
  height: 3rem;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const HeaderInfo = styled.div`
  h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 600;
  }
  
  p {
    margin: 0.25rem 0 0 0;
    opacity: 0.9;
    font-size: 0.875rem;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatusBadge = styled.div`
  background: rgba(255, 255, 255, 0.2);
  padding: 0.5rem 1rem;
  border-radius: 2rem;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const TimerDisplay = styled.div`
  font-family: 'JetBrains Mono', monospace;
  font-size: 1.125rem;
  font-weight: 600;
`;

const ChatContainer = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const MessagesArea = styled.div`
  flex: 1;
  padding: 2rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  
  &::-webkit-scrollbar {
    width: 0.5rem;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f5f9;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 0.25rem;
  }
`;

const Message = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-start;
  max-width: ${props => props.$isUser ? '80%' : '90%'};
  margin-left: ${props => props.$isUser ? 'auto' : '0'};
  margin-right: ${props => props.$isUser ? '0' : 'auto'};
`;

const MessageAvatar = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 50%;
  background: ${props => props.$isUser ? '#4f46e5' : '#10b981'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const MessageBubble = styled.div`
  background: ${props => props.$isUser ? '#4f46e5' : '#f8fafc'};
  color: ${props => props.$isUser ? 'white' : '#374151'};
  padding: 1rem 1.5rem;
  border-radius: ${props => props.$isUser ? '1.5rem 1.5rem 0.5rem 1.5rem' : '1.5rem 1.5rem 1.5rem 0.5rem'};
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  font-size: 0.95rem;
  line-height: 1.5;
  max-width: 100%;
  word-wrap: break-word;
`;

const QuestionHighlight = styled.div`
  background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
  border: 2px solid #f59e0b;
  border-radius: 1rem;
  padding: 1.5rem;
  margin: 1rem 0;
  
  .question-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    color: #92400e;
    font-weight: 600;
    margin-bottom: 1rem;
  }
  
  .question-text {
    color: #451a03;
    font-size: 1.1rem;
    line-height: 1.6;
  }
`;

const InputSection = styled.div`
  padding: 1.5rem 2rem;
  background: #f8fafc;
  border-top: 1px solid #e2e8f0;
`;

const InputContainer = styled.div`
  display: flex;
  gap: 1rem;
  align-items: flex-end;
`;

const InputField = styled.textarea`
  flex: 1;
  min-height: 3rem;
  max-height: 8rem;
  padding: 0.875rem 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 1rem;
  font-size: 1rem;
  resize: vertical;
  font-family: inherit;
  
  &:focus {
    outline: none;
    border-color: #4f46e5;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1);
  }
  
  &::placeholder {
    color: #9ca3af;
  }
`;

const ActionButton = styled.button`
  padding: 0.875rem;
  border: none;
  border-radius: 50%;
  background: ${props => props.$variant === 'primary' ? '#4f46e5' : '#6b7280'};
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  
  &:hover:not(:disabled) {
    background: ${props => props.$variant === 'primary' ? '#4338ca' : '#4b5563'};
    transform: translateY(-1px);
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const ControlsPanel = styled.div`
  display: flex;
  gap: 0.5rem;
  align-items: center;
`;

const SidePanel = styled.div`
  width: 300px;
  background: white;
  border-left: 1px solid #e2e8f0;
  display: flex;
  flex-direction: column;
  
  @media (max-width: 1024px) {
    display: none;
  }
`;

const SidePanelHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  background: #f8fafc;
  
  h3 {
    margin: 0;
    color: #374151;
    font-size: 1.125rem;
    font-weight: 600;
  }
`;

const InsightsContainer = styled.div`
  flex: 1;
  padding: 1.5rem;
  overflow-y: auto;
`;

const InsightCard = styled.div`
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 0.75rem;
  padding: 1rem;
  margin-bottom: 1rem;
  
  .title {
    font-weight: 600;
    color: #374151;
    margin-bottom: 0.5rem;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  .value {
    color: #6b7280;
    font-size: 0.875rem;
  }
`;

const LoadingIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  color: #6b7280;
  font-style: italic;
  
  &::after {
    content: '';
    width: 1rem;
    height: 1rem;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #4f46e5;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

// Component
const AIInterviewRoom = () => {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  
  // State
  const [interview, setInterview] = useState(null);
  const [messages, setMessages] = useState([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [sessionTime, setSessionTime] = useState(0);
  const [insights, setInsights] = useState(null);
  const [questionsAndAnswers, setQuestionsAndAnswers] = useState([]);
  const [currentQuestionStartTime, setCurrentQuestionStartTime] = useState(null);
  
  // Timer effect
  useEffect(() => {
    let interval;
    if (sessionStarted) {
      interval = setInterval(() => {
        setSessionTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [sessionStarted]);
  
  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-save Q&A data periodically
  useEffect(() => {
    let saveInterval;
    
    if (sessionStarted && questionsAndAnswers.length > 0) {
      saveInterval = setInterval(async () => {
        try {
          await aiInterviewAPI.saveQAData(interviewId, questionsAndAnswers);
          console.log('Auto-saved Q&A data:', questionsAndAnswers.length, 'pairs');
        } catch (error) {
          console.error('Auto-save Q&A data failed:', error);
        }
      }, 60000); // Auto-save every minute
    }
    
    return () => {
      if (saveInterval) {
        clearInterval(saveInterval);
      }
    };
  }, [sessionStarted, questionsAndAnswers, interviewId]);
  
  // Debug log for Q&A data
  useEffect(() => {
    console.log('Current Q&A pairs:', questionsAndAnswers);
  }, [questionsAndAnswers]);
  
  // Debug state changes
  useEffect(() => {
    console.log('State update:', {
      sessionStarted,
      currentQuestion: currentQuestion ? 'exists' : 'null',
      currentAnswer: currentAnswer ? `"${currentAnswer}"` : 'empty',
      isLoading,
      messagesCount: messages.length
    });
  }, [sessionStarted, currentQuestion, currentAnswer, isLoading, messages]);
  
  // Load interview data
  useEffect(() => {
    const loadInterview = async () => {
      try {
        const response = await aiInterviewAPI.getAIInterview(interviewId);
        setInterview(response.data || response);
        
        // If session already started, load conversation
        if (response.data?.aiSession?.conversationLog) {
          const logs = response.data.aiSession.conversationLog;
          const formattedMessages = logs.map(log => ({
            id: log._id || Date.now() + Math.random(),
            type: log.type,
            content: log.content,
            timestamp: log.timestamp,
            isUser: log.type === 'candidate_answer'
          }));
          setMessages(formattedMessages);
          setSessionStarted(response.data.status === 'In Progress');
        }
      } catch (error) {
        console.error('Error loading interview:', error);
        toast.error('Failed to load interview');
        navigate('/interviews');
      }
    };
    
    if (interviewId) {
      loadInterview();
    }
  }, [interviewId, navigate]);
  
  // Start interview session
  const startSession = async () => {
    try {
      setIsLoading(true);
      console.log('Starting AI interview session...');
      const response = await aiInterviewAPI.startAIInterview(interviewId);
      
      console.log('Start session response:', response);
      console.log('Response data:', response.data);
      console.log('Session data:', response.data?.session);
      
      setSessionStarted(true);
      
      // Check if we have the required session data
      if (!response.data?.session) {
        console.error('No session data in response');
        console.error('Full response:', response);
        toast.error('Invalid session data received');
        return;
      }
      
      const sessionData = response.data.session;
      console.log('Session data fields:', {
        welcomeMessage: !!sessionData.welcomeMessage,
        firstQuestion: !!sessionData.firstQuestion,
        questionId: !!sessionData.questionId,
        difficulty: !!sessionData.difficulty,
        sessionData: sessionData
      });
      
      // Add welcome message and first question
      const welcomeMessage = {
        id: Date.now(),
        type: 'ai_message',
        content: sessionData.welcomeMessage || 'Welcome to your AI interview!',
        timestamp: new Date(),
        isUser: false
      };
      
      const firstQuestion = {
        id: Date.now() + 1,
        type: 'ai_question',
        content: sessionData.firstQuestion || 'Please introduce yourself.',
        timestamp: new Date(),
        isUser: false
      };
      
      setMessages([welcomeMessage, firstQuestion]);
      
      // Set current question with proper validation
      if (!sessionData.firstQuestion) {
        console.warn('No firstQuestion in session data, using fallback');
      }
      if (!sessionData.questionId) {
        console.warn('No questionId in session data, generating fallback');
      }
      
      const currentQuestionData = {
        id: sessionData.questionId || `q_${Date.now()}`,
        text: sessionData.firstQuestion || 'Please introduce yourself.',
        difficulty: sessionData.difficulty || 'medium'
      };
      
      console.log('Setting currentQuestion to:', currentQuestionData);
      setCurrentQuestion(currentQuestionData);
      
      console.log('Session started - currentQuestion set to:', currentQuestionData);
      
      // Start timing for the first question
      setCurrentQuestionStartTime(Date.now());
      
      toast.success('AI Interview session started!');
    } catch (error) {
      console.error('Error starting session:', error);
      console.error('Error details:', error.response?.data);
      toast.error('Failed to start interview session');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Submit answer and get next question
  const submitAnswer = async () => {
    console.log('submitAnswer called');
    console.log('currentAnswer:', currentAnswer);
    console.log('currentQuestion:', currentQuestion);
    
    if (!currentAnswer?.trim()) {
      console.log('Early return - no answer text');
      toast.error('Please enter an answer before submitting');
      return;
    }
    
    // Temporary fix: if currentQuestion is null, create a fallback
    if (!currentQuestion) {
      console.log('No currentQuestion found, creating fallback...');
      const fallbackQuestion = {
        id: `fallback_${Date.now()}`,
        text: 'Please provide your response.',
        difficulty: 'medium'
      };
      setCurrentQuestion(fallbackQuestion);
      console.log('Set fallback currentQuestion:', fallbackQuestion);
    }
    
    const answerText = currentAnswer; // Store answer text before clearing
  // Use current question or fallback
  const questionToUse = currentQuestion || {
      id: `fallback_${Date.now()}`,
      text: 'Please provide your response.',
      difficulty: 'medium'
    };
    try {
      console.log('Starting answer submission...');
      setIsLoading(true);
      // Calculate time taken to answer this question
      const answerDuration = currentQuestionStartTime 
        ? Math.floor((Date.now() - currentQuestionStartTime) / 1000) 
        : null;
      // Store current Q&A pair
      const qaEntry = {
        questionId: questionToUse.id,
        questionText: questionToUse.text,
        answerText: currentAnswer,
        answerTimestamp: new Date(),
        duration: answerDuration,
        difficulty: questionToUse.difficulty
      };

      // Build conversationLog entry for backend
      const conversationLogEntry = {
        type: 'candidate_answer',
        content: answerText,
        questionId: questionToUse.id,
        timestamp: new Date().toISOString(),
        metadata: {
          duration: answerDuration,
          difficulty: questionToUse.difficulty
        }
      };

      console.log("submited Answers : ", qaEntry);
      setQuestionsAndAnswers(prev => [...prev, qaEntry]);
      // Add user answer to messages
      const userMessage = {
        id: Date.now(),
        type: 'candidate_answer',
        content: currentAnswer,
        timestamp: new Date(),
        isUser: true
      };
      setMessages(prev => [...prev, userMessage]);
      setCurrentAnswer('');
      // Submit answer and get next question
      console.log('Calling askNextQuestion API...');
      console.log('Payload:', { interviewId, conversationLogEntry });
      // Update API to send conversationLogEntry instead of just answerText
      const response = await aiInterviewAPI.askNextQuestion(interviewId, conversationLogEntry);
      console.log('Ask next question response:', response);
      console.log('Response data structure:', {
        hasQuestion: !!response.data?.question,
        questionId: response.data?.questionId,
        question: response.data?.question,
        difficulty: response.data?.difficulty,
        hasMoreQuestions: response.data?.hasMoreQuestions
      });
      
      console.log('Ask next question response:', response);
      console.log('Response data structure:', {
        hasQuestion: !!response.data?.question,
        questionId: response.data?.questionId,
        question: response.data?.question,
        difficulty: response.data?.difficulty,
        hasMoreQuestions: response.data?.hasMoreQuestions
      });
      
      // Add AI's next question - Fix: check response.data.question instead of response.data.nextQuestion
      if (response.data?.question) {
        const aiQuestion = {
          id: Date.now() + 1,
          type: 'ai_question',
          content: response.data.question,
          timestamp: new Date(),
          isUser: false
        };
        
        setMessages(prev => [...prev, aiQuestion]);
        setCurrentQuestion({
          id: response.data.questionId,
          text: response.data.question,
          difficulty: response.data.difficulty
        });
        
        console.log('Set new currentQuestion:', {
          id: response.data.questionId,
          text: response.data.question,
          difficulty: response.data.difficulty
        });
        
        // Start timing for the new question
        setCurrentQuestionStartTime(Date.now());
      } else if (response.data?.hasMoreQuestions === false || response.data?.suggestEnd) {
        // No more questions - interview is complete
        console.log('No more questions available, ending interview');
        setCurrentQuestion(null);
        setCurrentQuestionStartTime(null);
        toast.success('Interview completed! No more questions available.');
      } else {
        console.warn('Unexpected response structure:', response.data);
        // Keep current question as fallback
      }
      
      // Update insights
      if (response.data?.insights) {
        setInsights(response.data.insights);
      }
      
      console.log('Updated Q&A pairs:', qaEntry);
      
    } catch (error) {
      console.error('Error submitting answer:', error);
      console.error('Error response:', error.response?.data);
      console.error('Error status:', error.response?.status);
      console.error('Request payload:', { interviewId, answerText, responseTime: 30 });
      
      if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid request data';
        toast.error(`Submission failed: ${errorMessage}`);
      } else {
        toast.error('Failed to submit answer');
      }
    } finally {
      setIsLoading(false);
    }
  };
  
  // Handle key press
  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      submitAnswer();
    }
  };
  
  // End interview
  const endInterview = async () => {
    console.log('End Interview button clicked!');
    
    if (!window.confirm('Are you sure you want to end this interview?')) {
      console.log('User cancelled interview end');
      return;
    }
    
    console.log('User confirmed interview end, proceeding...');
    
    try {
      console.log('Starting interview end process...');
      
      // Store any current unanswered question as incomplete
      if (currentQuestion && currentAnswer.trim()) {
        console.log('Storing current incomplete answer...');
        const answerDuration = currentQuestionStartTime 
          ? Math.floor((Date.now() - currentQuestionStartTime) / 1000) 
          : null;
          
        const qaEntry = {
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          answerText: currentAnswer,
          answerTimestamp: new Date(),
          duration: answerDuration,
          difficulty: currentQuestion.difficulty,
          incomplete: true
        };
        
        setQuestionsAndAnswers(prev => [...prev, qaEntry]);
        console.log('Stored incomplete answer before ending:', qaEntry);
      }
      
      // Send all Q&A data to backend before ending interview
      if (questionsAndAnswers.length > 0) {
        console.log('Saving Q&A data before ending...');
        try {
          await aiInterviewAPI.saveQAData(interviewId, questionsAndAnswers);
          console.log('Successfully saved Q&A data:', questionsAndAnswers);
        } catch (qaError) {
          console.error('Error saving Q&A data:', qaError);
          // Continue with ending interview even if Q&A save fails
        }
      }
      
      console.log('Calling endAIInterview API...');
      const response = await aiInterviewAPI.endAIInterview(interviewId);
      console.log('End interview response:', response);
      
      toast.success('Interview ended successfully');
      console.log('Navigating to interviews page...');
      navigate('/interviews');
    } catch (error) {
      console.error('Error ending interview:', error);
      console.error('Error details:', error.response?.data);
      console.error('Error status:', error.response?.status);
      toast.error(`Failed to end interview: ${error.response?.data?.message || error.message}`);
    }
  };
  
  // Skip question
  const skipQuestion = async () => {
    try {
      setIsLoading(true);
      
      // Store the skipped question with empty answer
      if (currentQuestion) {
        const answerDuration = currentQuestionStartTime 
          ? Math.floor((Date.now() - currentQuestionStartTime) / 1000) 
          : null;
          
        const qaEntry = {
          questionId: currentQuestion.id,
          questionText: currentQuestion.text,
          answerText: '[QUESTION SKIPPED]',
          answerTimestamp: new Date(),
          duration: answerDuration,
          difficulty: currentQuestion.difficulty,
          skipped: true
        };
        
        setQuestionsAndAnswers(prev => [...prev, qaEntry]);
        console.log('Stored skipped question:', qaEntry);
      }
      
      const response = await aiInterviewAPI.skipQuestion(interviewId);
      
      console.log('Skip question response:', response);
      console.log('Skip response data:', response.data);
      
      // Handle skipQuestion API response structure (different from askNextQuestion)
      if (response.data?.nextQuestion) {
        const nextQuestion = response.data.nextQuestion;
        const aiQuestion = {
          id: Date.now(),
          type: 'ai_question',
          content: nextQuestion.question,
          timestamp: new Date(),
          isUser: false
        };
        
        setMessages(prev => [...prev, aiQuestion]);
        setCurrentQuestion({
          id: nextQuestion.questionId,
          text: nextQuestion.question,
          difficulty: nextQuestion.difficulty
        });
        
        console.log('Set new question after skip:', {
          id: nextQuestion.questionId,
          text: nextQuestion.question,
          difficulty: nextQuestion.difficulty
        });
        
        // Start timing for the new question
        setCurrentQuestionStartTime(Date.now());
      } else if (response.data?.hasMoreQuestions === false) {
        // No more questions - interview is complete
        console.log('No more questions after skip, ending interview');
        setCurrentQuestion(null);
        setCurrentQuestionStartTime(null);
        toast.success('Interview completed! No more questions available.');
      } else {
        console.warn('Unexpected skip response structure:', response.data);
      }
      
      toast.success('Question skipped');
    } catch (error) {
      console.error('Error skipping question:', error);
      toast.error('Failed to skip question');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Format timer
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Log Q&A summary for debugging
  const logQASummary = React.useCallback(() => {
    console.log('=== AI Interview Q&A Summary ===');
    console.log(`Total Q&A pairs: ${questionsAndAnswers.length}`);
    console.log(`Answered: ${questionsAndAnswers.filter(qa => !qa.skipped).length}`);
    console.log(`Skipped: ${questionsAndAnswers.filter(qa => qa.skipped).length}`);
    console.log(`Incomplete: ${questionsAndAnswers.filter(qa => qa.incomplete).length}`);
    
    questionsAndAnswers.forEach((qa, index) => {
      console.log(`\n${index + 1}. ${qa.questionText}`);
      console.log(`   Answer: ${qa.answerText}`);
      console.log(`   Duration: ${qa.duration}s, Difficulty: ${qa.difficulty}`);
      if (qa.skipped) console.log('   [SKIPPED]');
      if (qa.incomplete) console.log('   [INCOMPLETE]');
    });
  }, [questionsAndAnswers]);

  // Add keyboard shortcut to view Q&A summary
  useEffect(() => {
    const handleKeyPress = (event) => {
      if (event.ctrlKey && event.key === 'q') {
        event.preventDefault();
        logQASummary();
      }
    };

    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [logQASummary]);
  
  if (!interview) {
    return (
      <AIInterviewContainer>
        <MainPanel>
          <LoadingIndicator>Loading interview...</LoadingIndicator>
        </MainPanel>
      </AIInterviewContainer>
    );
  }
  
  return (
    <AIInterviewContainer>
      <MainPanel>
        <Header>
          <HeaderLeft>
            <AIAvatar>
              <Bot />
            </AIAvatar>
            <HeaderInfo>
              <h2>AI Interview</h2>
              <p>{interview.candidateId?.name || 'Candidate'} • {interview.position || 'Position'}</p>
            </HeaderInfo>
          </HeaderLeft>
          
          <HeaderRight>
            <StatusBadge>
              <Zap size={16} />
              {sessionStarted ? 'In Progress' : 'Ready to Start'}
            </StatusBadge>
            <TimerDisplay>{formatTime(sessionTime)}</TimerDisplay>
          </HeaderRight>
        </Header>
        
        <ChatContainer>
          <MessagesArea>
            {!sessionStarted ? (
              <div style={{ textAlign: 'center', padding: '3rem' }}>
                <Bot size={64} color="#4f46e5" style={{ marginBottom: '1rem' }} />
                <h3 style={{ color: '#374151', marginBottom: '1rem' }}>Ready to start your AI interview?</h3>
                <p style={{ color: '#6b7280', marginBottom: '2rem' }}>
                  This AI-powered interview will adapt to your responses and provide personalized questions.
                </p>
                <ActionButton 
                  $variant="primary" 
                  onClick={() => {
                    console.log('Start Interview button clicked!');
                    console.log('Current state:', { sessionStarted, isLoading, interviewId });
                    startSession();
                  }}
                  disabled={isLoading}
                  style={{ padding: '1rem 2rem', borderRadius: '2rem' }}
                >
                  {isLoading ? <LoadingIndicator /> : 'Start Interview'}
                </ActionButton>
              </div>
            ) : (
              <>
                {messages.map((message) => (
                  <Message key={message.id} $isUser={message.isUser}>
                    <MessageAvatar $isUser={message.isUser}>
                      {message.isUser ? user?.name?.[0] || 'U' : <Bot />}
                    </MessageAvatar>
                    <MessageBubble $isUser={message.isUser}>
                      {message.type === 'ai_question' ? (
                        <QuestionHighlight>
                          <div className="question-header">
                            <Brain size={20} />
                            AI Question
                          </div>
                          <div className="question-text">{message.content}</div>
                        </QuestionHighlight>
                      ) : (
                        message.content
                      )}
                    </MessageBubble>
                  </Message>
                ))}
                
                {isLoading && (
                  <Message $isUser={false}>
                    <MessageAvatar $isUser={false}>
                      <Bot />
                    </MessageAvatar>
                    <MessageBubble $isUser={false}>
                      <LoadingIndicator>AI is thinking...</LoadingIndicator>
                    </MessageBubble>
                  </Message>
                )}
                
                <div ref={messagesEndRef} />
              </>
            )}
          </MessagesArea>
          
          {sessionStarted && (
            <InputSection>
              <InputContainer>
                <InputField
                  value={currentAnswer}
                  onChange={(e) => setCurrentAnswer(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type your answer here... (Press Enter to send)"
                  disabled={isLoading}
                />
                
                <ControlsPanel>
                  {/* Debug button for testing */}
                  <ActionButton
                    style={{ background: '#10b981', marginRight: '0.5rem' }}
                    onClick={() => {
                      console.log('TEST BUTTON CLICKED!');
                      console.log('States:', {
                        currentAnswer,
                        currentQuestion,
                        sessionStarted,
                        isLoading,
                        interviewId
                      });
                    }}
                  >
                    TEST
                  </ActionButton>
                  
                  {/* Emergency question setter button */}
                  <ActionButton
                    style={{ background: '#f59e0b', marginRight: '0.5rem' }}
                    onClick={() => {
                      const emergencyQuestion = {
                        id: `emergency_${Date.now()}`,
                        text: 'Please tell me about yourself.',
                        difficulty: 'easy'
                      };
                      setCurrentQuestion(emergencyQuestion);
                      console.log('Emergency question set:', emergencyQuestion);
                      toast.success('Emergency question set! Try submitting now.');
                    }}
                  >
                    FIX
                  </ActionButton>
                  
                  <ActionButton
                    $variant="primary"
                    onClick={() => {
                      console.log('Submit button clicked!');
                      console.log('Button state checks:', {
                        'currentAnswer exists': !!currentAnswer,
                        'currentAnswer.trim()': currentAnswer?.trim(),
                        'currentAnswer.trim() length': currentAnswer?.trim()?.length,
                        'currentQuestion exists': !!currentQuestion,
                        'isLoading': isLoading,
                        'button disabled': !currentAnswer?.trim() || isLoading || !currentQuestion
                      });
                      
                      if (!currentAnswer?.trim()) {
                        console.log('BLOCKED: No answer text');
                        toast.error('Please enter an answer before submitting');
                        return;
                      }
                      
                      // Allow submission even if currentQuestion is null (we'll handle it in submitAnswer)
                      if (isLoading) {
                        console.log('BLOCKED: Currently loading');
                        return;
                      }
                      
                      console.log('All checks passed, calling submitAnswer...');
                      submitAnswer();
                    }}
                    disabled={!currentAnswer?.trim() || isLoading}
                  >
                    <Send />
                  </ActionButton>
                  
                  <ActionButton onClick={skipQuestion} disabled={isLoading}>
                    <SkipForward />
                  </ActionButton>
                  
                  <ActionButton 
                    onClick={() => {
                      console.log('End Interview button physically clicked!');
                      console.log('Current state for end interview:', {
                        sessionStarted,
                        interviewId,
                        questionsAndAnswers: questionsAndAnswers.length,
                        currentQuestion: !!currentQuestion
                      });
                      endInterview();
                    }}
                    style={{ 
                      background: '#ef4444',
                      '&:hover': {
                        background: '#dc2626'
                      }
                    }}
                    title="End Interview"
                  >
                    <Phone />
                  </ActionButton>
                </ControlsPanel>
              </InputContainer>
            </InputSection>
          )}
        </ChatContainer>
      </MainPanel>
      
      <SidePanel>
        <SidePanelHeader>
          <h3>Interview Insights</h3>
        </SidePanelHeader>
        
        <InsightsContainer>
          <InsightCard>
            <div className="title">
              <Clock size={16} />
              Session Duration
            </div>
            <div className="value">{formatTime(sessionTime)}</div>
          </InsightCard>
          
          <InsightCard>
            <div className="title">
              <MessageCircle size={16} />
              Questions Answered
            </div>
            <div className="value">{messages.filter(m => m.isUser).length}</div>
          </InsightCard>
          
          <InsightCard>
            <div className="title">
              <MessageCircle size={16} />
              Q&A Pairs Stored
            </div>
            <div className="value">
              {questionsAndAnswers.length}
              {questionsAndAnswers.filter(qa => qa.skipped).length > 0 && (
                <span style={{ fontSize: '0.7rem', color: '#f59e0b', marginLeft: '0.5rem' }}>
                  ({questionsAndAnswers.filter(qa => qa.skipped).length} skipped)
                </span>
              )}
            </div>
          </InsightCard>
          
          {questionsAndAnswers.length > 0 && (
            <InsightCard>
              <div className="title">
                <Clock size={16} />
                Avg Response Time
              </div>
              <div className="value">
                {Math.round(
                  questionsAndAnswers
                    .filter(qa => qa.duration && !qa.skipped)
                    .reduce((sum, qa) => sum + qa.duration, 0) / 
                  questionsAndAnswers.filter(qa => qa.duration && !qa.skipped).length
                ) || 0}s
              </div>
            </InsightCard>
          )}
          
          {insights && (
            <>
              <InsightCard>
                <div className="title">
                  <Brain size={16} />
                  Engagement Score
                </div>
                <div className="value">{insights.engagementScore || 'N/A'}</div>
              </InsightCard>
              
              <InsightCard>
                <div className="title">
                  <Zap size={16} />
                  Communication Style
                </div>
                <div className="value">{insights.communicationStyle || 'Analyzing...'}</div>
              </InsightCard>
            </>
          )}
        </InsightsContainer>
      </SidePanel>
    </AIInterviewContainer>
  );
};

export default AIInterviewRoom;