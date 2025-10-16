import styled from 'styled-components';

export const H1 = styled.h1`
  font-size: 2.25rem;
  font-weight: 700;
  margin: 0 0 1rem 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

export const H2 = styled.h2`
  font-size: 1.875rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

export const H3 = styled.h3`
  font-size: 1.5rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: ${({ theme }) => theme.colors.text.primary};
`;

export const Text = styled.p`
  font-size: ${({ size }) => size === 'sm' ? '0.875rem' : '1rem'};
  color: ${({ color, theme }) => {
    if (color === 'secondary') return theme.colors.text.secondary;
    if (color === 'tertiary') return theme.colors.text.tertiary;
    return theme.colors.text.primary;
  }};
  margin: ${({ margin }) => margin || '0'};
`;
