// Profil butonuna göre yönlendirme sistemi
document.addEventListener("DOMContentLoaded", () => {
  const profileBtn = document.getElementById("profileBtn");
  if (!profileBtn) return;

  profileBtn.addEventListener("click", () => {
    const type = localStorage.getItem("userType");

    if (type === "business") {
      window.location.href = "/pages/business-panel.html";
    } else if (type === "customer") {
      window.location.href = "/pages/customer-panel.html";
    } else {
      window.location.href = "/pages/login.html";
    }
  });
});
