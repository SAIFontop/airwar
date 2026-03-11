import { useEffect, useRef } from 'react';

interface Particle {
    x: number; y: number; vx: number; vy: number
    size: number; alpha: number; decay: number; color: string
}

export function ParticleBackground() {
    const canvasRef = useRef<HTMLCanvasElement>(null)

    useEffect(() => {
        const canvas = canvasRef.current
        if (!canvas) return
        const ctx = canvas.getContext('2d')
        if (!ctx) return

        let animId: number
        let particles: Particle[] = []
        const MAX_PARTICLES = 80

        const resize = () => {
            canvas.width = window.innerWidth
            canvas.height = window.innerHeight
        }
        resize()
        window.addEventListener('resize', resize)

        const spawn = (): Particle => ({
            x: Math.random() * canvas.width,
            y: Math.random() * canvas.height,
            vx: (Math.random() - 0.5) * 0.3,
            vy: (Math.random() - 0.5) * 0.3,
            size: Math.random() * 2 + 0.5,
            alpha: Math.random() * 0.5 + 0.1,
            decay: 0.0002 + Math.random() * 0.0005,
            color: Math.random() > 0.7 ? '#f59e0b' : Math.random() > 0.5 ? '#3b82f6' : '#06b6d4',
        })

        for (let i = 0; i < MAX_PARTICLES; i++) particles.push(spawn())

        const draw = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height)

            // Connections
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x
                    const dy = particles[i].y - particles[j].y
                    const dist = Math.sqrt(dx * dx + dy * dy)
                    if (dist < 150) {
                        ctx.beginPath()
                        ctx.strokeStyle = `rgba(245, 158, 11, ${0.05 * (1 - dist / 150)})`
                        ctx.lineWidth = 0.5
                        ctx.moveTo(particles[i].x, particles[i].y)
                        ctx.lineTo(particles[j].x, particles[j].y)
                        ctx.stroke()
                    }
                }
            }

            // Particles
            particles.forEach((p) => {
                p.x += p.vx
                p.y += p.vy

                if (p.x < 0) p.x = canvas.width
                if (p.x > canvas.width) p.x = 0
                if (p.y < 0) p.y = canvas.height
                if (p.y > canvas.height) p.y = 0

                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
                ctx.fillStyle = p.color.replace(')', `, ${p.alpha})`.replace('rgb', 'rgba'))
                ctx.fill()

                // Glow
                const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.size * 4)
                grad.addColorStop(0, p.color.replace(')', `, ${p.alpha * 0.3})`).replace('rgb', 'rgba').replace('#f59e0b', 'rgba(245,158,11').replace('#3b82f6', 'rgba(59,130,246').replace('#06b6d4', 'rgba(6,182,212'))
                grad.addColorStop(1, 'rgba(0,0,0,0)')
                ctx.beginPath()
                ctx.arc(p.x, p.y, p.size * 4, 0, Math.PI * 2)
                ctx.fillStyle = grad
                ctx.fill()
            })

            animId = requestAnimationFrame(draw)
        }

        draw()
        return () => {
            cancelAnimationFrame(animId)
            window.removeEventListener('resize', resize)
        }
    }, [])

    return <canvas ref={canvasRef} className="particle-canvas" />
}
