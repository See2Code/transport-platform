import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Grid,
  TextField,
  Button,
  Box,
  Divider,
  Alert,
  CircularProgress,
  IconButton,
  Tooltip
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon
} from '@mui/icons-material';

interface CompanyData {
  id: string;
  companyID: string;
  companyName: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  ico: string;
  icDph: string;
  dic: string;
  owner: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
}

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyID: string;
  role: string;
}

function Settings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          console.log('Používateľ je prihlásený:', user.uid);
          
          // Získanie údajov o používateľovi
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          console.log('Dokument používateľa:', userDoc.exists() ? userDoc.data() : 'neexistuje');
          
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            setUserData(userData);
            
            // Kontrola či je používateľ admin
            const companyDoc = await getDoc(doc(db, 'companies', userData.companyID));
            console.log('Dokument firmy:', companyDoc.exists() ? companyDoc.data() : 'neexistuje');
            
            if (companyDoc.exists()) {
              const companyData = companyDoc.data() as CompanyData;
              setIsAdmin(userData.role === 'admin');
              setCompanyData(companyData);
            } else {
              setError('Firma nebola nájdená v databáze.');
              console.error('Firma nebola nájdená pre companyID:', userData.companyID);
            }
          } else {
            setError('Používateľ nebol nájdený v databáze.');
            console.error('Používateľ nebol nájdený pre uid:', user.uid);
          }
        } catch (err) {
          console.error('Chyba pri načítaní údajov:', err);
          setError('Nastala chyba pri načítaní údajov.');
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData || !isAdmin) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updateDoc(doc(db, 'users', userData.uid), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
      });

      setSuccess('Údaje boli úspešne aktualizované.');
    } catch (err: any) {
      console.error('Chyba pri aktualizácii údajov:', err);
      setError(err.message || 'Nastala chyba pri aktualizácii údajov.');
    } finally {
      setLoading(false);
    }
  };

  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyData || !isAdmin) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updateDoc(doc(db, 'companies', companyData.id), {
        companyName: companyData.companyName,
        ico: companyData.ico,
        dic: companyData.dic,
        icDph: companyData.icDph,
        street: companyData.street,
        city: companyData.city,
        zipCode: companyData.zipCode,
        country: companyData.country
      });

      setSuccess('Údaje firmy boli úspešne aktualizované.');
    } catch (err: any) {
      console.error('Chyba pri aktualizácii údajov firmy:', err);
      setError(err.message || 'Nastala chyba pri aktualizácii údajov firmy.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Späť na Dashboard">
            <IconButton 
              onClick={() => navigate('/dashboard')}
              size="large"
              sx={{ 
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1">
            Nastavenia
          </Typography>
        </Box>
      </Box>

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Nastavenia
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {success}
              </Alert>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Údaje o firme
                </Typography>
                <form onSubmit={handleCompanyUpdate}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Názov firmy"
                        value={companyData?.companyName || ''}
                        onChange={(e) => setCompanyData(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="IČO"
                        value={companyData?.ico || ''}
                        onChange={(e) => setCompanyData(prev => prev ? { ...prev, ico: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="DIČ"
                        value={companyData?.dic || ''}
                        onChange={(e) => setCompanyData(prev => prev ? { ...prev, dic: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Ulica"
                        value={companyData?.street || ''}
                        onChange={(e) => setCompanyData(prev => prev ? { ...prev, street: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Mesto"
                        value={companyData?.city || ''}
                        onChange={(e) => setCompanyData(prev => prev ? { ...prev, city: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="PSČ"
                        value={companyData?.zipCode || ''}
                        onChange={(e) => setCompanyData(prev => prev ? { ...prev, zipCode: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Krajina"
                        value={companyData?.country || ''}
                        onChange={(e) => setCompanyData(prev => prev ? { ...prev, country: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    {isAdmin && (
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={loading}
                        >
                          Uložiť zmeny
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </form>
              </Grid>

              <Grid item xs={12} md={6}>
                <Typography variant="h6" gutterBottom>
                  Údaje o používateľovi
                </Typography>
                <form onSubmit={handleUserUpdate}>
                  <Grid container spacing={2}>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Email"
                        value={userData?.email || ''}
                        disabled
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Meno"
                        value={userData?.firstName || ''}
                        onChange={(e) => setUserData(prev => prev ? { ...prev, firstName: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Priezvisko"
                        value={userData?.lastName || ''}
                        onChange={(e) => setUserData(prev => prev ? { ...prev, lastName: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Telefón"
                        value={userData?.phone || ''}
                        onChange={(e) => setUserData(prev => prev ? { ...prev, phone: e.target.value } : null)}
                        required
                        disabled={!isAdmin}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        label="Rola"
                        value={userData?.role || ''}
                        disabled
                      />
                    </Grid>
                    {isAdmin && (
                      <Grid item xs={12}>
                        <Button
                          type="submit"
                          variant="contained"
                          color="primary"
                          disabled={loading}
                        >
                          Uložiť zmeny
                        </Button>
                      </Grid>
                    )}
                  </Grid>
                </form>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Settings; 