import React, { useState, ChangeEvent, FormEvent, useEffect } from 'react';
import { OrderFormData, Customer, LoadingPlace, UnloadingPlace, SavedPlace } from '../types/orders';
import { countries } from '../constants/countries';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
  useTheme,
  useMediaQuery,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Tabs,
  Tab,
  Autocomplete,
  IconButton,
  InputAdornment,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import { useThemeMode } from '../contexts/ThemeContext';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { sk } from 'date-fns/locale';
import { Theme } from '@mui/material/styles';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';

const StyledPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  margin: theme.spacing(2, 0),
  width: '100%',
  background: theme.palette.mode === 'dark' 
    ? 'rgba(28, 28, 45, 0.35)' 
    : 'rgba(255, 255, 255, 0.95)',
  backdropFilter: 'blur(10px)',
  border: `1px solid ${theme.palette.mode === 'dark' 
    ? 'rgba(255, 255, 255, 0.1)' 
    : 'rgba(0, 0, 0, 0.1)'}`,
  borderRadius: 12,
  boxShadow: theme.palette.mode === 'dark'
    ? '0 4px 20px rgba(0, 0, 0, 0.2)'
    : '0 4px 20px rgba(0, 0, 0, 0.1)',
  '& .MuiTableCell-root, & .MuiTypography-root, & .MuiInputBase-root, & .MuiInputLabel-root, & .MuiTab-root, & .MuiSelect-select, & .MuiMenuItem-root, & .MuiFormLabel-root, & input, & .MuiAutocomplete-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiOutlinedInput-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    '& input': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    }
  },
  '& .MuiAutocomplete-option': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '@media (max-width: 600px)': {
    padding: theme.spacing(2),
    margin: 0,
    borderRadius: 0,
    border: 'none',
    boxShadow: 'none',
    width: '100vw',
    position: 'relative',
    left: '50%',
    transform: 'translateX(-50%)',
    '&:hover': {
      transform: 'translateX(-50%)',
    }
  }
}));

const StyledFieldset = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  marginBottom: theme.spacing(3),
  borderRadius: 8,
  background: theme.palette.mode === 'dark'
    ? 'rgba(35, 35, 66, 0.35)'
    : 'rgba(245, 245, 245, 0.95)',
  border: `1px solid ${theme.palette.mode === 'dark'
    ? 'rgba(255, 255, 255, 0.1)'
    : 'rgba(0, 0, 0, 0.1)'}`,
  '& .MuiTypography-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '@media (max-width: 600px)': {
    padding: theme.spacing(2),
    marginBottom: theme.spacing(2),
    width: '100%',
    borderRadius: 0,
    border: 'none',
    borderBottom: `1px solid ${theme.palette.mode === 'dark'
      ? 'rgba(255, 255, 255, 0.1)'
      : 'rgba(0, 0, 0, 0.1)'}`,
  }
}));

const StyledLegend = styled(Typography)(({ theme }) => ({
  padding: theme.spacing(0, 1),
  color: theme.palette.mode === 'dark' ? '#ff9f43' : '#000000',
  fontWeight: 600,
  fontSize: '1.1rem',
  marginBottom: theme.spacing(2),
}));

const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: 0,
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

const PageHeader = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(4),
  gap: theme.spacing(2),
  [theme.breakpoints.down('sm')]: {
    gap: theme.spacing(1.5)
  }
}));

const PageTitle = styled(Typography)<{ isDarkMode: boolean }>(({ isDarkMode }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: isDarkMode ? '#ffffff' : '#000000',
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: '-8px',
    left: 0,
    width: '60px',
    height: '4px',
    backgroundColor: '#ff9f43',
    borderRadius: '2px',
  }
}));

const PageDescription = styled(Typography)(({ theme }) => ({
  fontSize: '0.875rem',
  color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#000000',
  marginTop: theme.spacing(1)
}));

const StyledDivider = styled(Divider)(({ theme }) => ({
  width: '80px',
  height: '4px',
  margin: '8px 0 24px',
  background: theme.palette.warning.main,
  borderRadius: '2px',
}));

const HeaderContainer = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  marginBottom: theme.spacing(4),
  marginLeft: theme.spacing(2),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    '@media (max-width: 600px)': {
      fontSize: '0.9rem',
    },
    '& input': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    }
  },
  '& .MuiInputLabel-root': {
    '@media (max-width: 600px)': {
      fontSize: '0.9rem',
    },
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiOutlinedInput-notchedOutline': {
    borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.23)',
  },
  '& .MuiInputBase-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  }
}));

