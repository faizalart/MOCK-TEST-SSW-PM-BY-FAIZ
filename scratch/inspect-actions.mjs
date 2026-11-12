import fs from "fs";
const app = fs.readFileSync("app.js", "utf8").split("\n");
app.forEach((l, idx) => {
  if (l.includes("toggle-selective") || l.includes("action === 'answer'")) {
    console.log((idx + 1) + ": " + l.trim());
  }
});
