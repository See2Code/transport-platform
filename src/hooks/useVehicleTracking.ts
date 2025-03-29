import { useState, useEffect } from 'react';
import { ref, onValue, off, get, getDatabase } from 'firebase/database';
import { database } from '../firebase';

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
}

interface FirebaseError extends Error {
    code?: string;
}

export const useVehicleTracking = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        console.log('Debug - Starting vehicle tracking...');
        
        // Explicitne nastavenie URL pre Realtime Database
        const db = getDatabase();
        console.log('Debug - Database instance:', db);
        console.log('Debug - Database URL:', db.app.options.databaseURL);
        
        const driversRef = ref(db, 'drivers');
        console.log('Debug - Drivers reference:', driversRef);

        // Najprv načítame aktuálne dáta
        get(driversRef).then((snapshot) => {
            console.log('Debug - Initial data snapshot exists:', snapshot.exists());
            console.log('Debug - Initial data snapshot key:', snapshot.key);
            console.log('Debug - Initial data:', snapshot.val());
            
            if (!snapshot.exists()) {
                console.log('Debug - No data exists at path');
                return;
            }
            
            const data = snapshot.val();
            console.log('Debug - Raw data structure:', JSON.stringify(data, null, 2));
        }).catch((error: FirebaseError) => {
            console.error('Debug - Error getting initial data:', error);
            console.error('Debug - Error details:', {
                code: error.code,
                message: error.message,
                stack: error.stack
            });
        });
        
        const unsubscribe = onValue(driversRef, 
            (snapshot) => {
                console.log('Debug - Received data snapshot exists:', snapshot.exists());
                console.log('Debug - Received data:', snapshot.val());
                const data = snapshot.val();
                if (data) {
                    try {
                        const vehiclesList = Object.entries(data)
                            .filter(([_, driver]: [string, any]) => {
                                const hasLocation = driver && driver.location;
                                console.log('Debug - Driver has location:', hasLocation);
                                return hasLocation;
                            })
                            .map(([id, driver]: [string, any]) => {
                                console.log('Debug - Processing driver:', id, driver);
                                return {
                                    id,
                                    vehicleId: id,
                                    driverName: driver.location.driverName,
                                    location: {
                                        latitude: driver.location.latitude,
                                        longitude: driver.location.longitude,
                                        accuracy: driver.location.accuracy,
                                        timestamp: driver.location.timestamp
                                    },
                                    lastActive: driver.lastActive
                                };
                            });
                        console.log('Debug - Processed vehicles:', vehiclesList);
                        setVehicles(vehiclesList);
                    } catch (error) {
                        const errorMessage = error instanceof Error ? error.message : 'Neznáma chyba';
                        console.error('Debug - Error processing data:', error);
                        setError('Chyba pri spracovaní dát: ' + errorMessage);
                    }
                } else {
                    console.log('Debug - No data received');
                    setVehicles([]);
                }
                setLoading(false);
            },
            (error: FirebaseError) => {
                console.error('Debug - Error loading drivers:', error);
                console.error('Debug - Error details:', {
                    code: error.code,
                    message: error.message,
                    stack: error.stack
                });
                setError(error.message);
                setLoading(false);
            }
        );

        return () => {
            console.log('Debug - Cleaning up vehicle tracking');
            off(driversRef);
        };
    }, []);

    return { vehicles, loading, error };
}; 