import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Paper, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Chip } from '@mui/material';
import { 
    DirectionsCar as CarIcon, 
    AccessTime as TimeIcon, 
    Business as CompanyIcon, 
    LocationOn as LocationIcon,
    Person as PersonIcon 
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useThemeMode } from '../contexts/ThemeContext';

interface VehicleLocation {
    id: string;
    latitude: number;
    longitude: number;
    driverName: string;
    companyID: string;
    companyName?: string;
    lastUpdate: Date;
    status: string;
    address?: string;
    currentLat?: number;
    currentLng?: number;
}

const mapContainerStyle = {
    width: '100%',
    height: '700px',
    borderRadius: '12px'
};

const defaultCenter = {
    lat: 48.669026, // Slovensko centrum
    lng: 19.699024
};

const libraries: Libraries = ['places'];

const darkMapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#1a1a2e' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#1a1a2e', weight: 2 }]
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [
      { color: '#ffffff' },
      { weight: 0.5 },
      { opacity: 0.3 }
    ]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      { color: '#12121f' }
    ]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      { color: '#1a1a2e' }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      { color: '#2a2a4e' }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [
      { color: '#212a37' }
    ]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      { color: '#ffffff' }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      { color: '#3a3a6e' }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [
      { visibility: 'off' }
    ]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [
      { visibility: 'off' }
    ]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [
      { color: '#ffffff' }
    ]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.stroke',
    stylers: [
      { color: '#1a1a2e' },
      { weight: 2 }
    ]
  }
];

