import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, FileText, BarChart3, ArrowLeft, Video, Edit, Settings, MessageCircle, Monitor } from 'lucide-react';
import styled from 'styled-components';
import { interviewAPI } from '../../services/interviewAPI';
import { toast } from 'react-hot-toast';

// Styled Components
const DetailContainer = styled.div`
  padding: 2rem;
  max-width: 1200px;
  margin: 0 auto;
  min-height: 100vh;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 2rem;
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: stretch;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const HeaderInfo = styled.div`
  h1 {
    font-size: 1.75rem;
    font-weight: 700;
    color: #1f2937;
    margin: 0 0 0.25rem 0;
    line-height: 1.3;
  }
  
  p {
    color: #6b7280;
    margin: 0;
    font-size: 1rem;
  }
`;

const HeaderRight = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  
  @media (max-width: 768px) {
    justify-content: flex-start;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid #f1f5f9;
  }
`;

const Button = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  border: 1px solid transparent;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  text-decoration: none;
  outline: none;
  white-space: nowrap;

  &:focus {
    outline: 2px solid #007fff;
    outline-offset: 2px;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  ${({ variant, size }) => {
    const sizeStyles = size === 'sm' ? `
      padding: 0.375rem 0.875rem;
      font-size: 0.75rem;
    ` : '';

    switch (variant) {
      case 'primary':
        return `
          ${sizeStyles}
          background: linear-gradient(135deg, #007fff 0%, #0066cc 100%);
          color: white;
          box-shadow: 0 2px 4px rgba(0, 127, 255, 0.2);
          &:hover:not(:disabled) {
            background: linear-gradient(135deg, #0066cc 0%, #0052a3 100%);
            transform: translateY(-1px);
            box-shadow: 0 4px 8px rgba(0, 127, 255, 0.3);
          }
        `;
      case 'secondary':
        return `
          ${sizeStyles}
          background: #f8fafc;
          color: #475569;
          border-color: #cbd5e1;
          &:hover:not(:disabled) {
            background: #f1f5f9;
            border-color: #94a3b8;
          }
        `;
      case 'outline':
        return `
          ${sizeStyles}
          background: transparent;
          color: #007fff;
          border-color: #007fff;
          &:hover:not(:disabled) {
            background: #f0f7ff;
          }
        `;
      case 'ghost':
        return `
          ${sizeStyles}
          background: transparent;
          color: #6b7280;
          border-color: transparent;
          &:hover:not(:disabled) {
            background: #f1f5f9;
            color: #374151;
          }
        `;
      default:
        return sizeStyles;
    }
  }}

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const Badge = styled.span`
  padding: 0.375rem 0.875rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  
  ${({ variant }) => {
    switch (variant) {
      case 'primary':
        return `
          background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
          color: #1e40af;
          border: 1px solid #93c5fd;
        `;
      case 'success':
        return `
          background: linear-gradient(135deg, #dcfce7 0%, #bbf7d0 100%);
          color: #166534;
          border: 1px solid #86efac;
        `;
      case 'warning':
        return `
          background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
          color: #92400e;
          border: 1px solid #fcd34d;
        `;
      case 'danger':
        return `
          background: linear-gradient(135deg, #fecaca 0%, #fca5a5 100%);
          color: #991b1b;
          border: 1px solid #f87171;
        `;
      default:
        return `
          background: linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%);
          color: #475569;
          border: 1px solid #cbd5e1;
        `;
    }
  }}
`;

const MainGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
    gap: 1.5rem;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Card = styled.div`
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  border: 1px solid #e2e8f0;
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    border-color: #cbd5e1;
  }
`;

const CardHeader = styled.div`
  padding: 1.5rem 1.5rem 0 1.5rem;
  border-bottom: 1px solid #f1f5f9;
  margin-bottom: 1.5rem;
  
  h3 {
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    margin: 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #6b7280;
  }
`;

const CardBody = styled.div`
  padding: 0 1.5rem 1.5rem 1.5rem;
`;

const DetailGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 1.5rem;
`;

const DetailItem = styled.div`
  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
`;

const DetailValue = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
  color: #1f2937;
  
  svg {
    width: 1rem;
    height: 1rem;
    color: #6b7280;
  }
  
  .candidate-info {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    
    .name {
      font-weight: 600;
      color: #1f2937;
    }
    
    .email {
      font-size: 0.875rem;
      color: #6b7280;
      font-weight: normal;
    }
  }
`;

const Description = styled.div`
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f1f5f9;
  
  label {
    display: block;
    font-size: 0.75rem;
    font-weight: 600;
    color: #6b7280;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: 0.5rem;
  }
  
  p {
    color: #6b7280;
    line-height: 1.6;
    margin: 0;
  }
`;

const QuestionSection = styled.div`
  margin-bottom: 1rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const QuestionCategory = styled.div`
  padding: 1.25rem;
  background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
  border-radius: 12px;
  border: 1px solid #e2e8f0;
  
  h4 {
    font-weight: 600;
    color: #1f2937;
    margin: 0 0 0.75rem 0;
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }
  
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
  }
  
  li {
    color: #6b7280;
    font-size: 0.875rem;
    line-height: 1.5;
    margin-bottom: 0.5rem;
    padding-left: 1rem;
    position: relative;
    
    &:before {
      content: '•';
      color: #007fff;
      font-weight: bold;
      position: absolute;
      left: 0;
    }
    
    &:last-child {
      margin-bottom: 0;
    }
  }
`;

const ActionButton = styled(Button)`
  width: 100%;
  justify-content: flex-start;
  margin-bottom: 0.75rem;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const SettingsGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const SettingItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem 0;
  border-bottom: 1px solid #f1f5f9;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  .label {
    color: #6b7280;
    font-size: 0.875rem;
  }
  
  .value {
    font-weight: 500;
    color: #1f2937;
    font-size: 0.875rem;
  }
  
  .enabled {
    color: #059669;
  }
  
  .disabled {
    color: #dc2626;
  }
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  
  &::after {
    content: '';
    width: 2rem;
    height: 2rem;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #007fff;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const ErrorState = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  min-height: 400px;
  gap: 1rem;
  text-align: center;
  
  h2 {
    font-size: 1.5rem;
    font-weight: 600;
    color: #dc2626;
    margin: 0;
  }
  
  p {
    color: #6b7280;
    margin: 0;
  }
`;

// Utility functions
const getStatusVariant = (status) => {
  switch (status?.toLowerCase()) {
    case "scheduled":
      return "primary";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "in progress":
    case "inprogress":
      return "warning";
    case "paused":
      return "warning";
    default:
      return "secondary";
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return 'Not scheduled';

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (error) {
    return 'Invalid date';
  }
};

const InterviewDetail = () => {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchInterview = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await interviewAPI.getInterviewById(interviewId);
        setInterview(data);

      } catch (err) {
        console.error('Error fetching interview:', err);
        setError(err.response?.data?.message || err.message || 'Failed to load interview');
        toast.error('Failed to load interview details');
      } finally {
        setLoading(false);
      }
    };

    if (interviewId) {
      fetchInterview();
    }
  }, [interviewId]);



  const handleStartVideoInterview = async () => {
    try {
      await interviewAPI.startInterview(interviewId);
      toast.success('Video Interview started successfully!');
      navigate(`/interviews/${interviewId}/room`);
    } catch (err) {
      console.error('Start video interview error:', err);
      toast.error('Failed to start video interview');
    }
  };

  const handleStartAIInterview = async () => {
    try {
      // Import AI API
      const { aiInterviewAPI } = await import('../../services/aiAPI');

      // Start AI interview session
      await aiInterviewAPI.startAIInterview(interviewId);
      toast.success('AI Interview session started successfully!');

      // Navigate to AI interview room
      navigate(`/interviews/${interviewId}/ai-room`);
    } catch (err) {
      console.error('Start AI Interview error:', err);
      toast.error('Failed to start AI interview');
    }
  };

  const handleBackToInterviews = () => {
    navigate('/interviews');
  };

  if (loading) {
    return (
      <DetailContainer>
        <LoadingSpinner />
      </DetailContainer>
    );
  }

  if (error || !interview) {
    return (
      <DetailContainer>
        <ErrorState>
          <h2>Interview Not Found</h2>
          <p>{error || 'The interview you are looking for does not exist.'}</p>
          <Button variant="primary" onClick={handleBackToInterviews}>
            <ArrowLeft />
            Back to Interviews
          </Button>
        </ErrorState>
      </DetailContainer>
    );
  }

  // Detect if this is an AI interview - AI interviews always have templateId
  const isAIInterview = !!interview.templateId;

  return (

    <DetailContainer>
      <Header>
        <HeaderLeft>
          <Button variant="ghost" size="sm" onClick={handleBackToInterviews}>
            <ArrowLeft />
            Back to Interviews
          </Button>
          <HeaderInfo>
            <h1>
              Interview with {interview.candidateId?.name || interview.candidateName || 'Unknown Candidate'}
            </h1>
            <p>{interview.position || interview.jobTitle || 'Position not specified'}</p>
          </HeaderInfo>
        </HeaderLeft>

        <HeaderRight>
          <Badge variant={getStatusVariant(interview.status)}>
            {interview.status}
          </Badge>
          {(interview.status === 'Scheduled' || interview.status === 'scheduled') && (
            <>
              {isAIInterview ? (
                <Button variant="primary" onClick={handleStartAIInterview}>
                  <Video />
                  Start AI Interview
                </Button>
              ) : (
                <>
                  <Button variant="primary" onClick={handleStartVideoInterview}>
                    <Video />
                    Start Video Interview
                  </Button>

                </>
              )}
            </>
          )}
        </HeaderRight>
      </Header>

      <MainGrid>
        {/* Main Content */}
        <MainContent>
          <Card>
            <CardHeader>
              <h3>
                <FileText />
                Interview Details
              </h3>
            </CardHeader>
            <CardBody>
              <DetailGrid>
                <DetailItem>
                  <label>Candidate</label>
                  <DetailValue>
                    <User />
                    <div className="candidate-info">
                      <span className="name">
                        {interview.candidateId?.name || interview.candidateName || 'Unknown Candidate'}
                      </span>
                      <span className="email">
                        {interview.candidateId?.email || interview.candidateEmail || 'No email provided'}
                      </span>
                    </div>
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <label>Position</label>
                  <DetailValue>
                    {interview.position || interview.jobTitle || 'Position not specified'}
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <label>Scheduled Date & Time</label>
                  <DetailValue>
                    <Calendar />
                    <span>{formatDateTime(interview.interviewDate || interview.scheduledAt)}</span>
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <label>Duration</label>
                  <DetailValue>
                    <Clock />
                    <span>{interview.duration || interview.aiSession?.estimatedDuration || 60} minutes</span>
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <label>Interviewer</label>
                  <DetailValue>
                    <User />
                    <span>{interview.recruiterId?.name || interview.interviewer || 'Not assigned'}</span>
                  </DetailValue>
                </DetailItem>

                <DetailItem>
                  <label>Template</label>
                  <DetailValue>
                    <FileText />
                    <span>{interview.templateId?.title || interview.template || 'No template'}</span>
                  </DetailValue>
                </DetailItem>
              </DetailGrid>

              {interview.notes && (
                <Description>
                  <label>Description</label>
                  <p>{interview.notes}</p>
                </Description>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3>
                <MessageCircle />
                Interview Questions
              </h3>
            </CardHeader>
            <CardBody>
              <QuestionSection>
                <QuestionCategory>
                  <h4>Technical Questions</h4>
                  <ul>
                    <li>Explain the difference between let, const, and var in JavaScript</li>
                    <li>How would you optimize a React application's performance?</li>
                    <li>Describe your approach to responsive web design</li>
                    <li>What are the key principles of clean code?</li>
                  </ul>
                </QuestionCategory>
              </QuestionSection>

              <QuestionSection>
                <QuestionCategory>
                  <h4>Behavioral Questions</h4>
                  <ul>
                    <li>Tell me about a challenging project you worked on</li>
                    <li>How do you handle tight deadlines?</li>
                    <li>Describe a time when you had to learn a new technology quickly</li>
                    <li>How do you approach problem-solving in a team environment?</li>
                  </ul>
                </QuestionCategory>
              </QuestionSection>
            </CardBody>
          </Card>
        </MainContent>

        {/* Sidebar */}
        <Sidebar>
          <Card>
            <CardHeader>
              <h3>
                <Settings />
                Quick Actions
              </h3>
            </CardHeader>
            <CardBody>
              {(interview.status === 'Scheduled' || interview.status === 'scheduled') && (
                <>
                  {isAIInterview ? (
                    <ActionButton variant="primary" onClick={handleStartAIInterview}>
                      <Video />
                      Start AI Interview
                    </ActionButton>
                  ) : (
                    <>
                      <ActionButton variant="primary" onClick={handleStartVideoInterview}>
                        <Video />
                        Start Video Interview
                      </ActionButton>

                    </>
                  )}
                </>
              )}
              <ActionButton variant="secondary">
                <FileText />
                View Template
              </ActionButton>
              <ActionButton variant="secondary">
                <User />
                Candidate Profile
              </ActionButton>
              <ActionButton variant="secondary">
                <BarChart3 />
                Previous Results
              </ActionButton>
              <ActionButton variant="outline">
                <Edit />
                Edit Interview
              </ActionButton>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3>
                <Monitor />
                Interview Settings
              </h3>
            </CardHeader>
            <CardBody>
              <SettingsGrid>
                <SettingItem>
                  <span className="label">Recording</span>
                  <span className="value enabled">Enabled</span>
                </SettingItem>
                <SettingItem>
                  <span className="label">AI Analysis</span>
                  <span className="value enabled">Enabled</span>
                </SettingItem>
                <SettingItem>
                  <span className="label">Screen Sharing</span>
                  <span className="value enabled">Allowed</span>
                </SettingItem>
                <SettingItem>
                  <span className="label">Chat</span>
                  <span className="value enabled">Enabled</span>
                </SettingItem>
                <SettingItem>
                  <span className="label">Auto-Save</span>
                  <span className="value enabled">Every 30s</span>
                </SettingItem>
              </SettingsGrid>
            </CardBody>
          </Card>
        </Sidebar>
      </MainGrid>
    </DetailContainer>
  );
};

export default InterviewDetail;