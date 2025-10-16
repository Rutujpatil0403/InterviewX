import styled from 'styled-components';

export const Container = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 0 1rem;
`;

export const Flex = styled.div.withConfig({
  shouldForwardProp: (prop) => !['direction', 'alignItems', 'justifyContent', 'gap', 'marginBottom'].includes(prop)
})`
  display: flex;
  flex-direction: ${props => props.$direction || props.direction || 'row'};
  align-items: ${props => props.$alignItems || props.alignItems || 'stretch'};
  justify-content: ${props => props.$justifyContent || props.justifyContent || 'flex-start'};
  gap: ${props => {
    const gap = props.$gap || props.gap;
    return gap ? `${gap * 0.25}rem` : '0';
  }};
  margin-bottom: ${props => {
    const marginBottom = props.$marginBottom || props.marginBottom;
    return marginBottom ? `${marginBottom * 0.25}rem` : '0';
  }};
`;

export const Box = styled.div.withConfig({
  shouldForwardProp: (prop) => !['padding', 'textAlign'].includes(prop)
})`
  padding: ${props => {
    const padding = props.$padding || props.padding;
    return padding ? `${padding * 0.25}rem` : '0';
  }};
  text-align: ${props => props.$textAlign || props.textAlign || 'left'};
`;

export const Grid = styled.div.withConfig({
  shouldForwardProp: (prop) => !['gap'].includes(prop)
})`
  display: grid;
  gap: ${props => props.gap ? `${props.gap * 0.25}rem` : '1rem'};
`;
