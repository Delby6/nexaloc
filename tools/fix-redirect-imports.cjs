const fs = require("fs");
const path = require("path");

function walk(dir, cb) {
  fs.readdirSync(dir).forEach((file) => {
    const full = path.join(dir, file);
    if (fs.statSync(full).isDirectory()) walk(full, cb);
    else cb(full);
  });
}

// OLD → NEW import strings
const OLD_IMPORT_1 = `from "@/components/routing/RoleRoute"`;
const OLD_IMPORT_2 = `from '@/components/routing/RoleRoute'`;
const NEW_IMPORT = `from "@/components/routing/AutoRedirectByRole"`;

console.log("\n🔍 Searching for old redirect RoleRoute imports...\n");

walk("src", (file) => {
  if (!/\.(jsx?|tsx?)$/.test(file)) return; // process js, jsx, ts, tsx only

  let content = fs.readFileSync(file, "utf8");
  let updated = false;

  if (content.includes(OLD_IMPORT_1)) {
    content = content.replace(OLD_IMPORT_1, NEW_IMPORT);
    updated = true;
  }

  if (content.includes(OLD_IMPORT_2)) {
    content = content.replace(OLD_IMPORT_2, NEW_IMPORT);
    updated = true;
  }

  if (updated) {
    fs.writeFileSync(file, content, "utf8");
    console.log(`✔ Updated import in: ${file}`);
  }
});

console.log("\n🎉 Done! Old redirect RoleRoute imports are now fixed.\n");
