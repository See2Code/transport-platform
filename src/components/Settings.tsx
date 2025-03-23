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
  Save as SaveIcon,
  Cancel as CancelIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

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
  const { userData } = useAuth();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localUserData, setLocalUserData] = useState<UserData | null>(null);

  useEffect(() => {
    if (userData) {
      setLocalUserData(userData);
    }
  }, [userData]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!userData?.companyID) {
        setError('Nie je možné načítať údaje o firme');
        return;
      }

      const companyDoc = await getDoc(doc(db, 'companies', userData.companyID));
      if (companyDoc.exists()) {
        setCompanyData({ id: companyDoc.id, ...companyDoc.data() } as CompanyData);
      } else {
        setError('Firma nebola nájdená');
      }
    } catch (err) {
      console.error('Error fetching company data:', err);
      setError('Nastala chyba pri načítaní údajov o firme');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (userData) {
      setIsAdmin(userData.role === 'admin');
      fetchCompanyData();
    }
  }, [userData]);

  const handleUserDataChange = (field: keyof UserData, value: string) => {
    setLocalUserData(prev => prev ? { ...prev, [field]: value } : null);
  };

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

  const handleSave = async () => {
    if (!companyData?.id) return;

    try {
      setError('');
      setSuccess('');
      await updateDoc(doc(db, 'companies', companyData.id), {
        ...companyData,
        updatedAt: new Date()
      });
      setSuccess('Zmeny boli úspešne uložené');
      setIsEditing(false);
    } catch (err) {
      console.error('Error updating company data:', err);
      setError('Nastala chyba pri ukladaní zmien');
    }
  };

  const handleCancel = () => {
    // Obnoviť pôvodné dáta
    fetchCompanyData();
    setIsEditing(false);
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

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, position: 'relative' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" component="h2">
                Údaje o firme
              </Typography>
              {isAdmin && (
                <Box>
                  {isEditing ? (
                    <>
                      <Tooltip title="Zrušiť úpravy">
                        <IconButton onClick={handleCancel} sx={{ mr: 1 }}>
                          <CancelIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Uložiť zmeny">
                        <IconButton onClick={handleSave} color="primary">
                          <SaveIcon />
                        </IconButton>
                      </Tooltip>
                    </>
                  ) : (
                    <Tooltip title="Upraviť údaje">
                      <IconButton onClick={() => setIsEditing(true)} color="primary">
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                  )}
                </Box>
              )}
            </Box>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Company ID"
                  value={userData?.companyID || ''}
                  disabled
                  helperText="Jedinečný identifikátor vašej firmy"
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Názov firmy"
                  value={companyData?.companyName || ''}
                  onChange={(e) => setCompanyData(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                  required
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IČO"
                  value={companyData?.ico || ''}
                  onChange={(e) => setCompanyData(prev => prev ? { ...prev, ico: e.target.value } : null)}
                  required
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="DIČ"
                  value={companyData?.dic || ''}
                  onChange={(e) => setCompanyData(prev => prev ? { ...prev, dic: e.target.value } : null)}
                  disabled={!isEditing}
                  helperText="Nepovinné pole"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="IČ DPH"
                  value={companyData?.icDph || ''}
                  onChange={(e) => setCompanyData(prev => prev ? { ...prev, icDph: e.target.value } : null)}
                  disabled={!isEditing}
                  helperText="Nepovinné pole"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Ulica"
                  value={companyData?.street || ''}
                  onChange={(e) => setCompanyData(prev => prev ? { ...prev, street: e.target.value } : null)}
                  required
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mesto"
                  value={companyData?.city || ''}
                  onChange={(e) => setCompanyData(prev => prev ? { ...prev, city: e.target.value } : null)}
                  required
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="PSČ"
                  value={companyData?.zipCode || ''}
                  onChange={(e) => setCompanyData(prev => prev ? { ...prev, zipCode: e.target.value } : null)}
                  required
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Krajina"
                  value={companyData?.country || ''}
                  onChange={(e) => setCompanyData(prev => prev ? { ...prev, country: e.target.value } : null)}
                  required
                  disabled={!isEditing}
                />
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Údaje o používateľovi
            </Typography>
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
                  value={localUserData?.firstName || ''}
                  onChange={(e) => handleUserDataChange('firstName', e.target.value)}
                  required
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Priezvisko"
                  value={localUserData?.lastName || ''}
                  onChange={(e) => handleUserDataChange('lastName', e.target.value)}
                  required
                  disabled={!isEditing}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Telefón"
                  value={localUserData?.phone || ''}
                  onChange={(e) => handleUserDataChange('phone', e.target.value)}
                  required
                  disabled={!isEditing}
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
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}

export default Settings; 