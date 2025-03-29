import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getDatabase } from 'firebase/database';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
  // TODO: Nahraďte tieto hodnoty skutočnými hodnotami z Firebase Console
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
  storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.REACT_APP_FIREBASE_APP_ID,
  databaseURL: process.env.REACT_APP_FIREBASE_DATABASE_URL
};

console.log('Firebase konfigurácia:', {
  apiKey: firebaseConfig.apiKey,
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
  databaseURL: firebaseConfig.databaseURL
});

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app, 'europe-west1');
const database = getDatabase(app);
const storage = getStorage(app);

// Nastavenie regiónu pre Firestore
if (process.env.NODE_ENV === 'development' && process.env.REACT_APP_USE_FIREBASE_EMULATOR === 'true') {
  connectFirestoreEmulator(db, 'localhost', 8080);
}

// Storage Rules
const storageRules = `
rules_version = '2';

service firebase.storage {
  match /b/{bucket}/o {
    // Základné pravidlá pre všetky súbory
    match /{allPaths=**} {
      allow read: if request.auth != null;
      allow write: if false; // Defaultne zakážeme zápis
    }

    // Pravidlá pre profilové fotky
    match /users/{userId}/profile-photo {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
        && request.auth.uid == userId
        && request.resource.size < 5 * 1024 * 1024 // Max 5MB
        && request.resource.contentType.matches('image/.*'); // Len obrázky
    }

    // Pravidlá pre nastavenia firmy (logo a pečiatka)
    match /companySettings/{companyId}/{fileType} {
      allow read: if request.auth != null
        && (
          // Používateľ je admin
          get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.role == 'admin'
          ||
          // Alebo používateľ patrí k danej firme
          get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.companyID == companyId
        );
      allow write: if request.auth != null
        && (
          // Používateľ je admin
          get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.role == 'admin'
          ||
          // Alebo používateľ patrí k danej firme
          get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.companyID == companyId
        )
        && request.resource.size < 10 * 1024 * 1024 // Max 10MB
        && request.resource.contentType.matches('image/.*'); // Len obrázky
    }

    // Pravidlá pre dokumenty prepráv
    match /transports/{transportId}/{fileName} {
      allow read: if request.auth != null;
      allow write: if request.auth != null
        && (
          // Používateľ je admin
          get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.role == 'admin'
          ||
          // Alebo používateľ vytvoril prepravu
          get(/databases/$(database.name)/documents/transports/$(transportId)).data.createdBy == request.auth.uid
        )
        && request.resource.size < 20 * 1024 * 1024; // Max 20MB
    }

    // Pravidlá pre PDF faktúry
    match /invoices/{invoiceId}/{fileName} {
      allow read: if request.auth != null
        && (
          // Používateľ je admin
          get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.role == 'admin'
          ||
          // Alebo používateľ patrí k firme, ktorá vlastní faktúru
          get(/databases/$(database.name)/documents/invoices/$(invoiceId)).data.companyID == 
          get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.companyID
        );
      allow write: if request.auth != null
        && (
          // Používateľ je admin
          get(/databases/$(database.name)/documents/users/$(request.auth.uid)).data.role == 'admin'
          ||
          // Alebo používateľ vytvára faktúru pre svoju firmu
          request.resource.contentType == 'application/pdf'
          && request.resource.size < 10 * 1024 * 1024 // Max 10MB
        );
    }
  }
}`;

// Pomocná funkcia pre generovanie a stiahnutie PDF
const downloadFile = async (path: string): Promise<Blob> => {
  try {
    const storageRef = ref(storage, path);
    const downloadURL = await getDownloadURL(storageRef);
    const response = await fetch(downloadURL);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.blob();
  } catch (error) {
    console.error('Chyba pri sťahovaní súboru:', error);
    throw error;
  }
};

export { auth, db, functions, database, storage, downloadFile, storageRules };

export default app; 