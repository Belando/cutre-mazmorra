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

### 3. Renderizado y Visuales (`src/renderer`)
- **Oclusión de Muros**: Sistema de transparencia dinámica. Los muros que obstruyen la visión del jugador (situados al Sur/Este) se vuelven semitransparentes automáticamente.
- **Interpolación de Movimiento**: Los sprites del jugador y enemigos se mueven suavemente entre casillas usando interpolación lineal (Lerp), mejorando el "game feel" respecto al movimiento rígido por grid.

### 4. Capa de Lógica Desacoplada (`src/hooks`)
La lógica de negocio se ha extraído de la UI:
- **`useInventoryLogic.ts`**: Gestiona todo el estado del inventario, filtrado y ordenación, dejando a `InventoryPanel.tsx` como un componente puramente visual.
- **`useCombatLogic.ts`**: Centraliza el flujo de turnos de combate, aplicación de daño y actualización de estado.

---

## 🛠️ Tecnologías Clave

- **React 18**: Motor de UI.
- **TypeScript**: Tipado estricto para sistemas complejos.
- **Vite**: Entorno de desarrollo.
- **Canvas API**: Renderizado del mapa y entidades (capa `GameRenderer`).
- **Vitest**: Testing unitario de sistemas críticos (Combate, IA).

---

## 🧪 Tests

Para ejecutar las pruebas unitarias de los sistemas de combate y lógica:

```bash
npm run test
```

Para abrir la interfaz visual de Vitest:

```bash
npx vitest --ui
```
