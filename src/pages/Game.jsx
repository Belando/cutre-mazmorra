import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import GameBoard from '@/components/game/GameBoard';
import PlayerStats from '@/components/game/PlayerStats';
import MessageLog from '@/components/game/MessageLog';
import GameOver from '@/components/game/GameOver';

import MiniMap from '@/components/game/MiniMap';
import InventoryPanel from '@/components/game/InventoryPanel';
import { generateDungeon, TILE, ENTITY, ENEMY_STATS, scaleEnemyStats } from '@/components/game/DungeonGenerator';
import { 
  addToInventory, 
  useItem, 
  equipItem, 
  unequipItem, 
  generateLevelItems,
  calculatePlayerStats,
  canClassEquip
} from '@/components/game/ItemSystem';
import QuickSlots, { useQuickSlot, assignToQuickSlot, QUICK_SLOT_HOTKEYS } from '@/components/game/QuickSlots';
import { getWeaponRange, isRangedWeapon, calculateEquipmentStats } from '@/components/game/EquipmentSystem';
import { getRangedTargets as getCombatRangedTargets, executeRangedAttack as executeCombatRangedAttack, applyClassBonus } from '@/components/game/CombatSystem';
import SkillBar from '@/components/game/SkillBar';
import NPCDialog from '@/components/game/NPCDialog';
import { generateNPCs, QUESTS, checkQuestProgress } from '@/components/game/NPCSystem';
import CharacterSelect, { PLAYER_APPEARANCES } from '@/components/game/CharacterSelect';
import { processEnemyTurn, calculateEnemyDamage, isRangedEnemy as isEnemyRanged, getEnemyRange, getEnemyRangedInfo } from '@/components/game/EnemyAI';
import { generateMaterialDrop, generateBossDrop, craftItem, upgradeItem, MATERIAL_TYPES } from '@/components/game/CraftingSystem';
import CraftingPanel from '@/components/game/CraftingPanel';
import { getRangedTargets, executeRangedAttack, isRangedEnemy, hasLineOfSight } from '@/components/game/RangedCombat';
import { 
  SKILLS,
  initializeSkills, 
  useSkill, 
  canUseSkill, 
  updateCooldowns,
  updateBuffs,
  calculateBuffBonuses,
  getUnlockedSkills,
  getLearnableSkills,
  learnSkill,
  upgradeSkill,
  canEvolve,
  evolveClass,
  SKILL_TREES
} from '@/components/game/SkillSystem';
import { saveGame, loadGame, hasSaveGame, deleteSave, formatSaveDate } from '@/components/game/SaveSystem';
import SkillTree from '@/components/game/SkillTree';

const MAP_WIDTH = 50;
const MAP_HEIGHT = 35;

