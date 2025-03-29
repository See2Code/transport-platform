import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Tooltip,
  styled,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
  Card,
  CircularProgress,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { sk } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import InfoIcon from '@mui/icons-material/Info';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import { useNavigate } from 'react-router-dom';
import SearchField from './common/SearchField';
import { format } from 'date-fns';
import { useThemeMode } from '../contexts/ThemeContext';

const euCountries = [
  { code: 'SK', name: 'Slovensko', flag: '🇸🇰', prefix: '+421' },
  { code: 'CZ', name: 'Česko', flag: '🇨🇿', prefix: '+420' },
  { code: 'HU', name: 'Maďarsko', flag: '🇭🇺', prefix: '+36' },
  { code: 'PL', name: 'Poľsko', flag: '🇵🇱', prefix: '+48' },
  { code: 'AT', name: 'Rakúsko', flag: '🇦🇹', prefix: '+43' },
  { code: 'DE', name: 'Nemecko', flag: '🇩🇪', prefix: '+49' },
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

// Definícia stavov obchodného prípadu
const caseStatuses = {
  CALLED: { label: 'Dovolaný', color: 'success' as const },
  NOT_CALLED: { label: 'Nedovolaný', color: 'error' as const },
  EMAIL_SENT: { label: 'Poslaný email', color: 'info' as const },
  IN_PROGRESS: { label: 'V štádiu riešenia', color: 'warning' as const },
  CALL_LATER: { label: 'Volať neskôr', color: 'secondary' as const },
  MEETING: { label: 'Stretnutie', color: 'primary' as const },
  CALL: { label: 'Telefonát', color: 'info' as const },
  INTERESTED: { label: 'Záujem', color: 'success' as const },
  NOT_INTERESTED: { label: 'Nezáujem', color: 'error' as const }
};

interface BusinessCase {
  id?: string;
  companyName: string;
  vatNumber: string;
  companyAddress: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  internalNote: string;
  status: keyof typeof caseStatuses;
  reminderDateTime: Date | null;
  reminderNote: string;
  createdAt: Timestamp;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  countryCode?: string;
}

const MobileBusinessCard = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
  borderRadius: theme.spacing(1),
  padding: theme.spacing(2),
  marginBottom: theme.spacing(2),
  boxShadow: isDarkMode ? '0 2px 4px rgba(0,0,0,0.2)' : '0 2px 4px rgba(0,0,0,0.1)',
  color: isDarkMode ? '#ffffff' : '#000000',
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
}));

const MobileCardHeader = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: theme.spacing(2),
  color: isDarkMode ? '#ffffff' : '#000000',
  width: '100%',
}));

const MobileCompanyName = styled(Typography)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  fontWeight: 600,
  color: isDarkMode ? '#ffffff' : '#000000',
  fontSize: '1.1rem',
}));

const MobileCardContent = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(1),
  color: isDarkMode ? '#ffffff' : '#000000',
  width: '100%',
}));

const MobileInfoRow = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  color: isDarkMode ? '#ffffff' : '#000000',
  width: '100%',
  '& .MuiSvgIcon-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    fontSize: '1.1rem',
  }
}));

const MobileCardActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '8px',
  paddingTop: '12px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)'
});

const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px'
  }
});

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
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
  }
}));

const AddButton = styled(Button)({
  marginBottom: '24px',
  '&:hover': {
    backgroundColor: 'rgba(255, 159, 67, 0.1)'
  }
});

const SearchWrapper = styled(Box)({
  marginBottom: '24px',
  position: 'relative',
  zIndex: 1,
  maxWidth: '100%',
  width: '100%'
});

const convertToDate = (dateTime: Date | Timestamp | null): Date | null => {
  if (!dateTime) return null;
  if (dateTime instanceof Date) return dateTime;
  if (dateTime instanceof Timestamp) return dateTime.toDate();
  return new Date(dateTime);
};

const StyledCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.2)',
    border: '1px solid rgba(255, 159, 67, 0.2)',
    '& .MuiCardContent-root': {
      background: 'linear-gradient(180deg, rgba(255, 159, 67, 0.1) 0%, rgba(255, 159, 67, 0) 100%)',
    }
  },
  '& .MuiTypography-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
  },
  '& .MuiTypography-body1': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  },
}));

const StyledTableCell = styled(TableCell)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  '&.MuiTableCell-head': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    fontWeight: 600,
  }
}));

const StyledTableRow = styled(TableRow)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  '& .MuiTableCell-root': {
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  }
}));

