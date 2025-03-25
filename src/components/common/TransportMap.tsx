import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, DirectionsService, DirectionsRenderer, Libraries } from '@react-google-maps/api';
import { Box, CircularProgress, Typography } from '@mui/material';

interface TransportMapProps {
  origin: string;
  destination: string;
  isThumbnail?: boolean;
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

export default function TransportMap({ origin, destination, isThumbnail = false }: TransportMapProps) {
  const [directions, setDirections] = useState<google.maps.DirectionsResult | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      console.log('Directions callback:', { status, result });
      if (status === 'OK' && result) {
        setDirections(result);
        setError(null);
      } else {
        setError('Nepodarilo sa nájsť trasu');
      }
    },
    []
  );

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
        backgroundColor: 'rgba(35, 35, 66, 0.7)',
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
      backgroundColor: 'rgba(35, 35, 66, 0.7)',
      borderRadius: '12px'
    }}>
      <GoogleMap
        mapContainerStyle={mapContainerStyle}
        center={defaultCenter}
        zoom={isThumbnail ? 4 : 6}
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
          ],
          disableDefaultUI: isThumbnail,
          draggable: !isThumbnail,
          zoomControl: !isThumbnail,
          scrollwheel: !isThumbnail,
          disableDoubleClickZoom: isThumbnail
        }}
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
                strokeWeight: isThumbnail ? 3 : 4
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