// Settings Tab Navigation Component
import React from 'react';
import styled from 'styled-components';

const TabsContainer = styled.div`
  margin-bottom: ${({ theme }) => theme.spacing[6]};
`;

const TabsList = styled.div`
  display: flex;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[200]};
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => `${theme.borderRadius.lg} ${theme.borderRadius.lg} 0 0`};
  padding: ${({ theme }) => `0 ${theme.spacing[4]}`};
  overflow-x: auto;
  
  &::-webkit-scrollbar {
    height: 4px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray[300]};
    border-radius: 2px;
  }
`;

const TabButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['active'].includes(prop)
})`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[6]}`};
  border: none;
  background: none;
  color: ${({ theme, active }) => 
    active ? theme.colors.primary[600] : theme.colors.gray[600]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme, active }) => 
    active ? theme.fontWeights.semibold : theme.fontWeights.medium};
  cursor: pointer;
  position: relative;
  transition: ${({ theme }) => theme.transitions.all};
  white-space: nowrap;
  
  &:hover {
    color: ${({ theme, active }) => 
      active ? theme.colors.primary[700] : theme.colors.primary[600]};
  }
  
  &:focus {
    outline: none;
    color: ${({ theme }) => theme.colors.primary[600]};
  }
  
  ${({ active, theme }) => active && `
    &::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      right: 0;
      height: 2px;
      background-color: ${theme.colors.primary[600]};
    }
  `}
`;

const TabIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
`;

const TabContent = styled.div`
  background-color: ${({ theme }) => theme.colors.gray[50]};
  min-height: 500px;
`;

const SettingsTabs = ({ tabs, activeTab, onTabChange, children }) => {
  return (
    <TabsContainer>
      <TabsList>
        {tabs.map((tab) => (
          <TabButton
            key={tab.id}
            active={activeTab === tab.id}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon && (
              <TabIcon>{tab.icon}</TabIcon>
            )}
            {tab.label}
          </TabButton>
        ))}
      </TabsList>
      
      <TabContent>
        {children}
      </TabContent>
    </TabsContainer>
  );
};

export default SettingsTabs;