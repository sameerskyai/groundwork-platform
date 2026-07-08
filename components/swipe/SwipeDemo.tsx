'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'
import { MapPin, ArrowRight } from 'lucide-react'

const THRESHOLD = 80

const PROJECTS = [
  {
    id: 1,
    type: 'Kitchen Remodel',
    desc: 'Full gut renovation — cabinets, countertops, appliances, layout opened into dining room. 1960s galley kitchen.',
    location: 'Bethesda, MD',
    low: 18000,
    high: 22000,
    days: 21,
    accent: '#E8722C',
    bg: 'linear-gradient(145deg, #1a2230 0%, #0e151e 100%)'
  },
  {
    id: 2,
    type: 'HVAC Replacement',
    desc: 'Full system replacement for 2,200 sq ft home. Current unit is 18 years old. Ductwork inspection included.',
    location: 'Arlington, VA',
    low: 7500,
    high: 12000,
    days: 3,
    accent: '#4A9BCC',
    bg: 'linear-gradient(145deg, #131f2e 0%, #0a1520 100%)'
  },
  {
    id: 3,
    type: 'Bathroom Renovation',
    desc: 'Primary bath full reno — walk-in shower, double vanity, heated tile floors, all new fixtures.',
    location: 'Silver Spring, MD',
    low: 14000,
    high: 19000,
    days: 14,
    accent: '#2E8B57',
    bg: 'linear-gradient(145deg, #122018 0%, #0a160f 100%)'
  }
]

function fmt(n: number) {
  return n >= 1000 ? `$${(n / 1000).toFixed(0)}k` : `$${n}`
}

interface SwipeDemoProps {
  compact?: boolean
}

