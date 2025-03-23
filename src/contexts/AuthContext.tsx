import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from 'firebase/auth';
import { auth, db } from '../firebase';
import { CircularProgress, Box } from '@mui/material';
import { doc, getDoc } from 'firebase/firestore';

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
}

const AuthContext = createContext<AuthContextType>({ 
  currentUser: null, 
  userData: null,
  loading: true 
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

  const value = {
    currentUser,
    userData,
    loading
  };

  console.log('AuthProvider: Render - loading:', loading, 'currentUser:', currentUser?.uid, 'userData:', userData);

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