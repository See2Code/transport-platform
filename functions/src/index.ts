import * as functions from 'firebase-functions/v1';
import { CallableContext } from 'firebase-functions/v1/https';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { updateVehicleLocation } from './updateVehicleLocation';

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
export const clearDatabase = functions
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
    } catch (error) {
      console.error('Chyba pri čistení databázy:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri čistení databázy');
    }
  });

// Funkcia na odoslanie emailu
async function sendEmail(to: string, subject: string, html: string) {
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
      host: (transporter as any).options?.host,
      port: (transporter as any).options?.port,
      secure: (transporter as any).options?.secure,
      auth: {
        user: (transporter as any).options?.auth?.user
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
  } catch (error: any) {
    console.error('Chyba pri odosielaní emailu:', {
      error: error,
      stack: error?.stack,
      to: to,
      subject: subject,
      smtpError: error?.message
    });
    throw error;
  }
}

interface InvitationData {
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  invitationId: string;
  companyId: string;
  role: string;
}

// Funkcia na odoslanie pozvánky
export const sendInvitationEmail = functions
  .region(REGION)
  .https.onCall(async (data: InvitationData, context: CallableContext) => {
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
      } else {
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
</html>
`;

      const invitationContent = `
        <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; font-weight: 600;">Dobrý deň ${data.firstName},</h2>
        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Boli ste pozvaní do AESA Transport Platform spoločnosťou <strong>${companyData?.companyName}</strong>.</p>
        
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #f8f9fa; margin: 25px 0; border-radius: 8px; border-left: 4px solid #ff9f43;">
          <tr>
            <td style="padding: 25px;">
              <h3 style="color: #2c3e50; margin-top: 0; font-size: 18px; font-weight: 600;">Informácie o spoločnosti:</h3>
              <p style="margin: 10px 0; color: #34495e;"><strong>Názov:</strong> ${companyData?.companyName}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>IČO:</strong> ${companyData?.ico || 'Neuvedené'}</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Adresa:</strong> ${companyData?.street}, ${companyData?.zipCode} ${companyData?.city}</p>
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
    } catch (error) {
      console.error('Chyba pri odosielaní pozvánky:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri odosielaní pozvánky');
    }
  });

// Funkcia na kontrolu pripomienok obchodných prípadov
export const checkBusinessCaseReminders = functions
  .region(REGION)
  .pubsub.schedule('every 1 minutes')
  .timeZone('Europe/Bratislava')
  .onRun(async (context: any) => {
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
        console.log('Spracovávam pripomienku:', {
          id: doc.id,
          reminderDateTime: reminder.reminderDateTime?.toDate?.(),
          userEmail: reminder.userEmail,
          companyName: reminder.companyName,
          businessCaseId: reminder.businessCaseId,
          reminderNote: reminder.reminderNote
        });

        try {
          if (!reminder.userEmail) {
            console.error('Pripomienka nemá nastavený email:', doc.id);
            continue;
          }

          if (!reminder.reminderDateTime) {
            console.error('Pripomienka nemá nastavený čas:', doc.id);
            continue;
          }

          console.log('Generujem email pre pripomienku:', doc.id);
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
            <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; font-weight: 600;">Dobrý deň${reminder.contactPerson?.firstName ? ` ${reminder.contactPerson.firstName}` : ''},</h2>
            <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pripomíname Vám naplánovanú aktivitu v obchodnom prípade:</p>
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 10px 0; color: #34495e;"><strong>Obchodný prípad:</strong> "${reminder.companyName}"</p>
              <p style="margin: 10px 0; color: #34495e;"><strong>Dátum a čas pripomienky:</strong> ${reminder.reminderDateTime.toDate().toLocaleString('sk-SK', { timeZone: 'Europe/Bratislava' })}</p>
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
          await sendEmail(
            reminder.userEmail,
            'Pripomienka pre obchodný prípad',
            businessCaseEmailHtml
          );

          console.log('Email úspešne odoslaný, označujem pripomienku ako odoslanú');
          await doc.ref.update({
            sent: true,
            sentAt: admin.firestore.FieldValue.serverTimestamp()
          });

          console.log('Pripomienka úspešne označená ako odoslaná');
          
          const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
          await metricsRef.set({
            businessCaseReminders: admin.firestore.FieldValue.increment(1)
          }, { merge: true });
          
          console.log('Metriky aktualizované');
        } catch (error: any) {
          console.error('Chyba pri spracovaní pripomienky:', {
            error: error,
            stack: error?.stack,
            reminderID: doc.id,
            userEmail: reminder.userEmail,
            companyName: reminder.companyName,
            businessCaseId: reminder.businessCaseId
          });
        }
      }

      console.log('Kontrola pripomienok dokončená');
      return null;
    } catch (error: any) {
      console.error('Chyba pri kontrole pripomienok:', error);
      return null;
    }
  });

