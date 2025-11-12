// js/communicator.js

import { db } from "./firebase-config.js";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

 

// ---------- ELEMENTS ----------
const currentUser = (JSON.parse(localStorage.getItem("currentUser")));
const greeting = document.getElementById("greeting");
const usernameDisplay = document.getElementById("usernameDisplay");
const dateDisplay = document.getElementById("dateDisplay");
const logoutBtn = document.getElementById("logoutBtn");
const form = document.getElementById("transactionForm");
const transactionsContainer = document.getElementById("transactionsContainer");
const apiRateInfo = document.getElementById("apiRateInfo");

// ---------- PROTECT ROUTE ----------
if (!currentUser) window.location.href = "login.html";

// ---------- INIT UI ----------
greeting.textContent = `Welcome, ${currentUser.firstName + " "+ currentUser.lastName}!`;
usernameDisplay.textContent = currentUser.username;
dateDisplay.textContent = new Date().toDateString();

// ---------- LOGOUT ----------
logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

// ---------- FETCH LIVE API RATE ----------
let currentApiRate = null;
async function fetchApiRate() {
  try {
    const res = await fetch("https://api.exchangerate-api.com/v4/latest/SAR");
    const data = await res.json();
    // Example: convert SAR → PKR
    currentApiRate = data.rates.PKR.toFixed(2);
    apiRateInfo.textContent = `Live API Rate: 1 SAR = ${currentApiRate} PKR`;
  } catch (err) {
    console.error("Error fetching API rate:", err);
    apiRateInfo.textContent = "Unable to fetch live rate";
  }
}
fetchApiRate();

// ---------- SEND TRANSACTION ----------
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const receiverUsername = form.receiverUsername.value.trim();
  const amountSent = parseFloat(form.amountSent.value);
  const rate = parseFloat(form.rate.value);
  const apiRate = currentApiRate || null;
  const message = form.message.value.trim();

  if (!receiverUsername || isNaN(amountSent) || isNaN(rate)) {
    alert("Please fill all required fields correctly!");
    return;
  }

  const transaction = {
    senderUsername: currentUser.username,
    receiverUsername,
    amountSent,
    rate,
    apiRate,
    message,
    createdAt: new Date().toISOString()
  };

  try {
    await addDoc(collection(db, "transactions"), transaction);
    form.reset();
    loadTransactions();
  } catch (error) {
    console.error("Error adding transaction:", error);
    alert("Failed to send transaction.");
  }
});

// ---------- LOAD TRANSACTIONS ----------
async function loadTransactions() {
  transactionsContainer.innerHTML = "";

  try {
    const q1 = query(collection(db, "transactions"), where("senderUsername", "==", currentUser.username));
    const q2 = query(collection(db, "transactions"), where("receiverUsername", "==", currentUser.username));

    const [sentSnap, receivedSnap] = await Promise.all([getDocs(q1), getDocs(q2)]);
    const transactions = [];

    sentSnap.forEach((docSnap) =>
      transactions.push({ id: docSnap.id, ...docSnap.data(), type: "sent" })
    );
    receivedSnap.forEach((docSnap) =>
      transactions.push({ id: docSnap.id, ...docSnap.data(), type: "received" })
    );

    transactions.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    transactions.forEach(renderTransaction);
  } catch (error) {
    console.error("Error loading transactions:", error);
  }
}

// ---------- RENDER SINGLE TRANSACTION ----------
function renderTransaction(tx) {
  const card = document.createElement("div");
  card.className = `transaction-card ${tx.type}`;
  card.innerHTML = `
    <h4>${tx.type === "sent" ? `To: ${tx.receiverUsername}` : `From: ${tx.senderUsername}`}</h4>
    <p><strong>Amount:</strong> ${tx.amountSent}</p>
    <p><strong>Rate:</strong> ${tx.rate}</p>
    <p><strong>API Rate:</strong> ${tx.apiRate ?? "N/A"}</p>
    ${tx.message ? `<p><em>${tx.message}</em></p>` : ""}
    <small>${new Date(tx.createdAt).toLocaleString()}</small>
    <button class="pdf-btn">PDF</button>
  `;

  card.querySelector(".pdf-btn").addEventListener("click", () => downloadPDF(tx));
  transactionsContainer.appendChild(card);
}

// ---------- PDF DOWNLOAD ----------
function downloadPDF(tx) {
  if (!window.jsPDF) {
    alert("PDF library not available!");
    return;
  }

  const doc = new window.jsPDF();

  doc.text("Transaction Receipt", 20, 20);
  doc.text(`Transaction ID: ${tx.id}`, 20, 30);
  doc.text(`Sender: ${tx.senderUsername}`, 20, 40);
  doc.text(`Receiver: ${tx.receiverUsername}`, 20, 50);
  doc.text(`Amount Sent: ${tx.amountSent}`, 20, 60);
  doc.text(`Rate: ${tx.rate}`, 20, 70);
  doc.text(`API Rate: ${tx.apiRate ?? "N/A"}`, 20, 80);
  doc.text(`Message: ${tx.message || ""}`, 20, 90);
  doc.text(`Created At: ${new Date(tx.createdAt).toLocaleString()}`, 20, 100);

  window.open(doc.output('bloburl'), '_blank');

}

// ---------- INITIAL LOAD ----------
loadTransactions();
