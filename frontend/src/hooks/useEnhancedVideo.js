import { useState, useRef, useCallback } from 'react';
import { useSocket } from '../context/Socket';
import { usePeer } from '../context/Peers';
import { usePermissions } from './usePermissions';
import { CONFIG } from '../config/webrtc.config';

export const useEnhancedVideo = ({ roomId }) => {
  const { socket, isConnected, connectionError } = useSocket();
  const { peer, createOffer, createAnswer, setRemoteAns, restartIce } = usePeer();
  const { 
    permissions, 
    permissionError, 
    checkPermissions, 
    requestPermissions,
    checkScreenSharePermission,
    hasAllPermissions 
  } = usePermissions();

  // Media streams
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [screenStream, setScreenStream] = useState(null);

  // UI state
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [videoQuality, setVideoQuality] = useState('MEDIUM_QUALITY');
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const remoteUserIdRef = useRef(null);
  const isProcessingCall = useRef(false);
  const mediaRecorder = useRef(null);
  const reconnectTimeout = useRef(null);
  const reconnectAttempts = useRef(0);

  // Initialize media stream with quality settings
  const initializeMedia = useCallback(async (quality = videoQuality) => {
    try {
      if (!hasAllPermissions()) {
        const permissionGranted = await requestPermissions();
        if (!permissionGranted) {
          throw new Error('Permissions not granted');
        }
      }

      const constraints = CONFIG.MEDIA_CONSTRAINTS[quality];
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Add tracks to peer
      if (peer && stream) {
        // Remove existing tracks first
        const senders = peer.getSenders();
        for (const sender of senders) {
          if (sender.track) {
            peer.removeTrack(sender);
          }
        }

        // Add new tracks
        stream.getTracks().forEach(track => {
          peer.addTrack(track, stream);
        });
      }

      return stream;
    } catch (error) {
      console.error('Error initializing media:', error);
      throw error;
    }
  }, [videoQuality, hasAllPermissions, requestPermissions, peer]);

  // Screen sharing functionality
  const stopScreenShare = useCallback(async () => {
    try {
      if (screenStream) {
        screenStream.getTracks().forEach(track => track.stop());
        setScreenStream(null);
      }

      setIsScreenSharing(false);

      // Restore camera video track
      if (peer && localStream) {
        const videoTrack = localStream.getVideoTracks()[0];
        const sender = peer.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender && videoTrack) {
          await sender.replaceTrack(videoTrack);
        }
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  }, [screenStream, peer, localStream]);

  const startScreenShare = useCallback(async () => {
    try {
      const hasPermission = await checkScreenSharePermission();
      if (!hasPermission) {
        throw new Error('Screen share permission denied');
      }

      const stream = await navigator.mediaDevices.getDisplayMedia(CONFIG.SCREEN_SHARE_CONSTRAINTS);
      
      setScreenStream(stream);
      setIsScreenSharing(true);

      // Replace video track in peer connection
      if (peer && localStream) {
        const videoTrack = stream.getVideoTracks()[0];
        const sender = peer.getSenders().find(s => 
          s.track && s.track.kind === 'video'
        );
        
        if (sender) {
          await sender.replaceTrack(videoTrack);
        }

        // Handle screen share end
        videoTrack.onended = () => {
          stopScreenShare();
        };
      }

      return stream;
    } catch (error) {
      console.error('Error starting screen share:', error);
      setIsScreenSharing(false);
      throw error;
    }
  }, [checkScreenSharePermission, peer, localStream, stopScreenShare]);

  // Recording functionality
  const startRecording = useCallback(() => {
    try {
      if (!localStream) {
        throw new Error('No local stream available for recording');
      }

      const options = {
        mimeType: CONFIG.RECORDING_CONFIG.mimeType,
        videoBitsPerSecond: CONFIG.RECORDING_CONFIG.videoBitsPerSecond,
        audioBitsPerSecond: CONFIG.RECORDING_CONFIG.audioBitsPerSecond
      };

      mediaRecorder.current = new MediaRecorder(localStream, options);
      
      mediaRecorder.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordedChunks(prev => [...prev, event.data]);
        }
      };

      mediaRecorder.current.start(1000); // Record in 1-second chunks
      setIsRecording(true);
      
      console.log('Recording started');
    } catch (error) {
      console.error('Error starting recording:', error);
      throw error;
    }
  }, [localStream]);

  const stopRecording = useCallback(() => {
    try {
      if (mediaRecorder.current && isRecording) {
        mediaRecorder.current.stop();
        setIsRecording(false);
        console.log('Recording stopped');
      }
    } catch (error) {
      console.error('Error stopping recording:', error);
    }
  }, [isRecording]);

  const downloadRecording = useCallback(() => {
    try {
      if (recordedChunks.length === 0) {
        throw new Error('No recording data available');
      }

      const blob = new Blob(recordedChunks, { type: CONFIG.RECORDING_CONFIG.mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `interview-recording-${Date.now()}.webm`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setRecordedChunks([]);
    } catch (error) {
      console.error('Error downloading recording:', error);
      throw error;
    }
  }, [recordedChunks]);

  // Quality control
  const changeVideoQuality = useCallback(async (quality) => {
    try {
      setVideoQuality(quality);
      await initializeMedia(quality);
    } catch (error) {
      console.error('Error changing video quality:', error);
      throw error;
    }
  }, [initializeMedia]);

  // Connection recovery
  const handleConnectionFailure = useCallback(async () => {
    if (reconnectAttempts.current >= CONFIG.CONNECTION_CONFIG.RECONNECT_ATTEMPTS) {
      console.error('Max reconnection attempts reached');
      setConnectionStatus('failed');
      return;
    }

    reconnectAttempts.current += 1;
    setConnectionStatus('reconnecting');

    try {
      // Try to restart ICE
      const offer = await restartIce();
      if (socket && remoteUserIdRef.current) {
        socket.emit('call-user', { 
          toUserId: remoteUserIdRef.current, 
          offer,
          isRestart: true 
        });
      }
    } catch (error) {
      console.error('ICE restart failed:', error);
      
      // Fallback: full reconnection
      if (reconnectTimeout.current) {
        clearTimeout(reconnectTimeout.current);
      }
      
      reconnectTimeout.current = setTimeout(() => {
        handleConnectionFailure();
      }, CONFIG.CONNECTION_CONFIG.RECONNECT_DELAY);
    }
  }, [socket, restartIce]);

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
    // Stop recording if active
    if (isRecording) {
      stopRecording();
    }

    // Stop screen sharing if active
    if (isScreenSharing) {
      stopScreenShare();
    }

    // Stop local media tracks (mic and camera)
    if (localStream) {
      localStream.getTracks().forEach(track => {
        console.log(`Stopping ${track.kind} track`);
        track.stop();
      });
    }

    // Stop screen stream if exists
    if (screenStream) {
      screenStream.getTracks().forEach(track => {
        console.log(`Stopping screen share ${track.kind} track`);
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
    
    // Clear streams and state
    setLocalStream(null);
    setRemoteStream(null);
    setScreenStream(null);
    setConnectionStatus('disconnected');
    
    // Reset UI state to ensure mic and camera are shown as off
    setIsAudioEnabled(false);
    setIsVideoEnabled(false);
    setIsScreenSharing(false);
    setIsRecording(false);
    
    // Clear refs
    reconnectAttempts.current = 0;
    if (reconnectTimeout.current) {
      clearTimeout(reconnectTimeout.current);
    }

    console.log('✅ Call ended - All media tracks stopped');
  }, [isRecording, isScreenSharing, localStream, screenStream, peer, socket, roomId, stopRecording, stopScreenShare]);

  return {
    // Streams
    localStream,
    remoteStream,
    screenStream,
    localVideoRef,
    remoteVideoRef,

    // State
    isAudioEnabled,
    isVideoEnabled,
    isScreenSharing,
    isRecording,
    videoQuality,
    connectionStatus,
    permissions,
    permissionError,
    connectionError,
    isConnected,
    recordedChunks,

    // Actions
    initializeMedia,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
    downloadRecording,
    changeVideoQuality,
    endCall,
    checkPermissions,
    requestPermissions,

    // Cleanup function for component unmount
    cleanup: endCall,

    // Internal handlers (for socket events)
    setRemoteStream,
    setConnectionStatus,
    remoteUserIdRef,
    isProcessingCall,
    createOffer,
    createAnswer,
    setRemoteAns,
    peer,
    socket
  };
};

export default useEnhancedVideo;