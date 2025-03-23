import * as admin from 'firebase-admin';
import * as path from 'path';
import { DocumentData } from '@google-cloud/firestore';

// Inicializácia Firebase Admin SDK
const serviceAccount = require('../../core-app-423c7-firebase-adminsdk-fbsvc-fb579bc985.json');
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function clearDatabase() {
  try {
    const db = admin.firestore();
    const collections = ['users', 'companies', 'invitations', 'vehicles', 'routes', 'settings'];
    
    for (const collectionName of collections) {
      console.log(`Mažem kolekciu: ${collectionName}`);
      const collectionRef = db.collection(collectionName);
      const snapshot = await collectionRef.get();
      
      const batch = db.batch();
      snapshot.docs.forEach((doc: FirebaseFirestore.QueryDocumentSnapshot<DocumentData>) => {
        batch.delete(doc.ref);
      });
      
      await batch.commit();
      console.log(`Kolekcia ${collectionName} bola úspešne vymazaná`);
    }

    console.log('Všetky kolekcie boli úspešne vymazané');
  } catch (error) {
    console.error('Chyba pri čistení databázy:', error);
  } finally {
    // Uzavretie Firebase Admin SDK
    await admin.app().delete();
  }
}

clearDatabase();

export {}; 