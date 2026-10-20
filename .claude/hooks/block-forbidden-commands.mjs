// PreToolUse hook for the Bash tool: stops commands this repo forbids.
//
// Claude Code passes the tool call as JSON on stdin. Exit code 2 blocks the
// call and sends what we print on stderr back to Claude, which then retries
// with an allowed command. Exit code 0 lets the call through.
//
// Forbidden: npm and yarn. The lockfile is pnpm's, and mixing package
// managers creates a second lockfile and a different node_modules layout.

const FORBIDDEN = new Set(['npm', 'yarn'])

// Words that can come before the real command: `sudo npm i`, `FOO=1 yarn add x`.
const PREFIXES = new Set(['sudo', 'command', 'time', 'exec', 'env'])

// Text inside quotes and heredocs is data, not a command: a commit message or
// an `echo` may well mention npm. Blank it out before looking for commands.
// This makes the hook a guardrail against Claude's habits, not a security
// boundary: `bash -c "npm i"` gets through.
function withoutQuotedText(command) {
  return command
    .replace(/<<-?\s*(['"]?)(\w+)\1([^\n]*)\n[\s\S]*?\n\s*\2(?=\n|$)/g, ' $3')
    .replace(/'[^']*'/g, "''")
    .replace(/"(?:[^"\\]|\\.)*"/g, '""')
}

export function forbiddenCommand(command) {
  // A command line can hold several commands: `cd x && npm i; echo done`.
  for (const segment of withoutQuotedText(command).split(/&&|\|\||[;|\n(`]/)) {
    const words = segment.trim().split(/\s+/)
    while (words.length > 0 && (PREFIXES.has(words[0]) || /^\w+=\S*$/.test(words[0]))) words.shift()
    // Only the command word counts, so `grep npm file` or `echo yarn` pass.
    if (FORBIDDEN.has(words[0])) return words[0]
  }
  return null
}

async function readStdin() {
  let text = ''
  for await (const chunk of process.stdin) text += chunk
  return text
}

// Run only when started by Claude Code, not when the file is imported by a test.
if (import.meta.url === `file://${process.argv[1]}`) {
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
