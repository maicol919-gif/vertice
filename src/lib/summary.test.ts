import { describe, expect, it } from 'vitest'
import { addDays, bodySummary, caffeineSummary, crossTrainingRest, lastDays, nutritionSummary, trainingSummary, type NutritionDay, type TrainingDay } from './summary'

const nut = (date: string, kcal: number, protein: number, carbs = 200): NutritionDay => ({ date, kcal, protein, carbs, fat: 50 })
const tr = (date: string, sessions_done: number, cardio_minutes = 0): TrainingDay => ({ date, sessions_done, cardio_minutes })

describe('fechas', () => {
  it('suma días y arma la ventana de los últimos n días', () => {
    expect(addDays('2026-10-30', 3)).toBe('2026-11-02')
    expect(lastDays('2026-10-21', 3)).toEqual(['2026-10-19', '2026-10-20', '2026-10-21'])
  })
})

describe('alimentación', () => {
  it('media de los días registrados y diferencia con la meta', () => {
    const days = lastDays('2026-10-21', 7)
    const s = nutritionSummary(days, [nut('2026-10-20', 2000, 150), nut('2026-10-21', 1800, 130), nut('2026-10-19', 0, 0)], { kcal_target: 2000, protein_target: 140 })
    expect(s.loggedDays).toBe(2)
    expect(s.totalDays).toBe(7)
    expect(s.avgKcal).toBe(1900)
    expect(s.kcalVsTarget).toBeCloseTo(-5)
    expect(s.proteinVsTarget).toBeCloseTo(0)
  })

  it('sin comidas no hay medias', () => {
    expect(nutritionSummary(lastDays('2026-10-21', 7), [], null)).toMatchObject({ loggedDays: 0, avgKcal: null, kcalVsTarget: null })
  })
})

describe('entreno', () => {
  it('suma sesiones, días de entreno y cardio', () => {
    const s = trainingSummary(lastDays('2026-10-21', 7), [tr('2026-10-19', 1, 20), tr('2026-10-20', 0, 30), tr('2026-10-21', 0, 0), tr('2026-09-01', 1)])
    expect(s).toEqual({ sessions: 1, trainingDays: 2, cardioMinutes: 50 })
  })
})

describe('cuerpo', () => {
  it('media de la última semana frente a la anterior', () => {
    const data = [
      { date: '2026-10-21', kg: 72, waist_cm: null },
      { date: '2026-10-18', kg: 73, waist_cm: 85 },
      { date: '2026-10-12', kg: 74, waist_cm: null },
      { date: '2026-10-09', kg: 75, waist_cm: null },
    ]
    const b = bodySummary('2026-10-21', data)
    expect(b.avg).toBe(72.5)
    expect(b.prevAvg).toBe(74.5)
    expect(b.change).toBe(-2)
    expect(b.weeklyPct).toBeCloseTo(-2.68, 1)
    expect(b.waist).toEqual({ value: 85, date: '2026-10-18' })
    expect(b.lastWeight).toEqual({ value: 72, date: '2026-10-21' })
  })

  it('sin datos devuelve vacío', () => {
    expect(bodySummary('2026-10-21', [])).toMatchObject({ avg: null, change: null, waist: null })
  })
})

describe('cafeína', () => {
  it('media, día más alto y días por encima de 400 mg', () => {
    const s = caffeineSummary(lastDays('2026-10-21', 7), [{ date: '2026-10-19', caffeine_mg: 340 }, { date: '2026-10-20', caffeine_mg: 450 }, { date: '2026-10-21', caffeine_mg: 90 }])
    expect(s.avg).toBeCloseTo(293.3, 1)
    expect(s.max).toEqual({ date: '2026-10-20', mg: 450 })
    expect(s.daysOver).toBe(1)
  })
})

describe('cruce entreno y descanso', () => {
  const days = lastDays('2026-10-28', 14)
  // días 1-3 y 8-10 son de entreno
  const training = [...days.slice(0, 3), ...days.slice(7, 10)].map((d) => tr(d, 1))
  const nutrition = days.map((d, i) => nut(d, 2000, training.some((t) => t.date === d) ? 150 : 120, training.some((t) => t.date === d) ? 260 : 200 + (i % 2)))

  it('compara y escribe la lectura cuando hay tres días de cada tipo', () => {
    const c = crossTrainingRest(days, nutrition, training)
    expect(c.trainingDays).toBe(6)
    expect(c.restDays).toBe(8)
    expect(c.reading.join(' ')).toContain('Los días de descanso comes 30 g menos de proteína')
    expect(c.reading.join(' ')).toContain('g más de carbohidratos')
  })

  it('con pocos días de un tipo no concluye nada', () => {
    const c = crossTrainingRest(days, nutrition.slice(0, 5), training)
    expect(c.reading).toEqual([])
  })
})
