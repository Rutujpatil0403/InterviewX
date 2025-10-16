// src/theme/ThemeProvider.jsx
import React from 'react';
import { ThemeProvider as StyledThemeProvider } from 'styled-components';
import { theme } from './theme';
import { GlobalStyles } from '../styles/GlobalStyles';

const ThemeProvider = ({ children }) => {
  return (
    <StyledThemeProvider theme={theme}>
      <GlobalStyles />
      {children}
    </StyledThemeProvider>
  );
};

export default ThemeProvider;