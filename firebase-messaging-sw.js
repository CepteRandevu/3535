// /al/firebase-messaging-sw.js

// Compat kullanıyoruz çünkü service worker tarafında ES module çok dertli.
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB8jn673zFuYRDhgzFd5yfZ-MP2XSXgyFg",
  authDomain: "cepterandevu-35fe4.firebaseapp.com",
  projectId: "cepterandevu-35fe4",
  storageBucket: "cepterandevu-35fe4.firebasestorage.app",
  messagingSenderId: "86298180836",
  appId: "1:86298180836:web:124c2004605d68b32700f1"
});

const messaging = firebase.messaging();

// Arka planda gelen bildirimler
messaging.onBackgroundMessage((payload) => {
  console.log("[firebase-messaging-sw.js] Background message:", payload);

  const notificationTitle = payload.notification?.title || "Cepterandevu";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/al/icons/icon-192.png", // Yoksa da sorun değil, sadece logoda boş kalır
    data: payload.data || {}
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Bildirime tıklama
self.addEventListener("notificationclick", function(event) {
  event.notification.close();

  const urlToOpen = event.notification.data?.click_action || "/al/";

  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then(function(clientList) {
      for (const client of clientList) {
        if (client.url.includes("/al/") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen);
      }
    })
  );
});
