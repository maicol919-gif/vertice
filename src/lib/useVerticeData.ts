import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { addDays, type BodyDay, type CaffeineDay, type NutritionDay, type Targets, type TrainingDay } from './summary'
import { toISODate } from './date'

export interface VerticeData {
  nutrition: NutritionDay[]
  training: TrainingDay[]
  caffeine: CaffeineDay[]
  body: BodyDay[]
  targets: Targets | null
}

const num = (v: unknown) => Number(v ?? 0)

/** Cuántos días hacia atrás se leen (4 semanas más la semana anterior para comparar el peso). */
const WINDOW_DAYS = 42

/** Lee, solo para mirar, las vistas estables `v_*` de la base compartida con Nutrición y Entreno. */
export function useVerticeData(): { data: VerticeData | null; error: string | null; reload: () => Promise<void> } {
  const [data, setData] = useState<VerticeData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const since = addDays(toISODate(new Date()), -WINDOW_DAYS)
    const [n, t, c, b, g] = await Promise.all([
      supabase.from('v_nutrition_daily').select('*').gte('date', since),
      supabase.from('v_training_daily').select('*').gte('date', since),
      supabase.from('v_caffeine_daily').select('*').gte('date', since),
      supabase.from('v_body_daily').select('*').gte('date', since),
      supabase.from('v_targets').select('*').limit(1),
    ])
    const failed = [n, t, c, b, g].find((r) => r.error)
    if (failed?.error) return setError(failed.error.message)
    setError(null)
    setData({
      nutrition: (n.data ?? []).map((r) => ({ date: r.date, kcal: num(r.kcal), protein: num(r.protein), carbs: num(r.carbs), fat: num(r.fat) })),
      training: (t.data ?? []).map((r) => ({ date: r.date, sessions_done: num(r.sessions_done), cardio_minutes: num(r.cardio_minutes) })),
      caffeine: (c.data ?? []).map((r) => ({ date: r.date, caffeine_mg: num(r.caffeine_mg) })),
      body: (b.data ?? []).map((r) => ({ date: r.date, kg: r.kg == null ? null : Number(r.kg), waist_cm: r.waist_cm == null ? null : Number(r.waist_cm) })),
      targets: g.data?.[0] ? { kcal_target: num(g.data[0].kcal_target), protein_target: num(g.data[0].protein_target) } : null,
    })
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, error, reload }
}
