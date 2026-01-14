const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  fs.readdirSync(dir).forEach((file) => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) {
      walk(p, callback);
    } else {
      callback(p);
    }
  });
}

console.log("\n🔍 Searching for outdated NotificationsRouter imports...\n");

walk("src", (file) => {
  if (!file.match(/\.(js|jsx|ts|tsx)$/)) return;

  let content = fs.readFileSync(file, "utf8");
  let original = content;

  // Replace old path with new one
  const oldPath = "@/pages/notifications/NotificationsRouter";
  const newPath = "@/components/notifications/NotificationsRouter";

  if (content.includes(oldPath)) {
    content = content.replace(new RegExp(oldPath, "g"), newPath);
    fs.writeFileSync(file, content, "utf8");
    console.log(`✔ Updated NotificationsRouter import in: ${file}`);
  }
});

console.log("\n🎉 Done! All NotificationsRouter imports are now fixed.\n");
