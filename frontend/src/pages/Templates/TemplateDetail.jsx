import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash2, Copy, Plus, Clock, FileText } from 'lucide-react';
import styled from 'styled-components';
import { Button, Card, Badge } from '../../components/styled/Components';
import { H1, H2, Text } from '../../components/styled/Typography';
import { Container } from '../../components/styled/Layout';
import { templateAPI } from '../../services/templateAPI';
import { toast } from 'react-hot-toast';
import QuestionModal from '../../components/modals/QuestionModal';

const DetailContainer = styled(Container)`
  padding: 2rem;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;

  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
  }
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
`;

const HeaderInfo = styled.div`
  flex: 1;
`;

const HeaderActions = styled.div`
  display: flex;
  gap: 0.75rem;

  @media (max-width: 768px) {
    width: 100%;
    flex-wrap: wrap;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 350px;
  gap: 1.5rem;

  @media (max-width: 1024px) {
    grid-template-columns: 1fr;
  }
`;

const MainContent = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const Sidebar = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;

  @media (max-width: 1024px) {
    order: -1;
  }
`;

const StyledCard = styled(Card)`
  padding: 0;
  border: 1px solid #e2e8f0;
`;

const CardHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;
`;

const CardBody = styled.div`
  padding: ${props => props.noPadding ? '0' : '1.5rem'};
`;

const CardFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e2e8f0;
`;

const QuestionsList = styled.div`
  display: flex;
  flex-direction: column;
`;

const QuestionItem = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e2e8f0;

  &:last-child {
    border-bottom: none;
  }
`;

const QuestionHeader = styled.div`
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const QuestionMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
`;

const QuestionNumber = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2rem;
  height: 2rem;
  background: #eff6ff;
  color: #3b82f6;
  border-radius: 50%;
  font-size: 0.875rem;
  font-weight: 600;
  flex-shrink: 0;
`;

const QuestionActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const QuestionText = styled.p`
  color: #1f2937;
  margin: 0;
  margin-left: 2.75rem;
  line-height: 1.6;
`;

const InfoSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const InfoItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
`;

