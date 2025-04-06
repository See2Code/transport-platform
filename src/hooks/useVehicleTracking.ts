import { useState, useEffect } from 'react';
import { collection, query, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';

export interface Vehicle {
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
    isOnline: boolean;
}

export const useVehicleTracking = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('🚗 useVehicleTracking: Začínam sledovať vozidlá');
        
        // Sledujeme zmeny v kolekcii vehicle-locations
        const vehiclesQuery = query(collection(db, 'vehicle-locations'));
        
        const unsubscribe = onSnapshot(vehiclesQuery, 
            (snapshot) => {
                try {
                    console.log('🚗 useVehicleTracking: Nové dáta z Firestore');
                    const vehiclesList = snapshot.docs.map(doc => {
                        const data = doc.data();
                        return {
                            id: doc.id,
                            vehicleId: data.vehicleId,
                            driverName: data.driverName,
                            location: {
                                latitude: data.location.latitude,
                                longitude: data.location.longitude,
                                accuracy: data.location.accuracy,
                                timestamp: data.location.timestamp
                            },
                            lastActive: data.lastActive,
                            isOnline: data.isOnline
                        } as Vehicle;
                    });
                    console.log('🚗 useVehicleTracking: Počet vozidiel:', vehiclesList.length);
                    setVehicles(vehiclesList);
                    setLoading(false);
                } catch (error) {
                    console.error('❌ useVehicleTracking: Chyba pri spracovaní dát:', error);
                    setError('Chyba pri spracovaní dát: ' + (error instanceof Error ? error.message : 'Neznáma chyba'));
                    setLoading(false);
                }
            },
            (error) => {
                console.error('❌ useVehicleTracking: Chyba pri sledovaní zmien:', error);
                setError('Chyba pri sledovaní zmien: ' + error.message);
                setLoading(false);
            }
        );

        return () => {
            console.log('🚗 useVehicleTracking: Zastavujem sledovanie vozidiel');
            unsubscribe();
        };
    }, []);

    return { vehicles, loading, error };
}; 