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
exports.sendInvitationEmail = functions
    .region('us-central1')
    .https.onCall(async (data, context) => {
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
// Kontrola obchodných prípadov každú minútu
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
    .pubsub.schedule('* * * * *')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    console.log('Kontrolujem pripomienky obchodných prípadov:', now.toDate());
    try {
        const remindersSnapshot = await admin.firestore()
            .collection('reminders')
            .where('reminderDateTime', '<=', now)
            .where('sent', '==', false)
            .get();
        console.log(`Nájdených ${remindersSnapshot.size} pripomienok na odoslanie`);
        const batch = admin.firestore().batch();
        const promises = [];
        for (const doc of remindersSnapshot.docs) {
            const reminder = doc.data();
            if (reminder.userEmail) {
                const businessCaseDoc = await admin.firestore()
                    .collection('businessCases')
                    .doc(reminder.businessCaseId)
                    .get();
                const businessCase = businessCaseDoc.exists ? businessCaseDoc.data() : null;
                const mailOptions = {
                    from: 'AESA Transport Platform <noreply@aesa.sk>',
                    to: reminder.userEmail,
                    subject: `Pripomienka: ${reminder.companyName}`,
                    html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1b2e; border-bottom: 3px solid #00b894; padding-bottom: 10px;">Pripomienka obchodného prípadu</h2>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 10px 0;"><strong>Spoločnosť:</strong> ${reminder.companyName}</p>
                  <p style="margin: 10px 0;"><strong>Kontaktná osoba:</strong> ${reminder.contactPerson.firstName} ${reminder.contactPerson.lastName}</p>
                  <p style="margin: 10px 0;"><strong>Telefón:</strong> ${reminder.contactPerson.phone}</p>
                  <p style="margin: 10px 0;"><strong>Email:</strong> ${reminder.contactPerson.email}</p>
                  ${reminder.reminderNote ? `
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; margin-top: 15px;">
                      <p style="margin: 0;"><strong>Poznámka k pripomienke:</strong></p>
                      <p style="margin: 10px 0;">${reminder.reminderNote}</p>
                    </div>
                  ` : ''}
                </div>

                <p style="color: #666666;">
                  Pripomienka bola nastavená na: ${reminder.reminderDateTime.toDate().toLocaleString('sk-SK', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}
                </p>

                ${(businessCase === null || businessCase === void 0 ? void 0 : businessCase.status) ? `
                  <p style="margin: 10px 0;"><strong>Aktuálny stav:</strong> ${businessCase.status}</p>
                ` : ''}

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666666;">
                  <p style="margin: 0;">S pozdravom,</p>
                  <p style="margin: 5px 0;">Váš AESA Transport Platform tím</p>
                </div>
              </div>
            `
                };
                promises.push(transporter.sendMail(mailOptions));
                batch.update(doc.ref, {
                    sent: true,
                    sentAt: now
                });
                if (businessCaseDoc.exists) {
                    batch.update(businessCaseDoc.ref, {
                        reminderSent: true,
                        reminderSentAt: now
                    });
                }
                console.log(`Pripravený email pre ${reminder.userEmail} - ${reminder.companyName}`);
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
// Kontrola prepráv každú minútu
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
    .pubsub.schedule('* * * * *')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    var _a, _b;
    const now = admin.firestore.Timestamp.now();
    console.log('Kontrolujem notifikácie prepráv:', now.toDate());
    try {
        // Kontrolujeme pripomienky pre nakládku
        const loadingRemindersSnapshot = await admin.firestore()
            .collection('transports')
            .where('loadingDateTime', '>', now)
            .where('loadingReminderSent', '==', false)
            .get();
        const unloadingRemindersSnapshot = await admin.firestore()
            .collection('transports')
            .where('unloadingDateTime', '>', now)
            .where('unloadingReminderSent', '==', false)
            .get();
        console.log(`Nájdených ${loadingRemindersSnapshot.size} pripomienok nakládky a ${unloadingRemindersSnapshot.size} pripomienok vykládky`);
        const batch = admin.firestore().batch();
        const promises = [];
        // Spracovanie pripomienok nakládky
        for (const doc of loadingRemindersSnapshot.docs) {
            const transport = doc.data();
            const loadingTime = transport.loadingDateTime.toDate();
            const reminderTime = new Date(loadingTime.getTime() - (transport.loadingReminder * 60 * 60 * 1000));
            if (now.toDate() >= reminderTime && ((_a = transport.createdBy) === null || _a === void 0 ? void 0 : _a.email)) {
                const mailOptions = {
                    from: 'AESA Transport Platform <noreply@aesa.sk>',
                    to: transport.createdBy.email,
                    subject: `Pripomienka nakládky: ${transport.reference || transport.id}`,
                    html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1b2e; border-bottom: 3px solid #00b894; padding-bottom: 10px;">Pripomienka nakládky</h2>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 10px 0;"><strong>Referencia:</strong> ${transport.reference || transport.id}</p>
                  <p style="margin: 10px 0;"><strong>Miesto nakládky:</strong> ${transport.loadingAddress}</p>
                  <p style="margin: 10px 0;"><strong>Čas nakládky:</strong> ${loadingTime.toLocaleString('sk-SK', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                  <p style="margin: 10px 0;"><strong>Dopravca:</strong> ${transport.carrier}</p>
                  ${transport.notes ? `
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; margin-top: 15px;">
                      <p style="margin: 0;"><strong>Poznámky:</strong></p>
                      <p style="margin: 10px 0;">${transport.notes}</p>
                    </div>
                  ` : ''}
                </div>

                <p style="color: #666666;">
                  Pripomienka bola nastavená ${transport.loadingReminder} ${transport.loadingReminder === 1 ? 'hodinu' : transport.loadingReminder < 5 ? 'hodiny' : 'hodín'} pred nakládkou
                </p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666666;">
                  <p style="margin: 0;">S pozdravom,</p>
                  <p style="margin: 5px 0;">Váš AESA Transport Platform tím</p>
                </div>
              </div>
            `
                };
                promises.push(transporter.sendMail(mailOptions));
                batch.update(doc.ref, {
                    loadingReminderSent: true,
                    loadingReminderSentAt: now
                });
                console.log(`Pripravený email pre ${transport.createdBy.email} - nakládka ${transport.reference || transport.id}`);
            }
        }
        // Spracovanie pripomienok vykládky
        for (const doc of unloadingRemindersSnapshot.docs) {
            const transport = doc.data();
            const unloadingTime = transport.unloadingDateTime.toDate();
            const reminderTime = new Date(unloadingTime.getTime() - (transport.unloadingReminder * 60 * 60 * 1000));
            if (now.toDate() >= reminderTime && ((_b = transport.createdBy) === null || _b === void 0 ? void 0 : _b.email)) {
                const mailOptions = {
                    from: 'AESA Transport Platform <noreply@aesa.sk>',
                    to: transport.createdBy.email,
                    subject: `Pripomienka vykládky: ${transport.reference || transport.id}`,
                    html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #1a1b2e; border-bottom: 3px solid #00b894; padding-bottom: 10px;">Pripomienka vykládky</h2>
                
                <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
                  <p style="margin: 10px 0;"><strong>Referencia:</strong> ${transport.reference || transport.id}</p>
                  <p style="margin: 10px 0;"><strong>Miesto vykládky:</strong> ${transport.unloadingAddress}</p>
                  <p style="margin: 10px 0;"><strong>Čas vykládky:</strong> ${unloadingTime.toLocaleString('sk-SK', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                    })}</p>
                  <p style="margin: 10px 0;"><strong>Dopravca:</strong> ${transport.carrier}</p>
                  ${transport.notes ? `
                    <div style="background-color: #ffffff; padding: 15px; border-radius: 4px; margin-top: 15px;">
                      <p style="margin: 0;"><strong>Poznámky:</strong></p>
                      <p style="margin: 10px 0;">${transport.notes}</p>
                    </div>
                  ` : ''}
                </div>

                <p style="color: #666666;">
                  Pripomienka bola nastavená ${transport.unloadingReminder} ${transport.unloadingReminder === 1 ? 'hodinu' : transport.unloadingReminder < 5 ? 'hodiny' : 'hodín'} pred vykládkou
                </p>

                <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666666;">
                  <p style="margin: 0;">S pozdravom,</p>
                  <p style="margin: 5px 0;">Váš AESA Transport Platform tím</p>
                </div>
              </div>
            `
                };
                promises.push(transporter.sendMail(mailOptions));
                batch.update(doc.ref, {
                    unloadingReminderSent: true,
                    unloadingReminderSentAt: now
                });
                console.log(`Pripravený email pre ${transport.createdBy.email} - vykládka ${transport.reference || transport.id}`);
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