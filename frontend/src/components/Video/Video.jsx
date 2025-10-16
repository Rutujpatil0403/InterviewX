import React, { useCallback, useEffect, useState, useRef } from 'react';
import styled from 'styled-components';
import { useSocket } from '../../context/Socket';
import { usePeer } from '../../context/Peers';

// ==============================================================================================
// STYLED COMPONENTS
// ==============================================================================================

const VideoContainer = styled.div`
  position: relative;
  width: 100%;
  height: 100%;
  max-height: 100vh;
  background: #111827;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-sizing: border-box;
`;

const VideoGrid = styled.div`
  position: relative;
  flex: 1;
  display: grid;
  grid-template-columns: ${({ $layout }) => {
    switch($layout) {
      case 'speaker': return '1fr';
      case 'sidebar': return '1fr 300px';
      case 'grid': return '1fr 1fr';
      default: return '1fr';
    }
  }};
  gap: 8px;
  padding: 8px;
  min-height: 0;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: 1fr auto;
  }
`;

const VideoStreamContainer = styled.div`
  position: relative;
  background: #1f2937;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  max-height: 100%;
  
  ${({ $isLocal, $layout }) => $isLocal && $layout === 'sidebar' && `
    order: 2;
    max-height: 200px;
  `}
  
  ${({ $isLocal, $layout }) => $isLocal && $layout === 'speaker' && `
    position: absolute;
    top: 16px;
    right: 16px;
    width: 200px;
    height: 150px;
    z-index: 10;
    border: 2px solid #ffffff;
  `}
`;

const VideoStream = styled.video`
  width: 100%;
  height: 100%;
  object-fit: cover;
  background: #374151;
  
  ${({ $mirrored }) => $mirrored && 'transform: scaleX(-1);'}
`;

const VideoOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(
    180deg,
    rgba(0, 0, 0, 0.3) 0%,
    transparent 30%,
    transparent 70%,
    rgba(0, 0, 0, 0.4) 100%
  );
  pointer-events: none;
  opacity: 0;
  transition: opacity 0.3s ease;
  
  ${VideoStreamContainer}:hover & {
    opacity: 1;
  }
`;

const VideoPlaceholder = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #9ca3af;
  
  svg {
    width: 48px;
    height: 48px;
    margin-bottom: 8px;
  }
  
  div {
    font-size: 0.875rem;
    font-weight: 500;
  }
`;

const UserLabel = styled.div`
  position: absolute;
  bottom: 12px;
  left: 12px;
  background: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 6px;
`;

