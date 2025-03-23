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
import { Link } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';

const drawerWidth = 240;
const miniDrawerWidth = 64;

// Definícia farebnej palety
const colors = {
  primary: {
    main: '#1a1a2e',
    light: 'rgba(35, 35, 66, 0.95)',
    dark: '#12121f',
  },
  secondary: {
    main: '#ff6b6b',
    light: '#ff8787',
    dark: '#fa5252',
  },
  accent: {
    main: '#00b894',
    light: '#00d2a0',
    dark: '#00a07a',
  }
};

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  color: colors.accent.main,
  fontSize: '1.5rem',
  marginRight: theme.spacing(2),
  letterSpacing: '-0.5px',
  transition: 'color 0.2s ease-in-out',
  '&:hover': {
    color: colors.accent.light,
  }
}));

const AesaLogoDrawer = styled('img')({
  height: '32px',
  width: 'auto',
  transition: 'all 0.3s ease-in-out',
  filter: 'brightness(1.1)',
  '&:hover': {
    transform: 'scale(1.05)',
  }
});

const AesaLogoMini = styled('img')({
  height: '28px',
  width: 'auto',
  transition: 'all 0.3s ease-in-out',
  filter: 'brightness(1.1)',
  '&:hover': {
    transform: 'scale(1.05)',
  }
});

const DrawerHeader = styled('div')({
  padding: '28px 24px',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  height: '88px',
  borderBottom: `1px solid rgba(255, 255, 255, 0.06)`,
  '&.drawer-closed': {
    justifyContent: 'center',
    padding: '28px 12px',
  }
});

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'absolute',
  right: '12px',
  bottom: '24px',
  backgroundColor: colors.accent.main,
  color: '#ffffff',
  zIndex: 1200,
  padding: '8px',
  borderRadius: '12px',
  width: '40px',
  height: '40px',
  boxShadow: '0 4px 12px rgba(0, 184, 148, 0.3)',
  '&:hover': {
    backgroundColor: colors.accent.light,
    transform: 'translateY(-2px)',
    boxShadow: '0 6px 16px rgba(0, 184, 148, 0.4)',
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
  }
}));

const ListItemIconStyled = styled(ListItemIcon)({
  minWidth: 48,
  color: 'rgba(255, 255, 255, 0.7)',
  transition: 'all 0.3s ease-in-out',
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
    path: '/transport',
    hidden: true
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
  backgroundColor: colors.primary.main,
});

const SideNav = styled('nav')(({ theme }) => ({
  width: drawerWidth,
  backgroundColor: colors.primary.light,
  backdropFilter: 'blur(20px)',
  borderRight: '1px solid rgba(255, 255, 255, 0.06)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'fixed',
  height: '100vh',
  zIndex: 1200,
  boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
  overflowX: 'hidden',
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

const MainWrapper = styled('div')({
  flexGrow: 1,
  marginLeft: drawerWidth,
  minHeight: '100vh',
  transition: 'margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&.drawer-closed': {
    marginLeft: miniDrawerWidth,
  }
});

const TopBar = styled('header')({
  position: 'fixed',
  top: '16px',
  left: `calc(${drawerWidth}px + 16px)`,
  right: '16px',
  height: '64px',
  backgroundColor: colors.primary.light,
  backdropFilter: 'blur(20px)',
  borderRadius: '16px',
  display: 'flex',
  alignItems: 'center',
  padding: '0 20px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  boxShadow: '0 4px 24px rgba(0, 0, 0, 0.15)',
  zIndex: 1100,
  '.drawer-closed &': {
    left: `calc(${miniDrawerWidth}px + 16px)`,
  },
  '&::after': {
    content: '""',
    position: 'absolute',
    inset: 0,
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.06)',
    pointerEvents: 'none'
  }
});

const ContentWrapper = styled('div')({
  padding: '96px 16px 16px 16px',
  minHeight: '100vh',
  backgroundColor: colors.primary.main,
  position: 'relative',
  overflowX: 'hidden'
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
          !item.hidden && (
            <ListItem key={item.text} disablePadding>
              <ListItemButton 
                onClick={() => navigate(item.path)}
                sx={{
                  minHeight: 48,
                  justifyContent: drawerOpen ? 'initial' : 'center',
                  px: 2.5,
                  borderRadius: '12px',
                  margin: '4px 8px',
                  transition: 'all 0.2s ease-in-out',
                  position: 'relative',
                  '&:hover': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '& .MuiListItemIcon-root': {
                      color: colors.accent.main,
                      transform: 'scale(1.1)',
                    },
                    '& .MuiListItemText-primary': {
                      color: '#ffffff',
                    }
                  },
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: '-8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: '3px',
                    height: '0%',
                    backgroundColor: colors.accent.main,
                    borderRadius: '4px',
                    transition: 'height 0.2s ease-in-out',
                  },
                  '&:hover::before': {
                    height: '50%',
                  },
                  '&.active': {
                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                    '&::before': {
                      height: '70%',
                    },
                    '& .MuiListItemIcon-root': {
                      color: colors.accent.main,
                    },
                    '& .MuiListItemText-primary': {
                      color: '#ffffff',
                      fontWeight: 600,
                    }
                  }
                }}
              >
                <ListItemIconStyled
                  sx={{
                    minWidth: 0,
                    mr: drawerOpen ? 3 : 'auto',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease-in-out',
                  }}
                >
                  {item.icon}
                </ListItemIconStyled>
                <ListItemText 
                  primary={item.text} 
                  sx={{ 
                    opacity: drawerOpen ? 1 : 0,
                    transition: 'all 0.3s ease-in-out',
                    '& .MuiTypography-root': {
                      fontSize: '0.95rem',
                      fontWeight: 500,
                      color: 'rgba(255, 255, 255, 0.7)',
                      transition: 'all 0.2s ease-in-out',
                    }
                  }} 
                />
              </ListItemButton>
            </ListItem>
          )
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

      <MainWrapper className={!drawerOpen ? 'drawer-closed' : ''}>
        <TopBar>
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
              padding: '8px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                opacity: 1,
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <NotificationsIcon />
          </IconButton>

          <IconButton
            onClick={handleMenu}
            sx={{ 
              padding: '8px',
              transition: 'all 0.2s ease-in-out',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                transform: 'translateY(-2px)',
              }
            }}
          >
            <Avatar 
              sx={{ 
                width: 38,
                height: 38,
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
        </TopBar>

        <ContentWrapper>
          {/* Page content goes here */}
        </ContentWrapper>

        <Menu
          anchorEl={notificationsAnchorEl}
          open={Boolean(notificationsAnchorEl)}
          onClose={handleNotificationsClose}
          PaperProps={{
            sx: {
              mt: 1.5,
              minWidth: 250,
              backgroundColor: colors.primary.light,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
              color: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              '& .MuiMenuItem-root': {
                padding: '12px 20px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }
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
              backgroundColor: colors.primary.light,
              backdropFilter: 'blur(20px)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.24)',
              color: '#ffffff',
              borderRadius: '16px',
              border: '1px solid rgba(255, 255, 255, 0.06)',
              '& .MuiMenuItem-root': {
                padding: '12px 20px',
                transition: 'all 0.2s ease-in-out',
                '&:hover': {
                  backgroundColor: 'rgba(255, 255, 255, 0.1)',
                }
              }
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
      </MainWrapper>
    </AppWrapper>
  );
};

export default Navbar; 