// Custom Reporter
//
// Playwright's Reporter interface lets you hook into every stage of the test run
// and do anything you like with the results — print to console, write to a file,
// post to Slack, update a dashboard, etc.
//
// HOW TO REGISTER THIS REPORTER
// ──────────────────────────────
// In playwright.config.ts, change the reporter line to an array:
//
//   reporter: [
//     ['html'],
//     ['./tests/reporters/customReporter.ts'],
//   ],
//
// Playwright will instantiate this class once per test run and call each
// lifecycle method at the right time automatically.
//
// REPORTER LIFECYCLE (methods called in this order):
//
//   onBegin(config, suite)        → test run starts
//   onTestBegin(test, result)     → each test starts
//   onStepBegin(test, result, step) → each test.step() starts
//   onStepEnd(test, result, step)   → each test.step() ends
//   onTestEnd(test, result)       → each test ends (pass / fail / skip)
//   onEnd(result)                 → entire run finishes
//
// OUTPUT FILES
// ─────────────
//   test-results/custom-report.json   — machine-readable JSON summary
//   test-results/custom-report.txt    — human-readable plain text summary

import type {
  Reporter,
  FullConfig,
  Suite,
  TestCase,
  TestResult,
  FullResult,
} from "@playwright/test/reporter";
import * as fs from "fs";
import * as path from "path";

// Shape of a single test entry in the JSON report.
interface TestEntry {
  name: string;
  file: string;
  project: string;
  status: string;
  duration: number;
  error?: string;
}

// Shape of the full JSON report written to disk.
interface JsonReport {
  suiteName: string;
  startTime: string;
  endTime: string;
  durationMs: number;
  total: number;
  passed: number;
  failed: number;
  skipped: number;
  tests: TestEntry[];
}

class CustomReporter implements Reporter {
  // Track run-level stats.
  private startTime: Date = new Date();
  private passed  = 0;
  private failed  = 0;
  private skipped = 0;
  private tests: TestEntry[] = [];
  private outputDir: string = "";

  // ─── onBegin ──────────────────────────────────────────────────────────────
  // Called once when the test run starts.
  // `suite` is the root suite containing all test files and test cases.
  onBegin(config: FullConfig, suite: Suite): void {
    this.startTime = new Date();

    // Resolve the output directory (playwright's default: test-results/).
    this.outputDir = path.resolve(process.cwd(), "test-results");
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }

