// js/auth.js
import { db } from './firebase-config.js';
import { collection, query, where, getDocs } from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const loginForm = document.getElementById('loginForm');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorText = document.getElementById('error');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    try {
        // Query Firestore for matching email and password
        const q = query(
            collection(db, "users"),
            where("email", "==", email),
            where("password", "==", password)
        );

        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            const userData = userDoc.data();

            console.log("Logged in as:", userData.name || userData.email);
            console.log("Role:", userData.role);

            // Redirect based on role
            if (userData.role === "admin") {
                window.location.href = "admin.html";
            } else if (userData.role === "communicator") {
                window.location.href = "dashboard.html";
            } else {
                errorText.textContent = "Unknown role. Please contact admin.";
            }

        } else {
            errorText.textContent = "Invalid email or password.";
        }

    } catch (err) {
        console.error("Login error:", err);
        errorText.textContent = "An error occurred during login.";
    }
});
