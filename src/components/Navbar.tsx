import React, { useState } from 'react';
import {
  CssBaseline,
  Divider,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Avatar,
  Menu,
  MenuItem,
  styled,
} from '@mui/material';
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

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 'bold',
  color: '#00b894',
  fontSize: '1.5rem',
  marginRight: theme.spacing(2),
}));

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

const DrawerHeader = styled('div')({
  padding: '24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  height: '88px',
  '&.drawer-closed': {
    justifyContent: 'center',
    padding: '24px 12px',
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

const AppWrapper = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: '#1a1a2e',
});

const SideNav = styled('nav')(({ theme }) => ({
  width: drawerWidth,
  backgroundColor: 'rgba(35, 35, 66, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRight: '1px solid rgba(255, 255, 255, 0.1)',
  transition: 'width 0.3s ease-in-out',
  position: 'fixed',
  height: '100vh',
  '&.drawer-closed': {
    width: miniDrawerWidth,
    '& .MuiListItemText-root': {
      opacity: 0,
      width: 0,
    },
    '& .MuiListItemIcon-root': {
      minWidth: 0,
      marginRight: 0,
      justifyContent: 'center',
    }
  }
}));

const TopBar = styled('header')({
  position: 'fixed',
  top: '16px',
  right: '16px',
  left: `${drawerWidth + 16}px`,
  height: '56px',
  backgroundColor: 'rgba(35, 35, 66, 0.95)',
  backdropFilter: 'blur(10px)',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 16px',
  transition: 'left 0.3s ease-in-out',
  '&.drawer-closed': {
    left: `${miniDrawerWidth + 16}px`,
  }
});

const MainContent = styled('main')({
  marginLeft: drawerWidth,
  marginTop: '88px',
  padding: '24px',
  width: `calc(100% - ${drawerWidth}px)`,
  transition: 'margin-left 0.3s ease-in-out, width 0.3s ease-in-out',
  '&.drawer-closed': {
    marginLeft: miniDrawerWidth,
    width: `calc(100% - ${miniDrawerWidth}px)`,
  }
});

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
    <>
      <DrawerHeader className={!drawerOpen ? 'drawer-closed' : ''}>
        {drawerOpen ? (
          <AesaLogoDrawer src="/AESA white.svg" alt="AESA Logo" />
        ) : (
          <AesaLogoMini src="/mininavbar.png" alt="AESA Logo Mini" />
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
      <ToggleButton onClick={toggleDrawer}>
        {drawerOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </ToggleButton>
    </>
  );

  return (
    <AppWrapper>
      <CssBaseline />
      
      <SideNav className={!drawerOpen ? 'drawer-closed' : ''}>
        {drawer}
      </SideNav>

      <TopBar className={!drawerOpen ? 'drawer-closed' : ''}>
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

        <IconButton
          onClick={handleMenu}
          sx={{ 
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
              '&:hover': {
                transform: 'scale(1.1)',
              }
            }}
          >
            <AccountIcon />
          </Avatar>
        </IconButton>
      </TopBar>

      <MainContent className={!drawerOpen ? 'drawer-closed' : ''}>
        {/* Page content goes here */}
      </MainContent>

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
            borderRadius: '8px',
          }
        }}
      >
        <MenuItem onClick={handleNotificationsClose}>
          <Typography variant="body2">Žiadne nové notifikácie</Typography>
        </MenuItem>
      </Menu>

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
            borderRadius: '8px',
          }
        }}
      >
        {userData && (
          <MenuItem disabled>
            <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
              {userData.firstName} {userData.lastName}
            </Typography>
          </MenuItem>
        )}
        <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <AccountIcon fontSize="small" sx={{ color: '#ffffff' }} />
          </ListItemIcon>
          <Typography variant="body2">Profil</Typography>
        </MenuItem>
        <MenuItem onClick={() => { handleClose(); navigate('/settings'); }}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" sx={{ color: '#ffffff' }} />
          </ListItemIcon>
          <Typography variant="body2">Nastavenia</Typography>
        </MenuItem>
        <Divider sx={{ my: 1, backgroundColor: 'rgba(255, 255, 255, 0.1)' }} />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" sx={{ color: '#ffffff' }} />
          </ListItemIcon>
          <Typography variant="body2">Odhlásiť sa</Typography>
        </MenuItem>
      </Menu>
    </AppWrapper>
  );
};

export default Navbar; 