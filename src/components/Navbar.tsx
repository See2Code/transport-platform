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
  MenuList,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Drawer,
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
import CloseIcon from '@mui/icons-material/Close';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import ReceiptIcon from '@mui/icons-material/Receipt';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EuroIcon from '@mui/icons-material/Euro';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../contexts/AuthContext';
import { MenuProps } from '@mui/material/Menu';
import BusinessIcon from '@mui/icons-material/Business';
import MenuIcon from '@mui/icons-material/Menu';
import PersonIcon from '@mui/icons-material/Person';
import DashboardIcon from '@mui/icons-material/Dashboard';
import { useThemeMode } from '../contexts/ThemeContext';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

const drawerWidth = 240;
const miniDrawerWidth = 64;

// Definícia farebnej palety
const colors = {
  primary: {
    main: '#ff9f43',
    light: '#ffc107',
    dark: '#f57c00',
  },
  background: {
    main: 'rgba(28, 28, 45, 0.35)',
    light: 'rgba(35, 35, 66, 0.35)',
    dark: '#12121f',
  },
  text: {
    primary: '#ffffff',
    secondary: 'rgba(255, 255, 255, 0.9)',
    disabled: 'rgba(255, 255, 255, 0.7)',
  }
};

const Logo = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  color: colors.primary.main,
  fontSize: '1.5rem',
  marginRight: theme.spacing(2),
  letterSpacing: '-0.5px',
  transition: 'color 0.2s ease-in-out',
  '&:hover': {
    color: colors.primary.light,
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
  display: 'none'
});

