import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Libraries } from '@react-google-maps/api';
import { Box, CircularProgress } from '@mui/material';

interface TransportMapProps {
  origin: string;
  destination: string;
}

const containerStyle = {
  width: '100%',
  height: '400px',
  borderRadius: '12px',
  overflow: 'hidden'
};

const defaultCenter = {
  lat: 48.1486,  // Bratislava
  lng: 17.1077
};

const libraries: Libraries = ['places'];

export default function TransportMap({ origin, destination }: TransportMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded, loadError } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
    libraries
  });

  const directionsCallback = useCallback(
    (result: google.maps.DirectionsResult | null, status: google.maps.DirectionsStatus) => {
      if (status === 'OK' && result) {
        setDirections(result);
      } else {
        setError('Nepodarilo sa nájsť trasu');
      }
    },
    []
  );

  if (loadError) {
    return (
      <Box sx={{
        position: 'relative',
        width: '100%',
        height: '400px',
        backgroundColor: 'rgba(35, 35, 66, 0.7)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#ff6b6b'
      }}>
        Chyba pri načítaní mapy
      </Box>
    );
  }

  if (!isLoaded) {
    return (
      <Box sx={{
        position: 'relative',
        width: '100%',
        height: '400px',
        backgroundColor: 'rgba(35, 35, 66, 0.7)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}>
        <CircularProgress sx={{ color: '#ff9f43' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative',
      width: '100%',
      height: '400px',
      backgroundColor: 'rgba(35, 35, 66, 0.7)',
      borderRadius: '12px',
      overflow: 'hidden',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.37)'
    }}>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={defaultCenter}
        zoom={6}
        options={{
          styles: [
            {
              elementType: 'geometry',
              stylers: [{ color: '#242f3e' }]
            },
            {
              elementType: 'labels.text.stroke',
              stylers: [{ color: '#242f3e' }]
            },
            {
              elementType: 'labels.text.fill',
              stylers: [{ color: '#746855' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry',
              stylers: [{ color: '#38414e' }]
            },
            {
              featureType: 'road',
              elementType: 'geometry.stroke',
              stylers: [{ color: '#212a37' }]
            },
            {
              featureType: 'road',
              elementType: 'labels.text.fill',
              stylers: [{ color: '#9ca5b3' }]
            }
          ]
        }}
      >
        {origin && destination && (
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
                strokeWeight: 4
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
          color: '#ff6b6b',
          textAlign: 'center',
          padding: '16px',
          backgroundColor: 'rgba(35, 35, 66, 0.9)',
          borderRadius: '8px'
        }}>
          {error}
        </Box>
      )}
    </Box>
  );
} 