import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Typography,
  styled,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer as MuiTableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { collection, query, getDocs, where, Timestamp, orderBy, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';
import { useThemeMode } from '../contexts/ThemeContext';

interface BusinessCase {
  id?: string;
  companyName: string;
  vatNumber: string;
  companyAddress: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  internalNote: string;
  status: string;
  reminderDateTime: Date | null;
  reminderNote: string;
  createdAt: Timestamp;
  createdBy: {
    firstName: string;
    lastName: string;
  };
  countryCode?: string;
}

interface Reminder {
  id?: string;
  userId: string;
  userEmail: string;
  businessCaseId: string;
  reminderDateTime: Timestamp;
  companyName: string;
  reminderNote: string;
  contactPerson: {
    firstName: string;
    lastName: string;
    phone: string;
    email: string;
  };
  createdAt: Timestamp;
  sent: boolean;
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

const ChartContainer = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  borderRadius: '16px',
  padding: '24px',
  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
  boxShadow: isDarkMode 
    ? '0 8px 32px rgba(0, 0, 0, 0.4)'
    : '0 4px 12px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: isDarkMode 
      ? '0 12px 40px rgba(0, 0, 0, 0.5)'
      : '0 8px 24px rgba(0, 0, 0, 0.1)',
    border: `2px solid ${isDarkMode ? 'rgba(255, 159, 67, 0.3)' : '#ff9f43'}`,
  },
  '& .recharts-text': {
    fill: isDarkMode ? '#ffffff' : '#000000',
  },
  '& .recharts-cartesian-grid-horizontal line, & .recharts-cartesian-grid-vertical line': {
    stroke: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.2)',
  }
}));

const DataTableContainer = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  borderRadius: '16px',
  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
  backdropFilter: 'blur(10px)',
  boxShadow: isDarkMode 
    ? '0 8px 32px rgba(0, 0, 0, 0.4)'
    : '0 4px 12px rgba(0, 0, 0, 0.05)',
  overflow: 'hidden',
  '& .MuiTableCell-root': {
    color: isDarkMode ? '#ffffff' : '#1a1a1a',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0',
    padding: '16px',
    fontSize: '0.875rem',
  },
  '& .MuiTableCell-head': {
    color: isDarkMode ? '#ffffff' : '#1a1a1a',
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f5f5f5',
    fontWeight: 600,
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    fontSize: '0.75rem',
    borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
  },
  '& .MuiTableRow-root': {
    transition: 'background-color 0.2s ease',
    borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : '#f0f0f0'}`,
    '&:hover': {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#fafafa',
    },
    '&:nth-of-type(odd)': {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.02)' : '#f8f8f8',
    }
  }
}));

const COLORS = ['#ff9f43', '#ffd43b', '#ff6b6b', '#ff9ff3', '#48dbfb'];
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, isActive }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 1.2;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <g style={{ 
      opacity: isActive ? 1 : 0.9,
      transition: 'all 0.3s ease-in-out',
      pointerEvents: 'none'
    }}>
      <text
        x={x}
        y={y}
        fill="#FFFFFF"
        textAnchor={x > cx ? 'start' : 'end'}
        dominantBaseline="central"
        style={{ 
          fontSize: isActive ? '15px' : '14px', 
          fontWeight: isActive ? 600 : 500,
          filter: 'drop-shadow(0px 2px 3px rgba(0,0,0,0.5))',
          transition: 'all 0.3s ease-in-out'
        }}
      >
        {`${name}: ${value} (${(percent * 100).toFixed(1)}%)`}
      </text>
    </g>
  );
};

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload[0]) {
    return (
      <Box
        sx={{
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          border: '1px solid rgba(255, 255, 255, 0.1)',
          borderRadius: '8px',
          padding: '12px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
        }}
      >
        <Typography sx={{ 
          color: payload[0].payload.fill,
          fontWeight: 600,
          fontSize: '0.9rem',
          mb: 1
        }}>
          {payload[0].name}
        </Typography>
        <Typography sx={{ 
          color: '#fff',
          fontSize: '0.85rem',
          mb: 0.5
        }}>
          Počet: {payload[0].value}
        </Typography>
        <Typography sx={{ 
          color: 'rgba(255, 255, 255, 0.7)',
          fontSize: '0.8rem'
        }}>
          {((payload[0].value / payload[0].payload.total) * 100).toFixed(1)}%
        </Typography>
      </Box>
    );
  }
  return null;
};

const CustomLegend = ({ payload }: any) => {
  return (
    <Box sx={{ 
      display: 'flex', 
      flexDirection: 'column',
      gap: 1,
      position: 'absolute',
      right: 0,
      top: '50%',
      transform: 'translateY(-50%)',
      pr: 2
    }}>
      {payload.map((entry: any, index: number) => (
        <Box
          key={entry.value}
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            '&:hover': {
              transform: 'translateX(-5px)'
            }
          }}
        >
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: '4px',
              backgroundColor: entry.color,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)'
            }}
          />
          <Typography sx={{ 
            color: '#fff',
            fontSize: '0.85rem',
            fontWeight: 500
          }}>
            {entry.value}
          </Typography>
        </Box>
      ))}
    </Box>
  );
};

const ProgressBarTooltip = styled(Box)({
  position: 'absolute',
  backgroundColor: 'rgba(0, 0, 0, 0.85)',
  color: '#ffffff',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '0.9rem',
  zIndex: 1000,
  pointerEvents: 'none',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(8px)',
  '& .MuiTypography-root': {
    color: '#ffffff',
  }
});

// Add animation variants
const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      when: "beforeChildren",
      staggerChildren: 0.2
    }
  }
};

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5 }
  }
};

const progressVariants = {
  hidden: { width: 0 },
  visible: (percentage: number) => ({
    width: `${percentage}%`,
    transition: { duration: 1, ease: "easeOut" }
  })
};

const StatsContainer = styled(Box)({
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
  gap: '24px',
  marginBottom: '32px',
  width: '100%',
});

const StatusBar = styled(Box)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  borderRadius: '16px',
  border: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
  padding: '24px',
  marginBottom: '24px',
  boxShadow: isDarkMode 
    ? '0 8px 32px rgba(0, 0, 0, 0.4)'
    : '0 4px 12px rgba(0, 0, 0, 0.05)',
  '& .status-legend': {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '16px',
    marginTop: '16px',
    '& .status-item': {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '8px 12px',
      borderRadius: '8px',
      border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.15)' : '#e0e0e0'}`,
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : '#f8f8f8',
      '& .status-color': {
        width: '12px',
        height: '12px',
        borderRadius: '4px',
        border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.1)'}`,
      },
      '& .status-text': {
        color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
        fontSize: '0.875rem',
      }
    }
  }
}));

