import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Box,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';

function RegisterUser() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [invitation, setInvitation] = useState<any>(null);
  const [company, setCompany] = useState<any>(null);

  useEffect(() => {
    const invitationId = searchParams.get('invitationId');
    if (invitationId) {
      const fetchInvitation = async () => {
        try {
          const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));
          if (!invitationDoc.exists()) {
            setError('Pozvánka nebola nájdená');
            return;
          }

          const invitationData = invitationDoc.data();
          if (invitationData.status !== 'pending') {
            setError('Táto pozvánka už bola použitá');
            return;
          }

          // Načítanie informácií o firme
          const companyDoc = await getDoc(doc(db, 'companies', invitationData.companyID));
          if (companyDoc.exists()) {
            setCompany(companyDoc.data());
          }

          setInvitation(invitationData);
        } catch (err) {
          console.error('Chyba pri načítaní pozvánky:', err);
          setError('Nepodarilo sa načítať pozvánku');
        }
      };

      fetchInvitation();
    }
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation) {
      setError('Chýbajúce údaje pozvánky');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Heslá sa nezhodujú');
      return;
    }

    if (formData.password.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Vytvorenie používateľského profilu v Firestore
      const userData = {
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        phone: invitation.phone,
        companyID: invitation.companyID,
        role: invitation.role,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Generujeme nové ID pre používateľa
      const userRef = doc(collection(db, 'users'));
      await setDoc(userRef, {
        ...userData,
        uid: userRef.id
      });

      // Aktualizácia pozvánky
      await updateDoc(doc(db, 'invitations', searchParams.get('invitationId')!), {
        status: 'accepted',
        userId: userRef.id,
        acceptedAt: new Date().toISOString()
      });

      setRegistrationSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Chyba pri registrácii:', err);
      setError(err.message || 'Nastala chyba pri registrácii');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  if (registrationSuccess) {
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

          <Typography variant="h4" component="h1" gutterBottom align="center" color="success.main">
            Registrácia úspešná!
          </Typography>

          <Alert severity="success" sx={{ mb: 3 }}>
            Boli ste úspešne pridaný do tímu.
          </Alert>

          <Button
            fullWidth
            variant="contained"
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ mt: 3 }}
          >
            Prihlásiť sa
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!invitation && loading) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        </Paper>
      </Container>
    );
  }

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
          Registrácia užívateľa
        </Typography>

        {invitation && (
          <>
            <Typography variant="body1" gutterBottom>
              Vitajte {invitation.firstName} {invitation.lastName}!
            </Typography>
            <Typography variant="body1" gutterBottom>
              Pre dokončenie registrácie si prosím nastavte heslo.
            </Typography>

            {company && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" gutterBottom>
                  Informácie o firme
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Názov firmy"
                      value={company?.companyName || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Ulica"
                      value={company?.street || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="PSČ"
                      value={company?.zipCode || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Mesto"
                      value={company?.city || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="IČO"
                      value={company?.ico || ''}
                      disabled
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="IČ DPH"
                      value={company?.icDph || ''}
                      disabled
                    />
                  </Grid>
                </Grid>
              </>
            )}
          </>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Heslo
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Heslo"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Potvrďte heslo"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
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
                {loading ? <CircularProgress size={20} /> : 'Dokončiť registráciu'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default RegisterUser; 