"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExistingRecords = exports.logFunctionMetrics = exports.checkTransportNotifications = exports.checkBusinessCaseReminders = exports.sendInvitationEmail = exports.clearDatabase = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();
const REGION = 'europe-west1';
// Konfigurácia emailového transportu
const transporter = nodemailer.createTransport({
    host: 'smtp.m1.websupport.sk',
    port: 465,
    secure: true,
    auth: {
        user: 'noreply@aesa.sk',
        pass: 'r.{jo$_;OJX8V>eKbo|!'
    }
});
// Funkcia na vyčistenie databázy
exports.clearDatabase = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    const db = admin.firestore();
    const batch = db.batch();
    try {
        const collections = ['users', 'contacts', 'businessCases', 'trackedTransports', 'invitations'];
        for (const collection of collections) {
            const snapshot = await db.collection(collection).get();
            snapshot.docs.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error('Chyba pri čistení databázy:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri čistení databázy');
    }
});
// Funkcia na odoslanie emailu
async function sendEmail(to, subject, html) {
    const mailOptions = {
        from: 'AESA Transport Platform <noreply@aesa.sk>',
        to,
        subject,
        html
    };
    try {
        await transporter.sendMail(mailOptions);
        console.log('Email odoslaný úspešne');
    }
    catch (error) {
        console.error('Chyba pri odosielaní emailu:', error);
        throw error;
    }
}
// Funkcia na odoslanie pozvánky
exports.sendInvitationEmail = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    try {
        const invitationRef = admin.firestore().collection('invitations').doc(data.invitationId);
        const invitationDoc = await invitationRef.get();
        if (!invitationDoc.exists) {
            // Vytvorenie novej pozvánky
            await invitationRef.set({
                email: data.email,
                firstName: data.firstName,
                lastName: data.lastName,
                phone: data.phone,
                companyID: data.companyId,
                role: data.role,
                status: 'pending',
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                createdBy: context.auth.uid
            });
        }
        else {
            // Aktualizácia existujúcej pozvánky
            await invitationRef.update({
                lastSentAt: admin.firestore.FieldValue.serverTimestamp(),
                status: 'pending'
            });
        }
        const invitationLink = `https://core-app-423c7.web.app/accept-invitation/${data.invitationId}`;
        const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              margin: 0;
              padding: 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f9f9f9;
            }
            .header {
              background-color: #00b894;
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background-color: white;
              padding: 30px;
              border-radius: 0 0 8px 8px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background-color: #00b894;
              color: white;
              text-decoration: none;
              border-radius: 4px;
              margin: 20px 0;
              font-weight: bold;
            }
            .footer {
              text-align: center;
              margin-top: 20px;
              color: #666;
              font-size: 12px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1 style="margin: 0;">AESA Transport Platform</h1>
            </div>
            <div class="content">
              <h2>Dobrý deň ${data.firstName},</h2>
              <p>Boli ste pozvaní do AESA Transport Platform - modernej platformy pre správu prepravy.</p>
              <p>Pre dokončenie registrácie a prístup do platformy kliknite na nasledujúce tlačidlo:</p>
              <div style="text-align: center;">
                <a href="${invitationLink}" class="button">Prijať pozvánku</a>
              </div>
              <p>Ak tlačidlo nefunguje, skopírujte a vložte tento odkaz do prehliadača:</p>
              <p style="word-break: break-all; color: #666;">${invitationLink}</p>
            </div>
            <div class="footer">
              <p>Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
              <p>&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
            </div>
          </div>
        </body>
        </html>
      `;
        await sendEmail(data.email, 'Pozvánka do AESA Transport Platform', emailHtml);
        return {
            success: true,
            headers: {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            }
        };
    }
    catch (error) {
        console.error('Chyba pri odosielaní pozvánky:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri odosielaní pozvánky');
    }
});
// Funkcia na kontrolu pripomienok pre obchodné prípady
exports.checkBusinessCaseReminders = functions
    .region(REGION)
    .pubsub.schedule('every 1 minutes')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    const now = new Date();
    const db = admin.firestore();
    try {
        const casesSnapshot = await db.collection('businessCases')
            .where('reminderDateTime', '<=', now)
            .where('reminderSent', '==', false)
            .get();
        for (const doc of casesSnapshot.docs) {
            const businessCase = doc.data();
            const userDoc = await db.collection('users').doc(businessCase.userId).get();
            const userData = userDoc.data();
            if (userData && userData.email) {
                const emailHtml = `
            <h2>Pripomienka pre obchodný prípad</h2>
            <p>Dobrý deň ${userData.firstName},</p>
            <p>Máte pripomienku pre obchodný prípad "${businessCase.title}".</p>
            <p>Dátum pripomienky: ${businessCase.reminderDateTime.toDate().toLocaleString('sk-SK')}</p>
            <p>Pre zobrazenie detailov kliknite na nasledujúci odkaz:</p>
            <a href="https://core-app-423c7.web.app/business-cases">Zobraziť obchodný prípad</a>
          `;
                await sendEmail(userData.email, 'Pripomienka pre obchodný prípad', emailHtml);
                await doc.ref.update({ reminderSent: true });
            }
        }
    }
    catch (error) {
        console.error('Chyba pri kontrole pripomienok:', error);
    }
});
// Funkcia na kontrolu notifikácií pre sledované prepravy
exports.checkTransportNotifications = functions
    .region(REGION)
    .pubsub.schedule('every 1 minutes')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    const now = new Date();
    const db = admin.firestore();
    try {
        const transportsSnapshot = await db.collection('trackedTransports')
            .where('notificationDateTime', '<=', now)
            .where('notificationSent', '==', false)
            .get();
        for (const doc of transportsSnapshot.docs) {
            const transport = doc.data();
            const userDoc = await db.collection('users').doc(transport.userId).get();
            const userData = userDoc.data();
            if (userData && userData.email) {
                const emailHtml = `
            <h2>Pripomienka pre sledovanú prepravu</h2>
            <p>Dobrý deň ${userData.firstName},</p>
            <p>Máte pripomienku pre sledovanú prepravu "${transport.title}".</p>
            <p>Dátum pripomienky: ${transport.notificationDateTime.toDate().toLocaleString('sk-SK')}</p>
            <p>Pre zobrazenie detailov kliknite na nasledujúci odkaz:</p>
            <a href="https://core-app-423c7.web.app/tracked-transports">Zobraziť sledovanú prepravu</a>
          `;
                await sendEmail(userData.email, 'Pripomienka pre sledovanú prepravu', emailHtml);
                await doc.ref.update({ notificationSent: true });
            }
        }
    }
    catch (error) {
        console.error('Chyba pri kontrole notifikácií:', error);
    }
});
// Funkcia na logovanie metrík
exports.logFunctionMetrics = functions
    .region(REGION)
    .pubsub.schedule('every 1 hours')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    const db = admin.firestore();
    const now = new Date();
    try {
        const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
        await metricsRef.set({
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            businessCaseReminders: 0,
            transportNotifications: 0
        }, { merge: true });
    }
    catch (error) {
        console.error('Chyba pri logovaní metrík:', error);
    }
});
// Funkcia na aktualizáciu existujúcich záznamov
exports.updateExistingRecords = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    const db = admin.firestore();
    const batch = db.batch();
    try {
        const usersSnapshot = await db.collection('users').get();
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            if (!userData.role) {
                batch.update(doc.ref, { role: 'user' });
            }
        }
        await batch.commit();
        return { success: true };
    }
    catch (error) {
        console.error('Chyba pri aktualizácii záznamov:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri aktualizácii záznamov');
    }
});
//# sourceMappingURL=index.js.map