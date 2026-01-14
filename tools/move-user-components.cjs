const fs = require("fs");
const path = require("path");

function moveIfExists(from, to) {
  const absFrom = path.resolve(from);
  const absTo = path.resolve(to);

  if (!fs.existsSync(absFrom)) {
    console.log("Skip (not found):", absFrom);
    return;
  }

  const dir = path.dirname(absTo);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.renameSync(absFrom, absTo);
  console.log(`Moved: ${absFrom} -> ${absTo}`);
}

moveIfExists(
  "src/pages/user/UserProfile.jsx",
  "src/components/user/UserProfile.jsx"
);

moveIfExists(
  "src/pages/user/UserFavorites.jsx",
  "src/components/user/UserFavorites.jsx"
);
