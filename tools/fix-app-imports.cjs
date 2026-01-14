const fs = require("fs");
const path = require("path");

const APP_PATH = path.resolve("src/App.jsx");
const SRC_ROOT = path.resolve("src");

// Helper to check if target file exists
function fileExists(target) {
  const possibleExt = [".jsx", ".js", ".tsx", ".ts"];
  for (const ext of possibleExt) {
    if (fs.existsSync(target + ext)) return target + ext;
  }
  return null;
}

// Recursively scan src for components/pages
function scanFolder(folder) {
  let results = [];
  const files = fs.readdirSync(folder);

  for (const file of files) {
    const fullPath = path.join(folder, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      results = results.concat(scanFolder(fullPath));
    } else {
      const rel = fullPath.replace(SRC_ROOT, "").replace(/\\/g, "/");
      results.push(rel.replace(/^\//, ""));
    }
  }

  return results;
}

console.log("🔍 Scanning src/ for actual component locations...");
const allFiles = scanFolder(SRC_ROOT);

let content = fs.readFileSync(APP_PATH, "utf8");
let originalContent = content;

// Find all import statements
const importRegex = /import\s+.*?\s+from\s+["'](.+?)["']/g;

let match;
let changes = 0;

while ((match = importRegex.exec(content)) !== null) {
  const importPath = match[1];

  // Only fix @ imports
  if (!importPath.startsWith("@/")) continue;

  const expected = importPath.replace("@/", "");

  // Try to locate the real file path in src
  const found = allFiles.find((file) => file.endsWith(expected + ".jsx") || file.endsWith(expected + ".js"));

  if (!found) {
    console.log("⛔ Missing file for import:", importPath);
    continue;
  }

  const correctImport = "@/" + found.replace(/\.jsx$|\.js$/g, "");

  if (correctImport !== importPath) {
    console.log(`✔ Fixed import: ${importPath}  →  ${correctImport}`);
    content = content.replace(`"${importPath}"`, `"${correctImport}"`);
    changes++;
  }
}

if (changes > 0) {
  fs.writeFileSync(APP_PATH, content, "utf8");
  console.log(`\n🎉 Done! Updated ${changes} incorrect import(s) in App.jsx\n`);
} else {
  console.log("\n✔ No changes needed — all imports already correct.\n");
}
