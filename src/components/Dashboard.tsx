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
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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
const RADIAN = Math.PI / 180;

const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index, name, value, isActive }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  const sin = Math.sin(-RADIAN * midAngle);
  const cos = Math.cos(-RADIAN * midAngle);
  const mx = cx + (outerRadius + 30) * cos;
  const my = cy + (outerRadius + 30) * sin;
  const ex = mx + (cos >= 0 ? 1 : -1) * 22;
  const ey = my;
  const textAnchor = cos >= 0 ? 'start' : 'end';

  return (
    <g style={{ 
      opacity: isActive ? 1 : 0.9,
      transition: 'all 0.3s ease-in-out'
    }}>
      <path
        d={`M${x},${y}L${mx},${my}L${ex},${ey}`}
        stroke={COLORS[index % COLORS.length]}
        fill="none"
        strokeWidth={isActive ? 2 : 1}
      />
      <circle cx={ex} cy={ey} r={2} fill={COLORS[index % COLORS.length]} stroke="none" />
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        textAnchor={textAnchor}
        fill="#FFFFFF"
        style={{ 
          fontSize: isActive ? '15px' : '14px', 
          fontWeight: isActive ? 600 : 500,
          transition: 'all 0.3s ease-in-out'
        }}
      >{`${name}: ${value}`}</text>
      <text
        x={ex + (cos >= 0 ? 1 : -1) * 12}
        y={ey}
        dy={18}
        textAnchor={textAnchor}
        fill="#FFFFFF"
        style={{ 
          fontSize: isActive ? '13px' : '12px', 
          opacity: isActive ? 0.8 : 0.7,
          transition: 'all 0.3s ease-in-out'
        }}
      >{`(${(percent * 100).toFixed(1)}%)`}</text>
    </g>
  );
};

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
  const [activeIndex, setActiveIndex] = useState(0);
  const [stats, setStats] = useState({
    totalBusinessCases: 0,
    totalContacts: 0,
    totalReminders: 0,
    totalTeamMembers: 0,
    statusDistribution: [] as { name: string; value: number; total?: number }[],
    recentBusinessCases: [] as BusinessCase[],
    upcomingReminders: [] as Reminder[],
  });

  const onPieEnter = (_: any, index: number) => {
    setActiveIndex(index);
  };

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
        let maxValue = 0;
        businessCases.forEach(bc => {
          statusCounts[bc.status] = (statusCounts[bc.status] || 0) + 1;
          if (statusCounts[bc.status] > maxValue) maxValue = statusCounts[bc.status];
        });

        const total = businessCases.length;
        const statusDistribution = Object.entries(statusCounts)
          .map(([name, value], index) => ({
            name,
            value,
            fill: COLORS[index % COLORS.length],
            total
          }))
          .sort((a, b) => b.value - a.value);

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
              <Typography variant="h6" sx={{ mb: 2, color: '#ffffff' }}>Rozdelenie podľa statusu</Typography>
              <Box sx={{ 
                height: 400, 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center',
                position: 'relative',
                perspective: '1000px'
              }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <defs>
                      {COLORS.map((color, index) => (
                        <React.Fragment key={`defs-${index}`}>
                          <linearGradient 
                            id={`gradient-${index}`} 
                            x1="0" 
                            y1="0" 
                            x2="1" 
                            y2="1"
                          >
                            <stop offset="0%" stopColor={color} stopOpacity={1} />
                            <stop offset="50%" stopColor={color} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={color} stopOpacity={0.8} />
                          </linearGradient>
                          <filter id={`shadow-${index}`} x="-50%" y="-50%" width="200%" height="200%">
                            <feOffset result="offOut" in="SourceGraphic" dx="2" dy="2" />
                            <feGaussianBlur result="blurOut" in="offOut" stdDeviation="5" />
                            <feBlend in="SourceGraphic" in2="blurOut" mode="normal" />
                            <feComponentTransfer>
                              <feFuncA type="linear" slope="0.7"/>
                            </feComponentTransfer>
                          </filter>
                        </React.Fragment>
                      ))}
                    </defs>
                    <Pie
                      data={stats.statusDistribution}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={(props) => renderCustomizedLabel({ ...props, isActive: props.index === activeIndex })}
                      outerRadius={130}
                      innerRadius={70}
                      paddingAngle={8}
                      dataKey="value"
                      startAngle={90}
                      endAngle={450}
                      onMouseEnter={onPieEnter}
                    >
                      {stats.statusDistribution.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={`url(#gradient-${index % COLORS.length})`}
                          stroke={COLORS[index % COLORS.length]}
                          strokeWidth={3}
                          style={{
                            filter: index === activeIndex 
                              ? `url(#shadow-${index}) drop-shadow(0 4px 8px rgba(0,0,0,0.3))` 
                              : `url(#shadow-${index})`,
                            transform: index === activeIndex 
                              ? 'scale(1.05) translateY(-5px)' 
                              : 'scale(1) translateY(0)',
                            transformOrigin: 'center',
                            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                            opacity: index === activeIndex ? 1 : 0.85
                          }}
                        />
                      ))}
                    </Pie>
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