import React, { useState, useEffect } from 'react';
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
  CircularProgress
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useNavigate, useSearchParams } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const countries = [
  { code: 'SK', name: 'Slovensko' },
  { code: 'CZ', name: 'Česko' },
  { code: 'HU', name: 'Maďarsko' },
  { code: 'PL', name: 'Poľsko' },
  { code: 'AT', name: 'Rakúsko' },
  { code: 'DE', name: 'Nemecko' },
  { code: 'GB', name: 'Veľká Británia' },
  { code: 'US', name: 'USA' },
  { code: 'FR', name: 'Francúzsko' },
  { code: 'IT', name: 'Taliansko' },
  { code: 'ES', name: 'Španielsko' },
  { code: 'PT', name: 'Portugalsko' },
  { code: 'NL', name: 'Holandsko' },
  { code: 'BE', name: 'Belgicko' },
  { code: 'CH', name: 'Švajčiarsko' },
  { code: 'SE', name: 'Švédsko' },
  { code: 'NO', name: 'Nórsko' },
  { code: 'DK', name: 'Dánsko' },
  { code: 'FI', name: 'Fínsko' },
  { code: 'IE', name: 'Írsko' }
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
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
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
  const [invitation, setInvitation] = useState<any>(null);

  useEffect(() => {
    const invitationId = searchParams.get('invitationId');
    if (!invitationId) {
      setError('Neplatná pozvánka');
      return;
    }

    const fetchInvitation = async () => {
      try {
        const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));
        if (!invitationDoc.exists()) {
          setError('Pozvánka nebola nájdená');
          return;
        }

        const invitationData = invitationDoc.data();
        if (invitationData.status !== 'pending') {
          setError('Táto pozvánka už bola použitá');
          return;
        }

        setInvitation(invitationData);
      } catch (err) {
        console.error('Chyba pri načítaní pozvánky:', err);
        setError('Nepodarilo sa načítať pozvánku');
      }
    };

    fetchInvitation();
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (e: any) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePhoneChange = (value: string) => {
    setFormData(prev => ({
      ...prev,
      phone: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invitation) return;

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

      // Vytvorenie používateľského účtu
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.email,
        formData.password
      );

      // Generovanie companyID
      const companyID = generateCompanyID(formData.companyName);

      // Aktualizácia pozvánky
      await updateDoc(doc(db, 'invitations', searchParams.get('invitationId')!), {
        status: 'accepted',
        userId: userCredential.user.uid
      });

      // Vytvorenie používateľského profilu
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        phone: invitation.phone,
        companyID,
        role: invitation.role,
        createdAt: new Date().toISOString(),
        // Ak je používateľ admin, nastavíme status na active
        status: invitation.role === 'admin' ? 'active' : 'pending'
      });

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

          <Typography variant="h4" component="h1" gutterBottom align="center" color="success.main">
            Registrácia úspešná!
          </Typography>

          <Alert severity="success" sx={{ mb: 3 }}>
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
              backgroundColor: 'primary.main',
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
            color="primary"
            onClick={() => navigate('/login')}
            sx={{ mt: 3 }}
          >
            Prihlásiť sa
          </Button>
        </Paper>
      </Container>
    );
  }

  if (!invitation) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
            <CircularProgress />
          </Box>
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
          Dokončenie registrácie
        </Typography>

        <Typography variant="body1" gutterBottom>
          Vitajte {invitation.firstName} {invitation.lastName}!
        </Typography>
        <Typography variant="body1" gutterBottom>
          Pre dokončenie registrácie si prosím nastavte heslo.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Osobné údaje
              </Typography>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ position: 'relative' }}>
                <PhoneInput
                  country={'sk'}
                  value={formData.phone}
                  onChange={handlePhoneChange}
                  inputStyle={{
                    width: '100%',
                    height: '56px',
                    fontSize: '16px',
                    paddingLeft: '48px',
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: '4px',
                    backgroundColor: 'transparent'
                  }}
                  buttonStyle={{
                    border: 'none',
                    borderRight: '1px solid rgba(0, 0, 0, 0.23)',
                    backgroundColor: 'transparent'
                  }}
                  containerStyle={{
                    width: '100%'
                  }}
                  dropdownStyle={{
                    width: '300px'
                  }}
                  searchStyle={{
                    width: '100%',
                    padding: '8px'
                  }}
                  placeholder="Telefónne číslo"
                  enableSearch
                  searchPlaceholder="Vyhľadať krajinu..."
                />
              </Box>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Heslo"
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Potvrďte heslo"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Údaje o firme
              </Typography>
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov firmy"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Ulica"
                name="street"
                value={formData.street}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="PSČ"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Mesto"
                name="city"
                value={formData.city}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth required>
                <InputLabel>Krajina</InputLabel>
                <Select
                  name="country"
                  value={formData.country}
                  onChange={handleSelectChange}
                  label="Krajina"
                >
                  {countries.map((country) => (
                    <MenuItem key={country.code} value={country.code}>
                      {country.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IČO"
                name="ico"
                value={formData.ico}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="IČ DPH"
                name="icDph"
                value={formData.icDph}
                onChange={handleChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                fullWidth
                variant="contained"
                color="primary"
                type="submit"
                size="large"
                disabled={loading}
              >
                {loading ? <CircularProgress size={20} /> : 'Dokončiť registráciu'}
              </Button>
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  Už máte účet?{' '}
                  <Link href="/login" color="primary">
                    Prihláste sa
                  </Link>
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}

export default Register; 