const functions = require("firebase-functions");
const admin = require("firebase-admin");

admin.initializeApp();

exports.onUserDeleted = functions.auth.user().onDelete(async (user) => {
  const {uid} = user;
  const db = admin.firestore();
  const appId = "1:223074033822:web:ffa2fbb7d6df9b51e85b8f";


  console.log(`User with UID ${uid} is being deleted. Cleaning up data.`);

  try {
    // Find the username document associated with this user ID
    const usernamesRef =
      db.collection(`artifacts/${appId}/public/data/usernames`);
    const q = usernamesRef.where("userId", "==", uid);
    const querySnapshot = await q.get();

    if (querySnapshot.empty) {
      console.log(`No username document found for user ${uid}.`);
      return;
    }

    // Delete the found username document(s)
    const batch = db.batch();
    querySnapshot.forEach((doc) => {
      console.log(`Deleting username document: ${doc.id}`);
      batch.delete(doc.ref);
    });

    await batch.commit();
    console.log(`Successfully cleaned up username for user ${uid}.`);
  } catch (error) {
    console.error(`Error cleaning up data for user ${uid}:`, error);
  }
});
