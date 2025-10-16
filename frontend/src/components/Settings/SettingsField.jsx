// Settings Form Field Component
import React from 'react';
import styled from 'styled-components';

const FieldContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing[2]};
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const FieldLabel = styled.label`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.gray[700]};
`;

const RequiredAsterisk = styled.span`
  color: ${({ theme }) => theme.colors.danger[500]};
  margin-left: ${({ theme }) => theme.spacing[1]};
`;

const StyledInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !['hasError'].includes(prop)
})`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[400] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray[900]};
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
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const StyledTextarea = styled.textarea.withConfig({
  shouldForwardProp: (prop) => !['hasError'].includes(prop)
})`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border: 1px solid ${({ theme, hasError }) => 
    hasError ? theme.colors.red[400] : theme.colors.gray[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  background-color: ${({ theme }) => theme.colors.white};
  color: ${({ theme }) => theme.colors.gray[900]};
  resize: vertical;
  min-height: 100px;
  font-family: inherit;
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
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.gray[400]};
  }
`;

const FieldDescription = styled.p`
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

const SettingsField = ({
  id,
  label,
  description,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  placeholder,
  multiline = false,
  rows = 4,
  ...props
}) => {
  const handleChange = (e) => {
    onChange(e.target.value);
  };

  const InputComponent = multiline ? StyledTextarea : StyledInput;

  return (
    <FieldContainer>
      {label && (
        <FieldLabel htmlFor={id}>
          {label}
          {required && <RequiredAsterisk>*</RequiredAsterisk>}
        </FieldLabel>
      )}
      
      <InputComponent
        id={id}
        type={multiline ? undefined : type}
        rows={multiline ? rows : undefined}
        value={value}
        onChange={handleChange}
        placeholder={placeholder}
        disabled={disabled}
        hasError={!!error}
        required={required}
        {...props}
      />
      
      {description && !error && (
        <FieldDescription>{description}</FieldDescription>
      )}
      
      {error && (
        <ErrorMessage>{error}</ErrorMessage>
      )}
    </FieldContainer>
  );
};

export default SettingsField;