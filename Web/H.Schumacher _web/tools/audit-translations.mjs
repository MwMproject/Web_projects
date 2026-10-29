import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";

const root = path.resolve(import.meta.dirname, "..");
const normalize = (value) => String(value || "").replace(/\s+/g, " ").trim();
const decode = (value) => value
  .replace(/&nbsp;/g, " ")
  .replace(/&amp;/g, "&")
  .replace(/&lt;/g, "<")
  .replace(/&gt;/g, ">")
  .replace(/&quot;/g, '"')
  .replace(/&#39;|&apos;/g, "'")
  .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
  .replace(/&#x([0-9a-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)));

const translationSource = fs.readFileSync(path.join(root, "assets/script/translations.js"), "utf8")
  .replace("const DICT =", "globalThis.DICT =")
  .replace("const CONTENT =", "globalThis.CONTENT =")
  .replace("const PAGE_TITLES =", "globalThis.PAGE_TITLES =");

const translationContext = {
  console,
  localStorage: { getItem: () => "fr", setItem: () => {} },
  document: {
    title: "",
    body: { nodeType: 1, querySelectorAll: () => [] },
    documentElement: { setAttribute: () => {} },
    addEventListener: () => {},
    querySelectorAll: () => [],
  },
  window: { location: { pathname: "/index.html" }, dispatchEvent: () => {} },
  MutationObserver: class { observe() {} },
  CustomEvent: class {},
  WeakMap,
};
vm.createContext(translationContext);
vm.runInContext(
  fs.readFileSync(path.join(root, "assets/script/reference-translations.js"), "utf8"),
  translationContext,
);
vm.runInContext(translationSource, translationContext);

const covered = (lang, source) => {
  const content = translationContext.CONTENT?.[lang] || {};
  const dictionary = translationContext.DICT?.[lang] || {};
  const frenchDictionaryValues = new Set(Object.values(translationContext.DICT?.fr || {}).map(normalize));
  if (Object.prototype.hasOwnProperty.call(content, source)) return true;
  if (!frenchDictionaryValues.has(source)) return false;
  const key = Object.keys(translationContext.DICT.fr).find((item) => normalize(translationContext.DICT.fr[item]) === source);
  return Boolean(key && dictionary[key]);
};

const sources = new Map();
const add = (value, origin) => {
  const text = normalize(decode(value));
  if (!text || !/[A-Za-zÀ-ÿ]/.test(text)) return;
  if (!sources.has(text)) sources.set(text, new Set());
  sources.get(text).add(origin);
};

for (const file of fs.readdirSync(root).filter((name) => name.endsWith(".html"))) {
  const html = fs.readFileSync(path.join(root, file), "utf8")
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "");
  for (const match of html.matchAll(/>([^<>]+)</g)) add(match[1], file);
  for (const match of html.matchAll(/\s(?:placeholder|aria-label|title|alt)="([^"]+)"/gi)) add(match[1], `${file}:attribute`);
}

const referenceContext = { window: {} };
vm.createContext(referenceContext);
for (const file of ["reference-catalog.js", "reference-details.js"]) {
  vm.runInContext(fs.readFileSync(path.join(root, "assets/script", file), "utf8"), referenceContext);
}
const catalog = referenceContext.window.REFERENCE_CATALOG || [];
const details = referenceContext.window.REFERENCE_DETAILS || [];
catalog.forEach((item, index) => {
  add(item.title, `reference-${index + 1}:title`);
  for (const tag of item.tags || []) add(tag, `reference-${index + 1}:tag`);
  const detail = details[index] || {};
  add(detail.type, `reference-${index + 1}:type`);
  add(detail.client, `reference-${index + 1}:client`);
  add(detail.architect, `reference-${index + 1}:architect`);
  const [description, ...services] = String(detail.description || "").split(/\n\nPrestations réalisées\s*:\s*/i);
  add(description, `reference-${index + 1}:description`);
  add(services.join("\n\n"), `reference-${index + 1}:services`);
});

for (const lang of ["de", "en"]) {
  const missing = [...sources.entries()]
    .filter(([source]) => !covered(lang, source))
    .sort(([a], [b]) => a.localeCompare(b, "fr"));
  console.log(`\n${lang.toUpperCase()}_MISSING=${missing.length}`);
  for (const [source, origins] of missing) {
    console.log(`${source}\t[${[...origins].join(", ")}]`);
  }
}
