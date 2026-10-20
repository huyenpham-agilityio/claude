// Run with: node --test ".claude/hooks/*.test.mjs"
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, symlinkSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { test } from 'node:test'
import { fileURLToPath } from 'node:url'
import { forbiddenCommand } from './block-forbidden-commands.mjs'

const hookPath = fileURLToPath(new URL('./block-forbidden-commands.mjs', import.meta.url))

const blocked = [
  ['npm install', 'npm'],
  ['yarn add zod', 'yarn'],
  ['cd client && npm run build', 'npm'],
  ['FOO=1 npm test', 'npm'],
  ['sudo npm i -g x', 'npm'],
  ['pnpm install; npm ci', 'npm'],
  ['echo ok\nyarn', 'yarn'],
  ['git status | npm run x', 'npm'],
  // Text outside the quotes still counts.
  ['echo "hi" && npm i', 'npm'],
  // A single & runs the first command in the background.
  ['sleep 1 & npm i', 'npm'],
  // Shell keywords can start a command.
  ['if cd client; then npm i; fi', 'npm'],
  ['for x in a b; do yarn add $x; done', 'yarn'],
  // Prefix options, and the value that follows some of them.
  ['sudo -u build npm ci', 'npm'],
  ['env -i npm i', 'npm'],
  ['env -u HOME FOO=1 npm i', 'npm'],
  // The command word may be a path or have a Windows suffix.
  ['/usr/bin/npm i', 'npm'],
  ['npm.cmd install', 'npm'],
  // An apostrophe inside double quotes must not pair with a later one and
  // hide the command between them.
  ['echo "it\'s" ; npm i ; echo "isn\'t"', 'npm'],
  ['echo "it\'s fine" && yarn add x && echo "don\'t"', 'yarn'],
]

const allowed = [
  'pnpm install',
  'corepack pnpm dev',
  'npx tsc --noEmit',
  'git status',
  'grep -rn npm README.md',
  'echo yarn is forbidden',
  // Redirections contain & and > but are not new commands.
  'pnpm test 2>&1 | tail -5',
  'echo done >&2',
  // Words inside quotes are data, not commands.
  'echo "cd client && yarn add zod"',
  "git commit -m 'drop npm; use pnpm'",
  'git commit -m "a && npm b"',
  'git commit -m "it\'s about npm" -m \'and "yarn"\'',
  // A heredoc body is data too, even when a line starts with npm.
  "git commit -F - <<'EOF'\nSwitch to pnpm\nnpm and yarn are not allowed\nEOF",
]

for (const [command, word] of blocked) {
  test(`blocks ${JSON.stringify(command)}`, () => assert.equal(forbiddenCommand(command), word))
}

for (const command of allowed) {
  test(`allows ${JSON.stringify(command)}`, () => assert.equal(forbiddenCommand(command), null))
}

test('still blocks a command that follows a heredoc', () => {
  assert.equal(forbiddenCommand("cat <<'EOF'\nhello\nEOF\nnpm install"), 'npm')
})

// The tests above call the function. These run the script the way Claude Code
// does: JSON on stdin, and the exit code and stderr as the answer.
function runHook(input, script = hookPath) {
  return spawnSync(process.execPath, [script], { input, encoding: 'utf8' })
}

const call = (command) => JSON.stringify({ tool_input: { command } })

test('exits with code 2 and explains when the command is forbidden', () => {
  const result = runHook(call('npm install'))
  assert.equal(result.status, 2)
  assert.match(result.stderr, /uses pnpm, not npm/)
})

test('exits with code 0 and stays quiet for an allowed command', () => {
  const result = runHook(call('pnpm install'))
  assert.equal(result.status, 0)
  assert.equal(result.stderr, '')
})

test('lets the command through when the input is not readable', () => {
  assert.equal(runHook('not json').status, 0)
  assert.equal(runHook('').status, 0)
  assert.equal(runHook(JSON.stringify({ tool_input: {} })).status, 0)
})

test('still blocks when the project is reached through a symbolic link', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hook-link-'))
  try {
    const real = path.join(dir, 'real')
    mkdirSync(real)
    copyFileSync(hookPath, path.join(real, 'block-forbidden-commands.mjs'))
    symlinkSync(real, path.join(dir, 'link'))
    assert.equal(runHook(call('npm install'), path.join(dir, 'link', 'block-forbidden-commands.mjs')).status, 2)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})

test('still blocks when the project path contains a space', () => {
  const dir = mkdtempSync(path.join(tmpdir(), 'hook test '))
  try {
    const nested = path.join(dir, 'my project')
    mkdirSync(nested)
    const copy = path.join(nested, 'block-forbidden-commands.mjs')
    copyFileSync(hookPath, copy)
    assert.equal(runHook(call('npm install'), copy).status, 2)
  } finally {
    rmSync(dir, { recursive: true, force: true })
  }
})
