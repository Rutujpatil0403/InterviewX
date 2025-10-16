// src/components/Common/Modal.jsx
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styled from 'styled-components';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';

const ModalOverlay = styled(motion.div).withConfig({
  shouldForwardProp: (prop) => !['isOpen'].includes(prop),
})`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: ${({ theme }) => theme.zIndex[50] || 50};
  display: flex;
  align-items: center;
  justify-content: center;
  padding: ${({ theme }) => theme.spacing[4]};
`;

const Backdrop = styled(motion.div)`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
`;

const ModalContent = styled(motion.div)`
  position: relative;
  background-color: ${({ theme }) => theme.colors.white};
  border-radius: ${({ theme }) => theme.borderRadius.xl};
  box-shadow: ${({ theme }) => theme.shadows['2xl']};
  width: 100%;
  
  ${({ size }) => {
    switch (size) {
      case 'sm':
        return `max-width: 28rem;`;
      case 'md':
        return `max-width: 32rem;`;
      case 'lg':
        return `max-width: 42rem;`;
      case 'xl':
        return `max-width: 56rem;`;
      case 'full':
        return `max-width: 80rem;`;
      default:
        return `max-width: 32rem;`;
    }
  }}
`;

const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: ${({ theme }) => theme.spacing[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.secondary[200]};
`;

const ModalTitle = styled.h3`
  font-size: ${({ theme }) => theme.fontSize.lg};
  font-weight: ${({ theme }) => theme.fontWeight.semibold};
  color: ${({ theme }) => theme.colors.secondary[900]};
  margin: 0;
`;

const CloseButton = styled.button`
  padding: ${({ theme }) => theme.spacing[1]};
  border-radius: ${({ theme }) => theme.borderRadius.lg};
  background: none;
  border: none;
  cursor: pointer;
  transition: ${({ theme }) => theme.transitions.colors};
  
  &:hover {
    background-color: ${({ theme }) => theme.colors.secondary[100]};
  }
  
  svg {
    width: 1.25rem;
    height: 1.25rem;
    color: ${({ theme }) => theme.colors.secondary[500]};
  }
`;

const ModalBody = styled.div`
  padding: ${({ theme }) => theme.spacing[6]};
`;

const Modal = ({ 
  isOpen, 
  onClose, 
  children, 
  title,
  size = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEscape = true,
  ...props
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (closeOnEscape && e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose, closeOnEscape]);

  if (!isOpen) return null;

  const handleOverlayClick = (e) => {
    if (closeOnOverlayClick && e.target === e.currentTarget) {
      onClose();
    }
  };

  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <ModalOverlay>
          <Backdrop
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={handleOverlayClick}
          />
          
          <ModalContent
            size={size}
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            {...props}
          >
            {(title || showCloseButton) && (
              <ModalHeader>
                {title && (
                  <ModalTitle>
                    {title}
                  </ModalTitle>
                )}
                {showCloseButton && (
                  <CloseButton onClick={onClose}>
                    <X />
                  </CloseButton>
                )}
              </ModalHeader>
            )}
            
            <ModalBody>
              {children}
            </ModalBody>
          </ModalContent>
        </ModalOverlay>
      )}
    </AnimatePresence>
  );

  return createPortal(modalContent, document.body);
};

export default Modal;
