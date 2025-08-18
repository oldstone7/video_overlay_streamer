import React, { useEffect, useMemo, useState } from 'react'
import Player from './components/Player'
import OverlayRender from './components/OverlayRender'
import OverlayEditor from './components/OverlayEditor'
import { createOverlay, deleteOverlay, listOverlays, startStream, stopStream, updateOverlay, getStreamStatus } from './api'

export default function App() {
    const [rtspUrl, setRtspUrl] = useState('')
    const [stream, setStream] = useState(null) // { streamId, hlsUrl }
    const [overlays, setOverlays] = useState([])
    const [activeOverlay, setActiveOverlay] = useState(null)

    const [canvas, setCanvas] = useState({ width: 1280, height: 720 })
    const [elements, setElements] = useState([])
    const [notice, setNotice] = useState({ type: 'info', text: '' })

    // Auto-hide notices after 5s
    useEffect(() => {
        if (!notice.text) return
        const timer = setTimeout(() => setNotice({ type: 'info', text: '' }), 5000)
        return () => clearTimeout(timer)
    }, [notice.text])

    useEffect(() => {
        listOverlays().then(setOverlays).catch(() => {})
    }, [])

    const onStart = async () => {
        if (!rtspUrl) return alert('Enter RTSP URL')
        try {
            setNotice({ type: 'info', text: 'Video is loading, please wait…' })
            const res = await startStream(rtspUrl)
            // Poll backend until playlist exists to avoid initial 404s
            const timeoutAt = Date.now() + 15000
            let ready = false
            while (Date.now() < timeoutAt) {
                try {
                    const st = await getStreamStatus(res.streamId)
                    if (st?.hasIndex) { ready = true; break }
                } catch (_) {}
                await new Promise(r => setTimeout(r, 500))
            }
            setStream(res)
            if (!ready) {
                console.warn('Playlist not ready yet; player will retry')
            }
        } catch (e) {
            setNotice({ type: 'error', text: 'Something went wrong, check your link.' })
        }
    }

    const onStop = async () => {
        if (!stream) return
        try {
            await stopStream(stream.streamId)
        } catch (e) {
            // ignore
        }
        setStream(null)
    }

    const saveOverlay = async () => {
        const name = prompt('Name this overlay preset:')
        if (!name) return
        const doc = { name, elements, canvas, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        try {
            const created = await createOverlay(doc)
            setOverlays([created, ...overlays])
            setActiveOverlay(created)
        } catch (e) {
            alert(e.message)
        }
    }

    const updateActiveOverlay = async () => {
        if (!activeOverlay) return alert('No active overlay selected')
        const doc = { elements, canvas, updatedAt: new Date().toISOString() }
        try {
            const updated = await updateOverlay(activeOverlay.id, doc)
            setOverlays(overlays.map(o => (o.id === activeOverlay.id ? updated : o)))
            setActiveOverlay(updated)
        } catch (e) {
            alert(e.message)
        }
    }

    const deleteActiveOverlay = async () => {
        if (!activeOverlay) return
        if (!confirm(`Delete overlay "${activeOverlay.name}"?`)) return
        try {
            await deleteOverlay(activeOverlay.id)
            setOverlays(overlays.filter(o => o.id !== activeOverlay.id))
            setActiveOverlay(null)
            setElements([])
        } catch (e) {
            alert(e.message)
        }
    }

    const loadOverlay = overlay => {
        setActiveOverlay(overlay)
        setCanvas(overlay.canvas)
        setElements(overlay.elements)
    }

    return (
        <div className="container stack">
            <div className="title">Stream Overlaying</div>

            <div className="panel">
                <div className="row">
                    <input className="input" style={{ flex: 1 }} value={rtspUrl} onChange={e => setRtspUrl(e.target.value)} placeholder="rtsp://..." />
                    <button className="button primary" onClick={onStart}>Start Stream</button>
                    <button className="button" onClick={onStop} disabled={!stream}>Stop</button>
                </div>
                {notice.text ? (
                    <div className={`notice ${notice.type === 'error' ? 'error' : 'info'}`}>{notice.text}</div>
                ) : null}
            </div>

            <div className="panel">
                <h3>Overlay Presets</h3>
                <div className="row between">
                    <div className="row" style={{ gap: 6 }}>
                        <span className="meta">Canvas</span>
                        <input className="input" type="number" value={canvas.width} onChange={e => setCanvas({ ...canvas, width: parseInt(e.target.value || '1280', 10) })} style={{ width: 100 }} />
                        <span>×</span>
                        <input className="input" type="number" value={canvas.height} onChange={e => setCanvas({ ...canvas, height: parseInt(e.target.value || '720', 10) })} style={{ width: 100 }} />
                    </div>
                    <div className="row">
                        <button className="button" onClick={saveOverlay}>Save as New</button>
                        <button className="button" onClick={updateActiveOverlay} disabled={!activeOverlay}>Update Selected</button>
                        <button className="button danger" onClick={deleteActiveOverlay} disabled={!activeOverlay}>Delete Selected</button>
                    </div>
                </div>

                <div className="list" style={{ marginTop: 12 }}>
                    {overlays.length === 0 ? (
                        <div className="list-item"><span className="meta">No overlays saved yet.</span></div>
                    ) : (
                        overlays.map(o => (
                            <div key={o.id} className={`list-item ${activeOverlay?.id === o.id ? 'active' : ''}`}>
                                <div>
                                    <div style={{ fontWeight: 600 }}>{o.name}</div>
                                    <div className="meta">{o.canvas.width}×{o.canvas.height} · {o.elements.length} elements</div>
                                </div>
                                <div className="row">
                                    <button className="button ghost" onClick={() => loadOverlay(o)}>Load</button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            <div className="video-shell" style={{ aspectRatio: `${canvas.width} / ${canvas.height}` }}>
                <div style={{ position: 'absolute', inset: 0 }}>
                    <Player
                        hlsUrl={stream?.hlsUrl}
                        onReady={() => setNotice({ type: 'info', text: '' })}
                        onError={(data) => {
                            // Only show UI error for fatal playback failures, not transient buffer stalls
                            if (data?.fatal) {
                                setNotice({ type: 'error', text: 'Something went wrong, check your link.' })
                            }
                        }}
                    />
                </div>
                <OverlayRender canvas={canvas} elements={elements} />
            </div>

            <div className="panel editor-shell">
                <h3>Overlay Editor</h3>
                <OverlayEditor canvas={canvas} elements={elements} setElements={setElements} />
            </div>
        </div>
    )
}


