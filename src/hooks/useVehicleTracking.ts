import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase';

export interface Vehicle {
    id: string;
    driverName: string;
    location: {
        latitude: number;
        longitude: number;
        accuracy: number;
        timestamp: number;
    };
    lastActive: number;
}

export const useVehicleTracking = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const driversRef = ref(database, 'drivers');
        
        const unsubscribe = onValue(driversRef, 
            (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const vehiclesList = Object.entries(data)
                        .filter(([_, driver]: [string, any]) => driver.location) // Filtrujeme len vodičov s polohou
                        .map(([id, driver]: [string, any]) => ({
                            id,
                            driverName: driver.location.driverName,
                            location: {
                                latitude: driver.location.latitude,
                                longitude: driver.location.longitude,
                                accuracy: driver.location.accuracy,
                                timestamp: driver.location.timestamp
                            },
                            lastActive: driver.lastActive
                        }));
                    setVehicles(vehiclesList);
                } else {
                    setVehicles([]);
                }
                setLoading(false);
            },
            (error) => {
                console.error('Chyba pri načítaní vodičov:', error);
                setError(error.message);
                setLoading(false);
            }
        );

        return () => {
            off(driversRef);
        };
    }, []);

    return { vehicles, loading, error };
}; 