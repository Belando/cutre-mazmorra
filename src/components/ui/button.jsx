// src/components/ui/button.jsx
import * as React from "react";
import { cva } from "class-variance-authority";
import { cn } from "@/engine/core/utils"; 

// --- Aquí definimos todos los estilos y variantes del botón ---
const buttonVariants = cva(
  // Estilos base que se aplican a TODOS los botones
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      // Diferentes estilos visuales
      variant: {
        default: "bg-slate-900 text-slate-50 hover:bg-slate-900/90",
        destructive: "bg-red-600 text-slate-50 hover:bg-red-600/90",
        outline: "border border-slate-400 bg-transparent hover:bg-slate-800 hover:text-slate-50",
        secondary: "bg-slate-700 text-slate-50 hover:bg-slate-700/80",
        ghost: "hover:bg-slate-800 hover:text-slate-50",
        link: "text-slate-50 underline-offset-4 hover:underline",
      },
      // Diferentes tamaños
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    // Variantes por defecto si no se especifica ninguna
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// --- Este es el componente de React en sí ---
const Button = React.forwardRef(({ className, variant, size, ...props }, ref) => {
  return (
    <button
      className={cn(buttonVariants({ variant, size, className }))}
      ref={ref}
      {...props}
    />
  );
});
Button.displayName = "Button";

// Exportamos el componente y las variantes para poder usarlos en otros lugares
export { Button, buttonVariants };