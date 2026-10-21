import type { DayScores } from '../lib/summary'

export type Pillar = 'comida' | 'entreno' | 'sueno'

const C = { x: 170, y: 150 }
const V: Record<Pillar, { x: number; y: number; color: string; label: string; lx: number; ly: number }> = {
  comida: { x: 170, y: 24, color: '#5ee08a', label: 'Comida', lx: 170, ly: 62 },
  entreno: { x: 36, y: 232, color: '#6aa7ff', label: 'Entreno', lx: 36, ly: 262 },
  sueno: { x: 304, y: 232, color: '#b08bff', label: 'Sueño', lx: 304, ly: 262 },
}
const ORDER: Pillar[] = ['comida', 'entreno', 'sueno']
const MIN = 0.06

const point = (p: Pillar, f: number | null) => {
  const k = Math.max(MIN, f ?? 0)
  return { x: C.x + (V[p].x - C.x) * k, y: C.y + (V[p].y - C.y) * k }
}
const pct = (f: number | null) => (f == null ? '—' : `${Math.round(f * 100)}%`)

/** Los tres pilares como vértices de un triángulo: el relleno crece con lo que llevas en cada uno. */
export default function Triangulo({ scores, selected, onSelect }: { scores: DayScores; selected: Pillar; onSelect: (p: Pillar) => void }) {
  const value: Record<Pillar, number | null> = { comida: scores.food, entreno: scores.training, sueno: scores.sleep }
  const pts = ORDER.map((p) => point(p, value[p]))
  return (
    <svg className="tri" viewBox="0 0 340 280" role="img" aria-label="Triángulo de los tres pilares: comida, entreno y sueño">
      <polygon points={ORDER.map((p) => `${V[p].x},${V[p].y}`).join(' ')} fill="none" stroke="#2a2f3a" strokeWidth="1" />
      <polygon points={pts.map((q) => `${q.x},${q.y}`).join(' ')} fill="#5ee08a" fillOpacity="0.2" stroke="#5ee08a" strokeWidth="2" strokeLinejoin="round" />
      {ORDER.map((p) => (
        <g key={p} className={`vertex ${selected === p ? 'sel' : ''}`} onClick={() => onSelect(p)} role="button" aria-label={V[p].label}>
          <circle cx={V[p].x} cy={V[p].y} r="20" fill={value[p] == null ? 'none' : V[p].color} stroke={value[p] == null ? '#2a2f3a' : 'none'} strokeDasharray={value[p] == null ? '3 3' : undefined} />
          <text className="val" x={V[p].x} y={V[p].y + 5} textAnchor="middle" style={value[p] == null ? { fill: '#8d95a5' } : undefined}>{pct(value[p])}</text>
          <text x={V[p].lx} y={V[p].ly} textAnchor="middle">{V[p].label}</text>
        </g>
      ))}
    </svg>
  )
}
