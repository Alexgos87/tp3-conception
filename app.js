const APP_NAME = "Ludik";
const STATE_KEY = "ludik::state";
const USER_KEY = "ludik::user";
const THEME_KEY = "ludik::theme";
const XP_PAR_NIVEAU = 100;
const SYMBOLES = ["★", "◆", "●", "▲", "✓", "♥", "✎", "?", "∑", "⚑", "☀", "♪"];

/* ---------- Stockage ---------- */

function storageGet(key) {
  try { return localStorage.getItem(key); } catch (e) { return null; }
}

function storageSet(key, value) {
  try { localStorage.setItem(key, value); } catch (e) { /* mode privé */ }
}

function storageRemove(key) {
  try { localStorage.removeItem(key); } catch (e) { /* mode privé */ }
}

function loadState() {
  const raw = storageGet(STATE_KEY);
  if (raw) {
    try { return JSON.parse(raw); } catch (e) { /* données corrompues : on repart du début */ }
  }
  return buildSeed();
}

let state = loadState();

function saveState() {
  storageSet(STATE_KEY, JSON.stringify(state));
}

function resetPrototype() {
  if (!confirm("Effacer toutes les données du prototype et revenir aux données de départ ?")) return;
  storageRemove(STATE_KEY);
  storageRemove(USER_KEY);
  window.location.href = "index.html";
}

function newId(prefix) {
  return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

/* ---------- Thème ---------- */

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme;
  storageSet(THEME_KEY, theme);
  document.querySelectorAll("[data-theme-set]").forEach(function (b) {
    b.classList.toggle("active", b.dataset.themeSet === theme);
  });
}

document.documentElement.dataset.theme = storageGet(THEME_KEY) || "light";

/* ---------- Authentification ---------- */

function getCurrentUser() {
  const id = storageGet(USER_KEY);
  return state.users.find(function (u) { return u.id === id; }) || null;
}

function findUser(username, password) {
  return state.users.find(function (u) { return u.username === username && u.password === password; });
}

function usernameTaken(username) {
  return state.users.some(function (u) { return u.username === username; });
}

function login(user) {
  storageSet(USER_KEY, user.id);
}

function logout() {
  storageRemove(USER_KEY);
  window.location.href = "index.html";
}

function homeFor(user) {
  if (!user) return "index.html";
  if (user.role === "enseignant") return "prof.html";
  if (user.role === "admin") return "admin.html";
  return "etudiant.html";
}

// Redirige vers la connexion si personne n'est connecté, ou vers l'accueil
// du rôle si l'utilisateur n'a pas le bon rôle pour la page.
function requireRole(role) {
  const user = getCurrentUser();
  if (!user) {
    window.location.replace("connexion.html");
    throw new Error("non connecté");
  }
  if (role && user.role !== role) {
    window.location.replace(homeFor(user));
    throw new Error("mauvais rôle");
  }
  return user;
}

const ROLE_LABELS = { etudiant: "Étudiant", enseignant: "Enseignant", admin: "Administrateur" };

/* ---------- Utilitaires ---------- */

function qs(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function esc(text) {
  return String(text == null ? "" : text).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}

function fullName(user) {
  return user ? user.prenom + " " + user.nom : "Inconnu";
}

function initials(user) {
  return (user.prenom[0] + user.nom[0]).toUpperCase();
}

function relativeDate(iso) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days <= 0) return "aujourd'hui";
  if (days === 1) return "hier";
  if (days < 30) return "il y a " + days + " jours";
  return new Date(iso).toLocaleDateString("fr-CA", { day: "numeric", month: "long", year: "numeric" });
}

function plural(n, word) {
  return n + " " + word + (n > 1 ? "s" : "");
}

function showNotification(text) {
  let box = document.getElementById("notifBox");
  if (!box) {
    box = document.createElement("div");
    box.id = "notifBox";
    document.body.appendChild(box);
  }
  box.textContent = text;
  box.classList.add("show");
  clearTimeout(box._hideTimer);
  box._hideTimer = setTimeout(function () {
    box.classList.remove("show");
  }, 3000);
}

