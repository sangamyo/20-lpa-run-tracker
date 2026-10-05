// Run with: node --test tests/
// Loads the plan data and logic.js into a sandbox (no browser needed) and checks the date and metric rules.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const ctx = vm.createContext({ console, URL });
ctx.window = ctx;
for (const f of ["data-plan.js", "data-playbook.js", "logic.js"]) vm.runInContext(readFileSync(new URL(f, root), "utf8"), ctx, { filename: f });
const L = ctx.Logic;
const empty = () => ({ logs: {}, problems: {}, apps: {}, weeks: {}, mocks: {}, meta: {} });
const plain = (x) => JSON.parse(JSON.stringify(x));

test("plan data passes the shape check", () => {
  assert.deepEqual(plain(L.checkPlan(ctx.PLAN)), []);
});

test("weekNo boundaries, including 28–31 Dec in week 12", () => {
  assert.equal(L.weekNo("2026-10-04"), 0);
  assert.equal(L.weekNo("2026-10-05"), 1);
  assert.equal(L.weekNo("2026-10-11"), 1);
  assert.equal(L.weekNo("2026-10-12"), 2);
  assert.equal(L.weekNo("2026-12-21"), 12);
  assert.equal(L.weekNo("2026-12-27"), 12);
  for (const d of ["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31"]) assert.equal(L.weekNo(d), 12, d);
  assert.equal(L.weekNo("2027-01-01"), 13);
  assert.equal(L.phase("2026-10-04"), "before");
  assert.equal(L.phase("2026-12-31"), "during");
  assert.equal(L.phase("2027-01-01"), "after");
  assert.equal(L.weekObj(12).to, "2026-12-31");
  assert.ok(L.inW("2026-12-30", L.weekObj(L.weekNo("2026-12-30"))));
  // every plan week's from/to agrees with weekNo
  for (const w of ctx.PLAN.weeks) { assert.equal(L.weekNo(w.from), w.w); assert.equal(L.weekNo(w.to), w.w); }
});

test("flags are off before the start and after the deadline", () => {
  const S = empty();
  assert.deepEqual(plain(L.flags(S, "2026-10-01")), []);
  assert.deepEqual(plain(L.flags(S, "2027-01-02")), []);
  assert.ok(L.flags(S, "2026-12-30").includes("behind"));
});

test("revDue: R3 at +3; R10 = max(solved+10, r3+7) after a late R3", () => {
  const S = empty();
  S.problems["1"] = { solvedOn: "2026-10-05" };
  assert.equal(L.revDue(S, 1, "2026-10-07"), null);
  assert.equal(L.revDue(S, 1, "2026-10-08"), "R3");
  // on-time R3: R10 at solved+10
  S.problems["1"].r3On = "2026-10-08";
  assert.equal(L.revDue(S, 1, "2026-10-14"), null);
  assert.equal(L.revDue(S, 1, "2026-10-15"), "R10");
  // late R3 on 13 Oct: R10 waits until 20 Oct
  S.problems["2"] = { solvedOn: "2026-10-05", r3On: "2026-10-13" };
  assert.equal(L.r10Due(S.problems["2"]), "2026-10-20");
  assert.equal(L.revDue(S, 2, "2026-10-15"), null);
  assert.equal(L.revDue(S, 2, "2026-10-19"), null);
  assert.equal(L.revDue(S, 2, "2026-10-20"), "R10");
  const dl = plain(L.dueList(S, "2026-10-21"));
  assert.deepEqual(dl.map((x) => [x.n, x.kind, x.late]), [[1, "R10", 6], [2, "R10", 1]]);
});

