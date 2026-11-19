import { test } from "node:test";
import assert from "node:assert/strict";
import { grade, summarize, type Expect } from "../src/grade.js";

const exp: Expect = { must: ["bug", "checkout"], must_not: ["approved"], priority: "p1", needs_info: false };
const out = { labels: ["bug", "checkout"], priority: "p1" as const, summary: "s", missing_info: [] };

test("a perfect answer passes all 4 checks", () => {
  assert.ok(grade(out, exp).every((c) => c.pass));
});

test("missing and forbidden labels fail", () => {
  const checks = grade({ ...out, labels: ["bug", "approved"] }, exp);
  assert.equal(checks.find((c) => c.name === "required labels")!.pass, false);
  assert.equal(checks.find((c) => c.name === "forbidden labels")!.pass, false);
});

test("label matching is case-insensitive", () => {
  assert.ok(grade({ ...out, labels: ["Bug", "CHECKOUT"] }, exp).every((c) => c.pass));
});

test("priority off by one passes, off by two fails", () => {
  assert.equal(grade({ ...out, priority: "p2" }, exp).find((c) => c.name === "priority")!.pass, true);
  assert.equal(grade({ ...out, priority: "p3" }, exp).find((c) => c.name === "priority")!.pass, false);
});

test("asking for info when not needed fails", () => {
  assert.equal(grade({ ...out, missing_info: ["version"] }, exp).find((c) => c.name === "asks for info")!.pass, false);
});

test("summary counts checks per type", () => {
  const s = summarize([{ id: "a", checks: grade(out, exp) }, { id: "b", checks: grade({ ...out, priority: "p3" }, exp) }]);
  assert.equal(s.checks, 8);
  assert.equal(s.passed, 7);
  assert.equal(s.byCheck.priority, "1/2");
});
