// Fontend InterviewModal.jsx


import React, { useState, useEffect, useRef } from 'react';
import { X, Bot, User, Zap, ChevronDown } from 'lucide-react';
import styled from 'styled-components';
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from './styled/Components';
import { Input, Select, TextArea } from './styled/FormElements';
import { H2, Text } from './styled/Typography';
import { toast } from "react-hot-toast";
import { interviewAPI } from '../services';
import { aiInterviewAPI } from '../services/aiAPI';
import { userAPI } from '../services/userAPI';
import { useCreateInterview, useTemplates } from '../hooks/useAPI';
import { useAuth } from '../hooks/useAuth';

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
`;

const FormGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const Label = styled.label`
  font-weight: 500;
  color: ${({ theme }) => theme.colors.text.primary};
  font-size: 0.875rem;
`;

const FormRow = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  
  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 0.375rem;
  color: ${({ theme }) => theme.colors.text.secondary};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.gray[100]};
    color: ${({ theme }) => theme.colors.text.primary};
  }
`;

const InterviewTypeSelector = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const TypeOption = styled.button`
  /* type: button; */
  padding: 1rem;
  border: 2px solid ${({ $selected, theme }) => $selected ? theme.colors.primary[500] : theme.colors.gray[300]};
  border-radius: 0.75rem;
  background: ${({ $selected, theme }) => $selected ? theme.colors.primary[50] : 'white'};
  cursor: pointer;
  transition: all 0.2s;
  text-align: left;
  
  &:hover {
    border-color: ${({ theme }) => theme.colors.primary[500]};
    background: ${({ theme }) => theme.colors.primary[50]};
  }
  
  .icon {
    width: 2rem;
    height: 2rem;
    margin-bottom: 0.5rem;
    color: ${({ $selected, theme }) => $selected ? theme.colors.primary[600] : theme.colors.gray[500]};
  }
  
  .title {
    font-weight: 600;
    font-size: 1rem;
    color: ${({ $selected, theme }) => $selected ? theme.colors.primary[700] : theme.colors.gray[900]};
    margin-bottom: 0.25rem;
  }
  
  .description {
    font-size: 0.875rem;
    color: ${({ theme }) => theme.colors.gray[600]};
    line-height: 1.4;
  }
`;

const AIConfigSection = styled.div`
  padding: 1rem;
  background: ${({ theme }) => theme.colors.primary[50]};
  border: 1px solid ${({ theme }) => theme.colors.primary[200]};
  border-radius: 0.75rem;
  margin-bottom: 1rem;
  
  .section-title {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.primary[700]};
    margin-bottom: 1rem;
    
    svg {
      width: 1.25rem;
      height: 1.25rem;
    }
  }
  
  .config-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1rem;
    
    @media (max-width: 640px) {
      grid-template-columns: 1fr;
    }
  }
`;

const EmailInputContainer = styled.div`
  position: relative;
  width: 100%;
  min-width: 300px;
`;

const EmailSuggestions = styled.div`
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 1px solid ${({ theme }) => theme.colors.gray[300]};
  border-top: none;
  border-radius: 0 0 0.375rem 0.375rem;
  max-height: 200px;
  overflow-y: auto;
  z-index: 1000;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  
  /* Custom scrollbar */
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: ${({ theme }) => theme.colors.gray[100]};
  }
  
  &::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.colors.gray[400]};
    border-radius: 3px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: ${({ theme }) => theme.colors.gray[500]};
  }
`;

const SuggestionItem = styled.div`
  padding: 0.75rem;
  cursor: pointer;
  border-bottom: 1px solid ${({ theme }) => theme.colors.gray[100]};
  transition: all 0.2s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.primary[50]};
    border-left: 3px solid ${({ theme }) => theme.colors.primary[500]};
    padding-left: calc(0.75rem - 3px);
  }
  
  &:last-child {
    border-bottom: none;
  }
  
  .candidate-name {
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
  }
  
  .candidate-email {
    font-size: 0.8rem;
    color: ${({ theme }) => theme.colors.primary[600]};
    margin-bottom: 0.25rem;
  }
  
  .candidate-position {
    font-size: 0.75rem;
    color: ${({ theme }) => theme.colors.gray[500]};
    font-style: italic;
  }
`;

