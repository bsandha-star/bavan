#!/usr/bin/env node
// Claude Code PreToolUse guard v3 (master: Birdcycle-Dental/claude-kit). Cross-platform; fails open on its own errors.
// Goal: the owner is asked only for things that can't be undone. Everything else runs without a prompt.
//
//  ALWAYS ASK (not reversible):  --remote writes, wrangler secret put/bulk/delete, wrangler rollback, SETUP.bat,
//                                PUSH-TO-GITHUB.bat, git push --all/--mirror, force push that touches main/master or
//                                isn't a claude/ work branch, git reset --hard, git clean -f,
//                                GitHub MCP file writes straight to main/master.
//  ALLOWED AFTER /pre-pr PASSED: deploys (wrangler deploy, npm run deploy, DEPLOY.bat, az webapp) and plain pushes to
//  on HEAD with a clean tree:    main/master. Otherwise they ask.
//  MERGING A PR:                 no prompt, unless the branch changes a protected file or a database migration.
//  PROTECTED FILES (.claude/guard.json): edits ask. Reads ask too, unless the entry has "read": true.
//  OPENING A PR:                 blocked until /pre-pr passed on HEAD (Claude runs /pre-pr itself; nobody is asked).
//  `node .claude/hooks/guard.js --record-pre-pr` records a /pre-pr pass for the current HEAD.
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const git = (args, cwd) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }).trim();
const markerFile = (cwd) => path.resolve(cwd, git(['rev-parse', '--git-dir'], cwd), 'claude-pre-pr.json');

if (process.argv.includes('--record-pre-pr')) {
  const cwd = process.cwd();
  const head = git(['rev-parse', 'HEAD'], cwd);
  fs.writeFileSync(markerFile(cwd), JSON.stringify({ head, at: new Date().toISOString() }));
  console.log(`pre-pr pass recorded for ${head.slice(0, 7)}`);
  process.exit(0);
}

const re = (parts) => new RegExp(parts.join('|'), 'i');
const PUSH = String.raw`\bgit\b[^\n;&|]*\spush\b[^\n;&|]*`;
const IRREVERSIBLE = re([
  String.raw`(^|\s)--remote(\s|=|$)`,
  String.raw`\bwrangler\b[^\n;&|]*\b(secret\s+(put|bulk|delete)|rollback)\b`,
  String.raw`\b(SETUP|PUSH-TO-GITHUB)\.bat\b`,
  PUSH + String.raw`\s--(all|mirror)\b`,
  String.raw`\bgit\b[^\n;&|]*\sreset\b[^\n;&|]*\s--hard\b`,
  String.raw`\bgit\b[^\n;&|]*\sclean\b[^\n;&|]*\s-[a-zA-Z]*f`,
]);
const DEPLOY = re([
  String.raw`\bwrangler\b[^\n;&|]*\b(deploy|publish|versions\s+(deploy|upload))\b`,
  String.raw`\bnpm\s+run\s+(deploy|release|publish)\b`,
  String.raw`\bDEPLOY\.bat\b`,
  String.raw`\baz\s+(webapp|functionapp)\b`,
]);
const PUSH_MAIN = re([PUSH + String.raw`[\s:/+](main|master)(\s|$)`]);
const PUSH_FORCE = re([PUSH + String.raw`\s(--force(-with-lease|-if-includes)?(=\S*)?|-[a-zA-Z]*f[a-zA-Z]*|\+\S+)(\s|$)`]);
const WORK_BRANCH = /(^|[\s:+/])claude\/[\w./-]+/;
const PR_CREATE = /\bgh\s+pr\s+create\b/;
const PR_MERGE = /\bgh\s+pr\s+merge\b/;
const WRITES = /(^|[\s;|&(])(rm|mv|cp|tee|truncate|dd|del|Set-Content|Add-Content|Out-File|Remove-Item|Move-Item|Copy-Item|Clear-Content)\b|\bsed\b[^\n;|&]*\s(-[a-zA-Z]*i|--in-place)|\bperl\b[^\n;|&]*\s-[a-zA-Z]*i|>/i;
const MIGRATION = /(migrat|schema\.sql$)/i;
const GITHUB_WRITES = /^mcp__github__(push_files|create_or_update_file|delete_file)$/;

const out = (decision, reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason },
  }));
};