const autocompleteStyles = {
  '& .MuiAutocomplete-popper': {
    backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d' : '#ffffff',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
    border: (theme: Theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    borderRadius: '8px',
    backdropFilter: 'none',
    background: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
    '& .MuiPaper-root': {
      backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
      backgroundImage: 'none !important',
    },
    '& .MuiAutocomplete-option': {
      color: (theme: Theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
    }
  },
  '& .MuiAutocomplete-paper': {
    backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
    boxShadow: 'none',
    backgroundImage: 'none !important',
  },
  '& .MuiAutocomplete-listbox': {
    padding: 1,
    backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
    backgroundImage: 'none !important',
    '& .MuiAutocomplete-option': {
      borderRadius: '6px',
      margin: '2px 0',
      backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#1c1c2d !important' : '#ffffff !important',
      color: (theme: Theme) => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      '&[aria-selected="true"]': {
        backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#2a2a45 !important' : '#f5f5f5 !important',
      },
      '&.Mui-focused': {
        backgroundColor: (theme: Theme) => theme.palette.mode === 'dark' ? '#2a2a45 !important' : '#f5f5f5 !important',
      },
    },
  },
};

const StyledDateTimeField = styled(TextField)(({ theme }) => ({
  width: '100%',
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35, 35, 66, 0.35)' : 'rgba(245, 245, 245, 0.95)',
    borderRadius: '8px',
    border: `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'}`,
    '&:hover': {
      borderColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    },
    '& input': {
      color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      '&::-webkit-calendar-picker-indicator': {
        filter: theme.palette.mode === 'dark' ? 'invert(1)' : 'none',
        cursor: 'pointer'
      }
    }
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiSelect-select': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '@media (max-width: 600px)': {
    '& .MuiOutlinedInput-root': {
      fontSize: '0.9rem',
    },
    '& .MuiInputLabel-root': {
      fontSize: '0.9rem',
    }
  }
}));

const StyledDatePicker = styled(DatePicker)(({ theme }) => ({
  '& .MuiPaper-root': {
    backgroundColor: theme.palette.mode === 'dark' ? '#1c1c2d' : '#ffffff',
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  },
  '& .MuiPickersDay-root': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
    backgroundColor: theme.palette.mode === 'dark' ? 'rgba(35, 35, 66, 0.35)' : 'rgba(245, 245, 245, 0.95)',
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    },
    '&.Mui-selected': {
      backgroundColor: '#ff9f43',
      color: '#fff',
      '&:hover': {
        backgroundColor: '#ffbe76',
      },
    },
  },
  '& .MuiPickersCalendarHeader-root': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  },
  '& .MuiPickersDay-today': {
    borderColor: '#ff9f43',
  },
  '& .MuiIconButton-root': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
  },
  '& .MuiPickersYear-yearButton': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
    '&.Mui-selected': {
      backgroundColor: '#ff9f43',
      color: '#fff',
    },
  },
  '& .MuiPickersMonth-monthButton': {
    color: theme.palette.mode === 'dark' ? '#fff' : '#000',
    '&.Mui-selected': {
      backgroundColor: '#ff9f43',
      color: '#fff',
    },
  },
  '& .MuiPickersDay-dayOutsideMonth': {
    color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)',
  },
  '& .MuiInputBase-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  },
  '& .MuiInputLabel-root': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
  }
}));

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const emptyLoadingPlace: LoadingPlace = {
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: '',
  contactPerson: ''
};

const emptyUnloadingPlace: UnloadingPlace = {
  street: '',
  city: '',
  zip: '',
  country: 'Slovensko',
  dateTime: '',
  contactPerson: ''
};

