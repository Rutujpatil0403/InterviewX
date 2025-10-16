// Settings Toggle Component
import React from 'react';
import styled from 'styled-components';

const ToggleContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['disabled'].includes(prop)
})`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[4]};
  border: 1px solid ${({ theme }) => theme.colors.gray[200]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background-color: ${({ theme }) => theme.colors.white};
  margin-bottom: ${({ theme }) => theme.spacing[3]};
  
  ${({ disabled }) => disabled && `
    opacity: 0.6;
    cursor: not-allowed;
  `}
  
  &:hover {
    ${({ disabled, theme }) => !disabled && `
      border-color: ${theme.colors.primary[300]};
    `}
  }
`;

const ToggleInfo = styled.div`
  flex: 1;
  margin-right: ${({ theme }) => theme.spacing[4]};
`;

const ToggleLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.gray[900]};
  display: block;
  margin-bottom: ${({ theme }) => theme.spacing[1]};
  cursor: pointer;
`;

const ToggleDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
  line-height: 1.4;
`;

const SwitchContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['checked', 'disabled'].includes(prop)
})`
  position: relative;
  width: 44px;
  height: 24px;
  background-color: ${({ checked, theme }) => 
    checked ? theme.colors.primary[600] : theme.colors.gray[300]};
  border-radius: 12px;
  cursor: ${({ disabled }) => disabled ? 'not-allowed' : 'pointer'};
  transition: background-color 0.2s ease;
  
  &:before {
    content: '';
    position: absolute;
    top: 2px;
    left: ${({ checked }) => checked ? '22px' : '2px'};
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: left 0.2s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
`;

const HiddenInput = styled.input`
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
`;

const SettingsToggle = ({ 
  id,
  label, 
  description, 
  checked, 
  onChange, 
  disabled = false,
  ...props 
}) => {
  const handleToggle = () => {
    if (!disabled) {
      onChange(!checked);
    }
  };

  return (
    <ToggleContainer disabled={disabled}>
      <ToggleInfo>
        <ToggleLabel htmlFor={id}>{label}</ToggleLabel>
        {description && (
          <ToggleDescription>{description}</ToggleDescription>
        )}
      </ToggleInfo>
      
      <SwitchContainer 
        checked={checked} 
        disabled={disabled}
        onClick={handleToggle}
        {...props}
      >
        <HiddenInput
          id={id}
          type="checkbox"
          checked={checked}
          onChange={handleToggle}
          disabled={disabled}
        />
      </SwitchContainer>
    </ToggleContainer>
  );
};

export default SettingsToggle;