export default function Dashboard() {
  const { userData } = useAuth();
  const { isDarkMode } = useThemeMode();
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [stats, setStats] = useState({
    totalBusinessCases: 0,
    totalContacts: 0,
    totalReminders: 0,
    totalTeamMembers: 0,
    statusDistribution: [] as { name: string; value: number; total?: number }[],
    recentBusinessCases: [] as BusinessCase[],
    upcomingReminders: [] as Reminder[],
  });
  const [tooltipData, setTooltipData] = useState<{
    show: boolean;
    x: number;
    y: number;
    data: { name: string; value: number; total?: number };
  }>({
    show: false,
    x: 0,
    y: 0,
    data: { name: '', value: 0 }
  });

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

  const fetchDashboardData = async () => {
    console.log('Dashboard: Začínam načítavanie dát');
    console.log('Dashboard: userData:', userData);

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
        orderBy('createdAt', 'desc')
      );
      console.log('Dashboard: Business Cases Query:', businessCasesQuery);
      const businessCasesSnapshot = await getDocs(businessCasesQuery);
      console.log('Dashboard: Business Cases Raw Data:', businessCasesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      console.log('Dashboard: Počet nájdených business cases:', businessCasesSnapshot.size);
      
      const businessCases = businessCasesSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt instanceof Timestamp ? data.createdAt : new Timestamp(data.createdAt.seconds, data.createdAt.nanoseconds)
        };
      }) as BusinessCase[];

      // Fetch contacts
      const contactsQuery = query(
        collection(db, 'contacts'),
        where('companyID', '==', userData.companyID),
        orderBy('createdAt', 'desc')
      );
      console.log('Dashboard: Contacts Query:', contactsQuery);
      const contactsSnapshot = await getDocs(contactsQuery);
      console.log('Dashboard: Contacts Raw Data:', contactsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      console.log('Dashboard: Počet nájdených kontaktov:', contactsSnapshot.size);

      // Fetch reminders
      const now = Timestamp.now();
      const remindersQuery = query(
        collection(db, 'reminders'),
        where('companyID', '==', userData.companyID),
        where('reminderDateTime', '>=', now),
        where('sent', '==', false)
      );
      console.log('Dashboard: Reminders Query:', remindersQuery);
      const remindersSnapshot = await getDocs(remindersQuery);
      console.log('Dashboard: Reminders Raw Data:', remindersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      console.log('Dashboard: Počet nájdených pripomienok:', remindersSnapshot.size);

      // Fetch team members
      const usersQuery = query(
        collection(db, 'users'),
        where('companyID', '==', userData.companyID)
      );
      console.log('Dashboard: Users Query:', usersQuery);
      const usersSnapshot = await getDocs(usersQuery);
      console.log('Dashboard: Users Raw Data:', usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      console.log('Dashboard: Počet nájdených členov tímu:', usersSnapshot.size);

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

      // Sort business cases by creation date
      const sortedBusinessCases = businessCases.sort((a, b) => {
        const dateA = a.createdAt instanceof Timestamp ? a.createdAt.toDate() : new Date(a.createdAt);
        const dateB = b.createdAt instanceof Timestamp ? b.createdAt.toDate() : new Date(b.createdAt);
        return dateB.getTime() - dateA.getTime();
      });

      // Sort reminders by date
      const reminders = remindersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          reminderDateTime: data.reminderDateTime instanceof Timestamp ? 
            data.reminderDateTime : 
            new Timestamp(data.reminderDateTime.seconds, data.reminderDateTime.nanoseconds)
        };
      }) as Reminder[];

      const sortedReminders = reminders.sort((a, b) => {
        const dateA = a.reminderDateTime instanceof Timestamp ? a.reminderDateTime.toDate() : new Date(a.reminderDateTime);
        const dateB = b.reminderDateTime instanceof Timestamp ? b.reminderDateTime.toDate() : new Date(b.reminderDateTime);
        return dateA.getTime() - dateB.getTime();
      });

      console.log('Dashboard: Aktualizujem stav s novými dátami');
      setStats({
        totalBusinessCases: businessCasesSnapshot.size,
        totalContacts: contactsSnapshot.size,
        totalReminders: remindersSnapshot.size,
        totalTeamMembers: usersSnapshot.size,
        statusDistribution,
        recentBusinessCases: sortedBusinessCases.slice(0, 5),
        upcomingReminders: sortedReminders.slice(0, 5),
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
                    end={stats.totalReminders}
                    duration={2.5}
                    separator=" "
                  />
                </Typography>
              </Box>
              <Typography variant="body1" sx={{ 
                opacity: 0.7,
                fontSize: { xs: '0.9rem', sm: '1rem' }
              }}>Aktívne pripomienky</Typography>
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
              <Box 
                ref={containerRef}
                sx={{ 
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: { xs: 1.5, sm: 2 },
                position: 'relative'
              }}>
                {tooltipData.show && (
                  <ProgressBarTooltip
                    sx={{
                      left: `${tooltipData.x}px`,
                      top: `${tooltipData.y}px`,
                    }}
                  >
                    <Typography sx={{ 
                      fontWeight: 600, 
                      mb: 0.5,
                      color: '#ffffff'
                    }}>
                      {tooltipData.data.name}
                    </Typography>
                    <Typography sx={{ color: '#ffffff' }}>
                      {tooltipData.data.value} ({((tooltipData.data.value / (tooltipData.data.total || 1)) * 100).toFixed(1)}%)
                    </Typography>
                  </ProgressBarTooltip>
                )}
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
                      <motion.div
                        key={item.name}
                        style={{
                          height: '100%',
                          backgroundColor: COLORS[index % COLORS.length],
                          position: 'relative',
                          borderRight: index !== stats.statusDistribution.length - 1 ? '2px solid rgba(0,0,0,0.1)' : 'none'
                        }}
                        variants={progressVariants}
                        initial="hidden"
                        animate="visible"
                        custom={percentage}
                        whileHover={{
                          filter: 'brightness(1.1)',
                          transition: { duration: 0.2 }
                        }}
                        onMouseEnter={(e) => {
                          if (!containerRef.current) return;
                          const containerRect = containerRef.current.getBoundingClientRect();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipData({
                            show: true,
                            x: rect.left - containerRect.left,
                            y: rect.top - containerRect.top - 40,
                            data: item
                          });
                        }}
                        onMouseMove={(e) => {
                          if (!containerRef.current) return;
                          const containerRect = containerRef.current.getBoundingClientRect();
                          const rect = e.currentTarget.getBoundingClientRect();
                          setTooltipData(prev => ({
                            ...prev,
                            x: rect.left - containerRect.left,
                            y: rect.top - containerRect.top - 40,
                          }));
                        }}
                        onMouseLeave={() => {
                          setTooltipData(prev => ({ ...prev, show: false }));
                        }}
                      />
                    );
                  })}
                </Box>

                {/* Legend with animation */}
                <Box
                  component={motion.div}
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  sx={{ 
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: { xs: 1, sm: 2 },
                    mt: { xs: 0.5, sm: 1 }
                  }}
                >
                  {stats.statusDistribution.map((item, index) => (
                    <motion.div
                      key={item.name}
                      variants={cardVariants}
                      whileHover={{ x: 5, transition: { duration: 0.2 } }}
                    >
                      <Box
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
                          {item.name}: <CountUp
                            end={item.value}
                            duration={2}
                            separator=" "
                          /> ({((item.value / (item.total || 1)) * 100).toFixed(1)}%)
                        </Typography>
                      </Box>
                    </motion.div>
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

        {/* Najnovšie obchodné prípady */}
        <Grid item xs={12}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Typography variant="h6" sx={{ 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                color: isDarkMode ? '#ffffff' : '#000000'
              }}>Najnovšie obchodné prípady</Typography>
              <DataTableContainer isDarkMode={isDarkMode}>
                <MuiTableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>Firma</TableCell>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>Status</TableCell>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>Dátum</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.recentBusinessCases.map((bc: BusinessCase) => (
                        <TableRow key={bc.id}>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#000000',
                            padding: { xs: '8px', sm: '16px' },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' }
                          }}>{bc.companyName}</TableCell>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#000000',
                            padding: { xs: '8px', sm: '16px' },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' }
                          }}>{bc.status}</TableCell>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#000000',
                            padding: { xs: '8px', sm: '16px' },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' }
                          }}>
                            {bc.createdAt instanceof Timestamp ? 
                              bc.createdAt.toDate().toLocaleDateString('sk-SK') :
                              new Date(bc.createdAt).toLocaleDateString('sk-SK')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </MuiTableContainer>
              </DataTableContainer>
            </StatsCardContent>
          </StatsCard>
        </Grid>

        {/* Nadchádzajúce pripomienky */}
        <Grid item xs={12}>
          <StatsCard isDarkMode={isDarkMode}>
            <StatsCardContent>
              <Typography variant="h6" sx={{ 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' },
                color: isDarkMode ? '#ffffff' : '#000000'
              }}>Nadchádzajúce pripomienky</Typography>
              <DataTableContainer isDarkMode={isDarkMode}>
                <MuiTableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>Firma</TableCell>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>Poznámka</TableCell>
                        <TableCell sx={{ 
                          color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>Dátum a čas</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {stats.upcomingReminders.map((reminder: Reminder) => (
                        <TableRow key={reminder.id}>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#000000',
                            padding: { xs: '8px', sm: '16px' },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' }
                          }}>{reminder.companyName}</TableCell>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#000000',
                            padding: { xs: '8px', sm: '16px' },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' }
                          }}>{reminder.reminderNote}</TableCell>
                          <TableCell sx={{ 
                            color: isDarkMode ? '#ffffff' : '#000000',
                            padding: { xs: '8px', sm: '16px' },
                            fontSize: { xs: '0.8rem', sm: '0.9rem' }
                          }}>
                            {reminder.reminderDateTime instanceof Timestamp ? 
                              reminder.reminderDateTime.toDate().toLocaleString('sk-SK') :
                              new Date(reminder.reminderDateTime).toLocaleString('sk-SK')}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </MuiTableContainer>
              </DataTableContainer>
            </StatsCardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </PageWrapper>
  );
} 