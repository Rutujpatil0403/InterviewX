import { useState, useEffect, useCallback, useRef } from 'react';

export const usePerformanceMonitoring = ({ peer, isConnected }) => {
  const [connectionStats, setConnectionStats] = useState({
    bytesReceived: 0,
    bytesSent: 0,
    packetsReceived: 0,
    packetsLost: 0,
    jitter: 0,
    rtt: 0,
    bandwidth: 0,
    videoResolution: { width: 0, height: 0 },
    frameRate: 0,
    codecsUsed: { video: '', audio: '' }
  });

  const [connectionQuality, setConnectionQuality] = useState('unknown'); // excellent, good, fair, poor, unknown
  const [networkType, setNetworkType] = useState('unknown');
  const [callDuration, setCallDuration] = useState(0);
  
  const statsInterval = useRef(null);
  const callStartTime = useRef(null);
  const previousStats = useRef({});

  // Start call timer when connected
  useEffect(() => {
    if (isConnected && !callStartTime.current) {
      callStartTime.current = Date.now();
    } else if (!isConnected) {
      callStartTime.current = null;
      setCallDuration(0);
    }
  }, [isConnected]);

  // Update call duration
  useEffect(() => {
    let durationInterval;
    if (isConnected && callStartTime.current) {
      durationInterval = setInterval(() => {
        setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
      }, 1000);
    }

    return () => {
      if (durationInterval) {
        clearInterval(durationInterval);
      }
    };
  }, [isConnected]);

  // Get network information
  const getNetworkInfo = useCallback(() => {
    if ('connection' in navigator) {
      const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      setNetworkType(connection.effectiveType || 'unknown');
    }
  }, []);

  // Calculate connection quality based on stats
  const calculateConnectionQuality = useCallback((stats) => {
    const { packetsLost, packetsReceived, jitter, rtt } = stats;
    
    if (packetsReceived === 0) return 'unknown';
    
    const packetLossRate = packetsLost / (packetsLost + packetsReceived);
    
    // Quality thresholds
    if (packetLossRate < 0.01 && jitter < 30 && rtt < 100) {
      return 'excellent';
    } else if (packetLossRate < 0.03 && jitter < 50 && rtt < 200) {
      return 'good';
    } else if (packetLossRate < 0.05 && jitter < 100 && rtt < 300) {
      return 'fair';
    } else {
      return 'poor';
    }
  }, []);

  // Collect WebRTC statistics
  const collectStats = useCallback(async () => {
    if (!peer || peer.connectionState !== 'connected') return;

    try {
      const stats = await peer.getStats();
      const newStats = {
        bytesReceived: 0,
        bytesSent: 0,
        packetsReceived: 0,
        packetsLost: 0,
        jitter: 0,
        rtt: 0,
        bandwidth: 0,
        videoResolution: { width: 0, height: 0 },
        frameRate: 0,
        codecsUsed: { video: '', audio: '' }
      };

      stats.forEach((report) => {
        switch (report.type) {
          case 'inbound-rtp':
            if (report.kind === 'video') {
              newStats.bytesReceived += report.bytesReceived || 0;
              newStats.packetsReceived += report.packetsReceived || 0;
              newStats.packetsLost += report.packetsLost || 0;
              newStats.jitter = report.jitter || 0;
              newStats.frameRate = report.framesPerSecond || 0;
              
              if (report.frameWidth && report.frameHeight) {
                newStats.videoResolution = {
                  width: report.frameWidth,
                  height: report.frameHeight
                };
              }
            }
            if (report.kind === 'audio') {
              newStats.jitter = Math.max(newStats.jitter, report.jitter || 0);
            }
            break;

          case 'outbound-rtp':
            if (report.kind === 'video') {
              newStats.bytesSent += report.bytesSent || 0;
            }
            break;

          case 'remote-inbound-rtp':
            if (report.roundTripTime) {
              newStats.rtt = report.roundTripTime * 1000; // Convert to ms
            }
            break;

          case 'candidate-pair':
            if (report.state === 'succeeded' && report.currentRoundTripTime) {
              newStats.rtt = report.currentRoundTripTime * 1000;
            }
            break;

          case 'codec':
            if (report.mimeType) {
              if (report.mimeType.includes('video')) {
                newStats.codecsUsed.video = report.mimeType.split('/')[1];
              } else if (report.mimeType.includes('audio')) {
                newStats.codecsUsed.audio = report.mimeType.split('/')[1];
              }
            }
            break;

          default:
            break;
        }
      });

      // Calculate bandwidth (bytes per second)
      if (previousStats.current.bytesReceived) {
        const timeDiff = 1; // 1 second interval
        const bytesDiff = newStats.bytesReceived - previousStats.current.bytesReceived;
        newStats.bandwidth = Math.round((bytesDiff * 8) / timeDiff / 1000); // kbps
      }

      previousStats.current = { ...newStats };
      setConnectionStats(newStats);
      setConnectionQuality(calculateConnectionQuality(newStats));

    } catch (error) {
      console.error('Error collecting WebRTC stats:', error);
    }
  }, [peer, calculateConnectionQuality]);

  // Start/stop statistics collection
  useEffect(() => {
    if (isConnected && peer) {
      getNetworkInfo();
      statsInterval.current = setInterval(collectStats, 1000);
    } else {
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
        statsInterval.current = null;
      }
    }

    return () => {
      if (statsInterval.current) {
        clearInterval(statsInterval.current);
      }
    };
  }, [isConnected, peer, collectStats, getNetworkInfo]);

  // Format duration for display
  const formatDuration = useCallback((seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  // Get connection status summary
  const getConnectionSummary = useCallback(() => {
    return {
      quality: connectionQuality,
      duration: formatDuration(callDuration),
      bandwidth: `${connectionStats.bandwidth} kbps`,
      resolution: `${connectionStats.videoResolution.width}x${connectionStats.videoResolution.height}`,
      frameRate: `${connectionStats.frameRate} fps`,
      packetLoss: connectionStats.packetsReceived > 0 
        ? `${((connectionStats.packetsLost / (connectionStats.packetsLost + connectionStats.packetsReceived)) * 100).toFixed(1)}%`
        : '0%',
      latency: `${Math.round(connectionStats.rtt)}ms`,
      networkType
    };
  }, [connectionQuality, callDuration, connectionStats, networkType, formatDuration]);

  // Export statistics for analytics
  const exportStats = useCallback(() => {
    const statsData = {
      timestamp: new Date().toISOString(),
      callDuration,
      connectionStats,
      connectionQuality,
      networkType,
      summary: getConnectionSummary()
    };

    // Send to analytics service (implement based on your needs)
    console.log('Call Statistics:', statsData);
    
    return statsData;
  }, [callDuration, connectionStats, connectionQuality, networkType, getConnectionSummary]);

  return {
    connectionStats,
    connectionQuality,
    networkType,
    callDuration,
    getConnectionSummary,
    exportStats,
    formatDuration
  };
};

export default usePerformanceMonitoring;