const ToggleButton = styled(IconButton)(({ theme }) => ({
  position: 'fixed',
  right: '24px',
  bottom: '24px',
  backgroundColor: `${colors.primary.main}e6`,
  color: colors.text.primary,
  zIndex: 1300,
  padding: '12px',
  borderRadius: '16px',
  width: '48px',
  height: '48px',
  backdropFilter: 'blur(10px)',
  boxShadow: `0 4px 20px ${colors.primary.main}4d`,
  '&:hover': {
    backgroundColor: colors.primary.main,
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 24px ${colors.primary.main}66`,
  },
  '&:active': {
    transform: 'translateY(0)',
    boxShadow: `0 4px 16px ${colors.primary.main}4d`,
  },
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '& .MuiSvgIcon-root': {
    fontSize: '24px',
    transition: 'transform 0.3s ease',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1)',
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
  }
}));

const ListItemIconStyled = styled(ListItemIcon)({
  minWidth: 48,
  color: 'inherit',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  margin: 0,
  '& .MuiSvgIcon-root': {
    transition: 'transform 0.3s ease',
    fontSize: '24px'
  }
});

const NavListItem = styled(ListItem)<{ isDarkMode?: boolean }>(({ isDarkMode = true }) => ({
  position: 'relative',
  padding: '4px',
  '& .MuiListItemButton-root': {
    borderRadius: '12px',
    padding: '12px 8px',
    minWidth: '56px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'all 0.3s ease',
    color: isDarkMode ? colors.text.primary : '#000000',
  },
  '& .MuiListItemIcon-root': {
    minWidth: 48,
    color: 'inherit',
  },
  '& .MuiListItemText-root': {
    opacity: 0,
    position: 'absolute',
    top: '100%',
    left: '50%',
    transform: 'translateX(-50%) translateY(8px)',
    backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    padding: '8px 12px',
    borderRadius: '6px',
    whiteSpace: 'nowrap',
    zIndex: 1000,
    transition: 'all 0.3s ease',
    visibility: 'hidden',
    color: isDarkMode ? colors.text.primary : '#000000',
    boxShadow: isDarkMode 
      ? '0 4px 20px rgba(0, 0, 0, 0.4)' 
      : '0 4px 20px rgba(0, 0, 0, 0.1)',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    backdropFilter: 'blur(10px)',
    '&:before': {
      content: '""',
      position: 'absolute',
      top: '-4px',
      left: '50%',
      transform: 'translateX(-50%) rotate(45deg)',
      width: '8px',
      height: '8px',
      backgroundColor: 'inherit',
      borderTop: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
      borderLeft: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    }
  },
  '&:hover .MuiListItemText-root': {
    opacity: 1,
    transform: 'translateX(-50%) translateY(4px)',
    visibility: 'visible',
  },
  '&:hover .MuiListItemButton-root': {
    backgroundColor: isDarkMode 
      ? 'rgba(255, 159, 67, 0.1)' 
      : 'rgba(255, 159, 67, 0.1)',
  },
  '&:hover .MuiSvgIcon-root': {
    transform: 'scale(1.1)',
    color: colors.primary.main,
  },
  '& .MuiSvgIcon-root': {
    color: isDarkMode ? colors.text.primary : '#000000',
  }
}));

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
  description?: string;
}

const MinimizedMenuItem = styled(MenuItem)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '12px 0',
  minWidth: '60px',
  margin: '0 auto',
  '& .MuiSvgIcon-root': {
    fontSize: '1.5rem',
    marginBottom: '4px',
  },
  '& .MuiTypography-root': {
    fontSize: '0.75rem',
  }
}));

const MinimizedMenuList = styled(MenuList)({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: '8px 0',
  width: '100%',
  '& > *': {
    width: '100%',
    textAlign: 'center',
    display: 'flex',
    justifyContent: 'center',
  }
});

const LogoImage = styled('img')<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  height: '32px',
  width: 'auto',
  filter: isDarkMode ? 'brightness(1)' : 'brightness(0)',
  transition: 'filter 0.3s ease',
}));

const BrandContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
});

const MenuContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  flex: 1,
  justifyContent: 'flex-end'
});

const StyledMenuList = styled(List)({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
  padding: 0,
  gap: '8px',
  margin: 0
});

const StyledMenuItem = styled(MenuItem)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  padding: '12px 16px',
  margin: '4px 8px',
  borderRadius: '12px',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  color: isDarkMode ? '#ffffff' : '#000000',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    transform: 'translateX(4px)',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '40px',
    color: 'inherit',
    '& .MuiSvgIcon-root': {
      fontSize: '1.25rem',
    },
  },
  '& .MuiListItemText-root': {
    '& .MuiTypography-root': {
      fontSize: '1rem',
      fontWeight: 500,
    },
  },
}));

const StyledMenuItemIcon = styled(ListItemIcon)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  minWidth: 0,
  marginRight: 1,
  color: isDarkMode ? colors.text.primary : '#000000'
}));

const StyledMenuItemText = styled(ListItemText)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  '& .MuiTypography-root': {
    fontSize: '0.9rem',
    fontWeight: 500,
    color: isDarkMode ? colors.text.primary : '#000000'
  }
}));

const LogoutButton = styled(IconButton)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  color: isDarkMode ? colors.text.primary : '#000000',
  '&:hover': {
    color: colors.primary.main,
    backgroundColor: isDarkMode ? 'rgba(255, 159, 67, 0.1)' : 'rgba(0, 0, 0, 0.05)'
  }
}));

interface AuthContextType {
  logout: () => Promise<void>;
}

const SideNav = styled('nav')(({ theme }) => ({
  width: '100%',
  backgroundColor: colors.background.main,
  backdropFilter: 'blur(20px)',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  position: 'fixed',
  height: '64px',
  zIndex: 1200,
  boxShadow: '0 -4px 20px rgba(0, 0, 0, 0.2)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  padding: '0 16px',
  bottom: 0,
  left: 0,
  borderTop: '1px solid rgba(255, 255, 255, 0.05)',
  '@media (max-width: 600px)': {
    height: '56px',
    padding: '0 12px'
  }
}));

const MainWrapper = styled('main')({
  width: '100%',
  marginBottom: '64px',
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '@media (max-width: 600px)': {
    marginBottom: '56px'
  }
});

const ContentWrapper = styled('div')({
  padding: '24px',
  position: 'relative',
  zIndex: 1,
  '@media (max-width: 600px)': {
    padding: '16px'
  }
});

const AppWrapper = styled('div')({
  display: 'flex',
  minHeight: '100vh',
  backgroundColor: colors.background.dark,
  width: '100%',
  position: 'relative',
  overflow: 'hidden',
});

const Overlay = styled('div')({
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.7)',
  backdropFilter: 'blur(4px)',
  zIndex: 1100,
  opacity: 0,
  visibility: 'hidden',
  transition: 'all 0.3s ease-in-out',
  display: 'none',
  '@media (max-width: 600px)': {
    display: 'block',
    '&.visible': {
      opacity: 1,
      visibility: 'visible'
    }
  }
});

const StyledAppBar = styled(AppBar)<{ isDarkMode?: boolean }>(({ isDarkMode, theme }) => ({
  backgroundColor: isDarkMode ? colors.background.main : '#ffffff',
  boxShadow: 'none',
  borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
  backdropFilter: 'blur(10px)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1100,
}));

const StyledToolbar = styled(Toolbar)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '0 24px',
  minHeight: '64px',
  width: '100%',
  maxWidth: '1400px',
  margin: '0 auto',
});

const MenuButton = styled(IconButton)({
  marginLeft: 'auto',
});

const MobileDrawer = styled(Drawer)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  '& .MuiDrawer-paper': {
    backgroundColor: isDarkMode ? '#1c1c2d' : '#ffffff',
    width: '280px',
    height: '100%',
    padding: '4px',
    boxShadow: 'none',
    border: 'none',
    backdropFilter: 'none',
    '-webkit-backdrop-filter': 'none',
    background: isDarkMode ? '#1c1c2d' : '#ffffff'
  },
  '& .MuiBackdrop-root': {
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    backdropFilter: 'none',
    '-webkit-backdrop-filter': 'none'
  },
  '& .MuiPaper-root': {
    backgroundColor: isDarkMode ? '#1c1c2d' : '#ffffff',
    backdropFilter: 'none',
    '-webkit-backdrop-filter': 'none',
    background: isDarkMode ? '#1c1c2d' : '#ffffff'
  }
}));

const BottomActions = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '4px',
  marginTop: '4px'
});

const ActionItem = styled(MenuItem)<{ isDarkMode?: boolean; isLogout?: boolean }>(({ isDarkMode, isLogout }) => ({
  padding: '12px 16px',
  display: 'flex',
  alignItems: 'center',
  gap: '12px',
  color: isLogout ? '#d64545' : (isDarkMode ? '#ffffff' : '#000000'),
  '&:hover': {
    backgroundColor: isLogout 
      ? 'rgba(214, 69, 69, 0.08)'
      : (isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'),
  },
}));

const MenuItemWrapper = styled(ListItemButton)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: '8px',
  gap: '8px',
  borderRadius: '8px',
  width: '100%',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
}));

const MenuItemIcon = styled(ListItemIconStyled)({
  minWidth: '24px',
  width: '24px',
  margin: 0,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& .MuiSvgIcon-root': {
    fontSize: '20px'
  }
});

const MenuItemContent = styled(Box)({
  display: 'flex',
  flexDirection: 'column',
  gap: '2px'
});

const PageWrapper = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  position: 'relative',
  backgroundColor: colors.background.dark,
});

const MainContent = styled('main')({
  flexGrow: 1,
  width: '100%',
});

const StyledListItem = styled(ListItem)<{ button?: boolean; isDarkMode?: boolean }>(({ isDarkMode = true }) => ({
  minWidth: 'auto',
  padding: '12px 16px',
  borderRadius: '12px',
  margin: '4px 8px',
  cursor: 'pointer',
  transition: 'all 0.2s ease-in-out',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
    transform: 'translateX(4px)',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '40px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  },
  '& .MuiListItemText-root': {
    margin: 0,
    '& .MuiTypography-root': {
      fontSize: '1rem',
      fontWeight: 500,
      color: isDarkMode ? '#ffffff' : '#000000',
    },
  },
}));

const StyledDivider = styled(Divider)<{ isDarkMode?: boolean }>(({ isDarkMode }) => ({
  margin: '8px 16px',
  backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.08)',
  height: '1px',
}));

const StyledDialog = styled(Dialog)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '12px',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    boxShadow: isDarkMode 
      ? '0 8px 32px rgba(0, 0, 0, 0.4)' 
      : '0 8px 32px rgba(0, 0, 0, 0.1)',
  },
  '& .MuiDialogTitle-root': {
    color: isDarkMode ? '#ffffff' : '#000000',
  },
  '& .MuiDialogContent-root': {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
  },
}));

const StyledButton = styled(Button)<{ isDarkMode: boolean; variant: 'text' | 'contained' }>(({ isDarkMode, variant }) => ({
  borderRadius: '8px',
  textTransform: 'none',
  padding: '8px 16px',
  fontWeight: 500,
  ...(variant === 'contained' ? {
    backgroundColor: isDarkMode ? '#ff6b6b' : '#d64545',
    color: '#ffffff',
    '&:hover': {
      backgroundColor: isDarkMode ? '#ff8787' : '#e05858',
    },
  } : {
    color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)',
    '&:hover': {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    },
  }),
}));

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const location = useLocation();
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();

  const handleMobileMenuClick = () => {
    setMobileMenuOpen(true);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuOpen(false);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const handleLogoutClick = () => {
    setLogoutDialogOpen(true);
    handleMobileMenuClose();
  };

  const handleLogoutCancel = () => {
    setLogoutDialogOpen(false);
  };

  const handleLogoutConfirm = async () => {
    try {
      await logout();
      setLogoutDialogOpen(false);
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems: MenuItem[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Sledované prepravy', icon: <LocalShippingIcon />, path: '/tracked-transports' },
    { text: 'Mapa vozidiel', icon: <LocationOnIcon />, path: '/vehicle-map' },
    { text: 'Objednávky', icon: <ReceiptIcon />, path: '/orders' },
    { text: 'Business prípady', icon: <BusinessIcon />, path: '/business-cases' },
    { text: 'Faktúry', icon: <EuroIcon />, path: '/invoices' },
    { text: 'Kontakty', icon: <ContactsIcon />, path: '/contacts' },
    { text: 'Tím', icon: <GroupIcon />, path: '/team' },
    { text: 'Nastavenia', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <PageWrapper>
      <StyledAppBar isDarkMode={isDarkMode}>
        <StyledToolbar>
          {isMobile ? (
            <>
              <Box 
                onClick={() => navigate('/dashboard')} 
                sx={{ 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 2,
                  transition: 'opacity 0.2s ease-in-out',
                  '&:hover': {
                    opacity: 0.8
                  }
                }}
              >
                <LogoImage src={isDarkMode ? "/AESA white.svg" : "/AESA black.svg"} alt="AESA Logo" isDarkMode={isDarkMode} />
              </Box>
              <MenuButton
                edge="end"
                sx={{
                  color: isDarkMode ? '#ffffff' : '#000000',
                }}
                aria-label="menu"
                onClick={handleMobileMenuClick}
              >
                <MenuIcon />
              </MenuButton>
            </>
          ) : (
            <>
              <BrandContainer>
                <Box 
                  onClick={() => navigate('/dashboard')} 
                  sx={{ 
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 2,
                    transition: 'opacity 0.2s ease-in-out',
                    '&:hover': {
                      opacity: 0.8
                    }
                  }}
                >
                  <LogoImage src={isDarkMode ? "/AESA white.svg" : "/AESA black.svg"} alt="AESA Logo" isDarkMode={isDarkMode} />
                  <Typography 
                    variant="h6" 
                    noWrap 
                    component="div"
                    sx={{ 
                      color: isDarkMode ? '#ffffff' : '#000000'
                    }}
                  >
                    Transport Platform
                  </Typography>
                </Box>
              </BrandContainer>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                alignItems: 'center',
                height: '40px',
                marginLeft: 'auto'
              }}>
                {menuItems.map((item) => (
                  <NavListItem key={item.text} disablePadding isDarkMode={isDarkMode}>
                    <ListItemButton
                      onClick={() => item.path && handleNavigation(item.path)}
                    >
                      <ListItemIconStyled>
                        {item.icon}
                      </ListItemIconStyled>
                      <ListItemText primary={item.text} />
                    </ListItemButton>
                  </NavListItem>
                ))}
                <Box sx={{ 
                  display: 'flex',
                  gap: 1,
                  alignItems: 'center',
                  marginLeft: 'auto'
                }}>
                  <IconButton
                    onClick={handleLogoutClick}
                    sx={{
                      padding: '8px',
                      color: '#d64545',
                      '&:hover': {
                        backgroundColor: 'rgba(214, 69, 69, 0.08)',
                      },
                    }}
                  >
                    <LogoutIcon sx={{ fontSize: '20px' }} />
                  </IconButton>
                  <IconButton
                    onClick={toggleTheme}
                    sx={{
                      padding: '8px',
                      color: isDarkMode ? '#ffffff' : '#000000',
                      '&:hover': {
                        backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                      },
                    }}
                  >
                    {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                  </IconButton>
                </Box>
              </Box>
            </>
          )}
        </StyledToolbar>
      </StyledAppBar>

      <MobileDrawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={handleMobileMenuClose}
        isDarkMode={isDarkMode}
        sx={{
          '& .MuiDrawer-paper': {
            backgroundColor: isDarkMode ? '#1c1c2d' : '#ffffff',
            backdropFilter: 'none',
            '-webkit-backdrop-filter': 'none',
            background: isDarkMode ? '#1c1c2d' : '#ffffff'
          },
          '& .MuiBackdrop-root': {
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'none',
            '-webkit-backdrop-filter': 'none'
          },
          '& .MuiPaper-root': {
            backgroundColor: isDarkMode ? '#1c1c2d' : '#ffffff',
            backdropFilter: 'none',
            '-webkit-backdrop-filter': 'none',
            background: isDarkMode ? '#1c1c2d' : '#ffffff'
          }
        }}
      >
        <Box sx={{ 
          display: { xs: 'flex', sm: 'none' },
          justifyContent: 'flex-end',
          padding: '8px',
          position: 'sticky',
          top: 0,
          backgroundColor: 'transparent',
          zIndex: 1,
        }}>
          <IconButton
            onClick={handleMobileMenuClose}
            sx={{
              color: isDarkMode ? '#ffffff' : '#000000',
              padding: '8px',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {menuItems.map((item) => (
          <MenuItem
            key={item.text}
            onClick={() => item.path && handleNavigation(item.path)}
            sx={{
              padding: 0,
              margin: '1px 0',
              width: '100%'
            }}
          >
            <MenuItemWrapper isDarkMode={isDarkMode}>
              <MenuItemIcon>
                {item.icon}
              </MenuItemIcon>
              <MenuItemContent>
                <Typography 
                  component="div"
                  sx={{ 
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    color: isDarkMode ? colors.text.primary : '#000000',
                    lineHeight: 1.2
                  }}
                >
                  {item.text}
                </Typography>
                <Typography 
                  component="div"
                  sx={{ 
                    fontSize: '0.75rem',
                    color: isDarkMode ? 'rgba(255, 255, 255, 0.6)' : 'rgba(0, 0, 0, 0.6)',
                    lineHeight: 1.2
                  }}
                >
                  {item.description}
                </Typography>
              </MenuItemContent>
            </MenuItemWrapper>
          </MenuItem>
        ))}
        <Divider sx={{ margin: '8px 0', backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
        <BottomActions>
          <ActionItem
            onClick={toggleTheme}
            isDarkMode={isDarkMode}
          >
            <ListItemIcon sx={{ 
              minWidth: 'auto',
              color: 'inherit',
              '& .MuiSvgIcon-root': {
                fontSize: '20px',
              },
            }}>
              {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
            </ListItemIcon>
            <ListItemText 
              primary={isDarkMode ? "Svetlý režim" : "Tmavý režim"}
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              }}
            />
          </ActionItem>
          <ActionItem
            onClick={handleLogoutClick}
            isDarkMode={isDarkMode}
            isLogout
          >
            <ListItemIcon sx={{ 
              minWidth: 'auto',
              color: 'inherit',
              '& .MuiSvgIcon-root': {
                fontSize: '20px',
              },
            }}>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText 
              primary="Odhlásiť sa"
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              }}
            />
          </ActionItem>
        </BottomActions>
      </MobileDrawer>

      <StyledDialog
        open={logoutDialogOpen}
        onClose={handleLogoutCancel}
        isDarkMode={isDarkMode}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          Potvrdenie odhlásenia
        </DialogTitle>
        <DialogContent>
          <Typography>
            Naozaj sa chcete odhlásiť z aplikácie?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ padding: '16px 24px' }}>
          <StyledButton
            onClick={handleLogoutCancel}
            variant="text"
            isDarkMode={isDarkMode}
          >
            Zrušiť
          </StyledButton>
          <StyledButton
            onClick={handleLogoutConfirm}
            variant="contained"
            isDarkMode={isDarkMode}
            autoFocus
          >
            Odhlásiť sa
          </StyledButton>
        </DialogActions>
      </StyledDialog>
    </PageWrapper>
  );
};

export default Navbar; 