// Real-time Integration Component demonstrating all API services
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { 
  Bell, 
  MessageCircle, 
  Calendar, 
  Users, 
  BarChart3,
  Settings,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Info
} from 'lucide-react';
import { Container, Grid, Flex, Box } from '../components/styled/Layout';
import { H1, H2, H3, Text } from '../components/styled/Typography';
import { Button, Card, Badge } from '../components/styled/Components';
import { 
  useDashboardStats, 
  useInterviews, 
  useNotifications, 
  useNotificationCount,
  useUsers 
} from '../hooks/useAPI';
import { socketService } from '../services';
import toast from 'react-hot-toast';

const IntegrationDashboard = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const ServiceCard = styled(Card)`
  transition: all 0.2s;
  border-left: 4px solid ${({ status, theme }) => {
    switch(status) {
      case 'success': return theme.colors.success[500];
      case 'error': return theme.colors.danger[500];
      case 'warning': return theme.colors.warning[500];
      default: return theme.colors.primary[500];
    }
  }};
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: ${({ theme }) => theme.shadows.lg};
  }
`;

const ServiceHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: ${({ theme }) => theme.spacing[4]};
`;

const ServiceIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  background: ${({ theme }) => theme.colors.primary[100]};
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 1.5rem;
    height: 1.5rem;
    color: ${({ theme }) => theme.colors.primary[600]};
  }
`;

const StatusIndicator = styled.div`
  width: 0.75rem;
  height: 0.75rem;
  border-radius: 50%;
  background: ${({ status, theme }) => {
    switch(status) {
      case 'success': return theme.colors.success[500];
      case 'error': return theme.colors.danger[500];
      case 'warning': return theme.colors.warning[500];
      default: return theme.colors.gray[300];
    }
  }};
  
  ${({ status }) => status === 'loading' && `
    animation: pulse 2s infinite;
  `}
`;

const DataDisplay = styled.div`
  margin-top: ${({ theme }) => theme.spacing[4]};
  padding: ${({ theme }) => theme.spacing[3]};
  background: ${({ theme }) => theme.colors.gray[50]};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  max-height: 200px;
  overflow-y: auto;
`;

const RealTimeIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing[2]};
  color: ${({ theme }) => theme.colors.success[600]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  
  &::before {
    content: '';
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.success[500]};
    animation: pulse 2s infinite;
  }