export function SwipeDemo({ compact = false }: SwipeDemoProps) {
  const [index, setIndex] = useState(0)
  const [dragX, setDragX] = useState(0)
  const [dragY, setDragY] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const [exiting, setExiting] = useState<'left' | 'right' | null>(null)
  const startPos = useRef({ x: 0, y: 0 })

  const remaining = PROJECTS.slice(index)

  function swipeOut(dir: 'left' | 'right') {
    setExiting(dir)
    setTimeout(() => {
      setIndex(i => i + 1)
      setDragX(0)
      setDragY(0)
      setExiting(null)
    }, 280)
  }

  function onDown(clientX: number, clientY: number) {
    startPos.current = { x: clientX, y: clientY }
    setIsDragging(true)
  }

  function onMove(clientX: number, clientY: number) {
    if (!isDragging) return
    setDragX(clientX - startPos.current.x)
    setDragY((clientY - startPos.current.y) * 0.25)
  }

  function onUp() {
    if (!isDragging) return
    setIsDragging(false)
    if (dragX > THRESHOLD) swipeOut('right')
    else if (dragX < -THRESHOLD) swipeOut('left')
    else {
      setDragX(0)
      setDragY(0)
    }
  }

  if (index >= PROJECTS.length) {
    return (
      <div style={{
        minHeight: compact ? 280 : 380,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '32px 24px',
        background: 'rgba(255,255,255,0.03)',
        borderRadius: 20,
        border: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{ fontSize: 40, marginBottom: 16 }}>✓</div>
        <p style={{ color: '#F7F5F1', fontWeight: 700, fontSize: 18, marginBottom: 8 }}>
          That&apos;s how it works.
        </p>
        <p style={{ color: '#6B8090', fontSize: 14, marginBottom: 24, maxWidth: 260, lineHeight: 1.6 }}>
          Create an account to see real projects near you and get your own estimate in 30 seconds.
        </p>
        <Link href="/signup?role=homeowner">
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 8,
            padding: '12px 24px', borderRadius: 100,
            background: '#E8722C', color: '#fff', fontWeight: 700, fontSize: 14,
            border: 'none', cursor: 'pointer'
          }}>
            Get my free estimate <ArrowRight style={{ width: 16, height: 16 }} />
          </button>
        </Link>
      </div>
    )
  }

  const project = remaining[0]
  const rotation = dragX * 0.05
  const absX = Math.abs(dragX)
  const labelOpacity = Math.min(1, absX / 60)
  const label = dragX > 30 ? 'INTERESTED' : dragX < -30 ? 'PASS' : null
  const labelColor = dragX > 0 ? '#2E8B57' : '#E8722C'

  return (
    <div style={{
      position: 'relative',
      width: '100%',
      maxWidth: compact ? 320 : 380,
      minHeight: compact ? 300 : 400,
      margin: '0 auto',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {/* Background stacked cards */}
      {remaining.slice(1, 3).map((p, i) => (
        <div key={p.id} style={{
          position: 'absolute',
          width: '100%',
          height: compact ? 280 : 360,
          borderRadius: 20,
          background: p.bg,
          border: '1px solid rgba(255,255,255,0.05)',
          transform: `scale(${1 - (i + 1) * 0.05}) translateY(${(i + 1) * 16}px)`,
          zIndex: 2 - i,
          opacity: 0.6 - i * 0.25,
          pointerEvents: 'none'
        }} />
      ))}

      {/* Active card */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          borderRadius: 20,
          background: project.bg,
          border: '1px solid rgba(255,255,255,0.08)',
          padding: compact ? '20px' : '26px',
          zIndex: 10,
          transform: exiting
            ? `translateX(${exiting === 'right' ? '140%' : '-140%'}) rotate(${exiting === 'right' ? 22 : -22}deg)`
            : `translateX(${dragX}px) translateY(${dragY}px) rotate(${rotation}deg)`,
          transition: exiting
            ? 'transform 0.28s ease-out'
            : isDragging
            ? 'none'
            : 'transform 0.38s cubic-bezier(0.34, 1.56, 0.64, 1)',
          cursor: isDragging ? 'grabbing' : 'grab',
          userSelect: 'none',
          touchAction: 'none',
          willChange: 'transform'
        }}
        onPointerDown={e => {
          (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
          onDown(e.clientX, e.clientY)
        }}
        onPointerMove={e => onMove(e.clientX, e.clientY)}
        onPointerUp={() => onUp()}
        onPointerCancel={() => onUp()}
      >
        {/* Swipe direction label */}
        {label && (
          <div style={{
            position: 'absolute',
            top: 20,
            ...(label === 'INTERESTED' ? { left: 20 } : { right: 20 }),
            border: `2px solid ${labelColor}`,
            color: labelColor,
            padding: '3px 10px',
            borderRadius: 6,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.1em',
            transform: label === 'INTERESTED' ? 'rotate(-12deg)' : 'rotate(12deg)',
            opacity: labelOpacity,
            pointerEvents: 'none'
          }}>
            {label}
          </div>
        )}

        {/* Project type */}
        <div style={{
          color: project.accent,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          marginBottom: 10
        }}>
          {project.type}
        </div>

        {/* Description */}
        <p style={{
          color: '#C0CDD8',
          fontSize: compact ? 13 : 14,
          lineHeight: 1.65,
          marginBottom: 16,
          minHeight: compact ? 60 : 80
        }}>
          {project.desc}
        </p>

        {/* Location */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 5,
          color: '#6B8090', fontSize: 13, marginBottom: 18
        }}>
          <MapPin style={{ width: 13, height: 13 }} /> {project.location}
        </div>

        {/* Estimate + duration */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          borderRadius: 12,
          padding: '14px 16px',
          display: 'flex',
          gap: 24,
          marginBottom: 16
        }}>
          <div>
            <div style={{
              color: '#6B8090', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4
            }}>
              AI Estimate
            </div>
            <div style={{
              color: '#F7F5F1',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: compact ? 17 : 20,
              fontWeight: 700,
              letterSpacing: '-0.02em'
            }}>
              {fmt(project.low)}–{fmt(project.high)}
            </div>
          </div>
          <div>
            <div style={{
              color: '#6B8090', fontSize: 9, fontWeight: 700,
              letterSpacing: '0.1em', textTransform: 'uppercase', marginBottom: 4
            }}>
              Typical Timeline
            </div>
            <div style={{
              color: '#F7F5F1',
              fontFamily: "'Courier New', Courier, monospace",
              fontSize: compact ? 17 : 20,
              fontWeight: 700
            }}>
              {project.days} day{project.days > 1 ? 's' : ''}
            </div>
          </div>
        </div>

        {/* Action buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            style={{
              flex: 1, padding: '10px 0', borderRadius: 100,
              background: 'rgba(232, 114, 44, 0.12)',
              color: '#E8722C',
              border: '1px solid rgba(232, 114, 44, 0.25)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); swipeOut('left') }}
          >
            ← Pass
          </button>
          <button
            style={{
              flex: 1, padding: '10px 0', borderRadius: 100,
              background: 'rgba(46, 139, 87, 0.12)',
              color: '#2E8B57',
              border: '1px solid rgba(46, 139, 87, 0.25)',
              fontSize: 13, fontWeight: 700, cursor: 'pointer'
            }}
            onPointerDown={e => e.stopPropagation()}
            onClick={e => { e.stopPropagation(); swipeOut('right') }}
          >
            Interested →
          </button>
        </div>

        <div style={{
          textAlign: 'center',
          color: '#3A5060',
          fontSize: 11,
          marginTop: 10
        }}>
          {index + 1} / {PROJECTS.length} · drag left or right
        </div>
      </div>
    </div>
  )
}
