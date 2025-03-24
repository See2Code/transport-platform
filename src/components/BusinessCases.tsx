import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Grid,
  Chip,
  Tooltip,
  styled,
  FormControl,
  InputLabel,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Alert,
  Snackbar,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { sk } from 'date-fns/locale';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import { collection, addDoc, getDocs, deleteDoc, doc, updateDoc, Timestamp, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/material.css';
import { useNavigate } from 'react-router-dom';

const euCountries = [
  { code: 'SK', name: 'Slovensko', flag: '🇸🇰', prefix: '+421' },
  { code: 'CZ', name: 'Česko', flag: '🇨🇿', prefix: '+420' },
  { code: 'HU', name: 'Maďarsko', flag: '🇭🇺', prefix: '+36' },
  { code: 'PL', name: 'Poľsko', flag: '🇵🇱', prefix: '+48' },
  { code: 'AT', name: 'Rakúsko', flag: '🇦🇹', prefix: '+43' },
  { code: 'DE', name: 'Nemecko', flag: '🇩🇪', prefix: '+49' },
];

// Definícia stavov obchodného prípadu
const caseStatuses = {
  CALLED: { label: 'Dovolaný', color: 'success' as const },
  NOT_CALLED: { label: 'Nedovolaný', color: 'error' as const },
  EMAIL_SENT: { label: 'Poslaný email', color: 'info' as const },
  IN_PROGRESS: { label: 'V štádiu riešenia', color: 'warning' as const },
  CALL_LATER: { label: 'Volať neskôr', color: 'secondary' as const },
  MEETING: { label: 'Stretnutie', color: 'primary' as const },
  CALL: { label: 'Telefonát', color: 'info' as const },
  INTERESTED: { label: 'Záujem', color: 'success' as const },
  NOT_INTERESTED: { label: 'Nezáujem', color: 'error' as const }
};

interface BusinessCase {
  id: string;
  companyName: string;
  vatNumber: string;
  companyAddress: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  internalNote: string;
  status: keyof typeof caseStatuses;
  reminderDateTime?: Date;
  reminderNote?: string;
  createdAt: Date;
  createdBy: {
    id: string;
    name: string;
  };
}

const PageWrapper = styled(Box)({
  padding: '30px',
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
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
    backgroundColor: '#00b894',
    borderRadius: '2px',
  }
});

const AddButton = styled(Button)({
  backgroundColor: '#00b894',
  '&:hover': {
    backgroundColor: '#00967e',
  },
});

