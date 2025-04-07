import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

export const updateDriverLocation = functions.region('europe-west1').https.onCall(async (data, context) => {
    // Kontrola autentifikácie
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }

    const { latitude, longitude } = data;
    const userId = context.auth.uid;

    // Kontrola vstupných dát
    if (!latitude || !longitude) {
        throw new functions.https.HttpsError('invalid-argument', 'Chýbajúce súradnice');
    }

    try {
        // Získanie údajov o používateľovi
        const userDoc = await admin.firestore().collection('users').doc(userId).get();
        const userData = userDoc.data();

        if (!userData) {
            throw new functions.https.HttpsError('not-found', 'Používateľ nebol nájdený');
        }

        // Aktualizácia polohy vozidla
        await admin.firestore().collection('vehicleLocations').doc(userId).set({
            latitude,
            longitude,
            driverName: `${userData.firstName} ${userData.lastName}`,
            companyID: userData.companyID,
            lastUpdate: admin.firestore.FieldValue.serverTimestamp(),
            status: 'active'
        }, { merge: true });

        return { success: true };
    } catch (error) {
        console.error('Error updating driver location:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri aktualizácii polohy');
    }
});

export const getDriverLocation = functions.region('europe-west1').https.onCall(async (data, context) => {
    // Kontrola autentifikácie
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Používateľ nie je prihlásený');
    }

    const { userId } = data;

    try {
        const locationDoc = await admin.firestore().collection('vehicleLocations').doc(userId).get();
        const locationData = locationDoc.data();

        if (!locationData) {
            throw new functions.https.HttpsError('not-found', 'Poloha nebola nájdená');
        }

        return locationData;
    } catch (error) {
        console.error('Error getting driver location:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri získavaní polohy');
    }
}); 