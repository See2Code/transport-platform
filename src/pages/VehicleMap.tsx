import React, { useState, useCallback } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { useVehicleTracking } from '../hooks/useVehicleTracking';
import { Box, Typography, CircularProgress, Alert, Paper, IconButton } from '@mui/material';
import { styled } from '@mui/material/styles';
import { Visibility, VisibilityOff } from '@mui/icons-material';

const MapContainer = styled(Box)(({ theme }) => ({
  width: '100%',
  height: 'calc(100vh - 64px)',
  position: 'relative',
}));

const VehicleList = styled(Paper)(({ theme }) => ({
  position: 'absolute',
  top: theme.spacing(2),
  left: theme.spacing(2),
  width: 300,
  maxHeight: 'calc(100% - 32px)',
  overflowY: 'auto',
  zIndex: 1,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
}));

const VehicleItem = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(2),
  marginBottom: theme.spacing(1),
  cursor: 'pointer',
  backgroundColor: theme.palette.mode === 'dark' ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
  },
}));

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

const VehicleMap: React.FC = () => {
  const { vehicles, loading, error } = useVehicleTracking();
  const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
  const [hiddenVehicles, setHiddenVehicles] = useState<Set<string>>(new Set());
  const [map, setMap] = useState<google.maps.Map | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    id: 'google-map-script',
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
    version: "weekly"
  });

  const onLoad = useCallback((map: google.maps.Map) => {
    console.log('Mapa načítaná');
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  const toggleVehicleVisibility = (vehicleId: string) => {
    setHiddenVehicles(prev => {
      const newSet = new Set(prev);
      if (newSet.has(vehicleId)) {
        newSet.delete(vehicleId);
      } else {
        newSet.add(vehicleId);
      }
      return newSet;
    });
  };

  if (loadError) {
    return (
      <Box p={2}>
        <Alert severity="error">Chyba pri načítaní Google Maps: {loadError.message}</Alert>
      </Box>
    );
  }

  if (!isLoaded || loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <MapContainer>
      <GoogleMap
        mapContainerStyle={{ width: '100%', height: '100%' }}
        center={{ lat: 48.669, lng: 19.699 }}
        zoom={8}
        onLoad={onLoad}
        onUnmount={onUnmount}
        options={{
          zoomControl: true,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
        }}
      >
        {vehicles
          .filter(vehicle => !hiddenVehicles.has(vehicle.id))
          .map(vehicle => (
            <Marker
              key={vehicle.id}
              position={{
                lat: vehicle.location.lat,
                lng: vehicle.location.lng
              }}
              onClick={() => setSelectedVehicle(vehicle.id)}
              icon={{
                url: vehicle.isOnline ? 'http://maps.google.com/mapfiles/ms/icons/green-dot.png' : 'http://maps.google.com/mapfiles/ms/icons/red-dot.png',
                scaledSize: new window.google.maps.Size(32, 32)
              }}
            >
              {selectedVehicle === vehicle.id && (
                <InfoWindow onCloseClick={() => setSelectedVehicle(null)}>
                  <Box>
                    <Typography variant="subtitle1">{vehicle.driverName}</Typography>
                    <Typography variant="body2">Vozidlo: {vehicle.licensePlate}</Typography>
                    <Typography variant="body2">
                      Posledná aktualizácia: {new Date(vehicle.lastUpdate).toLocaleString('sk-SK')}
                    </Typography>
                    <Typography variant="body2">
                      Presnosť: {vehicle.location.accuracy.toFixed(0)}m
                    </Typography>
                  </Box>
                </InfoWindow>
              )}
            </Marker>
          ))}
      </GoogleMap>

      <VehicleList>
        <Typography variant="h6" gutterBottom>
          Zoznam vozidiel
        </Typography>
        {loading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={24} />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : (
          vehicles.map(vehicle => (
            <VehicleItem key={vehicle.id}>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="subtitle1">{vehicle.driverName}</Typography>
                  <Typography variant="body2" color="textSecondary">
                    {vehicle.licensePlate}
                  </Typography>
                  <Typography variant="body2" color={vehicle.isOnline ? 'success.main' : 'error.main'}>
                    {vehicle.isOnline ? 'Online' : 'Offline'}
                  </Typography>
                </Box>
                <IconButton
                  size="small"
                  onClick={() => toggleVehicleVisibility(vehicle.id)}
                  color={hiddenVehicles.has(vehicle.id) ? 'default' : 'primary'}
                >
                  {hiddenVehicles.has(vehicle.id) ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </Box>
            </VehicleItem>
          ))
        )}
      </VehicleList>
    </MapContainer>
  );
};

export default VehicleMap; 