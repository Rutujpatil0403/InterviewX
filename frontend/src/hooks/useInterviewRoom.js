// Frontend useInterviewRoom.js in hooks


// Interview Room Hooks
import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { interviewRoomAPI, chatRoomAPI, mediaAPI } from '../services/interviewRoomAPI';
import webSocketService from '../services/webSocketService';
import toast from 'react-hot-toast';

// Hook for managing interview room state
export const useInterviewRoom = (roomId) => {
  const [connectionStatus, setConnectionStatus] = useState('disconnected');
  const [participants, setParticipants] = useState([]);
  const [roomData, setRoomData] = useState(null);
  const [isHost, setIsHost] = useState(false);
  
  const queryClient = useQueryClient();
  
  // Fetch room details
  const { data: roomDetails, isLoading, error } = useQuery({
    queryKey: ['interview-room', roomId],
    queryFn: () => interviewRoomAPI.getRoomDetails(roomId),
    enabled: !!roomId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
  
  // Join room mutation
  const joinRoomMutation = useMutation({
    mutationFn: () => interviewRoomAPI.joinRoom(roomId),
    onSuccess: (data) => {
      setRoomData(data.data);
      setIsHost(data.data.isHost);
      queryClient.invalidateQueries(['interview-room', roomId]);
      toast.success('Joined interview room');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to join room');
    }
  });
  
  // Leave room mutation
  const leaveRoomMutation = useMutation({
    mutationFn: () => interviewRoomAPI.leaveRoom(roomId),
    onSuccess: () => {
      toast.success('Left interview room');
    }
  });
  
  // Start interview mutation
  const startInterviewMutation = useMutation({
    mutationFn: () => interviewRoomAPI.startInterview(roomId),
    onSuccess: () => {
      queryClient.invalidateQueries(['interview-room', roomId]);
      toast.success('Interview started');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to start interview');
    }
  });
  
  // End interview mutation
  const endInterviewMutation = useMutation({
    mutationFn: (data) => interviewRoomAPI.endInterview(roomId, data),
    onSuccess: () => {
      queryClient.invalidateQueries(['interview-room', roomId]);
      toast.success('Interview ended');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to end interview');
    }
  });
  
  // WebSocket connection
  useEffect(() => {
    if (roomId && roomDetails?.data) {
      const user = roomDetails.data.currentUser;
      
      webSocketService.connect(roomId, user.id, user.name);
      
      // Listen for connection status changes
      webSocketService.on('connected', () => {
        setConnectionStatus('connected');
      });
      
      webSocketService.on('disconnected', () => {
        setConnectionStatus('disconnected');
      });
      
      webSocketService.on('error', () => {
        setConnectionStatus('error');
      });
      
      // Listen for participants updates
      webSocketService.on('participants-updated', (data) => {
        setParticipants(data.participants);
      });
      
      // Listen for room status updates
      webSocketService.on('room-status-changed', (data) => {
        setRoomData(prev => ({
          ...prev,
          status: data.status
        }));
      });
      
      return () => {
        webSocketService.disconnect();
      };
    }
  }, [roomId, roomDetails]);
  
  return {
    roomDetails: roomDetails?.data,
    isLoading,
    error,
    connectionStatus,
    participants,
    isHost,
    joinRoom: joinRoomMutation.mutate,
    leaveRoom: leaveRoomMutation.mutate,
    startInterview: startInterviewMutation.mutate,
    endInterview: endInterviewMutation.mutate,
    isJoining: joinRoomMutation.isPending,
    isStarting: startInterviewMutation.isPending,
    isEnding: endInterviewMutation.isPending
  };
};

// Hook for WebRTC video chat
export const useVideoChat = (roomId, userId, userName) => {
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [peerConnection, setPeerConnection] = useState(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionState, setConnectionState] = useState('new');
  
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  
  const rtcConfig = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };
  
  // Initialize media
  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast.error('Failed to access camera/microphone');
      }
    };
    
    initializeMedia();
    
    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);
  
  // WebRTC peer connection setup
  useEffect(() => {
    if (!localStream || !webSocketService.isConnected()) return;
    
    const createPeerConnection = () => {
      const pc = new RTCPeerConnection(rtcConfig);
      
      // Add local stream
      localStream.getTracks().forEach(track => {
        pc.addTrack(track, localStream);
      });
      
      // Handle remote stream
      pc.ontrack = (event) => {
        setRemoteStream(event.streams[0]);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };
      
      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          webSocketService.sendIceCandidate(event.candidate);
        }
      };
      
      // Handle connection state
      pc.onconnectionstatechange = () => {
        setConnectionState(pc.connectionState);
      };
      
      setPeerConnection(pc);
      return pc;
    };
    
    // WebSocket message handlers
    const handleOffer = async (data) => {
      const pc = createPeerConnection();
      await pc.setRemoteDescription(data.offer);
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      webSocketService.sendAnswer(answer);
    };
    
    const handleAnswer = async (data) => {
      if (peerConnection) {
        await peerConnection.setRemoteDescription(data.answer);
      }
    };
    
    const handleIceCandidate = async (data) => {
      if (peerConnection) {
        await peerConnection.addIceCandidate(data.candidate);
      }
    };
    
    webSocketService.on('offer', handleOffer);
    webSocketService.on('answer', handleAnswer);
    webSocketService.on('ice-candidate', handleIceCandidate);
    
    return () => {
      webSocketService.off('offer', handleOffer);
      webSocketService.off('answer', handleAnswer);
      webSocketService.off('ice-candidate', handleIceCandidate);
    };
  }, [localStream, peerConnection]);
  
  const toggleAudio = useCallback(() => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        webSocketService.sendMediaState(audioTrack.enabled, isVideoEnabled);
      }
    }
  }, [localStream, isVideoEnabled]);
  
  const toggleVideo = useCallback(() => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        webSocketService.sendMediaState(isAudioEnabled, videoTrack.enabled);
      }
    }
  }, [localStream, isAudioEnabled]);
  
  const toggleScreenShare = useCallback(async () => {
    try {
      if (isScreenSharing) {
        // Stop screen sharing, return to camera
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Replace track in peer connection
        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        }
        
        setIsScreenSharing(false);
        webSocketService.sendScreenShareStop();
      } else {
        // Start screen sharing
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Replace track in peer connection
        if (peerConnection) {
          const sender = peerConnection.getSenders().find(s => 
            s.track && s.track.kind === 'video'
          );
          if (sender) {
            await sender.replaceTrack(stream.getVideoTracks()[0]);
          }
        }
        
        setIsScreenSharing(true);
        webSocketService.sendScreenShareStart();
        
        // Handle screen share end
        stream.getVideoTracks()[0].onended = () => {
          toggleScreenShare();
        };
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
      toast.error('Failed to toggle screen sharing');
    }
  }, [isScreenSharing, peerConnection]);
  
  const createOffer = useCallback(async () => {
    if (peerConnection) {
      try {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        webSocketService.sendOffer(offer);
      } catch (error) {
        console.error('Error creating offer:', error);
      }
    }
  }, [peerConnection]);
  
  return {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    connectionState,
    localVideoRef,
    remoteVideoRef,
    toggleAudio,
    toggleVideo,
    toggleScreenShare,
    createOffer
  };
};

