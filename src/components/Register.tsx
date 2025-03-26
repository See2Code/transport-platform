import React, { useState } from 'react';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Grid,
  IconButton,
  Box,
  Link,
  Divider,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  SelectChangeEvent
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

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
];

function generateCompanyID(companyName: string): string {
  // Vytvoríme základný identifikátor z názvu firmy
  const base = companyName
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 4);
  
  // Pridáme náhodné číslo
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  
  // Pridáme timestamp
  const timestamp = Date.now().toString().slice(-4);
  
  return `${base}-${random}-${timestamp}`;
}

function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phonePrefix: '+421',
    phoneNumber: '',
    countryCode: 'sk',
    password: '',
    confirmPassword: '',
    companyName: '',
    street: '',
    zipCode: '',
    city: '',
    country: 'SK',
    ico: '',
    icDph: '',
    companyID: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCountryChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    const country = countries.find(c => c.code === value);
    if (country) {
      setFormData(prev => ({
        ...prev,
        countryCode: value,
        phonePrefix: country.prefix
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      setError('Heslá sa nezhodujú');
      return;
    }

    if (formData.password.length < 6) {
      setError('Heslo musí mať aspoň 6 znakov');
      return;
    }

    try {
      setLoading(true);
      setError('');

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const companyID = generateCompanyID(formData.companyName);

      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: formData.email,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phonePrefix: formData.phonePrefix,
        phoneNumber: formData.phoneNumber,
        countryCode: formData.countryCode,
        companyID,
        role: 'admin',
        createdAt: new Date().toISOString(),
        status: 'active'
      });

      await setDoc(doc(db, 'companies', companyID), {
        companyName: formData.companyName,
        street: formData.street,
        zipCode: formData.zipCode,
        city: formData.city,
        country: formData.country,
        ico: formData.ico,
        icDph: formData.icDph,
        createdAt: new Date().toISOString()
      });

      setFormData(prev => ({
        ...prev,
        companyID
      }));
      setRegistrationSuccess(true);
    } catch (err: any) {
      console.error('Chyba pri registrácii:', err);
      setError(err.message || 'Nastala chyba pri registrácii');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    navigate('/');
  };

  if (registrationSuccess) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8, position: 'relative' }}>
          <IconButton
            onClick={handleClose}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8
            }}
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ color: '#ff9f43' }}>
            Registrácia úspešná!
          </Typography>

          <Alert 
            severity="success" 
            sx={{ 
              mb: 3,
              '& .MuiAlert-icon': {
                color: '#ff9f43'
              },
              '& .MuiAlert-message': {
                color: '#ff9f43'
              },
              backgroundColor: 'rgba(255, 159, 67, 0.1)',
            }}
          >
            Vaša firma bola úspešne zaregistrovaná.
          </Alert>

          <Typography variant="h6" gutterBottom>
            Váš Company ID:
          </Typography>
          <Paper 
            elevation={2} 
            sx={{ 
              p: 2, 
              mb: 3, 
              backgroundColor: '#ff9f43',
              color: 'white',
              textAlign: 'center',
              fontSize: '1.2rem',
              fontWeight: 'bold',
              wordBreak: 'break-all'
            }}
          >
            {formData.companyID}
          </Paper>

          <Typography variant="body1" gutterBottom color="warning.main">
            Prosím, uložte si tento Company ID. Budete ho potrebovať pre:
          </Typography>
          <ul>
            <li>Správu zamestnancov</li>
            <li>Pridávanie nových členov tímu</li>
            <li>Administráciu vašej firmy</li>
          </ul>

          <Button
            fullWidth
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{ 
              mt: 3,
              backgroundColor: '#ff9f43',
              '&:hover': {
                backgroundColor: '#ffbe76',
              }
            }}
          >
            Prihlásiť sa
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8, position: 'relative' }}>
        <IconButton
          onClick={handleClose}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8
          }}
        >
          <CloseIcon />
        </IconButton>

        <Typography variant="h4" component="h1" gutterBottom align="center">
          Registrácia novej firmy
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                name="firstName"
                label="Meno"
                value={formData.firstName}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="lastName"
                label="Priezvisko"
                value={formData.lastName}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="email"
                label="Email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Select
                  value={formData.countryCode}
                  onChange={handleCountryChange}
                  sx={{ width: '200px' }}
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
                <TextField
                  name="phoneNumber"
                  label={`Mobil (${formData.phonePrefix})`}
                  placeholder="910 XXX XXX"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  fullWidth
                  required
                />
              </Box>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="password"
                label="Heslo"
                type="password"
                value={formData.password}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="confirmPassword"
                label="Potvrdiť heslo"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }}>Údaje o firme</Divider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="companyName"
                label="Názov firmy"
                value={formData.companyName}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                name="street"
                label="Ulica"
                value={formData.street}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="zipCode"
                label="PSČ"
                value={formData.zipCode}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="city"
                label="Mesto"
                value={formData.city}
                onChange={handleChange}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Krajina</InputLabel>
                <Select
                  name="country"
                  value={formData.country}
                  onChange={handleSelectChange}
                  label="Krajina"
                >
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.code.toUpperCase()}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="ico"
                label="IČO"
                value={formData.ico}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                name="icDph"
                label="IČ DPH"
                value={formData.icDph}
                onChange={handleChange}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  backgroundColor: '#ff9f43',
                  '&:hover': {
                    backgroundColor: '#ffbe76',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(255, 159, 67, 0.3)',
                    color: 'rgba(255, 255, 255, 0.3)',
                  }
                }}
              >
                {loading ? <CircularProgress size={24} sx={{ color: '#ffffff' }} /> : 'Registrovať'}
              </Button>
            </Grid>
            <Grid item xs={12}>
              <Link href="/login" variant="body2" sx={{ 
                display: 'block', 
                textAlign: 'center',
                color: '#ff9f43',
                '&:hover': {
                  color: '#ffbe76'
                }
              }}>
                Máte už účet? Prihláste sa
              </Link>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default Register; 