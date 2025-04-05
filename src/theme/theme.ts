import { createTheme, Theme } from '@mui/material/styles';
import { colors } from './colors';
import type {} from '@mui/x-date-pickers/themeAugmentation';

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
        default: isDarkMode ? colors.background.dark : '#ffffff',
        paper: isDarkMode ? colors.primary.main : '#ffffff',
      },
      text: {
        primary: isDarkMode ? colors.text.primaryDark : colors.text.primary,
        secondary: isDarkMode ? colors.text.secondaryDark : colors.text.secondary,
        disabled: isDarkMode ? colors.text.disabledDark : colors.text.disabled,
      },
      divider: isDarkMode ? colors.dividerDark : 'rgba(0, 0, 0, 0.15)',
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
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'}`,
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
            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.23)',
            color: '#ff9f43',
            '&:hover': {
              backgroundColor: 'rgba(255, 159, 67, 0.1)',
              borderColor: '#ffbe76',
            }
          },
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: 16,
            boxShadow: isDarkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.25)'
              : '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'}`,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            backgroundImage: 'none',
            boxShadow: isDarkMode 
              ? '0 4px 20px rgba(0, 0, 0, 0.25)'
              : '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'}`,
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'}`,
          },
        },
      },
      MuiTableHead: {
        styleOverrides: {
          root: {
            '& .MuiTableCell-root': {
              borderBottom: `2px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.15)'}`,
              fontWeight: 600,
            },
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: 12,
              '& fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.23)',
                borderWidth: '1px',
              },
              '&:hover fieldset': {
                borderColor: isDarkMode ? 'rgba(255, 159, 67, 0.5)' : 'rgba(255, 159, 67, 0.5)',
              },
              '&.Mui-focused fieldset': {
                borderColor: '#ff9f43',
                borderWidth: '2px',
              },
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
      MuiPopper: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1c1c2d' : '#ffffff',
            backgroundImage: 'none !important',
            backdropFilter: 'none',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
            border: `1px solid ${isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
            borderRadius: 8,
            '& .MuiPaper-root': {
              backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
              backgroundImage: 'none !important',
            }
          }
        }
      },
      MuiAutocomplete: {
        styleOverrides: {
          popper: {
            backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
            backgroundImage: 'none !important',
            backdropFilter: 'none !important',
            '& .MuiPaper-root': {
              backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
              backgroundImage: 'none !important',
            },
            '& .MuiAutocomplete-listbox': {
              backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
              backgroundImage: 'none !important',
              '& .MuiAutocomplete-option': {
                backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
                '&[aria-selected="true"]': {
                  backgroundColor: isDarkMode ? '#2a2a45 !important' : '#f5f5f5 !important',
                },
                '&.Mui-focused': {
                  backgroundColor: isDarkMode ? '#2a2a45 !important' : '#f5f5f5 !important',
                },
              },
            },
          }
        }
      },
      MuiMenu: {
        styleOverrides: {
          paper: {
            backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
            backgroundImage: 'none !important',
            backdropFilter: 'none',
          },
          list: {
            backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
            backgroundImage: 'none !important',
          }
        }
      },
      MuiDateCalendar: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1c1c2d' : '#ffffff',
            color: isDarkMode ? '#fff' : '#000',
            '& .MuiPickersDay-root': {
              color: isDarkMode ? '#fff' : '#000',
              backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.35)' : 'rgba(245, 245, 245, 0.95)',
              '&:hover': {
                backgroundColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
              },
              '&.Mui-selected': {
                backgroundColor: '#ff9f43',
                color: '#fff',
                '&:hover': {
                  backgroundColor: '#ffbe76',
                },
              },
            },
            '& .MuiDayCalendar-weekDayLabel': {
              color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
            },
            '& .MuiPickersDay-today': {
              borderColor: '#ff9f43',
            },
          },
        },
      },
      MuiPickersPopper: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
            backgroundImage: 'none !important',
            '& .MuiPaper-root': {
              backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
              backgroundImage: 'none !important',
              color: isDarkMode ? '#fff' : '#000',
            },
            '& .MuiPickersLayout-root': {
              backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
              color: isDarkMode ? '#fff' : '#000',
            },
            '& .MuiPickersToolbar-root': {
              backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
              color: isDarkMode ? '#fff' : '#000',
            },
            '& .MuiClock-root': {
              backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
              color: isDarkMode ? '#fff' : '#000',
            },
            '& .MuiClockNumber-root': {
              color: isDarkMode ? '#fff' : '#000',
            },
            '& .MuiClockPointer-root': {
              backgroundColor: '#ff9f43',
            },
            '& .MuiClockPointer-thumb': {
              backgroundColor: '#ff9f43',
              borderColor: '#ff9f43',
            },
          }
        }
      },
      MuiPickersLayout: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
            color: isDarkMode ? '#fff' : '#000',
            '& .MuiPickersLayout-actionBar': {
              backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
              color: isDarkMode ? '#fff' : '#000',
            }
          }
        }
      },
      MuiDateTimePickerTabs: {
        styleOverrides: {
          root: {
            backgroundColor: isDarkMode ? '#1c1c2d !important' : '#ffffff !important',
            color: isDarkMode ? '#fff' : '#000',
          }
        }
      },
      MuiClockPointer: {
        styleOverrides: {
          root: {
            backgroundColor: '#ff9f43',
            '& .MuiClock-pin': {
              backgroundColor: '#ff9f43',
            }
          }
        }
      }
    },
  });
}; 