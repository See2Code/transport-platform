import styled from '@emotion/styled';

export const PageWrapper = styled('div')({
  padding: '24px',
  position: 'relative',
  maxWidth: '100%',
  overflowX: 'hidden',
  '@media (max-width: 600px)': {
    padding: '8px',
    paddingBottom: '80px'
  }
}); 