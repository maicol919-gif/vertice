# Cambios

## 0.5 · 2026-10-25
- **Cómo te despertaste:** la vista `v_sleep_daily` trae `wake_reason` (por tu cuenta, despertador o ruido, anotado en Nutrición). El detalle de Sueño muestra el despertar del día y cuántas noches de la semana fueron de cada tipo; Resumen lo cuenta en su tarjeta. No cambia el valor del vértice: la evidencia sobre este dato es indirecta.

## 0.4 · 2026-10-21
- **Sueño:** el tercer vértice del triángulo ya se rellena. Lee la vista `v_sleep_daily` (sueño de 24 h: noche más siestas, que se anotan en Nutrición). Vértice = media de 24 h de los días registrados de los últimos 7 frente a 7 h (mínimo recomendado, AASM y Sleep Research Society 2015). El detalle muestra la media, las siestas y el descanso; Resumen tiene su tarjeta de Sueño.

## 0.3 · 2026-10-21
- **El triángulo mide la semana:** comida y entreno se calculan sobre los 7 días que terminan en el día elegido (la comida, con la media de los días registrados; un día sin registrar no cuenta como cero). Motivo: el balance energético y la proteína actúan como promedio de días, y un día en curso siempre sale incompleto. El detalle de Comida sigue enseñando el dato del día y lo que te falta hoy.

## 0.2 · 2026-10-21
- **Hoy rediseñado:** triángulo de los tres pilares (comida, entreno, sueño; cada vértice se rellena según lo que llevas y se toca para ver el detalle) y tira de la **semana** (color = cuánto te acercaste a tus metas de comida, punto azul = entrenaste; tocar un día muestra ese día en el triángulo). El sueño sale vacío hasta que se registre.
- Comida del triángulo = media de (proteína frente a la meta) y (calorías frente a la meta, restando si te pasas más del 5 %). Entreno = días de entreno de los últimos 7 frente a una referencia de 3 (`WEEKLY_TRAINING_REF`, no es una meta tuya).

## 0.1 · 2026-10-21
- Primera versión: **Hoy** y **Resumen** (semana y 4 semanas), solo lectura, a partir de las vistas `v_*` de la base compartida.
