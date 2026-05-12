import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Components } from 'react-markdown'

interface MarkdownContentProps {
  content: string
  className?: string
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="text-xl font-bold text-text-primary mt-6 mb-3 first:mt-0 leading-tight">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="text-lg font-semibold text-text-primary mt-5 mb-2 first:mt-0 leading-snug">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="text-base font-semibold text-text-primary mt-4 mb-2 first:mt-0 leading-snug">
      {children}
    </h3>
  ),
  h4: ({ children }) => (
    <h4 className="text-sm font-semibold text-text-primary mt-3 mb-1 first:mt-0">
      {children}
    </h4>
  ),
  p: ({ children }) => (
    <p className="text-sm text-text-secondary leading-relaxed mb-3 last:mb-0">
      {children}
    </p>
  ),
  strong: ({ children }) => (
    <strong className="font-semibold text-text-primary">{children}</strong>
  ),
  em: ({ children }) => (
    <em className="italic text-text-secondary">{children}</em>
  ),
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-accent underline underline-offset-2 hover:text-accent-hover transition-colors"
    >
      {children}
    </a>
  ),
  ul: ({ children }) => (
    <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1">
      {children}
    </ul>
  ),
  ol: ({ children }) => (
    <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1">
      {children}
    </ol>
  ),
  li: ({ children }) => (
    <li className="text-sm text-text-secondary leading-relaxed">
      {children}
    </li>
  ),
  blockquote: ({ children }) => (
    <blockquote className="border-l-3 border-accent pl-4 my-3 text-text-muted italic">
      {children}
    </blockquote>
  ),
  code: ({ className, children }) => {
    const isBlock = className?.includes('language-')
    if (isBlock) {
      return (
        <code className="block text-xs text-text-secondary">
          {children}
        </code>
      )
    }
    return (
      <code className="text-[0.85em] bg-bg-overlay text-pop-ink px-1.5 py-0.5 rounded">
        {children}
      </code>
    )
  },
  pre: ({ children }) => (
    <pre className="bg-bg-elevated border border-border rounded-lg p-3 my-3 overflow-x-auto max-w-full">
      {children}
    </pre>
  ),
  hr: () => (
    <hr className="border-t border-border my-4" />
  ),
  table: ({ children }) => (
    <div className="overflow-x-auto my-3">
      <table className="w-full text-sm border-collapse">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => (
    <thead className="border-b border-border-emphasis">
      {children}
    </thead>
  ),
  th: ({ children }) => (
    <th className="text-left text-xs font-semibold text-text-primary px-3 py-2 bg-bg-elevated">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="text-sm text-text-secondary px-3 py-2 border-b border-border">
      {children}
    </td>
  ),
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content) return null

  return (
    <div className={className} style={{ overflowWrap: 'anywhere', wordBreak: 'break-word' }}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {content}
      </ReactMarkdown>
    </div>
  )
}
