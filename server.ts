import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import webpush from "web-push";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, query, where, onSnapshot, getDocs, getDoc, doc } from "firebase/firestore";
import "dotenv/config";

import firebaseConfig from "./firebase-applet-config.json" assert { type: "json" };
 
 // Initialize Firebase
 const appFirebase = initializeApp(firebaseConfig);
 const db = getFirestore(appFirebase, firebaseConfig.firestoreDatabaseId);

// VAPID keys setup
const publicKey = process.env.VITE_VAPID_PUBLIC_KEY || "BG8fofx4_yG3hY8hYhB4S4V_Dq6K_9E9S2I7U5W6h3U7P5X6R5S6T7U8V9W0X1Y2Z3A4B5C6D7E8F9G";
const privateKey = process.env.VAPID_PRIVATE_KEY;

if (!privateKey) {
  console.error("CRITICAL: VAPID_PRIVATE_KEY is missing. Background notifications will fail.");
  console.log("Please generate VAPID keys and set VAPID_PRIVATE_KEY in your environment variables.");
  // We can't really function without it, but we won't crash the server
} else {
  webpush.setVapidDetails(
    "mailto:payments@haybolbay.com",
    publicKey,
    privateKey
  );
}

async function startServer() {
  const app = express();
  const PORT = process.env.PORT || 3000;

// app.listen(PORT, () => {
//    console.log(`Server running on http://localhost:${PORT}`);
// });

  app.use(express.json());

  // API: Subscribe for push notifications
  app.post("/api/push/subscribe", async (req, res) => {
    const subscription = req.body;
    // Client should send { subscription, userId }
    // We'll trust the userId for this MVP, but IRL you'd verify JWT
    res.status(201).json({});
    console.log("New push subscription received");
  });

  // Background Listener for New Bookings
  // This listener runs on the server and survives browser closing
  let isInitial = true;
  const q = query(collection(db, "bookings"), where("status", "==", "request"));
  onSnapshot(q, async (snapshot) => {
    if (isInitial) {
      isInitial = false;
      return;
    }

    snapshot.docChanges().forEach(async (change) => {
      if (change.type === "added") {
        const jobData = change.doc.data();
        const jobId = change.doc.id;
        
        console.log(`Server: New job ${jobId} detected. Sending background push...`);

        // Fetch all cleaner subscriptions from Firestore
        try {
            const subsSnap = await getDocs(collection(db, "push_subscriptions"));
            
            // Use customerAddress from job document
            const address = jobData.customerAddress || "Address not specified";

            const payload = JSON.stringify({
              title: "🏠 New Job Alert!",
              body: `📍 ${address}\n📅 ${jobData.date} at ${jobData.time}`,
              jobId: jobId
            });

            subsSnap.forEach((doc) => {
              const sub = doc.data().subscription;
              webpush.sendNotification(sub, payload).catch(err => {
                  console.error("Error sending push:", err);
                  // Optionally clean up expired subscriptions
              });
            });
        } catch (e) {
            console.error("Failed to send background pushes:", e);
        }
      }
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
