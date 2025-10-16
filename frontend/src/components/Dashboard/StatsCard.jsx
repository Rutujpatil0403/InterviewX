// src/components/Dashboard/StatsCard.jsx
import React from 'react';
import styled from 'styled-components';
import { TrendingUp, TrendingDown } from 'lucide-react';
import Card from '../Common/Card';

const StatsCardContainer = styled(Card)`
  padding: ${({ theme }) => theme.spacing[6]};
  cursor: ${({ clickable }) => clickable ? 'pointer' : 'default'};
  transition: ${({ theme }) => theme.transitions.shadow};
  
  ${({ clickable, theme }) => clickable && `
    &:hover {
      box-shadow: ${theme.shadows.md};
    }
  `}
`;

const CardContent = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ContentWrapper = styled.div`
  flex: 1;
`;

const HeaderRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Title = styled.p`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  color: ${({ theme }) => theme.colors.secondary[600]};
  margin: 0;
`;

const IconContainer = styled.div`
  padding: ${({ theme }) => theme.spacing[2]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  
  ${({ color, theme }) => {
    switch (color) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary[100]};
          color: ${theme.colors.primary[600]};
        `;
      case 'success':
        return `
          background-color: ${theme.colors.success[100]};
          color: ${theme.colors.success[600]};
        `;
      case 'warning':
        return `
          background-color: ${theme.colors.warning[100]};
          color: ${theme.colors.warning[600]};
        `;
      case 'secondary':
        return `
          background-color: ${theme.colors.secondary[100]};
          color: ${theme.colors.secondary[600]};
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.danger[100]};
          color: ${theme.colors.danger[600]};
        `;
      default:
        return `
          background-color: ${theme.colors.primary[100]};
          color: ${theme.colors.primary[600]};
        `;
    }
  }}
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
  }
`;

const ValueSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[2]};
`;

const Value = styled.p`
  font-size: ${({ theme }) => theme.fontSize['2xl']};
  font-weight: ${({ theme }) => theme.fontWeight.bold};
  color: ${({ theme }) => theme.colors.secondary[900]};
  margin: 0;
`;

const Subtitle = styled.p`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.secondary[500]};
  margin: ${({ theme }) => `${theme.spacing[1]} 0 0 0`};
`;

const ChangeSection = styled.div`
  margin-top: ${({ theme }) => theme.spacing[3]};
  display: flex;
  align-items: center;
`;

const ChangeValue = styled.span`
  font-size: ${({ theme }) => theme.fontSize.sm};
  font-weight: ${({ theme }) => theme.fontWeight.medium};
  
  ${({ changeType, theme }) => {
    switch (changeType) {
      case 'positive':
        return `color: ${theme.colors.success[600]};`;
      case 'negative':
        return `color: ${theme.colors.danger[600]};`;
      default:
        return `color: ${theme.colors.secondary[600]};`;
    }
  }}
`;

const ChangeLabel = styled.span`
  font-size: ${({ theme }) => theme.fontSize.xs};
  color: ${({ theme }) => theme.colors.secondary[500]};
  margin-left: ${({ theme }) => theme.spacing[1]};
`;

const TrendIcon = styled.div`
  display: flex;
  align-items: center;
  margin-right: ${({ theme }) => theme.spacing[1]};
  
  svg {
    width: 1rem;
    height: 1rem;
    
    ${({ changeType, theme }) => {
      switch (changeType) {
        case 'positive':
          return `color: ${theme.colors.success[600]};`;
        case 'negative':
          return `color: ${theme.colors.danger[600]};`;
        default:
          return `color: ${theme.colors.secondary[600]};`;
      }
    }}
  }
`;

const StatsCard = ({ 
  title, 
  value, 
  change, 
  changeType, 
  icon: Icon, 
  color = 'primary',
  subtitle,
  onClick 
}) => {
  return (
    <StatsCardContainer 
      clickable={!!onClick}
      onClick={onClick}
    >
      <CardContent>
        <ContentWrapper>
          <HeaderRow>
            <Title>{title}</Title>
            {Icon && (
              <IconContainer color={color}>
                <Icon />
              </IconContainer>
            )}
          </HeaderRow>
          
          <ValueSection>
            <Value>{value}</Value>
            {subtitle && (
              <Subtitle>{subtitle}</Subtitle>
            )}
          </ValueSection>

          {change && (
            <ChangeSection>
              <TrendIcon changeType={changeType}>
                {changeType === 'positive' && <TrendingUp />}
                {changeType === 'negative' && <TrendingDown />}
              </TrendIcon>
              <ChangeValue changeType={changeType}>
                {change}
              </ChangeValue>
              <ChangeLabel>
                vs last period
              </ChangeLabel>
            </ChangeSection>
          )}
        </ContentWrapper>
      </CardContent>
    </StatsCardContainer>
  );
};

export default StatsCard;
