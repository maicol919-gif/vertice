export interface NutritionDay { date: string; kcal: number; protein: number; carbs: number; fat: number }
export interface TrainingDay { date: string; sessions_done: number; cardio_minutes: number }
export interface CaffeineDay { date: string; caffeine_mg: number }
export interface BodyDay { date: string; kg: number | null; waist_cm: number | null }
export interface SleepDay { date: string; minutes: number; night_minutes: number; nap_minutes: number; quality: number | null }
export interface Targets { kcal_target: number; protein_target: number }

/** Suma días a una fecha ISO (AAAA-MM-DD). */
export function addDays(date: string, days: number): string {
  const d = new Date(date + 'T00:00:00')
  d.setDate(d.getDate() + days)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

/** Los últimos `n` días terminando en `today`, del más antiguo al más reciente. */
export function lastDays(today: string, n: number): string[] {
  return Array.from({ length: n }, (_, i) => addDays(today, i - (n - 1)))
}

const byDate = <T extends { date: string }>(rows: T[]) => new Map(rows.map((r) => [r.date, r]))
const mean = (xs: number[]) => (xs.length === 0 ? null : xs.reduce((s, x) => s + x, 0) / xs.length)

export const isTrainingDay = (t: TrainingDay | undefined): boolean => !!t && (t.sessions_done > 0 || t.cardio_minutes > 0)

export interface NutritionSummary {
  loggedDays: number
  totalDays: number
  avgKcal: number | null
  avgProtein: number | null
  avgCarbs: number | null
  /** diferencia de la media con la meta, en % (negativo = por debajo) */
  kcalVsTarget: number | null
  proteinVsTarget: number | null
}

/** Medias de los días con comidas registradas (un día sin registrar no cuenta como cero). */
export function nutritionSummary(days: string[], data: NutritionDay[], targets: Targets | null): NutritionSummary {
  const map = byDate(data)
  const logged = days.map((d) => map.get(d)).filter((x): x is NutritionDay => !!x && x.kcal > 0)
  const avgKcal = mean(logged.map((x) => x.kcal))
  const avgProtein = mean(logged.map((x) => x.protein))
  return {
    loggedDays: logged.length,
    totalDays: days.length,
    avgKcal,
    avgProtein,
    avgCarbs: mean(logged.map((x) => x.carbs)),
    kcalVsTarget: avgKcal != null && targets ? ((avgKcal - targets.kcal_target) / targets.kcal_target) * 100 : null,
    proteinVsTarget: avgProtein != null && targets ? ((avgProtein - targets.protein_target) / targets.protein_target) * 100 : null,
  }
}

export interface TrainingSummary { sessions: number; trainingDays: number; cardioMinutes: number }

export function trainingSummary(days: string[], data: TrainingDay[]): TrainingSummary {
  const map = byDate(data)
  let sessions = 0
  let trainingDays = 0
  let cardioMinutes = 0
  for (const d of days) {
    const t = map.get(d)
    if (!t) continue
    sessions += t.sessions_done
    cardioMinutes += t.cardio_minutes
    if (isTrainingDay(t)) trainingDays++
  }
  return { sessions, trainingDays, cardioMinutes }
}

export interface BodySummary {
  /** media de los últimos 7 días con peso */
  avg: number | null
  /** media de los 7 días anteriores */
  prevAvg: number | null
  change: number | null
  /** cambio semanal en % del peso */
  weeklyPct: number | null
  waist: { value: number; date: string } | null
  lastWeight: { value: number; date: string } | null
}

/** Peso medio de la última semana frente a la anterior, y la última cintura registrada. */
export function bodySummary(today: string, data: BodyDay[]): BodySummary {
  const from = (offset: number) => addDays(today, -offset)
  const inRange = (a: string, b: string) => data.filter((r) => r.kg != null && r.date >= a && r.date <= b).map((r) => Number(r.kg))
  const avg = mean(inRange(from(6), today))
  const prevAvg = mean(inRange(from(13), from(7)))
  const change = avg != null && prevAvg != null ? avg - prevAvg : null
  const latest = (key: 'kg' | 'waist_cm') => [...data].filter((r) => r[key] != null).sort((a, b) => b.date.localeCompare(a.date))[0]
  const w = latest('waist_cm')
  const k = latest('kg')
  return {
    avg,
    prevAvg,
    change,
    weeklyPct: change != null && prevAvg ? (change / prevAvg) * 100 : null,
    waist: w ? { value: Number(w.waist_cm), date: w.date } : null,
    lastWeight: k ? { value: Number(k.kg), date: k.date } : null,
  }
}

export interface CaffeineSummary { avg: number | null; max: { date: string; mg: number } | null; daysOver: number }

/** Cafeína media de los días con cafeína, el día más alto y cuántos días pasaron de 400 mg. */
export function caffeineSummary(days: string[], data: CaffeineDay[], limit = 400): CaffeineSummary {
  const map = byDate(data)
  const rows = days.map((d) => map.get(d)).filter((x): x is CaffeineDay => !!x && x.caffeine_mg > 0)
  const max = rows.reduce<{ date: string; mg: number } | null>((m, r) => (!m || r.caffeine_mg > m.mg ? { date: r.date, mg: r.caffeine_mg } : m), null)
  return { avg: mean(rows.map((r) => r.caffeine_mg)), max, daysOver: rows.filter((r) => r.caffeine_mg > limit).length }
}

export interface Cross {
  trainingDays: number
  restDays: number
  training: { kcal: number; protein: number; carbs: number } | null
  rest: { kcal: number; protein: number; carbs: number } | null
  /** frases de lectura; vacío si no hay datos suficientes */
  reading: string[]
}

/** Mínimo de días registrados de cada tipo para comparar entrenos y descansos. */
export const CROSS_MIN_DAYS = 3

/** Lo que comes los días de entreno frente a los de descanso (solo días con comidas registradas). */
export function crossTrainingRest(days: string[], nutrition: NutritionDay[], training: TrainingDay[]): Cross {
  const n = byDate(nutrition)
  const t = byDate(training)
  const logged = days.map((d) => ({ d, n: n.get(d) })).filter((x): x is { d: string; n: NutritionDay } => !!x.n && x.n.kcal > 0)
  const train = logged.filter((x) => isTrainingDay(t.get(x.d)))
  const rest = logged.filter((x) => !isTrainingDay(t.get(x.d)))
  const avg = (xs: typeof logged) => (xs.length === 0 ? null : { kcal: mean(xs.map((x) => x.n.kcal)) ?? 0, protein: mean(xs.map((x) => x.n.protein)) ?? 0, carbs: mean(xs.map((x) => x.n.carbs)) ?? 0 })
  const out: Cross = { trainingDays: train.length, restDays: rest.length, training: avg(train), rest: avg(rest), reading: [] }
  if (train.length < CROSS_MIN_DAYS || rest.length < CROSS_MIN_DAYS || !out.training || !out.rest) return out
  const dp = out.training.protein - out.rest.protein
  const dc = out.training.carbs - out.rest.carbs
  if (Math.abs(dp) >= 15) out.reading.push(dp < 0 ? `Los días de entreno comes ${Math.round(-dp)} g menos de proteína que los de descanso.` : `Los días de descanso comes ${Math.round(dp)} g menos de proteína que los de entreno.`)
  if (dc < 20) out.reading.push('Los días de entreno no comes claramente más carbohidratos que los de descanso.')
  else out.reading.push(`Los días de entreno comes ${Math.round(dc)} g más de carbohidratos.`)
  return out
}

/** Días de entreno a la semana que se toman como "completo" en el triángulo (no es una meta tuya: es una referencia sencilla). */
export const WEEKLY_TRAINING_REF = 3

/** Minutos de sueño de las 24 h que se toman como "completo" (7 h, el mínimo recomendado para adultos: AASM y Sleep Research Society, 2015). */
export const SLEEP_REF_MIN = 7 * 60

/** 0-1: acercarse a la proteína y a las calorías de la meta sin pasarse (más de un 5 % de calorías resta). */
export function foodScore(kcal: number, protein: number, targets: Targets): number {
  const p = Math.min(1, protein / targets.protein_target)
  const over = kcal - targets.kcal_target * 1.05
  const energy = over > 0 ? Math.max(0, 1 - over / targets.kcal_target) : Math.min(1, kcal / targets.kcal_target)
  return (p + energy) / 2
}

export interface DayScores {
  /** 0-1 sobre la media de los 7 días que terminan ese día (solo cuentan los días con comida registrada); null si no hay metas */
  food: number | null
  /** cuántos de esos 7 días tienen comida registrada */
  loggedDays: number
  /** medias de esos días registrados */
  avgKcal: number | null
  avgProtein: number | null
  /** 0-1: días de entreno de esos 7 días frente a la referencia */
  training: number
  trainingDays: number
  /** 0-1: media de sueño (noche + siestas) de los días registrados de esos 7, frente a 7 h; null si no hay ninguno */
  sleep: number | null
  sleepDays: number
  avgSleepMin: number | null
  avgNapMin: number | null
  avgQuality: number | null
}

/** Valor de 0 a 1 para los tres vértices: comida y entreno sobre la semana que termina en `date`. */
export function dayScores(date: string, nutrition: NutritionDay[], training: TrainingDay[], targets: Targets | null, sleep: SleepDay[] = []): DayScores {
  const week = lastDays(date, 7)
  const nMap = byDate(nutrition)
  const logged = week.map((d) => nMap.get(d)).filter((x): x is NutritionDay => !!x && x.kcal > 0)
  const avgKcal = mean(logged.map((x) => x.kcal))
  const avgProtein = mean(logged.map((x) => x.protein))
  const valid = targets && targets.kcal_target > 0 && targets.protein_target > 0
  const food = !valid ? null : avgKcal == null || avgProtein == null ? 0 : foodScore(avgKcal, avgProtein, targets)
  const t = byDate(training)
  const trainingDays = week.filter((d) => isTrainingDay(t.get(d))).length
  const slept = week.map((d) => byDate(sleep).get(d)).filter((x): x is SleepDay => !!x && x.minutes > 0)
  const avgSleepMin = mean(slept.map((x) => x.minutes))
  const qualities = slept.map((x) => x.quality).filter((q): q is number => q != null)
  return {
    food, loggedDays: logged.length, avgKcal, avgProtein,
    training: Math.min(1, trainingDays / WEEKLY_TRAINING_REF), trainingDays,
    sleep: avgSleepMin == null ? null : Math.min(1, avgSleepMin / SLEEP_REF_MIN),
    sleepDays: slept.length, avgSleepMin, avgNapMin: mean(slept.map((x) => x.nap_minutes)), avgQuality: mean(qualities),
  }
}

export interface SleepSummary { days: number; avgMin: number | null; avgNapMin: number | null; avgQuality: number | null }

/** Sueño medio de 24 h (noche + siestas) de los días registrados del periodo. */
export function sleepSummary(days: string[], data: SleepDay[]): SleepSummary {
  const map = byDate(data)
  const rows = days.map((d) => map.get(d)).filter((x): x is SleepDay => !!x && x.minutes > 0)
  return {
    days: rows.length,
    avgMin: mean(rows.map((r) => r.minutes)),
    avgNapMin: mean(rows.map((r) => r.nap_minutes)),
    avgQuality: mean(rows.map((r) => r.quality).filter((q): q is number => q != null)),
  }
}
