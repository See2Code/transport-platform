import React from 'react';
import {
  Box,
  Container,
  Grid,
  Paper,
  Typography,
  Card,
  CardContent,
  CardActions,
  Button,
  IconButton,
  AppBar,
  Toolbar,
  Avatar,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  LocalShipping as TransportIcon,
  People as TeamIcon,
  Settings as SettingsIcon,
  Notifications as NotificationsIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

function Dashboard() {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    // Tu bude logika pre odhlásenie
    navigate('/login');
  };

  const menuItems = [
    { icon: <TransportIcon />, title: 'Transporty', description: 'Správa transportov a zásielok' },
    { icon: <TeamIcon />, title: 'Tím', description: 'Správa členov tímu a oprávnení' },
    { icon: <SettingsIcon />, title: 'Nastavenia', description: 'Nastavenia firmy a profilu' },
  ];

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Transport Platform
          </Typography>
          <IconButton color="inherit">
            <NotificationsIcon />
          </IconButton>
          <IconButton
            onClick={handleMenu}
            color="inherit"
          >
            <Avatar sx={{ width: 32, height: 32 }}>
              <AccountIcon />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem onClick={handleClose}>
              <AccountIcon sx={{ mr: 1 }} /> Profil
            </MenuItem>
            <MenuItem onClick={handleClose}>
              <SettingsIcon sx={{ mr: 1 }} /> Nastavenia
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <LogoutIcon sx={{ mr: 1 }} /> Odhlásiť sa
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Paper sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
              <Typography variant="h4" gutterBottom>
                Vitajte v Transport Platform
              </Typography>
              <Typography variant="subtitle1" color="text.secondary">
                Tu môžete spravovať všetky vaše transporty a tím
              </Typography>
            </Paper>
          </Grid>

          {menuItems.map((item) => (
            <Grid item xs={12} sm={6} md={4} key={item.title}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    {item.icon}
                    <Typography variant="h6" component="h2" sx={{ ml: 1 }}>
                      {item.title}
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary">
                    {item.description}
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" color="primary">
                    Otvoriť
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      </Container>
    </Box>
  );
}

export default Dashboard; 