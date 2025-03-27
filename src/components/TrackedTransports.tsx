import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  styled,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  IconButton,
  Chip,
  Tooltip,
  InputAdornment,
  Card,
  TableCell,
  TableContainer,
  Table,
  TableHead,
  TableBody,
  TableRow,
  CardContent,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { sk } from 'date-fns/locale';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import NotificationsIcon from '@mui/icons-material/Notifications';
import SearchField from './common/SearchField';
import TransportMap from './common/TransportMap';
import PersonIcon from '@mui/icons-material/Person';
import CloseIcon from '@mui/icons-material/Close';
import { useThemeMode } from '../contexts/ThemeContext';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: '20px',
  background: 'rgba(35, 35, 66, 0.7)',
  backdropFilter: 'blur(10px)',
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  animation: 'fadeIn 0.6s ease-out',
  '@keyframes fadeIn': {
    from: {
      opacity: 0,
      transform: 'translateY(20px)',
    },
    to: {
      opacity: 1,
      transform: 'translateY(0)',
    },
  },
}));

interface Transport {
  id: string;
  orderNumber: string;
  loadingAddress: string;
  loadingDateTime: Date | Timestamp;
  loadingReminder: number;
  unloadingAddress: string;
  unloadingDateTime: Date | Timestamp;
  unloadingReminder: number;
  status: string;
  createdAt: Date | Timestamp;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  isDelayed: boolean;
}

interface TransportFormData {
  orderNumber: string;
  loadingAddress: string;
  loadingDateTime: Date | null;
  loadingReminder: number;
  unloadingAddress: string;
  unloadingDateTime: Date | null;
  unloadingReminder: number;
}

// Importujeme farebnú paletu z Navbar
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
    paddingBottom: '80px', // Priestor pre bottom navigation
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
  backgroundColor: colors.accent.main,
  color: '#ffffff',
  padding: '8px 24px',
  borderRadius: '12px',
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  boxShadow: '0 4px 12px rgba(255, 159, 67, 0.3)',
  '&:hover': {
    backgroundColor: colors.accent.light,
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(255, 159, 67, 0.4)',
  },
  '@media (max-width: 600px)': {
    width: '100%',
    padding: '12px',
    fontSize: '0.9rem'
  }
});

const StyledCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
  transition: 'all 0.3s ease',
  marginBottom: '10px',
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
  '@media (max-width: 600px)': {
    marginBottom: '8px'
  }
}));

const TransportCard = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: '10px',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35, 35, 66, 0.7)' : 'rgba(255, 255, 255, 0.7)',
  backdropFilter: 'blur(10px)',
  borderRadius: '20px',
  border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 12px 40px 0 rgba(0, 0, 0, 0.5)',
  },
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1.5),
    marginBottom: '8px',
  }
}));

const TransportInfo = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '1fr 500px',
  gap: '32px',
  '@media (max-width: 1200px)': {
    gridTemplateColumns: '1fr',
  },
  '@media (max-width: 600px)': {
    gap: '16px'
  }
});

const InfoContainer = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  height: '100%',
  justifyContent: 'space-between',
  '@media (max-width: 600px)': {
    gap: '16px'
  }
});

const CreatorInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: 'rgba(255, 255, 255, 0.5)',
  fontSize: '0.9rem'
});

const MapContainer = styled(Box)({
  width: '100%',
  height: '350px',
  borderRadius: '12px',
  overflow: 'hidden',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'scale(1.02)',
    boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
  }
});

const MapThumbnail = styled(Box)({
  width: '100%',
  height: '100%',
  '& > div': {
    width: '100% !important',
    height: '100% !important',
  }
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

const LocationInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  marginBottom: '8px',
  color: 'rgba(255, 255, 255, 0.7)',
});

const TimeInfo = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  color: 'rgba(255, 255, 255, 0.7)',
  fontSize: '0.9rem',
});

const CardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
});

const OrderNumber = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: colors.accent.main,
});

const StatusChip = styled(Chip)({
  backgroundColor: 'rgba(0, 184, 148, 0.2)',
  color: colors.accent.main,
  fontWeight: 500,
  borderRadius: '8px',
  '&.delayed': {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    color: colors.secondary.main,
  }
});

