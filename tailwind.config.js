/** @type {import('tailwindcss').Config} */
export default {
  // La sección 'content' es la más importante.
  // Le dice a Tailwind que escanee todos los archivos .jsx, .js, etc.
  // dentro de la carpeta 'src' en busca de nombres de clases.
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    // Aquí es donde puedes extender el diseño de Tailwind con tus
    // propios colores, fuentes, espaciado, etc.
    // Por ahora, lo dejamos vacío.
    extend: {},
  },
  // Aquí se añaden plugins de Tailwind, como los de formularios o tipografía.
  // Por ahora, también lo dejamos vacío.
  plugins: [],
}