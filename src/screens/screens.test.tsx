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
  targets: { kcal_target: 2150, protein_target: 148 },
}

describe('pantallas (render)', () => {
  it('Hoy enseña comida, entreno, cafeína y cuerpo', () => {
    const html = renderToString(<Hoy data={data} />)
    expect(html).toContain('Hoy')
    expect(html).toContain('Te faltan 58 g de proteína')
    expect(html).toContain('1 sesión de fuerza')
    expect(html).toContain('20 min de cardio')
    expect(html).toContain('90 mg hoy')
    expect(html).toContain('72,4 kg')
  })

  it('Hoy sin datos no se rompe', () => {
    const html = renderToString(<Hoy data={{ nutrition: [], training: [], caffeine: [], body: [], targets: null }} />)
    expect(html).toContain('No encuentro tus metas')
    expect(html).toContain('Sin cafeína registrada hoy')
  })

  it('Resumen enseña los bloques y avisa de que faltan días para el cruce', () => {
    const html = renderToString(<Resumen data={data} />)
    expect(html).toContain('Registraste')
    expect(html).toMatch(/1(<!-- -->)? de (<!-- -->)?7/)
    expect(html).toMatch(/Hacen falta al menos (<!-- -->)?3(<!-- -->)? días/)
  })
})
