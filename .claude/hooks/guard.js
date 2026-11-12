#!/usr/bin/env node
// Claude Code PreToolUse guard (master: Birdcycle-Dental/claude-kit). Cross-platform; fails open on its own errors.
//  - Bash deploy / --remote / secret / push-to-main / force push      -> ask the owner first
//  - Bash, Grep or Glob touching a protected file                     -> ask the owner first
//  - Edit/Write/Read of protected files (.claude/guard.json "protected")   -> ask the owner first
//  - Opening a PR (GitHub MCP or `gh pr create`) before /pre-pr passed on HEAD -> blocked with instructions
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

const DEPLOY = new RegExp([
  // note: "git -C dir push" and "git -c k=v push" are covered (git\b … push)
  String.raw`\bwrangler\b[^\n;&|]*\b(deploy|publish|rollback|secret\s+(put|bulk|delete)|versions\s+(deploy|upload))\b`,
  String.raw`(^|\s)--remote(\s|=|$)`,
  String.raw`\bnpm\s+run\s+(deploy|release|publish)\b`,
  String.raw`\b(DEPLOY|SETUP|PUSH-TO-GITHUB)\.bat\b`,
  String.raw`\baz\s+(webapp|functionapp)\b`,
  // push to main/master in any spelling: `main`, `origin main`, `HEAD:main`, `+x:refs/heads/main`, `--all`, `--mirror`
  String.raw`\bgit\b[^\n;&|]*\spush\b[^\n;&|]*[\s:/+](main|master)(\s|$)`,
  String.raw`\bgit\b[^\n;&|]*\spush\b[^\n;&|]*\s--(all|mirror)\b`,
  // any force push: --force, --force-with-lease[=…], --force-if-includes, -f (alone or bundled like -fu), +refspec
  String.raw`\bgit\b[^\n;&|]*\spush\b[^\n;&|]*\s(--force(-with-lease|-if-includes)?(=\S*)?|-[a-zA-Z]*f[a-zA-Z]*|\+\S+)(\s|$)`,
].join('|'), 'i');
const PR_CREATE = /\bgh\s+pr\s+create\b/;

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
    const re = new RegExp(pr.pattern, 'i');
    if (re.test(rel) || (isDir && re.test(rel + '/'))) return { rel, why: pr.why };
  }
  return null;
}

function prePrPassed(cwd) {
  try {
    const m = JSON.parse(fs.readFileSync(markerFile(cwd), 'utf8'));
    return m.head === git(['rev-parse', 'HEAD'], cwd);
  } catch { return false; }
}

let raw = '';
process.stdin.on('data', (c) => (raw += c));
process.stdin.on('end', () => {
  try {
    const input = JSON.parse(raw || '{}');
    const tool = input.tool_name || '';
    const ti = input.tool_input || {};
    const root = process.env.CLAUDE_PROJECT_DIR || input.cwd || process.cwd();

    if (tool === 'mcp__github__create_pull_request' || (tool === 'Bash' && PR_CREATE.test(ti.command || ''))) {
      if (!prePrPassed(root)) {
        out('deny', 'Run /pre-pr first: tests, typecheck, /untangle and /code-review must pass on the current commit before a PR is opened.');
      }
      return;
    }
    let cfg = { protected: [] };
    try { cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'guard.json'), 'utf8')); } catch {}
    if (tool === 'Bash') {
      const cmd = ti.command || '';
      if (DEPLOY.test(cmd)) {
        out('ask', 'This deploys, touches remote/production resources, sets a secret, force-pushes or pushes to main. The owner approves these.');
        return;
      }
      // Protected files named in a shell command (cat, cp, sed, grep …): check every word as a path.
      const words = cmd.split(/[\s;|&<>()]+/).flatMap((w) => w.split('=')).map((w) => w.replace(/^['"]+|['"]+$/g, '')).filter(Boolean);
      for (const w of words) {
        const hit = protectedHit(cfg, root, w);
        if (hit) { out('ask', `This command touches ${hit.rel}, which is protected: ${hit.why}`); return; }
      }
      return;
    }
    if (tool === 'Grep' || tool === 'Glob') {
      const hit = ti.path && protectedHit(cfg, root, ti.path, true);
      if (hit) out('ask', `${hit.rel} is protected: ${hit.why}`);
      return;
    }
    const file = ti.file_path || ti.notebook_path || ti.path;
    if (!file) return;
    const hit = protectedHit(cfg, root, file);
    if (hit) out('ask', `${hit.rel} is protected: ${hit.why}`);
  } catch { /* fail open: never break the session */ }
});
