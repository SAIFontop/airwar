// Professional SVG icons — no emojis
// All icons are inline SVG components for zero dependencies

interface IconProps {
    className?: string
    size?: number
}

const svgBase = (size: number, cls: string) => ({
    width: size,
    height: size,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    className: cls,
})

export function IconJet({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M12 2L8 8H4l-2 4h6l-2 6 2 2 6-6v6l4 2V8l-4-2V2z" />
            <path d="M16 8l4 2" />
        </svg>
    )
}

export function IconFighter({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M12 2v20M8 6l4-4 4 4M6 10h12M4 14h16M8 18h8" />
            <circle cx="12" cy="10" r="1" fill="currentColor" stroke="none" />
        </svg>
    )
}

export function IconBomber({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M4 12h16M12 4v16M8 8l8 8M16 8l-8 8" />
            <rect x="9" y="9" width="6" height="6" rx="1" />
        </svg>
    )
}

export function IconDrone({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
            <circle cx="12" cy="2" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="12" cy="22" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="2" cy="12" r="1.5" fill="currentColor" stroke="none" />
            <circle cx="22" cy="12" r="1.5" fill="currentColor" stroke="none" />
        </svg>
    )
}

export function IconCAS({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M12 2L6 8v4l-4 4h8v4l2 2 2-2v-4h8l-4-4V8l-6-6z" />
        </svg>
    )
}

export function IconStealth({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M12 3L3 13h4l-1 5h12l-1-5h4L12 3z" />
            <path d="M12 3v5" opacity={0.5} />
        </svg>
    )
}

export function IconTarget({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="6" />
            <circle cx="12" cy="12" r="2" />
        </svg>
    )
}

export function IconCrosshair({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <circle cx="12" cy="12" r="8" />
            <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
        </svg>
    )
}

export function IconUsers({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </svg>
    )
}

export function IconSignal({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M2 20h.01M7 20v-4M12 20v-8M17 20V8M22 20V4" />
        </svg>
    )
}

export function IconRadar({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 12l7-7" />
            <circle cx="12" cy="12" r="3" />
            <path d="M12 2a10 10 0 0 1 7.07 2.93" opacity={0.5} />
        </svg>
    )
}

export function IconClock({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
        </svg>
    )
}

export function IconTrophy({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
            <path d="M4 22h16M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20 7 22" />
            <path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20 17 22" />
            <path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
        </svg>
    )
}

export function IconStar({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
        </svg>
    )
}

export function IconChart({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M3 3v18h18" />
            <path d="M18 17V9M13 17V5M8 17v-3" />
        </svg>
    )
}

export function IconMedal({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M7.21 15 2.66 7.14a2 2 0 0 1 .13-2.2L4.4 2.8A2 2 0 0 1 6 2h12a2 2 0 0 1 1.6.8l1.6 2.14a2 2 0 0 1 .14 2.2L16.79 15" />
            <path d="M11 12 5.12 2.2M13 12l5.88-9.8M8 7h8" />
            <circle cx="12" cy="17" r="5" />
            <path d="M12 18v-2h-.5" />
        </svg>
    )
}

export function IconFlame({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </svg>
    )
}

export function IconShield({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
    )
}

export function IconGun({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M2 12h14M16 6v12M22 12h-6M6 8v8M10 9v6" />
            <circle cx="16" cy="12" r="2" />
        </svg>
    )
}

export function IconMissile({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
        </svg>
    )
}

export function IconFlare({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    )
}

export function IconAfterburner({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
        </svg>
    )
}

export function IconScoreboard({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <path d="M3 9h18M3 15h18M9 3v18" />
        </svg>
    )
}

export function IconEject({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M12 5l-8 8h16l-8-8z" />
            <rect x="4" y="17" width="16" height="2" rx="1" />
        </svg>
    )
}

export function IconThrottle({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M12 19V5M5 12l7-7 7 7" />
        </svg>
    )
}

export function IconLightbulb({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M9 18h6M10 22h4" />
            <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
        </svg>
    )
}

export function IconNewspaper({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
            <path d="M18 14h-8M15 18h-5M10 6h8v4h-8V6z" />
        </svg>
    )
}

export function IconGamepad({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M6 12h4M8 10v4M15 13h.01M18 11h.01" />
            <rect x="2" y="6" width="20" height="12" rx="2" />
        </svg>
    )
}

export function IconVolume({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07M19.07 4.93a10 10 0 0 1 0 14.14" />
        </svg>
    )
}

export function IconVolumeMute({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <polygon points="11,5 6,9 2,9 2,15 6,15 11,19" />
            <path d="M23 9l-6 6M17 9l6 6" />
        </svg>
    )
}

export function IconServer({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <rect x="2" y="2" width="20" height="8" rx="2" />
            <rect x="2" y="14" width="20" height="8" rx="2" />
            <path d="M6 6h.01M6 18h.01" />
        </svg>
    )
}

export function IconWifi({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M5 12.55a11 11 0 0 1 14.08 0M1.42 9a16 16 0 0 1 21.16 0M8.53 16.11a6 6 0 0 1 6.95 0M12 20h.01" />
        </svg>
    )
}

export function IconPlay({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <polygon points="5,3 19,12 5,21" fill="currentColor" />
        </svg>
    )
}

export function IconPause({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <rect x="6" y="4" width="4" height="16" fill="currentColor" />
            <rect x="14" y="4" width="4" height="16" fill="currentColor" />
        </svg>
    )
}

export function IconChevronLeft({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M15 18l-6-6 6-6" />
        </svg>
    )
}

export function IconChevronRight({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <path d="M9 18l6-6-6-6" />
        </svg>
    )
}

export function IconDatabase({ className = '', size = 20 }: IconProps) {
    return (
        <svg {...svgBase(size, className)}>
            <ellipse cx="12" cy="5" rx="9" ry="3" />
            <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
            <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
    )
}
