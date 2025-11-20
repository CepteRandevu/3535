// scripts/main.js
import {
  auth,
  db,
  registerUser,
  registerBusiness,
  loginUser,
  logoutUser,
  watchAuth,
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
} from "./app.js";

// Küçük yardımcılar
function qs(sel) {
  return document.querySelector(sel);
}
function qsa(sel) {
  return Array.from(document.querySelectorAll(sel));
}
function setLoading(btn, isLoading) {
  if (!btn) return;
  if (isLoading) {
    btn.dataset.originalText = btn.textContent;
    btn.textContent = "İşleniyor...";
    btn.disabled = true;
  } else {
    if (btn.dataset.originalText) {
      btn.textContent = btn.dataset.originalText;
    }
    btn.disabled = false;
  }
}

// URL param okuyucu
function getParam(name) {
  const url = new URL(window.location.href);
  return url.searchParams.get(name);
}

// Basit redirect
function go(path) {
  window.location.href = path;
}

// === SAYFA ROUTER ===
document.addEventListener("DOMContentLoaded", () => {
  const page = document.body.dataset.page;

  switch (page) {
    case "landing":
      initLandingPage();
      break;

    // User
    case "user-login":
      initUserLogin();
      break;
    case "user-register":
      initUserRegister();
      break;
    case "user-home":
      initUserHome();
      break;
    case "user-profile":
      initUserProfile();
      break;
    case "user-business-list":
      initUserBusinessList();
      break;
    case "user-business-detail":
      initUserBusinessDetail();
      break;
    case "user-booking":
      initUserBooking();
      break;
    case "user-my-appointments":
      initUserAppointments();
      break;
    case "user-notifications":
      initUserNotifications();
      break;
    case "user-review":
      initUserReview();
      break;

    // Business
    case "business-auth":
      initBusinessAuth();
      break;
    case "business-dashboard":
      initBusinessDashboard();
      break;
    case "business-services":
      initBusinessServices();
      break;
    case "business-workers":
      initBusinessWorkers();
      break;
    case "business-settings":
      initBusinessSettings();
      break;
    case "business-notifications":
      initBusinessNotifications();
      break;
  }
});

/* ========== LANDING ========== */
function initLandingPage() {
  const userBtn = qs("#landingUser");
  const businessBtn = qs("#landingBusiness");

  if (userBtn) {
    userBtn.addEventListener("click", () =>
      go("./pages/user/user-login.html")
    );
  }
  if (businessBtn) {
    businessBtn.addEventListener("click", () =>
      go("./pages/business/business-auth.html")
    );
  }
}

/* ========== USER: LOGIN ========== */
function initUserLogin() {
  const form = qs("#loginForm");
  const alertBox = qs("#loginAlert");
  const btn = qs("#loginBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.textContent = "";
    alertBox.className = "alert";
    const email = form.email.value.trim();
    const password = form.password.value.trim();
    if (!email || !password) return;

    try {
      setLoading(btn, true);
      const user = await loginUser(email, password);
      const snap = await getDoc(doc(db, "users", user.uid));
      const data = snap.data();
      if (!data || data.role !== "user") {
        await logoutUser();
        throw new Error("Bu hesap müşteri hesabı değil.");
      }
      go("./user-home.html");
    } catch (err) {
      alertBox.textContent = err.message || "Giriş başarısız.";
      alertBox.classList.add("alert-error");
    } finally {
      setLoading(btn, false);
    }
  });

  qs("#goRegister")?.addEventListener("click", () =>
    go("./user-register.html")
  );
}

/* ========== USER: REGISTER ========== */
function initUserRegister() {
  const form = qs("#registerForm");
  const alertBox = qs("#registerAlert");
  const btn = qs("#registerBtn");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.textContent = "";
    alertBox.className = "alert";

    const name = form.name.value.trim();
    const phone = form.phone.value.trim();
    const city = form.city.value.trim();
    const district = form.district.value.trim();
    const email = form.email.value.trim();
    const password = form.password.value.trim();

    if (!name || !phone || !email || !password) {
      alertBox.textContent = "Zorunlu alanları doldur.";
      alertBox.classList.add("alert-error");
      return;
    }

    try {
      setLoading(btn, true);
      await registerUser(email, password, {
        name,
        phone,
        city,
        district
      });
      alertBox.textContent = "Kayıt tamamlandı. Oturum açılıyor...";
      alertBox.classList.add("alert-success");
      setTimeout(() => go("./user-home.html"), 800);
    } catch (err) {
      alertBox.textContent = err.message || "Kayıt sırasında hata.";
      alertBox.classList.add("alert-error");
    } finally {
      setLoading(btn, false);
    }
  });

  qs("#goLogin")?.addEventListener("click", () =>
    go("./user-login.html")
  );
}

