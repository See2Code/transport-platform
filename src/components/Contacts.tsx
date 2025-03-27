import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  MenuItem,
  SelectChangeEvent,
  Alert,
  Snackbar,
  FormControl,
  InputLabel,
  Grid,
  DialogContentText,
  CircularProgress,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { collection, addDoc, query, deleteDoc, doc, updateDoc, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import SearchField from './common/SearchField';
import { useMediaQuery } from '@mui/material';
import { Phone as PhoneIcon, Email as EmailIcon, Person as PersonIcon, AccessTime as AccessTimeIcon } from '@mui/icons-material';
import { useThemeMode } from '../contexts/ThemeContext';

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

interface Contact {
  id: string;
  firstName: string;
  lastName: string;
  company: string;
  phonePrefix: string;
  phoneNumber: string;
  countryCode: string;
  email: string;
  notes?: string;
  createdAt: Timestamp;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

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
  position: 'relative',
  maxWidth: '100%',
  overflowX: 'hidden',
  '@media (max-width: 600px)': {
    padding: '8px',
    paddingBottom: '80px'
  }
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  position: 'relative',
  zIndex: 1,
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    gap: '16px',
    alignItems: 'flex-start',
    padding: '16px 0'
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
  },
  '@media (max-width: 600px)': {
    fontSize: '1.5rem'
  }
}));

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
  },
  '@media (max-width: 600px)': {
    width: '100%',
    justifyContent: 'center'
  }
});

const ContactCard = styled(Paper)({
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
  }
});

const ContactInfo = styled(Box)({
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

const ContactName = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: colors.accent.main,
});

const SearchWrapper = styled(Box)({
  marginBottom: '24px',
  position: 'relative',
  zIndex: 1,
  maxWidth: '600px',
  width: '100%',
  '@media (max-width: 600px)': {
    maxWidth: '100%',
  }
});

const SearchLabel = styled(Typography)({
  color: colors.accent.main,
  fontSize: '1rem',
  marginBottom: '8px',
  fontWeight: 500,
});

const MobileContactCard = styled(Box)({
  backgroundColor: colors.background.main,
  borderRadius: '16px',
  padding: '16px',
  color: '#ffffff',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  border: '1px solid rgba(255, 255, 255, 0.06)',
  marginBottom: '16px',
  width: '100%'
});

const MobileCardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: '12px'
});

const MobileCompanyName = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: colors.accent.main
});

const MobileCardContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '12px'
});

const MobileInfoRow = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  fontSize: '0.9rem',
  '& .MuiSvgIcon-root': {
    fontSize: '1.1rem',
    color: colors.accent.main
  }
});

const MobileCardActions = styled(Box)({
  display: 'flex',
  justifyContent: 'flex-end',
  gap: '8px',
  marginTop: '12px',
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  paddingTop: '12px'
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
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  color: isDarkMode ? '#ffffff' : '#000000',
  padding: '24px',
  borderRadius: '20px',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  backdropFilter: 'blur(20px)',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.15)',
  '& .MuiDialog-paper': {
    backgroundColor: 'transparent',
    boxShadow: 'none',
    margin: 0,
  },
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
    padding: '24px 24px 16px 24px',
    '& .MuiTypography-root': {
      fontSize: '1.5rem',
      fontWeight: 600,
    }
  },
  '& .MuiDialogContent-root': {
    padding: '16px 24px',
    '& .MuiFormLabel-root': {
      color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    },
    '& .MuiInputBase-root': {
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
    '& .MuiButton-root': {
      borderRadius: '12px',
      padding: '8px 24px',
      textTransform: 'none',
      fontSize: '1rem',
    }
  }
}));

