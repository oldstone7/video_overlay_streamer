const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

export async function startStream(rtspUrl) {
    const res = await fetch(`${API_BASE}/api/streams`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rtspUrl })
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to start stream')
    return res.json()
}

export async function stopStream(streamId) {
    const res = await fetch(`${API_BASE}/api/streams/${streamId}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to stop stream')
}

export async function listOverlays() {
    const res = await fetch(`${API_BASE}/api/overlays`)
    if (!res.ok) throw new Error('Failed to load overlays')
    return res.json()
}

export async function getOverlay(id) {
    const res = await fetch(`${API_BASE}/api/overlays/${id}`)
    if (!res.ok) throw new Error('Not found')
    return res.json()
}

export async function createOverlay(doc) {
    const res = await fetch(`${API_BASE}/api/overlays`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to create overlay')
    return res.json()
}

export async function updateOverlay(id, doc) {
    const res = await fetch(`${API_BASE}/api/overlays/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(doc)
    })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to update overlay')
    return res.json()
}

export async function deleteOverlay(id) {
    const res = await fetch(`${API_BASE}/api/overlays/${id}`, { method: 'DELETE' })
    if (!res.ok) throw new Error((await res.json()).error || 'Failed to delete overlay')
}

export async function getStreamStatus(id) {
    const res = await fetch(`${API_BASE}/api/streams/${id}/status`)
    if (!res.ok) throw new Error('Failed to get stream status')
    return res.json()
}


