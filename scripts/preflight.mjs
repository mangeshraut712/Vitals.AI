#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const argv = new Set(process.argv.slice(2));
const mode = argv.has('--deploy-check')
  ? 'deploy-check'
  : argv.has('--typecheck')
    ? 'typecheck'
    : argv.has('--doctor')
      ? 'doctor'
      : 'dev';
const cwd = process.cwd();

const nextEnvPath = path.join(cwd, 'next-env.d.ts');
const lockPath = path.join(cwd, '.next', 'dev', 'lock');
const defaultNextEnv = `/// <reference types="next" />
/// <reference types="next/image-types/global" />
import "./.next/types/routes.d.ts";

// NOTE: This file should not be edited
// see https://nextjs.org/docs/app/api-reference/config/typescript for more information.
`;

let hasFailure = false;
const LEAK_PLACEHOLDER_HINTS = ['your_', 'your-', 'your', 'example', 'placeholder', 'changeme', '<', '>'];

const TRACKED_FILE_EXCLUDES = [
  '.next/',
  'node_modules/',
  '.git/',
  '.npm-cache/',
  '.yarn/',
  '.pnpm-store/',
  'coverage/',
  'playwright-report/',
  'test-results/',
  'dist/',
  'build/',
];

const BINARY_EXTENSIONS = new Set([
  '.png', '.jpg', '.jpeg', '.gif', '.webp', '.svg', '.ico', '.pdf', '.zip', '.gz', '.woff', '.woff2', '.ttf', '.eot', '.mp4', '.mp3'
]);

const DIRECT_SECRET_PATTERNS = [
  { label: 'OpenRouter key', pattern: /sk-or-v1-[a-z0-9]{24,}/i },
  { label: 'Anthropic key', pattern: /sk-ant-[a-z0-9-]{20,}/i },
  { label: 'GitHub PAT', pattern: /ghp_[a-zA-Z0-9]{20,}/ },
];

function info(message) {
  console.log(`[Vitals.AI] ${message}`);
}

function warn(message) {
  console.warn(`[Vitals.AI] ${message}`);
}

function fail(message) {
  console.error(`[Vitals.AI] ${message}`);
  hasFailure = true;
}

function parseBoolean(value, fallback = false) {
  if (!value) return fallback;
  const normalized = value.trim().toLowerCase();
  if (normalized === 'true') return true;
  if (normalized === 'false') return false;
  return fallback;
}

function isLoopbackUrl(raw) {
  if (!raw) return false;
  try {
    const parsed = new URL(raw);
    const host = parsed.hostname.toLowerCase();
    return host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.startsWith('127.');
  } catch {
    return false;
  }
}

function isLikelyPlaceholder(value) {
  const normalized = value.trim().toLowerCase();
  if (!normalized) return true;
  return LEAK_PLACEHOLDER_HINTS.some((hint) => normalized.includes(hint));
}

