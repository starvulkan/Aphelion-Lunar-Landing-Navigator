#!/usr/bin/env node
/**
 * Cache-busting: adds ?v=<stamp> to the stylesheet, the scripts in index.html and every
 * relative JS import, so browsers fetch the new files after a deploy instead of mixing
 * cached old CSS/JS with new HTML.
 *   node tools/stamp-version.mjs            -> stamp = current UTC time (yyyymmddhhmm)
 *   node tools/stamp-version.mjs abc123 dir -> custom stamp, files under dir (used by CI on _site)
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const stamp = process.argv[2] || new Date().toISOString().replace(/\D/g, '').slice(0, 12);
const root = process.argv[3] || '.';
const swap = (text, re) => text.replace(re, (_, a, b) => `${a}?v=${stamp}${b}`);

const html = join(root, 'index.html');
let h = readFileSync(html, 'utf8');
h = swap(h, /((?:href|src)="(?:css\/styles\.css|js\/app\.js|tools\/lola-horizon\.js))(?:\?v=[\w-]+)?(")/g);
writeFileSync(html, h);

const dir = join(root, 'js');
for (const f of readdirSync(dir).filter(f => f.endsWith('.js'))) {
  const p = join(dir, f);
  const before = readFileSync(p, 'utf8');
  const after = swap(before, /((?:from |import\()'\.\/[\w.-]+?\.js)(?:\?v=[\w-]+)?(')/g);
  if (after !== before) writeFileSync(p, after);
}
console.log(`stamped v=${stamp}`);
