import { describe, expect, it, vi } from 'vitest'
import { renderToString } from 'react-dom/server'
import type { VerticeData } from '../lib/useVerticeData'

vi.mock('../lib/supabase', () => ({ supabase: {} }))

const { default: Hoy } = await import('./Hoy')
const { default: Resumen } = await import('./Resumen')
const { toISODate } = await import('../lib/date')

const today = toISODate(new Date())
const data: VerticeData = {
  nutrition: [{ date: today, kcal: 1500, protein: 90, carbs: 180, fat: 50 }],
  training: [{ date: today, sessions_done: 1, cardio_minutes: 20 }],
  caffeine: [{ date: today, caffeine_mg: 90 }],
  body: [{ date: today, kg: 72.4, waist_cm: 85 }],
  sleep: [{ date: today, minutes: 540, night_minutes: 420, nap_minutes: 120, quality: 4 }],
  targets: { kcal_target: 2150, protein_target: 148 },
}

describe('pantallas (render)', () => {
  it('Hoy enseña el triángulo, el detalle de comida, la semana y el cuerpo', () => {
    const html = renderToString(<Hoy data={data} />)
    expect(html).toContain('Triángulo de los tres pilares')
    expect(html).toContain('Comida')
    expect(html).toContain('Entreno')
    expect(html).toContain('Sueño')
    expect(html).toMatch(/Te faltan (<!-- -->)?58(<!-- -->)? g de proteína/)
    expect(html).toMatch(/Cafeína: (<!-- -->)?90(<!-- -->)? mg/)
    expect(html).toContain('Semana')
    expect(html).toContain('72,4 kg')
  })

  it('Hoy sin datos no se rompe', () => {
    const html = renderToString(<Hoy data={{ nutrition: [], training: [], caffeine: [], body: [], sleep: [], targets: null }} />)
    expect(html).toContain('No encuentro tus metas')
    expect(html).toContain('sin comidas registradas')
  })

  it('Resumen enseña el sueño de la semana', () => {
    const html = renderToString(<Resumen data={data} />)
    expect(html).toContain('Sueño')
    expect(html).toMatch(/9 h 00 min/)
  })

  it('Resumen enseña los bloques y avisa de que faltan días para el cruce', () => {
    const html = renderToString(<Resumen data={data} />)
    expect(html).toContain('Registraste')
    expect(html).toMatch(/1(<!-- -->)? de (<!-- -->)?7/)
    expect(html).toMatch(/Hacen falta al menos (<!-- -->)?3(<!-- -->)? días/)
  })
})
