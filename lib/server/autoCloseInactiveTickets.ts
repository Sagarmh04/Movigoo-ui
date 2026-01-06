// lib/server/autoCloseInactiveTickets.ts
// SERVER-ONLY: Auto-close inactive support tickets after 7 days
// ⚠️ This file must ONLY be imported in API routes / server code / scheduled jobs

import { getFirestore, collection, query, where, getDocs, updateDoc, doc, Timestamp } from "firebase/firestore";
import { initializeApp, getApps } from "firebase/app";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

function getFirebaseApp() {
  if (getApps().length === 0) {
    return initializeApp(firebaseConfig);
  }
  return getApps()[0];
}

export async function autoCloseInactiveTickets() {
  console.log("========================================");
  console.log("🔄 AUTO-CLOSE INACTIVE TICKETS - START");
  console.log("========================================");

  try {
    const app = getFirebaseApp();
    const firestore = getFirestore(app);

    // Calculate 7 days ago
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const sevenDaysAgoTimestamp = Timestamp.fromDate(sevenDaysAgo);

    console.log("📅 Checking tickets updated before:", sevenDaysAgo.toISOString());

    // Query for tickets that are OPEN or IN_PROGRESS and haven't been updated in 7 days
    const ticketsRef = collection(firestore, "supportTickets");
    
    // Query for OPEN tickets
    const openQuery = query(
      ticketsRef,
      where("status", "==", "OPEN"),
      where("updatedAt", "<", sevenDaysAgoTimestamp)
    );

    // Query for IN_PROGRESS tickets
    const inProgressQuery = query(
      ticketsRef,
      where("status", "==", "IN_PROGRESS"),
      where("updatedAt", "<", sevenDaysAgoTimestamp)
    );

    const [openSnapshot, inProgressSnapshot] = await Promise.all([
      getDocs(openQuery),
      getDocs(inProgressQuery),
    ]);

    const allTickets = [...openSnapshot.docs, ...inProgressSnapshot.docs];
    console.log(`📊 Found ${allTickets.length} inactive tickets`);

    let closedCount = 0;
    let skippedCount = 0;

    for (const ticketDoc of allTickets) {
      const ticketData = ticketDoc.data();
      const ticketId = ticketDoc.id;

      // Check if there are any admin/support replies
      let hasAdminReply = Boolean(ticketData.adminResponse);

      if (!hasAdminReply && Array.isArray(ticketData.messages)) {
        hasAdminReply = ticketData.messages.some(
          (msg: any) => msg?.senderType === "support" || msg?.senderType === "admin"
        );
      }

      if (!hasAdminReply) {
        try {
          const messagesSnap = await getDocs(collection(firestore, "supportTickets", ticketId, "messages"));
          hasAdminReply = messagesSnap.docs.some((d) => {
            const msg: any = d.data();
            return msg?.senderType === "support" || msg?.senderType === "admin";
          });
        } catch (err) {
          console.warn(`⚠️  Failed to read messages subcollection for ticket ${ticketId}:`, err);
        }
      }

      if (hasAdminReply) {
        console.log(`⏭️  Skipping ticket ${ticketId} - has admin reply`);
        skippedCount++;
        continue;
      }

      // Close the ticket silently (no chat message)
      await updateDoc(doc(firestore, "supportTickets", ticketId), {
        status: "CLOSED",
        updatedAt: Timestamp.now(),
      });

      console.log(`✅ Auto-closed ticket ${ticketId}`);
      closedCount++;
    }

    console.log("========================================");
    console.log(`✅ AUTO-CLOSE COMPLETE`);
    console.log(`   Closed: ${closedCount}`);
    console.log(`   Skipped: ${skippedCount}`);
    console.log("========================================");

    return {
      success: true,
      closedCount,
      skippedCount,
      totalProcessed: allTickets.length,
    };
  } catch (error: any) {
    console.error("❌ AUTO-CLOSE FAILED:", error.message);
    console.error("❌ Error details:", error);
    return {
      success: false,
      error: error.message,
      closedCount: 0,
      skippedCount: 0,
      totalProcessed: 0,
    };
  }
}
