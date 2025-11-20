// scripts/app.js
// Firebase config + temel yardımcılar

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// !!! BURAYI KENDİ PROJENE GÖRE DOLDUR !!!
const firebaseConfig = {
  apiKey: "SENIN_API_KEY",
  authDomain: "SENIN_PROJE.firebaseapp.com",
  projectId: "SENIN_PROJE",
  storageBucket: "SENIN_PROJE.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Init
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Ortak helper fonksiyonlar

async function registerUser(email, password, profileData = {}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  await setDoc(doc(db, "users", uid), {
    uid,
    role: "user",
    createdAt: serverTimestamp(),
    ...profileData
  });

  return cred.user;
}

async function registerBusiness(email, password, profileData = {}) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const uid = cred.user.uid;

  await setDoc(doc(db, "businesses", uid), {
    uid,
    role: "business",
    createdAt: serverTimestamp(),
    isApproved: false,
    ...profileData
  });

  return cred.user;
}

async function loginUser(email, password) {
  const cred = await signInWithEmailAndPassword(auth, email, password);
  return cred.user;
}

async function logoutUser() {
  await signOut(auth);
}

function watchAuth(callback) {
  return onAuthStateChanged(auth, callback);
}

export {
  app,
  auth,
  db,
  registerUser,
  registerBusiness,
  loginUser,
  logoutUser,
  watchAuth,
  // Firestore export
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  serverTimestamp
};
