// Pure logic for the 20 LPA Run tracker: dates, plan maths, metrics, red flags, revisits, heatmap
// numbers, report text and data normalisation. Nothing here touches the DOM, so it runs in the browser
// (window.Logic) and in Node tests (tests/logic.test.mjs loads it into a vm context).
// Functions that read tracker data take the state object S = { logs, problems, apps, weeks, mocks, meta }.
(function (G) {
  "use strict";
  const plan = () => G.PLAN;

  // ---------- dates (YYYY-MM-DD strings, local time) ----------
  const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
  const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  const today = () => iso(new Date());
  const isDate = (s) => typeof s === "string" && DATE_RE.test(s) && !isNaN(new Date(s + "T00:00:00")) && iso(new Date(s + "T00:00:00")) === s;
  const addDays = (s, n) => { const d = new Date(s + "T00:00:00"); d.setDate(d.getDate() + n); return iso(d); };
  const diffDays = (a, b) => Math.round((new Date(b + "T00:00:00") - new Date(a + "T00:00:00")) / 864e5);
  const maxDate = (a, b) => (a > b ? a : b);
  const fmt = (s, o) => (isDate(s) ? new Date(s + "T00:00:00").toLocaleDateString("en-IN", o || { weekday: "short", day: "numeric", month: "short" }) : "");
  const planDays = () => diffDays(plan().start, plan().deadline) + 1;
  // Week 1 starts on PLAN.start; 28–31 Dec belong to week 12 (it ends on the deadline). 0 = before, 13 = after.
  function weekNo(s) {
    const P = plan();
    if (s < P.start) return 0;
    if (s > P.deadline) return 13;
    return Math.min(Math.floor(diffDays(P.start, s) / 7) + 1, 12);
  }
  const clampW = (w) => Math.min(Math.max(w, 1), 12);
  const weekObj = (w) => plan().weeks[clampW(w) - 1];
  const phase = (t) => (t < plan().start ? "before" : t > plan().deadline ? "after" : "during");
  const mode = (s) => { if (s > plan().internEnd) return "full"; const g = new Date(s + "T00:00:00").getDay(); return g === 6 ? "sat" : g === 0 ? "sun" : "intern"; };
  const inW = (d, w) => !!d && d >= w.from && d <= w.to;

  // ---------- static problem list ----------
  let _P = null, _NUMS = null;
  function problemsIndex() {
    if (_P) return { P: _P, NUMS: _NUMS };
    _P = {};
    (G.PROBLEMS || []).forEach((g) => g.items.forEach(([n, name, diff, pattern, tip, star, ov]) => {
      const slug = ov || name.toLowerCase().replace(/[^a-z0-9 -]/g, "").trim().replace(/\s+/g, "-").replace(/-+/g, "-");
      _P[n] = { n, name, diff, pattern, tip, star: star === 1, topic: g.topic, url: slug.startsWith("http") ? slug : "https://leetcode.com/problems/" + slug + "/" };
    }));
    _NUMS = Object.keys(_P).map(Number).sort((a, b) => a - b);
    return { P: _P, NUMS: _NUMS };
  }
  const ps = (S, n) => S.problems[String(n)] || {};

  // ---------- revisits ----------
  // R3 is due 3 days after solving. R10 is due 10 days after solving, but never sooner than 7 days after a late R3.
  const r3Due = (p) => addDays(p.solvedOn, 3);
  const r10Due = (p) => (p.r3On ? maxDate(addDays(p.solvedOn, 10), addDays(p.r3On, 7)) : addDays(p.solvedOn, 10));
  function revDue(S, n, t) {
    const p = ps(S, n); if (!p.solvedOn) return null;
    if (!p.r3On) return r3Due(p) <= t ? "R3" : null;
    if (!p.r10On && r10Due(p) <= t) return "R10";
    return null;
  }
  function dueList(S, t) {
    const out = [];
    problemsIndex().NUMS.forEach((n) => {
      const k = revDue(S, n, t); if (!k) return;
      const p = ps(S, n);
      out.push({ n, kind: k, due: k === "R3" ? r3Due(p) : r10Due(p), late: diffDays(k === "R3" ? r3Due(p) : r10Due(p), t) });
    });
    return out.sort((a, b) => b.late - a.late || a.n - b.n);
  }
  function backlog(S, t) {
    const cw = Math.max(weekNo(t), 1); const behind = [], cur = [];
    plan().weeks.forEach((w) => w.set.forEach((n) => {
      if (ps(S, n).solvedOn) return;
      if (w.w < cw) behind.push(n); else if (w.w === cw) cur.push(n);
    }));
    return { behind: behind.length, queue: behind.concat(cur) };
  }

  // ---------- applications ----------
  const STATUSES = ["Wishlist", "Applied", "OA", "R1", "R2", "R3", "HR", "Offer", "Accepted", "Rejected", "Ghosted"];
  const CLOSED = ["Rejected", "Ghosted", "Accepted"];
  const isActive = (a) => !CLOSED.includes(a.status);
  const isWish = (a) => a.status === "Wishlist";
  // An application counts as sent once it has left Wishlist and has an applied date that isn't in the future.
  const isSent = (a, t) => !isWish(a) && isDate(a.applied) && (!t || a.applied <= t);
  const byNext = (x, y) => (x[1].nextDate < y[1].nextDate ? -1 : x[1].nextDate > y[1].nextDate ? 1 : 0);
  const overdueApps = (S, t) => Object.entries(S.apps).filter(([, a]) => isActive(a) && !isWish(a) && a.nextDate && a.nextDate <= t).sort(byNext);
  const toApply = (S, t) => Object.entries(S.apps).filter(([, a]) => isWish(a) && a.nextDate && a.nextDate <= t).sort(byNext);
  // Fields to change when an application's status changes (table dropdown).
  function appStatusPatch(prev, status, t) {
    const out = { status, lastAction: t };
    if (status !== "Wishlist" && (!prev.applied || prev.status === "Wishlist")) out.applied = t;
    return out;
  }
  // Applied date for a saved application form.
  function appliedForSave(prev, status, applied, t) {
    if (status === "Wishlist") return prev ? applied : ""; // a new Wishlist entry hasn't been applied to yet
    if (!applied) return t;
    if (prev && prev.status === "Wishlist" && applied === (prev.applied || "")) return t;
    return applied;
  }
  function safeUrl(u) {
    if (typeof u !== "string") return "";
    const s = u.trim();
    if (!/^https?:\/\/[^\s]+$/i.test(s)) return "";
    try { const x = new URL(s); return x.protocol === "http:" || x.protocol === "https:" ? s : ""; } catch (e) { return ""; }
  }

  // ---------- mocks ----------
  const MOCK_SHORT = ["Clarify", "Approach", "Correct", "Quality", "Testing", "Comms", "Time"];
  const mockScores = (m) => (Array.isArray(m.scores) ? m.scores : []).map(Number).filter((x) => x >= 1 && x <= 5);
  const mockAvg = (m) => { const v = mockScores(m); return v.length ? v.reduce((a, b) => a + b, 0) / v.length : 0; };
  const mockPass = (m) => { const v = mockScores(m); return v.length > 0 && mockAvg(m) >= 3.5 && !v.includes(1); };
  function mockSummary(S) {
    const ms = Object.values(S.mocks).filter((m) => mockScores(m).length);
    return { n: ms.length, avg: ms.length ? ms.reduce((s, m) => s + mockAvg(m), 0) / ms.length : 0, passed: ms.filter(mockPass).length };
  }

  // ---------- weekly metrics ----------
  function metrics(S, wn) {
    const w = weekObj(wn);
    const m = { newP: 0, extra: 0, revs: 0, apps: 0, refs: 0, dms: 0, contests: 0, mocks: 0, hours: 0, proj: 0, energy: [], days: 0, mvd: 0 };
    Object.values(S.problems).forEach((p) => { if (inW(p.solvedOn, w)) m.newP++; if (inW(p.r3On, w)) m.revs++; if (inW(p.r10On, w)) m.revs++; });
    Object.values(S.apps).forEach((a) => { if (!isWish(a) && inW(a.applied, w)) m.apps++; });
    Object.values(S.mocks).forEach((x) => { if (inW(x.date, w)) m.mocks++; });
    Object.entries(S.logs).forEach(([d, l]) => {
      if (!inW(d, w)) return;
      m.days++; m.extra += +l.extra || 0; m.refs += +l.refs || 0; m.dms += +l.dms || 0; m.hours += +l.hours || 0; m.proj += +l.proj || 0;
      if (l.contest) m.contests++; if (l.energy) m.energy.push(+l.energy); if (l.mvd) m.mvd++;
    });
    m.prob = m.newP + m.extra;
    const c = (S.weeks[String(clampW(wn))] || {}).checks || {};
    m.checked = w.done.filter((_, i) => c[i]).length; m.doneTotal = w.done.length;
    m.rows = [["Problems", m.prob, w.t.prob], ["Applications", m.apps, w.t.apps], ["Referral asks", m.refs, w.t.refs],
      ["Cold DMs", m.dms, w.t.dms], ["Contests", m.contests, w.t.contests], ["Mocks", m.mocks, w.t.mocks]];
    const sc = m.rows.filter((r) => r[2] > 0);
    m.score = sc.length ? Math.round(100 * sc.reduce((s, r) => s + Math.min(r[1] / r[2], 1), 0) / sc.length) : 0;
    m.avgEnergy = m.energy.length ? (m.energy.reduce((a, b) => a + b, 0) / m.energy.length).toFixed(1) : "–";
    m.weekDays = diffDays(w.from, w.to) + 1;
    return m;
  }

  // ---------- day activity (heatmap) ----------
  // One pass over the data builds per-date counts; dayStats() is then O(1) per day.
  function dayIndex(S) {
    const bump = (o, d, k) => { if (!isDate(d)) return; (o[d] = o[d] || {})[k] = ((o[d] || {})[k] || 0) + 1; };
    const ix = {};
    Object.values(S.problems).forEach((p) => { bump(ix, p.solvedOn, "newP"); bump(ix, p.r3On, "rev"); bump(ix, p.r10On, "rev"); });
    Object.values(S.apps).forEach((a) => { if (!isWish(a)) bump(ix, a.applied, "apps"); });
    const each = (obj, k) => Object.values(obj || {}).forEach((d) => bump(ix, d, k));
    each(((S.meta.learn || {}).done), "lessons");
    each(((S.meta.cs || {}).known), "qa");
    each(((S.meta.sd || {}).done), "designs");
    Object.values(S.weeks).forEach((w) => each(w && w.checks, "checks"));
    return ix;
  }
  function dayStats(S, d, ix) {
    ix = ix || dayIndex(S);
    const c = ix[d] || {}, l = S.logs[d] || {}, logged = !!S.logs[d];
    const newP = c.newP || 0, rev = c.rev || 0, apps = c.apps || 0;
    const lessons = c.lessons || 0, qa = c.qa || 0, designs = c.designs || 0, checks = c.checks || 0;
    const extra = Math.max(+l.extra || 0, 0), refs = Math.max(+l.refs || 0, 0), dms = Math.max(+l.dms || 0, 0), hours = Math.max(+l.hours || 0, 0);
    const contest = !!l.contest;
    const learned = lessons + qa + designs + checks;
    // "All" points: every mark, +1 for saving the tracker, +1 for 0.5h+ of study, +1 for a contest.
    const all = newP + rev + extra + learned + apps + refs + dms + (logged ? 1 : 0) + (hours >= 0.5 ? 1 : 0) + (contest ? 1 : 0);
    const v = { all, learn: learned, dsa: newP + rev + extra, apps: apps + refs + dms, hours };
    return { newP, rev, extra, apps, refs, dms, hours, contest, lessons, qa, designs, checks, logged, v };
  }
  const HM = {
    all: { label: "All activity", unit: "points", steps: [1, 3, 6, 10], hint: "everything you marked: problems, revisits, lessons, Q&A, designs, checklists, applications, referral asks, DMs, plus 1 for saving the tracker, 1 for 30+ min of study and 1 for a contest" },
    learn: { label: "Learning", unit: "marks", steps: [1, 3, 6, 10], hint: "lessons completed + Core CS/AI questions marked known + designs + done-means ticked" },
    dsa: { label: "DSA", unit: "problems", steps: [1, 2, 3, 5], hint: "new + revisited + extra problems" },
    apps: { label: "Job search", unit: "actions", steps: [1, 3, 6, 10], hint: "applications + referral asks + cold DMs" },
    hours: { label: "Study hours", unit: "hours", steps: [0.5, 2, 4, 6], hint: "hours logged in the nightly tracker (30 min or more counts as active)" }
  };
  const hmLevel = (x, steps) => (x < steps[0] || x <= 0 ? 0 : x < steps[1] ? 1 : x < steps[2] ? 2 : x < steps[3] ? 3 : 4);
  const isActiveDay = (x, key) => hmLevel(x, HM[key].steps) > 0;
  // Grid model: columns are weeks from PLAN.start, rows Mon..Sun. Month label sits on the column holding the 1st.
  function heatmapModel(S, key, t, ix) {
    ix = ix || dayIndex(S);
    const P = plan(), start = P.start, days = planDays(), cols = Math.ceil(days / 7);
    let active = 0, cur = 0, best = 0, run = 0, total = 0, elapsed = 0;
    const val = [];
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      if (d > t) { val.push(null); continue; }
      elapsed++;
      const x = dayStats(S, d, ix).v[key]; val.push(x); total += x;
      if (isActiveDay(x, key)) { active++; run++; best = Math.max(best, run); } else run = 0;
    }
    // Current streak: consecutive active days ending today (today may still be empty) or at the last plan day.
    for (let i = elapsed - 1; i >= 0; i--) {
      const d = addDays(start, i);
      if (isActiveDay(val[i], key)) cur++; else if (d !== t) break;
    }
    const months = {};
    for (let c = 0; c < cols; c++) {
      for (let r = 0; r < 7; r++) {
        const i = c * 7 + r; if (i >= days) break;
        const d = addDays(start, i);
        if (d.slice(8) === "01") months[c] = fmt(d, { month: "short" });
      }
    }
    if (!months[0] && !months[1]) months[0] = fmt(start, { month: "short" });
    // The one keyboard-focusable cell: today if inside the plan, else the most recent active day, else the last past day.
    let focus = -1;
    const ti = diffDays(start, t);
    if (ti >= 0 && ti < days) focus = ti;
    else if (elapsed) { for (let i = elapsed - 1; i >= 0; i--) if (isActiveDay(val[i], key)) { focus = i; break; } if (focus < 0) focus = elapsed - 1; }
    return { days, cols, val, active, cur, best, total, elapsed, months, focus };
  }

  // ---------- red flags ----------
  function flags(S, t) {
    const out = [];
    if (phase(t) !== "during") return out;
    const P = plan(), cw = weekNo(t), ix = dayIndex(S);
    // A missed day is a day with no activity at all (an empty heatmap square); saving the tracker counts.
    const y1 = addDays(t, -1), y2 = addDays(t, -2);
    if (y2 >= P.start && dayStats(S, y1, ix).v.all === 0 && dayStats(S, y2, ix).v.all === 0) out.push("missed2");
    if (cw > 1) {
      const pm = metrics(S, cw - 1);
      if (pm.prob < 5) out.push("lowProblems");
      if (pm.apps === 0) out.push("zeroApps");
      if (pm.score < 60) out.push("lowWeek");
    }
    const m = metrics(S, cw), dIn = diffDays(weekObj(cw).from, t);
    if (dIn >= 4 && m.prob < 5 && !out.includes("lowProblems")) out.push("lowProblems");
    if (dIn >= 3 && m.apps === 0 && !out.includes("zeroApps")) out.push("zeroApps");
    if (dueList(S, t).filter((x) => x.late > 0).length > 6) out.push("revisitPile");
    const recent = Object.keys(S.logs).filter((d) => d <= t).sort().slice(-3);
    if (recent.length === 3 && recent.every((d) => S.logs[d].energy && +S.logs[d].energy <= 2)) out.push("lowEnergy");
    if (overdueApps(S, t).length) out.push("followups");
    if (cw >= 5 && metrics(S, cw - 1).contests === 0 && metrics(S, cw - 2).contests === 0) out.push("noContest");
    const last14 = Object.values(S.apps).filter((a) => isSent(a, t) && a.applied >= addDays(t, -14));
    if (last14.length >= 20 && !last14.some((a) => !["Applied", "Ghosted"].includes(a.status))) out.push("noCallbacks");
    const ms = Object.values(S.mocks).filter((x) => isDate(x.date) && x.date <= t).sort((a, b) => (a.date < b.date ? -1 : 1)).slice(-2);
    if (ms.length === 2 && ms.every((x) => mockAvg(x) < 3)) out.push("lowMocks");
    if (backlog(S, t).behind > 0) out.push("behind");
    return out;
  }

  // State as it was at the end of day d (marks dated later are dropped). Used for the daily report.
  function asOf(S, d) {
    const keepMap = (o) => { const r = {}; Object.entries(o || {}).forEach(([k, v]) => { if (!(isDate(v) && v > d)) r[k] = v; }); return r; };
    const problems = {};
    Object.entries(S.problems).forEach(([n, p]) => {
      if (!p.solvedOn || p.solvedOn > d) { if (p.stuck) problems[n] = { stuck: p.stuck }; return; }
      const q = { ...p }; if (q.r3On && q.r3On > d) delete q.r3On; if (q.r10On && q.r10On > d) delete q.r10On; problems[n] = q;
    });
    const logs = {}; Object.entries(S.logs).forEach(([k, l]) => { if (k <= d) logs[k] = l; });
    const apps = {}; Object.entries(S.apps).forEach(([k, a]) => { if (!(isDate(a.applied) && a.applied > d) && !(isDate(a.created) && a.created > d)) apps[k] = a; });
    const mocks = {}; Object.entries(S.mocks).forEach(([k, m]) => { if (!(isDate(m.date) && m.date > d)) mocks[k] = m; });
    const weeks = {}; Object.entries(S.weeks).forEach(([k, w]) => { weeks[k] = { ...w, checks: keepMap(w.checks) }; });
    const meta = { ...S.meta };
    if (S.meta.learn) meta.learn = { ...S.meta.learn, done: keepMap(S.meta.learn.done) };
    if (S.meta.cs) meta.cs = { ...S.meta.cs, known: keepMap(S.meta.cs.known) };
    if (S.meta.sd) meta.sd = { ...S.meta.sd, done: keepMap(S.meta.sd.done) };
    return { logs, problems, apps, weeks, mocks, meta };
  }

  // ---------- report text ----------
  function report(S, d) {
    const { P, NUMS } = problemsIndex(), F = G.FLAGS || {};
    const A = asOf(S, d);
    const l = S.logs[d] || {}, w = clampW(weekNo(d)), m = metrics(A, w);
    const solved = NUMS.filter((n) => ps(S, n).solvedOn === d), revd = NUMS.filter((n) => ps(S, n).r3On === d || ps(S, n).r10On === d);
    const apps = Object.values(S.apps).filter((a) => !isWish(a) && a.applied === d), due = dueList(A, d), fl = flags(A, d);
    const rows = m.rows.filter((r) => r[2] > 0);
    return [
      `TRACKER: ${fmt(d, { weekday: "short", day: "numeric", month: "short", year: "numeric" })} (Week ${w}, Day ${diffDays(plan().start, d) + 1})`,
      `DSA new (${solved.length}): ${solved.map((n) => `#${n} ${P[n].name} (${P[n].diff})`).join(", ") || "none"}`,
      `Extra solved: ${+l.extra || 0}${l.extraNames ? " (" + l.extraNames + ")" : ""}`,
      `Revised (${revd.length}): ${revd.map((n) => P[n].name).join(", ") || "none"} · revisits still due: ${due.length}`,
      `Core CS: ${l.cs || "none"}`,
      `Project hrs: ${+l.proj || 0}`,
      `Applications (${apps.length}): ${apps.map((a) => a.company + (a.role ? " – " + a.role : "")).join(", ") || "none"}`,
      `Referral asks: ${+l.refs || 0} · Cold DMs: ${+l.dms || 0} · Contest/mock OA: ${l.contest ? "yes" : "no"}`,
      `Study hrs: ${+l.hours || 0} · Energy: ${l.energy || "?"}/5 · MVD: ${l.mvd ? "yes" : "no"}`,
      `Biggest blocker: ${l.blocker || "none"}`,
      `Tomorrow top 3: 1) ${(l.top3 || [])[0] || "-"} 2) ${(l.top3 || [])[1] || "-"} 3) ${(l.top3 || [])[2] || "-"}`,
      `Week ${w} so far: ${rows.map((r) => `${r[0].toLowerCase()} ${r[1]}/${r[2]}`).join(" · ")} · score ${m.score}%`,
      `Red flags: ${fl.map((k) => (F[k] || { title: k }).title).join("; ") || "none"}`,
      l.notes ? `Notes: ${l.notes}` : ""
    ].filter(Boolean).join("\n");
  }
  function weeklyReport(S, wn, t) {
    const w = weekObj(wn), m = metrics(S, wn), r = (S.weeks[String(wn)] || {}).review || {}, c = (S.weeks[String(wn)] || {}).checks || {};
    return [
      `WEEKLY REVIEW: Week ${wn} (${fmt(w.from)} – ${fmt(w.to)}) · ${w.title}`,
      `Scorecard: ${m.rows.filter((x) => x[2] > 0).map((x) => `${x[0]} ${x[1]}/${x[2]}`).join(" · ")} · score ${m.score}%`,
      `Problems: ${m.newP} from list + ${m.extra} extra · revisits ${m.revs} · days logged ${m.days}/${m.weekDays} · MVDs ${m.mvd} · study ${m.hours} h · project ${m.proj} h · energy avg ${m.avgEnergy}`,
      `Done means: ${w.done.map((d, i) => (c[i] ? "[x] " : "[ ] ") + d).join(" | ")}`,
      `Solved overall: ${Object.values(S.problems).filter((p) => p.solvedOn).length}/150 · behind plan: ${backlog(S, t).behind}`,
      `Pipeline: ${STATUSES.map((s) => [s, Object.values(S.apps).filter((a) => a.status === s).length]).filter((x) => x[1]).map((x) => x[0] + " " + x[1]).join(", ") || "empty"}`,
      `What worked: ${r.worked || "-"}`, `What failed: ${r.failed || "-"}`, `Fix for next week: ${r.fix || "-"}`, `Target changes requested: ${r.adjust || "-"}`
    ].join("\n");
  }

  // ---------- data shape ----------
  const isObj = (x) => x !== null && typeof x === "object" && !Array.isArray(x);
  const clone = (x) => (x === undefined ? undefined : JSON.parse(JSON.stringify(x)));
  // JSON Merge Patch (RFC 7396): objects merge recursively, null deletes a key, anything else replaces.
  function mergePatch(target, patch) {
    if (!isObj(patch)) return clone(patch);
    const out = isObj(target) ? { ...target } : {};
    Object.keys(patch).forEach((k) => {
      if (patch[k] === null) delete out[k];
      else out[k] = mergePatch(out[k], patch[k]);
    });
    return out;
  }
  // The patch that undoes `patch` when applied to the result of mergePatch(prev, patch).
  function inversePatch(prev, patch) {
    const out = {};
    Object.keys(patch).forEach((k) => {
      const pv = isObj(prev) ? prev[k] : undefined;
      if (isObj(patch[k]) && (pv === undefined || pv === null || isObj(pv))) out[k] = inversePatch(pv, patch[k]);
      else out[k] = pv === undefined || pv === null ? null : clone(pv);
    });
    return out;
  }
  // Remote documents may carry null for "unset" (claude.ai update can't delete keys).
  function stripNulls(x) {
    if (Array.isArray(x)) return x.map((v) => (v === null ? v : stripNulls(v)));
    if (!isObj(x)) return x;
    const o = {}; Object.keys(x).forEach((k) => { if (x[k] !== null && x[k] !== undefined) o[k] = stripNulls(x[k]); }); return o;
  }
  const DATE_FIELDS = { problems: ["solvedOn", "r3On", "r10On"], apps: ["applied", "nextDate", "lastAction", "created"], mocks: ["date"], logs: ["date"] };
  // Clean one collection from storage: drop non-object docs, unset nulls, drop malformed dates (so a bad
  // value can't crash rendering). Date maps (lesson done, Q&A known, design done, checks) keep the mark but lose a bad date.
  function normalise(c, docs) {
    const out = {};
    if (!isObj(docs)) return out;
    Object.keys(docs).forEach((id) => {
      let d = docs[id];
      if (!isObj(d)) return;
      if (c === "logs" && !isDate(id)) return;
      d = stripNulls(d);
      (DATE_FIELDS[c] || []).forEach((f) => { if (f in d && !isDate(d[f])) { if (d[f] !== "" || c === "problems") delete d[f]; } });
      const fixMap = (m) => { if (!isObj(m)) return {}; const r = {}; Object.keys(m).forEach((k) => { const v = m[k]; if (v) r[k] = isDate(v) ? v : true; }); return r; };
      if (c === "weeks") { if ("checks" in d) d.checks = fixMap(d.checks); if ("review" in d && !isObj(d.review)) delete d.review; }
      if (c === "meta") { if ("done" in d) d.done = fixMap(d.done); if ("known" in d) d.known = fixMap(d.known); }
      if (c === "logs" && "top3" in d && !Array.isArray(d.top3)) delete d.top3;
      if (c === "mocks" && "scores" in d && !Array.isArray(d.scores)) delete d.scores;
      if (c === "apps" && typeof d.status !== "string") d.status = "Wishlist";
      out[id] = d;
    });
    return out;
  }
  // Stable JSON (sorted keys) to compare snapshots.
  function stableJson(x) {
    if (Array.isArray(x)) return "[" + x.map(stableJson).join(",") + "]";
    if (isObj(x)) return "{" + Object.keys(x).sort().map((k) => JSON.stringify(k) + ":" + stableJson(x[k])).join(",") + "}";
    return JSON.stringify(x === undefined ? null : x);
  }
  function checkPlan(P) {
    const errs = [], need = ["topics", "cs", "ai", "project", "job", "done", "set", "t"];
    if (!P || !Array.isArray(P.weeks)) return ["PLAN.weeks is missing"];
    ["start", "deadline", "internEnd"].forEach((k) => { if (!isDate(P[k])) errs.push("PLAN." + k + " is not a YYYY-MM-DD date"); });
    P.weeks.forEach((w, i) => {
      need.forEach((k) => { if (w[k] === undefined || w[k] === null) errs.push(`PLAN week ${w.w || i + 1} misses "${k}"`); });
      if (!isDate(w.from) || !isDate(w.to)) errs.push(`PLAN week ${w.w || i + 1} has a bad from/to date`);
    });
    if (P.weeks.length !== 12) errs.push("PLAN should have 12 weeks, has " + P.weeks.length);
    else if (P.weeks[11].to !== P.deadline) errs.push("PLAN week 12 should end on the deadline " + P.deadline);
    return errs;
  }
  const clampNum = (v, lo, hi) => { const x = +v; if (!isFinite(x)) return 0; return Math.min(Math.max(x, lo), hi === undefined ? Infinity : hi); };

  G.Logic = {
    iso, today, isDate, addDays, diffDays, fmt, weekNo, clampW, weekObj, phase, mode, inW, planDays,
    problemsIndex, ps, r3Due, r10Due, revDue, dueList, backlog,
    STATUSES, CLOSED, isActive, isWish, isSent, overdueApps, toApply, appStatusPatch, appliedForSave, safeUrl,
    MOCK_SHORT, mockScores, mockAvg, mockPass, mockSummary,
    metrics, dayIndex, dayStats, HM, hmLevel, isActiveDay, heatmapModel, flags, asOf, report, weeklyReport,
    isObj, clone, mergePatch, inversePatch, stripNulls, normalise, stableJson, checkPlan, clampNum
  };
})(typeof window !== "undefined" ? window : globalThis);