export default function BusinessCases() {
  const [cases, setCases] = useState<BusinessCase[]>([]);
  const [open, setOpen] = useState(false);
  const [editCase, setEditCase] = useState<BusinessCase | null>(null);
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [formData, setFormData] = useState({
    companyName: '',
    vatNumber: '',
    companyAddress: '',
    contactPerson: {
      firstName: '',
      lastName: '',
      phone: '',
      email: '',
    },
    internalNote: '',
    status: 'NOT_CALLED' as keyof typeof caseStatuses,
    reminderDateTime: null as Date | null,
    reminderNote: '',
  });
  const [selectedCountry, setSelectedCountry] = useState(euCountries[0]);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
  }, [currentUser, navigate]);

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const casesCollection = collection(db, 'businessCases');
      const casesQuery = query(casesCollection, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(casesQuery);
      const casesData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt.toDate(),
        reminderDateTime: doc.data().reminderDateTime?.toDate(),
      })) as BusinessCase[];
      setCases(casesData);
    } catch (error) {
      console.error('Error fetching cases:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri načítaní prípadov',
        severity: 'error'
      });
    }
  };

  const handleSubmit = async () => {
    if (!currentUser) {
      console.error('No authenticated user');
      return;
    }

    try {
      const casesCollection = collection(db, 'businessCases');
      const caseData = {
        ...formData,
        createdAt: Timestamp.now(),
        createdBy: {
          id: currentUser.uid,
          name: currentUser.displayName || currentUser.email || 'Unknown User',
        },
      };

      // Vytvorenie alebo aktualizácia obchodného prípadu
      let savedCaseId = editCase?.id;
      
      if (editCase) {
        await updateDoc(doc(db, 'businessCases', editCase.id), caseData);
        setSnackbar({
          open: true,
          message: 'Prípad bol úspešne upravený',
          severity: 'success'
        });
      } else {
        const docRef = await addDoc(casesCollection, caseData);
        savedCaseId = docRef.id;
        setSnackbar({
          open: true,
          message: 'Nový prípad bol úspešne pridaný',
          severity: 'success'
        });
      }

      // Vytvorenie alebo aktualizácia kontaktu
      const contactsCollection = collection(db, 'contacts');
      const contactData = {
        firstName: formData.contactPerson.firstName,
        lastName: formData.contactPerson.lastName,
        company: formData.companyName,
        phonePrefix: selectedCountry.prefix,
        phoneNumber: formData.contactPerson.phone.replace(selectedCountry.prefix, ''),
        countryCode: selectedCountry.code.toLowerCase(),
        email: formData.contactPerson.email,
        createdAt: Timestamp.now(),
        createdBy: {
          firstName: currentUser.displayName?.split(' ')[0] || '',
          lastName: currentUser.displayName?.split(' ')[1] || '',
        },
        businessCaseId: savedCaseId, // Pridáme referenciu na obchodný prípad
      };

      await addDoc(contactsCollection, contactData);

      // Ak je nastavený reminder, vytvoríme email notifikáciu
      if (formData.reminderDateTime) {
        await addDoc(collection(db, 'reminders'), {
          userId: currentUser.uid,
          userEmail: currentUser.email,
          businessCaseId: savedCaseId,
          reminderDateTime: Timestamp.fromDate(formData.reminderDateTime),
          companyName: formData.companyName,
          reminderNote: formData.reminderNote || '',
          contactPerson: formData.contactPerson,
          createdAt: Timestamp.now(),
        });
      }

      setOpen(false);
      setEditCase(null);
      setFormData({
        companyName: '',
        vatNumber: '',
        companyAddress: '',
        contactPerson: {
          firstName: '',
          lastName: '',
          phone: '',
          email: '',
        },
        internalNote: '',
        status: 'NOT_CALLED',
        reminderDateTime: null,
        reminderNote: '',
      });
      fetchCases();
    } catch (error) {
      console.error('Error saving case:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri ukladaní prípadu',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Naozaj chcete vymazať tento obchodný prípad?')) {
      try {
        await deleteDoc(doc(db, 'businessCases', id));
        setSnackbar({
          open: true,
          message: 'Prípad bol úspešne vymazaný',
          severity: 'success'
        });
        fetchCases();
      } catch (error) {
        console.error('Error deleting case:', error);
        setSnackbar({
          open: true,
          message: 'Nastala chyba pri mazaní prípadu',
          severity: 'error'
        });
      }
    }
  };

  const handleEdit = (businessCase: BusinessCase) => {
    setEditCase(businessCase);
    setFormData({
      companyName: businessCase.companyName,
      vatNumber: businessCase.vatNumber,
      companyAddress: businessCase.companyAddress,
      contactPerson: businessCase.contactPerson,
      internalNote: businessCase.internalNote,
      status: businessCase.status,
      reminderDateTime: businessCase.reminderDateTime || null,
      reminderNote: businessCase.reminderNote || '',
    });
    setOpen(true);
  };

  const handleCountryChange = (event: any) => {
    const country = euCountries.find(c => c.code === event.target.value);
    if (country) {
      setSelectedCountry(country);
      // Ak je telefónne číslo prázdne, pridáme predvolbu
      if (!formData.contactPerson.phone) {
        setFormData({
          ...formData,
          contactPerson: { ...formData.contactPerson, phone: country.prefix }
        });
      }
    }
  };

  const filteredCases = cases.filter(businessCase =>
    Object.values(businessCase)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Obchodné prípady</PageTitle>
        <AddButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Pridať prípad
        </AddButton>
      </PageHeader>

      <TextField
        fullWidth
        label="Vyhľadať prípad"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Vytvorené</TableCell>
              <TableCell>Vytvoril</TableCell>
              <TableCell>Firma</TableCell>
              <TableCell>IČ DPH</TableCell>
              <TableCell>Kontaktná osoba</TableCell>
              <TableCell>Kontakt</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Pripomienka</TableCell>
              <TableCell>Akcie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCases.map((businessCase) => (
              <TableRow key={businessCase.id}>
                <TableCell>
                  {businessCase.createdAt.toLocaleDateString('sk-SK')}
                </TableCell>
                <TableCell>
                  {businessCase.createdBy.name}
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" />
                    {businessCase.companyName}
                  </Box>
                </TableCell>
                <TableCell>{businessCase.vatNumber}</TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PersonIcon fontSize="small" />
                    {businessCase.contactPerson.firstName} {businessCase.contactPerson.lastName}
                  </Box>
                </TableCell>
                <TableCell>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PhoneIcon fontSize="small" />
                      {businessCase.contactPerson.phone}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <EmailIcon fontSize="small" />
                      {businessCase.contactPerson.email}
                    </Box>
                  </Box>
                </TableCell>
                <TableCell>
                  <Chip
                    label={caseStatuses[businessCase.status].label}
                    color={caseStatuses[businessCase.status].color}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  {businessCase.reminderDateTime && (
                    <Tooltip title="Pripomienka">
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon fontSize="small" />
                        {businessCase.reminderDateTime.toLocaleString('sk-SK')}
                      </Box>
                    </Tooltip>
                  )}
                </TableCell>
                <TableCell>
                  <IconButton onClick={() => handleEdit(businessCase)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(businessCase.id)}>
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog
        open={open}
        onClose={() => {
          setOpen(false);
          setEditCase(null);
          setFormData({
            companyName: '',
            vatNumber: '',
            companyAddress: '',
            contactPerson: {
              firstName: '',
              lastName: '',
              phone: '',
              email: '',
            },
            internalNote: '',
            status: 'NOT_CALLED',
            reminderDateTime: null,
            reminderNote: '',
          });
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editCase ? 'Upraviť obchodný prípad' : 'Nový obchodný prípad'}
        </DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Názov firmy"
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="IČ DPH"
                value={formData.vatNumber}
                onChange={(e) => setFormData({ ...formData, vatNumber: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Adresa spoločnosti"
                value={formData.companyAddress}
                onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Meno"
                value={formData.contactPerson.firstName}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, firstName: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={formData.contactPerson.lastName}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, lastName: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <FormControl sx={{ minWidth: 120 }}>
                  <Select
                    value={selectedCountry.code}
                    onChange={handleCountryChange}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      color: '#ffffff',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.1)',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'rgba(255, 255, 255, 0.2)',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#00b894',
                      },
                      '& .MuiSelect-icon': {
                        color: 'rgba(255, 255, 255, 0.5)',
                      }
                    }}
                  >
                    {euCountries.map((country) => (
                      <MenuItem key={country.code} value={country.code}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <span>{country.flag}</span>
                          <span>{country.prefix}</span>
                        </Box>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="Telefónne číslo"
                  value={formData.contactPerson.phone?.replace(selectedCountry.prefix, '') || ''}
                  onChange={(e) => setFormData({
                    ...formData,
                    contactPerson: { ...formData.contactPerson, phone: selectedCountry.prefix + e.target.value }
                  })}
                  placeholder="9XX XXX XXX"
                  helperText="Zadajte telefónne číslo"
                  required
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      color: '#ffffff',
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
                      color: 'rgba(255, 255, 255, 0.5)',
                      '&.Mui-focused': {
                        color: '#00b894',
                      },
                    },
                    '& .MuiFormHelperText-root': {
                      color: 'rgba(255, 255, 255, 0.5)',
                      fontSize: '0.75rem',
                      marginLeft: 0,
                      marginTop: '4px',
                    }
                  }}
                />
              </Box>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={formData.contactPerson.email}
                onChange={(e) => setFormData({
                  ...formData,
                  contactPerson: { ...formData.contactPerson, email: e.target.value }
                })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Interná poznámka"
                multiline
                rows={4}
                value={formData.internalNote}
                onChange={(e) => setFormData({ ...formData, internalNote: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.status}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as keyof typeof caseStatuses })}
                >
                  {Object.entries(caseStatuses).map(([key, value]) => (
                    <MenuItem key={key} value={key}>
                      {value.label}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                <DateTimePicker
                  label="Dátum a čas pripomienky"
                  value={formData.reminderDateTime}
                  onChange={(newValue) => setFormData({ ...formData, reminderDateTime: newValue })}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Poznámka k pripomienke"
                multiline
                rows={2}
                value={formData.reminderNote}
                onChange={(e) => setFormData({ ...formData, reminderNote: e.target.value })}
                placeholder="Zadajte text pripomienky, ktorý vám príde emailom"
                helperText="Tento text vám príde emailom v čase pripomienky"
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => {
            setOpen(false);
            setEditCase(null);
          }}>
            Zrušiť
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            sx={{ backgroundColor: '#00b894' }}
            disabled={!formData.companyName || 
                     !formData.contactPerson.firstName || 
                     !formData.contactPerson.lastName || 
                     !formData.contactPerson.email ||
                     !formData.contactPerson.phone}
          >
            {editCase ? 'Uložiť zmeny' : 'Pridať prípad'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </PageWrapper>
  );
} 