const StyledDialogContent = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '24px',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  backdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  maxHeight: '90vh',
  overflowY: 'auto',
  margin: '16px',
  '@media (max-width: 600px)': {
    padding: '16px',
    margin: '8px',
    maxHeight: '95vh',
  },
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    margin: 0,
  },
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    '@media (max-width: 600px)': {
      padding: '16px',
    },
    '& .MuiTypography-root': {
      fontSize: '1.5rem',
      fontWeight: 600,
      '@media (max-width: 600px)': {
        fontSize: '1.25rem',
      }
    }
  },
  '& .MuiDialogContent-root': {
    padding: '16px 24px',
    '@media (max-width: 600px)': {
      padding: '16px',
    },
    '& .MuiFormLabel-root': {
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    },
    '& .MuiInputBase-root': {
      color: isDarkMode ? '#ffffff' : '#000000',
      '& fieldset': {
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
      },
      '&:hover fieldset': {
        borderColor: isDarkMode ? 'rgba(255, 159, 67, 0.5)' : 'rgba(255, 159, 67, 0.5)',
      },
      '&.Mui-focused fieldset': {
        borderColor: colors.accent.main,
      }
    },
    '& .MuiInputBase-input': {
      color: isDarkMode ? '#ffffff' : '#000000',
    },
    '& .MuiSelect-select': {
      color: isDarkMode ? '#ffffff' : '#000000',
    }
  },
  '& .MuiDialogActions-root': {
    padding: '16px 24px 24px 24px',
    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
    borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    '@media (max-width: 600px)': {
      padding: '16px',
    },
    '& .MuiButton-root': {
      borderRadius: '12px',
      padding: '8px 24px',
      textTransform: 'none',
      fontSize: '1rem',
      '@media (max-width: 600px)': {
        padding: '8px 16px',
        fontSize: '0.9rem',
      }
    }
  }
}));

