// js/login.js
import { db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

const loginForm = document.getElementById("loginForm");
const statusText = document.getElementById("loginStatus");

if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("username").value.trim();
    const password = document.getElementById("password").value.trim();

    statusText.textContent = "Checking credentials...";

    try {
      // Find user with this username
      const q = query(collection(db, "users"), where("username", "==", username));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        statusText.textContent = "No user found with that username.";
        return;
      }

      let matchedUser = null;
      snapshot.forEach((doc) => {
        const user = doc.data();
        if (user.password === password) {
          matchedUser = { id: doc.id, ...user };
        }
      });

      if (!matchedUser) {
        statusText.textContent = "Incorrect password.";
        return;
      }

      // Store login info in localStorage
      localStorage.setItem(
        "currentUser",
        JSON.stringify({
          uid: matchedUser.id,
          username: matchedUser.username,
          role: matchedUser.role,
          firstName: matchedUser.firstName,
          lastName: matchedUser.lastName,
          location: matchedUser.location,
        })
      );

      statusText.textContent = "Login successful! Redirecting...";

      // Redirect based on role
      if (matchedUser.role === "admin") {
        window.location.href = "admin.html";
      } else if (matchedUser.role === "communicator") {
        window.location.href = "communicator.html";
      } else {
        statusText.textContent = "Unknown role — contact admin.";
      }
    } catch (error) {
      console.error("Login error:", error);
      statusText.textContent = "Error during login. Check console.";
    }
  });
}

// Auto-redirect if already logged in
const existingUser = localStorage.getItem("currentUser");
if (existingUser) {
  const user = JSON.parse(existingUser);
  if (user.role === "admin") {
    window.location.href = "admin.html";
  } else if (user.role === "communicator") {
    window.location.href = "communicator.html";
  }
}
