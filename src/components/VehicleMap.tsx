import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries, Circle } from '@react-google-maps/api';
import { collection, onSnapshot, query, where, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Paper, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Chip, GlobalStyles } from '@mui/material';
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
    licensePlate: string;
    isOffline?: boolean;
    lastOnline?: Date;
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

// Časový limit pre aktuálnosť polohy (v milisekundách)
const LOCATION_MAX_AGE = 15 * 60 * 1000; // 15 minút
const STALE_LOCATION_TIME = 5 * 60 * 1000; // 5 minút

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

// Pridáme štýly pre InfoWindow
const hideGoogleMapElements = {
    '.gm-ui-hover-effect': {
        display: 'none !important'
    },
    '.gm-style-iw.gm-style-iw-c': {
        padding: '0 !important',
        backgroundColor: 'transparent !important',
        boxShadow: 'none !important',
        border: 'none !important',
        maxWidth: '300px !important'
    },
    '.gm-style-iw-d': {
        overflow: 'hidden !important',
        padding: '0 !important',
        backgroundColor: 'transparent !important'
    },
    '.gm-style .gm-style-iw-t::after': {
        display: 'none !important'
    },
    '.gm-style .gm-style-iw': {
        background: 'transparent !important'
    },
    '.gm-style .gm-style-iw > button': {
        display: 'none !important'
    },
    '.gm-style-iw-tc': {
        display: 'none !important'
    }
};

