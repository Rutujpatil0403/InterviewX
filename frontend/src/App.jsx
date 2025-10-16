// src/App.jsx
import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';
import { testBackendConnection } from './utils/testConnection';
import { ThemeProvider } from 'styled-components';
import { theme } from './theme/theme';
import { GlobalStyles } from './styles/GlobalStyles';

// Layout Components
import Layout from './components/Layout/Layout';
import PublicLayout from './components/Layout/PublicLayout';

// Page Components
import { SocketProvider } from './context/Socket';
import { PeerProvider } from './context/Peers';
import Home from './pages/Home';
import Login from './pages/Auth/Login';
import Register from './pages/Auth/Register';
import Dashboard from './pages/Dashboard/Dashboard';
import Interviews from './pages/Interviews/Interviews';
import InterviewDetail from './pages/Interviews/InterviewDetail';
import InterviewRoom from './pages/Interviews/InterviewRoom';
import AIInterviewRoom from './pages/AIInterview/AIInterviewRoom';
import Templates from './pages/Templates/Templates';
import TemplateDetail from './pages/Templates/TemplateDetail';
import Analytics from './pages/Analytics/Analytics';
import Profile from './pages/Profile/Profile';
import UserManagement from './pages/Admin/UserManagement';
import APIIntegrationDemo from './pages/APIIntegrationDemo';
import Settings from './pages/Settings/Settings';
import InterviewRoomTest from './pages/InterviewRoomTest';
import NotFound from './pages/NotFound';
// import Templates from './pages/Templates/Templates';
// import TemplateDetail from './pages/Templates/TemplateDetail';
import TemplateForm from './pages/Templates/TemplateForm';

// Loading Component
import LoadingSpinner from './components/Common/LoadingSpinner';

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirect to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <LoadingSpinner />;
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : children;
};

function AppContent() {
  useEffect(() => {
    // Test backend connection on app startup with better error handling
    const testConnection = async () => {
      try {
        const result = await testBackendConnection();
        if (result.success) {
          console.log('✅ Backend connection established successfully');
        } else {
          console.error('❌ Backend connection failed:', result.error);
        }
      } catch (error) {
        console.error('❌ Connection test failed:', error);
      }
    };

    // Run connection test after a short delay to let app initialize
    const timer = setTimeout(testConnection, 2000);
    return () => clearTimeout(timer);
  }, []);

  return (

    <Router>
      <Routes>
        {/* Public Routes */}
        <Route
          path="/"
          element={
            <PublicLayout>
              <Home />
            </PublicLayout>
          }
        />
        <Route
          path="/login"
          element={
            <PublicRoute>
              <PublicLayout>
                <Login />
              </PublicLayout>
            </PublicRoute>
          }
        />
        <Route
          path="/register"
          element={
            <PublicRoute>
              <PublicLayout>
                <Register />
              </PublicLayout>
            </PublicRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews"
          element={
            <ProtectedRoute>
              <Layout>
                <Interviews />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <InterviewDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/:id/edit"
          element={
            <ProtectedRoute>
              <TemplateForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/create"
          element={
            <ProtectedRoute>
              <TemplateForm />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews/:id/room"
          element={
            <ProtectedRoute>
              <InterviewRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews/:id/ai-room"
          element={
            <ProtectedRoute>
              <AIInterviewRoom />
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates"
          element={
            <ProtectedRoute>
              <Layout>
                <Templates />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/templates/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <TemplateDetail />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <Layout>
                <Analytics />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Layout>
                <Settings />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/integration-demo"
          element={
            <ProtectedRoute>
              <Layout>
                <APIIntegrationDemo />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/interview-room-test"
          element={
            <ProtectedRoute>
              <Layout>
                <InterviewRoomTest />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* 404 Route */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>

  );
}

function App() {
  return (
    <PeerProvider>

      <SocketProvider>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider theme={theme}>
            <GlobalStyles />
            <AuthProvider>
              <AppContent />
              <Toaster
                position="top-right"
                toastOptions={{
                  duration: 4000,
                  style: {
                    background: '#363636',
                    color: '#fff',
                    fontFamily: 'Inter, sans-serif',
                  },
                  success: {
                    duration: 3000,
                    iconTheme: {
                      primary: '#10b981',
                      secondary: '#fff',
                    },
                  },
                  error: {
                    duration: 5000,
                    iconTheme: {
                      primary: '#ef4444',
                      secondary: '#fff',
                    },
                  },
                }}
              />
            </AuthProvider>
          </ThemeProvider>
        </QueryClientProvider>
      </SocketProvider>
    </PeerProvider>
  );
}

export default App;
