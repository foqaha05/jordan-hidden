// Firebase Authentication and Firestore are loaded only when a web app has been configured.
// The web config is public; no service-account credential belongs in this file.
const root = document.getElementById("auth-root");
const form = document.getElementById("auth-form");
const emailInput = document.getElementById("auth-email");
const passwordInput = document.getElementById("auth-password");
const usernameInput = document.getElementById("auth-username");
const roleInput = document.getElementById("auth-role");
const confirmInput = document.getElementById("auth-confirm");
const importRow = document.getElementById("import-row");
const errorNode = document.getElementById("auth-error");
const submit = document.getElementById("auth-submit");
let signingUp = false;
let busy = false;
let registrationInProgress = false;
let saveQueue = Promise.resolve();
let auth, db, authApi, storeApi;
let requestedPage = null;
const ROLES = ["tourist", "visitor", "provider"];

function firebaseConfigReady() {
  const config = window.FIREBASE_CONFIG;
  if (!config || typeof config !== "object") return false;
  const required = ["apiKey", "authDomain", "projectId", "messagingSenderId", "appId"];
  return required.every(key => {
    const value = config[key];
    return typeof value === "string"
      && value.trim().length > 0
      && !value.includes("PASTE_FIREBASE_");
  });
}

function error(message) {
  errorNode.textContent = message;
  errorNode.hidden = !message;
}
function setBusy(value) {
  busy = value;
  submit.disabled = value || !firebaseConfigReady();
  submit.textContent = value ? "Please wait…" : signingUp ? "Create account" : "Log in";
}
function showAuth() {
  if (window.JordanHidden.isAuthenticated()) window.JordanHidden.activateGuest();
  form.hidden = false;
  document.getElementById("auth-role-form").hidden = true;
  document.querySelector(".auth-switch").hidden = false;
  root.hidden = false;
  emailInput.focus();
}
function showGuest() {
  requestedPage = null;
  root.hidden = true;
  window.JordanHidden.activateGuest();
  window.Community?.activateGuest?.(storeApi && db ? { firestore: storeApi, db } : null);
}
window.JordanHiddenRequireAccount = page => {
  requestedPage = typeof page === "string" ? page : null;
  showAuth();
};
document.getElementById("auth-close").addEventListener("click", async () => {
  if (!document.getElementById("auth-role-form").hidden && auth?.currentUser)
    await authApi.signOut(auth);
  showGuest();
});
function toggleMode(next) {
  signingUp = next;
  document.getElementById("auth-title").textContent = next ? "Begin your journey" : "Welcome back";
  document.querySelector(".auth-subtitle").textContent = next
    ? "Create your explorer account to save your discoveries."
    : "Sign in to continue your Jordan journey.";
  document.querySelectorAll(".signup-only").forEach(node => {
    node.hidden = !next || (node === importRow && !localStorage.getItem("jordanHiddenState"));
  });
  usernameInput.required = next;
  roleInput.required = next;
  confirmInput.required = next;
  passwordInput.autocomplete = next ? "new-password" : "current-password";
  document.getElementById("auth-switch-prompt").textContent = next ? "Already exploring?" : "New to Jordan Hidden?";
  document.getElementById("auth-toggle").textContent = next ? "Log in" : "Create an account";
  error("");
  setBusy(false);
}
document.getElementById("auth-toggle").addEventListener("click", () => toggleMode(!signingUp));

function friendlyError(reason) {
  if (reason?.message === "USERNAME_TAKEN")
    return "This username is already taken. Please choose another username.";
  if (reason?.code === "auth/email-already-in-use")
    return "An account with this email already exists. Please log in.";
  if (reason?.code === "auth/invalid-credential" || reason?.code === "auth/wrong-password")
    return "Incorrect email or password.";
  if (reason?.code === "auth/weak-password")
    return "Please use a stronger password (at least 6 characters).";
  if (reason?.code === "auth/too-many-requests")
    return "Too many attempts. Please try again later.";
  if (reason?.code === "permission-denied" || reason?.code === "firestore/permission-denied")
    return "Firebase rejected the request. Check that the Firestore security rules have been published.";
  if (reason?.code === "auth/operation-not-allowed")
    return "Enable Email/Password sign-in in Firebase Authentication.";
  return reason?.message || "Something went wrong. Please try again.";
}

async function openAccount(user) {
  const profile = await storeApi.getDoc(storeApi.doc(db, "users", user.uid));
  if (!profile.exists()) {
    await authApi.signOut(auth);
    throw new Error("Account profile not found. Please contact the site owner.");
  }
  const { username, progress } = profile.data();
  const { role } = profile.data();
  if (typeof username !== "string" || !/^[A-Za-z0-9_]{3,24}$/.test(username)) {
    await authApi.signOut(auth);
    throw new Error("This account has an invalid username.");
  }
  if (!ROLES.includes(role)) {
    if (role != null) throw new Error("This account has an invalid user type.");
    window.JordanHidden.deactivateUser();
    root.hidden = false;
    form.hidden = true;
    document.querySelector(".auth-switch").hidden = true;
    document.getElementById("auth-role-form").hidden = false;
    document.getElementById("auth-title").textContent = "Choose your purpose";
    return;
  }
  window.Community.prepare();
  window.JordanHidden.activateUser(user.uid, username, progress);
  await window.Community.activate({
    uid: user.uid, username, role, db, auth,
    firestore: storeApi,
  });
  root.hidden = true;
  if (requestedPage) {
    const page = requestedPage;
    requestedPage = null;
    go(page);
  }
}

