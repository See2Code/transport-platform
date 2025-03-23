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
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { sk } from 'date-fns/locale';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { format } from 'date-fns';

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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <StyledPaper>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h4" sx={{ 
            background: 'linear-gradient(135deg, #00b894 0%, #ffa502 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 'bold',
          }}>
            Sledované prepravy
          </Typography>
          <Button
            variant="contained"
            onClick={handleOpenDialog}
            sx={{
              background: 'linear-gradient(135deg, #00b894 0%, #00d2a0 100%)',
              color: 'white',
              '&:hover': {
                background: 'linear-gradient(135deg, #00a884 0%, #00c290 100%)',
                transform: 'translateY(-2px)',
                boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
              },
              transition: 'all 0.3s ease-in-out',
            }}
          >
            Pridať sledovanie
          </Button>
        </Box>

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

        {transports.length === 0 ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            Zatiaľ nemáte žiadne sledované prepravy
          </Alert>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Dátum vytvorenia
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Číslo objednávky
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Miesto naloženia
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Dátum a čas naloženia
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Pripomienka naloženia
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Miesto vyloženia
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Dátum a čas vyloženia
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Pripomienka vyloženia
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Vytvoril
                  </TableCell>
                  <TableCell 
                    sx={{ 
                      fontWeight: 'bold',
                      color: '#00b894',
                      borderBottom: '2px solid rgba(0, 184, 148, 0.2)',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transports.map((transport) => (
                  <TableRow 
                    key={transport.id}
                    sx={{
                      '&:hover': {
                        backgroundColor: 'rgba(0, 184, 148, 0.05)',
                      },
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {format(transport.createdAt, 'dd.MM.yyyy HH:mm', { locale: sk })}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {transport.orderNumber}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {transport.loadingAddress}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {format(transport.loadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {transport.loadingReminder} {transport.loadingReminder === 1 ? 'hodinu' : transport.loadingReminder < 5 ? 'hodiny' : 'hodín'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {transport.unloadingAddress}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {format(transport.unloadingDateTime, 'dd.MM.yyyy HH:mm', { locale: sk })}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {transport.unloadingReminder} {transport.unloadingReminder === 1 ? 'hodinu' : transport.unloadingReminder < 5 ? 'hodiny' : 'hodín'}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      {transport.createdBy?.firstName} {transport.createdBy?.lastName}
                    </TableCell>
                    <TableCell sx={{ whiteSpace: 'nowrap', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
                      <Typography
                        sx={{
                          color: transport.status === 'active' ? '#00b894' : '#ff6b6b',
                          fontWeight: 'bold',
                          display: 'inline-block',
                          padding: '4px 12px',
                          borderRadius: '4px',
                          backgroundColor: transport.status === 'active' ? 'rgba(0, 184, 148, 0.1)' : 'rgba(255, 107, 107, 0.1)',
                        }}
                      >
                        {transport.status === 'active' ? 'Aktívna' : 'Ukončená'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </StyledPaper>

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
    </Container>
  );
}

export default TrackedTransports; 