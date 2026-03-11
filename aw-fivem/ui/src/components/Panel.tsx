import { HTMLAttributes } from 'react'

interface PanelProps extends HTMLAttributes<HTMLDivElement> {
  position?: 'left' | 'right' | 'center'
  width?: string
}

export default function Panel({ position = 'center', width = 'w-96', className = '', children, ...props }: PanelProps) {
  const posClass =
    position === 'left' ? 'left-4' : position === 'right' ? 'right-4' : 'left-1/2 -translate-x-1/2'

  return (
    <div
      className={`fixed top-1/2 -translate-y-1/2 ${posClass} ${width} bg-aw-surface/95 border border-aw-border rounded-xl backdrop-blur-md overflow-hidden ${className}`}
      {...props}
    >
      {children}
    </div>
  )
}
