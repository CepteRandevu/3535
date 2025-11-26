// /al/js/push-init.js

import { getApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import {
  getMessaging,
  getToken,
  onMessage
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging.js";

// Firebase app instance
let app;
try {
  app = getApp();
} catch (e) {
  console.warn("Firebase app bulunamadı:", e);
  return;
}

const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Service worker kaydı
navigator.serviceWorker.register('/al/firebase-messaging-sw.js')
  .then(reg => console.log("SW kayıt:", reg.scope))
  .catch(err => console.error("SW kayıt hatası:", err));

// Kullanıcıya push kur
async function setupPushForUser(user) {
  try {
    // Tarayıcı desteği
    if (!("Notification" in window)) {
      console.log("Bildirim yok.");
      return;
    }

    // İzin iste
    const perm = await Notification.requestPermission();
    if (perm !== "granted") {
      console.log("Bildirim reddedildi.");
      return;
    }

    const reg = await navigator.serviceWorker.ready;

    // Token al
    const token = await getToken(messaging, {
      vapidKey: "BHz_LvVX9Y9cQxHWZOYLX-YscxL6gItx9sQetA8uJurvn8aAXA3t9K2TYwvr2_xG3jg19P5y2aXLhENWbCBx_Pc",
      serviceWorkerRegistration: reg
    });

    if (!token) {
      console.log("Token alınamadı.");
      return;
    }

    console.log("Alınan Token:", token);

    // Kullanıcı işletme mi müşteri mi?
    let collection = "userPushTokens";
    let role = "user";

    const bizSnap = await getDoc(doc(db, "businesses", user.uid));
    if (bizSnap.exists()) {
      collection = "businessTokens"; // **DOĞRU KOLEKSİYON**
      role = "business";
    }

    // Token kaydet
    await setDoc(doc(db, collection, user.uid), {
      token: token,
      updatedAt: Date.now(),
      role: role,
      phone: user.phoneNumber || null
    });

    console.log("Token Firestore'a kaydedildi →", collection);

  } catch (err) {
    console.error("Push hata:", err);
  }
}

// Login kontrolü
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Push için kullanıcı:", user.uid);
    setupPushForUser(user);
  } else {
    console.log("Login yok → push yok");
  }
});

// Açıkken gelen bildirimler
onMessage(messaging, (payload) => {
  console.log("Ön planda bildirim:", payload);
});
