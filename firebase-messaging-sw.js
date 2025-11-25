// firebase-messaging-sw.js

importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// BURAYA kendi firebaseConfig'ini koy
firebase.initializeApp({
  apiKey: "AIzaSyB8jn673zFuYRDhgzFd5yfZ-MP2XSXgyFg",
  authDomain: "cepterandevu-35fe4.firebaseapp.com",
  projectId: "cepterandevu-35fe4",
  storageBucket: "cepterandevu-35fe4.firebasestorage.app",
  messagingSenderId: "86298180836",
  appId: "1:86298180836:web:124c2004605d68b32700f1"
});

const messaging = firebase.messaging();

// Arka planda (site kapalıyken) gelen bildirimler
messaging.onBackgroundMessage(function (payload) {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notificationTitle = payload.notification?.title || "Bildirim";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/icon-192.png" // varsa küçük ikon (yoksa sil)
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});
