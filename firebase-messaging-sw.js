importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB8jn673zFuYRDhgzFd5yfZ-MP2XSXgyFg",
  authDomain: "cepterandevu-35fe4.firebaseapp.com",
  projectId: "cepterandevu-35fe4",
  storageBucket: "cepterandevu-35fe4.firebasestorage.app",
  messagingSenderId: "86298180836",
  appId: "1:86298180836:web:124c2004605d68b32700f1",
  measurementId: "G-CZ159MMEE3"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/al/icons/icon-192.png"
  });
});
