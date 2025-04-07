import { useState, useEffect } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { Vehicle } from '../types/vehicle';

export const useVehicleTracking = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('🚗 useVehicleTracking: Začínam sledovať vozidlá v reálnom čase');
        
        // Referencia na vozidlá v Realtime Database
        const vehiclesRef = ref(database, 'vehicle-locations');
        
        // Sledujeme zmeny v reálnom čase
        const unsubscribe = onValue(vehiclesRef, 
            (snapshot) => {
                try {
                    console.log('🚗 useVehicleTracking: Nové dáta z Realtime DB');
                    const data = snapshot.val();
                    
                    if (!data) {
                        setVehicles([]);
                        setLoading(false);
                        return;
                    }

                    // Konvertujeme objekt na pole a filtrujeme neaktívne vozidlá
                    const vehiclesList = Object.entries(data)
                        .map(([id, data]: [string, any]) => ({
                            id,
                            vehicleId: data.vehicleId,
                            driverName: data.driverName,
                            location: {
                                latitude: data.location.latitude,
                                longitude: data.location.longitude,
                                accuracy: data.location.accuracy,
                                timestamp: data.location.timestamp,
                                heading: data.location.heading,
                                speed: data.location.speed
                            },
                            lastActive: data.lastActive,
                            isOnline: data.isOnline,
                            type: data.type,
                            licensePlate: data.licensePlate,
                            dimensions: data.dimensions,
                            maxLoad: data.maxLoad
                        } as Vehicle))
                        .filter(vehicle => 
                            // Filtrujeme len aktívne vozidlá (aktívne za posledných 5 minút)
                            vehicle.lastActive > Date.now() - 5 * 60 * 1000
                        );

                    // Filtrujeme len najnovšie záznamy pre každého vodiča
                    const latestVehicles = vehiclesList.reduce((acc, vehicle) => {
                        const existingVehicle = acc.find(v => v.driverName === vehicle.driverName);
                        if (!existingVehicle || existingVehicle.location.timestamp < vehicle.location.timestamp) {
                            return [...acc.filter(v => v.driverName !== vehicle.driverName), vehicle];
                        }
                        return acc;
                    }, [] as Vehicle[]);

                    console.log('🚗 useVehicleTracking: Počet aktívnych vozidiel:', latestVehicles.length);
                    setVehicles(latestVehicles);
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