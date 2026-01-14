const fs = require("fs");
const path = require("path");

/* -----------------------------------------
   CONFIG — MODIFY IF YOU ADD NEW ROOT FOLDERS
-------------------------------------------- */
const ROOT_PATH = path.resolve("src");

const validRoots = [
  "components",
  "pages",
  "utils",
  "lib",
  "hooks",
  "features",
];

/* -----------------------------------------
   WALK DIRECTORY
-------------------------------------------- */
function walk(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, callback);
    else callback(p);
  });
}

/* -----------------------------------------
   GET ABSOLUTE TARGET PATH FOR RELATIVE IMPORT
-------------------------------------------- */
function resolveAbsoluteImport(currentFile, importPath) {
  const resolved = path.resolve(path.dirname(currentFile), importPath);

  if (!resolved.startsWith(ROOT_PATH)) return null;

  const relative = resolved.slice(ROOT_PATH.length + 1).replace(/\\/g, "/");

  const rootFolder = relative.split("/")[0];
  if (!validRoots.includes(rootFolder)) return null;

  return `@/${relative}`;
}

/* -----------------------------------------
   GET ABSOLUTE TARGET PATH FOR BAD "@/" IMPORT
-------------------------------------------- */
function fixBadAbsolute(importPath) {
  if (!importPath.startsWith("@/")) return null;

  const relative = importPath.replace("@/", "");
  const abs = path.resolve("src", relative);

  if (fs.existsSync(abs)) return importPath;

  for (const root of validRoots) {
    const tryPath = path.resolve("src", root, path.basename(relative));
    if (fs.existsSync(tryPath)) {
      const fixed = `@/${root}/${path.basename(relative)}`;
      return fixed;
    }
  }

  return null;
}

/* -----------------------------------------
   PROCESS FILES
-------------------------------------------- */
walk("src", (file) => {
  if (!file.match(/\.(js|jsx|ts|tsx)$/)) return;

  let content = fs.readFileSync(file, "utf8");
  let original = content;
  let updated = false;

  // Fix RELATIVE imports
  content = content.replace(
    /from ["'](\.{1,}\/[^"']+)["']/g,
    (match, relPath) => {
      const abs = resolveAbsoluteImport(file, relPath);
      if (abs) {
        console.log(`✔ Fixed relative import: ${relPath} -> ${abs}`);
        updated = true;
        return `from "${abs}"`;
      }
      return match;
    }
  );

  // Fix BAD absolute imports
  content = content.replace(/from ["'](@\/[^"']+)["']/g, (match, absPath) => {
    const fixed = fixBadAbsolute(absPath);
    if (fixed && fixed !== absPath) {
      console.log(`✔ Corrected broken absolute: ${absPath} -> ${fixed}`);
      updated = true;
      return `from "${fixed}"`;
    }
    return match;
  });

  if (updated) fs.writeFileSync(file, content, "utf8");
});