/* ========== USER: HOME ========== */
function initUserHome() {
  const logoutBtn = qs("#userLogout");
  logoutBtn?.addEventListener("click", async () => {
    await logoutUser();
    go("./user-login.html");
  });

  // Kullanıcı adını göster
  watchAuth(async (user) => {
    if (!user) {
      go("./user-login.html");
      return;
    }
    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data();
    if (data?.name) {
      const el = qs("#userWelcomeName");
      if (el) el.textContent = data.name;
    }
  });

  // Kısayol butonları
  qs("#goBusinessList")?.addEventListener("click", () =>
    go("./user-business-list.html")
  );
  qs("#goMyAppointments")?.addEventListener("click", () =>
    go("./my-appointments.html")
  );
  qs("#goNotifications")?.addEventListener("click", () =>
    go("./notifications.html")
  );
  qs("#goProfile")?.addEventListener("click", () =>
    go("./user-profile.html")
  );
}

/* ========== USER: PROFILE ========== */
function initUserProfile() {
  const form = qs("#profileForm");
  const alertBox = qs("#profileAlert");
  const logoutBtn = qs("#userLogout");

  watchAuth(async (user) => {
    if (!user) {
      go("./user-login.html");
      return;
    }

    const snap = await getDoc(doc(db, "users", user.uid));
    const data = snap.data();
    if (data) {
      form.name.value = data.name || "";
      form.phone.value = data.phone || "";
      form.city.value = data.city || "";
      form.district.value = data.district || "";
    }
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.textContent = "";
    alertBox.className = "alert";

    const user = auth.currentUser;
    if (!user) return;

    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          name: form.name.value.trim(),
          phone: form.phone.value.trim(),
          city: form.city.value.trim(),
          district: form.district.value.trim(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );
      alertBox.textContent = "Profil güncellendi.";
      alertBox.classList.add("alert-success");
    } catch (err) {
      alertBox.textContent = "Profil güncellenemedi.";
      alertBox.classList.add("alert-error");
    }
  });

  logoutBtn?.addEventListener("click", async () => {
    await logoutUser();
    go("./user-login.html");
  });
}