/* ---------- Domaine ---------- */

function getUser(id) {
  return state.users.find(function (u) { return u.id === id; }) || null;
}

function getClasse(id) {
  return state.classes.find(function (c) { return c.id === id; }) || null;
}

function getBadge(id) {
  return state.badges.find(function (b) { return b.id === id; }) || null;
}

function classeLabel(classe) {
  return classe.nom + " · " + classe.groupe;
}

function classesOfProf(profId, archived) {
  return state.classes.filter(function (c) { return c.profId === profId && !!c.archived === !!archived; });
}

function classesOfStudent(etudiantId) {
  return state.classes.filter(function (c) {
    return !c.archived && state.inscriptions.some(function (i) { return i.classeId === c.id && i.etudiantId === etudiantId; });
  });
}

function studentsOf(classeId) {
  return state.inscriptions
    .filter(function (i) { return i.classeId === classeId; })
    .map(function (i) { return getUser(i.etudiantId); })
    .filter(Boolean);
}

function isEnrolled(etudiantId, classeId) {
  return state.inscriptions.some(function (i) { return i.classeId === classeId && i.etudiantId === etudiantId; });
}

function badgesOf(classeId) {
  return state.badges.filter(function (b) { return b.classeId === classeId; });
}

function attributionsOf(etudiantId, classeId) {
  return state.attributions.filter(function (a) {
    return a.etudiantId === etudiantId && (!classeId || a.classeId === classeId);
  });
}

function xpOf(etudiantId, classeId) {
  return attributionsOf(etudiantId, classeId).reduce(function (sum, a) { return sum + a.xp; }, 0);
}

function hasBadge(etudiantId, badgeId) {
  return state.attributions.some(function (a) { return a.etudiantId === etudiantId && a.badgeId === badgeId; });
}

function badgesEarned(etudiantId, classeId) {
  return badgesOf(classeId).filter(function (b) { return hasBadge(etudiantId, b.id); });
}

function holdersOf(badgeId) {
  const badge = getBadge(badgeId);
  if (!badge) return [];
  return studentsOf(badge.classeId).filter(function (s) { return hasBadge(s.id, badgeId); });
}

function ranking(classeId) {
  const rows = studentsOf(classeId).map(function (s) {
    return { etudiant: s, xp: xpOf(s.id, classeId) };
  });
  rows.sort(function (a, b) { return b.xp - a.xp || fullName(a.etudiant).localeCompare(fullName(b.etudiant)); });
  rows.forEach(function (r, i) {
    // Égalité de points = même rang
    r.rang = i > 0 && rows[i - 1].xp === r.xp ? rows[i - 1].rang : i + 1;
  });
  return rows;
}

function rankOf(etudiantId, classeId) {
  const row = ranking(classeId).find(function (r) { return r.etudiant.id === etudiantId; });
  return row ? row.rang : null;
}

function levelInfo(xp) {
  return {
    niveau: Math.floor(xp / XP_PAR_NIVEAU) + 1,
    dansNiveau: xp % XP_PAR_NIVEAU,
    pct: Math.round((xp % XP_PAR_NIVEAU) / XP_PAR_NIVEAU * 100)
  };
}

function addNotificationFor(userId, text) {
  state.notifications.unshift({ id: newId("n"), userId: userId, text: text, date: new Date().toISOString(), read: false });
}

function giveBadge(badgeId, etudiantId) {
  const badge = getBadge(badgeId);
  const classe = getClasse(badge.classeId);
  if (hasBadge(etudiantId, badgeId)) return;
  const me = getCurrentUser();
  state.attributions.push({
    id: newId("a"), etudiantId: etudiantId, classeId: badge.classeId, badgeId: badgeId,
    xp: badge.xp, note: "", date: new Date().toISOString(), parId: me ? me.id : null
  });
  addNotificationFor(etudiantId, "Badge « " + badge.nom + " » obtenu en " + classe.nom + " (+" + badge.xp + " XP).");
}

