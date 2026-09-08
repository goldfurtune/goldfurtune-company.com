// ================== Gold Fortune – Admin Config ==================
const BIN_ID = "6a9b0f99da38895dfe399c73";
const MASTER_KEY = "$2a$10$hmXdJoo8tCS.xYXR1iTV9O8YoeagMRUQmupeveyJUy.p81/e2y/7S";
const ACCESS_KEY = "$2a$10$pqInp3O8CbNngOF0Y2rFW.oI0uk/xVUoGuGjUgpwFMFgRlhY8pAGS";
const API_URL = `https://api.jsonbin.io/v3/b/${BIN_ID}`;

const ADMIN_USER = "INVESTOR20";
const ADMIN_PASS = "202020";

let data = null;
let idleTimer = null;
let idleSeconds = 120;

async function fetchBin() {
  const res = await fetch(`${API_URL}/latest`, {
    headers: { "X-Master-Key": MASTER_KEY, "X-Access-Key": ACCESS_KEY }
  });
  if (!res.ok) throw new Error("Failed to load");
  const json = await res.json();
  data = json.record || {};
  data.users = data.users || [];
  data.withdrawals = data.withdrawals || [];
  data.settings = data.settings || {};
  data.products = data.products || [];
  return data;
}

async function saveBin() {
  const res = await fetch(API_URL, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "X-Master-Key": MASTER_KEY,
      "X-Access-Key": ACCESS_KEY
    },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error("Failed to save");
  return true;
}

function isIos() {
  return /iphone|ipad|ipod/i.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function isInStandaloneMode() {
  return window.matchMedia("(display-mode: standalone)").matches ||
    window.navigator.standalone === true;
}

function showToast(msg) {
  const t = document.getElementById("toast");
  if (!t) return;
  t.textContent = msg;
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3000);
}

function startIdleTimer() {
  idleSeconds = 120;
  updateIdleDisplay();
  clearInterval(idleTimer);
  idleTimer = setInterval(() => {
    idleSeconds--;
    updateIdleDisplay();
    if (idleSeconds <= 0) {
      showToast("Logged out due to inactivity");
      setTimeout(logout, 1200);
    }
  }, 1000);
}

function resetIdleTimer() {
  if (sessionStorage.getItem("gf_admin_logged") === "true") idleSeconds = 120;
}

function updateIdleDisplay() {
  const el = document.getElementById("idleTimer");
  if (!el) return;
  const m = Math.floor(idleSeconds / 60);
  const s = idleSeconds % 60;
  el.textContent = `Idle: ${m}:${s.toString().padStart(2, "0")}`;
}

function logout() {
  sessionStorage.removeItem("gf_admin_logged");
  clearInterval(idleTimer);
  location.reload();
}

function fillForm() {
  if (!data) return;
  const s = data.settings || {};
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ""; };
  set("bankName", s.bankName);
  set("accountName", s.accountName);
  set("bankAccount", s.bankAccount);
  set("whatsapp", s.whatsapp);
  set("telegram", s.telegram);
  set("telegramChannel", s.telegramChannel);

  // Products
  const pBox = document.getElementById("productsList");
  if (pBox) {
    if (!(data.products || []).length) {
      pBox.innerHTML = `<div class="empty">No products found</div>`;
    } else {
      pBox.innerHTML = data.products.map(p => `
        <div class="product-card">
          <strong>${p.badge || ""} ${p.name}</strong> — ₦${Number(p.price).toLocaleString()} → Profit ₦${Number(p.profit).toLocaleString()}
          <div style="font-size:0.82rem;color:var(--muted);margin-top:4px;">${p.desc || ""}</div>
        </div>
      `).join("");
    }
  }

  // Users
  const uBody = document.getElementById("usersBody");
  if (uBody) {
    const users = data.users || [];
    if (!users.length) {
      uBody.innerHTML = `<tr><td colspan="4" class="empty">No users yet</td></tr>`;
    } else {
      uBody.innerHTML = users.map(u => `
        <tr>
          <td>${u.fullName || u.name || "—"}</td>
          <td>${u.email || "—"}</td>
          <td>₦${Number(u.balance || 0).toLocaleString()}</td>
          <td>${u.joined ? new Date(u.joined).toLocaleDateString() : "—"}</td>
        </tr>
      `).join("");
    }
  }

  // Withdrawals
  const wBody = document.getElementById("withdrawalsBody");
  if (wBody) {
    const wds = data.withdrawals || [];
    if (!wds.length) {
      wBody.innerHTML = `<tr><td colspan="4" class="empty">No withdrawal requests</td></tr>`;
    } else {
      wBody.innerHTML = wds.map(w => `
        <tr>
          <td>${w.email || w.user || "—"}</td>
          <td>₦${Number(w.amount || 0).toLocaleString()}</td>
          <td>${w.status || "pending"}</td>
          <td>${w.date ? new Date(w.date).toLocaleDateString() : "—"}</td>
        </tr>
      `).join("");
    }
  }
}

