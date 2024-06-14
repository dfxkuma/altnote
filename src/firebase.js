// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
    apiKey: "AIzaSyABxEM-1C0UHCVIRFnxNn45Z1PHTojgl1k",
    authDomain: "yuchan0.firebaseapp.com",
    projectId: "yuchan0",
    storageBucket: "yuchan0.appspot.com",
    messagingSenderId: "662355873929",
    appId: "1:662355873929:web:1123d83aee4c1cc44bf658",
    measurementId: "G-83RR6SFK6L"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const database = getDatabase(app);

export { auth, database };