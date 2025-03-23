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

const StyledContainer = styled('main')({
  width: 'calc(100% + 48px)',
  background: 'linear-gradient(135deg, rgba(0, 184, 148, 0.03) 0%, rgba(255, 165, 2, 0.03) 100%)',
  borderRadius: '16px',
  padding: '20px',
  marginTop: '-8px',
  marginLeft: '-24px',
  display: 'flex',
  flexDirection: 'column',
  flex: 1,
});

const FormSection = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  position: 'relative',
  '&:before': {
    content: '""',
    position: 'absolute',
    left: '-20px',
    top: '0',
    bottom: '0',
    width: '3px',
    background: 'linear-gradient(to bottom, #00b894, #ffa502)',
    borderRadius: '4px',
  }
});

const GradientButton = styled(Button)({
  background: 'linear-gradient(135deg, #00b894 0%, #ffa502 100%)',
  color: 'white',
  padding: '12px 24px',
  borderRadius: '12px',
  fontWeight: 600,
  fontSize: '15px',
  textTransform: 'none',
  '&:hover': {
    background: 'linear-gradient(135deg, #00d2a0 0%, #ffb52f 100%)',
    transform: 'translateY(-2px)',
    boxShadow: '0 8px 15px rgba(0, 184, 148, 0.2)',
  },
  transition: 'all 0.3s ease-in-out',
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.05)',
    },
    '&.Mui-focused': {
      background: 'rgba(255, 255, 255, 0.07)',
    }
  }
});

const StyledDateTimePicker = styled(DateTimePicker)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.05)',
    },
    '&.Mui-focused': {
      background: 'rgba(255, 255, 255, 0.07)',
    }
  }
});

const StyledFormControl = styled(FormControl)({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: 'rgba(255, 255, 255, 0.03)',
    '&:hover': {
      background: 'rgba(255, 255, 255, 0.05)',
    },
    '&.Mui-focused': {
      background: 'rgba(255, 255, 255, 0.07)',
    }
  }
});

const InputGroup = styled('div')({
  display: 'flex',
  gap: '16px',
  '& .date-picker': {
    flex: 2
  },
  '& .reminder-select': {
    flex: 1
  }
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
    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
      <StyledContainer>
        <Typography variant="h4" sx={{ 
          fontSize: '28px',
          fontWeight: 700,
          background: 'linear-gradient(135deg, #00b894 0%, #ffa502 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          mb: 3,
        }}>
          Nová preprava
        </Typography>

        {error && (
          <Alert 
            severity="error" 
            sx={{ 
              mb: 3, 
              borderRadius: '12px',
              '& .MuiAlert-icon': {
                color: '#ff6b6b'
              }
            }}
          >
            {error}
          </Alert>
        )}

        {success && (
          <Alert 
            severity="success" 
            sx={{ 
              mb: 3, 
              borderRadius: '12px',
              '& .MuiAlert-icon': {
                color: '#00b894'
              }
            }}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <StyledTextField
            fullWidth
            label="Číslo objednávky"
            value={formData.orderNumber}
            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
            required
            sx={{ mb: 3 }}
          />

          <FormSection>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '18px',
                fontWeight: 600,
                color: '#00b894',
              }}
            >
              Naloženie
            </Typography>

            <StyledTextField
              fullWidth
              label="Adresa naloženia"
              value={formData.loadingAddress}
              onChange={(e) => setFormData({ ...formData, loadingAddress: e.target.value })}
              required
            />

            <InputGroup>
              <StyledDateTimePicker
                className="date-picker"
                label="Dátum a čas naloženia"
                value={formData.loadingDateTime}
                onChange={(newValue: Date | null) => setFormData({ ...formData, loadingDateTime: newValue })}
              />

              <StyledFormControl className="reminder-select">
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
              </StyledFormControl>
            </InputGroup>
          </FormSection>

          <FormSection sx={{ mt: 4 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                fontSize: '18px',
                fontWeight: 600,
                color: '#ffa502',
              }}
            >
              Vyloženie
            </Typography>

            <StyledTextField
              fullWidth
              label="Adresa vyloženia"
              value={formData.unloadingAddress}
              onChange={(e) => setFormData({ ...formData, unloadingAddress: e.target.value })}
              required
            />

            <InputGroup>
              <StyledDateTimePicker
                className="date-picker"
                label="Dátum a čas vyloženia"
                value={formData.unloadingDateTime}
                onChange={(newValue: Date | null) => setFormData({ ...formData, unloadingDateTime: newValue })}
              />

              <StyledFormControl className="reminder-select">
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
              </StyledFormControl>
            </InputGroup>
          </FormSection>

          <GradientButton
            type="submit"
            variant="contained"
            fullWidth
            size="large"
            sx={{ mt: 4 }}
          >
            Vytvoriť prepravu
          </GradientButton>
        </form>
      </StyledContainer>
    </LocalizationProvider>
  );
}

export default Transport; 