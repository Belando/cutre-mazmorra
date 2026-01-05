# 🏰 Cutre Mazmorra

**Cutre Mazmorra** es un roguelike minimalista de exploración de mazmorras generado procedimentalmente. Lucha contra monstruos, equípate con poderosos objetos y desciende a las profundidades para desafiar a los jefes legendarios.

Construido con una arquitectura moderna basada en **React**, **TypeScript** y un sistema de **Hooks personalizados** que ha evolucionado hacia un diseño **Data-Driven**.

![Gameplay Screenshot](public/screenshot.png) *(Placeholder)*

---

## 🚀 Cómo Empezar

### Requisitos Previos
- Node.js (v16 o superior)

### Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/cutre-mazmorra.git
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Inicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

El juego estará disponible en `http://localhost:5173`.

---

## 🎮 Controles

| Acción | Tecla / Control |
| :--- | :--- |
| **Moverse / Atacar** | Flechas (↑ ↓ ← →) o WASD |
| **Inventario** | `I` |
| **Interactuar (Cofres/NPCs)** | Automático al chocar |
| **Habilidades (1-4)** | Teclas numéricas `1`, `2`, `3`, `4` |
| **Pausar** | `Esc` |

### 💬 Comandos de Chat

Puedes usar la barra de chat en la parte inferior izquierda para activar trucos y moverte rápido. Presiona Enter para enviar.

| Comando | Descripción |
| :--- | :--- |
| `/help` | Muestra la lista de comandos disponibles. |
| `/warp [nivel]` | Teletransporta al piso especificado (ej. `/warp 5`). |
| `/warp home` | Vuelve a la base (hogar). |
| `/levelup [n]` | Sube `n` niveles al personaje inmediatamente. |
| `/gold [n]` | Añade `n` monedas de oro. |
| `/god` | Activa el "Modo Dios" (Vida y Stats masivas). |

---

## 🏗️ Arquitectura del Sistema (Refactorizada)

El proyecto ha migrado recientemente a una arquitectura orientada a datos para facilitar la escalabilidad y el modding.

### 1. Diseño Data-Driven (`src/data`)
En lugar de lógica "hardcodeada", el juego define su contenido en estructuras de datos JSON-like:
- **`enemies.ts`**: Define estadísticas, comportamientos de IA (`aiBehavior`), ataques y loot de todos los enemigos.
- **`items.ts` / `skills.ts`**: Definiciones centrales de objetos y habilidades.
- **`constants.ts`**: Configuración global y etiquetas del sistema (`TILE_TAGS`).

### 2. Sistema de Tags y Combate Sistémico
El motor de combate (`CombatSystem.ts`) ya no contiene reglas específicas para cada enemigo. En su lugar, utiliza un sistema de **Tags**:
- **Entities**: Tienen tags como `UNDEAD`, `BEAST`, `FLAMMABLE`.
- **Tiles**: El terreno tiene propiedades como `FLAMMABLE` (Hierba) o `WET` (Agua).
- **Interacciones**: Calcular el daño implica cruzar Tags y Elementos (ej. Fuego hace x1.5 daño a `PLANT`, Rayo se dispersa en `WATER`).

### 3. Sistema de IA y Comportamiento (`src/engine/ai`)
Los enemigos utilizan un sistema de comportamiento modular basado en estrategias (Strategy Pattern):
- **Aggressive**: Persigue al jugador directamente.
- **Cautious**: Mantiene la distancia si está herido o prefiere atacar de lejos.
- **Bosses**: Lógica personalizada compleja para jefes finales (fases, invocaciones).

### 4. Robustez de Datos (`SaveSystem.ts`)
El sistema de guardado incluye:
- **Migraciones de Versión**: Permite actualizar saves viejos a nuevas estructuras de datos sin perder progreso.
- **Sanitización**: Rellena automáticamente datos corruptos o faltantes al cargar.
- **Compresión Delta**: Guarda solo las diferencias del mapa procedimental para ahorrar espacio.

---

## 🛠️ Tecnologías Clave

- **React 18**: Motor de UI.
- **TypeScript**: Tipado estricto para sistemas complejos.
- **Vite**: Entorno de desarrollo.
- **Canvas API**: Renderizado del mapa y entidades (capa `GameRenderer`).
- **Vitest**: Testing unitario de sistemas críticos (Combate, IA).