const ConnectionStatus = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  z-index: 20;
  background: ${({ $status }) => {
    switch($status) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'disconnected': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  color: white;
  padding: 6px 16px;
  border-radius: 16px;
  font-size: 0.75rem;
  font-weight: 600;
`;

const ControlsBar = styled.div`
  position: absolute;
  bottom: 24px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 12px;
  background: rgba(0, 0, 0, 0.8);
  padding: 12px 20px;
  border-radius: 24px;
  backdrop-filter: blur(8px);
  
  @media (max-width: 768px) {
    bottom: 12px;
    gap: 8px;
    padding: 10px 16px;
  }
`;

const ControlButton = styled.button`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  background: ${({ $variant, $active }) => {
    if ($variant === 'danger') return '#dc2626';
    if ($active) return '#2563eb';
    return '#4b5563';
  }};
  color: white;
  
  &:hover {
    transform: scale(1.05);
    background: ${({ $variant, $active }) => {
      if ($variant === 'danger') return '#b91c1c';
      if ($active) return '#1d4ed8';
      return '#374151';
    }};
  }
  
  svg {
    width: 20px;
    height: 20px;
  }
`;

// Simple icon components
const MicIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
  </svg>
);

const MicOffIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
  </svg>
);

const VideoIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const VideoOffIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
  </svg>
);

const PhoneOffIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
  </svg>
);

// ==============================================================================================
// MAIN COMPONENT
// ==============================================================================================

const VideoChat = ({ roomId, userId, userName }) => {
  const { socket } = useSocket();
  const { peer, createOffer, createAnswer, setRemoteAns } = usePeer();
  
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [layout] = useState('speaker');
  
  // UI State
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  
  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteUserIdRef = useRef(null); // Store remote user ID for ICE candidates
  const isProcessingCall = useRef(false); // Prevent duplicate call processing

  // Initialize local media stream
  useEffect(() => {
    const initMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: { echoCancellation: true, noiseSuppression: true }
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Add tracks to peer
        if (peer) {
          stream.getTracks().forEach(track => {
            peer.addTrack(track, stream);
          });
        }
      } catch (error) {
        console.error('Error accessing media:', error);
      }
    };

    initMedia();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [peer, localStream]);

  // Handle remote stream
  useEffect(() => {
    if (!peer) return;

    const handleTrack = (event) => {
      console.log('Received remote track');
      setRemoteStream(event.streams[0]);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    const handleConnectionStateChange = () => {
      console.log('Connection state:', peer.connectionState);
      setConnectionStatus(peer.connectionState === 'connected' ? 'connected' : 'connecting');
    };

    const handleIceCandidate = (event) => {
      if (event.candidate && socket) {
        console.log('Sending ICE candidate');
        // We need to determine the target user ID
        // This requires storing the remote user ID when call is initiated
        const targetUserId = remoteUserIdRef.current;
        if (targetUserId) {
          socket.emit('ice-candidate', {
            toUserId: targetUserId,
            candidate: event.candidate
          });
        }
      }
    };

    peer.addEventListener('track', handleTrack);
    peer.addEventListener('connectionstatechange', handleConnectionStateChange);
    peer.addEventListener('icecandidate', handleIceCandidate);

    return () => {
      peer.removeEventListener('track', handleTrack);
      peer.removeEventListener('connectionstatechange', handleConnectionStateChange);
      peer.removeEventListener('icecandidate', handleIceCandidate);
    };
  }, [peer, socket]);

  // Socket event handlers
  const handleJoinedRoom = useCallback((data) => {
    console.log(`Joined room: ${data.roomId}`);
    setConnectionStatus('connecting');
  }, []);

  const handleNewUserJoined = useCallback(async (data) => {
    const { userId: newUserId, userName: newUserName } = data;
    console.log(`New user joined: ${newUserName}`);
    
    // Store remote user ID for ICE candidates
    remoteUserIdRef.current = newUserId;
    
    try {
      const offer = await createOffer();
      socket.emit('call-user', { toUserId: newUserId, offer });
    } catch (error) {
      console.error('Error creating offer:', error);
    }
  }, [createOffer, socket]);

  const handleIncomingCall = useCallback(async (data) => {
    const { fromUserId, fromUsername, offer } = data;
    console.log(`Incoming call from ${fromUsername}`);
    
    // Store remote user ID for ICE candidates
    remoteUserIdRef.current = fromUserId;
    
    // Prevent duplicate handling
    if (isProcessingCall.current) {
      console.log('Already processing a call, ignoring duplicate');
      return;
    }
    
    if (peer.signalingState !== 'stable' && peer.signalingState !== 'have-remote-offer') {
      console.log(`Cannot process call, current state: ${peer.signalingState}`);
      return;
    }
    
    isProcessingCall.current = true;
    
    try {
      const answer = await createAnswer(offer);
      if (answer) {
        socket.emit('call-answer', { toUserId: fromUserId, answer });
      }
    } catch (error) {
      console.error('Error creating answer:', error);
    } finally {
      // Reset after a short delay to allow for state changes
      setTimeout(() => {
        isProcessingCall.current = false;
      }, 1000);
    }
  }, [createAnswer, socket, peer]);

  const handleCallAnswered = useCallback(async (data) => {
    const { fromUsername, answer } = data;
    console.log(`Call answered by ${fromUsername}`);
    
    try {
      await setRemoteAns(answer);
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error setting remote answer:', error);
    }
  }, [setRemoteAns]);

  const handleIceCandidate = useCallback(async (data) => {
    const { candidate } = data;
    
    try {
      if (peer && candidate) {
        await peer.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
    }
  }, [peer]);

  const handleUserDisconnected = useCallback((data) => {
    console.log(`User disconnected: ${data.userName}`);
    setRemoteStream(null);
    setConnectionStatus('disconnected');
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    
    console.log(`Joining room - UserId: ${userId}, RoomId: ${roomId}, UserName: ${userName}`);
    
    socket.emit('join-room', { roomId, userId, userName });

    socket.on('joined-room', handleJoinedRoom);
    socket.on('User-joined', handleNewUserJoined);
    socket.on('incoming-call', handleIncomingCall);
    socket.on('call-answered', handleCallAnswered);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('user-disconnected', handleUserDisconnected);

    return () => {
      socket.off('joined-room', handleJoinedRoom);
      socket.off('User-joined', handleNewUserJoined);
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-answered', handleCallAnswered);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('user-disconnected', handleUserDisconnected);
    };
  }, [socket, roomId, userId, userName, handleJoinedRoom, handleNewUserJoined, handleIncomingCall, handleCallAnswered, handleIceCandidate, handleUserDisconnected]);

  // Control handlers
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  }, [localStream]);

  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  }, [localStream]);

  const endCall = useCallback(() => {
    // Stop local media tracks (mic and camera)
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
    }
    
    // Close peer connection
    if (peer) {
      peer.close();
    }
    
    // Leave the room via socket
    if (socket && roomId) {
      socket.emit('leave-room', { roomId });
    }
    
    // Clear streams and reset UI state
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus('disconnected');
    setIsAudioEnabled(false);
    setIsVideoEnabled(false);
    
    console.log('✅ Call ended - All media tracks stopped');
    
    // Navigate away after cleanup
    setTimeout(() => {
      window.location.href = '/';
    }, 500);
  }, [localStream, peer, socket, roomId]);

  return (
    <VideoContainer>
      <ConnectionStatus $status={connectionStatus}>
        {connectionStatus === 'connected' ? 'Connected' : 
         connectionStatus === 'connecting' ? 'Connecting...' : 
         'Disconnected'}
      </ConnectionStatus>
      
      <VideoGrid $layout={layout}>
        {/* Local Video */}
        <VideoStreamContainer $isLocal $layout={layout}>
          {localStream && isVideoEnabled ? (
            <VideoStream
              ref={localVideoRef}
              autoPlay
              muted
              playsInline
              $mirrored={true}
            />
          ) : (
            <VideoPlaceholder>
              <VideoOffIcon />
              <div>Camera Off</div>
            </VideoPlaceholder>
          )}
          
          <VideoOverlay />
          <UserLabel>
            {!isAudioEnabled && <MicOffIcon />}
            You ({userName})
          </UserLabel>
        </VideoStreamContainer>
        
        {/* Remote Video */}
        {remoteStream && (
          <VideoStreamContainer>
            <VideoStream
              ref={remoteVideoRef}
              autoPlay
              playsInline
            />
            <VideoOverlay />
            <UserLabel>Remote User</UserLabel>
          </VideoStreamContainer>
        )}
      </VideoGrid>
      
      <ControlsBar>
        <ControlButton
          $variant={isAudioEnabled ? 'secondary' : 'danger'}
          onClick={toggleAudio}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? <MicIcon /> : <MicOffIcon />}
        </ControlButton>
        
        <ControlButton
          $variant={isVideoEnabled ? 'secondary' : 'danger'}
          onClick={toggleVideo}
          title={isVideoEnabled ? 'Stop Video' : 'Start Video'}
        >
          {isVideoEnabled ? <VideoIcon /> : <VideoOffIcon />}
        </ControlButton>
        
        <ControlButton 
          $variant="danger" 
          onClick={endCall}
          title="End Call"
        >
          <PhoneOffIcon />
        </ControlButton>
      </ControlsBar>
    </VideoContainer>
  );
};

export default VideoChat;