export default function Game() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState(null);
  const [messages, setMessages] = useState([]);
  const [gameOver, setGameOver] = useState(false);
  const [stats, setStats] = useState({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [selectedSkill, setSelectedSkill] = useState(null);
  const [playerName, setPlayerName] = useState('');
  const [showNameInput, setShowNameInput] = useState(true);
  const [activeNPC, setActiveNPC] = useState(null);
  const [activeQuests, setActiveQuests] = useState([]);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [questProgress, setQuestProgress] = useState({});
  const [materials, setMaterials] = useState({});
  const [craftingOpen, setCraftingOpen] = useState(false);
  const [rangedMode, setRangedMode] = useState(false);
  const [rangedTargets, setRangedTargets] = useState([]);
  const [selectedAppearance, setSelectedAppearance] = useState(null);
  const [playerClass, setPlayerClass] = useState('warrior');
  const [quickSlots, setQuickSlots] = useState([null, null, null]);
  const [skillTreeOpen, setSkillTreeOpen] = useState(false);

  const addMessage = useCallback((text, type = 'info') => {
    setMessages(prev => [...prev.slice(-50), { text, type }]);
  }, []);

  const initGame = useCallback((level = 1, existingPlayer = null, existingInventory = null, existingEquipment = null) => {
    const dungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, level);
    
    // Base attributes by class
    const classAttributes = {
      warrior: { strength: 10, dexterity: 5, intelligence: 3 },
      mage: { strength: 3, dexterity: 5, intelligence: 10 },
      rogue: { strength: 5, dexterity: 10, intelligence: 3 },
    };
    const baseAttrs = classAttributes[playerClass] || classAttributes.warrior;
    
    const player = existingPlayer || {
      x: dungeon.playerStart.x,
      y: dungeon.playerStart.y,
      hp: 50,
      maxHp: 50,
      mp: 30,
      maxMp: 30,
      attack: 8,
      baseAttack: 8,
      defense: 3,
      baseDefense: 3,
      equipAttack: 0,
      equipDefense: 0,
      equipMaxHp: 0,
      exp: 0,
      level: 1,
      gold: 0,
      name: playerName || 'Héroe',
      floor: level,
      appearance: selectedAppearance,
      class: playerClass,
      // Attributes
      strength: baseAttrs.strength,
      dexterity: baseAttrs.dexterity,
      intelligence: baseAttrs.intelligence,
    };
    
    if (existingPlayer) {
      player.x = dungeon.playerStart.x;
      player.y = dungeon.playerStart.y;
      player.floor = level;
    }
    
    // Generate NPCs
    const npcs = generateNPCs(level, dungeon.rooms, dungeon.map, [0, dungeon.rooms.length - 1]);

    // Initialize inventory and equipment
    const inventory = existingInventory || [];
    const equipment = existingEquipment || {
      weapon: null,
      offhand: null,
      helmet: null,
      chest: null,
      legs: null,
      boots: null,
      gloves: null,
      ring: null,
      earring: null,
      necklace: null,
    };
    
    // Initialize skills based on class
    const skills = existingPlayer?.skills || initializeSkills(playerClass);

    // Convert entities to enemy list
    const enemies = [];
    
    // Scale enemies based on player level
    const playerLvl = existingPlayer?.level || 1;
    for (let y = 0; y < dungeon.entities.length; y++) {
      for (let x = 0; x < dungeon.entities[0].length; x++) {
        const entity = dungeon.entities[y][x];
        if (entity >= ENTITY.ENEMY_RAT) {
          const baseStats = ENEMY_STATS[entity];
          if (baseStats) {
            const scaledStats = scaleEnemyStats(baseStats, playerLvl, level);
            enemies.push({
              x, y,
              type: entity,
              hp: scaledStats.hp,
              maxHp: scaledStats.hp,
              attack: scaledStats.attack,
              defense: scaledStats.defense,
              exp: scaledStats.exp,
              isBoss: baseStats.isBoss || false,
              stunned: 0,
            });
          }
        }
      }
    }

    // Use items from dungeon generator
    const items = dungeon.items || [];
    const chests = dungeon.chests || [];
    const torches = dungeon.torches || [];

    // Initialize visibility
    const visible = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
    const explored = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));

    // Preserve skills from existing player
    if (existingPlayer) {
      player.skills = skills;
    } else {
      player.skills = skills;
    }

    const newState = {
      map: dungeon.map,
      entities: dungeon.entities,
      enemies,
      items,
      chests,
      torches,
      npcs,
      player,
      inventory,
      equipment,
      visible,
      explored,
      stairs: dungeon.stairs,
      stairsUp: dungeon.stairsUp,
      level,
      bossDefeated: false,
      questProgress,
      materials,
    };

    updateVisibility(newState);
    setGameState(newState);
    
    if (level === 1) {
      addMessage(`¡Bienvenido, ${player.name}! Encuentra las escaleras (▼) para descender.`, 'info');
      addMessage('Pulsa [I] para inventario. Habla con NPCs acercándote.', 'info');
    } else {
      addMessage(`Desciendes al piso ${level}...`, 'info');
    }
  }, [addMessage, playerName, questProgress, selectedAppearance, playerClass]);

  const updateVisibility = (state) => {
    const { player, map, visible, explored } = state;
    const radius = 6;

    // Reset visible
    for (let y = 0; y < MAP_HEIGHT; y++) {
      for (let x = 0; x < MAP_WIDTH; x++) {
        visible[y][x] = false;
      }
    }

    // Simple raycasting FOV
    for (let angle = 0; angle < 360; angle += 2) {
      const rad = angle * Math.PI / 180;
      const dx = Math.cos(rad);
      const dy = Math.sin(rad);

      let x = player.x + 0.5;
      let y = player.y + 0.5;

      for (let i = 0; i < radius; i++) {
        const tileX = Math.floor(x);
        const tileY = Math.floor(y);

        if (tileX < 0 || tileX >= MAP_WIDTH || tileY < 0 || tileY >= MAP_HEIGHT) break;

        visible[tileY][tileX] = true;
        explored[tileY][tileX] = true;

        if (map[tileY][tileX] === TILE.WALL) break;

        x += dx;
        y += dy;
      }
    }
  };

  const moveEnemies = useCallback((state) => {
    const { enemies, player, map, visible } = state;
    const playerStats = calculatePlayerStats(player);
    const buffBonuses = calculateBuffBonuses(player.skills?.buffs || [], playerStats);
    const totalDefense = playerStats.defense + buffBonuses.defenseBonus;

    enemies.forEach(enemy => {
      // Use tactical AI
      const action = processEnemyTurn(enemy, player, enemies, map, visible, addMessage);
      
      if (action.action === 'melee_attack') {
        const enemyStats = ENEMY_STATS[enemy.type];
        const dmgResult = calculateEnemyDamage(enemy, player, playerStats, player.skills?.buffs || []);
        if (dmgResult.evaded) {
          addMessage(`¡Esquivaste el ataque de ${enemyStats.name}!`, 'info');
        } else {
          state.player.hp -= dmgResult.damage;
          const bossPrefix = enemy.isBoss ? '👑 ' : '';
          addMessage(`${bossPrefix}${enemyStats.name} te golpea por ${dmgResult.damage} de daño!`, 'enemy_damage');
        }
      } else if (action.action === 'ranged_attack') {
        const enemyStats = ENEMY_STATS[enemy.type];
        const rangedInfo = getEnemyRangedInfo(enemy.type);
        const baseDmg = Math.floor(enemy.attack * 0.7);
        const dmgResult = calculateEnemyDamage({...enemy, attack: baseDmg}, player, playerStats, player.skills?.buffs || []);
        if (dmgResult.evaded) {
          addMessage(`¡Esquivaste ${rangedInfo?.name || 'el ataque'} de ${enemyStats.name}!`, 'info');
        } else {
          state.player.hp -= dmgResult.damage;
          const attackName = rangedInfo?.name || 'ataca';
          addMessage(`${enemyStats.name} usa ${attackName}: ${dmgResult.damage} daño!`, 'enemy_damage');
        }
      }
    });
  }, [addMessage]);

  const handleMove = useCallback((dx, dy) => {
    if (!gameState || gameOver || inventoryOpen) return;

    setGameState(prevState => {
      const state = JSON.parse(JSON.stringify(prevState));
      const { player, map, enemies, items, chests, inventory, stairs } = state;
      const playerStats = calculatePlayerStats(player);
      const buffBonuses = calculateBuffBonuses(player.skills?.buffs || [], playerStats);
      const totalAttack = playerStats.attack + buffBonuses.attackBonus;

      const newX = player.x + dx;
      const newY = player.y + dy;

      // Check bounds
      if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return prevState;

      // Check wall
      if (map[newY][newX] === TILE.WALL) return prevState;

      // Check for enemy
      const enemyIndex = enemies.findIndex(e => e.x === newX && e.y === newY);
      if (enemyIndex !== -1) {
        const enemy = enemies[enemyIndex];
        const enemyStats = ENEMY_STATS[enemy.type];
        
        // Use skill if selected
        let damage;
        if (selectedSkill && canUseSkill(selectedSkill, player.skills?.cooldowns || {})) {
          const skill = SKILLS[selectedSkill];
          if (skill && (skill.type === 'melee' || skill.type === 'ranged')) {
            const skillResult = useSkill(selectedSkill, player, { attack: totalAttack, defense: playerStats.defense }, enemy, enemies, state.visible);
            if (skillResult.success) {
              player.skills.cooldowns[selectedSkill] = skillResult.cooldown;
              skillResult.damages.forEach(d => {
                d.target.hp -= d.damage;
                if (d.stun) d.target.stunned = d.stun;
              });
              addMessage(skillResult.message, 'player_damage');
              damage = 0; // Damage already applied
              setSelectedSkill(null);
            } else {
              damage = Math.max(1, totalAttack - enemy.defense + Math.floor(Math.random() * 4));
            }
          } else {
            damage = Math.max(1, totalAttack - enemy.defense + Math.floor(Math.random() * 4));
          }
        } else {
          damage = Math.max(1, totalAttack - enemy.defense + Math.floor(Math.random() * 4));
        }
        
        if (damage > 0) {
          enemy.hp -= damage;
          const bossPrefix = enemy.isBoss ? '👑 ' : '';
          addMessage(`¡Golpeas a ${bossPrefix}${enemyStats.name} por ${damage} de daño!`, 'player_damage');
        }

        if (enemy.hp <= 0) {
          const wasBoss = enemy.isBoss;
          enemies.splice(enemyIndex, 1);
          player.exp += enemyStats.exp;
          const bossPrefix = wasBoss ? '👑 ' : '';
          addMessage(`¡${bossPrefix}${enemyStats.name} derrotado! +${enemyStats.exp} XP`, 'death');
          setStats(s => ({ ...s, kills: s.kills + 1 }));
          
          if (wasBoss) {
            state.bossDefeated = true;
            addMessage('🎉 ¡JEFE DERROTADO! Las escaleras están accesibles.', 'levelup');
            
            // Boss material drops
            const bossDrops = generateBossDrop(enemy.type, state.level);
            bossDrops.forEach(drop => {
              setMaterials(prev => ({
                ...prev,
                [drop.type]: (prev[drop.type] || 0) + drop.count
              }));
              const matName = MATERIAL_TYPES[drop.type]?.name || drop.type;
              addMessage(`+${drop.count} ${matName}`, 'pickup');
            });
          }
          
          // Regular material drops
          const matDrops = generateMaterialDrop(enemy.type, state.level);
          matDrops.forEach(drop => {
            setMaterials(prev => ({
              ...prev,
              [drop.type]: (prev[drop.type] || 0) + drop.count
            }));
          });
          
          // Update quest progress for kill quests
          const entityKey = Object.keys(ENTITY).find(k => ENTITY[k] === enemy.type);
          const enemyType = entityKey?.startsWith('ENEMY_') ? entityKey : `ENEMY_${entityKey?.replace('ENEMY_', '')}`;
          const bossType = entityKey?.startsWith('BOSS_') ? entityKey : null;
          
          activeQuests.forEach(qId => {
            const quest = QUESTS[qId];
            if (!quest) return;
            
            // Kill quests
            if (quest.targetType === 'kill' && quest.target === enemyType) {
              setQuestProgress(prev => ({
                ...prev,
                [qId]: (prev[qId] || 0) + 1
              }));
            }
            
            // Multi-kill quests
            if (quest.targetType === 'multi_kill' && quest.targets) {
              const matchingTarget = quest.targets.find(t => t.target === enemyType);
              if (matchingTarget) {
                setQuestProgress(prev => ({
                  ...prev,
                  [qId]: {
                    ...(prev[qId] || {}),
                    [enemyType]: ((prev[qId]?.[enemyType]) || 0) + 1
                  }
                }));
              }
            }
            
            // Boss quests
            if (quest.targetType === 'boss' && bossType && quest.target === bossType) {
              setQuestProgress(prev => ({
                ...prev,
                [qId]: 1
              }));
            }
          });

          // Level up check
          const expNeeded = player.level * 25;
          if (player.exp >= expNeeded) {
            player.level++;
            player.exp -= expNeeded;
            player.maxHp += 10;
            player.hp = Math.min(player.hp + 15, player.maxHp);
            player.maxMp += 5;
            player.mp = Math.min(player.mp + 10, player.maxMp);
            player.baseAttack += 2;
            player.baseDefense += 1;
            
            // Attribute growth based on class
            const attrGrowth = {
              warrior: { strength: 3, dexterity: 1, intelligence: 1 },
              mage: { strength: 1, dexterity: 1, intelligence: 3 },
              rogue: { strength: 1, dexterity: 3, intelligence: 1 },
            };
            const growth = attrGrowth[player.class] || attrGrowth.warrior;
            player.strength = (player.strength || 10) + growth.strength;
            player.dexterity = (player.dexterity || 5) + growth.dexterity;
            player.intelligence = (player.intelligence || 3) + growth.intelligence;
            
            // Grant skill point on level up
            player.skills = player.skills || initializeSkills(player.class);
            player.skills.skillPoints = (player.skills.skillPoints || 0) + 1;
            
            addMessage(`¡NIVEL ${player.level}! +1 punto habilidad`, 'levelup');
            setStats(s => ({ ...s, playerLevel: player.level }));
            
            // Check for evolution at level 10
            if (player.level === 10 && !player.skills.evolvedClass) {
              addMessage('¡Puedes EVOLUCIONAR tu clase! Pulsa [T] para ver opciones.', 'levelup');
            }
            
            // Check for new skill unlocks based on class (and evolved class)
            const learnableSkills = getLearnableSkills(player.level, player.class, player.skills?.learned || [], player.skills?.evolvedClass);
            learnableSkills.forEach(skill => {
              player.skills.learned.push(skill.id);
              player.skills.skillLevels = player.skills.skillLevels || {};
              player.skills.skillLevels[skill.id] = 1;
              addMessage(`¡Nueva habilidad: ${skill.icon} ${skill.name}!`, 'levelup');
            });
          }
        }
      } else {
        // Move player
        player.x = newX;
        player.y = newY;

        // Check for chest to loot
        const chestIndex = chests.findIndex(c => c.x === newX && c.y === newY && !c.opened);
        if (chestIndex !== -1) {
          const chest = chests[chestIndex];
          chest.opened = true;
          
          const item = chest.item;
          // Try to add to inventory
          const result = addToInventory(inventory, item);
          if (result.success) {
            addMessage(`¡Abres el cofre y encuentras ${item.name}!`, 'pickup');
          } else {
            // Drop item on ground if inventory full
            item.x = newX;
            item.y = newY;
            items.push(item);
            addMessage(`¡Cofre abierto! Inventario lleno. ${item.name} en el suelo.`, 'info');
          }
        }
        
        // Check for loose item pickup (gold piles or dropped items)
        const itemIndex = items.findIndex(i => i.x === newX && i.y === newY);
        if (itemIndex !== -1) {
          const item = items[itemIndex];
          
          // Handle gold directly
          if (item.category === 'currency') {
            player.gold += item.value;
            addMessage(`¡Recogiste ${item.value} de oro!`, 'pickup');
            setStats(s => ({ ...s, gold: s.gold + item.value }));
            items.splice(itemIndex, 1);
          } else {
            // Try to add to inventory
            const result = addToInventory(inventory, item);
            if (result.success) {
              if (result.stacked) {
                addMessage(`Recogiste ${item.name} (apilado).`, 'pickup');
              } else {
                addMessage(`¡Recogiste ${item.name}!`, 'pickup');
              }
              items.splice(itemIndex, 1);
            } else {
              addMessage(`Inventario lleno. No puedes recoger ${item.name}.`, 'info');
            }
          }
        }

        // Check for stairs down
        if (newX === stairs.x && newY === stairs.y) {
          const bossAlive = enemies.some(e => e.isBoss);
          if (bossAlive) {
            addMessage('⚠️ ¡Derrota al jefe antes de descender!', 'info');
          } else {
            addMessage('Pulsa ENTER para bajar las escaleras...', 'info');
          }
        }
        
        // Check for stairs up
        if (state.stairsUp && newX === state.stairsUp.x && newY === state.stairsUp.y) {
          addMessage('Pulsa SHIFT+ENTER para subir las escaleras...', 'info');
        }
        
        // Check for NPC interaction
        const npc = state.npcs?.find(n => n.x === newX && n.y === newY);
        if (npc) {
          setActiveNPC(npc);
          addMessage(`Hablas con ${npc.name}.`, 'info');
          return prevState; // Don't move onto NPC
        }
      }
      
      // Regenerate 1 mana per turn
      player.mp = Math.min((player.mp || 0) + 1, player.maxMp || 30);
      
      // Update cooldowns and buffs
      if (player.skills) {
        player.skills.cooldowns = updateCooldowns(player.skills.cooldowns || {});
        player.skills.buffs = updateBuffs(player.skills.buffs || []);
      }

      // Move enemies
      moveEnemies(state);

      // Update visibility
      updateVisibility(state);

      // Check player death
      if (player.hp <= 0) {
        setGameOver(true);
        addMessage('Has sido derrotado...', 'death');
      }

      return state;
    });
  }, [gameState, gameOver, inventoryOpen, addMessage, moveEnemies, selectedSkill]);

  const handleDescend = useCallback((goUp = false) => {
    if (!gameState || inventoryOpen) return;
    const { player, stairs, stairsUp, level, inventory, equipment, enemies } = gameState;
    
    if (goUp && stairsUp) {
      // Going up
      if (player.x === stairsUp.x && player.y === stairsUp.y && level > 1) {
        const newLevel = level - 1;
        initGame(newLevel, player, inventory, equipment);
        addMessage(`Subes al piso ${newLevel}...`, 'info');
      }
      return;
    }
    
    // Going down - check if boss is defeated
    const bossAlive = enemies.some(e => e.isBoss);
    if (bossAlive) {
      addMessage('⚠️ ¡Derrota al jefe primero!', 'info');
      return;
    }
    
    if (player.x === stairs.x && player.y === stairs.y) {
      const newLevel = level + 1;
      setStats(s => ({ ...s, maxLevel: Math.max(s.maxLevel, newLevel) }));
      initGame(newLevel, player, inventory, equipment);
    }
  }, [gameState, inventoryOpen, initGame, addMessage]);

  const handleWait = useCallback(() => {
    if (!gameState || gameOver || inventoryOpen) return;
    
    setGameState(prevState => {
      const state = JSON.parse(JSON.stringify(prevState));
      const { player, enemies } = state;
      const playerStats = calculatePlayerStats(player);
      const buffBonuses = calculateBuffBonuses(player.skills?.buffs || [], playerStats);
      
      // Check if using a self/aoe/ultimate/ranged skill
      if (selectedSkill && canUseSkill(selectedSkill, player.skills?.cooldowns || {})) {
        const skill = SKILLS[selectedSkill];
        const manaCost = skill?.manaCost || 5;
        
        if (skill && (skill.type === 'self' || skill.type === 'aoe' || skill.type === 'ultimate' || skill.type === 'ranged')) {
          // Check mana for non-self skills
          if (skill.type !== 'self' && (player.mp || 0) < manaCost) {
            addMessage(`¡Sin maná! (${manaCost} necesario)`, 'info');
          } else {
            const totalAttack = playerStats.attack + buffBonuses.attackBonus;
            
            // For ranged skills, find nearest visible enemy in range
            let target = null;
            if (skill.type === 'ranged') {
              const range = skill.range || 5;
              const visibleEnemies = enemies.filter(e => {
                const dist = Math.abs(e.x - player.x) + Math.abs(e.y - player.y);
                return state.visible[e.y]?.[e.x] && dist <= range;
              });
              if (visibleEnemies.length > 0) {
                // Target nearest enemy
                visibleEnemies.sort((a, b) => {
                  const distA = Math.abs(a.x - player.x) + Math.abs(a.y - player.y);
                  const distB = Math.abs(b.x - player.x) + Math.abs(b.y - player.y);
                  return distA - distB;
                });
                target = visibleEnemies[0];
              } else {
                addMessage('¡Sin objetivos en rango!', 'info');
                return state;
              }
            }
            
            const skillResult = useSkill(selectedSkill, player, { attack: totalAttack, defense: playerStats.defense }, target, enemies, state.visible);
            
            if (skillResult.success) {
              player.skills.cooldowns[selectedSkill] = skillResult.cooldown;
              
              // Consume mana for non-self skills
              if (skill.type !== 'self') {
                player.mp = Math.max(0, (player.mp || 0) - manaCost);
              }
              
              if (skillResult.heal) {
                player.hp = Math.min(player.hp + skillResult.heal, player.maxHp);
              }
              if (skillResult.buff) {
                player.skills.buffs = player.skills.buffs || [];
                player.skills.buffs.push(skillResult.buff);
              }
              if (skillResult.damages) {
                skillResult.damages.forEach(d => {
                  const enemyIdx = enemies.findIndex(e => e.x === d.target.x && e.y === d.target.y);
                  if (enemyIdx !== -1) {
                    enemies[enemyIdx].hp -= d.damage;
                    if (d.stun) enemies[enemyIdx].stunned = d.stun;
                    if (d.slow) enemies[enemyIdx].slowed = d.slow;
                    if (enemies[enemyIdx].hp <= 0) {
                      const defeatedEnemy = enemies[enemyIdx];
                      const enemyStats = ENEMY_STATS[defeatedEnemy.type];
                      player.exp += enemyStats.exp;
                      if (defeatedEnemy.isBoss) {
                        state.bossDefeated = true;
                        addMessage('🎉 ¡JEFE DERROTADO!', 'levelup');
                      }
                      enemies.splice(enemyIdx, 1);
                      setStats(s => ({ ...s, kills: s.kills + 1 }));
                    }
                  }
                });
              }
              
              addMessage(skillResult.message, skillResult.heal ? 'heal' : 'player_damage');
              setSelectedSkill(null);
            }
          }
        }
      } else {
        addMessage('Esperas...', 'info');
      }
      
      // Update cooldowns and buffs
      if (player.skills) {
        player.skills.cooldowns = updateCooldowns(player.skills.cooldowns || {});
        player.skills.buffs = updateBuffs(player.skills.buffs || []);
      }
      
      moveEnemies(state);
      updateVisibility(state);
      
      if (state.player.hp <= 0) {
        setGameOver(true);
      }
      
      return state;
    });
  }, [gameState, gameOver, inventoryOpen, moveEnemies, addMessage, selectedSkill]);

  // Inventory handlers
  const handleUseItem = useCallback((index) => {
    setGameState(prevState => {
      const state = JSON.parse(JSON.stringify(prevState));
      const result = useItem(state.inventory, index, state.player);
      
      if (result.success) {
        result.effects.forEach(effect => addMessage(effect, 'heal'));
      } else {
        addMessage(result.message, 'info');
      }
      
      return state;
    });
  }, [addMessage]);

  const handleEquipItem = useCallback((index) => {
    setGameState(prevState => {
      const state = JSON.parse(JSON.stringify(prevState));
      const result = equipItem(state.inventory, index, state.equipment, state.player);
      
      addMessage(result.message, result.success ? 'pickup' : 'info');
      
      return state;
    });
  }, [addMessage]);

  const handleUnequipItem = useCallback((slot) => {
    setGameState(prevState => {
      const state = JSON.parse(JSON.stringify(prevState));
      const result = unequipItem(state.equipment, slot, state.inventory, state.player);
      
      addMessage(result.message, result.success ? 'info' : 'info');
      
      return state;
    });
  }, [addMessage]);

  const handleDropItem = useCallback((index) => {
    setGameState(prevState => {
      const state = JSON.parse(JSON.stringify(prevState));
      const item = state.inventory[index];
      
      if (item) {
        // Place item on ground near player
        item.x = state.player.x;
        item.y = state.player.y;
        state.items.push(item);
        state.inventory.splice(index, 1);
        addMessage(`Soltaste ${item.name}.`, 'info');
      }
      
      return state;
    });
  }, [addMessage]);

  const handleRestart = () => {
    setGameOver(false);
    setMessages([]);
    setStats({ maxLevel: 1, kills: 0, gold: 0, playerLevel: 1 });
    setInventoryOpen(false);
    setSelectedSkill(null);
    setActiveQuests([]);
    setCompletedQuests([]);
    setQuestProgress({});
    setMaterials({});
    setCraftingOpen(false);
    setRangedMode(false);
    setRangedTargets([]);
    setShowNameInput(true);
    setSelectedAppearance(null);
    setPlayerClass('warrior');
    setQuickSlots([null, null, null]);
    setGameStarted(false);
  };
  
  // Quick slot handlers
  const handleUseQuickSlot = useCallback((slotIndex) => {
    if (!gameState) return;
    
    const result = useQuickSlot(quickSlots, slotIndex, gameState.inventory, gameState.player);
    if (result.clearSlot) {
      setQuickSlots(prev => {
        const newSlots = [...prev];
        newSlots[slotIndex] = null;
        return newSlots;
      });
      return;
    }
    
    if (result.success) {
      handleUseItem(result.itemIndex);
    } else {
      addMessage(result.message, 'info');
    }
  }, [gameState, quickSlots, addMessage, handleUseItem]);
  
  const handleAssignQuickSlot = useCallback((slotIndex, itemId) => {
    setQuickSlots(prev => assignToQuickSlot(prev, slotIndex, itemId));
  }, []);
  
  // NPC handlers
  const handleBuyItem = useCallback((item) => {
    setGameState(prev => {
      const state = JSON.parse(JSON.stringify(prev));
      if (state.player.gold >= item.price) {
        state.player.gold -= item.price;
        const newItem = {
          ...item,
          id: `${item.id}_${Date.now()}`,
          templateKey: item.id,
          description: item.stats?.health ? 'Restaura vida.' : 'Equipo comprado.',
          stackable: item.category === 'potion',
          quantity: 1,
        };
        addToInventory(state.inventory, newItem);
        addMessage(`Compraste ${item.name} por ${item.price} oro.`, 'pickup');
      }
      return state;
    });
  }, []);
  
  const handleSellItem = useCallback((index, price) => {
    setGameState(prev => {
      const state = JSON.parse(JSON.stringify(prev));
      const item = state.inventory[index];
      if (item) {
        state.player.gold += price;
        state.inventory.splice(index, 1);
        addMessage(`Vendiste ${item.name} por ${price} oro.`, 'pickup');
      }
      return state;
    });
  }, [addMessage]);
  
  const handleAcceptQuest = useCallback((quest) => {
    if (!activeQuests.includes(quest.id)) {
      setActiveQuests(prev => [...prev, quest.id]);
      addMessage(`Nueva misión: ${quest.name}`, 'levelup');
    }
  }, [activeQuests, addMessage]);
  
  const handleCompleteQuest = useCallback((quest) => {
    if (quest.reward) {
      setGameState(prev => {
        const state = JSON.parse(JSON.stringify(prev));
        if (quest.reward.gold) state.player.gold += quest.reward.gold;
        if (quest.reward.exp) state.player.exp += quest.reward.exp;
        if (quest.reward.item) {
          const rewardItem = {
            ...quest.reward.item,
            id: `quest_reward_${Date.now()}`,
            category: quest.reward.item.slot ? 'armor' : 'misc',
            quantity: 1,
          };
          addToInventory(state.inventory, rewardItem);
        }
        return state;
      });
      let rewardMsg = `¡Misión completada! +${quest.reward.gold || 0} oro, +${quest.reward.exp || 0} XP`;
      if (quest.reward.item) rewardMsg += ` +${quest.reward.item.name}`;
      addMessage(rewardMsg, 'levelup');
    }
    setActiveQuests(prev => prev.filter(q => q !== quest.id));
    setCompletedQuests(prev => [...prev, quest.id]);
    setQuestProgress(prev => { const p = {...prev}; delete p[quest.id]; return p; });
  }, [addMessage]);
  
  // Crafting handlers
  const handleCraft = useCallback((recipeKey) => {
    const result = craftItem(recipeKey, materials, gameState?.inventory || []);
    if (result.success) {
      setMaterials({...materials});
      setGameState(prev => ({...prev}));
      addMessage(result.message, 'pickup');
      
      // Update craft quest progress
      if (result.item && ['rare', 'epic', 'legendary'].includes(result.item.rarity)) {
        activeQuests.forEach(qId => {
          const quest = QUESTS[qId];
          if (quest?.targetType === 'craft') {
            setQuestProgress(prev => ({
              ...prev,
              [qId]: (prev[qId] || 0) + 1
            }));
          }
        });
      }
    } else {
      addMessage(result.message, 'info');
    }
  }, [materials, gameState, addMessage, activeQuests]);
  
  const handleUpgrade = useCallback((slot) => {
    if (!gameState?.equipment?.[slot]) return;
    const result = upgradeItem(gameState.equipment[slot], materials, gameState.player.gold);
    if (result.success) {
      setMaterials({...materials});
      setGameState(prev => {
        const state = JSON.parse(JSON.stringify(prev));
        state.player.gold -= result.goldCost;
        return state;
      });
      addMessage(result.message, 'levelup');
    } else {
      addMessage(result.message, 'info');
    }
  }, [gameState, materials, addMessage]);
  
  // Ranged combat
  const handleRangedAttack = useCallback((targetIndex) => {
    if (!gameState || !rangedMode) return;
    
    const ammo = gameState.inventory.find(i => i.category === 'ammo' && i.quantity > 0);
    if (!ammo) {
      addMessage('Sin munición para ataque a distancia.', 'info');
      setRangedMode(false);
      return;
    }
    
    const target = rangedTargets[targetIndex];
    if (!target) return;
    
    setGameState(prev => {
      const state = JSON.parse(JSON.stringify(prev));
      const result = executeRangedAttack(state.player, target, ammo, state.map);
      
      if (result.success && result.hit) {
        const enemyIdx = state.enemies.findIndex(e => e.x === target.x && e.y === target.y);
        if (enemyIdx !== -1) {
          state.enemies[enemyIdx].hp -= result.damage;
          
          // Apply effects
          result.effects?.forEach(effect => {
            if (effect.type === 'slow') {
              state.enemies[enemyIdx].slowed = effect.duration;
            }
          });
          
          if (state.enemies[enemyIdx].hp <= 0) {
            const defeatedEnemy = state.enemies[enemyIdx];
            const enemyStats = ENEMY_STATS[defeatedEnemy.type];
            state.player.exp += enemyStats.exp;
            state.enemies.splice(enemyIdx, 1);
            addMessage(`${enemyStats.name} derrotado a distancia!`, 'death');
          }
        }
        addMessage(result.message, 'player_damage');
      } else if (result.success) {
        addMessage(result.message, 'info');
      }
      
      // Update ammo in inventory
      const ammoIdx = state.inventory.findIndex(i => i.id === ammo.id);
      if (ammoIdx !== -1) {
        if (state.inventory[ammoIdx].quantity <= 0) {
          state.inventory.splice(ammoIdx, 1);
        }
      }
      
      return state;
    });
    
    setRangedMode(false);
    setRangedTargets([]);
  }, [gameState, rangedMode, rangedTargets, addMessage]);
  
  // Handle skill hotkeys
  const handleSkillHotkey = useCallback((index) => {
    if (!gameState) return;
    const unlockedSkills = getUnlockedSkills(gameState.player.level, gameState.player.skills?.learned || ['power_strike', 'heal']);
    if (index < unlockedSkills.length) {
      const skill = unlockedSkills[index];
      setSelectedSkill(prev => prev === skill.id ? null : skill.id);
    }
  }, [gameState]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!gameStarted || gameOver) return;

      // Toggle inventory
      if (e.key === 'i' || e.key === 'I') {
        e.preventDefault();
        setInventoryOpen(prev => !prev);
        return;
      }
      
      // Toggle crafting
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        setCraftingOpen(prev => !prev);
        return;
      }
      
      // Toggle skill tree
      if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setSkillTreeOpen(prev => !prev);
        return;
      }
      
      // Save game
      if (e.key === 'g' || e.key === 'G') {
        e.preventDefault();
        if (gameState) {
          const result = saveGame(gameState, stats, activeQuests, completedQuests, questProgress, materials, quickSlots);
          addMessage(result.message, result.success ? 'levelup' : 'info');
        }
        return;
      }
      
      // Toggle ranged mode (with weapon range)
      if (e.key === 'r' || e.key === 'R') {
        e.preventDefault();
        if (gameState) {
          const weaponRange = getWeaponRange(gameState.equipment);
          if (weaponRange > 0) {
            const targets = getCombatRangedTargets(gameState.player, gameState.enemies, gameState.map, gameState.equipment);
            if (targets.length > 0) {
              setRangedMode(true);
              setRangedTargets(targets);
              addMessage(`${targets.length} objetivo(s) en rango (${weaponRange}). [1-9] para disparar.`, 'info');
            } else {
              addMessage('Sin objetivos en rango.', 'info');
            }
          } else {
            addMessage('Necesitas un arma a distancia (arco, bastón, varita).', 'info');
          }
        }
        return;
      }
      
      // Quick slot hotkeys
      if (QUICK_SLOT_HOTKEYS.includes(e.key.toLowerCase())) {
        e.preventDefault();
        const slotIndex = QUICK_SLOT_HOTKEYS.indexOf(e.key.toLowerCase());
        handleUseQuickSlot(slotIndex);
        return;
      }

      // Close panels with Escape
      if (e.key === 'Escape') {
        e.preventDefault();
        if (inventoryOpen) setInventoryOpen(false);
        if (craftingOpen) setCraftingOpen(false);
        if (skillTreeOpen) setSkillTreeOpen(false);
        if (rangedMode) { setRangedMode(false); setRangedTargets([]); }
        return;
      }

      // Don't process movement if panels are open
      if (inventoryOpen || craftingOpen) return;
      
      // Handle ranged target selection
      if (rangedMode && e.key >= '1' && e.key <= '9') {
        e.preventDefault();
        handleRangedAttack(parseInt(e.key) - 1);
        return;
      }

      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          handleMove(0, -1);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          handleMove(0, 1);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          handleMove(-1, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          handleMove(1, 0);
          break;
        case ' ':
          e.preventDefault();
          handleWait();
          break;
        case 'Enter':
          e.preventDefault();
          handleDescend(e.shiftKey);
          break;
        case '1':
        case '2':
        case '3':
        case '4':
        case '5':
        case '6':
          e.preventDefault();
          handleSkillHotkey(parseInt(e.key) - 1);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [gameStarted, gameOver, inventoryOpen, craftingOpen, skillTreeOpen, rangedMode, handleMove, handleWait, handleDescend, handleSkillHotkey, handleRangedAttack, handleUseQuickSlot, gameState, addMessage, stats, activeQuests, completedQuests, questProgress, materials, quickSlots]);

  const handleCharacterSelect = (appearanceKey, appearance) => {
    const name = (playerName && playerName.trim()) ? playerName.trim() : (appearance.name || 'Héroe');
    setPlayerName(name);
    setSelectedAppearance(appearanceKey);
    setPlayerClass(appearance.class);
    setShowNameInput(false);
    setGameStarted(true);
    
    // Initialize game with the selected class directly
    const dungeon = generateDungeon(MAP_WIDTH, MAP_HEIGHT, 1);
    const skills = initializeSkills(appearance.class);
    
    // Base attributes by class
    const classAttributes = {
      warrior: { strength: 10, dexterity: 5, intelligence: 3 },
      mage: { strength: 3, dexterity: 5, intelligence: 10 },
      rogue: { strength: 5, dexterity: 10, intelligence: 3 },
    };
    const baseAttrs = classAttributes[appearance.class] || classAttributes.warrior;
    
    const player = {
      x: dungeon.playerStart.x,
      y: dungeon.playerStart.y,
      hp: 50,
      maxHp: 50,
      mp: 30,
      maxMp: 30,
      attack: 8,
      baseAttack: 8,
      defense: 3,
      baseDefense: 3,
      equipAttack: 0,
      equipDefense: 0,
      equipMaxHp: 0,
      exp: 0,
      level: 1,
      gold: 0,
      name: name,
      floor: 1,
      appearance: appearanceKey,
      class: appearance.class,
      skills: skills,
      // Attributes
      strength: baseAttrs.strength,
      dexterity: baseAttrs.dexterity,
      intelligence: baseAttrs.intelligence,
    };
    
    const npcs = generateNPCs(1, dungeon.rooms, dungeon.map, [0, dungeon.rooms.length - 1]);
    const enemies = [];
    
    // Scale enemies based on player level (level 1 start)
    for (let y = 0; y < dungeon.entities.length; y++) {
      for (let x = 0; x < dungeon.entities[0].length; x++) {
        const entity = dungeon.entities[y][x];
        if (entity >= ENTITY.ENEMY_RAT) {
          const baseStats = ENEMY_STATS[entity];
          if (baseStats) {
            const scaledStats = scaleEnemyStats(baseStats, 1, 1);
            enemies.push({
              x, y,
              type: entity,
              hp: scaledStats.hp,
              maxHp: scaledStats.hp,
              attack: scaledStats.attack,
              defense: scaledStats.defense,
              exp: scaledStats.exp,
              isBoss: baseStats.isBoss || false,
              stunned: 0,
              slowed: 0,
            });
          }
        }
      }
    }

    const visible = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));
    const explored = Array(MAP_HEIGHT).fill(null).map(() => Array(MAP_WIDTH).fill(false));

    const newState = {
      map: dungeon.map,
      entities: dungeon.entities,
      enemies,
      items: dungeon.items || [],
      chests: dungeon.chests || [],
      torches: dungeon.torches || [],
      npcs,
      player,
      inventory: [],
      equipment: { weapon: null, offhand: null, helmet: null, chest: null, legs: null, boots: null, gloves: null, ring: null, earring: null, necklace: null },
      visible,
      explored,
      stairs: dungeon.stairs,
      stairsUp: dungeon.stairsUp,
      level: 1,
      bossDefeated: false,
    };

    updateVisibility(newState);
    setGameState(newState);
    addMessage(`¡Bienvenido, ${name} (${appearance.name})! Clase: ${appearance.class}`, 'info');
    addMessage('Pulsa [I] para inventario, [1-6] para habilidades.', 'info');
  };

  // Check for saved game on mount
  const handleLoadGame = useCallback(() => {
    const saveData = loadGame();
    if (saveData && saveData.gameState) {
      setPlayerName(saveData.gameState.player.name);
      setSelectedAppearance(saveData.gameState.player.appearance);
      setPlayerClass(saveData.gameState.player.class);
      setStats(saveData.stats);
      setActiveQuests(saveData.activeQuests || []);
      setCompletedQuests(saveData.completedQuests || []);
      setQuestProgress(saveData.questProgress || {});
      setMaterials(saveData.materials || {});
      setQuickSlots(saveData.quickSlots || [null, null, null]);
      
      // Reinitialize game with saved player data
      initGame(
        saveData.gameState.level, 
        saveData.gameState.player, 
        saveData.gameState.inventory, 
        saveData.gameState.equipment
      );
      setGameStarted(true);
      addMessage('¡Partida cargada!', 'levelup');
    }
  }, [initGame, addMessage]);

  if (!gameStarted) {
    const hasSave = hasSaveGame();
    
    return (
      <div className="flex items-center justify-center min-h-screen p-4 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
        <div className="flex flex-col items-center gap-4">
          <CharacterSelect 
            onSelect={handleCharacterSelect}
            playerName={playerName}
            onNameChange={setPlayerName}
          />
          {hasSave && (
            <div className="flex gap-2">
              <Button 
                onClick={handleLoadGame}
                className="bg-emerald-700 hover:bg-emerald-600"
              >
                📂 Cargar Partida
              </Button>
              <Button 
                onClick={() => { deleteSave(); window.location.reload(); }}
                variant="outline"
                className="text-red-400 border-red-800 hover:bg-red-900/20"
              >
                🗑 Borrar
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-2 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <div className="max-w-7xl mx-auto h-[calc(100vh-16px)]">
        <div className="flex h-full gap-2">
          {/* Panel izquierdo - Skills y Quick Slots vertical */}
          <div className="flex flex-col flex-shrink-0 w-20 gap-2">
            <SkillBar 
              skills={gameState?.player?.skills}
              playerLevel={gameState?.player?.level || 1}
              cooldowns={gameState?.player?.skills?.cooldowns || {}}
              onUseSkill={(skillId) => setSelectedSkill(skillId)}
              selectedSkill={selectedSkill}
              onSelectSkill={setSelectedSkill}
              disabled={inventoryOpen || gameOver}
              playerClass={gameState?.player?.class || playerClass}
            />
            <QuickSlots
              quickSlots={quickSlots}
              onUseSlot={handleUseQuickSlot}
              onAssignSlot={handleAssignQuickSlot}
              disabled={inventoryOpen || gameOver}
              inventory={gameState?.inventory || []}
            />
          </div>
          
          {/* Área principal del juego */}
          <div className="flex flex-col flex-1 min-w-0 gap-2 overflow-hidden">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-center"
            >
              <GameBoard gameState={gameState} viewportWidth={23} viewportHeight={15} />
            </motion.div>
            
            {/* Log de combate - mismo ancho que el canvas */}
            <div className="h-28 w-full max-w-[744px] mx-auto">
              <MessageLog messages={messages} />
            </div>
          </div>
          
          {/* Panel derecho - Stats y controles compactos */}
          <div className="flex flex-col flex-shrink-0 w-48 gap-2">
            <PlayerStats 
              player={gameState?.player} 
              dungeonLevel={gameState?.level}
              onOpenInventory={() => setInventoryOpen(true)}
              inventoryCount={gameState?.inventory?.length || 0}
              appearance={gameState?.player?.appearance || selectedAppearance}
              playerClass={gameState?.player?.class || playerClass}
            />
            <MiniMap gameState={gameState} />
            <div className="flex flex-col gap-1">
              <Button 
                onClick={() => setCraftingOpen(true)}
                className="w-full bg-amber-800/80 hover:bg-amber-700 h-6 text-[10px] border border-amber-700/50"
                disabled={gameOver}
              >
                ⚒ Artesanía [C]
              </Button>
              <Button 
                onClick={() => setSkillTreeOpen(true)}
                className="w-full bg-purple-900/80 hover:bg-purple-800 h-6 text-[10px] border border-purple-700/50"
                disabled={gameOver}
              >
                ✦ Habilidades [T]
              </Button>
              <Button 
                onClick={() => {
                  const result = saveGame(gameState, stats, activeQuests, completedQuests, questProgress, materials, quickSlots);
                  addMessage(result.message, result.success ? 'levelup' : 'info');
                }}
                className="w-full bg-slate-800/80 hover:bg-slate-700 h-6 text-[10px] border border-slate-600/50"
                disabled={gameOver || !gameState}
              >
                💾 Guardar [G]
              </Button>
              <div className="text-[8px] text-slate-600 text-center mt-1">
                WASD: Mover | ESPACIO: Esperar | R: Disparo
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Inventory Panel */}
      <AnimatePresence>
        {inventoryOpen && gameState && (
          <InventoryPanel
            isOpen={inventoryOpen}
            onClose={() => setInventoryOpen(false)}
            inventory={gameState.inventory}
            equipment={gameState.equipment}
            player={gameState.player}
            onUseItem={handleUseItem}
            onEquipItem={handleEquipItem}
            onUnequipItem={handleUnequipItem}
            onDropItem={handleDropItem}
            onAssignQuickSlot={handleAssignQuickSlot}
            quickSlots={quickSlots}
          />
        )}
      </AnimatePresence>
      
      {/* NPC Dialog */}
      <AnimatePresence>
        {activeNPC && gameState && (
          <NPCDialog
            npc={activeNPC}
            player={{ ...gameState.player, floor: gameState.level }}
            onClose={() => setActiveNPC(null)}
            onBuy={handleBuyItem}
            onSell={handleSellItem}
            onAcceptQuest={handleAcceptQuest}
            onCompleteQuest={handleCompleteQuest}
            activeQuests={activeQuests}
            completedQuests={completedQuests}
            questProgress={questProgress}
            gameState={{ ...gameState, questProgress, materials }}
            inventory={gameState.inventory}
          />
        )}
      </AnimatePresence>
      
      {/* Crafting Panel */}
      <AnimatePresence>
        {craftingOpen && gameState && (
          <CraftingPanel
            isOpen={craftingOpen}
            onClose={() => setCraftingOpen(false)}
            materials={materials}
            inventory={gameState.inventory}
            equipment={gameState.equipment}
            gold={gameState.player.gold}
            onCraft={handleCraft}
            onUpgrade={handleUpgrade}
          />
        )}
      </AnimatePresence>
      
      {/* Skill Tree Panel */}
      <AnimatePresence>
        {skillTreeOpen && gameState && (
          <SkillTree
            isOpen={skillTreeOpen}
            onClose={() => setSkillTreeOpen(false)}
            playerClass={gameState.player.class}
            playerLevel={gameState.player.level}
            learnedSkills={gameState.player.skills?.learned || []}
            skillLevels={gameState.player.skills?.skillLevels || {}}
            skillPoints={gameState.player.skills?.skillPoints || 0}
            evolvedClass={gameState.player.skills?.evolvedClass}
            onLearnSkill={(skillId) => {
              setGameState(prev => {
                const state = JSON.parse(JSON.stringify(prev));
                const result = learnSkill(state.player.skills, skillId);
                if (result.success) {
                  addMessage(result.message, 'levelup');
                }
                return state;
              });
            }}
            onUpgradeSkill={(skillId) => {
              setGameState(prev => {
                const state = JSON.parse(JSON.stringify(prev));
                const result = upgradeSkill(state.player.skills, skillId);
                if (result.success) {
                  addMessage(result.message, 'levelup');
                }
                return state;
              });
            }}
            onEvolve={(newClass) => {
              setGameState(prev => {
                const state = JSON.parse(JSON.stringify(prev));
                const result = evolveClass(state.player.skills, newClass);
                if (result.success) {
                  addMessage(result.message, 'levelup');
                  addMessage(`¡Nuevas habilidades de ${SKILL_TREES[newClass].name} disponibles!`, 'levelup');
                }
                return state;
              });
            }}
          />
        )}
      </AnimatePresence>
      
      {gameOver && (
        <GameOver stats={stats} onRestart={handleRestart} />
      )}
    </div>
  );
}