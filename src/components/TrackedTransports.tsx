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
  CardActions,
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
  margin: theme.spacing(2, 0),
  width: '100%',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.35)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
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
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.3)',
    border: '1px solid rgba(255, 159, 67, 0.3)',
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

const TransportCard = styled(Box)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
  marginBottom: '16px',
  width: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 24px rgba(255, 159, 67, 0.3)',
    border: '1px solid rgba(255, 159, 67, 0.3)',
    '& .MuiCardContent-root': {
      background: 'linear-gradient(180deg, rgba(255, 159, 67, 0.1) 0%, rgba(255, 159, 67, 0) 100%)',
    }
  }
}));

const TransportInfo = styled(Box)({
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
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

const CreatorInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  }
}));

const MapContainer = styled(Box)({
  width: '50%',
  height: '600px',
  borderRadius: '12px',
  overflow: 'hidden',
  marginTop: '24px',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
});

const MapThumbnail = styled(Box)({
  width: '100%',
  height: '100%',
  '& > div': {
    width: '100% !important',
    height: '100% !important',
  }
});

const InfoSection = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  padding: '12px',
  backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
  borderRadius: '12px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
}));

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

const LocationInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '24px',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
  '& .location-section': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '12px',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  },
  '& .location-header': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    fontWeight: 600,
    fontSize: '1.1rem',
    color: isDarkMode ? '#ffffff' : '#000000',
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
      color: colors.accent.main
    }
  },
  '& .location-address': {
    marginLeft: '32px',
    fontSize: '1rem',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  }
}));

const TimeInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '32px',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
  '& .section': {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
    padding: '20px',
    backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
    borderRadius: '12px',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`,
  },
  '& .section-title': {
    fontWeight: 600,
    color: isDarkMode ? '#ffffff' : '#000000',
    fontSize: '1.1rem',
    marginBottom: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    '& .MuiSvgIcon-root': {
      fontSize: '1.2rem',
      color: colors.accent.main
    }
  },
  '& .time-row': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '24px',
    fontSize: '1rem',
    '& .MuiSvgIcon-root': {
      fontSize: '1.1rem',
      color: colors.accent.main
    }
  },
  '& .reminder-info': {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
    marginLeft: '24px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    fontSize: '0.9rem',
    '& .MuiSvgIcon-root': {
      fontSize: '0.9rem',
      color: colors.accent.light
    }
  }
}));

const CardHeader = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  width: '100%',
  color: isDarkMode ? '#ffffff' : '#000000',
}));

const OrderNumber = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: isDarkMode ? '#ffffff' : '#000000',
}));

const StatusChip = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  padding: '4px 12px',
  borderRadius: '12px',
  fontSize: '0.85rem',
  fontWeight: 500,
  backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.1)',
  color: '#ff9f43',
  display: 'flex',
  alignItems: 'center',
  gap: '6px',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem'
  }
}));

const SearchWrapper = styled(Box)({
  marginBottom: '24px',
  width: '100%',
  '@media (max-width: 600px)': {
    marginBottom: '16px'
  }
});

const MapDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
    margin: 0,
    maxWidth: '100%',
    width: '100%',
    height: '100%',
    borderRadius: 0,
    display: 'flex',
    flexDirection: 'column',
    position: 'relative',
    overflow: 'hidden',
    '& .MuiDialogTitle-root': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      padding: '24px',
      fontSize: '1.5rem',
      fontWeight: 600,
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      borderBottom: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    },
    '& .MuiDialogContent-root': {
      padding: '24px',
      minHeight: '600px',
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
    },
    '& .MuiDialogActions-root': {
      padding: '24px',
      borderTop: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
    }
  },
  '& .MuiBackdrop-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(0, 0, 0, 0.7)' 
      : 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'blur(4px)',
  }
}));

const MobileTransportCard = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
  marginBottom: '16px',
  width: '100%'
}));

const MobileTransportHeader = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  color: isDarkMode ? '#ffffff' : '#000000'
}));

const MobileTransportTitle = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  justifyContent: 'center',
  alignItems: 'center',
});

const MobileTransportNumber = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: isDarkMode ? colors.accent.main : '#000000'
}));

const MobileTransportStatus = styled(Chip)({
  height: '24px',
  fontSize: '0.75rem'
});

const MobileTransportInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: isDarkMode ? '#ffffff' : '#000000'
}));

const MobileTransportLocation = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  color: isDarkMode ? '#ffffff' : '#000000',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: colors.accent.main
  }
}));

const MobileTransportTime = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  fontSize: '0.85rem',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  '& .time-label': {
    fontWeight: 600,
    color: isDarkMode ? '#ffffff' : '#000000',
    marginBottom: '4px'
  },
  '& .time-row': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginLeft: '24px',
    '& .MuiSvgIcon-root': {
      fontSize: '1rem',
      color: colors.accent.main
    }
  },
  '& .reminder-info': {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    marginLeft: '24px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
    fontSize: '0.8rem',
    '& .MuiSvgIcon-root': {
      fontSize: '0.9rem',
      color: colors.accent.light
    }
  }
}));

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

const ActionButton = styled(Button)(({ theme }) => ({
  '&:hover': {
    backgroundColor: 'rgba(255, 159, 67, 0.1)',
  },
}));

function TrackedTransports() {
  const { userData } = useAuth();
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  const [editingTransport, setEditingTransport] = useState<Transport | null>(null);
  const [formData, setFormData] = useState<TransportFormData>({
    orderNumber: '',
    loadingAddress: '',
    loadingDateTime: null,
    loadingReminder: 60,
    unloadingAddress: '',
    unloadingDateTime: null,
    unloadingReminder: 60,
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' | 'warning' | 'info' });
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [transportToDelete, setTransportToDelete] = useState<Transport | null>(null);
  const [mapTransport, setMapTransport] = useState<Transport | null>(null);
  const [mapDialogOpen, setMapDialogOpen] = useState(false);
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

  const handleSaveTransport = async () => {
    // Pridáme funkciu pre logovanie
    const logToStorage = (message: string, data?: any) => {
      const logs = JSON.parse(localStorage.getItem('transportLogs') || '[]');
      logs.push({
        timestamp: new Date().toISOString(),
        message,
        data
      });
      localStorage.setItem('transportLogs', JSON.stringify(logs));
      console.log(message, data);
    };

    if (!formData.loadingDateTime || !formData.unloadingDateTime) {
      logToStorage("Uloženie zrušené: Chýba dátum/čas nakládky alebo vykládky.", formData);
      setSnackbar({ open: true, message: 'Dátumy a časy nakládky a vykládky sú povinné.', severity: 'error' });
      return;
    }
    logToStorage("Spúšťam handleSaveTransport...", { editingTransport, formData });

    try {
      setLoading(true);
      if (editingTransport) {
        logToStorage(`Aktualizujem prepravu s ID: ${editingTransport.id}`);
        const transportRef = doc(db, 'transports', editingTransport.id);
        await updateDoc(transportRef, {
          ...formData,
          loadingDateTime: formData.loadingDateTime,
          unloadingDateTime: formData.unloadingDateTime,
          loadingReminder: formData.loadingReminder,
          unloadingReminder: formData.unloadingReminder,
          updatedAt: new Date(),
        });
        logToStorage("Dokument prepravy aktualizovaný.");

        // Odstránenie existujúcich pripomienok
        logToStorage("Mažem existujúce pripomienky pre prepravu:", editingTransport.id);
        const remindersQuery = query(
          collection(db, 'reminders'),
          where('transportId', '==', editingTransport.id)
        );
        const remindersSnapshot = await getDocs(remindersQuery);
        logToStorage(`Nájdených ${remindersSnapshot.docs.length} existujúcich pripomienok na vymazanie.`);
        const deletePromises = remindersSnapshot.docs.map(async (reminderDoc) => {
          logToStorage(`Mažem pripomienku s ID: ${reminderDoc.id}`);
          await deleteDoc(doc(db, 'reminders', reminderDoc.id));
        });
        await Promise.all(deletePromises);
        logToStorage("Existujúce pripomienky vymazané.");

        // Vytvorenie nových pripomienok
        logToStorage("Vytváram nové pripomienky s dátami:", {
          loadingDateTime: formData.loadingDateTime,
          unloadingDateTime: formData.unloadingDateTime,
          loadingReminder: formData.loadingReminder,
          unloadingReminder: formData.unloadingReminder
        });

        const loadingReminderTime = new Date(formData.loadingDateTime.getTime() - formData.loadingReminder * 60000);
        const unloadingReminderTime = new Date(formData.unloadingDateTime.getTime() - formData.unloadingReminder * 60000);
        logToStorage("Vypočítané časy pripomienok:", { 
          loadingReminderTime: loadingReminderTime.toISOString(), 
          unloadingReminderTime: unloadingReminderTime.toISOString() 
        });

        const loadingReminderData = {
          transportId: editingTransport.id,
          type: 'loading',
          reminderDateTime: Timestamp.fromDate(loadingReminderTime),
          status: 'scheduled',
          createdAt: Timestamp.fromDate(new Date()),
          userEmail: userData?.email || '',
          transportDetails: {
            loadingAddress: formData.loadingAddress,
            loadingDateTime: Timestamp.fromDate(formData.loadingDateTime),
            unloadingAddress: formData.unloadingAddress,
            unloadingDateTime: Timestamp.fromDate(formData.unloadingDateTime),
            orderNumber: formData.orderNumber
          },
          orderNumber: formData.orderNumber,
          reminderNote: `Nakládka na adrese: ${formData.loadingAddress}`,
          sent: false
        };
        logToStorage("Pokus o pridanie pripomienky nakládky (update):", loadingReminderData);
        if (!loadingReminderTime || isNaN(loadingReminderTime.getTime())) {
            logToStorage("Neplatný loadingReminderTime!");
        } else {
            const loadingReminderRef = await addDoc(collection(db, 'reminders'), loadingReminderData);
            logToStorage("Pripomienka nakládky vytvorená s ID:", loadingReminderRef.id);
        }

        const unloadingReminderData = {
          transportId: editingTransport.id,
          type: 'unloading',
          reminderDateTime: Timestamp.fromDate(unloadingReminderTime),
          status: 'scheduled',
          createdAt: Timestamp.fromDate(new Date()),
          userEmail: userData?.email || '',
          transportDetails: {
            loadingAddress: formData.loadingAddress,
            loadingDateTime: Timestamp.fromDate(formData.loadingDateTime),
            unloadingAddress: formData.unloadingAddress,
            unloadingDateTime: Timestamp.fromDate(formData.unloadingDateTime),
            orderNumber: formData.orderNumber
          },
          orderNumber: formData.orderNumber,
          reminderNote: `Vykládka na adrese: ${formData.unloadingAddress}`,
          sent: false
        };
        logToStorage("Pokus o pridanie pripomienky vykládky (update):", unloadingReminderData);
        if (!unloadingReminderTime || isNaN(unloadingReminderTime.getTime())) {
            logToStorage("Neplatný unloadingReminderTime!");
        } else {
            const unloadingReminderRef = await addDoc(collection(db, 'reminders'), unloadingReminderData);
            logToStorage("Pripomienka vykládky vytvorená s ID:", unloadingReminderRef.id);
        }

        setSnackbar({ open: true, message: 'Preprava úspešne aktualizovaná', severity: 'success' });
      } else {
        // Pridanie novej prepravy
        logToStorage("Pridávam novú prepravu...");
        const docRef = await addDoc(collection(db, 'transports'), {
          ...formData,
          status: 'scheduled',
          createdAt: new Date(),
          createdBy: userData?.uid || '',
          companyID: userData?.companyID || '',
          loadingReminder: formData.loadingReminder,
          unloadingReminder: formData.unloadingReminder,
        });
        logToStorage(`Nová preprava pridaná s ID: ${docRef.id}`);

        // Vytvorenie pripomienok pre novú prepravu
        logToStorage("Vytváram pripomienky pre novú prepravu s dátami:", {
          loadingDateTime: formData.loadingDateTime,
          unloadingDateTime: formData.unloadingDateTime,
          loadingReminder: formData.loadingReminder,
          unloadingReminder: formData.unloadingReminder
        });

        const loadingReminderTime = new Date(formData.loadingDateTime.getTime() - formData.loadingReminder * 60000);
        const unloadingReminderTime = new Date(formData.unloadingDateTime.getTime() - formData.unloadingReminder * 60000);
        logToStorage("Vypočítané časy pripomienok pre novú prepravu:", { 
          loadingReminderTime: loadingReminderTime.toISOString(), 
          unloadingReminderTime: unloadingReminderTime.toISOString() 
        });

        const newLoadingReminderData = {
          transportId: docRef.id,
          type: 'loading',
          reminderDateTime: Timestamp.fromDate(loadingReminderTime),
          status: 'scheduled',
          createdAt: Timestamp.fromDate(new Date()),
          userEmail: userData?.email || '',
          transportDetails: {
            loadingAddress: formData.loadingAddress,
            loadingDateTime: Timestamp.fromDate(formData.loadingDateTime),
            unloadingAddress: formData.unloadingAddress,
            unloadingDateTime: Timestamp.fromDate(formData.unloadingDateTime),
            orderNumber: formData.orderNumber
          },
          orderNumber: formData.orderNumber,
          reminderNote: `Nakládka na adrese: ${formData.loadingAddress}`,
          sent: false
        };
        logToStorage("Pokus o pridanie pripomienky nakládky (nová):", newLoadingReminderData);
        if (!loadingReminderTime || isNaN(loadingReminderTime.getTime())) {
            logToStorage("Neplatný loadingReminderTime! (nová)");
        } else {
            const loadingReminderRef = await addDoc(collection(db, 'reminders'), newLoadingReminderData);
            logToStorage("Pripomienka nakládky vytvorená s ID:", loadingReminderRef.id);
        }

        const newUnloadingReminderData = {
          transportId: docRef.id,
          type: 'unloading',
          reminderDateTime: Timestamp.fromDate(unloadingReminderTime),
          status: 'scheduled',
          createdAt: Timestamp.fromDate(new Date()),
          userEmail: userData?.email || '',
          transportDetails: {
            loadingAddress: formData.loadingAddress,
            loadingDateTime: Timestamp.fromDate(formData.loadingDateTime),
            unloadingAddress: formData.unloadingAddress,
            unloadingDateTime: Timestamp.fromDate(formData.unloadingDateTime),
            orderNumber: formData.orderNumber
          },
          orderNumber: formData.orderNumber,
          reminderNote: `Vykládka na adrese: ${formData.unloadingAddress}`,
          sent: false
        };
        logToStorage("Pokus o pridanie pripomienky vykládky (nová):", newUnloadingReminderData);
        if (!unloadingReminderTime || isNaN(unloadingReminderTime.getTime())) {
            logToStorage("Neplatný unloadingReminderTime! (nová)");
        } else {
            const unloadingReminderRef = await addDoc(collection(db, 'reminders'), newUnloadingReminderData);
            logToStorage("Pripomienka vykládky vytvorená s ID:", unloadingReminderRef.id);
        }

        setSnackbar({ open: true, message: 'Nová preprava pridaná', severity: 'success' });
      }
      handleCloseDialog();
      fetchTransports();
    } catch (error) {
      logToStorage('Chyba pri ukladaní prepravy:', error);
      setSnackbar({ open: true, message: 'Nastala chyba pri ukladaní', severity: 'error' });
    } finally {
      setLoading(false);
      logToStorage("Dokončené handleSaveTransport.");
    }
  };

  const filterTransports = (query: string) => {
    if (!query.trim()) {
      setTransports(transports);
      return;
    }

    const lowerQuery = query.toLowerCase().trim();
    const filtered = transports.filter((transport: Transport) => {
      return (
        transport.orderNumber.toLowerCase().includes(lowerQuery) ||
        transport.loadingAddress.toLowerCase().includes(lowerQuery) ||
        transport.unloadingAddress.toLowerCase().includes(lowerQuery) ||
        (transport.createdBy?.firstName + ' ' + transport.createdBy?.lastName)
          .toLowerCase()
          .includes(lowerQuery)
      );
    });
    setTransports(filtered);
  };

  useEffect(() => {
    filterTransports(searchTerm);
  }, [transports, searchTerm]);

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
    setDeleteConfirmOpen(true);
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
      setTransports((prevTransports: Transport[]) => 
        prevTransports.filter((t: Transport) => t.id !== transportToDelete.id)
      );

      setDeleteConfirmOpen(false);
      setTransportToDelete(null);
    } catch (err: any) {
      setError('Nastala chyba pri vymazávaní prepravy: ' + err.message);
    }
  };

  const handleMoreOptions = (id: string) => {
    console.log('More options for transport:', id);
  };

  const handleShowMap = (transport: Transport) => {
    setMapTransport(transport);
    setMapDialogOpen(true);
  };

  const renderMobileTransport = (transport: Transport) => (
    <MobileTransportCard isDarkMode={isDarkMode}>
      <MobileTransportHeader isDarkMode={isDarkMode}>
        <MobileTransportTitle>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {transport.orderNumber ? `Objednávka: ${transport.orderNumber}` : 'Bez čísla objednávky'}
          </Typography>
        </MobileTransportTitle>
        <MobileTransportStatus
          label={transport.status}
          color={transport.isDelayed ? "error" : "success"}
          size="small"
        />
      </MobileTransportHeader>
      
      <MobileTransportInfo isDarkMode={isDarkMode}>
        <Box>
          <MobileTransportLocation isDarkMode={isDarkMode}>
            <LocationOnIcon />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000' }}>
                Nakládka:
              </Typography>
              {transport.loadingAddress}
            </Box>
          </MobileTransportLocation>
          
          <MobileTransportTime isDarkMode={isDarkMode}>
            <div className="time-label">Nakládka:</div>
            <div className="time-row">
              <AccessTimeIcon />
              {transport.loadingDateTime instanceof Date 
                ? format(transport.loadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })
                : format(transport.loadingDateTime.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk })}
            </div>
            <div className="reminder-info">
              <NotificationsIcon />
              {transport.loadingReminder} minút pred nakládkou
              <br />
              (pripomienka o {
                transport.loadingDateTime instanceof Date 
                  ? format(new Date(transport.loadingDateTime.getTime() - transport.loadingReminder * 60000), 'HH:mm', { locale: sk })
                  : format(new Date(transport.loadingDateTime.toDate().getTime() - transport.loadingReminder * 60000), 'HH:mm', { locale: sk })
              })
            </div>
          </MobileTransportTime>
        </Box>

        <Box sx={{ mt: 2 }}>
          <MobileTransportLocation isDarkMode={isDarkMode}>
            <LocationOnIcon />
            <Box>
              <Typography variant="body2" sx={{ fontWeight: 600, color: isDarkMode ? '#ffffff' : '#000000' }}>
                Vykládka:
              </Typography>
              {transport.unloadingAddress}
            </Box>
          </MobileTransportLocation>
          
          <MobileTransportTime isDarkMode={isDarkMode}>
            <div className="time-label">Vykládka:</div>
            <div className="time-row">
              <AccessTimeIcon />
              {transport.unloadingDateTime instanceof Date 
                ? format(transport.unloadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })
                : format(transport.unloadingDateTime.toDate(), 'dd.MM.yyyy HH:mm', { locale: sk })}
            </div>
            <div className="reminder-info">
              <NotificationsIcon />
              {transport.unloadingReminder} minút pred vykládkou
              <br />
              (pripomienka o {
                transport.unloadingDateTime instanceof Date 
                  ? format(new Date(transport.unloadingDateTime.getTime() - transport.unloadingReminder * 60000), 'HH:mm', { locale: sk })
                  : format(new Date(transport.unloadingDateTime.toDate().getTime() - transport.unloadingReminder * 60000), 'HH:mm', { locale: sk })
              })
            </div>
          </MobileTransportTime>
        </Box>
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

  const renderMobileView = () => (
    <Box>
      {transports.map((transport) => (
        <TransportCard key={transport.id} isDarkMode={isDarkMode}>
          <CardHeader isDarkMode={isDarkMode}>
            <OrderNumber isDarkMode={isDarkMode}>
              {transport.orderNumber ? `Objednávka: ${transport.orderNumber}` : 'Bez čísla objednávky'}
            </OrderNumber>
            <StatusChip isDarkMode={isDarkMode}>
              {transport.status}
            </StatusChip>
          </CardHeader>

          <Box sx={{ display: 'flex', flexDirection: 'row', gap: 3 }}>
            <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Box sx={{ 
                padding: '20px',
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-16px',
                  left: '5%',
                  width: '90%',
                  height: '1px',
                  backgroundColor: colors.accent.main,
                  borderRadius: '1px'
                }
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  mb: 2,
                  color: isDarkMode ? '#ffffff' : '#000000',
                  '& .MuiSvgIcon-root': { color: colors.accent.main }
                }}>
                  <LocationOnIcon />
                  Nakládka
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    '& .MuiSvgIcon-root': { color: colors.accent.main }
                  }}>
                    <LocationOnIcon />
                    {transport.loadingAddress}
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    '& .MuiSvgIcon-root': { color: colors.accent.main }
                  }}>
                    <AccessTimeIcon />
                    {format(transport.loadingDateTime instanceof Timestamp ? transport.loadingDateTime.toDate() : transport.loadingDateTime, 'dd.MM.yyyy HH:mm')}
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    fontSize: '0.9rem',
                    '& .MuiSvgIcon-root': { color: colors.accent.light }
                  }}>
                    <NotificationsIcon />
                    Pripomienka {transport.loadingReminder} minút pred nakládkou
                    ({format(new Date((transport.loadingDateTime instanceof Timestamp ? transport.loadingDateTime.toDate() : transport.loadingDateTime).getTime() - transport.loadingReminder * 60000), 'dd.MM.yyyy HH:mm')})
                  </Box>
                </Box>
              </Box>

              <Box sx={{ 
                padding: '20px',
                marginTop: '16px'
              }}>
                <Typography variant="h6" sx={{ 
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  mb: 2,
                  color: isDarkMode ? '#ffffff' : '#000000',
                  '& .MuiSvgIcon-root': { color: colors.accent.main }
                }}>
                  <LocationOnIcon />
                  Vykládka
                </Typography>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, ml: 2 }}>
                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    '& .MuiSvgIcon-root': { color: colors.accent.main }
                  }}>
                    <LocationOnIcon />
                    {transport.unloadingAddress}
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)',
                    '& .MuiSvgIcon-root': { color: colors.accent.main }
                  }}>
                    <AccessTimeIcon />
                    {format(transport.unloadingDateTime instanceof Timestamp ? transport.unloadingDateTime.toDate() : transport.unloadingDateTime, 'dd.MM.yyyy HH:mm')}
                  </Box>

                  <Box sx={{ 
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    fontSize: '0.9rem',
                    '& .MuiSvgIcon-root': { color: colors.accent.light }
                  }}>
                    <NotificationsIcon />
                    Pripomienka {transport.unloadingReminder} minút pred vykládkou
                    ({format(new Date((transport.unloadingDateTime instanceof Timestamp ? transport.unloadingDateTime.toDate() : transport.unloadingDateTime).getTime() - transport.unloadingReminder * 60000), 'dd.MM.yyyy HH:mm')})
                  </Box>
                </Box>
              </Box>
            </Box>

            <Box sx={{ 
              width: '50%',
              height: '100%',
              borderRadius: '12px',
              overflow: 'hidden',
              cursor: 'pointer',
              border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
              '&:hover': {
                border: `1px solid ${colors.accent.main}`,
                transform: 'scale(1.02)',
                transition: 'all 0.2s ease-in-out'
              }
            }} onClick={() => handleShowMap(transport)}>
              <TransportMap
                origin={transport.loadingAddress}
                destination={transport.unloadingAddress}
                isThumbnail={true}
              />
            </Box>
          </Box>

          <CardActions sx={{ 
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2,
            pt: 2,
            borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}` 
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '8px',
              color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
              fontSize: '0.9rem'
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <PersonIcon sx={{ fontSize: '1rem' }} />
                Vytvoril: {transport.createdBy?.firstName} {transport.createdBy?.lastName}
              </Box>
              <Box component="span" sx={{ mx: 1 }}>•</Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <AccessTimeIcon sx={{ fontSize: '1rem' }} />
                Uverejnené: {format(transport.createdAt instanceof Timestamp ? transport.createdAt.toDate() : transport.createdAt, 'dd.MM.yyyy HH:mm')}
              </Box>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
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
              <IconButton 
                size="small"
                onClick={() => handleShowMap(transport)}
                sx={{ color: colors.accent.main }}
              >
                <LocationOnIcon fontSize="small" />
              </IconButton>
            </Box>
          </CardActions>
        </TransportCard>
      ))}
    </Box>
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
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
            {transports.map((transport) => (
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
              {renderMobileView()}
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
              onClick={handleSaveTransport}
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
          setMapTransport(null);
        }}
        maxWidth={false}
        BackdropProps={{
          sx: {
            backdropFilter: 'blur(10px)',
            backgroundColor: 'rgba(0, 0, 0, 0.8)'
          }
        }}
      >
        <DialogTitle>
          Trasa prepravy
          <IconButton
            onClick={() => {
              setMapDialogOpen(false);
              setMapTransport(null);
            }}
            sx={{
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
              '&:hover': {
                color: isDarkMode ? '#ffffff' : '#000000',
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
              }
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          {mapTransport && (
            <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ mb: 3, display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1,
                  p: 2,
                  backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
                }}>
                  <Typography sx={{ 
                    color: isDarkMode ? '#ffffff' : '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600
                  }}>
                    <LocationOnIcon sx={{ color: colors.accent.main }} />
                    Nakládka
                  </Typography>
                  <Typography sx={{ color: isDarkMode ? '#ffffff' : '#000000', ml: 4 }}>
                    {mapTransport.loadingAddress}
                  </Typography>
                  <Typography sx={{ 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    ml: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.9rem'
                  }}>
                    <AccessTimeIcon sx={{ fontSize: '1rem', color: colors.accent.main }} />
                    {format(mapTransport.loadingDateTime instanceof Timestamp ? 
                      mapTransport.loadingDateTime.toDate() : 
                      mapTransport.loadingDateTime, 
                      'dd.MM.yyyy HH:mm'
                    )}
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  flexDirection: 'column', 
                  gap: 1,
                  p: 2,
                  backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
                  borderRadius: '12px',
                  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)'}`
                }}>
                  <Typography sx={{ 
                    color: isDarkMode ? '#ffffff' : '#000000',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontWeight: 600
                  }}>
                    <LocationOnIcon sx={{ color: colors.accent.main }} />
                    Vykládka
                  </Typography>
                  <Typography sx={{ color: isDarkMode ? '#ffffff' : '#000000', ml: 4 }}>
                    {mapTransport.unloadingAddress}
                  </Typography>
                  <Typography sx={{ 
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                    ml: 4,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1,
                    fontSize: '0.9rem'
                  }}>
                    <AccessTimeIcon sx={{ fontSize: '1rem', color: colors.accent.main }} />
                    {format(mapTransport.unloadingDateTime instanceof Timestamp ? 
                      mapTransport.unloadingDateTime.toDate() : 
                      mapTransport.unloadingDateTime, 
                      'dd.MM.yyyy HH:mm'
                    )}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ 
                flex: 1, 
                minHeight: '500px',
                borderRadius: '12px',
                overflow: 'hidden'
              }}>
                <TransportMap
                  origin={mapTransport.loadingAddress}
                  destination={mapTransport.unloadingAddress}
                />
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setMapDialogOpen(false);
              setMapTransport(null);
            }}
            sx={{ color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)' }}
          >
            Zavrieť
          </Button>
        </DialogActions>
      </MapDialog>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
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
              onClick={() => setDeleteConfirmOpen(false)}
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