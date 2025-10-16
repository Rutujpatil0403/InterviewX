import React, { useState } from 'react';
import styled from 'styled-components';
import { usePerformanceMonitoring } from '../../hooks/usePerformanceMonitoring';

const StatsContainer = styled.div`
  position: absolute;
  top: 60px;
  right: 16px;
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.75rem;
  font-family: 'JetBrains Mono', monospace;
  backdrop-filter: blur(8px);
  min-width: 200px;
  z-index: 25;
  transition: all 0.3s ease;
  
  ${({ $visible }) => !$visible && `
    opacity: 0;
    pointer-events: none;
    transform: translateX(100%);
  `}
`;

const StatsToggle = styled.button`
  position: absolute;
  top: 60px;
  right: ${({ $statsVisible }) => $statsVisible ? '220px' : '16px'};
  background: rgba(0, 0, 0, 0.8);
  color: white;
  border: none;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 0.75rem;
  cursor: pointer;
  backdrop-filter: blur(8px);
  transition: all 0.3s ease;
  z-index: 26;
  
  &:hover {
    background: rgba(0, 0, 0, 0.9);
  }
`;

const StatRow = styled.div`
  display: flex;
  justify-content: space-between;
  margin-bottom: 4px;
  
  &:last-child {
    margin-bottom: 0;
  }
`;

const StatLabel = styled.span`
  color: #9ca3af;
`;

const StatValue = styled.span`
  color: ${({ $quality }) => {
    switch($quality) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#e5e7eb';
    }
  }};
  font-weight: 600;
`;

const QualityIndicator = styled.div`
  display: inline-block;
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${({ $quality }) => {
    switch($quality) {
      case 'excellent': return '#10b981';
      case 'good': return '#3b82f6';
      case 'fair': return '#f59e0b';
      case 'poor': return '#ef4444';
      default: return '#6b7280';
    }
  }};
  margin-right: 6px;
`;

const StatsTitle = styled.div`
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 8px;
  padding-bottom: 4px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  display: flex;
  align-items: center;
`;

const ConnectionStatsDisplay = ({ peer, isConnected }) => {
  const [showStats, setShowStats] = useState(false);
  
  const {
    connectionQuality,
    getConnectionSummary
  } = usePerformanceMonitoring({ peer, isConnected });

  if (!isConnected) return null;

  const summary = getConnectionSummary();

  return (
    <>
      <StatsToggle 
        $statsVisible={showStats}
        onClick={() => setShowStats(!showStats)}
      >
        {showStats ? 'Hide Stats' : 'Show Stats'}
      </StatsToggle>
      
      <StatsContainer $visible={showStats}>
        <StatsTitle>
          <QualityIndicator $quality={connectionQuality} />
          Connection Stats
        </StatsTitle>
        
        <StatRow>
          <StatLabel>Quality:</StatLabel>
          <StatValue $quality={connectionQuality}>
            {summary.quality.charAt(0).toUpperCase() + summary.quality.slice(1)}
          </StatValue>
        </StatRow>
        
        <StatRow>
          <StatLabel>Duration:</StatLabel>
          <StatValue>{summary.duration}</StatValue>
        </StatRow>
        
        <StatRow>
          <StatLabel>Bandwidth:</StatLabel>
          <StatValue>{summary.bandwidth}</StatValue>
        </StatRow>
        
        <StatRow>
          <StatLabel>Resolution:</StatLabel>
          <StatValue>{summary.resolution}</StatValue>
        </StatRow>
        
        <StatRow>
          <StatLabel>Frame Rate:</StatLabel>
          <StatValue>{summary.frameRate}</StatValue>
        </StatRow>
        
        <StatRow>
          <StatLabel>Packet Loss:</StatLabel>
          <StatValue>{summary.packetLoss}</StatValue>
        </StatRow>
        
        <StatRow>
          <StatLabel>Latency:</StatLabel>
          <StatValue>{summary.latency}</StatValue>
        </StatRow>
        
        <StatRow>
          <StatLabel>Network:</StatLabel>
          <StatValue>{summary.networkType}</StatValue>
        </StatRow>
      </StatsContainer>
    </>
  );
};

export default ConnectionStatsDisplay;