const fs = require("fs");
const path = require("path");

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function move(from, to) {
  const absFrom = path.resolve(from);
  const absTo = path.resolve(to);

  if (!fs.existsSync(absFrom)) {
    console.log("⏭ Skip (not found):", from);
    return;
  }

  ensureDir(path.dirname(absTo));
  fs.renameSync(absFrom, absTo);
  console.log(`✔ Moved: ${from} → ${to}`);
}

/* 1️⃣ MOVE FILES TO NEW LOCATIONS */
const MOVE_RULES = [
  // layout
  ["src/components/Navbar.jsx", "src/components/layout/Navbar.jsx"],
  ["src/components/Footer.jsx", "src/components/layout/Footer.jsx"],
  ["src/components/HeroBanner.jsx", "src/components/layout/HeroBanner.jsx"],
  ["src/components/LoadingScreen.jsx", "src/components/layout/LoadingScreen.jsx"],

  // common
  ["src/components/AddBusinessForm.jsx", "src/components/common/AddBusinessForm.jsx"],
  ["src/components/AIDashboard.jsx", "src/components/common/AIDashboard.jsx"],
  ["src/components/ClaimsContent.jsx", "src/components/common/ClaimsContent.jsx"],
  ["src/components/ElmadPlatform.jsx", "src/components/common/ElmadPlatform.jsx"],
  ["src/components/NexalocLogo.jsx", "src/components/common/NexalocLogo.jsx"],
  ["src/components/DarkModeToggle.jsx", "src/components/common/DarkModeToggle.jsx"],

  // routing / guards
  ["src/components/ProtectedRoute.jsx", "src/components/routing/ProtectedRoute.jsx"],
  ["src/components/OwnerProtectedRoute.jsx", "src/components/routing/OwnerProtectedRoute.jsx"],
  ["src/components/UserProtectedRoute.jsx", "src/components/routing/UserProtectedRoute.jsx"],
  ["src/components/RoleRoute.jsx", "src/components/routing/RoleRoute.jsx"],

  // owner dashboard content
  ["src/components/DashboardContent.jsx", "src/components/owner/DashboardContent.jsx"],
];

console.log("\n=== MOVING ROOT COMPONENTS ===\n");
MOVE_RULES.forEach(([from, to]) => move(from, to));

/* 2️⃣ FIX IMPORT PATHS EVERYWHERE */
const IMPORT_FIXES = [
  // layout
  ["@/components/Navbar", "@/components/layout/Navbar"],
  ["@/components/Footer", "@/components/layout/Footer"],
  ["@/components/HeroBanner", "@/components/layout/HeroBanner"],
  ["@/components/LoadingScreen", "@/components/layout/LoadingScreen"],

  // common
  ["@/components/AddBusinessForm", "@/components/common/AddBusinessForm"],
  ["@/components/AIDashboard", "@/components/common/AIDashboard"],
  ["@/components/ClaimsContent", "@/components/common/ClaimsContent"],
  ["@/components/ElmadPlatform", "@/components/common/ElmadPlatform"],
  ["@/components/NexalocLogo", "@/components/common/NexalocLogo"],
  ["@/components/DarkModeToggle", "@/components/common/DarkModeToggle"],

  // routing
  ["@/components/ProtectedRoute", "@/components/routing/ProtectedRoute"],
  ["@/components/OwnerProtectedRoute", "@/components/routing/OwnerProtectedRoute"],
  ["@/components/UserProtectedRoute", "@/components/routing/UserProtectedRoute"],
  ["@/components/RoleRoute", "@/components/routing/RoleRoute"],

  // owner
  ["@/components/DashboardContent", "@/components/owner/DashboardContent"],
];

function walk(dir, cb) {
  fs.readdirSync(dir).forEach((file) => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, cb);
    else cb(p);
  });
}

console.log("\n=== UPDATING IMPORTS ===\n");
walk("src", (file) => {
  if (!file.match(/\.(js|jsx|ts|tsx)$/)) return;

  let content = fs.readFileSync(file, "utf8");
  let updated = false;

  IMPORT_FIXES.forEach(([oldPath, newPath]) => {
    const reg = new RegExp(oldPath.replace(/\//g, "\\/"), "g");
    if (reg.test(content)) {
      content = content.replace(reg, newPath);
      updated = true;
      console.log(`✔ Updated imports in: ${file}`);
    }
  });

  if (updated) {
    fs.writeFileSync(file, content, "utf8");
  }
});

console.log("\n🎉 Done reorganizing root components.\n");
