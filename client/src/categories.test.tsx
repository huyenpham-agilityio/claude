import { screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { categories, signedInHandlers } from './test/fixtures.ts'
import { mockApi, renderApp } from './test/renderApp.tsx'

afterEach(() => vi.unstubAllGlobals())

describe('categories page', () => {
  it('groups categories by type', async () => {
    mockApi(signedInHandlers())
    renderApp('/categories')

    const income = (await screen.findByRole('heading', { name: 'Income categories' })).parentElement!
    expect(within(income).getByText('Salary')).toBeInTheDocument()
    expect(within(income).queryByText('Rent')).not.toBeInTheDocument()
    expect(within(income).getByText('1 transaction')).toBeInTheDocument()
  })

  it('only allows deleting categories that are not in use', async () => {
    const remove = vi.fn(() => Response.json({ ok: true }))
    mockApi({ ...signedInHandlers(), 'DELETE /api/categories/c-rent': remove })
    renderApp('/categories')

    expect(await screen.findByRole('button', { name: 'Delete Groceries' })).toBeDisabled()

    await userEvent.click(screen.getByRole('button', { name: 'Delete Rent' }))
    const confirm = await screen.findByRole('alertdialog')
    await userEvent.click(within(confirm).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(remove).toHaveBeenCalledTimes(1))
  })

  it('adds a category', async () => {
    const create = vi.fn((_body: unknown) =>
      Response.json({ category: categories[0] }, { status: 201 }),
    )
    mockApi({ ...signedInHandlers(), 'POST /api/categories': create })
    renderApp('/categories')

    await userEvent.click(await screen.findByRole('button', { name: 'Add category' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Pets')
    await userEvent.selectOptions(within(dialog).getByLabelText('Type'), 'Income')
    await userEvent.click(within(dialog).getByRole('radio', { name: 'Colour 3' }))
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add category' }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create.mock.calls[0]![0]).toEqual({ name: 'Pets', type: 'income', color: '#eab308' })
  })

  it('renames a category without changing its type', async () => {
    const update = vi.fn((_body: unknown) => Response.json({ category: categories[1] }))
    mockApi({ ...signedInHandlers(), 'PATCH /api/categories/c-rent': update })
    renderApp('/categories')

    await userEvent.click(await screen.findByRole('button', { name: 'Edit Rent' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByLabelText('Type')).toBeDisabled()

    const name = within(dialog).getByLabelText('Name')
    await userEvent.clear(name)
    await userEvent.type(name, 'Housing')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Save changes' }))

    await waitFor(() => expect(update).toHaveBeenCalled())
    expect(update.mock.calls[0]![0]).toEqual({ name: 'Housing', color: '#6366f1' })
  })

  it('shows a duplicate-name error from the server', async () => {
    mockApi({
      ...signedInHandlers(),
      'POST /api/categories': () =>
        Response.json(
          { error: { message: 'You already have a category with this name' } },
          { status: 409 },
        ),
    })
    renderApp('/categories')

    await userEvent.click(await screen.findByRole('button', { name: 'Add category' }))
    const dialog = await screen.findByRole('dialog')
    await userEvent.type(within(dialog).getByLabelText('Name'), 'Rent')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add category' }))

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'You already have a category with this name',
    )
  })
})