test("applications: Wishlist → Applied sets the applied date and counts", () => {
  const prev = { status: "Wishlist", applied: "", company: "X" };
  const p = plain(L.appStatusPatch(prev, "Applied", "2026-10-07"));
  assert.equal(p.applied, "2026-10-07");
  // a stale applied date on a Wishlist row is replaced when it leaves Wishlist
  assert.equal(L.appStatusPatch({ status: "Wishlist", applied: "2026-10-01" }, "OA", "2026-10-09").applied, "2026-10-09");
  // moving between active statuses keeps the date
  assert.equal(L.appStatusPatch({ status: "Applied", applied: "2026-10-06" }, "OA", "2026-10-09").applied, undefined);
  assert.equal(L.appStatusPatch({ status: "Applied", applied: "" }, "OA", "2026-10-09").applied, "2026-10-09");
  // forms
  assert.equal(L.appliedForSave(null, "Wishlist", "2026-10-07", "2026-10-07"), "");
  assert.equal(L.appliedForSave(null, "Applied", "", "2026-10-07"), "2026-10-07");
  assert.equal(L.appliedForSave({ status: "Wishlist", applied: "" }, "Applied", "", "2026-10-08"), "2026-10-08");
  assert.equal(L.appliedForSave({ status: "Wishlist", applied: "" }, "Applied", "2026-10-06", "2026-10-08"), "2026-10-06");
  const S = empty();
  S.apps.a = { ...prev, ...p };
  S.apps.b = { status: "Wishlist", applied: "2026-10-07" };
  assert.equal(L.metrics(S, 1).apps, 1);
  assert.equal(L.dayStats(S, "2026-10-07").apps, 1);
});

test("noCallbacks ignores Wishlist and future dates; follow-ups ignore Wishlist", () => {
  const t = "2026-10-20";
  const S = empty();
  for (let i = 0; i < 19; i++) S.apps["a" + i] = { status: "Applied", applied: "2026-10-15" };
  for (let i = 0; i < 5; i++) S.apps["w" + i] = { status: "Wishlist", applied: "2026-10-15" };
  S.apps.f = { status: "Applied", applied: "2026-10-25" };
  assert.ok(!L.flags(S, t).includes("noCallbacks"));
  S.apps.x = { status: "Applied", applied: "2026-10-19" };
  assert.ok(L.flags(S, t).includes("noCallbacks"));
  S.apps.x.status = "OA";
  assert.ok(!L.flags(S, t).includes("noCallbacks"));

  const F = empty();
  F.apps.w = { status: "Wishlist", nextDate: "2026-10-10" };
  assert.ok(!L.flags(F, t).includes("followups"));
  assert.equal(L.toApply(F, t).length, 1);
  F.apps.a = { status: "Applied", applied: "2026-10-06", nextDate: "2026-10-13" };
  assert.ok(L.flags(F, t).includes("followups"));
  assert.equal(L.overdueApps(F, t).length, 1);
  F.apps.a.status = "Ghosted";
  assert.equal(L.overdueApps(F, t).length, 0);
});

test("heatmap: a saved tracker log alone makes an active day and keeps the streak", () => {
  const S = empty();
  S.logs["2026-10-05"] = { hours: 0 };
  S.logs["2026-10-06"] = { hours: 0 };
  S.problems["1"] = { solvedOn: "2026-10-07" };
  const m = L.heatmapModel(S, "all", "2026-10-08");
  assert.equal(m.active, 3);
  assert.equal(m.best, 3);
  assert.equal(m.cur, 3); // today (8 Oct) still empty doesn't break the streak
  assert.equal(L.dayStats(S, "2026-10-05").v.all, 1);
  // hours below 0.5 don't count on the hours metric; 0.5 does
  S.logs["2026-10-05"].hours = 0.25; S.logs["2026-10-06"].hours = 0.5;
  const h = L.heatmapModel(S, "hours", "2026-10-07");
  assert.equal(h.active, 1);
  // a contest counts 1
  assert.equal(L.dayStats({ ...empty(), logs: { "2026-10-09": { contest: true } } }, "2026-10-09").v.all, 2);
  // two empty days → missed2 flag; a log on either day clears it
  const M = empty();
  assert.ok(L.flags(M, "2026-10-08").includes("missed2"));
  M.logs["2026-10-06"] = {};
  assert.ok(!L.flags(M, "2026-10-08").includes("missed2"));
});

