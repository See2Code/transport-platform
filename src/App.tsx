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
            <Navbar />
            <PageContent>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/team" element={<Team />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/transports" element={<Transport />} />
                <Route path="/tracked-transports" element={<TrackedTransports />} />
              </Routes>
            </PageContent>
          </AppContainer>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
