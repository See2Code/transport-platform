import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';

interface DashboardLayoutProps {
  children?: ReactNode;
}

function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      minHeight: '100vh', 
      overflow: 'hidden' 
    }}>
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1,
          p: 0,
          background: 'transparent',
          display: 'flex',
          flexDirection: 'column',
          minHeight: 'calc(100vh - 64px)',
          overflow: 'auto'
        }}
      >
        {children}
      </Box>
      <Navbar />
    </Box>
  );
}

export default DashboardLayout; 