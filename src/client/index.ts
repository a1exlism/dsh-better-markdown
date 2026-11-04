/** Browser half: shadow the built-in assistant renderer at a lower slot priority. */

import type { Context } from '@deepseek-ai/cordis'
import type { TurnTailOwnerProps } from '@deepseek-ai/dsh-client-ui-conversation/client'
import type { MarkdownFileMentions } from '@deepseek-ai/dsh-client-ui-primitives'
import { removeCustomComponents, setCustomComponents } from 'markstream-react'
import 'markstream-react/index.css'
import './styles.css'
import { DshMermaidNode } from './mermaid.tsx'
import {
  BetterAssistantNodeView,
  DshCodeBlockNode,
  DshImageNode,
  DshInlineCodeNode,
  DshLinkNode,
} from './renderer.tsx'

const CUSTOM_COMPONENT_SCOPE = 'dsh-better-markdown'

/** Services required in the browser Cordis tree. */
export const inject = ['slots']

/**
 * Replace the `assistant-step` slot cell while preserving the built-in renderer as a fallback.
 * @param ctx - Browser plugin context.
 */
export function apply(ctx: Context): void {
  ctx.effect(() => {
    setCustomComponents(CUSTOM_COMPONENT_SCOPE, {
      mermaid: DshMermaidNode,
      code_block: DshCodeBlockNode,
      image: DshImageNode,
      inline_code: DshInlineCodeNode,
      link: DshLinkNode,
    })
    return () => { removeCustomComponents(CUSTOM_COMPONENT_SCOPE) }
  }, 'dsh-better-markdown: markstream component policy')

  ctx.slots.inject('conversation.chat.node', () => {
    const options = {
      name: 'conversation.chat.node',
      key: 'assistant-step',
      priority: -100,
      locale: 'conversation',
      children: {
        'conversation.chat.reasoning.body': { kind: 'single', scope: 'session' },
        'conversation.chat.message.images': { kind: 'single', scope: 'session' },
      },
      inject: (sessionId: string) => ({
        closingFileMentions: (owner: TurnTailOwnerProps) => {
          const service = ctx.get('chatFileMentions') as {
            forClosing(owner: TurnTailOwnerProps, sessionId: string): MarkdownFileMentions | undefined
          } | undefined
          return service?.forClosing(owner, sessionId)
        },
      }),
    } as const
    const register = ctx.slots.register as unknown as (
      registration: typeof options, component: typeof BetterAssistantNodeView,
    ) => () => void
    return register.call(ctx.slots, options, BetterAssistantNodeView)
  })
}
