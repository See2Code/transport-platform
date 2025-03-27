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
  InputLabel,
  Snackbar
} from '@mui/material';
import { TypographyProps } from '@mui/material/Typography';
import { CardProps } from '@mui/material/Card';
import { TextFieldProps } from '@mui/material/TextField';
import { SelectProps } from '@mui/material/Select';
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
import { useThemeMode } from '../contexts/ThemeContext';
import { SelectChangeEvent } from '@mui/material/Select';

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

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
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
  background: {
    main: 'rgba(28, 28, 45, 0.95)',
    light: 'rgba(35, 35, 66, 0.95)',
    dark: '#12121f',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.9)',
    disabled: 'rgba(255, 255, 255, 0.7)',
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
}) as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>;

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
}) as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>;

const PageTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
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
})) as unknown as React.FC<TypographyProps & { isDarkMode: boolean }>;

const SettingsCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? colors.background.main : '#ffffff',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '24px',
  color: isDarkMode ? colors.text.primary : '#000000',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.1)'}`,
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
})) as unknown as React.FC<CardProps & { isDarkMode: boolean }>;

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
}) as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>;

const SectionTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: colors.accent.main,
  '@media (max-width: 600px)': {
    fontSize: '1rem',
  }
})) as unknown as React.FC<TypographyProps & { isDarkMode: boolean }>;

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

const InfoLabel = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '0.85rem',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
  '@media (max-width: 600px)': {
    fontSize: '0.8rem',
  }
}));

const InfoValue = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1rem',
  color: isDarkMode ? '#ffffff' : '#000000',
  '@media (max-width: 600px)': {
    fontSize: '0.95rem',
  }
}));

const StyledTextField = styled(TextField)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  '& .MuiOutlinedInput-root': {
    color: isDarkMode ? colors.text.primary : '#000000',
    '& fieldset': {
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accent.main,
    },
  },
  '& .MuiInputLabel-root': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    '&.Mui-focused': {
      color: colors.accent.main,
    },
  },
  '& .MuiInputBase-input': {
    color: isDarkMode ? '#ffffff' : '#000000',
  }
})) as unknown as React.FC<TextFieldProps & { isDarkMode: boolean }>;

const StyledSelect = styled(Select)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  color: isDarkMode ? '#ffffff' : '#000000',
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  '&:hover .MuiOutlinedInput-notchedOutline': {
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
  },
  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
    borderColor: colors.accent.main,
  },
  '& .MuiSelect-icon': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
  }
})) as unknown as React.FC<SelectProps & { isDarkMode: boolean }>;

const ActionButton = styled(Button)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: colors.accent.main,
  color: isDarkMode ? '#ffffff' : '#000000',
  fontWeight: 600,
  padding: '8px 24px',
  '&:hover': {
    backgroundColor: colors.accent.light,
  },
  '&.Mui-disabled': {
    backgroundColor: 'rgba(255, 159, 67, 0.3)',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
  }
}));

