import React, { useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import VehicleTracker from './VehicleTracker';
import { useVehicleTracking } from '../hooks/useVehicleTracking';

const TrackedDeliveries: React.FC = () => {
    const { vehicles, loading, error } = useVehicleTracking();
    const [selectedVehicle, setSelectedVehicle] = useState<string | null>(null);
    const [showInfoWindow, setShowInfoWindow] = useState<string | null>(null);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box p={2}>
                <Alert severity="error">
                    Chyba pri načítaní vozidiel: {error}
                </Alert>
            </Box>
        );
    }

    if (vehicles.length === 0) {
        return (
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Sledované prepravy
                </Typography>
                <Typography color="textSecondary">
                    Momentálne nie sú žiadne aktívne prepravy na sledovanie.
                </Typography>
            </Box>
        );
    }

    return (
        <Box p={2}>
            <Typography variant="h6" gutterBottom>
                Sledované prepravy
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Aktívne vozidlá: {vehicles.length}
            </Typography>
            <Box mt={2}>
                <VehicleTracker 
                    vehicles={vehicles}
                    selectedVehicle={selectedVehicle}
                    hiddenVehicles={[]}
                    onMarkerClick={(vehicleId) => {
                        setSelectedVehicle(vehicleId);
                        setShowInfoWindow(vehicleId);
                    }}
                    showInfoWindow={showInfoWindow}
                    onInfoWindowClose={() => setShowInfoWindow(null)}
                />
            </Box>
        </Box>
    );
};

export default TrackedDeliveries; 