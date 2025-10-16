import React, { useState } from "react";
import styled, { keyframes } from "styled-components";
import { Trash2, AlertCircle, X, Loader } from "lucide-react";

// Animations
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const slideIn = keyframes`
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

// Styled Components
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
  animation: ${fadeIn} 0.2s ease-out;
  padding: 1rem;
`;

const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
  animation: ${slideIn} 0.3s ease-out;
`;

const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const ModalTitle = styled.h3`
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CloseButton = styled.button`
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.375rem;
  transition: all 0.2s;

  &:hover {
    background: #f3f4f6;
    color: #111827;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const ModalBody = styled.div`
  padding: 1.5rem;
`;

const AlertBox = styled.div`
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 0.5rem;
  padding: 1rem;
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;

  svg {
    color: #ef4444;
    flex-shrink: 0;
  }
`;

const AlertContent = styled.div`
  flex: 1;
`;

const AlertTitle = styled.div`
  font-weight: 600;
  font-size: 0.875rem;
  color: #991b1b;
  margin-bottom: 0.25rem;
`;

const AlertMessage = styled.div`
  font-size: 0.875rem;
  color: #991b1b;
  line-height: 1.4;
`;

const MessageText = styled.p`
  color: #6b7280;
  font-size: 0.875rem;
  line-height: 1.5;
  margin: 0 0 1rem 0;
`;

const InterviewDetails = styled.div`
  background: #f9fafb;
  border-radius: 0.5rem;
  padding: 1rem;
  margin-bottom: 1rem;
`;

const DetailRow = styled.div`
  display: flex;
  justify-content: space-between;
  padding: 0.5rem 0;
  font-size: 0.875rem;

  &:not(:last-child) {
    border-bottom: 1px solid #e5e7eb;
  }
`;

const DetailLabel = styled.span`
  color: #6b7280;
  font-weight: 500;
`;

const DetailValue = styled.span`
  color: #111827;
  font-weight: 600;
`;

const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 0.625rem 1.25rem;
  border-radius: 0.5rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  border: none;

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  &.cancel {
    background: white;
    color: #6b7280;
    border: 1px solid #d1d5db;

    &:hover:not(:disabled) {
      background: #f9fafb;
    }
  }

  &.delete {
    background: #dc2626;
    color: white;

    &:hover:not(:disabled) {
      background: #b91c1c;
    }
  }

  svg {
    width: 1rem;
    height: 1rem;
  }
`;

const Spinner = styled.div`
  animation: ${spin} 1s linear infinite;
`;

// Delete Confirmation Modal Component
const DeleteInterviewModal = ({ isOpen, onClose, onConfirm, interview, loading, error }) => {
  if (!isOpen) return null;

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <ModalOverlay onClick={onClose}>
      <ModalContent onClick={(e) => e.stopPropagation()}>
        <ModalHeader>
          <ModalTitle>
            <Trash2 size={20} />
            Delete Interview
          </ModalTitle>
          <CloseButton onClick={onClose} disabled={loading}>
            <X size={20} />
          </CloseButton>
        </ModalHeader>

        <ModalBody>
          <AlertBox>
            <AlertCircle size={20} />
            <AlertContent>
              <AlertTitle>Warning</AlertTitle>
              <AlertMessage>
                This action cannot be undone. The interview will be permanently deleted.
              </AlertMessage>
            </AlertContent>
          </AlertBox>

          {error && (
            <AlertBox style={{ background: '#fef2f2', borderColor: '#fecaca' }}>
              <AlertCircle size={20} />
              <AlertContent>
                <AlertTitle>Error</AlertTitle>
                <AlertMessage>{error}</AlertMessage>
              </AlertContent>
            </AlertBox>
          )}

          <MessageText>
            Are you sure you want to delete this interview? This will remove all associated data including answers and scores.
          </MessageText>

          {interview && (
            <InterviewDetails>
              <DetailRow>
                <DetailLabel>Candidate:</DetailLabel>
                <DetailValue>
                  {interview.candidateId?.name || interview.candidateName || 'Unknown'}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Email:</DetailLabel>
                <DetailValue>
                  {interview.candidateId?.email || interview.candidateEmail || 'N/A'}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Position:</DetailLabel>
                <DetailValue>
                  {interview.position || interview.jobTitle || 'N/A'}
                </DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Status:</DetailLabel>
                <DetailValue>{interview.status || 'N/A'}</DetailValue>
              </DetailRow>
              <DetailRow>
                <DetailLabel>Scheduled:</DetailLabel>
                <DetailValue>{formatDate(interview.interviewDate)}</DetailValue>
              </DetailRow>
            </InterviewDetails>
          )}
        </ModalBody>

        <ModalFooter>
          <Button className="cancel" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button className="delete" onClick={onConfirm} disabled={loading}>
            {loading ? (
              <>
                <Spinner><Loader size={16} /></Spinner>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 size={16} />
                Delete Interview
              </>
            )}
          </Button>
        </ModalFooter>
      </ModalContent>
    </ModalOverlay>
  );
};

export default DeleteInterviewModal;