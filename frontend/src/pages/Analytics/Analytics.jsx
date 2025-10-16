import React, { useState, useEffect } from "react";
import { Calendar, TrendingUp, Users, Clock, Award, Filter, Download, AlertCircle, X, ExternalLink } from "lucide-react";
import styled from "styled-components";
import { Button, Card, Badge } from "../../components/styled/Components";
import { Select } from "../../components/styled/FormElements";
import { H1, H2, H3, Text } from "../../components/styled/Typography";
import { Container } from "../../components/styled/Layout";
import { analyticsAPI } from "../../services/analyticsAPI";
import { useAuth } from "../../hooks/useAuth";
import { toast } from "react-hot-toast";

const AnalyticsContainer = styled(Container)`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 1rem;
    align-items: flex-start;
  }
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  
  @media (max-width: 768px) {
    width: 100%;
    justify-content: flex-start;
  }
`;

const FiltersSection = styled.div`
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 2rem;
  border: 1px solid #e2e8f0;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
`;

const FiltersGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  align-items: end;
`;

const MetricsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 1.5rem;
  margin-bottom: 2rem;
`;

const MetricCard = styled(Card)`
  padding: 1.5rem;
  background: linear-gradient(135deg, #ffffff, #f8fafc);
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
  }
`;

const MetricHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const MetricIcon = styled.div`
  width: 3rem;
  height: 3rem;
  background: ${props => props.bgColor || "#e5e7eb"};
  color: ${props => props.color || "#6b7280"};
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1rem;
  
  svg {
    width: 1.5rem;
    height: 1.5rem;
  }
`;

const MetricValue = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const MetricLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
  margin-bottom: 0.5rem;
`;

const MetricChange = styled.div`
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.75rem;
  color: ${props => props.positive ? "#10b981" : "#ef4444"};
  
  svg {
    width: 0.875rem;
    height: 0.875rem;
  }
