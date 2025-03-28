import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { routerConfig } from './router/config';
import AppContent from './AppContent';

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <BrowserRouter future={routerConfig.future}>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
};

export default App;
