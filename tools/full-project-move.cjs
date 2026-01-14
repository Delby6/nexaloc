const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("src");

// Helper: ensure directory exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Helper: move file if exists
function move(from, to) {
  const absFrom = path.resolve(from);
  const absTo = path.resolve(to);

  if (!fs.existsSync(absFrom)) {
    console.log("⏭ Skip (not found):", absFrom);
    return;
  }

  ensureDir(path.dirname(absTo));
  fs.renameSync(absFrom, absTo);
  console.log(`✔ Moved: ${from} → ${to}`);
}

/* -----------------------------------------------------
   1️⃣ WHAT FILES TO MOVE & WHERE THEY SHOULD GO
------------------------------------------------------*/
const MOVE_RULES = [
  // COMMON UI
  ["src/pages/About.jsx", "src/components/common/About.jsx"],
  ["src/pages/Contact.jsx", "src/components/common/Contact.jsx"],

  // BUSINESS UI
  ["src/pages/BusinessCard.jsx", "src/components/business/public/BusinessCard.jsx"],

  // OWNER UI
  ["src/pages/OwnerBusinessCard.jsx", "src/components/owner/OwnerBusinessCard.jsx"],
  ["src/pages/OwnerBusinessAdd.jsx", "src/components/owner/OwnerBusinessAdd.jsx"],
  ["src/pages/OwnerBusinessEdit.jsx", "src/components/owner/OwnerBusinessEdit.jsx"],

  // USER UI
  ["src/pages/Favorites.jsx", "src/components/user/Favorites.jsx"],
  ["src/pages/UserProfile.jsx", "src/components/user/UserProfile.jsx"], // if exists

  // VIDEO TOOLS
  ["src/pages/VideoDashboard.jsx", "src/components/video/VideoDashboard.jsx"],
  ["src/pages/VideoEditor.jsx", "src/components/video/VideoEditor.jsx"],

  // ADMIN UI
  ["src/pages/AdminContent.jsx", "src/components/admin/AdminContent.jsx"],
];

/* -----------------------------------------------------
   2️⃣ APPLY FILE MOVES
------------------------------------------------------*/
console.log("\n=== MOVING COMPONENT FILES ===\n");

MOVE_RULES.forEach(([from, to]) => move(from, to));

/* -----------------------------------------------------
   3️⃣ FIX ALL IMPORTS AFTER MOVING
------------------------------------------------------*/
console.log("\n=== FIXING IMPORTS ===\n");

const IMPORT_FIXES = [
  // COMMON
  ["@/pages/About", "@/components/common/About"],
  ["@/pages/Contact", "@/components/common/Contact"],

  // BUSINESS
  ["@/pages/BusinessCard", "@/components/business/public/BusinessCard"],

  // OWNER
  ["@/pages/OwnerBusinessCard", "@/components/owner/OwnerBusinessCard"],
  ["@/pages/OwnerBusinessAdd", "@/components/owner/OwnerBusinessAdd"],
  ["@/pages/OwnerBusinessEdit", "@/components/owner/OwnerBusinessEdit"],

  // USER
  ["@/pages/Favorites", "@/components/user/Favorites"],
  ["@/pages/user/UserProfile", "@/components/user/UserProfile"],

  // VIDEO
  ["@/pages/VideoDashboard", "@/components/video/VideoDashboard"],
  ["@/pages/VideoEditor", "@/components/video/VideoEditor"],

  // ADMIN
  ["@/pages/AdminContent", "@/components/admin/AdminContent"],
];

function walk(dir, cb) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, cb);
    else cb(p);
  });
}

walk("src", (file) => {
  if (!file.match(/\.(js|jsx|ts|tsx)$/)) return;

  let content = fs.readFileSync(file, "utf8");
  let updated = false;

  IMPORT_FIXES.forEach(([oldPath, newPath]) => {
    const reg = new RegExp(oldPath.replace(/\//g, "\\/"), "g");
    if (reg.test(content)) {
      content = content.replace(reg, newPath);
      updated = true;
      console.log(`✔ Updated import in: ${file}`);
    }
  });

  if (updated) {
    fs.writeFileSync(file, content, "utf8");
  }
});

console.log("\n🎉 DONE! Your project structure and imports are fully updated.");
