import React from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Button, 
  Paper,
  Grid,
  ThemeProvider,
  createTheme
} from '@mui/material';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import SpeedIcon from '@mui/icons-material/Speed';
import SecurityIcon from '@mui/icons-material/Security';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import ForgotPassword from './components/ForgotPassword';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Team from './components/Team';
import AcceptInvitation from './components/AcceptInvitation';
import { useAuth } from './hooks/useAuth';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}

function HomePage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ my: 4 }}>
        <Typography variant="h2" component="h1" gutterBottom align="center" color="primary">
          Dopravná Platforma
        </Typography>
        
        <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
          <Grid container spacing={4}>
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <LocalShippingIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Spoľahlivá Doprava
                </Typography>
                <Typography variant="body1">
                  Zabezpečujeme kvalitnú a spoľahlivú dopravu pre vaše potreby
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <SpeedIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Rýchle Doručenie
                </Typography>
                <Typography variant="body1">
                  Garantujeme rýchle a presné doručenie vašich zásielok
                </Typography>
              </Box>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Box sx={{ textAlign: 'center' }}>
                <SecurityIcon sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
                <Typography variant="h5" gutterBottom>
                  Bezpečnosť
                </Typography>
                <Typography variant="body1">
                  Vaše zásielky sú v bezpečných rukách našich profesionálov
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <Button 
            component={Link}
            to="/login"
            variant="contained" 
            size="large" 
            color="primary"
            sx={{ minWidth: 200 }}
          >
            Prihlásiť sa
          </Button>
          <Button 
            component={Link}
            to="/register"
            variant="outlined" 
            size="large" 
            color="primary"
            sx={{ minWidth: 200 }}
          >
            Registrovať sa
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <PrivateRoute>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route
            path="/team"
            element={
              <PrivateRoute>
                <Team />
              </PrivateRoute>
            }
          />
          <Route path="/accept-invitation/:invitationId" element={<AcceptInvitation />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
