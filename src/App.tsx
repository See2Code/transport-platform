import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import RegisterUser from './components/RegisterUser';
import Dashboard from './components/Dashboard';
import Team from './components/Team';
import Settings from './components/Settings';
import AcceptInvitation from './components/AcceptInvitation';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00b894',
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
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/register-user" element={<RegisterUser />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/team" element={<Team />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/accept-invitation/:invitationId" element={<AcceptInvitation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
