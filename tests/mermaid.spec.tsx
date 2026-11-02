// @vitest-environment jsdom
import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { DshMermaidNode } from '../src/client/mermaid.tsx'

const api = vi.hoisted(() => ({
  initialize: vi.fn(),
  parse: vi.fn(async () => ({})),
  getDiagramFromText: vi.fn(async (code: string) => ({ db: { getData: () => ({ nodes: code.includes('img:') ? [{ img: '/slow' }] : [] }) } })),
  render: vi.fn(async () => ({ svg: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"/>' })),
}))
vi.mock('mermaid', () => ({ default: { ...api, mermaidAPI: { getDiagramFromText: api.getDiagramFromText } } }))
afterEach(() => { cleanup(); vi.clearAllMocks() })
const node = (code: string) => ({ type: 'code_block' as const, language: 'mermaid', code, raw: code, loading: false })

it('preserves frontmatter and applies theme without changing source', async () => {
  const code = '---\ntitle: Demo\n---\nflowchart LR\nA --> B'
  const view = render(<DshMermaidNode node={node(code)} isDark />)
  await waitFor(() => expect(view.container.querySelector('img')).not.toBeNull())
  expect(api.parse).toHaveBeenCalledWith(code)
  expect(api.render).toHaveBeenCalledWith(expect.any(String), code, expect.any(HTMLElement))
  expect(api.initialize).toHaveBeenCalledWith(expect.objectContaining({ theme: 'dark', securityLevel: 'strict', htmlLabels: false }))
})

it('rejects image nodes before rendering and allows the following diagram', async () => {
  const view = render(<DshMermaidNode node={node('flowchart LR\nA@{ img: "/slow" }')} />)
  await waitFor(() => expect(view.getByRole('status').textContent).toContain('image nodes are disabled'))
  expect(api.render).not.toHaveBeenCalled()
  view.rerender(<DshMermaidNode node={node('flowchart LR\nC --> D')} />)
  await waitFor(() => expect(view.container.querySelector('img')).not.toBeNull())
  expect(api.render).toHaveBeenCalledTimes(1)
})

it('keeps incomplete input as source without starting layout', async () => {
  render(<DshMermaidNode node={{ ...node('flowchart LR\nA -->'), loading: true }} />)
  await Promise.resolve()
  expect(api.render).not.toHaveBeenCalled()
  expect(api.parse).not.toHaveBeenCalled()
})
