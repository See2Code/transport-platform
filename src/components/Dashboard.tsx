import React, { ReactNode } from 'react';
import { Box } from '@mui/material';
import Navbar from './Navbar';

interface DashboardProps {
  children?: ReactNode;
}

function Dashboard({ children }: DashboardProps) {
  return (
    <Box sx={{ display: 'flex' }}>
      <Navbar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: 8 }}>
        {children}
      </Box>
    </Box>
  );
}

export default Dashboard; 