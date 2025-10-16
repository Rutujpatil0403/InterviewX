import React from "react";
import styled, { keyframes } from "styled-components";

const spin = keyframes`
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
`;

const SpinnerContainer = styled.div.withConfig({
  shouldForwardProp: (prop) => !['fullScreen'].includes(prop)
})`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  min-height: ${({ fullScreen }) => fullScreen ? "100vh" : "200px"};
`;

const Spinner = styled.div`
  border-radius: 50%;
  border-style: solid;
  border-color: ${({ theme }) => theme.colors.gray[200]};
  border-top-color: ${({ theme }) => theme.colors.primary[600]};
  animation: ${spin} 1s linear infinite;
  
  ${({ size }) => {
    switch (size) {
      case "small":
        return `
          width: 1rem;
          height: 1rem;
          border-width: 2px;
        `;
      case "large":
        return `
          width: 3rem;
          height: 3rem;
          border-width: 3px;
        `;
      default:
        return `
          width: 2rem;
          height: 2rem;
          border-width: 2px;
        `;
    }
  }}
`;

const LoadingText = styled.p`
  margin-top: 1rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
`;

const LoadingSpinner = ({ 
  size = "medium", 
  text = "", 
  fullScreen = false,
  className 
}) => {
  return (
    <SpinnerContainer fullScreen={fullScreen} className={className}>
      <div style={{ textAlign: "center" }}>
        <Spinner size={size} />
        {text && <LoadingText>{text}</LoadingText>}
      </div>
    </SpinnerContainer>
  );
};

export default LoadingSpinner;
