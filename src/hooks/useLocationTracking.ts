import { useState, useEffect, useRef } from 'react';
import { ref, set } from 'firebase/database';
import { database } from '../firebase';
import { debounce } from 'lodash';

const MIN_DISTANCE_CHANGE = 50; // minimálna zmena v metroch
const MIN_TIME_BETWEEN_UPDATES = 60000; // minimálny čas medzi aktualizáciami (1 minúta)
const MIN_ACCURACY = 100; // minimálna požadovaná presnosť v metroch
const DEBOUNCE_INTERVAL = 10000; // 10 sekúnd medzi kontrolami polohy

export const useLocationTracking = (vehicleId: string, driverName: string, licensePlate: string) => {
    const [error, setError] = useState<string | null>(null);
    const lastPosition = useRef<{ lat: number; lng: number } | null>(null);
    const lastUpdateTime = useRef<number>(0);

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

    const debouncedUpdateLocation = useRef(
        debounce(async (position: GeolocationPosition) => {
            const now = Date.now();
            const timeSinceLastUpdate = now - lastUpdateTime.current;
            
            // Kontrola minimálneho času medzi aktualizáciami
            if (timeSinceLastUpdate < MIN_TIME_BETWEEN_UPDATES) {
                console.log('⏱️ Príliš skorá aktualizácia, preskakujem');
                return;
            }

            // Kontrola presnosti
            if (position.coords.accuracy > MIN_ACCURACY) {
                console.log(`📍 Nedostatočná presnosť: ${position.coords.accuracy}m`);
                return;
            }

            // Kontrola minimálnej vzdialenosti
            if (lastPosition.current) {
                const distance = calculateDistance(
                    lastPosition.current.lat,
                    lastPosition.current.lng,
                    position.coords.latitude,
                    position.coords.longitude
                );

                if (distance < MIN_DISTANCE_CHANGE) {
                    console.log(`📍 Príliš malá zmena polohy: ${distance.toFixed(0)}m`);
                    return;
                }
            }

            try {
                const locationRef = ref(database, `vehicleLocations/${vehicleId}`);
                await set(locationRef, {
                    driverName,
                    licensePlate,
                    companyID: 'AESA-9614-0263',
                    location: {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy,
                        heading: position.coords.heading,
                        speed: position.coords.speed,
                        timestamp: position.timestamp
                    },
                    lastUpdate: new Date().toISOString(),
                    status: 'active'
                });

                lastPosition.current = {
                    lat: position.coords.latitude,
                    lng: position.coords.longitude
                };
                lastUpdateTime.current = now;
                
                console.log('📍 Poloha úspešne aktualizovaná');
            } catch (error) {
                console.error('❌ Chyba pri aktualizácii polohy:', error);
                setError('Chyba pri aktualizácii polohy');
            }
        }, DEBOUNCE_INTERVAL)
    ).current;

    useEffect(() => {
        console.log('🚗 Začínam sledovanie polohy');
        
        const watchId = navigator.geolocation.watchPosition(
            (position) => {
                debouncedUpdateLocation(position);
            },
            (error) => {
                console.error('❌ Chyba pri sledovaní polohy:', error);
                setError('Chyba pri sledovaní polohy');
            },
            {
                enableHighAccuracy: true,
                timeout: 5000,
                maximumAge: 30000, // Akceptujeme polohu starú maximálne 30 sekúnd
            }
        );

        return () => {
            console.log('🚗 Končím sledovanie polohy');
            navigator.geolocation.clearWatch(watchId);
            debouncedUpdateLocation.cancel();
        };
    }, [debouncedUpdateLocation]);

    return { error };
}; 