const InfoLabel = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
`;

const InfoValue = styled.div`
  font-weight: 500;
  color: #1f2937;
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

  &.danger {
    color: #dc2626;
    border-color: #fecaca;

    &:hover {
      background: #fef2f2;
    }
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
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

const EmptyQuestions = styled.div`
  text-align: center;
  padding: 3rem 2rem;
  color: #9ca3af;

  svg {
    width: 3rem;
    height: 3rem;
    margin: 0 auto 1rem;
    color: #d1d5db;
  }
`;

const getCategoryVariant = (category) => {
  switch (category?.toLowerCase()) {
    case "technical":
      return "primary";
    case "behavioral":
      return "success";
    case "design":
      return "warning";
    case "management":
      return "secondary";
    default:
      return "secondary";
  }
};

const TemplateDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [template, setTemplate] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isQuestionModalOpen, setIsQuestionModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [questionIndex, setQuestionIndex] = useState(-1);

  useEffect(() => {
    const fetchTemplate = async () => {
      try {
        setLoading(true);
        const response = await templateAPI.getTemplateById(id);
        setTemplate(response.data.template);
      } catch (err) {
        console.error('Error fetching template:', err);
        toast.error(err.response?.data?.message || 'Failed to load template');
        navigate('/templates');
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchTemplate();
    }
  }, [id, navigate]);

  const handleEdit = () => {
    navigate(`/templates/${id}/edit`);
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this template?')) {
      return;
    }

    try {
      await templateAPI.deleteTemplate(id);
      toast.success('Template deleted successfully!');
      navigate('/templates');
    } catch (err) {
      console.error('Error deleting template:', err);
      toast.error(err.response?.data?.message || 'Failed to delete template');
    }
  };

  const handleDuplicate = async () => {
    try {
      const response = await templateAPI.cloneTemplate(id, {
        title: `Copy of ${template.title}`
      });
      toast.success('Template duplicated successfully!');
      navigate(`/templates/${response.data.template._id}`);
    } catch (err) {
      console.error('Error duplicating template:', err);
      toast.error(err.response?.data?.message || 'Failed to duplicate template');
    }
  };

  // Question management handlers
  const handleAddQuestion = () => {
    setModalMode('add');
    setSelectedQuestion(null);
    setQuestionIndex(-1);
    setIsQuestionModalOpen(true);
  };

  const handleEditQuestion = (question, index) => {
    setModalMode('edit');
    setSelectedQuestion(question);
    setQuestionIndex(index);
    setIsQuestionModalOpen(true);
  };

  const handleRemoveQuestion = async (index) => {
    if (!window.confirm('Are you sure you want to remove this question?')) {
      return;
    }

    try {
      const updatedQuestions = template.questions.filter((_, i) => i !== index);
      const updatedTemplate = {
        ...template,
        questions: updatedQuestions
      };

      // Update the template in the backend
      await templateAPI.updateTemplate(id, updatedTemplate);
      
      // Update local state
      setTemplate(updatedTemplate);
      toast.success('Question removed successfully!');
    } catch (err) {
      console.error('Error removing question:', err);
      toast.error(err.response?.data?.message || 'Failed to remove question');
    }
  };

  const handleSaveQuestion = async (questionData) => {
    try {
      let updatedQuestions;
      
      if (modalMode === 'add') {
        // Add new question
        updatedQuestions = [...(template.questions || []), questionData];
      } else {
        // Edit existing question
        updatedQuestions = template.questions.map((q, index) => 
          index === questionIndex ? questionData : q
        );
      }

      const updatedTemplate = {
        ...template,
        questions: updatedQuestions
      };

      // Update the template in the backend
      await templateAPI.updateTemplate(id, updatedTemplate);
      
      // Update local state
      setTemplate(updatedTemplate);
      
      toast.success(
        modalMode === 'add' 
          ? 'Question added successfully!' 
          : 'Question updated successfully!'
      );
    } catch (err) {
      console.error('Error saving question:', err);
      toast.error(err.response?.data?.message || 'Failed to save question');
      throw err; // Re-throw to let modal handle the error
    }
  };

  const handleCloseModal = () => {
    setIsQuestionModalOpen(false);
    setSelectedQuestion(null);
    setQuestionIndex(-1);
  };

  if (loading) {
    return (
      <DetailContainer>
        <LoadingSpinner />
      </DetailContainer>
    );
  }

  if (!template) {
    return null;
  }

  return (
    <DetailContainer>
      <Header>
        <HeaderLeft>
          <Button variant="secondary" size="sm" onClick={() => navigate('/templates')}>
            <ArrowLeft size={16} />
          </Button>
          <HeaderInfo>
            <H1>{template.title}</H1>
            <Text color="secondary">{template.description || 'No description'}</Text>
          </HeaderInfo>
        </HeaderLeft>

        <HeaderActions>
          <Button variant="secondary" onClick={handleDuplicate}>
            <Copy size={16} />
            Duplicate
          </Button>
          <Button variant="secondary" onClick={handleEdit}>
            <Edit size={16} />
            Edit
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            <Trash2 size={16} />
            Delete
          </Button>
        </HeaderActions>
      </Header>

      <ContentGrid>
        <MainContent>
          <StyledCard>
            <CardHeader>
              <H2 style={{ margin: 0 }}>
                Questions ({template.questions?.length || 0})
              </H2>
            </CardHeader>
            <CardBody noPadding>
              {template.questions && template.questions.length > 0 ? (
                <QuestionsList>
                  {template.questions.map((question, index) => (
                    <QuestionItem key={question._id || index}>
                      <QuestionHeader>
                        <QuestionMeta>
                          <QuestionNumber>{index + 1}</QuestionNumber>
                          {question.type && (
                            <Badge variant="secondary" size="sm">
                              {question.type}
                            </Badge>
                          )}
                          {question.expectedDuration && (
                            <Text size="sm" color="secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                              <Clock size={14} />
                              {question.expectedDuration} min
                            </Text>
                          )}
                        </QuestionMeta>
                        <QuestionActions>
                          <ActionButton onClick={() => handleEditQuestion(question, index)}>
                            Edit
                          </ActionButton>
                          <ActionButton 
                            className="danger" 
                            onClick={() => handleRemoveQuestion(index)}
                          >
                            Remove
                          </ActionButton>
                        </QuestionActions>
                      </QuestionHeader>
                      <QuestionText>
                        {question.question || question.text || 'No question text'}
                      </QuestionText>
                    </QuestionItem>
                  ))}
                </QuestionsList>
              ) : (
                <EmptyQuestions>
                  <FileText />
                  <Text color="secondary">No questions added yet</Text>
                </EmptyQuestions>
              )}
            </CardBody>
            <CardFooter>
              <Button variant="secondary" onClick={handleAddQuestion}>
                <Plus size={16} />
                Add Question
              </Button>
            </CardFooter>
          </StyledCard>
        </MainContent>

        <Sidebar>
          <StyledCard>
            <CardHeader>
              <H2 style={{ margin: 0, fontSize: '1.125rem' }}>Template Info</H2>
            </CardHeader>
            <CardBody>
              <InfoSection>
                <InfoItem>
                  <InfoLabel>Category</InfoLabel>
                  <InfoValue>
                    <Badge variant={getCategoryVariant(template.category)}>
                      {template.category}
                    </Badge>
                  </InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>Difficulty</InfoLabel>
                  <InfoValue>{template.difficulty}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>Duration</InfoLabel>
                  <InfoValue>{template.estimatedDuration} minutes</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>Questions</InfoLabel>
                  <InfoValue>{template.questions?.length || 0} questions</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>Created By</InfoLabel>
                  <InfoValue>{template.createdBy?.name || 'Unknown'}</InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>Created</InfoLabel>
                  <InfoValue>
                    {new Date(template.createdAt).toLocaleDateString()}
                  </InfoValue>
                </InfoItem>

                <InfoItem>
                  <InfoLabel>Status</InfoLabel>
                  <InfoValue>
                    <Badge variant={template.isActive ? 'success' : 'danger'}>
                      {template.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </InfoValue>
                </InfoItem>
              </InfoSection>
            </CardBody>
          </StyledCard>

          <StyledCard>
            <CardHeader>
              <H2 style={{ margin: 0, fontSize: '1.125rem' }}>Quick Actions</H2>
            </CardHeader>
            <CardBody>
              <InfoSection>
                <Button variant="primary" style={{ width: '100%' }}>
                  Use in Interview
                </Button>
                <Button variant="secondary" style={{ width: '100%' }}>
                  Preview Template
                </Button>
                <Button variant="secondary" style={{ width: '100%' }}>
                  Export Template
                </Button>
              </InfoSection>
            </CardBody>
          </StyledCard>
        </Sidebar>
      </ContentGrid>

      {/* Question Modal */}
      <QuestionModal
        isOpen={isQuestionModalOpen}
        onClose={handleCloseModal}
        onSave={handleSaveQuestion}
        question={selectedQuestion}
        mode={modalMode}
      />
    </DetailContainer>
  );
};

export default TemplateDetail;