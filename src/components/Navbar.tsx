import React, { useState } from 'react';
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  styled,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import HomeIcon from '@mui/icons-material/Home';
import GroupIcon from '@mui/icons-material/Group';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import AccountIcon from '@mui/icons-material/AccountCircle';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ContactsIcon from '@mui/icons-material/Contacts';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(35, 35, 66, 0.95)',
  color: '#ffffff',
  boxShadow: 'none',
  margin: '16px',
  borderRadius: '12px',
  width: `calc(100% - ${drawerWidth}px - 32px)`,
  '& .MuiToolbar-root': {
    minHeight: '56px',
  }
}));

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: '#00b894',
  fontSize: '1.5rem',
  marginRight: theme.spacing(2),
}));

const LogoContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: theme.spacing(2),
}));

const AesaLogo = styled('img')({
  height: '32px',
  width: 'auto',
  marginRight: '8px',
});

const AesaLogoDrawer = styled('img')({
  height: '40px',
  width: 'auto',
  marginBottom: '16px',
});

const DrawerHeader = styled('div')({
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  width: '100%',
});

const menuItems = [
  {
    text: 'Dashboard',
    icon: <HomeIcon />,
    path: '/dashboard'
  },
  {
    text: 'Sledovať prepravu',
    icon: <LocalShippingIcon />,
    path: '/transport'
  },
  {
    text: 'Sledované prepravy',
    icon: <LocalShippingIcon />,
    path: '/tracked-transports'
  },
  {
    text: 'Tím',
    icon: <GroupIcon />,
    path: '/team'
  },
  {
    text: 'Nastavenia',
    icon: <SettingsIcon />,
    path: '/settings'
  },
  {
    text: 'Kontakty',
    icon: <ContactsIcon />,
    path: '/contacts'
  }
];

const Navbar = () => {
  const navigate = useNavigate();
  const { userData } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationsAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationsClose = () => {
    setNotificationsAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const drawer = (
    <div>
      <DrawerHeader>
        <AesaLogoDrawer src="/AESA white.svg" alt="AESA Logo" />
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton onClick={() => navigate(item.path)}>
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
    </div>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <StyledAppBar
        position="fixed"
        sx={{
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          <Logo variant="h6" noWrap>
            CORE
          </Logo>
          <Typography 
            variant="h6" 
            noWrap 
            component="div" 
            sx={{ 
              flexGrow: 1, 
              color: '#ffffff',
              opacity: 0.7,
              fontWeight: 'normal'
            }}
          >
            Transport Platform
          </Typography>
          
          <IconButton
            onClick={handleNotificationsMenu}
            sx={{ 
              mr: 2, 
              color: '#ffffff',
              opacity: 0.7,
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)'
              }
            }}
          >
            <NotificationsIcon />
          </IconButton>
          <Menu
            anchorEl={notificationsAnchorEl}
            open={Boolean(notificationsAnchorEl)}
            onClose={handleNotificationsClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 250,
                backgroundColor: '#1a1b2e',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                color: '#ffffff',
                borderRadius: 0,
              }
            }}
          >
            <MenuItem onClick={handleNotificationsClose}>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>Žiadne nové notifikácie</Typography>
            </MenuItem>
          </Menu>

          <IconButton
            onClick={handleMenu}
            sx={{ 
              ml: 1,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              }
            }}
          >
            <Avatar 
              sx={{ 
                width: 35, 
                height: 35,
                backgroundColor: 'transparent',
                color: '#ffffff',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  transform: 'scale(1.1)',
                }
              }}
            >
              <AccountIcon />
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            PaperProps={{
              sx: {
                mt: 1.5,
                minWidth: 200,
                backgroundColor: '#1a1b2e',
                boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
                color: '#ffffff',
                borderRadius: 0,
              }
            }}
          >
            {userData && (
              <MenuItem disabled>
                <Typography variant="body2" sx={{ color: '#ffffff', fontWeight: 'bold' }}>
                  {userData.firstName} {userData.lastName}
                </Typography>
              </MenuItem>
            )}
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              <ListItemIcon>
                <AccountIcon fontSize="small" sx={{ color: '#ffffff' }} />
              </ListItemIcon>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>Profil</Typography>
            </MenuItem>
            <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" sx={{ color: '#ffffff' }} />
              </ListItemIcon>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>Nastavenia</Typography>
            </MenuItem>
            <Divider sx={{ my: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" sx={{ color: '#ffffff' }} />
              </ListItemIcon>
              <Typography variant="body2" sx={{ color: '#ffffff' }}>Odhlásiť sa</Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </StyledAppBar>
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'rgba(35, 35, 66, 0.95)',
              backdropFilter: 'blur(10px)',
            },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              backgroundColor: 'rgba(35, 35, 66, 0.95)',
              backdropFilter: 'blur(10px)',
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
    </Box>
  );
};

export default Navbar; 