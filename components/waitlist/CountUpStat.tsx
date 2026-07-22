'use client'

import { useEffect, useRef, useState } from 'react'
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
// value instead of animating.
export function CountUpStat({ from, to, prefix = '', suffix = '', formatThousands = true, duration = 1.4 }: CountUpStatProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches)
  }, [])

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const format = (n: number) => (formatThousands ? Math.round(n).toLocaleString('en-US') : Math.round(n).toString())

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
  }, [from, to, prefix, suffix, formatThousands, duration, reducedMotion])

  return <span ref={ref}>{prefix}{formatThousands ? from.toLocaleString('en-US') : from}{suffix}</span>
}
