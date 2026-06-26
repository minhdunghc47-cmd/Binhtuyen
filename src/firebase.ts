import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyATndQjyuApKV3CZtt31VS6C8KSTABzz_Q",
  authDomain: "cvbt-v1.firebaseapp.com",
  projectId: "cvbt-v1",
  storageBucket: "cvbt-v1.firebasestorage.app",
  messagingSenderId: "1001128258564",
  appId: "1:1001128258564:web:efba18c5004176ddaed951",
  measurementId: "G-XVFYKNTT3S"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const APP_ID = 'pccc-binh-tuyen-app';

export const facilitiesRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'facilities');
export const tasksRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'tasks');
export const fundsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'funds');
export const projectsRef = collection(db, 'artifacts', APP_ID, 'public', 'data', 'projects');

export async function fetchFromFirebase(colRef: any) {
  try {
    const snapshot = await getDocs(colRef);
    return snapshot.docs
      .filter(doc => doc.id !== 'bulk') // Ignore bulk array doc to prevent state corruption
      .map(doc => doc.data());
  } catch (err) {
    console.error('Error fetching from Firebase:', err);
    return [];
  }
}

