/**
 * AUTO APPLY DARK MODE CLASSES ACROSS THE PROJECT
 * ------------------------------------------------
 * - Adds dark:bg-* to bg-white, bg-slate-100, ...
 * - Adds dark:text-* to text-black, text-gray-800, ...
 * - Replaces inline colors (#fff, #000, rgb, etc.) with Tailwind classes
 * - Skips node_modules
 * - Creates backups (.bak) for safety
 */

const fs = require("fs");
const path = require("path");

const TARGET_EXT = [".jsx", ".js", ".tsx", ".ts"];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) {
      if (!full.includes("node_modules") && !full.includes("dist"))
        walk(full, callback);
    } else {
      if (TARGET_EXT.includes(path.extname(full))) callback(full);
    }
  });
}

// MAP LIGHT CLASSES → DARK VARIANTS
const classReplacements = [
  // Backgrounds
  { find: "bg-white", add: "dark:bg-slate-900" },
  { find: "bg-gray-50", add: "dark:bg-slate-900" },
  { find: "bg-gray-100", add: "dark:bg-slate-800" },

  // Text
  { find: "text-black", add: "dark:text-white" },
  { find: "text-gray-800", add: "dark:text-slate-200" },
  { find: "text-gray-700", add: "dark:text-slate-300" },

  // Borders
  { find: "border-gray-200", add: "dark:border-slate-700" },
  { find: "border-gray-300", add: "dark:border-slate-600" }
];

// HARD CODED COLORS → TAILWIND
const inlineColorFix = [
  { regex: /#fff\b/gi, replace: "white" },
  { regex: /#ffffff\b/gi, replace: "white" },
  { regex: /#000\b/gi, replace: "black" },
  { regex: /#000000\b/gi, replace: "black" }
];

console.log("🔍 Scanning project for theme updates...\n");

walk("src", (filePath) => {
  let content = fs.readFileSync(filePath, "utf8");
  let updated = content;

  // Add dark: variants to Tailwind classes
  classReplacements.forEach(({ find, add }) => {
    const regex = new RegExp(find, "g");
    if (updated.match(regex)) {
      updated = updated.replace(regex, `${find} ${add}`);
    }
  });

  // Replace inline colors
  inlineColorFix.forEach(({ regex, replace }) => {
    updated = updated.replace(regex, replace);
  });

  if (updated !== content) {
    fs.writeFileSync(filePath + ".bak", content); // backup
    fs.writeFileSync(filePath, updated);
    console.log(`✨ Updated: ${filePath}`);
  }
});

console.log("\n🎉 AUTO DARK MODE APPLIED ACROSS PROJECT!");
console.log("💾 Backups created: *.bak\n");