// Hook for chat functionality
export const useInterviewChat = (roomId) => {
  const [messages, setMessages] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [chatRoom, setChatRoom] = useState(null);
  
  const queryClient = useQueryClient();
  
  // Get or create chat room
  useEffect(() => {
    const initializeChat = async () => {
      try {
        let room = await chatRoomAPI.getChatRoom(roomId);
        if (!room.data) {
          room = await chatRoomAPI.createChatRoom(roomId);
        }
        setChatRoom(room.data);
        
        // Load message history
        const history = await chatRoomAPI.getMessageHistory(room.data.id);
        setMessages(history.data?.messages || []);
      } catch (error) {
        console.error('Error initializing chat:', error);
      }
    };
    
    if (roomId) {
      initializeChat();
    }
  }, [roomId]);
  
  // WebSocket chat listeners
  useEffect(() => {
    const handleChatMessage = (data) => {
      setMessages(prev => [...prev, data.message]);
    };
    
    const handleUserTyping = (data) => {
      setTypingUsers(prev => {
        const filtered = prev.filter(u => u.id !== data.userId);
        return [...filtered, { id: data.userId, name: data.userName }];
      });
      
      // Auto-remove after 3 seconds
      setTimeout(() => {
        setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
      }, 3000);
    };
    
    const handleUserStoppedTyping = (data) => {
      setTypingUsers(prev => prev.filter(u => u.id !== data.userId));
    };
    
    webSocketService.on('chat-message', handleChatMessage);
    webSocketService.on('user-typing', handleUserTyping);
    webSocketService.on('user-stopped-typing', handleUserStoppedTyping);
    
    return () => {
      webSocketService.off('chat-message', handleChatMessage);
      webSocketService.off('user-typing', handleUserTyping);
      webSocketService.off('user-stopped-typing', handleUserStoppedTyping);
    };
  }, []);
  
  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: (messageData) => {
      // Send via WebSocket for real-time delivery
      webSocketService.sendChatMessage(messageData);
      
      // Also persist to backend
      if (chatRoom) {
        return chatRoomAPI.sendMessage(chatRoom.id, messageData);
      }
      return Promise.resolve();
    },
    onError: (error) => {
      toast.error('Failed to send message');
      console.error('Send message error:', error);
    }
  });
  
  // Delete message mutation
  const deleteMessageMutation = useMutation({
    mutationFn: (messageId) => {
      if (chatRoom) {
        return chatRoomAPI.deleteMessage(chatRoom.id, messageId);
      }
      return Promise.resolve();
    },
    onSuccess: (_, messageId) => {
      setMessages(prev => prev.filter(m => m.id !== messageId));
      toast.success('Message deleted');
    },
    onError: () => {
      toast.error('Failed to delete message');
    }
  });
  
  const sendMessage = useCallback((content, type = 'text') => {
    const messageData = {
      content,
      type,
      timestamp: new Date().toISOString()
    };
    
    sendMessageMutation.mutate(messageData);
  }, [sendMessageMutation]);
  
  const deleteMessage = useCallback((messageId) => {
    deleteMessageMutation.mutate(messageId);
  }, [deleteMessageMutation]);
  
  const sendTyping = useCallback(() => {
    webSocketService.sendTyping();
  }, []);
  
  const sendStopTyping = useCallback(() => {
    webSocketService.sendStopTyping();
  }, []);
  
  return {
    messages,
    typingUsers,
    sendMessage,
    deleteMessage,
    sendTyping,
    sendStopTyping,
    isSending: sendMessageMutation.isPending
  };
};

