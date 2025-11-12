// js/firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA0Uf0lFPklme3p4dd23Ld8bKu_-8r76Qs",
  authDomain: "mini-finance-manager.firebaseapp.com",
  projectId: "mini-finance-manager",
  storageBucket: "mini-finance-manager.firebasestorage.app",
  messagingSenderId: "395044124165",
  appId: "1:395044124165:web:a9bd0f9ab07a9b9a788e6c"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore
const db = getFirestore(app);

export { db };
