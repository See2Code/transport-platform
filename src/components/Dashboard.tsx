import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  styled,
  Card,
  CardContent,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { collection, query, getDocs, where, Timestamp, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import CountUp from 'react-countup';
import { useThemeMode } from '../contexts/ThemeContext';

interface BusinessCase {
  id?: string;
  companyName: string;
  vatNumber: string;
  status: string;
  createdAt: Timestamp | any;
  companyID: string;
}

const PageWrapper = styled(Box)(({ theme }) => ({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
}));

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px'
  }
}));

const PageTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
  }
}));

const StatsCard = styled(Card)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#f8f9fa',
  borderRadius: '16px !important',
  border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#c0c0c0'} !important`,
  boxShadow: `${isDarkMode 
    ? '0 8px 32px 0 rgba(0, 0, 0, 0.4)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)'} !important`,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  overflow: 'hidden',
  position: 'relative',
  '&.MuiPaper-root': {
    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#f8f9fa !important',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#c0c0c0'} !important`,
  },
  '&:before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
    backgroundColor: '#ff9f43'
  },
  '& .MuiTypography-h4': {
    color: isDarkMode ? '#ffffff' : '#2d3436',
    fontWeight: 600,
    fontSize: '2rem'
  },
  '& .MuiTypography-body1': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(45, 52, 54, 0.7)',
    fontWeight: 500
  },
  '& .MuiSvgIcon-root': {
    filter: `drop-shadow(0 2px 4px ${isDarkMode ? 'rgba(0, 0, 0, 0.4)' : 'rgba(0, 0, 0, 0.2)'})`
  },
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: `${isDarkMode 
      ? '0 12px 40px rgba(0, 0, 0, 0.5)'
      : '0 8px 30px rgba(0, 0, 0, 0.15)'} !important`,
    border: `1px solid #ff9f43 !important`,
    backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.98)' : '#ffffff'
  }
}));

const StatsCardContent = styled(CardContent)({
  padding: '24px',
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
  transition: 'all 0.3s ease',
  position: 'relative',
  zIndex: 1,
  '&:last-child': {
    paddingBottom: '24px'
  }
});

const COLORS = ['#ff9f43', '#ffd43b', '#ff6b6b', '#ff9ff3', '#48dbfb'];

