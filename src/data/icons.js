import { 
  Sword, 
  Shield, 
  Ghost, 
  Shirt, 
  Footprints, 
  Hand, 
  CircleDot, 
  Search, 
  Book 
} from 'lucide-react';

export const EQUIPMENT_SLOTS = {
  weapon: { icon: Sword, name: 'Arma Principal' },
  offhand: { icon: Shield, name: 'Mano Izq.' },
  helmet: { icon: Ghost, name: 'Yelmo' }, // Ghost funciona bien como silueta de casco, o podemos usar otro
  chest: { icon: Shirt, name: 'Armadura' },
  legs: { icon: '🦵', name: 'Pantalones', isText: true }, // Lucide no tiene pantalones claros, usamos emoji medieval
  boots: { icon: Footprints, name: 'Botas' },
  gloves: { icon: Hand, name: 'Guantes' },
  ring: { icon: CircleDot, name: 'Anillo' },
  earring: { icon: Search, name: 'Pendiente' }, // Search parece una lupa/monoculo/joya
  necklace: { icon: CircleDot, name: 'Amuleto' },
}

// Iconos de respaldo (Fallback) más temáticos
export const SLOT_ICONS = {
  weapon: '⚔️', offhand: '🛡️', helmet: '🪖', chest: '🥋',
  legs: '🦵', boots: '🥾', gloves: '🧤', ring: '💍',
  earring: '✨', necklace: '🧿',
};