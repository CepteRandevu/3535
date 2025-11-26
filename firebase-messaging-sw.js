// Firebase Messaging Service Worker
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

// Senin config’in
firebase.initializeApp({
  apiKey: "AIzaSy... senin config",
  authDomain: "cepterandevu-35fe4.firebaseapp.com",
  projectId: "cepterandevu-35fe4",
  storageBucket: "cepterandevu-35fe4.appspot.com",
  messagingSenderId: "186298180836",
  appId: "1:186298180836:web:124c004605d638230701"
});

const messaging = firebase.messaging();

// Arka planda bildirim işleme
messaging.onBackgroundMessage((payload) => {
  console.log("[SW] Arka plan bildirimi geldi", payload);

  self.registration.showNotification(
    payload.notification.title,
    {
      body: payload.notification.body,
      icon: "/al/icon.png",
      badge: "/al/badge.png"
    }
  );
});
