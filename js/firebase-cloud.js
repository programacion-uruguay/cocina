/* =========================================================
   ¿Qué Cocino Hoy? — Firebase Auth + Cloud Firestore Sync
   Proyecto: que-cocino-hoy-uy (southamerica-east1)
   ========================================================= */
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile,
  signOut
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js";
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  addDoc,
  collection,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js";

const firebaseConfig = {
  projectId: "que-cocino-hoy-uy",
  appId: "1:470427061511:web:56a4e1dc1572d3e12009a2",
  storageBucket: "que-cocino-hoy-uy.firebasestorage.app",
  apiKey: "AIzaSyDb7le2V96j0h5Bi1x2g-3rwt6j8YMDzUo",
  authDomain: "que-cocino-hoy-uy.firebaseapp.com",
  messagingSenderId: "470427061511"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

let currentFirebaseUser = null;
let authListeners = [];
let syncTimer = null;

function mapAuthError(err) {
  const code = err?.code || "";
  if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
    return "Email o contraseña incorrectos.";
  }
  if (code === "auth/email-already-in-use") {
    return "Ya existe una cuenta registrada con ese email.";
  }
  if (code === "auth/weak-password") {
    return "La contraseña debe tener al menos 6 caracteres.";
  }
  if (code === "auth/invalid-email") {
    return "Ingresá un correo electrónico válido.";
  }
  if (code === "auth/popup-closed-by-user") {
    return "Cerraste la ventana de Google antes de terminar.";
  }
  if (code === "auth/unauthorized-domain") {
    return "Este dominio todavía no está autorizado en Firebase Auth.";
  }
  if (code === "auth/too-many-requests") {
    return "Demasiados intentos. Esperá unos minutos y volvé a probar.";
  }
  return err?.message || "No pudimos completar la operación. Probá nuevamente.";
}

function buildUsernameFromUser(fbUser, fallbackName) {
  const base =
    (fbUser.displayName || fallbackName || (fbUser.email ? fbUser.email.split("@")[0] : "usuario"))
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9_.-]/g, "")
      .slice(0, 24) || "usuario";
  return base;
}

function defaultProfileForFirebaseUser(fbUser, customName) {
  const fullName = (customName || fbUser.displayName || fbUser.email?.split("@")[0] || "Usuario").trim();
  return {
    uid: fbUser.uid,
    username: buildUsernameFromUser(fbUser, fullName),
    fullName,
    email: (fbUser.email || "").toLowerCase(),
    photoURL: fbUser.photoURL || "",
    householdSize: 2,
    weeklyBudgetUyu: 3500,
    preferences: [],
    restrictions: [],
    habits: { waterGlassesGoal: 8, cookingTimePreference: "moderado", notes: "" },
    isCloud: true
  };
}

async function loadCloudUserDoc(fbUser) {
  const ref = doc(db, "users", fbUser.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) {
    return snap.data();
  }

  const profile = defaultProfileForFirebaseUser(fbUser);
  const localFavs = readLocalRadialFavorites();
  const initialDoc = {
    uid: fbUser.uid,
    email: profile.email,
    displayName: profile.fullName,
    username: profile.username,
    photoURL: profile.photoURL || "",
    profile,
    favorites: localFavs,
    menuSlots: [],
    dailyLogs: [],
    shoppingList: [],
    plan: readLocalPlanForCloud(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };

  await setDoc(ref, initialDoc, { merge: true });
  return initialDoc;
}

function readLocalRadialFavorites() {
  try {
    const raw = localStorage.getItem("cocina_radial_favorites_v1");
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x) => typeof x === "string").slice(0, 1000) : [];
  } catch {
    return [];
  }
}

function writeLocalRadialFavorites(list) {
  try {
    localStorage.setItem("cocina_radial_favorites_v1", JSON.stringify(list));
  } catch {
    // ignore
  }
}

function readLocalPlanForCloud() {
  try {
    const raw = localStorage.getItem("qch_plan_state_v1");
    if (!raw) return { tier: "free", trialStartedAt: null, trialExpiresAt: null };
    const p = JSON.parse(raw);
    const safeTier = p.tier === "pro_trial" ? "pro_trial" : "free";
    return {
      tier: safeTier,
      trialStartedAt: p.trialStartedAt || null,
      trialExpiresAt: p.trialExpiresAt || null
    };
  } catch {
    return { tier: "free", trialStartedAt: null, trialExpiresAt: null };
  }
}

function applyCloudPlanToLocal(cloudPlan) {
  if (!cloudPlan || typeof cloudPlan !== "object") return;
  try {
    const raw = localStorage.getItem("qch_plan_state_v1");
    const local = raw ? JSON.parse(raw) : {};
    const merged = {
      ...local,
      tier: cloudPlan.tier || local.tier || "free",
      trialStartedAt: cloudPlan.trialStartedAt || local.trialStartedAt || null,
      trialExpiresAt: cloudPlan.trialExpiresAt || local.trialExpiresAt || null
    };
    localStorage.setItem("qch_plan_state_v1", JSON.stringify(merged));
    if (window.QCHPlans?.syncUI) window.QCHPlans.syncUI();
  } catch {
    // ignore
  }
}

