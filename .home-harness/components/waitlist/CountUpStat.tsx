'use client'

import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(ScrollTrigger)
}

interface CountUpStatProps {
  from: number
  to: number
  prefix?: string
  suffix?: string
  formatThousands?: boolean
  duration?: number
}

// Numeric anchor: animates from -> to once, triggered when scrolled into
// view. Respects prefers-reduced-motion by snapping straight to the final
// value instead of animating. reduced-motion is read directly inside this
// effect (which only ever runs client-side) rather than via a separate
// state+effect pair -- the rendered JSX never depends on it (the number
// itself is set imperatively on the ref, not through React state), so
// there's no hydration-mismatch reason to defer it further.
export function CountUpStat({ from, to, prefix = '', suffix = '', formatThousands = true, duration = 1.4 }: CountUpStatProps) {
  const ref = useRef<HTMLSpanElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const format = (n: number) => (formatThousands ? Math.round(n).toLocaleString('en-US') : Math.round(n).toString())
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reducedMotion) {
      el.textContent = `${prefix}${format(to)}${suffix}`
      return
    }

    el.textContent = `${prefix}${format(from)}${suffix}`
    const counter = { value: from }
    const tween = gsap.to(counter, {
      value: to,
      duration,
      ease: 'power2.out',
      scrollTrigger: {
        trigger: el,
        start: 'top 80%',
        once: true
      },
      onUpdate: () => {
        el.textContent = `${prefix}${format(counter.value)}${suffix}`
      }
    })

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [from, to, prefix, suffix, formatThousands, duration])

  return <span ref={ref}>{prefix}{formatThousands ? from.toLocaleString('en-US') : from}{suffix}</span>
}