const lightMapStyles = [
  {
    featureType: 'all',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#000000' }]
  },
  {
    featureType: 'all',
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#ffffff', weight: 2 }]
  },
  {
    featureType: 'administrative.country',
    elementType: 'geometry.stroke',
    stylers: [
      { color: '#000000' },
      { weight: 0.5 },
      { opacity: 0.3 }
    ]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [
      { color: '#f0f0f0' }
    ]
  },
  {
    featureType: 'landscape',
    elementType: 'geometry',
    stylers: [
      { color: '#ffffff' }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [
      { color: '#e0e0e0' }
    ]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [
      { color: '#d0d0d0' }
    ]
  },
  {
    featureType: 'road',
    elementType: 'labels.text.fill',
    stylers: [
      { color: '#000000' }
    ]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [
      { color: '#cccccc' }
    ]
  },
  {
    featureType: 'poi',
    elementType: 'geometry',
    stylers: [
      { visibility: 'off' }
    ]
  },
  {
    featureType: 'transit',
    elementType: 'geometry',
    stylers: [
      { visibility: 'off' }
    ]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [
      { color: '#000000' }
    ]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.stroke',
    stylers: [
      { color: '#ffffff' },
      { weight: 2 }
    ]
  }
];

const VehicleMap: React.FC = () => {
    const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [showInfoWindow, setShowInfoWindow] = useState(false);
    const [geocoder, setGeocoder] = useState<google.maps.Geocoder | null>(null);
    const { userData } = useAuth();
    const [timeUpdate, setTimeUpdate] = useState(0);
    const [animationFrameId, setAnimationFrameId] = useState<number | null>(null);
    const { isDarkMode } = useThemeMode();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries,
        id: 'script-loader'
    });

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeUpdate(prev => prev + 1);
        }, 60000); // Aktualizácia každú minútu

        return () => clearInterval(timer);
    }, []);

    // Funkcia pre interpoláciu medzi dvoma bodmi
    const interpolatePosition = (
        startLat: number,
        startLng: number,
        endLat: number,
        endLng: number,
        progress: number
    ) => {
        return {
            lat: startLat + (endLat - startLat) * progress,
            lng: startLng + (endLng - startLng) * progress
        };
    };

    // Funkcia pre animáciu pohybu
    const animateMarker = (
        vehicle: VehicleLocation,
        startLat: number,
        startLng: number,
        endLat: number,
        endLng: number,
        startTime: number
    ) => {
        const animationDuration = 2000; // 2 sekundy na animáciu
        const currentTime = Date.now();
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / animationDuration, 1);

        const newPosition = interpolatePosition(startLat, startLng, endLat, endLng, progress);
        
        setVehicles(prev => prev.map(v => 
            v.id === vehicle.id 
                ? { ...v, currentLat: newPosition.lat, currentLng: newPosition.lng }
                : v
        ));

        if (progress < 1) {
            const frameId = requestAnimationFrame(() => 
                animateMarker(vehicle, startLat, startLng, endLat, endLng, startTime)
            );
            setAnimationFrameId(frameId);
        }
    };

    useEffect(() => {
        if (!userData?.companyID) return;

        const q = query(
            collection(db, 'vehicleLocations'), 
            where('status', '==', 'active'),
            where('companyID', '==', userData.companyID)
        );
        
        const unsubscribe = onSnapshot(q, async (snapshot) => {
            const vehicleData: VehicleLocation[] = [];
            
            for (const docSnapshot of snapshot.docs) {
                const data = docSnapshot.data();
                const companyDoc = await getDoc(doc(db, 'companies', data.companyID));
                const companyName = companyDoc.exists() ? companyDoc.data().name : data.companyID;
                
                const newVehicle = {
                    id: docSnapshot.id,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    driverName: data.driverName,
                    companyID: data.companyID,
                    companyName: companyName,
                    lastUpdate: data.lastUpdate.toDate(),
                    status: data.status,
                    currentLat: data.latitude,
                    currentLng: data.longitude
                };

                // Ak vozidlo už existuje, spustíme animáciu
                const existingVehicle = vehicles.find(v => v.id === newVehicle.id);
                if (existingVehicle && 
                    (existingVehicle.latitude !== newVehicle.latitude || 
                     existingVehicle.longitude !== newVehicle.longitude)) {
                    
                    if (animationFrameId) {
                        cancelAnimationFrame(animationFrameId);
                    }
                    
                    animateMarker(
                        newVehicle,
                        existingVehicle.currentLat || existingVehicle.latitude,
                        existingVehicle.currentLng || existingVehicle.longitude,
                        newVehicle.latitude,
                        newVehicle.longitude,
                        Date.now()
                    );
                }
                
                vehicleData.push(newVehicle);
            }
            setVehicles(vehicleData);
        });

        return () => {
            unsubscribe();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [userData?.companyID]);

    useEffect(() => {
        if (map && selectedVehicle) {
            const position = { lat: selectedVehicle.latitude, lng: selectedVehicle.longitude };
            map.panTo(position);
            map.setZoom(15);
        }
    }, [selectedVehicle, map]);

    useEffect(() => {
        if (isLoaded && !geocoder) {
            setGeocoder(new window.google.maps.Geocoder());
        }
    }, [isLoaded]);

    const handleMarkerClick = async (vehicle: VehicleLocation) => {
        console.log('Kliknuté vozidlo:', vehicle);
        setSelectedVehicle(vehicle);
        setShowInfoWindow(true);
    };

    const handleListItemClick = (vehicle: VehicleLocation) => {
        setSelectedVehicle(vehicle);
        setShowInfoWindow(false);
    };

    const handleInfoWindowClose = () => {
        setShowInfoWindow(false);
    };

    if (!isLoaded) {
        return <Box>Načítavam mapu...</Box>;
    }

    const getStatusColor = (lastUpdate: Date) => {
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
        if (diffMinutes < 5) return 'success';
        if (diffMinutes < 15) return 'warning';
        return 'error';
    };

    const formatTimeDiff = (lastUpdate: Date) => {
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60));
        
        if (diffMinutes < 1) return 'Práve teraz';
        if (diffMinutes === 1) return 'Pred 1 min';
        if (diffMinutes < 60) return `Pred ${diffMinutes} min`;
        
        const hours = Math.floor(diffMinutes / 60);
        const remainingMinutes = diffMinutes % 60;
        
        if (hours === 1) {
            if (remainingMinutes === 0) return 'Pred 1 hodinou';
            return `Pred 1 hod ${remainingMinutes} min`;
        }
        
        if (remainingMinutes === 0) return `Pred ${hours} hodinami`;
        return `Pred ${hours} hod ${remainingMinutes} min`;
    };

    // Vypočíta pozíciu pre InfoWindow, aby sa neprekrývalo s markerom
    const getInfoWindowPosition = (vehicle: VehicleLocation) => {
        return {
            lat: vehicle.latitude + 0.0015, // Posunie InfoWindow vyššie
            lng: vehicle.longitude
        };
    };

    // Funkcia na získanie adresy
    const getAddress = async (latitude: number, longitude: number): Promise<string> => {
        if (!geocoder) return '';

        try {
            const response = await geocoder.geocode({
                location: { lat: latitude, lng: longitude }
            });

            if (response.results[0]) {
                return response.results[0].formatted_address;
            }
            return '';
        } catch (error) {
            console.error('Chyba pri získavaní adresy:', error);
            return '';
        }
    };

    return (
        <Box sx={{ p: 2 }}>
            <Typography variant="h4" gutterBottom>
                Mapa vozidiel
            </Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3} sx={{ height: '700px', overflow: 'auto' }}>
                        <List>
                            <ListItem>
                                <ListItemText 
                                    primary={
                                        <Typography variant="h6">
                                            Aktívni vodiči ({vehicles.length})
                                        </Typography>
                                    }
                                />
                            </ListItem>
                            <Divider />
                            {vehicles.length === 0 ? (
                                <ListItem>
                                    <ListItemText 
                                        primary="Žiadni aktívni vodiči"
                                        secondary="Momentálne nie sú k dispozícii žiadne aktívne vozidlá"
                                    />
                                </ListItem>
                            ) : (
                                vehicles.map((vehicle) => (
                                    <React.Fragment key={vehicle.id}>
                                        <ListItem 
                                            button 
                                            onClick={() => handleListItemClick(vehicle)}
                                            selected={selectedVehicle?.id === vehicle.id}
                                        >
                                            <ListItemAvatar>
                                                <Avatar>
                                                    <CarIcon />
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={vehicle.driverName}
                                                secondary={
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <TimeIcon fontSize="small" />
                                                        <Typography variant="body2" component="span">
                                                            {formatTimeDiff(vehicle.lastUpdate)}
                                                        </Typography>
                                                        <Chip
                                                            size="small"
                                                            color={getStatusColor(vehicle.lastUpdate)}
                                                            label="Online"
                                                            sx={{ ml: 1 }}
                                                        />
                                                    </Box>
                                                }
                                            />
                                        </ListItem>
                                        <Divider />
                                    </React.Fragment>
                                ))
                            )}
                        </List>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper elevation={3}>
                        <GoogleMap
                            mapContainerStyle={{
                                ...mapContainerStyle,
                                backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff'
                            }}
                            center={defaultCenter}
                            zoom={7}
                            onLoad={map => setMap(map)}
                            options={{
                                styles: isDarkMode ? darkMapStyles : lightMapStyles,
                                disableDefaultUI: false,
                                zoomControl: true,
                                mapTypeControl: false,
                                scaleControl: true,
                                streetViewControl: false,
                                rotateControl: true,
                                fullscreenControl: true,
                                backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff'
                            }}
                        >
                            {vehicles.map((vehicle) => (
                                <Marker
                                    key={vehicle.id}
                                    position={{
                                        lat: vehicle.currentLat || vehicle.latitude,
                                        lng: vehicle.currentLng || vehicle.longitude
                                    }}
                                    onClick={() => handleMarkerClick(vehicle)}
                                    icon={{
                                        url: '/vehicle-marker.svg',
                                        scaledSize: new window.google.maps.Size(32, 32),
                                        anchor: new window.google.maps.Point(16, 16),
                                        labelOrigin: new window.google.maps.Point(16, -10)
                                    }}
                                    zIndex={selectedVehicle?.id === vehicle.id ? 2 : 1}
                                />
                            ))}

                            {selectedVehicle && showInfoWindow && (
                                <InfoWindow
                                    position={getInfoWindowPosition(selectedVehicle)}
                                    onCloseClick={handleInfoWindowClose}
                                    options={{
                                        pixelOffset: new window.google.maps.Size(0, -10)
                                    }}
                                >
                                    <Box sx={{
                                        p: 2.5,
                                        minWidth: '280px',
                                        bgcolor: '#2A2D3E',
                                        borderRadius: 2,
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
                                        color: '#fff'
                                    }}>
                                        <Box sx={{ mb: 2 }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'center', 
                                                gap: 1.5,
                                                mb: 1.5
                                            }}>
                                                <PersonIcon sx={{ 
                                                    color: '#FF6B00',
                                                    fontSize: 28
                                                }} />
                                                <Typography variant="h6" sx={{ 
                                                    color: '#fff',
                                                    fontWeight: 600,
                                                    letterSpacing: '0.5px'
                                                }}>
                                                    {selectedVehicle.driverName || 'Neznámy vodič'}
                                                </Typography>
                                            </Box>
                                            <Box sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mt: 1
                                            }}>
                                                <TimeIcon sx={{ color: '#FF6B00' }} />
                                                <Typography variant="body2" sx={{ 
                                                    color: 'rgba(255, 255, 255, 0.7)',
                                                    fontWeight: 500
                                                }}>
                                                    {formatTimeDiff(selectedVehicle.lastUpdate)}
                                                </Typography>
                                                <Box sx={{ 
                                                    width: 8, 
                                                    height: 8, 
                                                    borderRadius: '50%',
                                                    bgcolor: getStatusColor(selectedVehicle.lastUpdate) === 'success' ? '#4CAF50' : 
                                                            getStatusColor(selectedVehicle.lastUpdate) === 'warning' ? '#FFC107' : '#F44336',
                                                    ml: 'auto'
                                                }} />
                                            </Box>
                                        </Box>
                                        
                                        <Divider sx={{ 
                                            my: 2,
                                            borderColor: 'rgba(255, 255, 255, 0.1)'
                                        }} />
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start', 
                                                gap: 1.5
                                            }}>
                                                <CompanyIcon sx={{ 
                                                    color: '#FF6B00',
                                                    fontSize: 22,
                                                    mt: 0.3
                                                }} />
                                                <Box>
                                                    <Typography sx={{ 
                                                        color: '#fff',
                                                        fontWeight: 500,
                                                        mb: 0.5
                                                    }}>
                                                        {selectedVehicle.companyName || 'AESA Group'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ 
                                                        color: 'rgba(255, 255, 255, 0.5)',
                                                        display: 'block'
                                                    }}>
                                                        ID: {selectedVehicle.companyID}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start', 
                                                gap: 1.5
                                            }}>
                                                <LocationIcon sx={{ 
                                                    color: '#FF6B00',
                                                    fontSize: 22,
                                                    mt: 0.3
                                                }} />
                                                <Box>
                                                    <Typography variant="body2" sx={{ 
                                                        color: 'rgba(255, 255, 255, 0.7)',
                                                        mb: 0.5
                                                    }}>
                                                        GPS súradnice
                                                    </Typography>
                                                    <Typography sx={{ 
                                                        color: '#fff',
                                                        fontFamily: 'monospace',
                                                        fontSize: '0.9rem',
                                                        bgcolor: 'rgba(255, 107, 0, 0.1)',
                                                        p: 1,
                                                        borderRadius: 1,
                                                        border: '1px solid rgba(255, 107, 0, 0.2)'
                                                    }}>
                                                        {selectedVehicle.latitude.toFixed(6)}, {selectedVehicle.longitude.toFixed(6)}
                                                    </Typography>
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Box>
                                </InfoWindow>
                            )}
                        </GoogleMap>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};

export default VehicleMap; 