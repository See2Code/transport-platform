import { Paper } from '@mui/material';
import styled from '@emotion/styled';
import { colors } from '../../theme/colors';

interface StyledCardProps {
  isDarkMode: boolean;
}

export const StyledCard = styled(Paper)<StyledCardProps>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: isDarkMode 
    ? '0 4px 20px rgba(0, 0, 0, 0.25)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.3)',
    border: '1px solid rgba(255, 159, 67, 0.3)',
  },
  '@media (max-width: 600px)': {
    borderRadius: '16px',
  }
})); 