`;

const APIIntegrationDemo = () => {
  const [socketConnected, setSocketConnected] = useState(false);
  const [realTimeData, setRealTimeData] = useState({});

  // API Hooks for different services
  const dashboardQuery = useDashboardStats();
  const interviewsQuery = useInterviews({ limit: 5 });
  const usersQuery = useUsers({ limit: 5 });
  const notificationsQuery = useNotifications({ limit: 5 });
  const notificationCountQuery = useNotificationCount();

  // Socket.io integration
  useEffect(() => {
    const socket = socketService.connect();
    
    if (socket) {
      setSocketConnected(true);
      
      // Subscribe to real-time updates
      socket.on('dashboard-update', (data) => {
        setRealTimeData(prev => ({ ...prev, dashboard: data }));
        toast.success('Dashboard updated in real-time');
      });
      
      socket.on('new-interview', (data) => {
        setRealTimeData(prev => ({ ...prev, interviews: data }));
        toast.info('New interview scheduled');
        interviewsQuery.refetch();
      });
      
      socket.on('user-update', (data) => {
        setRealTimeData(prev => ({ ...prev, users: data }));
        usersQuery.refetch();
      });
      
      socket.on('notification', (data) => {
        setRealTimeData(prev => ({ ...prev, notifications: data }));
        toast(data.message, { icon: '🔔' });
        notificationsQuery.refetch();
        notificationCountQuery.refetch();
      });
    }
    
    return () => {
      if (socket) {
        socket.disconnect();
        setSocketConnected(false);
      }
    };
  }, [interviewsQuery, usersQuery, notificationsQuery, notificationCountQuery]);

  const getServiceStatus = (query) => {
    if (query.isLoading) return 'loading';
    if (query.error) return 'error';
    if (query.data) return 'success';
    return 'warning';
  };

  const formatDataPreview = (data, type) => {
    if (!data) return 'No data available';
    
    switch (type) {
      case 'dashboard':
        return `Total Interviews: ${data.totalInterviews || 0}, Active Users: ${data.activeUsers || 0}`;
      case 'interviews':
        return `${data.interviews?.length || 0} interviews found`;
      case 'users':
        return `${data.users?.length || 0} users loaded`;
      case 'notifications':
        return `${data.notifications?.length || 0} notifications, ${data.unreadCount || 0} unread`;
      default:
        return JSON.stringify(data).substring(0, 100) + '...';
    }
  };

  const services = [
    {
      name: 'Dashboard Analytics',
      icon: BarChart3,
      query: dashboardQuery,
      description: 'Real-time dashboard statistics and metrics'
    },
    {
      name: 'Interview Management',
      icon: Calendar,
      query: interviewsQuery,
      description: 'Interview scheduling and management system'
    },
    {
      name: 'User Management', 
      icon: Users,
      query: usersQuery,
      description: 'User accounts and role management'
    },
    {
      name: 'Notifications',
      icon: Bell,
      query: notificationsQuery,
      description: 'Real-time notification system'
    }
  ];

  return (
    <Container>
      <IntegrationDashboard>
        <Flex justifyContent="space-between" alignItems="center" marginBottom={8}>
          <div>
            <H1>API Integration Demo</H1>
            <Text color="secondary">
              Real-time demonstration of all backend API integrations
            </Text>
          </div>
          
          <Flex alignItems="center" gap={4}>
            {socketConnected ? (
              <RealTimeIndicator>
                <MessageCircle size={16} />
                Real-time Connected
              </RealTimeIndicator>
            ) : (
              <Flex alignItems="center" gap={2} color="warning">
                <AlertCircle size={16} />
                <Text size="sm">Socket Disconnected</Text>
              </Flex>
            )}
            
            <Button variant="outline" size="sm">
              <RefreshCw size={16} />
              Refresh All
            </Button>
          </Flex>
        </Flex>

        <Grid columns="1fr 1fr" gap={6} marginBottom={8}>
          {services.map((service, index) => {
            const status = getServiceStatus(service.query);
            const ServiceIconComponent = service.icon;
            
            return (
              <ServiceCard key={index} status={status}>
                <ServiceHeader>
                  <Flex alignItems="center" gap={3}>
                    <ServiceIcon>
                      <ServiceIconComponent />
                    </ServiceIcon>
                    <div>
                      <H3>{service.name}</H3>
                      <Text size="sm" color="secondary">
                        {service.description}
                      </Text>
                    </div>
                  </Flex>
                  
                  <StatusIndicator status={status} />
                </ServiceHeader>

                <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
                  <Badge 
                    color={status === 'success' ? 'success' : status === 'error' ? 'danger' : 'warning'}
                    size="sm"
                  >
                    {status === 'loading' ? 'Loading...' : 
                     status === 'error' ? 'Error' : 
                     status === 'success' ? 'Connected' : 'Unknown'}
                  </Badge>
                  
                  {service.query.isLoading && (
                    <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                  )}
                </Flex>

                <DataDisplay>
                  <Text size="sm" color="secondary">
                    {status === 'error' 
                      ? `Error: ${service.query.error?.message || 'Failed to load'}` 
                      : formatDataPreview(service.query.data, service.name.toLowerCase().split(' ')[0])
                    }
                  </Text>
                </DataDisplay>

                <Flex gap={2} marginTop={4}>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => service.query.refetch()}
                    disabled={service.query.isLoading}
                  >
                    <RefreshCw size={14} />
                    Refetch
                  </Button>
                  
                  {service.query.data && (
                    <Button variant="ghost" size="sm">
                      <Info size={14} />
                      Details
                    </Button>
                  )}
                </Flex>
              </ServiceCard>
            );
          })}
        </Grid>

        {/* Real-time Data Updates */}
        <Card>
          <H2 marginBottom={4}>Real-time Updates</H2>
          <Text color="secondary" marginBottom={6}>
            Live data updates received via Socket.io connection
          </Text>
          
          <Grid columns="repeat(auto-fit, minmax(300px, 1fr))" gap={4}>
            {Object.entries(realTimeData).map(([key, value]) => (
              <Box key={key} padding={4} background="gray.50" borderRadius="md">
                <Flex alignItems="center" gap={2} marginBottom={2}>
                  <CheckCircle size={16} color="success" />
                  <Text fontWeight="medium">{key.charAt(0).toUpperCase() + key.slice(1)} Update</Text>
                </Flex>
                <Text size="sm" color="secondary">
                  {typeof value === 'object' ? JSON.stringify(value).substring(0, 100) + '...' : value}
                </Text>
              </Box>
            ))}
            
            {Object.keys(realTimeData).length === 0 && (
              <Box padding={8} textAlign="center">
                <Text color="secondary">
                  No real-time updates received yet. Try performing actions in other parts of the application.
                </Text>
              </Box>
            )}
          </Grid>
        </Card>
      </IntegrationDashboard>
    </Container>
  );
};

export default APIIntegrationDemo;