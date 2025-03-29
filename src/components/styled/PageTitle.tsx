import { Typography } from '@mui/material';
import styled from '@emotion/styled';
import { colors } from '../../theme/colors';

interface PageTitleProps {
  isDarkMode: boolean;
}

export const PageTitle = styled(Typography)<PageTitleProps>(({ isDarkMode }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: colors.accent.main,
    borderRadius: '2px',
  },
  '@media (max-width: 600px)': {
    fontSize: '1.5rem'
  }
})); 