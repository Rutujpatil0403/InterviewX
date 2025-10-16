import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Plus, Trash2, GripVertical } from 'lucide-react';
import styled from 'styled-components';
import { Button, Card } from '../../components/styled/Components';
import { Input, Select, TextArea } from '../../components/styled/FormElements';
import { H1, H2, Text } from '../../components/styled/Typography';
import { Container } from '../../components/styled/Layout';
import { templateAPI } from '../../services/templateAPI';
import { toast } from 'react-hot-toast';

const FormContainer = styled(Container)`
  padding: 2rem;
  max-width: 1000px;
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 2rem;
`;

const FormCard = styled(Card)`
  padding: 2rem;
  border: 1px solid #e2e8f0;
`;

const FormSection = styled.div`
  margin-bottom: 2rem;

  &:last-child {
    margin-bottom: 0;
  }
`;

const SectionTitle = styled.h3`
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 1rem 0;
`;

const FormGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  &.full-width {
    grid-column: 1 / -1;
  }
`;

const Label = styled.label`
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
`;

const RequiredIndicator = styled.span`
  color: #dc2626;
  margin-left: 0.25rem;
`;

const QuestionsSection = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const QuestionCard = styled.div`
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1.5rem;
  position: relative;
`;

const QuestionHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
`;

const QuestionNumber = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #6b7280;
`;

const QuestionActions = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const IconButton = styled.button`
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    border-color: #d1d5db;
  }

  &.danger:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;

  @media (max-width: 768px) {
    flex-direction: column-reverse;
  }
`;

const ErrorText = styled.span`
  color: #dc2626;
  font-size: 0.875rem;
