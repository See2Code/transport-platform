import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { routerConfig } from './router/config';
import AppContent from './AppContent';

const App: React.FC = () => {
  return (
    <BrowserRouter future={routerConfig.future}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
