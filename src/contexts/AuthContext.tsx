import React, { createContext, useContext, useState, useEffect } from 'react';
import { User as FirebaseUser } from 'firebase/auth';
import { auth, db } from '../firebase';
import { CircularProgress, Box, Typography, Button } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';

export interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
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
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  userData: null,
  loading: true,
  error: null,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    console.log('AuthProvider: Inicializácia onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthProvider: onAuthStateChanged callback - user:', user?.uid);
      
      if (user) {
        try {
          console.log('AuthProvider: Získavam údaje o užívateľovi z Firestore');
          // Získanie údajov o užívateľovi z Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log('AuthProvider: Údaje o užívateľovi:', {
              uid: userData.uid,
              email: userData.email,
              companyID: userData.companyID,
              role: userData.role
            });

            // Kontrola povinných polí
            if (!userData.companyID) {
              console.error('AuthProvider: Chýbajúce companyID v údajoch užívateľa');
              setError('Chýbajúce údaje o firme');
              setUserData(null);
              setCurrentUser(null);
              setLoading(false);
              return;
            }

            setUserData({
              uid: userData.uid,
              email: userData.email || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phone: userData.phone || '',
              companyID: userData.companyID || '',
              role: userData.role || '',
              photoURL: user.photoURL || userData.photoURL || '',
            });
            setCurrentUser({
              uid: user.uid,
              email: user.email || '',
              companyID: userData.companyID || '',
              role: userData.role || '',
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
            });
            setError(null);
          } else {
            console.error('AuthProvider: Dokument užívateľa neexistuje v Firestore');
            setError('Užívateľský profil nebol nájdený');
            setUserData(null);
            setCurrentUser(null);
          }
        } catch (error) {
          console.error('AuthProvider: Chyba pri získavaní údajov o užívateľovi:', error);
          setError('Chyba pri načítaní údajov užívateľa');
          setUserData(null);
          setCurrentUser(null);
        }
      } else {
        console.log('AuthProvider: Užívateľ nie je prihlásený');
        setUserData(null);
        setCurrentUser(null);
        setError(null);
      }
      
      setLoading(false);
    });

    return () => {
      console.log('AuthProvider: Cleanup onAuthStateChanged');
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    // Implementation of login function
  };

  const register = async (email: string, password: string, firstName: string, lastName: string) => {
    // Implementation of register function
  };

  const logout = async () => {
    try {
      await signOut(auth);
      setCurrentUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Chyba pri odhlásení:', error);
      throw error;
    }
  };

  const value = {
    currentUser,
    userData,
    loading,
    error,
    login,
    register,
    logout,
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