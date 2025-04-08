import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot, collection, query, where, deleteDoc, updateDoc, Timestamp } from 'firebase/firestore';
import { signOut, onAuthStateChanged, signInWithEmailAndPassword } from 'firebase/auth';

export interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  companyID: string;
  role: string;
  photoURL?: string;
}

export interface User {
  uid: string;
  email: string | null;
  companyID: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
  setUserData: React.Dispatch<React.SetStateAction<UserData | null>>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface UserSession {
  userId: string;
  deviceId: string;
  lastActive: Timestamp;
  createdAt: Timestamp;
  deviceInfo: {
    userAgent: string;
    platform: string;
    language: string;
  };
}

interface SessionData extends UserSession {
  id: string;
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentSession, setCurrentSession] = useState<string | null>(null);

  const generateDeviceId = () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  };

  const manageSession = async (user: FirebaseUser) => {
    if (!user) return;

    const deviceId = localStorage.getItem('deviceId') || generateDeviceId();
    localStorage.setItem('deviceId', deviceId);

    const sessionRef = doc(db, 'sessions', `${user.uid}_${deviceId}`);
    const session: UserSession = {
      userId: user.uid,
      deviceId,
      lastActive: Timestamp.now(),
      createdAt: Timestamp.now(),
      deviceInfo: {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        language: navigator.language
      }
    };

    await setDoc(sessionRef, session);

    setCurrentSession(`${user.uid}_${deviceId}`);

    const sessionsQuery = query(
      collection(db, 'sessions'),
      where('userId', '==', user.uid)
    );

    const unsubscribe = onSnapshot(sessionsQuery, async (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as SessionData[];

      const otherSessions = sessions.filter(s => s.id !== `${user.uid}_${deviceId}`);
      
      if (otherSessions.length > 0) {
        const sortedSessions = otherSessions.sort((a, b) => 
          (b.lastActive as Timestamp).toDate().getTime() - 
          (a.lastActive as Timestamp).toDate().getTime()
        );

        if ((sortedSessions[0].lastActive as Timestamp).toDate() > (session.lastActive as Timestamp).toDate()) {
          await signOut(auth);
          alert('Vaše konto bolo prihlásené na inom zariadení.');
          return;
        }

        for (const oldSession of sortedSessions) {
          await deleteDoc(doc(db, 'sessions', oldSession.id));
        }
      }
    });

    return () => unsubscribe();
  };

  const updateLastActive = async () => {
    if (!currentSession) return;

    try {
      const sessionRef = doc(db, 'sessions', currentSession);
      const sessionDoc = await getDoc(sessionRef);
      
      if (sessionDoc.exists()) {
        await updateDoc(sessionRef, {
          lastActive: serverTimestamp()
        });
      } else {
        // Ak dokument neexistuje, vytvoríme nový
        const deviceId = localStorage.getItem('deviceId');
        if (!deviceId) return;

        const newSession: UserSession = {
          userId: currentUser?.uid || '',
          deviceId,
          lastActive: Timestamp.now(),
          createdAt: Timestamp.now(),
          deviceInfo: {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language
          }
        };

        await setDoc(sessionRef, newSession);
      }
    } catch (error) {
      console.error('Chyba pri aktualizácii lastActive:', error);
    }
  };

  useEffect(() => {
    if (!currentSession) return;

    const interval = setInterval(updateLastActive, 60000);
    return () => clearInterval(interval);
  }, [currentSession]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      if (user) {
        setCurrentUser({
          uid: user.uid,
          email: user.email,
          companyID: '',
          role: '',
          firstName: '',
          lastName: ''
        });

        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const firestoreData = userDoc.data();
          const newUserData: UserData = {
            uid: user.uid,
            email: user.email || "",
            firstName: firestoreData.firstName || "",
            lastName: firestoreData.lastName || "",
            phone: firestoreData.phone,
            companyID: firestoreData.companyID || "",
            role: firestoreData.role || "",
            photoURL: firestoreData.photoURL
          };
          setUserData(newUserData);
          
          setCurrentUser(prev => ({
            ...prev!,
            companyID: firestoreData.companyID || "",
            role: firestoreData.role || "",
            firstName: firestoreData.firstName || "",
            lastName: firestoreData.lastName || ""
          }));

          await manageSession(user);
        }
      } else {
        setCurrentUser(null);
        setUserData(null);
        setCurrentSession(null);
      }
      setLoading(false);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Prihlásenie cez Firebase Auth
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Kontrola, či užívateľ existuje vo Firestore
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (!userDoc.exists()) {
        throw new Error('Používateľ neexistuje v systéme');
      }

      const firestoreData = userDoc.data();
      const newUserData: UserData = {
        uid: userCredential.user.uid,
        email: userCredential.user.email || "",
        firstName: firestoreData.firstName || "",
        lastName: firestoreData.lastName || "",
        phone: firestoreData.phone,
        companyID: firestoreData.companyID || "",
        role: firestoreData.role || "",
        photoURL: firestoreData.photoURL
      };

      setUserData(newUserData);
      await manageSession(userCredential.user);
      
    } catch (error: any) {
      console.error('Chyba pri prihlásení:', error);
      setError(error.message || 'Nastala chyba pri prihlásení');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    // Implementation of register function
  };

  const logout = async () => {
    if (currentSession) {
      try {
        await deleteDoc(doc(db, 'sessions', currentSession));
      } catch (error) {
        console.error('Chyba pri mazaní session:', error);
      }
    }
    await signOut(auth);
    setUserData(null);
    setCurrentSession(null);
  };

  const value: AuthContextType = {
    currentUser,
    userData,
    loading,
    error,
    login,
    register,
    logout,
    setUserData
  };

  console.log('AuthProvider: Render - loading:', loading, 'currentUser:', currentUser?.uid, 'userData:', userData, 'error:', error);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress sx={{ color: '#ff9f43' }} />
        </Box>
      ) : error ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', flexDirection: 'column' }}>
          <Typography color="error" variant="h6" gutterBottom>
            {error}
          </Typography>
          <Button variant="contained" color="primary" onClick={() => window.location.reload()}>
            Skúsiť znova
          </Button>
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};