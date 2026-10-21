import { useMemo, useState } from 'react'
import { toISODate } from '../lib/date'
import { dayScores, isTrainingDay, lastDays, WEEKLY_TRAINING_REF } from '../lib/summary'
import type { VerticeData } from '../lib/useVerticeData'
import Triangulo, { type Pillar } from './Triangulo'

const fmt = (n: number, d = 0) => n.toFixed(d).replace('.', ',')
const LETTERS = ['D', 'L', 'M', 'X', 'J', 'V', 'S']
const dayName = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric' })

function Detail({ pillar, date, today, data }: { pillar: Pillar; date: string; today: string; data: VerticeData }) {
  const n = data.nutrition.find((x) => x.date === date)
  const t = data.training.find((x) => x.date === date)
  const c = data.caffeine.find((x) => x.date === date)
  const sc = dayScores(date, data.nutrition, data.training, data.targets)
  const kcalT = data.targets?.kcal_target ?? 0
  const protT = data.targets?.protein_target ?? 0
  if (pillar === 'comida') {
    return (
      <div className="detail">
        <strong>Comida</strong> · {n && n.kcal > 0 ? <>{fmt(n.kcal)} de {fmt(kcalT)} kcal · proteína {fmt(n.protein)} de {fmt(protT)} g · carbohidratos {fmt(n.carbs)} g</> : 'sin comidas registradas.'}
        {n && n.kcal > 0 && date === today && <><br /><span className="muted">Te faltan {fmt(Math.max(0, protT - n.protein))} g de proteína y te quedan {fmt(Math.max(0, kcalT - n.kcal))} kcal.</span></>}
        {c && c.caffeine_mg > 0 && <><br /><span className={c.caffeine_mg > 400 ? 'warn-text' : 'muted'}>Cafeína: {fmt(c.caffeine_mg)} mg (límite orientativo 400).</span></>}
        <br /><a className="applink" href="/nutricion/">Abrir Nutrición</a>
      </div>
    )
  }
  if (pillar === 'entreno') {
    return (
      <div className="detail">
        <strong>Entreno</strong> · {isTrainingDay(t) ? `${t && t.sessions_done > 0 ? `${t.sessions_done} sesión${t.sessions_done > 1 ? 'es' : ''} de fuerza` : 'sin fuerza'}${t && t.cardio_minutes > 0 ? ` · ${fmt(t.cardio_minutes)} min de cardio` : ''}` : 'sin entreno registrado ese día.'}
        <br /><span className="muted">{sc.trainingDays} día{sc.trainingDays === 1 ? '' : 's'} de entreno en los últimos 7 (el triángulo toma {WEEKLY_TRAINING_REF} como completo).</span>
        <br /><a className="applink" href="/entreno/">Abrir Entreno</a>
      </div>
    )
  }
  return (
    <div className="detail">
      <strong>Sueño</strong> · todavía no se registra. Cuando lo añadamos, aquí saldrá lo que dormiste y se cruzará con la comida y el entreno.
    </div>
  )
}

/** Hoy: el triángulo de los tres pilares, la semana y los datos del cuerpo. Tocar un vértice o un día cambia el detalle. */
export default function Hoy({ data }: { data: VerticeData }) {
  const today = toISODate(new Date())
  const [date, setDate] = useState(today)
  const [pillar, setPillar] = useState<Pillar>('comida')
  const week = useMemo(() => lastDays(today, 7), [today])
  const scores = useMemo(() => dayScores(date, data.nutrition, data.training, data.targets), [date, data])
  const lastWeight = [...data.body].filter((x) => x.kg != null).sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastWaist = [...data.body].filter((x) => x.waist_cm != null).sort((a, b) => b.date.localeCompare(a.date))[0]

  return (
    <div className="screen">
      <div className="row between">
        <h2>{date === today ? 'Hoy' : dayName(date)}</h2>
        <span className="muted">{date === today ? dayName(today) : <button className="link" onClick={() => setDate(today)}>Volver a hoy</button>}</span>
      </div>

      {!data.targets && <p className="muted">No encuentro tus metas. Defínelas en Nutrición, en Ajustes.</p>}
      <Triangulo scores={scores} selected={pillar} onSelect={setPillar} />
      <Detail pillar={pillar} date={date} today={today} data={data} />

      <h3>Semana</h3>
      <div className="week">
        {week.map((d) => {
          const sc = dayScores(d, data.nutrition, data.training, data.targets)
          const t = data.training.find((x) => x.date === d)
          const logged = (data.nutrition.find((x) => x.date === d)?.kcal ?? 0) > 0
          const bg = !logged || sc.food == null ? undefined : sc.food >= 0.85 ? '#5ee08a' : sc.food >= 0.5 ? '#9bbf6a' : '#6b7280'
          return (
            <button key={d} className={d === date ? 'sel' : ''} onClick={() => setDate(d)} aria-label={dayName(d)}>
              <div className="cell" style={bg ? { background: bg } : undefined} />
              {LETTERS[new Date(d + 'T00:00:00').getDay()]}
              <div className="dot" style={{ background: isTrainingDay(t) ? '#6aa7ff' : 'transparent' }} />
            </button>
          )
        })}
      </div>
      <p className="muted">Verde: te acercaste a tus metas de comida · punto azul: entrenaste.</p>

      <section className="card">
        <h3>Cuerpo</h3>
        <p>
          {lastWeight ? `Último peso: ${fmt(Number(lastWeight.kg), 1)} kg (${lastWeight.date})` : 'Sin peso registrado.'}
          {lastWaist ? ` · Cintura: ${fmt(Number(lastWaist.waist_cm), 1)} cm (${lastWaist.date})` : ''}
        </p>
      </section>
    </div>
  )
}
