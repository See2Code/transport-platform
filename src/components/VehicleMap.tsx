import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import VehicleTracker from './VehicleTracker';
import { useVehicleTracking } from '../hooks/useVehicleTracking';

const VehicleMap: React.FC = () => {
    const { vehicles, loading, error } = useVehicleTracking();

    console.log('Debug - Vehicle data:', { vehicles, loading, error });

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
                <Typography variant="body2" color="error" sx={{ mt: 2 }}>
                    Debug info: {JSON.stringify(error)}
                </Typography>
            </Box>
        );
    }

    if (!vehicles || vehicles.length === 0) {
        return (
            <Box p={2}>
                <Typography variant="h6" gutterBottom>
                    Poloha vozidiel
                </Typography>
                <Typography color="textSecondary">
                    Momentálne nie sú žiadne aktívne vozidlá na sledovanie.
                </Typography>
                <Box mt={2} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
                    <Typography variant="body2" color="textSecondary">
                        Debug info - Firebase path: /drivers
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                        Vehicles data: {JSON.stringify(vehicles)}
                    </Typography>
                </Box>
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
            <Box mt={2} p={2} bgcolor="rgba(0,0,0,0.05)" borderRadius={1}>
                <Typography variant="body2" color="textSecondary">
                    Debug info - Loaded vehicles: {JSON.stringify(vehicles, null, 2)}
                </Typography>
            </Box>
        </Box>
    );
};

export default VehicleMap; 