import React, { useEffect, useRef, useState } from 'react'

export default function OverlayRender({ canvas, elements }) {
    const containerRef = useRef(null)
    const [size, setSize] = useState({ width: canvas.width, height: canvas.height })

    useEffect(() => {
        const el = containerRef.current
        if (!el) return
        const ro = new ResizeObserver(entries => {
            for (const entry of entries) {
                const cr = entry.contentRect
                setSize({ width: cr.width, height: cr.height })
            }
        })
        ro.observe(el)
        return () => ro.disconnect()
    }, [])

    const scaleX = size.width / canvas.width
    const scaleY = size.height / canvas.height

    return (
        <div ref={containerRef} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {elements.map(el => {
                const left = el.x * scaleX
                const top = el.y * scaleY
                const width = el.width * scaleX
                const height = el.height * scaleY
                const fontSize = (el.fontSize || 24) * scaleY
                const style = {
                    position: 'absolute',
                    left,
                    top,
                    width,
                    height,
                    color: el.color || '#fff',
                    opacity: el.opacity == null ? 1 : el.opacity,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize,
                    fontFamily: 'Arial, sans-serif',
                    textShadow: '0 1px 2px rgba(0,0,0,0.6)'
                }
                return (
                    <div key={el.id} style={style}>
                        {el.type === 'text' ? (
                            <div style={{ whiteSpace: 'pre-wrap', textAlign: 'center' }}>{el.text}</div>
                        ) : (
                            <img src={el.imageUrl} alt="overlay" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        )}
                    </div>
                )
            })}
        </div>
    )
}