export default function Dashboard() {
  const { userData } = useAuth();
  const { isDarkMode } = useThemeMode();
  const [stats, setStats] = useState({
    totalBusinessCases: 0,
    totalContacts: 0,
    activeBusinessCases: 0,
    totalTeamMembers: 0,
    statusDistribution: [] as { name: string; value: number; total?: number }[],
  });

  const fetchDashboardData = async () => {
    console.log('Dashboard: Začínam načítavanie dát');

    if (!userData) {
      console.log('Dashboard: userData je null - užívateľ nie je prihlásený alebo údaje neboli načítané');
      return;
    }

    if (!userData.companyID) {
      console.log('Dashboard: companyID nie je nastavené - užívateľ nemá priradenú firmu');
      return;
    }

    console.log('Dashboard: Načítavam dáta pre companyID:', userData.companyID);

    try {
      // Fetch business cases
      const businessCasesQuery = query(
        collection(db, 'businessCases'),
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc'),
        limit(15)
      );
      const businessCasesSnapshot = await getDocs(businessCasesQuery);
      const businessCases = businessCasesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt
        };
      }) as BusinessCase[];

      // Calculate active business cases
      const activeBusinessCases = businessCases.filter(bc => 
        bc.status !== 'CLOSED' && 
        bc.status !== 'CANCELED' && 
        bc.status !== 'REJECTED'
      ).length;

      console.log('Dashboard: Počet načítaných obchodných prípadov:', businessCases.length);
      console.log('Dashboard: Počet aktívnych obchodných prípadov:', activeBusinessCases);

      // Fetch contacts
      const contactsQuery = query(
        collection(db, 'contacts'),
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      const contactsSnapshot = await getDocs(contactsQuery);

      // Fetch team members
      const usersQuery = query(
        collection(db, 'users'),
        where('companyID', '==', userData.companyID)
      );
      const usersSnapshot = await getDocs(usersQuery);

      // Calculate status distribution
      const statusCounts: { [key: string]: number } = {};
      businessCases.forEach(bc => {
        if (bc.status) {
          statusCounts[bc.status] = (statusCounts[bc.status] || 0) + 1;
        }
      });

      const total = businessCases.length;
      const statusDistribution = Object.entries(statusCounts)
        .map(([name, value], index) => ({
          name: name || 'Neznámy',
          value,
          fill: COLORS[index % COLORS.length],
          total
        }))
        .sort((a, b) => b.value - a.value);

      console.log('Dashboard: Aktualizujem stav s novými dátami');
      setStats({
        totalBusinessCases: businessCasesSnapshot.size,
        totalContacts: contactsSnapshot.size,
        activeBusinessCases,
        totalTeamMembers: usersSnapshot.size,
        statusDistribution,
      });

    } catch (error) {
      console.error('Dashboard: Chyba pri načítaní dát:', error);
      if (error instanceof Error) {
        console.error('Dashboard: Detail chyby:', error.message);
        console.error('Dashboard: Stack trace:', error.stack);
      }
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [userData]);

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>Dashboard</PageTitle>
      </PageHeader>

      <Grid container spacing={3}>
        {/* Štatistické karty */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <BusinessIcon sx={{ 
                  color: '#ff9f43', 
                  fontSize: { xs: 32, sm: 40 } 
                }} />
                <Typography variant="h4" sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  <CountUp
                    end={stats.totalBusinessCases}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Obchodné prípady</Typography>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <PersonIcon sx={{ 
                  color: '#ffd43b', 
                  fontSize: { xs: 32, sm: 40 } 
                }} />
                <Typography variant="h4" sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  <CountUp
                    end={stats.totalContacts}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Kontakty</Typography>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <NotificationsIcon sx={{ 
                  color: '#ff6b6b', 
                  fontSize: { xs: 32, sm: 40 } 
                }} />
                <Typography variant="h4" sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  <CountUp
                    end={stats.activeBusinessCases}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Aktívne obchodné prípady</Typography>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <PersonIcon sx={{ 
                  color: '#ff9ff3', 
                  fontSize: { xs: 32, sm: 40 } 
                }} />
                <Typography variant="h4" sx={{
                  fontSize: { xs: '1.5rem', sm: '2rem' }
                }}>
                  <CountUp
                    end={stats.totalTeamMembers}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Členovia tímu</Typography>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        {/* Grafy */}
        <Grid item xs={12}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Typography variant="h6" sx={{ 
                mb: { xs: 2, sm: 3 }, 
                color: isDarkMode ? '#ffffff' : '#000000',
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                fontWeight: 600
              }}>
                Rozdelenie podľa statusu
              </Typography>
              <Box sx={{ 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, sm: 2 },
                position: 'relative'
              }}>
                {/* Progress Bar Container */}
                <Box sx={{ 
                  width: '100%',
                  height: { xs: '20px', sm: '24px' },
                  borderRadius: { xs: '10px', sm: '12px' },
                  overflow: 'hidden',
                  display: 'flex',
                  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                }}>
                  {stats.statusDistribution.map((item, index) => {
                    const percentage = (item.value / (item.total || 1)) * 100;
                    return (
                      <Box
                        key={item.name}
                        sx={{
                          width: `${percentage}%`,
                          height: '100%',
                          backgroundColor: COLORS[index % COLORS.length],
                          position: 'relative',
                          borderRight: index !== stats.statusDistribution.length - 1 ? '2px solid rgba(0,0,0,0.1)' : 'none'
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Legend */}
                <Box
                  sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: { xs: 1, sm: 2 },
                    mt: { xs: 0.5, sm: 1 }
                  }}
                >
                  {stats.statusDistribution.map((item, index) => (
                    <Box
                      key={item.name}
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        flexBasis: { xs: '45%', sm: 'auto' }
                      }}
                    >
                      <Box
                        sx={{
                          width: { xs: '10px', sm: '12px' },
                          height: { xs: '10px', sm: '12px' },
                          borderRadius: '3px',
                          backgroundColor: COLORS[index % COLORS.length]
                        }}
                      />
                      <Typography sx={{ 
                        color: isDarkMode ? '#ffffff' : '#000000',
                        fontSize: { xs: '0.8rem', sm: '0.9rem' },
                        fontWeight: 500
                      }}>
                        {item.name}: {item.value} ({((item.value / (item.total || 1)) * 100).toFixed(1)}%)
                      </Typography>
                    </Box>
                  ))}
                </Box>

                {/* Total */}
                <Typography sx={{ 
                  color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  fontWeight: 500,
                  mt: { xs: 0.5, sm: 1 }
                }}>
                  Celkom: {stats.statusDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                </Typography>
              </Box>
            </StatsCardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </PageWrapper>
  );
} 