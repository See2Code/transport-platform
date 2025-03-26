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

// Definícia farebnej palety
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
    light: '#ff8787',
    dark: '#fa5252',
  }
};

const StyledContainer = styled(Container)({
  backgroundColor: colors.primary.light,
  backdropFilter: 'blur(20px)',
  borderRadius: '24px',
  padding: '32px',
  color: '#ffffff',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  width: '100%',
  maxWidth: '100% !important',
  margin: 0,
});

const FormSection = styled('div')({
  marginBottom: '32px',
});

const SectionTitle = styled(Typography)({
  fontSize: '1.25rem',
  fontWeight: 600,
  marginBottom: '24px',
  color: '#ffffff',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '40px',
    height: '3px',
    backgroundColor: colors.accent.main,
    borderRadius: '2px',
  }
});

const InputGroup = styled('div')({
  display: 'flex',
  gap: '16px',
  marginBottom: '24px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
  }
});

const StyledTextField = styled(TextField)({
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accent.main,
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#ffffff',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: colors.accent.main,
    },
  },
  '& .MuiSelect-icon': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiSelect-select': {
    '&:focus': {
      backgroundColor: 'transparent',
    },
  },
  '& .MuiMenuItem-root': {
    color: '#ffffff',
  },
});

const StyledDateTimePicker = styled(DateTimePicker)({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: '12px',
    transition: 'all 0.2s ease-in-out',
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.1)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    '&.Mui-focused fieldset': {
      borderColor: colors.accent.main,
    },
  },
  '& .MuiOutlinedInput-input': {
    color: '#ffffff',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&.Mui-focused': {
      color: colors.accent.main,
    },
  },
  '& .MuiIconButton-root': {
    color: 'rgba(255, 255, 255, 0.7)',
    '&:hover': {
      backgroundColor: 'rgba(255, 255, 255, 0.1)',
    },
  },
});

const SubmitButton = styled(Button)({
  backgroundColor: colors.accent.main,
  color: '#ffffff',
  padding: '12px 32px',
  borderRadius: '12px',
  fontSize: '1rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)',
  '&:hover': {
    backgroundColor: colors.accent.light,
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 184, 148, 0.4)',
  },
  '&:active': {
    transform: 'translateY(0)',
  },
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
        <FormSection>
          <SectionTitle variant="h2">
            Nová preprava
          </SectionTitle>
          <StyledTextField
            fullWidth
            label="Číslo objednávky"
            value={formData.orderNumber}
            onChange={(e) => setFormData({ ...formData, orderNumber: e.target.value })}
            required
            margin="normal"
          />
        </FormSection>

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
                color: '#ff9f43'
              }
            }}
          >
            {success}
          </Alert>
        )}

        <form onSubmit={handleSubmit}>
          <FormSection>
            <SectionTitle variant="h2">
              Naloženie
            </SectionTitle>
            <StyledTextField
              fullWidth
              label="Adresa naloženia"
              value={formData.loadingAddress}
              onChange={(e) => setFormData({ ...formData, loadingAddress: e.target.value })}
              required
              margin="normal"
            />
            <InputGroup>
              <StyledDateTimePicker
                label="Dátum a čas naloženia"
                value={formData.loadingDateTime}
                onChange={(newValue: Date | null) => setFormData({ ...formData, loadingDateTime: newValue })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  }
                }}
              />
              <StyledTextField
                select
                fullWidth
                label="Pripomienka"
                value={formData.loadingReminder.toString()}
                onChange={(e) => setFormData({ ...formData, loadingReminder: Number(e.target.value) })}
                variant="outlined"
                SelectProps={{
                  native: true,
                }}
              >
                {reminderOptions.map((hours) => (
                  <option key={hours} value={hours}>
                    {hours} {hours === 1 ? 'hodinu' : hours < 5 ? 'hodiny' : 'hodín'}
                  </option>
                ))}
              </StyledTextField>
            </InputGroup>
          </FormSection>

          <FormSection>
            <SectionTitle variant="h2">
              Vyloženie
            </SectionTitle>
            <StyledTextField
              fullWidth
              label="Adresa vyloženia"
              value={formData.unloadingAddress}
              onChange={(e) => setFormData({ ...formData, unloadingAddress: e.target.value })}
              required
              margin="normal"
            />
            <InputGroup>
              <StyledDateTimePicker
                label="Dátum a čas vyloženia"
                value={formData.unloadingDateTime}
                onChange={(newValue: Date | null) => setFormData({ ...formData, unloadingDateTime: newValue })}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                  }
                }}
              />
              <StyledTextField
                select
                fullWidth
                label="Pripomienka"
                value={formData.unloadingReminder.toString()}
                onChange={(e) => setFormData({ ...formData, unloadingReminder: Number(e.target.value) })}
                variant="outlined"
                SelectProps={{
                  native: true,
                }}
              >
                {reminderOptions.map((hours) => (
                  <option key={hours} value={hours}>
                    {hours} {hours === 1 ? 'hodinu' : hours < 5 ? 'hodiny' : 'hodín'}
                  </option>
                ))}
              </StyledTextField>
            </InputGroup>
          </FormSection>

          <SubmitButton variant="contained" fullWidth>
            Vytvoriť prepravu
          </SubmitButton>
        </form>
      </StyledContainer>
    </LocalizationProvider>
  );
}

export default Transport; 