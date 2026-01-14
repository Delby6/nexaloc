const fs = require("fs");
const path = require("path");

// Utility to ensure folder exists
function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

// MOVE a file to new location
function moveFile(oldPath, newPath) {
  ensureDir(path.dirname(newPath));
  fs.renameSync(oldPath, newPath);
  console.log(`Moved: ${oldPath} -> ${newPath}`);
}

// Mapping rules
const rules = [
  // Business PUBLIC components
  {
    from: "src/components/business/Hero",
    to: "src/components/business/public/Hero"
  },
  {
    from: "src/components/business/Map",
    to: "src/components/business/public/Map"
  },
  {
    from: "src/components/business/Reviews",
    to: "src/components/business/public/Reviews"
  },
  {
    from: "src/components/business/Comments",
    to: "src/components/business/public/Comments"
  },
  {
    from: "src/components/business/Related",
    to: "src/components/business/public/Related"
  },

  // Business OWNER-ONLY components
  {
    from: "src/components/business/OwnerTools",
    to: "src/components/business/owner/OwnerTools"
  },
  {
    from: "src/components/editor",
    to: "src/components/business/owner/Editor"
  },

  // User components
  {
    from: "src/pages/user/UserAvatarCropper.jsx",
    to: "src/components/user/UserAvatarCropper.jsx"
  },

  // Pages structure
  {
    from: "src/pages/admin",
    to: "src/pages/admin"
  },
  {
    from: "src/pages/owner",
    to: "src/pages/owner"
  },
  {
    from: "src/pages/user",
    to: "src/pages/user"
  }
];

// Run rules
rules.forEach(rule => {
  const source = path.resolve(rule.from);

  if (fs.existsSync(source)) {
    const target = path.resolve(rule.to);
    moveFile(source, target);
  }
});