const SearchWrapper = styled(Box)({
  marginBottom: '24px',
  width: '100%',
  '@media (max-width: 600px)': {
    marginBottom: '16px'
  }
});

const MapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    background: 'rgba(35, 35, 66, 0.7)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
    minWidth: '800px',
    maxWidth: '90vw',
    maxHeight: '80vh',
    margin: '24px'
  }
}));

const MobileTransportCard = styled(Box)({
  backgroundColor: colors.primary.light,
  borderRadius: '16px',
  padding: '16px',
  color: '#ffffff',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  marginBottom: '16px',
  width: '100%'
});

const MobileTransportHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px'
});

const MobileTransportNumber = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: colors.accent.main
});

const MobileTransportStatus = styled(Chip)({
  height: '24px',
  fontSize: '0.75rem'
});

const MobileTransportInfo = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px'
});

const MobileTransportLocation = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: colors.accent.main
  }
});

const MobileTransportTime = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
  color: 'rgba(255, 255, 255, 0.7)',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    color: colors.accent.main
  }
});

const MobileTransportActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '12px'
});

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

function TrackedTransports() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [filteredTransports, setFilteredTransports] = useState<Transport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [transportToDelete, setTransportToDelete] = useState<Transport | null>(null);
  const [formData, setFormData] = useState<TransportFormData>({
    orderNumber: '',
    loadingAddress: '',
    loadingDateTime: null,
    loadingReminder: 60,
    unloadingAddress: '',
    unloadingDateTime: null,
    unloadingReminder: 60,
  });
  const { userData } = useAuth();
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
  const [selectedTransport, setSelectedTransport] = useState<{
    loading: string;
    unloading: string;
  } | null>(null);
  const { isDarkMode } = useThemeMode();

  const handleOpenDialog = (transport?: Transport) => {
    if (transport) {
      setEditingTransport(transport);
      setFormData({
        orderNumber: transport.orderNumber,
        loadingAddress: transport.loadingAddress,
        loadingDateTime: transport.loadingDateTime instanceof Timestamp ? 
          transport.loadingDateTime.toDate() : transport.loadingDateTime,
        loadingReminder: transport.loadingReminder,
        unloadingAddress: transport.unloadingAddress,
        unloadingDateTime: transport.unloadingDateTime instanceof Timestamp ? 
          transport.unloadingDateTime.toDate() : transport.unloadingDateTime,
        unloadingReminder: transport.unloadingReminder,
      });
    } else {
      setEditingTransport(null);
      setFormData({
        orderNumber: '',
        loadingAddress: '',
        loadingDateTime: null,
        loadingReminder: 60,
        unloadingAddress: '',
        unloadingDateTime: null,
        unloadingReminder: 60,
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingTransport(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.orderNumber || !formData.loadingAddress || !formData.loadingDateTime || 
        !formData.unloadingAddress || !formData.unloadingDateTime) {
      setError('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      if (editingTransport) {
        // Aktualizácia existujúcej prepravy
        const transportRef = doc(db, 'transports', editingTransport.id);
        await updateDoc(transportRef, {
          orderNumber: formData.orderNumber,
          loadingAddress: formData.loadingAddress,
          loadingDateTime: formData.loadingDateTime,
          loadingReminder: formData.loadingReminder,
          unloadingAddress: formData.unloadingAddress,
          unloadingDateTime: formData.unloadingDateTime,
          unloadingReminder: formData.unloadingReminder,
          updatedAt: new Date(),
        });

        // Aktualizácia pripomienok
        const remindersQuery = query(
          collection(db, 'reminders'),
          where('transportId', '==', editingTransport.id)
        );
        const remindersSnapshot = await getDocs(remindersQuery);
        
        // Aktualizácia alebo vytvorenie pripomienok
        const loadingReminderTime = new Date(formData.loadingDateTime.getTime() - formData.loadingReminder * 60000);
        const unloadingReminderTime = new Date(formData.unloadingDateTime.getTime() - formData.unloadingReminder * 60000);

        let hasLoadingReminder = false;
        let hasUnloadingReminder = false;

        // Aktualizácia existujúcich pripomienok
        remindersSnapshot.docs.forEach(async (reminderDoc) => {
          const reminderData = reminderDoc.data();
          if (reminderData.type === 'loading') {
            hasLoadingReminder = true;
            await updateDoc(doc(db, 'reminders', reminderDoc.id), {
              reminderDateTime: loadingReminderTime,
              sent: false,
              userEmail: userData?.email || '',
              orderNumber: formData.orderNumber,
              address: formData.loadingAddress,
              reminderNote: `Nakládka na adrese: ${formData.loadingAddress}`
            });
          } else if (reminderData.type === 'unloading') {
            hasUnloadingReminder = true;
            await updateDoc(doc(db, 'reminders', reminderDoc.id), {
              reminderDateTime: unloadingReminderTime,
              sent: false,
              userEmail: userData?.email || '',
              orderNumber: formData.orderNumber,
              address: formData.unloadingAddress,
              reminderNote: `Vykládka na adrese: ${formData.unloadingAddress}`
            });
          }
        });

        // Vytvorenie chýbajúcich pripomienok
        if (!hasLoadingReminder) {
          console.log('Vytváram novú pripomienku pre nakládku:', {
            email: userData?.email,
            time: loadingReminderTime,
            orderNumber: formData.orderNumber
          });
          await addDoc(collection(db, 'reminders'), {
            transportId: editingTransport.id,
            type: 'loading',
            reminderDateTime: loadingReminderTime,
            message: `Pripomienka nakládky pre objednávku ${formData.orderNumber}`,
            sent: false,
            createdAt: new Date(),
            userEmail: userData?.email || '',
            orderNumber: formData.orderNumber,
            address: formData.loadingAddress,
            userId: auth.currentUser?.uid || '',
            reminderNote: `Nakládka na adrese: ${formData.loadingAddress}`
          });
        }

        if (!hasUnloadingReminder) {
          console.log('Vytváram novú pripomienku pre vykládku:', {
            email: userData?.email,
            time: unloadingReminderTime,
            orderNumber: formData.orderNumber
          });
          await addDoc(collection(db, 'reminders'), {
            transportId: editingTransport.id,
            type: 'unloading',
            reminderDateTime: unloadingReminderTime,
            message: `Pripomienka vykládky pre objednávku ${formData.orderNumber}`,
            sent: false,
            createdAt: new Date(),
            userEmail: userData?.email || '',
            orderNumber: formData.orderNumber,
            address: formData.unloadingAddress,
            userId: auth.currentUser?.uid || '',
            reminderNote: `Vykládka na adrese: ${formData.unloadingAddress}`
          });
        }
      } else {
        // Vytvorenie novej prepravy
        const transportDoc = await addDoc(collection(db, 'transports'), {
          orderNumber: formData.orderNumber,
          loadingAddress: formData.loadingAddress,
          loadingDateTime: formData.loadingDateTime,
          loadingReminder: formData.loadingReminder,
          unloadingAddress: formData.unloadingAddress,
          unloadingDateTime: formData.unloadingDateTime,
          unloadingReminder: formData.unloadingReminder,
          status: 'Aktívna',
          createdAt: new Date(),
          createdBy: {
            firstName: userData?.firstName || '',
            lastName: userData?.lastName || '',
          },
          isDelayed: false,
        });

        // Vytvorenie pripomienok pre nakládku a vykládku
        const loadingReminderTime = new Date(formData.loadingDateTime.getTime() - formData.loadingReminder * 60000);
        console.log('Vytváram pripomienku pre nakládku:', {
          email: userData?.email,
          time: loadingReminderTime,
          orderNumber: formData.orderNumber
        });
        await addDoc(collection(db, 'reminders'), {
          transportId: transportDoc.id,
          type: 'loading',
          reminderDateTime: loadingReminderTime,
          message: `Pripomienka nakládky pre objednávku ${formData.orderNumber}`,
          sent: false,
          createdAt: new Date(),
          userEmail: userData?.email || '',
          orderNumber: formData.orderNumber,
          address: formData.loadingAddress,
          userId: auth.currentUser?.uid || '',
          reminderNote: `Nakládka na adrese: ${formData.loadingAddress}`
        });

        const unloadingReminderTime = new Date(formData.unloadingDateTime.getTime() - formData.unloadingReminder * 60000);
        console.log('Vytváram pripomienku pre vykládku:', {
          email: userData?.email,
          time: unloadingReminderTime,
          orderNumber: formData.orderNumber
        });
        await addDoc(collection(db, 'reminders'), {
          transportId: transportDoc.id,
          type: 'unloading',
          reminderDateTime: unloadingReminderTime,
          message: `Pripomienka vykládky pre objednávku ${formData.orderNumber}`,
          sent: false,
          createdAt: new Date(),
          userEmail: userData?.email || '',
          orderNumber: formData.orderNumber,
          address: formData.unloadingAddress,
          userId: auth.currentUser?.uid || '',
          reminderNote: `Vykládka na adrese: ${formData.unloadingAddress}`
        });
      }

      handleCloseDialog();
      fetchTransports();
    } catch (error) {
      console.error('Error saving transport:', error);
      setError('Nastala chyba pri ukladaní prepravy');
    }
  };

  const filterTransports = (query: string) => {
    if (!query.trim()) {
      setFilteredTransports(transports);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = transports.filter((transport) => {
      return (
        transport.orderNumber.toLowerCase().includes(lowerQuery) ||
        transport.loadingAddress.toLowerCase().includes(lowerQuery) ||
        transport.unloadingAddress.toLowerCase().includes(lowerQuery) ||
        (transport.createdBy?.firstName + ' ' + transport.createdBy?.lastName)
          .toLowerCase()
          .includes(lowerQuery)
      );
    });
    setFilteredTransports(filtered);
  };

  useEffect(() => {
    filterTransports(searchQuery);
  }, [transports, searchQuery]);

  const fetchTransports = async () => {
    if (!auth.currentUser) {
      setError('Nie ste prihlásený');
      setLoading(false);
      return;
    }

    try {
      const transportsRef = collection(db, 'transports');
      const q = query(transportsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const transportsData = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          orderNumber: data.orderNumber || '',
          loadingAddress: data.loadingAddress || '',
          loadingDateTime: data.loadingDateTime instanceof Timestamp ? data.loadingDateTime.toDate() : data.loadingDateTime,
          loadingReminder: data.loadingReminder || 60,
          unloadingAddress: data.unloadingAddress || '',
          unloadingDateTime: data.unloadingDateTime instanceof Timestamp ? data.unloadingDateTime.toDate() : data.unloadingDateTime,
          unloadingReminder: data.unloadingReminder || 60,
          status: data.status || 'Aktívna',
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt || new Date(),
          createdBy: {
            firstName: data.createdBy?.firstName || '',
            lastName: data.createdBy?.lastName || ''
          },
          isDelayed: data.isDelayed || false,
        };
      }) as Transport[];

      setTransports(transportsData);
      setFilteredTransports(transportsData);
    } catch (err: any) {
      setError(err.message || 'Nastala chyba pri načítaní preprav');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransports();
  }, []);

  const handleDelete = async (transport: Transport) => {
    setTransportToDelete(transport);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!transportToDelete) return;

    try {
      // Vymazanie prepravy
      await deleteDoc(doc(db, 'transports', transportToDelete.id));

      // Vymazanie súvisiacich pripomienok
      const remindersQuery = query(
        collection(db, 'reminders'),
        where('transportId', '==', transportToDelete.id)
      );
      const remindersSnapshot = await getDocs(remindersQuery);
      
      const deletePromises = remindersSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(deletePromises);

      // Aktualizácia UI
      setTransports(prevTransports => 
        prevTransports.filter(t => t.id !== transportToDelete.id)
      );
      setFilteredTransports(prevTransports => 
        prevTransports.filter(t => t.id !== transportToDelete.id)
      );

      setDeleteDialogOpen(false);
      setTransportToDelete(null);
    } catch (err: any) {
      setError('Nastala chyba pri vymazávaní prepravy: ' + err.message);
    }
  };

  const handleMoreOptions = (id: string) => {
    console.log('More options for transport:', id);
  };

  const handleShowMap = (loading: string, unloading: string) => {
    setSelectedTransport({ loading, unloading });
    setMapDialogOpen(true);
  };

  const renderMobileTransport = (transport: Transport) => (
    <MobileTransportCard key={transport.id}>
      <MobileTransportHeader>
        <MobileTransportNumber>
          {transport.orderNumber}
        </MobileTransportNumber>
        <MobileTransportStatus
          label={transport.status}
          color={transport.isDelayed ? "error" : "success"}
          size="small"
        />
      </MobileTransportHeader>
      
      <MobileTransportInfo>
        <MobileTransportLocation>
          <LocationOnIcon />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Nakládka:</Typography>
            {transport.loadingAddress}
          </Box>
        </MobileTransportLocation>
        
        <MobileTransportTime>
          <AccessTimeIcon />
          {transport.loadingDateTime instanceof Date 
            ? format(transport.loadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })
            : format(transport.loadingDateTime.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk })}
        </MobileTransportTime>

        <MobileTransportLocation>
          <LocationOnIcon />
          <Box>
            <Typography variant="body2" sx={{ fontWeight: 500 }}>Vykládka:</Typography>
            {transport.unloadingAddress}
          </Box>
        </MobileTransportLocation>
        
        <MobileTransportTime>
          <AccessTimeIcon />
          {transport.unloadingDateTime instanceof Date 
            ? format(transport.unloadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })
            : format(transport.unloadingDateTime.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk })}
        </MobileTransportTime>
      </MobileTransportInfo>

      <MobileTransportActions>
        <IconButton 
          size="small"
          onClick={() => handleOpenDialog(transport)}
          sx={{ color: colors.accent.main }}
        >
          <EditIcon fontSize="small" />
        </IconButton>
        <IconButton 
          size="small"
          onClick={() => handleDelete(transport)}
          sx={{ color: colors.secondary.main }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </MobileTransportActions>
    </MobileTransportCard>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress sx={{ color: '#ff9f43' }} />
        </Box>
      </Container>
    );
  }

  return (
    <>
      <PageWrapper>
        <PageHeader>
          <PageTitle isDarkMode={isDarkMode}>Sledované prepravy</PageTitle>
          <AddButton
            startIcon={<AddIcon />}
            onClick={() => handleOpenDialog()}
          >
            Pridať prepravu
          </AddButton>
        </PageHeader>

        <SearchWrapper>
          <SearchField
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            label="Vyhľadať prepravu"
            placeholder="Zadajte číslo objednávky, adresu alebo meno"
          />
        </SearchWrapper>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress sx={{ color: '#ff9f43' }} />
          </Box>
        ) : (
          <Box sx={{ 
            display: 'flex', 
            flexDirection: 'column',
            gap: 2,
            '@media (max-width: 600px)': {
              gap: 1
            }
          }}>
            {filteredTransports.map((transport) => (
              <Box key={transport.id} sx={{ 
                display: { 
                  xs: 'block', // Mobilné zobrazenie
                  sm: 'none'   // Skryté na väčších obrazovkách
                }
              }}>
                {renderMobileTransport(transport)}
              </Box>
            ))}
            <Box sx={{ 
              display: { 
                xs: 'none',    // Skryté na mobilných zariadeniach
                sm: 'block'    // Zobrazené na väčších obrazovkách
              }
            }}>
              {/* Pôvodné zobrazenie pre väčšie obrazovky */}
              {filteredTransports.map((transport) => (
                <StyledCard isDarkMode={isDarkMode}>
                  <CardContent>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      gap: 2
                    }}>
                      <Box sx={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        alignItems: 'center',
                        mb: 2
                      }}>
                        <Typography variant="h6" sx={{ 
                          fontSize: '1.4rem',
                          fontWeight: 600,
                          color: colors.accent.main
                        }}>
                          Objednávka: {transport.orderNumber}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <PersonIcon sx={{ color: colors.accent.main, fontSize: '1.1rem' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Vytvoril: {transport.createdBy?.firstName || ''} {transport.createdBy?.lastName || ''}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AccessTimeIcon sx={{ color: colors.accent.main, fontSize: '1.1rem' }} />
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                              Vytvorené: {format(
                                transport.createdAt instanceof Timestamp ? 
                                  transport.createdAt.toDate() : 
                                  transport.createdAt instanceof Date ? 
                                    transport.createdAt : 
                                    new Date(transport.createdAt),
                                'dd.MM.yyyy HH:mm',
                                { locale: sk }
                              )}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <Chip
                              label={transport.status}
                              color={transport.status === 'Aktívna' ? 'success' : 'default'}
                              size="small"
                              sx={{ 
                                backgroundColor: transport.status === 'Aktívna' ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 255, 255, 0.1)',
                                color: transport.status === 'Aktívna' ? colors.accent.main : '#ffffff',
                                '& .MuiChip-label': {
                                  fontSize: '0.85rem',
                                  fontWeight: 500
                                }
                              }}
                            />
                            {transport.isDelayed && (
                              <Chip
                                label="Meškanie"
                                color="error"
                                size="small"
                                sx={{
                                  '& .MuiChip-label': {
                                    fontSize: '0.85rem',
                                    fontWeight: 500
                                  }
                                }}
                              />
                            )}
                            <Box sx={{ display: 'flex', gap: 1, ml: 2 }}>
                              <IconButton 
                                onClick={() => handleOpenDialog(transport)}
                                sx={{ 
                                  color: colors.accent.main,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 159, 67, 0.1)'
                                  }
                                }}
                              >
                                <Tooltip title="Upraviť">
                                  <EditIcon />
                                </Tooltip>
                              </IconButton>
                              <IconButton 
                                onClick={() => handleDelete(transport)}
                                sx={{ 
                                  color: colors.secondary.main,
                                  '&:hover': {
                                    backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                  }
                                }}
                              >
                                <Tooltip title="Vymazať">
                                  <DeleteIcon />
                                </Tooltip>
                              </IconButton>
                            </Box>
                          </Box>
                        </Box>
                      </Box>

                      <TransportInfo>
                        <InfoContainer>
                          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <Box>
                              <InfoLabel sx={{ mb: 2 }}>Nakládka</InfoLabel>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <LocationOnIcon sx={{ color: colors.accent.main }} />
                                <InfoValue>{transport.loadingAddress}</InfoValue>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <AccessTimeIcon sx={{ color: colors.accent.main }} />
                                <InfoValue>
                                  {format(
                                    transport.loadingDateTime instanceof Timestamp ? 
                                      transport.loadingDateTime.toDate() : 
                                      transport.loadingDateTime,
                                    'dd.MM.yyyy HH:mm',
                                    { locale: sk }
                                  )}
                                </InfoValue>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <NotificationsIcon sx={{ color: colors.accent.main, fontSize: '1.1rem' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  Pripomienka: {transport.loadingReminder} minút pred nakládkou (
                                  {format(
                                    new Date(
                                      (transport.loadingDateTime instanceof Timestamp ? 
                                        transport.loadingDateTime.toDate() : 
                                        transport.loadingDateTime).getTime() - transport.loadingReminder * 60000
                                    ),
                                    'dd.MM.yyyy HH:mm',
                                    { locale: sk }
                                  )})
                                </Typography>
                              </Box>
                            </Box>

                            <Box>
                              <InfoLabel sx={{ mb: 2 }}>Vykládka</InfoLabel>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                <LocationOnIcon sx={{ color: colors.accent.main }} />
                                <InfoValue>{transport.unloadingAddress}</InfoValue>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5 }}>
                                <AccessTimeIcon sx={{ color: colors.accent.main }} />
                                <InfoValue>
                                  {format(
                                    transport.unloadingDateTime instanceof Timestamp ? 
                                      transport.unloadingDateTime.toDate() : 
                                      transport.unloadingDateTime,
                                    'dd.MM.yyyy HH:mm',
                                    { locale: sk }
                                  )}
                                </InfoValue>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                <NotificationsIcon sx={{ color: colors.accent.main, fontSize: '1.1rem' }} />
                                <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                                  Pripomienka: {transport.unloadingReminder} minút pred vykládkou (
                                  {format(
                                    new Date(
                                      (transport.unloadingDateTime instanceof Timestamp ? 
                                        transport.unloadingDateTime.toDate() : 
                                        transport.unloadingDateTime).getTime() - transport.unloadingReminder * 60000
                                    ),
                                    'dd.MM.yyyy HH:mm',
                                    { locale: sk }
                                  )})
                                </Typography>
                              </Box>
                            </Box>
                          </Box>
                        </InfoContainer>

                        <MapContainer onClick={() => handleShowMap(transport.loadingAddress, transport.unloadingAddress)}>
                          <MapThumbnail>
                            <TransportMap
                              origin={transport.loadingAddress}
                              destination={transport.unloadingAddress}
                              isThumbnail={true}
                            />
                          </MapThumbnail>
                        </MapContainer>
                      </TransportInfo>
                    </Box>
                  </CardContent>
                </StyledCard>
              ))}
            </Box>
          </Box>
        )}
      </PageWrapper>

      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
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
            {editingTransport ? 'Upraviť prepravu' : 'Pridať novú prepravu'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Číslo objednávky"
                    value={formData.orderNumber}
                    onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                    required
                  />
                </Grid>

                {/* Nakládka sekcia */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 1, mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Nakládka
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresa nakládky"
                    value={formData.loadingAddress}
                    onChange={(e) => setFormData({ ...formData, loadingAddress: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                    <DateTimePicker
                      label="Dátum a čas nakládky"
                      value={formData.loadingDateTime}
                      onChange={(newValue) => setFormData({ ...formData, loadingDateTime: newValue })}
                      sx={{ width: '100%' }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Pripomienka (minúty)"
                    value={formData.loadingReminder || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 60 : Math.max(1, parseInt(e.target.value) || 1);
                      setFormData({ ...formData, loadingReminder: value });
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">min</InputAdornment>,
                    }}
                  />
                </Grid>

                {/* Vykládka sekcia */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ mt: 2, mb: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                    Vykládka
                  </Typography>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Adresa vykládky"
                    value={formData.unloadingAddress}
                    onChange={(e) => setFormData({ ...formData, unloadingAddress: e.target.value })}
                    required
                  />
                </Grid>

                <Grid item xs={12} md={8}>
                  <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                    <DateTimePicker
                      label="Dátum a čas vykládky"
                      value={formData.unloadingDateTime}
                      onChange={(newValue) => setFormData({ ...formData, unloadingDateTime: newValue })}
                      sx={{ width: '100%' }}
                    />
                  </LocalizationProvider>
                </Grid>

                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    type="number"
                    label="Pripomienka (minúty)"
                    value={formData.unloadingReminder || ''}
                    onChange={(e) => {
                      const value = e.target.value === '' ? 60 : Math.max(1, parseInt(e.target.value) || 1);
                      setFormData({ ...formData, unloadingReminder: value });
                    }}
                    InputProps={{
                      endAdornment: <InputAdornment position="end">min</InputAdornment>,
                    }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={handleCloseDialog}
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
              {editingTransport ? 'Uložiť zmeny' : 'Pridať prepravu'}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      <MapDialog
        open={mapDialogOpen}
        onClose={() => {
          setMapDialogOpen(false);
          setSelectedTransport(null);
        }}
        maxWidth={false}
      >
        <DialogTitle sx={{ 
          color: '#ffffff',
          padding: '24px',
          fontSize: '1.5rem',
          fontWeight: 600,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          Trasa prepravy
          <IconButton
            onClick={() => {
              setMapDialogOpen(false);
              setSelectedTransport(null);
            }}
            sx={{
              color: 'rgba(255, 255, 255, 0.7)',
              '&:hover': {
                color: '#ffffff',
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ padding: '24px', minHeight: '600px' }}>
          {selectedTransport && (
            <Box sx={{ height: '100%' }}>
              <Box sx={{ mb: 2 }}>
                <Typography sx={{ color: '#ffffff', mb: 1 }}>
                  <strong>Nakládka:</strong> {selectedTransport.loading}
                </Typography>
                <Typography sx={{ color: '#ffffff' }}>
                  <strong>Vykládka:</strong> {selectedTransport.unloading}
                </Typography>
              </Box>
              <Box sx={{ height: 'calc(100% - 80px)', minHeight: '500px' }}>
                <TransportMap
                  origin={selectedTransport.loading}
                  destination={selectedTransport.unloading}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ 
          padding: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Button 
            onClick={() => {
              setMapDialogOpen(false);
              setSelectedTransport(null);
            }}
            sx={{ color: 'rgba(255, 255, 255, 0.7)' }}
          >
            Zavrieť
          </Button>
        </DialogActions>
      </MapDialog>

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
              Naozaj chcete vymazať túto prepravu? Táto akcia je nenávratná.
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
              onClick={handleConfirmDelete}
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
    </>
  );
}

export default TrackedTransports; 