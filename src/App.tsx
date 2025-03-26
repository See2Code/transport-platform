import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sk } from 'date-fns/locale';
import { AuthProvider } from './contexts/AuthContext';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import RegisterUser from './components/RegisterUser';
import Dashboard from './components/Dashboard';
import DashboardLayout from './components/DashboardLayout';
import Team from './components/Team';
import Settings from './components/Settings';
import AcceptInvitation from './components/AcceptInvitation';
import Transport from './components/Transport';
import PrivateRoute from './components/PrivateRoute';
import Contacts from './components/Contacts';
import TrackedTransports from './components/TrackedTransports';
import BusinessCases from './components/BusinessCases';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#ff9f43',
      light: '#00d2a0',
      dark: '#009b7d',
    },
    secondary: {
      main: '#ff6b6b',
      light: '#ff8585',
      dark: '#ff5252',
    },
    background: {
      default: '#1a1a2e',
      paper: '#232342',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          padding: '10px 24px',
          fontWeight: 500,
          letterSpacing: 0.5,
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          borderRadius: 8,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 12,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/register-user" element={<RegisterUser />} />
              <Route path="/dashboard" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/transport" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Transport />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/tracked-transports" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <TrackedTransports />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/team" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Team />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/settings" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/accept-invitation/:invitationId" element={<AcceptInvitation />} />
              <Route path="/contacts" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <Contacts />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="/business-cases" element={
                <PrivateRoute>
                  <DashboardLayout>
                    <BusinessCases />
                  </DashboardLayout>
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
