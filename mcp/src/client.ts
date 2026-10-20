import { Client } from '@modelcontextprotocol/sdk/client/index.js'
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js'

// The client starts the server as a child process and talks to it over stdio.
const transport = new StdioClientTransport({
  command: 'pnpm',
  args: ['exec', 'tsx', 'src/server.ts'],
  stderr: 'inherit',
})
const client = new Client({ name: 'docs-practice-client', version: '0.1.0' })
await client.connect(transport)

const show = (label: string, value: unknown) => console.log(`\n== ${label}\n${JSON.stringify(value, null, 2)}`)

// 1. Ask the server what it offers.
const { tools } = await client.listTools()
show('tools', tools.map((tool) => ({ name: tool.name, description: tool.description })))
const { resources } = await client.listResources()
show('resources', resources.map((resource) => resource.uri))
const { resourceTemplates } = await client.listResourceTemplates()
show('resource templates', resourceTemplates.map((template) => template.uriTemplate))
const { prompts } = await client.listPrompts()
show('prompts', prompts.map((prompt) => prompt.name))

// 2. Call a tool.
show('call search_docs("budget")', await client.callTool({ name: 'search_docs', arguments: { query: 'budget' } }))
show('call read_doc("overview.md")', await client.callTool({ name: 'read_doc', arguments: { doc_id: 'overview.md' } }))
show('call read_doc("nope.md")', await client.callTool({ name: 'read_doc', arguments: { doc_id: 'nope.md' } }))
// The server must stay inside the docs folder, whatever the id looks like.
show('call read_doc("../package.json")', await client.callTool({ name: 'read_doc', arguments: { doc_id: '../package.json' } }))

// 3. Read resources.
show('read docs://documents', await client.readResource({ uri: 'docs://documents' }))
show('read docs://documents/ideas.txt', await client.readResource({ uri: 'docs://documents/ideas.txt' }))

// 4. Get a prompt.
show('get prompt format', await client.getPrompt({ name: 'format', arguments: { doc_id: 'release-checklist.md' } }))

await client.close()
