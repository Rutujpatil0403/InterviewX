// src/components/Layout/Layout.jsx
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import Header from './Header';
import Sidebar from './Sidebar';

const LayoutContainer = styled.div`
  display: flex;
  height: 100vh;
  background-color: ${({ theme }) => theme.colors.background.secondary};
`;

const MainContent = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
`;

const PageContent = styled.main`
  flex: 1;
  overflow-y: auto;
`;

const ContentContainer = styled.div`
  max-width: 80rem;
  margin: 0 auto;
  padding: ${({ theme }) => `${theme.spacing[6]} ${theme.spacing[4]}`};
`;

const Layout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Close sidebar on route change (mobile)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  const closeSidebar = () => {
    setSidebarOpen(false);
  };

  return (
    <LayoutContainer>
      <Sidebar isOpen={sidebarOpen} onClose={closeSidebar} />

      <MainContent>
        <Header 
          onToggleSidebar={toggleSidebar} 
          sidebarOpen={sidebarOpen}
        />

        <PageContent>
          <ContentContainer>
            {children}
          </ContentContainer>
        </PageContent>
      </MainContent>
    </LayoutContainer>
  );
};

export default Layout;
