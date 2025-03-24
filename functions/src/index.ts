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

// Funkcia na kontrolu transportov a posielanie notifikácií
export const checkTransportNotifications = functions.pubsub
  .schedule('every 15 minutes')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const db = admin.firestore();

    try {
      console.log('Začínam kontrolu transportových notifikácií:', now.toDate().toISOString());
      
      // Získame všetky aktívne transporty
      const transportsSnapshot = await db.collection('transports')
        .where('status', '==', 'active')
        .get();

      console.log(`Našiel som ${transportsSnapshot.size} aktívnych transportov`);

      for (const doc of transportsSnapshot.docs) {
        const transport = doc.data();
        const userId = transport.userId;

        console.log(`Spracovávam transport ${transport.orderNumber} pre užívateľa ${userId}`);

        // Získame informácie o užívateľovi
        const userDoc = await db.collection('users').doc(userId).get();
        const user = userDoc.data();

        if (!user || !user.email) {
          console.log(`Používateľ ${userId} nemá nastavený email, preskakujem`);
          continue;
        }

        const loadingTime = transport.loadingDateTime.toDate();
        const unloadingTime = transport.unloadingDateTime.toDate();
        const currentTime = now.toDate();

        console.log(`Čas naloženia: ${loadingTime.toISOString()}`);
        console.log(`Čas vyloženia: ${unloadingTime.toISOString()}`);
        console.log(`Aktuálny čas: ${currentTime.toISOString()}`);

        // Kontrola pripomienky pre naloženie
        if (!transport.loadingReminderSent) {
          const loadingReminderTime = new Date(loadingTime.getTime() - (transport.loadingReminder * 60 * 60 * 1000));
          console.log(`Čas pripomienky naloženia: ${loadingReminderTime.toISOString()}`);
          
          if (currentTime >= loadingReminderTime) {
            console.log(`Odosielam pripomienku naloženia pre transport ${transport.orderNumber}`);
            
            // Pošleme email
            await transporter.sendMail({
              from: process.env.EMAIL_USER || 'noreply@aesa.sk',
              to: user.email,
              subject: 'Pripomienka naloženia - Transport Platform',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1b2e;">Pripomienka naloženia</h2>
                  <p>Dobrý deň,</p>
                  <p>pripomíname Vám, že o ${transport.loadingReminder} ${transport.loadingReminder === 1 ? 'hodinu' : transport.loadingReminder < 5 ? 'hodiny' : 'hodín'} 
                  máte naplánované naloženie tovaru:</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Číslo objednávky:</strong> ${transport.orderNumber}</p>
                    <p style="margin: 5px 0;"><strong>Adresa naloženia:</strong> ${transport.loadingAddress}</p>
                    <p style="margin: 5px 0;"><strong>Dátum a čas:</strong> ${loadingTime.toLocaleString('sk-SK')}</p>
                  </div>
                  <p style="color: #666;">S pozdravom,<br>Váš Transport Platform tím</p>
                </div>
              `
            });

            // Aktualizujeme záznam
            await doc.ref.update({
              loadingReminderSent: true,
              loadingReminderSentAt: now
            });
            
            console.log(`Pripomienka naloženia bola úspešne odoslaná pre transport ${transport.orderNumber}`);
          }
        }

        // Kontrola pripomienky pre vyloženie
        if (!transport.unloadingReminderSent) {
          const unloadingReminderTime = new Date(unloadingTime.getTime() - (transport.unloadingReminder * 60 * 60 * 1000));
          console.log(`Čas pripomienky vyloženia: ${unloadingReminderTime.toISOString()}`);
          
          if (currentTime >= unloadingReminderTime) {
            console.log(`Odosielam pripomienku vyloženia pre transport ${transport.orderNumber}`);
            
            // Pošleme email
            await transporter.sendMail({
              from: process.env.EMAIL_USER || 'noreply@aesa.sk',
              to: user.email,
              subject: 'Pripomienka vyloženia - Transport Platform',
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <h2 style="color: #1a1b2e;">Pripomienka vyloženia</h2>
                  <p>Dobrý deň,</p>
                  <p>pripomíname Vám, že o ${transport.unloadingReminder} ${transport.unloadingReminder === 1 ? 'hodinu' : transport.unloadingReminder < 5 ? 'hodiny' : 'hodín'} 
                  máte naplánované vyloženie tovaru:</p>
                  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p style="margin: 5px 0;"><strong>Číslo objednávky:</strong> ${transport.orderNumber}</p>
                    <p style="margin: 5px 0;"><strong>Adresa vyloženia:</strong> ${transport.unloadingAddress}</p>
                    <p style="margin: 5px 0;"><strong>Dátum a čas:</strong> ${unloadingTime.toLocaleString('sk-SK')}</p>
                  </div>
                  <p style="color: #666;">S pozdravom,<br>Váš Transport Platform tím</p>
                </div>
              `
            });

            // Aktualizujeme záznam
            await doc.ref.update({
              unloadingReminderSent: true,
              unloadingReminderSentAt: now
            });
            
            console.log(`Pripomienka vyloženia bola úspešne odoslaná pre transport ${transport.orderNumber}`);
          }
        }
      }

      console.log('Kontrola transportových notifikácií bola úspešne dokončená');
      return null;
    } catch (error) {
      console.error('Chyba pri kontrole transportových notifikácií:', error);
      return null;
    }
  });

