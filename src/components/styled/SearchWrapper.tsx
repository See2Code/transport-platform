import { Box } from '@mui/material';
import styled from '@emotion/styled';

export const SearchWrapper = styled(Box)({
  marginBottom: '24px',
  position: 'relative',
  zIndex: 1,
  maxWidth: '600px',
  width: '100%',
  '@media (max-width: 600px)': {
    maxWidth: '100%',
  }
}); 