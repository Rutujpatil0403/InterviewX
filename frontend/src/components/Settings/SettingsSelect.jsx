// Settings Select Component
import React from 'react';
import styled from 'styled-components';
import { ChevronDown } from 'lucide-react';

const SelectContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const SelectLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const SelectWrapper = styled.div`
  position: relative;
`;

const StyledSelect = styled.select.withConfig({
  shouldForwardProp: (prop) => !['hasError'].includes(prop)
})`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]} ${theme.spacing[3]} ${theme.spacing[4]}`};
  padding-right: ${({ theme }) => theme.spacing[10]};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[400] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray[900]};
  cursor: pointer;
  appearance: none;
  transition: ${({ theme }) => theme.transitions.all};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.gray[50]};
    color: ${({ theme }) => theme.colors.gray[500]};
    cursor: not-allowed;
  }
`;

const SelectIcon = styled.div`
  position: absolute;
  right: ${({ theme }) => theme.spacing[3]};
  top: 50%;
  transform: translateY(-50%);
  pointer-events: none;
  color: ${({ theme }) => theme.colors.gray[400]};
`;

const SelectDescription = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.gray[600]};
  margin: 0;
  line-height: 1.4;
`;

const ErrorMessage = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.xs};
  color: ${({ theme }) => theme.colors.red[600]};
  margin: 0;
  line-height: 1.4;
`;

const SettingsSelect = ({
  id,
  label,
  description,
  options = [],
  value,
  onChange,
  error,
  disabled = false,
  placeholder = "Select an option...",
  ...props
}) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  return (
    <SelectContainer>
      {label && (
        <SelectLabel htmlFor={id}>{label}</SelectLabel>
      )}
      
      <SelectWrapper>
        <StyledSelect
          id={id}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          hasError={!!error}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </StyledSelect>
        
        <SelectIcon>
          <ChevronDown size={16} />
        </SelectIcon>
      </SelectWrapper>
      
      {description && !error && (
        <SelectDescription>{description}</SelectDescription>
      )}
      
      {error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}
    </SelectContainer>
  );
};

export default SettingsSelect;