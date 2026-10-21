import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'
import { applyEdit, DocError, listDocs, readDoc, writeDoc } from './docs.ts'

const server = new McpServer({ name: 'docs', version: '0.1.0' })

const text = (value: string) => ({ content: [{ type: 'text' as const, text: value }] })
const failure = (message: string) => ({ ...text(message), isError: true })

// Turns a document problem into a tool error Claude can read and react to, and
// lets unexpected errors keep their normal handling.
async function guarded<T>(work: () => Promise<T>) {
  try {
    return await work()
  } catch (error) {
    if (error instanceof DocError) return failure(error.message)
    throw error
  }
}

// TOOLS: actions Claude can decide to call. The description and the field
// descriptions are what Claude reads to know when and how to use each one.
server.registerTool(
  'read_doc',
  {
    description: 'Read the full contents of a document by its id (for example "plan.md").',
    inputSchema: { doc_id: z.string().describe('The id of the document to read') },
    annotations: { readOnlyHint: true },
  },
  ({ doc_id }) => guarded(async () => text(await readDoc(doc_id))),
)

server.registerTool(
  'edit_doc',
  {
    description:
      'Replace the first occurrence of a piece of text in a document with new text. The old text must appear exactly and must not be empty.',
    inputSchema: {
      doc_id: z.string().describe('The id of the document to edit'),
      old_text: z.string().min(1).describe('The exact text to replace'),
      new_text: z.string().describe('The text to put in its place'),
    },
  },
  ({ doc_id, old_text, new_text }) =>
    guarded(async () => {
      await writeDoc(doc_id, applyEdit(await readDoc(doc_id), old_text, new_text))
      return text(`Edited ${doc_id}.`)
    }),
)

// A research-style tool: find documents that mention a word.
server.registerTool(
  'search_docs',
  {
    description: 'Find documents whose contents mention a word or phrase. Returns matching ids with a snippet.',
    inputSchema: { query: z.string().min(1).describe('The word or phrase to look for (not case sensitive)') },
    annotations: { readOnlyHint: true },
  },
  async ({ query }) => {
    const needle = query.toLowerCase()
    const hits: string[] = []
    for (const id of await listDocs()) {
      const lines = (await readDoc(id)).split('\n')
      const found = lines.find((line) => line.toLowerCase().includes(needle))
      if (found !== undefined || id.toLowerCase().includes(needle)) hits.push(`${id}: ${found?.trim() ?? ''}`)
    }
    return text(hits.length === 0 ? `No document mentions "${query}".` : hits.join('\n'))
  },
)

// RESOURCES: read-only data with an address. The app decides when to use them.
server.registerResource(
  'document-list',
  'docs://documents',
  { description: 'The ids of all documents', mimeType: 'application/json' },
  async (uri) => ({ contents: [{ uri: uri.href, mimeType: 'application/json', text: JSON.stringify(await listDocs()) }] }),
)

// A resource template: one address pattern, many documents.
server.registerResource(
  'document',
  new ResourceTemplate('docs://documents/{doc_id}', {
    list: async () => ({
      resources: (await listDocs()).map((id) => ({ uri: `docs://documents/${id}`, name: id })),
    }),
  }),
  { description: 'The contents of one document', mimeType: 'text/plain' },
  async (uri, { doc_id }) => ({
    contents: [{ uri: uri.href, mimeType: 'text/plain', text: await readDoc(String(doc_id)) }],
  }),
)

// PROMPTS: ready-made instructions the user can pick, for example from a menu.
server.registerPrompt(
  'format',
  {
    description: 'Rewrite a document in Markdown',
    argsSchema: { doc_id: z.string().describe('The id of the document to rewrite') },
  },
  ({ doc_id }) => ({
    messages: [
      {
        role: 'user',
        content: {
          type: 'text',
          text: `Read the document "${doc_id}" with the read_doc tool, rewrite it in clean Markdown, then save it with edit_doc.`,
        },
      },
    ],
  }),
)

// stdio: the client starts this program and talks to it over stdin/stdout, so
// never print anything else to stdout. Use console.error for logs.
await server.connect(new StdioServerTransport())
console.error('docs MCP server running on stdio')