const Contacts = () => {
  const { userData } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [open, setOpen] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [contactToDelete, setContactToDelete] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Omit<Contact, 'id'>>({
    firstName: '',
    lastName: '',
    company: '',
    phonePrefix: '+421',
    phoneNumber: '',
    countryCode: 'sk',
    email: '',
    createdAt: Timestamp.fromDate(new Date()),
    createdBy: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || ''
    }
  });
  const [users, setUsers] = useState<User[]>([]);
  const { isDarkMode } = useThemeMode();

  useEffect(() => {
    const q = query(collection(db, 'contacts'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const contactsList = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Contact[];
      setContacts(contactsList);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (userData && !editingContact) {
      setFormData(prev => ({
        ...prev,
        createdBy: {
          firstName: userData.firstName || '',
          lastName: userData.lastName || ''
        }
      }));
    }
  }, [userData, editingContact]);

  useEffect(() => {
    const fetchUsers = async () => {
      const usersRef = collection(db, 'users');
      const q = query(usersRef);
      const querySnapshot = await getDocs(q);
      const usersList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as User[];
      setUsers(usersList);
    };
    fetchUsers();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setTouchedFields(prev => ({ ...prev, [name]: true }));
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

  const handleCreatorChange = (e: SelectChangeEvent) => {
    const selectedUser = users.find(user => user.email === e.target.value);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        createdBy: {
          firstName: selectedUser.firstName,
          lastName: selectedUser.lastName
        }
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!userData) {
        setSnackbar({
          open: true,
          message: 'Nie ste prihlásený',
          severity: 'error'
        });
        return;
      }

      const contactData = {
        ...formData,
        createdAt: editingContact?.createdAt || Timestamp.fromDate(new Date()),
        createdBy: {
          firstName: userData.firstName,
          lastName: userData.lastName
        }
      };

      if (editingContact?.id) {
        await updateDoc(doc(db, 'contacts', editingContact.id), contactData);
        setSnackbar({
          open: true,
          message: 'Kontakt bol úspešne upravený',
          severity: 'success'
        });
      } else {
        await addDoc(collection(db, 'contacts'), contactData);
        setSnackbar({
          open: true,
          message: 'Nový kontakt bol úspešne pridaný',
          severity: 'success'
        });
      }

      handleCloseDialog();
      setEditingContact(null);
      setFormData({
        firstName: '',
        lastName: '',
        company: '',
        phonePrefix: '+421',
        phoneNumber: '',
        countryCode: 'sk',
        email: '',
        createdAt: Timestamp.fromDate(new Date()),
        createdBy: {
          firstName: userData?.firstName || '',
          lastName: userData?.lastName || ''
        }
      });
      setTouchedFields({});
    } catch (error) {
      console.error('Chyba pri ukladaní kontaktu:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri ukladaní kontaktu',
        severity: 'error'
      });
    }
  };

  const handleDelete = async (contact: Contact) => {
    setContactToDelete(contact);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!contactToDelete) return;
    
    try {
      setLoading(true);
      await deleteDoc(doc(db, 'contacts', contactToDelete.id));
      setSnackbar({
        open: true,
        message: 'Kontakt bol úspešne odstránený',
        severity: 'success'
      });
    } catch (error) {
      console.error('Chyba pri mazaní kontaktu:', error);
      setSnackbar({
        open: true,
        message: 'Nastala chyba pri mazaní kontaktu',
        severity: 'error'
      });
    } finally {
      setLoading(false);
      setDeleteConfirmOpen(false);
      setContactToDelete(null);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      phonePrefix: contact.phonePrefix,
      phoneNumber: contact.phoneNumber,
      countryCode: contact.countryCode,
      email: contact.email,
      notes: contact.notes || '',
      createdAt: contact.createdAt,
      createdBy: {
        firstName: contact.createdBy?.firstName || userData?.firstName || '',
        lastName: contact.createdBy?.lastName || userData?.lastName || ''
      }
    });
    setOpen(true);
  };

  const handleCloseDialog = () => {
    setOpen(false);
    setEditingContact(null);
    setFormData({
      firstName: '',
      lastName: '',
      company: '',
      phonePrefix: '+421',
      phoneNumber: '',
      countryCode: 'sk',
      email: '',
      createdAt: Timestamp.fromDate(new Date()),
      createdBy: {
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || ''
      }
    });
    setTouchedFields({});
  };

  const filteredContacts = contacts.filter(contact =>
    Object.values(contact)
      .join(' ')
      .toLowerCase()
      .includes(searchTerm.toLowerCase())
  );

  const renderMobileContact = (contact: Contact) => (
    <MobileContactCard key={contact.id}>
      <MobileCardHeader>
        <Box>
          <MobileCompanyName>{contact.company}</MobileCompanyName>
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {contact.firstName} {contact.lastName}
          </Typography>
        </Box>
      </MobileCardHeader>

      <MobileCardContent>
        <MobileInfoRow>
          <PhoneIcon />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <img
              loading="lazy"
              width="20"
              src={`https://flagcdn.com/${contact.countryCode}.svg`}
              alt=""
            />
            {contact.phonePrefix} {contact.phoneNumber}
          </Box>
        </MobileInfoRow>

        <MobileInfoRow>
          <EmailIcon />
          {contact.email}
        </MobileInfoRow>

        {contact.notes && (
          <MobileInfoRow>
            <Box sx={{ color: 'rgba(255, 255, 255, 0.7)', fontSize: '0.85rem' }}>
              {contact.notes}
            </Box>
          </MobileInfoRow>
        )}

        {contact.createdBy && (
          <MobileInfoRow>
            <PersonIcon />
            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
              {contact.createdBy.firstName} {contact.createdBy.lastName}
            </Typography>
          </MobileInfoRow>
        )}

        <MobileInfoRow>
          <AccessTimeIcon />
          <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
            {contact.createdAt?.toDate().toLocaleString('sk-SK', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </Typography>
        </MobileInfoRow>
      </MobileCardContent>

      <MobileCardActions>
        <IconButton 
          onClick={() => handleEdit(contact)}
          sx={{ 
            color: colors.accent.main,
            backgroundColor: 'rgba(255, 159, 67, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(255, 159, 67, 0.2)'
            }
          }}
        >
          <EditIcon />
        </IconButton>
        <IconButton 
          onClick={() => contact.id && handleDelete(contact)} 
          sx={{ 
            color: colors.secondary.main,
            '&:hover': {
              backgroundColor: 'rgba(255, 107, 107, 0.1)'
            }
          }}
        >
          <DeleteIcon />
        </IconButton>
      </MobileCardActions>
    </MobileContactCard>
  );

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Kontakty</PageTitle>
        <AddButton
          startIcon={<AddIcon />}
          onClick={() => setOpen(true)}
        >
          Pridať kontakt
        </AddButton>
      </PageHeader>

      <SearchWrapper>
        <SearchField
          placeholder="Vyhľadať kontakt..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </SearchWrapper>

      {useMediaQuery('(max-width: 600px)') ? (
        <Box>
          {filteredContacts.map(contact => renderMobileContact(contact))}
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{
          backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
          borderRadius: '20px',
          border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
          boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
        }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Spoločnosť</TableCell>
                <TableCell>Kontaktná osoba</TableCell>
                <TableCell>Mobil</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Vytvoril</TableCell>
                <TableCell>Dátum vytvorenia</TableCell>
                <TableCell>Poznámka</TableCell>
                <TableCell>Akcie</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredContacts.map((contact) => (
                <StyledTableRow isDarkMode={isDarkMode} key={contact.id}>
                  <TableCell>{contact.company}</TableCell>
                  <TableCell>{contact.firstName} {contact.lastName}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <img
                        loading="lazy"
                        width="20"
                        src={`https://flagcdn.com/${contact.countryCode}.svg`}
                        alt=""
                      />
                      {contact.phonePrefix} {contact.phoneNumber}
                    </Box>
                  </TableCell>
                  <TableCell>{contact.email}</TableCell>
                  <TableCell>{contact.createdBy?.firstName} {contact.createdBy?.lastName}</TableCell>
                  <TableCell sx={{ whiteSpace: 'nowrap' }}>
                    {contact.createdAt?.toDate().toLocaleString('sk-SK', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </TableCell>
                  <TableCell sx={{ maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {contact.notes || ''}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <IconButton 
                        onClick={() => handleEdit(contact)} 
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
                        onClick={() => contact.id && handleDelete(contact)} 
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
                </StyledTableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
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
          <DialogTitle>Pridať nový kontakt</DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Spoločnosť"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Meno"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Priezvisko"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <FormControl fullWidth>
                  <InputLabel>Krajina</InputLabel>
                  <Select
                    value={formData.countryCode}
                    onChange={handleCountryChange}
                    label="Krajina"
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
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                  InputProps={{
                    startAdornment: (
                      <Box component="span" sx={{ mr: 1, color: 'rgba(255, 255, 255, 0.7)' }}>
                        {formData.phonePrefix}
                      </Box>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Poznámka"
                  multiline
                  rows={4}
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpen(false)} sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>
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
              Pridať kontakt
            </Button>
          </DialogActions>
        </StyledDialogContent>
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
              Ste si istý, že chcete vymazať kontakt {contactToDelete?.firstName} {contactToDelete?.lastName}? Táto akcia je nezvratná.
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
              aria-label="Vymazať kontakt"
            >
              Vymazať kontakt
            </Button>
          </DialogActions>
        </StyledDialogContent>
      </Dialog>
    </PageWrapper>
  );
};

export default Contacts; 