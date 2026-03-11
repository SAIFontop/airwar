import { HTMLAttributes } from 'react'

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  title?: string
  padding?: boolean
}

export default function Card({ title, padding = true, className = '', children, ...props }: CardProps) {
  return (
    <div className={`bg-aw-surface border border-aw-border rounded-xl overflow-hidden ${className}`} {...props}>
      {title && (
        <div className="px-4 py-3 border-b border-aw-border">
          <h3 className="text-sm font-semibold text-aw-text">{title}</h3>
        </div>
      )}
      <div className={padding ? 'p-4' : ''}>{children}</div>
    </div>
  )
}
