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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { collection, addDoc, query, deleteDoc, doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

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
  id?: string;
  firstName: string;
  lastName: string;
  company: string;
  phonePrefix: string;
  phoneNumber: string;
  countryCode: string;
  email: string;
  createdAt: any; // Firebase Timestamp
  createdBy: {
    firstName: string;
    lastName: string;
  };
}

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
    createdAt: new Date(),
    createdBy: {
      firstName: userData?.firstName || '',
      lastName: userData?.lastName || ''
    }
  });

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

  const handleSubmit = async () => {
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
        createdAt: new Date(),
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
    } catch (error) {
      console.error('Error saving contact:', error);
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
    } catch (error) {
      console.error('Error deleting contact:', error);
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
      phonePrefix: contact.phonePrefix || '+421',
      phoneNumber: contact.phoneNumber || '',
      countryCode: contact.countryCode || 'sk',
      email: contact.email,
      createdAt: contact.createdAt,
      createdBy: contact.createdBy || {
        firstName: userData?.firstName || '',
        lastName: userData?.lastName || ''
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
      createdAt: new Date(),
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
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" component="h2">
          Kontakty
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setOpenDialog(true)}
        >
          Pridať kontakt
        </Button>
      </Box>

      <TextField
        fullWidth
        label="Vyhľadať kontakt"
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
              <TableCell>Meno</TableCell>
              <TableCell>Priezvisko</TableCell>
              <TableCell>Firma</TableCell>
              <TableCell>Mobil</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Akcie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContacts
              .sort((a, b) => {
                const dateA = a.createdAt?.toDate() || new Date(0);
                const dateB = b.createdAt?.toDate() || new Date(0);
                return dateB.getTime() - dateA.getTime();
              })
              .map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>
                  {contact.createdAt && contact.createdAt.toDate().toLocaleDateString('sk-SK')}
                </TableCell>
                <TableCell>
                  {contact.createdBy?.firstName} {contact.createdBy?.lastName}
                </TableCell>
                <TableCell>{contact.firstName}</TableCell>
                <TableCell>{contact.lastName}</TableCell>
                <TableCell>{contact.company}</TableCell>
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
                <TableCell>
                  <IconButton onClick={() => contact.id && handleEdit(contact)}>
                    <EditIcon />
                  </IconButton>
                  <IconButton onClick={() => contact.id && handleDelete(contact.id)}>
                    <DeleteIcon />
                  </IconButton>
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
    </Box>
  );
};

export default Contacts; 