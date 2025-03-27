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
import { useNavigate, useParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, collection } from 'firebase/firestore';
import { auth, db } from '../firebase';

function RegisterUser() {
  const { invitationId } = useParams();
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
  const [companyLoading, setCompanyLoading] = useState(true);

  useEffect(() => {
    if (!invitationId) {
      setError('Chýba ID pozvánky');
      return;
    }

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

        setInvitation(invitationData);

        // Načítanie informácií o firme
        const companyDoc = await getDoc(doc(db, 'companies', invitationData.companyID));
        if (companyDoc.exists()) {
          setCompany(companyDoc.data());
        }
      } catch (err) {
        console.error('Chyba pri načítaní pozvánky:', err);
        setError('Nepodarilo sa načítať pozvánku');
      } finally {
        setCompanyLoading(false);
      }
    };

    fetchInvitation();
  }, [invitationId]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!invitation || !invitationId) {
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

      // Vytvorenie používateľa v Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.email,
        formData.password
      );

      // Vytvorenie používateľského profilu v Firestore
      const userData = {
        uid: userCredential.user.uid,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        phone: invitation.phone,
        companyID: invitation.companyID,
        role: invitation.role,
        createdAt: new Date().toISOString(),
        status: 'active'
      };

      // Uloženie užívateľa do Firestore s rovnakým ID ako v Auth
      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      // Aktualizácia pozvánky
      await updateDoc(doc(db, 'invitations', invitationId), {
        status: 'accepted',
        userId: userCredential.user.uid,
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

          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#ff9f43' }}>
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

        {!invitation ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            <Typography
              variant="h4"
              component="h1"
              sx={{
                mb: 4,
                color: '#000000',
                fontWeight: 'bold',
              }}
            >
              Dokončenie registrácie
            </Typography>

            <Typography variant="body1" gutterBottom sx={{ color: '#ffffff' }}>
              Vitajte {invitation.firstName} {invitation.lastName}!
            </Typography>

            {!companyLoading && company && (
              <Box sx={{ 
                bgcolor: 'rgba(255, 255, 255, 0.05)', 
                p: 3, 
                borderRadius: 2, 
                mb: 4,
                border: '1px solid rgba(255, 255, 255, 0.1)'
              }}>
                <Typography variant="h6" gutterBottom sx={{ color: '#ff9f43', mb: 2 }}>
                  Boli ste pozvaní spoločnosťou:
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Názov spoločnosti
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                      {company.companyName}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      IČO
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                      {company.ico || 'Neuvedené'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      IČ DPH
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                      {company.icDph || 'Neuvedené'}
                    </Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle1" sx={{ color: 'rgba(255, 255, 255, 0.6)' }}>
                      Adresa
                    </Typography>
                    <Typography variant="body1" sx={{ color: '#ffffff', fontWeight: 500 }}>
                      {company.street}, {company.zipCode} {company.city}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
            )}

            <Divider sx={{ my: 3 }} />
            <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
              Pre dokončenie registrácie prosím nastavte svoje heslo
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Heslo"
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff9f43',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
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
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#ff9f43',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.7)',
                    },
                    '& .MuiInputBase-input': {
                      color: '#ffffff',
                    },
                  }}
                />
              </Grid>
            </Grid>

            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              variant="contained"
              onClick={handleSubmit}
              disabled={loading}
              sx={{
                mt: 3,
                mb: 2,
                bgcolor: '#ff9f43',
                color: '#ffffff',
                '&:hover': {
                  bgcolor: '#ff8a2d',
                },
                height: '48px',
                fontSize: '1rem',
                textTransform: 'none',
              }}
            >
              {loading ? <CircularProgress size={24} /> : 'Dokončiť registráciu'}
            </Button>
          </>
        )}
      </Paper>
    </Container>
  );
}

export default RegisterUser; 