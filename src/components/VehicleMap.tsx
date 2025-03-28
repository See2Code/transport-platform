import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import VehicleTracker from './VehicleTracker';
import { useVehicleTracking } from '../hooks/useVehicleTracking';

const VehicleMap: React.FC = () => {
    const { vehicles, loading, error } = useVehicleTracking();

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
                    Poloha vozidiel
                </Typography>
                <Typography color="textSecondary">
                    Momentálne nie sú žiadne aktívne vozidlá na sledovanie.
                </Typography>
            </Box>
        );
    }

    return (
        <Box p={2}>
            <Typography variant="h6" gutterBottom>
                Poloha vozidiel
            </Typography>
            <Typography variant="body2" color="textSecondary" gutterBottom>
                Aktívne vozidlá: {vehicles.length}
            </Typography>
            <Box mt={2}>
                <VehicleTracker vehicles={vehicles} />
            </Box>
        </Box>
    );
};

export default VehicleMap; 