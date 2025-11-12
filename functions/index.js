// functions/index.js
const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const db = admin.firestore();

/**
 * Cloud Function: createUserWithRole
 * Triggered by HTTPS call (from Admin Dashboard)
 * Creates a new Auth user and stores their role in Firestore.
 */
exports.createUserWithRole = functions.https.onCall(async (data, context) => {
  try {
    // Only allow if the caller is an admin (optional: check role later)
    const { email, password, firstname, lastname, location, role } = data;

    // Create user in Firebase Auth
    const userRecord = await admin.auth().createUser({
      email,
      password,
      displayName: `${firstname} ${lastname}`,
    });

    // Store details in Firestore
    await db.collection("users").doc(userRecord.uid).set({
      firstname,
      lastname,
      location,
      email,
      role,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true, uid: userRecord.uid };
  } catch (error) {
    console.error("Error creating user:", error);
    throw new functions.https.HttpsError("internal", error.message);
  }
});
