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

const drawerWidth = 240;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backdropFilter: 'none',
  backgroundColor: '#1a1b2e',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  color: '#ffffff',
  boxShadow: 'none',
  borderRadius: 0,
}));

const menuItems = [
  {
    text: 'Dashboard',
    icon: <HomeIcon />,
    path: '/dashboard'
  },
  {
    text: 'Transporty',
    icon: <LocalShippingIcon />,
    path: '/transport'
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
      <Toolbar />
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
          width: { sm: `calc(100% - ${drawerWidth}px)` },
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
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, color: '#ffffff' }}>
            Transport Platform
          </Typography>
          
          <IconButton
            onClick={handleNotificationsMenu}
            sx={{ mr: 2, color: '#ffffff' }}
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