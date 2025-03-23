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
  Tooltip,
  DialogContentText,
  Grid
} from '@mui/material';
import { 
  Add as AddIcon, 
  Mail as MailIcon, 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db, functions } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'pending';
  createdAt?: Date;
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [companyID, setCompanyID] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [openInvite, setOpenInvite] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [inviteToDelete, setInviteToDelete] = useState<Invitation | null>(null);
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('+421');
  const [role, setRole] = useState('user');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('CompanyID používateľa v Team:', userData.companyID);
            
            if (!userData.companyID) {
              console.error('Používateľ nemá nastavené companyID v Team komponente');
              setError('Používateľ nemá priradené ID firmy.');
              setLoading(false);
              return;
            }
            
            setCompanyID(userData.companyID);
            setIsAdmin(userData.role === 'admin');

            // Ak je užívateľ admin, aktualizujeme jeho status na 'active'
            if (userData.role === 'admin' && userData.status !== 'active') {
              await updateDoc(doc(db, 'users', user.uid), {
                status: 'active',
                updatedAt: new Date()
              });
            }

            // Načítanie členov tímu
            const membersQuery = query(
              collection(db, 'users'),
              where('companyID', '==', userData.companyID)
            );
            
            // Načítanie pozvánok
            const invitationsQuery = query(
              collection(db, 'invitations'),
              where('companyID', '==', userData.companyID),
              where('status', '==', 'pending')
            );

            // Real-time sledovanie členov tímu
            const unsubscribeMembers = onSnapshot(membersQuery, (snapshot) => {
              console.log('Načítané členy tímu:', snapshot.docs.map(doc => doc.data()));
              const membersMap = new Map<string, TeamMember>();
              snapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Spracovávam člena:', data.email);
                // Použijeme email ako kľúč pre odstránenie duplicít
                membersMap.set(data.email, {
                  id: doc.id,
                  firstName: data.firstName,
                  lastName: data.lastName,
                  email: data.email,
                  phone: data.phone,
                  role: data.role,
                  status: data.role === 'admin' ? 'active' : (data.status || 'pending'),
                  createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date()
                });
              });
              console.log('Finálny zoznam členov po odstránení duplicít:', Array.from(membersMap.values()));
              setTeamMembers(Array.from(membersMap.values()));
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
                  createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
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
          setError('Nastala chyba pri načítaní údajov.');
        } finally {
          setLoading(false);
        }
      } else {
        navigate('/login');
      }
    });

    return () => unsubscribe();
  }, [navigate]);

  const handleInvite = async () => {
    if (!email || !role || !companyID || !firstName || !lastName || !phone) {
      setError('Prosím vyplňte všetky polia');
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
        phone: phone.startsWith('+') ? phone : `+${phone}`,
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
        phone: phone.startsWith('+') ? phone : `+${phone}`,
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

  const handleEdit = (member: TeamMember | Invitation) => {
    setEditingInvite(member as Invitation);
    setFirstName(member.firstName);
    setLastName(member.lastName);
    setEmail(member.email);
    setPhone(member.phone);
    setRole(member.role);
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

      if ('userId' in editingInvite) {
        // Ak je to člen tímu
        await updateDoc(doc(db, 'users', editingInvite.id), {
          firstName,
          lastName,
          email,
          phone,
          role,
          updatedAt: new Date()
        });
      } else {
        // Ak je to pozvánka
        await updateDoc(doc(db, 'invitations', editingInvite.id), {
          firstName,
          lastName,
          email,
          phone,
          role,
          updatedAt: new Date()
        });
      }

      setSuccess('Záznam bol úspešne aktualizovaný.');
      setOpenEdit(false);
      setEditingInvite(null);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhone('+421');
      setRole('user');
    } catch (err: any) {
      console.error('Chyba pri aktualizácii záznamu:', err);
      setError(err.message || 'Nastala chyba pri aktualizácii záznamu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (member: TeamMember | Invitation) => {
    setInviteToDelete(member as Invitation);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inviteToDelete) return;

    try {
      setLoading(true);
      if ('userId' in inviteToDelete) {
        // Ak je to člen tímu
        await deleteDoc(doc(db, 'users', inviteToDelete.id));
      } else {
        // Ak je to pozvánka
        await deleteDoc(doc(db, 'invitations', inviteToDelete.id));
      }
      setSuccess('Záznam bol úspešne vymazaný.');
      setDeleteConfirmOpen(false);
      setInviteToDelete(null);
    } catch (err: any) {
      console.error('Chyba pri mazaní záznamu:', err);
      setError(err.message || 'Nastala chyba pri mazaní záznamu.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyStatus = async (member: TeamMember) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      await updateDoc(doc(db, 'users', member.id), {
        status: 'active',
        updatedAt: new Date()
      });

      setSuccess('Status člena tímu bol úspešne overený.');
    } catch (err: any) {
      console.error('Chyba pri overovaní statusu:', err);
      setError(err.message || 'Nastala chyba pri overovaní statusu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Tooltip title="Späť na Dashboard">
            <IconButton 
              onClick={() => navigate('/dashboard')}
              size="large"
              sx={{ 
                backgroundColor: 'primary.main',
                color: 'white',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                }
              }}
            >
              <ArrowBackIcon />
            </IconButton>
          </Tooltip>
          <Typography variant="h4" component="h1">
            Tím
          </Typography>
        </Box>
        {isAdmin && (
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => setOpenInvite(true)}
          >
            Pozvať nového člena
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

      <Grid container spacing={3}>
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Členovia tímu
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Meno</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Telefón</TableCell>
                    <TableCell>Rola</TableCell>
                    <TableCell>Status</TableCell>
                    {isAdmin && <TableCell>Akcie</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teamMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>{member.firstName} {member.lastName}</TableCell>
                      <TableCell>{member.email}</TableCell>
                      <TableCell>{member.phone}</TableCell>
                      <TableCell>
                        <Chip 
                          label={member.role} 
                          color={member.role === 'admin' ? 'primary' : 'default'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={member.status} 
                          color={member.status === 'active' ? 'success' : 'warning'} 
                          size="small"
                        />
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <Tooltip title="Upraviť údaje člena tímu">
                            <span>
                              <IconButton
                                onClick={() => handleEdit(member)}
                                disabled={loading}
                                aria-label="Upraviť údaje člena tímu"
                              >
                                <EditIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          {member.status === 'pending' && (
                            <Tooltip title="Overiť status člena tímu">
                              <span>
                                <IconButton 
                                  size="small" 
                                  onClick={() => handleVerifyStatus(member)}
                                  disabled={member.role === 'admin' || loading}
                                  aria-label="Overiť status člena tímu"
                                >
                                  <CheckCircleIcon color="success" />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}
                          <Tooltip title="Vymazať člena z tímu">
                            <span>
                              <IconButton
                                onClick={() => handleDeleteClick(member)}
                                disabled={loading}
                                aria-label="Vymazať člena z tímu"
                                color="error"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
              Čakajúce pozvánky
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Meno</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Telefón</TableCell>
                    <TableCell>Rola</TableCell>
                    <TableCell>Status</TableCell>
                    {isAdmin && <TableCell>Akcie</TableCell>}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invitations.map((invite) => (
                    <TableRow key={invite.id}>
                      <TableCell>{invite.firstName} {invite.lastName}</TableCell>
                      <TableCell>{invite.email}</TableCell>
                      <TableCell>{invite.phone}</TableCell>
                      <TableCell>
                        <Chip 
                          label={invite.role} 
                          color={invite.role === 'admin' ? 'primary' : 'default'} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={invite.status} 
                          color={invite.status === 'pending' ? 'warning' : invite.status === 'accepted' ? 'success' : 'error'} 
                          size="small"
                        />
                      </TableCell>
                      {isAdmin && (
                        <TableCell align="right">
                          <Tooltip title="Upraviť údaje v pozvánke">
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={() => handleEdit(invite)}
                                aria-label="Upraviť údaje v pozvánke"
                              >
                                <EditIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Zrušiť pozvánku">
                            <span>
                              <IconButton 
                                size="small" 
                                onClick={() => handleDeleteClick(invite)}
                                aria-label="Zrušiť pozvánku"
                              >
                                <DeleteIcon />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      {/* Dialóg pre pozvanie nového člena */}
      <Dialog open={openInvite} onClose={() => setOpenInvite(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Pozvať nového člena do tímu</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <PhoneInput
                country={'sk'}
                value={phone}
                onChange={setPhone}
                inputStyle={{ width: '100%' }}
                containerStyle={{ width: '100%' }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  label="Rola"
                >
                  <MenuItem value="user">Používateľ</MenuItem>
                  <MenuItem value="manager">Manažér</MenuItem>
                  <MenuItem value="admin">Administrátor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenInvite(false)} aria-label="Zrušiť pozvanie">
            Zrušiť
          </Button>
          <Button 
            onClick={handleInvite} 
            variant="contained" 
            disabled={loading}
            aria-label="Pozvať nového člena do tímu"
          >
            {loading ? <CircularProgress size={24} /> : 'Pozvať nového člena do tímu'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialóg pre úpravu */}
      <Dialog open={openEdit} onClose={() => setOpenEdit(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingInvite && 'userId' in editingInvite ? 'Upraviť údaje člena tímu' : 'Upraviť údaje v pozvánke'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Meno"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Priezvisko"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <PhoneInput
                country={'sk'}
                value={phone}
                onChange={setPhone}
                inputStyle={{ width: '100%' }}
                containerStyle={{ width: '100%' }}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Rola</InputLabel>
                <Select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  label="Rola"
                >
                  <MenuItem value="user">Používateľ</MenuItem>
                  <MenuItem value="manager">Manažér</MenuItem>
                  <MenuItem value="admin">Administrátor</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenEdit(false)} aria-label="Zrušiť úpravy">
            Zrušiť
          </Button>
          <Button 
            onClick={handleUpdate} 
            variant="contained" 
            disabled={loading}
            aria-label={`Uložiť zmeny pre ${editingInvite && 'userId' in editingInvite ? 'člena tímu' : 'pozvánku'}`}
          >
            {loading ? <CircularProgress size={24} /> : `Uložiť zmeny pre ${editingInvite && 'userId' in editingInvite ? 'člena tímu' : 'pozvánku'}`}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialóg pre potvrdenie vymazania */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Potvrdiť vymazanie</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Ste si istý, že chcete {inviteToDelete && 'userId' in inviteToDelete ? 'vymazať člena z tímu' : 'zrušiť pozvánku pre'} {inviteToDelete?.firstName} {inviteToDelete?.lastName}? Táto akcia je nezvratná.
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
            aria-label={inviteToDelete && 'userId' in inviteToDelete ? 'Vymazať člena z tímu' : 'Zrušiť pozvánku'}
          >
            {loading ? <CircularProgress size={24} /> : `${inviteToDelete && 'userId' in inviteToDelete ? 'Vymazať člena z tímu' : 'Zrušiť pozvánku'}`}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default Team; 