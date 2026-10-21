# Cambios

## 0.3 · 2026-10-21
- **El triángulo mide la semana:** comida y entreno se calculan sobre los 7 días que terminan en el día elegido (la comida, con la media de los días registrados; un día sin registrar no cuenta como cero). Motivo: el balance energético y la proteína actúan como promedio de días, y un día en curso siempre sale incompleto. El detalle de Comida sigue enseñando el dato del día y lo que te falta hoy.

## 0.2 · 2026-10-21
- **Hoy rediseñado:** triángulo de los tres pilares (comida, entreno, sueño; cada vértice se rellena según lo que llevas y se toca para ver el detalle) y tira de la **semana** (color = cuánto te acercaste a tus metas de comida, punto azul = entrenaste; tocar un día muestra ese día en el triángulo). El sueño sale vacío hasta que se registre.
- Comida del triángulo = media de (proteína frente a la meta) y (calorías frente a la meta, restando si te pasas más del 5 %). Entreno = días de entreno de los últimos 7 frente a una referencia de 3 (`WEEKLY_TRAINING_REF`, no es una meta tuya).

## 0.1 · 2026-10-21
- Primera versión: **Hoy** y **Resumen** (semana y 4 semanas), solo lectura, a partir de las vistas `v_*` de la base compartida.
