/* B Money Bets · sign-in gate.
   Public keys are meant to ship in the browser. RLS and the admin-users
   function decide what a session can do. */
(function () {
  // Flip to true to show Bet History without sign-in. Signed-out visitors otherwise see only the public home.
  const BET_HISTORY_PUBLIC = false;

  const SUPABASE_URL = "https://zajfiyviybclkrqyohdt.supabase.co";
  const SUPABASE_KEY = "sb_publishable_vP-xB4iF8WTWcJkDMm9A2w_koy7GSVX";
  const USER_DOMAIN = "users.bmoneybets.com";

  const client = supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  const pushTimers = {};
  let deskSaveWarned = false;
  window.BMB = {
    client,
    role: null,
    profile: null,
    session: null,
    deskReady: false,
    pushDesk,
    hydrateDesk,
    onUsersView,
    paintUsers,
    syncPublic: syncPublicShell,
  };

  function esc(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function loginEmail(raw) {
    const s = String(raw || "").trim().toLowerCase();
    if (!s) return "";
    if (s.includes("@")) return s;
    return s + "@" + USER_DOMAIN;
  }

  function prettyId(email) {
    const e = String(email || "");
    const at = "@" + USER_DOMAIN;
    if (e.toLowerCase().endsWith(at)) return e.slice(0, -at.length);
    return e;
  }

  function recoveryRedirect() {
    return new URL("set-password.html", window.location.href).href;
  }

  function showText(id, msg) {
    const el = document.getElementById(id);
    if (!el) return;
    el.hidden = !msg;
    el.textContent = msg || "";
  }

  function friendlyAuthError(error) {
    const code = error && (error.code || error.error_code);
    const msg = (error && error.message) || "Sign-in failed.";
    if (code === "invalid_credentials" || /invalid login/i.test(msg)) {
      return "That email and password did not match.";
    }
    if (/email not confirmed/i.test(msg)) return "That email is not confirmed yet.";
    return msg;
  }

  function paintSession() {
    const el = document.getElementById("session-label");
    if (!el) return;
    const email = (window.BMB.profile && window.BMB.profile.email) || (window.BMB.session && window.BMB.session.user && window.BMB.session.user.email) || "";
    const name = (window.BMB.profile && window.BMB.profile.display_name) || prettyId(email) || "Signed in";
    const role = window.BMB.role === "admin" ? "Admin" : "View only";
    el.textContent = name + " · " + role;
    const nav = document.getElementById("nav-users");
    if (nav) nav.hidden = window.BMB.role !== "admin";
    const sandboxNav = document.getElementById("nav-sandbox");
    if (sandboxNav) sandboxNav.hidden = window.BMB.role !== "admin";
  }

  function closeSignInPop() {
    const pop = document.getElementById("auth-gate");
    const btn = document.getElementById("public-signin");
    const signIn = document.getElementById("auth-signin");
    const forgot = document.getElementById("auth-forgot");
    if (signIn) signIn.hidden = false;
    if (forgot) forgot.hidden = true;
    if (pop) pop.hidden = true;
    if (btn) btn.setAttribute("aria-expanded", "false");
  }

  function openSignInPop() {
    const pop = document.getElementById("auth-gate");
    const btn = document.getElementById("public-signin");
    if (!pop || !btn) return;
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    const id = document.getElementById("auth-id");
    if (id) id.focus();
  }

  function syncPublicShell() {
    document.body.classList.remove("is-public");
    const historyPublic = BET_HISTORY_PUBLIC && !document.body.classList.contains("is-authed");
    document.body.classList.toggle("history-public", historyPublic);
    if (historyPublic && window.BMBLedger && typeof window.BMBLedger.show === "function") {
      window.BMBLedger.show("history");
    }
    if (document.body.classList.contains("is-authed")) {
      closeSignInPop();
      return;
    }
    const raw = (location.hash || "").replace(/^#/, "").split("?")[0].toLowerCase();
    if (raw && raw !== "desk") {
      const pin = () => window.scrollTo(0, 0);
      pin();
      requestAnimationFrame(pin);
    }
  }

  async function loadRole(session) {
    let role = "viewer";
    let profile = null;
    const q = await client.from("profiles").select("id, email, display_name, role").eq("id", session.user.id).maybeSingle();
    if (!q.error && q.data) {
      profile = q.data;
      if (q.data.role === "admin" || q.data.role === "viewer") role = q.data.role;
    }
    if (role !== "admin") {
      const rpc = await client.rpc("is_admin");
      if (!rpc.error && rpc.data === true) role = "admin";
    }
    window.BMB.role = role;
    window.BMB.profile = profile;
    document.body.classList.toggle("is-admin", role === "admin");
    document.body.classList.toggle("is-viewer", role !== "admin");
  }

  function startDesk() {
    if (typeof window.bootDesk === "function") window.bootDesk();
    else window.addEventListener("bmb-app-ready", function onReady() {
      window.removeEventListener("bmb-app-ready", onReady);
      if (typeof window.bootDesk === "function") window.bootDesk();
    });
  }

  let entered = false;
  async function enterApp(session) {
    if (!session) return;
    window.BMB.session = session;
    await loadRole(session);
    paintSession();
    document.body.classList.add("is-authed");
    document.body.classList.remove("is-public");
    document.documentElement.classList.add("has-session");
    closeSignInPop();
    if (!entered) {
      entered = true;
      startDesk();
    } else if (typeof applyEditLocks === "function") {
      applyEditLocks();
    }
    if (typeof fromHash === "function") fromHash();
  }

  async function pushDesk(key, value, opts) {
    if (!window.BMB || window.BMB.role !== "admin") return;
    const send = async () => {
      const session = window.BMB.session;
      const row = { key, value, updated_at: new Date().toISOString() };
      if (session && session.user) row.updated_by = session.user.id;
      let res = await client.from("desk_edits").upsert(row, { onConflict: "key" });
      if (res.error) {
        res = await client.from("desk_edits").upsert({ key, value }, { onConflict: "key" });
      }
      if (res.error) {
        console.warn("desk_edits", key, res.error);
        if (!deskSaveWarned && typeof toast === "function") {
          deskSaveWarned = true;
          toast("Could not save that change to the desk.");
        }
      }
    };
    if (opts && opts.immediate) {
      send();
      return;
    }
    clearTimeout(pushTimers[key]);
    pushTimers[key] = setTimeout(send, 450);
  }

  async function hydrateDesk() {
    if (window.__BMB_PREVIEW) return;
    const q = await client.from("desk_edits").select("key, value");
    if (q.error) {
      console.warn("desk_edits", q.error);
      return;
    }
    const map = {};
    const present = new Set();
    for (const row of q.data || []) {
      if (!row || !row.key) continue;
      map[row.key] = row.value;
      present.add(row.key);
    }
    if (window.BMBDesk && typeof window.BMBDesk.apply === "function") window.BMBDesk.apply(map);
    if (window.BMB.role === "admin" && window.BMBDesk && typeof window.BMBDesk.snapshot === "function") {
      const snap = window.BMBDesk.snapshot();
      for (const key of Object.keys(snap)) {
        if (present.has(key)) continue;
        const value = snap[key];
        if (value == null) continue;
        if (key === "tickets" && Array.isArray(value) && !value.length) continue;
        if (key === "friendPick" && !value) continue;
        if (value && typeof value === "object" && !Array.isArray(value) && !Object.keys(value).length) continue;
        pushDesk(key, value, { immediate: true });
      }
    }
    if (typeof render === "function") render();
  }

  function bindGate() {
    const signIn = document.getElementById("auth-signin");
    const forgot = document.getElementById("auth-forgot");
    const form = document.getElementById("auth-form");
    const forgotForm = document.getElementById("auth-forgot-form");
    const openForgot = document.getElementById("auth-forgot-open");
    const back = document.getElementById("auth-forgot-back");
    const signOut = document.getElementById("btn-sign-out");

    if (openForgot) {
      openForgot.addEventListener("click", () => {
        if (signIn) signIn.hidden = true;
        if (forgot) forgot.hidden = false;
        showText("auth-forgot-error", "");
        showText("auth-forgot-ok", "");
        const id = document.getElementById("auth-id");
        const dest = document.getElementById("auth-forgot-id");
        if (id && dest && !dest.value) dest.value = id.value;
        if (dest) dest.focus();
      });
    }
    if (back) {
      back.addEventListener("click", () => {
        if (forgot) forgot.hidden = true;
        if (signIn) signIn.hidden = false;
        const id = document.getElementById("auth-id");
        if (id) id.focus();
      });
    }
    if (form) {
      form.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginEmail(document.getElementById("auth-id").value);
        const password = document.getElementById("auth-password").value;
        const btn = document.getElementById("auth-submit");
        showText("auth-error", "");
        if (!email || !password) {
          showText("auth-error", "Enter an email or username and a password.");
          return;
        }
        if (btn) btn.disabled = true;
        const { error } = await client.auth.signInWithPassword({ email, password });
        if (btn) btn.disabled = false;
        if (error) showText("auth-error", friendlyAuthError(error));
      });
    }
    if (forgotForm) {
      forgotForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const email = loginEmail(document.getElementById("auth-forgot-id").value);
        const btn = document.getElementById("auth-forgot-submit");
        showText("auth-forgot-error", "");
        showText("auth-forgot-ok", "");
        if (!email) {
          showText("auth-forgot-error", "Enter the email or username on the account.");
          return;
        }
        if (btn) btn.disabled = true;
        const { error } = await client.auth.resetPasswordForEmail(email, { redirectTo: recoveryRedirect() });
        if (btn) btn.disabled = false;
        if (error) {
          showText("auth-forgot-error", error.message || "Could not send the reset link.");
          return;
        }
        showText("auth-forgot-ok", "Check that inbox for a link to set a new password.");
      });
    }
    if (signOut) {
      signOut.addEventListener("click", async () => {
        await client.auth.signOut();
        location.hash = "#desk";
        location.reload();
      });
    }
    const signBtn = document.getElementById("public-signin");
    if (signBtn) {
      signBtn.addEventListener("click", () => {
        const pop = document.getElementById("auth-gate");
        if (pop && pop.hidden) openSignInPop();
        else closeSignInPop();
      });
    }
    document.addEventListener("click", (e) => {
      const pop = document.getElementById("auth-gate");
      const btn = document.getElementById("public-signin");
      if (!pop || pop.hidden) return;
      if (pop.contains(e.target) || (btn && btn.contains(e.target))) return;
      closeSignInPop();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key !== "Escape") return;
      const pop = document.getElementById("auth-gate");
      if (!pop || pop.hidden) return;
      closeSignInPop();
      if (signBtn) signBtn.focus();
    });
  }

  let usersCache = [];
  let confirmDeleteId = "";
  let resetOpenId = "";
  let usersBusy = false;

  function usersFromPayload(payload) {
    if (Array.isArray(payload)) return payload;
    if (!payload || typeof payload !== "object") return [];
    for (const key of ["users", "data", "profiles"]) {
      if (Array.isArray(payload[key])) return payload[key];
    }
    return [];
  }

  function normUser(raw) {
    const u = raw && typeof raw === "object" ? raw : {};
    const profile = u.profile && typeof u.profile === "object" ? u.profile : {};
    const email = u.email || profile.email || "";
    const roleRaw = u.role || profile.role || "viewer";
    return {
      id: u.id || u.user_id || profile.id || "",
      email,
      display_name: u.display_name || profile.display_name || u.name || "",
      role: roleRaw === "admin" ? "admin" : "viewer",
      last_sign_in: u.last_sign_in_at || u.last_sign_in || u.lastSignInAt || profile.last_sign_in_at || null,
    };
  }

  function fmtWhen(iso) {
    if (!iso) return "Never";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "Never";
    return new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }).format(d) + " ET";
  }

  function paintUsers(list) {
    usersCache = (list || []).map(normUser).filter((u) => u.id || u.email);
    const body = document.getElementById("users-body");
    const empty = document.getElementById("users-empty");
    if (!body) return;
    const me = window.BMB.session && window.BMB.session.user && window.BMB.session.user.id;
    body.innerHTML = usersCache.map((u) => {
      const login = prettyId(u.email) || u.email;
      const you = me && u.id === me ? " · you" : "";
      const resetting = resetOpenId === u.id;
      const confirming = confirmDeleteId === u.id;
      return `<tr data-user="${esc(u.id)}">
        <td>${esc(login)}${esc(you)}${login !== u.email && u.email ? `<div class="user-mail">${esc(u.email)}</div>` : ""}</td>
        <td>${esc(u.display_name || "—")}</td>
        <td>
          <select class="user-role" data-role-for="${esc(u.id)}" aria-label="Role for ${esc(login)}">
            <option value="viewer"${u.role === "viewer" ? " selected" : ""}>Viewer</option>
            <option value="admin"${u.role === "admin" ? " selected" : ""}>Admin</option>
          </select>
        </td>
        <td class="num">${esc(fmtWhen(u.last_sign_in))}</td>
        <td>
          ${resetting
            ? `<div class="user-actions">
                <input type="password" data-reset-pw="${esc(u.id)}" autocomplete="new-password" minlength="8" aria-label="New password for ${esc(login)}" placeholder="New password">
                <button type="button" class="btn btn-fill" data-reset-save="${esc(u.id)}">Save</button>
                <button type="button" class="btn" data-reset-cancel="${esc(u.id)}">Cancel</button>
              </div>`
            : `<button type="button" class="btn" data-reset-open="${esc(u.id)}">Reset password</button>`}
        </td>
        <td>
          ${confirming
            ? `<div class="user-actions">
                <span class="user-confirm">Delete this login?</span>
                <button type="button" class="btn btn-danger" data-delete-yes="${esc(u.id)}">Delete</button>
                <button type="button" class="btn" data-delete-no="${esc(u.id)}">Cancel</button>
              </div>`
            : `<button type="button" class="btn btn-danger" data-delete="${esc(u.id)}">Delete</button>`}
        </td>
      </tr>`;
    }).join("");
    if (empty) empty.hidden = usersCache.length > 0;
  }

  async function adminCall(body) {
    const { data } = await client.auth.getSession();
    const session = data && data.session;
    if (!session) throw new Error("Sign in again.");
    const res = await fetch(SUPABASE_URL + "/functions/v1/admin-users", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: SUPABASE_KEY,
        Authorization: "Bearer " + session.access_token,
      },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      const msg = json.error || json.message || json.msg || ("Request failed (" + res.status + ")");
      throw new Error(typeof msg === "string" ? msg : "Request failed");
    }
    return json;
  }

  async function refreshUsers() {
    showText("users-error", "");
    const payload = await adminCall({ action: "list" });
    paintUsers(usersFromPayload(payload));
  }

  async function onUsersView() {
    if (window.BMB.role !== "admin") return;
    if (usersBusy) return;
    usersBusy = true;
    try {
      await refreshUsers();
    } catch (err) {
      showText("users-error", err.message || "Could not load users.");
    } finally {
      usersBusy = false;
    }
  }

  function bindUsers() {
    const create = document.getElementById("user-create");
    const body = document.getElementById("users-body");
    if (create) {
      create.addEventListener("submit", async (e) => {
        e.preventDefault();
        if (window.BMB.role !== "admin") return;
        const ident = document.getElementById("user-new-id").value;
        const password = document.getElementById("user-new-pw").value;
        const display_name = document.getElementById("user-new-name").value.trim();
        const role = document.getElementById("user-new-role").value === "admin" ? "admin" : "viewer";
        const btn = document.getElementById("user-create-submit");
        showText("users-error", "");
        showText("users-ok", "");
        if (!loginEmail(ident) || !password) {
          showText("users-error", "A username or email and a password are required.");
          return;
        }
        if (btn) btn.disabled = true;
        try {
          const bodyJson = { action: "create", password, role };
          if (String(ident).includes("@")) bodyJson.email = loginEmail(ident);
          else bodyJson.username = String(ident).trim().toLowerCase();
          if (display_name) bodyJson.display_name = display_name;
          await adminCall(bodyJson);
          create.reset();
          document.getElementById("user-new-role").value = "viewer";
          showText("users-ok", "User created.");
          await refreshUsers();
        } catch (err) {
          showText("users-error", err.message || "Could not create that user.");
        } finally {
          if (btn) btn.disabled = false;
        }
      });
    }
    if (body) {
      body.addEventListener("click", async (e) => {
        if (window.BMB.role !== "admin") return;
        const open = e.target.closest("[data-reset-open]");
        const cancel = e.target.closest("[data-reset-cancel]");
        const save = e.target.closest("[data-reset-save]");
        const del = e.target.closest("[data-delete]");
        const yes = e.target.closest("[data-delete-yes]");
        const no = e.target.closest("[data-delete-no]");
        if (open) {
          resetOpenId = open.getAttribute("data-reset-open");
          confirmDeleteId = "";
          paintUsers(usersCache);
          const inp = body.querySelector('[data-reset-pw="' + resetOpenId + '"]');
          if (inp) inp.focus();
          return;
        }
        if (cancel) {
          resetOpenId = "";
          paintUsers(usersCache);
          return;
        }
        if (no) {
          confirmDeleteId = "";
          paintUsers(usersCache);
          return;
        }
        if (del) {
          confirmDeleteId = del.getAttribute("data-delete");
          resetOpenId = "";
          paintUsers(usersCache);
          return;
        }
        if (save) {
          const id = save.getAttribute("data-reset-save");
          const inp = body.querySelector('[data-reset-pw="' + id + '"]');
          const password = inp ? inp.value : "";
          showText("users-error", "");
          showText("users-ok", "");
          if (!password) {
            showText("users-error", "Enter a new password.");
            return;
          }
          save.disabled = true;
          try {
            await adminCall({ action: "reset_password", user_id: id, password });
            resetOpenId = "";
            showText("users-ok", "Password updated.");
            await refreshUsers();
          } catch (err) {
            showText("users-error", err.message || "Could not reset that password.");
            save.disabled = false;
          }
          return;
        }
        if (yes) {
          const id = yes.getAttribute("data-delete-yes");
          showText("users-error", "");
          showText("users-ok", "");
          yes.disabled = true;
          try {
            await adminCall({ action: "delete", user_id: id });
            confirmDeleteId = "";
            showText("users-ok", "User deleted.");
            await refreshUsers();
          } catch (err) {
            showText("users-error", err.message || "Could not delete that user.");
            yes.disabled = false;
          }
        }
      });
      body.addEventListener("change", async (e) => {
        const sel = e.target.closest("[data-role-for]");
        if (!sel || window.BMB.role !== "admin") return;
        const id = sel.getAttribute("data-role-for");
        const role = sel.value === "admin" ? "admin" : "viewer";
        const prev = usersCache.find((u) => u.id === id);
        showText("users-error", "");
        showText("users-ok", "");
        sel.disabled = true;
        try {
          await adminCall({ action: "set_role", user_id: id, role });
          showText("users-ok", "Role updated.");
          await refreshUsers();
        } catch (err) {
          if (prev) sel.value = prev.role;
          showText("users-error", err.message || "Could not change that role.");
          sel.disabled = false;
        }
      });
    }
  }

  function previewDesk() {
    if (window.__BMB_PREVIEW !== "viewer") return false;
    const host = location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") return false;
    window.BMB.role = "viewer";
    window.BMB.session = { user: { id: "preview", email: "preview@local" } };
    window.BMB.profile = { display_name: "Preview", email: "preview@local", role: "viewer" };
    document.body.classList.add("is-authed", "is-viewer");
    document.documentElement.classList.add("has-session");
    paintSession();
    startDesk();
    return true;
  }

  bindGate();
  bindUsers();

  if (previewDesk()) {
    window.addEventListener("hashchange", syncPublicShell);
    return;
  }

  client.auth.onAuthStateChange((event, session) => {
    if (event === "PASSWORD_RECOVERY") {
      const next = new URL("set-password.html", window.location.href);
      window.location.replace(next.pathname + window.location.search + window.location.hash);
      return;
    }
    if ((event === "SIGNED_IN" || event === "INITIAL_SESSION") && session) {
      enterApp(session);
    }
    if (event === "SIGNED_OUT") {
      document.body.classList.remove("is-authed", "is-admin", "is-viewer");
      document.documentElement.classList.remove("has-session");
      syncPublicShell();
    }
  });

  window.addEventListener("hashchange", syncPublicShell);
  syncPublicShell();

  client.auth.getSession().then(({ data }) => {
    if (data && data.session) enterApp(data.session);
    else document.documentElement.classList.remove("has-session");
  }).catch(() => {
    document.documentElement.classList.remove("has-session");
  });
})();
