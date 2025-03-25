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

const PageWrapper = styled('div')({
  padding: '24px',
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
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
    backgroundColor: '#00b894',
    borderRadius: '2px',
  }
});

const SettingsCard = styled(Card)({
  backgroundColor: 'rgba(35, 35, 66, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '24px',
  color: '#ffffff',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  marginBottom: '16px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
  }
});

const CardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
});

const SectionTitle = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#00b894',
});

const SettingsInfo = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
  gap: '24px',
  marginBottom: '16px',
});

const InfoSection = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
});

const InfoLabel = styled(Typography)({
  fontSize: '0.85rem',
  color: 'rgba(255, 255, 255, 0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const InfoValue = styled(Typography)({
  fontSize: '1rem',
  color: '#ffffff',
});

const SaveButton = styled(Button)({
  backgroundColor: '#00b894',
  color: '#ffffff',
  padding: '8px 24px',
  borderRadius: '12px',
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)',
  '&:hover': {
    backgroundColor: '#00d2a0',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 184, 148, 0.4)',
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

      <SettingsCard>
        <CardHeader>
          <SectionTitle>Údaje o firme</SectionTitle>
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
        </CardHeader>

        <SettingsInfo>
          <InfoSection>
            <Box>
              <InfoLabel>Názov firmy</InfoLabel>
              <TextField
                fullWidth
                value={companyData?.companyName || ''}
                onChange={(e) => setCompanyData(prev => prev ? { ...prev, companyName: e.target.value } : null)}
                disabled={!isEditing}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
            <Box>
              <InfoLabel>IČO</InfoLabel>
              <TextField
                fullWidth
                value={companyData?.ico || ''}
                onChange={(e) => setCompanyData(prev => prev ? { ...prev, ico: e.target.value } : null)}
                disabled={!isEditing}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
          </InfoSection>

          <InfoSection>
            <Box>
              <InfoLabel>DIČ</InfoLabel>
              <TextField
                fullWidth
                value={companyData?.dic || ''}
                onChange={(e) => setCompanyData(prev => prev ? { ...prev, dic: e.target.value } : null)}
                disabled={!isEditing}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
            <Box>
              <InfoLabel>IČ DPH</InfoLabel>
              <TextField
                fullWidth
                value={companyData?.icDph || ''}
                onChange={(e) => setCompanyData(prev => prev ? { ...prev, icDph: e.target.value } : null)}
                disabled={!isEditing}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
          </InfoSection>

          <InfoSection>
            <Box>
              <InfoLabel>Ulica</InfoLabel>
              <TextField
                fullWidth
                value={companyData?.street || ''}
                onChange={(e) => setCompanyData(prev => prev ? { ...prev, street: e.target.value } : null)}
                disabled={!isEditing}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
            <Box>
              <InfoLabel>PSČ</InfoLabel>
              <TextField
                fullWidth
                value={companyData?.zipCode || ''}
                onChange={(e) => setCompanyData(prev => prev ? { ...prev, zipCode: e.target.value } : null)}
                disabled={!isEditing}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
          </InfoSection>

          <InfoSection>
            <Box>
              <InfoLabel>Mesto</InfoLabel>
              <TextField
                fullWidth
                value={companyData?.city || ''}
                onChange={(e) => setCompanyData(prev => prev ? { ...prev, city: e.target.value } : null)}
                disabled={!isEditing}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
            <Box>
              <InfoLabel>Krajina</InfoLabel>
              <FormControl fullWidth>
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
                      borderColor: '#00b894',
                    },
                    '& .MuiSelect-icon': {
                      color: 'rgba(255, 255, 255, 0.5)',
                    }
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
            </Box>
          </InfoSection>
        </SettingsInfo>
      </SettingsCard>

      <SettingsCard>
        <CardHeader>
          <SectionTitle>Profil</SectionTitle>
          <Box>
            {isEditingProfile ? (
              <>
                <Tooltip title="Zrušiť úpravy">
                  <IconButton onClick={handleProfileCancel} sx={{ mr: 1 }}>
                    <CancelIcon />
                  </IconButton>
                </Tooltip>
                <Tooltip title="Uložiť zmeny">
                  <IconButton onClick={handleProfileSave} color="primary">
                    <SaveIcon />
                  </IconButton>
                </Tooltip>
              </>
            ) : (
              <Tooltip title="Upraviť profil">
                <IconButton onClick={() => setIsEditingProfile(true)} color="primary">
                  <EditIcon />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </CardHeader>

        <SettingsInfo>
          <InfoSection>
            <Box>
              <InfoLabel>Meno</InfoLabel>
              <TextField
                fullWidth
                value={localUserData?.firstName || ''}
                onChange={(e) => handleUserDataChange('firstName', e.target.value)}
                disabled={!isEditingProfile}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
            <Box>
              <InfoLabel>Priezvisko</InfoLabel>
              <TextField
                fullWidth
                value={localUserData?.lastName || ''}
                onChange={(e) => handleUserDataChange('lastName', e.target.value)}
                disabled={!isEditingProfile}
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: '#ffffff',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                    '&:hover fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.2)',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#00b894',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '&.Mui-focused': {
                      color: '#00b894',
                    },
                  },
                }}
              />
            </Box>
          </InfoSection>

          <InfoSection>
            <Box>
              <InfoLabel>Email</InfoLabel>
              <TextField
                fullWidth
                value={localUserData?.email || ''}
                disabled
                variant="outlined"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                    '& fieldset': {
                      borderColor: 'rgba(255, 255, 255, 0.1)',
                    },
                  },
                  '& .MuiInputLabel-root': {
                    color: 'rgba(255, 255, 255, 0.5)',
                  },
                }}
              />
            </Box>
            <Box>
              <InfoLabel>Telefón</InfoLabel>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <Select
                    value={selectedCountry.code}
                    onChange={handleCountryChange}
                    disabled={!isEditingProfile}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00b894',
                      },
                      '& .MuiSelect-icon': {
                        color: 'rgba(255, 255, 255, 0.5)',
                      }
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
                  value={localUserData?.phone?.replace(selectedCountry.prefix, '') || ''}
                  onChange={(e) => handleUserDataChange('phone', selectedCountry.prefix + e.target.value)}
                  disabled={!isEditingProfile}
                  variant="outlined"
                  placeholder="9XX XXX XXX"
                  helperText="Zadajte telefónne číslo"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
                      '& fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover fieldset': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: '#00b894',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      '&.Mui-focused': {
                        color: '#00b894',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.75rem',
                      marginLeft: 0,
                      marginTop: '4px',
                    }
                  }}
                />
              </Box>
            </Box>
          </InfoSection>
        </SettingsInfo>
      </SettingsCard>
    </PageWrapper>
  );
}

export default Settings; 