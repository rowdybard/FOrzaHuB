import { useEffect, useRef } from 'react'

export default function ParallaxBackground() {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const isMobile = window.matchMedia('(max-width: 768px)').matches
    const speed = isMobile ? 0.15 : 0.3

    let raf = null
    let ticking = false

    const update = () => {
      const y = window.scrollY * speed
      el.style.transform = `translate3d(0, ${-y}px, 0)`
      ticking = false
    }

    const onScroll = () => {
      if (!ticking) {
        raf = requestAnimationFrame(update)
        ticking = true
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true })
    update()

    return () => {
      window.removeEventListener('scroll', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 will-change-transform"
      style={{
        height: '130vh',
        backgroundImage: 'url(/background.png)',
        backgroundSize: '140%',
        backgroundPosition: 'center 20%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Bottom fade into site background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to bottom, transparent 40%, rgba(10,11,13,0.7) 70%, #0a0b0d 90%)',
        }}
      />
      {/* Top vignette so navbar is readable */}
      <div
        className="absolute inset-x-0 top-0 h-32"
        style={{
          background: 'linear-gradient(to bottom, rgba(10,11,13,0.6), transparent)',
        }}
      />
    </div>
  )
}
