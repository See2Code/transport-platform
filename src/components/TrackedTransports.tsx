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
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { sk } from 'date-fns/locale';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, Timestamp, orderBy } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import NotificationsIcon from '@mui/icons-material/Notifications';

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
    backgroundColor: colors.accent.main,
    borderRadius: '2px',
  }
});

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
  }
});

const TransportCard = styled(Paper)({
  backgroundColor: colors.primary.light,
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

const TransportInfo = styled(Box)({
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
});

const SearchField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
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
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiInputBase-input': {
    color: '#ffffff',
  },
});

function TrackedTransports() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [filteredTransports, setFilteredTransports] = useState<Transport[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
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
  const { userData } = useAuth();

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

  const handleDelete = (id: string) => {
    console.log('Delete transport:', id);
  };

  const handleMoreOptions = (id: string) => {
    console.log('More options for transport:', id);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Sledované prepravy</PageTitle>
        <AddButton
          startIcon={<AddIcon />}
          onClick={() => handleOpenDialog()}
        >
          Pridať prepravu
        </AddButton>
      </PageHeader>

      <SearchWrapper>
        <SearchField
          fullWidth
          label="Vyhľadať prepravu"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Zadajte číslo objednávky, adresu alebo meno"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: 'rgba(255, 255, 255, 0.7)' }} />
              </InputAdornment>
            ),
          }}
        />
      </SearchWrapper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
          <CircularProgress />
        </Box>
      ) : filteredTransports.length === 0 ? (
        <Alert severity="info" sx={{ backgroundColor: 'rgba(255, 255, 255, 0.05)', color: '#ffffff' }}>
          {searchQuery ? 'Neboli nájdené žiadne prepravy zodpovedajúce vyhľadávaniu' : 'Zatiaľ nemáte žiadne sledované prepravy'}
        </Alert>
      ) : (
        <Box>
          {filteredTransports.map((transport) => (
            <TransportCard key={transport.id}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                <Box>
                  <Typography variant="h6" sx={{ mb: 1 }}>
                    Objednávka: {transport.orderNumber}
                  </Typography>
                  <Chip
                    label={transport.status}
                    color={transport.status === 'Aktívna' ? 'success' : 'default'}
                    size="small"
                    sx={{ 
                      mr: 1,
                      backgroundColor: transport.status === 'Aktívna' ? '#00ff00' : 'inherit',
                      color: transport.status === 'Aktívna' ? '#000000' : 'inherit',
                      fontWeight: 500,
                    }}
                  />
                  {transport.isDelayed && (
                    <Chip
                      label="Meškanie"
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
                <Box>
                  <Tooltip title="Upraviť">
                    <IconButton onClick={() => handleOpenDialog(transport)} sx={{ color: '#ffffff' }}>
                      <EditIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Vymazať">
                    <IconButton onClick={() => handleDelete(transport.id)} sx={{ color: '#ffffff' }}>
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Box>

              <TransportInfo>
                <InfoSection>
                  <Box>
                    <InfoLabel>Nakládka</InfoLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon sx={{ color: colors.accent.main }} />
                      <InfoValue>{transport.loadingAddress}</InfoValue>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <NotificationsIcon sx={{ color: colors.accent.main, fontSize: '1.1rem' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Pripomienka: {transport.loadingReminder} minút pred nakládkou
                      </Typography>
                    </Box>
                  </Box>
                </InfoSection>

                <InfoSection>
                  <Box>
                    <InfoLabel>Vykládka</InfoLabel>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationOnIcon sx={{ color: colors.accent.main }} />
                      <InfoValue>{transport.unloadingAddress}</InfoValue>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
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
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
                      <NotificationsIcon sx={{ color: colors.accent.main, fontSize: '1.1rem' }} />
                      <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
                        Pripomienka: {transport.unloadingReminder} minút pred vykládkou
                      </Typography>
                    </Box>
                  </Box>
                </InfoSection>
              </TransportInfo>

              <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.5)', mt: 2 }}>
                <Box component="span" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>Vytvoril: {transport.createdBy?.firstName || ''} {transport.createdBy?.lastName || ''}</span>
                  <span>Vytvorené: {format(
                      transport.createdAt instanceof Timestamp ? 
                        transport.createdAt.toDate() : 
                        transport.createdAt instanceof Date ? 
                          transport.createdAt : 
                          new Date(transport.createdAt),
                      'dd.MM.yyyy HH:mm',
                      { locale: sk }
                    )}
                  </span>
                </Box>
              </Typography>
            </TransportCard>
          ))}
        </Box>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            background: 'rgba(35, 35, 66, 0.7)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
          }
        }}
      >
        <DialogTitle sx={{ 
          color: '#ffffff',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          padding: '24px',
          fontSize: '1.5rem',
          fontWeight: 600,
        }}>
          {editingTransport ? 'Upraviť prepravu' : 'Pridať novú prepravu'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ 
            padding: '24px',
            color: '#ffffff',
          }}>
            <Grid container spacing={2}>
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
        <DialogActions sx={{ 
          padding: '24px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        }}>
          <Button onClick={handleCloseDialog} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            Zrušiť
          </Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{
              backgroundColor: colors.accent.main,
              color: '#ffffff',
              fontWeight: 600,
              padding: '8px 24px',
              '&:hover': {
                backgroundColor: colors.accent.light,
              },
              '&.Mui-disabled': {
                backgroundColor: 'rgba(255, 159, 67, 0.3)',
                color: 'rgba(255, 255, 255, 0.3)',
              }
            }}
          >
            {editingTransport ? 'Uložiť zmeny' : 'Pridať prepravu'}
          </Button>
        </DialogActions>
      </Dialog>
    </PageWrapper>
  );
}

export default TrackedTransports; 