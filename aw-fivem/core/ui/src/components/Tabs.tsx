import { useState } from 'react'

interface Tab {
    id: string
    label: string
    content: React.ReactNode
}

interface TabsProps {
    tabs: Tab[]
    defaultTab?: string
    className?: string
}

export default function Tabs({ tabs, defaultTab, className = '' }: TabsProps) {
    const [active, setActive] = useState(defaultTab || tabs[0]?.id)

    return (
        <div className={className}>
            <div className="flex border-b border-aw-border">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActive(tab.id)}
                        className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px ${active === tab.id
                                ? 'text-aw-primary border-aw-primary'
                                : 'text-aw-muted border-transparent hover:text-aw-text'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>
            <div className="pt-4">{tabs.find((t) => t.id === active)?.content}</div>
        </div>
    )
}
