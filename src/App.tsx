import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider as MuiThemeProvider, createTheme, styled, CssBaseline, GlobalStyles } from '@mui/material';
import Navbar from './components/Navbar';
import Dashboard from './components/Dashboard';
import Team from './components/Team';
import Contacts from './components/Contacts';
import Settings from './components/Settings';
import Transport from './components/Transport';
import TrackedTransports from './components/TrackedTransports';
import BusinessCases from './components/BusinessCases';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider } from './contexts/AuthContext';
import RegisterUser from './components/RegisterUser';
import { ThemeProvider } from './contexts/ThemeContext';
import { useThemeMode } from './contexts/ThemeContext';

const AppContent = () => {
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

  const AppContainer = styled('div')<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: isDarkMode ? '#12121f' : '#ffffff',
    position: 'relative',
  }));

  const PageContent = styled('div')<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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
  }));

  return (
    <MuiThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <AuthProvider>
        <Router>
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
              <Route path="/transports" element={
                <PrivateRoute>
                  <PageContent isDarkMode={isDarkMode}>
                    <Navbar />
                    <Transport />
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
            </Routes>
          </AppContainer>
        </Router>
      </AuthProvider>
    </MuiThemeProvider>
  );
};

function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
