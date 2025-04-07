import React, { useEffect, useState } from 'react';
import { GoogleMap, useJsApiLoader, Marker, InfoWindow, Libraries } from '@react-google-maps/api';
import { collection, onSnapshot, query, where } from 'firebase/firestore';
import { db } from '../firebase';
import { Box, Typography, Paper, Grid, List, ListItem, ListItemText, ListItemAvatar, Avatar, Divider, Chip } from '@mui/material';
import { DirectionsCar as CarIcon, AccessTime as TimeIcon } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';

interface VehicleLocation {
    id: string;
    latitude: number;
    longitude: number;
    driverName: string;
    companyID: string;
    lastUpdate: Date;
    status: string;
}

const mapContainerStyle = {
    width: '100%',
    height: '700px'
};

const defaultCenter = {
    lat: 48.669026, // Slovensko centrum
    lng: 19.699024
};

const libraries: Libraries = ['places'];

const VehicleMap: React.FC = () => {
    const [vehicles, setVehicles] = useState<VehicleLocation[]>([]);
    const [selectedVehicle, setSelectedVehicle] = useState<VehicleLocation | null>(null);
    const [map, setMap] = useState<google.maps.Map | null>(null);
    const { userData } = useAuth();

    const { isLoaded } = useJsApiLoader({
        googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
        libraries,
        id: 'script-loader'
    });

    useEffect(() => {
        if (!userData?.companyID) return;

        const q = query(
            collection(db, 'vehicleLocations'), 
            where('status', '==', 'active'),
            where('companyID', '==', userData.companyID)
        );
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            const vehicleData: VehicleLocation[] = [];
            snapshot.forEach((doc) => {
                const data = doc.data();
                vehicleData.push({
                    id: doc.id,
                    latitude: data.latitude,
                    longitude: data.longitude,
                    driverName: data.driverName,
                    companyID: data.companyID,
                    lastUpdate: data.lastUpdate.toDate(),
                    status: data.status
                });
            });
            setVehicles(vehicleData);
            
            if (selectedVehicle) {
                const updatedVehicle = vehicleData.find(v => v.id === selectedVehicle.id);
                if (updatedVehicle) {
                    setSelectedVehicle(updatedVehicle);
                }
            }
        });

        return () => unsubscribe();
    }, [userData?.companyID]);

    useEffect(() => {
        if (map && selectedVehicle) {
            const position = { lat: selectedVehicle.latitude, lng: selectedVehicle.longitude };
            map.panTo(position);
            map.setZoom(15);
        }
    }, [selectedVehicle, map]);

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
        if (diffMinutes < 60) return `Pred ${diffMinutes} min`;
        const hours = Math.floor(diffMinutes / 60);
        return `Pred ${hours} h`;
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
                                            onClick={() => {
                                                setSelectedVehicle(vehicle);
                                            }}
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
                            mapContainerStyle={mapContainerStyle}
                            center={defaultCenter}
                            zoom={7}
                            onLoad={map => setMap(map)}
                        >
                            {vehicles.map((vehicle) => (
                                <Marker
                                    key={vehicle.id}
                                    position={{ lat: vehicle.latitude, lng: vehicle.longitude }}
                                    onClick={() => setSelectedVehicle(vehicle)}
                                    icon={{
                                        url: '/vehicle-marker.svg',
                                        scaledSize: new window.google.maps.Size(40, 40)
                                    }}
                                />
                            ))}

                            {selectedVehicle && (
                                <InfoWindow
                                    position={{ lat: selectedVehicle.latitude, lng: selectedVehicle.longitude }}
                                    onCloseClick={() => setSelectedVehicle(null)}
                                >
                                    <Box sx={{ p: 1, minWidth: '200px' }}>
                                        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                            <CarIcon fontSize="small" />
                                            {selectedVehicle.driverName}
                                        </Typography>
                                        <Divider sx={{ my: 1 }} />
                                        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                <TimeIcon fontSize="small" />
                                                Aktualizované: {formatTimeDiff(selectedVehicle.lastUpdate)}
                                            </Typography>
                                            <Typography variant="body2">
                                                Firma: {selectedVehicle.companyID}
                                            </Typography>
                                            <Typography variant="body2">
                                                Poloha: {selectedVehicle.latitude.toFixed(6)}, {selectedVehicle.longitude.toFixed(6)}
                                            </Typography>
                                            <Chip
                                                size="small"
                                                color={getStatusColor(selectedVehicle.lastUpdate)}
                                                label="Online"
                                                sx={{ alignSelf: 'flex-start', mt: 1 }}
                                            />
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