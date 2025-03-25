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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { collection, addDoc, query, deleteDoc, doc, updateDoc, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import styled from '@emotion/styled';

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

const PageWrapper = styled(Box)({
  padding: '30px',
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
});

const AddContactButton = styled(Button)({
  backgroundColor: '#00b894',
  color: '#ffffff',
  padding: '8px 24px',
  borderRadius: '12px',
  fontSize: '0.95rem',
  fontWeight: 600,
  textTransform: 'none',
  transition: 'all 0.2s ease-in-out',
  boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)',
  '&:hover': {
    backgroundColor: '#00d2a0',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 184, 148, 0.4)',
  }
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
        <AddContactButton
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Pridať kontakt
        </AddContactButton>
      </PageHeader>

      <TextField
        fullWidth
        label="Vyhľadať kontakt"
        variant="outlined"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        sx={{ mb: 3 }}
      />

      <TableContainer component={Paper} sx={{ mt: 2, backgroundColor: 'transparent' }}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell sx={{ height: '60px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Spoločnosť</TableCell>
              <TableCell sx={{ height: '60px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Kontaktná osoba</TableCell>
              <TableCell sx={{ height: '60px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Mobil</TableCell>
              <TableCell sx={{ height: '60px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Email</TableCell>
              <TableCell sx={{ height: '60px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Vytvoril</TableCell>
              <TableCell sx={{ height: '60px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Dátum vytvorenia</TableCell>
              <TableCell sx={{ height: '60px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Poznámka</TableCell>
              <TableCell sx={{ height: '60px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: 500 }}>Akcie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow 
                key={contact.id} 
                sx={{ 
                  '&:hover': { backgroundColor: 'rgba(255, 255, 255, 0.05)' },
                  height: '60px'
                }}
              >
                <TableCell sx={{ height: '60px' }}>{contact.company}</TableCell>
                <TableCell sx={{ height: '60px' }}>{contact.firstName} {contact.lastName}</TableCell>
                <TableCell sx={{ height: '60px' }}>
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
                <TableCell sx={{ height: '60px' }}>{contact.email}</TableCell>
                <TableCell sx={{ height: '60px' }}>{contact.createdBy?.firstName} {contact.createdBy?.lastName}</TableCell>
                <TableCell sx={{ height: '60px', whiteSpace: 'nowrap' }}>
                  {contact.createdAt?.toDate().toLocaleString('sk-SK', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </TableCell>
                <TableCell sx={{ height: '60px', maxWidth: '200px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {contact.notes || ''}
                </TableCell>
                <TableCell sx={{ height: '60px' }}>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <IconButton 
                      onClick={() => handleEdit(contact)} 
                      color="primary"
                      sx={{ padding: '8px' }}
                    >
                      <EditIcon />
                    </IconButton>
                    <IconButton 
                      onClick={() => contact.id && handleDelete(contact.id)} 
                      color="error"
                      sx={{ padding: '8px' }}
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
      >
        <DialogTitle>
          {editingContact ? 'Upraviť kontakt' : 'Pridať nový kontakt'}
        </DialogTitle>
        <DialogContent sx={{ minWidth: '500px', pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              name="firstName"
              label="Meno"
              value={formData.firstName}
              onChange={handleInputChange}
              fullWidth
              required
              error={touchedFields.firstName && !formData.firstName}
            />
            <TextField
              name="lastName"
              label="Priezvisko"
              value={formData.lastName}
              onChange={handleInputChange}
              fullWidth
              required
              error={touchedFields.lastName && !formData.lastName}
            />
            <TextField
              name="company"
              label="Firma"
              value={formData.company}
              onChange={handleInputChange}
              fullWidth
            />
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Select
                name="countryCode"
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
                onChange={handleInputChange}
                fullWidth
              />
            </Box>
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
              required
              error={touchedFields.email && !formData.email}
            />
            {editingContact && (
              <FormControl fullWidth>
                <InputLabel>Vytvoril</InputLabel>
                <Select
                  value={users.find(user => 
                    user.firstName === formData.createdBy?.firstName && 
                    user.lastName === formData.createdBy?.lastName
                  )?.email || ''}
                  onChange={handleCreatorChange}
                  label="Vytvoril"
                >
                  {users.map((user) => (
                    <MenuItem key={user.email} value={user.email}>
                      {user.firstName} {user.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušiť</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained"
            disabled={!formData.firstName || !formData.lastName || !formData.email}
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