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
  Grid,
  Card,
  Avatar,
  styled
} from '@mui/material';
import { 
  Add as AddIcon, 
  Mail as MailIcon, 
  ArrowBack as ArrowBackIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Send as SendIcon
} from '@mui/icons-material';
import { collection, query, where, getDocs, addDoc, doc, getDoc, onSnapshot, deleteDoc, updateDoc } from 'firebase/firestore';
import { auth, db, functions } from '../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { httpsCallable } from 'firebase/functions';
import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';
import { SelectChangeEvent } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

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

interface TeamMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: string;
  status: 'active' | 'pending';
  createdAt?: Date;
  userId?: string;
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

type DeleteableItem = TeamMember | Invitation;

const PageWrapper = styled('div')({
  padding: '24px',
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
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

const AddButton = styled('button')({
  backgroundColor: '#00b894',
  color: '#ffffff',
  padding: '8px 24px',
  borderRadius: '12px',
  fontSize: '0.95rem',
  fontWeight: 600,
  border: 'none',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)',
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
  '&:hover': {
    backgroundColor: '#00d2a0',
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 184, 148, 0.4)',
  }
});

const TeamCard = styled(Card)({
  backgroundColor: 'rgba(35, 35, 66, 0.95)',
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

const TeamInfo = styled(Box)({
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

const CardHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '24px',
});

const MemberName = styled(Typography)({
  fontSize: '1.1rem',
  fontWeight: 600,
  color: '#00b894',
});

const RoleChip = styled('span')({
  backgroundColor: 'rgba(0, 184, 148, 0.2)',
  color: '#00b894',
  padding: '4px 12px',
  borderRadius: '8px',
  fontSize: '0.85rem',
  fontWeight: 500,
});

const AnimatedTableRow = styled(motion.tr)({
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const fadeOut = {
  initial: { opacity: 1, height: 'auto' },
  exit: { 
    opacity: 0,
    height: 0,
    transition: {
      duration: 0.3,
      ease: "easeInOut"
    }
  }
};

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
  const [inviteToDelete, setInviteToDelete] = useState<DeleteableItem | null>(null);
  const [editingInvite, setEditingInvite] = useState<Invitation | null>(null);
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phonePrefix, setPhonePrefix] = useState('+421');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [countryCode, setCountryCode] = useState('sk');
  const [role, setRole] = useState('user');
  const { userData } = useAuth();
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);

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
              where('companyID', '==', userData.companyID)
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
                  createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
                  userId: doc.id  // Používame doc.id ako userId
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
                if (data.status === 'pending') {
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
                }
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
    if (!email || !role || !companyID || !firstName || !lastName || !phoneNumber) {
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
        phone: `${phonePrefix}${phoneNumber}`,
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
        phone: `${phonePrefix}${phoneNumber}`,
        role,
        companyId: companyID,
        invitationId: invitationRef.id
      });

      setSuccess('Pozvánka bola úspešne odoslaná.');
      setOpenInvite(false);
      setEmail('');
      setFirstName('');
      setLastName('');
      setPhoneNumber('');
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
    // Extrahujeme predvoľbu a číslo
    const prefix = countries.find(c => member.phone.startsWith(c.prefix))?.prefix || '+421';
    setPhonePrefix(prefix);
    setCountryCode(countries.find(c => c.prefix === prefix)?.code || 'sk');
    setPhoneNumber(member.phone.replace(prefix, ''));
    setRole(member.role);
    setOpenEdit(true);
  };

  const handleUpdate = async () => {
    if (!editingInvite || !firstName || !lastName || !email || !phoneNumber || !role) {
      setError('Prosím vyplňte všetky polia');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const fullPhoneNumber = `${phonePrefix}${phoneNumber}`;

      // Ak je to pozvánka (nemá userId)
      if (!editingInvite.userId) {
        await updateDoc(doc(db, 'invitations', editingInvite.id), {
          firstName,
          lastName,
          email,
          phone: fullPhoneNumber,
          role,
          updatedAt: new Date()
        });
      } else {
        // Ak je to člen tímu (má userId)
        await updateDoc(doc(db, 'users', editingInvite.userId), {
          firstName,
          lastName,
          email,
          phone: fullPhoneNumber,
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
      setPhoneNumber('');
      setRole('user');
    } catch (err: any) {
      console.error('Chyba pri aktualizácii záznamu:', err);
      setError(err.message || 'Nastala chyba pri aktualizácii záznamu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (member: DeleteableItem) => {
    setInviteToDelete(member);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!inviteToDelete) return;

    try {
      setLoading(true);
      if ('userId' in inviteToDelete && inviteToDelete.userId) {
        // Ak je to člen tímu
        console.log('Mazanie člena tímu s ID:', inviteToDelete.userId);
        setDeletingMemberId(inviteToDelete.id);
        await deleteDoc(doc(db, 'users', inviteToDelete.userId));
      } else {
        // Ak je to pozvánka
        const invitationRef = doc(db, 'invitations', inviteToDelete.id);
        await deleteDoc(invitationRef);
        console.log('Pozvánka vymazaná:', inviteToDelete.id);
      }
      setSuccess('Záznam bol úspešne vymazaný.');
      setDeleteConfirmOpen(false);
      setInviteToDelete(null);
    } catch (err: any) {
      console.error('Chyba pri mazaní záznamu:', err);
      setError(err.message || 'Nastala chyba pri mazaní záznamu.');
    } finally {
      setLoading(false);
      setDeletingMemberId(null);
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

  const handleCountryChange = (e: SelectChangeEvent) => {
    const value = e.target.value;
    const country = countries.find(c => c.code === value);
    if (country) {
      setCountryCode(value);
      setPhonePrefix(country.prefix);
    }
  };

  const handleResendInvitation = async (invite: Invitation) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // Volanie Cloud Function na opätovné odoslanie emailu
      const sendInvitationEmail = httpsCallable(functions, 'sendInvitationEmail');
      await sendInvitationEmail({
        email: invite.email,
        firstName: invite.firstName,
        lastName: invite.lastName,
        phone: invite.phone,
        role: invite.role,
        companyId: companyID,
        invitationId: invite.id
      });

      // Aktualizujeme dátum odoslania v Firestore
      await updateDoc(doc(db, 'invitations', invite.id), {
        lastSentAt: new Date(),
        status: 'pending'
      });

      setSuccess('Pozvánka bola úspešne preposlená.');
    } catch (err: any) {
      console.error('Chyba pri preposielaní pozvánky:', err);
      setError(err.message || 'Nastala chyba pri preposielaní pozvánky.');
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
    <PageWrapper>
      <PageHeader>
        <PageTitle>Tím</PageTitle>
        <AddButton onClick={() => setOpenInvite(true)}>
          Pridať člena
        </AddButton>
      </PageHeader>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
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
                  <AnimatePresence mode="wait">
                    {teamMembers.map((member) => (
                      <AnimatedTableRow
                        key={member.id}
                        variants={fadeOut}
                        initial="initial"
                        exit="exit"
                        animate={deletingMemberId === member.id ? "exit" : "initial"}
                        style={{ display: deletingMemberId === member.id ? 'none' : 'table-row' }}
                      >
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
                      </AnimatedTableRow>
                    ))}
                  </AnimatePresence>
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
                  <AnimatePresence mode="wait">
                    {invitations.map((invite) => (
                      <AnimatedTableRow
                        key={invite.id}
                        variants={fadeOut}
                        initial="initial"
                        exit="exit"
                        animate={deletingMemberId === invite.id ? "exit" : "initial"}
                        style={{ display: deletingMemberId === invite.id ? 'none' : 'table-row' }}
                      >
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
                            {invite.status === 'pending' && (
                              <Tooltip title="Preposlať pozvánku">
                                <span>
                                  <IconButton 
                                    size="small" 
                                    onClick={() => handleResendInvitation(invite)}
                                    disabled={loading}
                                    aria-label="Preposlať pozvánku"
                                  >
                                    <SendIcon color="primary" />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            )}
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
                      </AnimatedTableRow>
                    ))}
                  </AnimatePresence>
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Select
                  value={countryCode}
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
                  label={`Mobil (${phonePrefix})`}
                  placeholder="910 XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  fullWidth
                  required
                />
              </Box>
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
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Select
                  value={countryCode}
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
                  label={`Mobil (${phonePrefix})`}
                  placeholder="910 XXX XXX"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  fullWidth
                  required
                />
              </Box>
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
    </PageWrapper>
  );
}

export default Team; 