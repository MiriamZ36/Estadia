# Torneo Fut (Prototipo PWA)

Sistema inteligente de gestión de torneos de fútbol amateur enfocado en la región Orizaba–Córdoba. Proyecto de estadía con enfoque web + móvil (PWA). **Este repositorio contiene un prototipo funcional sin base de datos real.**

---

## ¿Qué busca resolver?
Actualmente la gestión se hace con Excel, WhatsApp y papel, lo que provoca:
- Errores humanos
- Información desactualizada
- Sobrecarga para organizadores
- Baja transparencia y acceso limitado a estadísticas

---

## ¿Qué hace el sistema?
Registro centralizado de:
- Equipos
- Jugadores
- Árbitros
- Entrenadores
- Programación de partidos

Captura y generación automática de:
- Incidencias en tiempo real
- Tablas de posiciones
- Reportes y estadísticas
- Predicciones simples de resultados

---

## Estado del proyecto
**Prototipo funcional (sin backend):**
- Persistencia simulada en `localStorage`.
- Datos de ejemplo precargados.
- Sin integración con servicios externos.

---

## Roles
- **Administrador**: control total (usuarios, torneos, equipos, árbitros, entrenadores, partidos)
- **Árbitro**: gestión de partidos y eventos
- **Entrenador**: gestión de equipos y jugadores
- **Aficionado**: consulta

---

## Módulos principales
- Autenticación y gestión de usuarios
- Torneos
- Equipos y jugadores
- Árbitros y entrenadores
- Partidos y eventos
- Estadísticas y predicciones
- Perfil de usuario

---

## Tecnologías
- Next.js (App Router)
- React
- Tailwind CSS
- Componentes UI basados en Radix/shadcn
- PWA (manifest + íconos)

---

## Ejecutar el proyecto
```bash
pnpm install
pnpm dev
```

---

## Notas importantes
- Este proyecto es un **prototipo**.
- No hay base de datos ni API real.
- La autenticación es simulada y local.

---

## Documentación adicional
- `docs/README.md`: guía para la ESR IEEE 830
- `docs/READMEIA.md`: contexto técnico resumido para IA

