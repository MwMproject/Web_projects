import { readdir } from "node:fs/promises";
import { join } from "node:path";

async function collectJsFiles(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map((entry) => {
    const fullPath = join(directory, entry.name);
    return entry.isDirectory() ? collectJsFiles(fullPath) : fullPath;
  }));
  return files.flat().filter((file) => file.endsWith(".js"));
}

const files = (await collectJsFiles("src"))
  .filter((file) => !file.endsWith("src\\main.js") && !file.endsWith("src/main.js"));

for (const file of files) {
  await import(`../${file.replaceAll("\\", "/")}`);
}

console.log(`Modules OK (${files.length} fichiers). main.js est vérifié par le navigateur.`);
