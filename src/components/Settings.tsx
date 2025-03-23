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
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '../firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { onAuthStateChanged } from 'firebase/auth';

interface CompanyData {
  companyID: string;
  companyName: string;
  street: string;
  zipCode: string;
  city: string;
  country: string;
  ico: string;
  icDph: string;
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
            
            // Kontrola či je používateľ admin alebo owner firmy
            const companyDoc = await getDoc(doc(db, 'companies', userData.companyID));
            console.log('Dokument firmy:', companyDoc.exists() ? companyDoc.data() : 'neexistuje');
            
            if (companyDoc.exists()) {
              const companyData = companyDoc.data() as CompanyData;
              setIsAdmin(userData.role === 'admin' || companyData.owner.uid === user.uid);
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
          setError('Nepodarilo sa načítať údaje. Skontrolujte konzolu pre viac informácií.');
        }
      } else {
        console.log('Používateľ nie je prihlásený');
        navigate('/login');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleCompanyUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyData) return;

    try {
      await updateDoc(doc(db, 'companies', companyData.companyID), {
        companyName: companyData.companyName,
        street: companyData.street,
        zipCode: companyData.zipCode,
        city: companyData.city,
        country: companyData.country,
        ico: companyData.ico,
        icDph: companyData.icDph
      });

      setSuccess('Údaje firmy boli úspešne aktualizované.');
    } catch (err) {
      setError('Nepodarilo sa aktualizovať údaje firmy.');
    }
  };

  const handleUserUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userData) return;

    try {
      await updateDoc(doc(db, 'users', userData.uid), {
        firstName: userData.firstName,
        lastName: userData.lastName,
        phone: userData.phone
      });

      setSuccess('Údaje profilu boli úspešne aktualizované.');
    } catch (err) {
      setError('Nepodarilo sa aktualizovať údaje profilu.');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" gutterBottom>
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

        <Grid container spacing={4}>
          {/* Údaje o firme */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              Údaje o firme
            </Typography>
            <form onSubmit={handleCompanyUpdate}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Company ID"
                    value={companyData?.companyID || ''}
                    disabled
                  />
                </Grid>
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
                    label="PSČ"
                    value={companyData?.zipCode || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, zipCode: e.target.value } : null)}
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
                    label="IČ DPH"
                    value={companyData?.icDph || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, icDph: e.target.value } : null)}
                    required
                    disabled={!isAdmin}
                  />
                </Grid>
                {isAdmin && (
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="primary"
                      type="submit"
                    >
                      Uložiť zmeny firmy
                    </Button>
                  </Grid>
                )}
              </Grid>
            </form>
          </Grid>

          <Grid item xs={12}>
            <Divider sx={{ my: 2 }} />
          </Grid>

          {/* Údaje o používateľovi */}
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
                      fullWidth
                      variant="contained"
                      color="primary"
                      type="submit"
                    >
                      Uložiť zmeny profilu
                    </Button>
                  </Grid>
                )}
              </Grid>
            </form>
          </Grid>
        </Grid>

        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            variant="outlined"
            color="primary"
            onClick={() => navigate('/dashboard')}
          >
            Späť na Dashboard
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}

export default Settings; 