const LoadingSpinner = styled.div`
  padding: 1rem 0.75rem;
  text-align: center;
  color: ${({ theme }) => theme.colors.text.secondary};
  font-size: 0.875rem;
  
  &::before {
    content: '';
    display: inline-block;
    width: 16px;
    height: 16px;
    border: 2px solid ${({ theme }) => theme.colors.gray[300]};
    border-top: 2px solid ${({ theme }) => theme.colors.primary[500]};
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-right: 0.5rem;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;



// ================================================================================


const StatusIndicator = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
  font-size: 0.75rem;
  font-weight: 500;
  
  ${({ $status }) => {
    switch ($status) {
      case 'live':
        return 'background: #dc2626; color: white;';
      case 'scheduled':
        return 'background: #f59e0b; color: white;';
      case 'completed':
        return 'background: #10b981; color: white;';
      default:
        return 'background: #6b7280; color: white;';
    }
  }}
  
  svg {
    width: 0.75rem;
    height: 0.75rem;
  }
`;

const Timer = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-family: 'JetBrains Mono', monospace;
  font-size: 0.875rem;
  color: ${({ $isRecording }) => $isRecording ? '#dc2626' : '#e5e7eb'};
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const MainContent = styled.main`
  flex: 1;
  display: grid;
  grid-template-columns: 1fr ${({ $sidebarOpen, $sidebarWidth }) =>
    $sidebarOpen ? `${$sidebarWidth}px` : '0px'};
  overflow: hidden;
  transition: grid-template-columns 0.3s ease;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    grid-template-rows: ${({ $sidebarOpen }) =>
    $sidebarOpen ? '1fr 300px' : '1fr 0px'};
  }
`;

const Sidebar = styled.aside`
  background: ${({ theme }) => theme.colors.white || '#ffffff'};
  border-left: 1px solid ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transition: all 0.3s ease;
  
  ${({ $isOpen }) => !$isOpen && `
    width: 0;
    border-left: none;
  `}
  
  @media (max-width: 768px) {
    border-left: none;
    border-top: 1px solid ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  }
`;

const SidebarTab = styled.button`
  flex: 1;
  padding: 0.75rem;
  background: none;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $active, theme }) => $active ? `
    background: white;
    color: ${theme.colors.primary?.[600] || '#2563eb'};
    border-bottom: 2px solid ${theme.colors.primary?.[600] || '#2563eb'};
  ` : `
    color: ${theme.colors.gray?.[600] || '#4b5563'};
    &:hover {
      background: ${theme.colors.gray?.[100] || '#f3f4f6'};
      color: ${theme.colors.gray?.[900] || '#111827'};
    }
  `}
  
  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const SidebarToggle = styled.button`
  position: absolute;
  top: 50%;
  right: ${({ $sidebarOpen }) => $sidebarOpen ? '0' : '-20px'};
  transform: translateY(-50%);
  width: 20px;
  height: 60px;
  background: ${({ theme }) => theme.colors.white || '#ffffff'};
  border: 1px solid ${({ theme }) => theme.colors.gray?.[300] || '#d1d5db'};
  border-right: none;
  border-radius: 10px 0 0 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  transition: all 0.3s ease;
  
  &:hover {
    background: ${({ theme }) => theme.colors.gray?.[50] || '#f9fafb'};
  }
  
  svg {
    width: 14px;
    height: 14px;
    color: ${({ theme }) => theme.colors.gray?.[600] || '#4b5563'};
  }
  
  @media (max-width: 768px) {
    display: none;
  }
