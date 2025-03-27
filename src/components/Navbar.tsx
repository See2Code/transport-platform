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
  color: colors.text.secondary,
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  display: 'flex',
  justifyContent: 'center',
  width: '100%',
  margin: 0,
  '& .MuiSvgIcon-root': {
    transition: 'transform 0.3s ease',
  }
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

const LogoImage = styled('img')({
  height: '24px',
  width: 'auto',
  marginRight: '16px',
  opacity: 0.9,
  transition: 'all 0.2s ease',
  '&:hover': {
    opacity: 1,
    transform: 'scale(1.02)'
  },
  '@media (max-width: 600px)': {
    height: '20px',
    marginRight: '12px'
  }
});

const BrandContainer = styled(Box)({
  display: 'flex',
  alignItems: 'center',
  gap: '8px',
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

const StyledMenuItem = styled(MenuItem)({
  color: colors.text.primary,
  padding: '12px 16px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  '& .MuiListItemIcon-root': {
    color: colors.text.secondary,
    minWidth: '40px',
  },
  '&:hover .MuiListItemIcon-root': {
    color: colors.primary.main,
  },
});

const StyledMenuItemIcon = styled(ListItemIcon)({
  minWidth: 0,
  marginRight: 1,
  color: colors.text.secondary
});

const StyledMenuItemText = styled(ListItemText)({
  '& .MuiTypography-root': {
    fontSize: '0.9rem',
    fontWeight: 500
  }
});

const LogoutButton = styled(IconButton)({
  color: colors.text.secondary,
  '&:hover': {
    color: colors.primary.main,
    backgroundColor: 'rgba(255, 159, 67, 0.1)'
  }
});

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

const StyledAppBar = styled(AppBar)({
  backgroundColor: colors.background.main,
  backdropFilter: 'blur(10px)',
  boxShadow: 'none',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  zIndex: 1000,
});

const StyledToolbar = styled(Toolbar)({
  minHeight: '64px',
  padding: '0 16px',
  justifyContent: 'space-between',
  '@media (max-width: 600px)': {
    minHeight: '56px',
  },
});

const MenuButton = styled(IconButton)({
  color: colors.text.primary,
  marginRight: '16px',
  '&:hover': {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
});

const StyledMenu = styled(Menu)<{ isDarkMode: boolean }>(({ theme, isDarkMode }) => ({
  '& .MuiPaper-root': {
    background: isDarkMode ? 'rgba(35, 35, 66, 0.95)' : 'rgba(255, 255, 255, 0.95)',
    backdropFilter: 'blur(10px)',
    borderRadius: '20px',
    border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.15)',
    marginTop: '8px',
    minWidth: 'auto',
    width: 'auto',
    zIndex: 1200,
    [theme.breakpoints.down('sm')]: {
      position: 'fixed',
      top: 'auto',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: 'auto',
      minWidth: 'auto',
      maxWidth: '90%',
      margin: 0,
      borderRadius: '20px',
      maxHeight: '90vh',
      overflowY: 'auto',
      zIndex: 1200,
      marginBottom: '16px'
    }
  },
  '& .MuiList-root': {
    padding: '8px',
    position: 'relative',
    whiteSpace: 'nowrap',
    [theme.breakpoints.down('sm')]: {
      padding: '16px',
    }
  },
  '& .MuiMenuItem-root': {
    borderRadius: '12px',
    padding: '12px 16px',
    margin: '4px 0',
    color: isDarkMode ? '#ffffff' : '#000000',
    '&:hover': {
      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
    },
    [theme.breakpoints.down('sm')]: {
      padding: '16px',
      margin: '8px 0',
    }
  },
  '& .MuiListItemIcon-root': {
    minWidth: '40px',
    color: isDarkMode ? '#ffffff' : '#000000',
  },
  '& .MuiListItemText-root': {
    margin: 0,
  },
  '& .MuiListItemText-primary': {
    fontSize: '1rem',
    fontWeight: 500,
    color: isDarkMode ? '#ffffff' : '#000000',
  },
  '& .MuiListItemText-secondary': {
    fontSize: '0.875rem',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  },
  '& .MuiDivider-root': {
    margin: '8px 0',
    borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  '& .MuiButton-root': {
    width: '100%',
    marginTop: '8px',
    padding: '12px',
    borderRadius: '12px',
    textTransform: 'none',
    fontSize: '1rem',
    fontWeight: 600,
    '&.MuiButton-contained': {
      background: colors.primary.main,
      color: '#ffffff',
      '&:hover': {
        background: colors.primary.light,
      },
    },
    '&.MuiButton-outlined': {
      borderColor: 'rgba(255, 255, 255, 0.2)',
      color: '#ffffff',
      '&:hover': {
        borderColor: 'rgba(255, 255, 255, 0.3)',
      },
    },
  },
}));

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
  padding: '6px 12px',
  borderRadius: '8px',
  cursor: 'pointer',
  '&:hover': {
    backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
  },
  '& .MuiListItemIcon-root': {
    minWidth: '32px',
    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
  },
  '& .MuiListItemText-root': {
    margin: 0,
    '& .MuiTypography-root': {
      fontSize: '0.9rem',
      color: isDarkMode ? '#ffffff' : '#000000',
    },
  },
}));

