// @vitest-environment jsdom
import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import type { ComponentProps } from 'react'
import { removeCustomComponents } from 'markstream-react'
import { apply } from '../src/client/index.ts'
import { BetterAssistantNodeView } from '../src/client/renderer.tsx'

type Props = ComponentProps<typeof BetterAssistantNodeView>
function closedProps(extra: Record<string, unknown> = {}): Props {
  return {
    node: {
      data: { blocks: [{ kind: 'text', text: 'Finished reply' }], status: 'settled', finalNode: { seq: 42 } },
      location: { kind: 'step', turn: { status: 'closed' } },
    },
    useTurnData: () => ({ closing: { finalNode: { seq: 42 } } }),
    openFile: vi.fn(), t: (key: string) => key,
    ...extra,
  } as unknown as Props
}

beforeEach(() => {
  apply({ effect: (setup: () => unknown) => setup(), slots: { inject: () => () => {} } } as never)
})
afterEach(() => { cleanup(); removeCustomComponents('dsh-better-markdown') })

it('renders a closed turn when fileMentions and the optional injection are absent', () => {
  const view = render(<BetterAssistantNodeView {...closedProps()} />)
  expect(view.container.querySelector('.dsh-better-markdown__root')).not.toBeNull()
  expect(screen.getByText('Finished reply')).toBeTruthy()
})

it('binds the entry injection to the session and resolves the optional service at call time', () => {
  type Injection = { closingFileMentions: NonNullable<Props['closingFileMentions']> }
  let options: { inject: (id: string) => Injection, children: Record<string, unknown>, priority: number } | undefined
  const service = { forClosing: vi.fn(() => undefined) }
  const get = vi.fn<() => unknown>(() => service)
  const ctx = {
    get,
    effect: (effect: () => unknown) => effect(),
    slots: {
      inject: (_name: string, setup: () => unknown) => setup(),
      register(this: unknown, registration: NonNullable<typeof options>): () => void {
        expect(this).toBe(ctx.slots)
        options = registration
        return () => {}
      },
    },
  }
  apply(ctx as never)
  expect(options?.priority).toBe(-100)
  expect(options?.children).toEqual({
    'conversation.chat.reasoning.body': { kind: 'single', scope: 'session' },
    'conversation.chat.message.images': { kind: 'single', scope: 'session' },
  })
  const injected = options!.inject('session-a')
  const props = closedProps(injected)
  render(<BetterAssistantNodeView {...props} />)
  expect(service.forClosing).toHaveBeenCalledWith(expect.objectContaining({ seq: 42, openFile: props.openFile }), 'session-a')
  get.mockReturnValue(undefined)
  expect(injected.closingFileMentions({ seq: 42 } as never)).toBeUndefined()
})

it('uses the legacy owner reader when the host already supplies it', () => {
  const fileMentions = vi.fn(() => undefined)
  const closingFileMentions = vi.fn(() => undefined)
  render(<BetterAssistantNodeView {...closedProps({ fileMentions, closingFileMentions })} />)
  expect(fileMentions).toHaveBeenCalledTimes(1)
  expect(closingFileMentions).not.toHaveBeenCalled()
})

it('passes injected mentions through to inline file controls', () => {
  const open = vi.fn()
  const closingFileMentions = vi.fn(() => ({ resolve: (code: string) => code === 'output.svg' ? { label: 'Open output', title: 'output.svg', open } : undefined }))
  const props = closedProps({ closingFileMentions })
  const data = { ...props.node.data, blocks: [{ kind: 'text', text: '`output.svg`' }] }
  render(<BetterAssistantNodeView {...{ ...props, node: { ...props.node, data } } as Props} />)
  fireEvent.click(screen.getByRole('button', { name: 'Open output' }))
  expect(open).toHaveBeenCalledTimes(1)
})

it('routes attachments through the declared image child slot', () => {
  const renderSlot = vi.fn(() => <div>Host image viewer</div>)
  const props = closedProps({ renderSlot })
  const attachment = { id: 'synthetic-image' }
  const data = { ...props.node.data, blocks: [{ kind: 'image', attachment }] }
  render(<BetterAssistantNodeView {...{ ...props, node: { ...props.node, data } } as unknown as Props} />)
  expect(renderSlot).toHaveBeenCalledWith('conversation.chat.message.images', expect.objectContaining({ images: [{ attachment }], align: 'start' }))
  expect(screen.getByText('Host image viewer')).toBeTruthy()
})

it('respects response-only groups without duplicating reasoning', () => {
  const props = closedProps({ groupPart: 'response' })
  const data = { ...props.node.data, blocks: [{ kind: 'reasoning', text: 'Hidden reasoning' }, { kind: 'text', text: 'Response only' }] }
  const view = render(<BetterAssistantNodeView {...{ ...props, node: { ...props.node, data } } as Props} />)
  expect(view.container.querySelector('.dsh-better-markdown__reasoning')).toBeNull()
  expect(screen.getByText('Response only')).toBeTruthy()
})
