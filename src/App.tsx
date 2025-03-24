import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { sk } from 'date-fns/locale';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import Navbar from './components/Navbar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import RegisterUser from './components/RegisterUser';
import Dashboard from './components/Dashboard';
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

const INACTIVITY_TIMEOUT = 3 * 60 * 60 * 1000; // 3 hodiny v milisekundách

function App() {
  const { user, setUser } = useAuth();
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [inactivityTimer, setInactivityTimer] = useState<NodeJS.Timeout | null>(null);

  // Funkcia na resetovanie časovača nečinnosti
  const resetInactivityTimer = () => {
    setLastActivity(Date.now());
    if (inactivityTimer) {
      clearTimeout(inactivityTimer);
    }
    const timer = setTimeout(() => {
      if (user) {
        signOut(auth);
      }
    }, INACTIVITY_TIMEOUT);
    setInactivityTimer(timer);
  };

  // Pridanie event listenerov pre sledovanie aktivity
  useEffect(() => {
    if (user) {
      const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      events.forEach(event => {
        document.addEventListener(event, resetInactivityTimer);
      });

      // Inicializácia časovača
      resetInactivityTimer();

      // Vyčistenie event listenerov pri odhlásení
      return () => {
        events.forEach(event => {
          document.removeEventListener(event, resetInactivityTimer);
        });
        if (inactivityTimer) {
          clearTimeout(inactivityTimer);
        }
      };
    }
  }, [user]);

  // Kontrola aktivity každú minútu
  useEffect(() => {
    if (user) {
      const interval = setInterval(() => {
        const timeSinceLastActivity = Date.now() - lastActivity;
        if (timeSinceLastActivity >= INACTIVITY_TIMEOUT) {
          signOut(auth);
        }
      }, 60000); // Kontrola každú minútu

      return () => clearInterval(interval);
    }
  }, [user, lastActivity]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
        <CssBaseline />
        <AuthProvider>
          <Router>
            {user ? (
              <>
                <Navbar />
                <Routes>
                  <Route path="/" element={<Home />} />
                  <Route path="/business-cases" element={<BusinessCases />} />
                  <Route path="/contacts" element={<Contacts />} />
                  <Route path="/team" element={<Team />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="/tracked-transports" element={<TrackedTransports />} />
                  <Route path="/transport/:id" element={<Transport />} />
                </Routes>
              </>
            ) : (
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/register-user" element={<RegisterUser />} />
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            )}
          </Router>
        </AuthProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}

export default App;
