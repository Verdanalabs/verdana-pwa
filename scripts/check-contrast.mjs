#!/usr/bin/env node
/**
 * Verdana brand contrast gate.
 *
 * Reads this repo's live token definitions and asserts the pairings brand.md
 * promises. Exits non-zero on any failure.
 *
 *   node scripts/check-contrast.mjs
 *
 * The rule this exists to enforce: Neon (#85F23D) measures 1.42:1 on Lush White,
 * so it can never be a text colour in light mode. See brand.md section 2.
 *
 * Auto-detects the token source:
 *   src/app/globals.css            (Next.js apps: :root + html[data-theme="dark"])
 *   src/shared/theme/tokens.ts     (Expo app: LightColors / DarkColors)
 */

import { readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

const AA = 4.5;

/* ── colour maths ─────────────────────────────────────────────────────────── */

const toLinear = (c) => {
  const v = c / 255;
  return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};

function parseHex(hex) {
  let h = String(hex).trim().replace(/^#/, "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
}

function luminance(hex) {
  const rgb = parseHex(hex);
  if (!rgb) return null;
  const [r, g, b] = rgb.map(toLinear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  if (la === null || lb === null) return null;
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

/* ── token extraction ─────────────────────────────────────────────────────── */

function matchingBrace(src, open) {
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}" && --depth === 0) return i;
  }
  return -1;
}

/** Pull `--name: #hex;` pairs out of a CSS block. */
function readCssBlock(file, selector) {
  // Strip comments first: the selector names appear in the header comment, and a
  // naive indexOf would match there and then read the *next* block instead.
  const css = readFileSync(file, "utf8").replace(/\/\*[\s\S]*?\*\//g, "");
  const pattern = new RegExp(selector.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\s*\\{");
  const match = pattern.exec(css);
  if (!match) return null;
  const open = css.indexOf("{", match.index);
  const end = matchingBrace(css, open);
  if (end === -1) return null;

  const tokens = {};
  for (const m of css.slice(open + 1, end).matchAll(/--([\w-]+)\s*:\s*(#[0-9a-fA-F]{3,8})\s*;/g)) {
    tokens[m[1]] = m[2];
  }
  return tokens;
}

/** Pull top-level `key: "#hex"` pairs out of a named TS object literal. */
function readTsObject(file, name) {
  const src = readFileSync(file, "utf8");
  const start = src.search(new RegExp(`${name}\\s*[:=]`));
  if (start === -1) return null;
  const open = src.indexOf("{", start);
  const end = matchingBrace(src, open);
  if (end === -1) return null;

  const body = src.slice(open + 1, end);
  const tokens = {};

  // Only TOP-LEVEL keys. Nested records (toneBg, statusFg, materialFg…) repeat
  // key names like `accent` and would otherwise shadow the real token.
  let nesting = 0;
  const re = /(\w+)\s*:\s*["'](#[0-9a-fA-F]{3,8})["']|([{}])/g;
  let m;
  while ((m = re.exec(body)) !== null) {
    if (m[3] === "{") nesting++;
    else if (m[3] === "}") nesting--;
    else if (nesting === 0) {
      tokens[m[1].replace(/[A-Z]/g, (c) => "-" + c.toLowerCase())] = m[2];
    }
  }
  return tokens;
}

/** Pull a nested record (e.g. `statusBg: { pending: '#...' }`) out of a TS object. */
function readTsNested(file, theme, field) {
  const outer = theme === "light" ? "LightColors" : "DarkColors";
  const src = readFileSync(file, "utf8");
  const objStart = src.search(new RegExp(`${outer}\\s*[:=]`));
  if (objStart === -1) return null;
  const fieldStart = src.indexOf(`${field}:`, objStart);
  if (fieldStart === -1) return null;
  const open = src.indexOf("{", fieldStart);
  const close = src.indexOf("}", open);
  if (open === -1 || close === -1) return null;

  const out = {};
  for (const m of src.slice(open + 1, close).matchAll(/(\w+)\s*:\s*["'](#[0-9a-fA-F]{3,8})["']/g)) {
    out[m[1]] = m[2];
  }
  return out;
}

/* ── what must hold ───────────────────────────────────────────────────────── */

/**
 * Text tokens are checked against EVERY surface level, not just `--background`.
 * Muted text usually sits on a card, and an elevated surface is the lightest
 * ground in dark mode — checking only the page background hides real failures.
 */
const SURFACES = ["background", "surface", "surface-strong"];
const TEXT_TOKENS = [
  ["foreground", "body text"],
  ["text-secondary", "secondary text"],
  ["text-muted", "muted text"],
  ["accent-ink", "accent-coloured text"],
  ["text-faint", "faint text"],
];

/** Pairings that are not surface-relative. */
const PAIRS = [
  ["accent-contrast", "accent", "label on accent fill"],
  ["panel-fg", "panel-bg", "text on panel"],
];

/* ── detect this repo's token source ──────────────────────────────────────── */

const cssFile = join(ROOT, "src", "app", "globals.css");
const tsFile = join(ROOT, "src", "shared", "theme", "tokens.ts");

let target;
if (existsSync(cssFile)) {
  target = {
    file: cssFile,
    themes: { light: [readCssBlock, ":root"], dark: [readCssBlock, 'html[data-theme="dark"]'] },
  };
} else if (existsSync(tsFile)) {
  target = {
    file: tsFile,
    themes: { light: [readTsObject, "LightColors"], dark: [readTsObject, "DarkColors"] },
    records: readTsNested,
  };
} else {
  console.error("No token source found (src/app/globals.css or src/shared/theme/tokens.ts).");
  process.exit(1);
}

/* ── run ──────────────────────────────────────────────────────────────────── */

let failures = 0;
let checks = 0;
const pad = (s, n) => String(s).padEnd(n);

console.log(`brand contrast gate — ${target.file.replace(ROOT, ".")}`);

for (const [theme, [reader, selector]] of Object.entries(target.themes)) {
  const tokens = reader(target.file, selector);
  if (!tokens || Object.keys(tokens).length === 0) {
    console.error(`  ${theme}: FAILED to read "${selector}"`);
    failures++;
    continue;
  }

  console.log(`\n  ${theme}`);

  for (const [fg, label] of TEXT_TOKENS) {
    if (!(fg in tokens)) continue;
    for (const bg of SURFACES) {
      if (!(bg in tokens)) continue;
      const ratio = contrast(tokens[fg], tokens[bg]);
      checks++;
      const ok = ratio !== null && ratio >= AA;
      if (!ok) failures++;
      console.log(
        `    ${ok ? "ok  " : "FAIL"}  ${pad(label + " on " + bg, 34)} ${pad(tokens[fg], 9)} ` +
          `${(ratio ?? 0).toFixed(2).padStart(5)}:1`
      );
    }
  }

  for (const [fg, bg, label] of PAIRS) {
    if (!(fg in tokens) || !(bg in tokens)) continue;
    const ratio = contrast(tokens[fg], tokens[bg]);
    checks++;
    const ok = ratio !== null && ratio >= AA;
    if (!ok) failures++;
    console.log(
      `    ${ok ? "ok  " : "FAIL"}  ${pad(label, 34)} ${pad(tokens[fg], 9)} ${(ratio ?? 0).toFixed(2).padStart(5)}:1`
    );
  }

  // Paired records (status badges, material chips, tone) — PWA only.
  if (target.records) {
    for (const [name, bgField, fgField] of [
      ["status", "statusBg", "statusFg"],
      ["material", "materialBg", "materialFg"],
      ["tone", "toneBg", "toneFg"],
    ]) {
      const bg = target.records(target.file, theme, bgField);
      const fg = target.records(target.file, theme, fgField);
      if (!bg || !fg) continue;
      let bad = 0;
      for (const key of Object.keys(bg)) {
        if (!(key in fg)) continue;
        const ratio = contrast(fg[key], bg[key]);
        checks++;
        if (!(ratio !== null && ratio >= AA)) {
          failures++;
          bad++;
          console.log(`    FAIL  ${pad(name + ":" + key, 34)} ${fg[key]} on ${bg[key]}  ${(ratio ?? 0).toFixed(2)}:1`);
        }
      }
      if (!bad) console.log(`    ok    ${pad(name + " pairs (all keys)", 34)}`);
    }

    // Records used as text with no paired background.
    const tier = target.records(target.file, theme, "tierFg");
    if (tier) {
      let bad = 0;
      for (const [key, fg] of Object.entries(tier)) {
        for (const bg of SURFACES) {
          if (!(bg in tokens)) continue;
          const ratio = contrast(fg, tokens[bg]);
          checks++;
          if (!(ratio !== null && ratio >= AA)) {
            failures++;
            bad++;
            console.log(`    FAIL  ${pad("tierFg:" + key + " on " + bg, 34)} ${fg}  ${(ratio ?? 0).toFixed(2)}:1`);
          }
        }
      }
      if (!bad) console.log(`    ok    ${pad("tierFg (all keys x all surfaces)", 34)}`);
    }
  }

  // The core invariant: in light mode, accent-as-text must NOT be the raw accent.
  if (theme === "light" && tokens["accent"] && tokens["accent-ink"]) {
    checks++;
    if (tokens["accent"].toLowerCase() === tokens["accent-ink"].toLowerCase()) {
      failures++;
      console.log(`    FAIL  ${pad("accent-ink != accent", 34)} Neon is unreadable as light-mode text`);
    } else {
      console.log(`    ok    ${pad("accent-ink != accent", 34)} ${tokens["accent-ink"]} (accent stays fill-only)`);
    }
  }
}

console.log("\n" + "─".repeat(60));
console.log(`${checks} checks, ${failures} failure${failures === 1 ? "" : "s"}`);
if (failures > 0) {
  console.log("See brand.md for the canonical token values.");
  process.exit(1);
}
process.exit(0);