// Hook for interview recording
export const useRecording = (roomId) => {
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingBlob, setRecordingBlob] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);
  const timerRef = useRef(null);
  const startTimeRef = useRef(null);
  
  // Start recording mutation
  const startRecordingMutation = useMutation({
    mutationFn: () => interviewRoomAPI.startRecording(roomId),
    onSuccess: () => {
      toast.success('Recording started');
    },
    onError: () => {
      toast.error('Failed to start recording');
    }
  });
  
  // Stop recording mutation
  const stopRecordingMutation = useMutation({
    mutationFn: () => interviewRoomAPI.stopRecording(roomId),
    onSuccess: () => {
      toast.success('Recording stopped');
    },
    onError: () => {
      toast.error('Failed to stop recording');
    }
  });
  
  // Upload recording mutation
  const uploadRecordingMutation = useMutation({
    mutationFn: (file) => mediaAPI.uploadRecording(roomId, file),
    onSuccess: () => {
      toast.success('Recording uploaded successfully');
    },
    onError: () => {
      toast.error('Failed to upload recording');
    }
  });
  
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream);
      chunksRef.current = [];
      
      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };
      
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        setRecordingBlob(blob);
      };
      
      mediaRecorderRef.current.start(1000); // Collect data every second
      setIsRecording(true);
      
      // Start timer
      startTimeRef.current = Date.now();
      timerRef.current = setInterval(() => {
        setDuration(Math.floor((Date.now() - startTimeRef.current) / 1000));
      }, 1000);
      
      // Notify backend
      startRecordingMutation.mutate();
      
      // Notify WebSocket
      webSocketService.sendRecordingStart();
      
    } catch (error) {
      console.error('Error starting recording:', error);
      toast.error('Failed to start recording');
    }
  }, [startRecordingMutation]);
  
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Notify backend
      stopRecordingMutation.mutate();
      
      // Notify WebSocket
      webSocketService.sendRecordingStop();
    }
  }, [isRecording, stopRecordingMutation]);
  
  const uploadRecording = useCallback(() => {
    if (recordingBlob) {
      const file = new File([recordingBlob], `interview-${roomId}-recording.webm`, {
        type: 'video/webm'
      });
      uploadRecordingMutation.mutate(file);
    }
  }, [recordingBlob, roomId, uploadRecordingMutation]);
  
  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  return {
    isRecording,
    duration,
    recordingBlob,
    startRecording,
    stopRecording,
    uploadRecording,
    isStarting: startRecordingMutation.isPending,
    isStopping: stopRecordingMutation.isPending,
    isUploading: uploadRecordingMutation.isPending
  };
};