    const totalTests = suite.allTests().length;
    console.log("\n┌─────────────────────────────────────────────┐");
    console.log(`│  Custom Reporter — Test Run Started           │`);
    console.log(`│  Tests to run  : ${String(totalTests).padEnd(27)}│`);
    console.log(`│  Started at    : ${this.startTime.toLocaleTimeString().padEnd(27)}│`);
    console.log("└─────────────────────────────────────────────┘\n");
  }

  // ─── onTestBegin ──────────────────────────────────────────────────────────
  // Called just before each individual test starts.
  // `test.title` is the test name, `test.parent.title` is the describe block.
  onTestBegin(test: TestCase): void {
    console.log(`  ► Running : ${test.title}`);
  }

  // ─── onTestEnd ────────────────────────────────────────────────────────────
  // Called after each test finishes.
  // `result.status` is "passed", "failed", "timedOut", or "skipped".
  // `result.duration` is the elapsed time in milliseconds.
  // `result.errors` is an array of errors if the test failed.
  onTestEnd(test: TestCase, result: TestResult): void {
    const statusIcon =
      result.status === "passed"  ? "✔" :
      result.status === "skipped" ? "⊘" : "✘";

    const statusLabel =
      result.status === "passed"  ? "\x1b[32mPASSED\x1b[0m"  :
      result.status === "skipped" ? "\x1b[33mSKIPPED\x1b[0m" :
                                    "\x1b[31mFAILED\x1b[0m";

    console.log(
      `  ${statusIcon} ${statusLabel} : ${test.title} (${result.duration}ms)`
    );

    // Count by outcome.
    if (result.status === "passed")       this.passed++;
    else if (result.status === "skipped") this.skipped++;
    else                                  this.failed++;

    // Build the entry for the JSON report.
    const entry: TestEntry = {
      name:     test.title,
      file:     test.location.file.replace(process.cwd() + "/", ""),
      project:  test.parent?.parent?.title ?? "unknown",
      status:   result.status,
      duration: result.duration,
    };

    // Attach the first error message if the test failed.
    if (result.errors.length > 0) {
      entry.error = result.errors[0].message ?? "Unknown error";
    }

    this.tests.push(entry);
  }

  // ─── onEnd ────────────────────────────────────────────────────────────────
  // Called once when all tests have finished.
  // `result.status` is "passed", "failed", or "interrupted".
  onEnd(result: FullResult): void {
    const endTime   = new Date();
    const durationMs = endTime.getTime() - this.startTime.getTime();
    const total     = this.passed + this.failed + this.skipped;

    // ── Console summary ─────────────────────────────────────────────────────
    console.log("\n┌─────────────────────────────────────────────┐");
    console.log(`│  Custom Reporter — Test Run Finished          │`);
    console.log(`│  Status   : ${result.status.toUpperCase().padEnd(33)}│`);
    console.log(`│  Duration : ${String(durationMs + "ms").padEnd(33)}│`);
    console.log(`│  Total    : ${String(total).padEnd(33)}│`);
    console.log(`│  Passed   : ${String(this.passed).padEnd(33)}│`);
    console.log(`│  Failed   : ${String(this.failed).padEnd(33)}│`);
    console.log(`│  Skipped  : ${String(this.skipped).padEnd(33)}│`);
    console.log("└─────────────────────────────────────────────┘");

    if (this.failed > 0) {
      console.log("\n  Failed tests:");
      this.tests
        .filter((t) => t.status === "failed")
        .forEach((t) => console.log(`    ✘ [${t.project}] ${t.file} → ${t.name}`));
    }

    // ── Write JSON report ────────────────────────────────────────────────────
    // Machine-readable output useful for CI dashboards or post-processing scripts.
    const jsonReport: JsonReport = {
      suiteName:  "Playwright Test Suite",
      startTime:  this.startTime.toISOString(),
      endTime:    endTime.toISOString(),
      durationMs,
      total,
      passed:     this.passed,
      failed:     this.failed,
      skipped:    this.skipped,
      tests:      this.tests,
    };

    const jsonPath = path.join(this.outputDir, "custom-report.json");
    fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2), "utf8");
    console.log(`\n  JSON report  → ${jsonPath}`);

    // ── Write plain-text report ──────────────────────────────────────────────
    const lines: string[] = [
      "═══════════════════════════════════════════════",
      " PLAYWRIGHT CUSTOM REPORT",
      "═══════════════════════════════════════════════",
      `  Started  : ${this.startTime.toISOString()}`,
      `  Finished : ${endTime.toISOString()}`,
      `  Duration : ${durationMs}ms`,
      `  Total    : ${total}`,
      `  Passed   : ${this.passed}`,
      `  Failed   : ${this.failed}`,
      `  Skipped  : ${this.skipped}`,
      "───────────────────────────────────────────────",
      " TEST RESULTS",
      "───────────────────────────────────────────────",
    ];

    for (const t of this.tests) {
      const icon = t.status === "passed" ? "✔" : t.status === "skipped" ? "⊘" : "✘";
      lines.push(`  ${icon} [${t.project}] ${t.name} (${t.duration}ms)`);
      if (t.error) {
        lines.push(`       ERROR: ${t.error.split("\n")[0]}`);
      }
    }

    lines.push("═══════════════════════════════════════════════");

    const txtPath = path.join(this.outputDir, "custom-report.txt");
    fs.writeFileSync(txtPath, lines.join("\n"), "utf8");
    console.log(`  Text report  → ${txtPath}\n`);
  }
}

export default CustomReporter;
