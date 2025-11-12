// js/admin.js
import { db } from "./firebase-config.js";
import {
    collection,
    addDoc,
    getDocs,
    updateDoc,
    doc,
    getDoc,
    orderBy,
    query
} from "https://www.gstatic.com/firebasejs/12.5.0/firebase-firestore.js";

//
//import { db } from "./firebase-config.js";
//import { orderBy, query } from "https://www.gstatic.com/firebasejs/10.4.0/firebase-firestore.js";

const currentUser = (JSON.parse(localStorage.getItem("currentUser")));

if(!currentUser || !(currentUser.role == "admin")){
     localStorage.removeItem("currentUser");
     window.location.href = "login.html";
}

console.log(currentUser.role);

async function loadAllTransactions() {
    const q = query(collection(db, "transactions"), orderBy("createdAt", "desc"));
    const snap = await getDocs(q);

    const transactions = [];
    snap.forEach(doc => transactions.push({ id: doc.id, ...doc.data() }));

    renderTransactions(transactions);
}

//


const createUserForm = document.getElementById("createUserForm");
const usersTableBody = document.getElementById("usersTableBody");
const editModal = document.getElementById("editModal");
const closeEditBtn = document.getElementById("closeEdit");
const saveEditBtn = document.getElementById("saveEditBtn");

// -------------------- Load All Users --------------------
async function loadUsers() {
    usersTableBody.innerHTML = "";
    const usersSnapshot = await getDocs(collection(db, "users"));

    if (usersSnapshot.empty) {
        usersTableBody.innerHTML = `<tr><td colspan="6" style="text-align:center;">No users found.</td></tr>`;
        return;
    }

    usersSnapshot.forEach((userDoc) => {
        const user = userDoc.data();
        const row = document.createElement("tr");


        if (user.role == "admin") {
            row.innerHTML = `
      <td>${user.firstName || ""}</td>
      <td>${user.lastName || ""}</td>
      <td>${user.role || ""}</td>
      <td>${user.location || ""}</td>
      <td>${user.createdAt || ""}</td>
      <td>
        <button class="btn small edit-btn" data-id="${userDoc.id}" disabled style = "background-color:#E0E0E0">Edit</button>
      </td>
    `;
        } else {
            row.innerHTML = `
      <td>${user.firstName || ""}</td>
      <td>${user.lastName || ""}</td>
      <td>${user.role || ""}</td>
      <td>${user.location || ""}</td>
      <td>${user.createdAt || ""}</td>
      <td>
        <button class="btn small edit-btn" data-id="${userDoc.id}" >Edit</button>
      </td>
    `;
        }
        usersTableBody.appendChild(row);
    });

    // Add edit event listeners
    document.querySelectorAll(".edit-btn").forEach((btn) =>
        btn.addEventListener("click", (e) => openEditModal(e.target.dataset.id))
    );
}

// -------------------- Create New User --------------------
if (createUserForm) {
    createUserForm.addEventListener("submit", async (e) => {
        e.preventDefault();

        const firstName = document.getElementById("firstname").value.trim();
        const lastName = document.getElementById("lastname").value.trim();
        const location = document.getElementById("location").value.trim();
        const username = document.getElementById("username").value.trim();
        const password = document.getElementById("password").value.trim();
        const role = document.getElementById("role").value.trim();

        if (!firstName || !lastName || !username || !password) {
            alert("Please fill all required fields!");
            return;
        }

        try {
            await addDoc(collection(db, "users"), {
                firstName,
                lastName,
                location,
                username,
                password,
                role,
                createdAt: new Date().toLocaleString(),
            });
            alert("User created successfully!");
            createUserForm.reset();
            loadUsers();
        } catch (error) {
            console.error("Error creating user:", error);
            alert("Failed to create user. Check console for details.");
        }
    });
}

