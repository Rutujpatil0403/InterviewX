// Settings Section Component
import React from 'react';
import styled from 'styled-components';

const SectionContainer = styled.div`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  overflow: hidden;
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const SectionHeader = styled.div`
  padding: ${({ theme }) => `${theme.spacing[6]} ${theme.spacing[6]} ${theme.spacing[4]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background-color: ${({ theme }) => theme.colors.gray[50]};
`;

const SectionTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.gray[900]};
  margin: 0 0 ${({ theme }) => theme.spacing[2]} 0;
`;

const SectionDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
  line-height: 1.5;
`;

const SectionContent = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const SectionActions = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[6]}`};
  background-color: ${({ theme }) => theme.colors.gray[50]};
  border-top: 1px solid ${({ theme }) => theme.colors.gray[200]};
`;

const SettingsSection = ({ 
  title, 
  description, 
  children, 
  actions,
  className 
}) => {
  return (
    <SectionContainer className={className}>
      {(title || description) && (
        <SectionHeader>
          {title && <SectionTitle>{title}</SectionTitle>}
          {description && <SectionDescription>{description}</SectionDescription>}
        </SectionHeader>
      )}
      
      <SectionContent>
        {children}
      </SectionContent>
      
      {actions && (
        <SectionActions>
          {actions}
        </SectionActions>
      )}
    </SectionContainer>
  );
};

export default SettingsSection;