// src/components/Interview/InterviewRoom.jsx - Complete Interview Room Component

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import {
  Users,
  MessageSquare,
  FileText,
  Settings,
  Clock,
  Circle,
  Square,
  Play,
  Pause,
  Volume2,
  Wifi,
  WifiOff,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Minimize2,
  X
} from 'lucide-react';

import VideoChat from '../../components/Video/Video';
import VideoErrorBoundary from '../../components/Video/VideoErrorBoundary';
import ChatComponent from '../../components/Chat/ChatComponent';
import Button from '../../components/Common/Button';
import { useAuth } from '../../hooks/useAuth';
import LoadingSpinner from '../../components/Common/LoadingSpinner';
import { interviewAPI } from '../../services/interviewAPI';

const RoomContainer = styled.div`
  height: 100vh;
  background: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const RoomHeader = styled.header`
  background: ${({ theme }) => theme.colors.gray?.[800] || '#1f2937'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray?.[700] || '#374151'};
  padding: 0.75rem 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 60px;
`;

const RoomInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  color: white;
`;

const RoomTitle = styled.h1`
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0;
`;

const RoomSubtitle = styled.div`
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray?.[400] || '#9ca3af'};
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${({ $status }) => {
    switch ($status) {
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
  
  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

const RoomActions = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const HeaderButton = styled(Button)`
  padding: 0.5rem;
  min-width: auto;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: white;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
  }
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const Timer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: ${({ $isRecording }) => $isRecording ? '#dc2626' : '#e5e7eb'};
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr ${({ $sidebarOpen, $sidebarWidth }) =>
    $sidebarOpen ? `${$sidebarWidth}px` : '0px'};
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: ${({ $sidebarOpen }) =>
    $sidebarOpen ? '1fr 300px' : '1fr 0px'};
  }
`;

const VideoSection = styled.section`
  position: relative;
  background: ${({ theme }) => theme.colors.gray?.[800] || '#1f2937'};
  display: flex;
  flex-direction: column;
`;

const Sidebar = styled.aside`
  background: ${({ theme }) => theme.colors.white || '#ffffff'};
  border-left: 1px solid ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${({ $isOpen }) => !$isOpen && `
    width: 0;
    border-left: none;
  `}
  
  @media (max-width: 768px) {
    border-left: none;
    border-top: 1px solid ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  }
`;

const SidebarTabs = styled.div`
  display: flex;
  background: ${({ theme }) => theme.colors.gray?.[50] || '#f9fafb'};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray?.[200] || '#e5e7eb'};
`;

const SidebarTab = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $active, theme }) => $active ? `
    background: white;
    color: ${theme.colors.primary?.[600] || '#2563eb'};
    border-bottom: 2px solid ${theme.colors.primary?.[600] || '#2563eb'};
  ` : `
    color: ${theme.colors.gray?.[600] || '#4b5563'};
    &:hover {
      background: ${theme.colors.gray?.[100] || '#f3f4f6'};
      color: ${theme.colors.gray?.[900] || '#111827'};
    }
  `}
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const SidebarContent = styled.div`
  flex: 1;
  overflow: hidden;
`;

const SidebarToggle = styled.button`
  position: absolute;
  top: 50%;
  right: ${({ $sidebarOpen }) => $sidebarOpen ? '0' : '-20px'};
  transform: translateY(-50%);
  width: 20px;
  height: 60px;
  background: ${({ theme }) => theme.colors.white || '#ffffff'};
  border: 1px solid ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  border-right: none;
  border-radius: 10px 0 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray?.[50] || '#f9fafb'};
  }
  
  svg {
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.colors.gray?.[600] || '#4b5563'};
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const ConnectionAlert = styled.div`
  position: absolute;
  top: 1rem;
  left: 50%;
  transform: translateX(-50%);
  background: ${({ $type }) => {
    switch ($type) {
      case 'error': return '#dc2626';
      case 'warning': return '#f59e0b';
      case 'success': return '#10b981';
      default: return '#6b7280';
    }
  }};
  color: white;
  padding: 0.75rem 1rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 20;
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const LoadingContainer = styled.div`
  height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  color: white;
  text-align: center;
  gap: 1rem;
`;

const NotesPanel = styled.div`
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
`;

const NotesTitle = styled.h3`
  margin: 0 0 1rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
`;

const NotesTextarea = styled.textarea`
  width: 100%;
  height: calc(100% - 3rem);
  border: 1px solid ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  border-radius: 0.5rem;
  padding: 1rem;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: none;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary?.[500] || '#3b82f6'};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary?.[100] || '#dbeafe'};
  }
`;

const ParticipantsPanel = styled.div`
  padding: 1rem;
  height: 100%;
  overflow-y: auto;
`;

const ParticipantsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const ParticipantItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.5rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.gray?.[50] || '#f9fafb'};
`;

const ParticipantAvatar = styled.div`
  width: 2rem;
  height: 2rem;
  border-radius: 50%;
  background: ${({ $color }) => $color || '#3b82f6'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 0.75rem;
`;