async function savePaymentAccount() {
  data.settings = data.settings || {};
  data.settings.bankName = document.getElementById("bankName").value.trim();
  data.settings.accountName = document.getElementById("accountName").value.trim();
  data.settings.bankAccount = document.getElementById("bankAccount").value.trim();
  await saveBin(); showToast("Payment account updated");
}

async function saveContact(key) {
  data.settings = data.settings || {};
  data.settings[key] = document.getElementById(key).value.trim();
  await saveBin(); showToast(key === "telegramChannel" ? "Telegram channel updated" : key.charAt(0).toUpperCase()+key.slice(1)+" link updated");
}

async function saveSettings() {
  data.settings = {
    bankName: document.getElementById("bankName").value.trim(),
    accountName: document.getElementById("accountName").value.trim(),
    bankAccount: document.getElementById("bankAccount").value.trim(),
    whatsapp: document.getElementById("whatsapp").value.trim(),
    telegram: document.getElementById("telegram").value.trim(),
    telegramChannel: document.getElementById("telegramChannel").value.trim()
  };
  const st = document.getElementById("settingsStatus");
  if (st) {
    st.className = "status";
    st.textContent = "Saving...";
    st.style.display = "block";
  }
  try {
    await saveBin();
    if (st) {
      st.className = "status success";
      st.textContent = "✓ Saved — changes appear on the frontend immediately";
    }
    showToast("Settings updated");
  } catch (e) {
    if (st) {
      st.className = "status error";
      st.textContent = "Error saving. Try again.";
    }
    console.error(e);
  }
}

function setupInstallPrompt() {
  if (isInStandaloneMode()) return;
  const banner = document.getElementById("installBanner");
  const hint = document.getElementById("installHint");
  const iosBox = document.getElementById("iosInstructions");
  const installBtn = document.getElementById("installBtn");
  if (!banner || !installBtn) return;

  let deferredPrompt = null;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    if (hint) hint.textContent = "Add to home screen for quick access";
    banner.classList.add("show");
  });

  if (isIos()) {
    setTimeout(() => {
      if (!isInStandaloneMode()) {
        if (hint) hint.textContent = "Tap Install for instructions";
        banner.classList.add("show");
      }
    }, 1500);
  }

  setTimeout(() => {
    if (!isInStandaloneMode() && !banner.classList.contains("show")) {
      if (hint) hint.textContent = "Add to home screen for quick access";
      banner.classList.add("show");
    }
  }, 4000);

  installBtn.addEventListener("click", async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") banner.classList.remove("show");
      deferredPrompt = null;
    } else if (isIos() && iosBox) {
      iosBox.classList.add("show");
      if (hint) hint.textContent = "Follow the steps below";
    } else {
      alert("Android: Menu → Install app\niPhone: Share → Add to Home Screen");
    }
  });
}

function hideInstallBanner() {
  const banner = document.getElementById("installBanner");
  if (banner) banner.classList.remove("show");
}

function showDashboard() {
  document.getElementById("loginScreen").style.display = "none";
  document.getElementById("dashboard").style.display = "block";
  fetchBin().then(fillForm);
  startIdleTimer();
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById("loginBtn");
  const err = document.getElementById("loginError");
  btn.disabled = true;
  btn.textContent = "Signing in...";
  err.style.display = "none";

  const user = document.getElementById("username").value.trim();
  const pass = document.getElementById("password").value;

  if (user === ADMIN_USER && pass === ADMIN_PASS) {
    sessionStorage.setItem("gf_admin_logged", "true");
    showDashboard();
  } else {
    err.style.display = "block";
  }
  btn.disabled = false;
  btn.textContent = "Sign In";
}

document.addEventListener("DOMContentLoaded", () => {
  if (sessionStorage.getItem("gf_admin_logged") === "true") showDashboard();
  const form = document.getElementById("loginForm");
  if (form) form.addEventListener("submit", handleLogin);
  ["mousemove", "mousedown", "keypress", "touchstart", "scroll"].forEach(evt => {
    document.addEventListener(evt, resetIdleTimer, { passive: true });
  });
  setupInstallPrompt();
  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(() => {});
  }
});
