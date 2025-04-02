"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.initializeLastLogin = exports.updateExistingRecords = exports.logFunctionMetrics = exports.checkTransportNotifications = exports.checkBusinessCaseReminders = exports.sendInvitationEmail = exports.clearDatabase = void 0;
const functions = require("firebase-functions/v1");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
admin.initializeApp();
const REGION = 'europe-west1';
// Konfigurácia emailového transportu
const transporter = nodemailer.createTransport({
    host: functions.config().smtp.host,
    port: parseInt(functions.config().smtp.port),
    secure: true,
    auth: {
        type: 'login',
        user: functions.config().smtp.user,
        pass: functions.config().smtp.pass.replace(/\\/g, '') // Odstránime escapované znaky
    },
    tls: {
        rejectUnauthorized: false // Povoľujeme self-signed certifikáty
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
    var _a, _b, _c, _d, _e;
    const mailOptions = {
        from: 'AESA Transport Platform <noreply@aesa.sk>',
        to,
        subject,
        html,
        headers: {
            'Content-Type': 'text/html; charset=UTF-8',
            'X-Priority': '1',
            'X-MSMail-Priority': 'High'
        }
    };
    try {
        console.log('Konfigurácia SMTP:', {
            host: (_a = transporter.options) === null || _a === void 0 ? void 0 : _a.host,
            port: (_b = transporter.options) === null || _b === void 0 ? void 0 : _b.port,
            secure: (_c = transporter.options) === null || _c === void 0 ? void 0 : _c.secure,
            auth: {
                user: (_e = (_d = transporter.options) === null || _d === void 0 ? void 0 : _d.auth) === null || _e === void 0 ? void 0 : _e.user
            }
        });
        console.log('Pokus o odoslanie emailu:', {
            to: to,
            subject: subject,
            options: mailOptions
        });
        const info = await transporter.sendMail(mailOptions);
        console.log('Email odoslaný úspešne:', {
            messageId: info.messageId,
            response: info.response,
            accepted: info.accepted,
            rejected: info.rejected,
            to: to,
            subject: subject
        });
        return info;
    }
    catch (error) {
        console.error('Chyba pri odosielaní emailu:', {
            error: error,
            stack: error === null || error === void 0 ? void 0 : error.stack,
            to: to,
            subject: subject,
            smtpError: error === null || error === void 0 ? void 0 : error.message
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
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AESA Transport Platform</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#ff9f43" style="padding: 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">AESA Transport Platform</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              {{content}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 30px; background-color: #ffffff; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
              <p style="margin: 5px 0; color: #7f8c8d; font-size: 13px;">Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
              <p style="margin: 5px 0; color: #7f8c8d; font-size: 13px;">&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
        const invitationContent = `
        <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; font-weight: 600;">Dobrý deň ${data.firstName},</h2>
        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Boli ste pozvaní do AESA Transport Platform spoločnosťou <strong>${companyData === null || companyData === void 0 ? void 0 : companyData.companyName}</strong>.</p>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; margin: 25px 0; border-radius: 8px; border-left: 4px solid #ff9f43;">
          <tr>
            <td style="padding: 25px;">
              <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px; font-weight: 600;">Informácie o spoločnosti:</h3>
              <p style="margin: 10px 0; color: #34495e;"><strong>Názov:</strong> ${companyData === null || companyData === void 0 ? void 0 : companyData.companyName}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>IČO:</strong> ${(companyData === null || companyData === void 0 ? void 0 : companyData.ico) || 'Neuvedené'}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Adresa:</strong> ${companyData === null || companyData === void 0 ? void 0 : companyData.street}, ${companyData === null || companyData === void 0 ? void 0 : companyData.zipCode} ${companyData === null || companyData === void 0 ? void 0 : companyData.city}</p>
            </td>
          </tr>
        </table>

        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pre dokončenie registrácie a prístup do platformy kliknite na nasledujúce tlačidlo:</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 25px 0;">
              <a href="${invitationLink}" style="display: inline-block; padding: 14px 32px; background-color: #ff9f43; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Prijať pozvánku</a>
            </td>
          </tr>
        </table>
        <p style="color: #34495e; margin-bottom: 10px; font-size: 14px;">Ak tlačidlo nefunguje, skopírujte a vložte tento odkaz do prehliadača:</p>
        <p style="word-break: break-all; color: #666666; font-size: 14px;">${invitationLink}</p>
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
// Funkcia na kontrolu pripomienok obchodných prípadov
exports.checkBusinessCaseReminders = functions
    .region(REGION)
    .pubsub.schedule('every 1 minutes')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    var _a;
    const now = new Date();
    const db = admin.firestore();
    console.log('Spustená kontrola pripomienok obchodných prípadov:', now.toISOString());
    try {
        console.log('Hľadám pripomienky na odoslanie...');
        const remindersSnapshot = await db.collection('reminders')
            .where('reminderDateTime', '<=', now)
            .where('sent', '==', false)
            .where('businessCaseId', '!=', '')
            .get();
        console.log('Počet nájdených pripomienok:', remindersSnapshot.size);
        for (const doc of remindersSnapshot.docs) {
            const reminder = doc.data();
            const reminderId = doc.id;
            console.log('Spracovávam pripomienku obchodného prípadu:', {
                id: reminderId,
                reminderDateTime: reminder.reminderDateTime instanceof admin.firestore.Timestamp ?
                    reminder.reminderDateTime.toDate().toISOString() :
                    (reminder.reminderDateTime ? new Date(reminder.reminderDateTime).toISOString() : 'Neuvedené'),
                userEmail: reminder.userEmail,
                companyName: reminder.companyName,
                businessCaseId: reminder.businessCaseId,
                reminderNote: reminder.reminderNote
            });
            try {
                if (!reminder.userEmail) {
                    console.error(`Pripomienka (BC) ${reminderId} nemá nastavený email.`);
                    continue;
                }
                const formatDate = (date) => {
                    if (date == null) {
                        console.warn(`formatDate (BC): Dátum je null alebo undefined pre pripomienku ${reminderId}`);
                        return 'Neuvedený';
                    }
                    if (date instanceof admin.firestore.Timestamp) {
                        return date.toDate().toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
                    }
                    if (typeof date === 'object' && date !== null && typeof date.seconds === 'number') {
                        const seconds = date.seconds;
                        const nanoseconds = typeof date.nanoseconds === 'number' ? date.nanoseconds : 0;
                        return new Date(seconds * 1000 + nanoseconds / 1000000).toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
                    }
                    try {
                        const parsedDate = new Date(date);
                        if (!isNaN(parsedDate.getTime())) {
                            return parsedDate.toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' });
                        }
                        else {
                            console.warn(`formatDate (BC): Nepodarilo sa parsovať dátum pre pripomienku ${reminderId}:`, date);
                            return 'Neplatný formát';
                        }
                    }
                    catch (e) {
                        console.error(`formatDate (BC): Chyba pri parsovaní dátumu pre pripomienku ${reminderId}:`, date, e);
                        return 'Chyba formátu';
                    }
                };
                console.log('Generujem email pre pripomienku obchodného prípadu:', reminderId);
                const emailTemplate = `
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>AESA Transport Platform</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: 'Segoe UI', Arial, sans-serif;">
  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f5f5f5;">
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellpadding="0" cellspacing="0" width="600" style="background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td align="center" bgcolor="#ff9f43" style="padding: 40px 30px; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 600; font-family: 'Segoe UI', Arial, sans-serif;">AESA Transport Platform</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; background-color: #ffffff;">
              {{content}}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td align="center" style="padding: 20px 30px; background-color: #ffffff; border-top: 1px solid #eeeeee; border-radius: 0 0 8px 8px;">
              <p style="margin: 5px 0; color: #7f8c8d; font-size: 13px;">Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
              <p style="margin: 5px 0; color: #7f8c8d; font-size: 13px;">&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
                const businessCaseReminderContent = `
            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; font-weight: 600;">Dobrý deň${((_a = reminder.createdBy) === null || _a === void 0 ? void 0 : _a.firstName) ? ` ${reminder.createdBy.firstName}` : ''},</h2>
            <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pripomíname Vám naplánovanú aktivitu v obchodnom prípade:</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0; color: #34495e;"><strong>Obchodný prípad:</strong> "${reminder.companyName}"</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Dátum a čas pripomienky:</strong> ${formatDate(reminder.reminderDateTime)}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Text pripomienky:</strong> ${reminder.reminderNote || 'Bez poznámky'}</p>
            </div>
            <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pre zobrazenie detailov kliknite na nasledujúce tlačidlo:</p>
            <table border="0" cellpadding="0" cellspacing="0" width="100%">
              <tr>
                <td align="center" style="padding: 25px 0;">
                  <a href="https://core-app-423c7.web.app/business-cases/${reminder.businessCaseId}" style="display: inline-block; padding: 14px 32px; background-color: #ff9f43; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Zobraziť obchodný prípad</a>
                </td>
              </tr>
            </table>`;
                const businessCaseEmailHtml = emailTemplate.replace('{{content}}', businessCaseReminderContent);
                console.log('Pokus o odoslanie emailu na:', reminder.userEmail);
                await sendEmail(reminder.userEmail, 'Pripomienka pre obchodný prípad', businessCaseEmailHtml);
                console.log('Email úspešne odoslaný (BC), označujem pripomienku ako odoslanú:', reminderId);
                await doc.ref.update({
                    sent: true,
                    sentAt: admin.firestore.FieldValue.serverTimestamp()
                });
                console.log('Pripomienka (BC) úspešne označená ako odoslaná:', reminderId);
                const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
                await metricsRef.set({
                    businessCaseReminders: admin.firestore.FieldValue.increment(1)
                }, { merge: true });
                console.log('Metriky aktualizované');
            }
            catch (error) {
                console.error(`Chyba pri spracovaní pripomienky (BC) ID: ${reminderId}:`, {
                    error: error,
                    message: error === null || error === void 0 ? void 0 : error.message,
                    stack: error === null || error === void 0 ? void 0 : error.stack,
                    reminderID: reminderId,
                    userEmail: reminder === null || reminder === void 0 ? void 0 : reminder.userEmail,
                    companyName: reminder === null || reminder === void 0 ? void 0 : reminder.companyName,
                    businessCaseId: reminder === null || reminder === void 0 ? void 0 : reminder.businessCaseId,
                    reminderData: reminder
                });
            }
        }
        console.log('Kontrola pripomienok (BC) dokončená');
        return null;
    }
    catch (error) {
        console.error('Celková chyba pri kontrole pripomienok (BC):', {
            error: error,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack
        });
        return null;
    }
});
// Funkcia na kontrolu notifikácií pre sledované prepravy
exports.checkTransportNotifications = functions
    .region(REGION)
    .pubsub.schedule('every 1 minutes')
    .timeZone('Europe/Bratislava')
    .onRun(async (context) => {
    var _a, _b, _c, _d;
    const now = new Date();
    const db = admin.firestore();
    console.log('Spustená kontrola pripomienok prepráv:', now.toISOString());
    try {
        console.log('Hľadám pripomienky na odoslanie...');
        const remindersSnapshot = await db.collection('reminders')
            .where('reminderDateTime', '<=', admin.firestore.Timestamp.fromDate(now))
            .where('sent', '==', false)
            .where('transportId', '!=', null)
            .get();
        console.log('Počet nájdených pripomienok:', remindersSnapshot.size);
        for (const doc of remindersSnapshot.docs) {
            const reminder = doc.data();
            const reminderId = doc.id;
            // Konvertujeme reminderDateTime na Timestamp ak nie je
            const reminderDateTime = reminder.reminderDateTime instanceof admin.firestore.Timestamp
                ? reminder.reminderDateTime
                : admin.firestore.Timestamp.fromDate(new Date(reminder.reminderDateTime));
            console.log('Spracovávam pripomienku:', {
                id: reminderId,
                reminderDateTime: reminderDateTime.toDate().toISOString(),
                userEmail: reminder.userEmail,
                type: reminder.type,
                orderNumber: reminder.orderNumber,
                transportId: reminder.transportId,
                sent: reminder.sent,
                transportDetails: reminder.transportDetails
            });
            if (reminder.userEmail && reminder.transportId) {
                try {
                    const formatDate = (date) => {
                        if (date == null) {
                            console.warn(`formatDate: Dátum je null alebo undefined pre pripomienku ${reminderId}`);
                            return 'Neuvedený';
                        }
                        try {
                            // Ak je to Timestamp
                            if (date instanceof admin.firestore.Timestamp) {
                                return date.toDate().toLocaleString('sk-SK');
                            }
                            // Ak je to objekt s seconds a nanoseconds
                            if (typeof date === 'object' && date !== null &&
                                typeof date.seconds === 'number' &&
                                typeof date.nanoseconds === 'number') {
                                const timestamp = new admin.firestore.Timestamp(date.seconds, date.nanoseconds);
                                return timestamp.toDate().toLocaleString('sk-SK');
                            }
                            // Ak je to string alebo číslo
                            if (typeof date === 'string' || typeof date === 'number') {
                                const parsedDate = new Date(date);
                                if (!isNaN(parsedDate.getTime())) {
                                    return parsedDate.toLocaleString('sk-SK');
                                }
                            }
                            console.warn(`formatDate: Nepodarilo sa parsovať dátum pre pripomienku ${reminderId}:`, date);
                            return 'Neplatný formát';
                        }
                        catch (e) {
                            console.error(`formatDate: Chyba pri parsovaní dátumu pre pripomienku ${reminderId}:`, date, e);
                            return 'Chyba formátu';
                        }
                    };
                    const emailTemplate = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>AESA Transport Platform</title>
</head>
<body style="margin: 0; padding: 20px; background-color: #f5f5f5; font-family: Arial, sans-serif;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #333; margin-bottom: 20px;">Pripomienka prepravy</h1>
    <p style="color: #666;">Dobrý deň,</p>
    <p style="color: #666;">pripomíname Vám blížiacu sa ${reminder.type === 'loading' ? 'nakládku' : 'vykládku'}:</p>
    <div style="background-color: #f8f9fa; padding: 15px; border-radius: 4px; margin: 20px 0;">
      <p style="margin: 5px 0;"><strong>Číslo objednávky:</strong> ${reminder.orderNumber}</p>
      <p style="margin: 5px 0;"><strong>Typ:</strong> ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}</p>
      <p style="margin: 5px 0;"><strong>Adresa:</strong> ${reminder.type === 'loading' ?
                        (((_a = reminder.transportDetails) === null || _a === void 0 ? void 0 : _a.loadingAddress) || 'Neuvedená') :
                        (((_b = reminder.transportDetails) === null || _b === void 0 ? void 0 : _b.unloadingAddress) || 'Neuvedená')}</p>
      <p style="margin: 5px 0;"><strong>Dátum a čas:</strong> ${reminder.type === 'loading' ?
                        formatDate((_c = reminder.transportDetails) === null || _c === void 0 ? void 0 : _c.loadingDateTime) :
                        formatDate((_d = reminder.transportDetails) === null || _d === void 0 ? void 0 : _d.unloadingDateTime)}</p>
      <p style="margin: 5px 0;"><strong>Čas pripomienky:</strong> ${formatDate(reminder.reminderDateTime)}</p>
    </div>
    <p style="color: #666;">Pre zobrazenie detailov prepravy kliknite na nasledujúci odkaz:</p>
    <a href="https://core-app-423c7.web.app/tracked-transports" style="display: inline-block; padding: 10px 20px; background-color: #ff9f43; color: white; text-decoration: none; border-radius: 4px; margin: 20px 0;">Zobraziť prepravu</a>
  </div>
</body>
</html>`;
                    console.log('Pokus o odoslanie pripomienky na:', reminder.userEmail);
                    await sendEmail(reminder.userEmail, `Pripomienka prepravy - ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}`, emailTemplate);
                    console.log('Email úspešne odoslaný, označujem pripomienku ako odoslanú');
                    await doc.ref.update({
                        sent: true,
                        sentAt: admin.firestore.FieldValue.serverTimestamp()
                    });
                    console.log('Pripomienka úspešne označená ako odoslaná:', {
                        id: reminderId,
                        email: reminder.userEmail,
                        orderNumber: reminder.orderNumber
                    });
                    const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
                    await metricsRef.set({
                        transportNotifications: admin.firestore.FieldValue.increment(1)
                    }, { merge: true });
                }
                catch (error) {
                    console.error(`Chyba pri spracovaní pripomienky ID: ${reminderId}:`, {
                        error: error,
                        message: error === null || error === void 0 ? void 0 : error.message,
                        stack: error === null || error === void 0 ? void 0 : error.stack,
                        reminderID: reminderId,
                        userEmail: reminder === null || reminder === void 0 ? void 0 : reminder.userEmail,
                        orderNumber: reminder === null || reminder === void 0 ? void 0 : reminder.orderNumber,
                        reminderData: reminder
                    });
                }
            }
            else {
                console.warn('Pripomienka nemá nastavený email alebo transportId:', {
                    id: reminderId,
                    hasEmail: !!(reminder === null || reminder === void 0 ? void 0 : reminder.userEmail),
                    hasTransportId: !!(reminder === null || reminder === void 0 ? void 0 : reminder.transportId),
                    reminderData: reminder
                });
            }
        }
    }
    catch (error) {
        console.error('Celková chyba pri kontrole pripomienok (mimo cyklu spracovania):', {
            error: error,
            message: error === null || error === void 0 ? void 0 : error.message,
            stack: error === null || error === void 0 ? void 0 : error.stack
        });
    }
    return null;
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
// Funkcia na inicializáciu lastLogin pre existujúcich používateľov
exports.initializeLastLogin = functions
    .region(REGION)
    .https.onCall(async (data, context) => {
    var _a, _b;
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Užívateľ nie je prihlásený');
    }
    const db = admin.firestore();
    const batch = db.batch();
    try {
        // Najprv overíme, či je používateľ admin
        const userDoc = await db.collection('users').doc(context.auth.uid).get();
        if (!userDoc.exists || ((_a = userDoc.data()) === null || _a === void 0 ? void 0 : _a.role) !== 'admin') {
            throw new functions.https.HttpsError('permission-denied', 'Len admin môže inicializovať lastLogin');
        }
        const companyID = (_b = userDoc.data()) === null || _b === void 0 ? void 0 : _b.companyID;
        if (!companyID) {
            throw new functions.https.HttpsError('failed-precondition', 'Admin nemá nastavené companyID');
        }
        // Získame všetkých používateľov v danej firme
        const usersSnapshot = await db.collection('users')
            .where('companyID', '==', companyID)
            .get();
        let updatedCount = 0;
        for (const doc of usersSnapshot.docs) {
            const userData = doc.data();
            if (!userData.lastLogin) {
                batch.update(doc.ref, {
                    lastLogin: admin.firestore.Timestamp.now()
                });
                updatedCount++;
            }
        }
        if (updatedCount > 0) {
            await batch.commit();
        }
        return {
            success: true,
            message: `Aktualizovaných ${updatedCount} používateľov`
        };
    }
    catch (error) {
        console.error('Chyba pri inicializácii lastLogin:', error);
        throw new functions.https.HttpsError('internal', 'Chyba pri inicializácii lastLogin');
    }
});
//# sourceMappingURL=index.js.map