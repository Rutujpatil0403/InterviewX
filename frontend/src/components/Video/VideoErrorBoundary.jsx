// VideoErrorBoundary.jsx - Error boundary for video calling functionality

import React from 'react';
import styled from 'styled-components';
import { AlertCircle, RefreshCw, Camera, Mic } from 'lucide-react';
import Button from '../Common/Button';

const ErrorContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 2rem;
  background: ${({ theme }) => theme.colors.gray?.[900] || '#111827'};
  color: white;
  text-align: center;
`;

const ErrorIcon = styled.div`
  margin-bottom: 1rem;
  color: ${({ theme }) => theme.colors.red?.[500] || '#ef4444'};
  
  svg {
    width: 3rem;
    height: 3rem;
  }
`;

const ErrorTitle = styled.h2`
  margin: 0 0 0.5rem 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: ${({ theme }) => theme.colors.red?.[400] || '#f87171'};
`;

const ErrorMessage = styled.p`
  margin: 0 0 1.5rem 0;
  font-size: 1rem;
  color: ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  max-width: 400px;
  line-height: 1.5;
`;

const ErrorActions = styled.div`
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
  justify-content: center;
`;

const TroubleshootingSteps = styled.div`
  margin-top: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 0.5rem;
  max-width: 500px;
`;

const StepsList = styled.ol`
  text-align: left;
  margin: 0.5rem 0;
  padding-left: 1.5rem;
  
  li {
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray?.[400] || '#9ca3af'};
  }
`;

class VideoErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null,
      errorInfo: null 
    };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Video component error:', error);
    console.error('Error info:', errorInfo);
    
    this.setState({
      error,
      errorInfo
    });

    // Report error to monitoring service if available
    if (this.props.onError) {
      this.props.onError({
        error,
        errorInfo,
        userMessage: this.getUserFriendlyMessage(error)
      });
    }
  }

  getUserFriendlyMessage(error) {
    if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
      return 'Camera and microphone access was denied. Please allow permissions and try again.';
    }
    
    if (error.name === 'NotFoundError' || error.message.includes('not found')) {
      return 'No camera or microphone was found. Please connect your devices and try again.';
    }
    
    if (error.name === 'NotReadableError' || error.message.includes('in use')) {
      return 'Your camera or microphone is being used by another application. Please close other applications and try again.';
    }
    
    if (error.message.includes('WebRTC') || error.message.includes('peer')) {
      return 'Failed to establish video connection. Please check your internet connection and try again.';
    }
    
    return 'An unexpected error occurred with the video calling feature.';
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    
    if (this.props.onRetry) {
      this.props.onRetry();
    }
  };

  handleRefresh = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const userMessage = this.getUserFriendlyMessage(this.state.error);
      const isPermissionError = this.state.error?.name === 'NotAllowedError' || 
                               userMessage.includes('permission');
      const isDeviceError = this.state.error?.name === 'NotFoundError' || 
                           userMessage.includes('not found');

      return (
        <ErrorContainer>
          <ErrorIcon>
            <AlertCircle />
          </ErrorIcon>
          
          <ErrorTitle>Video Call Error</ErrorTitle>
          
          <ErrorMessage>
            {userMessage}
          </ErrorMessage>

          <ErrorActions>
            <Button onClick={this.handleRetry} $variant="primary">
              <RefreshCw style={{ width: '1rem', height: '1rem', marginRight: '0.5rem' }} />
              Try Again
            </Button>
            
            <Button onClick={this.handleRefresh} $variant="secondary">
              Refresh Page
            </Button>
          </ErrorActions>

          {(isPermissionError || isDeviceError) && (
            <TroubleshootingSteps>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1rem', fontWeight: '600' }}>
                Troubleshooting Steps:
              </h3>
              
              {isPermissionError && (
                <StepsList>
                  <li>Click the camera/microphone icon in your browser's address bar</li>
                  <li>Select "Allow" for camera and microphone permissions</li>
                  <li>Refresh the page and try again</li>
                  <li>If using Chrome, go to Settings → Privacy and security → Site Settings → Camera/Microphone</li>
                </StepsList>
              )}
              
              {isDeviceError && (
                <StepsList>
                  <li>Make sure your camera and microphone are properly connected</li>
                  <li>Check that they're not being used by other applications</li>
                  <li>Try unplugging and reconnecting your devices</li>
                  <li>Restart your browser and try again</li>
                </StepsList>
              )}
            </TroubleshootingSteps>
          )}

          {import.meta.env?.DEV && this.state.error && (
            <details style={{ marginTop: '1rem', fontSize: '0.75rem', color: '#9ca3af' }}>
              <summary>Technical Details (Development Only)</summary>
              <pre style={{ textAlign: 'left', marginTop: '0.5rem', fontSize: '0.625rem' }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}
        </ErrorContainer>
      );
    }

    return this.props.children;
  }
}

export default VideoErrorBoundary;