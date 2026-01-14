const fs = require("fs");
const path = require("path");

function walk(dir, callback) {
  fs.readdirSync(dir).forEach(file => {
    const filepath = path.join(dir, file);
    if (fs.statSync(filepath).isDirectory()) {
      walk(filepath, callback);
    } else {
      callback(filepath);
    }
  });
}

const importMappings = [
  {
    old: "components/business/Hero",
    new: "components/business/public/Hero"
  },
  {
    old: "components/business/Map",
    new: "components/business/public/Map"
  },
  {
    old: "components/business/Reviews",
    new: "components/business/public/Reviews"
  },
  {
    old: "components/business/Comments",
    new: "components/business/public/Comments"
  },
  {
    old: "components/business/Related",
    new: "components/business/public/Related"
  },
  {
    old: "components/business/OwnerTools",
    new: "components/business/owner/OwnerTools"
  },
  {
    old: "components/editor",
    new: "components/business/owner/Editor"
  }
];

walk("src", file => {
  if (file.endsWith(".js") || file.endsWith(".jsx") || file.endsWith(".tsx")) {
    let content = fs.readFileSync(file, "utf-8");
    let originalContent = content;

    importMappings.forEach(m => {
      content = content.replaceAll(m.old, m.new);
    });

    if (content !== originalContent) {
      fs.writeFileSync(file, content, "utf-8");
      console.log("Updated imports in:", file);
    }
  }
});
