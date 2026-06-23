const fs = require("fs");
const path = require("path");

const SRC_DIR = path.join(__dirname, "src");

function walk(dir, fileList = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(fullPath, fileList);
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

const files = walk(SRC_DIR);
let totalReplacements = 0;
let filesChanged = 0;

const pattern = /\$\{process\.env\.REACT_APP_API_URL \|\| "http:\/\/localhost:5000"\}\/uploads\/\$\{([^}]+)\}/g;

for (const file of files) {
  let content = fs.readFileSync(file, "utf8");
  const original = content;

  content = content.replace(pattern, (match, fieldExpr) => {
    return "${" + fieldExpr + "}";
  });

  if (content !== original) {
    const count = (original.match(pattern) || []).length;
    totalReplacements += count;
    filesChanged++;
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated ${path.relative(__dirname, file)} (${count} replacement(s))`);
  }
}

console.log(`\nDone. ${totalReplacements} replacement(s) across ${filesChanged} file(s).`);