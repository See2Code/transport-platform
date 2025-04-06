import React, { useEffect, useRef, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { styled } from '@mui/material';
import { Box, CircularProgress, Alert } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

// Vytvorenie vlastných ikon pre markery
const createIcon = (color: string, isSelected: boolean) => ({
    path: "M29.395,0H17.636c-3.117,0-5.643,3.467-5.643,6.584v34.804c0,3.116,2.526,5.644,5.643,5.644h11.759   c3.116,0,5.644-2.527,5.644-5.644V6.584C35.037,3.467,32.511,0,29.395,0z M34.05,14.188v11.665l-2.729,0.351v-4.806L34.05,14.188z    M32.618,10.773c-1.016,3.9-2.219,8.51-2.219,8.51H16.631l-2.222-8.51C14.41,10.773,23.293,7.755,32.618,10.773z M15.741,21.713   v4.492l-2.73-0.349V14.502L15.741,21.713z M13.011,37.938V27.579l2.73,0.343v8.196L13.011,37.938z M14.568,40.882l2.218-3.336   h13.771l2.219,3.336H14.568z M31.321,35.805v-7.872l2.729-0.355v10.048L31.321,35.805z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: isSelected ? 0.7 : 0.5,
    anchor: new google.maps.Point(25, 25),
    rotation: 0
});

const containerStyle = {
    width: '100%',
    height: '100%'
};

const defaultCenter = {
    lat: 48.669026,
    lng: 19.699024
};

const MapWrapper = styled('div')({
    height: '100%',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
});

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
    }
];

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
    type?: string;
    licensePlate?: string;
    dimensions?: {
        length: number;
        width: number;
        height: number;
    };
    maxLoad?: number;
}

interface VehicleTrackerProps {
    vehicles: Vehicle[];
    selectedVehicle?: string | null;
    onVehicleSelect?: (vehicleId: string) => void;
    center?: [number, number];
    zoom?: number;
    isDarkMode?: boolean;
}

const VehicleTracker: React.FC<VehicleTrackerProps> = ({
    vehicles,
    selectedVehicle,
    onVehicleSelect,
    center = [48.669026, 19.699024],
    zoom = 7,
    isDarkMode = false
}) => {
    const [selectedMarker, setSelectedMarker] = useState<Vehicle | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const [vehicleLocations, setVehicleLocations] = useState<Vehicle[]>([]);
    const mapRef = useRef<google.maps.Map | null>(null);
    const { currentUser } = useAuth();

    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    useEffect(() => {
        if (!currentUser) return;

        console.log('🗺️ VehicleTracker: Začínam sledovať polohy vozidiel');
        
        // Vytvoríme query pre sledovanie polôh vozidiel
        const locationsQuery = query(
            collection(db, 'vehicle-locations')
        );

        // Začneme sledovať zmeny
        const unsubscribe = onSnapshot(locationsQuery, (snapshot) => {
            const locations = snapshot.docs.map(doc => {
                const data = doc.data() as Vehicle;
                return {
                    ...data,
                    id: doc.id
                };
            });
            
            console.log('🗺️ VehicleTracker: Aktualizácia polôh vozidiel:', locations.length);
            setVehicleLocations(locations);

            // Ak máme mapu a vozidlá, upravíme zobrazenie
            if (mapRef.current && locations.length > 0) {
                const bounds = new google.maps.LatLngBounds();
                locations.forEach(vehicle => {
                    bounds.extend({
                        lat: vehicle.location.latitude,
                        lng: vehicle.location.longitude
                    });
                });
                mapRef.current.fitBounds(bounds);
            }
        }, (error) => {
            console.error('🗺️ VehicleTracker: Chyba pri sledovaní polôh:', error);
        });

        return () => {
            console.log('🗺️ VehicleTracker: Ukončujem sledovanie polôh');
            unsubscribe();
        };
    }, [currentUser]);

    const onLoad = React.useCallback((map: google.maps.Map) => {
        console.log('🗺️ VehicleTracker: Mapa načítaná úspešne');
        mapRef.current = map;
        setMap(map);

        if (vehicles.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            vehicles.forEach(vehicle => {
                bounds.extend({ 
                    lat: vehicle.location.latitude, 
                    lng: vehicle.location.longitude 
                });
            });
            map.fitBounds(bounds);
        }
    }, [vehicles]);

    const onUnmount = React.useCallback(() => {
        console.log('🗺️ VehicleTracker: Mapa odmontovaná');
        mapRef.current = null;
        setMap(null);
    }, []);

    if (loadError) {
        console.error('🗺️ VehicleTracker: Chyba pri načítaní mapy:', loadError);
        return (
            <MapWrapper>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <Alert severity="error">
                        Chyba pri načítaní Google Maps: {loadError.message}
                    </Alert>
                </Box>
            </MapWrapper>
        );
    }

    if (!isLoaded) {
        return (
            <MapWrapper>
                <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    <CircularProgress />
                </Box>
            </MapWrapper>
        );
    }

    return (
        <MapWrapper>
            <GoogleMap
                mapContainerStyle={containerStyle}
                center={defaultCenter}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: isDarkMode ? darkMapStyles : lightMapStyles,
                    zoomControl: true,
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: true,
                }}
            >
                {vehicleLocations.map((vehicle) => (
                    <Marker
                        key={vehicle.id}
                        position={{
                            lat: vehicle.location.latitude,
                            lng: vehicle.location.longitude
                        }}
                        icon={createIcon(selectedVehicle === vehicle.vehicleId ? '#ff9f43' : '#4285F4', selectedVehicle === vehicle.vehicleId)}
                        onClick={() => {
                            onVehicleSelect?.(vehicle.vehicleId);
                            setSelectedMarker(vehicle);
                        }}
                    />
                ))}

                {selectedMarker && (
                    <InfoWindow
                        position={{
                            lat: selectedMarker.location.latitude,
                            lng: selectedMarker.location.longitude
                        }}
                        onCloseClick={() => setSelectedMarker(null)}
                    >
                        <div style={{ padding: '12px', maxWidth: '300px' }}>
                            <h3 style={{ margin: '0 0 8px 0', color: '#333' }}>{selectedMarker.driverName}</h3>
                            <div style={{ 
                                backgroundColor: '#f5f5f5', 
                                padding: '8px', 
                                borderRadius: '4px',
                                marginBottom: '8px'
                            }}>
                                <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                                    <strong>ŠPZ:</strong> {selectedMarker.licensePlate || selectedMarker.vehicleId}
                                </p>
                                {selectedMarker.type && (
                                    <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                                        <strong>Typ:</strong> {selectedMarker.type}
                                    </p>
                                )}
                                {selectedMarker.dimensions && (
                                    <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                                        <strong>Rozmery:</strong> {selectedMarker.dimensions.length}x{selectedMarker.dimensions.width}x{selectedMarker.dimensions.height} m
                                    </p>
                                )}
                                {selectedMarker.maxLoad && (
                                    <p style={{ margin: '0 0 4px 0', color: '#666' }}>
                                        <strong>Nosnosť:</strong> {selectedMarker.maxLoad} kg
                                    </p>
                                )}
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                color: '#999',
                                borderTop: '1px solid #eee',
                                paddingTop: '8px'
                            }}>
                                Posledná aktualizácia:<br/>
                                {new Date(selectedMarker.lastActive).toLocaleString('sk-SK')}
                            </div>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </MapWrapper>
    );
};

export default VehicleTracker; 