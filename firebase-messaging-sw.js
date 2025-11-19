importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js");
importScripts("https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js");

firebase.initializeApp({
  apiKey: "AIzaSyB8jn673zFuYRDhgzFd5yfZ-MP2XSXgyFg",
  authDomain: "cepterandevu-35fe4.firebaseapp.com",
  projectId: "cepterandevu-35fe4",
  messagingSenderId: "86298180836",
  appId: "1:86298180836:web:ab05fbb0dcfbb56b2700f1"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(
    payload.notification.title,
    payload.notification
  );
});
