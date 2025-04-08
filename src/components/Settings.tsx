import React, { useState, useEffect, useRef } from 'react';
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
  Snackbar,
  Avatar
} from '@mui/material';
import { TypographyProps } from '@mui/material/Typography';
import { CardProps } from '@mui/material/Card';
import { TextFieldProps } from '@mui/material/TextField';
import { SelectProps } from '@mui/material/Select';
import { useNavigate } from 'react-router-dom';
import { auth, db, storage } from '../firebase';
import { doc, getDoc, updateDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, updateProfile } from 'firebase/auth';
import { 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
  AddAPhoto as AddAPhotoIcon,
  Delete as DeleteIcon,
  Person as PersonIcon,
  Business as BusinessIcon
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import { useThemeMode } from '../contexts/ThemeContext';
import { SelectChangeEvent } from '@mui/material/Select';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import ImageCropper from './ImageCropper';
import { UserData } from '../contexts/AuthContext';

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
  iban: string;
  bank: string;
  owner: {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string;
  };
  logoURL?: string;
}

interface SnackbarState {
  open: boolean;
  message: string;
  severity: 'success' | 'error' | 'info' | 'warning';
}

interface LocalUserData {
    uid: string;
    email: string;
    firstName: string;
    lastName: string;
    phone: string; // vždy string, prázdny string pre undefined
    companyID: string;
    role: string;
    photoURL?: string;
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

const PageWrapper = styled(Box)(({ theme }) => ({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
}));

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '100%',
    height: '2px',
    background: 'linear-gradient(90deg, #ff9f43 0%, rgba(255, 159, 67, 0.1) 100%)',
  },
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px'
  }
}));

const PageTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '2rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
  position: 'relative',
  marginBottom: '8px',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  '&:hover::after': {
    width: '100px',
  },
  '@media (max-width: 600px)': {
    fontSize: '1.5rem',
  }
}));

const SettingsGrid = styled(Grid)({
  '& .MuiGrid-item': {
    transition: 'transform 0.3s ease, opacity 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
    }
  }
});

const SettingsCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? colors.background.main : '#ffffff',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  padding: '24px',
  color: isDarkMode ? colors.text.primary : '#000000',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : '#e0e0e0'}`,
  marginBottom: '24px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
  },
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
    border: `1px solid ${isDarkMode ? 'rgba(255, 159, 67, 0.3)' : '#ff9f43'}`,
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
  position: 'relative',
  '&:after': {
    content: '""',
    position: 'absolute',
    bottom: '-12px',
    left: 0,
    right: 0,
    height: '1px',
    background: 'linear-gradient(90deg, rgba(255, 159, 67, 0.3) 0%, rgba(255, 159, 67, 0.1) 100%)',
  },
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '12px',
  }
}) as unknown as React.FC<React.HTMLAttributes<HTMLDivElement>>;

const SectionTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.25rem',
  fontWeight: 600,
  color: isDarkMode ? '#ffffff' : '#2d3436',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '& .MuiSvgIcon-root': {
    color: colors.accent.main,
    fontSize: '1.5rem',
  },
  '@media (max-width: 600px)': {
    fontSize: '1.1rem',
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
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '12px',
    transition: 'all 0.3s ease',
    color: isDarkMode ? colors.text.primary : '#000000',
    '& fieldset': {
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      borderWidth: '1px',
      borderRadius: '12px',
    },
    '&:hover fieldset': {
      borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accent.main,
      borderWidth: '1px',
    },
  },
  '& .MuiInputLabel-root': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    '&.Mui-focused': {
      color: colors.accent.main,
    },
  },
  '& .MuiInputBase-input': {
    padding: '14px 16px',
    fontSize: '0.95rem',
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
  borderRadius: '12px',
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
  transition: 'all 0.3s ease',
  backgroundColor: colors.accent.main,
  color: '#ffffff',
  '&:hover': {
    backgroundColor: colors.accent.dark,
    transform: 'translateY(-2px)',
    boxShadow: '0 4px 12px rgba(255, 159, 67, 0.3)',
  }
}));

const CancelButton = styled(Button)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  borderRadius: '12px',
  padding: '8px 24px',
  textTransform: 'none',
  fontWeight: 500,
  fontSize: '0.95rem',
  transition: 'all 0.3s ease',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  }
}));

const IconButtonStyled = styled(IconButton)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  borderRadius: '12px',
  padding: '8px',
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    transform: 'translateY(-2px)',
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1.25rem',
    color: colors.accent.main,
  }
}));

const SettingsContainer = styled(Paper)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '24px',
  backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  borderRadius: '12px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  backdropFilter: 'blur(10px)',
}));

const UploadContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  aspectRatio: '1',
  borderRadius: '16px',
  overflow: 'hidden',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  }
}));

const ImageContainer = styled(Box)({
  width: '200px',
  height: '200px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  position: 'relative',
  margin: '0 auto',
});

const StyledImage = styled('img')({
  width: '100%',
  height: '100%',
  objectFit: 'contain',
});

const ProfileImage = styled(StyledImage)({
  borderRadius: '50%',
});

const UploadSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  gap: '16px',
  padding: '32px',
  textAlign: 'center',
  cursor: 'pointer',
}));

const LargeAvatar = styled(Avatar)(({ theme }) => ({
  width: 120,
  height: 120,
  border: '4px solid rgba(255, 159, 67, 0.3)',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    borderRadius: '50%'
  },
  '&:hover': {
    transform: 'scale(1.05)',
    borderColor: 'rgba(255, 159, 67, 0.5)',
    boxShadow: '0 12px 40px rgba(0, 0, 0, 0.2)',
  },
}));

const CompanyLogo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'scale(1.02)',
  },
}));

const LogoImage = styled('img')({
  width: '100%',
  height: 'auto',
  objectFit: 'unset',
});

const FormSection = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  position: 'relative',
  padding: '24px',
  borderRadius: '16px',
  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.03)' : 'rgba(0, 0, 0, 0.02)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
  transition: 'all 0.3s ease',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)',
    border: `1px solid ${isDarkMode ? 'rgba(255, 159, 67, 0.2)' : 'rgba(255, 159, 67, 0.3)'}`,
  }
}));

const ButtonGroup = styled(Box)({
  display: 'flex',
  gap: '12px',
  marginTop: '24px',
  justifyContent: 'flex-end',
});

const SnackbarStyled = styled(Snackbar)({
  position: 'fixed',
  bottom: '24px',
  left: '50%',
  transform: 'translateX(-50%)',
  zIndex: 99999
});

const ImageWrapper = styled(Box)({
  width: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  position: 'relative',
});

function Settings() {
  const navigate = useNavigate();
  const { userData, setUserData } = useAuth();
  const [companyData, setCompanyData] = useState<CompanyData | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [localUserData, setLocalUserData] = useState<LocalUserData | null>(null);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isEditingCompany, setIsEditingCompany] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState(euCountries.find(c => c.code === 'SK') || euCountries[0]);
  const { isDarkMode } = useThemeMode();
  const [snackbar, setSnackbar] = useState<SnackbarState>({ open: false, message: '', severity: 'success' });
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [cropperOpen, setCropperOpen] = useState(false);
  const [logoCropperOpen, setLogoCropperOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [selectedLogo, setSelectedLogo] = useState<string | null>(null);
  const [isCompanyLogo, setIsCompanyLogo] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  // Konverzia z UserData na LocalUserData
  const convertToLocalData = (data: UserData): LocalUserData => ({
    ...data,
    phone: data.phone || ""
  });

  // Konverzia z LocalUserData späť na UserData
  const convertToUserData = (data: LocalUserData): UserData => ({
    ...data,
    phone: data.phone || undefined
  });

  useEffect(() => {
    if (userData) {
      setLocalUserData(convertToLocalData(userData));
      setProfileImage(userData.photoURL || '');
    }
  }, [userData]);

  useEffect(() => {
    if (!userData?.uid) return;

    // Vytvorenie real-time listenera na zmeny v user dokumente
    const unsubscribe = onSnapshot(doc(db, 'users', userData.uid), (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const updatedUserData: UserData = {
          uid: data.uid || userData.uid,
          email: data.email || userData.email,
          firstName: data.firstName || userData.firstName,
          lastName: data.lastName || userData.lastName,
          phone: data.phone || userData.phone,
          companyID: data.companyID || userData.companyID,
          role: data.role || userData.role,
          photoURL: data.photoURL || userData.photoURL
        };
        setLocalUserData(convertToLocalData(updatedUserData));
        if (data.photoURL) {
          setProfileImage(data.photoURL);
        }
      }
    });

    return () => unsubscribe();
  }, [userData?.uid]);

  useEffect(() => {
    if (userData) {
      setIsAdmin(userData.role === 'admin');
      fetchCompanyData();
    }
  }, [userData]);

  useEffect(() => {
    if (companyData?.logoURL) {
      setCompanyLogo(companyData.logoURL);
    }
  }, [companyData?.logoURL]);

  const fetchCompanyData = async () => {
    try {
      setLoading(true);
      setError('');
      
      if (!userData?.companyID) {
        setError('Nie je možné načítať údaje o firme');
        return;
      }

      // Pridanie real-time listenera pre company data
      const unsubscribe = onSnapshot(doc(db, 'companies', userData.companyID), (doc) => {
        if (doc.exists()) {
          const data = doc.data();
          setCompanyData({ id: doc.id, ...data } as CompanyData);
          if (data.logoURL) {
            setCompanyLogo(data.logoURL);
          }
        } else {
          setError('Firma nebola nájdená');
        }
        setLoading(false);
      });

      return () => unsubscribe();

    } catch (err) {
      console.error('Error fetching company data:', err);
      setError('Nastala chyba pri načítaní údajov o firme');
      setLoading(false);
    }
  };

  const handleProfileChange = (field: keyof LocalUserData) => (event: React.ChangeEvent<HTMLInputElement>) => {
    if (!localUserData) return;
    setLocalUserData(prev => {
        if (!prev) return null;
        return {
            ...prev,
            [field]: event.target.value
        };
    });
  };

  const handleSaveProfile = async () => {
    if (!localUserData) return;

    try {
      setIsSaving(true);
      const userRef = doc(db, 'users', localUserData.uid);
      
      // Vytvoríme objekt len s poliami, ktoré chceme aktualizovať
      const updateData = {
        firstName: localUserData.firstName,
        lastName: localUserData.lastName,
        phone: localUserData.phone || null,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updateData);
      
      // Aktualizujeme lokálny stav s kompletným userData objektom
      const updatedUserData: UserData = {
        ...userData!,
        firstName: localUserData.firstName,
        lastName: localUserData.lastName,
        phone: localUserData.phone || undefined
      };
      setUserData(updatedUserData);
      
      setSnackbar({
        open: true,
        message: 'Profil bol úspešne aktualizovaný',
        severity: 'success'
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: 'Chyba pri aktualizácii profilu',
        severity: 'error'
      });
    } finally {
      setIsSaving(false);
    }
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
      const userRef = doc(db, 'users', localUserData.uid);
      
      // Vytvoríme objekt len s poliami, ktoré chceme aktualizovať
      const updateData = {
        firstName: localUserData.firstName,
        lastName: localUserData.lastName,
        phone: localUserData.phone || null,
        updatedAt: serverTimestamp()
      };

      await updateDoc(userRef, updateData);
      
      // Aktualizujeme lokálny stav s kompletným userData objektom
      const updatedUserData: UserData = {
        ...userData!,
        firstName: localUserData.firstName,
        lastName: localUserData.lastName,
        phone: localUserData.phone || undefined
      };
      setUserData(updatedUserData);
      
      setSnackbar({
        open: true,
        message: 'Profil bol úspešne aktualizovaný',
        severity: 'success'
      });
      setIsEditingProfile(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSnackbar({
        open: true,
        message: 'Chyba pri aktualizácii profilu',
        severity: 'error'
      });
    }
  };

  const handleProfileCancel = () => {
    if (userData) {
      setLocalUserData(convertToLocalData(userData));
    } else {
      setLocalUserData(null);
    }
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

  const handleSaveCompany = async () => {
    try {
      // existujúci kód pre uloženie firemných údajov
      setIsEditingCompany(false);
    } catch (error) {
      console.error('Error saving company data:', error);
    }
  };

  const handleProfileImageSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userData?.uid) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
        setCropperOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setSnackbar({
        open: true,
        message: 'Chyba pri načítaní súboru',
        severity: 'error'
      });
    }
  };

  const handleLogoSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userData?.companyID) return;

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedLogo(reader.result as string);
        setLogoCropperOpen(true);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error reading file:', error);
      setSnackbar({
        open: true,
        message: 'Chyba pri načítaní súboru',
        severity: 'error'
      });
    }
  };

  const handleProfileImageSave = async (croppedImage: string) => {
    if (!userData?.uid || !auth.currentUser) return;
    
    try {
      setLoading(true);
      setCropperOpen(false);

      // Convert base64 to blob
      const base64Response = await fetch(croppedImage);
      const blob = await base64Response.blob();

      // Create a reference to the file location
      const storageRef = ref(storage, `users/${userData.uid}/profile-photo.png`);

      // Upload the blob
      await uploadBytes(storageRef, blob, {
        contentType: 'image/png',
        cacheControl: 'public,max-age=31536000', // Cache na 1 rok
        customMetadata: {
          'lastModified': new Date().toISOString()
        }
      });

      // Get the download URL
      const url = await getDownloadURL(storageRef);
      
      // Update user profile in Firebase Auth
      await updateProfile(auth.currentUser, {
        photoURL: url
      });

      // Update user document in Firestore
      await updateDoc(doc(db, 'users', userData.uid), {
        photoURL: url,
        updatedAt: new Date()
      });

      // Update local state
      setProfileImage(url);
      setLocalUserData(prev => prev ? { ...prev, photoURL: url } : null);

      setSnackbar({
        open: true,
        message: 'Profilová fotka bola úspešne nahraná',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error uploading profile image:', error);
      setSnackbar({
        open: true,
        message: 'Chyba pri nahrávaní fotky',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setSelectedImage(null);
    }
  };

  const handleCompanyLogoSave = async (croppedImage: string) => {
    if (!userData?.uid || !userData?.companyID) return;
    
    try {
      setLoading(true);
      setLogoCropperOpen(false);

      // Convert base64 to blob
      const base64Response = await fetch(croppedImage);
      const blob = await base64Response.blob();

      // Create a reference to the file location
      const storageRef = ref(storage, `companies/${userData.companyID}/logo.png`);

      // Upload the blob
      await uploadBytes(storageRef, blob, {
        contentType: 'image/png',
        cacheControl: 'public,max-age=31536000',
        customMetadata: {
          'lastModified': new Date().toISOString(),
          'uploadedBy': userData.uid,
          'companyID': userData.companyID
        }
      });

      // Get the download URL
      const url = await getDownloadURL(storageRef);

      // Update company document in Firestore
      await updateDoc(doc(db, 'companies', userData.companyID), {
        logoURL: url,
        updatedAt: new Date(),
        updatedBy: userData.uid
      });

      // Update local state
      setCompanyLogo(url);
      setSelectedLogo(null);

      setSnackbar({
        open: true,
        message: 'Logo firmy bolo úspešne nahrané',
        severity: 'success'
      });

    } catch (error) {
      console.error('Error uploading company logo:', error);
      setSnackbar({
        open: true,
        message: 'Chyba pri nahrávaní loga',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (!userData?.uid || !profileImage) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `users/${userData.uid}/profile-photo`);
      await deleteObject(storageRef);
      
      // Update user profile in Firestore
      await updateDoc(doc(db, 'users', userData.uid), {
        photoURL: null,
        updatedAt: new Date()
      });

      setProfileImage(null);
      setSnackbar({
        open: true,
        message: 'Profilová fotka bola odstránená',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting profile photo:', error);
      setSnackbar({
        open: true,
        message: 'Chyba pri odstraňovaní fotky',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLogo = async () => {
    if (!userData?.companyID || !companyLogo) return;

    try {
      setLoading(true);
      const storageRef = ref(storage, `companies/${userData.companyID}/logo`);
      await deleteObject(storageRef);

      // Update company profile in Firestore
      await updateDoc(doc(db, 'companies', userData.companyID), {
        logoURL: null,
        updatedAt: new Date()
      });

      setCompanyLogo(null);
      setSnackbar({
        open: true,
        message: 'Logo firmy bolo odstránené',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error deleting logo:', error);
      setSnackbar({
        open: true,
        message: 'Chyba pri odstraňovaní loga',
        severity: 'error'
      });
    } finally {
      setLoading(false);
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

      <SettingsGrid container spacing={3}>
        <Grid item xs={12}>
          <SettingsCard isDarkMode={isDarkMode}>
            <CardHeader>
              <SectionTitle isDarkMode={isDarkMode}>
                <PersonIcon />
                Profil používateľa
              </SectionTitle>
              {!isEditingProfile ? (
                <IconButtonStyled isDarkMode={isDarkMode} onClick={() => setIsEditingProfile(true)}>
                  <EditIcon />
                </IconButtonStyled>
              ) : (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <IconButtonStyled isDarkMode={isDarkMode} onClick={handleProfileSave}>
                    <SaveIcon />
                  </IconButtonStyled>
                  <IconButtonStyled isDarkMode={isDarkMode} onClick={handleProfileCancel}>
                    <CancelIcon />
                  </IconButtonStyled>
                </Box>
              )}
            </CardHeader>
            <FormSection isDarkMode={isDarkMode}>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Meno"
                    value={localUserData?.firstName || ''}
                    onChange={handleProfileChange('firstName')}
                    disabled={!isEditingProfile}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Priezvisko"
                    value={localUserData?.lastName || ''}
                    onChange={handleProfileChange('lastName')}
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
                    onChange={handleProfileChange('phone')}
                    disabled={!isEditingProfile}
                    isDarkMode={isDarkMode}
                  />
                </Grid>
              </Grid>
            </FormSection>
          </SettingsCard>

          {isAdmin && (
            <SettingsCard isDarkMode={isDarkMode}>
              <CardHeader>
                <SectionTitle isDarkMode={isDarkMode}>
                  <BusinessIcon />
                  Firemné údaje
                </SectionTitle>
                {!isEditingCompany ? (
                  <IconButtonStyled isDarkMode={isDarkMode} onClick={() => setIsEditingCompany(true)}>
                    <EditIcon />
                  </IconButtonStyled>
                ) : (
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButtonStyled isDarkMode={isDarkMode} onClick={handleSaveCompany}>
                      <SaveIcon />
                    </IconButtonStyled>
                    <IconButtonStyled isDarkMode={isDarkMode} onClick={() => setIsEditingCompany(false)}>
                      <CancelIcon />
                    </IconButtonStyled>
                  </Box>
                )}
              </CardHeader>
              <FormSection isDarkMode={isDarkMode}>
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
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="IBAN"
                      value={companyData?.iban || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('iban', e.target.value)}
                      disabled={!isEditingCompany}
                      isDarkMode={isDarkMode}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <StyledTextField
                      fullWidth
                      label="Banka"
                      value={companyData?.bank || ''}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleCompanyDataChange('bank', e.target.value)}
                      disabled={!isEditingCompany}
                      isDarkMode={isDarkMode}
                    />
                  </Grid>
                </Grid>
              </FormSection>
            </SettingsCard>
          )}
        </Grid>
      </SettingsGrid>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <SettingsCard isDarkMode={isDarkMode}>
            <CardHeader>
              <SectionTitle isDarkMode={isDarkMode}>
                <AddAPhotoIcon />
                Profilová fotka
              </SectionTitle>
            </CardHeader>
            <UploadSection>
              <input
                type="file"
                ref={profileInputRef}
                onChange={handleProfileImageSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <ImageContainer onClick={() => profileInputRef.current?.click()}>
                {profileImage ? (
                  <ProfileImage src={profileImage} alt="Profile photo" />
                ) : (
                  <AddAPhotoIcon sx={{ width: 40, height: 40, color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }} />
                )}
                {profileImage && (
                  <IconButtonStyled
                    isDarkMode={isDarkMode}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteProfile();
                    }}
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: 'error.main',
                      '&:hover': { backgroundColor: 'error.dark' },
                    }}
                  >
                    <DeleteIcon sx={{ color: '#ffffff' }} />
                  </IconButtonStyled>
                )}
              </ImageContainer>
              <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
                Kliknite pre nahratie profilovej fotky
              </Typography>
            </UploadSection>
          </SettingsCard>
        </Grid>

        <Grid item xs={12} md={6}>
          <SettingsCard isDarkMode={isDarkMode}>
            <CardHeader>
              <SectionTitle isDarkMode={isDarkMode}>
                <BusinessIcon />
                Logo firmy
              </SectionTitle>
            </CardHeader>
            <UploadSection>
              <input
                type="file"
                ref={logoInputRef}
                onChange={handleLogoSelect}
                accept="image/*"
                style={{ display: 'none' }}
              />
              <ImageContainer onClick={() => logoInputRef.current?.click()}>
                {companyLogo ? (
                  <StyledImage src={companyLogo} alt="Company logo" />
                ) : (
                  <AddAPhotoIcon sx={{ width: 40, height: 40, color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)' }} />
                )}
                {companyLogo && (
                  <IconButtonStyled
                    isDarkMode={isDarkMode}
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteLogo();
                    }}
                    sx={{
                      position: 'absolute',
                      bottom: 8,
                      right: 8,
                      backgroundColor: 'error.main',
                      '&:hover': { backgroundColor: 'error.dark' },
                    }}
                  >
                    <DeleteIcon sx={{ color: '#ffffff' }} />
                  </IconButtonStyled>
                )}
              </ImageContainer>
              <Typography variant="body2" sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}>
                Kliknite pre nahratie loga firmy
              </Typography>
            </UploadSection>
          </SettingsCard>
        </Grid>
      </Grid>

      {/* Image Croppers */}
      <ImageCropper
        open={cropperOpen}
        image={selectedImage || ''}
        onClose={() => {
          setCropperOpen(false);
          setSelectedImage(null);
        }}
        onSave={handleProfileImageSave}
        aspectRatio={1}
        circular={true}
      />

      <ImageCropper
        open={logoCropperOpen}
        image={selectedLogo || ''}
        onClose={() => {
          setLogoCropperOpen(false);
          setSelectedLogo(null);
        }}
        onSave={handleCompanyLogoSave}
        aspectRatio={undefined}
        circular={false}
      />

      <ButtonGroup>
        <CancelButton isDarkMode={isDarkMode} onClick={handleCancel}>
          Zrušiť
        </CancelButton>
        <ActionButton
          isDarkMode={isDarkMode}
          onClick={handleSave}
          disabled={loading}
          sx={{
            position: 'relative',
            overflow: 'hidden',
            '&::after': {
              content: '""',
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              background: 'linear-gradient(45deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0) 100%)',
              transform: 'translateX(-100%)',
              transition: 'transform 0.6s ease',
            },
            '&:hover::after': {
              transform: 'translateX(100%)',
            }
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Uložiť'}
        </ActionButton>
      </ButtonGroup>

      <SnackbarStyled
        open={snackbar.open || Boolean(error) || Boolean(success)}
        autoHideDuration={6000}
        onClose={() => {
          setSnackbar({ ...snackbar, open: false });
          setError('');
          setSuccess('');
        }}
        sx={{
          '& .MuiAlert-root': {
            borderRadius: '12px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
            minWidth: '300px',
            backgroundColor: error ? 'rgba(211, 47, 47, 0.95)' : success ? 'rgba(46, 125, 50, 0.95)' : 
              snackbar.severity === 'success' ? 'rgba(46, 125, 50, 0.95)' : 'rgba(211, 47, 47, 0.95)',
          }
        }}
      >
        <Alert 
          severity={error ? 'error' : success ? 'success' : snackbar.severity}
          sx={{ 
            width: '100%',
            animation: 'slideUp 0.3s ease-out',
            '@keyframes slideUp': {
              from: { transform: 'translateY(20px)', opacity: 0 },
              to: { transform: 'translateY(0)', opacity: 1 }
            },
            color: '#ffffff',
            backgroundColor: 'inherit',
            '& .MuiAlert-icon': {
              color: '#ffffff'
            }
          }}
        >
          {error || success || snackbar.message}
        </Alert>
      </SnackbarStyled>
    </PageWrapper>
  );
}

export default Settings;
