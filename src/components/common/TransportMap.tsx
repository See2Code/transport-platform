import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Libraries } from '@react-google-maps/api';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useThemeMode } from '../../contexts/ThemeContext';

interface TransportMapProps {
  origin: string;
  destination: string;
  isThumbnail?: boolean;
  onDirectionsChange?: (directions: google.maps.DirectionsResult | null, distance?: string) => void;
}

const libraries: Libraries = ['places'];

const mapContainerStyle = {
  width: '100%',
  height: '100%',
  minHeight: '400px',
  borderRadius: '12px'
};

const defaultCenter = {
  lat: 48.1486,  // Bratislava
  lng: 17.1077
};

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

export default function TransportMap({ origin, destination, isThumbnail = false, onDirectionsChange }: TransportMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const { isDarkMode } = useThemeMode();

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries,
    version: "weekly"
  });

  useEffect(() => {
    console.log('TransportMap props:', { origin, destination, isThumbnail });
    console.log('Google Maps loading status:', { isLoaded, loadError });
    console.log('API Key:', process.env.REACT_APP_GOOGLE_MAPS_API_KEY);
  }, [origin, destination, isThumbnail, isLoaded, loadError]);

  const directionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (status === 'OK' && result) {
        setDirections(result);
        setError(null);
        
        // Vypočítame vzdialenosť
        let distance = "";
        if (result.routes[0]?.legs[0]?.distance?.text) {
          distance = result.routes[0].legs[0].distance.text;
        }
        
        // Voláme callback s výsledkom a vzdialenosťou
        if (onDirectionsChange) {
          onDirectionsChange(result, distance);
        }
        
        // Prispôsobenie mapy na zobrazenie celej trasy
        if (map && result.routes[0]?.bounds) {
          // Rozšírenie bounds pre lepšie zobrazenie markerov
          const bounds = new google.maps.LatLngBounds();
          const route = result.routes[0];
          
          // Pridanie bodov trasy do bounds
          if (route.bounds) {
            bounds.extend(route.bounds.getNorthEast());
            bounds.extend(route.bounds.getSouthWest());
          }
          
          // Pridanie počiatočného a koncového bodu
          if (route.legs[0]) {
            bounds.extend(route.legs[0].start_location);
            bounds.extend(route.legs[0].end_location);
          }
          
          // Aplikovanie väčšieho paddingu
          const padding = {
            top: 100,
            right: 100,
            bottom: 100,
            left: 100
          };
          
          map.fitBounds(bounds, padding);
        }
      } else {
        setError('Nepodarilo sa nájsť trasu');
        // Voláme callback s null
        if (onDirectionsChange) {
          onDirectionsChange(null);
        }
      }
    },
    [map, onDirectionsChange]
  );

  const onLoad = useCallback((map: google.maps.Map) => {
    setMap(map);
  }, []);

  const onUnmount = useCallback(() => {
    setMap(null);
  }, []);

  if (loadError) {
    return (
      <Box sx={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'rgba(35, 35, 66, 0.7)',
        color: '#ff6b6b',
        borderRadius: '12px',
        padding: 2
      }}>
        <Typography>Chyba pri načítaní mapy</Typography>
        <Typography variant="caption">{loadError.toString()}</Typography>
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.7)' : '#ffffff',
        borderRadius: '12px'
      }}>
        <CircularProgress sx={{ color: '#ff9f43' }} />
      </Box>
    );
  }

  return (
    <Box sx={{
      width: '100%',
      height: '100%',
      minHeight: '400px',
      position: 'relative',
      backgroundColor: isDarkMode ? 'rgba(35, 35, 66, 0.7)' : '#ffffff',
      borderRadius: '12px'
    }}>
      <GoogleMap
        mapContainerStyle={{
          ...mapContainerStyle,
          backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff'
        }}
        center={defaultCenter}
        zoom={isThumbnail ? 4 : 6}
        options={{
          styles: isDarkMode ? darkMapStyles : lightMapStyles,
          disableDefaultUI: isThumbnail,
          draggable: !isThumbnail,
          zoomControl: !isThumbnail,
          scrollwheel: !isThumbnail,
          disableDoubleClickZoom: isThumbnail,
          backgroundColor: isDarkMode ? '#1a1a2e' : '#ffffff'
        }}
        onLoad={onLoad}
        onUnmount={onUnmount}
      >
        {origin && destination && !directions && (
          <DirectionsService
            options={{
              origin,
              destination,
              travelMode: google.maps.TravelMode.DRIVING
            }}
            callback={directionsCallback}
          />
        )}
        {directions && (
          <DirectionsRenderer
            options={{
              directions,
              suppressMarkers: false,
              polylineOptions: {
                strokeColor: '#ff9f43',
                strokeWeight: isThumbnail ? 3 : 4,
                strokeOpacity: 0.8
              },
              markerOptions: {
                opacity: 1.0,
                zIndex: 100
              }
            }}
          />
        )}
      </GoogleMap>
      {error && (
        <Box sx={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'rgba(35, 35, 66, 0.9)',
          color: '#ff6b6b',
          padding: '16px',
          borderRadius: '8px',
          textAlign: 'center',
          zIndex: 1
        }}>
          <Typography>{error}</Typography>
        </Box>
      )}
    </Box>
  );
} 