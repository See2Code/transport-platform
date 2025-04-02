import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
  Tooltip,
  DialogContentText,
  Grid,
  Card,
  Avatar,
  styled,
  useMediaQuery,
  useTheme,
  Snackbar
} from '@mui/material';
import { 
  Add as AddIcon, 
  Mail as MailIcon, 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon,
  Refresh as RefreshIcon,
  Phone as PhoneIcon,
  AccessTime as AccessTimeIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db, functions } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { SelectChangeEvent } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeMode } from '../contexts/ThemeContext';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

interface Country {
  code: string;
  name: string;
  prefix: string;
}

const countries: Country[] = [
  { code: 'sk', name: 'Slovensko', prefix: '+421' },
  { code: 'cz', name: 'Česko', prefix: '+420' },
  { code: 'hu', name: 'Maďarsko', prefix: '+36' },
  { code: 'pl', name: 'Poľsko', prefix: '+48' },
  { code: 'at', name: 'Rakúsko', prefix: '+43' },
  { code: 'de', name: 'Nemecko', prefix: '+49' },
  { code: 'fr', name: 'Francúzsko', prefix: '+33' },
  { code: 'it', name: 'Taliansko', prefix: '+39' },
  { code: 'es', name: 'Španielsko', prefix: '+34' },
  { code: 'pt', name: 'Portugalsko', prefix: '+351' },
  { code: 'nl', name: 'Holandsko', prefix: '+31' },
  { code: 'be', name: 'Belgicko', prefix: '+32' },
  { code: 'dk', name: 'Dánsko', prefix: '+45' },
  { code: 'se', name: 'Švédsko', prefix: '+46' },
  { code: 'fi', name: 'Fínsko', prefix: '+358' },
  { code: 'ie', name: 'Írsko', prefix: '+353' },
  { code: 'gr', name: 'Grécko', prefix: '+30' },
  { code: 'ro', name: 'Rumunsko', prefix: '+40' },
  { code: 'bg', name: 'Bulharsko', prefix: '+359' },
  { code: 'hr', name: 'Chorvátsko', prefix: '+385' },
  { code: 'si', name: 'Slovinsko', prefix: '+386' },
  { code: 'ee', name: 'Estónsko', prefix: '+372' },
  { code: 'lv', name: 'Lotyšsko', prefix: '+371' },
  { code: 'lt', name: 'Litva', prefix: '+370' },
  { code: 'cy', name: 'Cyprus', prefix: '+357' },
  { code: 'mt', name: 'Malta', prefix: '+356' },
  { code: 'lu', name: 'Luxembursko', prefix: '+352' },
  { code: 'gb', name: 'Veľká Británia', prefix: '+44' },
  { code: 'ch', name: 'Švajčiarsko', prefix: '+41' },
  { code: 'no', name: 'Nórsko', prefix: '+47' },
  { code: 'ua', name: 'Ukrajina', prefix: '+380' },
  { code: 'rs', name: 'Srbsko', prefix: '+381' },
  { code: 'tr', name: 'Turecko', prefix: '+90' }
];

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  createdAt: Date;
  userId: string;
  lastLogin: Timestamp | null;
}

interface Invitation {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  userId?: string;
}

type DeleteableItem = TeamMember | Invitation;

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

const AddButton = styled('button')({
  backgroundColor: colors.accent.main,
  color: '#ffffff',
  padding: '12px 28px',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: `0 4px 12px ${colors.accent.main}4D`,
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  position: 'relative',
  overflow: 'hidden',
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'linear-gradient(120deg, transparent, rgba(255, 255, 255, 0.3), transparent)',
    transform: 'translateX(-100%)',
  },
  '&:hover': {
    backgroundColor: colors.accent.light,
    transform: 'translateY(-2px)',
    boxShadow: `0 6px 16px ${colors.accent.main}66`,
    '&:before': {
      transform: 'translateX(100%)',
      transition: 'transform 0.8s',
    }
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

const TeamCard = styled(Card)({
  backgroundColor: colors.background.main,
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
  },
  '@media (max-width: 600px)': {
    padding: '16px',
  }
});

const TeamInfo = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: '24px',
  marginBottom: '16px',
  '@media (max-width: 600px)': {
    gridTemplateColumns: '1fr',
    gap: '16px',
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

const CardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
});

const MemberName = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: colors.accent.main,
  '@media (max-width: 600px)': {
    fontSize: '1rem',
  }
});

