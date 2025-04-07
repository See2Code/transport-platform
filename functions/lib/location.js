"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDriverLocation = exports.updateDriverLocation = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
exports.updateDriverLocation = (0, https_1.onCall)({ region: 'europe-west1' }, async (request) => {
    // Kontrola autentifikácie
    if (!request.auth) {
        throw new Error('Používateľ nie je prihlásený');
    }
    const data = request.data;
    const userId = request.auth.uid;
    // Kontrola vstupných dát
    if (!data.latitude || !data.longitude) {
        throw new Error('Chýbajúce súradnice');
    }
    try {
        // Získanie údajov o používateľovi
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();
        if (!userData) {
            throw new Error('Používateľ nebol nájdený');
        }
        // Aktualizácia polohy vozidla
        await admin.firestore().collection('vehicleLocations').doc(userId).set({
            latitude: data.latitude,
            longitude: data.longitude,
            driverName: `${userData.firstName} ${userData.lastName}`,
            companyID: userData.companyID,
            lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        }, { merge: true });
        return { success: true };
    }
    catch (error) {
        console.error('Error updating driver location:', error);
        throw new Error('Chyba pri aktualizácii polohy');
    }
});
exports.getDriverLocation = (0, https_1.onCall)({ region: 'europe-west1' }, async (request) => {
    // Kontrola autentifikácie
    if (!request.auth) {
        throw new Error('Používateľ nie je prihlásený');
    }
    const data = request.data;
    try {
        const locationDoc = await admin.firestore().collection('vehicleLocations').doc(data.userId).get();
        const locationData = locationDoc.data();
        if (!locationData) {
            throw new Error('Poloha nebola nájdená');
        }
        return locationData;
    }
    catch (error) {
        console.error('Error getting driver location:', error);
        throw new Error('Chyba pri získavaní polohy');
    }
});
//# sourceMappingURL=location.js.map