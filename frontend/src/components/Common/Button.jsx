// src/components/Common/Button.jsx
import React from 'react';
import styled from 'styled-components';
import LoadingSpinner from './LoadingSpinner';

const StyledButton = styled.button.withConfig({
  shouldForwardProp: (prop) => !['size', 'variant', 'loading', 'fullWidth'].includes(prop)
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: ${({ theme }) => theme.borderRadius.md};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  transition: ${({ theme }) => theme.transitions.all};
  border: 1px solid transparent;
  cursor: pointer;
  text-decoration: none;
  outline: none;
  
  &:focus {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  /* Size variants */
  ${({ size, theme }) => {
    switch (size) {
      case 'xs':
        return `
          padding: ${theme.spacing[1]} ${theme.spacing[2]};
          font-size: ${theme.fontSizes.xs};
          line-height: 1.25rem;
        `;
      case 'sm':
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[3]};
          font-size: ${theme.fontSizes.sm};
          line-height: 1.25rem;
        `;
      case 'md':
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[4]};
          font-size: ${theme.fontSizes.sm};
          line-height: 1.5rem;
        `;
      case 'lg':
        return `
          padding: ${theme.spacing[3]} ${theme.spacing[6]};
          font-size: ${theme.fontSizes.base};
          line-height: 1.5rem;
        `;
      case 'xl':
        return `
          padding: ${theme.spacing[4]} ${theme.spacing[8]};
          font-size: ${theme.fontSizes.lg};
          line-height: 1.75rem;
        `;
      default:
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[4]};
          font-size: ${theme.fontSizes.sm};
          line-height: 1.5rem;
        `;
    }
  }}
  
  /* Color variants */
  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary[600]};
          color: ${theme.colors.white};
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary[700]};
          }
          
          &:active:not(:disabled) {
            background-color: ${theme.colors.primary[800]};
          }
        `;
      case 'secondary':
        return `
          background-color: ${theme.colors.secondary[100]};
          color: ${theme.colors.secondary[900]};
          border-color: ${theme.colors.secondary[300]};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.secondary[200]};
          }
          
          &:active:not(:disabled) {
            background-color: ${theme.colors.secondary[300]};
          }
        `;
      case 'outline':
        return `
          background-color: transparent;
          color: ${theme.colors.primary[600]};
          border-color: ${theme.colors.primary[600]};
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary[50]};
          }
          
          &:active:not(:disabled) {
            background-color: ${theme.colors.primary[100]};
          }
        `;
      case 'ghost':
        return `
          background-color: transparent;
          color: ${theme.colors.secondary[600]};
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.secondary[100]};
          }
          
          &:active:not(:disabled) {
            background-color: ${theme.colors.secondary[200]};
          }
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.danger[600]};
          color: ${theme.colors.white};
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.danger[700]};
          }
          
          &:active:not(:disabled) {
            background-color: ${theme.colors.danger[800]};
          }
        `;
      default:
        return `
          background-color: ${theme.colors.primary[600]};
          color: ${theme.colors.white};
          border-color: transparent;
          
          &:hover:not(:disabled) {
            background-color: ${theme.colors.primary[700]};
          }
          
          &:active:not(:disabled) {
            background-color: ${theme.colors.primary[800]};
          }
        `;
    }
  }}
`;

const IconWrapper = styled.span`
  display: inline-flex;
  align-items: center;
  
  &.left {
    margin-right: ${({ theme }) => theme.spacing[2]};
  }
  
  &.right {
    margin-left: ${({ theme }) => theme.spacing[2]};
  }
`;

const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  ...props
}) => {
  const isDisabled = disabled || loading;

  return (
    <StyledButton
      variant={variant}
      size={size}
      disabled={isDisabled}
      {...props}
    >
      {loading ? (
        <>
          <LoadingSpinner size="small" style={{ marginRight: '0.5rem' }} />
          Loading...
        </>
      ) : (
        <>
          {leftIcon && <IconWrapper className="left">{leftIcon}</IconWrapper>}
          {children}
          {rightIcon && <IconWrapper className="right">{rightIcon}</IconWrapper>}
        </>
      )}
    </StyledButton>
  );
};

export default Button;
