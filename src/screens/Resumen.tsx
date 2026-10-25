import { useMemo, useState } from 'react'
import { toISODate } from '../lib/date'
import { sleepSummary, wakeCounts, bodySummary, caffeineSummary, crossTrainingRest, lastDays, nutritionSummary, trainingSummary, CROSS_MIN_DAYS } from '../lib/summary'
import type { VerticeData } from '../lib/useVerticeData'

const fmt = (n: number, d = 0) => n.toFixed(d).replace('.', ',')
const hoursText = (min: number) => `${Math.floor(min / 60)} h ${String(Math.round(min % 60)).padStart(2, '0')} min`
const sign = (n: number, d = 0) => (n > 0 ? '+' : '') + fmt(n, d)

/** Resumen de la semana o de 4 semanas: comida, cuerpo, entreno, el cruce entre entreno y descanso, y la cafeína. */
export default function Resumen({ data }: { data: VerticeData }) {
  const [period, setPeriod] = useState<7 | 28>(7)
  const today = toISODate(new Date())
  const days = useMemo(() => lastDays(today, period), [today, period])

  const nut = useMemo(() => nutritionSummary(days, data.nutrition, data.targets), [days, data])
  const trn = useMemo(() => trainingSummary(days, data.training), [days, data])
  const body = useMemo(() => bodySummary(today, data.body), [today, data])
  const cross = useMemo(() => crossTrainingRest(days, data.nutrition, data.training), [days, data])
  const slp = useMemo(() => sleepSummary(days, data.sleep), [days, data])
  const wake = useMemo(() => wakeCounts(days, data.sleep), [days, data])
  const caf = useMemo(() => caffeineSummary(days, data.caffeine), [days, data])

  return (
    <div className="screen">
      <h2>Resumen</h2>
      <div className="subtabs">
        <button className={period === 7 ? 'active' : ''} onClick={() => setPeriod(7)}>Semana</button>
        <button className={period === 28 ? 'active' : ''} onClick={() => setPeriod(28)}>4 semanas</button>
      </div>

      <section className="card">
        <h3>Alimentación</h3>
        <p>Registraste <strong>{nut.loggedDays} de {nut.totalDays}</strong> días.</p>
        {nut.avgKcal != null && data.targets ? (
          <>
            <p>Calorías: <strong>{fmt(nut.avgKcal)}</strong> kcal de media (meta {fmt(data.targets.kcal_target)}) {nut.kcalVsTarget != null && <span className="muted">· {sign(nut.kcalVsTarget)} %</span>}</p>
            <p>Proteína: <strong>{fmt(nut.avgProtein ?? 0)}</strong> g de media (meta {fmt(data.targets.protein_target)}) {nut.proteinVsTarget != null && <span className="muted">· {sign(nut.proteinVsTarget)} %</span>}</p>
            <p className="muted">Carbohidratos: {fmt(nut.avgCarbs ?? 0)} g de media.</p>
          </>
        ) : (
          <p className="muted">Todavía no hay comidas registradas en este periodo.</p>
        )}
      </section>

      <section className="card">
        <h3>Cuerpo</h3>
        {body.avg != null ? (
          <>
            <p>Peso medio de los últimos 7 días: <strong>{fmt(body.avg, 1)} kg</strong>{body.change != null && <> · {sign(body.change, 1)} kg frente a la semana anterior {body.weeklyPct != null && <span className="muted">({sign(body.weeklyPct, 1)} %)</span>}</>}</p>
            {body.weeklyPct != null && <p className="muted">{body.weeklyPct < -1 ? 'Bajas más rápido que un ritmo prudente (≈ 0,5-1 % a la semana).' : body.weeklyPct <= -0.3 ? 'Ritmo de pérdida razonable.' : body.weeklyPct < 0.3 ? 'El peso está estable.' : 'El peso sube.'}</p>}
          </>
        ) : (
          <p className="muted">Sin peso registrado en los últimos 7 días.</p>
        )}
        {body.waist && <p>Cintura: <strong>{fmt(body.waist.value, 1)} cm</strong> <span className="muted">({body.waist.date})</span></p>}
      </section>

      <section className="card">
        <h3>Entreno</h3>
        <p><strong>{trn.sessions}</strong> sesión{trn.sessions === 1 ? '' : 'es'} de fuerza · <strong>{trn.trainingDays}</strong> día{trn.trainingDays === 1 ? '' : 's'} de entreno · <strong>{fmt(trn.cardioMinutes)}</strong> min de cardio</p>
      </section>

      <section className="card">
        <h3>Días de entreno frente a descanso</h3>
        {cross.reading.length > 0 && cross.training && cross.rest ? (
          <>
            <table className="cross">
              <thead><tr><th></th><th>Entreno ({cross.trainingDays})</th><th>Descanso ({cross.restDays})</th></tr></thead>
              <tbody>
                <tr><td>Calorías</td><td>{fmt(cross.training.kcal)}</td><td>{fmt(cross.rest.kcal)}</td></tr>
                <tr><td>Proteína (g)</td><td>{fmt(cross.training.protein)}</td><td>{fmt(cross.rest.protein)}</td></tr>
                <tr><td>Carbohidratos (g)</td><td>{fmt(cross.training.carbs)}</td><td>{fmt(cross.rest.carbs)}</td></tr>
              </tbody>
            </table>
            {cross.reading.map((r) => <p key={r}>{r}</p>)}
          </>
        ) : (
          <p className="muted">Hacen falta al menos {CROSS_MIN_DAYS} días registrados de entreno y {CROSS_MIN_DAYS} de descanso para comparar (ahora: {cross.trainingDays} y {cross.restDays}).</p>
        )}
      </section>

      <section className="card">
        <h3>Sueño</h3>
        {slp.avgMin != null ? (
          <>
            <p>Media de <strong>{hoursText(slp.avgMin)}</strong> en 24 h ({slp.days} de {days.length} días registrados){slp.avgNapMin ? <> · siestas: {hoursText(slp.avgNapMin)} de media</> : null}</p>
            <p className="muted">{slp.avgMin < 7 * 60 ? 'Por debajo de las 7 h recomendadas para adultos.' : 'En el rango recomendado (7-9 h).'}{slp.avgQuality != null ? ` Descanso medio: ${fmt(slp.avgQuality, 1)}/5.` : ''}</p>
            {wake.logged > 0 && <p className="muted">Despertar: {wake.solo} de {wake.logged} noches por tu cuenta, {wake.despertador} con despertador y {wake.ruido} por ruido.</p>}
          </>
        ) : (
          <p className="muted">Sin sueño registrado en este periodo. Se anota en Nutrición, en Mi día.</p>
        )}
      </section>

      <section className="card">
        <h3>Cafeína</h3>
        {caf.avg != null ? (
          <p>Media de <strong>{fmt(caf.avg)} mg</strong> los días que tomas{caf.max && <> · día más alto: {fmt(caf.max.mg)} mg ({caf.max.date})</>}{caf.daysOver > 0 && <span className="warn-text"> · {caf.daysOver} día{caf.daysOver > 1 ? 's' : ''} por encima de 400 mg</span>}</p>
        ) : (
          <p className="muted">Sin cafeína registrada en este periodo.</p>
        )}
      </section>

      <p className="muted">Con pocas semanas de datos las lecturas son débiles: se afinan con el tiempo.</p>
    </div>
  )
}
