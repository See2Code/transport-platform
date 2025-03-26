import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider, createTheme, styled, CssBaseline, GlobalStyles } from '@mui/material';
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

const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#12121f',
      paper: 'rgba(28, 28, 45, 0.95)',
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: '#12121f',
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
    backgroundColor: '#12121f',
    minHeight: '100vh',
    width: '100%',
  },
  '#root': {
    backgroundColor: '#12121f',
    minHeight: '100vh',
    width: '100%',
  },
};

const AppContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  minHeight: '100vh',
  width: '100%',
  backgroundColor: '#12121f',
  position: 'relative',
});

const PageContent = styled('div')({
  flexGrow: 1,
  marginTop: '64px',
  padding: '24px 16px',
  backgroundColor: '#12121f',
  position: 'relative',
  zIndex: 1,
  '@media (max-width: 600px)': {
    marginTop: '56px',
    padding: '16px',
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <GlobalStyles styles={globalStyles} />
      <AuthProvider>
        <Router>
          <AppContainer>
            <Routes>
              {/* Verejné cesty */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              
              {/* Chránené cesty */}
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Dashboard />
                  </PageContent>
                </PrivateRoute>
              } />
              <Route path="/team" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Team />
                  </PageContent>
                </PrivateRoute>
              } />
              <Route path="/contacts" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Contacts />
                  </PageContent>
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Settings />
                  </PageContent>
                </PrivateRoute>
              } />
              <Route path="/transports" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <Transport />
                  </PageContent>
                </PrivateRoute>
              } />
              <Route path="/tracked-transports" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <TrackedTransports />
                  </PageContent>
                </PrivateRoute>
              } />
              <Route path="/business-cases" element={
                <PrivateRoute>
                  <PageContent>
                    <Navbar />
                    <BusinessCases />
                  </PageContent>
                </PrivateRoute>
              } />
            </Routes>
          </AppContainer>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
