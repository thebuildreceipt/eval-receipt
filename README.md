# eval-receipt

Stop guessing whether your prompt works. A minimal eval: **12 labeled cases, code-graded checks, one command that prints a score and what it cost.** The example evaluates the issue-triage prompt from [issue-receipt](https://github.com/thebuildreceipt/issue-receipt).

Built in the video **"Evals for AI Apps in 8 Minutes"** from The Build Receipt.

## Run

```bash
npm install
npm test          # tests for the grader itself
npm run eval:dry  # grades hand-written example outputs (free, illustrative only)
npm run eval      # calls Claude on all 12 cases; needs ANTHROPIC_API_KEY; prints score + cost
```

Real runs are saved to `runs/<timestamp>.json` so you can compare before and after a prompt change.

## How it works

| File | Role |
|---|---|
| `data/cases.json` | 12 cases: clear bugs, vague reports, features, a non-English report, an outage, and two prompt-injection attempts. Each lists labels that **must** and **must not** appear, the expected priority, and whether the model should ask for more info. |
| `src/grade.ts` | Code checks: required labels, forbidden labels, priority within one level, asks-for-info. No LLM judge needed. |
| `src/run.ts` | Runs every case, prints ✓/✗ with the reason, the score per check type, and total cost. |

## Rules of thumb

- **Start with 10–20 real cases**, including the ugly ones. Add a case every time something breaks in production.
- **Prefer code checks** over an LLM judge whenever the answer is checkable.
- **Eval the model before your guardrails** (this repo grades raw model output), so you know how often the guard is doing the work.
- **Change one thing, re-run, compare.** A prompt change that helps one case often hurts another.

MIT License
