/* ===================================================================== *
 *  TradeMyTool scrolling ticker / advert bar  —  hosted version          *
 *  Put this file online once, then add ONE line to any page:             *
 *    <script src="YOUR-FILE-URL"></script>                                *
 *  The ticker appears exactly where that line sits. Editing the adverts   *
 *  (the key on the right) is locked to the owner email and updates every  *
 *  page at once, because all pages read the same Firebase record.         *
 * ===================================================================== */
(function () {
  "use strict";

  var OWNER_EMAIL = "fampricey@gmail.com";

  var CONFIG = {
    apiKey: "AIzaSyCEIM5P1j_TSfBmzgb30JuTQLzoGyFEwtk",
    authDomain: "trademytool.firebaseapp.com",
    projectId: "trademytool",
    storageBucket: "trademytool.firebasestorage.app",
    messagingSenderId: "346704103601",
    appId: "1:346704103601:web:674ae6bf6cd1d882e3fa90"
  };

  var DEFAULT_ITEMS = [
    { type: "canada", text: "Happy Canada Day", sub: "Celebrating July 1st with the trades", link: "", logo: "" },
    { type: "ad", text: "Your company here", sub: "Reach tradespeople across Canada", link: "", logo: "" },
    { type: "ad", text: "Buy \u2022 Sell \u2022 Trade \u2022 Donate tools", sub: "TradeMyTool marketplace", link: "", logo: "" }
  ];

  /* remember where this <script> sits so the bar lands in that spot */
  var anchor = document.currentScript || (function () {
    var s = document.getElementsByTagName("script");
    return s[s.length - 1];
  })();

  /* ---------- styles (injected once) ---------- */
  var CSS = '' +
  '.tmt-outer{max-width:1320px;margin:0 auto;padding:0 14px;box-sizing:border-box}' +
  '#tmt-ticker-wrap{position:relative;width:100%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}' +
  '#tmt-ticker-wrap *{box-sizing:border-box}' +
  '#tmt-ticker{--bg:#14161b;--h:44px;--s:38s;position:relative;width:100%;height:var(--h);background:linear-gradient(135deg,#111,#1b1b1b);border:2px solid #1a73e8;border-radius:14px;overflow:hidden;user-select:none}' +
  '#tmt-ticker::before,#tmt-ticker::after{content:"";position:absolute;top:0;bottom:0;width:48px;z-index:2;pointer-events:none}' +
  '#tmt-ticker::before{left:0;background:linear-gradient(90deg,var(--bg),transparent)}' +
  '#tmt-ticker::after{right:0;background:linear-gradient(270deg,var(--bg),transparent)}' +
  '.tmt-tk-track{display:flex;align-items:center;gap:14px;height:100%;width:max-content;padding-left:14px;animation:tmt-sc var(--s) linear infinite}' +
  '#tmt-ticker:hover .tmt-tk-track{animation-play-state:paused}' +
  '@keyframes tmt-sc{from{transform:translateX(0)}to{transform:translateX(-50%)}}' +
  '.tmt-pill{display:inline-flex;align-items:center;gap:9px;height:28px;padding:0 13px;white-space:nowrap;flex:0 0 auto;border-radius:999px;background:rgba(255,255,255,.06);border:1px solid rgba(255,255,255,.1);color:#e9ecf1;text-decoration:none;font-size:13.5px;font-weight:600}' +
  'a.tmt-pill:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.22)}' +
  '.tmt-sub{font-weight:400;opacity:.62}' +
  '.tmt-pill.ca{background:#F7CA4F;border-color:#F7CA4F;color:#111;font-weight:800}' +
  '.tmt-pill.ca .tmt-sub{color:#3a3a3a;opacity:.9;font-weight:600}' +
  '.tmt-fl{height:19px;width:auto;display:block;border-radius:2px;box-shadow:0 0 0 1px rgba(0,0,0,.12)}' +
  '.tmt-lg{height:18px;width:auto;display:block;border-radius:3px}' +
  '.tmt-dot{width:4px;height:4px;border-radius:50%;background:rgba(255,255,255,.22);flex:0 0 auto}' +
  '#tmt-key{position:absolute;right:8px;top:50%;transform:translateY(-50%);z-index:5;height:28px;width:28px;border-radius:999px;cursor:pointer;border:1px solid rgba(255,255,255,.1);background:rgba(255,255,255,.08);color:#fff;font-size:13px;line-height:1;display:flex;align-items:center;justify-content:center;opacity:.5}' +
  '#tmt-key:hover{opacity:1;background:rgba(255,255,255,.16)}' +
  '#tmt-panel{position:absolute;right:8px;top:calc(44px + 8px);z-index:60;width:330px;max-width:calc(100vw - 24px);background:#1b1e25;border:1px solid #1a73e8;border-radius:12px;padding:14px;box-shadow:0 12px 34px rgba(0,0,0,.45);color:#e9ecf1}' +
  '.tmt-ptitle{font-size:13px;font-weight:700;color:#F7CA4F;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center}' +
  '#tmt-panel input,#tmt-panel select{width:100%;height:34px;padding:0 10px;margin-bottom:8px;background:#14161b;border:1px solid rgba(255,255,255,.14);border-radius:8px;color:#fff;font-size:13px;outline:none}' +
  '#tmt-panel input:focus,#tmt-panel select:focus{border-color:#1a73e8}' +
  '.tmt-pwrow{display:flex;gap:6px}.tmt-pwrow input{flex:1}' +
  '#tmt-show{height:34px;padding:0 10px;margin-bottom:8px;border:1px solid rgba(255,255,255,.14);border-radius:8px;background:#14161b;color:#aab;font-size:12px;cursor:pointer}' +
  '.tmt-btn{width:100%;height:36px;border:none;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer}' +
  '.tmt-go{background:#1a73e8;color:#fff}.tmt-go:hover{filter:brightness(1.08)}' +
  '.tmt-add{background:transparent;border:1px dashed rgba(255,255,255,.28);color:#e9ecf1;margin:4px 0 10px}' +
  '.tmt-add:hover{border-color:#F7CA4F;color:#F7CA4F}' +
  '.tmt-link{background:none;border:none;color:#9bb4e8;font-size:12px;cursor:pointer;text-decoration:underline;padding:0}' +
  '.tmt-msg{font-size:12px;margin-top:8px;min-height:14px}.tmt-msg.err{color:#ff8a8a}.tmt-msg.ok{color:#7ddc8a}' +
  '.tmt-saverow{display:flex;align-items:center;gap:10px}.tmt-saverow .tmt-btn{width:auto;padding:0 16px}' +
  '#tmt-rows{max-height:42vh;overflow:auto;margin-bottom:4px}' +
  '.tmt-row{border:1px solid rgba(255,255,255,.12);border-radius:10px;padding:10px;margin-bottom:8px;background:rgba(255,255,255,.03)}' +
  '.tmt-rhead{display:flex;gap:8px;align-items:center;margin-bottom:6px}.tmt-rhead select{margin:0;height:30px}' +
  '.tmt-del{margin-left:auto;background:none;border:none;color:#ff8a8a;cursor:pointer;font-size:16px;line-height:1}' +
  '.tmt-row input{margin-bottom:6px;height:30px}.tmt-row input:last-child{margin-bottom:0}' +
  '@media (max-width:600px){#tmt-ticker{--h:40px;--s:26s}#tmt-panel{top:48px}.tmt-pill{font-size:12.5px;height:26px;padding:0 11px}}' +
  '@media (max-width:860px){.tmt-outer{max-width:none;width:100vw;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);padding-left:8px;padding-right:8px}}' +
  '@media (prefers-reduced-motion:reduce){.tmt-tk-track{animation:none;overflow-x:auto;width:100%;padding-right:14px}#tmt-ticker::before,#tmt-ticker::after{display:none}}';

  if (!document.getElementById("tmt-style")) {
    var st = document.createElement("style");
    st.id = "tmt-style";
    st.textContent = CSS;
    document.head.appendChild(st);
  }

  /* ---------- markup ---------- */
  var wrap = document.createElement("div");
  wrap.className = "tmt-outer";
  wrap.innerHTML =
    '<div id="tmt-ticker-wrap"><div id="tmt-ticker" aria-label="Announcements and adverts">' +
      '<div class="tmt-tk-track" id="tmt-tk-track"></div>' +
      '<button id="tmt-key" type="button" aria-label="Owner sign in">&#128273;</button>' +
    '</div>' +
    '<div id="tmt-panel" hidden>' +
      '<div id="tmt-login"><div class="tmt-ptitle">Owner sign in</div>' +
        '<input id="tmt-email" type="email" placeholder="Email" autocomplete="username">' +
        '<div class="tmt-pwrow"><input id="tmt-pass" type="password" placeholder="Password" autocomplete="current-password"><button id="tmt-show" type="button">Show</button></div>' +
        '<button id="tmt-signin" type="button" class="tmt-btn tmt-go">Sign in</button>' +
        '<div id="tmt-msg" class="tmt-msg"></div></div>' +
      '<div id="tmt-editor" hidden><div class="tmt-ptitle">Edit ticker <button id="tmt-signout" type="button" class="tmt-link">Sign out</button></div>' +
        '<div id="tmt-rows"></div>' +
        '<button id="tmt-add" type="button" class="tmt-btn tmt-add">+ Add company</button>' +
        '<div class="tmt-saverow"><button id="tmt-save" type="button" class="tmt-btn tmt-go">Save changes</button><span id="tmt-saved" class="tmt-msg"></span></div></div>' +
    '</div></div>';

  if (anchor && anchor.parentNode) {
    anchor.parentNode.insertBefore(wrap, anchor);
  } else {
    document.body.insertBefore(wrap, document.body.firstChild);
  }

  var FLAG = '<svg class="tmt-fl" viewBox="0 0 100 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><rect width="100" height="50" fill="#fff"/><rect width="25" height="50" fill="#d80621"/><rect x="75" width="25" height="50" fill="#d80621"/><g transform="translate(50,22.25) scale(1.5) translate(-50,-22.25)"><path fill="#d80621" d="M50 8.5l1.7 5.6c.3 1 1 .7 1.6.2l2.9-2.4-1.1 5.7c-.2 1 .3 1.1 1 .9l2.4-.8-1.7 4c-.2.5-.3.8.3 1l1.4.6-3.7 3.1c-.4.3-.4.6-.3 1l.4 1.4-3.9-.5c-.5 0-.8.2-.8.6l.2 4.1h-1l.2-4.1c0-.4-.3-.6-.8-.6l-3.9.5.4-1.4c.1-.4.1-.7-.3-1l-3.7-3.1 1.4-.6c.6-.2.5-.5.3-1l-1.7-4 2.4.8c.7.2 1.2.1 1-.9l-1.1-5.7 2.9 2.4c.6.5 1.3.8 1.6-.2z"/></g></svg>';

  function esc(s) { return String(s == null ? "" : s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }

  function pill(it) {
    var x = "";
    if (it.type === "canada") x += FLAG;
    else if (it.logo) x += '<img class="tmt-lg" src="' + esc(it.logo) + '" alt="">';
    x += "<span>" + esc(it.text) + "</span>";
    if (it.sub) x += '<span class="tmt-sub">' + esc(it.sub) + "</span>";
    var c = "tmt-pill" + (it.type === "canada" ? " ca" : "");
    return it.link
      ? '<a class="' + c + '" href="' + esc(it.link) + '" target="_blank" rel="noopener">' + x + "</a>"
      : '<span class="' + c + '">' + x + "</span>";
  }

  var track = wrap.querySelector("#tmt-tk-track");
  function render(items) {
    if (!items || !items.length) items = DEFAULT_ITEMS;
    var r = "";
    items.forEach(function (it, i) { r += pill(it); if (i < items.length - 1) r += '<span class="tmt-dot"></span>'; });
    r += '<span class="tmt-dot"></span>';
    track.innerHTML = r + r;
  }

  var current = DEFAULT_ITEMS.slice();
  render(current);

  /* ---------- make sure Firebase is available, then run ---------- */
  function ensureFirebase(cb) {
    if (window.firebase && firebase.apps && firebase.apps.length && firebase.firestore) { return cb(); }
    if (window.firebase && firebase.firestore) {
      try { if (!firebase.apps.length) firebase.initializeApp(CONFIG); } catch (e) {}
      return cb();
    }
    var base = "https://www.gstatic.com/firebasejs/10.7.1/";
    function load(file, next) {
      var s = document.createElement("script");
      s.src = base + file; s.onload = next; s.onerror = next;
      document.head.appendChild(s);
    }
    load("firebase-app-compat.js", function () {
      load("firebase-firestore-compat.js", function () {
        load("firebase-auth-compat.js", function () {
          try { if (!firebase.apps.length) firebase.initializeApp(CONFIG); } catch (e) {}
          cb();
        });
      });
    });
  }

  ensureFirebase(function () {
    var db = null, auth = null;
    try { db = firebase.firestore(); } catch (e) {}
    try { auth = firebase.auth(); } catch (e) {}
    if (!db) return;
    var DOC = function () { return db.collection("config").doc("ticker"); };

    DOC().get().then(function (snap) {
      if (snap.exists) { var d = snap.data(); if (d && Array.isArray(d.items) && d.items.length) { current = d.items; render(current); } }
    }).catch(function () {});

    var $ = function (id) { return wrap.querySelector("#" + id); };
    var key = $("tmt-key"), panel = $("tmt-panel"), loginView = $("tmt-login"), editorView = $("tmt-editor"),
        emailEl = $("tmt-email"), passEl = $("tmt-pass"), showBtn = $("tmt-show"), signinBtn = $("tmt-signin"),
        signoutBtn = $("tmt-signout"), msg = $("tmt-msg"), rows = $("tmt-rows"), addBtn = $("tmt-add"),
        saveBtn = $("tmt-save"), saved = $("tmt-saved");

    key.addEventListener("click", function (e) { e.stopPropagation(); panel.hidden = !panel.hidden; });
    document.addEventListener("click", function (e) { if (!panel.hidden && !panel.contains(e.target) && e.target !== key) panel.hidden = true; });
    showBtn.addEventListener("click", function () { var p = passEl.type === "password"; passEl.type = p ? "text" : "password"; showBtn.textContent = p ? "Hide" : "Show"; });
    function setMsg(t, k) { msg.textContent = t || ""; msg.className = "tmt-msg" + (k ? " " + k : ""); }

    signinBtn.addEventListener("click", function () {
      if (!auth) { setMsg("Login isn't available right now.", "err"); return; }
      setMsg("Signing in\u2026");
      auth.signInWithEmailAndPassword(emailEl.value.trim(), passEl.value).then(function () { setMsg(""); })
        .catch(function (err) {
          var m = err && err.code === "auth/configuration-not-found" ? "Enable Email/Password sign-in in Firebase first." : "Sign in failed. Check email and password.";
          setMsg(m, "err");
        });
    });
    signoutBtn.addEventListener("click", function () { if (auth) auth.signOut(); });

    function rowHTML(it) {
      it = it || { type: "ad", text: "", sub: "", link: "", logo: "" };
      var c = it.type === "canada";
      return '<div class="tmt-row"><div class="tmt-rhead">' +
        '<select class="r-type"><option value="ad"' + (!c ? " selected" : "") + '>Company advert</option><option value="canada"' + (c ? " selected" : "") + '>Canada Day (flag)</option></select>' +
        '<button type="button" class="tmt-del" title="Remove">\u00d7</button></div>' +
        '<input class="r-text" placeholder="Company / headline" value="' + esc(it.text) + '">' +
        '<input class="r-sub" placeholder="Small tagline (optional)" value="' + esc(it.sub) + '">' +
        '<input class="r-link" placeholder="Website link (optional)" value="' + esc(it.link) + '">' +
        '<input class="r-logo" placeholder="Logo image URL (optional)" value="' + esc(it.logo) + '"></div>';
    }
    function buildRows(items) { rows.innerHTML = (items || []).map(rowHTML).join(""); }
    rows.addEventListener("click", function (e) { if (e.target.classList.contains("tmt-del")) { var r = e.target.closest(".tmt-row"); if (r) r.remove(); } });
    addBtn.addEventListener("click", function () { rows.insertAdjacentHTML("beforeend", rowHTML()); rows.scrollTop = rows.scrollHeight; });

    function collect() {
      var out = [];
      rows.querySelectorAll(".tmt-row").forEach(function (r) {
        var text = r.querySelector(".r-text").value.trim();
        if (!text) return;
        out.push({ type: r.querySelector(".r-type").value, text: text, sub: r.querySelector(".r-sub").value.trim(), link: r.querySelector(".r-link").value.trim(), logo: r.querySelector(".r-logo").value.trim() });
      });
      return out;
    }
    saveBtn.addEventListener("click", function () {
      var items = collect();
      current = items.length ? items : DEFAULT_ITEMS.slice();
      render(current);
      saved.textContent = "Saving\u2026"; saved.className = "tmt-msg";
      DOC().set({ items: items }, { merge: true }).then(function () { saved.textContent = "Saved \u2014 live on every page."; saved.className = "tmt-msg ok"; })
        .catch(function () { saved.textContent = "Couldn't save."; saved.className = "tmt-msg err"; });
    });

    if (auth) {
      auth.onAuthStateChanged(function (user) {
        if (user && user.email === OWNER_EMAIL) { loginView.hidden = true; editorView.hidden = false; buildRows(current); setMsg(""); passEl.value = ""; }
        else { loginView.hidden = false; editorView.hidden = true; saved.textContent = ""; if (user) setMsg("That account can't edit the ticker.", "err"); }
      });
    }
  });
})();
