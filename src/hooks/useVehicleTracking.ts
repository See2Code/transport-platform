import { useState, useEffect, useRef, useMemo } from 'react';
import { ref, onValue } from 'firebase/database';
import { database } from '../firebase';
import { Vehicle } from '../types/vehicle';
import { debounce } from 'lodash';

const LOCATION_UPDATE_INTERVAL = 60000; // Zvýšené na 60 sekúnd
const LOCATION_ACCURACY_THRESHOLD = 100; // Zvýšené na 100 metrov
const MINIMUM_DISTANCE_CHANGE = 50; // Zvýšené na 50 metrov
const MAX_UPDATE_FREQUENCY = 5 * 60 * 1000; // Maximálne 5 minút medzi aktualizáciami
const DEBOUNCE_DELAY = 2000; // 2 sekundy

export const useVehicleTracking = () => {
    const [vehicles, setVehicles] = useState<Vehicle[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const previousLocations = useRef<{ [key: string]: { lat: number; lng: number } }>({});
    const lastUpdateTime = useRef<{ [key: string]: number }>({});
    const lastData = useRef<any>(null);

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

    const debouncedUpdateVehicles = useMemo(
        () => debounce((newVehicles: Vehicle[]) => {
            setVehicles(newVehicles);
            setLoading(false);
        }, DEBOUNCE_DELAY),
        []
    );

    useEffect(() => {
        console.log('🚗 useVehicleTracking: Začínam sledovať vozidlá v reálnom čase');
        
        const vehiclesRef = ref(database, 'vehicle-locations');
        
        const unsubscribe = onValue(vehiclesRef, 
            (snapshot) => {
                try {
                    const data = snapshot.val();
                    
                    if (!data) {
                        setVehicles([]);
                        setLoading(false);
                        return;
                    }

                    // Kontrola či sa dáta skutočne zmenili
                    if (JSON.stringify(data) === JSON.stringify(lastData.current)) {
                        return;
                    }
                    lastData.current = data;

                    const vehiclesList = Object.entries(data)
                        .map(([id, data]: [string, any]) => {
                            const now = Date.now();
                            const lastUpdate = lastUpdateTime.current[id] || 0;
                            
                            if (now - lastUpdate < MAX_UPDATE_FREQUENCY) {
                                return null;
                            }

                            if (data.location.accuracy > LOCATION_ACCURACY_THRESHOLD) {
                                return null;
                            }

                            const prevLocation = previousLocations.current[id];
                            if (prevLocation) {
                                const distance = calculateDistance(
                                    prevLocation.lat,
                                    prevLocation.lng,
                                    data.location.latitude,
                                    data.location.longitude
                                );

                                if (distance < MINIMUM_DISTANCE_CHANGE) {
                                    return null;
                                }
                            }

                            lastUpdateTime.current[id] = now;
                            previousLocations.current[id] = {
                                lat: data.location.latitude,
                                lng: data.location.longitude
                            };

                            return {
                                id,
                                vehicleId: id,
                                licensePlate: data.licensePlate || 'Neznáme',
                                driverName: data.driverName || 'Neznámy vodič',
                                location: {
                                    lat: data.location.latitude,
                                    lng: data.location.longitude,
                                    latitude: data.location.latitude,
                                    longitude: data.location.longitude,
                                    accuracy: data.location.accuracy,
                                    heading: data.location.heading,
                                    speed: data.location.speed,
                                    timestamp: data.location.timestamp || Date.now()
                                },
                                lastUpdate: data.lastUpdate || new Date().toISOString(),
                                lastActive: Date.now(),
                                isOnline: true,
                                status: data.status || 'unknown'
                            } as Vehicle;
                        })
                        .filter((vehicle): vehicle is Vehicle => vehicle !== null);

                    debouncedUpdateVehicles(vehiclesList);
                } catch (error) {
                    console.error('❌ Chyba pri spracovaní dát:', error);
                    setError('Chyba pri načítaní dát o vozidlách');
                    setLoading(false);
                }
            },
            (error) => {
                console.error('❌ Chyba pri sledovaní vozidiel:', error);
                setError('Chyba pri sledovaní vozidiel');
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