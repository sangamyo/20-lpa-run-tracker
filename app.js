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
  const TABS = ["learn", "today", "plan", "problems", "apps", "review", "cs", "playbook"];

  // ---------- state ----------
  const S = { logs: {}, problems: {}, apps: {}, weeks: {}, mocks: {}, meta: {}, db: null, mode: null, phase: "connecting", loaded: {},
    tab: "learn", logDate: null, reviewWeek: null, probFilter: "all", csTopic: "oop", editApp: null, appFilter: "active",
    confirmDel: null, confirmReset: null, pending: false, formKey: null, lesson: null, quiz: {}, heatMetric: "all", hmFocus: null, openQA: {} };

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
  function initialRoute() {
    const r = parseHash(location.hash); if (r) return r;
    let tab = null, lesson = null;
    try { tab = localStorage.getItem("lpa.tab"); lesson = localStorage.getItem("lpa.lesson") || null; } catch (e) {}
    return TABS.includes(tab) ? { tab, lesson: tab === "learn" ? lesson : null } : { tab: "learn", lesson: null };
  }
  function applyRoute(r) {
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
  { const r = initialRoute(); S.tab = r.tab; S.lesson = r.lesson; try { history.replaceState(null, "", "#" + tokenOf(r)); } catch (e) {} }

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
    if (S.phase === "loading" && COLS.every((k) => S.loaded[k])) { S.phase = "ready"; render(true); return; }
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
      S.mode = "none"; S.phase = "ready";
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
  function bar(label, a, t, pace) {
    if (!t) return `<div class="bar-row"><span>${label}</span><div class="bar"></div><b class="num muted" title="No target this week">${a ? a : "—"}</b></div>`;
    const pct = Math.min(100, Math.round((a / t) * 100));
    const cls = a >= t ? "good" : a >= Math.floor(t * pace) ? "warn" : "bad";
    return `<div class="bar-row"><span>${label}</span><div class="bar ${cls}"><i style="width:${pct}%"></i></div><b class="num">${a}/${t}</b></div>`;
  }
  const opt = (arr, v) => arr.map((x) => `<option${x === v ? " selected" : ""}>${esc(x)}</option>`).join("");
  const flagList = (fl, empty) => fl.length ? fl.map((k) => `<div class="flag"><b>${esc((FLAGS[k] || { title: k }).title)}</b><span class="small">${esc((FLAGS[k] || {}).fix)}</span></div>`).join("") : empty;

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
    const stuck = !s.solvedOn && s.stuck ? ` <span class="pill bad">Stuck: ask Claude for Hint 1</span>` : "";
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
  function nextLesson() {
    const ls = LS(), cw = clampW(weekNo(today()));
    return ls.find((l) => !isLessonDone(l.id) && l.week <= cw) || ls.find((l) => !isLessonDone(l.id)) || null;
  }
  const rich = (s) => esc(s).replace(/`([^`]+)`/g, "<code>$1</code>");
  let codeReg = [];
  function codeBlock(code, label) {
    const i = codeReg.push(String(code).replace(/^\n+|\s+$/g, "")) - 1;
    return `<div class="codewrap"><div class="codehead"><span class="eyebrow">${esc(label || "Python")}</span><button class="btn sm" data-act="copyCode" data-i="${i}">Copy code</button></div><pre class="code">${esc(codeReg[i])}</pre></div>`;
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
          ${bar("Lessons", doneN, ls.length, 1)}
          ${bar("Problems", solved, 150, 1)}
          ${bar("Core CS + AI Q&A", known, Object.values(CS).reduce((n, x) => n + x.qa.length, 0), 1)}
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

  function lessonPage(id) {
    const ls = LS(), i = ls.findIndex((l) => l.id === id), l = ls[i];
    if (!l) { S.lesson = null; try { history.replaceState(null, "", "#learn"); } catch (e) {} remember(); return learnHome(); }
    const prev = ls[i - 1], next = ls[i + 1], done = isLessonDone(id), qs = S.quiz[id] || {};
    const sections = (l.sections || []).map((s) => `<h2>${esc(s.h)}</h2>${(s.p || []).map((p) => `<p>${rich(p)}</p>`).join("")}${s.code ? codeBlock(s.code) : ""}${s.out ? `<div class="eyebrow" style="margin-top:8px">Output</div><pre class="out">${esc(String(s.out).replace(/\s+$/, ""))}</pre>` : ""}`).join("");
    const ex = l.example ? `<h2>Worked example: ${esc(l.example.name)}</h2>${l.example.n && P[l.example.n] ? `<p class="small"><a href="${esc(P[l.example.n].url)}" target="_blank" rel="noopener">Open #${esc(l.example.n)} on LeetCode</a></p>` : ""}<ol>${(l.example.steps || []).map((s) => `<li>${rich(s)}</li>`).join("")}</ol>${l.example.code ? codeBlock(l.example.code, "Solution") : ""}` : "";
    const quiz = (l.quiz || []).length ? `<h2>Check yourself</h2>${l.quiz.map((q, qi) => {
      const a = qs[qi];
      return `<div class="quiz"><p><b>${qi + 1}.</b> ${rich(q.q)}</p><div class="opts">${q.options.map((o, oi) => {
        const cls = a === undefined ? "" : oi === q.answer ? "right" : oi === a ? "wrong" : "";
        return `<button class="opt ${cls}" data-act="quiz" data-id="${esc(id)}" data-q="${qi}" data-o="${oi}">${rich(o)}</button>`;
      }).join("")}</div>${a !== undefined ? `<p class="small ${a === q.answer ? "okc" : ""}" style="${a === q.answer ? "" : "color:var(--bad)"}"><b>${a === q.answer ? "Correct." : "Not quite."}</b> ${rich(q.why)}</p>` : ""}</div>`;
    }).join("")}` : "";
    const pr = (l.practice || []).filter((n) => P[n]);
    return `<section class="card lesson">
        <div class="card-h"><button class="btn sm" data-act="closeLesson">← All lessons</button><span class="muted small">${esc(l.track)} · Week ${esc(l.week)} · ${esc(l.minutes)} min${done ? ` · <span class="okc">Done</span>` : ""}</span></div>
        <h1>${esc(l.title)}</h1>
        <p class="lead">${rich(l.goal)}</p>
        ${l.why ? `<p class="why"><b>Why it matters:</b> ${rich(l.why)}</p>` : ""}
        ${sections}
        ${l.template ? `<h2>Template to remember</h2>${codeBlock(l.template, "Template")}` : ""}
        ${ex}
        ${(l.mistakes || []).length ? `<h2>Common mistakes</h2><ul>${l.mistakes.map((m) => `<li>${rich(m)}</li>`).join("")}</ul>` : ""}
        ${quiz}
      </section>
      ${pr.length ? `<section class="card"><div class="card-h"><h2>Practice</h2><span class="pill num">${solvedOf(l)}/${pr.length} solved</span></div>
        <p class="small muted">Go in order. 25 min for easy, 40 for medium, then ask Claude for Hint 1. "Solved" schedules the day-3 and day-10 revisits.</p>${pr.map(probRow).join("")}</section>` : ""}
      <section class="card foot">
        ${prev ? `<button class="btn" data-act="openLesson" data-id="${esc(prev.id)}">← ${esc(prev.title)}</button>` : "<span></span>"}
        <button class="btn ${done ? "" : "primary"}" data-act="lessonDone" data-id="${esc(id)}">${done ? "Completed ✓ (undo)" : "Mark lesson complete"}</button>
        ${next ? `<button class="btn" data-act="openLesson" data-id="${esc(next.id)}">${esc(next.title)} →</button>` : "<span></span>"}
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
    const sw = (lv) => `<i style="background:var(--heat-${lv})"></i>`;
    return `<section class="card">
      <div class="card-h"><h2>Activity heatmap</h2><div class="chips">${Object.entries(L.HM).map(([k, v]) => `<button class="btn sm" data-act="heatm" data-v="${k}" aria-pressed="${k === key}">${v.label}</button>`).join("")}</div></div>
      <div class="hm-stats"><span>Current streak <b>${M.cur}</b> days</span><span>Longest streak <b>${M.best}</b> days</span><span>Active days <b>${M.active}</b>/${M.elapsed}</span><span>Total <b>${+M.total.toFixed(1)}</b> ${m.unit}</span></div>
      <div class="hm-wrap"><div class="hm" role="group" aria-label="${esc(m.label)} per day from ${esc(fmt(start, { day: "numeric", month: "short" }))} to ${esc(fmt(PLAN.deadline, { day: "numeric", month: "short" }))}. ${M.active} active days out of ${M.elapsed}. Arrow keys move between days.">${grid}</div></div>
      <div class="card-h" style="margin:10px 0 0"><span class="small muted">${esc(m.hint)}. Hover or focus a square for details; outlined square is today.</span>
        <span class="hm-legend">Less ${sw(0)}${sw(1)}${sw(2)}${sw(3)}${sw(4)} More <span class="num" style="margin-left:6px">(${m.steps[0]}–${m.steps[1]}, –${m.steps[2]}, –${m.steps[3]}, ${m.steps[3]}+)</span></span></div>
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
        ${bar("Problems", solved, 150, 1)}${bar("Lessons", doneN, ls.length, 1)}${bar("Days logged", logged, L.planDays(), 1)}
        <p class="small muted num">Applications sent ${sent} · offers ${offers} · mocks ${ms.n} (avg ${ms.avg.toFixed(1)})</p>
      </div></section>`;
  }

  VIEWS.today = {
    live() {
      const t = today(), ph = L.phase(t), cw = clampW(weekNo(t)), w = weekObj(cw), m = metrics(cw);
      const dIn = Math.min(Math.max(diffDays(w.from, t), 0), diffDays(w.from, w.to)), pace = (dIn + 1) / (diffDays(w.from, w.to) + 1);
      const sm = SCHED[L.mode(t)], bl = L.backlog(S, t), due = L.dueList(S, t), fu = L.overdueApps(S, t), wish = L.toApply(S, t), fl = L.flags(S, t);
      const next = bl.queue.slice(0, 3);
      const hero = ph === "after" ? finishedHero() : `
      <section class="card hero">
        <div>
          <div class="eyebrow">${ph === "before" ? esc(startLabel()) : "Week " + cw + " · " + fmt(w.from) + " – " + fmt(w.to)}</div>
          <h1>${esc(w.title)}</h1>
          <p class="muted small">${esc(w.topics)}</p>
          <dl class="kv"><dt>Core CS</dt><dd>${esc(w.cs)}</dd>${w.ai ? `<dt>AI track</dt><dd>${esc(w.ai)}</dd>` : ""}<dt>Project</dt><dd>${esc(w.project)}</dd><dt>Job search</dt><dd>${esc(w.job)}</dd></dl>
        </div>
        <div>
          <div class="card-h" style="margin-bottom:4px"><span class="eyebrow">This week vs target</span><span class="pill ${m.score >= 80 ? "good" : m.score >= 60 ? "warn" : "bad"}">${m.score}%</span></div>
          ${m.rows.map((r) => bar(r[0], r[1], r[2], pace)).join("")}
          ${bar("Done-means", m.checked, m.doneTotal, pace)}
          <p class="small muted">Bars turn amber when on pace for today, green when the target is hit.</p>
        </div>
      </section>`;
      const solvePill = ph === "after" ? `<span class="pill">${NUMS.filter((n) => !ps(n).solvedOn).length} unsolved</span>` : bl.behind ? `<span class="pill bad">${bl.behind} behind plan</span>` : `<span class="pill good">On plan</span>`;
      return `${hero}
      ${heatmap()}
      <div class="grid">
        ${(() => { const nl = nextLesson(); return nl ? `<section class="card">
          <div class="card-h"><h2>Today's lesson</h2><span class="pill accent">${esc(nl.minutes)} min</span></div>
          <p><b>${esc(nl.title)}</b></p><p class="small muted">${rich(nl.goal)}</p>
          <div class="actions"><button class="btn primary" data-act="openLesson" data-id="${esc(nl.id)}">Open lesson</button></div>
        </section>` : ""; })()}
        <section class="card">
          <div class="card-h"><h2>Today's schedule</h2><span class="pill accent">${esc(sm.label)}</span></div>
          <div class="sched">${sm.rows.map((r) => `<span class="num">${esc(r[0])}</span><span>${esc(r[1])}</span>`).join("")}</div>
          <p class="small muted" style="margin-top:10px">${esc(SCHED.mvd)}</p>
        </section>
        <section class="card">
          <div class="card-h"><h2>Solve next</h2>${solvePill}</div>
          ${next.length ? next.map(probRow).join("") : `<p class="ok">This week's set is done. Add company-tagged problems as extra in tonight's tracker.</p>`}
        </section>
        <section class="card">
          <div class="card-h"><h2>Revisits due</h2><span class="pill ${due.length > 6 ? "bad" : due.length ? "warn" : "good"}">${due.length}</span></div>
          ${due.length ? due.slice(0, 6).map((d) => probRow(d.n)).join("") + (due.length > 6 ? `<p class="small muted">+${due.length - 6} more in the Problems tab (filter: Revisit due).</p>` : "") : `<p class="muted small">Nothing due. Re-solve each problem 3 and 10 days after solving it, without looking at your old code.</p>`}
        </section>
        <section class="card">
          <div class="card-h"><h2>Follow-ups due</h2><span class="pill ${fu.length ? "warn" : "good"}">${fu.length}</span></div>
          ${fu.length ? `<div class="tbl"><table><tbody>${fu.slice(0, 8).map(([, a]) => `<tr><td><b>${esc(a.company)}</b><div class="muted">${esc(a.role)}</div></td><td>${esc(a.next || "Follow up")}</td><td class="num">${fmt(a.nextDate)}</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted small">No follow-ups due. Every active application should carry a next-action date.</p>`}
          ${wish.length ? `<p class="small" style="margin-top:10px"><b>To apply (${wish.length}):</b> ${wish.slice(0, 8).map(([, a]) => esc(a.company)).join(", ")}${wish.length > 8 ? ` +${wish.length - 8} more` : ""}. Wishlist companies whose next action is due.</p>` : ""}
        </section>
        <section class="card">
          <div class="card-h"><h2>Red flags</h2><span class="pill ${fl.length ? "bad" : "good"}">${fl.length || "None"}</span></div>
          ${flagList(fl, ph === "during" ? `<p class="ok">No red flags. Keep the streak.</p>` : `<p class="muted small">Red flags are checked from ${esc(fmt(PLAN.start))} to ${esc(fmt(PLAN.deadline))}.</p>`)}
        </section>
      </div>`;
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
      return `<section class="card">
        <div class="card-h"><h2>Tonight's tracker</h2><label class="inline small">Date <input type="date" id="logDate" value="${esc(d)}" min="${esc(min)}" max="${esc(t)}" style="width:auto"></label></div>
        <div class="auto">
          <div><b>New problems (${solved.length}):</b> ${solved.map((n) => esc(P[n].name) + " (" + P[n].diff + ")").join(", ") || "none yet"}. Mark them in Solve next or Problems.</div>
          <div><b>Revised (${revd.length}):</b> ${revd.map((n) => esc(P[n].name)).join(", ") || "none"}</div>
          <div><b>Applications logged (${apps.length}):</b> ${apps.map((a) => esc(a.company)).join(", ") || "none"}. Add them in Applications.</div>
        </div>
        <div class="fgrid">
          <label class="f">Extra problems (contest, company-tagged)<input id="l-extra" type="number" min="0" step="1" value="${num(l.extra)}"></label>
          <label class="f">Extra problem names<input id="l-extraNames" value="${esc(l.extraNames)}" placeholder="e.g. Weekly 420 Q2 (M)"></label>
          <label class="f">Core CS topic studied<input id="l-cs" value="${esc(l.cs)}" placeholder="e.g. DBMS isolation levels"></label>
          <label class="f">Project hours<input id="l-proj" type="number" min="0" max="24" step="0.5" value="${num(l.proj)}"></label>
          <label class="f">Referral asks sent<input id="l-refs" type="number" min="0" step="1" value="${num(l.refs)}"></label>
          <label class="f">Cold DMs sent<input id="l-dms" type="number" min="0" step="1" value="${num(l.dms)}"></label>
          <label class="f">Total study hours<input id="l-hours" type="number" min="0" max="24" step="0.5" value="${num(l.hours)}"></label>
          <div class="f"><span class="f" style="display:block">Energy (1–5)</span><div class="inline">${[1, 2, 3, 4, 5].map((e) => `<label><input type="radio" name="l-energy" value="${e}"${+l.energy === e ? " checked" : ""}>${e}</label>`).join("")}</div></div>
          <div class="inline span">
            <label><input type="checkbox" id="l-contest"${l.contest ? " checked" : ""}> Did a contest / mock OA today</label>
            <label><input type="checkbox" id="l-mvd"${l.mvd ? " checked" : ""}> Minimum viable day</label>
          </div>
          <label class="f span">Biggest blocker<input id="l-blocker" value="${esc(l.blocker)}"></label>
          <label class="f">Tomorrow #1<input id="l-t1" value="${esc(top[0])}"></label>
          <label class="f">Tomorrow #2<input id="l-t2" value="${esc(top[1])}"></label>
          <label class="f">Tomorrow #3<input id="l-t3" value="${esc(top[2])}"></label>
          <label class="f span">Notes for Claude<textarea id="l-notes">${esc(l.notes)}</textarea></label>
        </div>
        <div class="actions">
          <button class="btn primary" data-act="logSave">Save tracker for ${esc(fmt(d))}</button>
          <button class="btn" data-act="logCopy">Copy report for Claude</button>
          ${S.logs[d] ? `<span class="pill good">Saved ${esc(l.savedAt && !isNaN(new Date(l.savedAt)) ? new Date(l.savedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }) : "")}</span>` : `<span class="pill">Not saved yet</span>`}
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
            <dt>Targets</dt><dd class="num small">${w.t.prob} problems · ${w.t.apps} apps · ${w.t.refs} referral asks · ${w.t.dms} DMs · ${w.t.contests} contests · ${w.t.mocks} mocks</dd>
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
      return `<div class="grid">
        <section class="card"><div class="card-h"><h2>Pipeline</h2><span class="pill num">${all.length} total</span></div>
          <div class="chips">${STATUSES.filter((s) => counts[s]).map((s) => `<span class="pill ${s === "Offer" || s === "Accepted" ? "good" : s === "Rejected" || s === "Ghosted" ? "bad" : ["OA", "R1", "R2", "R3", "HR"].includes(s) ? "accent" : ""}">${s} <span class="num">${counts[s]}</span></span>`).join("") || `<span class="muted small">Add your first company below. Week 1 target: 60 companies as Wishlist, 10 applied.</span>`}</div>
          <p class="small muted">Rules: no response in 7 days, one follow-up (Template E). No response in 21 days, mark Ghosted. Every active row needs a next-action date.</p>
        </section>
        <section class="card"><div class="card-h"><h2>Response rate by source</h2></div>
          ${bySrc.length ? `<div class="tbl"><table><thead><tr><th>Source</th><th class="num">Sent</th><th class="num">Responses</th><th class="num">Rate</th></tr></thead><tbody>${bySrc.map((r) => `<tr><td>${esc(r[0])}</td><td class="num">${r[1]}</td><td class="num">${r[2]}</td><td class="num">${Math.round((100 * r[2]) / r[1])}%</td></tr>`).join("")}</tbody></table></div>` : `<p class="muted small">Appears once you've applied. Expect roughly 2–5% from cold applications and 10–25% from referrals.</p>`}
        </section>
      </div>
      <section class="card">
        <div class="card-h"><h2>Applications</h2><div class="chips">${fb("active", "Active")}${fb("wish", "Wishlist")}${fb("closed", "Closed")}${fb("all", "All")}</div></div>
        ${list.length ? `<div class="tbl"><table><thead><tr><th>Company</th><th>Status</th><th>Next action</th><th>Applied</th><th></th></tr></thead><tbody>${list.map(([id, a]) => {
          const late = a.nextDate && a.nextDate <= t && L.isActive(a);
          return `<tr>
          <td><b>${esc(a.company)}</b> <span class="pill">${esc(a.tier)}</span><div class="muted">${roleCell(a)}</div><div class="muted small">${esc(a.source)}${a.referral ? " · Ref: " + esc(a.referral) : ""}${a.ctc ? " · " + esc(a.ctc) : ""}</div></td>
          <td><select data-chg="appstatus" data-id="${esc(id)}" aria-label="Status for ${esc(a.company)}" style="width:auto">${opt(STATUSES, a.status)}</select></td>
          <td>${esc(a.next)}<div class="small ${late ? "" : "muted"}" style="${late ? "color:var(--bad);font-weight:600" : ""}">${a.nextDate ? fmt(a.nextDate) : "No date set"}</div></td>
          <td class="num small">${fmt(a.applied)}</td>
          <td><div class="pact"><button class="btn sm" data-act="appEdit" data-id="${esc(id)}">Edit</button><button class="btn sm danger" data-act="appDel" data-id="${esc(id)}">${S.confirmDel === id ? "Confirm delete" : "Delete"}</button></div></td></tr>`;
        }).join("")}</tbody></table></div>` : `<p class="muted small">No applications in this view.</p>`}
      </section>`;
    },
    key() { return "apps|" + (S.editApp || ""); },
    form() {
      const t = today();
      const a = (S.editApp && S.apps[S.editApp]) || { status: "Applied", tier: "C", source: "LinkedIn", applied: t, nextDate: addDays(t, 7), next: "Follow up" };
      return `<section class="card">
        <div class="card-h"><h2>${S.editApp ? "Edit application" : "Log an application"}</h2>${S.editApp ? `<button class="btn sm" data-act="appCancel">Cancel edit</button>` : ""}</div>
        <div class="fgrid">
          <label class="f">Company<input id="a-company" value="${esc(a.company)}" required></label>
          <label class="f">Role<input id="a-role" value="${esc(a.role)}" placeholder="Backend Engineer"></label>
          <label class="f">Tier<select id="a-tier">${opt(TIERS, a.tier)}</select></label>
          <label class="f">Source<select id="a-source">${opt(SOURCES, a.source)}</select></label>
          <label class="f">Status<select id="a-status">${opt(STATUSES, a.status)}</select></label>
          <label class="f">Date applied<input id="a-applied" type="date" value="${esc(a.applied)}" max="${esc(t)}"></label>
          <label class="f span">Job link<input id="a-link" type="url" value="${esc(a.link)}" placeholder="https://" aria-describedby="a-link-err"><span class="ferr" id="a-link-err" aria-live="polite"></span></label>
          <label class="f">Referral (name + status)<input id="a-referral" value="${esc(a.referral)}"></label>
          <label class="f">Contact person<input id="a-contact" value="${esc(a.contact)}"></label>
          <label class="f">Next action<input id="a-next" value="${esc(a.next)}"></label>
          <label class="f">Next action date<input id="a-nextDate" type="date" value="${esc(a.nextDate)}"></label>
          <label class="f">CTC / base range<input id="a-ctc" value="${esc(a.ctc)}"></label>
          <label class="f span">Notes (why this company, questions asked, feedback)<textarea id="a-notes">${esc(a.notes)}</textarea></label>
        </div>
        <div class="actions"><button class="btn primary" data-act="appSave">${S.editApp ? "Save changes" : "Add application"}</button></div>
        <p class="small muted">Tier A big tech · B Indian product companies · C funded startups · D robotics · E quant/fintech. For SDE roles, spread applications across A, B and C; startups (C) usually reply fastest, A and B need strong DSA. Wishlist entries get an applied date when their status moves past Wishlist.</p>
      </section>`;
    }
  };

  const reviewWeekNo = () => S.reviewWeek || clampW(weekNo(today()));
  VIEWS.review = {
    live() {
      const t = today(), wn = reviewWeekNo(), w = weekObj(wn), m = metrics(wn);
      const logs = Object.entries(S.logs).filter(([d]) => inW(d, w)).sort();
      const fl = L.flags(S, t), ph = L.phase(t);
      return `${heatmap()}<div class="grid">
        <section class="card"><div class="card-h"><h2>Week ${wn} scorecard</h2><span class="pill ${m.score >= 80 ? "good" : m.score >= 60 ? "warn" : "bad"}">${m.score}%</span></div>
          ${m.rows.map((r) => bar(r[0], r[1], r[2], 1)).join("")}
          ${bar("Done-means", m.checked, m.doneTotal, 1)}
          ${bar("Days logged", m.days, m.weekDays, 1)}
          <p class="small muted num">New list problems ${m.newP} · extra ${m.extra} · revisits ${m.revs} · study ${m.hours} h · project ${m.proj} h · energy avg ${esc(m.avgEnergy)} · MVDs ${m.mvd}</p>
        </section>
        <section class="card"><div class="card-h"><h2>Red flags now</h2><span class="pill ${fl.length ? "bad" : "good"}">${fl.length || "None"}</span></div>
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
          ${SD.map(([id, name, cover]) => `<label class="check"><input type="checkbox" data-chg="sd" data-id="${esc(id)}"${sdDone[id] ? " checked" : ""}><span><b>${esc(name)}</b><br><span class="muted small">${esc(cover)}</span></span></label>`).join("")}`;
      } else {
        body = `<p class="small muted">Read the question, answer it out loud in 30 seconds, then open it to check. Tick only what you can explain with a follow-up "why".</p>` +
          CS[k].qa.map(([q, a], i) => {
            const id = k + "-" + (i + 1), on = !!known[id];
            return `<details class="qa ${on ? "known" : ""}" data-qa="${esc(id)}"${S.openQA[id] ? " open" : ""}><summary><span class="num muted small">${i + 1}</span><span class="q">${esc(q)}</span><button class="btn sm" data-act="know" data-id="${esc(id)}" aria-pressed="${on}">${on ? "Known" : "Mark known"}</button></summary><div class="a">${esc(a)}</div></details>`;
          }).join("");
      }
      return `<section class="card"><div class="card-h"><h2>Core CS and system design</h2></div><div class="chips">${tabs}</div></section><section class="card">${body}</section>`;
    }
  };
  document.addEventListener("toggle", (e) => {
    const d = e.target; if (!d.matches || !d.matches("details.qa[data-qa]")) return;
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
    const html = `<span><b>${fmt(t, { weekday: "short", day: "numeric", month: "short" })}</b></span>
      <span>${ph === "before" ? esc(startLabel()) : ph === "after" ? "Plan finished" : "Week <b>" + w + "</b>/12 · Day <b class='num'>" + day + "</b>/" + L.planDays()}</span>
      <span><b class="num">${Math.max(left, 0)}</b> ${left === 1 ? "day" : "days"} to ${esc(fmt(PLAN.deadline, { day: "numeric", month: "short" }))}</span>
      ${ready ? `<span><b class="num">${solved}</b>/150 solved</span><span><b class="num">${apps}</b> applied</span>` : ""}`;
    const m = $("#meta"); if (m.innerHTML !== html) m.innerHTML = html;
    document.querySelectorAll("[data-tab]").forEach((b) => b.setAttribute("aria-current", b.dataset.tab === S.tab ? "page" : "false"));
  }

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
    $("#view").classList.toggle("form-first", S.tab === "apps");
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
      case "quiz": { const id = b.dataset.id; S.quiz[id] = { ...(S.quiz[id] || {}), [b.dataset.q]: +b.dataset.o }; render(); break; }
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
        const en = document.querySelector('input[name="l-energy"]:checked');
        const data = { date: d, extra: count("l-extra"), extraNames: val("l-extraNames"), cs: val("l-cs"), proj: hrs("l-proj"),
          refs: count("l-refs"), dms: count("l-dms"), hours: hrs("l-hours"), energy: en ? +en.value : null,
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
          if (inp) { inp.setAttribute("aria-invalid", "true"); inp.focus(); }
          return;
        }
        if (!canWrite()) break;
        const prev = S.editApp ? S.apps[S.editApp] : null, id = prev ? S.editApp : newId(), status = val("a-status");
        const data = { company, role: val("a-role"), tier: val("a-tier"), source: val("a-source"), status, applied: L.appliedForSave(prev, status, val("a-applied"), t),
          link, referral: val("a-referral"), contact: val("a-contact"), next: val("a-next"), nextDate: val("a-nextDate"), ctc: val("a-ctc"), notes: val("a-notes"), lastAction: t };
        S.editApp = null; S.pending = false; if (document.activeElement) document.activeElement.blur();
        if (prev) patch("apps/" + id, data); else setDoc("apps/" + id, { ...data, created: t });
        toast(company + " saved."); render(true); break;
      }
      case "appEdit": S.editApp = b.dataset.id; S.pending = false; render(true); window.scrollTo({ top: 0, behavior: "smooth" }); break;
      case "appCancel": S.editApp = null; S.pending = false; render(true); break;
      case "appDel": {
        const id = b.dataset.id;
        if (S.confirmDel !== id) { S.confirmDel = id; render(); break; }
        const name = (S.apps[id] || {}).company || "Application";
        const undo = delDoc("apps/" + id); S.confirmDel = null;
        if (undo !== null || !S.apps[id]) {
          if (S.editApp === id) { S.editApp = null; S.pending = false; render(true); }
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