const CancelButton = styled(Button)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  }
}));

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
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(euCountries.find(c => c.code === 'SK') || euCountries[0]);
  const { isDarkMode } = useThemeMode();
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });

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
    setLocalUserData((prev: UserData | null) => prev ? { ...prev, [field]: value } : null);
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

  const handleCountryChange = (event: SelectChangeEvent<unknown>) => {
    if (companyData) {
      setCompanyData({
        ...companyData,
        country: event.target.value as string
      });
    }
  };

  const handleCompanyDataChange = (field: keyof CompanyData, value: string) => {
    setCompanyData((prev: CompanyData | null) => prev ? { ...prev, [field]: value } : null);
  };

  const handleSaveProfile = async () => {
    try {
      // existujúci kód pre uloženie profilu
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error saving profile:', error);
    }
  };

  const handleSaveCompany = async () => {
    try {
      // existujúci kód pre uloženie firemných údajov
      setIsEditingCompany(false);
    } catch (error) {
      console.error('Error saving company data:', error);
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
        <PageTitle isDarkMode={isDarkMode}>Nastavenia</PageTitle>
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
          <SettingsCard isDarkMode={isDarkMode}>
            <CardHeader>
              <SectionTitle isDarkMode={isDarkMode}>Profil používateľa</SectionTitle>
              {!isEditingProfile ? (
                <IconButton onClick={() => setIsEditingProfile(true)} sx={{ color: colors.accent.main }}>
                  <EditIcon />
                </IconButton>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButton onClick={handleProfileSave} sx={{ color: colors.accent.main }}>
                    <SaveIcon />
                  </IconButton>
                  <IconButton onClick={handleProfileCancel} sx={{ color: colors.secondary.main }}>
                    <CancelIcon />
                  </IconButton>
                </Box>
              )}
            </CardHeader>
            <Grid container spacing={3}>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Meno"
                  value={localUserData?.firstName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUserDataChange('firstName', e.target.value)}
                  disabled={!isEditingProfile}
                  isDarkMode={isDarkMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Priezvisko"
                  value={localUserData?.lastName || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUserDataChange('lastName', e.target.value)}
                  disabled={!isEditingProfile}
                  isDarkMode={isDarkMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Email"
                  value={localUserData?.email || ''}
                  disabled
                  isDarkMode={isDarkMode}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  label="Telefón"
                  value={localUserData?.phone || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleUserDataChange('phone', e.target.value)}
                  disabled={!isEditingProfile}
                  isDarkMode={isDarkMode}
                />
              </Grid>
            </Grid>
          </SettingsCard>

          {isAdmin && (
            <SettingsCard isDarkMode={isDarkMode}>
              <CardHeader>
                <SectionTitle isDarkMode={isDarkMode}>Firemné údaje</SectionTitle>
                {!isEditingCompany ? (
                  <IconButton onClick={() => setIsEditingCompany(true)} sx={{ color: colors.accent.main }}>
                    <EditIcon />
                  </IconButton>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton onClick={handleSaveCompany} sx={{ color: colors.accent.main }}>
                      <SaveIcon />
                    </IconButton>
                    <IconButton onClick={() => setIsEditingCompany(false)} sx={{ color: colors.secondary.main }}>
                      <CancelIcon />
                    </IconButton>
                  </Box>
                )}
              </CardHeader>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Názov firmy"
                    value={companyData?.companyName || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('companyName', e.target.value)}
                    disabled={!isEditingCompany}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth disabled={!isEditingCompany}>
                    <InputLabel sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>Krajina</InputLabel>
                    <StyledSelect
                      value={selectedCountry.code}
                      onChange={handleCountryChange}
                      disabled={!isEditingCompany}
                      isDarkMode={isDarkMode}
                    >
                      {euCountries.map((country) => (
                        <MenuItem key={country.code} value={country.code}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <span>{country.flag}</span>
                            <span>{country.name}</span>
                          </Box>
                        </MenuItem>
                      ))}
                    </StyledSelect>
                  </FormControl>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="IČO"
                    value={companyData?.ico || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('ico', e.target.value)}
                    disabled={!isEditingCompany}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="IČ DPH"
                    value={companyData?.icDph || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('icDph', e.target.value)}
                    disabled={!isEditingCompany}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="DIČ"
                    value={companyData?.dic || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('dic', e.target.value)}
                    disabled={!isEditingCompany}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="Ulica"
                    value={companyData?.street || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('street', e.target.value)}
                    disabled={!isEditingCompany}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="PSČ"
                    value={companyData?.zipCode || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('zipCode', e.target.value)}
                    disabled={!isEditingCompany}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Mesto"
                    value={companyData?.city || ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('city', e.target.value)}
                    disabled={!isEditingCompany}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
              </Grid>
            </SettingsCard>
          )}
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{
            backgroundColor: isDarkMode ? colors.background.main : '#ffffff',
            color: isDarkMode ? '#ffffff' : '#000000',
            '& .MuiAlert-icon': {
              color: snackbar.severity === 'success' ? colors.accent.main : colors.secondary.main
            }
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
}

export default Settings; 