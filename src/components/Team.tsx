import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  Chip,
  IconButton,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import { Add as AddIcon, Mail as MailIcon } from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface TeamMember {
  uid: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
}

interface Invitation {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyID: string;
  role: string;
  status: 'pending' | 'accepted' | 'expired';
  createdAt: string;
}

function Team() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [companyID, setCompanyID] = useState('');
  const [openInvite, setOpenInvite] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const [inviteForm, setInviteForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    role: 'user'
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          // Získanie údajov o používateľovi
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setCompanyID(userData.companyID);
            
            // Kontrola či je používateľ admin
            setIsAdmin(userData.role === 'admin');

            // Načítanie členov tímu
            const membersQuery = query(
              collection(db, 'users'),
              where('companyID', '==', userData.companyID)
            );
            const membersSnapshot = await getDocs(membersQuery);
            
            // Zoradenie členov - najprv admini, potom ostatní
            const membersData = membersSnapshot.docs
              .map(doc => ({ ...doc.data(), uid: doc.id } as TeamMember))
              .sort((a, b) => {
                // Admini budú prví
                if (a.role === 'admin' && b.role !== 'admin') return -1;
                if (a.role !== 'admin' && b.role === 'admin') return 1;
                // Aktuálny používateľ bude prvý v svojej skupine
                if (a.uid === user.uid) return -1;
                if (b.uid === user.uid) return 1;
                // Ostatní podľa mena
                return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
              });
            
            setMembers(membersData);
          }
        } catch (err) {
          console.error('Chyba pri načítaní údajov:', err);
          setError('Nepodarilo sa načítať údaje tímu.');
        } finally {
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const handleInviteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // Vytvorenie pozvánky v kolekcii invitations
      await addDoc(collection(db, 'invitations'), {
        ...inviteForm,
        companyID,
        status: 'pending',
        createdAt: new Date().toISOString()
      });

      // Tu by sme mali poslať email s pozvánkou
      // TODO: Implementovať odosielanie emailov

      setSuccess('Pozvánka bola úspešne odoslaná.');
      setOpenInvite(false);
      setInviteForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        role: 'user'
      });
    } catch (err) {
      console.error('Chyba pri pozývaní člena:', err);
      setError('Nepodarilo sa odoslať pozvánku.');
    }
  };

  if (loading) {
    return (
      <Container sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <Typography>Načítavam...</Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h4" gutterBottom>
            Tím
          </Typography>
          {isAdmin && (
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setOpenInvite(true)}
            >
              Pozvať člena
            </Button>
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Meno</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Telefón</TableCell>
                <TableCell>Rola</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.uid}>
                  <TableCell>{`${member.firstName} ${member.lastName}`}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>
                    <Chip 
                      label={
                        member.role === 'admin' 
                          ? 'Administrátor' 
                          : member.role === 'classic' 
                            ? 'Classic' 
                            : 'Používateľ'
                      } 
                      color={member.role === 'admin' ? 'primary' : 'default'}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={openInvite} onClose={() => setOpenInvite(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Pozvať nového člena</DialogTitle>
          <form onSubmit={handleInviteSubmit}>
            <DialogContent>
              <TextField
                fullWidth
                label="Meno"
                value={inviteForm.firstName}
                onChange={(e) => setInviteForm(prev => ({ ...prev, firstName: e.target.value }))}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Priezvisko"
                value={inviteForm.lastName}
                onChange={(e) => setInviteForm(prev => ({ ...prev, lastName: e.target.value }))}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={inviteForm.email}
                onChange={(e) => setInviteForm(prev => ({ ...prev, email: e.target.value }))}
                required
                margin="normal"
              />
              <TextField
                fullWidth
                label="Telefón"
                value={inviteForm.phone}
                onChange={(e) => setInviteForm(prev => ({ ...prev, phone: e.target.value }))}
                required
                margin="normal"
              />
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={inviteForm.role}
                  onChange={(e) => setInviteForm(prev => ({ ...prev, role: e.target.value }))}
                  label="Rola"
                >
                  <MenuItem value="classic">Classic - môže vidieť všetko</MenuItem>
                  <MenuItem value="admin">Admin - môže upravovať firmu</MenuItem>
                </Select>
              </FormControl>
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setOpenInvite(false)}>Zrušiť</Button>
              <Button type="submit" variant="contained" color="primary">
                Odoslať pozvánku
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default Team; 