import { useState, useEffect } from 'react';
import { ref, onValue, off } from 'firebase/database';
import { database } from '../firebase';

export interface Vehicle {
    id: string;
    driverName: string;
    position: {
        lat: number;
        lng: number;
    };
    lastUpdate: Date;
}

export const useVehicleTracking = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const vehiclesRef = ref(database, 'vehicles');
        
        const unsubscribe = onValue(vehiclesRef, 
            (snapshot) => {
                const data = snapshot.val();
                if (data) {
                    const vehiclesList = Object.entries(data).map(([id, vehicle]: [string, any]) => ({
                        id,
                        driverName: vehicle.driverName,
                        position: vehicle.position,
                        lastUpdate: new Date(vehicle.lastUpdate)
                    }));
                    setVehicles(vehiclesList);
                } else {
                    setVehicles([]);
                }
                setLoading(false);
            },
            (error) => {
                setError(error.message);
                setLoading(false);
            }
        );

        return () => {
            off(vehiclesRef);
        };
    }, []);

    return { vehicles, loading, error };
}; 