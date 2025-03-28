import { createTheme, Theme } from '@mui/material/styles';
import { colors } from './colors';

export const createAppTheme = (isDarkMode: boolean): Theme => {
  return createTheme({
    palette: {
      mode: isDarkMode ? 'dark' : 'light',
      primary: {
        main: '#ff9f43',
        light: '#ffbe76',
        dark: '#f7b067',
        contrastText: '#ffffff',
      },
      secondary: {
        main: colors.secondary.main,
        light: colors.secondary.light,
        dark: colors.secondary.dark,
        contrastText: colors.secondary.contrastText,
      },
      error: {
        main: colors.error.main,
        light: colors.error.light,
        dark: colors.error.dark,
      },
      warning: {
        main: colors.warning.main,
        light: colors.warning.light,
        dark: colors.warning.dark,
      },
      info: {
        main: colors.info.main,
        light: colors.info.light,
        dark: colors.info.dark,
      },
      success: {
        main: colors.success.main,
        light: colors.success.light,
        dark: colors.success.dark,
      },
      background: {
        default: isDarkMode ? colors.background.dark : colors.background.default,
        paper: isDarkMode ? colors.primary.main : colors.background.paper,
      },
      text: {
        primary: isDarkMode ? colors.text.primaryDark : colors.text.primary,
        secondary: isDarkMode ? colors.text.secondaryDark : colors.text.secondary,
        disabled: isDarkMode ? colors.text.disabledDark : colors.text.disabled,
      },
      divider: isDarkMode ? colors.dividerDark : colors.divider,
    },
    typography: {
      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
      h1: {
        fontSize: '2.5rem',
        fontWeight: 700,
        lineHeight: 1.2,
      },
      h2: {
        fontSize: '2rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h3: {
        fontSize: '1.75rem',
        fontWeight: 600,
        lineHeight: 1.3,
      },
      h4: {
        fontSize: '1.5rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h5: {
        fontSize: '1.25rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      h6: {
        fontSize: '1rem',
        fontWeight: 600,
        lineHeight: 1.4,
      },
      body1: {
        fontSize: '1rem',
        lineHeight: 1.5,
      },
      body2: {
        fontSize: '0.875rem',
        lineHeight: 1.5,
      },
    },
    shape: {
      borderRadius: 12,
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            textTransform: 'none',
            borderRadius: '8px',
            fontSize: '14px',
          },
          contained: {
            backgroundColor: '#ff9f43',
            color: '#ffffff',
            '&:hover': {
              backgroundColor: '#ffbe76',
            },
            '&:active': {
              backgroundColor: '#f7b067',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(255, 159, 67, 0.3)',
              color: 'rgba(255, 255, 255, 0.3)',
            }
          },
          outlined: {
            borderColor: '#ff9f43',
            color: '#ff9f43',
            '&:hover': {
              backgroundColor: 'rgba(255, 159, 67, 0.1)',
              borderColor: '#ffbe76',
            }
          },
          text: {
            color: '#ff9f43',
            '&:hover': {
              backgroundColor: 'rgba(255, 159, 67, 0.1)',
            }
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDarkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.25)'
              : '0 4px 20px rgba(0, 0, 0, 0.1)',
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
            },
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: '#ff9f43',
            '&:hover': {
              backgroundColor: 'rgba(255, 159, 67, 0.1)'
            },
            '&:active': {
              backgroundColor: 'rgba(255, 159, 67, 0.2)'
            },
            '&.Mui-disabled': {
              color: 'rgba(255, 159, 67, 0.3)'
            }
          }
        }
      },
    },
  });
}; 