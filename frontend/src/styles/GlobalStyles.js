import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  /* CSS Reset */
  *, *::before, *::after {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
    font-size: 16px;
    line-height: 1.5;
    -webkit-text-size-adjust: 100%;
    -webkit-tap-highlight-color: transparent;
  }

  body {
    font-family: ${({ theme }) => theme.fonts.primary};
    font-weight: ${({ theme }) => theme.fontWeights.normal};
    color: ${({ theme }) => theme.colors.text.primary};
    background-color: ${({ theme }) => theme.colors.background.secondary};
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
    overflow-x: hidden;
  }

  /* Remove default button styles */
  button {
    border: none;
    outline: none;
    cursor: pointer;
    background: transparent;
    font-family: inherit;
    font-size: inherit;
  }

  /* Remove default input styles */
  input, textarea, select {
    border: none;
    outline: none;
    font-family: inherit;
    font-size: inherit;
  }

  /* Remove default link styles */
  a {
    text-decoration: none;
    color: inherit;
  }

  /* Remove default list styles */
  ul, ol {
    list-style: none;
  }

  /* Remove default fieldset styles */
  fieldset {
    border: none;
  }

  /* Custom scrollbar styles */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[100]};
    border-radius: 3px;
  }

  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray[300]};
    border-radius: 3px;
    
    &:hover {
      background: ${({ theme }) => theme.colors.gray[400]};
    }
  }

  /* Selection styles */
  ::selection {
    background: ${({ theme }) => theme.colors.primary[100]};
    color: ${({ theme }) => theme.colors.primary[800]};
  }

  ::-moz-selection {
    background: ${({ theme }) => theme.colors.primary[100]};
    color: ${({ theme }) => theme.colors.primary[800]};
  }

  /* Focus styles for accessibility */
  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.primary[500]};
    outline-offset: 2px;
  }

  /* Animations */
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateX(-20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.9);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  @keyframes spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }

  @keyframes pulse {
    0%, 100% {
      opacity: 1;
    }
    50% {
      opacity: 0.7;
    }
  }

  /* Utility classes */
  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slideIn {
    animation: slideIn 0.3s ease-out;
  }

  .animate-scaleIn {
    animation: scaleIn 0.2s ease-out;
  }

  .animate-spin {
    animation: spin 1s linear infinite;
  }

  .animate-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
  }

  /* Screen reader only */
  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* Disable animations for users who prefer reduced motion */
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;