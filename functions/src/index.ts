import * as functions from 'firebase-functions/v1';
import { CallableContext } from 'firebase-functions/v1/https';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

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
  } catch (error) {
    console.error('Chyba pri odosielaní emailu:', {
      error: error,
      to: to,
      subject: subject
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
            .company-info {
              background-color: #f5f5f5;
              padding: 20px;
              border-radius: 4px;
              margin: 20px 0;
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
              <p>Boli ste pozvaní do AESA Transport Platform spoločnosťou <strong>${companyData?.companyName}</strong>.</p>
              
              <div class="company-info">
                <h3>Informácie o spoločnosti:</h3>
                <p><strong>Názov:</strong> ${companyData?.companyName}</p>
                <p><strong>IČO:</strong> ${companyData?.ico || 'Neuvedené'}</p>
                <p><strong>Adresa:</strong> ${companyData?.street}, ${companyData?.zipCode} ${companyData?.city}</p>
              </div>

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
    } catch (error) {
      console.error('Chyba pri odosielaní pozvánky:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri odosielaní pozvánky');
    }
  });

// Funkcia na kontrolu pripomienok pre obchodné prípady
export const checkBusinessCaseReminders = functions
  .region(REGION)
  .pubsub.schedule('every 1 minutes')
  .timeZone('Europe/Bratislava')
  .onRun(async (context: any) => {
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
          reminderDateTime: reminder.reminderDateTime?.toDate?.(),
          userEmail: reminder.userEmail,
          companyName: reminder.companyName
        });
        
        if (reminder.userEmail) {
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
                  <h2>Dobrý deň ${reminder.contactPerson.firstName},</h2>
                  <p>Máte novú pripomienku pre obchodný prípad "${reminder.companyName}".</p>
                  <p>Dátum pripomienky: ${reminder.reminderDateTime.toDate().toLocaleString('sk-SK')}</p>
                  <p>Text pripomienky: ${reminder.reminderNote || 'Bez poznámky'}</p>
                  <p>Pre zobrazenie detailov kliknite na nasledujúce tlačidlo:</p>
                  <div style="text-align: center;">
                    <a href="https://core-app-423c7.web.app/business-cases" class="button">Zobraziť obchodný prípad</a>
                  </div>
                </div>
                <div class="footer">
                  <p>Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
                  <p>&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          try {
            console.log('Pokus o odoslanie pripomienky na:', reminder.userEmail);
            await sendEmail(reminder.userEmail, 'Pripomienka pre obchodný prípad', emailHtml);
            
            // Vymazanie pripomienky po úspešnom odoslaní
            await doc.ref.delete();
            console.log('Pripomienka úspešne odoslaná a vymazaná');
            
            // Aktualizujeme počítadlo metrík
            const metricsRef = db.collection('functionMetrics').doc(now.toISOString().split('T')[0]);
            await metricsRef.set({
              businessCaseReminders: admin.firestore.FieldValue.increment(1)
            }, { merge: true });
          } catch (error) {
            console.error('Chyba pri odosielaní pripomienky:', {
              error: error,
              reminderID: doc.id,
              userEmail: reminder.userEmail
            });
          }
        } else {
          console.warn('Pripomienka nemá nastavený email:', doc.id);
        }
      }
    } catch (error) {
      console.error('Chyba pri kontrole pripomienok:', error);
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
                  <h2>Dobrý deň,</h2>
                  <p>Máte novú pripomienku pre prepravu s číslom objednávky "${reminder.orderNumber}".</p>
                  <p>Typ: ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}</p>
                  <p>Adresa: ${reminder.address}</p>
                  <p>Dátum a čas: ${reminder.reminderDateTime.toDate().toLocaleString('sk-SK')}</p>
                  <p>${reminder.reminderNote || ''}</p>
                  <p>Pre zobrazenie detailov kliknite na nasledujúce tlačidlo:</p>
                  <div style="text-align: center;">
                    <a href="https://core-app-423c7.web.app/tracked-transports" class="button">Zobraziť prepravu</a>
                  </div>
                </div>
                <div class="footer">
                  <p>Toto je automaticky generovaný email. Prosím neodpovedajte naň.</p>
                  <p>&copy; ${new Date().getFullYear()} AESA Transport Platform. Všetky práva vyhradené.</p>
                </div>
              </div>
            </body>
            </html>
          `;

          try {
            console.log('Pokus o odoslanie pripomienky na:', reminder.userEmail);
            await sendEmail(reminder.userEmail, `Pripomienka prepravy - ${reminder.type === 'loading' ? 'Nakládka' : 'Vykládka'}`, emailHtml);
            
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
          } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
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
    } catch (error) {
      console.error('Chyba pri aktualizácii záznamov:', error);
      throw new functions.https.HttpsError('internal', 'Chyba pri aktualizácii záznamov');
    }
  }); 