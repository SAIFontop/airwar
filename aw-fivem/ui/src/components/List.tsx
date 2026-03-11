interface ListItem {
  id: string
  label: string
  description?: string
  right?: string
}

interface ListProps {
  items: ListItem[]
  onSelect?: (id: string) => void
  className?: string
}

export default function List({ items, onSelect, className = '' }: ListProps) {
  return (
    <div className={`divide-y divide-aw-border/50 ${className}`}>
      {items.map((item) => (
        <div
          key={item.id}
          onClick={() => onSelect?.(item.id)}
          className={`px-4 py-3 flex items-center justify-between ${onSelect ? 'hover:bg-white/5 cursor-pointer' : ''}`}
        >
          <div>
            <p className="text-sm text-aw-text">{item.label}</p>
            {item.description && <p className="text-xs text-aw-muted">{item.description}</p>}
          </div>
          {item.right && <span className="text-xs text-aw-muted">{item.right}</span>}
        </div>
      ))}
    </div>
  )
}
