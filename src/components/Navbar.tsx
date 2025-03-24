import React, { useState, useEffect } from 'react';
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
  Box,
  Toolbar,
  AppBar,
  useMediaQuery,
  useTheme,
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
import { MenuProps } from '@mui/material/Menu';
import BusinessIcon from '@mui/icons-material/Business';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';

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
  position: 'fixed',
  right: '12px',
  bottom: '24px',
  backgroundColor: colors.accent.main,
  color: '#ffffff',
  zIndex: 1300,
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
  },
  '@media (max-width: 600px)': {
    position: 'relative',
    right: 'auto',
    bottom: 'auto',
    margin: '16px auto',
    display: 'flex',
    justifyContent: 'center',
    width: '48px',
    height: '48px',
    borderRadius: '50%',
    boxShadow: '0 4px 16px rgba(0, 184, 148, 0.4)',
  }
}));

const ListItemIconStyled = styled(ListItemIcon)({
  minWidth: 48,
  color: 'rgba(255, 255, 255, 0.7)',
  transition: 'all 0.3s ease-in-out',
});

interface UserData {
  firstName: string;
  lastName: string;
  email: string;
}

interface MenuItem {
  text: string;
  icon: React.ReactNode;
  path?: string;
  onClick?: () => void;
  hidden?: boolean;
}

const Navbar = () => {
  const { currentUser, userData, logout } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMobileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setMobileMenuAnchor(null);
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Chyba pri odhlásení:', error);
    }
  };

  const menuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Obchodné prípady', icon: <BusinessIcon />, path: '/business-cases' },
    { text: 'Sledované prepravy', icon: <VisibilityIcon />, path: '/tracked-transports' },
    { text: 'Kontakty', icon: <ContactsIcon />, path: '/contacts' },
    { text: 'Tím', icon: <GroupIcon />, path: '/team' },
    { text: 'Nastavenia', icon: <SettingsIcon />, path: '/settings' },
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

  const ContentWrapper = styled('div')({
    padding: '16px',
    minHeight: '100vh',
    backgroundColor: colors.primary.main,
    position: 'relative',
    overflowX: 'hidden'
  });

  const drawer = (
    <>
      <DrawerHeader className={!mobileOpen ? 'drawer-closed' : ''}>
        {mobileOpen ? (
          <AesaLogoDrawer src="/AESA white.svg" alt="AESA Logo" />
        ) : (
          <AesaLogoMini src="/mininavbar.png" alt="AESA Logo Mini" />
        )}
      </DrawerHeader>
      <Divider />
      <List>
        {menuItems.map((item) => (
          <ListItem 
            button 
            key={item.text} 
            onClick={() => {
              navigate(item.path);
              if (isMobile) {
                setMobileOpen(false);
              }
            }}
            sx={{
              minHeight: 48,
              justifyContent: mobileOpen ? 'initial' : 'center',
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
                mr: mobileOpen ? 3 : 'auto',
                justifyContent: 'center',
                transition: 'all 0.2s ease-in-out',
              }}
            >
              {item.icon}
            </ListItemIconStyled>
            <ListItemText 
              primary={item.text} 
              sx={{ 
                opacity: mobileOpen ? 1 : 0,
                transition: 'all 0.3s ease-in-out',
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                  color: 'rgba(255, 255, 255, 0.7)',
                  transition: 'all 0.2s ease-in-out',
                }
              }} 
            />
          </ListItem>
        ))}
      </List>
      <Box sx={{ mt: 'auto', mb: 2 }}>
        <Divider sx={{ mb: 2, backgroundColor: 'rgba(255, 255, 255, 0.06)' }} />
        {currentUser && userData && (
          <>
            <ListItem 
              button 
              onClick={handleLogout}
              sx={{
                minHeight: 48,
                justifyContent: mobileOpen ? 'initial' : 'center',
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
                }
              }}
            >
              <ListItemIconStyled
                sx={{
                  minWidth: 0,
                  mr: mobileOpen ? 3 : 'auto',
                  justifyContent: 'center',
                  transition: 'all 0.2s ease-in-out',
                }}
              >
                <LogoutIcon />
              </ListItemIconStyled>
              <ListItemText 
                primary="Odhlásiť sa" 
                sx={{ opacity: mobileOpen ? 1 : 0 }} 
              />
            </ListItem>
            <ListItem 
              sx={{
                minHeight: 48,
                justifyContent: mobileOpen ? 'initial' : 'center',
                px: 2.5,
                borderRadius: '12px',
                margin: '4px 8px',
                opacity: 0.7,
                '& .MuiListItemText-primary': {
                  fontSize: '0.85rem',
                  color: 'rgba(255, 255, 255, 0.7)',
                }
              }}
            >
              <ListItemText 
                primary={`Prihlásený: ${userData.firstName} ${userData.lastName}`}
                sx={{ opacity: mobileOpen ? 1 : 0 }} 
              />
            </ListItem>
            <Box sx={{ 
              display: { xs: 'flex', sm: 'none' },
              justifyContent: 'center',
              mt: 2
            }}>
              <ToggleButton onClick={handleDrawerToggle}>
                {mobileOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
              </ToggleButton>
            </Box>
          </>
        )}
      </Box>
      <Box sx={{ 
        display: { xs: 'none', sm: 'block' },
        position: 'fixed',
        right: '12px',
        bottom: '24px'
      }}>
        <ToggleButton onClick={handleDrawerToggle}>
          {mobileOpen ? <ChevronLeftIcon /> : <ChevronRightIcon />}
        </ToggleButton>
      </Box>
    </>
  );

  return (
    <AppWrapper>
      <CssBaseline />
      
      <SideNav className={!mobileOpen ? 'drawer-closed' : ''}>
        {drawer}
      </SideNav>

      <MainWrapper className={!mobileOpen ? 'drawer-closed' : ''}>
        <ContentWrapper>
          {/* Page content goes here */}
        </ContentWrapper>
      </MainWrapper>
    </AppWrapper>
  );
};

export default Navbar; 