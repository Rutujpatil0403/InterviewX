// src/components/Common/Badge.jsx
import React from 'react';
import styled from 'styled-components';

const StyledBadge = styled.span`
  display: inline-flex;
  align-items: center;
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  border-radius: ${({ theme }) => theme.borderRadius.full};
  line-height: 1;
  
  /* Size variants */
  ${({ size, theme }) => {
    switch (size) {
      case 'xs':
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[2]};
          font-size: ${theme.fontSizes.xs};
        `;
      case 'sm':
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[2.5]};
          font-size: ${theme.fontSizes.xs};
        `;
      case 'md':
        return `
          padding: ${theme.spacing[4]} ${theme.spacing[3]};
          font-size: ${theme.fontSizes.sm};
        `;
      case 'lg':
        return `
          padding: ${theme.spacing[4]} ${theme.spacing[4]};
          font-size: ${theme.fontSizes.base};
        `;
      default:
        return `
          padding: ${theme.spacing[2]} ${theme.spacing[2.5]};
          font-size: ${theme.fontSizes.xs};
        `;
    }
  }}
  
  /* Color variants */
  ${({ variant, theme }) => {
    switch (variant) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary[100]};
          color: ${theme.colors.primary[800]};
        `;
      case 'secondary':
        return `
          background-color: ${theme.colors.secondary[100]};
          color: ${theme.colors.secondary[800]};
        `;
      case 'success':
        return `
          background-color: ${theme.colors.success[100]};
          color: ${theme.colors.success[800]};
        `;
      case 'warning':
        return `
          background-color: ${theme.colors.warning[100]};
          color: ${theme.colors.warning[800]};
        `;
      case 'danger':
        return `
          background-color: ${theme.colors.danger[100]};
          color: ${theme.colors.danger[800]};
        `;
      default:
        return `
          background-color: ${theme.colors.secondary[100]};
          color: ${theme.colors.secondary[800]};
        `;
    }
  }}
`;

const Badge = ({ 
  children, 
  variant = 'secondary', 
  size = 'sm',
  ...props 
}) => {
  return (
    <StyledBadge
      variant={variant}
      size={size}
      {...props}
    >
      {children}
    </StyledBadge>
  );
};

export default Badge;
