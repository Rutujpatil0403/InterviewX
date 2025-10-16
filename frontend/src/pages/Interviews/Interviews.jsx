import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Plus, Filter, Calendar, Clock, Users, Eye, Edit, Trash2, Video } from "lucide-react";
import styled from "styled-components";
import { Button, Card, Badge } from "../../components/styled/Components";
import { Input, Select } from "../../components/styled/FormElements";
import { H1, H2, Text } from "../../components/styled/Typography";
import { Container } from "../../components/styled/Layout";
import { interviewAPI } from "../../services/interviewAPI";
import { toast } from "react-hot-toast";
import InterviewModal from "../../components/InterviewModal";
import DeleteInterviewModal from "./DeleteInterview";

// Styled components
const InterviewsContainer = styled(Container)`
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
  grid-template-columns: 2fr 1fr 1fr auto;
  gap: 1rem;
  align-items: end;
 
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 1rem;
  }
`;

const InterviewsGrid = styled.div`
  display: grid;
  gap: 1.5rem;
  grid-template-columns: repeat(auto-fill, minmax(400px, 1fr));
 
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InterviewCard = styled(Card)`
  padding: 1.5rem;
  transition: all 0.3s;
  border: 1px solid #e2e8f0;
 
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    border-color: #3b82f6;
  }
`;

const CardHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
`;

const CandidateInfo = styled.div`
  flex: 1;
`;

