// Custom Logger Utility using Winston
//
// Winston is the most popular logging library for Node.js.
// It supports multiple "transports" — destinations where log messages are sent.
// Each transport can have its own log level, format, and output.
//
// LOG LEVELS (from most to least severe):
//   error   → Something broke. Test or app failed critically.
//   warn    → Something unexpected but not fatal. Worth investigating.
//   info    → Normal flow events. Navigation, actions, verifications.
//   debug   → Detailed diagnostic data. Values, intermediate states.
//   verbose → Fine-grained tracing. Every small step.
//
// WHY USE A LOGGER INSTEAD OF console.log()?
//   - console.log() outputs everything with no level or structure.
//   - A logger lets you control what is shown (level filtering).
//   - Log output can be sent to the console, a file, or both simultaneously.
//   - Each message includes a timestamp and log level automatically.
//   - In CI, you can set LOG_LEVEL=error to silence noise and see only failures.
//   - Log files persist after a test run for post-mortem analysis.

import * as winston from "winston";
import * as path from "path";
import * as fs from "fs";

// Ensure the logs directory exists before creating file transports.
const logsDir = path.resolve(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ─── FORMAT DEFINITIONS ─────────────────────────────────────────────────────

// Console format: colorized level + timestamp + message.
// Example output:  [2024-01-15 10:30:45] INFO: Navigating to login page
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),       // color-codes the level label
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level}: ${message}`;
  })
);

// File format: plain text with timestamp (no color codes — they corrupt log files).
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message }) => {
    return `[${timestamp}] ${level.toUpperCase()}: ${message}`;
  })
);

// ─── LOGGER INSTANCE ────────────────────────────────────────────────────────

// createLogger() wires together transports and the minimum log level.
// Messages below the configured level are silently dropped.
// LOG_LEVEL env var lets you change verbosity without editing code.
// Example: LOG_LEVEL=debug npx playwright test
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",   // default: show info and above

  transports: [
    // Transport 1: Console — prints to the terminal during the test run.
    new winston.transports.Console({
      format: consoleFormat,
    }),

    // Transport 2: Combined file — all messages at the configured level and above.
    // Useful for reviewing the full test run after the fact.
    new winston.transports.File({
      filename: path.join(logsDir, "test-run.log"),
      format: fileFormat,
    }),

    // Transport 3: Error-only file — only error-level messages.
    // Quick way to find all failures without reading through info/debug noise.
    new winston.transports.File({
      filename: path.join(logsDir, "errors.log"),
      level: "error",
      format: fileFormat,
    }),
  ],
});
