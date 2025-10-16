// src/components/Common/Card.jsx
import React from 'react';
import styled from 'styled-components';

const StyledCard = styled.div.withConfig({
  shouldForwardProp: (prop) => !['padding', 'variant'].includes(prop),
})`
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  border: 1px solid ${({ theme }) => theme.colors.secondary[200]};
  overflow: hidden;
  
  ${({ padding, theme }) => padding && `
    padding: ${theme.spacing[6]};
  `}
`;

const StyledCardHeader = styled.div`
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[6]}`};
  border-bottom: 1px solid ${({ theme }) => theme.colors.secondary[200]};
  background-color: ${({ theme }) => theme.colors.secondary[50]};
  
  h1, h2, h3, h4, h5, h6 {
    margin: 0;
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.secondary[900]};
  }
`;

const StyledCardBody = styled.div`
  padding: ${({ theme }) => `${theme.spacing[6]}`};
  
  &:first-child {
    padding-top: ${({ theme }) => theme.spacing[6]};
  }
  
  &:last-child {
    padding-bottom: ${({ theme }) => theme.spacing[6]};
  }
`;

const StyledCardFooter = styled.div`
  padding: ${({ theme }) => `${theme.spacing[4]} ${theme.spacing[6]}`};
  border-top: 1px solid ${({ theme }) => theme.colors.secondary[200]};
  background-color: ${({ theme }) => theme.colors.secondary[50]};
  
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.spacing[3]};
`;

const Card = ({ children, padding = true, ...props }) => {
  return (
    <StyledCard padding={padding} {...props}>
      {children}
    </StyledCard>
  );
};

const CardHeader = ({ children, ...props }) => {
  return (
    <StyledCardHeader {...props}>
      {children}
    </StyledCardHeader>
  );
};

const CardBody = ({ children, ...props }) => {
  return (
    <StyledCardBody {...props}>
      {children}
    </StyledCardBody>
  );
};

const CardFooter = ({ children, ...props }) => {
  return (
    <StyledCardFooter {...props}>
      {children}
    </StyledCardFooter>
  );
};

Card.Header = CardHeader;
Card.Body = CardBody;
Card.Footer = CardFooter;

export default Card;
