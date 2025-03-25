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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { collection, addDoc, query, deleteDoc, doc, updateDoc, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';
import SearchField from './common/SearchField';

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
  position: 'relative'
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  position: 'relative',
  zIndex: 1,
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

const ContactCard = styled(Paper)({
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

const Contacts = () => {
  const { userData } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
  const [touchedFields, setTouchedFields] = useState<Record<string, boolean>>({});
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

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
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
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
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

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Kontakty</PageTitle>
        <AddButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Pridať kontakt
        </AddButton>
      </PageHeader>

      <SearchWrapper>
        <SearchField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          label="Vyhľadať kontakt"
        />
      </SearchWrapper>

      <TableContainer 
        component={Paper} 
        sx={{ 
          mt: 2, 
          backgroundColor: 'transparent',
          overflowX: 'auto',
          width: '100%',
          '& .MuiTable-root': {
            minWidth: {
              xs: '800px',
              md: '100%'
            }
          },
          '& .MuiTableCell-root': {
            padding: {
              xs: '12px 8px',
              sm: '16px'
            },
            fontSize: {
              xs: '0.8rem',
              sm: '0.875rem'
            },
            whiteSpace: 'nowrap',
            color: '#ffffff',
            backgroundColor: colors.primary.light,
            borderBottom: '1px solid rgba(255, 255, 255, 0.1)'
          },
          '& .MuiTableHead-root': {
            '& .MuiTableCell-root': {
              fontWeight: 600,
              backgroundColor: colors.primary.light,
              borderBottom: '2px solid rgba(255, 255, 255, 0.15)'
            }
          },
          '& .MuiTableBody-root': {
            '& .MuiTableRow-root': {
              '&:hover': {
                '& .MuiTableCell-root': {
                  backgroundColor: 'rgba(255, 159, 67, 0.1)'
                }
              }
            }
          }
        }}
      >
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
              <TableRow key={contact.id}>
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
                      onClick={() => contact.id && handleDelete(contact.id)} 
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
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

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
          {editingContact ? 'Upraviť kontakt' : 'Pridať nový kontakt'}
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
                  label="Názov firmy"
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
            {editingContact ? 'Uložiť zmeny' : 'Pridať kontakt'}
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
};

export default Contacts; 