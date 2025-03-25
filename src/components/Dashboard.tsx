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
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import {
  Business as BusinessIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material';
import { collection, query, getDocs, where, Timestamp, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';

const PageWrapper = styled(Box)({
  padding: '30px',
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
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

const StatsCard = styled(Card)({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 24px rgba(0, 184, 148, 0.2)',
  }
});

const COLORS = ['#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#fd79a8'];

interface BusinessCase {
  id: string;
  companyName: string;
  status: string;
  createdAt: Timestamp;
  // ... ostatné polia môžu byť pridané podľa potreby
}

interface Reminder {
  id: string;
  companyName: string;
  reminderNote: string;
  reminderDateTime: Timestamp;
  // ... ostatné polia môžu byť pridané podľa potreby
}

export default function Dashboard() {
  const { userData } = useAuth();
  const [stats, setStats] = useState({
    totalBusinessCases: 0,
    totalContacts: 0,
    totalReminders: 0,
    totalTeamMembers: 0,
    statusDistribution: [] as { name: string; value: number }[],
    recentBusinessCases: [] as BusinessCase[],
    upcomingReminders: [] as Reminder[],
  });

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch business cases
        const businessCasesQuery = query(collection(db, 'businessCases'), orderBy('createdAt', 'desc'));
        const businessCasesSnapshot = await getDocs(businessCasesQuery);
        const businessCases = businessCasesSnapshot.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        })) as BusinessCase[];

        // Fetch contacts
        const contactsQuery = query(collection(db, 'contacts'));
        const contactsSnapshot = await getDocs(contactsQuery);

        // Fetch reminders
        const now = new Date();
        const remindersQuery = query(
          collection(db, 'reminders'),
          where('reminderDateTime', '>=', now),
          where('sent', '==', false),
          orderBy('reminderDateTime')
        );
        const remindersSnapshot = await getDocs(remindersQuery);

        // Fetch team members
        const usersQuery = query(collection(db, 'users'));
        const usersSnapshot = await getDocs(usersQuery);

        // Calculate status distribution
        const statusCounts: { [key: string]: number } = {};
        businessCases.forEach(bc => {
          statusCounts[bc.status] = (statusCounts[bc.status] || 0) + 1;
        });

        const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({
          name,
          value
        }));

        setStats({
          totalBusinessCases: businessCasesSnapshot.size,
          totalContacts: contactsSnapshot.size,
          totalReminders: remindersSnapshot.size,
          totalTeamMembers: usersSnapshot.size,
          statusDistribution,
          recentBusinessCases: businessCases.slice(0, 5),
          upcomingReminders: remindersSnapshot.docs
            .map(doc => ({ id: doc.id, ...doc.data() }))
            .slice(0, 5) as Reminder[],
        });

      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle>Dashboard</PageTitle>
      </PageHeader>

      <Grid container spacing={3}>
        {/* Štatistické karty */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <BusinessIcon sx={{ color: '#00b894', fontSize: 40 }} />
                <Typography variant="h4">{stats.totalBusinessCases}</Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.7 }}>Obchodné prípady</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PersonIcon sx={{ color: '#00cec9', fontSize: 40 }} />
                <Typography variant="h4">{stats.totalContacts}</Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.7 }}>Kontakty</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <NotificationsIcon sx={{ color: '#0984e3', fontSize: 40 }} />
                <Typography variant="h4">{stats.totalReminders}</Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.7 }}>Aktívne pripomienky</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <PersonIcon sx={{ color: '#6c5ce7', fontSize: 40 }} />
                <Typography variant="h4">{stats.totalTeamMembers}</Typography>
              </Box>
              <Typography variant="body1" sx={{ opacity: 0.7 }}>Členovia tímu</Typography>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Grafy */}
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Rozdelenie podľa statusu</Typography>
              <Box sx={{ height: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      fill="#8884d8"
                      label
                    >
                      {stats.statusDistribution.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Najnovšie obchodné prípady */}
        <Grid item xs={12} md={6}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Najnovšie obchodné prípady</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Firma</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Status</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Dátum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentBusinessCases.map((bc: BusinessCase) => (
                      <TableRow key={bc.id}>
                        <TableCell sx={{ color: '#ffffff' }}>{bc.companyName}</TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>{bc.status}</TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {bc.createdAt instanceof Timestamp ? 
                            bc.createdAt.toDate().toLocaleDateString('sk-SK') :
                            new Date(bc.createdAt).toLocaleDateString('sk-SK')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Nadchádzajúce pripomienky */}
        <Grid item xs={12}>
          <StatsCard>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Nadchádzajúce pripomienky</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Firma</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Poznámka</TableCell>
                      <TableCell sx={{ color: 'rgba(255, 255, 255, 0.7)' }}>Dátum a čas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.upcomingReminders.map((reminder: Reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell sx={{ color: '#ffffff' }}>{reminder.companyName}</TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>{reminder.reminderNote}</TableCell>
                        <TableCell sx={{ color: '#ffffff' }}>
                          {reminder.reminderDateTime instanceof Timestamp ? 
                            reminder.reminderDateTime.toDate().toLocaleString('sk-SK') :
                            new Date(reminder.reminderDateTime).toLocaleString('sk-SK')}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </PageWrapper>
  );
} 