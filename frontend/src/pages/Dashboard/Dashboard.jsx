import React from 'react';
import styled from 'styled-components';
import { 
  Calendar, 
  CheckCircle,
  Plus,
  BarChart3,
  Activity,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Briefcase,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { useDashboardStats, useInterviews } from '../../hooks/useAPI';
import { Container, Flex, Box, Grid } from '../../components/styled/Layout';
import { H1, H3, Text } from '../../components/styled/Typography';
import { Button, Card } from '../../components/styled/Components';

const WelcomeSection = styled.div`
  background: linear-gradient(135deg, #3b82f6, #1d4ed8);
  border-radius: 0.75rem;
  padding: 2rem 1.5rem;
  color: white;
  margin-bottom: 2rem;
`;

const StatsGrid = styled(Grid)`
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  transition: all 0.2s;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  }
`;

const StatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const StatIcon = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${({ color }) => {
    const colors = {
      primary: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
      success: 'linear-gradient(135deg, #10b981, #059669)',
      warning: 'linear-gradient(135deg, #f59e0b, #d97706)',
      danger: 'linear-gradient(135deg, #ef4444, #dc2626)'
    };
    return colors[color] || colors.primary;
  }};
  
  svg {
    width: 1.5rem;
    height: 1.5rem;
    color: white;
  }
`;

const StatValue = styled.div`
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 0.25rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const StatChange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.875rem;
  color: ${({ isPositive }) => isPositive ? '#059669' : '#dc2626'};
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const ChartContainer = styled(Grid)`
  grid-template-columns: 2fr 1fr;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const QuickActions = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 1.5rem;
`;

const ActionList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
`;

const ActionItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background-color: #f9fafb;
  border-radius: 0.5rem;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f3f4f6;
  }
`;

const ActionInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
`;

const ActionIcon = styled.div`
  width: 2.5rem;
  height: 2.5rem;
  border-radius: 0.5rem;
  background-color: #dbeafe;
  display: flex;
  align-items: center;
  justify-content: center;
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: #2563eb;
  }
`;

const ActionTitle = styled.div`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const ActionMeta = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const PlaceholderChart = styled.div`
  height: 200px;
  background: linear-gradient(135deg, #f9fafb, #f3f4f6);
  border-radius: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.875rem;
  border: 2px dashed #d1d5db;
`;