/* ========== USER: BUSINESS LIST ========== */
async function initUserBusinessList() {
  const listEl = qs("#businessList");
  const filterCity = qs("#filterCity");
  const filterDistrict = qs("#filterDistrict");

  async function loadBusinesses() {
    listEl.innerHTML = "";
    let qRef = collection(db, "businesses");
    const filters = [];

    if (filterCity.value.trim()) {
      filters.push(where("city", "==", filterCity.value.trim()));
    }
    if (filterDistrict.value.trim()) {
      filters.push(where("district", "==", filterDistrict.value.trim()));
    }

    if (filters.length > 0) {
      qRef = query(qRef, ...filters);
    }

    const snap = await getDocs(qRef);
    if (snap.empty) {
      listEl.innerHTML =
        '<li class="list-item"><div class="list-item-main"><span class="list-item-title">Sonuç bulunamadı</span></div></li>';
      return;
    }

    snap.forEach((docSnap) => {
      const b = docSnap.data();
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
        <div class="list-item-main">
          <span class="list-item-title">${b.name || "İşletme"}</span>
          <span class="list-item-sub">${b.category || ""} · ${
        b.city || ""
      } / ${b.district || ""}</span>
        </div>
        <button class="btn btn-outline btn-sm" data-id="${
          b.uid
        }">Detay</button>
      `;
      li.querySelector("button").addEventListener("click", () =>
        go(`./user-business-detail.html?id=${b.uid}`)
      );
      listEl.appendChild(li);
    });
  }

  filterCity?.addEventListener("change", loadBusinesses);
  filterDistrict?.addEventListener("change", loadBusinesses);

  await loadBusinesses();
}

/* ========== USER: BUSINESS DETAIL ========== */
async function initUserBusinessDetail() {
  const id = getParam("id");
  if (!id) {
    go("./user-business-list.html");
    return;
  }

  const nameEl = qs("#bizName");
  const metaEl = qs("#bizMeta");
  const servicesList = qs("#bizServicesList");
  const workersList = qs("#bizWorkersList");
  const bookingBtn = qs("#goBooking");

  // İşletme bilgisi
  const snap = await getDoc(doc(db, "businesses", id));
  if (!snap.exists()) {
    nameEl.textContent = "İşletme bulunamadı.";
    return;
  }
  const biz = snap.data();
  nameEl.textContent = biz.name || "İşletme";
  metaEl.textContent = `${biz.category || ""} · ${biz.city || ""} / ${
    biz.district || ""
  }`;

  // Hizmetler
  const serviceSnap = await getDocs(
    collection(db, "businesses", id, "services")
  );
  servicesList.innerHTML = "";
  serviceSnap.forEach((s) => {
    const d = s.data();
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div class="list-item-main">
        <span class="list-item-title">${d.name}</span>
        <span class="list-item-sub">${d.duration || 30} dk · ${
      d.price ? d.price + "₺" : ""
    }</span>
      </div>
    `;
    servicesList.appendChild(li);
  });

  // Çalışanlar
  const workerSnap = await getDocs(
    collection(db, "businesses", id, "workers")
  );
  workersList.innerHTML = "";
  workerSnap.forEach((w) => {
    const d = w.data();
    const li = document.createElement("li");
    li.className = "list-item";
    li.innerHTML = `
      <div class="list-item-main">
        <span class="list-item-title">${d.name}</span>
        <span class="list-item-sub">${d.role || ""}</span>
      </div>
    `;
    workersList.appendChild(li);
  });

  bookingBtn?.addEventListener("click", () =>
    go(`../booking.html?businessId=${id}`)
  );
}

/* ========== USER: BOOKING ========== */
async function initUserBooking() {
  const bizId = getParam("businessId");
  if (!bizId) {
    go("./user-business-list.html");
    return;
  }

  const servicesSelect = qs("#bookingService");
  const workerSelect = qs("#bookingWorker");
  const dateInput = qs("#bookingDate");
  const timeInput = qs("#bookingTime");
  const noteInput = qs("#bookingNote");
  const alertBox = qs("#bookingAlert");
  const btn = qs("#bookingBtn");

  // Tarih default: bugün
  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;
  dateInput.min = today;

  // Hizmet & çalışanları doldur
  const serviceSnap = await getDocs(
    collection(db, "businesses", bizId, "services")
  );
  servicesSelect.innerHTML = `<option value="">Hizmet seç</option>`;
  serviceSnap.forEach((s) => {
    const d = s.data();
    const opt = document.createElement("option");
    opt.value = s.id;
    opt.textContent = d.name;
    servicesSelect.appendChild(opt);
  });

  const workerSnap = await getDocs(
    collection(db, "businesses", bizId, "workers")
  );
  workerSelect.innerHTML = `<option value="">Çalışan (opsiyonel)</option>`;
  workerSnap.forEach((w) => {
    const d = w.data();
    const opt = document.createElement("option");
    opt.value = w.id;
    opt.textContent = d.name;
    workerSelect.appendChild(opt);
  });

  // Form submit
  qs("#bookingForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.textContent = "";
    alertBox.className = "alert";

    const user = auth.currentUser;
    if (!user) {
      go("./user-login.html");
      return;
    }

    const serviceId = servicesSelect.value;
    const workerId = workerSelect.value;
    const date = dateInput.value;
    const time = timeInput.value;

    if (!serviceId || !date || !time) {
      alertBox.textContent = "Hizmet, tarih ve saat zorunlu.";
      alertBox.classList.add("alert-error");
      return;
    }

    try {
      setLoading(btn, true);

      const userSnap = await getDoc(doc(db, "users", user.uid));
      const u = userSnap.data() || {};

      await addDoc(collection(db, "appointments"), {
        userId: user.uid,
        businessId: bizId,
        serviceId,
        workerId: workerId || null,
        date,
        time,
        note: noteInput.value.trim() || null,
        status: "pending",
        createdAt: serverTimestamp(),
        userName: u.name || "",
        userPhone: u.phone || ""
      });

      alertBox.textContent = "Randevu talebin oluşturuldu.";
      alertBox.classList.add("alert-success");
      setTimeout(() => go("./my-appointments.html"), 900);
    } catch (err) {
      alertBox.textContent = "Randevu oluşturulamadı.";
      alertBox.classList.add("alert-error");
    } finally {
      setLoading(btn, false);
    }
  });
}

