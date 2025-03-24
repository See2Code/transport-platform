import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Alert,
  Box
} from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

function AcceptInvitation() {
  const { invitationId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [invitation, setInvitation] = useState<any>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  useEffect(() => {
    const loadInvitation = async () => {
      try {
        if (!invitationId) {
          setError('Neplatný odkaz pozvánky.');
          return;
        }

        const invitationDoc = await getDoc(doc(db, 'invitations', invitationId));
        
        if (!invitationDoc.exists()) {
          setError('Pozvánka nebola nájdená.');
          return;
        }

        const invitationData = invitationDoc.data();
        
        if (invitationData.status !== 'pending') {
          setError('Táto pozvánka už nie je platná.');
          return;
        }

        setInvitation(invitationData);
      } catch (err) {
        console.error('Chyba pri načítaní pozvánky:', err);
        setError('Nepodarilo sa načítať pozvánku.');
      } finally {
        setLoading(false);
      }
    };

    loadInvitation();
  }, [invitationId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('Heslá sa nezhodujú!');
      return;
    }

    if (!invitation) {
      setError('Chýbajúce údaje pozvánky.');
      return;
    }

    setError('');
    setLoading(true);

    try {
      // Vytvorenie používateľa v Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        invitation.email,
        password
      );

      // Vytvorenie používateľa v kolekcii users
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        uid: userCredential.user.uid,
        email: invitation.email,
        firstName: invitation.firstName,
        lastName: invitation.lastName,
        phone: invitation.phone,
        companyID: invitation.companyID,
        role: invitation.role,
        status: 'active',
        createdAt: new Date().toISOString()
      });

      // Aktualizácia stavu pozvánky
      await updateDoc(doc(db, 'invitations', invitationId!), {
        status: 'accepted',
        acceptedAt: new Date().toISOString(),
        userId: userCredential.user.uid
      });

      // Presmerovanie na dashboard
      navigate('/dashboard');
    } catch (err: any) {
      console.error('Chyba pri registrácii:', err);
      setError(err.message || 'Nepodarilo sa dokončiť registráciu.');
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

  if (error) {
    return (
      <Container maxWidth="sm">
        <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
          <Alert severity="error">{error}</Alert>
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button variant="contained" onClick={() => navigate('/')}>
              Späť na hlavnú stránku
            </Button>
          </Box>
        </Paper>
      </Container>
    );
  }

  return (
    <Container maxWidth="sm">
      <Paper elevation={3} sx={{ p: 4, mt: 8 }}>
        <Typography variant="h4" gutterBottom align="center">
          Dokončenie registrácie
        </Typography>

        <Typography variant="body1" paragraph>
          Vitajte! Boli ste pozvaný do tímu spoločnosti. Pre dokončenie registrácie si prosím nastavte heslo.
        </Typography>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email"
            value={invitation?.email || ''}
            disabled
            margin="normal"
          />
          <TextField
            fullWidth
            label="Heslo"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            margin="normal"
          />
          <TextField
            fullWidth
            label="Potvrďte heslo"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            margin="normal"
          />

          <Button
            fullWidth
            variant="contained"
            color="primary"
            type="submit"
            disabled={loading}
            sx={{ mt: 3 }}
          >
            {loading ? 'Registrácia...' : 'Dokončiť registráciu'}
          </Button>
        </form>
      </Paper>
    </Container>
  );
}

export default AcceptInvitation; 