// Is `p` (relative to root, absolute, or ./-prefixed) a protected path? Directories also match as "dir/".
function protectedHit(cfg, root, p, dirHint = false) {
  if (!p || /^[a-z][a-z0-9+.-]*:\/\//i.test(p)) return null;
  const abs = path.resolve(root, p);
  const rel = path.relative(root, abs).split(path.sep).join('/');
  if (rel.startsWith('../')) return null;
  let isDir = dirHint || /[\\/]$/.test(p);
  try { isDir = isDir || fs.statSync(abs).isDirectory(); } catch {}
  for (const pr of cfg.protected || []) {
    const rx = new RegExp(pr.pattern, 'i');
    if (rx.test(rel) || (isDir && rx.test(rel + '/'))) return { rel, why: pr.why, read: pr.read === true };
  }
  return null;
}

function prePrPassed(cwd) {
  try {
    const m = JSON.parse(fs.readFileSync(markerFile(cwd), 'utf8'));
    return m.head === git(['rev-parse', 'HEAD'], cwd) && git(['status', '--porcelain', '--untracked-files=no'], cwd) === '';
  } catch { return false; }
}

// Files this branch changes compared with the default branch (best effort; empty when it can't tell).
function branchFiles(cwd) {
  for (const base of ['origin/HEAD', 'origin/main', 'origin/master']) {
    try { return git(['diff', '--name-only', `${git(['merge-base', 'HEAD', base], cwd)}`, 'HEAD'], cwd).split('\n').filter(Boolean); } catch {}
  }
  return [];
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw.replace(/^\uFEFF/, '') || '{}');   // tolerate a UTF-8 BOM (would otherwise fail open)
    const tool = input.tool_name || '';
    const ti = input.tool_input || {};
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();
    const isShell = tool === 'Bash' || tool === 'PowerShell';
    const cmd = isShell ? String(ti.command || '') : '';
    let cfg = { protected: [] };
    try { cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'guard.json'), 'utf8')); } catch {}

    if (tool === 'mcp__github__create_pull_request' || (isShell && PR_CREATE.test(cmd))) {
      if (!prePrPassed(root)) {
        out('deny', 'Run /pre-pr first (commit everything, then tests, typecheck, /untangle and /code-review must pass on the current commit). Do it yourself now; do not ask the owner.');
      }
      return;
    }

    if (tool === 'mcp__github__merge_pull_request' || (isShell && PR_MERGE.test(cmd))) {
      const sameRepo = !ti.repo || String(ti.repo).toLowerCase() === path.basename(root).toLowerCase();
      if (!sameRepo) return;
      const risky = branchFiles(root).filter((f) => MIGRATION.test(f) || protectedHit(cfg, root, f));
      if (risky.length) out('ask', `This merge changes files that are hard to undo once live: ${risky.slice(0, 5).join(', ')}.`);
      return;
    }

    if (GITHUB_WRITES.test(tool)) {
      if (/^(main|master)$/i.test(String(ti.branch || ''))) out('ask', 'This writes straight to the main branch on GitHub, skipping the PR and its tests.');
      return;
    }

    if (isShell) {
      if (IRREVERSIBLE.test(cmd)) {
        out('ask', 'This cannot be undone easily (remote/production data, a secret, a rollback, or destroying local work). The owner approves these.');
        return;
      }
      const toMain = PUSH_MAIN.test(cmd);
      if (PUSH_FORCE.test(cmd) && (toMain || !WORK_BRANCH.test(cmd))) {
        out('ask', 'Force push to a branch that is not a claude/ work branch (or to main). The owner approves these.');
        return;
      }
      if ((DEPLOY.test(cmd) || toMain) && !prePrPassed(root)) {
        out('ask', 'Deploy or push to main before /pre-pr passed on the current commit (or with uncommitted changes). Run /pre-pr first to go ahead without asking.');
        return;
      }
      // Protected files named in the command: check every word as a path.
      const words = cmd.split(/[\s;|&<>()]+/).flatMap((w) => w.split('=')).map((w) => w.replace(/^['"]+|['"]+$/g, '')).filter(Boolean);
      for (const w of words) {
        const hit = protectedHit(cfg, root, w);
        if (hit && (!hit.read || WRITES.test(cmd))) { out('ask', `This command touches ${hit.rel}, which is protected: ${hit.why}`); return; }
      }
      return;
    }

    if (tool === 'Grep' || tool === 'Glob') {
      const hit = ti.path && protectedHit(cfg, root, ti.path, true);
      if (hit && !hit.read) out('ask', `${hit.rel} is protected: ${hit.why}`);
      return;
    }

    const file = ti.file_path || ti.notebook_path || ti.path;
    if (!file) return;
    const hit = protectedHit(cfg, root, file);
    if (hit && !(tool === 'Read' && hit.read)) out('ask', `${hit.rel} is protected: ${hit.why}`);
  } catch { /* fail open: never break the session */ }
});
