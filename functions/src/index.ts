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
    await transporter.sendMail(mailOptions);
    console.log('Email odoslaný úspešne');
  } catch (error) {
    console.error('Chyba pri odosielaní emailu:', error);
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
        <h2>Pozvánka do AESA Transport Platform</h2>
        <p>Dobrý deň ${data.firstName},</p>
        <p>Boli ste pozvaní do AESA Transport Platform.</p>
        <p>Pre prijatie pozvánky kliknite na nasledujúci odkaz:</p>
        <a href="${invitationLink}">Prijať pozvánku</a>
      `;

      await sendEmail(data.email, 'Pozvánka do AESA Transport Platform', emailHtml);
      return { success: true };
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
    } catch (error) {
      console.error('Chyba pri kontrole notifikácií:', error);
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