const Dashboard = () => {
  const { user } = useAuth();
  
  // Fetch dashboard statistics
  const { 
    data: dashboardStats, 
    isLoading: statsLoading, 
    error: statsError 
  } = useDashboardStats();
  
  // Fetch upcoming interviews
  const { 
    data: interviewsData, 
    isLoading: interviewsLoading 
  } = useInterviews({ 
    status: 'scheduled', 
    limit: 3,
    startDate: new Date().toISOString().split('T')[0] // Today onwards
  });

  // Process data
  const stats = dashboardStats || {
    totalInterviews: 0,
    scheduledToday: 0,
    completedThisWeek: 0,
    averageRating: 0,
    monthlyGrowth: 0,
    todayGrowth: 0,
    weeklyGrowth: 0,
    ratingGrowth: 0
  };

  const upcomingInterviews = interviewsData?.interviews || [];
  const recentActivities = dashboardStats?.recentActivities || [];

  // Loading state
  if (statsLoading || interviewsLoading) {
    return (
      <Container>
        <Box padding={8} textAlign="center">
          <Text>Loading dashboard...</Text>
        </Box>
      </Container>
    );
  }

  // Error state
  if (statsError) {
    return (
      <Container>
        <Box padding={8} textAlign="center">
          <AlertCircle size={48} style={{ color: '#ef4444', margin: '0 auto 1rem' }} />
          <Text color="danger">Failed to load dashboard data</Text>
          <Button variant="outline" style={{ marginTop: '1rem' }}>
            Retry
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container>
      <WelcomeSection>
        <H1 style={{ color: 'white', marginBottom: '0.5rem' }}>
          Welcome back, {user?.name || 'User'}! 👋
        </H1>
        <Text style={{ color: 'rgba(255,255,255,0.9)', fontSize: '1.1rem' }}>
          Here's what's happening with your interviews today
        </Text>
      </WelcomeSection>

      <StatsGrid>
        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{stats.totalInterviews}</StatValue>
              <StatLabel>Total Interviews</StatLabel>
            </div>
            <StatIcon color="primary">
              <Briefcase />
            </StatIcon>
          </StatHeader>
          <StatChange isPositive={stats.monthlyGrowth >= 0}>
            {stats.monthlyGrowth >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
            {stats.monthlyGrowth >= 0 ? '+' : ''}{stats.monthlyGrowth}% from last month
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{stats.scheduledToday}</StatValue>
              <StatLabel>Scheduled Today</StatLabel>
            </div>
            <StatIcon color="success">
              <Calendar />
            </StatIcon>
          </StatHeader>
          <StatChange isPositive={stats.todayGrowth >= 0}>
            {stats.todayGrowth >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
            {stats.todayGrowth >= 0 ? '+' : ''}{stats.todayGrowth} from yesterday
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{stats.completedThisWeek}</StatValue>
              <StatLabel>Completed This Week</StatLabel>
            </div>
            <StatIcon color="warning">
              <CheckCircle />
            </StatIcon>
          </StatHeader>
          <StatChange isPositive={stats.weeklyGrowth >= 0}>
            {stats.weeklyGrowth >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
            {stats.weeklyGrowth >= 0 ? '+' : ''}{stats.weeklyGrowth}% from last week
          </StatChange>
        </StatCard>

        <StatCard>
          <StatHeader>
            <div>
              <StatValue>{stats.averageRating?.toFixed(1) || '0.0'}</StatValue>
              <StatLabel>Average Rating</StatLabel>
            </div>
            <StatIcon color="danger">
              <Star />
            </StatIcon>
          </StatHeader>
          <StatChange isPositive={stats.ratingGrowth >= 0}>
            {stats.ratingGrowth >= 0 ? <ArrowUpRight /> : <ArrowDownRight />}
            {stats.ratingGrowth >= 0 ? '+' : ''}{stats.ratingGrowth?.toFixed(1) || '0.0'} from last month
          </StatChange>
        </StatCard>
      </StatsGrid>

      <ChartContainer>
        <Card>
          <Flex justifyContent="space-between" alignItems="center" marginBottom={6}>
            <div>
              <H3>Interview Analytics</H3>
              <Text color="secondary">Monthly performance overview</Text>
            </div>
            <Button variant="outline" size="sm">
              <BarChart3 size={16} />
              View Details
            </Button>
          </Flex>
          <PlaceholderChart>
            📊 Chart visualization will be implemented here
          </PlaceholderChart>
        </Card>

        <Card>
          <Flex justifyContent="space-between" alignItems="center" marginBottom={6}>
            <div>
              <H3>Success Rate</H3>
              <Text color="secondary">Candidate performance</Text>
            </div>
          </Flex>
          <PlaceholderChart>
            🥧 Pie chart showing success rates
          </PlaceholderChart>
        </Card>
      </ChartContainer>

      <QuickActions>
        <Card>
          <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
            <H3>Recent Activity</H3>
            <Button variant="ghost" size="sm">View All</Button>
          </Flex>
          
          <ActionList>
            {recentActivities.length > 0 ? recentActivities.map((activity) => (
              <ActionItem key={activity.id}>
                <ActionInfo>
                  <ActionIcon>
                    <Activity />
                  </ActionIcon>
                  <div>
                    <ActionTitle>{activity.title}</ActionTitle>
                    <ActionMeta>{activity.time}</ActionMeta>
                  </div>
                </ActionInfo>
              </ActionItem>
            )) : (
              <Text color="secondary" style={{ textAlign: 'center', padding: '2rem' }}>
                No recent activity
              </Text>
            )}
          </ActionList>
        </Card>

        <Card>
          <Flex justifyContent="space-between" alignItems="center" marginBottom={4}>
            <H3>Upcoming Interviews</H3>
            <Button variant="primary" size="sm">
              <Plus size={16} />
              Schedule New
            </Button>
          </Flex>
          
          <ActionList>
            {upcomingInterviews.length > 0 ? upcomingInterviews.map((interview) => (
              <ActionItem key={interview.id}>
                <ActionInfo>
                  <ActionIcon>
                    <UserCheck />
                  </ActionIcon>
                  <div>
                    <ActionTitle>{interview.candidateName || 'Candidate Name'}</ActionTitle>
                    <ActionMeta>
                      {interview.position || 'Position'} • {' '}
                      {new Date(interview.scheduledDate).toLocaleTimeString('en-US', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })} {' '}
                      {new Date(interview.scheduledDate).toDateString() === new Date().toDateString() 
                        ? 'Today' 
                        : new Date(interview.scheduledDate).toLocaleDateString()
                      }
                    </ActionMeta>
                  </div>
                </ActionInfo>
              </ActionItem>
            )) : (
              <Text color="secondary" style={{ textAlign: 'center', padding: '2rem' }}>
                No upcoming interviews
              </Text>
            )}
          </ActionList>
        </Card>
      </QuickActions>
    </Container>
  );
};

export default Dashboard;