const RoleChip = styled('span')({
  backgroundColor: `${colors.accent.main}33`,
  color: colors.accent.main,
  padding: '4px 12px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 500,
  '@media (max-width: 600px)': {
    fontSize: '0.75rem',
  }
});

const AnimatedTableRow = styled(motion.tr)({
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const fadeOut = {
  initial: { opacity: 1, height: 'auto' },
  exit: { 
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

const MobileTeamCard = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.75)' : '#ffffff',
  borderRadius: '16px',
  padding: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  boxShadow: isDarkMode ? '0 4px 12px rgba(0, 0, 0, 0.15)' : '0 4px 12px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.06)'}`,
  marginBottom: '16px',
  width: '100%'
}));

const MobileTeamHeader = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '12px',
  color: isDarkMode ? '#ffffff' : '#000000'
}));

const MobileTeamName = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: isDarkMode ? colors.accent.main : '#000000'
}));

const MobileTeamInfo = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: '8px',
  color: isDarkMode ? '#ffffff' : '#000000',
  '& > *': {
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  }
}));

const MobileTeamMember = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
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

const MobileTeamRole = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.85rem',
  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    color: colors.accent.main
  }
}));

const MobileTeamActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '12px',
});

const MobileInfoItem = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
});

const MobileInfoLabel = styled(Typography)({
  fontSize: '0.8rem',
  color: 'rgba(255, 255, 255, 0.5)',
  textTransform: 'uppercase',
  letterSpacing: '0.5px',
});

const MobileInfoValue = styled(Typography)({
  fontSize: '0.95rem',
  color: '#ffffff',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
});

const MobileActions = styled(Box)({
  display: 'flex',
  gap: '8px',
  marginTop: '16px',
  justifyContent: 'flex-end',
});

const ActionButton = styled(IconButton)({
  padding: '8px',
  '&:hover': {
    backgroundColor: 'rgba(255, 159, 67, 0.1)'
  }
});

const StatusChip = styled(Chip)(({ status }: { status: string }) => ({
  backgroundColor: status === 'active' ? 'rgba(46, 213, 115, 0.15)' : 
                  status === 'pending' ? 'rgba(255, 159, 67, 0.15)' : 
                  'rgba(255, 107, 107, 0.15)',
  color: status === 'active' ? '#ff9f43' : 
        status === 'pending' ? '#ff9f43' : 
        '#ff6b6b',
  borderRadius: '8px',
  fontSize: '0.8rem',
  fontWeight: 500,
  height: '24px'
}));

const StyledTableWrapper = styled(Paper)({
  backgroundColor: 'rgba(28, 28, 45, 0.95)',
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  marginBottom: '24px',
  '& .MuiTable-root': {
    backgroundColor: 'transparent',
  },
  '& .MuiTableCell-root': {
    color: colors.text.primary,
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  '& .MuiTableHead-root .MuiTableCell-root': {
    backgroundColor: 'rgba(28, 28, 45, 0.95)',
    fontWeight: 600,
  },
  '& .MuiTableBody-root .MuiTableRow-root:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
  }
});

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
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '24px',
  borderRadius: '24px',
  backdropFilter: 'blur(20px)',
  boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  maxHeight: '90vh',
  overflowY: 'auto',
  margin: 0,
  '@media (max-width: 600px)': {
    padding: '16px',
    margin: 0,
    maxHeight: '95vh',
  },
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    margin: 0,
    borderRadius: '24px',
    border: 'none',
    outline: 'none'
  },
  '& .MuiBox-root': {
    borderRadius: '24px',
  },
  '& .MuiPaper-root': {
    borderRadius: '24px',
    border: 'none',
    outline: 'none',
    boxShadow: 'none',
    backgroundColor: 'transparent'
  },
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    backgroundColor: 'transparent',
    borderRadius: '24px 24px 0 0',
    border: 'none',
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
      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
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
    backgroundColor: 'transparent',
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

const LoadingDialog = styled(Dialog)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  '& .MuiDialog-paper': {
    background: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    borderRadius: '16px',
    padding: '24px',
    minWidth: '300px',
    boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  },
}));

const LoadingText = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? '#ffffff' : '#000000',
  textAlign: 'center',
  marginBottom: '20px',
  fontSize: '1.1rem',
}));

const LoadingDots = styled(Box)({
  display: 'flex',
  justifyContent: 'center',
  gap: '8px',
  marginTop: '0',
  height: '24px',
  alignItems: 'center'
});

const Dot = styled(Box)<{ isDarkMode?: boolean }>(({ isDarkMode = true }) => ({
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  backgroundColor: isDarkMode ? '#ffffff' : '#000000',
  animation: 'bounce 1.4s infinite ease-in-out',
  '&:nth-of-type(1)': {
    animationDelay: '-0.32s',
  },
  '&:nth-of-type(2)': {
    animationDelay: '-0.16s',
  },
  '@keyframes bounce': {
    '0%, 80%, 100%': {
      transform: 'scale(0)',
    },
    '40%': {
      transform: 'scale(1)',
    },
  },
}));

const validateEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const AnimatedAlert = styled(motion.div)({
  width: '100%',
  marginBottom: '24px'
});

const alertVariants = {
  initial: { 
    opacity: 0,
    y: -20,
    scale: 0.95
  },
  animate: { 
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
      ease: "easeOut"
    }
  },
  exit: { 
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: {
      duration: 0.2,
      ease: "easeIn"
    }
  }
};

function Team() {
  const navigate = useNavigate();
  const isMobile = useMediaQuery('(max-width: 600px)');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyID, setCompanyID] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [openInvite, setOpenInvite] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [inviteToDelete, setInviteToDelete] = useState<DeleteableItem | null>(null);
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null);
  const [email, setEmail] = useState('');
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+421');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('sk');
  const [role, setRole] = useState('user');
  const { userData } = useAuth();
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const [isResending, setIsResending] = useState(false);
  const [resendingInvitationId, setResendingInvitationId] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'info' | 'warning';
  }>({
    open: false,
    message: '',
    severity: 'info'
  });
  const [isCreating, setIsCreating] = useState(false);
  const [isInitializingLastLogin, setIsInitializingLastLogin] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('CompanyID používateľa v Team:', userData.companyID);
            
            if (!userData.companyID) {
              console.error('Používateľ nemá nastavené companyID v Team komponente');
              setError('Používateľ nemá priradené ID firmy.');
              setLoading(false);
              return;
            }
            
            setCompanyID(userData.companyID);
            setIsAdmin(userData.role === 'admin');

            // Ak je užívateľ admin, aktualizujeme jeho status na 'active'
            if (userData.role === 'admin' && userData.status !== 'active') {
              await updateDoc(doc(db, 'users', user.uid), {
                status: 'active',
                updatedAt: new Date()
              });
            }

            // Načítanie členov tímu
            const membersQuery = query(
              collection(db, 'users'),
              where('companyID', '==', userData.companyID)
            );
            
            // Načítanie pozvánok
            const invitationsQuery = query(
              collection(db, 'invitations'),
              where('companyID', '==', userData.companyID)
            );

            // Real-time sledovanie členov tímu
            const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
              console.log('Načítané členy tímu:', snapshot.docs.map(doc => ({
                ...doc.data(),
                id: doc.id
              })));
              const membersMap = new Map<string, TeamMember>();
              snapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Spracovávam člena:', data.email, 'lastLogin:', data.lastLogin);
                // Použijeme email ako kľúč pre odstránenie duplicít
                membersMap.set(data.email, {
                  id: doc.id,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  email: data.email,
                  phone: data.phone,
                  role: data.role,
                  status: data.role === 'admin' ? 'active' : (data.status || 'pending'),
                  createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
                  userId: doc.id,  // Používame doc.id ako userId
                  lastLogin: data.lastLogin || null
                });
                console.log('Po konverzii lastLogin:', membersMap.get(data.email)?.lastLogin);
              });
              console.log('Finálny zoznam členov po odstránení duplicít:', Array.from(membersMap.values()));
              setTeamMembers(Array.from(membersMap.values()));
            });

            // Real-time sledovanie pozvánok
            const unsubscribeInvitations = onSnapshot(invitationsQuery, (snapshot) => {
              const invites: Invitation[] = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                if (data.status === 'pending') {
                  invites.push({
                    id: doc.id,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    role: data.role,
                    status: data.status,
                    createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
                    userId: data.userId
                  });
                }
              });
              setInvitations(invites);
            });

            return () => {
              unsubscribeMembers();
              unsubscribeInvitations();
            };
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

  useEffect(() => {
    setIsEmailValid(validateEmail(email));
  }, [email]);

  const handleInvite = async () => {
    if (!isEmailValid) {
      return;
    }
    if (!email || !role || !companyID || !firstName || !lastName || !phoneNumber) {
      setError('Prosím vyplňte všetky polia');
      return;
    }

    try {
      setIsCreating(true);
      setError('');
      setSuccess('');

      // Kontrola autentifikácie
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Užívateľ nie je prihlásený');
      }

      // Vytvorenie pozvánky v Firestore
      const invitationRef = await addDoc(collection(db, 'invitations'), {
        email,
        firstName,
        lastName,
        phone: `${phonePrefix}${phoneNumber}`,
        role,
        companyID,
        createdAt: new Date(),
        status: 'pending'
      });

      // Volanie Cloud Function na odoslanie emailu
      const sendInvitationEmail = httpsCallable(functions, 'sendInvitationEmail');
      await sendInvitationEmail({
        email,
        firstName,
        lastName,
        phone: `${phonePrefix}${phoneNumber}`,
        role,
        companyId: companyID,
        invitationId: invitationRef.id
      });

      setSuccess('Pozvánka bola úspešne odoslaná.');
      
      // Zatvorenie dialógu a reset formulára po 1 sekunde
      setTimeout(() => {
        setOpenInvite(false);
        setEmail('');
        setFirstName('');
        setLastName('');
        setPhoneNumber('');
        setRole('user');
        setIsCreating(false);
      }, 1000);

      // Skrytie success správy po 5 sekundách
      setTimeout(() => {
        setSuccess('');
      }, 5000);

    } catch (err: any) {
      console.error('Chyba pri odosielaní pozvánky:', err);
      setError(err.message || 'Nastala chyba pri odosielaní pozvánky.');
      setIsCreating(false);
    }
  };

  const handleEdit = (member: TeamMember | Invitation) => {
    setEditingInvite(member as Invitation);
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setEmail(member.email);
    // Extrahujeme predvoľbu a číslo
    const prefix = countries.find(c => member.phone.startsWith(c.prefix))?.prefix || '+421';
    setPhonePrefix(prefix);
    setCountryCode(countries.find(c => c.prefix === prefix)?.code || 'sk');
    setPhoneNumber(member.phone.replace(prefix, ''));
    setRole(member.role);
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!editingInvite || !firstName || !lastName || !email || !phoneNumber || !role) {
      setError('Prosím vyplňte všetky polia');
      // Skrytie error správy po 5 sekundách
      setTimeout(() => {
        setError('');
      }, 5000);
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

      // Ak je to pozvánka (nemá userId)
      if (!editingInvite.userId) {
        await updateDoc(doc(db, 'invitations', editingInvite.id), {
          firstName,
          lastName,
          email,
          phone: fullPhoneNumber,
          role,
          updatedAt: new Date()
        });
      } else {
        // Ak je to člen tímu (má userId)
        await updateDoc(doc(db, 'users', editingInvite.userId), {
          firstName,
          lastName,
          email,
          phone: fullPhoneNumber,
          role,
          updatedAt: new Date()
        });
      }

      setSuccess('Záznam bol úspešne aktualizovaný.');
      setOpenEdit(false);
      setEditingInvite(null);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
      setRole('user');
      
      // Skrytie success správy po 5 sekundách
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Chyba pri aktualizácii záznamu:', err);
      setError(err.message || 'Nastala chyba pri aktualizácii záznamu.');
      // Skrytie error správy po 5 sekundách
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (member: DeleteableItem) => {
    setInviteToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inviteToDelete) return;

    try {
      setLoading(true);
      if ('userId' in inviteToDelete && inviteToDelete.userId) {
        // Ak je to člen tímu
        console.log('Mazanie člena tímu s ID:', inviteToDelete.userId);
        setDeletingMemberId(inviteToDelete.id);
        await deleteDoc(doc(db, 'users', inviteToDelete.userId));
      } else {
        // Ak je to pozvánka
        const invitationRef = doc(db, 'invitations', inviteToDelete.id);
        await deleteDoc(invitationRef);
        console.log('Pozvánka vymazaná:', inviteToDelete.id);
      }
      setSuccess('Záznam bol úspešne vymazaný.');
      setDeleteConfirmOpen(false);
      setInviteToDelete(null);
      
      // Skrytie success správy po 5 sekundách
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Chyba pri mazaní záznamu:', err);
      setError(err.message || 'Nastala chyba pri mazaní záznamu.');
      // Skrytie error správy po 5 sekundách
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
      setDeletingMemberId(null);
    }
  };

  const handleVerifyStatus = async (member: TeamMember) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updateDoc(doc(db, 'users', member.id), {
        status: 'active',
        updatedAt: new Date()
      });

      setSuccess('Status člena tímu bol úspešne overený.');
      // Skrytie success správy po 5 sekundách
      setTimeout(() => {
        setSuccess('');
      }, 5000);
    } catch (err: any) {
      console.error('Chyba pri overovaní statusu:', err);
      setError(err.message || 'Nastala chyba pri overovaní statusu.');
      // Skrytie error správy po 5 sekundách
      setTimeout(() => {
        setError('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };

  const handleCountryChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    const country = countries.find(c => c.code === value);
    if (country) {
      setCountryCode(value);
      setPhonePrefix(country.prefix);
    }
  };

  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  const handleResendInvitation = async (invitationId: string) => {
    try {
      setIsResending(true);
      setResendingInvitationId(invitationId);
      
      const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));
      if (!invitationDoc.exists()) {
        throw new Error('Pozvánka nebola nájdená');
      }

      const invitationData = invitationDoc.data();
      const sendInvitationEmail = httpsCallable(functions, 'sendInvitationEmail');
      await sendInvitationEmail({
        email: invitationData.email,
        firstName: invitationData.firstName,
        lastName: invitationData.lastName,
        phone: invitationData.phone,
        role: invitationData.role,
        companyId: companyID,
        invitationId: invitationId
      });

      // Aktualizácia času posledného odoslania
      await updateDoc(doc(db, 'invitations', invitationId), {
        lastSentAt: new Date().toISOString()
      });

      // Aktualizácia lokálneho stavu
      setInvitations(prev => prev.map(inv => 
        inv.id === invitationId 
          ? { ...inv, lastSentAt: new Date().toISOString() }
          : inv
      ));

      // Zobrazenie notifikácie
      setNotification({
        open: true,
        message: 'Pozvánka bola úspešne preposlaná',
        severity: 'success'
      });
    } catch (error) {
      console.error('Chyba pri preposielaní pozvánky:', error);
      setNotification({
        open: true,
        message: 'Nepodarilo sa preposlať pozvánku',
        severity: 'error'
      });
    } finally {
      // Zatiahneme zatvorenie dialogu o 1 sekundu, aby sa užívateľ stihol pozrieť na loading stav
      setTimeout(() => {
        setIsResending(false);
        setResendingInvitationId(null);
      }, 1000);
    }
  };

  const handleInitializeLastLogin = async () => {
    try {
      setIsInitializingLastLogin(true);
      const initializeLastLoginFn = httpsCallable(functions, 'initializeLastLogin');
      const result = await initializeLastLoginFn();
      const data = result.data as { success: boolean, message: string };
      
      if (data.success) {
        setNotification({
          open: true,
          message: data.message,
          severity: 'success'
        });
      }
    } catch (error: any) {
      console.error('Chyba pri inicializácii lastLogin:', error);
      setNotification({
        open: true,
        message: 'Nastala chyba pri inicializácii posledného prihlásenia',
        severity: 'error'
      });
    } finally {
      setIsInitializingLastLogin(false);
    }
  };

  const renderMobileTeamMember = (member: TeamMember | Invitation) => (
    <MobileTeamCard isDarkMode={isDarkMode} key={member.id}>
      <MobileTeamHeader isDarkMode={isDarkMode}>
        <Box>
          <MobileTeamName isDarkMode={isDarkMode}>
            {member.firstName} {member.lastName}
          </MobileTeamName>
          <MobileTeamRole isDarkMode={isDarkMode}>
            {member.role}
          </MobileTeamRole>
        </Box>
        <Box>
          <Chip
            label={member.status === 'pending' ? 'Čaká sa na prijatie' : 'Aktívny'}
            color={member.status === 'pending' ? 'warning' : 'success'}
            size="small"
            sx={{ fontSize: '0.75rem' }}
          />
        </Box>
      </MobileTeamHeader>
      
      <MobileTeamInfo isDarkMode={isDarkMode}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <MailIcon />
          <Typography variant="body2">{member.email}</Typography>
        </Box>
        
        {member.phone && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <PhoneIcon />
            <Typography variant="body2">{member.phone}</Typography>
          </Box>
        )}

        {'lastLogin' in member && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTimeIcon />
            <Typography variant="body2">
              {member.lastLogin ? format(member.lastLogin.toDate(), 'dd.MM.yyyy HH:mm') : 'Nikdy'}
            </Typography>
          </Box>
        )}
      </MobileTeamInfo>
      
      <MobileTeamActions>
        {member.status === 'pending' && 'id' in member && (
          <>
            <IconButton
              size="small"
              onClick={() => handleResendInvitation(member.id)}
              sx={{ 
                color: colors.accent.main,
                '&:hover': {
                  backgroundColor: 'rgba(255, 159, 67, 0.1)'
                }
              }}
            >
              <RefreshIcon fontSize="small" />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleEdit(member)}
              sx={{ 
                color: colors.accent.main,
                '&:hover': {
                  backgroundColor: 'rgba(255, 159, 67, 0.1)'
                }
              }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </>
        )}
        <IconButton
          size="small"
          onClick={() => handleDeleteClick(member)}
          sx={{ 
            color: colors.secondary.main,
            '&:hover': {
              backgroundColor: 'rgba(255, 107, 107, 0.1)'
            }
          }}
        >
          <DeleteIcon fontSize="small" />
        </IconButton>
      </MobileTeamActions>
    </MobileTeamCard>
  );

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress sx={{ color: '#ff9f43' }} />
        </Box>
      </Container>
    );
  }

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Tím</PageTitle>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isAdmin && (
            <Button
              variant="contained"
              onClick={() => setOpenInvite(true)}
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: colors.accent.main,
                '&:hover': {
                  backgroundColor: colors.accent.dark,
                },
              }}
            >
              Pozvať člena
            </Button>
          )}
        </Box>
      </PageHeader>

      <AnimatePresence mode="sync">
        {error && (
          <AnimatedAlert
            initial="initial"
            animate="animate"
            exit="exit"
            variants={alertVariants}
          >
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          </AnimatedAlert>
        )}

        {success && (
          <AnimatedAlert
            initial="initial"
            animate="animate"
            exit="exit"
            variants={alertVariants}
          >
            <Alert severity="success" onClose={() => setSuccess('')}>
              {success}
            </Alert>
          </AnimatedAlert>
        )}
      </AnimatePresence>

      {isMobile ? (
        <Box>
          {teamMembers.map(member => renderMobileTeamMember(member))}
          <Typography 
            variant="h6" 
            sx={{ 
              mt: 4,
              mb: 2,
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
                fontSize: '1.5rem'
              }
            }}
          >
            Čakajúce pozvánky
          </Typography>
          {invitations.map(invite => renderMobileTeamMember(invite))}
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            borderRadius: '20px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
            marginBottom: '24px'
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Meno</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefón</TableCell>
                  <TableCell>Rola</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Posledné prihlásenie</TableCell>
                  {isAdmin && <TableCell>Akcie</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence mode="sync">
                  {teamMembers.map((member) => (
                    <StyledTableRow isDarkMode={isDarkMode} key={member.id}>
                      <TableCell>{member.firstName} {member.lastName}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Chip
                          label={member.role}
                          color={member.role === 'admin' ? 'primary' : 'default'} 
                          size="small"
                          sx={{
                            backgroundColor: member.role === 'admin' ? colors.accent.main : 'rgba(255, 255, 255, 0.1)',
                            color: '#ffffff',
                            '& .MuiChip-label': {
                              fontSize: {
                                xs: '0.7rem',
                                sm: '0.8rem'
                              }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={member.status}
                          color={member.status === 'active' ? 'success' : 'warning'}
                          size="small"
                          sx={{
                            backgroundColor: member.status === 'active' ? 'rgba(46, 213, 115, 0.15)' : 'rgba(255, 159, 67, 0.15)',
                            color: member.status === 'active' ? '#2ed573' : colors.accent.main,
                            '& .MuiChip-label': {
                              fontSize: {
                                xs: '0.7rem',
                                sm: '0.8rem'
                              }
                            }
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {member.lastLogin ? (
                          <Typography sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                            fontSize: '0.9rem'
                          }}>
                            {format(member.lastLogin.toDate(), 'dd.MM.yyyy HH:mm')}
                          </Typography>
                        ) : (
                          <Typography sx={{ 
                            color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                            fontSize: '0.9rem',
                            fontStyle: 'italic'
                          }}>
                            Nikdy
                          </Typography>
                        )}
                      </TableCell>
                      {isAdmin && (
                        <TableCell>
                          <Box sx={{ display: 'flex', gap: 1 }}>
                            <IconButton 
                              onClick={() => handleEdit(member)}
                              sx={{ 
                                color: colors.accent.main,
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 159, 67, 0.1)'
                                }
                              }}
                            >
                              <EditIcon />
                            </IconButton>
                            <IconButton 
                              onClick={() => handleDeleteClick(member)}
                              sx={{ 
                                color: colors.secondary.main,
                                '&:hover': {
                                  backgroundColor: 'rgba(255, 107, 107, 0.1)'
                                }
                              }}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Box>
                        </TableCell>
                      )}
                    </StyledTableRow>
                  ))}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>

          <Typography 
            variant="h6" 
            sx={{ 
              mt: 4,
              mb: 2,
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
                fontSize: '1.5rem'
              }
            }}
          >
            Čakajúce pozvánky
          </Typography>
          <TableContainer component={Paper} sx={{
            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
            borderRadius: '20px',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
          }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Meno</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefón</TableCell>
                  <TableCell>Rola</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Posledné prihlásenie</TableCell>
                  <TableCell>Akcie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invitations.map((invite) => (
                  <TableRow key={invite.id}>
                    <TableCell>{invite.firstName} {invite.lastName}</TableCell>
                    <TableCell>{invite.email}</TableCell>
                    <TableCell>{invite.phone}</TableCell>
                    <TableCell>
                      <Chip
                        label={invite.role}
                        color={invite.role === 'admin' ? 'warning' : 'default'}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label="Čaká sa na prijatie"
                        color="warning"
                      />
                    </TableCell>
                    <TableCell>-</TableCell>
                    <TableCell>
                      <IconButton onClick={() => handleResendInvitation(invite.id)}
                        sx={{ 
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)'
                          }
                        }}
                      >
                        <RefreshIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleEdit(invite)}
                        sx={{ 
                          color: colors.accent.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 159, 67, 0.1)'
                          }
                        }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton 
                        onClick={() => handleDeleteClick(invite)}
                        sx={{ 
                          color: colors.secondary.main,
                          '&:hover': {
                            backgroundColor: 'rgba(255, 107, 107, 0.1)'
                          }
                        }}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Dialóg pre pozvanie nového člena */}
      <Dialog
        open={openInvite}
        onClose={() => setOpenInvite(false)}
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
          <DialogTitle>Pridať nového člena tímu</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meno"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Priezvisko"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Krajina</InputLabel>
                  <Select
                    value={countryCode}
                    onChange={handleCountryChange}
                    label="Krajina"
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            }
                          }
                        }
                      }
                    }}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            loading="lazy"
                            width="20"
                            src={`https://flagcdn.com/${country.code}.svg`}
                            alt={country.name}
                          />
                          <span>{country.name}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Telefón"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: isDarkMode ? '#ffffff' : '#000000' }}>
                        {phonePrefix}
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Rola</InputLabel>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    label="Rola"
                    required
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            },
                            '&.Mui-selected': {
                              backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.1)',
                              '&:hover': {
                                backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.25)' : 'rgba(255, 159, 67, 0.2)'
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manažér</MenuItem>
                    <MenuItem value="user">Používateľ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenInvite(false)} 
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
              }}
            >
              Zrušiť
            </Button>
            <Button 
              onClick={handleInvite}
              variant="contained"
              disabled={isCreating || !isEmailValid}
              sx={{
                backgroundColor: colors.accent.main,
                color: '#ffffff',
                '&:hover': {
                  backgroundColor: colors.accent.light,
                },
                '&:disabled': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
                }
              }}
            >
              {isCreating ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={20} sx={{ 
                    color: isDarkMode ? '#ffffff' : colors.accent.main,
                    opacity: 0.7 
                  }} />
                  <Typography variant="body2">Pozývam...</Typography>
                </Box>
              ) : 'Pozvať'}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      {/* Dialóg pre úpravu */}
      <Dialog
        open={openEdit}
        onClose={() => setOpenEdit(false)}
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
          <DialogTitle>Upraviť údaje člena tímu</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meno"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Priezvisko"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Krajina</InputLabel>
                  <Select
                    value={countryCode}
                    onChange={handleCountryChange}
                    label="Krajina"
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            }
                          }
                        }
                      }
                    }}
                  >
                    {countries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <img
                            loading="lazy"
                            width="20"
                            src={`https://flagcdn.com/${country.code}.svg`}
                            alt={country.name}
                          />
                          <span>{country.name}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} md={8}>
                <TextField
                  fullWidth
                  label="Telefón"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: isDarkMode ? '#ffffff' : '#000000' }}>
                        {phonePrefix}
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Rola</InputLabel>
                  <Select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    label="Rola"
                    required
                    sx={{
                      backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.8)' : 'rgba(255, 255, 255, 0.8)',
                      color: isDarkMode ? '#ffffff' : '#000000',
                    }}
                    MenuProps={{
                      PaperProps: {
                        sx: {
                          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                          backdropFilter: 'blur(8px)',
                          boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
                          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
                          '& .MuiMenuItem-root': {
                            color: isDarkMode ? '#ffffff' : '#000000',
                            '&:hover': {
                              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                            },
                            '&.Mui-selected': {
                              backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.15)' : 'rgba(255, 159, 67, 0.1)',
                              '&:hover': {
                                backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.25)' : 'rgba(255, 159, 67, 0.2)'
                              }
                            }
                          }
                        }
                      }
                    }}
                  >
                    <MenuItem value="admin">Admin</MenuItem>
                    <MenuItem value="manager">Manažér</MenuItem>
                    <MenuItem value="user">Používateľ</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={() => setOpenEdit(false)} 
              sx={{ 
                color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                '&:hover': {
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.9)' : 'rgba(0, 0, 0, 0.9)'
                }
              }}
            >
              Zrušiť
            </Button>
            <Button 
              onClick={handleUpdate}
              variant="contained"
              sx={{
                backgroundColor: colors.accent.main,
                color: '#ffffff',
                fontWeight: 600,
                padding: '8px 24px',
                minWidth: '150px',
                '&:hover': {
                  backgroundColor: colors.accent.light,
                },
                '&.Mui-disabled': {
                  backgroundColor: 'rgba(255, 159, 67, 0.3)',
                  color: 'rgba(255, 255, 255, 0.3)',
                }
              }}
            >
              {loading ? (
                <LoadingDots>
                  <Dot isDarkMode={true} />
                  <Dot isDarkMode={true} />
                  <Dot isDarkMode={true} />
                </LoadingDots>
              ) : 'Uložiť zmeny'}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      {/* Dialóg pre potvrdenie vymazania */}
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
          <DialogTitle>Potvrdiť vymazanie</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Ste si istý, že chcete {inviteToDelete && 'userId' in inviteToDelete ? 'vymazať člena z tímu' : 'zrušiť pozvánku pre'} {inviteToDelete?.firstName} {inviteToDelete?.lastName}? Táto akcia je nezvratná.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)} aria-label="Zrušiť akciu">
              Zrušiť
            </Button>
            <Button 
              onClick={handleDeleteConfirm} 
              color="error" 
              variant="contained" 
              disabled={loading}
              aria-label={inviteToDelete && 'userId' in inviteToDelete ? 'Vymazať člena z tímu' : 'Zrušiť pozvánku'}
            >
              {loading ? (
                <LoadingDots>
                  <Dot isDarkMode={true} />
                  <Dot isDarkMode={true} />
                  <Dot isDarkMode={true} />
                </LoadingDots>
              ) : `${inviteToDelete && 'userId' in inviteToDelete ? 'Vymazať člena z tímu' : 'Zrušiť pozvánku'}`}
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>

      <LoadingDialog
        open={isResending || isCreating}
        onClose={() => {}}
        isDarkMode={isDarkMode}
        PaperProps={{
          sx: {
            background: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
            borderRadius: '16px',
            padding: '24px',
            minWidth: '300px',
            boxShadow: isDarkMode ? '0 8px 32px rgba(0, 0, 0, 0.3)' : '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            backdropFilter: 'blur(10px)',
          }
        }}
      >
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
            <CircularProgress size={40} sx={{ 
              color: colors.accent.main
            }} />
            <Typography variant="body1" sx={{ 
              color: isDarkMode ? '#ffffff' : '#000000',
              textAlign: 'center'
            }}>
              {isCreating ? 'Vytváranie pozvánky...' : 'Preposielanie pozvánky...'}
            </Typography>
          </Box>
        </DialogContent>
      </LoadingDialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={5000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
}

export default Team; 