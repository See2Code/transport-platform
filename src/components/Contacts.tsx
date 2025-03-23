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
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { collection, addDoc, query, getDocs, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

interface Contact {
  id?: string;
  firstName: string;
  lastName: string;
  company: string;
  phone: string;
  email: string;
  userId: string;
}

const Contacts = () => {
  const { currentUser } = useAuth();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [formData, setFormData] = useState<Omit<Contact, 'id' | 'userId'>>({
    firstName: '',
    lastName: '',
    company: '',
    phone: '',
    email: '',
  });

  const loadContacts = async () => {
    if (!currentUser) return;
    const q = query(collection(db, 'contacts'));
    const querySnapshot = await getDocs(q);
    const contactsList = querySnapshot.docs
      .map(doc => ({ ...doc.data(), id: doc.id } as Contact))
      .filter(contact => contact.userId === currentUser.uid);
    setContacts(contactsList);
  };

  useEffect(() => {
    loadContacts();
  }, [currentUser]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!currentUser) return;
    try {
      if (editingContact?.id) {
        await updateDoc(doc(db, 'contacts', editingContact.id), {
          ...formData,
          userId: currentUser.uid,
        });
      } else {
        await addDoc(collection(db, 'contacts'), {
          ...formData,
          userId: currentUser.uid,
        });
      }
      await loadContacts();
      handleCloseDialog();
    } catch (error) {
      console.error('Error saving contact:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'contacts', id));
      await loadContacts();
    } catch (error) {
      console.error('Error deleting contact:', error);
    }
  };

  const handleEdit = (contact: Contact) => {
    setEditingContact(contact);
    setFormData({
      firstName: contact.firstName,
      lastName: contact.lastName,
      company: contact.company,
      phone: contact.phone,
      email: contact.email,
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
      phone: '',
      email: '',
    });
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
              <TableCell>Meno</TableCell>
              <TableCell>Priezvisko</TableCell>
              <TableCell>Firma</TableCell>
              <TableCell>Telefón</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Akcie</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredContacts.map((contact) => (
              <TableRow key={contact.id}>
                <TableCell>{contact.firstName}</TableCell>
                <TableCell>{contact.lastName}</TableCell>
                <TableCell>{contact.company}</TableCell>
                <TableCell>{contact.phone}</TableCell>
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

      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>
          {editingContact ? 'Upraviť kontakt' : 'Pridať nový kontakt'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              name="firstName"
              label="Meno"
              value={formData.firstName}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="lastName"
              label="Priezvisko"
              value={formData.lastName}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="company"
              label="Firma"
              value={formData.company}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="phone"
              label="Telefón"
              value={formData.phone}
              onChange={handleInputChange}
              fullWidth
            />
            <TextField
              name="email"
              label="Email"
              type="email"
              value={formData.email}
              onChange={handleInputChange}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Zrušiť</Button>
          <Button onClick={handleSubmit} variant="contained">
            {editingContact ? 'Uložiť zmeny' : 'Pridať kontakt'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Contacts; 