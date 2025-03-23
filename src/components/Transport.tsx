import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  styled,
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { sk } from 'date-fns/locale';
import { addDoc, collection } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

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

const GradientButton = styled(Button)({
  background: 'linear-gradient(135deg, #00b894 0%, #00d2a0 100%)',
  color: 'white',
  padding: '12px 24px',
  '&:hover': {
    background: 'linear-gradient(135deg, #00a884 0%, #00c290 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 15px rgba(0, 0, 0, 0.2)',
  },
  transition: 'all 0.3s ease-in-out',
});

interface TransportFormData {
  orderNumber: string;
  loadingAddress: string;
  loadingDateTime: Date | null;
  loadingReminder: number;
  unloadingAddress: string;
  unloadingDateTime: Date | null;
  unloadingReminder: number;
}

function Transport() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<TransportFormData>({
    orderNumber: '',
    loadingAddress: '',
    loadingDateTime: null,
    loadingReminder: 2,
    unloadingAddress: '',
    unloadingDateTime: null,
    unloadingReminder: 2,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const reminderOptions = Array.from({ length: 12 }, (_, i) => i + 1);

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
      };

      await addDoc(collection(db, 'transports'), transportData);
      
      setSuccess('Preprava bola úspešne vytvorená');
      // Reset formulára
      setFormData({
        orderNumber: '',
        loadingAddress: '',
        loadingDateTime: null,
        loadingReminder: 2,
        unloadingAddress: '',
        unloadingDateTime: null,
        unloadingReminder: 2,
      });
    } catch (err: any) {
      setError(err.message || 'Nastala chyba pri vytváraní prepravy');
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <StyledPaper>
        <Typography variant="h4" gutterBottom sx={{ 
          textAlign: 'center',
          background: 'linear-gradient(135deg, #00b894 0%, #ffa502 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          fontWeight: 'bold',
          mb: 4
        }}>
          Nová preprava
        </Typography>

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

        <form onSubmit={handleSubmit}>
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
              <DateTimePicker
                label="Dátum a čas naloženia"
                value={formData.loadingDateTime}
                onChange={(newValue: Date | null) => setFormData({ ...formData, loadingDateTime: newValue })}
                sx={{ width: '100%' }}
              />
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
              <DateTimePicker
                label="Dátum a čas vyloženia"
                value={formData.unloadingDateTime}
                onChange={(newValue: Date | null) => setFormData({ ...formData, unloadingDateTime: newValue })}
                sx={{ width: '100%' }}
              />
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

            <Grid item xs={12}>
              <GradientButton
                type="submit"
                variant="contained"
                fullWidth
                size="large"
                sx={{ mt: 2 }}
              >
                Vytvoriť prepravu
              </GradientButton>
            </Grid>
          </Grid>
        </form>
      </StyledPaper>
    </Container>
  );
}

export default Transport; 