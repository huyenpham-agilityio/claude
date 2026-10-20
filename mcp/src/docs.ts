import { readdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The documents are the files in mcp/docs. Everything the server does to them
// goes through this module, so the rules that keep it inside that folder live
// in one place.
const DOCS_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'docs')
const ALLOWED = /^[\w.-]+\.(md|txt)$/

export class DocError extends Error {}

// An id is a plain file name. Anything that could point outside the folder,
// such as "../package.json", "sub/dir.md" or an absolute path, is refused.
function fileFor(id: string): string {
  if (!ALLOWED.test(id) || id.includes('..')) {
    throw new DocError(`"${id}" is not a valid document id. Use a plain name ending in .md or .txt.`)
  }
  const file = path.join(DOCS_DIR, id)
  if (path.dirname(file) !== DOCS_DIR) throw new DocError(`"${id}" is outside the documents folder.`)
  return file
}

export async function listDocs(): Promise<string[]> {
  const names = await readdir(DOCS_DIR)
  return names.filter((name) => ALLOWED.test(name)).sort()
}

export async function readDoc(id: string): Promise<string> {
  try {
    return await readFile(fileFor(id), 'utf8')
  } catch (error) {
    if (error instanceof DocError) throw error
    throw new DocError(`No document named "${id}". Known documents: ${(await listDocs()).join(', ')}`)
  }
}

export async function writeDoc(id: string, body: string): Promise<void> {
  await writeFile(fileFor(id), body, 'utf8')
}
