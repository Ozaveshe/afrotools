!function(window) {
  "use strict";

  var USER_KEY = "afro_auth_v2";
  var TOKEN_KEY = "afro_session_v3";
  var PROFILE_KEY = "afro_profile_cache";

  function getToken() {
    try {
      return window.AfroAuth && window.AfroAuth.getSessionToken ? window.AfroAuth.getSessionToken() : null;
    } catch (e) {
      return null;
    }
  }

  function dispatchAuthUser(user, reason) {
    window.dispatchEvent(new CustomEvent("afro-auth-change", {
      detail: { user: user || null, authenticated: !!user, reason: reason || "" }
    }));
  }

  function clearCachedAuth(reason) {
    try {
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(PROFILE_KEY);
    } catch (e) {}
    dispatchAuthUser(null, reason || "session-signed-out");
  }

  function applyVerifiedSession(data, reason) {
    if (data && data.authenticated && data.user) {
      try { localStorage.setItem(USER_KEY, JSON.stringify(data.user)); } catch (e) {}
      dispatchAuthUser(data.user, reason || "session-verified");
      return true;
    }
    if (data && data.authenticated === false) {
      clearCachedAuth(reason || "session-signed-out");
    }
    return false;
  }

  async function syncCookieFromBearer() {
    var token = getToken();
    if (!token) return null;
    try {
      var res = await fetch("/api/auth/session", {
        method: "GET",
        credentials: "same-origin",
        cache: "no-store",
        headers: {
          "Accept": "application/json",
          "Authorization": "Bearer " + token
        }
      });
      var data = await res.json().catch(function() { return null; });
      if (res.status === 401 || res.status === 403) {
        clearCachedAuth("session-token-rejected");
      } else {
        applyVerifiedSession(data, "session-bridged");
      }
      return data;
    } catch (e) {
      console.warn("[AfroAuth] Session cookie bridge:", e.message);
      return null;
    }
  }

  async function readCookieSession() {
    try {
      var res = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
      var data = await res.json();
      if (res.status === 401 || res.status === 403) {
        clearCachedAuth("session-cookie-rejected");
      } else {
        applyVerifiedSession(data, "session-cookie-read");
      }
      return data;
    } catch (e) {
      return null;
    }
  }

  function install() {
    if (!window.AfroAuth || window.AfroAuth._cookiePatched) return;
    window.AfroAuth._cookiePatched = true;

    var originalLogin = window.AfroAuth.login && window.AfroAuth.login.bind(window.AfroAuth);
    var originalSignup = window.AfroAuth.signup && window.AfroAuth.signup.bind(window.AfroAuth);
    var originalLogout = window.AfroAuth.logout && window.AfroAuth.logout.bind(window.AfroAuth);

    if (originalLogin) {
      window.AfroAuth.login = async function(email, password) {
        var result = await originalLogin(email, password);
        if (result && result.ok) {
          try {
            var res = await fetch("/api/auth/login", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ email: email, password: password })
            });
            if (!res.ok) await syncCookieFromBearer();
          } catch (e) {
            console.warn("[AfroAuth] Cookie login fallback:", e.message);
            await syncCookieFromBearer();
          }
        }
        return result;
      };
    }

    if (originalSignup) {
      window.AfroAuth.signup = async function(email, name, password, country) {
        var result = await originalSignup(email, name, password, country);
        if (result && result.ok) {
          try {
            var res = await fetch("/api/auth/signup", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              credentials: "same-origin",
              body: JSON.stringify({ email: email, password: password, name: name, country: country })
            });
            if (!res.ok) await syncCookieFromBearer();
          } catch (e) {
            console.warn("[AfroAuth] Cookie signup fallback:", e.message);
            await syncCookieFromBearer();
          }
        }
        return result;
      };
    }

    window.AfroAuth.logout = function() {
      if (originalLogout) originalLogout();
      try {
        fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" }).catch(function() {});
      } catch (e) {}
    };

    window.AfroAuth.syncSessionCookie = syncCookieFromBearer;
    window.AfroAuth.clearCachedSession = clearCachedAuth;

    if (getToken()) {
      syncCookieFromBearer();
    } else {
      readCookieSession();
    }
  }

  window.AfroAuthSessionBridge = {
    sync: syncCookieFromBearer,
    readCookieSession: readCookieSession,
    clear: clearCachedAuth
  };

  if (window.AfroAuth) {
    install();
  } else {
    window.addEventListener("afro-auth-change", function onAuthChange() {
      window.removeEventListener("afro-auth-change", onAuthChange);
      setTimeout(install, 50);
    });
    setTimeout(install, 2000);
  }
}(window);
