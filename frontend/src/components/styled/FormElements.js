import styled from 'styled-components';

export const Input = styled.input`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;

export const Select = styled.select`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background-color: white;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
  }
`;

export const TextArea = styled.textarea`
  padding: 0.75rem 1rem;
  border: 1px solid ${({ theme }) => theme.colors.border.medium};
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
  min-height: 80px;
  transition: all 0.2s;
  
  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary[500]};
    box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.primary[100]};
  }
`;
