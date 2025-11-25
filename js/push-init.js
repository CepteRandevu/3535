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

let app;
try {
  // Sayfa zaten initializeApp çağırıyor (business-appointments vs.)
  app = getApp();
} catch (e) {
  console.warn("Firebase app bulunamadı, push init atlanıyor:", e);
  // Bu sayfada Firebase yoksa push çalışmayacak, ama sayfa da bozulmayacak.
  return;
}

const auth = getAuth(app);
const db = getFirestore(app);
const messaging = getMessaging(app);

// Service worker kaydı
navigator.serviceWorker.register('/al/firebase-messaging-sw.js')
  .then(reg => {
    console.log('Service worker kayıtlı:', reg.scope);
  })
  .catch(err => {
    console.error('Service worker kaydı hatası:', err);
  });

async function setupPushForUser(user) {
  try {
    if (!("Notification" in window)) {
      console.log("Tarayıcı bildirim desteklemiyor.");
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
      console.log("Bildirim izni verilmedi:", permission);
      return;
    }

    const registration = await navigator.serviceWorker.ready;

    const currentToken = await getToken(messaging, {
      vapidKey: "BHz_LvVX9Y9cQxHWZOYLX-YscxL6gItx9sQetA8uJurvn8aAXA3t9K2TYwvr2_xG3jg19P5y2aXLhENWbCBx_Pc",
      serviceWorkerRegistration: registration,
    });

    if (!currentToken) {
      console.log("FCM token alınamadı");
      return;
    }

    console.log("FCM token:", currentToken);

    // Kullanıcının işletme mi, müşteri mi olduğunu tespit et
    let collectionName = "userPushTokens"; // default müşteri
    let role = "user";

    try {
      const bizRef = doc(db, "businesses", user.uid);
      const bizSnap = await getDoc(bizRef);
      if (bizSnap.exists()) {
        collectionName = "businessPushTokens";
        role = "business";
      }
    } catch (e) {
      console.error("Rol kontrolü hata:", e);
    }

    await setDoc(doc(db, collectionName, user.uid), {
      token: currentToken,
      role,
      updatedAt: Date.now(),
      phone: user.phoneNumber || null
    });

    console.log("Token Firestore'a kaydedildi:", collectionName);

  } catch (err) {
    console.error("Push kurulurken hata:", err);
  }
}

// Kullanıcı login ise global push ayarla
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Push için login kullanıcı:", user.uid);
    setupPushForUser(user);
  } else {
    console.log("Login yok, push kurulmayacak.");
  }
});

// Site açıkken gelen bildirimler (foreground)
onMessage(messaging, (payload) => {
  console.log("Ön planda bildirim:", payload);

  // İstersen sonra burada toast / modal vs yaparsın
  // alert(payload.notification?.title + " - " + payload.notification?.body);
});
