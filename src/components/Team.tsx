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
  CircularProgress,
  Tooltip
} from '@mui/material';
import { 
  Add as AddIcon, 
  Mail as MailIcon, 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db, functions } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'pending';
}

interface Invitation {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  createdAt: Date;
  userId?: string;
}

function Team() {
  const navigate = useNavigate();
  const [openInvite, setOpenInvite] = useState(false);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+421');
  const [role, setRole] = useState('user');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [companyID, setCompanyID] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [openEdit, setOpenEdit] = useState(false);
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [inviteToDelete, setInviteToDelete] = useState<Invitation | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          const userData = userDoc.data();
          
          if (userData) {
            setCompanyID(userData.companyID);
            setIsAdmin(userData.role === 'admin');

            // Načítanie členov tímu
            const membersQuery = query(
              collection(db, 'users'),
              where('companyID', '==', userData.companyID)
            );
            
            // Načítanie pozvánok
            const invitationsQuery = query(
              collection(db, 'invitations'),
              where('companyID', '==', userData.companyID)
            );

            // Real-time sledovanie členov tímu
            const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
              const members: TeamMember[] = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                members.push({
                  id: doc.id,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  email: data.email,
                  phone: data.phone,
                  role: data.role,
                  status: data.status || 'pending'
                });
              });
              setTeamMembers(members);
            });

            // Real-time sledovanie pozvánok
            const unsubscribeInvitations = onSnapshot(invitationsQuery, (snapshot) => {
              const invites: Invitation[] = [];
              snapshot.forEach((doc) => {
                const data = doc.data();
                invites.push({
                  id: doc.id,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  email: data.email,
                  phone: data.phone,
                  role: data.role,
                  status: data.status,
                  createdAt: data.createdAt instanceof Date ? data.createdAt : new Date(data.createdAt),
                  userId: data.userId
                });
              });
              setInvitations(invites);
            });

            return () => {
              unsubscribeMembers();
              unsubscribeInvitations();
            };
          }
        } catch (err) {
          console.error('Chyba pri načítaní údajov:', err);
          setError('Nepodarilo sa načítať údaje o tíme.');
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
        companyID,
        createdAt: new Date(),
        status: 'pending'
      });

      // Volanie Cloud Function na odoslanie emailu
      const sendInvitationEmail = httpsCallable(functions, 'sendInvitationEmail');
      await sendInvitationEmail({
        email,
        firstName,
        lastName,
        phone,
        role,
        companyId: companyID,
        invitationId: invitationRef.id
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

  const handleEdit = (invite: Invitation) => {
    setEditingInvite(invite);
    setFirstName(invite.firstName);
    setLastName(invite.lastName);
    setEmail(invite.email);
    setPhone(invite.phone);
    setRole(invite.role);
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!editingInvite || !firstName || !lastName || !email || !phone || !role) {
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

      // Aktualizácia pozvánky v Firestore
      await updateDoc(doc(db, 'invitations', editingInvite.id), {
        firstName,
        lastName,
        email,
        phone,
        role,
        updatedAt: new Date()
      });

      setSuccess('Pozvánka bola úspešne aktualizovaná.');
      setOpenEdit(false);
      setEditingInvite(null);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('+421');
      setRole('user');
    } catch (err: any) {
      console.error('Chyba pri aktualizácii pozvánky:', err);
      setError(err.message || 'Nastala chyba pri aktualizácii pozvánky.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!inviteToDelete || !auth.currentUser) return;

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Vymazanie pozvánky
      await deleteDoc(doc(db, 'invitations', inviteToDelete.id));
      
      setSuccess('Pozvánka bola úspešne odstránená.');
      setDeleteConfirmOpen(false);
      setInviteToDelete(null);
    } catch (err: any) {
      console.error('Chyba pri odstránení pozvánky:', err);
      setError(err.message || 'Nastala chyba pri odstránení pozvánky.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusChip = (status: string, role: string) => {
    // Admin je vždy aktívny
    if (role === 'admin') {
      return <Chip label="Aktívny" color="success" />;
    }

    switch (status) {
      case 'pending':
        return <Chip label="Čaká na registráciu" color="warning" />;
      case 'active':
        return <Chip label="Aktívny" color="success" />;
      case 'rejected':
        return <Chip label="Zamietnutá" color="error" />;
      default:
        return <Chip label="Neznámy stav" />;
    }
  };

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
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
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
                <TableCell>Stav</TableCell>
                <TableCell align="right">Akcie</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {/* Aktívni členovia */}
              {teamMembers.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>{member.firstName} {member.lastName}</TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.phone}</TableCell>
                  <TableCell>
                    {member.role === 'admin' ? 'Administrátor' : 'Klasický používateľ'}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(member.status, member.role)}
                  </TableCell>
                  <TableCell align="right">
                    {isAdmin && member.id !== auth.currentUser?.uid && (
                      <Tooltip title="Odstrániť">
                        <IconButton 
                          onClick={() => {
                            setInviteToDelete({ ...member, id: member.id } as Invitation);
                            setDeleteConfirmOpen(true);
                          }}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              
              {/* Pozvané osoby */}
              {invitations
                .filter(invite => invite.status === 'pending')
                .map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.firstName} {invite.lastName}</TableCell>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell>{invite.phone}</TableCell>
                  <TableCell>
                    {invite.role === 'admin' ? 'Administrátor' : 'Klasický používateľ'}
                  </TableCell>
                  <TableCell>
                    {getStatusChip(invite.status, invite.role)}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Odstrániť">
                      <IconButton 
                        onClick={() => {
                          setInviteToDelete(invite);
                          setDeleteConfirmOpen(true);
                        }}
                        color="error"
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </Tooltip>
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
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
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

        {/* Edit Dialog */}
        <Dialog open={openEdit} onClose={() => setOpenEdit(false)}>
          <DialogTitle>Upraviť pozvánku</DialogTitle>
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
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
            {success && (
              <Alert severity="success" sx={{ mt: 2 }}>
                {success}
              </Alert>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEdit(false)} disabled={loading}>
              Zrušiť
            </Button>
            <Button 
              onClick={handleUpdate} 
              variant="contained" 
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Ukladanie...' : 'Uložiť zmeny'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)}>
          <DialogTitle>Odstrániť {inviteToDelete?.userId ? 'člena tímu' : 'pozvánku'}</DialogTitle>
          <DialogContent>
            <Typography>
              Naozaj chcete odstrániť {inviteToDelete?.userId ? 'člena tímu' : 'pozvánku'} pre {inviteToDelete?.firstName} {inviteToDelete?.lastName}?
              Táto akcia je nezvratná.
            </Typography>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDeleteConfirmOpen(false)} disabled={loading}>
              Zrušiť
            </Button>
            <Button 
              onClick={handleDelete} 
              variant="contained" 
              color="error"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Odoberanie...' : 'Odstrániť'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
}

export default Team; 