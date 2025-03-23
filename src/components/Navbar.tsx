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
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';

const drawerWidth = 240;
const miniDrawerWidth = 64;

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backdropFilter: 'blur(10px)',
  backgroundColor: 'rgba(35, 35, 66, 0.95)',
  color: '#ffffff',
  boxShadow: 'none',
  margin: '16px',
  borderRadius: '12px',
  width: `calc(100% - ${drawerWidth}px - 32px)`,
  transition: 'width 0.3s ease-in-out, margin-left 0.3s ease-in-out',
  '& .MuiToolbar-root': {
    minHeight: '56px',
  },
  '&.drawer-closed': {
    width: `calc(100% - ${miniDrawerWidth}px - 32px)`,
    marginLeft: 0,
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
  height: '28px',
  width: 'auto',
  transition: 'all 0.3s ease-in-out',
});

const AesaLogoMini = styled('img')({
  height: '24px',
  width: 'auto',
  transition: 'all 0.3s ease-in-out',
});

const AesaMinimalLogo = styled(Typography)(({ theme }) => ({
  color: '#ffffff',
  fontSize: '28px',
  fontFamily: 'Arial, sans-serif',
  fontWeight: '900',
  letterSpacing: '-1px',
  transform: 'scaleX(1.2)',
  userSelect: 'none',
  transition: 'all 0.3s ease-in-out',
  '&::before': {
    content: '"―"',
    position: 'absolute',
    fontSize: '16px',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontWeight: 'bold',
  }
}));

const DrawerHeader = styled('div')({
  padding: '16px',
  display: 'flex',
  justifyContent: 'flex-start',
  alignItems: 'center',
  width: '100%',
  height: '88px',
  paddingLeft: '24px',
  marginBottom: '8px',
  transition: 'padding-left 0.3s ease-in-out',
  '&.drawer-closed': {
    paddingLeft: '20px',
    justifyContent: 'center',
  }
});

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: '4px',
  bottom: '16px',
  backgroundColor: '#00b894',
  color: '#ffffff',
  zIndex: 1200,
  padding: '4px',
  borderRadius: '8px',
  width: '32px',
  height: '32px',
  '&:hover': {
    backgroundColor: '#00d2a0',
  },
  transition: 'all 0.3s ease-in-out',
  '& .MuiSvgIcon-root': {
    fontSize: '20px',
  }
}));

const StyledDrawer = styled(Drawer)(({ theme }) => ({
  '& .MuiDrawer-paper': { 
    boxSizing: 'border-box', 
    width: drawerWidth,
    backgroundColor: 'rgba(35, 35, 66, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRight: '1px solid rgba(255, 255, 255, 0.1)',
    transition: 'width 0.3s ease-in-out',
    '&.drawer-closed': {
      width: miniDrawerWidth,
      overflowX: 'hidden',
      '& .MuiListItemText-root': {
        opacity: 0,
        width: 0,
      },
      '& .MuiListItemIcon-root': {
        minWidth: 0,
        marginRight: 0,
        justifyContent: 'center',
      },
    }
  },
}));

const ListItemIconStyled = styled(ListItemIcon)({
  minWidth: 48,
  transition: 'margin-right 0.3s ease-in-out',
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
  const [drawerOpen, setDrawerOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationsAnchorEl, setNotificationsAnchorEl] = useState<null | HTMLElement>(null);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const toggleDrawer = () => {
    setDrawerOpen(!drawerOpen);
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
    <Box position="relative" sx={{ height: '100%' }}>
      <DrawerHeader className={!drawerOpen ? 'drawer-closed' : ''}>
        {drawerOpen ? (
          <AesaLogoDrawer src="/AESA white.svg" alt="AESA Logo" />
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AesaLogoMini src="/mininavbar.png" alt="AESA Logo Mini" />
          </Box>
        )}
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton 
              onClick={() => navigate(item.path)}
              sx={{
                minHeight: 48,
                justifyContent: drawerOpen ? 'initial' : 'center',
                px: 2.5,
              }}
            >
              <ListItemIconStyled
                sx={{
                  minWidth: 0,
                  mr: drawerOpen ? 3 : 'auto',
                  justifyContent: 'center',
                }}
              >
                {item.icon}
              </ListItemIconStyled>
              <ListItemText 
                primary={item.text} 
                sx={{ 
                  opacity: drawerOpen ? 1 : 0,
                  transition: 'opacity 0.3s ease-in-out',
                }} 
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <ToggleButton
        onClick={toggleDrawer}
      >
        {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </ToggleButton>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <StyledAppBar
        position="fixed"
        className={!drawerOpen ? 'drawer-closed' : ''}
        sx={{
          ml: { sm: drawerOpen ? `${drawerWidth}px` : `${miniDrawerWidth}px` },
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
        sx={{ 
          width: { sm: drawerOpen ? drawerWidth : miniDrawerWidth }, 
          flexShrink: { sm: 0 },
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <StyledDrawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
          }}
        >
          {drawer}
        </StyledDrawer>
        <StyledDrawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
          }}
          open
          classes={{
            paper: !drawerOpen ? 'drawer-closed' : ''
          }}
        >
          {drawer}
        </StyledDrawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerOpen ? drawerWidth : 0}px)` },
          transition: 'width 0.3s ease-in-out'
        }}
      >
        <Toolbar />
      </Box>
    </Box>
  );
};

export default Navbar; 