`;

const ChartsGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const ChartCard = styled(Card)`
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
`;

const ChartHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const ChartPlaceholder = styled.div`
  height: 300px;
  background: linear-gradient(135deg, #f8fafc, #e2e8f0);
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #6b7280;
  font-size: 0.875rem;
  border: 2px dashed #d1d5db;
`;

const TableCard = styled(Card)`
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
`;

const InterviewResultsSection = styled.div`
  margin-bottom: 2rem;
`;

const SectionGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1.5rem;
  margin-bottom: 2rem;
  
  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const InterviewCard = styled(Card)`
  padding: 1.5rem;
  border: 1px solid #e2e8f0;
  transition: all 0.3s;
  cursor: pointer;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const CandidateProfile = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const CandidateAvatar = styled.div`
  width: 3rem;
  height: 3rem;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 600;
  font-size: 1.125rem;
`;

const CandidateInfo = styled.div`
  flex: 1;
`;

const CandidateName = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const CandidateEmail = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
`;

const InterviewMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
  font-size: 0.875rem;
  color: #6b7280;
`;

const ScoreDisplay = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: ${props => {
    const score = props.score || 0;
    if (score >= 80) return '#10b981';
    if (score >= 60) return '#f59e0b';
    return '#ef4444';
  }};
`;

const AnswerPreview = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1rem;
  margin-bottom: 1rem;
  border-left: 3px solid #e2e8f0;
`;

const QuestionText = styled.div`
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
`;

const AnswerText = styled.div`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  max-height: 4rem;
  overflow: hidden;
  position: relative;
  
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    right: 0;
    width: 20px;
    height: 1rem;
    background: linear-gradient(to right, transparent, #f8fafc);
  }
`;

const AIInsights = styled.div`
  background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
  border-radius: 8px;
  padding: 1rem;
  border: 1px solid #0ea5e9;
`;

const InsightLabel = styled.div`
  font-size: 0.75rem;
  font-weight: 600;
  color: #0369a1;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.5rem;
`;

const InsightText = styled.div`
  color: #374151;
  font-size: 0.875rem;
  line-height: 1.4;
`;

const TabNavigation = styled.div`
  display: flex;
  border-bottom: 1px solid #e2e8f0;
  margin-bottom: 1.5rem;
`;

const TabButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: none;
  background: none;
  color: ${props => props.active ? '#3b82f6' : '#6b7280'};
  font-weight: ${props => props.active ? '600' : '400'};
  border-bottom: 2px solid ${props => props.active ? '#3b82f6' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    color: #3b82f6;
  }
`;

const ViewDetailsButton = styled(Button)`
  width: 100%;
  margin-top: 1rem;
`;

// Modal Components
const ModalOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 12px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  max-width: 4xl;
  width: 100%;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
`;

const ModalHeader = styled.div`
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e2e8f0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
`;

const ModalTitle = styled.h2`
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  
  &:hover {
    background: #f3f4f6;
    color: #374151;
  }
`;

const ModalBody = styled.div`
  padding: 2rem;
  flex: 1;
  overflow-y: auto;
`;

const InterviewDetailsGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  margin-bottom: 2rem;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const DetailCard = styled.div`
  background: #f8fafc;
  border-radius: 8px;
  padding: 1.5rem;
`;

const DetailLabel = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  margin-bottom: 0.5rem;
`;

const DetailValue = styled.div`
  font-size: 1rem;
  color: #1f2937;
  font-weight: 500;
`;

const QuestionsContainer = styled.div`
  margin-top: 2rem;
`;

const QuestionItem = styled.div`
  background: white;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1rem;
`;

const QuestionTitle = styled.div`
  font-weight: 600;
  color: #1f2937;
  margin-bottom: 1rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const AnswerContent = styled.div`
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1rem;
`;

const AnswerMeta = styled.div`
  display: flex;
  gap: 1rem;
  align-items: center;
  font-size: 0.875rem;
  color: #6b7280;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
`;

const ScoreBadge = styled.div`
  background: ${props => {
    const score = props.score || 0;
    if (score >= 8) return '#10b981';
    if (score >= 6) return '#f59e0b';
    return '#ef4444';
  }};
  color: white;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 500;
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 3rem 1rem;
  color: #6b7280;
  
  svg {
    margin-bottom: 1rem;
    opacity: 0.5;
  }
`;

const TableHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
`;

const TableHead = styled.thead`
  tr {
    border-bottom: 1px solid #e5e7eb;
  }
  
  th {
    text-align: left;
    padding: 0.75rem 0;
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }
`;

const TableBody = styled.tbody`
  tr {
    border-bottom: 1px solid #f3f4f6;
    
    &:hover {
      background: #f9fafb;
    }
  }
  
  td {
    padding: 0.75rem 0;
    font-size: 0.875rem;
    color: #6b7280;
  }
`;

const PositionName = styled.div`
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 0.25rem;
`;

const Department = styled.div`
  font-size: 0.75rem;
  color: #6b7280;
`;

const LoadingState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 3rem;
  color: #6b7280;
`;

const ErrorState = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  flex-direction: column;
  padding: 3rem;
  color: #ef4444;
  text-align: center;
  
  svg {
    margin-bottom: 1rem;
  }
`;

const Analytics = () => {
  const [timeRange, setTimeRange] = useState("30");
  const [department, setDepartment] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [interviewAnalytics, setInterviewAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");
  const [interviewAnswers, setInterviewAnswers] = useState([]);
  const [aiResults, setAiResults] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [selectedInterview, setSelectedInterview] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { user } = useAuth();

  // Show role-based analytics description
  const getAnalyticsDescription = () => {
    if (user?.role === 'Recruiter') {
      return 'Track your interview performance and candidate insights';
    }
    return 'Track interview performance and insights across the platform';
  };

  // Calculate date range based on timeRange
  const getDateRange = (range) => {
    const endDate = new Date();
    const startDate = new Date();
    
    switch (range) {
      case "7":
        startDate.setDate(endDate.getDate() - 7);
        break;
      case "30":
        startDate.setDate(endDate.getDate() - 30);
        break;
      case "90":
        startDate.setDate(endDate.getDate() - 90);
        break;
      case "365":
        startDate.setDate(endDate.getDate() - 365);
        break;
      default:
        startDate.setDate(endDate.getDate() - 30);
    }
    
    return { startDate: startDate.toISOString(), endDate: endDate.toISOString() };
  };

  // Fetch analytics data
  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { startDate, endDate } = getDateRange(timeRange);
      const params = {
        startDate,
        endDate,
        ...(department !== "all" && { department }),
        ...(user?.role === 'Recruiter' && { recruiterId: user._id })
      };

      // Fetch dashboard stats and interview analytics
      const dashboardPromise = analyticsAPI.getDashboardStats(timeRange);
      
      // Only fetch interview analytics for Recruiters and Admins
      const interviewPromise = (user?.role === 'Recruiter' || user?.role === 'Admin') 
        ? analyticsAPI.getInterviewAnalytics(params)
        : Promise.resolve({ data: { analytics: { positionStats: [], departmentStats: [] } } });

      const [dashboardResponse, interviewResponse] = await Promise.all([
        dashboardPromise,
        interviewPromise
      ]);

      console.log('Dashboard Response:', dashboardResponse);
      console.log('Interview Response:', interviewResponse);
      
      const dashboardStats = dashboardResponse.data?.stats || dashboardResponse.stats || dashboardResponse;
      const interviewStats = interviewResponse.data?.analytics || interviewResponse.analytics || interviewResponse;
      
      console.log('Processed Dashboard Data:', dashboardStats);
      console.log('Processed Interview Data:', interviewStats);

      setDashboardData(dashboardStats);
      setInterviewAnalytics(interviewStats);
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      let errorMessage = 'Failed to load analytics data. Please try again.';
      
      if (err.response?.status === 404) {
        errorMessage = 'Analytics service not available. Please contact support.';
      } else if (err.response?.status === 403) {
        errorMessage = `Access denied. ${user?.role || 'Your role'} users may have limited analytics access.`;
      } else if (err.response?.status === 400) {
        errorMessage = 'Invalid request parameters. Please refresh the page.';
      } else if (err.response?.status === 500) {
        errorMessage = 'Server error. Please try again later.';
      }
      
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Fetch interview answers with candidate profiles
  const fetchInterviewAnswers = async () => {
    try {
      setLoadingAnswers(true);
      
      const params = {
        ...getDateRange(timeRange),
        ...(department !== "all" && { department }),
        ...(user?.role === 'Recruiter' && { recruiterId: user._id })
      };

      const response = await analyticsAPI.getInterviewAnswers(params);
      setInterviewAnswers(response.data?.answers || response.answers || []);
    } catch (error) {
      console.error('Error fetching interview answers:', error);
      setInterviewAnswers([]);
    } finally {
      setLoadingAnswers(false);
    }
  };

  // Fetch AI interview results
  const fetchAIResults = async () => {
    try {
      setLoadingAI(true);
      
      const params = {
        ...getDateRange(timeRange),
        ...(department !== "all" && { department }),
        ...(user?.role === 'Recruiter' && { recruiterId: user._id })
      };

      const response = await analyticsAPI.getAIInterviewResults(params);
      setAiResults(response.data?.results || response.results || []);
    } catch (error) {
      console.error('Error fetching AI results:', error);
      setAiResults([]);
    } finally {
      setLoadingAI(false);
    }
  };

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchAnalyticsData();
    if (activeTab === 'answers') {
      fetchInterviewAnswers();
    } else if (activeTab === 'ai-results') {
      fetchAIResults();
    }
  }, [timeRange, department, activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Modal handlers
  const handleViewDetails = (interview) => {
    console.log('Viewing details for interview:', interview);
    setSelectedInterview(interview);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedInterview(null);
  };

  // Get metrics data from dashboard response
  const getMetrics = () => {
    console.log('Getting metrics from dashboardData:', dashboardData);
    
    if (!dashboardData?.overview) {
      console.log('No overview data found in dashboardData');
      // Return empty metrics if no data
      return [
        {
          label: "Total Interviews",
          value: "0",
          change: "+0%",
          positive: true,
          icon: Calendar,
          bgColor: "#dbeafe",
          color: "#3b82f6"
        },
        {
          label: "Success Rate",
          value: "0%",
          change: "+0%",
          positive: true,
          icon: Award,
          bgColor: "#dcfce7",
          color: "#10b981"
        },
        {
          label: "Avg Duration",
          value: "0m",
          change: "+0%",
          positive: true,
          icon: Clock,
          bgColor: "#fef3c7",
          color: "#f59e0b"
        },
        {
          label: "Active Users",
          value: "0",
          change: "+0%",
          positive: true,
          icon: Users,
          bgColor: "#e0e7ff",
          color: "#6366f1"
        }
      ];
    }

    const { overview, trends } = dashboardData;
    console.log('Overview data:', overview);
    console.log('Trends data:', trends);
    
    const previousPeriodData = trends?.previousPeriod || {};
    
    const calculateChange = (current, previous) => {
      if (!previous || previous === 0) return "+0%";
      const change = ((current - previous) / previous) * 100;
      return `${change >= 0 ? '+' : ''}${change.toFixed(1)}%`;
    };

    return [
      {
        label: "Total Interviews",
        value: overview.totalInterviews?.toString() || "0",
        change: calculateChange(overview.totalInterviews, previousPeriodData.totalInterviews),
        positive: (overview.totalInterviews || 0) >= (previousPeriodData.totalInterviews || 0),
        icon: Calendar,
        bgColor: "#dbeafe",
        color: "#3b82f6"
      },
      {
        label: "Success Rate",
        value: `${Math.round(overview.successRate || 0)}%`,
        change: calculateChange(overview.successRate, previousPeriodData.successRate),
        positive: (overview.successRate || 0) >= (previousPeriodData.successRate || 0),
        icon: Award,
        bgColor: "#dcfce7",
        color: "#10b981"
      },
      {
        label: "Avg Duration",
        value: `${Math.round((overview.averageDuration || 0) / 60)}m`,
        change: calculateChange(overview.averageDuration, previousPeriodData.averageDuration),
        positive: (overview.averageDuration || 0) <= (previousPeriodData.averageDuration || 0), // Less is better for duration
        icon: Clock,
        bgColor: "#fef3c7",
        color: "#f59e0b"
      },
      {
        label: "Active Users",
        value: (overview.totalCandidates + overview.totalRecruiters)?.toString() || "0",
        change: calculateChange(
          overview.totalCandidates + overview.totalRecruiters,
          (previousPeriodData.totalCandidates || 0) + (previousPeriodData.totalRecruiters || 0)
        ),
        positive: ((overview.totalCandidates || 0) + (overview.totalRecruiters || 0)) >= 
                 ((previousPeriodData.totalCandidates || 0) + (previousPeriodData.totalRecruiters || 0)),
        icon: Users,
        bgColor: "#e0e7ff",
        color: "#6366f1"
      }
    ];
  };

  // Get top positions data
  const getTopPositions = () => {
    if (!interviewAnalytics?.positionStats) {
      return [];
    }

    return interviewAnalytics.positionStats.slice(0, 5).map(position => ({
      position: position.position || 'Unknown Position',
      department: position.department || 'Unknown Department',
      interviews: position.totalInterviews || 0,
      successRate: `${Math.round(position.successRate || 0)}%`
    }));
  };

  const metrics = getMetrics();
  const topPositions = getTopPositions();

  // Render interview answers section
  const renderInterviewAnswers = () => (
    <InterviewResultsSection>
      <TableHeader>
        <H3>Interview Answers & Candidate Profiles</H3>
        <Button variant="outline" size="sm" onClick={fetchInterviewAnswers} disabled={loadingAnswers}>
          {loadingAnswers ? 'Loading...' : 'Refresh'}
        </Button>
      </TableHeader>
      
      {loadingAnswers ? (
        <LoadingState>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Loading Interview Answers...</div>
          </div>
        </LoadingState>
      ) : interviewAnswers.length > 0 ? (
        <SectionGrid>
          {interviewAnswers.map((interview) => (
            <InterviewCard key={interview.id}>
              <CandidateProfile>
                <CandidateAvatar>
                  {interview.candidate.avatar}
                </CandidateAvatar>
                <CandidateInfo>
                  <CandidateName>{interview.candidate.name}</CandidateName>
                  <CandidateEmail>{interview.candidate.email}</CandidateEmail>
                </CandidateInfo>
                <ScoreDisplay score={interview.overallScore}>
                  <Award size={16} />
                  {interview.overallScore}%
                </ScoreDisplay>
              </CandidateProfile>
              
              <InterviewMeta>
                <div>{interview.interview.position}</div>
                <div>{interview.interview.date}</div>
                <div>{interview.interview.duration}min</div>
              </InterviewMeta>
              
              {interview.answers.slice(0, 2).map((answer, index) => (
                <AnswerPreview key={index}>
                  <QuestionText>Q: {answer.question}</QuestionText>
                  <AnswerText>{answer.answer}</AnswerText>
                </AnswerPreview>
              ))}
              
              <ViewDetailsButton 
                variant="outline" 
                size="sm"
                onClick={() => handleViewDetails(interview)}
              >
                View Full Interview ({interview.answers.length} answers)
              </ViewDetailsButton>
            </InterviewCard>
          ))}
        </SectionGrid>
      ) : (
        <EmptyState>
          <Calendar size={48} />
          <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No Interview Answers Available</div>
          <div style={{ fontSize: '0.875rem' }}>Interview answers will appear here once interviews are completed.</div>
        </EmptyState>
      )}
    </InterviewResultsSection>
  );

  // Render AI interview results section
  const renderAIResults = () => (
    <InterviewResultsSection>
      <TableHeader>
        <H3>AI Interview Results & Analysis</H3>
        <Button variant="outline" size="sm" onClick={fetchAIResults} disabled={loadingAI}>
          {loadingAI ? 'Loading...' : 'Refresh'}
        </Button>
      </TableHeader>
      
      {loadingAI ? (
        <LoadingState>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Loading AI Analysis...</div>
          </div>
        </LoadingState>
      ) : aiResults.length > 0 ? (
        <SectionGrid>
          {aiResults.map((result) => (
            <InterviewCard key={result.id}>
              <CandidateProfile>
                <CandidateAvatar>
                  {result.candidate.avatar}
                </CandidateAvatar>
                <CandidateInfo>
                  <CandidateName>{result.candidate.name}</CandidateName>
                  <CandidateEmail>{result.candidate.email}</CandidateEmail>
                </CandidateInfo>
                <ScoreDisplay score={result.aiAnalysis.overallScore}>
                  <Award size={16} />
                  {result.aiAnalysis.overallScore}%
                </ScoreDisplay>
              </CandidateProfile>
              
              <InterviewMeta>
                <div>{result.interview.position}</div>
                <div>{result.interview.type}</div>
                <div>{result.interview.duration}min</div>
              </InterviewMeta>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', marginBottom: '1rem' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Technical</div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>{result.aiAnalysis.technicalScore}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Communication</div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>{result.aiAnalysis.communicationScore}%</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: '0.75rem', color: '#6b7280' }}>Problem Solving</div>
                  <div style={{ fontWeight: '600', color: '#374151' }}>{result.aiAnalysis.problemSolvingScore}%</div>
                </div>
              </div>
              
              <AIInsights>
                <InsightLabel>AI Recommendation</InsightLabel>
                <InsightText>{result.aiAnalysis.recommendation}</InsightText>
              </AIInsights>
              
              <ViewDetailsButton 
                variant="outline" 
                size="sm"
                onClick={() => handleViewDetails(result)}
              >
                View Detailed Analysis
              </ViewDetailsButton>
            </InterviewCard>
          ))}
        </SectionGrid>
      ) : (
        <EmptyState>
          <Users size={48} />
          <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>No AI Interview Results</div>
          <div style={{ fontSize: '0.875rem' }}>AI interview results will appear here once AI interviews are completed.</div>
        </EmptyState>
      )}
    </InterviewResultsSection>
  );

  // Loading state
  if (loading) {
    return (
      <AnalyticsContainer>
        <LoadingState>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Loading Analytics...</div>
            <div style={{ fontSize: '0.875rem' }}>Fetching your interview data</div>
          </div>
        </LoadingState>
      </AnalyticsContainer>
    );
  }

  // Error state
  if (error) {
    return (
      <AnalyticsContainer>
        <ErrorState>
          <AlertCircle size={48} />
          <div style={{ fontSize: '1.125rem', marginBottom: '0.5rem' }}>Failed to Load Analytics</div>
          <div style={{ fontSize: '0.875rem', marginBottom: '1rem' }}>{error}</div>
          <Button onClick={fetchAnalyticsData}>Try Again</Button>
        </ErrorState>
      </AnalyticsContainer>
    );
  }

  return (
    <AnalyticsContainer>
      <Header>
        <div>
          <H1>Analytics</H1>
          <Text color="secondary">{getAnalyticsDescription()}</Text>
        </div>
        <HeaderActions>
          <Button variant="outline" onClick={fetchAnalyticsData} disabled={loading}>
            <Download size={16} />
            {loading ? 'Loading...' : 'Refresh Data'}
          </Button>
          <Button variant="outline">
            <Download size={16} />
            Export Report
          </Button>
        </HeaderActions>
      </Header>

      {/* Tab Navigation */}
      <TabNavigation>
        <TabButton 
          active={activeTab === "overview"} 
          onClick={() => setActiveTab("overview")}
        >
          Overview
        </TabButton>
        <TabButton 
          active={activeTab === "answers"} 
          onClick={() => setActiveTab("answers")}
        >
          Interview Answers
        </TabButton>
        <TabButton 
          active={activeTab === "ai-results"} 
          onClick={() => setActiveTab("ai-results")}
        >
          AI Results
        </TabButton>
      </TabNavigation>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <>
          <FiltersSection>
            <FiltersGrid>
              <div>
                <Text size="sm" style={{ marginBottom: "0.5rem" }}>Time Range</Text>
                <Select
                  value={timeRange}
                  onChange={(e) => setTimeRange(e.target.value)}
                >
                  <option value="7">Last 7 days</option>
                  <option value="30">Last 30 days</option>
                  <option value="90">Last 3 months</option>
                  <option value="365">Last year</option>
                </Select>
              </div>
              <div>
                <Text size="sm" style={{ marginBottom: "0.5rem" }}>Department</Text>
                <Select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="all">All Departments</option>
                  <option value="engineering">Engineering</option>
                  <option value="product">Product</option>
                  <option value="design">Design</option>
                  <option value="marketing">Marketing</option>
                </Select>
              </div>
            </FiltersGrid>
          </FiltersSection>

          <MetricsGrid>
            {metrics.map((metric, index) => (
              <MetricCard key={index}>
                <MetricIcon bgColor={metric.bgColor} color={metric.color}>
                  <metric.icon />
                </MetricIcon>
                <MetricValue>{metric.value}</MetricValue>
                <MetricLabel>{metric.label}</MetricLabel>
                <MetricChange positive={metric.positive}>
                  <TrendingUp />
                  {metric.change}
                </MetricChange>
              </MetricCard>
            ))}
          </MetricsGrid>

          <ChartsGrid>
            <ChartCard>
              <ChartHeader>
                <H3>Interview Trends</H3>
                <Button variant="outline" size="sm">
                  <Filter size={14} />
                  Filter
                </Button>
              </ChartHeader>
              <ChartPlaceholder>
                {dashboardData?.trends?.interviews?.length > 0 
                  ? `${dashboardData.trends.interviews.length} data points available - Chart integration needed`
                  : 'No interview trend data available for selected period'
                }
              </ChartPlaceholder>
            </ChartCard>

            <ChartCard>
              <ChartHeader>
                <H3>Success Rate by Department</H3>
              </ChartHeader>
              <ChartPlaceholder>
                {interviewAnalytics?.departmentStats?.length > 0
                  ? `${interviewAnalytics.departmentStats.length} departments tracked - Chart integration needed`
                  : 'No department data available for selected period'
                }
              </ChartPlaceholder>
            </ChartCard>
          </ChartsGrid>

          <TableCard>
            <TableHeader>
              <H3>Top Interview Positions</H3>
              <Button variant="outline" size="sm">
                View All
              </Button>
            </TableHeader>
            <Table>
              <TableHead>
                <tr>
                  <th>Position</th>
                  <th>Interviews</th>
                  <th>Success Rate</th>
                </tr>
              </TableHead>
              <TableBody>
                {topPositions.length > 0 ? (
                  topPositions.map((position, index) => (
                    <tr key={index}>
                      <td>
                        <PositionName>{position.position}</PositionName>
                        <Department>{position.department}</Department>
                      </td>
                      <td>{position.interviews}</td>
                      <td>
                        <Badge variant="success">{position.successRate}</Badge>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" style={{ textAlign: 'center', padding: '2rem', color: '#6b7280' }}>
                      No interview data available for the selected period
                    </td>
                  </tr>
                )}
              </TableBody>
            </Table>
          </TableCard>
        </>
      )}

      {/* Interview Answers Tab */}
      {activeTab === "answers" && renderInterviewAnswers()}

      {/* AI Results Tab */}
      {activeTab === "ai-results" && renderAIResults()}

      {/* Interview Details Modal */}
      {isModalOpen && selectedInterview && (
        <ModalOverlay onClick={handleCloseModal}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalHeader>
              <ModalTitle>
                Interview Details - {selectedInterview.candidate?.name || 'Candidate'}
              </ModalTitle>
              <CloseButton onClick={handleCloseModal}>
                <X size={20} />
              </CloseButton>
            </ModalHeader>
            
            <ModalBody>
              <InterviewDetailsGrid>
                <DetailCard>
                  <DetailLabel>Candidate</DetailLabel>
                  <DetailValue>{selectedInterview.candidate?.name || 'N/A'}</DetailValue>
                </DetailCard>
                <DetailCard>
                  <DetailLabel>Email</DetailLabel>
                  <DetailValue>{selectedInterview.candidate?.email || 'N/A'}</DetailValue>
                </DetailCard>
                <DetailCard>
                  <DetailLabel>Position</DetailLabel>
                  <DetailValue>{selectedInterview.interview?.position || selectedInterview.position || 'N/A'}</DetailValue>
                </DetailCard>
                <DetailCard>
                  <DetailLabel>Date</DetailLabel>
                  <DetailValue>{selectedInterview.interview?.date || selectedInterview.date || 'N/A'}</DetailValue>
                </DetailCard>
                <DetailCard>
                  <DetailLabel>Duration</DetailLabel>
                  <DetailValue>{selectedInterview.interview?.duration || selectedInterview.duration || 'N/A'} min</DetailValue>
                </DetailCard>
                <DetailCard>
                  <DetailLabel>Overall Score</DetailLabel>
                  <DetailValue>
                    <ScoreBadge score={selectedInterview.overallScore || selectedInterview.aiAnalysis?.overallScore}>
                      {selectedInterview.overallScore || selectedInterview.aiAnalysis?.overallScore || 0}%
                    </ScoreBadge>
                  </DetailValue>
                </DetailCard>
              </InterviewDetailsGrid>

              {selectedInterview.answers && (
                <QuestionsContainer>
                  <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>
                    Questions & Answers ({selectedInterview.answers.length})
                  </h3>
                  {selectedInterview.answers.map((answer, index) => (
                    <QuestionItem key={index}>
                      <QuestionTitle>
                        <span style={{ color: '#6366f1' }}>Q{index + 1}:</span>
                        {answer.question}
                      </QuestionTitle>
                      <AnswerContent>{answer.answer}</AnswerContent>
                      {answer.score && (
                        <AnswerMeta>
                          <div>Score: <ScoreBadge score={answer.score}>{answer.score}%</ScoreBadge></div>
                          {answer.duration && <div>Duration: {answer.duration}s</div>}
                          {answer.timestamp && <div>Asked at: {new Date(answer.timestamp).toLocaleTimeString()}</div>}
                        </AnswerMeta>
                      )}
                    </QuestionItem>
                  ))}
                </QuestionsContainer>
              )}

              {selectedInterview.aiAnalysis && (
                <QuestionsContainer>
                  <h3 style={{ marginBottom: '1rem', color: '#1f2937' }}>AI Analysis</h3>
                  <QuestionItem>
                    <QuestionTitle>
                      <span style={{ color: '#10b981' }}>AI Recommendation</span>
                    </QuestionTitle>
                    <AnswerContent>{selectedInterview.aiAnalysis.recommendation}</AnswerContent>
                    <AnswerMeta>
                      <div>Communication: <ScoreBadge score={selectedInterview.aiAnalysis.communicationScore}>{selectedInterview.aiAnalysis.communicationScore}%</ScoreBadge></div>
                      <div>Technical: <ScoreBadge score={selectedInterview.aiAnalysis.technicalScore}>{selectedInterview.aiAnalysis.technicalScore}%</ScoreBadge></div>
                      <div>Problem Solving: <ScoreBadge score={selectedInterview.aiAnalysis.problemSolvingScore}>{selectedInterview.aiAnalysis.problemSolvingScore}%</ScoreBadge></div>
                    </AnswerMeta>
                  </QuestionItem>
                </QuestionsContainer>
              )}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnalyticsContainer>
  );
};

export default Analytics;
