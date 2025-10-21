import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
    apiKey: "AIzaSyBUfyXE_NONHPQU6NFAl6Fz-CKMLzrvUik",
    authDomain: "sims-d133a.firebaseapp.com",
    databaseURL: "https://sims-d133a-default-rtdb.europe-west1.firebasedatabase.app",
    projectId: "sims-d133a",
    storageBucket: "sims-d133a.firebasestorage.app",
    messagingSenderId: "492192158531",
    appId: "1:492192158531:web:b145b66fef8b0197e0d5f6",
    measurementId: "G-JRZRVLXRZ8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize a second app instance for admin operations (creating users)
const secondaryApp = initializeApp(firebaseConfig, "Secondary");

// Initialize services
export const db = getDatabase(app);
export const auth = getAuth(app);
export const secondaryAuth = getAuth(secondaryApp);
