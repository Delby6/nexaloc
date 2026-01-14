const fs = require("fs");
const path = require("path");

const ROOT = path.resolve("src");

// RULES FOR MOVED FILES — YOU CAN ADD MORE HERE
const moved = [
  {
    old: "@/pages/user/UserAvatarCropper",
    new: "@/components/user/UserAvatarCropper"
  },
  {
    old: "@/pages/user/UserProfile",
    new: "@/components/user/UserProfile"
  },
  {
    old: "@/pages/user/UserFavorites",
    new: "@/components/user/UserFavorites"
  },
  // BUSINESS OWNER MOVES
  {
    old: "@/components/business/OwnerTools",
    new: "@/components/business/owner/OwnerTools"
  },
  {
    old: "@/components/editor",
    new: "@/components/business/owner/Editor"
  }
];

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const p = path.join(dir, file);
    if (fs.statSync(p).isDirectory()) walk(p, callback);
    else callback(p);
  });
}

walk("src", file => {
  if (!file.match(/\.(js|jsx|ts|tsx)$/)) return;

  let content = fs.readFileSync(file, "utf8");
  let original = content;

  moved.forEach(rule => {
    const regex = new RegExp(rule.old.replace(/\//g, "\\/"), "g");
    content = content.replace(regex, rule.new);
  });

  if (content !== original) {
    fs.writeFileSync(file, content, "utf8");
    console.log("Fixed moved imports in:", file);
  }
});
