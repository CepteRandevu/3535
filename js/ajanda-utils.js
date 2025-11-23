/* ============================================================
   AJANDA UTILS — PERFORMANS + CACHE + FIREBASE HELPER
   ============================================================ */

import {
  collection, query, where, getDocs, addDoc,
  deleteDoc, doc
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

export const AgendaUtils = {

  /* ----------------------------------------------------
     1) CACHE YAPISI
     ---------------------------------------------------- */
  cache: {
    monthKey: null,       // "2025-02"
    apptsByDay: {},       // "2025-02-14" : [appointments...]
    workHours: [],
    businessID: null
  },

  /* ----------------------------------------------------
     2) AYLIK RANDEVULARI YÜKLE (1 defa!)
     ---------------------------------------------------- */
  async loadMonth(db, businessID, dateObj) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth() + 1;
    const key = `${year}-${String(month).padStart(2, "0")}`;

    // Aynı ayı tekrar yükleme
    if (this.cache.monthKey === key) return;

    this.cache.monthKey = key;
    this.cache.businessID = businessID;
    this.cache.apptsByDay = {};

    const start = `${key}-01`;
    const end = `${key}-31`;

    const qRef = query(
      collection(db, "appointments"),
      where("businessID", "==", businessID),
      where("date", ">=", start),
      where("date", "<=", end)
    );

    const snap = await getDocs(qRef);

    snap.forEach(docSnap => {
      const ap = { id: docSnap.id, ...docSnap.data() };
      if (!this.cache.apptsByDay[ap.date]) {
        this.cache.apptsByDay[ap.date] = [];
      }
      this.cache.apptsByDay[ap.date].push(ap);
    });
  },

  /* ----------------------------------------------------
     3) GÜN RANDEVULARI (cache üzerinden)
     ---------------------------------------------------- */
  getAppointmentsForDay(dateStr) {
    return this.cache.apptsByDay[dateStr] || [];
  },

  /* ----------------------------------------------------
     4) SAAT DOLULUK KONTROLÜ
     ---------------------------------------------------- */
  isHourBusy(dateStr, time) {
    const list = this.cache.apptsByDay[dateStr] || [];
    return list.some(a => a.time === time);
  },

  /* ----------------------------------------------------
     5) RANDEVU EKLE (cache + DB sync)
     ---------------------------------------------------- */
  async addAppointment(db, data) {
    const ref = await addDoc(collection(db, "appointments"), data);

    // Cache’de olmayan güne push
    if (!this.cache.apptsByDay[data.date]) {
      this.cache.apptsByDay[data.date] = [];
    }

    this.cache.apptsByDay[data.date].push({
      id: ref.id,
      ...data
    });

    return ref.id;
  },

  /* ----------------------------------------------------
     6) RANDEVU SİL (cache + DB sync)
     ---------------------------------------------------- */
  async deleteAppointment(db, id, dateStr) {
    await deleteDoc(doc(db, "appointments", id));

    if (this.cache.apptsByDay[dateStr]) {
      this.cache.apptsByDay[dateStr] =
        this.cache.apptsByDay[dateStr].filter(a => a.id !== id);
    }
  },

  /* ----------------------------------------------------
     7) TAKVİM GÜN LİSTESİ OLUŞTUR
     ---------------------------------------------------- */
  generateMonthDays(dateObj) {
    const year = dateObj.getFullYear();
    const month = dateObj.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);

    const startOffset = first.getDay() === 0 ? 6 : first.getDay() - 1;

    const days = [];

    // Boş hücreler
    for (let i = 0; i < startOffset; i++) {
      days.push({ type: "empty" });
    }

    // Gerçek günler
    for (let day = 1; day <= last.getDate(); day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      days.push({
        type: "day",
        day,
        dateStr
      });
    }

    return days;
  },

  /* ----------------------------------------------------
     8) TEK HÜCRE RENDER (PC görünüm için)
     ---------------------------------------------------- */
  patchDayCell(cellEl, dateStr) {
    cellEl.querySelector(".slots")?.remove();

    const appts = this.getAppointmentsForDay(dateStr);
    if (appts.length === 0) return;

    const wrap = document.createElement("div");
    wrap.className = "slots";

    appts.forEach(ap => {
      const slot = document.createElement("div");
      slot.className = "slot";
      slot.textContent = `${ap.time} — ${ap.customerName || "-"}`;
      slot.dataset.apptId = ap.id;
      wrap.appendChild(slot);
    });

    cellEl.appendChild(wrap);
  },

  /* ----------------------------------------------------
     9) GÜNCEL SAAT LİSTESİ (mobil görünüm için)
     ---------------------------------------------------- */
  getDayHourList(dateStr) {
    const result = [];

    this.cache.workHours.forEach(h => {
      result.push({
        time: h,
        busy: this.isHourBusy(dateStr, h),
        appt: this.getAppointmentsForDay(dateStr)
               .find(a => a.time === h) || null
      });
    });

    return result;
  },

  /* ----------------------------------------------------
     10) TARİH FORMAT
     ---------------------------------------------------- */
  formatDateHuman(dateStr) {
    return new Date(dateStr)
      .toLocaleDateString("tr-TR", { weekday: "long", day: "numeric", month: "long" });
  }
};
