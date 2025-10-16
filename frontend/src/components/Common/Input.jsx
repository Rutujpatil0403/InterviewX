// src/components/Common/Input.jsx
import React, { forwardRef } from 'react';
import styled from 'styled-components';

const InputWrapper = styled.div`
  width: 100%;
`;

const Label = styled.label`
  display: block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.secondary[700]};
  margin-bottom: ${({ theme }) => theme.spacing[2]};
`;

const RequiredAsterisk = styled.span`
  color: ${({ theme }) => theme.colors.danger[500]};
  margin-left: ${({ theme }) => theme.spacing[1]};
`;

const InputContainer = styled.div`
  position: relative;
`;

const StyledInput = styled.input.withConfig({
  shouldForwardProp: (prop) => !['hasLeftIcon', 'hasRightIcon', 'hasError'].includes(prop),
})`
  width: 100%;
  padding: ${({ theme }) => `${theme.spacing[3]} ${theme.spacing[4]}`};
  border: 1px solid ${({ theme }) => theme.colors.secondary[300]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: 1.5;
  background-color: ${({ theme }) => theme.colors.white};
  transition: ${({ theme }) => theme.transitions.all};
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
  
  &:disabled {
    background-color: ${({ theme }) => theme.colors.secondary[50]};
    color: ${({ theme }) => theme.colors.secondary[500]};
    cursor: not-allowed;
  }
  
  &::placeholder {
    color: ${({ theme }) => theme.colors.secondary[400]};
  }
  
  ${({ hasLeftIcon, theme }) => hasLeftIcon && `
    padding-left: ${theme.spacing[10]};
  `}
  
  ${({ hasRightIcon, theme }) => hasRightIcon && `
    padding-right: ${theme.spacing[10]};
  `}
  
  ${({ hasError, theme }) => hasError && `
    border-color: ${theme.colors.danger[500]};
    
    &:focus {
      border-color: ${theme.colors.danger[500]};
      box-shadow: 0 0 0 3px ${theme.colors.danger[100]};
    }
  `}
`;

const IconWrapper = styled.div`
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  display: flex;
  align-items: center;
  pointer-events: none;
  color: ${({ theme }) => theme.colors.secondary[400]};
  
  &.left {
    left: ${({ theme }) => theme.spacing[3]};
  }
  
  &.right {
    right: ${({ theme }) => theme.spacing[3]};
  }
`;

const ErrorText = styled.p`
  margin-top: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.danger[600]};
  margin-bottom: 0;
`;

const HelperText = styled.p`
  margin-top: ${({ theme }) => theme.spacing[1]};
  font-size: ${({ theme }) => theme.fontSize.sm};
  color: ${({ theme }) => theme.colors.secondary[500]};
  margin-bottom: 0;
`;

const Input = forwardRef(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  ...props
}, ref) => {
  return (
    <InputWrapper>
      {label && (
        <Label>
          {label}
          {props.required && <RequiredAsterisk>*</RequiredAsterisk>}
        </Label>
      )}
      
      <InputContainer>
        {leftIcon && (
          <IconWrapper className="left">
            {leftIcon}
          </IconWrapper>
        )}
        
        <StyledInput
          ref={ref}
          hasLeftIcon={!!leftIcon}
          hasRightIcon={!!rightIcon}
          hasError={!!error}
          {...props}
        />
        
        {rightIcon && (
          <IconWrapper className="right">
            {rightIcon}
          </IconWrapper>
        )}
      </InputContainer>
      
      {error && (
        <ErrorText>{error}</ErrorText>
      )}
      
      {helperText && !error && (
        <HelperText>{helperText}</HelperText>
      )}
    </InputWrapper>
  );
});

Input.displayName = 'Input';

export default Input;
