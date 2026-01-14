const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else {
      callback(p);
    }
  });
}

// Convert a relative import path to absolute "@/..."
function convertToAbsolute(currentFile, relativeImport) {
  // Get absolute file path
  const fullPath = path.resolve(path.dirname(currentFile), relativeImport);

  // We want path **inside src/**
  const srcRoot = path.resolve("src");

  if (!fullPath.startsWith(srcRoot)) return null;

  const relativeToSrc = fullPath.slice(srcRoot.length + 1);

  // Turn into "@/folder/file"
  return "@/" + relativeToSrc.replace(/\\/g, "/");
}

walk("src", file => {
  if (!file.match(/\.(js|jsx|ts|tsx)$/)) return;

  let content = fs.readFileSync(file, "utf-8");
  let original = content;

  // Match import statements
  const regex = /from ["'](\.{1,}\/[^"']+)["']/g;

  content = content.replace(regex, (match, relPath) => {
    const newPath = convertToAbsolute(file, relPath);
    return newPath ? `from "${newPath}"` : match;
  });

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Updated imports in:", file);
  }
});
