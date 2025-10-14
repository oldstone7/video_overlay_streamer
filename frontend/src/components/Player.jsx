import React, { useEffect, useRef, useState } from 'react'
import Hls from 'hls.js'

export default function Player({ hlsUrl, onReady, onError }) {
    const videoRef = useRef(null)
    const hlsRef = useRef(null)
    const [volume, setVolume] = useState(1)
    const [errorMessage, setErrorMessage] = useState('')

    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        // Prepare video element for autoplay per browser policies
        video.muted = true
        video.autoplay = true
        video.playsInline = true

        if (!hlsUrl) {
            if (hlsRef.current) {
                hlsRef.current.destroy()
                hlsRef.current = null
            }
            video.removeAttribute('src')
            video.load()
            setErrorMessage('')
            return
        }

        if (Hls.isSupported()) {
            const hls = new Hls({
                lowLatencyMode: false,
                backBufferLength: 30,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                liveSyncDuration: 6,
                liveMaxLatencyDuration: 12,
                maxFragLookUpTolerance: 0.2,
                debug: true,
            })
            hlsRef.current = hls

            console.log('[hls.js] loadSource', hlsUrl)
            hls.loadSource(hlsUrl)
            hls.attachMedia(video)

            hls.on(Hls.Events.MEDIA_ATTACHED, () => {
                console.log('[hls.js] media attached')
            })

            hls.on(Hls.Events.MANIFEST_PARSED, (evt, data) => {
                console.log('[hls.js] manifest parsed', data)
                // Attempt autoplay
                video.play().catch(err => {
                    console.warn('[hls.js] autoplay failed, waiting for user gesture', err)
                })
                try { onReady && onReady() } catch {}
            })

            hls.on(Hls.Events.LEVEL_LOADED, (evt, data) => {
                console.log('[hls.js] level loaded: fragments', data.details?.fragments?.length ?? 0)
            })

            hls.on(Hls.Events.ERROR, (evt, data) => {
                console.error('[hls.js error]', data)
                setErrorMessage(data?.details || data?.type || 'Playback error')
                try { onError && onError(data) } catch {}
                if (data?.fatal) {
                    switch (data.type) {
                        case Hls.ErrorTypes.NETWORK_ERROR:
                            // Retry manifest explicitly if it failed
                            if (data.details === Hls.ErrorDetails.MANIFEST_LOAD_ERROR || data.details === Hls.ErrorDetails.MANIFEST_LOAD_TIMEOUT) {
                                setTimeout(() => {
                                    console.warn('[hls.js] retrying manifest load')
                                    try { hls.loadSource(hlsUrl) } catch {}
                                    try { hls.startLoad() } catch {}
                                }, 800)
                            } else {
                                hls.startLoad()
                            }
                            break
                        case Hls.ErrorTypes.MEDIA_ERROR:
                            hls.recoverMediaError()
                            break
                        default:
                            hls.destroy()
                            hlsRef.current = null
                            break
                    }
                }
            })
        } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = hlsUrl
            video.play().catch(() => {})
        } else {
            const msg = 'HLS is not supported in this browser'
            console.error(msg)
            setErrorMessage(msg)
        }

        return () => {
            if (hlsRef.current) {
                hlsRef.current.destroy()
                hlsRef.current = null
            }
        }
    }, [hlsUrl])

    // If the browser somehow fullscreened the <video> (keyboard/context menu), move fullscreen to the parent container
    useEffect(() => {
        const video = videoRef.current
        if (!video) return

        const handler = async () => {
            const fsEl = document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement
            if (fsEl === video) {
                // try to switch fullscreen to the nearest .video-shell
                const container = video.closest('.video-shell')
                if (container) {
                    try {
                        // exit current fullscreen (the video) then request fullscreen on container
                        if (document.exitFullscreen) await document.exitFullscreen()
                        else if (document.webkitExitFullscreen) await document.webkitExitFullscreen()
                        else if (document.mozCancelFullScreen) await document.mozCancelFullScreen()
                        else if (document.msExitFullscreen) await document.msExitFullscreen()
                    } catch (e) {
                        // ignore
                    }
                    try {
                        if (container.requestFullscreen) await container.requestFullscreen()
                        else if (container.webkitRequestFullscreen) await container.webkitRequestFullscreen()
                        else if (container.mozRequestFullScreen) await container.mozRequestFullScreen()
                        else if (container.msRequestFullscreen) await container.msRequestFullscreen()
                    } catch (e) {
                        // ignore
                    }
                }
            }
        }

        document.addEventListener('fullscreenchange', handler)
        document.addEventListener('webkitfullscreenchange', handler)
        document.addEventListener('mozfullscreenchange', handler)
        document.addEventListener('MSFullscreenChange', handler)
        return () => {
            document.removeEventListener('fullscreenchange', handler)
            document.removeEventListener('webkitfullscreenchange', handler)
            document.removeEventListener('mozfullscreenchange', handler)
            document.removeEventListener('MSFullscreenChange', handler)
        }
    }, [])

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.volume = volume
        }
    }, [volume])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, height: '100%' }}>
            {/* Hide the browser's native fullscreen control so we can fullscreen the parent container (keeps overlays visible) */}
            <video ref={videoRef} controlsList="nofullscreen" controls autoPlay muted playsInline style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#000' }} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <label>Volume</label>
                <input type="range" min={0} max={1} step={0.01} value={volume} onChange={e => setVolume(parseFloat(e.target.value))} />
            </div>
        </div>
    )
}