// Funkcia na kontrolu notifikácií pre sledované prepravy
export const checkTransportNotifications = functions
  .region(REGION)
  .pubsub.schedule('every 1 minutes')
  .timeZone('Europe/Bratislava')
  .onRun(async (context: any) => {
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
          reminderDateTime: reminder.reminderDateTime?.toDate?.(),
          userEmail: reminder.userEmail,
          type: reminder.type,
          orderNumber: reminder.orderNumber,
          transportId: reminder.transportId
        });
        
        if (reminder.userEmail && reminder.transportId) {
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
</html>
`;

      const transportReminderContent = `
        <h2 style="color: #2c3e50; margin-top: 0; font-size: 24px; font-weight: 600;">Dobrý deň,</h2>
        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pripomíname Vám blížiacu sa ${reminder.type === 'loading' ? 'nakládku' : 'vykládku'}:</p>
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 10px 0; color: #34495e;"><strong>Číslo objednávky:</strong> "${reminder.orderNumber}"</p>
          <p style="margin: 10px 0; color: #34495e;"><strong>Typ:</strong> ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}</p>
          <p style="margin: 10px 0; color: #34495e;"><strong>Adresa:</strong> ${reminder.address}</p>
          <p style="margin: 10px 0; color: #34495e;"><strong>Dátum a čas ${reminder.type === 'loading' ? 'nakládky' : 'vykládky'}:</strong> ${reminder.dateTime.toDate().toLocaleString('sk-SK')}</p>
          <p style="margin: 10px 0; color: #34495e;"><strong>Čas pripomienky:</strong> ${reminder.reminderDateTime.toDate().toLocaleString('sk-SK')}</p>
          ${reminder.reminderNote ? `<p style="margin: 10px 0; color: #34495e;"><strong>Poznámka k pripomienke:</strong> ${reminder.reminderNote}</p>` : ''}
        </div>
        <p style="color: #34495e; margin-bottom: 20px; font-size: 16px;">Pre zobrazenie detailov kliknite na nasledujúce tlačidlo:</p>
        <table border="0" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td align="center" style="padding: 25px 0;">
              <a href="https://core-app-423c7.web.app/tracked-transports" style="display: inline-block; padding: 14px 32px; background-color: #ff9f43; color: #ffffff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 16px;">Zobraziť prepravu</a>
            </td>
          </tr>
        </table>
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
      } catch (error: any) {
        console.error('Chyba pri odosielaní pripomienky:', {
          error: error,
          reminderID: doc.id,
          userEmail: reminder.userEmail,
          orderNumber: reminder.orderNumber
        });
      }
    } else {
      console.warn('Pripomienka nemá nastavený email alebo transportId:', {
        id: doc.id,
        hasEmail: !!reminder.userEmail,
        hasTransportId: !!reminder.transportId
      });
    }
  }
} catch (error: any) {
  console.error('Chyba pri kontrole pripomienok:', error);
}
});

// Funkcia na logovanie metrík
export const logFunctionMetrics = functions
  .region(REGION)
  .pubsub.schedule('every 1 hours')
  .timeZone('Europe/Bratislava')
  .onRun(async (context: any) => {
    const db = admin.firestore();
    const now = new Date();

    try {
      const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
      await metricsRef.set({
        timestamp: admin.firestore.FieldValue.serverTimestamp(),
        businessCaseReminders: 0,
        transportNotifications: 0
      }, { merge: true });
    } catch (error: any) {
      console.error('Chyba pri logovaní metrík:', error);
    }
  });

// Funkcia na aktualizáciu existujúcich záznamov
export const updateExistingRecords = functions
  .region(REGION)
  .https.onCall(async (data: any, context: CallableContext) => {
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
    } catch (error: any) {
      console.error('Chyba pri aktualizácii záznamov:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri aktualizácii záznamov');
    }
  });

export {
    updateVehicleLocation
}; 