`;

const TemplateForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 'Medium',
    estimatedDuration: 60,
    questions: []
  });
  const [errors, setErrors] = useState({});
  const [categories, setCategories] = useState([]);

  // Fetch existing template if editing
  useEffect(() => {
    if (isEditMode) {
      const fetchTemplate = async () => {
        try {
          setLoading(true);
          const response = await templateAPI.getTemplateById(id);
          const template = response.data.template;
          setFormData({
            title: template.title,
            description: template.description || '',
            category: template.category,
            difficulty: template.difficulty,
            estimatedDuration: template.estimatedDuration,
            questions: template.questions || []
          });
        } catch (err) {
          console.error('Error fetching template:', err);
          toast.error('Failed to load template');
          navigate('/templates');
        } finally {
          setLoading(false);
        }
      };
      fetchTemplate();
    }
  }, [id, isEditMode, navigate]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await templateAPI.getCategories();
        setCategories(response.data?.categories || []);
      } catch (err) {
        console.error('Error fetching categories:', err);
      }
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const addQuestion = () => {
    setFormData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          question: '',
          type: 'technical',
          expectedDuration: 5
        }
      ]
    }));
  };

  const updateQuestion = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      )
    }));
  };

  const removeQuestion = (index) => {
    setFormData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.category) {
      newErrors.category = 'Category is required';
    }

    if (!formData.difficulty) {
      newErrors.difficulty = 'Difficulty is required';
    }

    if (!formData.estimatedDuration || formData.estimatedDuration < 1) {
      newErrors.estimatedDuration = 'Duration must be at least 1 minute';
    }

    if (formData.questions.length === 0) {
      newErrors.questions = 'At least one question is required';
    } else {
      formData.questions.forEach((q, index) => {
        if (!q.question.trim()) {
          newErrors[`question_${index}`] = 'Question text is required';
        }
      });
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    setLoading(true);
    try {
      const templateData = {
        ...formData,
        isActive: true
      };

      if (isEditMode) {
        const response = await templateAPI.updateTemplate(id, templateData);
        console.log('Update response:', response);
        toast.success('Template updated successfully!');
        navigate('/templates', { replace: true });
      } else {
        const response = await templateAPI.createTemplate(templateData);
        console.log('Create response:', response);
        toast.success('Template created successfully!');
        navigate('/templates', { replace: true });
      }

      navigate('/templates');
    } catch (err) {
      console.error('Error saving template:', err);
      const errorMessage = err.response?.data?.message ||
        err.response?.data?.errors?.[0]?.msg ||
        'Failed to save template';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormContainer>
      <Header>
        <Button variant="secondary" size="sm" onClick={() => navigate('/templates')}>
          <ArrowLeft size={16} />
        </Button>
        <div>
          <H1>{isEditMode ? 'Edit Template' : 'Create Template'}</H1>
          <Text color="secondary">
            {isEditMode ? 'Update template details and questions' : 'Create a new interview template'}
          </Text>
        </div>
      </Header>

      <form onSubmit={handleSubmit}>
        <FormCard>
          {/* Basic Information */}
          <FormSection>
            <SectionTitle>Basic Information</SectionTitle>
            <FormGrid>
              <FormGroup className="full-width">
                <Label>
                  Title<RequiredIndicator>*</RequiredIndicator>
                </Label>
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="e.g., Frontend Developer Interview"
                  disabled={loading}
                />
                {errors.title && <ErrorText>{errors.title}</ErrorText>}
              </FormGroup>

              <FormGroup className="full-width">
                <Label>Description</Label>
                <TextArea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Brief description of the template..."
                  rows={3}
                  disabled={loading}
                />
              </FormGroup>

              <FormGroup>
                <Label>
                  Category<RequiredIndicator>*</RequiredIndicator>
                </Label>
                {categories.length > 0 ? (
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    disabled={loading}
                  >
                    <option value="">Select category</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </Select>
                ) : (
                  <Input
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    placeholder="e.g., Technical, Behavioral"
                    disabled={loading}
                  />
                )}
                {errors.category && <ErrorText>{errors.category}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>
                  Difficulty<RequiredIndicator>*</RequiredIndicator>
                </Label>
                <Select
                  name="difficulty"
                  value={formData.difficulty}
                  onChange={handleInputChange}
                  disabled={loading}
                >
                  <option value="Easy">Easy</option>
                  <option value="Medium">Medium</option>
                  <option value="Hard">Hard</option>
                </Select>
                {errors.difficulty && <ErrorText>{errors.difficulty}</ErrorText>}
              </FormGroup>

              <FormGroup>
                <Label>
                  Estimated Duration (minutes)<RequiredIndicator>*</RequiredIndicator>
                </Label>
                <Input
                  type="number"
                  name="estimatedDuration"
                  value={formData.estimatedDuration}
                  onChange={handleInputChange}
                  min="1"
                  disabled={loading}
                />
                {errors.estimatedDuration && <ErrorText>{errors.estimatedDuration}</ErrorText>}
              </FormGroup>
            </FormGrid>
          </FormSection>

          {/* Questions */}
          <FormSection>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <SectionTitle style={{ margin: 0 }}>
                Questions ({formData.questions.length})
              </SectionTitle>
              <Button type="button" variant="secondary" onClick={addQuestion} disabled={loading}>
                <Plus size={16} />
                Add Question
              </Button>
            </div>

            {errors.questions && <ErrorText>{errors.questions}</ErrorText>}

            <QuestionsSection>
              {formData.questions.map((question, index) => (
                <QuestionCard key={index}>
                  <QuestionHeader>
                    <QuestionNumber>
                      <GripVertical size={16} />
                      Question {index + 1}
                    </QuestionNumber>
                    <QuestionActions>
                      <IconButton
                        type="button"
                        className="danger"
                        onClick={() => removeQuestion(index)}
                        disabled={loading}
                      >
                        <Trash2 />
                      </IconButton>
                    </QuestionActions>
                  </QuestionHeader>

                  <FormGroup>
                    <Label>
                      Question Text<RequiredIndicator>*</RequiredIndicator>
                    </Label>
                    <TextArea
                      value={question.question}
                      onChange={(e) => updateQuestion(index, 'question', e.target.value)}
                      placeholder="Enter your question..."
                      rows={2}
                      disabled={loading}
                    />
                    {errors[`question_${index}`] && (
                      <ErrorText>{errors[`question_${index}`]}</ErrorText>
                    )}
                  </FormGroup>

                  <FormGrid>
                    <FormGroup>
                      <Label>Question Type</Label>
                      <Select
                        value={question.type}
                        onChange={(e) => updateQuestion(index, 'type', e.target.value)}
                        disabled={loading}
                      >
                        <option value="technical">Technical</option>
                        <option value="behavioral">Behavioral</option>
                        <option value="situational">Situational</option>
                        <option value="coding">Coding</option>
                      </Select>
                    </FormGroup>

                    <FormGroup>
                      <Label>Expected Duration (min)</Label>
                      <Input
                        type="number"
                        value={question.expectedDuration}
                        onChange={(e) => updateQuestion(index, 'expectedDuration', parseInt(e.target.value))}
                        min="1"
                        disabled={loading}
                      />
                    </FormGroup>
                  </FormGrid>
                </QuestionCard>
              ))}

              {formData.questions.length === 0 && (
                <Text color="secondary" style={{ textAlign: 'center', padding: '2rem' }}>
                  No questions added yet. Click "Add Question" to get started.
                </Text>
              )}
            </QuestionsSection>
          </FormSection>

          <ButtonGroup>
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate('/templates')}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={loading}
            >
              {loading ? 'Saving...' : isEditMode ? 'Update Template' : 'Create Template'}
            </Button>
          </ButtonGroup>
        </FormCard>
      </form>
    </FormContainer>
  );
};

export default TemplateForm;