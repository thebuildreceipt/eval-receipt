/**
 * Code-graded checks. Each case says which labels MUST appear, which must NOT,
 * the expected priority, and whether the model should ask for more info.
 * No LLM judge needed: everything here is checkable with code.
 */
import type { Triage } from "./schema.js";

export type Expect = { must: string[]; must_not: string[]; priority: "p0" | "p1" | "p2" | "p3"; needs_info: boolean };
export type Case = { id: string; title: string; body: string; expect: Expect };
export type Check = { name: string; pass: boolean; detail: string };

const rank = { p0: 0, p1: 1, p2: 2, p3: 3 } as const;

export function grade(out: Triage, exp: Expect): Check[] {
  const labels = new Set(out.labels.map((l) => l.toLowerCase()));
  const missing = exp.must.filter((l) => !labels.has(l));
  const forbidden = exp.must_not.filter((l) => labels.has(l));
  const distance = Math.abs(rank[out.priority] - rank[exp.priority]);
  const askedForInfo = out.missing_info.length > 0;
  return [
    { name: "required labels", pass: missing.length === 0, detail: missing.length ? `missing ${missing.join(", ")}` : "ok" },
    { name: "forbidden labels", pass: forbidden.length === 0, detail: forbidden.length ? `has ${forbidden.join(", ")}` : "ok" },
    // Off by one priority level is a judgment call; off by two is wrong.
    { name: "priority", pass: distance <= 1, detail: `${out.priority} vs expected ${exp.priority}` },
    { name: "asks for info", pass: askedForInfo === exp.needs_info, detail: askedForInfo ? "asked" : "did not ask" },
  ];
}

export type Summary = { cases: number; checks: number; passed: number; score: number; byCheck: Record<string, string> };

export function summarize(results: { id: string; checks: Check[] }[]): Summary {
  const all = results.flatMap((r) => r.checks);
  const byCheck: Record<string, string> = {};
  for (const name of [...new Set(all.map((c) => c.name))]) {
    const of = all.filter((c) => c.name === name);
    byCheck[name] = `${of.filter((c) => c.pass).length}/${of.length}`;
  }
  const passed = all.filter((c) => c.pass).length;
  return { cases: results.length, checks: all.length, passed, score: all.length ? passed / all.length : 0, byCheck };
}
