import { useState, useEffect, useRef } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { Vehicle } from '../types/vehicle';
import debounce from 'lodash/debounce';

const LOCATION_UPDATE_INTERVAL = 30000; // 30 sekúnd
const LOCATION_ACCURACY_THRESHOLD = 50; // 50 metrov
const MINIMUM_DISTANCE_CHANGE = 10; // 10 metrov

export const useVehicleTracking = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const previousLocations = useRef<{ [key: string]: { lat: number; lng: number } }>({});

    // Funkcia na výpočet vzdialenosti medzi dvoma bodmi (Haversine formula)
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371e3; // polomer Zeme v metroch
        const φ1 = lat1 * Math.PI/180;
        const φ2 = lat2 * Math.PI/180;
        const Δφ = (lat2-lat1) * Math.PI/180;
        const Δλ = (lon2-lon1) * Math.PI/180;

        const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
                Math.cos(φ1) * Math.cos(φ2) *
                Math.sin(Δλ/2) * Math.sin(Δλ/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

        return R * c;
    };

    // Debounced funkcia pre aktualizáciu vozidiel
    const debouncedUpdateVehicles = useRef(
        debounce((newVehicles: Vehicle[]) => {
            setVehicles(newVehicles);
        }, 1000)
    ).current;

    useEffect(() => {
        console.log('🚗 useVehicleTracking: Začínam sledovať vozidlá v reálnom čase');
        
        const vehiclesRef = ref(database, 'vehicle-locations');
        
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

                    const vehiclesList = Object.entries(data)
                        .map(([id, data]: [string, any]) => {
                            // Kontrola presnosti GPS
                            if (data.location.accuracy > LOCATION_ACCURACY_THRESHOLD) {
                                console.log(`⚠️ Nízka presnosť GPS pre vozidlo ${id}: ${data.location.accuracy}m`);
                                return null;
                            }

                            // Kontrola významnej zmeny polohy
                            const prevLocation = previousLocations.current[id];
                            if (prevLocation) {
                                const distance = calculateDistance(
                                    prevLocation.lat,
                                    prevLocation.lng,
                                    data.location.latitude,
                                    data.location.longitude
                                );

                                if (distance < MINIMUM_DISTANCE_CHANGE) {
                                    console.log(`ℹ️ Zanedbateľná zmena polohy pre vozidlo ${id}: ${distance.toFixed(2)}m`);
                                    return null;
                                }
                            }

                            // Aktualizácia predchádzajúcej polohy
                            previousLocations.current[id] = {
                                lat: data.location.latitude,
                                lng: data.location.longitude
                            };

                            return {
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
                            } as Vehicle;
                        })
                        .filter((vehicle): vehicle is Vehicle => 
                            vehicle !== null && 
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
                    debouncedUpdateVehicles(latestVehicles);
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
            debouncedUpdateVehicles.cancel();
            unsubscribe();
        };
    }, [debouncedUpdateVehicles]);

    return { vehicles, loading, error };
}; 