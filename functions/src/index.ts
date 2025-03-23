import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Konfigurácia emailového transportu pre SMTP server Websupport
const transporter = nodemailer.createTransport({
  host: 'smtp.m1.websupport.sk',
  port: 465,
  secure: true, // SSL/TLS
  auth: {
    user: process.env.EMAIL_USER || 'noreply@aesa.sk',
    pass: process.env.EMAIL_PASS || 'r.{jo$_;OJX8V>eKbo|!'
  }
});

// Funkcia na vyčistenie databázy
export const clearDatabase = functions.https.onCall(async (data, context) => {
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
  } catch (error) {
    console.error('Chyba pri čistení databázy:', error);
    throw new functions.https.HttpsError('internal', 'Nepodarilo sa vyčistiť databázu.');
  }
});

export const sendInvitationEmail = functions.https.onCall(async (data, context) => {
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

    if (!companyData?.companyName) {
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
  } catch (error: any) {
    console.error('Chyba pri odosielaní emailu:', error);
    throw new functions.https.HttpsError('internal', 'Nepodarilo sa odoslať email s pozvánkou: ' + (error.message || 'Neznáma chyba'));
  }
});

export const checkTransportReminders = functions.pubsub
  .schedule('every 5 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();

    try {
      // Získame všetky aktívne transporty
      const transportsSnapshot = await db.collection('transports')
        .where('status', '==', 'active')
        .get();

      for (const doc of transportsSnapshot.docs) {
        const transport = doc.data();
        const userId = transport.userId;

        // Získame informácie o užívateľovi
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();

        if (!user || !user.email) continue;

        const loadingTime = transport.loadingDateTime.toDate();
        const unloadingTime = transport.unloadingDateTime.toDate();
        const currentTime = now.toDate();

        // Kontrola pripomienky pre naloženie
        if (!transport.loadingReminderSent) {
          const loadingReminderTime = new Date(loadingTime.getTime() - (transport.loadingReminder * 60 * 60 * 1000));
          
          if (currentTime >= loadingReminderTime) {
            // Pošleme email
            await transporter.sendMail({
              from: functions.config().email.user,
              to: user.email,
              subject: 'Pripomienka naloženia - Transport',
              html: `
                <h2>Pripomienka naloženia</h2>
                <p>Dobrý deň,</p>
                <p>pripomíname Vám, že o ${transport.loadingReminder} ${transport.loadingReminder === 1 ? 'hodinu' : transport.loadingReminder < 5 ? 'hodiny' : 'hodín'} 
                máte naplánované naloženie tovaru:</p>
                <ul>
                  <li><strong>Číslo objednávky:</strong> ${transport.orderNumber}</li>
                  <li><strong>Adresa naloženia:</strong> ${transport.loadingAddress}</li>
                  <li><strong>Dátum a čas:</strong> ${loadingTime.toLocaleString('sk-SK')}</li>
                </ul>
                <p>S pozdravom,<br>Váš CORE tím</p>
              `
            });

            // Aktualizujeme záznam
            await doc.ref.update({
              loadingReminderSent: true
            });
          }
        }

        // Kontrola pripomienky pre vyloženie
        if (!transport.unloadingReminderSent) {
          const unloadingReminderTime = new Date(unloadingTime.getTime() - (transport.unloadingReminder * 60 * 60 * 1000));
          
          if (currentTime >= unloadingReminderTime) {
            // Pošleme email
            await transporter.sendMail({
              from: functions.config().email.user,
              to: user.email,
              subject: 'Pripomienka vyloženia - Transport',
              html: `
                <h2>Pripomienka vyloženia</h2>
                <p>Dobrý deň,</p>
                <p>pripomíname Vám, že o ${transport.unloadingReminder} ${transport.unloadingReminder === 1 ? 'hodinu' : transport.unloadingReminder < 5 ? 'hodiny' : 'hodín'} 
                máte naplánované vyloženie tovaru:</p>
                <ul>
                  <li><strong>Číslo objednávky:</strong> ${transport.orderNumber}</li>
                  <li><strong>Adresa vyloženia:</strong> ${transport.unloadingAddress}</li>
                  <li><strong>Dátum a čas:</strong> ${unloadingTime.toLocaleString('sk-SK')}</li>
                </ul>
                <p>S pozdravom,<br>Váš CORE tím</p>
              `
            });

            // Aktualizujeme záznam
            await doc.ref.update({
              unloadingReminderSent: true
            });
          }
        }
      }

      console.log('Transport reminders check completed successfully');
      return null;
    } catch (error) {
      console.error('Error checking transport reminders:', error);
      return null;
    }
  }); 