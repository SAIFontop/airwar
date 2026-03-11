type NUIHandler = (data: any) => void

const listeners: Record<string, NUIHandler[]> = {}

export function onNUI(type: string, handler: NUIHandler) {
    if (!listeners[type]) listeners[type] = []
    listeners[type].push(handler)
}

export function offNUI(type: string, handler: NUIHandler) {
    if (!listeners[type]) return
    listeners[type] = listeners[type].filter((h) => h !== handler)
}

export async function fetchNUI(event: string, data?: any): Promise<any> {
    const resourceName = (window as any).GetParentResourceName?.() || 'aw-core'
    const resp = await fetch(`https://${resourceName}/${event}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data ?? {}),
    })
    return resp.json()
}

window.addEventListener('message', (event) => {
    const { type, data } = event.data || {}
    if (!type) return
    const handlers = listeners[type]
    if (handlers) {
        handlers.forEach((h) => h(data))
    }
})

export const isEnvBrowser = !(window as any).invokeNative
