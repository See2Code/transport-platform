import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Link,
  Grid,
  IconButton,
  Alert,
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, getDoc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Prihlásenie cez Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Kontrola, či užívateľ existuje vo Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        // Hľadanie pozvánky pre tento email
        const invitationsQuery = query(
          collection(db, 'invitations'),
          where('email', '==', email),
          where('status', '==', 'pending')
        );
        const invitationsSnapshot = await getDocs(invitationsQuery);
        
        if (!invitationsSnapshot.empty) {
          // Použijeme údaje z prvej nájdenej pozvánky
          const invitationData = invitationsSnapshot.docs[0].data();
          
          // Vytvoríme užívateľa s údajmi z pozvánky
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            firstName: invitationData.firstName || '',
            lastName: invitationData.lastName || '',
            phone: invitationData.phone || '',
            companyID: invitationData.companyID,
            role: invitationData.role || 'user',
            createdAt: new Date().toISOString(),
            status: 'active'
          });
        } else {
          // Ak neexistuje pozvánka, vytvoríme základný profil
          await setDoc(doc(db, 'users', userCredential.user.uid), {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            firstName: '',
            lastName: '',
            phone: '',
            role: 'user',
            createdAt: new Date().toISOString(),
            status: 'pending'
          });
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      console.error('Chyba pri prihlásení:', err);
      setError(err.message || 'Nepodarilo sa prihlásiť. Skúste to znova.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, position: 'relative' }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h4" component="h1" gutterBottom align="center">
          Prihlásenie
        </Typography>
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Heslo"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Prihlásiť sa'}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Nemáte účet?{' '}
                  <Link href="/register" color="primary">
                    Zaregistrujte sa
                  </Link>
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  <Link href="/forgot-password" color="primary">
                    Zabudli ste heslo?
                  </Link>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default Login; 