import React from 'react'
import { Rnd } from 'react-rnd'

export default function OverlayEditor({ canvas, elements, setElements }) {
    const addText = () => {
        const id = `el-${crypto.randomUUID().slice(0, 8)}`
        setElements([
            ...elements,
            {
                id,
                type: 'text',
                text: 'Sample Text',
                imageUrl: null,
                x: 50,
                y: 50,
                width: 200,
                height: 60,
                color: '#ffffff',
                fontSize: 24,
                opacity: 1
            }
        ])
    }

    const addImage = () => {
        const url = prompt('Enter image URL (PNG with transparency recommended):')
        if (!url) return
        const id = `el-${crypto.randomUUID().slice(0, 8)}`
        setElements([
            ...elements,
            {
                id,
                type: 'image',
                text: null,
                imageUrl: url,
                x: 100,
                y: 100,
                width: 200,
                height: 100,
                color: '#ffffff',
                fontSize: 24,
                opacity: 1
            }
        ])
    }

    const updateElement = (id, partial) => {
        setElements(elements.map(el => (el.id === id ? { ...el, ...partial } : el)))
    }

    const removeElement = id => {
        setElements(elements.filter(el => el.id !== id))
    }

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div className="row" style={{ gap: 8 }}>
                <button className="button primary" onClick={addText}>Add Text</button>
                <button className="button" onClick={addImage}>Add Logo</button>
            </div>
            <div
                style={{
                    position: 'relative',
                    width: canvas.width,
                    height: canvas.height,
                    border: '1px solid #444',
                    background: 'linear-gradient(45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.05) 25%, transparent 25%), linear-gradient(45deg, transparent 75%, rgba(255,255,255,0.05) 75%), linear-gradient(-45deg, transparent 75%, rgba(255,255,255,0.05) 75%)',
                    backgroundSize: '20px 20px',
                    backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
                }}
            >
                {elements.map(el => (
                    <Rnd
                        key={el.id}
                        size={{ width: el.width, height: el.height }}
                        position={{ x: el.x, y: el.y }}
                        bounds="parent"
                        cancel=".no-drag"
                        onDragStop={(e, d) => updateElement(el.id, { x: d.x, y: d.y })}
                        onResizeStop={(e, direction, ref, delta, position) => {
                            updateElement(el.id, {
                                width: parseInt(ref.style.width, 10),
                                height: parseInt(ref.style.height, 10),
                                x: position.x,
                                y: position.y
                            })
                        }}
                    >
                        <div style={{ width: '100%', height: '100%', position: 'relative', pointerEvents: 'none' }}>
                            {el.type === 'text' ? (
                                <div
                                    contentEditable
                                    suppressContentEditableWarning
                                    onInput={e => updateElement(el.id, { text: e.currentTarget.textContent || '' })}
                                    style={{
                                        width: '100%',
                                        height: '100%',
                                        color: el.color,
                                        fontSize: el.fontSize,
                                        opacity: el.opacity,
                                        fontFamily: 'Arial, sans-serif',
                                        outline: 'none',
                                        pointerEvents: 'auto',
                                        border: '1px solid rgba(0,0,0,0.6)',
                                        background: 'rgba(255,255,255,0.04)',
                                        cursor: 'move'
                                    }}
                                >
                                    {el.text}
                                </div>
                            ) : (
                                <img
                                    src={el.imageUrl}
                                    alt="overlay"
                                    draggable={false}
                                    onDragStart={e => e.preventDefault()}
                                    style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: el.opacity, pointerEvents: 'auto', userSelect: 'none', cursor: 'move' }}
                                />
                            )}
                            <div className="no-drag" style={{ position: 'absolute', right: 0, top: -28, display: 'flex', gap: 4, pointerEvents: 'auto' }}>
                                <input type="color" value={el.color} onChange={e => updateElement(el.id, { color: e.target.value })} title="Color" style={{ cursor: 'pointer' }} onMouseDown={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} />
                                <input type="number" min={8} max={128} value={el.fontSize} onChange={e => updateElement(el.id, { fontSize: parseInt(e.target.value || '24', 10) })} style={{ width: 60 }} title="Font size" onMouseDown={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} />
                                <input type="range" min={0} max={1} step={0.05} value={el.opacity} onChange={e => updateElement(el.id, { opacity: parseFloat(e.target.value) })} title="Opacity" style={{ cursor: 'ew-resize' }} onMouseDown={e => e.stopPropagation()} onMouseUp={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()} />
                                <button onClick={() => removeElement(el.id)} style={{ pointerEvents: 'auto' }} onMouseDown={e => e.stopPropagation()} onPointerDown={e => e.stopPropagation()}>✕</button>
                            </div>
                        </div>
                    </Rnd>
                ))}
            </div>
        </div>
    )
}


