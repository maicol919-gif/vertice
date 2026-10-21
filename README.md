# Vértice

Panel de solo lectura que junta **nutrición**, **entreno** (y más adelante **sueño**) en una sola vista. Es la tercera app del conjunto: **Entreno** (entrenar), **Nutrición** (comida, peso, cintura, suplementos) y **Vértice** (mirarlo todo junto). Las tres comparten la misma cuenta y la misma base de datos de Supabase.

## Qué muestra
- **Hoy:** calorías y proteína frente a tu meta, el entreno de hoy, la cafeína y el último peso y cintura.
- **Resumen** (semana o 4 semanas): alimentación (días registrados y medias frente a la meta), cuerpo (peso medio de 7 días frente a la semana anterior, ritmo semanal y cintura), entreno (sesiones, días de entreno, minutos de cardio), **días de entreno frente a descanso** (calorías, proteína y carbohidratos, con una lectura cuando hay al menos 3 días de cada tipo) y cafeína.

## Cómo lee los datos
Solo lee **vistas estables** (`v_nutrition_daily`, `v_training_daily`, `v_caffeine_daily`, `v_body_daily`, `v_targets`), definidas en `app/supabase/schema.sql` con `security_invoker`: cada consulta respeta la seguridad por filas del usuario. Así, si cambia una tabla de Nutrición o de Entreno, solo hay que ajustar la vista y Vértice sigue funcionando. No escribe nada.

## Stack
React + TypeScript + Vite, PWA (`vite-plugin-pwa`), Supabase y Vitest.

## Puesta en marcha
1. `.env.local` con `VITE_SUPABASE_URL` y `VITE_SUPABASE_KEY` (los mismos que Nutrición).
2. `npm install` y `npm run dev`.
3. Pruebas: `npm test` · Compilar: `npm run build`.

Publicación: la carpeta `dist` se sube a la rama `gh-pages` (GitHub Pages): https://maicol919-gif.github.io/vertice/
