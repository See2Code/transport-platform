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
  MenuItem,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Mail as MailIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { getFunctions, httpsCallable } from 'firebase/functions';

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
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+421');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const functions = getFunctions();
  const sendInvitationEmail = httpsCallable(functions, 'sendInvitationEmail');

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

  const handleInvite = async () => {
    if (!email || !role || !companyID || !firstName || !lastName || !phone) {
      setError('Prosím vyplňte všetky polia');
      return;
    }

    if (!phone.startsWith('+')) {
      setError('Telefónne číslo musí začínať predvoľbou krajiny (napr. +421)');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Vytvorenie pozvánky v Firestore
      const invitationRef = await addDoc(collection(db, 'invitations'), {
        email,
        firstName,
        lastName,
        phone,
        role,
        companyId: companyID,
        createdAt: new Date(),
        status: 'pending'
      });

      // Volanie Cloud Function na odoslanie emailu
      await sendInvitationEmail({
        email,
        firstName,
        lastName,
        phone,
        invitationId: invitationRef.id,
        companyId: companyID,
        role
      });

      setSuccess('Pozvánka bola úspešne odoslaná.');
      setOpenInvite(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('+421');
      setRole('user');
    } catch (err: any) {
      console.error('Chyba pri odosielaní pozvánky:', err);
      setError(err.message || 'Nastala chyba pri odosielaní pozvánky.');
    } finally {
      setLoading(false);
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
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton 
            onClick={() => navigate('/dashboard')} 
            sx={{ mr: 2 }}
            aria-label="späť na dashboard"
          >
            <ArrowBackIcon />
          </IconButton>
          <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h4">
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

        <Dialog open={openInvite} onClose={() => setOpenInvite(false)}>
          <DialogTitle>Pozvať nového člena</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              label="Meno"
              type="text"
              fullWidth
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              disabled={loading}
              required
            />
            <TextField
              margin="dense"
              label="Priezvisko"
              type="text"
              fullWidth
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              disabled={loading}
              required
            />
            <TextField
              margin="dense"
              label="Email"
              type="email"
              fullWidth
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
            />
            <TextField
              margin="dense"
              label="Telefón (s predvoľbou krajiny)"
              type="tel"
              fullWidth
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={loading}
              required
              placeholder="+421"
              helperText="Zadajte číslo s predvoľbou krajiny (napr. +421901234567)"
            />
            <FormControl fullWidth margin="dense">
              <InputLabel>Rola</InputLabel>
              <Select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                label="Rola"
                disabled={loading}
                required
              >
                <MenuItem value="user">Klasický používateľ</MenuItem>
                <MenuItem value="admin">Admin</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenInvite(false)} disabled={loading}>
              Zrušiť
            </Button>
            <Button 
              onClick={handleInvite} 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Odosielanie...' : 'Pozvať'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default Team; 