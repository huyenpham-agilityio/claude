import assert from 'node:assert/strict'
import { test } from 'node:test'
import { applyEdit, DocError, readDoc } from '../docs.ts'

// Ids that could reach a file outside mcp/docs, or a file of another kind.
const invalidIds = ['../package.json', '../x.md', 'a/b.md', '/etc/passwd', '..md', 'x.js', 'x', '']

for (const id of invalidIds) {
  test(`refuses the id ${JSON.stringify(id)}`, async () => {
    await assert.rejects(readDoc(id), (error: unknown) => error instanceof DocError && /not a valid document id/.test(error.message))
  })
}

test('reports a missing document and lists the known ones', async () => {
  await assert.rejects(readDoc('nope.md'), (error: unknown) => error instanceof DocError && /No document named "nope.md"/.test(error.message))
})

test('reads a document that exists', async () => {
  assert.match(await readDoc('overview.md'), /\S/)
})

test('applyEdit inserts the new text as it is, including $ patterns', () => {
  assert.equal(applyEdit('price: X', 'X', 'cost $& vs $1'), 'price: cost $& vs $1')
})

test('applyEdit replaces only the first occurrence', () => {
  assert.equal(applyEdit('a a', 'a', 'b'), 'b a')
})

test('applyEdit refuses an empty old text', () => {
  assert.throws(() => applyEdit('abc', '', 'X'), DocError)
})

test('applyEdit refuses text that is not there', () => {
  assert.throws(() => applyEdit('abc', 'z', 'X'), DocError)
})
