// PreToolUse hook for the Bash tool: stops commands this repo forbids.
//
// Claude Code passes the tool call as JSON on stdin. Exit code 2 blocks the
// call and sends what we print on stderr back to Claude, which then retries
// with an allowed command. Exit code 0 lets the call through.
//
// Forbidden: npm and yarn. The lockfile is pnpm's, and mixing package
// managers creates a second lockfile and a different node_modules layout.
//
// This is a guardrail against Claude's habits, not a security boundary. It
// does not see through `bash -c "npm i"`, `xargs npm`, `corepack npm`, or a
// command substitution inside double quotes such as `echo "$(npm i)"`.

import { realpathSync } from 'node:fs'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

const FORBIDDEN = new Set(['npm', 'yarn'])

// Words that can come before the real command: `sudo npm i`, `then npm i`.
const PREFIXES = new Set([
  'sudo', 'command', 'time', 'exec', 'env', 'nohup', 'nice',
  // Shell keywords that start a command: `if cd x; then npm i; fi`.
  'if', 'then', 'else', 'elif', 'do', 'while', 'until', '!', '{',
])

// Options of those prefixes that take a value, so the value is not mistaken
// for the command: `sudo -u build npm ci`.
const OPTIONS_WITH_VALUE = {
  sudo: new Set(['-u', '-g', '-h', '-p', '-C', '-U', '-r', '-t', '-D', '-T']),
  env: new Set(['-u', '-C', '-S']),
  nice: new Set(['-n']),
}

// Text inside quotes and heredocs is data, not a command: a commit message or
// an `echo` may well mention npm. Blank it out before looking for commands.
// Quotes are matched in a single pass so that the one that comes first wins:
// an apostrophe inside "it's" must not pair with one in a later string.
function withoutQuotedText(command) {
  return command
    .replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\s*\2(?=\n|$)/g, ' $3')
    .replace(/'[^']*'|"(?:[^"\\]|\\.)*"/g, (quoted) => (quoted[0] === "'" ? "''" : '""'))
}

// The command word of one part of a command line, or undefined.
function commandWord(segment) {
  const words = segment.trim().split(/\s+/)
  let prefix
  while (words.length > 0) {
    const word = words[0]
    if (PREFIXES.has(word)) {
      prefix = word
      words.shift()
    } else if (/^\w+=\S*$/.test(word)) {
      words.shift() // FOO=1 npm test
    } else if (prefix && word.startsWith('-')) {
      // `command -v npm` only looks npm up; it does not run it.
      if (prefix === 'command' && (word === '-v' || word === '-V')) return undefined
      words.shift()
      if (OPTIONS_WITH_VALUE[prefix]?.has(word)) words.shift()
    } else {
      break
    }
  }
  // `/usr/bin/npm` and `npm.cmd` are npm too.
  return words[0] && path.basename(words[0]).replace(/\.(cmd|exe|ps1)$/i, '')
}

export function forbiddenCommand(command) {
  // A command line can hold several commands: `cd x && npm i; echo done`.
  // A single & (run in the background) also ends a command.
  for (const segment of withoutQuotedText(command).split(/&&?|\|\||[;|\n(`]/)) {
    // Only the command word counts, so `grep npm file` or `echo yarn` pass.
    const word = commandWord(segment)
    if (FORBIDDEN.has(word)) return word
  }
  return null
}

async function readStdin() {
  let text = ''
  for await (const chunk of process.stdin) text += chunk
  return text
}

// True when this file is the program being run, not a module a test imports.
// Compare as URLs, and with symbolic links resolved: import.meta.url is the
// real path, percent-encoded, while process.argv[1] is the path as typed, so a
// space, a special character or a linked folder (such as /tmp on macOS) would
// make a plain string comparison fail and silently disable the hook.
function isMainModule() {
  if (!process.argv[1]) return false
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href
  } catch {
    return false
  }
}

if (isMainModule()) {
  let command = ''
  try {
    command = JSON.parse(await readStdin()).tool_input?.command ?? ''
  } catch {
    process.exit(0) // Unreadable input: do not block work on a hook problem.
  }

  const found = forbiddenCommand(String(command))
  if (found) {
    console.error(`This repo uses pnpm, not ${found}. Run the pnpm equivalent (see CLAUDE.md).`)
    process.exit(2)
  }
}
