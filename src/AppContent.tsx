import React from 'react';
import { Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme, styled, CssBaseline, GlobalStyles, Theme } from '@mui/material';
import { SxProps } from '@mui/system';
import Box from '@mui/material/Box';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Team from './components/Team';
import Contacts from './components/Contacts';
import Settings from './components/Settings';
import TrackedTransports from './components/TrackedTransports';
import BusinessCases from './components/BusinessCases';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import PrivateRoute from './components/PrivateRoute';
import RegisterUser from './components/RegisterUser';
import OrdersForm from './components/Orders';
import InvoicesPage from './components/Invoices';
import { useThemeMode } from './contexts/ThemeContext';

type AppContainerProps = {
  isDarkMode: boolean;
  children: React.ReactNode;
};

type PageContentProps = {
  isDarkMode: boolean;
  children: React.ReactNode;
};

const AppContainer = ({ isDarkMode, children }: AppContainerProps) => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      minHeight: '100vh',
      width: '100%',
      backgroundColor: isDarkMode ? '#12121f' : '#ffffff',
      position: 'relative',
    }}
  >
    {children}
  </Box>
);

const PageContent = ({ isDarkMode, children }: PageContentProps) => (
  <Box
    sx={{
      flexGrow: 1,
      marginTop: '64px',
      padding: '24px 16px',
      backgroundColor: isDarkMode ? '#12121f' : '#ffffff',
      position: 'relative',
      zIndex: 1,
      '@media (max-width: 600px)': {
        marginTop: '56px',
        padding: '16px',
      },
    }}
  >
    {children}
  </Box>
);

const AppContent: React.FC = () => {
  const { isDarkMode } = useThemeMode();

  const theme = createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      background: {
        default: isDarkMode ? '#12121f' : '#ffffff',
        paper: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#f5f5f5',
      },
      text: {
        primary: isDarkMode ? '#ffffff' : '#000000',
        secondary: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
      },
    },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: {
            backgroundColor: isDarkMode ? '#12121f' : '#ffffff',
            margin: 0,
            padding: 0,
          },
        },
      },
    },
  });

  const globalStyles = {
    '*': {
      boxSizing: 'border-box',
      margin: 0,
      padding: 0,
    },
    'html, body': {
      backgroundColor: isDarkMode ? '#12121f' : '#ffffff',
      minHeight: '100vh',
      width: '100%',
    },
    '#root': {
      backgroundColor: isDarkMode ? '#12121f' : '#ffffff',
      minHeight: '100vh',
      width: '100%',
    },
  };

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <AppContainer isDarkMode={isDarkMode}>
        <Routes>
          {/* Verejné cesty */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-user" element={<RegisterUser />} />
          <Route path="/accept-invitation/:invitationId" element={<RegisterUser />} />
          
          {/* Chránené cesty */}
          <Route path="/dashboard" element={
            <PrivateRoute>
              <PageContent isDarkMode={isDarkMode}>
                <Navbar />
                <Dashboard />
              </PageContent>
            </PrivateRoute>
          } />
          <Route path="/team" element={
            <PrivateRoute>
              <PageContent isDarkMode={isDarkMode}>
                <Navbar />
                <Team />
              </PageContent>
            </PrivateRoute>
          } />
          <Route path="/contacts" element={
            <PrivateRoute>
              <PageContent isDarkMode={isDarkMode}>
                <Navbar />
                <Contacts />
              </PageContent>
            </PrivateRoute>
          } />
          <Route path="/settings" element={
            <PrivateRoute>
              <PageContent isDarkMode={isDarkMode}>
                <Navbar />
                <Settings />
              </PageContent>
            </PrivateRoute>
          } />
          <Route path="/tracked-transports" element={
            <PrivateRoute>
              <PageContent isDarkMode={isDarkMode}>
                <Navbar />
                <TrackedTransports />
              </PageContent>
            </PrivateRoute>
          } />
          <Route path="/business-cases" element={
            <PrivateRoute>
              <PageContent isDarkMode={isDarkMode}>
                <Navbar />
                <BusinessCases />
              </PageContent>
            </PrivateRoute>
          } />
          <Route path="/orders" element={
            <PrivateRoute>
              <PageContent isDarkMode={isDarkMode}>
                <Navbar />
                <OrdersForm />
              </PageContent>
            </PrivateRoute>
          } />
          <Route path="/invoices" element={
            <PrivateRoute>
              <PageContent isDarkMode={isDarkMode}>
                <Navbar />
                <InvoicesPage />
              </PageContent>
            </PrivateRoute>
          } />
        </Routes>
      </AppContainer>
    </MuiThemeProvider>
  );
};

export default AppContent; 