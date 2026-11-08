import { useRef } from 'react'
import {
  GOAL_X, POST_LO, POST_HI, MAX_OPPONENTS,
  toScreen, fromScreen, clampPoint, inShotTriangle,
} from '../lib/features.js'

const KEY_STEP = 0.5
const round1 = (p) => ({ x: Math.round(p.x * 10) / 10, y: Math.round(p.y * 10) / 10 })

// Banen vises med målet øverst. 1 enhet i SVG = 1 yard, så ringene rundt
// skytteren (2,5 / 5 / 10 yard) viser nøyaktig grensene modellen bruker.
export default function Pitch({ shooter, keeper, opponents, tool, onShooter, onKeeper, onOpponents }) {
  const svgRef = useRef(null)
  const drag = useRef(null)

  const pitchPoint = (e) => {
    const svg = svgRef.current
    const pt = svg.createSVGPoint()
    pt.x = e.clientX
    pt.y = e.clientY
    const p = pt.matrixTransform(svg.getScreenCTM().inverse())
    return round1(clampPoint(fromScreen(p.x, p.y)))
  }

  const moveTo = (kind, index, p) => {
    if (kind === 'shooter') onShooter(p)
    else if (kind === 'keeper') onKeeper(p)
    else onOpponents(opponents.map((o, i) => (i === index ? p : o)))
  }

  const startDrag = (kind, index, e) => {
    e.stopPropagation()
    svgRef.current.setPointerCapture(e.pointerId)
    drag.current = { kind, index }
  }

  const onPointerMove = (e) => {
    if (!drag.current) return
    moveTo(drag.current.kind, drag.current.index, pitchPoint(e))
  }
  const endDrag = () => {
    drag.current = null
  }

  const placeAt = (e) => {
    const p = pitchPoint(e)
    if (tool === 'shooter') {
      onShooter(p)
      startDrag('shooter', 0, e)
    } else if (tool === 'keeper') {
      onKeeper(p)
      startDrag('keeper', 0, e)
    } else if (opponents.length < MAX_OPPONENTS) {
      onOpponents([...opponents, p])
      startDrag('opponent', opponents.length, e)
    }
  }

  const nudge = (kind, index, current) => (e) => {
    const delta = {
      ArrowLeft: [0, -KEY_STEP],
      ArrowRight: [0, KEY_STEP],
      ArrowUp: [KEY_STEP, 0],
      ArrowDown: [-KEY_STEP, 0],
    }[e.key]
    if (!delta) return
    e.preventDefault()
    moveTo(kind, index, round1(clampPoint({ x: current.x + delta[0], y: current.y + delta[1] })))
  }

  const removeOpponent = (index) => onOpponents(opponents.filter((_, i) => i !== index))

  const s = toScreen(shooter)
  const k = toScreen(keeper)
  const stripes = Array.from({ length: 8 }, (_, i) => i)

  return (
    <svg
      ref={svgRef}
      className="pitch"
      viewBox="-4 -6 88 72"
      role="group"
      aria-label="Halv fotballbane sett fra mållinjen. Plasser skytter, keeper og motstandere."
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
    >
      <rect className="pitch-grass" x="-4" y="-6" width="88" height="72" />
      {stripes.map((i) => (
        <rect key={i} className={i % 2 ? 'pitch-stripe' : 'pitch-grass'} x="0" y={i * 7.5} width="80" height="7.5" />
      ))}

      <g className="pitch-lines">
        <rect x="0" y="0" width="80" height="60" />
        <rect x="18" y="0" width="44" height="18" />
        <rect x="30" y="0" width="20" height="6" />
        <path d="M32 18 A10 10 0 0 0 48 18" />
        <path d="M30 60 A10 10 0 0 1 50 60" />
        <circle className="pitch-dot" cx="40" cy="12" r="0.5" />
        <rect className="pitch-goal" x={POST_LO} y="-2.4" width={POST_HI - POST_LO} height="2.4" />
      </g>

      <rect className="pitch-hit" x="-4" y="-6" width="88" height="72" onPointerDown={placeAt} />

      <polygon
        className="pitch-triangle"
        points={`${s.sx},${s.sy} ${POST_LO},0 ${POST_HI},0`}
      />
      <line className="pitch-sight" x1={s.sx} y1={s.sy} x2="40" y2="0" />
      {[2.5, 5, 10].map((r) => (
        <circle key={r} className="pitch-ring" cx={s.sx} cy={s.sy} r={r} />
      ))}

      {opponents.map((o, i) => {
        const p = toScreen(o)
        const inside = inShotTriangle(o, shooter)
        return (
          <g
            key={i}
            className={`marker marker-opponent${inside ? ' is-blocking' : ''}`}
            transform={`translate(${p.sx} ${p.sy})`}
            tabIndex={0}
            role="button"
            aria-label={`Motstander ${i + 1}. Piltaster flytter, Delete fjerner.`}
            onPointerDown={(e) => startDrag('opponent', i, e)}
            onDoubleClick={() => removeOpponent(i)}
            onKeyDown={(e) => {
              if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault()
                removeOpponent(i)
              } else nudge('opponent', i, o)(e)
            }}
          >
            <circle className="marker-hit" r="3" />
            <circle className="marker-body" r="1.5" />
          </g>
        )
      })}

      <g
        className="marker marker-keeper"
        transform={`translate(${k.sx} ${k.sy})`}
        tabIndex={0}
        role="button"
        aria-label="Keeper. Piltaster flytter."
        onPointerDown={(e) => startDrag('keeper', 0, e)}
        onKeyDown={nudge('keeper', 0, keeper)}
      >
        <circle className="marker-hit" r="3.2" />
        <circle className="marker-body" r="1.8" />
        <text className="marker-letter" y="0.7" textAnchor="middle">K</text>
      </g>

      <g
        className="marker marker-shooter"
        transform={`translate(${s.sx} ${s.sy})`}
        tabIndex={0}
        role="button"
        aria-label="Skytter. Piltaster flytter."
        onPointerDown={(e) => startDrag('shooter', 0, e)}
        onKeyDown={nudge('shooter', 0, shooter)}
      >
        <circle className="marker-hit" r="3.2" />
        <circle className="marker-body" r="1.8" />
        <circle className="marker-ball" r="0.6" />
      </g>

      <text className="pitch-caption" x="40" y="64" textAnchor="middle">
        Midtlinjen
      </text>
      <text className="pitch-caption" x="40" y="-3.6" textAnchor="middle">
        Mål
      </text>
    </svg>
  )
}

export { GOAL_X }