// -------------------- Open Edit Modal --------------------
async function openEditModal(userId) {
    const firstnameField = document.getElementById("firstname_edit");
    const lastnameField = document.getElementById("lastname_edit");
    const usernameField = document.getElementById("username_edit");
    const passwordField = document.getElementById("password_edit");
    const locationField = document.getElementById("location_edit");
    const roleField = document.getElementById("role_edit");

    // Show modal
    editModal.classList.remove("hidden");

    // Get specific user data
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const data = userSnap.data();
        firstnameField.value = data.firstName || "";
        lastnameField.value = data.lastName || "";
        usernameField.value = data.username || "";
        passwordField.value = data.password || "";
        locationField.value = data.location || "";
        roleField.value = data.role || "";
        saveEditBtn.setAttribute("data-id", userId);
    } else {
        alert("User not found!");
    }
}

// -------------------- Save Edits --------------------
if (saveEditBtn) {
    saveEditBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        const userId = e.target.getAttribute("data-id");

        const firstName = document.getElementById("firstname_edit").value.trim();
        const lastName = document.getElementById("lastname_edit").value.trim();
        const password = document.getElementById("password_edit").value.trim();
        const location = document.getElementById("location_edit").value.trim();
        const role = document.getElementById("role_edit").value.trim();

        try {
            const userRef = doc(db, "users", userId);
            await updateDoc(userRef, {
                firstName,
                lastName,
                password,
                location,
                role,
            });
            alert("User updated successfully!");
            editModal.classList.add("hidden");
            loadUsers();
        } catch (error) {
            console.error("Error updating user:", error);
            alert("Failed to update user. Check console for details.");
        }
    });
}

// -------------------- Close Modal --------------------
if (closeEditBtn) {
    closeEditBtn.addEventListener("click", () => {
        editModal.classList.add("hidden");
    });
}

// Close modal when clicking outside
window.onclick = (event) => {
    if (event.target === editModal) {
        editModal.classList.add("hidden");
    }
};



function renderTransactions(transactions) {
    const tbody = document.querySelector("#transactionsTable tbody");
    tbody.innerHTML = "";

    transactions.forEach(tx => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
      <td>${tx.senderUsername}</td>
      <td>${tx.receiverUsername}</td>
      <td>${tx.amountSent}</td>
      <td>${tx.rate}</td>
      <td>${tx.apiRate ?? "N/A"}</td>
      <td>${tx.message || "-"}</td>
      <td>${new Date(tx.createdAt).toLocaleString()}</td>
      <td><button class="pdf-btn" data-id="${tx.id}">PDF</button></td>
    `;

        tr.querySelector(".pdf-btn").addEventListener("click", () => downloadPDF(tx));
        tbody.appendChild(tr);
    });
}


function downloadPDF(tx) {
    const { jsPDF } = window.jspdf;
    if (!jsPDF) {
        alert("PDF library not loaded!");
        return;
    }

    const doc = new jsPDF();

    doc.setFont("helvetica", "bold");
    doc.text("Transaction Report", 20, 20);

    doc.setFont("helvetica", "normal");
    doc.text(`Transaction ID: ${tx.id}`, 20, 35);
    doc.text(`Sender: ${tx.senderUsername}`, 20, 45);
    doc.text(`Receiver: ${tx.receiverUsername}`, 20, 55);
    doc.text(`Amount Sent: ${tx.amountSent}`, 20, 65);
    doc.text(`Rate: ${tx.rate}`, 20, 75);
    doc.text(`API Rate: ${tx.apiRate ?? "N/A"}`, 20, 85);
    doc.text(`Message: ${tx.message || "—"}`, 20, 95);
    doc.text(`Timestamp: ${new Date(tx.createdAt).toLocaleString()}`, 20, 105);

    window.open(doc.output('bloburl'), '_blank');
}


// -------------------- Initial Load --------------------
loadUsers();
loadAllTransactions();


document.getElementById("searchInput").addEventListener("input", (e) => {
    const term = e.target.value.toLowerCase();
    document.querySelectorAll("#transactionsTable tbody tr").forEach(tr => {
        const text = tr.textContent.toLowerCase();
        tr.style.display = text.includes(term) ? "" : "none";
    });
});

let logoutBtn = document.getElementById("btnSignOut");

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("currentUser");
  window.location.href = "login.html";
});