// Funkcia na kontrolu pripomienok obchodných prípadov
export const checkBusinessCaseReminders = functions.pubsub
  .schedule('* * * * *')  // Každú minútu
  .timeZone('Europe/Bratislava')
  .onRun(async (context) => {
    const db = admin.firestore();
    const now = admin.firestore.Timestamp.now();

    try {
      const remindersSnapshot = await db.collection('reminders')
        .where('sent', '==', false)
        .where('reminderDateTime', '<=', now)
        .get();

      console.log(`Našiel som ${remindersSnapshot.size} pripomienok na odoslanie`);

      for (const doc of remindersSnapshot.docs) {
        const reminder = doc.data();
        
        if (reminder.userEmail) {
          await transporter.sendMail({
            from: process.env.EMAIL_USER || 'noreply@aesa.sk',
            to: reminder.userEmail,
            subject: `Pripomienka: ${reminder.companyName}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #1a1b2e;">Pripomienka obchodného prípadu</h2>
                <p>Dobrý deň,</p>
                <p>pripomíname Vám obchodný prípad:</p>
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
                  <p style="margin: 5px 0;"><strong>Firma:</strong> ${reminder.companyName}</p>
                  <p style="margin: 5px 0;"><strong>Kontaktná osoba:</strong> ${reminder.contactPerson.firstName} ${reminder.contactPerson.lastName}</p>
                  <p style="margin: 5px 0;"><strong>Telefón:</strong> ${reminder.contactPerson.phone}</p>
                  <p style="margin: 5px 0;"><strong>Email:</strong> ${reminder.contactPerson.email}</p>
                  ${reminder.reminderNote ? `<p style="margin: 5px 0;"><strong>Poznámka:</strong> ${reminder.reminderNote}</p>` : ''}
                </div>
                <p style="color: #666;">S pozdravom,<br>Váš Transport Platform tím</p>
              </div>
            `
          });

          await doc.ref.update({
            sent: true,
            sentAt: now
          });

          console.log(`Pripomienka bola úspešne odoslaná pre ${reminder.userEmail}`);
        }
      }

      return null;
    } catch (error) {
      console.error('Chyba pri kontrole pripomienok:', error);
      return null;
    }
  });

// Funkcia na aktualizáciu existujúcich záznamov
export const updateExistingRecords = functions.https.onCall(async (data, context) => {
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
  } catch (error) {
    console.error('Chyba pri aktualizácii záznamov:', error);
    throw new functions.https.HttpsError('internal', 'Nepodarilo sa aktualizovať záznamy.');
  }
}); 