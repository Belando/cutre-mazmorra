import { ENTITY } from './constants';

export const ENEMY_STATS = {
  [ENTITY.ENEMY_RAT]: { name: 'Rata', hp: 6, attack: 2, defense: 0, exp: 3, symbol: 'r', color: '#a1a1aa', minLevel: 1 },
  [ENTITY.ENEMY_BAT]: { name: 'Murciélago', hp: 8, attack: 3, defense: 0, exp: 4, symbol: 'b', color: '#71717a', minLevel: 1 },
  [ENTITY.ENEMY_GOBLIN]: { name: 'Goblin', hp: 12, attack: 4, defense: 1, exp: 6, symbol: 'g', color: '#4ade80', minLevel: 1 },
  [ENTITY.ENEMY_SLIME]: { name: 'Slime', hp: 10, attack: 2, defense: 1, exp: 4, symbol: '○', color: '#22d3ee', minLevel: 1 },
  [ENTITY.ENEMY_SKELETON]: { name: 'Esqueleto', hp: 15, attack: 5, defense: 2, exp: 8, symbol: 's', color: '#e5e5e5', minLevel: 2 },
  [ENTITY.ENEMY_ORC]: { name: 'Orco', hp: 22, attack: 6, defense: 3, exp: 12, symbol: 'o', color: '#f97316', minLevel: 2 },
  [ENTITY.ENEMY_WOLF]: { name: 'Lobo Salvaje', hp: 16, attack: 7, defense: 2, exp: 10, symbol: 'w', color: '#78716c', minLevel: 2 },
  [ENTITY.ENEMY_SPIDER]: { name: 'Araña Gigante', hp: 18, attack: 7, defense: 2, exp: 10, symbol: 'S', color: '#7c3aed', minLevel: 3 },
  [ENTITY.ENEMY_ZOMBIE]: { name: 'Zombi', hp: 30, attack: 6, defense: 4, exp: 14, symbol: 'z', color: '#65a30d', minLevel: 3 },
  [ENTITY.ENEMY_CULTIST]: { name: 'Cultista', hp: 20, attack: 9, defense: 2, exp: 15, symbol: 'c', color: '#be123c', minLevel: 3 },
  [ENTITY.ENEMY_TROLL]: { name: 'Trol', hp: 40, attack: 9, defense: 5, exp: 22, symbol: 'T', color: '#a855f7', minLevel: 4 },
  [ENTITY.ENEMY_GOLEM]: { name: 'Gólem', hp: 50, attack: 8, defense: 8, exp: 28, symbol: 'G', color: '#78716c', minLevel: 4 },
  [ENTITY.ENEMY_WRAITH]: { name: 'Espectro', hp: 35, attack: 11, defense: 3, exp: 25, symbol: 'W', color: '#6366f1', minLevel: 5 },
  [ENTITY.ENEMY_VAMPIRE]: { name: 'Vampiro', hp: 45, attack: 12, defense: 4, exp: 32, symbol: 'V', color: '#7f1d1d', minLevel: 5 },
  [ENTITY.ENEMY_MIMIC]: { name: 'Mimico', hp: 38, attack: 14, defense: 5, exp: 35, symbol: 'M', color: '#92400e', minLevel: 5 },
  [ENTITY.ENEMY_DEMON]: { name: 'Demonio', hp: 55, attack: 13, defense: 6, exp: 35, symbol: 'D', color: '#ef4444', minLevel: 6 },
  [ENTITY.ENEMY_DRAGON]: { name: 'Dragón Joven', hp: 70, attack: 15, defense: 8, exp: 50, symbol: 'd', color: '#f59e0b', minLevel: 7 },
  
  // Jefes
  [ENTITY.BOSS_GOBLIN_KING]: { name: 'Rey Goblin', hp: 60, attack: 8, defense: 4, exp: 50, symbol: 'G', color: '#22c55e', isBoss: true, minLevel: 1 },
  [ENTITY.BOSS_SKELETON_LORD]: { name: 'Señor Esqueleto', hp: 80, attack: 10, defense: 5, exp: 70, symbol: 'L', color: '#fafafa', isBoss: true, minLevel: 2 },
  [ENTITY.BOSS_ORC_WARLORD]: { name: 'Señor de la Guerra Orco', hp: 100, attack: 12, defense: 6, exp: 90, symbol: 'O', color: '#ea580c', isBoss: true, minLevel: 3 },
  [ENTITY.BOSS_SPIDER_QUEEN]: { name: 'Reina Araña', hp: 90, attack: 14, defense: 5, exp: 100, symbol: 'Q', color: '#9333ea', isBoss: true, minLevel: 4 },
  [ENTITY.BOSS_GOLEM_KING]: { name: 'Rey Gólem', hp: 140, attack: 14, defense: 12, exp: 120, symbol: 'K', color: '#57534e', isBoss: true, minLevel: 4 },
  [ENTITY.BOSS_LICH]: { name: 'Liche', hp: 120, attack: 16, defense: 7, exp: 130, symbol: 'L', color: '#06b6d4', isBoss: true, minLevel: 5 },
  [ENTITY.BOSS_VAMPIRE_LORD]: { name: 'Señor Vampiro', hp: 130, attack: 17, defense: 6, exp: 145, symbol: 'V', color: '#991b1b', isBoss: true, minLevel: 5 },
  [ENTITY.BOSS_DEMON_LORD]: { name: 'Señor Demonio', hp: 150, attack: 18, defense: 8, exp: 160, symbol: 'D', color: '#dc2626', isBoss: true, minLevel: 6 },
  [ENTITY.BOSS_ANCIENT_DRAGON]: { name: 'Dragón Ancestral', hp: 200, attack: 22, defense: 10, exp: 250, symbol: 'D', color: '#fbbf24', isBoss: true, minLevel: 7 },
};

export const LARGE_ENEMIES = {
  106: { width: 2, height: 2, name: 'ancient_dragon' },
  105: { width: 2, height: 2, name: 'demon_lord' },
  108: { width: 2, height: 2, name: 'golem_king' },
  9: { width: 1, height: 1, scale: 1.3, name: 'troll' },
  12: { width: 1, height: 1, scale: 1.2, name: 'dragon' },
  16: { width: 1, height: 1, scale: 1.2, name: 'golem' },
};

export const ENEMY_RANGED_INFO = {
  3: { range: 4, name: 'Chillido', preferMelee: false },
  7: { range: 4, name: 'Telaraña', preferMelee: true },
  10: { range: 5, name: 'Rayo Espectral', preferMelee: false }, 
  11: { range: 5, name: 'Bola de Fuego', preferMelee: true },  
  12: { range: 6, name: 'Aliento de Fuego', preferMelee: true }, 
  15: { range: 6, name: 'Rayo Oscuro', preferMelee: false },   
  17: { range: 5, name: 'Drenar Vida', preferMelee: false },   
  104: { range: 7, name: 'Rayo de Hielo', preferMelee: false }, 
  105: { range: 6, name: 'Infierno', preferMelee: true },     
  106: { range: 8, name: 'Llamarada', preferMelee: true },    
  107: { range: 5, name: 'Drenar Almas', preferMelee: false }, 
};