/* ========== USER: APPOINTMENTS ========== */
async function initUserAppointments() {
  const listEl = qs("#appointmentsList");

  watchAuth(async (user) => {
    if (!user) {
      go("./user-login.html");
      return;
    }

    const qRef = query(
      collection(db, "appointments"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"),
      orderBy("time", "desc")
    );

    const snap = await getDocs(qRef);
    listEl.innerHTML = "";
    if (snap.empty) {
      listEl.innerHTML =
        '<li class="list-item"><div class="list-item-main"><span class="list-item-title">Henüz randevun yok.</span></div></li>';
      return;
    }

    snap.forEach((a) => {
      const d = a.data();
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
        <div class="list-item-main">
          <span class="list-item-title">${d.date} · ${d.time}</span>
          <span class="list-item-sub">Durum: ${
            d.status || "pending"
          }</span>
        </div>
        <span class="status-badge status-${d.status || "pending"}">${
        d.status === "approved"
          ? "Onaylandı"
          : d.status === "cancelled"
          ? "İptal"
          : "Bekliyor"
      }</span>
      `;
      listEl.appendChild(li);
    });
  });
}

/* ========== USER: NOTIFICATIONS ========== */
async function initUserNotifications() {
  const listEl = qs("#notificationsList");

  watchAuth(async (user) => {
    if (!user) {
      go("./user-login.html");
      return;
    }

    const qRef = query(
      collection(db, "notifications"),
      where("targetUserId", "==", user.uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(qRef);
    listEl.innerHTML = "";

    if (snap.empty) {
      listEl.innerHTML =
        '<li class="list-item"><div class="list-item-main"><span class="list-item-title">Bildirim yok.</span></div></li>';
      return;
    }

    snap.forEach((n) => {
      const d = n.data();
      const li = document.createElement("li");
      li.className = "list-item";
      li.innerHTML = `
        <div class="list-item-main">
          <span class="list-item-title">${d.title || "Bilgilendirme"}</span>
          <span class="list-item-sub">${d.body || ""}</span>
        </div>
      `;
      listEl.appendChild(li);
    });
  });
}

/* ========== USER: REVIEW (basit placeholder) ========== */
function initUserReview() {
  const form = qs("#reviewForm");
  const alertBox = qs("#reviewAlert");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    alertBox.textContent = "";
    alertBox.className = "alert";

    const rating = form.rating.value;
    const comment = form.comment.value.trim();
    if (!rating) {
      alertBox.textContent = "Puan seç.";
      alertBox.classList.add("alert-error");
      return;
    }

    alertBox.textContent =
      "Demo: Yorum veri tabanına kaydedilmiş varsayalım :)";
    alertBox.classList.add("alert-success");
  });
}

/* ========== BUSINESS: AUTH (login/register tab) ========== */
function initBusinessAuth() {
  const loginTab = qs("#tabBizLogin");
  const registerTab = qs("#tabBizRegister");
  const loginView = qs("#bizLoginView");
  const registerView = qs("#bizRegisterView");

  function setTab(tab) {
    if (tab === "login") {
      loginTab.classList.add("active");
      registerTab.classList.remove("active");
      loginView.style.display = "block";
      registerView.style.display = "none";
    } else {
      loginTab.classList.remove("active");
      registerTab.classList.add("active");
      loginView.style.display = "none";
      registerView.style.display = "block";
    }
  }

  loginTab.addEventListener("click", () => setTab("login"));
  registerTab.addEventListener("click", () => setTab("register"));

  setTab("login");

  // Login
  const loginForm = qs("#bizLoginForm");
  const loginAlert = qs("#bizLoginAlert");
  const loginBtn = qs("#bizLoginBtn");

  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    loginAlert.textContent = "";
    loginAlert.className = "alert";

    const email = loginForm.email.value.trim();
    const password = loginForm.password.value.trim();

    try {
      setLoading(loginBtn, true);
      const user = await loginUser(email, password);
      const snap = await getDoc(doc(db, "businesses", user.uid));
      const data = snap.data();
      if (!data || data.role !== "business") {
        await logoutUser();
        throw new Error("Bu hesap işletme hesabı değil.");
      }
      go("./business-dashboard.html");
    } catch (err) {
      loginAlert.textContent = err.message || "Giriş başarısız.";
      loginAlert.classList.add("alert-error");
    } finally {
      setLoading(loginBtn, false);
    }
  });

  // Register
  const regForm = qs("#bizRegisterForm");
  const regAlert = qs("#bizRegisterAlert");
  const regBtn = qs("#bizRegisterBtn");

  regForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    regAlert.textContent = "";
    regAlert.className = "alert";

    const name = regForm.name.value.trim();
    const category = regForm.category.value.trim();
    const phone = regForm.phone.value.trim();
    const city = regForm.city.value.trim();
    const district = regForm.district.value.trim();
    const email = regForm.email.value.trim();
    const password = regForm.password.value.trim();

    if (!name || !phone || !email || !password) {
      regAlert.textContent = "Zorunlu alanları doldur.";
      regAlert.classList.add("alert-error");
      return;
    }

    try {
      setLoading(regBtn, true);
      await registerBusiness(email, password, {
        name,
        category,
        phone,
        city,
        district
      });
      regAlert.textContent =
        "Kayıt tamamlandı. Panel onayı sonrası kullanabilirsiniz.";
      regAlert.classList.add("alert-success");
      setTab("login");
    } catch (err) {
      regAlert.textContent = err.message || "Kayıt sırasında hata.";
      regAlert.classList.add("alert-error");
    } finally {
      setLoading(regBtn, false);
    }
  });
}

/* ========== BUSINESS: DASHBOARD ========== */
async function initBusinessDashboard() {
  const logoutBtn = qs("#bizLogout");
  const kpiToday = qs("#kpiToday");
  const kpiPending = qs("#kpiPending");
  const kpiApproved = qs("#kpiApproved");
  const listEl = qs("#bizTodayList");

  logoutBtn?.addEventListener("click", async () => {
    await logoutUser();
    go("./business-auth.html");
  });

  watchAuth(async (user) => {
    if (!user) {
      go("./business-auth.html");
      return;
    }

    const today = new Date().toISOString().slice(0, 10);

    const qRef = query(
      collection(db, "appointments"),
      where("businessId", "==", user.uid),
      where("date", "==", today),
      orderBy("time", "asc")
    );

    const snap = await getDocs(qRef);
    let total = 0;
    let pending = 0;
    let approved = 0;
    listEl.innerHTML = "";

    if (snap.empty) {
      listEl.innerHTML =
        '<li class="list-item"><div class="list-item-main"><span class="list-item-title">Bugün randevu yok.</span></div></li>';
    } else {
      snap.forEach((a) => {
        const d = a.data();
        total++;
        if (d.status === "approved") approved++;
        else if (d.status === "pending" || !d.status) pending++;

        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `
          <div class="list-item-main">
            <span class="list-item-title">${d.time} · ${d.userName || ""}</span>
            <span class="list-item-sub">${d.userPhone || ""}</span>
          </div>
          <span class="status-badge status-${d.status || "pending"}">${
          d.status === "approved"
            ? "Onaylandı"
            : d.status === "cancelled"
            ? "İptal"
            : "Bekliyor"
        }</span>
        `;
        listEl.appendChild(li);
      });
    }

    kpiToday.textContent = total;
    kpiPending.textContent = pending;
    kpiApproved.textContent = approved;
  });
}

/* ========== BUSINESS: SERVICES ========== */
function initBusinessServices() {
  const listEl = qs("#servicesList");
  const form = qs("#serviceForm");
  const alertBox = qs("#serviceAlert");

  watchAuth(async (user) => {
    if (!user) {
      go("./business-auth.html");
      return;
    }

    async function load() {
      const snap = await getDocs(
        collection(db, "businesses", user.uid, "services")
      );
      listEl.innerHTML = "";
      snap.forEach((s) => {
        const d = s.data();
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `
          <div class="list-item-main">
            <span class="list-item-title">${d.name}</span>
            <span class="list-item-sub">${d.duration || 30} dk · ${
          d.price ? d.price + "₺" : ""
        }</span>
          </div>
        `;
        listEl.appendChild(li);
      });
    }

    await load();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      alertBox.textContent = "";
      alertBox.className = "alert";

      const name = form.name.value.trim();
      const duration = form.duration.value.trim();
      const price = form.price.value.trim();
      if (!name) {
        alertBox.textContent = "Hizmet adı zorunlu.";
        alertBox.classList.add("alert-error");
        return;
      }

      await addDoc(collection(db, "businesses", user.uid, "services"), {
        name,
        duration,
        price,
        createdAt: serverTimestamp()
      });

      form.reset();
      alertBox.textContent = "Hizmet eklendi.";
      alertBox.classList.add("alert-success");
      await load();
    });
  });
}

/* ========== BUSINESS: WORKERS ========== */
function initBusinessWorkers() {
  const listEl = qs("#workersList");
  const form = qs("#workerForm");
  const alertBox = qs("#workerAlert");

  watchAuth(async (user) => {
    if (!user) {
      go("./business-auth.html");
      return;
    }

    async function load() {
      const snap = await getDocs(
        collection(db, "businesses", user.uid, "workers")
      );
      listEl.innerHTML = "";
      snap.forEach((w) => {
        const d = w.data();
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `
          <div class="list-item-main">
            <span class="list-item-title">${d.name}</span>
            <span class="list-item-sub">${d.role || ""}</span>
          </div>
        `;
        listEl.appendChild(li);
      });
    }

    await load();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      alertBox.textContent = "";
      alertBox.className = "alert";

      const name = form.name.value.trim();
      const role = form.role.value.trim();
      if (!name) {
        alertBox.textContent = "Çalışan adı zorunlu.";
        alertBox.classList.add("alert-error");
        return;
      }

      await addDoc(collection(db, "businesses", user.uid, "workers"), {
        name,
        role,
        createdAt: serverTimestamp()
      });

      form.reset();
      alertBox.textContent = "Çalışan eklendi.";
      alertBox.classList.add("alert-success");
      await load();
    });
  });
}

/* ========== BUSINESS: SETTINGS ========== */
function initBusinessSettings() {
  const form = qs("#bizSettingsForm");
  const alertBox = qs("#bizSettingsAlert");

  watchAuth(async (user) => {
    if (!user) {
      go("./business-auth.html");
      return;
    }

    (async () => {
      const snap = await getDoc(doc(db, "businesses", user.uid));
      const data = snap.data();
      if (data) {
        form.name.value = data.name || "";
        form.category.value = data.category || "";
        form.phone.value = data.phone || "";
        form.city.value = data.city || "";
        form.district.value = data.district || "";
        form.address.value = data.address || "";
      }
    })();

    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      alertBox.textContent = "";
      alertBox.className = "alert";

      await setDoc(
        doc(db, "businesses", user.uid),
        {
          name: form.name.value.trim(),
          category: form.category.value.trim(),
          phone: form.phone.value.trim(),
          city: form.city.value.trim(),
          district: form.district.value.trim(),
          address: form.address.value.trim(),
          updatedAt: serverTimestamp()
        },
        { merge: true }
      );

      alertBox.textContent = "Bilgiler kaydedildi.";
      alertBox.classList.add("alert-success");
    });
  });
}

/* ========== BUSINESS: NOTIFICATIONS ========== */
function initBusinessNotifications() {
  const listEl = qs("#bizNotificationsList");

  watchAuth(async (user) => {
    if (!user) {
      go("./business-auth.html");
      return;
    }

    (async () => {
      const qRef = query(
        collection(db, "notifications"),
        where("targetBusinessId", "==", user.uid),
        orderBy("createdAt", "desc")
      );

      const snap = await getDocs(qRef);
      listEl.innerHTML = "";
      if (snap.empty) {
        listEl.innerHTML =
          '<li class="list-item"><div class="list-item-main"><span class="list-item-title">Bildirim yok.</span></div></li>';
        return;
      }

      snap.forEach((n) => {
        const d = n.data();
        const li = document.createElement("li");
        li.className = "list-item";
        li.innerHTML = `
          <div class="list-item-main">
            <span class="list-item-title">${d.title || "Bilgi"}</span>
            <span class="list-item-sub">${d.body || ""}</span>
          </div>
        `;
        listEl.appendChild(li);
      });
    })();
  });
}