function shouldSkipTrackedFile(filePath) {
  if (!filePath) return true;
  if (TRACKED_FILE_EXCLUDES.some((prefix) => filePath.startsWith(prefix))) {
    return true;
  }
  const ext = path.extname(filePath).toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

function findSuspectedSecrets(content) {
  const findings = [];

  for (const { label, pattern } of DIRECT_SECRET_PATTERNS) {
    const match = content.match(pattern);
    if (match) {
      findings.push(`${label} pattern match`);
    }
  }

  const envLikePatterns = [
    { name: 'OPENROUTER_API_KEY', pattern: /^\s*OPENROUTER_API_KEY\s*=\s*(.+?)\s*$/m },
    { name: 'OPENCLAW_HOOKS_TOKEN', pattern: /^\s*OPENCLAW_HOOKS_TOKEN\s*=\s*(.+?)\s*$/m },
    { name: 'TERRA_API_SECRET', pattern: /^\s*TERRA_API_SECRET\s*=\s*(.+?)\s*$/m },
  ];

  for (const { name, pattern } of envLikePatterns) {
    const match = content.match(pattern);
    if (!match || !match[1]) {
      continue;
    }

    const rawValue = match[1].split('#')[0].trim().replace(/^['"]|['"]$/g, '');
    if (!rawValue || isLikelyPlaceholder(rawValue)) {
      continue;
    }

    const looksReal =
      (name === 'OPENROUTER_API_KEY' && /^sk-or-v1-[a-z0-9]{24,}$/i.test(rawValue)) ||
      (name === 'OPENCLAW_HOOKS_TOKEN' && /^[a-f0-9]{24,}$/i.test(rawValue)) ||
      (name === 'TERRA_API_SECRET' && rawValue.length >= 20);

    if (looksReal) {
      findings.push(`${name} looks like a real credential`);
    }
  }

  return findings;
}

function scanTrackedFilesForSecrets() {
  const trackedFilesResult = spawnSync('git', ['ls-files'], {
    cwd,
    encoding: 'utf8',
  });

  if (trackedFilesResult.status !== 0) {
    warn('Could not list tracked files for secret scan.');
    return;
  }

  const trackedFiles = trackedFilesResult.stdout
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((filePath) => !shouldSkipTrackedFile(filePath));

  const findings = [];

  for (const relativeFilePath of trackedFiles) {
    const absolutePath = path.join(cwd, relativeFilePath);
    let content = '';

    try {
      const stat = fs.statSync(absolutePath);
      if (!stat.isFile() || stat.size > 2_000_000) {
        continue;
      }
      content = fs.readFileSync(absolutePath, 'utf8');
    } catch {
      continue;
    }

    const fileFindings = findSuspectedSecrets(content);
    if (fileFindings.length > 0) {
      findings.push({ file: relativeFilePath, issues: fileFindings });
    }
  }

  if (findings.length > 0) {
    fail('Potential secret leak detected in tracked files:');
    for (const finding of findings) {
      fail(`  - ${finding.file}: ${finding.issues.join('; ')}`);
    }
    fail('Move secrets to .env.local / Vercel environment variables and rotate exposed keys.');
  }
}

function ensureSensitiveFilesNotTracked() {
  const sensitiveFiles = ['.env', '.env.local', '.env.production', 'user-goals.json'];
  for (const file of sensitiveFiles) {
    const result = spawnSync('git', ['ls-files', '--error-unmatch', file], {
      cwd,
      stdio: 'ignore',
    });
    if (result.status === 0) {
      fail(`${file} is tracked by git. Remove it from git history and keep it local-only.`);
    }
  }
}

function checkDownloadsPath() {
  if (cwd.includes('/Downloads/')) {
    warn(
      'Project is inside Downloads. macOS sandbox restrictions can cause EPERM on .env.local/next-env.d.ts. Prefer ~/Projects/OpenHealth.'
    );
  }
}

function ensureNpmCacheDir() {
  const localCacheDir = path.join(cwd, '.npm-cache');
  try {
    fs.mkdirSync(localCacheDir, { recursive: true });
  } catch (error) {
    fail(
      `Could not create local npm cache at ${localCacheDir}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function ensureNextEnvFile() {
  if (!fs.existsSync(nextEnvPath)) {
    try {
      fs.writeFileSync(nextEnvPath, defaultNextEnv, 'utf8');
      info('Created missing next-env.d.ts');
    } catch (error) {
      fail(
        `next-env.d.ts is missing and could not be created. ${error instanceof Error ? error.message : String(error)}`
      );
      return;
    }
  }

  try {
    fs.accessSync(nextEnvPath, fs.constants.R_OK | fs.constants.W_OK);
  } catch (error) {
    fail(
      `next-env.d.ts exists but is not readable/writable. ${error instanceof Error ? error.message : String(error)}`
    );
    warn(
      'Run in Terminal.app: sudo chown -R "$USER":staff . && chmod -R u+rwX . && /usr/bin/xattr -dr com.apple.quarantine .'
    );
  }
}

function removeStaleNextLock() {
  if (!fs.existsSync(lockPath)) {
    return;
  }

  const lockProbe = spawnSync('lsof', [lockPath], { encoding: 'utf8' });
  if (lockProbe.status === 0 && lockProbe.stdout.trim()) {
    const lines = lockProbe.stdout.trim().split('\n');
    if (lines.length > 1) {
      fail(
        `Next dev lock is active (${lockPath}). Stop existing dev server first (for example: pkill -f "next-server").`
      );
      return;
    }
  }

  try {
    fs.unlinkSync(lockPath);
    info('Removed stale .next/dev/lock');
  } catch (error) {
    fail(
      `Could not remove stale Next lock at ${lockPath}. ${error instanceof Error ? error.message : String(error)}`
    );
  }
}

function checkEnvPermissions() {
  const envPath = path.join(cwd, '.env.local');
  if (!fs.existsSync(envPath)) {
    return;
  }

  try {
    fs.accessSync(envPath, fs.constants.R_OK);
  } catch (error) {
    warn(
      `.env.local is not readable (${error instanceof Error ? error.message : String(error)}). Use ~/.vitals-ai.env fallback if needed.`
    );
  }
}

function runDeployCheck() {
  const fastApiBase = process.env.FASTAPI_BASE_URL?.trim();
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  const openClawEnabled = parseBoolean(process.env.OPENCLAW_ENABLED, false);
  const openClawBase = process.env.OPENCLAW_HOOKS_BASE_URL?.trim();
  const openClawToken = process.env.OPENCLAW_HOOKS_TOKEN?.trim();

  if (!openRouterKey && !fastApiBase) {
    fail('Deploy check: set either OPENROUTER_API_KEY or FASTAPI_BASE_URL for chatbot runtime.');
  }

  if (fastApiBase && isLoopbackUrl(fastApiBase)) {
    fail('Deploy check: FASTAPI_BASE_URL cannot point to localhost/127.0.0.1 in hosted deployments.');
  }

  if (openClawEnabled) {
    if (!openClawToken) {
      fail('Deploy check: OPENCLAW_ENABLED=true requires OPENCLAW_HOOKS_TOKEN.');
    }
    if (!openClawBase) {
      fail('Deploy check: OPENCLAW_ENABLED=true requires OPENCLAW_HOOKS_BASE_URL.');
    } else if (isLoopbackUrl(openClawBase)) {
      fail('Deploy check: OPENCLAW_HOOKS_BASE_URL cannot be localhost/127.0.0.1 in hosted deployments.');
    }
  }

  if (!siteUrl) {
    warn('Deploy check: NEXT_PUBLIC_SITE_URL is not set (recommended for OpenRouter referer and metadata).');
  }
}

checkDownloadsPath();
ensureNpmCacheDir();
ensureNextEnvFile();
checkEnvPermissions();
ensureSensitiveFilesNotTracked();
scanTrackedFilesForSecrets();
if (mode === 'deploy-check') {
  runDeployCheck();
}
if (mode === 'dev') {
  removeStaleNextLock();
}

if (mode === 'doctor' || mode === 'deploy-check') {
  info('Doctor check complete.');
}

if (hasFailure) {
  process.exit(1);
}