const Navbar = () => {
  const [mobileMenuAnchor, setMobileMenuAnchor] = useState<null | HTMLElement>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();

  const handleMobileMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMobileMenuAnchor(event.currentTarget);
  };

  const handleMobileMenuClose = () => {
    setMobileMenuAnchor(null);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    handleMobileMenuClose();
  };

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const menuItems = [
    { text: 'Domov', icon: <HomeIcon />, path: '/', hidden: true },
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
    { text: 'Transporty', icon: <LocalShippingIcon />, path: '/transports', hidden: true },
    { text: 'Sledované prepravy', icon: <VisibilityIcon />, path: '/tracked-transports' },
    { text: 'Obchodné prípady', icon: <BusinessIcon />, path: '/business-cases' },
    { text: 'Tím', icon: <GroupIcon />, path: '/team' },
    { text: 'Kontakty', icon: <ContactsIcon />, path: '/contacts' },
    { text: 'Nastavenia', icon: <SettingsIcon />, path: '/settings' },
  ];

  return (
    <PageWrapper>
      <StyledAppBar>
        <StyledToolbar>
          {isMobile ? (
            <>
              <BrandContainer>
                <LogoImage src="/AESA white.svg" alt="AESA Logo" />
              </BrandContainer>
              <MenuButton
                edge="end"
                color="inherit"
                aria-label="menu"
                onClick={handleMobileMenuClick}
              >
                <MenuIcon />
              </MenuButton>
            </>
          ) : (
            <>
              <BrandContainer>
                <LogoImage src="/AESA white.svg" alt="AESA Logo" />
                <Typography variant="h6" noWrap component="div">
                  Transport Platform
                </Typography>
              </BrandContainer>
              <Box sx={{ 
                display: 'flex', 
                gap: 0.5,
                alignItems: 'center',
                height: '40px'
              }}>
                {menuItems.filter(item => !item.hidden).map((item) => (
                  <Box
                    key={item.text}
                    onClick={() => item.path && navigate(item.path)}
                    sx={{
                      minWidth: 'auto',
                      padding: '6px 12px',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                      },
                    }}
                  >
                    <ListItemIcon sx={{ 
                      minWidth: '32px', 
                      color: isDarkMode ? colors.text.secondary : 'rgba(0, 0, 0, 0.7)' 
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    <ListItemText 
                      primary={item.text}
                      sx={{
                        margin: 0,
                        '& .MuiTypography-root': {
                          fontSize: '0.9rem',
                          color: isDarkMode ? '#ffffff' : '#000000',
                        },
                      }} 
                    />
                  </Box>
                ))}
                <IconButton
                  onClick={toggleTheme}
                  sx={{
                    minWidth: 'auto',
                    padding: '6px',
                    borderRadius: '8px',
                    color: isDarkMode ? colors.text.secondary : 'rgba(0, 0, 0, 0.7)',
                    '&:hover': {
                      backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
                    },
                  }}
                >
                  {isDarkMode ? <Brightness7Icon /> : <Brightness4Icon />}
                </IconButton>
                <Box
                  onClick={handleLogout}
                  sx={{
                    minWidth: 'auto',
                    padding: '6px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    marginLeft: 1,
                    '&:hover': {
                      backgroundColor: 'rgba(255, 255, 255, 0.05)',
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: '32px', color: colors.text.secondary }}>
                    <LogoutIcon />
                  </ListItemIcon>
                  <ListItemText 
                    primary="Odhlásiť sa"
                    sx={{
                      margin: 0,
                      '& .MuiTypography-root': {
                        fontSize: '0.9rem',
                      },
                    }} 
                  />
                </Box>
              </Box>
            </>
          )}
        </StyledToolbar>
      </StyledAppBar>

      <StyledMenu
        isDarkMode={isDarkMode}
        anchorEl={mobileMenuAnchor}
        open={Boolean(mobileMenuAnchor)}
        onClose={handleMobileMenuClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ 
          display: { xs: 'flex', sm: 'none' },
          justifyContent: 'flex-end',
          padding: '8px 16px',
          position: 'sticky',
          top: 0,
          backgroundColor: 'rgba(35, 35, 66, 0.95)',
          zIndex: 1,
          backdropFilter: 'blur(10px)',
        }}>
          <IconButton
            onClick={handleMobileMenuClose}
            sx={{
              color: colors.text.primary,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
              },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Box>
        {menuItems.filter(item => !item.hidden).map((item) => (
          <MenuItem
            key={item.text}
            onClick={() => item.path && handleNavigation(item.path)}
            sx={{
              padding: '12px 24px',
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              color: colors.text.primary,
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
              },
            }}
          >
            <ListItemIcon sx={{ 
              minWidth: 'auto',
              color: colors.text.secondary,
              '& .MuiSvgIcon-root': {
                fontSize: '1.25rem',
              },
            }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText 
              primary={item.text}
              sx={{
                '& .MuiTypography-root': {
                  fontSize: '0.95rem',
                  fontWeight: 500,
                },
              }}
            />
          </MenuItem>
        ))}
        <Divider sx={{ margin: '8px 0', backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)' }} />
        <MenuItem
          onClick={toggleTheme}
          sx={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: isDarkMode ? '#ffffff' : '#000000',
            '&:hover': {
              backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
            },
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 'auto',
            color: 'inherit',
            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem',
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
        </MenuItem>
        <MenuItem
          onClick={handleLogout}
          sx={{
            padding: '12px 24px',
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            color: '#d64545',
            '&:hover': {
              backgroundColor: 'rgba(214, 69, 69, 0.08)',
            },
          }}
        >
          <ListItemIcon sx={{ 
            minWidth: 'auto',
            color: 'inherit',
            '& .MuiSvgIcon-root': {
              fontSize: '1.25rem',
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
        </MenuItem>
      </StyledMenu>
    </PageWrapper>
  );
};

export default Navbar; 