const ParticipantInfo = styled.div`
  flex: 1;
`;

const ParticipantName = styled.div`
  font-weight: 500;
  font-size: 0.875rem;
  color: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
`;

const ParticipantRole = styled.div`
  font-size: 0.75rem;
  color: ${({ theme }) => theme.colors.gray?.[500] || '#6b7280'};
`;

const ParticipantStatus = styled.div`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $status }) => {
    switch ($status) {
      case 'online': return '#10b981';
      case 'away': return '#f59e0b';
      case 'busy': return '#ef4444';
      default: return '#6b7280';
    }
  }};
`;

const InterviewRoom = () => {
  const { id: interviewId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Room state
  const [interview, setInterview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [error, setError] = useState(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(350);
  const [activeTab, setActiveTab] = useState('chat');
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [notes, setNotes] = useState('');
  const [messageCount, setMessageCount] = useState(0);
  const [participants, setParticipants] = useState([
    {
      id: user?.id,
      name: user?.name,
      role: user?.role || 'Participant',
      status: 'online',
      avatar: user?.profilePicture
    }
  ]);

  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  const retryVideoRef = useRef(null);

  // Load interview data
  useEffect(() => {
    loadInterviewData();
  }, [interviewId]);

  // Timer effect
  useEffect(() => {
    if (isRecording) {
      startTimeRef.current = Date.now() - duration * 1000;
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isRecording, duration]);

  const loadInterviewData = async () => {
    try {
      const data = await interviewAPI.getInterviewById(interviewId);
      setInterview(data);
      setLoading(false);

      // Set initial participants based on interview data
      if (data) {
        const interviewParticipants = [
          {
            id: user?.id,
            name: user?.name,
            role: user?.role || 'Host',
            status: 'online',
            avatar: user?.profilePicture
          }
        ];

        // Add candidate if available
        if (data.candidateId) {
          interviewParticipants.push({
            id: data.candidateId._id || data.candidateId,
            name: data.candidateName || data.candidateId.name || 'Candidate',
            role: 'Candidate',
            status: 'offline',
            avatar: data.candidateId.profilePicture
          });
        }

        setParticipants(interviewParticipants);
      }
    } catch (error) {
      console.error('Error loading interview:', error);
      setError(error.message);
      setLoading(false);
    }
  };

  const handleConnectionChange = (status) => {
    setConnectionStatus(status);
  };

  const handleVideoError = (error) => {
    console.error('Video error in interview room:', error);

    const errorMessage = error.userMessage || error.message || 'Unknown video error occurred';
    setError(errorMessage);

    // Auto-clear error after 10 seconds for non-critical errors
    if (!error.userMessage?.includes('denied') && !error.userMessage?.includes('not found')) {
      setTimeout(() => {
        setError(null);
      }, 10000);
    }
  };

  const handleRetryReady = (retryFunction) => {
    retryVideoRef.current = retryFunction;
  };

  const handleRetryVideo = () => {
    if (retryVideoRef.current) {
      retryVideoRef.current();
      setError(null);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      setDuration(0);
    }
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndInterview = async () => {
    if (window.confirm('Are you sure you want to end the interview?')) {
      await interviewAPI.endInterview(interviewId)  
      navigate(`/interviews/${interviewId}`);
    }
  };

  const getStatusInfo = () => {
    if (!interview) return { status: 'loading', text: 'Loading...', icon: Clock };

    const now = new Date();
    const startTime = new Date(interview.scheduledAt || interview.interviewDate);
    const endTime = new Date(startTime.getTime() + (interview.duration || 60) * 60000);

    if (interview.status === 'In Progress') {
      return { status: 'live', text: 'Live', icon: Circle };
    } else if (interview.status === 'Completed') {
      return { status: 'completed', text: 'Completed', icon: Square };
    } else if (now < startTime) {
      return { status: 'scheduled', text: 'Scheduled', icon: Clock };
    } else {
      return { status: 'live', text: 'Live', icon: Circle };
    }
  };

  const getUserColor = (userId) => {
    const colors = [
      '#3b82f6', '#ef4444', '#10b981', '#f59e0b',
      '#8b5cf6', '#06b6d4', '#f97316', '#84cc16'
    ];
    const index = userId?.charCodeAt?.(0) % colors.length || 0;
    return colors[index];
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  if (loading) {
    return (
      <LoadingContainer>
        <LoadingSpinner size="large" />
        <div>Loading interview room...</div>
      </LoadingContainer>
    );
  }

  if (error && !interview) {
    return (
      <LoadingContainer>
        <AlertCircle size={48} />
        <div>Error: {error}</div>
        <Button onClick={() => navigate('/interviews')}>
          Back to Interviews
        </Button>
      </LoadingContainer>
    );
  }

  const statusInfo = getStatusInfo();

  return (
    <RoomContainer>
      <RoomHeader>
        <RoomInfo>
          <div>
            <RoomTitle>{interview?.title || 'Interview Room'}</RoomTitle>
            <RoomSubtitle>
              <StatusIndicator $status={statusInfo.status}>
                <statusInfo.icon />
                {statusInfo.text}
              </StatusIndicator>
              {interview?.candidateName && `with ${interview.candidateName}`}
            </RoomSubtitle>
          </div>
        </RoomInfo>

        <RoomActions>
          <Timer $isRecording={isRecording}>
            <Clock />
            {formatDuration(duration)}
          </Timer>

          <HeaderButton
            onClick={toggleRecording}
            $variant={isRecording ? 'danger' : 'secondary'}
            title={isRecording ? 'Stop Recording' : 'Start Recording'}
          >
            {isRecording ? <Square /> : <Circle />}
          </HeaderButton>

          <HeaderButton title="Settings">
            <Settings />
          </HeaderButton>

          <HeaderButton
            onClick={handleEndInterview}
            $variant="danger"
            title="End Interview"
          >
            <X />
          </HeaderButton>
        </RoomActions>
      </RoomHeader>

      {error && (
        <ConnectionAlert $type="error">
          <AlertCircle />
          <div style={{ flex: 1 }}>{error}</div>
          {(error.includes('permissions') || error.includes('denied') || error.includes('another application')) && (
            <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '1rem' }}>
              <Button
                size="small"
                variant="secondary"
                onClick={handleRetryVideo}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              >
                Try Again
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => window.location.reload()}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              >
                Refresh Page
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => setError(null)}
                style={{
                  background: 'rgba(255, 255, 255, 0.2)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  color: 'white',
                  fontSize: '0.75rem'
                }}
              >
                Dismiss
              </Button>
            </div>
          )}
        </ConnectionAlert>
      )}

      {connectionStatus === 'connecting' && (
        <ConnectionAlert $type="warning">
          <Wifi />
          Connecting to video call...
        </ConnectionAlert>
      )}

      {connectionStatus === 'disconnected' && (
        <ConnectionAlert $type="error">
          <WifiOff />
          Video call disconnected
        </ConnectionAlert>
      )}

      <MainContent $sidebarOpen={sidebarOpen} $sidebarWidth={sidebarWidth}>
        <VideoSection>
          <VideoErrorBoundary
            onError={handleVideoError}
            onRetry={() => window.location.reload()}
          >
            <VideoChat
              roomId={interviewId}
              userId={user._id}
              userName={user.name}
              isHost={user.role === 'Recruiter' || user.role === 'Admin'}
              onConnectionChange={handleConnectionChange}
              onError={handleVideoError}
              onRetryReady={handleRetryReady}
            />
          </VideoErrorBoundary>

          <SidebarToggle
            $sidebarOpen={sidebarOpen}
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            {sidebarOpen ? <ChevronRight /> : <ChevronLeft />}
          </SidebarToggle>
        </VideoSection>

        <Sidebar $isOpen={sidebarOpen}>
          <SidebarTabs>
            <SidebarTab
              $active={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
            >
              <MessageSquare />
              Chat {messageCount > 0 && `(${messageCount})`}
            </SidebarTab>
            <SidebarTab
              $active={activeTab === 'notes'}
              onClick={() => setActiveTab('notes')}
            >
              <FileText />
              Notes
            </SidebarTab>
            <SidebarTab
              $active={activeTab === 'participants'}
              onClick={() => setActiveTab('participants')}
            >
              <Users />
              People ({participants.length})
            </SidebarTab>
          </SidebarTabs>

          <SidebarContent>
            {/* {activeTab === 'chat' && (
              <ChatComponent 
                roomId={interviewId}
                onMessageCount={setMessageCount}
                height="100%"
              />
            )} */}

            {activeTab === 'notes' && (
              <NotesPanel>
                <NotesTitle>Interview Notes</NotesTitle>
                <NotesTextarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Take notes during the interview..."
                />
              </NotesPanel>
            )}

            {activeTab === 'participants' && (
              <ParticipantsPanel>
                <NotesTitle>Participants</NotesTitle>
                <ParticipantsList>
                  {participants.map((participant) => (
                    <ParticipantItem key={participant.id}>
                      <ParticipantAvatar $color={getUserColor(participant.id)}>
                        {participant.avatar ? (
                          <img src={participant.avatar} alt={participant.name} style={{
                            width: '100%',
                            height: '100%',
                            borderRadius: '50%',
                            objectFit: 'cover'
                          }} />
                        ) : (
                          getInitials(participant.name)
                        )}
                      </ParticipantAvatar>
                      <ParticipantInfo>
                        <ParticipantName>{participant.name}</ParticipantName>
                        <ParticipantRole>{participant.role}</ParticipantRole>
                      </ParticipantInfo>
                      <ParticipantStatus $status={participant.status} />
                    </ParticipantItem>
                  ))}
                </ParticipantsList>
              </ParticipantsPanel>
            )}
          </SidebarContent>
        </Sidebar>
      </MainContent>
    </RoomContainer>
  );
};

export default InterviewRoom;