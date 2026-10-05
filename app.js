// 20 LPA Run: UI, persistence and events. Pure logic lives in logic.js (window.Logic).
(function () {
  "use strict";
  const L = window.Logic;
  const $ = (s) => document.querySelector(s);
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const cssq = (s) => (window.CSS && CSS.escape ? CSS.escape(String(s)) : String(s).replace(/["\\]/g, "\\$&"));

  // ---------- static data ----------
  L.checkPlan(window.PLAN).forEach((e) => console.error("[20 LPA Run] plan data: " + e));
  const { P, NUMS } = L.problemsIndex();
  const WEEKS = PLAN.weeks;
  const STATUSES = L.STATUSES;
  const SOURCES = ["Referral", "LinkedIn", "Wellfound", "YC Work at a Startup", "Cold DM", "Instahyre/Cutshort/Hirist", "Naukri", "Career page", "Off-campus drive", "Other"];
  const TIERS = ["A", "B", "C", "D", "E"];
  const COLS = ["logs", "problems", "apps", "weeks", "mocks", "meta"];
  const TABS = ["today", "learn", "problems", "cs", "apps", "review", "plan", "playbook"];

  // ---------- state ----------
  const S = { logs: {}, problems: {}, apps: {}, weeks: {}, mocks: {}, meta: {}, db: null, mode: null, phase: "connecting", loaded: {},
    tab: "learn", logDate: null, reviewWeek: null, probFilter: "all", csTopic: "oop", editApp: null, appFilter: "active",
    confirmDel: null, confirmReset: null, pending: false, formKey: null, lesson: null, heatMetric: "all", hmFocus: null, openQA: {},
    autoTab: false, appForm: false, openD: {} };

  // ---------- shorthands bound to S ----------
  const { today, addDays, diffDays, fmt, weekNo, clampW, weekObj, inW } = L;
  const ps = (n) => L.ps(S, n);
  const revDue = (n, t) => L.revDue(S, n, t);
  const metrics = (wn) => L.metrics(S, wn);
  let DIx = null; // per-render memo of the per-day activity index
  const DI = () => DIx || (DIx = L.dayIndex(S));

  // ---------- routing (#learn, #today, …, #lesson-<id>) ----------
  function parseHash(h) {
    h = String(h || "").replace(/^#/, "");
    if (TABS.includes(h)) return { tab: h, lesson: null };
    const m = /^lesson-([a-z0-9-]{1,80})$/.exec(h);
    return m ? { tab: "learn", lesson: m[1] } : null;
  }
  const tokenOf = (r) => (r.tab === "learn" && r.lesson ? "lesson-" + r.lesson : r.tab);
  function remember() { try { localStorage.setItem("lpa.tab", S.tab); localStorage.setItem("lpa.lesson", S.lesson || ""); } catch (e) {} }
  // A link with a hash wins. Without one, the start tab is chosen once the data is in (see pickDefaultTab).
  function initialRoute() {
    const r = parseHash(location.hash); if (r) return r;
    S.autoTab = true;
    return { tab: "learn", lesson: null };
  }
  // Default tab: Today once at least one lesson is done, else Learn. Only applies while the user hasn't navigated.
  function pickDefaultTab() {
    if (!S.autoTab) return;
    S.autoTab = false;
    const tab = Object.values(learnMeta().done || {}).some(Boolean) ? "today" : "learn";
    S.tab = tab; S.lesson = null; remember();
    try { history.replaceState(null, "", "#" + tab); } catch (e) {}
  }
  function applyRoute(r) {
    S.autoTab = false;
    if (r.tab !== S.tab) { S.pending = false; S.confirmDel = null; S.confirmReset = null; closeCopy(false); closeConfirm(); }
    if (r.tab !== S.tab || r.lesson !== S.lesson) S.pending = r.tab === S.tab ? S.pending : false;
    S.tab = r.tab; S.lesson = r.lesson; remember();
    if (S.lesson && S.phase === "ready" && (S.meta.learn || {}).last !== S.lesson && LS().some((l) => l.id === S.lesson)) quietPatch("meta/learn", { last: S.lesson });
    render(true); window.scrollTo(0, 0);
  }
  function go(tab, lesson) {
    const r = { tab, lesson: lesson || null }, tok = tokenOf(r);
    if (location.hash.slice(1) !== tok) { try { history.pushState(null, "", "#" + tok); } catch (e) { try { location.hash = tok; } catch (e2) {} } }
    applyRoute(r);
  }
  function onHash() { const r = parseHash(location.hash) || { tab: "learn", lesson: null }; if (r.tab !== S.tab || r.lesson !== S.lesson) applyRoute(r); }
  window.addEventListener("hashchange", onHash);
  window.addEventListener("popstate", onHash);
  { const r = initialRoute(); S.tab = r.tab; S.lesson = r.lesson; if (!S.autoTab) { try { history.replaceState(null, "", "#" + tokenOf(r)); } catch (e) {} } }

  // ---------- banners ----------
  const BANNERS = { offline: "", sync: "", save: "", display: "" };
  let bannerHtml = null;
  function setBanner(kind, text) {
    if (BANNERS[kind] === text) return; BANNERS[kind] = text;
    const msgs = Object.values(BANNERS).filter(Boolean), html = msgs.map((m) => `<p>${esc(m)}</p>`).join("");
    if (html === bannerHtml) return; bannerHtml = html;
    const b = $("#banner"); b.innerHTML = html; b.hidden = !msgs.length; b.setAttribute("role", "alert");
  }
  const reason = (e) => (e && (e.code || e.message)) || String(e || "unknown error");

  // ---------- toast (with optional Undo) ----------
  let toastT, toastUndo = null;
  function toast(msg, undo) {
    const t = $("#toast");
    t.innerHTML = `<span>${esc(msg)}</span>` + (undo ? `<button class="btn sm" data-act="toastUndo">Undo</button>` : "");
    toastUndo = undo || null; t.hidden = false; clearTimeout(toastT);
    toastT = setTimeout(() => { t.hidden = true; toastUndo = null; }, undo ? 6000 : 2600);
  }

  // ---------- inline confirm (window.confirm is blocked on claude.ai) ----------
  let confirmBox = null;
  function closeConfirm() { if (confirmBox) { confirmBox.remove(); confirmBox = null; } }
  function askConfirm(anchor, msg, yesLabel, onYes, onNo) {
    closeConfirm();
    const box = document.createElement("div");
    box.className = "iconfirm"; box.setAttribute("role", "alertdialog"); box.setAttribute("aria-label", msg);
    box.innerHTML = `<span>${esc(msg)}</span><button class="btn sm primary" data-cf="yes">${esc(yesLabel)}</button><button class="btn sm" data-cf="no">Cancel</button>`;
    const done = (yes) => { closeConfirm(); const f = yes ? onYes : onNo; if (f) f(); };
    box.addEventListener("click", (ev) => { const b = ev.target.closest("[data-cf]"); if (b) { ev.stopPropagation(); done(b.dataset.cf === "yes"); } });
    box.addEventListener("keydown", (ev) => { if (ev.key === "Escape") { ev.stopPropagation(); done(false); } });
    anchor.insertAdjacentElement("afterend", box); confirmBox = box;
    box.querySelector('[data-cf="no"]').focus();
  }

  // ---------- persistence ----------
  // Every partial change is a merge patch (RFC 7396) so two tabs never overwrite each other's marks.
  // Optimistic: state changes at once; on failure the change is reverted and a banner explains why.
  let inflight = 0; const stash = {}, chains = {};
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  function canWrite() {
    if (S.db && S.phase !== "ready") { toast("Still loading your data…"); return false; }
    return true;
  }
  function saveFailed(e) {
    const why = e && e.code === "quota_exceeded" ? "storage is full; delete old entries" : reason(e);
    setBanner("save", S.mode === "local" ? `Not saved: ${why}. Is the server running? Run ./start.sh` : `Not saved: ${why}. Check your connection and try again.`);
  }
  function send(path, run, revert) {
    schedule();
    if (!S.db) return Promise.resolve(true);
    inflight++;
    const p = (chains[path] || Promise.resolve()).then(() => run().catch((e) => {
      if (e && e.code === "unavailable") return delay(700 + Math.random() * 900).then(run);
      throw e;
    })).then(() => { setBanner("save", ""); if (S.mode === "local") setBanner("sync", ""); return true; },
      (e) => { revert(); saveFailed(e); schedule(); return false; })
      .finally(() => { inflight--; if (!inflight) flushStash(); });
    chains[path] = p; return p;
  }
  const split = (path) => path.split("/");
  function patchDoc(path, partial) {
    const [c, id] = split(path);
    const prev = L.clone(S[c][id]);
    const inv = L.inversePatch(prev || {}, partial);
    S[c][id] = L.mergePatch(S[c][id] || {}, partial);
    send(path, () => S.db.patch(path, partial), () => {
      const back = L.mergePatch(S[c][id] || {}, inv);
      if (prev === undefined && !Object.keys(back).length) delete S[c][id]; else S[c][id] = back;
    });
    return () => (canWrite() ? patchDoc(path, inv) : null); // undo
  }
  function patch(path, partial) { return canWrite() ? patchDoc(path, partial) : null; }
  function quietPatch(path, partial) { if (!S.db || S.phase === "ready") patchDoc(path, partial); }
  function setDoc(path, data) {
    if (!canWrite()) return null;
    const [c, id] = split(path), prev = L.clone(S[c][id]);
    S[c][id] = L.clone(data);
    send(path, () => S.db.set(path, data), () => { if (prev === undefined) delete S[c][id]; else S[c][id] = prev; });
    return () => delDoc(path);
  }
  function delDoc(path) {
    if (!canWrite()) return null;
    const [c, id] = split(path), prev = L.clone(S[c][id]);
    delete S[c][id];
    send(path, () => S.db.del(path), () => { if (prev !== undefined) S[c][id] = prev; });
    return prev === undefined ? null : () => setDoc(path, prev);
  }
  function newId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

  // Snapshot delivery: held while a write is in flight, skipped when nothing changed.
  function deliver(c, raw) {
    if (inflight) { stash[c] = raw; return; }
    const m = L.normalise(c, raw);
    S.loaded[c] = true;
    setBanner("sync", ""); setBanner("save", "");
    const changed = L.stableJson(m) !== L.stableJson(S[c]);
    if (changed) S[c] = m;
    if (S.phase === "loading" && COLS.every((k) => S.loaded[k])) { S.phase = "ready"; pickDefaultTab(); render(true); return; }
    if (changed && S.phase === "ready") schedule();
  }
  function flushStash() { Object.keys(stash).forEach((c) => { const raw = stash[c]; delete stash[c]; deliver(c, raw); }); }
  function syncError(e) {
    setBanner("sync", S.mode === "local"
      ? `Can't reach the local server (${reason(e)}). Is it running? Run ./start.sh. Retrying every 15 s.`
      : `Sync stopped (${reason(e)}). Reload the page to reconnect.`);
  }

  // Local mode: server.py serves this page and stores everything in data/db.json.
  function localDb() {
    let pending = 0, gen = 0, pullT = 0;
    const watchers = {};
    const api = (p, opt) => fetch("/api/db/" + p, Object.assign({ cache: "no-store" }, opt)).then(async (r) => {
      if (!r.ok) { let d = ""; try { d = (await r.json()).detail || ""; } catch (e) {} throw { code: "http_" + r.status, message: d }; }
      return r.status === 204 ? null : r.json();
    });
    const json = (method, data) => ({ method, headers: { "content-type": "application/json" }, body: JSON.stringify(data) });
    const write = (p, opt) => { pending++; gen++; return api(p, opt).finally(() => { pending--; gen++; if (!pending) pullSoon(); }); };
    function pull(c) {
      const w = watchers[c]; if (!w || pending) return;
      const g = gen;
      // A poll that started before or overlapped a save may carry stale data: drop it and pull again.
      api(c).then((m) => { if (g !== gen || pending) { pullSoon(); return; } w.next(m || {}); }, (e) => { if (g === gen) w.err(e); });
    }
    function pullAll() { Object.keys(watchers).forEach(pull); }
    function pullSoon() { clearTimeout(pullT); pullT = setTimeout(pullAll, 200); }
    setInterval(() => { if (!document.hidden) pullAll(); }, 15000);
    return {
      kind: "local", pullAll,
      patch: (path, partial) => write(path, json("PATCH", partial)),
      set: (path, data) => write(path, json("PUT", data)),
      del: (path) => write(path, { method: "DELETE" }),
      watch(c, next, err) { watchers[c] = { next, err }; pull(c); },
    };
  }
  // claude.ai mode: window.claude.use("db"). update() merges but can't delete keys, so "unset" is written as null.
  function claudeDb(raw) {
    return {
      kind: "claude", pullAll() {},
      patch(path, partial) {
        const ref = raw.doc(path);
        return ref.update(partial).catch((e) => {
          if (!e || e.code !== "invalid_argument") throw e;
          return Promise.resolve(ref.get ? ref.get() : null).then((snap) => {
            if (snap && snap.exists) throw e; // the doc exists: don't overwrite it with a partial
            return ref.set(L.stripNulls(partial));
          });
        });
      },
      set: (path, data) => raw.doc(path).set(data),
      del: (path) => raw.doc(path).delete(),
      watch(c, next, err) {
        return raw.collection(c).onSnapshot((snap) => { const m = {}; snap.docs.forEach((d) => { if (d.exists) m[d.id] = d.data(); }); next(m); }, err);
      },
    };
  }

  async function connect() {
    let db = null;
    try {
      const r = await fetch("/api/ping", { cache: "no-store" });
      if (r.ok && (await r.json()).ok) db = localDb();
    } catch (e) { db = null; }
    if (!db) {
      try { const raw = window.claude && window.claude.use ? await window.claude.use("db") : null; if (raw) db = claudeDb(raw); } catch (e) { db = null; }
    }
    if (!db) {
      S.mode = "none"; S.phase = "ready"; pickDefaultTab();
      setBanner("offline", "Not saving. Start the local app (run ./start.sh in the tracker folder) and open http://127.0.0.1:8765.");
      render(true); return;
    }
    S.db = db; S.mode = db.kind; S.phase = "loading"; render(true);
    COLS.forEach((c) => db.watch(c, (m) => deliver(c, m), syncError));
  }
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { if (S.db) S.db.pullAll(); checkDay(); } });

  // ---------- ui helpers ----------
  let copyReturn = null;
  function copy(text, msg) {
    const fallback = () => {
      copyReturn = document.activeElement;
      $("#copyText").value = text; $("#copyPanel").hidden = false; $("#copyText").focus(); $("#copyText").select();
    };
    try { navigator.clipboard.writeText(text).then(() => toast(msg || "Copied. Paste it to Claude."), fallback); } catch (e) { fallback(); }
  }
  function closeCopy(returnFocus) {
    const p = $("#copyPanel"); if (p.hidden) return;
    p.hidden = true;
    if (returnFocus !== false && copyReturn && document.contains(copyReturn)) copyReturn.focus();
    copyReturn = null;
  }
  // Minimal 16px stroke icons (currentColor, 1.5). Used only in card headers and task rows.
  const ICONS = {
    check: '<path d="M3.5 8.5l3 3 6-7"/>',
    clock: '<circle cx="8" cy="8" r="6"/><path d="M8 4.8V8l2.2 1.6"/>',
    flame: '<path d="M8 14.5c2.6 0 4.5-1.8 4.5-4.4 0-2.9-2.3-4.2-3.1-7.1-1.4 1.1-2.2 2.6-2.2 4-0.8-0.5-1.3-1.3-1.4-2.2C4.5 6 3.5 7.9 3.5 10.1c0 2.6 1.9 4.4 4.5 4.4z"/>',
    refresh: '<path d="M13 8a5 5 0 1 1-1.5-3.6"/><path d="M13 2.8v2.7h-2.7"/>',
    briefcase: '<rect x="2" y="5" width="12" height="8.5" rx="1.5"/><path d="M5.8 5V3.6c0-.6.5-1.1 1.1-1.1h2.2c.6 0 1.1.5 1.1 1.1V5M2 9h12"/>',
    flag: '<path d="M3.5 14.5V2.5M3.5 3h8l-1.6 2.8L11.5 8.6h-8"/>',
    book: '<path d="M8 4.2C6.7 3.2 4.8 2.8 2.5 3v9.6c2.3-.2 4.2.2 5.5 1.2 1.3-1 3.2-1.4 5.5-1.2V3c-2.3-.2-4.2.2-5.5 1.2zM8 4.2v9.6"/>',
    copy: '<rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.9c0-.8-.6-1.4-1.4-1.4H3.9c-.8 0-1.4.6-1.4 1.4v5.2c0 .8.6 1.4 1.4 1.4h1.6"/>',
    chevron: '<path d="M6 3.5L10.5 8 6 12.5"/>',
    code: '<path d="M5.5 4.5L2 8l3.5 3.5M10.5 4.5L14 8l-3.5 3.5"/>',
    calendar: '<rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.8h11M5.5 2v3M10.5 2v3"/>'
  };
  const ic = (name, cls) => `<svg class="ic${cls ? " " + cls : ""}" viewBox="0 0 16 16" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[name] || ""}</svg>`;
  const hd = (icon, text) => `<h2 class="hic">${ic(icon)}<span>${text}</span></h2>`;
  // Progress bar row. tone: "neutral" (accent fill, never red) or a pace fraction (1 = full targets).
  // fresh = first day of the week with nothing done yet: unmet targets stay neutral instead of red.
  function bar(label, a, t, tone, fresh) {
    if (!t) return `<div class="bar-row"><span>${label}</span><div class="bar"></div><b class="num muted" title="No target this week">${a ? a : "—"}</b></div>`;
    const pct = Math.min(100, Math.round((a / t) * 100));
    let cls = tone === "neutral" ? (a >= t ? "good" : "acc") : L.barTone(a, t, tone);
    if (fresh && cls === "bad") cls = "";
    return `<div class="bar-row"><span>${label}</span><div class="bar ${cls}" role="img" aria-label="${esc(label)}: ${a} of ${t}"><i style="width:${pct}%"></i></div><b class="num">${a}/${t}</b></div>`;
  }
  const BAR_LEGEND = `<p class="small muted legend">Green = target hit · amber = on pace · red = behind</p>`;
  function pacePill(wp) {
    if (wp.fresh) return `<span class="pill">Week starts today</span>`;
    if (!wp.current || wp.frac >= 1) return `<span class="pill ${L.paceTone(wp.full)}">${wp.full}%</span>`;
    return `<span class="pace"><span class="pill ${wp.tone}">On pace ${wp.pace}%</span><span class="small muted" title="Share of the full week's targets done so far"><span class="num">${wp.full}%</span> of week</span></span>`;
  }
  const stageTone = (s) => (s === "Offer" || s === "Accepted" ? "good" : s === "Rejected" || s === "Ghosted" ? "bad" : ["OA", "R1", "R2", "R3", "HR"].includes(s) ? "info" : "");
  const opt = (arr, v) => arr.map((x) => `<option${x === v ? " selected" : ""}>${esc(x)}</option>`).join("");
  const flagList = (fl, empty) => fl.length ? fl.map((k) => `<div class="flag"><b>${esc((FLAGS[k] || { title: k }).title)}</b><span class="small">${esc((FLAGS[k] || {}).fix)}</span></div>`).join("") : empty;
  // <details> that remember being opened/closed across re-renders (default used until the user toggles).
  const keepOpen = (key, dflt) => `data-keep="${esc(key)}"${(key in S.openD ? S.openD[key] : dflt) ? " open" : ""}`;
  const doneLine = (text) => `<p class="doneline">${ic("check")}<span>${text}</span></p>`;

  function probRow(n) {
    const p = P[n], s = ps(n), t = today(), due = revDue(n, t);
    let acts = "";
    if (!s.solvedOn) {
      acts = `<button class="btn sm primary" data-act="solve" data-n="${n}">Solved</button>
              <button class="btn sm" data-act="stuck" data-n="${n}" aria-pressed="${s.stuck ? "true" : "false"}">Stuck</button>`;
    } else {
      if (due) acts += `<button class="btn sm primary" data-act="rev" data-k="${due}" data-n="${n}">${due} done</button>`;
      const c = S.confirmReset === String(n);
      acts += `<button class="btn sm ${c ? "danger" : "ghost"}" data-act="reset" data-n="${n}" title="Clear the solved date and revisits">${c ? "Confirm reset" : "Reset"}</button>`;
    }
    const rv = s.solvedOn ? `<div class="psub">Solved ${fmt(s.solvedOn)} · R3 ${s.r3On ? "✓" : "due " + fmt(L.r3Due(s))} · R10 ${s.r10On ? "✓" : "due " + fmt(L.r10Due(s))}</div>` : "";
    const stuck = !s.solvedOn && s.stuck ? ` <span class="pill warn">Stuck: ask Claude for Hint 1</span>` : "";
    return `<div class="prob ${s.solvedOn ? "done" : ""}"><span class="pn num">#${n}</span>
      <div><a href="${esc(p.url)}" target="_blank" rel="noopener">${esc(p.name)}</a>${p.star ? '<span class="star" title="Top 40">★</span>' : ""}<span class="diff d-${p.diff}">${p.diff}</span>${stuck}
      <div class="psub">${esc(p.pattern)} · <code>${esc(p.tip)}</code></div>${rv}</div>
      <div class="pact">${acts}</div></div>`;
  }

  // ---------- views ----------
  const VIEWS = {};

  // ---------- learn ----------
  const TRACKS = [["Start", "Start here"], ["Python", "Python for DSA"], ["Patterns", "DSA patterns"], ["Core CS", "Core CS"], ["AI Engineer", "AI engineering"], ["Interview", "Interview skills"]];
  const LS = () => (window.LESSONS || []).filter((l) => l && l.id).slice().sort((a, b) => a.order - b.order);
  const learnMeta = () => S.meta.learn || {};
  const isLessonDone = (id) => !!(learnMeta().done || {})[id];
  const nextLesson = () => L.nextLesson(S, LS(), today());
  const rich = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  let codeReg = [];
  function codeBlock(code, label) {
    const i = codeReg.push(String(code).replace(/^\n+|\s+$/g, "")) - 1;
    return `<div class="codewrap"><div class="codehead"><span class="eyebrow">${esc(label || "Python")}</span><button class="btn sm ghost" data-act="copyCode" data-i="${i}" aria-label="Copy ${esc(label || "Python")} code">${ic("copy")}Copy</button></div><pre class="code">${esc(codeReg[i])}</pre></div>`;
  }
  const solvedOf = (l) => (l.practice || []).filter((n) => ps(n).solvedOn).length;
  const startLabel = () => "Starts " + fmt(PLAN.start, { weekday: "short" }) + " " + fmt(PLAN.start, { day: "numeric", month: "short" });
  const weekLabel = (t) => { const ph = L.phase(t); return ph === "before" ? startLabel() : ph === "after" ? "Plan finished" : "Week " + weekNo(t) + " of 12"; };

  function learnHome() {
    const ls = LS();
    if (!ls.length) return `<section class="card"><h2>No lessons loaded</h2><p class="muted">The lesson files didn't load. Reload the page.</p></section>`;
    const t = today(), cw = clampW(weekNo(t)), nx = nextLesson(), doneN = ls.filter((l) => isLessonDone(l.id)).length;
    const last = learnMeta().last && ls.find((l) => l.id === learnMeta().last);
    const solved = Object.values(S.problems).filter((p) => p.solvedOn).length;
    const known = Object.values((S.meta.cs || {}).known || {}).filter(Boolean).length;
    return `<section class="card hero">
        <div>
          <div class="eyebrow">Start here · ${esc(weekLabel(t))}</div>
          <h1>${nx ? esc(nx.title) : "Every lesson is done"}</h1>
          <p class="muted">${nx ? rich(nx.goal) : "Revise the ★ problems and run mocks from the Playbook."}</p>
          <div class="actions">
            ${nx ? `<button class="btn primary" data-act="openLesson" data-id="${esc(nx.id)}">${isLessonDone(nx.id) ? "Review" : "Start"} lesson · ${nx.minutes} min</button>` : ""}
            ${last && (!nx || last.id !== nx.id) ? `<button class="btn" data-act="openLesson" data-id="${esc(last.id)}">Resume: ${esc(last.title)}</button>` : ""}
          </div>
          <ol class="steps">
            <li>Read the lesson: when to use the pattern, the template, then the worked example.</li>
            <li>Solve 2 practice problems with a timer (25 min easy, 40 min medium). Stuck? Ask Claude for Hint 1.</li>
            <li>Re-solve each one on day 3 and day 10. The Today tab shows what's due.</li>
            <li>Log tonight's tracker and tell Claude "check my tracker".</li>
          </ol>
        </div>
        <div>
          <div class="eyebrow">Your progress</div>
          ${bar("Lessons", doneN, ls.length, "neutral")}
          ${bar("Problems", solved, 150, "neutral")}
          ${bar("Core CS + AI Q&A", known, Object.values(CS).reduce((n, x) => n + x.qa.length, 0), "neutral")}
          <p class="small muted">Lessons marked "This week" match the 12-week plan. Work through them in order; each one links to its practice problems.</p>
        </div>
      </section>
      ${heatmap()}
      <div class="grid">${TRACKS.map(([k, label]) => {
        const xs = ls.filter((l) => l.track === k); if (!xs.length) return "";
        return `<section class="card"><div class="card-h"><h2>${esc(label)}</h2><span class="pill num">${xs.filter((l) => isLessonDone(l.id)).length}/${xs.length}</span></div>
          ${xs.map((l) => {
            const d = isLessonDone(l.id), now = !d && l.week === cw, p = (l.practice || []).length;
            return `<button class="lrow" data-act="openLesson" data-id="${esc(l.id)}"><span class="dot ${d ? "done" : now ? "now" : ""}"></span>
              <span><span class="lt">${esc(l.title)}</span><span class="psub" style="display:block">Week ${esc(l.week)} · ${esc(l.minutes)} min${p ? " · " + solvedOf(l) + "/" + p + " problems" : ""}</span></span>
              ${d ? `<span class="pill good">Done</span>` : now ? `<span class="pill accent">This week</span>` : l.week < cw ? `<span class="pill warn">Catch up</span>` : ""}</button>`;
          }).join("")}</section>`;
      }).join("")}</div>`;
  }

  const LETTERS = "ABCDEFGH";
  function lessonPage(id) {
    const ls = LS(), i = ls.findIndex((l) => l.id === id), l = ls[i];
    if (!l) { S.lesson = null; try { history.replaceState(null, "", "#learn"); } catch (e) {} remember(); return learnHome(); }
    const prev = ls[i - 1], done = isLessonDone(id), qs = (learnMeta().quiz || {})[id] || {};
    const next = done ? (ls.slice(i + 1).find((x) => !isLessonDone(x.id)) || ls[i + 1]) : ls[i + 1];
    const out = (s) => `<div class="outwrap"><div class="eyebrow">Output</div><pre class="out">${esc(String(s).replace(/\s+$/, ""))}</pre></div>`;
    const sections = (l.sections || []).map((s) => `<h2>${esc(s.h)}</h2>${(s.p || []).map((p) => `<p>${rich(p)}</p>`).join("")}${s.code ? codeBlock(s.code) : ""}${s.out ? out(s.out) : ""}`).join("");
    const ex = l.example ? `<h2>Worked example: ${esc(l.example.name)}</h2>${l.example.n && P[l.example.n] ? `<p class="small"><a href="${esc(P[l.example.n].url)}" target="_blank" rel="noopener">Open #${esc(l.example.n)} on LeetCode</a></p>` : ""}<ol>${(l.example.steps || []).map((s) => `<li>${rich(s)}</li>`).join("")}</ol>${l.example.code ? codeBlock(l.example.code, "Solution") : ""}` : "";
    const qz = l.quiz || [], sc = L.quizScore(qz, qs);
    const quiz = qz.length ? `<h2>Check yourself</h2>${qz.map((q, qi) => {
      const a = Number.isInteger(qs[qi]) && qs[qi] >= 0 && qs[qi] < q.options.length ? qs[qi] : undefined, locked = a !== undefined;
      return `<div class="quiz" role="group" aria-label="Question ${qi + 1}"><p><b>${qi + 1}.</b> ${rich(q.q)}</p><div class="opts">${q.options.map((o, oi) => {
        const cls = !locked ? "" : oi === q.answer ? "right" : oi === a ? "wrong" : "dim";
        return `<button class="opt ${cls}" data-act="quiz" data-id="${esc(id)}" data-q="${qi}" data-o="${oi}"${locked ? ` aria-disabled="true"${oi === a ? ' aria-pressed="true"' : ""}` : ""}><span class="ol">${LETTERS[oi] || oi + 1}</span><span>${rich(o)}</span></button>`;
      }).join("")}</div>${locked ? `<p class="small qfb ${a === q.answer ? "okc" : "nokc"}"><b>${a === q.answer ? "Correct." : "Not quite."}</b> ${rich(q.why)} <button class="linkbtn" data-act="quizReset" data-id="${esc(id)}" data-q="${qi}">Try again</button></p>` : ""}</div>`;
    }).join("")}${sc.complete ? `<p class="qscore"><b class="num">${sc.correct}/${sc.total}</b> correct${sc.correct === sc.total ? " · nice." : ". Re-read the explanations above, then try the missed ones again."}</p>` : ""}` : "";
    const pr = (l.practice || []).filter((n) => P[n]), solvedN = solvedOf(l);
    const doneBtn = (where) => `<button class="btn ${done ? "" : "primary"}${where === "top" ? " sm" : ""}" data-act="lessonDone" data-id="${esc(id)}">${done ? (where === "top" ? ic("check") + "Done" : "Mark not done") : "Mark complete"}</button>`;
    return `<section class="card lesson" id="lessonCard">
        <div class="lhead"><button class="btn sm" data-act="closeLesson">← All lessons</button><span class="muted small">${esc(l.track)} · Week ${esc(l.week)} · ${esc(l.minutes)} min</span>${doneBtn("top")}</div>
        <h1>${esc(l.title)}</h1>
        <p class="lead">${rich(l.goal)}</p>
        ${l.why ? `<p class="why"><b>Why it matters:</b> ${rich(l.why)}</p>` : ""}
        ${sections}
        ${l.template ? `<h2>Template to remember</h2>${codeBlock(l.template, "Template")}` : ""}
        ${ex}
        ${(l.mistakes || []).length ? `<h2>Common mistakes</h2><ul>${l.mistakes.map((m) => `<li>${rich(m)}</li>`).join("")}</ul>` : ""}
        ${quiz}
      </section>
      ${pr.length ? `<section class="card practice"><div class="card-h">${hd("check", "Practice")}<span class="pill num ${solvedN === pr.length ? "good" : ""}">${solvedN}/${pr.length} solved</span></div>
        ${solvedN === pr.length ? doneLine("All practice for this lesson is solved. Revisits will show up on Today.") : `<p class="small muted">Go in order. 25 min for easy, 40 for medium, then ask Claude for Hint 1. "Solved" schedules the day-3 and day-10 revisits.</p>`}
        <div class="eyebrow" style="margin-top:12px">Start with these</div>${pr.slice(0, 2).map(probRow).join("")}
        ${pr.length > 2 ? `<details class="more" ${keepOpen("more-" + id, pr.slice(0, 2).every((n) => ps(n).solvedOn))}><summary>More practice (${pr.length - 2})</summary>${pr.slice(2).map(probRow).join("")}</details>` : ""}</section>` : ""}
      <section class="card foot">
        ${prev ? `<button class="btn" data-act="openLesson" data-id="${esc(prev.id)}">← ${esc(prev.title)}</button>` : "<span></span>"}
        ${done ? `<span class="foot-done">${next ? `<button class="btn primary" data-act="openLesson" data-id="${esc(next.id)}">Done ✓ · Next: ${esc(next.title)} →</button>` : `<span class="ok">Done ✓ · last lesson</span>`}<button class="btn ghost sm" data-act="lessonDone" data-id="${esc(id)}">Mark not done</button></span>`
          : `${doneBtn("foot")}${next ? `<button class="btn" data-act="openLesson" data-id="${esc(next.id)}">${esc(next.title)} →</button>` : "<span></span>"}`}
      </section>`;
  }

  // ---------- activity heatmap ----------
  function heatmap() {
    const key = S.heatMetric, m = L.HM[key], t = today(), start = PLAN.start;
    const M = L.heatmapModel(S, key, t, DI());
    let focusI = M.focus;
    if (S.hmFocus) { const i = diffDays(start, S.hmFocus); if (i >= 0 && i < M.days && M.val[i] !== null) focusI = i; }
    let grid = `<span aria-hidden="true"></span>` + Array.from({ length: M.cols }, (_, c) => `<span class="hm-m" aria-hidden="true">${M.months[c] || ""}</span>`).join("");
    ["Mon", "", "Wed", "", "Fri", "", "Sun"].forEach((lab, r) => {
      grid += `<span class="hm-d" aria-hidden="true">${lab}</span>`;
      for (let c = 0; c < M.cols; c++) {
        const i = c * 7 + r;
        if (i >= M.days) { grid += `<span></span>`; continue; }
        if (M.val[i] === null) { grid += `<span class="hm-cell future" aria-hidden="true"></span>`; continue; }
        const d = addDays(start, i), s = L.dayStats(S, d, DI()), x = s.v[key], lv = L.hmLevel(x, m.steps);
        const tip = `${fmt(d, { weekday: "short", day: "numeric", month: "short" })} · Week ${weekNo(d)}|${m.label}: ${+x.toFixed(1)} ${m.unit}|Problems: ${s.newP} new, ${s.rev} revisited, ${s.extra} extra|Lessons: ${s.lessons} · Q&A known: ${s.qa} · Designs: ${s.designs} · Checklist: ${s.checks}|Hours: ${s.hours}${s.contest ? " · Contest" : ""}|Apps: ${s.apps} · Referral asks: ${s.refs} · DMs: ${s.dms}|${s.logged ? "Tracker saved" : "No tracker saved"}`;
        grid += `<span class="hm-cell l${lv}${d === t ? " today" : ""}" role="img" tabindex="${i === focusI ? 0 : -1}" data-d="${d}" data-tip="${esc(tip)}" aria-label="${esc(tip.replace(/\|/g, ". "))}"></span>`;
      }
    });
    const sw = (lv) => `<i class="hm-sw l${lv}"></i>`, st = m.steps;
    const legendTip = `Empty: none · lightest: ${st[0]}–${st[1]} · ${st[1]}–${st[2]} · ${st[2]}–${st[3]} · darkest: ${st[3]}+ ${m.unit}`;
    const stat = (label, v, unit) => `<div class="hm-stat"><span class="muted small">${label}</span><span><b class="num">${v}</b> <span class="small muted">${unit}</span></span></div>`;
    return `<section class="card heat">
      <div class="card-h">${hd("flame", "Activity")}<div class="chips">${Object.entries(L.HM).map(([k, v]) => `<button class="btn sm" data-act="heatm" data-v="${k}" aria-pressed="${k === key}">${v.label}</button>`).join("")}</div></div>
      <div class="hm-body">
        <div class="hm-main">
          <div class="hm-wrap"><div class="hm" role="group" aria-label="${esc(m.label)} per day from ${esc(fmt(start, { day: "numeric", month: "short" }))} to ${esc(fmt(PLAN.deadline, { day: "numeric", month: "short" }))}. ${M.active} active days out of ${M.elapsed}. Arrow keys move between days.">${grid}</div></div>
          <div class="hm-foot"><span class="hm-legend" title="${esc(legendTip)}">Less ${sw(0)}${sw(1)}${sw(2)}${sw(3)}${sw(4)} More</span><span class="small muted">Outlined square is today.</span></div>
        </div>
        <div class="hm-side">
          ${M.total > 0 ? `<div class="hm-stats">${stat("Current streak", M.cur, M.cur === 1 ? "day" : "days")}${stat("Longest streak", M.best, M.best === 1 ? "day" : "days")}${stat("Active days", M.active + "<span class=\"muted\">/" + M.elapsed + "</span>", "")}${stat("Total", +M.total.toFixed(1), m.unit)}</div>`
            : `<p class="hm-empty">${M.elapsed ? "Your first square fills in when you mark anything today." : "Squares start filling in on " + esc(fmt(start)) + "."}</p>`}
          <p class="small muted">${esc(m.hint.charAt(0).toUpperCase() + m.hint.slice(1))}. Hover or focus a square for that day's details.</p>
        </div>
      </div>
    </section>`;
  }
  const hmTip = () => document.getElementById("hmTip");
  function showTip(el) {
    const tip = hmTip(); if (!tip) return;
    const parts = el.dataset.tip.split("|");
    tip.innerHTML = `<b>${esc(parts[0])}</b><br>` + parts.slice(1).map(esc).join("<br>");
    tip.hidden = false;
    const r = el.getBoundingClientRect(), w = tip.offsetWidth, hgt = tip.offsetHeight;
    let x = r.left + r.width / 2 - w / 2; x = Math.max(8, Math.min(x, window.innerWidth - w - 8));
    let y = r.top - hgt - 8; if (y < 8) y = r.bottom + 8;
    tip.style.left = x + "px"; tip.style.top = y + "px";
  }
  const focusedCell = () => { const a = document.activeElement; return a && a.matches && a.matches(".hm-cell[data-tip]") ? a : null; };
  document.addEventListener("mouseover", (e) => { const c = e.target.closest && e.target.closest(".hm-cell[data-tip]"); if (c) showTip(c); else if (focusedCell()) showTip(focusedCell()); else if (hmTip()) hmTip().hidden = true; });
  document.addEventListener("focusin", (e) => { const c = e.target.closest && e.target.closest(".hm-cell[data-tip]"); if (c) { S.hmFocus = c.dataset.d; showTip(c); } });
  document.addEventListener("focusout", () => { setTimeout(() => { if (!focusedCell() && hmTip()) hmTip().hidden = true; }, 0); });
  // Focus can scroll the page; keep the tooltip on the focused cell instead of hiding it.
  window.addEventListener("scroll", () => { const c = focusedCell(); if (c) showTip(c); else if (hmTip()) hmTip().hidden = true; }, { passive: true });
  document.addEventListener("keydown", (e) => {
    const c = e.target.closest && e.target.closest(".hm-cell[data-d]"); if (!c) return;
    const step = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 }[e.key];
    let target = null;
    if (step) target = document.querySelector(`.hm-cell[data-d="${addDays(c.dataset.d, step)}"]`);
    else if (e.key === "Home") target = document.querySelector(".hm-cell[data-d]");
    else if (e.key === "End") { const all = document.querySelectorAll(".hm-cell[data-d]"); target = all[all.length - 1]; }
    else return;
    e.preventDefault();
    if (!target) return;
    c.tabIndex = -1; target.tabIndex = 0; target.focus();
  });

  VIEWS.learn = { live() { codeReg = []; return S.lesson ? lessonPage(S.lesson) : learnHome(); } };

  function finishedHero() {
    const solved = Object.values(S.problems).filter((p) => p.solvedOn).length, ls = LS(), doneN = ls.filter((l) => isLessonDone(l.id)).length;
    const sent = Object.values(S.apps).filter((a) => L.isSent(a)).length, offers = Object.values(S.apps).filter((a) => a.status === "Offer" || a.status === "Accepted").length;
    const ms = L.mockSummary(S), logged = Object.keys(S.logs).filter((d) => d >= PLAN.start && d <= PLAN.deadline).length;
    return `<section class="card hero"><div>
        <div class="eyebrow">Plan finished · ${fmt(PLAN.start)} – ${fmt(PLAN.deadline)}</div>
        <h1>The 12 weeks are done</h1>
        <p class="muted">Red flags are off. Keep revising the ★ problems, follow up on open processes, and ask Claude to plan January from this summary.</p>
      </div><div>
        <div class="eyebrow">Summary</div>
        ${bar("Problems", solved, 150, "neutral")}${bar("Lessons", doneN, ls.length, "neutral")}${bar("Days logged", logged, L.planDays(), "neutral")}
        <p class="small muted num">Applications sent ${sent} · offers ${offers} · mocks ${ms.n} (avg ${ms.avg.toFixed(1)})</p>
      </div></section>`;
  }

  function taskRow(x, primary) {
    const icon = x.done ? `<span class="tk-ic done">${ic("check")}</span>` : `<span class="tk-ic"></span>`;
    let btn = "";
    if (!x.done) {
      const cls = "btn sm" + (primary ? " primary" : "");
      if (x.kind === "lesson") btn = `<button class="${cls}" data-act="openLesson" data-id="${esc(x.id)}">Open</button>`;
      else if (x.kind === "problem") btn = `<a class="${cls}" href="${esc(x.url)}" target="_blank" rel="noopener" data-task="problem">Solve</a>`;
      else if (x.kind === "revisits") btn = `<button class="${cls}" data-act="jump" data-v="t-revisits">Review</button>`;
      else if (x.kind === "followups") btn = `<button class="${cls}" data-act="tab" data-v="apps">Go</button>`;
      else if (x.kind === "log") btn = `<button class="${cls}" data-act="toLog">Go</button>`;
    }
    const kindIcon = { lesson: "book", problem: "code", revisits: "refresh", followups: "briefcase", log: "clock" }[x.kind];
    return `<li class="task${x.done ? " done" : ""}${x.emph ? " emph" : ""}" data-kind="${x.kind}">${icon}
      <span class="tk-body"><span class="tk-l">${x.done ? "" : ic(kindIcon, "tk-k")}<span>${esc(x.label)}</span></span>${x.sub ? `<span class="tk-s">${esc(x.sub)}</span>` : ""}</span>${btn}</li>`;
  }
  function weekStrip(wp) {
    const letters = ["M", "T", "W", "T", "F", "S", "S"];
    return `<ol class="wstrip" aria-label="This week: ${wp.activeDays} active ${wp.activeDays === 1 ? "day" : "days"} so far">${wp.dots.map((d) => {
      const g = new Date(d.d + "T00:00:00").getDay(), lab = letters[(g + 6) % 7];
      const st = d.future ? "upcoming" : d.active ? "active" : "no activity";
      return `<li class="${d.active ? "on" : ""}${d.today ? " today" : ""}${d.future ? " fut" : ""}" title="${esc(fmt(d.d))}: ${st}"><span class="wd" aria-hidden="true">${lab}</span><i></i><span class="sr">${esc(fmt(d.d))}: ${st}</span></li>`;
    }).join("")}</ol>`;
  }

  VIEWS.today = {
    live() {
      const t = today(), ph = L.phase(t), cw = clampW(weekNo(t)), w = weekObj(cw);
      const sm = SCHED[L.mode(t)], bl = L.backlog(S, t), due = L.dueList(S, t), fu = L.overdueApps(S, t), wish = L.toApply(S, t), fl = L.flags(S, t);
      const wp = L.weekPace(S, cw, t, DI()), m = wp.m;
      const tasks = L.todayTasks(S, t, LS(), new Date().getHours());
      const firstOpen = tasks.findIndex((x) => !x.done && (x.emph || !tasks.some((y) => y.emph)));
      const allDone = tasks.length && tasks.every((x) => x.done);
      const next = bl.queue.slice(0, 3);
      const dayOf = ph === "during" ? `Week ${cw}, day ${wp.elapsed} of ${wp.days}` : ph === "before" ? startLabel() : "Plan finished";
      const todayCard = `<section class="card todaycard">
        <div class="tc-head">
          <div><div class="eyebrow">Today</div><h1>${esc(fmt(t, { weekday: "short", day: "numeric", month: "short" }))} <span class="tc-sub"><span class="sep">· </span>${esc(dayOf)}</span></h1></div>
          ${ph === "during" ? pacePill(wp) : ""}
        </div>
        ${ph === "during" ? weekStrip(wp) : ""}
        <div class="tc-tasks">
          <div class="card-h"><h2 class="hic">${ic("check")}<span>Today's tasks</span></h2>${allDone ? `<span class="pill good">All done</span>` : `<span class="small muted num">${tasks.filter((x) => x.done).length}/${tasks.length} done</span>`}</div>
          <ul class="tasks">${tasks.map((x, i) => taskRow(x, i === firstOpen)).join("")}</ul>
        </div>
      </section>`;
      const solvePill = ph === "after" ? `<span class="pill">${NUMS.filter((n) => !ps(n).solvedOn).length} unsolved</span>` : bl.behind ? `<span class="pill bad">${bl.behind} behind plan</span>` : `<span class="pill good">On plan</span>`;
      const setDone = w.set.length && w.set.every((n) => ps(n).solvedOn);
      return `${ph === "after" ? finishedHero() : ""}${todayCard}
      <div class="grid">
        <section class="card">
          <div class="card-h">${hd("code", "Solve next")}${solvePill}</div>
          ${setDone && ph === "during" ? doneLine(`Week ${cw}'s problem set is 100% solved.`) : ""}
          ${next.length ? next.map(probRow).join("") : setDone ? `<p class="muted small">Add company-tagged problems as extra in tonight's tracker.</p>` : `<p class="muted small">Nothing queued.</p>`}
        </section>
        <section class="card" id="t-revisits">
          <div class="card-h">${hd("refresh", "Revisits due")}<span class="pill ${due.length > 6 ? "bad" : due.length ? "warn" : "good"}">${due.length || "None"}</span></div>
          ${due.length ? due.slice(0, 6).map((d) => probRow(d.n)).join("") + (due.length > 6 ? `<p class="small muted">+${due.length - 6} more in the Problems tab (filter: Revisit due).</p>` : "") : `<p class="muted small">Nothing due. Re-solve each problem 3 and 10 days after solving it, without looking at your old code.</p>`}
        </section>
        <section class="card">
          <div class="card-h">${hd("briefcase", "Follow-ups")}<span class="pill ${fu.length ? "warn" : "good"}">${fu.length || "None"}</span></div>
          ${fu.length ? `<ul class="fu">${fu.slice(0, 8).map(([, a]) => `<li><span><b>${esc(a.company)}</b><span class="muted small"> · ${esc(a.next || "Follow up")}</span></span><span class="num small fu-d">${fmt(a.nextDate, { day: "numeric", month: "short" })}</span></li>`).join("")}</ul>` : `<p class="muted small">No follow-ups due. Every active application should carry a next-action date.</p>`}
          ${wish.length ? `<p class="small" style="margin-top:10px"><b>To apply (${wish.length}):</b> ${wish.slice(0, 8).map(([, a]) => esc(a.company)).join(", ")}${wish.length > 8 ? ` +${wish.length - 8} more` : ""}. Wishlist companies whose next action is due.</p>` : ""}
        </section>
      </div>
      <section class="card">
        <div class="card-h">${hd("flag", "Red flags")}<span class="pill ${fl.length ? "bad" : "good"}">${fl.length || "None"}</span></div>
        ${flagList(fl, ph === "during" ? `<p class="ok">No red flags.${L.heatmapModel(S, "all", t, DI()).cur > 0 ? " Keep the streak." : ""}</p>` : `<p class="muted small">Red flags are checked from ${esc(fmt(PLAN.start))} to ${esc(fmt(PLAN.deadline))}.</p>`)}
      </section>
      ${ph === "after" ? "" : `<details class="card fold" ${keepOpen("t-plan", false)}>
        <summary><span class="hic">${ic("calendar")}<span>This week's plan</span></span><span class="muted small fold-s">Week ${cw} · ${esc(w.title)}</span>${ic("chevron", "chev")}</summary>
        <div class="fold-body plan2">
          <div>
            <p class="muted small">${esc(w.topics)}</p>
            <dl class="kv"><dt>Core CS</dt><dd>${esc(w.cs)}</dd>${w.ai ? `<dt>AI track</dt><dd>${esc(w.ai)}</dd>` : ""}<dt>Project</dt><dd>${esc(w.project)}</dd><dt>Job search</dt><dd>${esc(w.job)}</dd></dl>
          </div>
          <div>
            <div class="card-h" style="margin-bottom:4px"><span class="eyebrow">This week vs target</span>${pacePill(wp)}</div>
            ${m.rows.map((r) => bar(r[0], r[1], r[2], wp.frac, wp.fresh)).join("")}
            ${bar("Done-means", m.checked, m.doneTotal, wp.frac, wp.fresh)}
            ${BAR_LEGEND}
          </div>
        </div>
      </details>`}
      <details class="card fold" ${keepOpen("t-sched", false)}>
        <summary><span class="hic">${ic("clock")}<span>${esc(sm.label)}</span></span><span class="muted small fold-s">Today's schedule</span>${ic("chevron", "chev")}</summary>
        <div class="fold-body">
          <div class="sched">${sm.rows.map((r) => `<span class="num">${esc(r[0])}</span><span>${esc(r[1])}</span>`).join("")}</div>
          <p class="small muted" style="margin-top:10px">${esc(SCHED.mvd)}</p>
        </div>
      </details>`;
    },
    key() { return "today|" + shownLogDate(); },
    form() {
      const t = today(), d = shownLogDate(), l = S.logs[d] || {};
      const solved = NUMS.filter((n) => ps(n).solvedOn === d);
      const revd = NUMS.filter((n) => ps(n).r3On === d || ps(n).r10On === d);
      const apps = Object.values(S.apps).filter((a) => a.applied === d && !L.isWish(a));
      const top = Array.isArray(l.top3) ? l.top3 : ["", "", ""];
      const min = t < PLAN.start ? t : PLAN.start;
      const num = (v) => esc(v ?? "");
      // Tomorrow suggestions: next lesson, next problem in the queue, first follow-up due by tomorrow.
      const nl = nextLesson(), q = L.backlog(S, addDays(d, 1)).queue.find((n) => !ps(n).solvedOn), fu = L.overdueApps(S, addDays(d, 1))[0];
      const hint = [nl ? "Lesson: " + nl.title : "Revise ★ problems", q ? `Solve #${q} ${P[q].name}` : "2 extra problems", fu ? `Follow up: ${fu[1].company}` : "5 applications"];
      const stepper = (id, label, v, stepv, max) => `<div class="f"><label class="flabel" for="${id}">${label}</label><div class="stepper">
          <button type="button" class="btn sm" data-act="step" data-for="${id}" data-step="-${stepv}" aria-label="Decrease ${esc(label)}">−</button>
          <input id="${id}" type="number" inputmode="${stepv < 1 ? "decimal" : "numeric"}" min="0"${max ? ` max="${max}"` : ""} step="${stepv}" value="${num(v)}" placeholder="0">
          <button type="button" class="btn sm" data-act="step" data-for="${id}" data-step="${stepv}" aria-label="Increase ${esc(label)}">+</button></div></div>`;
      const ld = S.logs[d];
      let summary = "";
      if (ld) {
        const hrsV = +ld.hours || 0, streak = L.heatmapModel(S, "all", d, DI()).cur, dayN = diffDays(PLAN.start, d) + 1;
        const bits = [`${solved.length + (+ld.extra || 0)} ${solved.length + (+ld.extra || 0) === 1 ? "problem" : "problems"}`, `${revd.length} ${revd.length === 1 ? "revisit" : "revisits"}`, `${+hrsV.toFixed(1)} h`];
        if (d >= PLAN.start && d <= PLAN.deadline) bits.push(`streak ${streak}`);
        summary = `<section class="card daydone" aria-label="Day summary">
          <div>${ic("check")}<b>${d >= PLAN.start && d <= PLAN.deadline ? `Day ${dayN} done` : esc(fmt(d)) + " logged"}</b><span class="num"> · ${bits.join(" · ")}</span></div>
          <button class="btn sm" data-act="logCopy">${ic("copy")}Copy report for Claude</button></section>`;
      }
      return `${summary}<section class="card tracker" id="tracker">
        <div class="card-h">${hd("clock", "Tonight's tracker")}<label class="inline small">Date <input type="date" id="logDate" value="${esc(d)}" min="${esc(min)}" max="${esc(t)}" style="width:auto"></label></div>
        <div class="auto">
          <div><b>New problems (${solved.length}):</b> ${solved.map((n) => esc(P[n].name) + " (" + P[n].diff + ")").join(", ") || "none yet"}. Mark them in Solve next or Problems.</div>
          <div><b>Revised (${revd.length}):</b> ${revd.map((n) => esc(P[n].name)).join(", ") || "none"}</div>
          <div><b>Applications logged (${apps.length}):</b> ${apps.map((a) => esc(a.company)).join(", ") || "none"}. Add them in Applications.</div>
        </div>
        <div class="fgrid quick">
          ${stepper("l-hours", "Study hours", l.hours, 0.5, 24)}
          <div class="f"><span class="flabel" id="l-energy-l">Energy</span><div class="seg" id="l-energy" role="group" aria-labelledby="l-energy-l">${[1, 2, 3, 4, 5].map((e) => `<button type="button" data-act="energy" data-v="${e}" aria-pressed="${+l.energy === e}" aria-label="Energy ${e} of 5">${e}</button>`).join("")}</div><span class="hint">1 drained · 5 sharp</span></div>
          ${stepper("l-refs", "Referral asks", l.refs, 1)}
          ${stepper("l-dms", "Cold DMs", l.dms, 1)}
          ${stepper("l-extra", "Extra problems", l.extra, 1)}
          <div class="toggles span">
            <label class="check"><input type="checkbox" id="l-contest"${l.contest ? " checked" : ""}> <span>Did a contest / mock OA today</span></label>
            <label class="check"><input type="checkbox" id="l-mvd"${l.mvd ? " checked" : ""}> <span>Minimum viable day</span></label>
          </div>
        </div>
        <details class="refl" ${keepOpen("t-refl", true)}><summary>Reflection <span class="muted small">(2 min)</span></summary>
        <div class="fgrid">
          <label class="f">Extra problem names<input id="l-extraNames" value="${esc(l.extraNames)}" placeholder="e.g. Weekly 420 Q2 (M)"></label>
          <label class="f">Core CS topic studied<input id="l-cs" value="${esc(l.cs)}" placeholder="e.g. DBMS isolation levels"></label>
          ${stepper("l-proj", "Project hours", l.proj, 0.5, 24)}
          <label class="f span">Biggest blocker<input id="l-blocker" value="${esc(l.blocker)}"></label>
          <label class="f">Tomorrow #1<input id="l-t1" value="${esc(top[0])}" placeholder="${esc(hint[0])}"></label>
          <label class="f">Tomorrow #2<input id="l-t2" value="${esc(top[1])}" placeholder="${esc(hint[1])}"></label>
          <label class="f">Tomorrow #3<input id="l-t3" value="${esc(top[2])}" placeholder="${esc(hint[2])}"></label>
          <label class="f span">Notes for Claude<textarea id="l-notes">${esc(l.notes)}</textarea></label>
        </div></details>
        <div class="actions">
          <button class="btn primary" data-act="logSave">Save tracker for ${esc(fmt(d))}</button>
          ${ld ? "" : `<button class="btn" data-act="logCopy">Copy report for Claude</button>`}
          ${ld ? `<span class="pill good">Saved ${esc(l.savedAt && !isNaN(new Date(l.savedAt)) ? new Date(l.savedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "")}</span>` : `<span class="pill">Not saved yet</span>`}
        </div>
      </section>`;
    }
  };
  function shownLogDate() {
    const t = today(); let d = S.logDate && L.isDate(S.logDate) ? S.logDate : t;
    if (d > t) d = t;
    return d;
  }

  VIEWS.plan = {
    live() {
      const t = today(), cw = L.phase(t) === "during" ? weekNo(t) : L.phase(t) === "after" ? 13 : 0;
      return `<div class="grid">${WEEKS.map((w) => {
        const m = metrics(w.w), c = (S.weeks[String(w.w)] || {}).checks || {};
        const solved = w.set.filter((n) => ps(n).solvedOn).length;
        return `<section class="card week ${w.w === cw ? "current" : ""}">
          <div class="card-h"><div><div class="eyebrow">Week ${w.w} · ${fmt(w.from, { day: "numeric", month: "short" })} – ${fmt(w.to, { day: "numeric", month: "short" })}</div><h3>${esc(w.title)}</h3></div>
          ${w.w === cw ? `<span class="pill accent">Now</span>` : w.w < cw ? `<span class="pill ${m.score >= 80 ? "good" : m.score >= 60 ? "warn" : "bad"}">${m.score}%</span>` : ""}</div>
          <p class="small muted">${esc(w.topics)}</p>
          ${w.set.length ? `<div class="eyebrow" style="margin-top:8px">Problem set · ${solved}/${w.set.length}</div><div class="chips" style="margin-top:6px">${w.set.map((n) => `<a class="chip ${ps(n).solvedOn ? "done" : ""}" href="${esc(P[n].url)}" target="_blank" rel="noopener" title="${esc(P[n].name)}">${n}</a>`).join("")}</div>` : ""}
          <dl class="kv">
            <dt>Targets</dt><dd class="small">${w.t.prob} problems · ${w.t.apps} apps · ${w.t.refs} referral asks · ${w.t.dms} DMs · ${w.t.contests} contests · ${w.t.mocks} mocks</dd>
            <dt>Core CS</dt><dd>${esc(w.cs)}</dd>${w.ai ? `<dt>AI track</dt><dd>${esc(w.ai)}</dd>` : ""}<dt>Project</dt><dd>${esc(w.project)}</dd><dt>Job search</dt><dd>${esc(w.job)}</dd>
          </dl>
          <div class="eyebrow" style="margin-top:12px">Done means</div>
          ${w.done.map((d, i) => `<label class="check"><input type="checkbox" data-chg="wcheck" data-w="${w.w}" data-i="${i}"${c[i] ? " checked" : ""}> <span>${esc(d)}</span></label>`).join("")}
        </section>`;
      }).join("")}</div>`;
    }
  };

  VIEWS.problems = {
    live() {
      const t = today(), f = S.probFilter;
      const solved = NUMS.filter((n) => ps(n).solvedOn), stars = NUMS.filter((n) => P[n].star);
      const byD = (d) => `${solved.filter((n) => P[n].diff === d).length}/${NUMS.filter((n) => P[n].diff === d).length}`;
      const keep = (n) => f === "all" || (f === "star" && P[n].star) || (f === "open" && !ps(n).solvedOn) || (f === "due" && revDue(n, t)) || (f === "stuck" && ps(n).stuck && !ps(n).solvedOn);
      const groups = PROBLEMS.map((g) => ({ topic: g.topic, items: g.items.map((x) => x[0]), shown: g.items.map((x) => x[0]).filter(keep) })).filter((g) => g.shown.length);
      const fb = (k, label) => `<button class="btn sm" data-act="pf" data-v="${k}" aria-pressed="${f === k}">${label}</button>`;
      return `<section class="card">
        <div class="card-h"><h2>150 must-solve</h2><div class="chips">
          <span class="pill good num">${solved.length}/150 solved</span><span class="pill accent num">★ ${stars.filter((n) => ps(n).solvedOn).length}/40</span>
          <span class="pill num">E ${byD("E")}</span><span class="pill num">M ${byD("M")}</span><span class="pill num">H ${byD("H")}</span></div></div>
        <div class="chips">${fb("all", "All")}${fb("star", "★ Top 40")}${fb("open", "Unsolved")}${fb("due", "Revisit due")}${fb("stuck", "Stuck")}</div>
        <p class="small muted">Protocol: brute force + complexity (3 min), name the pattern, code it (25 min easy / 40 min medium), then ask Claude for Hint 1 if stuck. After solving, write one line: pattern + key trick.</p>
      </section>
      ${groups.length ? groups.map((g) => `<section class="card"><div class="card-h"><h2>${esc(g.topic)}</h2><span class="pill num">${g.items.filter((n) => ps(n).solvedOn).length}/${g.items.length}</span></div>${g.shown.map(probRow).join("")}</section>`).join("") : `<section class="card"><p class="muted">Nothing matches this filter.</p></section>`}`;
    }
  };

  VIEWS.apps = {
    live() {
      const all = Object.entries(S.apps), t = today();
      const counts = {}; STATUSES.forEach((s) => (counts[s] = 0)); all.forEach(([, a]) => (counts[a.status] = (counts[a.status] || 0) + 1));
      const bySrc = SOURCES.map((s) => {
        const xs = all.filter(([, a]) => a.source === s && !L.isWish(a));
        const resp = xs.filter(([, a]) => !["Applied", "Ghosted"].includes(a.status)).length;
        return [s, xs.length, resp];
      }).filter((r) => r[1]);
      const f = S.appFilter;
      const list = all.filter(([, a]) => f === "all" || (f === "active" ? L.isActive(a) && !L.isWish(a) : f === "wish" ? L.isWish(a) : !L.isActive(a)))
        .sort((x, y) => (x[1].nextDate || "9999") < (y[1].nextDate || "9999") ? -1 : 1);
      const fb = (k, label) => `<button class="btn sm" data-act="af" data-v="${k}" aria-pressed="${f === k}">${label}</button>`;
      const roleCell = (a) => { const u = L.safeUrl(a.link); return u ? `<a href="${esc(u)}" target="_blank" rel="noopener">${esc(a.role || "Job link")}</a>` : esc(a.role) + (a.link ? ` <span class="small">(${esc(a.link)})</span>` : ""); };
      const empties = { active: "No active applications. When you send one, move its status past Wishlist.", wish: "No Wishlist companies. Add the ones you plan to apply to with “+ Add application”.", closed: "Nothing closed yet. Rejected, Ghosted and Accepted applications land here.", all: "No applications yet." };
      return `<div class="grid">
        <section class="card"><div class="card-h">${hd("briefcase", "Pipeline")}<span class="pill num">${all.length} total</span></div>
          <div class="chips">${STATUSES.filter((s) => counts[s]).map((s) => `<span class="pill ${stageTone(s)}">${s} <span class="num">${counts[s]}</span></span>`).join("") || `<span class="muted small">No applications yet. Add your first company with “+ Add application”. Week 1 target: 60 companies on the Wishlist, 10 applied.</span>`}</div>
          <p class="small muted">Rules: no response in 7 days, one follow-up (Template E). No response in 21 days, mark Ghosted. Every active row needs a next-action date.</p>
          ${S.appForm ? "" : `<div class="actions"><button class="btn primary" data-act="appNew">+ Add application</button></div>`}
        </section>
        <section class="card"><div class="card-h"><h2>Response rate by source</h2></div>
          ${bySrc.length ? `<div class="tbl"><table><thead><tr><th>Source</th><th class="num">Sent</th><th class="num">Responses</th><th class="num">Rate</th></tr></thead><tbody>${bySrc.map((r) => `<tr><td>${esc(r[0])}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${Math.round((100 * r[2]) / r[1])}%</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted small">Appears once you've applied. Expect roughly 2–5% from cold applications and 10–25% from referrals.</p>`}
        </section>
      </div>
      <section class="card">
        <div class="card-h"><h2>Applications</h2><div class="chips">${fb("active", "Active")}${fb("wish", "Wishlist")}${fb("closed", "Closed")}${fb("all", "All")}</div></div>
        ${list.length ? `<div class="tbl apptbl"><table><thead><tr><th>Company</th><th>Status</th><th>Next action</th><th>Applied</th><th></th></tr></thead><tbody>${list.map(([id, a]) => {
          const late = a.nextDate && a.nextDate <= t && L.isActive(a);
          return `<tr>
          <td class="c-co"><b>${esc(a.company)}</b> <span class="pill" title="Tier ${esc(a.tier)}">${esc(a.tier)}</span><div class="muted c-role">${roleCell(a)}</div><div class="muted small c-src">${esc(a.source)}${a.referral ? " · Ref: " + esc(a.referral) : ""}${a.ctc ? " · " + esc(a.ctc) : ""}</div></td>
          <td class="c-st"><select class="st-${stageTone(a.status) || "plain"}" data-chg="appstatus" data-id="${esc(id)}" aria-label="Status for ${esc(a.company)}">${opt(STATUSES, a.status)}</select></td>
          <td class="c-nx">${esc(a.next) || `<span class="muted">No next action</span>`}<div class="small nowrap ${late ? "late" : "muted"}">${a.nextDate ? (late ? "Due " : "") + fmt(a.nextDate) : "No date set"}</div></td>
          <td class="small nowrap c-ap">${a.applied ? fmt(a.applied) : `<span class="muted">—</span>`}</td>
          <td class="c-act"><div class="pact"><button class="btn sm" data-act="appEdit" data-id="${esc(id)}">Edit</button><button class="btn sm danger" data-act="appDel" data-id="${esc(id)}">${S.confirmDel === id ? "Confirm delete" : "Delete"}</button></div></td></tr>`;
        }).join("")}</tbody></table></div>` : `<p class="muted small">${empties[f] || empties.all}</p>`}
      </section>`;
    },
    key() { return "apps|" + (S.appForm ? "open|" : "") + (S.editApp || ""); },
    form() {
      if (!S.appForm) return "";
      const t = today();
      const a = (S.editApp && S.apps[S.editApp]) || { status: "Applied", tier: "C", source: "LinkedIn", applied: t, nextDate: addDays(t, 7), next: "Follow up" };
      return `<section class="card appform" id="appForm">
        <div class="card-h"><h2>${S.editApp ? "Edit application" : "Add an application"}</h2></div>
        <div class="fgrid">
          <label class="f">Company<input id="a-company" value="${esc(a.company)}" required autocomplete="organization"></label>
          <label class="f">Role<input id="a-role" value="${esc(a.role)}" placeholder="Backend Engineer"></label>
          <label class="f">Source<select id="a-source">${opt(SOURCES, a.source)}</select></label>
          <label class="f">Status<select id="a-status">${opt(STATUSES, a.status)}</select></label>
        </div>
        <details class="more" id="a-more"${S.editApp ? " open" : ""}><summary>More details <span class="muted small">(tier, dates, link, referral, notes)</span></summary>
        <div class="fgrid">
          <label class="f">Tier<select id="a-tier">${opt(TIERS, a.tier)}</select></label>
          <label class="f">Date applied<input id="a-applied" type="date" value="${esc(a.applied)}" max="${esc(t)}"></label>
          <label class="f span">Job link<input id="a-link" type="url" value="${esc(a.link)}" placeholder="https://" aria-describedby="a-link-err"><span class="ferr" id="a-link-err" aria-live="polite"></span></label>
          <label class="f">Referral (name + status)<input id="a-referral" value="${esc(a.referral)}"></label>
          <label class="f">Contact person<input id="a-contact" value="${esc(a.contact)}"></label>
          <label class="f">Next action<input id="a-next" value="${esc(a.next)}"></label>
          <label class="f">Next action date<input id="a-nextDate" type="date" value="${esc(a.nextDate)}"></label>
          <label class="f">CTC / base range<input id="a-ctc" value="${esc(a.ctc)}"></label>
          <label class="f span">Notes (why this company, questions asked, feedback)<textarea id="a-notes">${esc(a.notes)}</textarea></label>
        </div>
        <p class="small muted">Tier A big tech · B Indian product companies · C funded startups · D robotics · E quant/fintech. For SDE roles, spread applications across A, B and C; startups (C) usually reply fastest, A and B need strong DSA. Wishlist entries get an applied date when their status moves past Wishlist.</p>
        </details>
        <div class="actions"><button class="btn primary" data-act="appSave">${S.editApp ? "Save changes" : "Add application"}</button><button class="btn" data-act="appCancel">Cancel</button></div>
      </section>`;
    }
  };

  const reviewWeekNo = () => S.reviewWeek || clampW(weekNo(today()));
  VIEWS.review = {
    live() {
      const t = today(), wn = reviewWeekNo(), w = weekObj(wn);
      const logs = Object.entries(S.logs).filter(([d]) => inW(d, w)).sort();
      const fl = L.flags(S, t), ph = L.phase(t);
      // The current week is judged on pace; past weeks on their full targets (frac 1). Future weeks: nothing yet.
      const wp = L.weekPace(S, wn, t, DI()), m = wp.m, frac = wp.current ? wp.frac : 1, fresh = wp.current && wp.fresh;
      const pill = t < w.from ? `<span class="pill">Not started</span>` : pacePill(wp);
      return `${heatmap()}<div class="grid">
        <section class="card"><div class="card-h">${hd("calendar", `Week ${wn} scorecard`)}${pill}</div>
          ${m.rows.map((r) => bar(r[0], r[1], r[2], frac, fresh)).join("")}
          ${bar("Done-means", m.checked, m.doneTotal, frac, fresh)}
          ${bar("Days logged", m.days, m.weekDays, frac, fresh)}
          ${BAR_LEGEND}
          <p class="small muted">New list problems ${m.newP} · extra ${m.extra} · revisits ${m.revs} · study ${m.hours} h · project ${m.proj} h · energy avg ${esc(m.avgEnergy)} · MVDs ${m.mvd}</p>
        </section>
        <section class="card"><div class="card-h">${hd("flag", "Red flags now")}<span class="pill ${fl.length ? "bad" : "good"}">${fl.length || "None"}</span></div>
          ${flagList(fl, ph === "during" ? `<p class="ok">Clean week so far.</p>` : `<p class="muted small">Red flags are checked from ${esc(fmt(PLAN.start))} to ${esc(fmt(PLAN.deadline))}.</p>`)}
        </section>
      </div>
      <section class="card"><div class="card-h"><h2>Daily logs · ${fmt(w.from)} – ${fmt(w.to)}</h2></div>
        ${logs.length ? `<div class="tbl"><table><thead><tr><th>Date</th><th class="num">New</th><th class="num">Extra</th><th class="num">Refs</th><th class="num">DMs</th><th class="num">Hours</th><th class="num">Energy</th><th>Blocker</th></tr></thead><tbody>${logs.map(([d, l]) => `<tr><td>${fmt(d)}${l.mvd ? ' <span class="pill warn">MVD</span>' : ""}</td><td class="num">${NUMS.filter((n) => ps(n).solvedOn === d).length}</td><td class="num">${+l.extra || 0}</td><td class="num">${+l.refs || 0}</td><td class="num">${+l.dms || 0}</td><td class="num">${+l.hours || 0}</td><td class="num">${esc(l.energy || "–")}</td><td>${esc(l.blocker)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted small">No logs this week yet.</p>`}
      </section>`;
    },
    key() { return "review|" + reviewWeekNo(); },
    form() {
      const wn = reviewWeekNo(), r = (S.weeks[String(wn)] || {}).review || {};
      return `<section class="card">
        <div class="card-h"><h2>Sunday review</h2><label class="inline small">Week <select id="reviewWeek" style="width:auto">${WEEKS.map((w) => `<option value="${w.w}"${w.w === wn ? " selected" : ""}>Week ${w.w} · ${fmt(w.from, { day: "numeric", month: "short" })}</option>`).join("")}</select></label></div>
        <div class="fgrid">
          <label class="f span">What worked<textarea id="r-worked">${esc(r.worked)}</textarea></label>
          <label class="f span">What failed<textarea id="r-failed">${esc(r.failed)}</textarea></label>
          <label class="f span">Fix for next week (specific, with numbers)<textarea id="r-fix">${esc(r.fix)}</textarea></label>
          <label class="f span">Target changes you want Claude to consider<textarea id="r-adjust">${esc(r.adjust)}</textarea></label>
        </div>
        <div class="actions"><button class="btn primary" data-act="reviewSave">Save review</button><button class="btn" data-act="reviewCopy">Copy weekly review for Claude</button></div>
      </section>`;
    }
  };

  VIEWS.cs = {
    live() {
      const k = CS[S.csTopic] || S.csTopic === "sd" ? S.csTopic : Object.keys(CS)[0], known = (S.meta.cs || {}).known || {}, sdDone = (S.meta.sd || {}).done || {};
      const tabs = Object.entries(CS).map(([id, t]) => {
        const n = t.qa.filter((_, i) => known[id + "-" + (i + 1)]).length;
        return `<button class="btn sm" data-act="cst" data-v="${esc(id)}" aria-pressed="${k === id}">${esc(t.label)} <span class="num">${n}/${t.qa.length}</span></button>`;
      }).join("") + `<button class="btn sm" data-act="cst" data-v="sd" aria-pressed="${k === "sd"}">System design <span class="num">${SD.filter((x) => sdDone[x[0]]).length}/${SD.length}</span></button>`;
      let body;
      if (k === "sd") {
        body = `<p class="small muted">Answer template (45 min): requirements 5, estimates 3, API 5, data model 5, diagram 10, deep dive on 2 components 12, bottlenecks and trade-offs 5. Free resources: system-design-primer (GitHub), ByteByteGo, Hello Interview, awesome-low-level-design.</p>
          ${SD.map(([id, name, cover]) => `<label class="check${sdDone[id] ? " on" : ""}"><input type="checkbox" data-chg="sd" data-id="${esc(id)}"${sdDone[id] ? " checked" : ""}><span><b>${esc(name)}</b><br><span class="muted small">${esc(cover)}</span></span></label>`).join("")}`;
      } else {
        body = `<p class="small muted">Read the question, answer it out loud in 30 seconds, then open it to check. Tick only what you can explain with a follow-up "why".</p>` +
          CS[k].qa.map(([q, a], i) => {
            const id = k + "-" + (i + 1), on = !!known[id];
            return `<details class="qa ${on ? "known" : ""}" data-qa="${esc(id)}"${S.openQA[id] ? " open" : ""}><summary><span class="num muted small">${i + 1}</span><span class="q">${esc(q)}</span><button class="btn sm knowbtn" data-act="know" data-id="${esc(id)}" aria-pressed="${on}">${on ? ic("check") + "Known" : "Mark known"}</button></summary><div class="a">${esc(a)}</div></details>`;
          }).join("");
      }
      return `<section class="card"><div class="card-h"><h2>Core CS and system design</h2></div><div class="chips">${tabs}</div></section><section class="card">${body}</section>`;
    }
  };
  document.addEventListener("toggle", (e) => {
    const d = e.target; if (!d.matches) return;
    if (d.matches("details[data-keep]")) { S.openD[d.dataset.keep] = d.open; return; }
    if (!d.matches("details.qa[data-qa]")) return;
    if (d.open) S.openQA[d.dataset.qa] = 1; else delete S.openQA[d.dataset.qa];
  }, true);

  function mockHistory() {
    const mocks = Object.entries(S.mocks).sort((a, b) => (a[1].date < b[1].date ? 1 : -1));
    if (!mocks.length) return `<p class="muted small">No mocks yet. The first mock OA is due in Week 5.</p>`;
    const sum = L.mockSummary(S);
    return `<p class="small">Overall average <b class="num">${sum.avg.toFixed(1)}</b> across ${sum.n} mock${sum.n === 1 ? "" : "s"} · ${sum.passed} passed. <span class="muted">Pass = average 3.5 or more and no score of 1.</span></p>
      <div class="tbl"><table><thead><tr><th>Date</th><th>Type</th><th>Problem / topic</th>${MOCK_CRITERIA.map((c, i) => `<th class="num" title="${esc(c)}">${esc(L.MOCK_SHORT[i] || c)}</th>`).join("")}<th class="num">Avg</th><th>Result</th></tr></thead><tbody>${mocks.map(([, x]) => {
        const avg = L.mockAvg(x), pass = L.mockPass(x), sc = Array.isArray(x.scores) ? x.scores : [];
        return `<tr><td>${fmt(x.date)}</td><td>${esc(x.type)}</td><td>${esc(x.topic)}</td>${MOCK_CRITERIA.map((_, i) => `<td class="num">${esc(sc[i] ?? "–")}</td>`).join("")}<td class="num">${avg.toFixed(1)}</td><td><span class="pill ${pass ? "good" : avg >= 3 ? "warn" : "bad"}">${pass ? "Pass" : "Not yet"}</span></td></tr>`;
      }).join("")}</tbody></table></div>`;
  }

  VIEWS.playbook = {
    live() {
      const nav = PLAYBOOK.map((s) => `<button class="btn sm" data-act="jump" data-v="pb-${esc(s.id)}">${esc(s.title)}</button>`).join("") +
        `<button class="btn sm" data-act="jump" data-v="pb-flags">Red-flag rules</button><button class="btn sm" data-act="jump" data-v="pb-tpl">Templates</button><button class="btn sm" data-act="jump" data-v="pb-py">Python cheatsheet</button>`;
      return `<section class="card"><div class="card-h"><h2>Playbook</h2></div><div class="subnav">${nav}</div></section>
        ${PLAYBOOK.map((s) => `<section class="card" id="pb-${esc(s.id)}"><h2>${esc(s.title)}</h2><div class="prose">${s.html}</div>
          ${s.id === "mocks" ? `<div class="eyebrow" style="margin-top:14px">Mock history</div>${mockHistory()}` : ""}
        </section>`).join("")}
        <section class="card" id="pb-flags"><h2>Red-flag rules</h2><p class="small muted">These are checked automatically and shown on Today and Review.</p>
          ${Object.values(FLAGS).map((f) => `<div class="flag"><b>${esc(f.title)}</b><span class="small">${esc(f.fix)}</span></div>`).join("")}</section>
        <section class="card" id="pb-tpl"><h2>Templates</h2><p class="small muted">Fill every [bracket] before sending. Personalise the first line every time.</p>
          ${TEMPLATES.map(([t, body], i) => `<div style="margin-top:14px"><div class="card-h" style="margin-bottom:0"><h3>${esc(t)}</h3><button class="btn sm" data-act="copyTpl" data-i="${i}">Copy</button></div><pre>${esc(body)}</pre></div>`).join("")}</section>
        <section class="card" id="pb-py"><h2>Python for interviews</h2><pre class="code">${esc(CHEATSHEET)}</pre></section>`;
    },
    form() {
      const t = today();
      return `<section class="card"><h2>Log a mock</h2>
        <div class="fgrid" style="margin-top:10px">
          <label class="f">Date<input id="m-date" type="date" value="${t}" max="${t}"></label>
          <label class="f">Type<select id="m-type">${opt(["DSA", "Mock OA", "Project", "System design", "LLD / machine coding", "HR"], "DSA")}</select></label>
          <label class="f span">Problem / topic<input id="m-topic" placeholder="e.g. Rotting Oranges, URL shortener"></label>
          ${MOCK_CRITERIA.map((c, i) => `<label class="f">${esc(c)}<select id="m-s${i}">${opt(["1", "2", "3", "4", "5"], "3")}</select></label>`).join("")}
          <label class="f span">Notes (what to fix)<textarea id="m-notes"></textarea></label>
        </div>
        <div class="actions"><button class="btn primary" data-act="mockSave">Save mock</button></div></section>`;
    }
  };

  // ---------- render ----------
  function renderHeader() {
    const t = today(), ph = L.phase(t), w = weekNo(t), day = diffDays(PLAN.start, t) + 1, left = diffDays(t, PLAN.deadline), ready = S.phase === "ready";
    const solved = Object.values(S.problems).filter((p) => p.solvedOn).length, apps = Object.values(S.apps).filter((a) => L.isSent(a)).length;
    const lft = Math.max(left, 0), short = ph === "before" ? esc(startLabel()) : ph === "after" ? "Plan finished" : `Wk ${w} · Day ${day}/${L.planDays()} · ${lft} ${lft === 1 ? "day" : "days"} left`;
    const html = `<span class="m-long"><b>${fmt(t, { weekday: "short", day: "numeric", month: "short" })}</b></span>
      <span class="m-long">${ph === "before" ? esc(startLabel()) : ph === "after" ? "Plan finished" : "Week <b>" + w + "</b>/12 · Day <b class='num'>" + day + "</b>/" + L.planDays()}</span>
      <span class="m-long"><b class="num">${lft}</b> ${left === 1 ? "day" : "days"} to ${esc(fmt(PLAN.deadline, { day: "numeric", month: "short" }))}</span>
      ${ready ? `<span class="m-long"><b class="num">${solved}</b>/150 solved</span><span class="m-long"><b class="num">${apps}</b> applied</span>` : ""}
      <span class="m-short num">${short}</span>`;
    const m = $("#meta"); if (m.innerHTML !== html) m.innerHTML = html;
    let cur = null;
    document.querySelectorAll("[data-tab]").forEach((b) => { const on = b.dataset.tab === S.tab && !S.autoTab; b.setAttribute("aria-current", on ? "page" : "false"); if (on) cur = b; });
    // Keep the active tab visible in the scrolling tab row (horizontal only; never scrolls the page).
    if (cur && cur.dataset.tab !== lastTabShown) {
      lastTabShown = cur.dataset.tab;
      const row = cur.parentElement, l = cur.offsetLeft, r = l + cur.offsetWidth;
      if (l < row.scrollLeft + 16) row.scrollLeft = Math.max(0, l - 24);
      else if (r > row.scrollLeft + row.clientWidth - 16) row.scrollLeft = r - row.clientWidth + 24;
    }
    document.body.classList.toggle("reading", S.tab === "learn" && !!S.lesson && S.phase === "ready");
    updateProgress();
  }
  let lastTabShown = null;
  // Mobile: the header is sticky with a negative top equal to its first row, so only the tab row stays pinned.
  function measureTop() { const r = document.querySelector(".top-row"); if (r) document.documentElement.style.setProperty("--toprow-h", r.offsetHeight + "px"); }
  if (window.ResizeObserver) new ResizeObserver(measureTop).observe(document.querySelector(".top-row")); else window.addEventListener("resize", measureTop);
  // Reading progress on lesson pages: share of the lesson card scrolled past the bottom of the sticky header.
  function updateProgress() {
    const bar = document.getElementById("readProg"), card = document.getElementById("lessonCard");
    if (!bar) return;
    if (!card || !document.body.classList.contains("reading")) { bar.style.transform = "scaleX(0)"; return; }
    const top = document.querySelector(".top").getBoundingClientRect().bottom, r = card.getBoundingClientRect();
    const total = Math.max(1, r.height - (window.innerHeight - top)), done = Math.min(Math.max(top - r.top, 0), total);
    bar.style.transform = `scaleX(${(done / total).toFixed(4)})`;
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  // Focus survives re-renders: remember the focused control by its data-* keys and find its replacement.
  const KEYS = ["id", "n", "v", "i", "w", "k", "q", "o", "d"];
  const FOCUSABLE = "button, input, select, textarea, a[href], [tabindex='0']";
  function describeFocus() {
    const el = document.activeElement, view = $("#view");
    if (!el || el === document.body || !view.contains(el)) return null;
    const ds = el.dataset || {}, keys = {};
    KEYS.forEach((k) => { if (ds[k] !== undefined) keys[k] = ds[k]; });
    return { elId: el.id, act: ds.act, chg: ds.chg, keys, index: Array.from(view.querySelectorAll(FOCUSABLE)).indexOf(el) };
  }
  function restoreFocus(k) {
    const view = $("#view"), a = document.activeElement;
    if (!k || (a && a !== document.body && document.contains(a))) return;
    const attrs = (ks) => ks.map((x) => `[data-${x}="${cssq(k.keys[x])}"]`).join("");
    const keyNames = Object.keys(k.keys);
    let el = k.elId ? document.getElementById(k.elId) : null;
    if (!el && (k.act || k.chg)) el = view.querySelector((k.act ? `[data-act="${cssq(k.act)}"]` : `[data-chg="${cssq(k.chg)}"]`) + attrs(keyNames));
    if (!el && (k.keys.n || k.keys.id)) el = view.querySelector(attrs(k.keys.n ? ["n"] : ["id"]));
    if (!el && k.keys.d) el = view.querySelector(".hm-cell[tabindex='0']");
    if (!el && k.index >= 0) { const all = view.querySelectorAll(FOCUSABLE); el = all[Math.min(k.index, all.length - 1)]; }
    if (el) el.focus({ preventScroll: true });
  }

  let selectHold = null, liveDeferred = false;
  document.addEventListener("focusin", (e) => { if (e.target.tagName === "SELECT" && e.target.closest("#live")) selectHold = e.target; });
  document.addEventListener("focusout", (e) => { if (e.target === selectHold) { selectHold = null; if (liveDeferred) { liveDeferred = false; schedule(); } } });

  function renderInner(forceForm) {
    DIx = null;
    renderHeader();
    const v = VIEWS[S.tab] || VIEWS.today, live = $("#live"), fe = $("#form");
    const loading = S.phase !== "ready";
    const fk = describeFocus(), y = window.scrollY;
    const hscroll = Array.from(live.querySelectorAll(".tbl, .hm-wrap")).map((e) => e.scrollLeft);
    $("#view").classList.toggle("form-first", S.tab === "apps" && S.appForm);
    // Don't rebuild the table while one of its <select>s is focused or open; render once it closes.
    if (selectHold && document.activeElement === selectHold && live.contains(selectHold)) liveDeferred = true;
    else {
      live.innerHTML = loading ? `<section class="card loading" aria-busy="true"><p>Loading your data…</p></section>` : v.live();
      const hs = live.querySelectorAll(".tbl, .hm-wrap");
      hscroll.forEach((x, i) => { if (x && hs[i]) hs[i].scrollLeft = x; });
    }
    // Forms aren't rebuilt while focused or holding unsaved edits for the same record.
    const key = loading ? "loading" : S.tab + "|" + (v.key ? v.key() : "");
    const keep = !forceForm && key === S.formKey && (fe.contains(document.activeElement) || S.pending);
    if (!keep) {
      if (key !== S.formKey) S.pending = false;
      fe.innerHTML = loading || !v.form ? "" : v.form();
      S.formKey = key;
    }
    restoreFocus(fk);
    if (Math.abs(window.scrollY - y) > 1) window.scrollTo(0, y);
    updateProgress();
  }
  function render(forceForm) {
    try { renderInner(forceForm); setBanner("display", ""); }
    catch (e) {
      console.error("[20 LPA Run] render failed:", e);
      setBanner("display", "Display error: " + (e && e.message ? e.message : e) + ". Your saved data is safe. Reload the page; if it keeps happening, send this message to Claude.");
    }
  }
  let raf = 0;
  function schedule() { if (raf) return; raf = requestAnimationFrame(() => { raf = 0; render(false); }); }

  // ---------- events ----------
  const val = (id) => { const e = document.getElementById(id); return e ? e.value.trim() : ""; };
  const count = (id) => Math.round(L.clampNum(val(id), 0));
  const hrs = (id) => Math.round(L.clampNum(val(id), 0, 24) * 2) / 2;
  document.addEventListener("input", (e) => {
    if (e.target.closest("#form") && e.target.id !== "logDate" && e.target.id !== "reviewWeek") S.pending = true;
    if (e.target.id === "a-link") { const er = $("#a-link-err"); if (er) er.textContent = ""; e.target.removeAttribute("aria-invalid"); }
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && !$("#copyPanel").hidden) { e.preventDefault(); closeCopy(); }
  });
  let resetT = 0;
  function focusAppForm() {
    const f = document.getElementById("appForm"); if (!f) return;
    window.scrollTo({ top: Math.max(0, f.getBoundingClientRect().top + window.scrollY - 140), behavior: "smooth" });
    const c = document.getElementById("a-company"); if (c) c.focus({ preventScroll: true });
  }

  document.addEventListener("click", (e) => {
    const b = e.target.closest("[data-act]"); if (!b) return;
    const act = b.dataset.act, n = b.dataset.n, t = today();
    if (act === "know") e.preventDefault();
    switch (act) {
      case "toastUndo": { const u = toastUndo; toastUndo = null; $("#toast").hidden = true; if (u && u()) toast("Undone."); break; }
      case "openLesson": go("learn", b.dataset.id); break;
      case "closeLesson": go("learn", null); break;
      case "tab": go(b.dataset.v, null); break;
      case "lessonDone": {
        const id = b.dataset.id, was = isLessonDone(id);
        const undo = patch("meta/learn", { done: { [id]: was ? null : t } });
        if (undo) toast(was ? "Lesson marked not done." : "Lesson complete. Next: solve its practice problems.", undo);
        break;
      }
      case "quiz": {
        if (b.getAttribute("aria-disabled") === "true") break; // answered: locked until "Try again"
        patch("meta/learn", { quiz: { [b.dataset.id]: { [b.dataset.q]: +b.dataset.o } } }); render(); break;
      }
      case "quizReset": {
        const id = b.dataset.id, q = b.dataset.q;
        patch("meta/learn", { quiz: { [id]: { [q]: null } } }); render();
        const first = document.querySelector(`.opt[data-id="${cssq(id)}"][data-q="${cssq(q)}"]`); if (first) first.focus();
        break;
      }
      case "energy": {
        const on = b.getAttribute("aria-pressed") === "true";
        b.parentElement.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false"));
        b.setAttribute("aria-pressed", on ? "false" : "true"); S.pending = true; break;
      }
      case "step": {
        const inp = document.getElementById(b.dataset.for); if (!inp) break;
        const st = +b.dataset.step, max = inp.max ? +inp.max : Infinity;
        const v = Math.min(Math.max((+inp.value || 0) + st, 0), max);
        inp.value = String(Math.round(v * 2) / 2); S.pending = true; break;
      }
      case "toLog": {
        const tr = document.getElementById("tracker"); if (!tr) break;
        tr.scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth", block: "start" });
        const h = document.getElementById("l-hours"); if (h) h.focus({ preventScroll: true });
        break;
      }
      case "appNew": S.appForm = true; S.editApp = null; S.pending = false; render(true); focusAppForm(); break;
      case "heatm": S.heatMetric = b.dataset.v; render(); break;
      case "copyCode": copy(codeReg[+b.dataset.i] || "", "Code copied. Paste it into your editor."); break;
      case "solve": { const undo = patch("problems/" + n, { solvedOn: t, stuck: false }); if (undo) toast("Solved. R3 revisit due " + fmt(addDays(t, 3)) + ".", undo); break; }
      case "stuck": patch("problems/" + n, { stuck: !ps(n).stuck }); break;
      case "rev": { const undo = patch("problems/" + n, { [b.dataset.k === "R3" ? "r3On" : "r10On"]: t }); if (undo) toast(b.dataset.k + " revisit logged.", undo); break; }
      case "reset": {
        clearTimeout(resetT);
        if (S.confirmReset === n) {
          S.confirmReset = null;
          const undo = patch("problems/" + n, { solvedOn: null, r3On: null, r10On: null, stuck: null });
          if (undo) toast("#" + n + " reset to unsolved.", undo);
        } else {
          S.confirmReset = n; render();
          resetT = setTimeout(() => { if (S.confirmReset === n) { S.confirmReset = null; render(); } }, 4000);
        }
        break;
      }
      case "pf": S.probFilter = b.dataset.v; render(); break;
      case "af": S.appFilter = b.dataset.v; S.confirmDel = null; render(); break;
      case "cst": S.csTopic = b.dataset.v; render(); break;
      case "know": {
        const id = b.dataset.id, on = !!((S.meta.cs || {}).known || {})[id];
        const undo = patch("meta/cs", { known: { [id]: on ? null : t } });
        if (undo) toast(on ? "Unmarked." : "Marked known.", undo);
        break;
      }
      case "jump": { const el = document.getElementById(b.dataset.v); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); break; }
      case "copyTpl": copy(TEMPLATES[+b.dataset.i][1], "Template copied. Fill the [brackets] before sending."); break;
      case "closeCopy": closeCopy(); break;
      case "logSave": {
        const d = ($("#logDate") && $("#logDate").value) || shownLogDate();
        if (!L.isDate(d) || d > t) { toast("Pick a date up to today."); break; }
        const en = document.querySelector('#l-energy [aria-pressed="true"]');
        const data = { date: d, extra: count("l-extra"), extraNames: val("l-extraNames"), cs: val("l-cs"), proj: hrs("l-proj"),
          refs: count("l-refs"), dms: count("l-dms"), hours: hrs("l-hours"), energy: en ? +en.dataset.v : null,
          contest: $("#l-contest").checked, mvd: $("#l-mvd").checked, blocker: val("l-blocker"),
          top3: [val("l-t1"), val("l-t2"), val("l-t3")], notes: val("l-notes"), savedAt: new Date().toISOString() };
        if (!canWrite()) break;
        S.logDate = d === t || S.logDatePinned ? null : d; S.logDatePinned = false; S.pending = false;
        if (document.activeElement) document.activeElement.blur();
        patch("logs/" + d, data); toast("Tracker saved for " + fmt(d) + ". Copy it to Claude or say \"check my tracker\"."); render(true); break;
      }
      case "logCopy": { const d = ($("#logDate") && $("#logDate").value) || shownLogDate(); copy(L.report(S, L.isDate(d) ? d : t)); break; }
      case "appSave": {
        const company = val("a-company"); if (!company) { toast("Add the company name first."); document.getElementById("a-company").focus(); return; }
        const link = val("a-link");
        if (link && !L.safeUrl(link)) {
          const er = $("#a-link-err"), inp = $("#a-link");
          if (er) er.textContent = "Use a full web address starting with http:// or https://, or leave it empty.";
          const more = $("#a-more"); if (more) more.open = true;
          if (inp) { inp.setAttribute("aria-invalid", "true"); inp.focus(); }
          return;
        }
        if (!canWrite()) break;
        const prev = S.editApp ? S.apps[S.editApp] : null, id = prev ? S.editApp : newId(), status = val("a-status");
        const data = { company, role: val("a-role"), tier: val("a-tier"), source: val("a-source"), status, applied: L.appliedForSave(prev, status, val("a-applied"), t),
          link, referral: val("a-referral"), contact: val("a-contact"), next: val("a-next"), nextDate: val("a-nextDate"), ctc: val("a-ctc"), notes: val("a-notes"), lastAction: t };
        S.editApp = null; S.appForm = false; S.pending = false; if (document.activeElement) document.activeElement.blur();
        if (prev) patch("apps/" + id, data); else setDoc("apps/" + id, { ...data, created: t });
        toast(company + " saved."); render(true); break;
      }
      case "appEdit": S.editApp = b.dataset.id; S.appForm = true; S.pending = false; render(true); focusAppForm(); break;
      case "appCancel": { const was = S.editApp; S.editApp = null; S.appForm = false; S.pending = false; render(true);
        const back = was ? document.querySelector(`[data-act="appEdit"][data-id="${cssq(was)}"]`) : document.querySelector('[data-act="appNew"]'); if (back) back.focus(); break; }
      case "appDel": {
        const id = b.dataset.id;
        if (S.confirmDel !== id) { S.confirmDel = id; render(); break; }
        const name = (S.apps[id] || {}).company || "Application";
        const undo = delDoc("apps/" + id); S.confirmDel = null;
        if (undo !== null || !S.apps[id]) {
          if (S.editApp === id) { S.editApp = null; S.appForm = false; S.pending = false; render(true); }
          toast(name + " deleted.", undo || undefined);
        }
        break;
      }
      case "reviewSave": {
        if (!canWrite()) break;
        const wn = reviewWeekNo();
        S.pending = false; if (document.activeElement) document.activeElement.blur();
        patch("weeks/" + wn, { review: { worked: val("r-worked"), failed: val("r-failed"), fix: val("r-fix"), adjust: val("r-adjust"), savedAt: new Date().toISOString() } });
        toast("Review saved."); render(true); break;
      }
      case "reviewCopy": copy(L.weeklyReport(S, reviewWeekNo(), t)); break;
      case "mockSave": {
        if (!canWrite()) break;
        const d = val("m-date");
        setDoc("mocks/" + newId(), { date: L.isDate(d) && d <= t ? d : t, type: val("m-type"), topic: val("m-topic"), scores: MOCK_CRITERIA.map((_, i) => +val("m-s" + i)), notes: val("m-notes") });
        S.pending = false; toast("Mock saved."); render(true); break;
      }
    }
  });

  document.addEventListener("change", (e) => {
    const el = e.target, t = today();
    if (el.id === "logDate") {
      const cur = shownLogDate(), nv = el.value, min = t < PLAN.start ? t : PLAN.start;
      if (!L.isDate(nv) || nv > t || nv < min) { el.value = cur; toast("Pick a date from " + fmt(min) + " to today."); return; }
      if (nv === cur) return;
      const go2 = () => { S.logDate = nv === t ? null : nv; S.logDatePinned = false; S.pending = false; render(true); const x = $("#logDate"); if (x) x.focus(); };
      if (S.pending) { el.value = cur; askConfirm(el.closest(".card-h"), `You have unsaved changes for ${fmt(cur)}.`, `Discard and open ${fmt(nv)}`, go2, () => { const x = $("#logDate"); if (x) x.focus(); }); return; }
      go2(); return;
    }
    if (el.id === "reviewWeek") {
      const nv = +el.value, cur = reviewWeekNo();
      const go2 = () => { S.reviewWeek = nv; S.pending = false; render(true); const x = $("#reviewWeek"); if (x) x.focus(); };
      if (S.pending) { el.value = String(cur); askConfirm(el.closest(".card-h"), `You have unsaved changes for week ${cur}.`, `Discard and open week ${nv}`, go2, () => { const x = $("#reviewWeek"); if (x) x.focus(); }); return; }
      go2(); return;
    }
    const k = el.dataset.chg; if (!k) return;
    if (el === selectHold) selectHold = null;
    if (k === "wcheck") {
      if (!patch("weeks/" + el.dataset.w, { checks: { [el.dataset.i]: el.checked ? t : null } })) el.checked = !el.checked;
    } else if (k === "appstatus") {
      const id = el.dataset.id, a = S.apps[id];
      if (a && !patch("apps/" + id, L.appStatusPatch(a, el.value, t))) el.value = a.status;
    } else if (k === "sd") {
      if (!patch("meta/sd", { done: { [el.dataset.id]: el.checked ? t : null } })) el.checked = !el.checked;
    }
  });

  // Refresh date-driven views when the day rolls over; an open, edited tracker keeps its date.
  let lastDay = today();
  function checkDay() {
    const t = today(); if (t === lastDay) return;
    const prev = lastDay; lastDay = t;
    if (S.tab === "today" && S.pending && !S.logDate) { S.logDate = prev; S.logDatePinned = true; }
    render();
  }
  setInterval(checkDay, 30000);

  render(true);
  connect();
})();
