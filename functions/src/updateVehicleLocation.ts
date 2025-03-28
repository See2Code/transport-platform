import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

interface VehicleLocation {
    id: string;
    driverName: string;
    position: {
        lat: number;
        lng: number;
    };
    lastUpdate: Date;
}

export const updateVehicleLocation = functions.https.onRequest(async (request, response) => {
    // Kontrola metódy
    if (request.method !== 'POST') {
        response.status(405).send('Method Not Allowed');
        return;
    }

    try {
        const { vehicleId, driverName, latitude, longitude } = request.body;

        // Validácia vstupných dát
        if (!vehicleId || !driverName || typeof latitude !== 'number' || typeof longitude !== 'number') {
            response.status(400).send('Invalid input data');
            return;
        }

        // Aktualizácia polohy vozidla v Realtime Database
        const vehicleRef = admin.database().ref(`vehicles/${vehicleId}`);
        await vehicleRef.set({
            id: vehicleId,
            driverName,
            position: {
                lat: latitude,
                lng: longitude
            },
            lastUpdate: new Date().toISOString()
        });

        response.status(200).send({ success: true });
    } catch (error) {
        console.error('Error updating vehicle location:', error);
        response.status(500).send('Internal Server Error');
    }
}); 