const CandidateName = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
`;

const CandidateEmail = styled.p`
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
`;

const Position = styled.div`
  background: linear-gradient(135deg, #f3f4f6, #e5e7eb);
  color: #374151;
  padding: 0.5rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  margin-bottom: 1rem;
  display: inline-block;
`;

const InfoGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 0.75rem;
  margin-bottom: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
 
  svg {
    width: 1rem;
    height: 1rem;
    color: #9ca3af;
  }
`;

const CardActions = styled.div`
  display: flex;
  gap: 0.5rem;
  justify-content: flex-end;
  margin-top: 1rem;
  padding-top: 1rem;
  border-top: 1px solid #f3f4f6;
`;

const ActionButton = styled.button`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid #e5e7eb;
  background: white;
  border-radius: 6px;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
  transition: all 0.2s;
 
  &:hover {
    background: #f9fafb;
    border-color: #d1d5db;
  }
 
  &.primary {
    background: #3b82f6;
    color: white;
    border-color: #3b82f6;
   
    &:hover {
      background: #2563eb;
    }
  }
 
  &.danger {
    color: #dc2626;
    border-color: #fecaca;
   
    &:hover {
      background: #fef2f2;
    }
  }
 
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
 
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const EmptyState = styled.div`
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 12px;
  border: 2px dashed #e5e7eb;
 
  svg {
    width: 4rem;
    height: 4rem;
    color: #d1d5db;
    margin: 0 auto 1rem;
  }
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 2rem;
`;

const StatCard = styled(Card)`
  padding: 1.5rem;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc, #f1f5f9);
  border: 1px solid #e2e8f0;
`;

const StatNumber = styled.div`
  font-size: 2rem;
  font-weight: 700;
  color: #1f2937;
  margin-bottom: 0.5rem;
`;

const StatLabel = styled.div`
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 500;
`;

const LoadingSpinner = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 400px;
 
  &::after {
    content: '';
    width: 2rem;
    height: 2rem;
    border: 2px solid #e2e8f0;
    border-top: 2px solid #3b82f6;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
 
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;

const PaginationContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  margin-top: 2rem;
  padding: 1rem;
`;

// Utility functions
const getStatusVariant = (status) => {
  switch (status?.toLowerCase()) {
    case "scheduled":
      return "primary";
    case "completed":
      return "success";
    case "cancelled":
      return "danger";
    case "in progress":
    case "inprogress":
      return "warning";
    case "paused":
      return "warning";
    default:
      return "secondary";
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return { date: 'N/A', time: 'N/A' };
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  };
};

const Interviews = () => {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [interviews, setInterviews] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    inProgress: 0
  });
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    interview: null,
    loading: false,
    error: null
  });
  const [statsLoading, setStatsLoading] = useState(false);

  // Reset page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [filterStatus, searchTerm]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const userStr = localStorage.getItem("user");
      if (!userStr) return;

      const userObj = JSON.parse(userStr);

      // Gets stats ONLY for the logged-in user
      const response = await interviewAPI.getInterviewStatisticsByUser(userObj._id, userObj.role);
      const data = response.data || response;

      setStats({
        total: data.totalInterviews || 0,
        scheduled: data.scheduledInterviews || 0,
        completed: data.completedInterviews || 0,
        inProgress: data.inProgressInterviews || 0
      });
    } catch (err) {
      console.error('Error fetching stats:', err);
      setStats({ total: 0, scheduled: 0, completed: 0, inProgress: 0 });
    } finally {
      setStatsLoading(false);
    }
  }, []);
  // Fetch interviews by user
  const fetchInterviewsByUser = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const userStr = localStorage.getItem("user");
      if (!userStr) {
        throw new Error("User not found in localStorage");
      }

      const userObj = JSON.parse(userStr);
      console.log("User Data:", userObj);

      // Pass both userId and role as params
      const response = await interviewAPI.getInterviewByUser(userObj._id, userObj.role);
      console.log("API Response:", response);

      let interviewsArray = [];

      // Handle the backend response structure: { success: true, count: 2, data: [...] }
      if (response && response.success !== false) {
        if (Array.isArray(response.data)) {
          interviewsArray = response.data;
        } else if (Array.isArray(response)) {
          interviewsArray = response;
        } else if (response && Array.isArray(response.interviews)) {
          interviewsArray = response.interviews;
        }
      }

      console.log("Interviews Array Length:", interviewsArray.length);

      // Apply client-side filtering
      let filteredInterviews = interviewsArray;

      // Filter by search term
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        filteredInterviews = filteredInterviews.filter(interview => {
          const candidateName = (interview.candidateId?.name || interview.candidate?.name || interview.candidateName || '').toLowerCase();
          const candidateEmail = (interview.candidateId?.email || interview.candidate?.email || interview.candidateEmail || '').toLowerCase();
          const position = (interview.position || interview.jobTitle || '').toLowerCase();

          return candidateName.includes(searchLower) ||
            candidateEmail.includes(searchLower) ||
            position.includes(searchLower);
        });
      }

      // Filter by status
      if (filterStatus !== "all") {
        filteredInterviews = filteredInterviews.filter(interview =>
          interview.status?.toLowerCase() === filterStatus.toLowerCase()
        );
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedInterviews = filteredInterviews.slice(startIndex, endIndex);

      setInterviews(paginatedInterviews);
      setTotalCount(filteredInterviews.length);

      // Log for debugging
      if (interviewsArray.length === 0) {
        console.log(`No interviews found for user ${userObj._id} with role ${userObj.role}`);
      }

    } catch (err) {
      console.error('Fetch error:', err);

      // Handle specific error cases
      if (err.response?.status === 404) {
        // 404 means no interviews found - not an error, just empty state
        console.log('No interviews found (404)');
        setError(null);
        setInterviews([]);
        setTotalCount(0);
      } else if (err.response?.status === 401 || err.response?.status === 403) {
        // Authentication/Authorization errors
        setError('Authentication failed. Please log in again.');
        toast.error('Session expired. Please log in again.');
        setInterviews([]);
        setTotalCount(0);
      } else {
        // Other errors
        const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch interviews';
        setError(errorMessage);
        toast.error(errorMessage);
        setInterviews([]);
        setTotalCount(0);
      }
    } finally {
      setLoading(false);
    }
  }, [currentPage, pageSize, searchTerm, filterStatus]);

  // Initial load
  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    fetchInterviewsByUser();
  }, [fetchInterviewsByUser]);

  // Handle operations
  // const handleDeleteInterview = async (interviewId) => {
  //   if (!window.confirm("Are you sure you want to delete this interview?")) {
  //     return;
  //   }
  //   try {
  //     await interviewAPI.deleteInterview(interviewId);
  //     toast.success('Interview deleted successfully!');
  //     await fetchInterviewsByUser();
  //     await fetchStats();
  //   } catch (err) {
  //     console.error('Delete error:', err);
  //     toast.error(err.response?.data?.message || 'Failed to delete interview');
  //   }
  // };

  const handleDeleteInterview = async (interview) => {
    setDeleteModal({
      isOpen: true,
      interview: interview,
      loading: false,
      error: null
    });
  };

  const confirmDelete = async () => {
    setDeleteModal(prev => ({ ...prev, loading: true, error: null }));

    try {
      await interviewAPI.deleteInterview(deleteModal.interview._id || deleteModal.interview.id);
      toast.success('Interview deleted successfully!');

      // Close modal and refresh data
      setDeleteModal({ isOpen: false, interview: null, loading: false, error: null });
      await fetchInterviewsByUser();
      await fetchStats();
    } catch (err) {
      console.error('Delete error:', err);

      // Parse error message
      let errorMessage = 'Failed to delete interview';

      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      }

      // Show error in modal
      setDeleteModal(prev => ({
        ...prev,
        loading: false,
        error: errorMessage
      }));

      toast.error(errorMessage);
    }
  };

  const closeDeleteModal = () => {
    if (!deleteModal.loading) {
      setDeleteModal({ isOpen: false, interview: null, loading: false, error: null });
    }
  };


  const handleCancelInterview = async (interviewId) => {
    const reason = window.prompt("Please provide a reason for cancellation (optional):");
    if (reason === null) return;

    try {
      await interviewAPI.updateInterview(interviewId, {
        status: 'Cancelled',
        cancellationReason: reason
      });
      toast.success('Interview cancelled successfully!');
      await fetchInterviewsByUser();
      await fetchStats();
    } catch (err) {
      console.error('Cancel error:', err);
      toast.error(err.response?.data?.message || 'Failed to cancel interview');
    }
  };

  const handleStartInterview = async (interviewId) => {
    try {
      await interviewAPI.startInterview(interviewId);
      toast.success('Interview started successfully!');
      await fetchInterviewsByUser();
      await fetchStats();
      navigate(`/interviews/${interviewId}/room`);
    } catch (err) {
      console.error('Start error:', err);
      toast.error(err.response?.data?.message || 'Failed to start interview');
    }
  };



  const handleStartAIInterview = async (interviewId) => {
    try {
      // Import AI API
      const { aiInterviewAPI } = await import('../../services/aiAPI');

      // Start AI interview session
      await aiInterviewAPI.startAIInterview(interviewId);
      toast.success('AI Interview session started successfully!');

      // Navigate to AI interview room
      navigate(`/interviews/${interviewId}/ai-room`);

      // Refresh data
      await fetchInterviewsByUser();
      await fetchStats();
    } catch (err) {
      console.error('Start AI Interview error:', err);
      toast.error(err.response?.data?.message || 'Failed to start AI interview');
    }
  };

  const handleViewInterview = (interviewId) => {
    navigate(`/interviews/${interviewId}`);
  };

  const handleEditInterview = (interviewId) => {
    navigate(`/interviews/${interviewId}/edit`);
  };

  const handleModalSuccess = async () => {
    setShowCreateModal(false);
    await fetchInterviewsByUser();
    await fetchStats();
    toast.success('Interview scheduled successfully!');
  };

  const totalPages = Math.ceil(totalCount / pageSize);

  // Loading state
  if (loading && interviews.length === 0) {
    return (
      <InterviewsContainer>
        <LoadingSpinner />
      </InterviewsContainer>
    );
  }

  return (
    <>
      <InterviewsContainer>
        <Header>
          <div>
            <H1>Interviews</H1>
            <Text color="secondary">Manage and track all interviews</Text>
          </div>
          <HeaderActions>
            <Button variant="primary" onClick={() => setShowCreateModal(true)}>
              <Plus size={16} />
              Schedule Interview
            </Button>
          </HeaderActions>
        </Header>

        <StatsGrid>
          <StatCard>
            <StatNumber>{statsLoading ? '...' : stats.total}</StatNumber>
            <StatLabel>Total Interviews</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{statsLoading ? '...' : stats.scheduled}</StatNumber>
            <StatLabel>Scheduled</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{statsLoading ? '...' : stats.completed}</StatNumber>
            <StatLabel>Completed</StatLabel>
          </StatCard>
          <StatCard>
            <StatNumber>{statsLoading ? '...' : stats.inProgress}</StatNumber>
            <StatLabel>In Progress</StatLabel>
          </StatCard>
        </StatsGrid>

        <FiltersSection>
          <FiltersGrid>
            <Input
              placeholder="Search by candidate name or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="Scheduled">Scheduled</option>
              <option value="In Progress">In Progress</option>
              <option value="Completed">Completed</option>
              <option value="Cancelled">Cancelled</option>
              <option value="Paused">Paused</option>
            </Select>
            <Button variant="outline">
              <Filter size={16} />
              More Filters
            </Button>
          </FiltersGrid>
        </FiltersSection>

        {error ? (
          <EmptyState>
            <Calendar />
            <H2>Something went wrong</H2>
            <Text color="danger" style={{ marginBottom: '1rem' }}>{error}</Text>
            <Button variant="primary" onClick={fetchInterviewsByUser}>
              Try Again
            </Button>
          </EmptyState>
        ) : interviews.length === 0 ? (
          <EmptyState>
            <Calendar />
            <H2>No interviews found</H2>
            <Text color="secondary" style={{ marginBottom: '1rem' }}>
              {searchTerm || filterStatus !== "all"
                ? "Try adjusting your search or filters"
                : "Schedule your first interview to get started"
              }
            </Text>
            {!searchTerm && filterStatus === "all" && (
              <Button variant="primary" onClick={() => setShowCreateModal(true)}>
                <Plus size={16} />
                Schedule Interview
              </Button>
            )}
          </EmptyState>
        ) : (
          <>
            <InterviewsGrid>
              {interviews.map((interview) => {
                const { date, time } = formatDateTime(
                  interview.interviewDate ||
                  interview.scheduledAt ||
                  interview.createdAt
                );

                // Detect if this is an AI interview - AI interviews always have templateId
                // Normal interviews don't have templateId
                const isAIInterview = !!interview.templateId;
                return (
                  <InterviewCard key={interview._id || interview.id}>
                    <CardHeader>
                      <CandidateInfo>
                        <CandidateName>
                          {interview.candidateId?.name ||
                            interview.candidate?.name ||
                            interview.candidateName ||
                            'Unknown Candidate'}
                        </CandidateName>
                        <CandidateEmail>
                          {interview.candidateId?.email ||
                            interview.candidate?.email ||
                            interview.candidateEmail ||
                            'No email'}
                        </CandidateEmail>
                      </CandidateInfo>
                      <Badge variant={getStatusVariant(interview.status)}>
                        {interview.status}
                      </Badge>
                    </CardHeader>

                    <Position>
                      {interview.position || interview.jobTitle || 'Position TBD'}
                    </Position>

                    <InfoGrid>
                      <InfoItem>
                        <Calendar />
                        <span>{date}</span>
                      </InfoItem>
                      <InfoItem>
                        <Clock />
                        <span>{time}</span>
                      </InfoItem>
                      <InfoItem>
                        <Users />
                        <span>
                          {interview.recruiterId?.name ||
                            interview.interviewer ||
                            'TBD'}
                        </span>
                      </InfoItem>
                      <InfoItem>
                        <Clock />
                        <span>
                          {interview.aiSession?.estimatedDuration ||
                            interview.duration || 60} min
                        </span>
                      </InfoItem>
                    </InfoGrid>

                    <Text size="sm" color="secondary" style={{ marginBottom: "1rem" }}>
                      Template: {interview.templateId?.title ||
                        interview.template ||
                        'No template'}
                    </Text>

                    <CardActions>
                      <ActionButton onClick={() => handleViewInterview(interview._id || interview.id)}>
                        <Eye />
                        View
                      </ActionButton>
                      <ActionButton onClick={() => handleEditInterview(interview._id || interview.id)}>
                        <Edit />
                        Edit
                      </ActionButton>
                      {(interview.status === "Scheduled" || interview.status === "scheduled") && (
                        <>
                          {isAIInterview ? (
                            <ActionButton
                              className="primary"
                              onClick={() => handleStartAIInterview(interview._id || interview.id)}
                            >
                              <Video />
                              Start AI Interview
                            </ActionButton>
                          ) : (
                            <>
                              {/* <ActionButton
                                className="primary"
                                onClick={() => handleStartVideoInterview(interview._id || interview.id)}
                              >
                                <Video />
                                Start Video Interview
                              </ActionButton> */}
                              <ActionButton
                                className="primary"
                                onClick={() => handleStartInterview(interview._id || interview.id)}
                              >
                                Start Interview
                              </ActionButton>
                            </>
                          )}
                          <ActionButton
                            onClick={() => handleCancelInterview(interview._id || interview.id)}
                          >
                            Cancel
                          </ActionButton>
                        </>
                      )}
                      <ActionButton
                        className="danger"
                        onClick={() => handleDeleteInterview(interview)}
                      >
                        <Trash2 />
                      </ActionButton>
                    </CardActions>
                  </InterviewCard>
                );
              })}
            </InterviewsGrid>

            {totalPages > 1 && (
              <PaginationContainer>
                <Button
                  variant="outline"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(prev => prev - 1)}
                >
                  Previous
                </Button>
                <span style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(prev => prev + 1)}
                >
                  Next
                </Button>
              </PaginationContainer>
            )}
          </>
        )}

        <InterviewModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleModalSuccess}
        />
      </InterviewsContainer>

      <DeleteInterviewModal
        isOpen={deleteModal.isOpen}
        onClose={closeDeleteModal}
        onConfirm={confirmDelete}
        interview={deleteModal.interview}
        loading={deleteModal.loading}
        error={deleteModal.error}
      />
    </>
  );
};

export default Interviews;