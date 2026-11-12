#!/usr/bin/env node
// Claude Code PreToolUse guard (master: Birdcycle-Dental/claude-kit). Cross-platform; fails open on its own errors.
//  - Bash deploy / --remote / secret / push-to-main  -> ask the owner first
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
  String.raw`\bwrangler\b[^\n;&|]*\b(deploy|publish|rollback|secret\s+(put|bulk|delete)|versions\s+(deploy|upload))\b`,
  String.raw`(^|\s)--remote(\s|=|$)`,
  String.raw`\bnpm\s+run\s+(deploy|release|publish)\b`,
  String.raw`\b(DEPLOY|SETUP|PUSH-TO-GITHUB)\.bat\b`,
  String.raw`\baz\s+(webapp|functionapp)\b`,
  String.raw`\bgit\s+push\b[^\n;&|]*\s(origin\s+)?(main|master)(\s|$)`,
  String.raw`\bgit\s+push\b[^\n;&|]*\s(--force|-f)(\s|$)`,
].join('|'), 'i');
const PR_CREATE = /\bgh\s+pr\s+create\b/;

const out = (decision, reason) => {
  process.stdout.write(JSON.stringify({
    hookSpecificOutput: { hookEventName: 'PreToolUse', permissionDecision: decision, permissionDecisionReason: reason },
  }));
};

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
    if (tool === 'Bash') {
      if (DEPLOY.test(ti.command || '')) {
        out('ask', 'This deploys, touches remote/production resources, sets a secret or pushes to main. The owner approves these.');
      }
      return;
    }
    const file = ti.file_path || ti.notebook_path || ti.path;
    if (!file) return;
    let cfg = { protected: [] };
    try { cfg = JSON.parse(fs.readFileSync(path.join(root, '.claude', 'guard.json'), 'utf8')); } catch {}
    const rel = path.relative(root, path.resolve(root, file)).split(path.sep).join('/');
    for (const p of cfg.protected || []) {
      if (new RegExp(p.pattern, 'i').test(rel)) {
        out('ask', `${rel} is protected: ${p.why}`);
        return;
      }
    }
  } catch { /* fail open: never break the session */ }
});
