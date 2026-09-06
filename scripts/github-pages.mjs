#!/usr/bin/env node
/**
 * Prepare a static `output: 'export'` build for GitHub Pages.
 *
 * Route handlers under src/app/api and `force-dynamic` pages are incompatible
 * with `next export`. This script temporarily moves API routes aside and
 * forces pages to `force-static` for the Pages build only.
 *
 * Restoration runs in `finally`. Do not call process.exit() inside the try
 * block — Node can skip `finally` on process.exit().
 */
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const API_SRC = path.join(ROOT, 'src', 'app', 'api');
const API_TMP_DIR = path.join(ROOT, '.github-pages-tmp');
const API_TMP = path.join(API_TMP_DIR, 'api');
const APP_DIR = path.join(ROOT, 'src', 'app');

const SITE_URL = 'https://mangeshraut712.github.io/Vitals.AI';
const FORCE_DYNAMIC = "export const dynamic = 'force-dynamic'";
const FORCE_STATIC = "export const dynamic = 'force-static'";

function walkPages(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkPages(full, acc);
    } else if (
      entry.name === 'page.tsx' ||
      entry.name === 'page.ts' ||
      entry.name === 'layout.tsx' ||
      entry.name === 'robots.ts' ||
      entry.name === 'sitemap.ts'
    ) {
      acc.push(full);
    }
  }
  return acc;
}

function restoreWorkspace(originals) {
  for (const [file, text] of originals) {
    fs.writeFileSync(file, text);
  }
  if (fs.existsSync(API_TMP) && !fs.existsSync(API_SRC)) {
    fs.renameSync(API_TMP, API_SRC);
  }
}

function main() {
  const originals = new Map();
  fs.mkdirSync(API_TMP_DIR, { recursive: true });
  let exitCode = 0;

  try {
    if (fs.existsSync(API_SRC)) {
      if (fs.existsSync(API_TMP)) {
        fs.rmSync(API_TMP, { recursive: true, force: true });
      }
      fs.renameSync(API_SRC, API_TMP);
    }

    for (const file of walkPages(APP_DIR)) {
      const text = fs.readFileSync(file, 'utf8');
      if (!text.includes(FORCE_DYNAMIC)) continue;
      originals.set(file, text);
      fs.writeFileSync(file, text.replaceAll(FORCE_DYNAMIC, FORCE_STATIC));
    }

    const result = spawnSync('npx', ['next', 'build', '--webpack'], {
      stdio: 'inherit',
      env: {
        ...process.env,
        GITHUB_PAGES: '1',
        NEXT_PUBLIC_STATIC_EXPORT: '1',
        NEXT_PUBLIC_BASE_PATH: '/Vitals.AI',
        NEXT_PUBLIC_SITE_URL: SITE_URL,
        NEXT_TELEMETRY_DISABLED: '1',
      },
    });

    exitCode = result.status ?? 1;
    if (exitCode === 0) {
      fs.writeFileSync(path.join(ROOT, 'out', '.nojekyll'), '');
    }
  } catch (error) {
    console.error(error);
    exitCode = 1;
  } finally {
    restoreWorkspace(originals);
  }

  process.exit(exitCode);
}

main();
