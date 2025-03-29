import { Box } from '@mui/material';
import styled from '@emotion/styled';

export const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  position: 'relative',
  zIndex: 1,
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'flex-start',
    padding: '16px 0'
  }
}); 