const RESOURCE_NAME = 'aw-hud'

export async function nuiAction(action: string, data?: Record<string, any>) {
    try {
        const resp = await fetch(`https://${RESOURCE_NAME}/uiAction`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, data }),
        })
        return await resp.json()
    } catch {
        return { ok: false }
    }
}

export async function nuiCallback(callbackName: string, data?: Record<string, any>) {
    try {
        const resp = await fetch(`https://${RESOURCE_NAME}/${callbackName}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data || {}),
        })
        return await resp.json()
    } catch {
        return { ok: false }
    }
}
