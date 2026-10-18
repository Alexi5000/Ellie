import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, expect, it } from "vitest";
import { trimLogFile } from "./debug-log";

const directories: string[] = [];
afterEach(() => {
  for (const directory of directories.splice(0))
    fs.rmSync(directory, { recursive: true, force: true });
});
function fixture() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), "ellie-log-"));
  directories.push(directory);
  return directory;
}

it("retains recent complete lines and truncates the opened file", () => {
  const log = path.join(fixture(), "browser.log");
  fs.writeFileSync(log, "old-entry\nnew-entry\nlatest\n");
  trimLogFile(log, 20, 18);
  expect(fs.readFileSync(log, "utf8")).toBe("new-entry\nlatest\n");
});

it("does not follow log symlinks or modify their targets", () => {
  const directory = fixture();
  const target = path.join(directory, "secret");
  const log = path.join(directory, "browser.log");
  fs.writeFileSync(target, "private-content-that-must-survive");
  fs.symlinkSync(target, log);
  trimLogFile(log, 1, 1);
  expect(fs.readFileSync(target, "utf8")).toBe(
    "private-content-that-must-survive"
  );
});
