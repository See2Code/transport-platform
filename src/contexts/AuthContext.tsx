import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { CircularProgress, Box } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';
import { signOut, onAuthStateChanged } from 'firebase/auth';

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
  user: User | null;
  setUser: (user: User | null) => void;
  userData: UserData | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  setUser: () => {},
  userData: null,
  loading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log('AuthProvider: Inicializácia onAuthStateChanged');
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      console.log('AuthProvider: onAuthStateChanged callback - user:', user?.uid);
      setUser(user);
      
      if (user) {
        try {
          // Získanie údajov o užívateľovi z Firestore
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data() as UserData);
          }
        } catch (error) {
          console.error('Chyba pri získavaní údajov o užívateľovi:', error);
        }
      } else {
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
      setUser(null);
      setUserData(null);
    } catch (error) {
      console.error('Chyba pri odhlásení:', error);
      throw error;
    }
  };

  const value = {
    user,
    setUser,
    userData,
    loading,
    login,
    register,
    logout,
  };

  console.log('AuthProvider: Render - loading:', loading, 'user:', user?.uid, 'userData:', userData);

  return (
    <AuthContext.Provider value={value}>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
          <CircularProgress />
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}; 