const VehicleMap: React.FC = () => {
    const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
    const [staleVehicles, setStaleVehicles] = useState<VehicleLocation[]>([]);
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
        }, 15000); // Aktualizácia každých 15 sekúnd pre lepšie sledovanie

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

        // Dotaz pre všetky vozidlá spoločnosti, vrátane offline
        const q = query(
            collection(db, 'vehicleLocations'), 
            where('companyID', '==', userData.companyID)
        );
        
        const unsubscribe = onSnapshot(
            q,
            { includeMetadataChanges: false },
            async (snapshot) => {
                const activeVehicles: VehicleLocation[] = [];
                const staleVehiclesData: VehicleLocation[] = [];
                
                console.log('🔍 Počet nájdených dokumentov:', snapshot.docs.length);
                
                for (const docSnapshot of snapshot.docs) {
                    const data = docSnapshot.data();
                    
                    // Kontrola či má vozidlo platnú polohu
                    if (!data.latitude || !data.longitude) {
                        console.log(`📍 Preskakujem vozidlo ${data.licensePlate} bez polohy`);
                        continue;
                    }

                    const companyDoc = await getDoc(doc(db, 'companies', data.companyID));
                    const companyName = companyDoc.exists() ? companyDoc.data().name : data.companyID;
                    
                    // Vytvorenie objektu vozidla
                    const lastUpdate = data.lastUpdate ? data.lastUpdate.toDate() : new Date();
                    const lastOnline = data.lastOnline ? data.lastOnline.toDate() : lastUpdate;
                    
                    const vehicleData = {
                        id: docSnapshot.id,
                        latitude: data.latitude,
                        longitude: data.longitude,
                        driverName: data.driverName || 'Neznámy vodič',
                        companyID: data.companyID,
                        companyName: companyName,
                        lastUpdate: lastUpdate,
                        lastOnline: lastOnline,
                        status: data.status || 'unknown',
                        currentLat: data.latitude,
                        currentLng: data.longitude,
                        licensePlate: data.licensePlate || 'Neznáme ŠPZ',
                        isOffline: data.isOffline === true
                    };
                    
                    // Kontrola aktuálnosti
                    const now = Date.now();
                    const updateAge = now - lastUpdate.getTime();
                    
                    // Ak je vozidlo explicitne označené ako offline alebo je veľmi staré
                    if (vehicleData.isOffline || updateAge > LOCATION_MAX_AGE) {
                        console.log(`⏰ Offline/zastaralé vozidlo ${data.licensePlate} - aktualizácia pred ${Math.floor(updateAge / 60000)} minútami`);
                        // Pridáme do zoznamu neaktívnych vozidiel
                        staleVehiclesData.push(vehicleData);
                    } 
                    // Aktívne vozidlá, ktoré nie sú príliš staré
                    else if (updateAge <= LOCATION_MAX_AGE) {
                        console.log(`✅ Aktívne vozidlo ${data.licensePlate} - aktualizácia pred ${Math.floor(updateAge / 60000)} minútami`);
                        activeVehicles.push(vehicleData);
                    }
                }
                
                setVehicles(activeVehicles);
                setStaleVehicles(staleVehiclesData);

                // Ak máme vozidlá, nastavíme mapu na ich zobrazenie
                if (activeVehicles.length > 0 && map) {
                    const bounds = new window.google.maps.LatLngBounds();
                    activeVehicles.forEach((vehicle) => {
                        bounds.extend({ lat: vehicle.latitude, lng: vehicle.longitude });
                    });
                    map.fitBounds(bounds);
                    
                    // Ak máme len jedno vozidlo, nastavíme väčší zoom
                    if (activeVehicles.length === 1) {
                        map.setZoom(15);
                    }
                }
            }
        );

        return () => {
            unsubscribe();
            if (animationFrameId) {
                cancelAnimationFrame(animationFrameId);
            }
        };
    }, [userData?.companyID, map]);

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
        if (selectedVehicle?.id === vehicle.id && showInfoWindow) {
            // Ak klikneme na už vybraté vozidlo, zavrieme InfoWindow
            setShowInfoWindow(false);
            setSelectedVehicle(null);
        } else {
            // Ak klikneme na nové vozidlo alebo znovu na zavrené, otvoríme InfoWindow
            setSelectedVehicle(vehicle);
            setShowInfoWindow(true);
        }
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

    const getStatusColor = (vehicle: VehicleLocation) => {
        const now = new Date();
        
        // Ak je vozidlo označené ako offline
        if (vehicle.isOffline) return 'error';
        
        const diffMinutes = Math.floor((now.getTime() - vehicle.lastUpdate.getTime()) / (1000 * 60));
        if (diffMinutes < 5) return 'success';
        if (diffMinutes < 15) return 'warning';
        return 'error';
    };

    const getStatusText = (vehicle: VehicleLocation) => {
        // Ak je vozidlo explicitne označené ako offline
        if (vehicle.isOffline) return "Offline";
        
        const now = new Date();
        const diffMinutes = Math.floor((now.getTime() - vehicle.lastUpdate.getTime()) / (1000 * 60));
        
        if (diffMinutes < 5) return "Online";
        if (diffMinutes < 15) return "Neaktívny";
        return "Offline";
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

    // Upravíme funkciu pre pozíciu InfoWindow
    const getInfoWindowPosition = (vehicle: VehicleLocation) => {
        return {
            lat: vehicle.latitude + 0.0008, // Zvýšená hodnota pre vyššiu pozíciu
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
            <GlobalStyles styles={hideGoogleMapElements} />
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
                                                            color={getStatusColor(vehicle)}
                                                            label={getStatusText(vehicle)}
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
                            
                            {/* Sekcia pre neaktívne vozidlá */}
                            {staleVehicles.length > 0 && (
                                <>
                                    <ListItem>
                                        <ListItemText 
                                            primary={
                                                <Typography variant="h6">
                                                    Neaktívni vodiči ({staleVehicles.length})
                                                </Typography>
                                            }
                                        />
                                    </ListItem>
                                    <Divider />
                                    {staleVehicles.map((vehicle) => (
                                        <React.Fragment key={vehicle.id}>
                                            <ListItem 
                                                button 
                                                onClick={() => handleListItemClick(vehicle)}
                                                selected={selectedVehicle?.id === vehicle.id}
                                                sx={{ opacity: 0.6 }}
                                            >
                                                <ListItemAvatar>
                                                    <Avatar sx={{ opacity: 0.7 }}>
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
                                                                color={getStatusColor(vehicle)}
                                                                label="Offline"
                                                                sx={{ ml: 1 }}
                                                            />
                                                        </Box>
                                                    }
                                                />
                                            </ListItem>
                                            <Divider />
                                        </React.Fragment>
                                    ))}
                                </>
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
                            {/* Aktívne vozidlá */}
                            {vehicles.map((vehicle) => (
                                <Marker
                                    key={vehicle.id}
                                    position={{
                                        lat: vehicle.currentLat || vehicle.latitude,
                                        lng: vehicle.currentLng || vehicle.longitude
                                    }}
                                    onClick={() => handleMarkerClick(vehicle)}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 8,
                                        fillColor: '#FF6B00',
                                        fillOpacity: 1,
                                        strokeWeight: 0
                                    }}
                                    zIndex={selectedVehicle?.id === vehicle.id ? 2 : 1}
                                />
                            ))}

                            {/* Neaktívne vozidlá so šedou ikonou */}
                            {staleVehicles.map((vehicle) => (
                                <Marker
                                    key={vehicle.id}
                                    position={{
                                        lat: vehicle.latitude,
                                        lng: vehicle.longitude
                                    }}
                                    onClick={() => handleMarkerClick(vehicle)}
                                    icon={{
                                        path: window.google.maps.SymbolPath.CIRCLE,
                                        scale: 7,
                                        fillColor: '#888888',  // Šedá farba pre neaktívne vozidlá
                                        fillOpacity: 0.7,
                                        strokeWeight: 0
                                    }}
                                    zIndex={selectedVehicle?.id === vehicle.id ? 2 : 0}
                                    opacity={0.7}
                                />
                            ))}

                            {selectedVehicle && showInfoWindow && (
                                <InfoWindow
                                    position={getInfoWindowPosition(selectedVehicle)}
                                    onCloseClick={handleInfoWindowClose}
                                    options={{
                                        pixelOffset: new window.google.maps.Size(0, -5), // Znížená hodnota z -10 na -5
                                        maxWidth: 300
                                    }}
                                >
                                    <Box sx={{
                                        p: 2.5,
                                        minWidth: '280px',
                                        bgcolor: isDarkMode ? '#2A2D3E' : '#ffffff',
                                        borderRadius: 2,
                                        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.16)',
                                        color: isDarkMode ? '#fff' : '#000'
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
                                                    color: isDarkMode ? '#fff' : '#000',
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
                                                    color: isDarkMode ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
                                                    fontWeight: 500
                                                }}>
                                                    {formatTimeDiff(selectedVehicle.lastUpdate)}
                                                </Typography>
                                                <Chip
                                                    size="small"
                                                    color={getStatusColor(selectedVehicle)}
                                                    label={getStatusText(selectedVehicle)}
                                                    sx={{ ml: 'auto', height: '20px', fontSize: '0.7rem' }}
                                                />
                                            </Box>
                                        </Box>
                                        
                                        <Divider sx={{ 
                                            my: 2,
                                            borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
                                        }} />
                                        
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                            <Box sx={{ 
                                                display: 'flex', 
                                                alignItems: 'flex-start', 
                                                gap: 1.5
                                            }}>
                                                <CarIcon sx={{ 
                                                    color: '#FF6B00',
                                                    fontSize: 22,
                                                    mt: 0.3
                                                }} />
                                                <Box>
                                                    <Typography sx={{ 
                                                        color: isDarkMode ? '#fff' : '#000',
                                                        fontWeight: 500,
                                                        mb: 0.5
                                                    }}>
                                                        {selectedVehicle.licensePlate || 'Neznáme ŠPZ'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ 
                                                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                                        display: 'block'
                                                    }}>
                                                        Aktuálne vozidlo
                                                    </Typography>
                                                </Box>
                                            </Box>
                                            
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
                                                        color: isDarkMode ? '#fff' : '#000',
                                                        fontWeight: 500,
                                                        mb: 0.5
                                                    }}>
                                                        {selectedVehicle.companyName || 'AESA Group'}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ 
                                                        color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)',
                                                        display: 'block'
                                                    }}>
                                                        ID: {selectedVehicle.companyID}
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