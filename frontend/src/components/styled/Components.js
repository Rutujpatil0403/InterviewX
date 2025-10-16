import styled from 'styled-components';

export const Button = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: ${({ $size, size }) => ($size || size) === 'sm' ? '0.5rem 1rem' : '0.75rem 1.5rem'};
  border-radius: 0.375rem;
  font-size: ${({ $size, size }) => ($size || size) === 'sm' ? '0.875rem' : '1rem'};
  font-weight: 500;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  
  ${({ $variant, variant, theme }) => {
    const variantValue = $variant || variant;
    switch (variantValue) {
      case 'primary':
        return `
          background-color: ${theme.colors.primary[600]};
          color: white;
          &:hover { background-color: ${theme.colors.primary[700]}; }
        `;
      case 'outline':
        return `
          background-color: transparent;
          color: ${theme.colors.primary[600]};
          border: 1px solid ${theme.colors.primary[600]};
          &:hover { background-color: ${theme.colors.primary[50]}; }
        `;
      case 'ghost':
        return `
          background-color: transparent;
          color: ${theme.colors.text.secondary};
          &:hover { background-color: ${theme.colors.gray[100]}; }
        `;
      default:
        return `
          background-color: ${theme.colors.gray[100]};
          color: ${theme.colors.text.primary};
          &:hover { background-color: ${theme.colors.gray[200]}; }
        `;
    }
  }}
`;

export const Card = styled.div`
  background-color: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 1px solid ${({ theme }) => theme.colors.border.light};
  padding: ${({ $padding, padding }) => ($padding || padding) ? `${($padding || padding) * 0.25}rem` : '1.5rem'};
`;

export const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ $size, size }) => ($size || size) === 'sm' ? '0.25rem 0.5rem' : '0.375rem 0.75rem'};
  border-radius: 9999px;
  font-size: ${({ $size, size }) => ($size || size) === 'sm' ? '0.75rem' : '0.875rem'};
  font-weight: 500;
  
  ${({ $color, color, $variant, variant, theme }) => {
    const colorValue = $color || color || $variant || variant;
    const colors = {
      primary: `background-color: ${theme.colors.primary[100]}; color: ${theme.colors.primary[700]};`,
      success: `background-color: ${theme.colors.success[100]}; color: ${theme.colors.success[700]};`,
      warning: `background-color: ${theme.colors.warning[100]}; color: ${theme.colors.warning[700]};`,
      danger: `background-color: ${theme.colors.danger[100]}; color: ${theme.colors.danger[700]};`,
      gray: `background-color: ${theme.colors.gray[100]}; color: ${theme.colors.gray[700]};`,
      secondary: `background-color: ${theme.colors.gray[100]}; color: ${theme.colors.gray[700]};`
    };
    return colors[colorValue] || colors.gray;
  }}
`;

export const Modal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
`;

export const ModalContent = styled.div`
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  width: 100%;
  max-width: ${({ $size, size }) => {
    const sizeValue = $size || size;
    switch (sizeValue) {
      case 'sm': return '28rem';
      case 'lg': return '56rem';
      case 'xl': return '72rem';
      default: return '32rem';
    }
  }};
  max-height: 90vh;
  overflow-y: auto;
`;

export const ModalHeader = styled.div`
  padding: 1.5rem;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

export const ModalBody = styled.div`
  padding: 1.5rem;
`;

export const ModalFooter = styled.div`
  padding: 1.5rem;
  border-top: 1px solid ${({ theme }) => theme.colors.border.light};
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
`;