export default function BusinessCases() {
  const [cases, setCases] = useState<BusinessCase[]>([]);
  const [open, setOpen] = useState(false);
  const [editCase, setEditCase] = useState<BusinessCase | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const { currentUser, userData } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({
    companyName: '',
    vatNumber: '',
    companyAddress: '',
    contactPerson: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    },
    internalNote: '',
    status: 'NOT_CALLED' as keyof typeof caseStatuses,
    reminderDateTime: null as Date | null,
    reminderNote: '',
    createdBy: null as { firstName: string; lastName: string; } | null,
    createdAt: null as Date | null
  });
  const [selectedCountry, setSelectedCountry] = useState(euCountries[0]);
  const { isDarkMode } = useThemeMode();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const casesCollection = collection(db, 'businessCases');
      const casesQuery = query(casesCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(casesQuery);
      const casesData = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : Timestamp.fromDate(new Date(data.createdAt)),
          reminderDateTime: data.reminderDateTime ? new Date(data.reminderDateTime.seconds * 1000) : null
        };
      }) as BusinessCase[];
      setCases(casesData);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri načítaní prípadov',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async () => {
    try {
      if (!currentUser || !userData) {
        setSnackbar({
          open: true,
          message: 'Nie ste prihlásený',
          severity: 'error'
        });
        return;
      }

      const businessCaseData = {
        ...formData,
        countryCode: selectedCountry.code,
        createdAt: editCase ? editCase.createdAt : Timestamp.now(),
        createdBy: editCase ? editCase.createdBy : {
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      };

      if (editCase?.id) {
        await updateDoc(doc(db, 'businessCases', editCase.id), businessCaseData);
        setSnackbar({
          open: true,
          message: 'Obchodný prípad bol úspešne upravený',
          severity: 'success'
        });
      } else {
        await addDoc(collection(db, 'businessCases'), businessCaseData);
        setSnackbar({
          open: true,
          message: 'Nový obchodný prípad bol úspešne pridaný',
          severity: 'success'
        });
      }

      // Vytvorenie alebo aktualizácia kontaktu
      const contactsCollection = collection(db, 'contacts');
      const contactData = {
        firstName: formData.contactPerson.firstName,
        lastName: formData.contactPerson.lastName,
        company: formData.companyName,
        phonePrefix: selectedCountry.prefix,
        phoneNumber: formData.contactPerson.phone.replace(selectedCountry.prefix, ''),
        countryCode: selectedCountry.code.toLowerCase(),
        email: formData.contactPerson.email,
        createdAt: Timestamp.now(),
        createdBy: {
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      };

      await addDoc(contactsCollection, contactData);

      // Ak je nastavený reminder, vytvoríme email notifikáciu
      if (formData.reminderDateTime) {
        console.log('Vytváram pripomienku:', {
          dateTime: formData.reminderDateTime,
          email: currentUser.email,
          companyName: formData.companyName
        });

        const reminderData = {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          businessCaseId: editCase?.id || '',
          reminderDateTime: Timestamp.fromDate(new Date(formData.reminderDateTime)),
          companyName: formData.companyName,
          reminderNote: formData.reminderNote || '',
          contactPerson: formData.contactPerson,
          createdAt: Timestamp.now(),
          sent: false
        };

        console.log('Dáta pripomienky:', reminderData);
        
        try {
          const docRef = await addDoc(collection(db, 'reminders'), reminderData);
          console.log('Pripomienka vytvorená s ID:', docRef.id);
        } catch (error) {
          console.error('Chyba pri vytváraní pripomienky:', error);
          throw error;
        }
      }

      setOpen(false);
      setEditCase(null);
      setFormData({
        companyName: '',
        vatNumber: '',
        companyAddress: '',
        contactPerson: {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
        },
        internalNote: '',
        status: 'NOT_CALLED',
        reminderDateTime: null,
        reminderNote: '',
        createdBy: null,
        createdAt: null
      });
      fetchCases();
    } catch (error) {
      console.error('Error saving business case:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri ukladaní obchodného prípadu',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    setCaseToDelete(id);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!caseToDelete) return;
    
    try {
      await deleteDoc(doc(db, 'businessCases', caseToDelete));
      setSnackbar({
        open: true,
        message: 'Prípad bol úspešne vymazaný',
        severity: 'success'
      });
      fetchCases();
    } catch (error) {
      console.error('Error deleting case:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri mazaní prípadu',
        severity: 'error'
      });
    } finally {
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
    }
  };

  const handleEdit = (businessCase: BusinessCase) => {
    setEditCase(businessCase);
    setFormData({
      companyName: businessCase.companyName,
      vatNumber: businessCase.vatNumber,
      companyAddress: businessCase.companyAddress,
      contactPerson: businessCase.contactPerson,
      internalNote: businessCase.internalNote,
      status: businessCase.status,
      reminderDateTime: businessCase.reminderDateTime,
      reminderNote: businessCase.reminderNote,
      createdBy: businessCase.createdBy || null,
      createdAt: businessCase.createdAt?.toDate() || null
    });
    setOpen(true);
  };

  const handleCountryChange = (event: any) => {
    const country = euCountries.find(c => c.code === event.target.value);
    if (country) {
      setSelectedCountry(country);
      // Ak je telefónne číslo prázdne, pridáme predvolbu
      if (!formData.contactPerson.phone) {
        setFormData({
          ...formData,
          contactPerson: { ...formData.contactPerson, phone: country.prefix }
        });
      }
    }
  };

  const filteredCases = cases.filter((businessCase: BusinessCase) =>
    Object.values(businessCase)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const renderMobileCase = (businessCase: BusinessCase) => (
    <MobileBusinessCard isDarkMode={isDarkMode}>
      <MobileCardHeader isDarkMode={isDarkMode}>
        <MobileCompanyName isDarkMode={isDarkMode}>
          {businessCase.companyName}
        </MobileCompanyName>
        <Chip
          label={caseStatuses[businessCase.status].label}
          color={caseStatuses[businessCase.status].color}
          size="small"
          sx={{
            height: '24px',
            fontSize: '0.8rem'
          }}
        />
      </MobileCardHeader>
      <MobileCardContent isDarkMode={isDarkMode}>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <AccessTimeIcon />
          {businessCase.createdAt instanceof Timestamp ? 
            businessCase.createdAt.toDate().toLocaleString('sk-SK', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(',', '') : 
            new Date(businessCase.createdAt).toLocaleString('sk-SK', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            }).replace(',', '')}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <BusinessIcon />
          {businessCase.vatNumber}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <BusinessIcon />
          {businessCase.companyAddress}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <PersonIcon />
          {`${businessCase.contactPerson.firstName} ${businessCase.contactPerson.lastName}`}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <PhoneIcon />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <img
              loading="lazy"
              width="16"
              src={`https://flagcdn.com/${businessCase.countryCode?.toLowerCase()}.svg`}
              alt=""
            />
            {businessCase.contactPerson.phone}
          </Box>
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <EmailIcon />
          {businessCase.contactPerson.email}
        </MobileInfoRow>
        <MobileInfoRow isDarkMode={isDarkMode}>
          <PersonIcon />
          Vytvoril: {businessCase.createdBy?.firstName} {businessCase.createdBy?.lastName}
        </MobileInfoRow>
        {businessCase.reminderDateTime && (
          <MobileInfoRow isDarkMode={isDarkMode}>
            <AccessTimeIcon />
            Pripomienka: {format(businessCase.reminderDateTime, 'dd.MM.yyyy HH:mm')}
          </MobileInfoRow>
        )}
        {businessCase.internalNote && (
          <MobileInfoRow isDarkMode={isDarkMode} sx={{ 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '8px',
            borderRadius: '8px'
          }}>
            <Typography sx={{ 
              fontSize: '0.8rem', 
              color: colors.accent.main,
              marginBottom: '4px'
            }}>
              Interná poznámka:
            </Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>
              {businessCase.internalNote}
            </Typography>
          </MobileInfoRow>
        )}
        {businessCase.reminderNote && (
          <MobileInfoRow isDarkMode={isDarkMode} sx={{ 
            flexDirection: 'column', 
            alignItems: 'flex-start',
            backgroundColor: 'rgba(255, 255, 255, 0.05)',
            padding: '8px',
            borderRadius: '8px'
          }}>
            <Typography sx={{ 
              fontSize: '0.8rem', 
              color: colors.accent.main,
              marginBottom: '4px'
            }}>
              Poznámka k pripomienke:
            </Typography>
            <Typography sx={{ fontSize: '0.9rem' }}>
              {businessCase.reminderNote}
            </Typography>
          </MobileInfoRow>
        )}
      </MobileCardContent>
      <MobileCardActions>
        <IconButton
          size="small"
          onClick={() => handleEdit(businessCase)}
          sx={{ 
            color: colors.accent.main,
            backgroundColor: 'rgba(255, 159, 67, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 159, 67, 0.2)'
            }
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton
          size="small"
          onClick={() => handleDelete(businessCase.id!)}
          sx={{ 
            color: colors.secondary.main,
            backgroundColor: 'rgba(255, 107, 107, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 107, 107, 0.2)'
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      </MobileCardActions>
    </MobileBusinessCard>
  );

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Obchodné prípady</PageTitle>
        <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
          <Button
            startIcon={<AddIcon />}
            onClick={() => {
              setEditCase(null);
              setFormData({
                companyName: '',
                vatNumber: '',
                companyAddress: '',
                contactPerson: {
                  firstName: '',
                  lastName: '',
                  phone: '',
                  email: '',
                },
                internalNote: '',
                status: 'NOT_CALLED',
                reminderDateTime: null,
                reminderNote: '',
                createdBy: null,
                createdAt: null
              });
              setSelectedCountry(euCountries[0]);
              setOpen(true);
            }}
            sx={{
              backgroundColor: colors.accent.main,
              color: '#ffffff',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '0.9rem',
              fontWeight: 600,
              textTransform: 'none',
              '&:hover': {
                backgroundColor: colors.accent.light,
              }
            }}
          >
            Pridať prípad
          </Button>
        </Box>
      </PageHeader>

      {/* Mobilné tlačidlo */}
      <Box sx={{ 
        display: { xs: 'block', sm: 'none' },
        width: '100%', 
        backgroundColor: colors.accent.main,
        borderRadius: '16px',
        marginBottom: '24px',
        padding: '4px',
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        '&:hover': {
          backgroundColor: colors.accent.light,
        }
      }}>
        <AddButton
          fullWidth
          onClick={() => {
            setEditCase(null);
            setFormData({
              companyName: '',
              vatNumber: '',
              companyAddress: '',
              contactPerson: {
                firstName: '',
                lastName: '',
                phone: '',
                email: '',
              },
              internalNote: '',
              status: 'NOT_CALLED',
              reminderDateTime: null,
              reminderNote: '',
              createdBy: null,
              createdAt: null
            });
            setSelectedCountry(euCountries[0]);
            setOpen(true);
          }}
        >
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            gap: 1,
            color: '#ffffff',
            fontSize: '1rem',
            fontWeight: 600,
            width: '100%'
          }}>
            <AddIcon sx={{ fontSize: '1.2rem' }} />
            Pridať prípad
          </Box>
        </AddButton>
      </Box>

      <SearchWrapper>
        <SearchField
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
          label="Vyhľadať prípad"
        />
      </SearchWrapper>

      {/* Mobilné zobrazenie */}
      <Box sx={{ 
        display: { 
          xs: 'block', 
          md: 'none' 
        }
      }}>
        {filteredCases.map((businessCase: BusinessCase) => (
          <Box key={businessCase.id}>
            {renderMobileCase(businessCase)}
          </Box>
        ))}
      </Box>

      {/* Desktop zobrazenie */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          display: { 
            xs: 'none', 
            md: 'block' 
          },
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          borderRadius: '20px',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          backdropFilter: 'blur(20px)',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
          '& .MuiTableCell-root': {
            color: isDarkMode ? '#ffffff' : '#000000',
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            padding: '16px',
            fontSize: '0.9rem',
            whiteSpace: 'nowrap'
          },
          '& .MuiTableHead-root .MuiTableCell-root': {
            fontWeight: 600,
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          },
          '& .MuiTableBody-root .MuiTableRow-root': {
            transition: 'all 0.2s ease-in-out',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
              transform: 'translateY(-2px)',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
            }
          }
        }}
      >
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Dátum vytvorenia</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Firma</TableCell>
              <TableCell>IČ DPH</TableCell>
              <TableCell>Kontaktná osoba</TableCell>
              <TableCell>Telefón</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Vytvoril</TableCell>
              <TableCell>Pripomienka</TableCell>
              <TableCell align="right">Akcie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((businessCase) => (
              <StyledTableRow isDarkMode={isDarkMode} key={businessCase.id}>
                <TableCell>
                  {businessCase.createdAt instanceof Timestamp ? 
                    businessCase.createdAt.toDate().toLocaleString('sk-SK', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(',', '') : 
                    new Date(businessCase.createdAt).toLocaleString('sk-SK', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(',', '')}
                </TableCell>
                <TableCell>
                  <Chip
                    label={caseStatuses[businessCase.status].label}
                    color={caseStatuses[businessCase.status].color}
                    size="small"
                    sx={{
                      fontSize: {
                        xs: '0.7rem',
                        sm: '0.8rem'
                      },
                      height: {
                        xs: '24px',
                        sm: '32px'
                      }
                    }}
                  />
                </TableCell>
                <TableCell>{businessCase.companyName}</TableCell>
                <TableCell>{businessCase.vatNumber}</TableCell>
                <TableCell>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    '& .MuiSvgIcon-root': {
                      fontSize: {
                        xs: '1rem',
                        sm: '1.25rem'
                      }
                    }
                  }}>
                    <PersonIcon />
                    {businessCase.contactPerson.firstName} {businessCase.contactPerson.lastName}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 1,
                    '& img': {
                      width: {
                        xs: '16px',
                        sm: '20px'
                      }
                    }
                  }}>
                    <img
                      loading="lazy"
                      src={`https://flagcdn.com/${businessCase.countryCode?.toLowerCase()}.svg`}
                      alt=""
                    />
                    {businessCase.contactPerson.phone}
                  </Box>
                </TableCell>
                <TableCell>{businessCase.contactPerson.email}</TableCell>
                <TableCell>
                  {businessCase.createdBy?.firstName} {businessCase.createdBy?.lastName}
                </TableCell>
                <TableCell>
                  {businessCase.reminderDateTime && (
                    typeof businessCase.reminderDateTime === 'object' && 'toLocaleString' in businessCase.reminderDateTime ?
                    businessCase.reminderDateTime.toLocaleString('sk-SK', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    }).replace(',', '') : ''
                  )}
                </TableCell>
                <TableCell align="right">
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    {businessCase.internalNote && (
                      <Tooltip 
                        title={
                          <Box sx={{ p: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                              Interná poznámka:
                            </Typography>
                            <Typography variant="body2">
                              {businessCase.internalNote}
                            </Typography>
                          </Box>
                        }
                      >
                        <IconButton 
                          sx={{ 
                            color: colors.accent.main,
                            '&:hover': {
                              backgroundColor: 'rgba(255, 159, 67, 0.1)'
                            }
                          }}
                        >
                          <InfoIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                    <Tooltip title="Upraviť">
                      <IconButton 
                        onClick={() => handleEdit(businessCase)}
                        sx={{ 
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Vymazať">
                      <IconButton 
                        onClick={() => handleDelete(businessCase.id!)}
                        sx={{ 
                          color: colors.secondary.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 107, 107, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
                  </Box>
                </TableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditCase(null);
          setFormData({
            companyName: '',
            vatNumber: '',
            companyAddress: '',
            contactPerson: {
              firstName: '',
              lastName: '',
              phone: '',
              email: '',
            },
            internalNote: '',
            status: 'NOT_CALLED',
            reminderDateTime: null,
            reminderNote: '',
            createdBy: null,
            createdAt: null
          });
        }}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle>
            {editCase ? 'Upraviť obchodný prípad' : 'Pridať nový obchodný prípad'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Názov firmy"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="IČ DPH"
                    value={formData.vatNumber}
                    onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Adresa spoločnosti"
                    value={formData.companyAddress}
                    onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Meno"
                    value={formData.contactPerson.firstName}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, firstName: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Priezvisko"
                    value={formData.contactPerson.lastName}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, lastName: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <FormControl sx={{ minWidth: 120 }}>
                      <Select
                        value={selectedCountry.code}
                        onChange={handleCountryChange}
                        sx={{
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: isDarkMode ? '#ffffff' : '#000000',
                          '& .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          },
                          '&:hover .MuiOutlinedInput-notchedOutline': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                          },
                          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                            borderColor: '#ff9f43',
                          },
                          '& .MuiSelect-icon': {
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
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
                      label="Telefónne číslo"
                      value={formData.contactPerson.phone?.replace(selectedCountry.prefix, '') || ''}
                      onChange={(e) => setFormData({
                        ...formData,
                        contactPerson: { ...formData.contactPerson, phone: selectedCountry.prefix + e.target.value }
                      })}
                      placeholder="9XX XXX XXX"
                      helperText="Zadajte telefónne číslo"
                      required
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          color: isDarkMode ? '#ffffff' : '#000000',
                          '& fieldset': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                          },
                          '&:hover fieldset': {
                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                          },
                          '&.Mui-focused fieldset': {
                            borderColor: '#ff9f43',
                          },
                        },
                        '& .MuiInputLabel-root': {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          '&.Mui-focused': {
                            color: '#ff9f43',
                          },
                        },
                        '& .MuiFormHelperText-root': {
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                          fontSize: '0.75rem',
                          marginLeft: 0,
                          marginTop: '4px',
                        }
                      }}
                    />
                  </Box>
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Email"
                    type="email"
                    value={formData.contactPerson.email}
                    onChange={(e) => setFormData({
                      ...formData,
                      contactPerson: { ...formData.contactPerson, email: e.target.value }
                    })}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Interná poznámka"
                    multiline
                    rows={4}
                    value={formData.internalNote}
                    onChange={(e) => setFormData({ ...formData, internalNote: e.target.value })}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      label="Status"
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as keyof typeof caseStatuses })}
                    >
                      {Object.entries(caseStatuses).map(([key, value]) => (
                        <MenuItem key={key} value={key}>
                          {value.label}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={6}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                    <DateTimePicker
                      label="Dátum a čas pripomienky"
                      value={formData.reminderDateTime}
                      onChange={(newValue) => setFormData({ ...formData, reminderDateTime: newValue })}
                      sx={{ width: '100%' }}
                    />
                  </LocalizationProvider>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Poznámka k pripomienke"
                    multiline
                    rows={2}
                    value={formData.reminderNote}
                    onChange={(e) => setFormData({ ...formData, reminderNote: e.target.value })}
                    placeholder="Zadajte text pripomienky, ktorý vám príde emailom"
                    helperText="Tento text vám príde emailom v čase pripomienky"
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => {
                setOpen(false);
                setEditCase(null);
              }}
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              Zrušiť
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              sx={{
                backgroundColor: colors.accent.main,
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: colors.accent.light,
                },
              }}
            >
              {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Uložiť'}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{
          sx: {
            background: 'none',
            boxShadow: 'none',
            margin: {
              xs: '8px',
              sm: '16px'
            }
          }
        }}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <StyledDialogContent isDarkMode={isDarkMode}>
          <DialogTitle>
            Potvrdiť vymazanie
          </DialogTitle>
          <DialogContent>
            <Typography>
              Naozaj chcete vymazať tento obchodný prípad? Táto akcia je nenávratná.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setDeleteDialogOpen(false)}
              sx={{
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                },
              }}
            >
              Zrušiť
            </Button>
            <Button
              onClick={confirmDelete}
              variant="contained"
              sx={{
                backgroundColor: colors.secondary.main,
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: colors.secondary.light,
                },
              }}
            >
              Vymazať
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
} 