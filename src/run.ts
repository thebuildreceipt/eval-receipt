#!/usr/bin/env node
/**
 * Run the eval.  node dist/src/run.js            → calls Claude for every case (costs money, prints the total)
 *                node dist/src/run.js --dry-run  → grades data/example-outputs.json (free; illustrative, not real results)
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { grade, summarize, type Case } from "./grade.js";
import { costUsd } from "./cost.js";
import type { Triage } from "./schema.js";

const LABELS = ["bug", "enhancement", "question", "documentation", "checkout", "auth", "security", "p0", "p1", "p2", "p3"];
const dryRun = process.argv.includes("--dry-run");
const cases: Case[] = JSON.parse(await readFile("data/cases.json", "utf8"));

let outputs: Record<string, Triage>;
let spend = 0;
if (dryRun) {
  outputs = JSON.parse(await readFile("data/example-outputs.json", "utf8"));
} else {
  const { triageIssue } = await import("./triage.js");
  outputs = {};
  for (const c of cases) {
    const { triage, usage, model } = await triageIssue(c.title, c.body, LABELS);
    outputs[c.id] = triage;
    spend += costUsd(model, usage.input_tokens, usage.output_tokens) ?? 0;
    process.stderr.write(".");
  }
  await mkdir("runs", { recursive: true });
  await writeFile(`runs/${new Date().toISOString().replace(/[:.]/g, "-")}.json`, JSON.stringify(outputs, null, 2));
  process.stderr.write("\n");
}

const results = cases.map((c) => ({ id: c.id, checks: outputs[c.id] ? grade(outputs[c.id], c.expect) : [{ name: "output", pass: false, detail: "missing" }] }));
for (const r of results) {
  const failed = r.checks.filter((c) => !c.pass);
  console.log(`${failed.length ? "✗" : "✓"} ${r.id}${failed.length ? "  ← " + failed.map((f) => `${f.name}: ${f.detail}`).join("; ") : ""}`);
}
const s = summarize(results);
console.log(`\nScore: ${s.passed}/${s.checks} checks (${Math.round(s.score * 100)}%) across ${s.cases} cases`);
for (const [name, v] of Object.entries(s.byCheck)) console.log(`  ${name}: ${v}`);
console.log(dryRun ? "Cost: $0.00 (dry run on example outputs)" : `Cost: $${spend.toFixed(4)}`);
