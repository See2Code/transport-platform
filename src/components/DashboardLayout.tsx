import React, { ReactNode } from 'react';
import { Box, styled } from '@mui/material';
import Navbar from './Navbar';
import { useThemeMode } from '../contexts/ThemeContext';

interface DashboardLayoutProps {
  children?: ReactNode;
}

const LayoutContainer = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  overflow: 'hidden',
  background: isDarkMode 
    ? 'linear-gradient(135deg, rgba(28, 28, 45, 0.95) 0%, rgba(28, 28, 45, 0.97) 100%)'
    : 'linear-gradient(135deg, rgba(255, 255, 255, 0.95) 0%, rgba(245, 245, 245, 0.97) 100%)',
  backdropFilter: 'blur(10px)',
}));

const MainContent = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  flexGrow: 1,
  padding: 0,
  display: 'flex',
  flexDirection: 'column',
  minHeight: 'calc(100vh - 64px)',
  overflow: 'auto',
  position: 'relative',
  '&::-webkit-scrollbar': {
    width: '8px',
    height: '8px',
  },
  '&::-webkit-scrollbar-track': {
    background: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    borderRadius: '4px',
  },
  '&::-webkit-scrollbar-thumb': {
    background: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    borderRadius: '4px',
    '&:hover': {
      background: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
    },
  },
  '@media (max-width: 600px)': {
    minHeight: 'calc(100vh - 56px)',
  },
}));

function DashboardLayout({ children }: DashboardLayoutProps) {
  const { isDarkMode } = useThemeMode();

  return (
    <LayoutContainer isDarkMode={isDarkMode}>
      <MainContent 
        component="main"
        isDarkMode={isDarkMode}
      >
        {children}
      </MainContent>
      <Navbar />
    </LayoutContainer>
  );
}

export default DashboardLayout; 