function revokeBadge(badgeId, etudiantId) {
  state.attributions = state.attributions.filter(function (a) {
    return !(a.badgeId === badgeId && a.etudiantId === etudiantId);
  });
}

function giveXp(etudiantId, classeId, xp, note) {
  const classe = getClasse(classeId);
  const me = getCurrentUser();
  state.attributions.push({
    id: newId("a"), etudiantId: etudiantId, classeId: classeId, badgeId: null,
    xp: xp, note: note, date: new Date().toISOString(), parId: me ? me.id : null
  });
  addNotificationFor(etudiantId, "+" + xp + " XP en " + classe.nom + (note ? " : " + note : "") + ".");
}

/* ---------- Composants HTML ---------- */

function medalHtml(badge, opts) {
  opts = opts || {};
  const cls = ["medal"];
  if (opts.size) cls.push(opts.size);
  if (opts.locked) cls.push("locked");
  const inner = badge.image
    ? '<img src="' + esc(badge.image) + '" alt="">'
    : esc(badge.symbole || "★") + "︎";
  return '<span class="' + cls.join(" ") + '" title="' + esc(badge.nom) + '">' + inner + "</span>";
}

function progressHtml(xp) {
  const lv = levelInfo(xp);
  return '<div class="progress"><div style="width:' + lv.pct + '%"></div></div>' +
    '<div class="progress-label"><span>Niveau ' + lv.niveau + "</span><span>" +
    lv.dansNiveau + " / " + XP_PAR_NIVEAU + " XP</span></div>";
}

/* ---------- En-tête et pied de page ---------- */

const ICONS = {
  home: '<svg viewBox="0 0 24 24"><path d="M12 3 2 12h3v8h6v-6h2v6h6v-8h3z"/></svg>',
  sun: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4.5"/><path d="M11 1h2v4h-2zM11 19h2v4h-2zM1 11h4v2H1zM19 11h4v2h-4zM4.2 5.6l1.4-1.4 2.8 2.8L7 8.4zM15.6 17l1.4-1.4 2.8 2.8-1.4 1.4zM4.2 18.4 7 15.6l1.4 1.4-2.8 2.8zM15.6 7l2.8-2.8 1.4 1.4L17 8.4z"/></svg>',
  moon: '<svg viewBox="0 0 24 24"><path d="M14.5 2A9.5 9.5 0 1 0 22 16.4 8 8 0 0 1 14.5 2z"/></svg>',
  bell: '<svg viewBox="0 0 24 24"><path d="M12 22a2.5 2.5 0 0 0 2.5-2.5h-5A2.5 2.5 0 0 0 12 22zm7-6V11a7 7 0 0 0-5.5-6.8V3a1.5 1.5 0 0 0-3 0v1.2A7 7 0 0 0 5 11v5l-2 2v1h18v-1z"/></svg>',
  pencil: '<svg viewBox="0 0 24 24"><path d="M3 17.3V21h3.7l11-11-3.7-3.7zM20.7 7a1 1 0 0 0 0-1.4l-2.3-2.3a1 1 0 0 0-1.4 0l-1.8 1.8 3.7 3.7z"/></svg>'
};

function profileMenuLinks(user) {
  if (user.role === "enseignant") {
    return '<a href="prof.html">Mes classes</a><a href="prof.html?vue=archives">Classes archivées</a>';
  }
  if (user.role === "admin") {
    return '<a href="admin.html">Utilisateurs</a>';
  }
  return '<a href="etudiant.html">Mon profil</a>';
}