async function saveCloudPatch(patch) {
  if (!currentFirebaseUser) return;
  const uid = currentFirebaseUser.uid;
  const ref = doc(db, "users", uid);
  const payload = {
    uid,
    updatedAt: serverTimestamp()
  };

  if (patch.profile) {
    payload.profile = patch.profile;
    if (patch.profile.fullName) payload.displayName = String(patch.profile.fullName).slice(0, 120);
    if (patch.profile.username) payload.username = String(patch.profile.username).slice(0, 80);
    if (patch.profile.email) payload.email = String(patch.profile.email).slice(0, 200);
  }
  if (Array.isArray(patch.favorites)) {
    payload.favorites = patch.favorites.filter((x) => typeof x === "string").slice(0, 1000);
  }
  if (Array.isArray(patch.menuSlots)) payload.menuSlots = patch.menuSlots;
  if (Array.isArray(patch.dailyLogs)) payload.dailyLogs = patch.dailyLogs;
  if (Array.isArray(patch.shoppingList)) payload.shoppingList = patch.shoppingList;
  if (patch.plan && typeof patch.plan === "object") {
    const safeTier = patch.plan.tier === "pro" ? "pro" : patch.plan.tier === "pro_trial" ? "pro_trial" : "free";
    payload.plan = {
      tier: safeTier,
      trialStartedAt: patch.plan.trialStartedAt || null,
      trialExpiresAt: patch.plan.trialExpiresAt || null
    };
  }

  try {
    await setDoc(ref, payload, { merge: true });
  } catch (err) {
    console.warn("[QCHCloud] Error guardando en Firestore:", err);
  }
}

function scheduleCloudSync(patch) {
  if (!currentFirebaseUser) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    saveCloudPatch(patch);
  }, 450);
}

async function loginWithGoogle() {
  try {
    const res = await signInWithPopup(auth, googleProvider);
    const cloudDoc = await loadCloudUserDoc(res.user);
    return { fbUser: res.user, cloudDoc };
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

async function loginWithEmail(email, password) {
  try {
    const res = await signInWithEmailAndPassword(auth, String(email || "").trim(), String(password || ""));
    const cloudDoc = await loadCloudUserDoc(res.user);
    return { fbUser: res.user, cloudDoc };
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

async function registerWithEmail({ fullName, email, password, username }) {
  try {
    const cleanEmail = String(email || "").trim().toLowerCase();
    const cleanName = String(fullName || "").trim();
    const res = await createUserWithEmailAndPassword(auth, cleanEmail, String(password || ""));
    if (cleanName) {
      await updateProfile(res.user, { displayName: cleanName });
    }
    const profile = defaultProfileForFirebaseUser(res.user, cleanName);
    if (username && username.trim().length >= 3) {
      profile.username = username.trim().toLowerCase().replace(/[^a-z0-9_.-]/g, "").slice(0, 24) || profile.username;
    }
    const localFavs = readLocalRadialFavorites();
    const initialDoc = {
      uid: res.user.uid,
      email: cleanEmail,
      displayName: profile.fullName,
      username: profile.username,
      photoURL: "",
      profile,
      favorites: localFavs,
      menuSlots: [],
      dailyLogs: [],
      shoppingList: [],
      plan: readLocalPlanForCloud(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };
    await setDoc(doc(db, "users", res.user.uid), initialDoc, { merge: true });
    return { fbUser: res.user, cloudDoc: initialDoc };
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

async function resetPasswordEmail(email) {
  try {
    await sendPasswordResetEmail(auth, String(email || "").trim());
  } catch (err) {
    throw new Error(mapAuthError(err));
  }
}

async function logoutCloud() {
  try {
    await signOut(auth);
  } catch (err) {
    console.warn("[QCHCloud] Error al cerrar sesión:", err);
  }
}

async function submitWaitlistToCloud(contact) {
  const clean = String(contact || "").trim().slice(0, 160);
  if (clean.length < 3) return false;
  try {
    await addDoc(collection(db, "waitlist"), {
      contact: clean,
      uid: currentFirebaseUser ? currentFirebaseUser.uid : null,
      source: "plans_modal",
      createdAt: serverTimestamp()
    });
    return true;
  } catch (err) {
    console.warn("[QCHCloud] Error guardando waitlist:", err);
    return false;
  }
}

function onCloudAuthChange(cb) {
  if (typeof cb === "function") {
    authListeners.push(cb);
  }
}

onAuthStateChanged(auth, async (fbUser) => {
  currentFirebaseUser = fbUser || null;
  let cloudDoc = null;

  if (fbUser) {
    try {
      cloudDoc = await loadCloudUserDoc(fbUser);
      const localFavs = readLocalRadialFavorites();
      const cloudFavs = Array.isArray(cloudDoc.favorites) ? cloudDoc.favorites : [];
      const mergedFavs = Array.from(new Set([...cloudFavs, ...localFavs])).slice(0, 1000);
      writeLocalRadialFavorites(mergedFavs);
      if (mergedFavs.length !== cloudFavs.length) {
        saveCloudPatch({ favorites: mergedFavs });
      }
      cloudDoc.favorites = mergedFavs;
      applyCloudPlanToLocal(cloudDoc.plan);
      window.dispatchEvent(new CustomEvent("qch:favorites-synced", { detail: { favorites: mergedFavs } }));
    } catch (err) {
      console.warn("[QCHCloud] Error cargando perfil desde Firestore:", err);
    }
  }

  authListeners.forEach((fn) => {
    try {
      fn({ fbUser: currentFirebaseUser, cloudDoc });
    } catch (e) {
      console.warn("[QCHCloud] Listener error:", e);
    }
  });
  window.dispatchEvent(
    new CustomEvent("qch:auth-changed", {
      detail: { fbUser: currentFirebaseUser, cloudDoc }
    })
  );
});

window.QCHCloud = {
  isReady: true,
  getCurrentUser: () => currentFirebaseUser,
  loginWithGoogle,
  loginWithEmail,
  registerWithEmail,
  resetPasswordEmail,
  logout: logoutCloud,
  syncUserData: scheduleCloudSync,
  saveNow: saveCloudPatch,
  submitWaitlist: submitWaitlistToCloud,
  onAuthChange: onCloudAuthChange
};
