import { applyClassBonus, CLASS_COMBAT_BONUSES } from './src/engine/systems/CombatSystem.js';

console.log('Bonuses:', CLASS_COMBAT_BONUSES);
const res = applyClassBonus(100, 'rogue', 'melee', true);
console.log('Result:', res);
