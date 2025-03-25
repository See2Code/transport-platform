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
        console.log('Pokus o odoslanie emailu na:', to);
        const info = await transporter.sendMail(mailOptions);
        console.log('Email odoslaný úspešne:', {
            messageId: info.messageId,
            to: to,
            subject: subject
        });
        return info;
    }
    catch (error) {
        console.error('Chyba pri odosielaní emailu:', {
            error: error,
            to: to,
            subject: subject
        });
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
        // Získanie údajov o firme
        const companyDoc = await admin.firestore().collection('companies').doc(data.companyId).get();
        if (!companyDoc.exists) {
            throw new Error('Firma nebola nájdená');
        }
        const companyData = companyDoc.data();
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
        const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ff9f43 0%, #ff7f50 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .content {
      background-color: white;
      padding: 40px 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .content h2 {
      color: #2c3e50;
      margin-top: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content p {
      color: #34495e;
      margin-bottom: 20px;
      font-size: 16px;
    }
    .company-info {
      background-color: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #ff9f43;
    }
    .company-info h3 {
      color: #2c3e50;
      margin-top: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .company-info p {
      margin: 10px 0;
      color: #34495e;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #ff9f43 0%, #ff7f50 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 25px 0;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(255, 159, 67, 0.3);
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 159, 67, 0.4);
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 13px;
      padding: 20px;
      border-top: 1px solid #eee;
    }
    .footer p {
      margin: 5px 0;
    }
    .highlight {
      color: #ff9f43;
      font-weight: 600;
    }
    .info-box {
      background-color: #fff8f0;
      border: 1px solid #ffe0b2;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-box p {
      margin: 10px 0;
      color: #34495e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AESA Transport Platform</h1>
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
      <p>&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
    </div>
  </div>
</body>
</html>
`;
        const invitationContent = `
        <h2>Dobrý deň ${data.firstName},</h2>
        <p>Boli ste pozvaní do AESA Transport Platform spoločnosťou <strong>${companyData === null || companyData === void 0 ? void 0 : companyData.companyName}</strong>.</p>
        
        <div class="company-info">
          <h3>Informácie o spoločnosti:</h3>
          <p><strong>Názov:</strong> ${companyData === null || companyData === void 0 ? void 0 : companyData.companyName}</p>
          <p><strong>IČO:</strong> ${(companyData === null || companyData === void 0 ? void 0 : companyData.ico) || 'Neuvedené'}</p>
          <p><strong>Adresa:</strong> ${companyData === null || companyData === void 0 ? void 0 : companyData.street}, ${companyData === null || companyData === void 0 ? void 0 : companyData.zipCode} ${companyData === null || companyData === void 0 ? void 0 : companyData.city}</p>
        </div>

        <p>Pre dokončenie registrácie a prístup do platformy kliknite na nasledujúce tlačidlo:</p>
        <div style="text-align: center;">
          <a href="${invitationLink}" class="button">Prijať pozvánku</a>
        </div>
        <p>Ak tlačidlo nefunguje, skopírujte a vložte tento odkaz do prehliadača:</p>
        <p style="word-break: break-all; color: #666;">${invitationLink}</p>
      `;
        const emailHtml = emailTemplate.replace('{{content}}', invitationContent);
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
    var _a, _b;
    const now = new Date();
    const db = admin.firestore();
    console.log('Spustená kontrola pripomienok:', now.toISOString());
    try {
        console.log('Hľadám pripomienky na odoslanie...');
        const remindersSnapshot = await db.collection('reminders')
            .where('reminderDateTime', '<=', now)
            .where('sent', '==', false)
            .get();
        console.log('Počet nájdených pripomienok:', remindersSnapshot.size);
        for (const doc of remindersSnapshot.docs) {
            const reminder = doc.data();
            console.log('Spracovávam pripomienku:', {
                id: doc.id,
                reminderDateTime: (_b = (_a = reminder.reminderDateTime) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a),
                userEmail: reminder.userEmail,
                companyName: reminder.companyName
            });
            if (reminder.userEmail) {
                const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ff9f43 0%, #ff7f50 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .content {
      background-color: white;
      padding: 40px 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .content h2 {
      color: #2c3e50;
      margin-top: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content p {
      color: #34495e;
      margin-bottom: 20px;
      font-size: 16px;
    }
    .company-info {
      background-color: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #ff9f43;
    }
    .company-info h3 {
      color: #2c3e50;
      margin-top: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .company-info p {
      margin: 10px 0;
      color: #34495e;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #ff9f43 0%, #ff7f50 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 25px 0;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(255, 159, 67, 0.3);
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 159, 67, 0.4);
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 13px;
      padding: 20px;
      border-top: 1px solid #eee;
    }
    .footer p {
      margin: 5px 0;
    }
    .highlight {
      color: #ff9f43;
      font-weight: 600;
    }
    .info-box {
      background-color: #fff8f0;
      border: 1px solid #ffe0b2;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-box p {
      margin: 10px 0;
      color: #34495e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AESA Transport Platform</h1>
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
      <p>&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
    </div>
  </div>
</body>
</html>
`;
                const businessCaseReminderContent = `
        <h2>Dobrý deň ${reminder.contactPerson.firstName},</h2>
        <div class="info-box">
          <p><strong>Obchodný prípad:</strong> "${reminder.companyName}"</p>
          <p><strong>Dátum pripomienky:</strong> ${reminder.reminderDateTime.toDate().toLocaleString('sk-SK')}</p>
          <p><strong>Text pripomienky:</strong> ${reminder.reminderNote || 'Bez poznámky'}</p>
        </div>
        <p>Pre zobrazenie detailov kliknite na nasledujúce tlačidlo:</p>
        <div style="text-align: center;">
          <a href="https://core-app-423c7.web.app/business-cases" class="button">Zobraziť obchodný prípad</a>
        </div>
      `;
                const businessCaseEmailHtml = emailTemplate.replace('{{content}}', businessCaseReminderContent);
                try {
                    console.log('Pokus o odoslanie pripomienky na:', reminder.userEmail);
                    await sendEmail(reminder.userEmail, 'Pripomienka pre obchodný prípad', businessCaseEmailHtml);
                    // Vymazanie pripomienky po úspešnom odoslaní
                    await doc.ref.delete();
                    console.log('Pripomienka úspešne odoslaná a vymazaná');
                    // Aktualizujeme počítadlo metrík
                    const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
                    await metricsRef.set({
                        businessCaseReminders: admin.firestore.FieldValue.increment(1)
                    }, { merge: true });
                }
                catch (error) {
                    console.error('Chyba pri odosielaní pripomienky:', {
                        error: error,
                        reminderID: doc.id,
                        userEmail: reminder.userEmail
                    });
                }
            }
            else {
                console.warn('Pripomienka nemá nastavený email:', doc.id);
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
    var _a, _b;
    const now = new Date();
    const db = admin.firestore();
    console.log('Spustená kontrola pripomienok prepráv:', now.toISOString());
    try {
        console.log('Hľadám pripomienky na odoslanie...');
        const remindersSnapshot = await db.collection('reminders')
            .where('reminderDateTime', '<=', now)
            .where('sent', '==', false)
            .where('transportId', '!=', null)
            .get();
        console.log('Počet nájdených pripomienok:', remindersSnapshot.size);
        for (const doc of remindersSnapshot.docs) {
            const reminder = doc.data();
            console.log('Spracovávam pripomienku:', {
                id: doc.id,
                reminderDateTime: (_b = (_a = reminder.reminderDateTime) === null || _a === void 0 ? void 0 : _a.toDate) === null || _b === void 0 ? void 0 : _b.call(_a),
                userEmail: reminder.userEmail,
                type: reminder.type,
                orderNumber: reminder.orderNumber,
                transportId: reminder.transportId
            });
            if (reminder.userEmail && reminder.transportId) {
                const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body {
      font-family: 'Segoe UI', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      margin: 0;
      padding: 0;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      background: linear-gradient(135deg, #ff9f43 0%, #ff7f50 100%);
      color: white;
      padding: 40px 30px;
      text-align: center;
      border-radius: 8px 8px 0 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header h1 {
      margin: 0;
      font-size: 28px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }
    .content {
      background-color: white;
      padding: 40px 30px;
      border-radius: 0 0 8px 8px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .content h2 {
      color: #2c3e50;
      margin-top: 0;
      font-size: 24px;
      font-weight: 600;
    }
    .content p {
      color: #34495e;
      margin-bottom: 20px;
      font-size: 16px;
    }
    .company-info {
      background-color: #f8f9fa;
      padding: 25px;
      border-radius: 8px;
      margin: 25px 0;
      border-left: 4px solid #ff9f43;
    }
    .company-info h3 {
      color: #2c3e50;
      margin-top: 0;
      font-size: 18px;
      font-weight: 600;
    }
    .company-info p {
      margin: 10px 0;
      color: #34495e;
    }
    .button {
      display: inline-block;
      padding: 14px 32px;
      background: linear-gradient(135deg, #ff9f43 0%, #ff7f50 100%);
      color: white;
      text-decoration: none;
      border-radius: 6px;
      margin: 25px 0;
      font-weight: 600;
      font-size: 16px;
      text-align: center;
      box-shadow: 0 2px 4px rgba(255, 159, 67, 0.3);
      transition: all 0.3s ease;
    }
    .button:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 8px rgba(255, 159, 67, 0.4);
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      color: #7f8c8d;
      font-size: 13px;
      padding: 20px;
      border-top: 1px solid #eee;
    }
    .footer p {
      margin: 5px 0;
    }
    .highlight {
      color: #ff9f43;
      font-weight: 600;
    }
    .info-box {
      background-color: #fff8f0;
      border: 1px solid #ffe0b2;
      border-radius: 6px;
      padding: 20px;
      margin: 20px 0;
    }
    .info-box p {
      margin: 10px 0;
      color: #34495e;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>AESA Transport Platform</h1>
    </div>
    <div class="content">
      {{content}}
    </div>
    <div class="footer">
      <p>Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
      <p>&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
    </div>
  </div>
</body>
</html>
`;
                const transportReminderContent = `
        <h2>Dobrý deň,</h2>
        <div class="info-box">
          <p><strong>Číslo objednávky:</strong> "${reminder.orderNumber}"</p>
          <p><strong>Typ:</strong> ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}</p>
          <p><strong>Adresa:</strong> ${reminder.address}</p>
          <p><strong>Dátum a čas:</strong> ${reminder.reminderDateTime.toDate().toLocaleString('sk-SK')}</p>
          ${reminder.reminderNote ? `<p><strong>Poznámka:</strong> ${reminder.reminderNote}</p>` : ''}
        </div>
        <p>Pre zobrazenie detailov kliknite na nasledujúce tlačidlo:</p>
        <div style="text-align: center;">
          <a href="https://core-app-423c7.web.app/tracked-transports" class="button">Zobraziť prepravu</a>
        </div>
      `;
                const transportEmailHtml = emailTemplate.replace('{{content}}', transportReminderContent);
                try {
                    console.log('Pokus o odoslanie pripomienky na:', reminder.userEmail);
                    await sendEmail(reminder.userEmail, `Pripomienka prepravy - ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}`, transportEmailHtml);
                    // Vymazanie pripomienky po úspešnom odoslaní
                    await doc.ref.delete();
                    console.log('Pripomienka úspešne odoslaná a vymazaná:', {
                        id: doc.id,
                        email: reminder.userEmail,
                        orderNumber: reminder.orderNumber
                    });
                    // Aktualizujeme počítadlo metrík
                    const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
                    await metricsRef.set({
                        transportNotifications: admin.firestore.FieldValue.increment(1)
                    }, { merge: true });
                }
                catch (error) {
                    console.error('Chyba pri odosielaní pripomienky:', {
                        error: error,
                        reminderID: doc.id,
                        userEmail: reminder.userEmail,
                        orderNumber: reminder.orderNumber
                    });
                }
            }
            else {
                console.warn('Pripomienka nemá nastavený email alebo transportId:', {
                    id: doc.id,
                    hasEmail: !!reminder.userEmail,
                    hasTransportId: !!reminder.transportId
                });
            }
        }
    }
    catch (error) {
        console.error('Chyba pri kontrole pripomienok:', error);
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