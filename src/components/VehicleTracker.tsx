import React, { useEffect, useRef } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow } from '@react-google-maps/api';
import { styled } from '@mui/material';

const libraries: ("places" | "drawing" | "geometry" | "visualization")[] = ["places"];

// Vytvorenie vlastných ikon pre markery
const createIcon = (color: string) => ({
    path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
    fillColor: color,
    fillOpacity: 1,
    strokeWeight: 1,
    strokeColor: '#ffffff',
    scale: 2,
    anchor: new google.maps.Point(12, 22),
});

const MapWrapper = styled('div')(({ theme }) => ({
    height: '100%',
    width: '100%',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.2)',
}));

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
    center = [48.669026, 19.699024], // Centrum Slovenska
    zoom = 7,
    isDarkMode = false
}) => {
    const [selectedMarker, setSelectedMarker] = React.useState<Vehicle | null>(null);
    const mapRef = useRef<google.maps.Map | null>(null);

    const { isLoaded } = useJsApiLoader({
        id: 'script-loader',
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries,
    });

    const onLoad = React.useCallback((map: google.maps.Map) => {
        mapRef.current = map;
    }, []);

    const onUnmount = React.useCallback(() => {
        mapRef.current = null;
    }, []);

    useEffect(() => {
        if (mapRef.current && vehicles.length > 0) {
            const bounds = new google.maps.LatLngBounds();
            vehicles.forEach(vehicle => {
                bounds.extend({ lat: vehicle.location.latitude, lng: vehicle.location.longitude });
            });
            mapRef.current.fitBounds(bounds);
        }
    }, [vehicles]);

    useEffect(() => {
        if (mapRef.current && selectedVehicle) {
            const vehicle = vehicles.find(v => v.vehicleId === selectedVehicle);
            if (vehicle) {
                mapRef.current.panTo({ lat: vehicle.location.latitude, lng: vehicle.location.longitude });
                mapRef.current.setZoom(Math.max(mapRef.current.getZoom() || zoom, 12));
                setSelectedMarker(vehicle);
            }
        }
    }, [selectedVehicle, vehicles, zoom]);

    if (!isLoaded) return null;

    return (
        <MapWrapper>
            <GoogleMap
                mapContainerStyle={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '12px'
                }}
                center={{ lat: center[0], lng: center[1] }}
                zoom={zoom}
                onLoad={onLoad}
                onUnmount={onUnmount}
                options={{
                    styles: isDarkMode ? darkMapStyles : lightMapStyles,
                    disableDefaultUI: false,
                    zoomControl: true,
                    mapTypeControl: false,
                    scaleControl: true,
                    streetViewControl: false,
                    rotateControl: false,
                    fullscreenControl: false,
                    backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff'
                }}
            >
                {vehicles.map((vehicle) => (
                    <Marker
                        key={vehicle.id}
                        position={{ lat: vehicle.location.latitude, lng: vehicle.location.longitude }}
                        icon={createIcon(vehicle.vehicleId === selectedVehicle ? '#ff6b6b' : '#ff9f43')}
                        onClick={() => {
                            setSelectedMarker(vehicle);
                            onVehicleSelect?.(vehicle.vehicleId);
                        }}
                    />
                ))}
                {selectedMarker && (
                    <InfoWindow
                        position={{ lat: selectedMarker.location.latitude, lng: selectedMarker.location.longitude }}
                        onCloseClick={() => setSelectedMarker(null)}
                        options={{
                            pixelOffset: new google.maps.Size(0, -30)
                        }}
                    >
                        <div style={{ 
                            padding: '16px',
                            borderRadius: '12px',
                            backgroundColor: isDarkMode ? 'rgba(28, 28, 45, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                            backdropFilter: 'blur(10px)',
                            color: isDarkMode ? '#ffffff' : '#000000',
                            minWidth: '250px'
                        }}>
                            <h3 style={{ 
                                fontSize: '16px', 
                                fontWeight: 'bold',
                                marginBottom: '12px',
                                color: '#ff9f43',
                                borderBottom: '2px solid rgba(255, 159, 67, 0.2)',
                                paddingBottom: '8px'
                            }}>
                                {selectedMarker.driverName || 'Neznámy vodič'}
                            </h3>
                            <p style={{ 
                                fontSize: '14px', 
                                marginBottom: '8px',
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                                ID vozidla: {selectedMarker.vehicleId}
                            </p>
                            <p style={{ 
                                fontSize: '14px', 
                                marginBottom: '8px',
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                                Presnosť: {Math.round(selectedMarker.location.accuracy)}m
                            </p>
                            <p style={{ 
                                fontSize: '14px', 
                                marginBottom: '8px',
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                                Posledná aktualizácia: {new Date(selectedMarker.location.timestamp).toLocaleString()}
                            </p>
                            <p style={{ 
                                fontSize: '14px',
                                color: isDarkMode ? 'rgba(255, 255, 255, 0.8)' : 'rgba(0, 0, 0, 0.8)'
                            }}>
                                Posledná aktivita: {new Date(selectedMarker.lastActive).toLocaleString()}
                            </p>
                        </div>
                    </InfoWindow>
                )}
            </GoogleMap>
        </MapWrapper>
    );
};

export default VehicleTracker; 