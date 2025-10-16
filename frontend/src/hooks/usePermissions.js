import { useState, useCallback } from 'react';
import { CONFIG } from '../config/webrtc.config';

export const usePermissions = () => {
  const [permissions, setPermissions] = useState({
    camera: null,
    microphone: null,
    screen: null
  });
  const [permissionError, setPermissionError] = useState(null);

  const checkPermissions = useCallback(async () => {
    try {
      // Check camera and microphone permissions
      const stream = await navigator.mediaDevices.getUserMedia(CONFIG.MEDIA_CONSTRAINTS.MEDIUM_QUALITY);
      
      setPermissions({
        camera: 'granted',
        microphone: 'granted',
        screen: null
      });
      
      setPermissionError(null);
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Permission check failed:', error);
      
      let cameraStatus = 'denied';
      let microphoneStatus = 'denied';
      let errorMessage = 'Camera and microphone access denied';

      if (error.name === 'NotAllowedError') {
        errorMessage = 'Please allow camera and microphone access to join the video call';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'No camera or microphone found on this device';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Camera or microphone is already in use by another application';
      } else if (error.name === 'OverconstrainedError') {
        errorMessage = 'Camera or microphone does not meet the required specifications';
      }

      setPermissions({
        camera: cameraStatus,
        microphone: microphoneStatus,
        screen: null
      });
      
      setPermissionError(errorMessage);
      return false;
    }
  }, []);

  const requestPermissions = useCallback(async () => {
    try {
      setPermissionError(null);
      
      // Request permissions step by step for better error handling
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      setPermissions({
        camera: 'granted',
        microphone: 'granted',
        screen: null
      });
      
      // Stop the permission request stream
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Permission request failed:', error);
      setPermissionError(error.message || 'Failed to get permissions');
      return false;
    }
  }, []);

  const checkScreenSharePermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia(CONFIG.SCREEN_SHARE_CONSTRAINTS);
      
      setPermissions(prev => ({
        ...prev,
        screen: 'granted'
      }));
      
      // Stop the test stream
      stream.getTracks().forEach(track => track.stop());
      
      return true;
    } catch (error) {
      console.error('Screen share permission check failed:', error);
      
      setPermissions(prev => ({
        ...prev,
        screen: 'denied'
      }));
      
      return false;
    }
  }, []);

  const hasAllPermissions = useCallback(() => {
    return permissions.camera === 'granted' && permissions.microphone === 'granted';
  }, [permissions]);

  return {
    permissions,
    permissionError,
    checkPermissions,
    requestPermissions,
    checkScreenSharePermission,
    hasAllPermissions
  };
};

export default usePermissions;