// scripts/messaging.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getMessaging, getToken } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";
import { getFirestore, doc, updateDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyB8jn673zFuYRDhgzFd5yfZ-MP2XSXgyFg",
    authDomain: "cepterandevu-35fe4.firebaseapp.com",
    projectId: "cepterandevu-35fe4",
    messagingSenderId: "86298180836",
    appId: "1:86298180836:web:ab05fbb0dcfbb56b2700f1"
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
const auth = getAuth(app);
const db = getFirestore(app);

// Senden aldığım VAPID KEY:
const vapidKey = "BHz_LvVX9Y9cQxHWZOYLX-YscxL6gItx9sQetA8uJurvn8aAXA3t9K2TYwvr2_xG3jg19P5y2aXLhENWbCBx_Pc";

// İşletme giriş yapınca token alınır
onAuthStateChanged(auth, async (user) => {
    if (!user) return;

    try {
        const permission = await Notification.requestPermission();

        if (permission !== "granted") {
            console.warn("Bildirim izni verilmedi.");
            return;
        }

        const token = await getToken(messaging, { vapidKey });

        if (token) {
            console.log("Messaging Token:", token);

            await updateDoc(doc(db, "businesses", user.uid), {
                messagingToken: token
            });

            console.log("Token Firestore'a kaydedildi.");
        }

    } catch (e) {
        console.error("Token alınamadı:", e);
    }
});
