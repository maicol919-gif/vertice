import { toISODate } from '../lib/date'
import type { VerticeData } from '../lib/useVerticeData'

const fmt = (n: number, d = 0) => n.toFixed(d).replace('.', ',')

function Bar({ label, eaten, target, unit }: { label: string; eaten: number; target: number; unit: string }) {
  const pct = Math.min(100, target > 0 ? (eaten / target) * 100 : 0)
  const state = eaten > target * 1.05 ? 'pasado' : eaten >= target * 0.9 ? 'ok' : 'bajo'
  return (
    <div className="bigbar">
      <div className="row between">
        <strong>{label}</strong>
        <span className={state === 'ok' ? 'ok' : state === 'pasado' ? 'warn-text' : ''}>{fmt(eaten)} / {fmt(target)} {unit}</span>
      </div>
      <div className="progress"><div className={state} style={{ width: `${pct}%` }} /></div>
    </div>
  )
}

/** Hoy: lo que llevas de comida, el entreno, la cafeína y el último peso, en una sola mirada. */
export default function Hoy({ data }: { data: VerticeData }) {
  const today = toISODate(new Date())
  const n = data.nutrition.find((x) => x.date === today)
  const t = data.training.find((x) => x.date === today)
  const c = data.caffeine.find((x) => x.date === today)
  const lastWeight = [...data.body].filter((x) => x.kg != null).sort((a, b) => b.date.localeCompare(a.date))[0]
  const lastWaist = [...data.body].filter((x) => x.waist_cm != null).sort((a, b) => b.date.localeCompare(a.date))[0]
  const kcalTarget = data.targets?.kcal_target ?? 0
  const proteinTarget = data.targets?.protein_target ?? 0

  return (
    <div className="screen">
      <h2>Hoy</h2>

      <section className="card">
        <h3>Comida</h3>
        {data.targets ? (
          <>
            <Bar label="Calorías" eaten={n?.kcal ?? 0} target={kcalTarget} unit="kcal" />
            <Bar label="Proteína" eaten={n?.protein ?? 0} target={proteinTarget} unit="g" />
            <p className="muted">
              {n ? `Te faltan ${fmt(Math.max(0, proteinTarget - n.protein))} g de proteína y te quedan ${fmt(Math.max(0, kcalTarget - n.kcal))} kcal.` : 'Todavía no registraste nada hoy.'}
            </p>
          </>
        ) : (
          <p className="muted">No encuentro tus metas. Defínelas en Nutrición, en Ajustes.</p>
        )}
        <a className="applink" href="/nutricion/">Abrir Nutrición</a>
      </section>

      <section className="card">
        <h3>Entreno</h3>
        <p>{t && (t.sessions_done > 0 || t.cardio_minutes > 0)
          ? `${t.sessions_done > 0 ? `${t.sessions_done} sesión${t.sessions_done > 1 ? 'es' : ''} de fuerza` : 'Sin fuerza'}${t.cardio_minutes > 0 ? ` · ${fmt(t.cardio_minutes)} min de cardio` : ''}`
          : 'Hoy todavía no hay entreno registrado.'}</p>
        <a className="applink" href="/entreno/">Abrir Entreno</a>
      </section>

      <section className="card">
        <h3>Cafeína</h3>
        <p className={c && c.caffeine_mg > 400 ? 'warn-text' : ''}>{c ? `${fmt(c.caffeine_mg)} mg hoy (límite orientativo 400 mg al día)` : 'Sin cafeína registrada hoy.'}</p>
      </section>

      <section className="card">
        <h3>Cuerpo</h3>
        <p>
          {lastWeight ? `Último peso: ${fmt(Number(lastWeight.kg), 1)} kg (${lastWeight.date})` : 'Sin peso registrado.'}
          {lastWaist ? ` · Cintura: ${fmt(Number(lastWaist.waist_cm), 1)} cm (${lastWaist.date})` : ''}
        </p>
      </section>

      <p className="muted">El sueño se sumará aquí cuando lo registremos en la app.</p>
    </div>
  )
}