test("heatmap month labels sit on the column holding the 1st", () => {
  const m = L.heatmapModel(empty(), "all", "2026-10-20");
  assert.equal(m.cols, 13);
  // 1 Nov is in column 3 (26 Oct – 1 Nov); 1 Dec is in column 8 (30 Nov – 6 Dec)
  assert.equal(m.months[3], L.fmt("2026-11-01", { month: "short" }));
  assert.equal(m.months[8], L.fmt("2026-12-01", { month: "short" }));
  assert.equal(m.months[9], undefined);
  assert.equal(m.focus, L.diffDays("2026-10-05", "2026-10-20"));
});

test("lowEnergy only looks at logs up to today", () => {
  const S = empty();
  for (const d of ["2026-10-06", "2026-10-07", "2026-10-08"]) S.logs[d] = { energy: 2 };
  S.logs["2026-10-12"] = { energy: 5 }; // a future log must not hide the flag
  assert.ok(L.flags(S, "2026-10-09").includes("lowEnergy"));
});

test("mock pass rule: avg ≥ 3.5 and no 1", () => {
  assert.equal(L.mockPass({ scores: [4, 4, 4, 4, 4, 4, 4] }), true);
  assert.equal(L.mockPass({ scores: [5, 5, 5, 5, 5, 5, 1] }), false);
  assert.equal(L.mockPass({ scores: [3, 3, 3, 3, 3, 3, 3] }), false);
  assert.equal(L.MOCK_SHORT.length, ctx.MOCK_CRITERIA.length);
});

test("daily report: skips zero-target rows and uses state as of that date", () => {
  const S = empty();
  S.problems["1"] = { solvedOn: "2026-10-05", r3On: "2026-10-12" };
  S.logs["2026-10-08"] = { extra: 1 };
  const r = L.report(S, "2026-10-08");
  assert.match(r, /revisits still due: 1/); // R3 was done later, so it was still due on 8 Oct
  assert.doesNotMatch(r, /cold dms 0\/0/); // week 1 has no DM target
  assert.match(r, /problems 2\/10/);
  const later = L.report(S, "2026-10-13");
  assert.match(later, /revisits still due: 0/);
});

test("merge patch, inverse patch and normalisation", () => {
  const a = { done: { x: "2026-10-05" }, last: "x" };
  const b = plain(L.mergePatch(a, { done: { y: "2026-10-06", x: null }, last: "y" }));
  assert.deepEqual(b, { done: { y: "2026-10-06" }, last: "y" });
  const patch = { done: { z: "2026-10-07" }, last: "z" };
  const inv = L.inversePatch(b, patch);
  assert.deepEqual(plain(L.mergePatch(L.mergePatch(b, patch), inv)), b);
  const n = plain(L.normalise("problems", { "1": { solvedOn: "bad", r3On: null, stuck: true }, "2": "junk" }));
  assert.deepEqual(n, { "1": { stuck: true } });
  const lg = plain(L.normalise("logs", { "2026-10-05": { energy: 3 }, "nope": {} }));
  assert.deepEqual(Object.keys(lg), ["2026-10-05"]);
  const meta = plain(L.normalise("meta", { cs: { known: { a: "2026-10-05", b: "13/10", c: null } } }));
  assert.deepEqual(meta.cs.known, { a: "2026-10-05", b: true });
  assert.equal(L.isDate("2026-02-30"), false);
  assert.equal(L.safeUrl("javascript:alert(1)"), "");
  assert.equal(L.safeUrl("https://x.com/jobs?id=1"), "https://x.com/jobs?id=1");
  assert.equal(L.safeUrl("www.x.com"), "");
});
