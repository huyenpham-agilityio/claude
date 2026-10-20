// Run with: node --test ".claude/hooks/*.test.mjs"
import assert from 'node:assert/strict'
import { test } from 'node:test'
import { forbiddenCommand } from './block-forbidden-commands.mjs'

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
]

const allowed = [
  'pnpm install',
  'corepack pnpm dev',
  'npx tsc --noEmit',
  'git status',
  'grep -rn npm README.md',
  'echo yarn is forbidden',
  // Words inside quotes are data, not commands.
  'echo "cd client && yarn add zod"',
  "git commit -m 'drop npm; use pnpm'",
  'git commit -m "a && npm b"',
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
