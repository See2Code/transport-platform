"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateVehicleLocation = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
exports.updateVehicleLocation = (0, https_1.onRequest)(async (request, response) => {
    try {
        // Kontrola metódy
        if (request.method !== 'POST') {
            response.status(405).send('Method Not Allowed');
            return;
        }
        // Kontrola dát
        const { vehicleId, latitude, longitude, timestamp } = request.body;
        if (!vehicleId || !latitude || !longitude || !timestamp) {
            response.status(400).send('Missing required fields');
            return;
        }
        // Aktualizácia polohy v Realtime Database
        const db = admin.database();
        await db.ref(`drivers/${vehicleId}`).set({
            latitude,
            longitude,
            timestamp,
            lastUpdate: admin.database.ServerValue.TIMESTAMP
        });
        response.status(200).send('Location updated successfully');
    }
    catch (error) {
        console.error('Error updating vehicle location:', error);
        response.status(500).send('Internal Server Error');
    }
});
//# sourceMappingURL=updateVehicleLocation.js.map