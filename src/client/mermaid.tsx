import { useEffect, useRef, useState } from 'react'
import type { CodeBlockNode } from 'stream-markdown-parser'

let queue: Promise<unknown> = Promise.resolve()
let renderId = 0

export function DshMermaidNode({ node, isDark = false }: { node: CodeBlockNode, isDark?: boolean }) {
  const target = useRef<HTMLDivElement>(null)
  const [result, setResult] = useState<{ code: string, dark: boolean, url?: string, error?: string }>()
  const [source, setSource] = useState(false)
  const dark = isDark
  const streaming = Boolean(node.loading)
  useEffect(() => {
    if (streaming) return
    let cancelled = false
    const container = target.current
    if (!container) return
    const job = async () => {
      if (cancelled) return
      try {
        if (node.code.length > 50_000) throw new Error('Diagram exceeds 50,000 characters')
        const { default: mermaid } = await import('mermaid')
        if (cancelled) return
        mermaid.initialize({
          startOnLoad: false, securityLevel: 'strict', suppressErrorRendering: true,
          theme: dark ? 'dark' : 'default', htmlLabels: false,
          flowchart: { htmlLabels: false }, maxEdges: 300, maxTextSize: 50_000,
          secure: ['securityLevel', 'startOnLoad', 'suppressErrorRendering', 'htmlLabels', 'flowchart', 'maxEdges', 'maxTextSize'],
        })
        await mermaid.parse(node.code)
        const diagram = await mermaid.mermaidAPI.getDiagramFromText(node.code)
        const db = diagram.db as { getData?: () => { nodes?: Array<{ img?: string }> } }
        const data = db.getData?.()
        if (data?.nodes?.some(n => n.img)) throw new Error('Mermaid image nodes are disabled; use an SVG fence for embedded artwork')
        if (cancelled) return
        const { svg } = await mermaid.render(`dsh-diagram-${++renderId}`, node.code, container)
        if (!cancelled) setResult({ code: node.code, dark, url: `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}` })
      } catch (error) {
        if (!cancelled) setResult({ code: node.code, dark, error: error instanceof Error ? error.message : String(error) })
      } finally {
        container.replaceChildren()
      }
    }
    queue = queue.then(job, job)
    return () => { cancelled = true }
  }, [node.code, dark, streaming])
  const current = result && result.code === node.code && result.dark === dark && !streaming ? result : undefined
  return (
    <div data-dsh-mermaid="" className="dsh-better-markdown__diagram">
      <div className="dsh-better-markdown__diagram-actions">
        <span>Mermaid</span>
        <button type="button" aria-pressed={source} onClick={() => setSource(value => !value)}>Source</button>
      </div>
      {current?.url && !source ? <img className="dsh-better-markdown__svg" src={current.url} alt="Mermaid diagram" /> : <pre>{node.code}</pre>}
      {current?.error && <div role="status">{current.error}</div>}
      <div ref={target} aria-hidden="true" style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', width: 1000, overflow: 'hidden' }} />
    </div>
  )
}
