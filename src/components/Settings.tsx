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
  Tooltip,
  Card,
  Select,
  MenuItem,
  FormControl,
  InputLabel
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
import styled from '@emotion/styled';

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

const euCountries = [
  { code: 'SK', name: 'Slovensko', flag: '🇸🇰', prefix: '+421' },
  { code: 'CZ', name: 'Česko', flag: '🇨🇿', prefix: '+420' },
  { code: 'HU', name: 'Maďarsko', flag: '🇭🇺', prefix: '+36' },
  { code: 'PL', name: 'Poľsko', flag: '🇵🇱', prefix: '+48' },
  { code: 'AT', name: 'Rakúsko', flag: '🇦🇹', prefix: '+43' },
  { code: 'DE', name: 'Nemecko', flag: '🇩🇪', prefix: '+49' },
  { code: 'FR', name: 'Francúzsko', flag: '🇫🇷', prefix: '+33' },
  { code: 'IT', name: 'Taliansko', flag: '🇮🇹', prefix: '+39' },
  { code: 'ES', name: 'Španielsko', flag: '🇪🇸', prefix: '+34' },
  { code: 'PT', name: 'Portugalsko', flag: '🇵🇹', prefix: '+351' },
  { code: 'NL', name: 'Holandsko', flag: '🇳🇱', prefix: '+31' },
  { code: 'BE', name: 'Belgicko', flag: '🇧🇪', prefix: '+32' },
  { code: 'DK', name: 'Dánsko', flag: '🇩🇰', prefix: '+45' },
  { code: 'SE', name: 'Švédsko', flag: '🇸🇪', prefix: '+46' },
  { code: 'FI', name: 'Fínsko', flag: '🇫🇮', prefix: '+358' },
  { code: 'IE', name: 'Írsko', flag: '🇮🇪', prefix: '+353' },
  { code: 'GR', name: 'Grécko', flag: '🇬🇷', prefix: '+30' },
  { code: 'RO', name: 'Rumunsko', flag: '🇷🇴', prefix: '+40' },
  { code: 'BG', name: 'Bulharsko', flag: '🇧🇬', prefix: '+359' },
  { code: 'HR', name: 'Chorvátsko', flag: '🇭🇷', prefix: '+385' },
  { code: 'SI', name: 'Slovinsko', flag: '🇸🇮', prefix: '+386' },
  { code: 'EE', name: 'Estónsko', flag: '🇪🇪', prefix: '+372' },
  { code: 'LV', name: 'Lotyšsko', flag: '🇱🇻', prefix: '+371' },
  { code: 'LT', name: 'Litva', flag: '🇱🇹', prefix: '+370' },
  { code: 'CY', name: 'Cyprus', flag: '🇨🇾', prefix: '+357' },
  { code: 'MT', name: 'Malta', flag: '🇲🇹', prefix: '+356' },
  { code: 'LU', name: 'Luxembursko', flag: '🇱🇺', prefix: '+352' }
];

const colors = {
  primary: {
    main: '#1a1a2e',
    light: 'rgba(35, 35, 66, 0.95)',
    dark: '#12121f',
  },
  secondary: {
    main: '#ff6b6b',
    light: '#ff8787',
    dark: '#fa5252',
  },
  accent: {
    main: '#ff9f43',
    light: '#ffbe76',
    dark: '#f7b067',
  }
};

const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
  }
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  flexWrap: 'wrap',
  gap: '16px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  }
});

const PageTitle = styled(Typography)({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#ffffff',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: colors.accent.main,
    borderRadius: '2px',
  },
  '@media (max-width: 600px)': {
    fontSize: '1.5rem',
  }
});

const SettingsCard = styled(Card)({
  backgroundColor: colors.primary.light,
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '24px',
  color: '#ffffff',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  marginBottom: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
  },
  '@media (max-width: 600px)': {
    padding: '16px',
    marginBottom: '16px',
  }
});

const CardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
  flexWrap: 'wrap',
  gap: '16px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'stretch',
  }
});

const SectionTitle = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: colors.accent.main,
  '@media (max-width: 600px)': {
    fontSize: '1rem',
  }
});

const SettingsInfo = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '24px',
  marginBottom: '24px',
  '@media (max-width: 600px)': {
    gridTemplateColumns: '1fr',
    gap: '16px',
    marginBottom: '16px',
  }
});

const InfoSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  '@media (max-width: 600px)': {
    gap: '12px',
  }
});

const InfoLabel = styled(Typography)({
  fontSize: '0.85rem',
  color: 'rgba(255, 255, 255, 0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  '@media (max-width: 600px)': {
    fontSize: '0.8rem',
  }
});

const InfoValue = styled(Typography)({
  fontSize: '1rem',
  color: '#ffffff',
  '@media (max-width: 600px)': {
    fontSize: '0.95rem',
  }
});

