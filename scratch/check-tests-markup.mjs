import fs from "fs";
import path from "path";

const files = [
  "specs/008-practice-selective-translation-kotoba/tasks.md",
  "specs/008-practice-selective-translation-kotoba/contracts/selective-kotoba-contract.md",
  "specs/008-practice-selective-translation-kotoba/spec.md",
  "specs/008-practice-selective-translation-kotoba/quickstart.md",
  "tests/test-practice-selective-kotoba.mjs"
];

for (const f of files) {
  if (fs.existsSync(f)) {
    const text = fs.readFileSync(f, "utf8");
    console.log("=== " + f + " ===");
    text.split("\n").forEach((l, idx) => {
      if (l.includes("practice-prompt-row") || l.includes("practice-option-row") || l.includes("practice-ctrl-trans") || l.includes("practice-ctrl-kotoba")) {
        console.log((idx + 1) + ": " + l.trim());
      }
    });
  }
}
