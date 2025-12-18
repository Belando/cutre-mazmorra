# 🏰 Cutre Mazmorra

**Cutre Mazmorra** es un roguelike minimalista de exploración de mazmorras generado procedimentalmente. Lucha contra monstruos, equípate con poderosos objetos y desciende a las profundidades para desafiar a los jefes legendarios.

Construido con una arquitectura moderna basada en **React**, **TypeScript** y un sistema de **Hooks personalizados** para la lógica del juego.

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

## 🏗️ Arquitectura del Sistema

El proyecto sigue una arquitectura modular basada en Hooks de React para gestionar el estado y la lógica.

### 1. Núcleo (`src/engine`)
El motor del juego está desacoplado de la interfaz gráfica.
- **`GameEngine.ts`**: (Obsoleto, migrado a hooks) Lógica central.
- **`systems/`**: Módulos independientes de lógica pura.
    - **`DungeonGenerator.ts`**: Crea mapas procedimentales usando un algoritmo BSP.
    - **`CombatSystem.ts`**: Calcula daño, crítico y resolución de ataques.
    - **`EnemyAI.ts`**: Lógica de comportamiento enemigo (Agresivo, Cauteloso, Manada).
    - **`ItemSystem.ts`**: Gestión de loot y propiedades de objetos.

### 2. Capa de Hooks (`src/hooks`)
La "goma" que une React con el motor lógico.
- **`useGameEngine.tsx`**: Hook maestro que orquesta el estado global.
- **`useGameActions.ts`**: Facade que expone acciones limpias a la UI (mover, atacar, usar objeto).
- **`useTurnSystem.ts`**: Gestiona el flujo de turnos (Jugador -> Enemigos -> Efectos).

### 3. Tipado (`src/types`)
Poseemos un sistema de tipos estricto para garantizar la robustez.
- **`index.ts`**: Define interfaces críticas como `Entity`, `Player`, `Enemy`, `Item`, `GameState`.

---

## 🛠️ Tecnologías Clave

- **React 18**: Renderizado eficiente de la cuadrícula mediante Virtual DOM.
- **TypeScript**: Seguridad de tipos completa para lógica compleja (sistemas de RPG).
- **Vite**: Build tool ultrarrápida.
- **TailwindCSS**: Estilizado rápido y consistente para la UI.
- **Vitest**: Suite de pruebas unitarias para sistemas críticos.

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