const SaveButton = styled(Button)({
  backgroundColor: colors.accent.main,
  color: '#ffffff',
  padding: '8px 24px',
  borderRadius: '12px',
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  boxShadow: `0 4px 12px ${colors.accent.main}4D`,
  '&:hover': {
    backgroundColor: colors.accent.light,
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 16px ${colors.accent.main}66`,
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: `0 2px 8px ${colors.accent.main}4D`,
  },
  '@media (max-width: 600px)': {
    width: '100%',
    justifyContent: 'center',
  }
});

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
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(euCountries.find(c => c.code === 'SK') || euCountries[0]);

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

  const handleProfileSave = async () => {
    if (!localUserData) return;

    try {
      setError('');
      setSuccess('');
      await updateDoc(doc(db, 'users', localUserData.uid), {
        firstName: localUserData.firstName,
        lastName: localUserData.lastName,
        phone: localUserData.phone,
        updatedAt: new Date()
      });
      setSuccess('Profil bol úspešne aktualizovaný');
      setIsEditingProfile(false);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Nastala chyba pri ukladaní profilu');
    }
  };

  const handleProfileCancel = () => {
    setLocalUserData(userData || null);
    setIsEditingProfile(false);
  };

  const handleCountryChange = (event: any) => {
    const country = euCountries.find(c => c.code === event.target.value);
    if (country) {
      setSelectedCountry(country);
      // Ak je telefónne číslo prázdne, pridáme predvolbu
      if (!localUserData?.phone) {
        handleUserDataChange('phone', country.prefix);
      }
    }
  };

  if (loading) {
    return (
      <PageWrapper>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Nastavenia</PageTitle>
      </PageHeader>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <SettingsCard>
            <CardHeader>
              <SectionTitle>Profil používateľa</SectionTitle>
              {!isEditingProfile ? (
                <IconButton 
                  onClick={() => setIsEditingProfile(true)}
                  sx={{ color: colors.accent.main }}
                >
                  <EditIcon />
                </IconButton>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton 
                    onClick={handleProfileCancel}
                    sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                  >
                    <CancelIcon />
                  </IconButton>
                  <IconButton 
                    onClick={handleProfileSave}
                    sx={{ color: colors.accent.main }}
                  >
                    <SaveIcon />
                  </IconButton>
                </Box>
              )}
            </CardHeader>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meno"
                  value={localUserData?.firstName || ''}
                  onChange={(e) => handleUserDataChange('firstName', e.target.value)}
                  disabled={!isEditingProfile}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.accent.main,
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Priezvisko"
                  value={localUserData?.lastName || ''}
                  onChange={(e) => handleUserDataChange('lastName', e.target.value)}
                  disabled={!isEditingProfile}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: colors.accent.main,
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
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={localUserData?.email || ''}
                  disabled
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
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
              <Grid item xs={12} md={6}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <FormControl sx={{ minWidth: 120 }}>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Predvoľba</InputLabel>
                    <Select
                      value={selectedCountry.code}
                      onChange={handleCountryChange}
                      disabled={!isEditingProfile}
                      sx={{
                        color: '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.accent.main,
                        },
                      }}
                    >
                      {euCountries.map((country) => (
                        <MenuItem key={country.code} value={country.code}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{country.flag}</span>
                            <span>{country.prefix}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    fullWidth
                    label="Telefón"
                    value={localUserData?.phone?.replace(selectedCountry.prefix, '') || ''}
                    onChange={(e) => handleUserDataChange('phone', selectedCountry.prefix + e.target.value)}
                    disabled={!isEditingProfile}
                    placeholder="9XX XXX XXX"
                    helperText="Zadajte telefónne číslo bez predvoľby"
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.main,
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'rgba(255, 255, 255, 0.7)',
                      },
                      '& .MuiInputBase-input': {
                        color: '#ffffff',
                      },
                      '& .MuiFormHelperText-root': {
                        color: 'rgba(255, 255, 255, 0.5)',
                      },
                    }}
                  />
                </Box>
              </Grid>
            </Grid>
          </SettingsCard>

          {isAdmin && (
            <SettingsCard>
              <CardHeader>
                <SectionTitle>Firemné údaje</SectionTitle>
                {!isEditing ? (
                  <IconButton 
                    onClick={() => setIsEditing(true)}
                    sx={{ color: colors.accent.main }}
                  >
                    <EditIcon />
                  </IconButton>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      onClick={handleCancel}
                      sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
                    >
                      <CancelIcon />
                    </IconButton>
                    <IconButton 
                      onClick={handleSave}
                      sx={{ color: colors.accent.main }}
                    >
                      <SaveIcon />
                    </IconButton>
                  </Box>
                )}
              </CardHeader>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Názov firmy"
                    value={companyData?.companyName || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                    disabled={!isEditing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.main,
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="IČO"
                    value={companyData?.ico || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, ico: e.target.value } : null)}
                    disabled={!isEditing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.main,
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="DIČ"
                    value={companyData?.dic || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, dic: e.target.value } : null)}
                    disabled={!isEditing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.main,
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="IČ DPH"
                    value={companyData?.icDph || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, icDph: e.target.value } : null)}
                    disabled={!isEditing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.main,
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
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Krajina</InputLabel>
                    <Select
                      value={companyData?.country || 'SK'}
                      onChange={(e) => setCompanyData(prev => prev ? { ...prev, country: e.target.value } : null)}
                      disabled={!isEditing}
                      sx={{
                        color: '#ffffff',
                        '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: colors.accent.main,
                        },
                      }}
                    >
                      {euCountries.map((country) => (
                        <MenuItem key={country.code} value={country.code}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Ulica"
                    value={companyData?.street || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, street: e.target.value } : null)}
                    disabled={!isEditing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.main,
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="PSČ"
                    value={companyData?.zipCode || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, zipCode: e.target.value } : null)}
                    disabled={!isEditing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.main,
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
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Mesto"
                    value={companyData?.city || ''}
                    onChange={(e) => setCompanyData(prev => prev ? { ...prev, city: e.target.value } : null)}
                    disabled={!isEditing}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        '& fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.1)',
                        },
                        '&:hover fieldset': {
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: colors.accent.main,
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
            </SettingsCard>
          )}
        </Grid>
      </Grid>
    </PageWrapper>
  );
}

export default Settings; 