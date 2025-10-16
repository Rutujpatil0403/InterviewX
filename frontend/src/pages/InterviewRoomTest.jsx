// Test page for Interview Room functionality
import React from 'react';
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { 
  Video, 
  MessageSquare, 
  Users, 
  Calendar,
  Clock,
  Play
} from 'lucide-react';
import Button from '../components/Common/Button';
import Card from '../components/Common/Card';

const TestContainer = styled.div`
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
`;

const TestTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  margin-bottom: 1rem;
  text-align: center;
`;

const TestDescription = styled.p`
  font-size: 1.125rem;
  color: ${({ theme }) => theme.colors.gray?.[600] || '#4b5563'};
  text-align: center;
  margin-bottom: 3rem;
  line-height: 1.6;
`;

const FeatureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
  margin-bottom: 3rem;
`;

const FeatureCard = styled(Card)`
  padding: 2rem;
  text-align: center;
  border: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
  
  &:hover {
    box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
    transform: translateY(-2px);
    transition: all 0.3s ease;
  }
`;

const FeatureIcon = styled.div`
  width: 4rem;
  height: 4rem;
  background: ${({ theme }) => theme.colors.primary?.[100] || '#dbeafe'};
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  
  svg {
    width: 2rem;
    height: 2rem;
    color: ${({ theme }) => theme.colors.primary?.[600] || '#2563eb'};
  }
`;

const FeatureTitle = styled.h3`
  font-size: 1.25rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  margin-bottom: 0.5rem;
`;

const FeatureDescription = styled.p`
  color: ${({ theme }) => theme.colors.gray?.[600] || '#4b5563'};
  line-height: 1.5;
`;

const DemoSection = styled.div`
  background: ${({ theme }) => theme.colors.gray?.[50] || '#f9fafb'};
  border-radius: 1rem;
  padding: 2rem;
  text-align: center;
  margin-bottom: 2rem;
`;

const DemoTitle = styled.h2`
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  margin-bottom: 1rem;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
`;

const MockInterviewList = styled.div`
  display: grid;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const MockInterviewCard = styled.div`
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
  border-radius: 0.5rem;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const InterviewInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const InterviewDetails = styled.div``;

const InterviewTitle = styled.div`
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  margin-bottom: 0.25rem;
`;

const InterviewMeta = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray?.[500] || '#6b7280'};
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const StatusBadge = styled.span`
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${({ status }) => {
    switch(status) {
      case 'live':
        return 'background: #dc2626; color: white;';
      case 'scheduled':
        return 'background: #f59e0b; color: white;';
      case 'completed':
        return 'background: #10b981; color: white;';
      default:
        return 'background: #6b7280; color: white;';
    }
  }}
`;

const InterviewRoomTest = () => {
  const mockInterviews = [
    {
      id: 'demo-1',
      title: 'Frontend Developer Interview',
      candidate: 'John Doe',
      time: '2:00 PM - 3:00 PM',
      status: 'scheduled'
    },
    {
      id: 'demo-2',
      title: 'Senior React Developer',
      candidate: 'Jane Smith',
      time: '3:30 PM - 4:30 PM',
      status: 'live'
    },
    {
      id: 'demo-3',
      title: 'Full Stack Engineer',
      candidate: 'Mike Johnson',
      time: '1:00 PM - 2:00 PM',
      status: 'completed'
    }
  ];

  return (
    <TestContainer>
      <TestTitle>Interview Room System Test</TestTitle>
      <TestDescription>
        Test the complete video chat and interview room functionality with real-time 
        communication, screen sharing, chat, and interview management features.
      </TestDescription>

      <FeatureGrid>
        <FeatureCard>
          <FeatureIcon>
            <Video />
          </FeatureIcon>
          <FeatureTitle>Video Chat</FeatureTitle>
          <FeatureDescription>
            High-quality WebRTC video calling with camera/microphone controls, 
            screen sharing, and multiple layout options.
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>
            <MessageSquare />
          </FeatureIcon>
          <FeatureTitle>Real-time Chat</FeatureTitle>
          <FeatureDescription>
            Instant messaging with typing indicators, message history, 
            emoji reactions, and file attachments.
          </FeatureDescription>
        </FeatureCard>

        <FeatureCard>
          <FeatureIcon>
            <Users />
          </FeatureIcon>
          <FeatureTitle>Participant Management</FeatureTitle>
          <FeatureDescription>
            Manage interview participants, roles, permissions, and 
            real-time presence indicators.
          </FeatureDescription>
        </FeatureCard>
      </FeatureGrid>

      <DemoSection>
        <DemoTitle>Demo Interview Rooms</DemoTitle>
        <p style={{ marginBottom: '2rem', color: '#6b7280' }}>
          Click "Join Room" to test the interview room functionality with mock data.
        </p>

        <MockInterviewList>
          {mockInterviews.map((interview) => (
            <MockInterviewCard key={interview.id}>
              <InterviewInfo>
                <FeatureIcon style={{ width: '3rem', height: '3rem' }}>
                  <Calendar />
                </FeatureIcon>
                <InterviewDetails>
                  <InterviewTitle>{interview.title}</InterviewTitle>
                  <InterviewMeta>
                    <span>Candidate: {interview.candidate}</span>
                    <span><Clock size={14} /> {interview.time}</span>
                    <StatusBadge status={interview.status}>
                      {interview.status}
                    </StatusBadge>
                  </InterviewMeta>
                </InterviewDetails>
              </InterviewInfo>
              
              <Button
                as={Link}
                to={`/interview/${interview.id}`}
                variant="primary"
                size="sm"
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <Play size={16} />
                Join Room
              </Button>
            </MockInterviewCard>
          ))}
        </MockInterviewList>
      </DemoSection>

      <ButtonGroup>
        <Button as={Link} to="/interviews" variant="secondary">
          Back to Interviews
        </Button>
        <Button as={Link} to="/dashboard" variant="primary">
          Go to Dashboard
        </Button>
      </ButtonGroup>
    </TestContainer>
  );
};

export default InterviewRoomTest;