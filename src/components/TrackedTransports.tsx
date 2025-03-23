import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  styled,
  CircularProgress,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  IconButton,
  Chip,
  Tooltip,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { sk } from 'date-fns/locale';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DeleteIcon from '@mui/icons-material/Delete';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import AddIcon from '@mui/icons-material/Add';

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
  loadingDateTime: Date;
  loadingReminder: number;
  unloadingAddress: string;
  unloadingDateTime: Date;
  unloadingReminder: number;
  status: string;
  createdAt: Date;
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
    main: '#00b894',
    light: '#00d2a0',
    dark: '#00a07a',
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
  boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)',
  '&:hover': {
    backgroundColor: colors.accent.light,
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 184, 148, 0.4)',
  }
});

const TransportCard = styled(Card)({
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

function TrackedTransports() {
  const [transports, setTransports] = useState<Transport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState<TransportFormData>({
    orderNumber: '',
    loadingAddress: '',
    loadingDateTime: null,
    loadingReminder: 2,
    unloadingAddress: '',
    unloadingDateTime: null,
    unloadingReminder: 2,
  });
  const [success, setSuccess] = useState('');
  const { userData } = useAuth();

  const reminderOptions = Array.from({ length: 12 }, (_, i) => i + 1);

  const handleOpenDialog = () => {
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setFormData({
      orderNumber: '',
      loadingAddress: '',
      loadingDateTime: null,
      loadingReminder: 2,
      unloadingAddress: '',
      unloadingDateTime: null,
      unloadingReminder: 2,
    });
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      setError('Nie ste prihlásený');
      return;
    }

    if (!formData.loadingDateTime || !formData.unloadingDateTime) {
      setError('Prosím vyplňte všetky povinné polia');
      return;
    }

    try {
      const transportData = {
        ...formData,
        userId: auth.currentUser.uid,
        createdAt: new Date(),
        status: 'active',
        loadingReminderSent: false,
        unloadingReminderSent: false,
        createdBy: {
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || '',
        },
        isDelayed: false,
      };

      await addDoc(collection(db, 'transports'), transportData);
      
      setSuccess('Preprava bola úspešne vytvorená');
      handleCloseDialog();
      // Aktualizujeme zoznam preprav
      fetchTransports();
    } catch (err: any) {
      setError(err.message || 'Nastala chyba pri vytváraní prepravy');
    }
  };

  const fetchTransports = async () => {
    if (!auth.currentUser) {
      setError('Nie ste prihlásený');
      setLoading(false);
      return;
    }

    try {
      const transportsRef = collection(db, 'transports');
      const q = query(transportsRef, where('userId', '==', auth.currentUser.uid));
      const querySnapshot = await getDocs(q);
      
      const transportsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        loadingDateTime: doc.data().loadingDateTime.toDate(),
        unloadingDateTime: doc.data().unloadingDateTime.toDate(),
        createdAt: doc.data().createdAt.toDate(),
        isDelayed: doc.data().isDelayed,
      })) as Transport[];

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
          variant="contained"
          onClick={handleOpenDialog}
          startIcon={<AddIcon />}
        >
          Pridať sledovanie
        </AddButton>
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

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      ) : transports.length === 0 ? (
        <Alert severity="info">
          Zatiaľ nemáte žiadne sledované prepravy
        </Alert>
      ) : (
        <div>
          {transports.map((transport) => (
            <TransportCard key={transport.id}>
              <CardHeader>
                <OrderNumber>{transport.orderNumber}</OrderNumber>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <StatusChip
                    icon={<LocalShippingIcon />}
                    label={transport.status === 'active' ? 'Aktívna' : 'Ukončená'}
                    className={transport.status !== 'active' ? 'delayed' : ''}
                  />
                  <Tooltip title="Vymazať">
                    <IconButton onClick={() => handleDelete(transport.id)} size="small">
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </CardHeader>

              <TransportInfo>
                <InfoSection>
                  <Box>
                    <InfoLabel>Naloženie</InfoLabel>
                    <LocationInfo>
                      <LocationOnIcon sx={{ color: colors.accent.main }} />
                      <InfoValue>{transport.loadingAddress}</InfoValue>
                    </LocationInfo>
                    <TimeInfo>
                      <AccessTimeIcon fontSize="small" />
                      <InfoValue>
                        {format(transport.loadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })}
                      </InfoValue>
                    </TimeInfo>
                  </Box>
                  <Box>
                    <InfoLabel>Pripomienka</InfoLabel>
                    <InfoValue>
                      {transport.loadingReminder} {transport.loadingReminder === 1 ? 'hodinu' : transport.loadingReminder < 5 ? 'hodiny' : 'hodín'} pred
                    </InfoValue>
                  </Box>
                </InfoSection>

                <InfoSection>
                  <Box>
                    <InfoLabel>Vyloženie</InfoLabel>
                    <LocationInfo>
                      <LocationOnIcon sx={{ color: colors.secondary.main }} />
                      <InfoValue>{transport.unloadingAddress}</InfoValue>
                    </LocationInfo>
                    <TimeInfo>
                      <AccessTimeIcon fontSize="small" />
                      <InfoValue>
                        {format(transport.unloadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })}
                      </InfoValue>
                    </TimeInfo>
                  </Box>
                  <Box>
                    <InfoLabel>Pripomienka</InfoLabel>
                    <InfoValue>
                      {transport.unloadingReminder} {transport.unloadingReminder === 1 ? 'hodinu' : transport.unloadingReminder < 5 ? 'hodiny' : 'hodín'} pred
                    </InfoValue>
                  </Box>
                </InfoSection>

                <InfoSection>
                  <Box>
                    <InfoLabel>Vytvoril</InfoLabel>
                    <InfoValue>
                      {transport.createdBy?.firstName} {transport.createdBy?.lastName}
                    </InfoValue>
                  </Box>
                  <Box>
                    <InfoLabel>Dátum vytvorenia</InfoLabel>
                    <InfoValue>
                      {format(transport.createdAt, 'dd.MM.yyyy HH:mm', { locale: sk })}
                    </InfoValue>
                  </Box>
                </InfoSection>
              </TransportInfo>
            </TransportCard>
          ))}
        </div>
      )}

      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #00b894 0%, #ffa502 100%)',
          color: 'white',
          fontWeight: 'bold',
        }}>
          Nová preprava
        </DialogTitle>
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <Grid container spacing={3} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Číslo objednávky"
                  value={formData.orderNumber}
                  onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Naloženie
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresa naloženia"
                  value={formData.loadingAddress}
                  onChange={(e) => setFormData({ ...formData, loadingAddress: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                  <DateTimePicker
                    label="Dátum a čas naloženia"
                    value={formData.loadingDateTime}
                    onChange={(newValue: Date | null) => setFormData({ ...formData, loadingDateTime: newValue })}
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Pripomienka pred</InputLabel>
                  <Select
                    value={formData.loadingReminder}
                    onChange={(e) => setFormData({ ...formData, loadingReminder: Number(e.target.value) })}
                    label="Pripomienka pred"
                  >
                    {reminderOptions.map((hours) => (
                      <MenuItem key={hours} value={hours}>
                        {hours} {hours === 1 ? 'hodinu' : hours < 5 ? 'hodiny' : 'hodín'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                  Vyloženie
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Adresa vyloženia"
                  value={formData.unloadingAddress}
                  onChange={(e) => setFormData({ ...formData, unloadingAddress: e.target.value })}
                  required
                />
              </Grid>

              <Grid item xs={12} sm={8}>
                <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                  <DateTimePicker
                    label="Dátum a čas vyloženia"
                    value={formData.unloadingDateTime}
                    onChange={(newValue: Date | null) => setFormData({ ...formData, unloadingDateTime: newValue })}
                    sx={{ width: '100%' }}
                  />
                </LocalizationProvider>
              </Grid>

              <Grid item xs={12} sm={4}>
                <FormControl fullWidth>
                  <InputLabel>Pripomienka pred</InputLabel>
                  <Select
                    value={formData.unloadingReminder}
                    onChange={(e) => setFormData({ ...formData, unloadingReminder: Number(e.target.value) })}
                    label="Pripomienka pred"
                  >
                    {reminderOptions.map((hours) => (
                      <MenuItem key={hours} value={hours}>
                        {hours} {hours === 1 ? 'hodinu' : hours < 5 ? 'hodiny' : 'hodín'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </form>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušiť</Button>
          <Button 
            onClick={handleSubmit}
            variant="contained"
            sx={{
              background: 'linear-gradient(135deg, #00b894 0%, #00d2a0 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a884 0%, #00c290 100%)',
              },
            }}
          >
            Vytvoriť prepravu
          </Button>
        </DialogActions>
      </Dialog>
    </PageWrapper>
  );
}

export default TrackedTransports; 