const OrdersForm: React.FC = () => {
  const theme = useTheme();
  const { isDarkMode } = useThemeMode();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const [ordersList, setOrdersList] = useState<OrderFormData[]>([]);
  const [formData, setFormData] = useState<OrderFormData>({
    customerCompany: '',
    customerVatId: '',
    customerStreet: '',
    customerCity: '',
    customerZip: '',
    customerCountry: 'Slovensko',
    customerContactName: '',
    customerContactSurname: '',
    customerEmail: '',
    customerPhone: '',
    customerPrice: '',
    loadingPlaces: [{ ...emptyLoadingPlace }],
    unloadingPlaces: [{ ...emptyUnloadingPlace }],
    goodsDescription: '',
    weightKg: '',
    dimensionsL: '',
    dimensionsW: '',
    dimensionsH: '',
    quantity: '',
    carrierCompany: '',
    carrierContact: '',
    carrierVehicleReg: '',
    carrierPrice: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const [savedPlaces, setSavedPlaces] = useState<SavedPlace[]>([]);
  const [newPlaceName, setNewPlaceName] = useState('');
  const [placeType, setPlaceType] = useState<'loading' | 'unloading'>('loading');
  const [newPlace, setNewPlace] = useState({
    name: '',
    street: '',
    city: '',
    zip: '',
    country: 'Slovensko',
    contactPerson: ''
  });

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleCustomerSelect = (customer: Customer | null) => {
    setSelectedCustomer(customer);
    if (customer) {
      setFormData(prev => ({
        ...prev,
        customerCompany: customer.company,
        customerVatId: customer.vatId,
        customerStreet: customer.street,
        customerCity: customer.city,
        customerZip: customer.zip,
        customerCountry: customer.country,
        customerContactName: customer.contactName,
        customerContactSurname: customer.contactSurname,
        customerEmail: customer.email,
        customerPhone: formData.customerPhone
      }));
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prevState: OrderFormData) => ({
      ...prevState,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    try {
      // Ak je nový zákazník, pridáme ho do zoznamu
      if (!selectedCustomer) {
        const newCustomer: Customer = {
          company: formData.customerCompany,
          vatId: formData.customerVatId,
          street: formData.customerStreet,
          city: formData.customerCity,
          zip: formData.customerZip,
          country: formData.customerCountry,
          contactName: formData.customerContactName,
          contactSurname: formData.customerContactSurname,
          email: formData.customerEmail,
          phone: formData.customerPhone
        };
        setCustomers(prev => [...prev, newCustomer]);
      }

      setOrdersList(prevList => [...prevList, { ...formData }]);
      
      // Reset formulára
      setFormData({
        customerCompany: '',
        customerVatId: '',
        customerStreet: '',
        customerCity: '',
        customerZip: '',
        customerCountry: 'Slovensko',
        customerContactName: '',
        customerContactSurname: '',
        customerEmail: '',
        customerPhone: '',
        customerPrice: '',
        loadingPlaces: [{ ...emptyLoadingPlace }],
        unloadingPlaces: [{ ...emptyUnloadingPlace }],
        goodsDescription: '',
        weightKg: '',
        dimensionsL: '',
        dimensionsW: '',
        dimensionsH: '',
        quantity: '',
        carrierCompany: '',
        carrierContact: '',
        carrierVehicleReg: '',
        carrierPrice: '',
      });

      console.log('Odoslané dáta objednávky:', formData);
      alert('Objednávka bola vytvorená a pridaná do zoznamu.');
    } catch (error) {
      console.error('Chyba pri odosielaní objednávky:', error);
      alert('Nastala chyba pri odosielaní objednávky. Skúste to prosím znova.');
    }
  };

  const [loading, setLoading] = useState(false);

  const handleDownload = async () => {
    setLoading(true);
    try {
      // Implementácia funkcie na stiahnutie objednávky
      console.log('Stiahnutie objednávky:', formData);
      alert('Objednávka bola úspešne stiahnutá.');
    } catch (error) {
      console.error('Chyba pri stiahovaní objednávky:', error);
      alert('Nastala chyba pri stiahovaní objednávky. Skúste to prosím znova.');
    } finally {
      setLoading(false);
    }
  };

  // Filtrovanie objednávok
  const filteredOrders = ordersList.filter(order => {
    const matchesSearch = 
      order.customerCompany.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.customerVatId.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.loadingPlaces[0].city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.unloadingPlaces[0].city.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (startDate && endDate) {
      const orderDate = new Date(order.loadingPlaces[0].dateTime);
      return orderDate >= startDate && orderDate <= endDate;
    }

    return true;
  });

  const handleCountryChange = (field: string) => (event: any, newValue: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: newValue?.name || '',
      customerPhone: newValue ? `${newValue.prefix} ${prev.customerPhone.split(' ')[1] || ''}` : prev.customerPhone
    }));
  };

  const handleLoadingPlaceChange = (index: number, field: keyof LoadingPlace, value: string) => {
    setFormData(prev => ({
      ...prev,
      loadingPlaces: prev.loadingPlaces.map((place, i) => 
        i === index ? { ...place, [field]: value } : place
      )
    }));
  };

  const handleUnloadingPlaceChange = (index: number, field: keyof UnloadingPlace, value: string) => {
    setFormData(prev => ({
      ...prev,
      unloadingPlaces: prev.unloadingPlaces.map((place, i) => 
        i === index ? { ...place, [field]: value } : place
      )
    }));
  };

  const addLoadingPlace = () => {
    setFormData(prev => ({
      ...prev,
      loadingPlaces: [...prev.loadingPlaces, { ...emptyLoadingPlace }]
    }));
  };

  const addUnloadingPlace = () => {
    setFormData(prev => ({
      ...prev,
      unloadingPlaces: [...prev.unloadingPlaces, { ...emptyUnloadingPlace }]
    }));
  };

  const removeLoadingPlace = (index: number) => {
    if (formData.loadingPlaces.length > 1) {
      setFormData(prev => ({
        ...prev,
        loadingPlaces: prev.loadingPlaces.filter((_, i) => i !== index)
      }));
    }
  };

  const removeUnloadingPlace = (index: number) => {
    if (formData.unloadingPlaces.length > 1) {
      setFormData(prev => ({
        ...prev,
        unloadingPlaces: prev.unloadingPlaces.filter((_, i) => i !== index)
      }));
    }
  };

  const handlePlaceTypeChange = (event: SelectChangeEvent) => {
    setPlaceType(event.target.value as 'loading' | 'unloading');
  };

  const handlePlaceInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewPlace(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSavePlace = () => {
    const newSavedPlace: SavedPlace = {
      id: Date.now().toString(),
      type: placeType,
      name: newPlace.name,
      street: newPlace.street,
      city: newPlace.city,
      zip: newPlace.zip,
      country: newPlace.country,
      contactPerson: newPlace.contactPerson,
      createdAt: new Date(),
      updatedAt: new Date(),
      userId: 'current-user-id', // Toto by malo byť nahradené skutočným ID používateľa
      companyId: 'current-company-id' // Toto by malo byť nahradené skutočným ID spoločnosti
    };

    setSavedPlaces(prev => [...prev, newSavedPlace]);
    
    // Reset formulára
    setNewPlace({
      name: '',
      street: '',
      city: '',
      zip: '',
      country: 'Slovensko',
      contactPerson: ''
    });
    setPlaceType('loading');
  };

  const TabsContainer = styled(Box)(({ theme }) => ({
    '& .MuiTab-root': {
      color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#000000',
      '&.Mui-selected': {
        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
      }
    },
    '& .MuiTabs-indicator': {
      backgroundColor: '#ff9f43',
    }
  }));

  return (
    <PageWrapper>
      <PageHeader>
        <PageTitle isDarkMode={isDarkMode}>
          Objednávky
        </PageTitle>
        <PageDescription>
          Vytvárajte a spravujte objednávky pre vašich zákazníkov
        </PageDescription>
      </PageHeader>

      <TabsContainer>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange}
          sx={{
            '& .MuiTab-root': {
              color: theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.7)' : '#000000',
              '&.Mui-selected': {
                color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
              }
            }
          }}
        >
          <Tab label="Nová objednávka" />
          <Tab label="Všetky objednávky" />
          <Tab label="Zákazníci" />
          <Tab label="Miesta" />
        </Tabs>
      </TabsContainer>

      <TabPanel value={tabValue} index={0}>
        <StyledPaper>
          <form onSubmit={handleSubmit}>
            <Box sx={{
              width: '100%',
              maxWidth: '100%',
              '@media (max-width: 600px)': {
                padding: 0,
              }
            }}>
              <Grid container spacing={isMobile ? 2 : 3}>
                <Grid item xs={12}>
                  <StyledFieldset>
                    <StyledLegend>Údaje zákazníka</StyledLegend>
                    <Grid container spacing={isMobile ? 2 : 3}>
                      <Grid item xs={12}>
                        <Autocomplete
                          options={customers}
                          getOptionLabel={(option) => option.company}
                          value={selectedCustomer}
                          onChange={(event, newValue) => handleCustomerSelect(newValue)}
                          renderInput={(params) => (
                            <StyledTextField
                              {...params}
                              label="Vyberte existujúceho zákazníka"
                              fullWidth
                            />
                          )}
                          sx={autocompleteStyles}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          label="Názov firmy"
                          name="customerCompany"
                          value={formData.customerCompany}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          label="IČ DPH"
                          name="customerVatId"
                          value={formData.customerVatId}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <StyledTextField
                          fullWidth
                          label="Ulica a číslo"
                          name="customerStreet"
                          value={formData.customerStreet}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StyledTextField
                          fullWidth
                          label="Mesto"
                          name="customerCity"
                          value={formData.customerCity}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <StyledTextField
                          fullWidth
                          label="PSČ"
                          name="customerZip"
                          value={formData.customerZip}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={4}>
                        <Autocomplete
                          options={countries}
                          getOptionLabel={(option) => option.name}
                          value={countries.find(country => country.name === formData.customerCountry) || null}
                          onChange={handleCountryChange('customerCountry')}
                          renderInput={(params) => (
                            <StyledTextField
                              {...params}
                              label="Krajina"
                              required
                            />
                          )}
                          renderOption={(props, option) => (
                            <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                              <img
                                loading="lazy"
                                width="20"
                                src={`https://flagcdn.com/${option.code.toLowerCase()}.svg`}
                                alt={option.name}
                              />
                              {option.name}
                            </Box>
                          )}
                          sx={autocompleteStyles}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          label="Meno"
                          name="customerContactName"
                          value={formData.customerContactName}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          label="Priezvisko"
                          name="customerContactSurname"
                          value={formData.customerContactSurname}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          label="Email"
                          name="customerEmail"
                          type="email"
                          value={formData.customerEmail}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Autocomplete
                            options={countries}
                            getOptionLabel={(option) => `${option.name} (${option.prefix})`}
                            value={countries.find(country => country.prefix === formData.customerPhone.split(' ')[0]) || null}
                            onChange={(event, newValue) => {
                              setFormData(prev => ({
                                ...prev,
                                customerPhone: `${newValue?.prefix || '+421'} ${prev.customerPhone.split(' ')[1] || ''}`
                              }));
                            }}
                            renderInput={(params) => (
                              <StyledTextField
                                {...params}
                                label="Predvoľba"
                                required
                                sx={{ width: '250px' }}
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                                <img
                                  loading="lazy"
                                  width="20"
                                  src={`https://flagcdn.com/${option.code.toLowerCase()}.svg`}
                                  alt={option.name}
                                />
                                {option.name} ({option.prefix})
                              </Box>
                            )}
                            sx={autocompleteStyles}
                          />
                          <StyledTextField
                            fullWidth
                            label="Telefón"
                            name="customerPhone"
                            value={formData.customerPhone.split(' ')[1] || ''}
                            onChange={(e) => {
                              const prefix = formData.customerPhone.split(' ')[0] || '+421';
                              setFormData(prev => ({
                                ...prev,
                                customerPhone: `${prefix} ${e.target.value}`
                              }));
                            }}
                            required
                          />
                        </Box>
                      </Grid>
                      <Grid item xs={12}>
                        <StyledTextField
                          fullWidth
                          label="Suma od zákazníka (€)"
                          name="customerPrice"
                          type="number"
                          value={formData.customerPrice}
                          onChange={handleChange}
                          required
                          inputProps={{ min: 0, step: "any" }}
                        />
                      </Grid>
                    </Grid>
                  </StyledFieldset>
                </Grid>

                <Grid item xs={12}>
                  <StyledFieldset>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <StyledLegend>Miesta Nakládky</StyledLegend>
                      <Button
                        onClick={addLoadingPlace}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          color: theme.palette.primary.main,
                          '@media (max-width: 600px)': {
                            width: '100%',
                            py: 0.5,
                            fontSize: '0.9rem',
                            height: '32px',
                            minHeight: '32px'
                          }
                        }}
                      >
                        Pridať miesto nakládky
                      </Button>
                    </Box>
                    {formData.loadingPlaces.map((place, index) => (
                      <Box key={index} sx={{ position: 'relative', mb: 3 }}>
                        {index > 0 && (
                          <IconButton
                            onClick={() => removeLoadingPlace(index)}
                            sx={{
                              position: 'absolute',
                              right: -8,
                              top: -8,
                              color: theme.palette.error.main
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                        <Grid container spacing={isMobile ? 2 : 3}>
                          <Grid item xs={12}>
                            <StyledTextField
                              fullWidth
                              label="Ulica a číslo"
                              value={place.street}
                              onChange={(e) => handleLoadingPlaceChange(index, 'street', e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <StyledTextField
                              fullWidth
                              label="Mesto"
                              value={place.city}
                              onChange={(e) => handleLoadingPlaceChange(index, 'city', e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <StyledTextField
                              fullWidth
                              label="PSČ"
                              value={place.zip}
                              onChange={(e) => handleLoadingPlaceChange(index, 'zip', e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Autocomplete
                              options={countries}
                              getOptionLabel={(option) => option.name}
                              value={countries.find(country => country.name === place.country) || null}
                              onChange={(event, newValue) => handleLoadingPlaceChange(index, 'country', newValue?.name || 'Slovensko')}
                              renderInput={(params) => (
                                <StyledTextField
                                  {...params}
                                  label="Krajina"
                                  required
                                />
                              )}
                              renderOption={(props, option) => (
                                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                                  <img
                                    loading="lazy"
                                    width="20"
                                    src={`https://flagcdn.com/${option.code.toLowerCase()}.svg`}
                                    alt={option.name}
                                  />
                                  {option.name}
                                </Box>
                              )}
                              sx={autocompleteStyles}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                              <DateTimePicker
                                label="Dátum a čas nakládky"
                                value={place.dateTime ? new Date(place.dateTime) : null}
                                onChange={(newValue: Date | null) => {
                                  handleLoadingPlaceChange(index, 'dateTime', newValue ? newValue.toISOString() : '');
                                }}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    required: true,
                                    sx: {
                                      '& .MuiInputBase-root': {
                                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(35, 35, 66, 0.35)' : 'rgba(245, 245, 245, 0.95)',
                                      }
                                    }
                                  }
                                }}
                              />
                            </LocalizationProvider>
                          </Grid>
                          <Grid item xs={12}>
                            <StyledTextField
                              fullWidth
                              label="Kontaktná osoba (nakládka)"
                              value={place.contactPerson}
                              onChange={(e) => handleLoadingPlaceChange(index, 'contactPerson', e.target.value)}
                              required
                            />
                          </Grid>
                        </Grid>
                        {index < formData.loadingPlaces.length - 1 && (
                          <Divider sx={{ my: 3 }} />
                        )}
                      </Box>
                    ))}
                  </StyledFieldset>
                </Grid>

                <Grid item xs={12}>
                  <StyledFieldset>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <StyledLegend>Miesta Vykládky</StyledLegend>
                      <Button
                        onClick={addUnloadingPlace}
                        variant="outlined"
                        size="small"
                        sx={{
                          borderRadius: '8px',
                          textTransform: 'none',
                          color: theme.palette.primary.main,
                          '@media (max-width: 600px)': {
                            width: '100%',
                            py: 0.5,
                            fontSize: '0.9rem',
                            height: '32px',
                            minHeight: '32px'
                          }
                        }}
                      >
                        Pridať miesto vykládky
                      </Button>
                    </Box>
                    {formData.unloadingPlaces.map((place, index) => (
                      <Box key={index} sx={{ position: 'relative', mb: 3 }}>
                        {index > 0 && (
                          <IconButton
                            onClick={() => removeUnloadingPlace(index)}
                            sx={{
                              position: 'absolute',
                              right: -8,
                              top: -8,
                              color: theme.palette.error.main
                            }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        )}
                        <Grid container spacing={isMobile ? 2 : 3}>
                          <Grid item xs={12}>
                            <StyledTextField
                              fullWidth
                              label="Ulica a číslo"
                              value={place.street}
                              onChange={(e) => handleUnloadingPlaceChange(index, 'street', e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <StyledTextField
                              fullWidth
                              label="Mesto"
                              value={place.city}
                              onChange={(e) => handleUnloadingPlaceChange(index, 'city', e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <StyledTextField
                              fullWidth
                              label="PSČ"
                              value={place.zip}
                              onChange={(e) => handleUnloadingPlaceChange(index, 'zip', e.target.value)}
                              required
                            />
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Autocomplete
                              options={countries}
                              getOptionLabel={(option) => option.name}
                              value={countries.find(country => country.name === place.country) || null}
                              onChange={(event, newValue) => handleUnloadingPlaceChange(index, 'country', newValue?.name || 'Slovensko')}
                              renderInput={(params) => (
                                <StyledTextField
                                  {...params}
                                  label="Krajina"
                                  required
                                />
                              )}
                              renderOption={(props, option) => (
                                <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                                  <img
                                    loading="lazy"
                                    width="20"
                                    src={`https://flagcdn.com/${option.code.toLowerCase()}.svg`}
                                    alt={option.name}
                                  />
                                  {option.name}
                                </Box>
                              )}
                              sx={autocompleteStyles}
                            />
                          </Grid>
                          <Grid item xs={12}>
                            <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                              <DateTimePicker
                                label="Dátum a čas vykládky"
                                value={place.dateTime ? new Date(place.dateTime) : null}
                                onChange={(newValue: Date | null) => {
                                  handleUnloadingPlaceChange(index, 'dateTime', newValue ? newValue.toISOString() : '');
                                }}
                                slotProps={{
                                  textField: {
                                    fullWidth: true,
                                    required: true,
                                    sx: {
                                      '& .MuiInputBase-root': {
                                        backgroundColor: theme => theme.palette.mode === 'dark' ? 'rgba(35, 35, 66, 0.35)' : 'rgba(245, 245, 245, 0.95)',
                                      }
                                    }
                                  }
                                }}
                              />
                            </LocalizationProvider>
                          </Grid>
                          <Grid item xs={12}>
                            <StyledTextField
                              fullWidth
                              label="Kontaktná osoba (vykládka)"
                              value={place.contactPerson}
                              onChange={(e) => handleUnloadingPlaceChange(index, 'contactPerson', e.target.value)}
                              required
                            />
                          </Grid>
                        </Grid>
                        {index < formData.unloadingPlaces.length - 1 && (
                          <Divider sx={{ my: 3 }} />
                        )}
                      </Box>
                    ))}
                  </StyledFieldset>
                </Grid>

                <Grid item xs={12}>
                  <StyledFieldset>
                    <StyledLegend>Popis Tovaru</StyledLegend>
                    <Grid container spacing={isMobile ? 2 : 3}>
                      <Grid item xs={12}>
                        <StyledTextField
                          fullWidth
                          multiline
                          rows={3}
                          label="Popis tovaru"
                          name="goodsDescription"
                          value={formData.goodsDescription}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <StyledTextField
                          fullWidth
                          label="Množstvo (napr. počet paliet)"
                          name="quantity"
                          value={formData.quantity}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          type="number"
                          label="Váha (kg)"
                          name="weightKg"
                          value={formData.weightKg}
                          onChange={handleChange}
                          required
                          inputProps={{ min: 0, step: "any" }}
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <Box sx={{
                          display: 'flex',
                          gap: 1,
                          alignItems: 'center',
                          '@media (max-width: 600px)': {
                            flexDirection: 'column',
                            gap: 2,
                            '& .MuiTypography-root': {
                              display: 'none'
                            },
                            '& .MuiTextField-root': {
                              width: '100%'
                            }
                          }
                        }}>
                          <StyledTextField
                            fullWidth
                            type="number"
                            label="Dĺžka"
                            name="dimensionsL"
                            value={formData.dimensionsL}
                            onChange={handleChange}
                            required
                            inputProps={{ min: 0 }}
                          />
                          <Typography sx={{ color: 'text.secondary' }}>x</Typography>
                          <StyledTextField
                            fullWidth
                            type="number"
                            label="Šírka"
                            name="dimensionsW"
                            value={formData.dimensionsW}
                            onChange={handleChange}
                            required
                            inputProps={{ min: 0 }}
                          />
                          <Typography sx={{ color: 'text.secondary' }}>x</Typography>
                          <StyledTextField
                            fullWidth
                            type="number"
                            label="Výška"
                            name="dimensionsH"
                            value={formData.dimensionsH}
                            onChange={handleChange}
                            required
                            inputProps={{ min: 0 }}
                          />
                        </Box>
                      </Grid>
                    </Grid>
                  </StyledFieldset>
                </Grid>

                <Grid item xs={12}>
                  <StyledFieldset>
                    <StyledLegend>Dopravca (Vykonávateľ)</StyledLegend>
                    <Grid container spacing={isMobile ? 2 : 3}>
                      <Grid item xs={12}>
                        <StyledTextField
                          fullWidth
                          label="Názov firmy dopravcu"
                          name="carrierCompany"
                          value={formData.carrierCompany}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12}>
                        <StyledTextField
                          fullWidth
                          label="Kontakt na dopravcu"
                          name="carrierContact"
                          value={formData.carrierContact}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          label="EČV Vozidla"
                          name="carrierVehicleReg"
                          value={formData.carrierVehicleReg}
                          onChange={handleChange}
                          required
                        />
                      </Grid>
                      <Grid item xs={12} sm={6}>
                        <StyledTextField
                          fullWidth
                          type="number"
                          label="Cena za prepravu (€)"
                          name="carrierPrice"
                          value={formData.carrierPrice}
                          onChange={handleChange}
                          required
                          inputProps={{ min: 0, step: "any" }}
                        />
                      </Grid>
                    </Grid>
                  </StyledFieldset>
                </Grid>
              </Grid>
            </Box>

            <Grid container justifyContent="flex-end" sx={{ mt: 4 }}>
              <Grid item>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  sx={{
                    py: 1.5,
                    px: 4,
                    borderRadius: '12px',
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    transition: 'all 0.2s ease-in-out',
                    boxShadow: '0 4px 12px rgba(255, 159, 67, 0.3)',
                    backgroundColor: '#ff9f43',
                    '&:hover': {
                      backgroundColor: '#ffbe76',
                      transform: 'translateY(-2px)',
                      boxShadow: '0 6px 16px rgba(255, 159, 67, 0.4)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                    '@media (max-width: 600px)': {
                      width: '100%',
                      justifyContent: 'center'
                    }
                  }}
                >
                  Vytvoriť objednávku
                </Button>
              </Grid>
            </Grid>
          </form>
        </StyledPaper>
      </TabPanel>

      <TabPanel value={tabValue} index={1}>
        <PageDescription>
          Prehľad všetkých vytvorených objednávok
        </PageDescription>

        <StyledPaper>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  placeholder="Vyhľadať objednávku..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <IconButton onClick={() => setShowFilters(!showFilters)}>
                    <FilterListIcon />
                  </IconButton>
                </Box>
              </Grid>
            </Grid>

            {showFilters && (
              <Box sx={{ mt: 2 }}>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                      <DatePicker
                        label="Od dátumu"
                        value={startDate}
                        onChange={(newValue: Date | null) => setStartDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined'
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={sk}>
                      <DatePicker
                        label="Do dátumu"
                        value={endDate}
                        onChange={(newValue: Date | null) => setEndDate(newValue)}
                        slotProps={{
                          textField: {
                            fullWidth: true,
                            variant: 'outlined'
                          }
                        }}
                      />
                    </LocalizationProvider>
                  </Grid>
                </Grid>
              </Box>
            )}
          </Box>

          {filteredOrders.length === 0 ? (
            <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
              Neboli nájdené žiadne objednávky.
            </Typography>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Zákazník</TableCell>
                    <TableCell>IČ DPH</TableCell>
                    <TableCell>Nakládka</TableCell>
                    <TableCell>Vykládka</TableCell>
                    <TableCell>Dátum nakládky</TableCell>
                    <TableCell>Tovar</TableCell>
                    <TableCell align="right">Cena od zákazníka (€)</TableCell>
                    <TableCell align="right">Cena dopravcu (€)</TableCell>
                    <TableCell align="right">Marža (€)</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders.map((order, index) => {
                    const customerPrice = parseFloat(order.customerPrice) || 0;
                    const carrierPrice = parseFloat(order.carrierPrice) || 0;
                    const margin = customerPrice - carrierPrice;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell>{order.customerCompany}</TableCell>
                        <TableCell>{order.customerVatId}</TableCell>
                        <TableCell>{order.loadingPlaces[0].city}</TableCell>
                        <TableCell>{order.unloadingPlaces[0].city}</TableCell>
                        <TableCell>
                          {new Date(order.loadingPlaces[0].dateTime).toLocaleDateString('sk-SK')}
                        </TableCell>
                        <TableCell>{order.goodsDescription}</TableCell>
                        <TableCell align="right">{customerPrice.toFixed(2)}</TableCell>
                        <TableCell align="right">{carrierPrice.toFixed(2)}</TableCell>
                        <TableCell 
                          align="right"
                          sx={{ 
                            color: margin >= 0 ? 'success.main' : 'error.main',
                            fontWeight: 'bold'
                          }}
                        >
                          {margin.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </StyledPaper>
      </TabPanel>

      <TabPanel value={tabValue} index={2}>
        <PageDescription>
          Správa vašich zákazníkov
        </PageDescription>

        <StyledPaper>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Názov firmy</TableCell>
                  <TableCell>IČ DPH</TableCell>
                  <TableCell>Kontaktná osoba</TableCell>
                  <TableCell>Email</TableCell>
                  <TableCell>Telefón</TableCell>
                  <TableCell>Mesto</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {customers.map((customer, index) => (
                  <TableRow key={index}>
                    <TableCell>{customer.company}</TableCell>
                    <TableCell>{customer.vatId}</TableCell>
                    <TableCell>{`${customer.contactName} ${customer.contactSurname}`}</TableCell>
                    <TableCell>{customer.email}</TableCell>
                    <TableCell>{customer.phone}</TableCell>
                    <TableCell>{customer.city}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </StyledPaper>
      </TabPanel>

      <TabPanel value={tabValue} index={3}>
        <PageDescription>
          Správa uložených miest nakládky a vykládky
        </PageDescription>

        <StyledPaper>
          <Box sx={{ mb: 3 }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} sm={6}>
                <StyledTextField
                  fullWidth
                  placeholder="Vyhľadať miesto..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
            </Grid>
          </Box>

          <Box sx={{ mb: 4 }}>
            <StyledFieldset>
              <StyledLegend>Pridať nové miesto</StyledLegend>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <StyledTextField
                    fullWidth
                    label="Názov miesta"
                    name="name"
                    value={newPlace.name}
                    onChange={handlePlaceInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth>
                    <InputLabel>Typ miesta</InputLabel>
                    <Select
                      value={placeType}
                      onChange={handlePlaceTypeChange}
                      label="Typ miesta"
                      name="placeType"
                    >
                      <MenuItem value="loading">Miesto nakládky</MenuItem>
                      <MenuItem value="unloading">Miesto vykládky</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="Ulica a číslo"
                    name="street"
                    value={newPlace.street}
                    onChange={handlePlaceInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StyledTextField
                    fullWidth
                    label="Mesto"
                    name="city"
                    value={newPlace.city}
                    onChange={handlePlaceInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <StyledTextField
                    fullWidth
                    label="PSČ"
                    name="zip"
                    value={newPlace.zip}
                    onChange={handlePlaceInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Autocomplete
                    options={countries}
                    getOptionLabel={(option) => option.name}
                    value={countries.find(country => country.name === newPlace.country) || null}
                    onChange={(event, newValue) => {
                      setNewPlace(prev => ({
                        ...prev,
                        country: newValue?.name || 'Slovensko'
                      }));
                    }}
                    renderInput={(params) => (
                      <StyledTextField
                        {...params}
                        label="Krajina"
                        required
                      />
                    )}
                    renderOption={(props, option) => (
                      <Box component="li" sx={{ '& > img': { mr: 2, flexShrink: 0 } }} {...props}>
                        <img
                          loading="lazy"
                          width="20"
                          src={`https://flagcdn.com/${option.code.toLowerCase()}.svg`}
                          alt={option.name}
                        />
                        {option.name}
                      </Box>
                    )}
                    sx={autocompleteStyles}
                  />
                </Grid>
                <Grid item xs={12}>
                  <StyledTextField
                    fullWidth
                    label="Kontaktná osoba"
                    name="contactPerson"
                    value={newPlace.contactPerson}
                    onChange={handlePlaceInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleSavePlace}
                    disabled={!newPlace.name || !newPlace.street || !newPlace.city || !newPlace.zip || !newPlace.contactPerson}
                    sx={{
                      py: 1.5,
                      px: 4,
                      borderRadius: '12px',
                      fontSize: '0.95rem',
                      fontWeight: 600,
                      textTransform: 'none',
                      backgroundColor: '#ff9f43',
                      '&:hover': {
                        backgroundColor: '#ffbe76',
                      },
                    }}
                  >
                    Uložiť miesto
                  </Button>
                </Grid>
              </Grid>
            </StyledFieldset>
          </Box>

          <Typography variant="h6" gutterBottom>
            Uložené miesta
          </Typography>

          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Názov</TableCell>
                  <TableCell>Typ</TableCell>
                  <TableCell>Adresa</TableCell>
                  <TableCell>Mesto</TableCell>
                  <TableCell>Krajina</TableCell>
                  <TableCell>Kontakt</TableCell>
                  <TableCell align="right">Akcie</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {savedPlaces
                  .filter(place => 
                    place.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    place.city.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    place.street.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((place) => (
                    <TableRow key={place.id}>
                      <TableCell>{place.name}</TableCell>
                      <TableCell>
                        {place.type === 'loading' ? 'Nakládka' : 'Vykládka'}
                      </TableCell>
                      <TableCell>{place.street}</TableCell>
                      <TableCell>{place.city}</TableCell>
                      <TableCell>{place.country}</TableCell>
                      <TableCell>{place.contactPerson}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          onClick={() => {
                            const placeData = {
                              street: place.street,
                              city: place.city,
                              zip: place.zip,
                              country: place.country,
                              dateTime: '',
                              contactPerson: place.contactPerson
                            };
                            
                            if (place.type === 'loading') {
                              setFormData(prev => ({
                                ...prev,
                                loadingPlaces: [placeData, ...prev.loadingPlaces.slice(1)]
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                unloadingPlaces: [placeData, ...prev.unloadingPlaces.slice(1)]
                              }));
                            }
                            
                            setTabValue(0);
                          }}
                          color="primary"
                          size="small"
                        >
                          <AddIcon />
                        </IconButton>
                        <IconButton
                          onClick={() => {
                            setSavedPlaces(prev => 
                              prev.filter(p => p.id !== place.id)
                            );
                          }}
                          color="error"
                          size="small"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </StyledPaper>
      </TabPanel>
    </PageWrapper>
  );
};

export default OrdersForm; 