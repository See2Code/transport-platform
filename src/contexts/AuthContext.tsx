import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { CircularProgress, Box } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

interface UserData {
  uid: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  companyID: string;
  role: string;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  userData: null,
  loading: true,
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

  useEffect(() => {
    console.log('AuthProvider: Inicializácia onAuthStateChanged');
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      console.log('AuthProvider: onAuthStateChanged callback - user:', user?.uid);
      setCurrentUser(user);
      
      if (user) {
        try {
          console.log('AuthProvider: Získavam údaje o užívateľovi z Firestore');
          // Získanie údajov o užívateľovi z Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data() as UserData;
            console.log('AuthProvider: Údaje o užívateľovi:', {
              uid: userData.uid,
              email: userData.email,
              companyID: userData.companyID,
              role: userData.role
            });
            setUserData(userData);
          } else {
            console.error('AuthProvider: Dokument užívateľa neexistuje v Firestore');
            setUserData(null);
          }
        } catch (error) {
          console.error('AuthProvider: Chyba pri získavaní údajov o užívateľovi:', error);
          setUserData(null);
        }
      } else {
        console.log('AuthProvider: Užívateľ nie je prihlásený');
        setUserData(null);
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
    login,
    register,
    logout,
  };

  console.log('AuthProvider: Render - loading:', loading, 'currentUser:', currentUser?.uid, 'userData:', userData);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress sx={{ color: '#ff9f43' }} />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}; 