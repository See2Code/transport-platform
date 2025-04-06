import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Alert, styled, TextField, InputAdornment, List, ListItem, ListItemText, IconButton, Tooltip } from '@mui/material';
import VehicleTracker from './VehicleTracker';
import { useVehicleTracking } from '../hooks/useVehicleTracking';
import { useThemeMode } from '../contexts/ThemeContext';
import { useAuth } from '../contexts/AuthContext';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import SearchIcon from '@mui/icons-material/Search';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocalShippingIcon from '@mui/icons-material/LocalShipping';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useTheme } from '@mui/material/styles';

interface Vehicle {
    id: string;
    vehicleId: string;
    driverName: string;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number;
        timestamp: number;
    };
    lastActive: number;
}

interface StyledProps {
    isDarkMode: boolean;
    isActive?: boolean;
}

interface StyledListItemProps {
    $isDarkMode: boolean;
    $isActive?: boolean;
}

interface StyledTextFieldProps {
    $isDarkMode: boolean;
}

const PageWrapper = styled('div')({
  padding: '24px',
  '@media (max-width: 600px)': {
    padding: '16px',
    paddingBottom: '80px',
    overflowX: 'hidden',
    width: '100%',
    maxWidth: '100vw'
  }
});

const PageHeader = styled(Box)({
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  marginBottom: '32px',
  '@media (max-width: 600px)': {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '16px'
  }
});

const PageTitle = styled(Typography)(({ theme }) => ({
  fontSize: '1.75rem',
  fontWeight: 700,
  color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
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

const MapContainer = styled(Box)({
  display: 'flex',
  gap: '24px',
  height: 'calc(100vh - 200px)',
  '@media (max-width: 900px)': {
    flexDirection: 'column',
    height: 'auto'
  }
});

const SidePanel = styled(Box)(({ theme }) => ({
  width: '300px',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : '#ffffff',
  borderRadius: '12px',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  height: '100%',
  '@media (max-width: 900px)': {
    width: '100%',
    height: 'auto'
  }
}));

const MapBox = styled(Box)({
  flex: 1,
  borderRadius: '12px',
  overflow: 'hidden',
  height: '100%',
  '@media (max-width: 900px)': {
    height: '500px'
  }
});

const VehicleList = styled(List)({
  overflowY: 'auto',
  flex: 1,
  '&::-webkit-scrollbar': {
    width: '4px'
  },
  '&::-webkit-scrollbar-track': {
    background: 'rgba(0, 0, 0, 0.1)'
  },
  '&::-webkit-scrollbar-thumb': {
    background: '#ff9f43',
    borderRadius: '4px'
  }
});

const VehicleListItem = styled(ListItem)(({ theme }) => ({
  borderRadius: '8px',
  marginBottom: '8px',
  backgroundColor: 'transparent',
  '&.active': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 159, 67, 0.2)' 
      : 'rgba(255, 159, 67, 0.1)'
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 159, 67, 0.15)' 
      : 'rgba(255, 159, 67, 0.05)'
  }
}));

const CustomTextField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255, 255, 255, 0.05)' 
      : 'rgba(0, 0, 0, 0.05)',
    borderRadius: '8px',
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ff9f43'
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderColor: '#ff9f43'
    }
  },
  '& .MuiOutlinedInput-input': {
    color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000'
  }
}));

const VehicleMap: React.FC = () => {
    const { vehicles, loading, error } = useVehicleTracking();
    const theme = useTheme();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [hiddenVehicles, setHiddenVehicles] = useState<string[]>([]);

    const filteredVehicles = vehicles?.filter(vehicle => 
        vehicle.driverName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        vehicle.vehicleId?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const toggleVehicleVisibility = (vehicleId: string) => {
        setHiddenVehicles(prev => 
            prev.includes(vehicleId) 
                ? prev.filter(id => id !== vehicleId)
                : [...prev, vehicleId]
        );
    };

    if (loading) {
        return (
            <PageWrapper>
                <PageHeader>
                    <PageTitle>Poloha vozidiel</PageTitle>
                </PageHeader>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress />
                </Box>
            </PageWrapper>
        );
    }

    if (error) {
        return (
            <PageWrapper>
                <PageHeader>
                    <PageTitle>Poloha vozidiel</PageTitle>
                </PageHeader>
                <Alert severity="error">
                    Chyba pri načítaní vozidiel: {error}
                </Alert>
            </PageWrapper>
        );
    }

    return (
        <PageWrapper>
            <PageHeader>
                <PageTitle>Poloha vozidiel</PageTitle>
            </PageHeader>

            <MapContainer>
                <SidePanel>
                    <CustomTextField
                        fullWidth
                        variant="outlined"
                        placeholder="Vyhľadať vozidlo..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">
                                    <SearchIcon sx={{ color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000' }} />
                                </InputAdornment>
                            ),
                        }}
                    />
                    
                    <Typography variant="body2" color="textSecondary">
                        Aktívne vozidlá: {vehicles?.length || 0}
                    </Typography>

                    <VehicleList>
                        {filteredVehicles?.map((vehicle) => (
                            <VehicleListItem 
                                key={vehicle.vehicleId}
                                className={selectedVehicle === vehicle.vehicleId ? 'active' : ''}
                                onClick={() => setSelectedVehicle(vehicle.vehicleId)}
                            >
                                <LocalShippingIcon sx={{ mr: 2, color: '#ff9f43' }} />
                                <ListItemText
                                    primary={vehicle.driverName || 'Neznámy vodič'}
                                    secondary={vehicle.vehicleId}
                                />
                                <IconButton
                                    size="small"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        toggleVehicleVisibility(vehicle.vehicleId);
                                    }}
                                >
                                    {hiddenVehicles.includes(vehicle.vehicleId) ? (
                                        <VisibilityOffIcon />
                                    ) : (
                                        <VisibilityIcon />
                                    )}
                                </IconButton>
                            </VehicleListItem>
                        ))}
                    </VehicleList>
                </SidePanel>

                <MapBox>
                    <VehicleTracker
                        vehicles={filteredVehicles?.filter(v => !hiddenVehicles.includes(v.vehicleId)) || []}
                        selectedVehicle={selectedVehicle}
                        onVehicleSelect={setSelectedVehicle}
                        isDarkMode={theme.palette.mode === 'dark'}
                    />
                </MapBox>
            </MapContainer>
        </PageWrapper>
    );
};

export default VehicleMap; 