function renderHeader() {
  const user = getCurrentUser();
  const header = document.createElement("header");
  header.className = "app-header";

  let actions =
    '<div class="theme-toggle" role="group" aria-label="Thème">' +
    '<button type="button" data-theme-set="light" title="Thème clair">' + ICONS.sun + "</button>" +
    '<button type="button" data-theme-set="dark" title="Thème sombre">' + ICONS.moon + "</button>" +
    "</div>";

  if (user) {
    const notifs = state.notifications.filter(function (n) { return n.userId === user.id; });
    const unread = notifs.some(function (n) { return !n.read; });
    const notifItems = notifs.length
      ? notifs.map(function (n) {
          return '<div class="notif-item' + (n.read ? "" : " unread") + '">' + esc(n.text) + "<small>" + relativeDate(n.date) + "</small></div>";
        }).join("")
      : '<div class="notif-empty">Aucune notification.</div>';

    actions +=
      '<div class="menu-wrap">' +
      '<button type="button" class="icon-btn' + (unread ? " has-unread" : "") + '" id="bellBtn" title="Notifications">' + ICONS.bell + "</button>" +
      '<div class="dropdown" id="bellMenu"><div class="dd-head"><strong>Notifications</strong></div><div class="notif-list">' + notifItems + "</div></div>" +
      "</div>" +
      '<div class="menu-wrap">' +
      '<button type="button" class="profile-icon" id="profileBtn" title="Profil">' + esc(initials(user)) + "</button>" +
      '<div class="dropdown" id="profileMenu">' +
      '<div class="dd-head"><strong>' + esc(fullName(user)) + "</strong><span>" + ROLE_LABELS[user.role].toUpperCase() + "</span></div>" +
      profileMenuLinks(user) +
      '<div class="dd-sep"></div>' +
      '<button type="button" class="dd-item" onclick="resetPrototype()">Réinitialiser le prototype</button>' +
      '<button type="button" class="dd-item" onclick="logout()"><strong>Se déconnecter</strong></button>' +
      "</div></div>";
  } else {
    actions += '<a href="connexion.html">Se connecter</a><a href="inscription.html">S\'inscrire</a>';
  }

  header.innerHTML =
    '<div class="title-row">' +
    '<a href="' + homeFor(user) + '" class="icon-btn" title="Accueil">' + ICONS.home + "</a>" +
    '<a href="index.html" class="brand">' + APP_NAME + "</a>" +
    "</div>" +
    '<div class="actions">' + actions + "</div>";

  document.body.insertBefore(header, document.body.firstChild);

  header.querySelectorAll("[data-theme-set]").forEach(function (b) {
    b.addEventListener("click", function () { applyTheme(b.dataset.themeSet); });
  });
  applyTheme(document.documentElement.dataset.theme);

  setupDropdown("profileBtn", "profileMenu");
  setupDropdown("bellBtn", "bellMenu", function () {
    // Ouvrir la cloche marque les notifications comme lues
    state.notifications.forEach(function (n) {
      if (n.userId === user.id) n.read = true;
    });
    saveState();
    document.getElementById("bellBtn").classList.remove("has-unread");
  });
}

function setupDropdown(btnId, menuId, onOpen) {
  const btn = document.getElementById(btnId);
  const menu = document.getElementById(menuId);
  if (!btn) return;
  btn.addEventListener("click", function (e) {
    e.stopPropagation();
    const willOpen = !menu.classList.contains("open");
    document.querySelectorAll(".dropdown.open").forEach(function (d) { d.classList.remove("open"); });
    if (willOpen) {
      menu.classList.add("open");
      if (onOpen) onOpen();
    }
  });
  menu.addEventListener("click", function (e) { e.stopPropagation(); });
}

document.addEventListener("click", function () {
  document.querySelectorAll(".dropdown.open").forEach(function (d) { d.classList.remove("open"); });
});

function renderFooter() {
  const footer = document.createElement("footer");
  footer.textContent = "Ce site est un prototype étudiant. Les données sont fictives et conservées uniquement dans votre navigateur.";
  document.body.appendChild(footer);
}

document.addEventListener("DOMContentLoaded", function () {
  renderHeader();
  renderFooter();
});
