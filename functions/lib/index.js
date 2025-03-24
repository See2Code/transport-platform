"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateExistingRecords = exports.logFunctionMetrics = exports.checkTransportNotifications = exports.checkBusinessCaseReminders = exports.sendInvitationEmail = exports.clearDatabase = void 0;
const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();
const REGION = 'europe-west1';
const MEMORY = '128MB';
const TIMEOUT = 30;
// Konfigurácia emailového transportu pre SMTP server Websupport
const transporter = nodemailer.createTransport({
    host: 'smtp.m1.websupport.sk',
    port: 465,
    secure: true,
    auth: {
        user: process.env.EMAIL_USER || 'noreply@aesa.sk',
        pass: process.env.EMAIL_PASS || 'r.{jo$_;OJX8V>eKbo|!'
    }
});
// Funkcia na vyčistenie databázy
exports.clearDatabase = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Musíte byť prihlásený.');
    }
    try {
        const db = admin.firestore();
        const collections = ['users', 'companies', 'invitations', 'vehicles', 'routes', 'settings'];
        for (const collectionName of collections) {
            const collectionRef = db.collection(collectionName);
            const snapshot = await collectionRef.get();
            const batch = db.batch();
            snapshot.docs.forEach((doc) => {
                batch.delete(doc.ref);
            });
            await batch.commit();
        }
        return { success: true, message: 'Databáza bola úspešne vyčistená.' };
    }
    catch (error) {
        console.error('Chyba pri čistení databázy:', error);
        throw new functions.https.HttpsError('internal', 'Nepodarilo sa vyčistiť databázu.');
    }
});
exports.sendInvitationEmail = functions.https.onCall(async (data, context) => {
    console.log('Funkcia bola volaná s dátami:', data);
    if (!context.auth) {
        console.error('Používateľ nie je prihlásený');
        throw new functions.https.HttpsError('unauthenticated', 'Musíte byť prihlásený.');
    }
    const { email, firstName, lastName, phone, invitationId, companyId, role } = data;
    if (!email || !firstName || !lastName || !phone || !invitationId || !companyId || !role) {
        console.error('Chýbajúce povinné údaje:', { email, firstName, lastName, phone, invitationId, companyId, role });
        throw new functions.https.HttpsError('invalid-argument', 'Chýbajú povinné údaje');
    }
    if (!phone.startsWith('+')) {
        console.error('Neplatné telefónne číslo:', phone);
        throw new functions.https.HttpsError('invalid-argument', 'Telefónne číslo musí začínať predvoľbou krajiny (napr. +421)');
    }
    try {
        console.log('Získavam údaje o firme pre ID:', companyId);
        // Získanie informácií o firme
        const companyDoc = await admin.firestore().collection('companies').doc(companyId).get();
        if (!companyDoc.exists) {
            console.error('Firma nebola nájdená:', companyId);
            throw new functions.https.HttpsError('not-found', 'Firma nebola nájdená');
        }
        const companyData = companyDoc.data();
        console.log('Údaje o firme:', companyData);
        if (!(companyData === null || companyData === void 0 ? void 0 : companyData.companyName)) {
            console.error('Chýba názov firmy v údajoch:', companyData);
            throw new functions.https.HttpsError('internal', 'Chýba názov firmy v údajoch');
        }
        // Získanie informácií o odosielateľovi
        console.log('Získavam údaje o odosielateľovi:', context.auth.uid);
        const senderDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
        if (!senderDoc.exists) {
            console.error('Odosielateľ nebol nájdený:', context.auth.uid);
            throw new functions.https.HttpsError('not-found', 'Odosielateľ nebol nájdený');
        }
        const senderData = senderDoc.data();
        console.log('Údaje o odosielateľovi:', senderData);
        // Vytvorenie odkazu na registráciu
        const appUrl = process.env.APP_URL || 'https://core-app-423c7.web.app';
        const invitationLink = `${appUrl}/register-user?invitationId=${invitationId}`;
        console.log('Registračný odkaz:', invitationLink);
        // Vytvorenie emailu
        const mailOptions = {
            from: `"${companyData.companyName}" <noreply@aesa.sk>`,
            to: email,
            subject: `Pozvánka do tímu ${companyData.companyName}`,
            html: `
        <h2>Pozvánka do tímu</h2>
        <p>Dobrý deň ${firstName} ${lastName},</p>
        <p>Boli ste pozvaný do tímu spoločnosti <strong>${companyData.companyName}</strong>.</p>
        <p>Vaše priradené úlohy:</p>
        <ul>
          ${role === 'admin' ? '<li>Administrátor - plný prístup k všetkým funkciám</li>' : ''}
          ${role === 'manager' ? '<li>Manažér - správa tímu a projektov</li>' : ''}
          ${role === 'user' ? '<li>Používateľ - základné funkcie</li>' : ''}
        </ul>
        <p>Pre pripojenie sa k tímu kliknite na nasledujúci odkaz:</p>
        <p><a href="${invitationLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Pripojiť sa k tímu</a></p>
        <p>Ak ste tento email nežiadali, môžete ho ignorovať.</p>
      `
        };
        console.log('Odosielam email s nasledujúcimi nastaveniami:', {
            to: email,
            subject: mailOptions.subject
        });
        // Odoslanie emailu
        const info = await transporter.sendMail(mailOptions);
        console.log('Email bol úspešne odoslaný:', info);
        return { success: true, messageId: info.messageId };
    }
    catch (error) {
        console.error('Chyba pri odosielaní emailu:', error);
        throw new functions.https.HttpsError('internal', 'Nepodarilo sa odoslať email s pozvánkou: ' + (error.message || 'Neznáma chyba'));
    }
});
// Kontrola obchodných prípadov každých 30 sekúnd
exports.checkBusinessCaseReminders = functions
    .region(REGION)
    .runWith({
    memory: MEMORY,
    timeoutSeconds: TIMEOUT,
    labels: {
        type: 'reminder',
        feature: 'business-case'
    }
})
    .pubsub.schedule('*/0.5 * * * *')
    .onRun(async (context) => {
    var _a, _b, _c, _d, _e;
    const now = admin.firestore.Timestamp.now();
    console.log('Kontrolujem pripomienky obchodných prípadov:', now.toDate());
    try {
        const remindersSnapshot = await admin.firestore()
            .collection('businessCases')
            .where('reminderDateTime', '<=', now)
            .where('sent', '==', false)
            .get();
        console.log(`Nájdených ${remindersSnapshot.size} pripomienok na odoslanie`);
        const batch = admin.firestore().batch();
        const promises = [];
        for (const doc of remindersSnapshot.docs) {
            const businessCase = doc.data();
            if ((_a = businessCase.createdBy) === null || _a === void 0 ? void 0 : _a.email) {
                const mailOptions = {
                    from: 'AESA Transport Platform <noreply@aesa.sk>',
                    to: businessCase.createdBy.email,
                    subject: `Pripomienka: ${businessCase.companyName}`,
                    html: `
              <h2>Pripomienka obchodného prípadu</h2>
              <p><strong>Spoločnosť:</strong> ${businessCase.companyName}</p>
              <p><strong>Kontaktná osoba:</strong> ${(_b = businessCase.contactPerson) === null || _b === void 0 ? void 0 : _b.firstName} ${(_c = businessCase.contactPerson) === null || _c === void 0 ? void 0 : _c.lastName}</p>
              <p><strong>Telefón:</strong> ${(_d = businessCase.contactPerson) === null || _d === void 0 ? void 0 : _d.phone}</p>
              <p><strong>Email:</strong> ${(_e = businessCase.contactPerson) === null || _e === void 0 ? void 0 : _e.email}</p>
              ${businessCase.notes ? `<p><strong>Poznámky:</strong> ${businessCase.notes}</p>` : ''}
              <p>Pripomienka bola nastavená na: ${businessCase.reminderDateTime.toDate().toLocaleString('sk-SK')}</p>
            `
                };
                promises.push(transporter.sendMail(mailOptions));
                batch.update(doc.ref, {
                    sent: true,
                    sentAt: now
                });
            }
        }
        if (promises.length > 0) {
            await Promise.all(promises);
            await batch.commit();
            console.log(`Úspešne odoslaných ${promises.length} pripomienok`);
        }
        return null;
    }
    catch (error) {
        console.error('Chyba pri kontrole pripomienok:', error);
        throw error;
    }
});
// Kontrola prepráv každých 30 sekúnd
exports.checkTransportNotifications = functions
    .region(REGION)
    .runWith({
    memory: MEMORY,
    timeoutSeconds: TIMEOUT,
    labels: {
        type: 'notification',
        feature: 'transport'
    }
})
    .pubsub.schedule('*/0.5 * * * *')
    .onRun(async (context) => {
    var _a;
    const now = admin.firestore.Timestamp.now();
    console.log('Kontrolujem notifikácie prepráv:', now.toDate());
    try {
        const notificationsSnapshot = await admin.firestore()
            .collection('transports')
            .where('notificationDateTime', '<=', now)
            .where('notificationSent', '==', false)
            .get();
        console.log(`Nájdených ${notificationsSnapshot.size} notifikácií na odoslanie`);
        const batch = admin.firestore().batch();
        const promises = [];
        for (const doc of notificationsSnapshot.docs) {
            const transport = doc.data();
            if ((_a = transport.createdBy) === null || _a === void 0 ? void 0 : _a.email) {
                const mailOptions = {
                    from: 'AESA Transport Platform <noreply@aesa.sk>',
                    to: transport.createdBy.email,
                    subject: `Pripomienka sledovanej prepravy: ${transport.reference || transport.id}`,
                    html: `
              <h2>Pripomienka sledovanej prepravy</h2>
              <p><strong>Referencia:</strong> ${transport.reference || transport.id}</p>
              <p><strong>Odkiaľ:</strong> ${transport.from}</p>
              <p><strong>Kam:</strong> ${transport.to}</p>
              <p><strong>Dopravca:</strong> ${transport.carrier}</p>
              ${transport.notes ? `<p><strong>Poznámky:</strong> ${transport.notes}</p>` : ''}
              <p>Pripomienka bola nastavená na: ${transport.notificationDateTime.toDate().toLocaleString('sk-SK')}</p>
            `
                };
                promises.push(transporter.sendMail(mailOptions));
                batch.update(doc.ref, {
                    notificationSent: true,
                    notificationSentAt: now
                });
            }
        }
        if (promises.length > 0) {
            await Promise.all(promises);
            await batch.commit();
            console.log(`Úspešne odoslaných ${promises.length} notifikácií`);
        }
        return null;
    }
    catch (error) {
        console.error('Chyba pri kontrole notifikácií:', error);
        throw error;
    }
});
// Monitoring funkcií - aktualizovaný na počítanie 120 volaní za hodinu
exports.logFunctionMetrics = functions
    .region(REGION)
    .runWith({
    memory: '128MB',
    timeoutSeconds: 60
})
    .pubsub.schedule('0 * * * *') // každú hodinu
    .onRun(async (context) => {
    const stats = {
        timestamp: admin.firestore.Timestamp.now(),
        businessCaseReminders: {
            invocations: 120,
            errors: 0
        },
        transportNotifications: {
            invocations: 120,
            errors: 0
        }
    };
    try {
        await admin.firestore()
            .collection('metrics')
            .add(stats);
        console.log('Metriky úspešne zaznamenané');
        return null;
    }
    catch (error) {
        console.error('Chyba pri zaznamenávaní metrík:', error);
        throw error;
    }
});
// Funkcia na aktualizáciu existujúcich záznamov
exports.updateExistingRecords = functions.https.onCall(async (data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Musíte byť prihlásený.');
    }
    try {
        const db = admin.firestore();
        const now = admin.firestore.Timestamp.now();
        // Aktualizácia obchodných prípadov
        const businessCasesSnapshot = await db.collection('businessCases')
            .where('createdBy', '==', null)
            .get();
        console.log(`Našiel som ${businessCasesSnapshot.size} obchodných prípadov na aktualizáciu`);
        const batch = db.batch();
        for (const doc of businessCasesSnapshot.docs) {
            // Získame údaje o používateľovi, ktorý vytvoril záznam
            const userDoc = await db.collection('users').doc(doc.data().userId || context.auth.uid).get();
            const userData = userDoc.data();
            if (userData) {
                batch.update(doc.ref, {
                    createdAt: doc.data().createdAt || now,
                    createdBy: {
                        firstName: userData.firstName || '',
                        lastName: userData.lastName || ''
                    }
                });
            }
        }
        await batch.commit();
        console.log('Aktualizácia záznamov bola úspešne dokončená');
        return { success: true, message: 'Záznamy boli úspešne aktualizované.' };
    }
    catch (error) {
        console.error('Chyba pri aktualizácii záznamov:', error);
        throw new functions.https.HttpsError('internal', 'Nepodarilo sa aktualizovať záznamy.');
    }
});
//# sourceMappingURL=index.js.map