document.getElementById("auth-role-form").addEventListener("submit", async event => {
  event.preventDefault();
  const role = document.getElementById("existing-role").value;
  if (!ROLES.includes(role) || !auth?.currentUser) return;
  const button = event.currentTarget.querySelector("button");
  button.disabled = true;
  try {
    await storeApi.updateDoc(storeApi.doc(db, "users", auth.currentUser.uid), { role });
    await openAccount(auth.currentUser);
  } catch (cause) {
    error(friendlyError(cause));
  } finally {
    button.disabled = false;
  }
});

form.addEventListener("submit", async event => {
  event.preventDefault();
  if (busy || !auth) return;
  error("");
  if (signingUp && passwordInput.value !== confirmInput.value) {
    error("Passwords do not match.");
    return;
  }
  const username = usernameInput.value.trim();
  if (signingUp && !/^[A-Za-z0-9_]{3,24}$/.test(username)) {
    error("Use 3–24 letters, numbers, or underscores for your username.");
    return;
  }
  if (signingUp && !ROLES.includes(roleInput.value)) {
    error("Choose your purpose to continue.");
    return;
  }
  setBusy(true);
  let createdUser = null;
  try {
    if (!signingUp) {
      await authApi.signInWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
      passwordInput.value = "";
      // The auth observer loads the profile and username.
      return;
    }
    registrationInProgress = true;
    const normalized = username.toLowerCase();
    const legacy = importRow.hidden || !document.getElementById("auth-import").checked
      ? null
      : (() => {
          try { return JSON.parse(localStorage.getItem("jordanHiddenState")); }
          catch { return null; }
        })();
    const progress = window.JordanHidden.prepareProgress(legacy);
    const credential = await authApi.createUserWithEmailAndPassword(auth, emailInput.value.trim(), passwordInput.value);
    createdUser = credential.user;
    const userRef = storeApi.doc(db, "users", createdUser.uid);
    const nameRef = storeApi.doc(db, "usernames", normalized);
    await storeApi.runTransaction(db, async transaction => {
      const existing = await transaction.get(nameRef);
      if (existing.exists()) throw new Error("USERNAME_TAKEN");
      transaction.set(nameRef, { uid: createdUser.uid, username, usernameLower: normalized });
      transaction.set(userRef, {
        username, usernameLower: normalized, role: roleInput.value, progress,
        createdAt: storeApi.serverTimestamp(),
      });
    });
    // The Firestore transaction is authoritative. A displayName update failure
    // must not remove the Auth account while leaving its reserved username behind.
    try { await authApi.updateProfile(createdUser, { displayName: username }); }
    catch (cause) { console.warn("Firebase Auth display name update failed", cause); }
    if (legacy) localStorage.removeItem("jordanHiddenState");
    createdUser = null;
    await openAccount(auth.currentUser);
    passwordInput.value = "";
    confirmInput.value = "";
  } catch (cause) {
    if (createdUser) {
      try { await authApi.deleteUser(createdUser); }
      catch (cleanupError) {
        console.error("Unable to remove incomplete registration", cleanupError);
        await authApi.signOut(auth);
      }
    }
    showAuth();
    error(friendlyError(cause));
  } finally {
    registrationInProgress = false;
    setBusy(false);
  }
});

if (new URLSearchParams(location.search).has("figma")) {
  root.hidden = true;
} else {
  window.Community.prepare();
  window.Community.activateGuest(null);
  if (!firebaseConfigReady()) {
    setBusy(false);
    error(window.FIREBASE_CONFIG_ERROR
      ? `Firebase configuration needs correction: ${window.FIREBASE_CONFIG_ERROR}`
      : "Firebase is not configured yet. Check js/firebase-config.js and reload the page.");
  } else {
  try {
    const sdk = "https://www.gstatic.com/firebasejs/12.18.0/";
    const [appApi, authModule, firestoreModule] = await Promise.all([
      import(sdk + "firebase-app.js"),
      import(sdk + "firebase-auth.js"),
      import(sdk + "firebase-firestore.js"),
    ]);
    authApi = authModule;
    storeApi = firestoreModule;
    const app = appApi.initializeApp(window.FIREBASE_CONFIG);
    auth = authApi.getAuth(app);
    db = storeApi.getFirestore(app);
    await authApi.setPersistence(auth, authApi.browserLocalPersistence);
    window.Community.activateGuest({ firestore: storeApi, db });
    window.JordanHiddenSave = snapshot => {
      const uid = auth.currentUser?.uid;
      if (!uid) return Promise.reject(new Error("Sign in before saving progress."));
      const ref = storeApi.doc(db, "users", uid);
      saveQueue = saveQueue.catch(() => {}).then(() =>
        storeApi.updateDoc(ref, { progress: snapshot, updatedAt: storeApi.serverTimestamp() })
      );
      saveQueue.catch(cause => {
        console.error("Progress save failed", cause);
        window.toast?.("Could not save your progress. Check your connection.");
      });
      return saveQueue;
    };
    window.JordanHiddenFlush = () => saveQueue;
    window.JordanHiddenLogout = async () => {
      await saveQueue.catch(() => {});
      await authApi.signOut(auth);
      showGuest();
      toggleMode(false);
    };
    authApi.onAuthStateChanged(auth, async user => {
      if (registrationInProgress) return;
      if (!user) {
        if (window.JordanHidden.isAuthenticated() || root.hidden) showGuest();
        return;
      }
      try {
        await saveQueue.catch(() => {});
        await openAccount(user);
        error("");
      } catch (cause) {
        showGuest();
        showAuth();
        error(friendlyError(cause));
      }
    }, cause => {
      showGuest();
      showAuth();
      error(friendlyError(cause));
    });
  } catch (cause) {
    console.error("Firebase initialization failed", cause);
    error("Could not connect to Firebase. Check the web app configuration and your connection.");
    setBusy(false);
  }
  }
}