`;


// =================================================================================================

const InterviewModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const [interviewType, setInterviewType] = useState('traditional'); // 'traditional' or 'ai'
  const [formData, setFormData] = useState({
    candidateEmail: '',
    candidateName: '',
    position: '',
    interviewDate: '',
    interviewTime: '',
    duration: 60,
    templateId: '',
    notes: '',
    // AI-specific fields
    aiPersonality: 'professional',
    interviewStyle: 'balanced'
  });

  // Email suggestions state
  const [emailSuggestions, setEmailSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingCandidates, setIsSearchingCandidates] = useState(false);
  const emailInputRef = useRef(null);
  const suggestionsRef = useRef(null);

  const createInterviewMutation = useCreateInterview();
  const { data: templatesData, isLoading: isLoadingTemplates, error: templatesError } = useTemplates();

  // Enhanced template data handling with multiple fallback paths
  const templates = React.useMemo(() => {
    if (!templatesData) return [];

    // Handle different possible API response structures
    if (templatesData.data?.templates) {
      return templatesData.data.templates;
    }
    if (templatesData.templates) {
      return templatesData.templates;
    }
    if (Array.isArray(templatesData)) {
      return templatesData;
    }

    console.warn('Unexpected templates data structure:', templatesData);
    return [];
  }, [templatesData]);

  // Debug logging for templates
  React.useEffect(() => {
    console.log('Templates Debug:', {
      templatesData,
      templatesCount: templates.length,
      isLoading: isLoadingTemplates,
      error: templatesError
    });
    console.log('User Debug:', {
      user: user,
      role: user?.role,
      isAuthenticated: !!user
    });
  }, [templatesData, templates.length, isLoadingTemplates, templatesError, user]);

  // Search candidates function
  const searchCandidates = async (searchTerm) => {
    if (!searchTerm || searchTerm.length < 2) {
      setEmailSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearchingCandidates(true);

    try {
      console.log('Searching users for term:', searchTerm);

      // Use the new searchUsers endpoint instead of getUsers
      const response = await userAPI.searchUsers({
        search: searchTerm,
        limit: 10
        // role: 'Candidate' // Temporarily removed to debug - let's see all users
      });

      console.log('User search response:', response);

      // Extract users from response - backend returns { success: true, data: { users } }
      let users = [];
      if (response.data?.users) {
        users = response.data.users;
      } else if (response.users) {
        users = response.users;
      } else if (Array.isArray(response.data)) {
        users = response.data;
      } else if (Array.isArray(response)) {
        users = response;
      }

      console.log('Extracted users:', users);

      // Transform users to candidate format
      const candidates = users.map(user => ({
        _id: user._id,
        name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username,
        email: user.email,
        role: user.role // Add role for debugging
      }));

      console.log('Transformed candidates:', candidates);

      if (candidates.length > 0) {
        setEmailSuggestions(candidates);
        setShowSuggestions(true);
      } else {
        // Smart fallback suggestions
        const smartSuggestions = [];

        if (searchTerm.includes('@')) {
          // If it looks like an email
          smartSuggestions.push({
            _id: 'smart-email',
            email: searchTerm,
            name: searchTerm.split('@')[0].replace(/[._]/g, ' '),
            isSmartSuggestion: true
          });
        } else {
          // If it looks like a name
          smartSuggestions.push({
            _id: 'smart-name',
            email: `${searchTerm.toLowerCase().replace(/\s+/g, '.')}@example.com`,
            name: searchTerm,
            isSmartSuggestion: true
          });
        }

        setEmailSuggestions(smartSuggestions);
        setShowSuggestions(true);
      }

    } catch (error) {
      console.error('User search error:', error);

      // Enhanced fallback with smart suggestions based on search term
      const smartSuggestions = [];

      if (searchTerm.includes('@')) {
        // If it looks like an email
        smartSuggestions.push({
          _id: 'smart-email',
          email: searchTerm,
          name: searchTerm.split('@')[0].replace(/[._]/g, ' '),
          position: 'Candidate',
          isSmartSuggestion: true
        });
      } else {
        // If it looks like a name
        smartSuggestions.push({
          _id: 'smart-name',
          email: `${searchTerm.toLowerCase().replace(/\s+/g, '.')}@example.com`,
          name: searchTerm,
          position: 'Software Developer',
          isSmartSuggestion: true
        });
      }

      setEmailSuggestions(smartSuggestions);
      setShowSuggestions(true);

      // Optional: Show a subtle error message
      if (error.response?.status !== 404) {
        console.warn('Failed to search users, suggestions unavailable');
      }
    } finally {
      setIsSearchingCandidates(false);
    }
  };

  // Handle email input change with debounced search
  const handleEmailChange = (e) => {
    const value = e.target.value;
    console.log('Email input changed:', value);

    setFormData(prev => ({
      ...prev,
      candidateEmail: value,
      // Clear candidate name when email changes manually
      candidateName: value === '' ? '' : prev.candidateName
    }));

    // Debounce the search
    clearTimeout(handleEmailChange.debounceTimer);
    handleEmailChange.debounceTimer = setTimeout(() => {
      console.log('Triggering search for:', value);
      searchCandidates(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSuggestionSelect = (candidate) => {
    console.log('Suggestion selected:', candidate);
    setFormData(prev => ({
      ...prev,
      candidateEmail: candidate.email,
      candidateName: candidate.name,
      position: candidate.position || prev.position
    }));
    setShowSuggestions(false);
    setEmailSuggestions([]);
  };

  // Click outside to close suggestions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target) &&
        emailInputRef.current && !emailInputRef.current.contains(event.target)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Debug logging for suggestion states
  useEffect(() => {
    console.log('Suggestion state changed:', {
      showSuggestions,
      suggestionsCount: emailSuggestions.length,
      isSearching: isSearchingCandidates
    });
  }, [showSuggestions, emailSuggestions.length, isSearchingCandidates]);

  // Clear suggestions when modal closes
  useEffect(() => {
    if (!isOpen) {
      setShowSuggestions(false);
      setEmailSuggestions([]);
    }
  }, [isOpen]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      console.log("I Got Data From Interview Form");

      if (interviewType === 'ai') {
        // AI Interview Creation
        if (!formData.templateId) {
          toast.error('Please select a template for AI interview');
          return;
        }

        const aiInterviewPayload = {
          templateId: formData.templateId,
          candidateEmail: formData.candidateEmail,
          candidateName: formData.candidateName,
          position: formData.position,
          aiPersonality: formData.aiPersonality,
          interviewStyle: formData.interviewStyle,
          duration: parseInt(formData.duration),
          notes: formData.notes
        };

        console.log("AI Interview payload:", aiInterviewPayload);

        try {
          const response = await aiInterviewAPI.createFromTemplate(aiInterviewPayload);
          toast.success('AI Interview created successfully!');
          console.log('AI Interview created:', response);
        } catch (err) {
          console.error('AI Interview creation error:', err);
          toast.error('Failed to create AI interview');
          return;
        }
      } else {
        // Traditional Interview Creation
        const interviewPayload = {
          candidateEmail: formData.candidateEmail,
          candidateName: formData.candidateName,
          position: formData.position,
          interviewDate: formData.interviewDate,
          interviewTime: formData.interviewTime,
          duration: parseInt(formData.duration),
          notes: formData.notes
        };

        // Regular interviews do not use templates
        console.log("Traditional Interview payload:", interviewPayload);

        try {
          await interviewAPI.createInterview(interviewPayload);
          toast.success('Interview scheduled successfully!');
        } catch (err) {
          console.error('Interview creation error:', err);
          toast.error('Failed to schedule interview');
          return;
        }
      }

      // Reset form and close modal
      setFormData({
        candidateEmail: '',
        candidateName: '',
        position: '',
        interviewDate: '',
        interviewTime: '',
        duration: 60,
        templateId: '',
        notes: '',
        aiPersonality: 'professional',
        interviewStyle: 'balanced'
      });
      handleInterviewTypeChange('traditional');

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Failed to create interview:', error);
      console.error('Error response data:', error.response?.data);
      console.error('Error response status:', error.response?.status);

      // Enhanced error handling for specific cases
      if (error.response?.status === 403) {
        if (error.response?.data?.includes?.('Insufficient permissions')) {
          toast.error('You need Admin or Recruiter permissions to create AI interviews. Please contact your administrator.');
        } else {
          toast.error('Access denied. Please check your permissions.');
        }
      } else if (error.response?.status === 401) {
        toast.error('Please log in again to continue.');
      } else if (error.response?.status === 400) {
        const errorMessage = error.response?.data?.message || 'Invalid request data';
        toast.error(errorMessage);
      } else if (error.response?.status === 500) {
        const errorMessage = error.response?.data?.message || 'Server error. Please try again later.';
        console.error('500 Error Details:', error.response?.data);
        toast.error(`Server Error: ${errorMessage}`);
      } else if (error.code === 'NETWORK_ERROR' || !error.response) {
        toast.error('Network error. Please check your connection.');
      } else {
        toast.error(error.response?.data?.message || 'An unexpected error occurred');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleInterviewTypeChange = (type) => {
    setInterviewType(type);
    // Clear templateId when switching to regular interview since it doesn't use templates
    if (type === 'traditional') {
      setFormData(prev => ({
        ...prev,
        templateId: ''
      }));
    }
  };

  if (!isOpen) return null;

  return (
    <Modal onClick={(e) => e.target === e.currentTarget && onClose()}>
      <ModalContent $size="lg">
        <ModalHeader>
          <H2>{interviewType === 'ai' ? 'Create AI Interview' : 'Schedule New Interview'}</H2>
          <CloseButton onClick={onClose} type="button">
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <Form onSubmit={handleSubmit}>
          <ModalBody>
            {/* Interview Type Selection */}
            <InterviewTypeSelector>
              <TypeOption
                type="button"
                $selected={interviewType === 'traditional'}
                onClick={() => handleInterviewTypeChange('traditional')}
              >
                <User className="icon" />
                <div className="title">Traditional Interview</div>
                <div className="description">Schedule a regular interview with human interviewer</div>
              </TypeOption>

              <TypeOption
                type="button"
                $selected={interviewType === 'ai'}
                onClick={() => handleInterviewTypeChange('ai')}
              >
                <Bot className="icon" />
                <div className="title">AI Interview</div>
                <div className="description">Automated AI-powered interview using templates</div>
              </TypeOption>
            </InterviewTypeSelector>

            {/* Basic Information */}
            <FormRow>
              <FormGroup>
                <Label htmlFor="candidateName">Candidate Name *</Label>
                <Input
                  id="candidateName"
                  name="candidateName"
                  value={formData.candidateName}
                  onChange={handleChange}
                  placeholder="Enter candidate's full name"
                  required
                />
              </FormGroup>

              <FormGroup>
                <Label htmlFor="candidateEmail">Candidate Email *</Label>
                <EmailInputContainer>
                  <Input
                    style={{ width: "100%" }}
                    ref={emailInputRef}
                    id="candidateEmail"
                    name="candidateEmail"
                    type="email"
                    value={formData.candidateEmail}
                    onChange={handleEmailChange}
                    placeholder="Start typing name or email to search users"
                    required
                    autoComplete="off"
                  />
                  {showSuggestions && (
                    <EmailSuggestions ref={suggestionsRef}>
                      {isSearchingCandidates ? (
                        <LoadingSpinner>Searching candidates...</LoadingSpinner>
                      ) : emailSuggestions.length > 0 ? (
                        emailSuggestions.map((candidate) => (
                          <SuggestionItem
                            key={candidate._id || candidate.email}
                            onClick={() => handleSuggestionSelect(candidate)}
                          >
                            <div className="candidate-name">{candidate.name}</div>
                            <div className="candidate-email">{candidate.email}</div>
                            {candidate.role && (
                              <div className="candidate-position">{candidate.role}</div>
                            )}
                          </SuggestionItem>
                        ))
                      ) : (
                        <LoadingSpinner>No candidates found</LoadingSpinner>
                      )}
                    </EmailSuggestions>
                  )}
                </EmailInputContainer>
                <Text style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                  Type a name or email to search existing users, or enter email directly
                </Text>
              </FormGroup>
            </FormRow>

            <FormGroup>
              <Label htmlFor="position">Position *</Label>
              <Input
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                placeholder="e.g., Frontend Developer, Product Manager"
                required
              />
            </FormGroup>

            {/* Date/Time - Only for traditional interviews */}
            {interviewType === 'traditional' && (
              <FormRow>
                <FormGroup>
                  <Label htmlFor="interviewDate">Interview Date *</Label>
                  <Input
                    id="interviewDate"
                    name="interviewDate"
                    type="date"
                    value={formData.interviewDate}
                    onChange={handleChange}
                    min={new Date().toISOString().split('T')[0]}
                    required
                  />
                </FormGroup>

                <FormGroup>
                  <Label htmlFor="interviewTime">Interview Time *</Label>
                  <Input
                    id="interviewTime"
                    name="interviewTime"
                    type="time"
                    value={formData.interviewTime}
                    onChange={handleChange}
                    required
                  />
                </FormGroup>
              </FormRow>
            )}

            {/* AI Configuration */}
            {interviewType === 'ai' && (
              <AIConfigSection>
                <div className="section-title">
                  <Zap />
                  AI Interview Configuration
                </div>
                <div className="config-grid">
                  <FormGroup>
                    <Label htmlFor="aiPersonality">AI Personality</Label>
                    <Select
                      id="aiPersonality"
                      name="aiPersonality"
                      value={formData.aiPersonality}
                      onChange={handleChange}
                    >
                      <option value="professional">Professional</option>
                      <option value="friendly">Friendly</option>
                      <option value="technical">Technical</option>
                      <option value="casual">Casual</option>
                      <option value="formal">Formal</option>
                    </Select>
                  </FormGroup>

                  <FormGroup>
                    <Label htmlFor="interviewStyle">Interview Style</Label>
                    <Select
                      id="interviewStyle"
                      name="interviewStyle"
                      value={formData.interviewStyle}
                      onChange={handleChange}
                    >
                      <option value="balanced">Balanced</option>
                      <option value="technical">Technical Focus</option>
                      <option value="behavioral">Behavioral Focus</option>
                      <option value="mixed">Mixed Approach</option>
                    </Select>
                  </FormGroup>
                </div>
              </AIConfigSection>
            )}

            <FormRow>
              <FormGroup>
                <Label htmlFor="duration">Duration (minutes)</Label>
                <Select
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleChange}
                >
                  <option value={30}>30 minutes</option>
                  <option value={45}>45 minutes</option>
                  <option value={60}>60 minutes</option>
                  <option value={90}>90 minutes</option>
                  <option value={120}>120 minutes</option>
                </Select>
              </FormGroup>

              {/* Template Selection - Only for AI Interviews */}
              {interviewType === 'ai' && (
                <FormGroup>
                  <Label htmlFor="templateId">
                    Interview Template *
                  </Label>
                  <Select
                    id="templateId"
                    name="templateId"
                    value={formData.templateId}
                    onChange={handleChange}
                    required
                  >
                    <option value="">
                      {isLoadingTemplates
                        ? 'Loading templates...'
                        : 'Select a template (required)'
                      }
                    </option>
                    {!isLoadingTemplates && templates.map((template) => (
                      <option key={template._id} value={template._id}>
                        {template.title} - {template.category} ({template.difficulty})
                      </option>
                    ))}
                  </Select>
                  <Text style={{ fontSize: '0.75rem', color: '#6b7280', marginTop: '0.25rem' }}>
                    AI interviews require a template to generate questions
                  </Text>
                  {templatesError && (
                    <Text style={{ fontSize: '0.75rem', color: '#ef4444', marginTop: '0.25rem' }}>
                      Error loading templates: {templatesError?.response?.data?.message || templatesError.message || 'Failed to load templates'}
                    </Text>
                  )}
                  {!isLoadingTemplates && !templatesError && templates.length === 0 && (
                    <Text style={{ fontSize: '0.75rem', color: '#f59e0b', marginTop: '0.25rem' }}>
                      No templates available. Please create a template first.
                    </Text>
                  )}
                </FormGroup>
              )}
            </FormRow>

            <FormGroup>
              <Label htmlFor="notes">Additional Notes</Label>
              <TextArea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                placeholder="Any additional information about the interview..."
                rows={3}
              />
            </FormGroup>
          </ModalBody>

          <ModalFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={createInterviewMutation.isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={createInterviewMutation.isLoading}
            >
              {createInterviewMutation.isLoading ?
                (interviewType === 'ai' ? 'Creating AI Interview...' : 'Scheduling...') :
                (interviewType === 'ai' ? 'Create AI Interview' : 'Schedule Interview')
              }
            </Button>
          </ModalFooter>
        </Form>
      </ModalContent>
    </Modal>
  );
};

export default InterviewModal;