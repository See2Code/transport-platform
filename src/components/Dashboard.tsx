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
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import CountUp from 'react-countup';
import { motion } from 'framer-motion';

const PageWrapper = styled(Box)(({ theme }) => ({
  padding: '30px',
  [theme.breakpoints.down('sm')]: {
    padding: '16px',
  }
}));

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '30px',
  [theme.breakpoints.down('sm')]: {
    marginBottom: '20px',
  }
}));

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: '#ffffff',
  position: 'relative',
  [theme.breakpoints.down('sm')]: {
    fontSize: '1.5rem',
  },
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
}));

const StatsCard = styled(motion(Card))(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderRadius: '16px',
  backdropFilter: 'blur(10px)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  transition: 'all 0.3s ease',
  '&:hover': {
    transform: 'translateY(-5px)',
    boxShadow: '0 8px 24px rgba(0, 184, 148, 0.2)',
  },
  [theme.breakpoints.down('sm')]: {
    borderRadius: '12px',
  }
}));

const COLORS = ['#00b894', '#00cec9', '#0984e3', '#6c5ce7', '#fd79a8'];
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
  color: '#fff',
  padding: '8px 12px',
  borderRadius: '8px',
  fontSize: '0.9rem',
  zIndex: 1000,
  pointerEvents: 'none',
  transition: 'all 0.2s ease',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
  border: '1px solid rgba(255, 255, 255, 0.1)',
  backdropFilter: 'blur(8px)',
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

export default function Dashboard() {
  const { userData } = useAuth();
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

      <Grid container spacing={{ xs: 2, sm: 3 }}>
        {/* Štatistické karty */}
        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: { xs: 2, sm: 3 } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <BusinessIcon sx={{ 
                  color: '#00b894', 
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
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: { xs: 2, sm: 3 } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <PersonIcon sx={{ 
                  color: '#00cec9', 
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
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: { xs: 2, sm: 3 } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <NotificationsIcon sx={{ 
                  color: '#0984e3', 
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
            </CardContent>
          </StatsCard>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <StatsCard
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            whileHover={{ scale: 1.02 }}
            transition={{ duration: 0.2 }}
          >
            <CardContent sx={{ 
              p: { xs: 2, sm: 3 },
              '&:last-child': { pb: { xs: 2, sm: 3 } }
            }}>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: { xs: 1, sm: 2 }, 
                mb: { xs: 1, sm: 2 } 
              }}>
                <PersonIcon sx={{ 
                  color: '#6c5ce7', 
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
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Grafy */}
        <Grid item xs={12}>
          <StatsCard>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ 
                mb: { xs: 2, sm: 3 }, 
                color: '#ffffff',
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
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
                    <Typography sx={{ fontWeight: 600, mb: 0.5 }}>
                      {tooltipData.data.name}
                    </Typography>
                    <Typography>
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
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
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
                          color: '#fff',
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
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
                  color: 'rgba(255, 255, 255, 0.7)',
                  fontSize: { xs: '0.8rem', sm: '0.9rem' },
                  mt: { xs: 0.5, sm: 1 }
                }}>
                  Celkom: {stats.statusDistribution.reduce((acc, curr) => acc + curr.value, 0)}
                </Typography>
              </Box>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Najnovšie obchodné prípady */}
        <Grid item xs={12}>
          <StatsCard>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}>Najnovšie obchodné prípady</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: { xs: '8px', sm: '16px' },
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}>Firma</TableCell>
                      <TableCell sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: { xs: '8px', sm: '16px' },
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}>Status</TableCell>
                      <TableCell sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: { xs: '8px', sm: '16px' },
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}>Dátum</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.recentBusinessCases.map((bc: BusinessCase) => (
                      <TableRow key={bc.id}>
                        <TableCell sx={{ 
                          color: '#ffffff',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>{bc.companyName}</TableCell>
                        <TableCell sx={{ 
                          color: '#ffffff',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>{bc.status}</TableCell>
                        <TableCell sx={{ 
                          color: '#ffffff',
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
              </TableContainer>
            </CardContent>
          </StatsCard>
        </Grid>

        {/* Nadchádzajúce pripomienky */}
        <Grid item xs={12}>
          <StatsCard>
            <CardContent sx={{ p: { xs: 2, sm: 3 } }}>
              <Typography variant="h6" sx={{ 
                mb: { xs: 1.5, sm: 2 },
                fontSize: { xs: '1.1rem', sm: '1.25rem' }
              }}>Nadchádzajúce pripomienky</Typography>
              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: { xs: '8px', sm: '16px' },
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}>Firma</TableCell>
                      <TableCell sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: { xs: '8px', sm: '16px' },
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}>Poznámka</TableCell>
                      <TableCell sx={{ 
                        color: 'rgba(255, 255, 255, 0.7)',
                        padding: { xs: '8px', sm: '16px' },
                        fontSize: { xs: '0.8rem', sm: '0.9rem' }
                      }}>Dátum a čas</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {stats.upcomingReminders.map((reminder: Reminder) => (
                      <TableRow key={reminder.id}>
                        <TableCell sx={{ 
                          color: '#ffffff',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>{reminder.companyName}</TableCell>
                        <TableCell sx={{ 
                          color: '#ffffff',
                          padding: { xs: '8px', sm: '16px' },
                          fontSize: { xs: '0.8rem', sm: '0.9rem' }
                        }}>{reminder.reminderNote}</TableCell>
                        <TableCell sx={{ 
                          color: '#ffffff',
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
              </TableContainer>
            </CardContent>
          </StatsCard>
        </Grid>
      </Grid>
    </PageWrapper>
  );
} 