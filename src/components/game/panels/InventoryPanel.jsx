import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sword, Shield, Heart, Zap, Coins, Trash2, Check, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { EQUIPMENT_SLOTS, SLOT_ICONS, canClassEquip, getMissingRequirement, canAssignToQuickSlot } from '../systems/ItemSystem'; // <-- CORREGIDO
import { drawItemSprite } from '../entities/ItemSprites'; // <-- CORREGIDO: ../entities/

function ItemIcon({ item, size = 48 }) {
  const canvasRef = useRef(null);
  
  useEffect(() => {
    if (canvasRef.current && item) {
      const ctx = canvasRef.current.getContext('2d');
      ctx.clearRect(0, 0, size, size);
      drawItemSprite(ctx, item, 0, 0, size);
    }
  }, [item, size]);
  
  if (!item) return null;
  
  return <canvas ref={canvasRef} width={size} height={size} className="mx-auto" />;
}

export default function InventoryPanel({ 
  isOpen, 
  onClose, 
  inventory, 
  equipment, 
  onUseItem, 
  onEquipItem, 
  onUnequipItem,
  onDropItem,
  player,
  onAssignQuickSlot,
  quickSlots = []
}) {
  const [selectedItem, setSelectedItem] = useState(null);
  const [activeTab, setActiveTab] = useState('inventory');

  if (!isOpen) return null;

  const getRarityColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'border-slate-500 bg-slate-800/50';
      case 'uncommon': return 'border-green-500 bg-green-900/30';
      case 'rare': return 'border-blue-500 bg-blue-900/30';
      case 'epic': return 'border-purple-500 bg-purple-900/30';
      case 'legendary': return 'border-yellow-500 bg-yellow-900/30';
      default: return 'border-slate-500 bg-slate-800/50';
    }
  };

  const getRarityTextColor = (rarity) => {
    switch (rarity) {
      case 'common': return 'text-slate-300';
      case 'uncommon': return 'text-green-400';
      case 'rare': return 'text-blue-400';
      case 'epic': return 'text-purple-400';
      case 'legendary': return 'text-yellow-400';
      default: return 'text-slate-300';
    }
  };

  const getClassName = (playerClass) => {
    const classNames = { warrior: 'Guerrero', mage: 'Mago', rogue: 'Pícaro' };
    return classNames[playerClass] || 'Aventurero';
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-slate-900 rounded-2xl border border-amber-900/50 w-full max-w-4xl max-h-[90vh] overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header - Medieval Fantasy Style */}
        <div className="flex items-center justify-between p-4 border-b border-amber-900/50 bg-gradient-to-r from-slate-900 via-amber-950/30 to-slate-900">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 border rounded-lg bg-amber-900/40 border-amber-700/50">
              <span className="text-xl">⚔</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-amber-200">{player?.name || 'Héroe'}</h2>
              <p className="text-xs text-amber-600/80">{getClassName(player?.class)} • Nivel {player?.level || 1}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-400 hover:text-amber-400">
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setActiveTab('inventory')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'inventory' 
                ? 'text-amber-400 border-b-2 border-amber-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Objetos ({inventory?.length || 0}/20)
          </button>
          <button
            onClick={() => setActiveTab('equipment')}
            className={`flex-1 py-3 text-sm font-medium transition-colors ${
              activeTab === 'equipment' 
                ? 'text-amber-400 border-b-2 border-amber-400' 
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Equipamiento
          </button>
        </div>

        <div className="p-4 overflow-y-auto max-h-[65vh]">
          {activeTab === 'inventory' && (
            <div className="space-y-4">
              {/* Inventory Grid - 2 rows of 10 */}
              <div className="grid grid-cols-10 gap-1.5">
                {(inventory || []).map((item, index) => (
                  <button
                    key={item?.id || index}
                    onClick={() => setSelectedItem(selectedItem?.index === index ? null : { ...item, index })}
                    className={`relative aspect-square rounded-md border-2 p-0.5 transition-all ${
                      getRarityColor(item?.rarity)
                    } ${selectedItem?.index === index ? 'ring-2 ring-amber-400 scale-105' : 'hover:brightness-125'}`}
                  >
                    {item?.symbol && (
                      <div className="flex items-center justify-center w-full h-full text-lg">
                        {item.symbol}
                      </div>
                    )}
                    {item?.quantity > 1 && (
                      <span className="absolute bottom-0 right-0 text-[9px] font-bold text-white bg-black/80 px-0.5 rounded">
                        {item.quantity}
                      </span>
                    )}
                    {item?.upgradeLevel > 0 && (
                      <span className="absolute top-0 right-0 text-[8px] font-bold text-amber-400 bg-black/80 px-0.5 rounded">
                        +{item.upgradeLevel}
                      </span>
                    )}
                  </button>
                ))}
                {/* Empty slots */}
                {Array(Math.max(0, 20 - (inventory?.length || 0))).fill(null).map((_, i) => (
                  <div 
                    key={`empty-${i}`}
                    className="border rounded-md aspect-square border-slate-700/40 bg-slate-900/30"
                  />
                ))}
              </div>

              {/* Selected Item Details */}
              <AnimatePresence>
                {selectedItem && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    className={`rounded-xl border-2 p-4 ${getRarityColor(selectedItem.rarity)}`}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className={`text-lg font-bold ${getRarityTextColor(selectedItem.rarity)}`}>
                          {selectedItem.name}
                        </h3>
                        <p className="text-xs capitalize text-slate-400">{selectedItem.rarity} {selectedItem.category}</p>
                      </div>
                      <span className="text-3xl">{selectedItem.symbol}</span>
                    </div>
                    
                    <p className="mb-3 text-sm text-slate-300">{selectedItem.description}</p>
                    
                    {/* Stats */}
                    {selectedItem.stats && (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {selectedItem.stats.attack && (
                          <span className="px-2 py-1 text-xs text-red-400 rounded bg-red-500/20">
                            +{selectedItem.stats.attack} Ataque
                          </span>
                        )}
                        {selectedItem.stats.defense && (
                          <span className="px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400">
                            +{selectedItem.stats.defense} Defensa
                          </span>
                        )}
                        {selectedItem.stats.health && (
                          <span className="px-2 py-1 text-xs text-green-400 rounded bg-green-500/20">
                            +{selectedItem.stats.health} Vida
                          </span>
                        )}
                        {selectedItem.stats.mana && (
                          <span className="px-2 py-1 text-xs text-blue-400 rounded bg-blue-500/20">
                            +{selectedItem.stats.mana} Maná
                          </span>
                        )}
                        {selectedItem.stats.maxHp && (
                          <span className="px-2 py-1 text-xs text-pink-400 rounded bg-pink-500/20">
                            +{selectedItem.stats.maxHp} Vida Máx
                          </span>
                        )}
                        {selectedItem.stats.maxHpBoost && (
                          <span className="px-2 py-1 text-xs text-pink-400 rounded bg-pink-500/20">
                            +{selectedItem.stats.maxHpBoost} Vida Máx (perm)
                          </span>
                        )}
                        {selectedItem.stats.attackBoost && (
                          <span className="px-2 py-1 text-xs text-orange-400 rounded bg-orange-500/20">
                            +{selectedItem.stats.attackBoost} ATK (perm)
                          </span>
                        )}
                        {selectedItem.stats.defenseBoost && (
                          <span className="px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400">
                            +{selectedItem.stats.defenseBoost} DEF (perm)
                          </span>
                        )}
                        {selectedItem.stats.tempAttack && (
                          <span className="px-2 py-1 text-xs text-orange-400 rounded bg-orange-500/20">
                            +{selectedItem.stats.tempAttack}% DMG ({selectedItem.stats.duration}t)
                          </span>
                        )}
                        {selectedItem.stats.tempDefense && (
                          <span className="px-2 py-1 text-xs rounded bg-cyan-500/20 text-cyan-400">
                            +{selectedItem.stats.tempDefense}% DEF ({selectedItem.stats.duration}t)
                          </span>
                        )}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      {['potion', 'scroll', 'food'].includes(selectedItem.category) && (
                        <>
                          <Button 
                            size="sm" 
                            className="bg-green-600 hover:bg-green-500"
                            onClick={() => {
                              onUseItem(selectedItem.index);
                              setSelectedItem(null);
                            }}
                          >
                            <Heart className="w-4 h-4 mr-1" /> Usar
                          </Button>
                          {/* Quick slot assignment */}
                          {canAssignToQuickSlot(selectedItem) && onAssignQuickSlot && (
                            <div className="flex gap-1">
                              {['Q', 'E', 'R'].map((key, slotIdx) => (
                                <Button
                                  key={key}
                                  size="sm"
                                  variant="outline"
                                  className="w-8 h-8 p-0 text-xs border-amber-700 hover:bg-amber-900/30"
                                  onClick={() => {
                                    onAssignQuickSlot(slotIdx, selectedItem.id);
                                    setSelectedItem(null);
                                  }}
                                  title={`Asignar a slot ${key}`}
                                >
                                  {key}
                                </Button>
                              ))}
                            </div>
                          )}
                        </>
                      )}
                      {(selectedItem.category === 'weapon' || selectedItem.category === 'armor' || selectedItem.category === 'accessory' || selectedItem.slot) && (() => {
                        const canEquip = canClassEquip(selectedItem, player?.class, player);
                        const missing = getMissingRequirement(selectedItem, player);
                        return (
                          <Button 
                            size="sm" 
                            className={`${canEquip ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-600 cursor-not-allowed'}`}
                            disabled={!canEquip}
                            onClick={() => {
                              if (canEquip) {
                                onEquipItem(selectedItem.index);
                                setSelectedItem(null);
                              }
                            }}
                            title={missing ? `Necesitas ${missing.required} ${missing.attribute}` : (!canClassEquip(selectedItem, player?.class, null) ? 'Tu clase no puede equipar esto' : '')}
                          >
                            <Check className="w-4 h-4 mr-1" /> {canEquip ? 'Equipar' : (missing ? `${missing.attribute}: ${missing.current}/${missing.required}` : 'No disponible')}
                          </Button>
                        );
                      })()}
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => {
                          onDropItem(selectedItem.index);
                          setSelectedItem(null);
                        }}
                      >
                        <Trash2 className="w-4 h-4 mr-1" /> Soltar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {activeTab === 'equipment' && (
            <div className="flex gap-4">
              {/* Left side - Stats */}
              <div className="w-48 space-y-3">
                <div className="p-3 border bg-slate-800/50 rounded-xl border-slate-700">
                  <h4 className="mb-3 text-sm font-bold text-amber-300">Estadísticas</h4>
                  
                  {/* Combat Stats */}
                  <div className="space-y-2">
                    <StatRow icon="†" label="Ataque" value={(player?.baseAttack || 8) + (player?.equipAttack || 0)} color="text-red-400" />
                    <StatRow icon="⛨" label="Defensa" value={(player?.baseDefense || 3) + (player?.equipDefense || 0)} color="text-cyan-400" />
                    <StatRow icon="♥" label="Vida" value={`${player?.hp || 0}/${player?.maxHp || 50}`} color="text-pink-400" />
                    <StatRow icon="◆" label="Maná" value={`${player?.mp || 0}/${player?.maxMp || 30}`} color="text-blue-400" />
                  </div>
                  
                  <div className="my-3 border-t border-slate-700" />
                  
                  {/* Attributes */}
                  <h4 className="mb-2 text-xs font-medium text-slate-400">Atributos</h4>
                  <div className="space-y-1">
                    <StatRow icon="↑" label="Fuerza" value={player?.strength || 0} color="text-red-300" small />
                    <StatRow icon="»" label="Destreza" value={player?.dexterity || 0} color="text-green-300" small />
                    <StatRow icon="✧" label="Inteligencia" value={player?.intelligence || 0} color="text-blue-300" small />
                  </div>
                  
                  <div className="my-3 border-t border-slate-700" />
                  
                  {/* Equipment Bonuses */}
                  <h4 className="mb-2 text-xs font-medium text-slate-400">Bonos de Equipo</h4>
                  <div className="space-y-1">
                    <StatRow icon="†" label="ATK" value={`+${calculateEquipmentBonus(equipment, 'attack')}`} color="text-red-400" small />
                    <StatRow icon="⛨" label="DEF" value={`+${calculateEquipmentBonus(equipment, 'defense')}`} color="text-cyan-400" small />
                    <StatRow icon="♥" label="Vida" value={`+${calculateEquipmentBonus(equipment, 'maxHp')}`} color="text-pink-400" small />
                    {calculateEquipmentBonus(equipment, 'evasion') > 0 && (
                      <StatRow icon="»" label="Evasión" value={`+${calculateEquipmentBonus(equipment, 'evasion')}`} color="text-green-400" small />
                    )}
                    {calculateEquipmentBonus(equipment, 'critChance') > 0 && (
                      <StatRow icon="⚡" label="Crítico" value={`+${calculateEquipmentBonus(equipment, 'critChance')}%`} color="text-yellow-400" small />
                    )}
                  </div>
                </div>
                
                {/* Gold */}
                <div className="flex items-center justify-between p-3 border rounded-lg bg-amber-900/20 border-amber-800/50">
                  <span className="text-lg text-amber-400">●</span>
                  <span className="font-bold text-amber-300">{player?.gold || 0} Oro</span>
                </div>
              </div>
              
              {/* Right side - Equipment Slots */}
              <div className="flex-1">
                <div className="p-4 border bg-slate-800/30 rounded-xl border-slate-700">
                  <h4 className="mb-4 text-sm font-bold text-center text-amber-300">Equipamiento</h4>
                  
                  <div className="grid max-w-sm grid-cols-3 gap-3 mx-auto">
                    {/* Row 1: Head */}
                    <div />
                    <EquipSlot slot="helmet" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    <div />
                    
                    {/* Row 2: Earring, Chest, Necklace */}
                    <EquipSlot slot="earring" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    <EquipSlot slot="chest" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    <EquipSlot slot="necklace" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    
                    {/* Row 3: Weapon, Gloves, Offhand */}
                    <EquipSlot slot="weapon" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    <EquipSlot slot="gloves" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    <EquipSlot slot="offhand" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    
                    {/* Row 4: Ring, Legs, (empty) */}
                    <EquipSlot slot="ring" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    <EquipSlot slot="legs" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    <div />
                    
                    {/* Row 5: Boots centered */}
                    <div />
                    <EquipSlot slot="boots" equipment={equipment} onUnequip={onUnequipItem} getRarityColor={getRarityColor} getRarityTextColor={getRarityTextColor} />
                    <div />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 text-center border-t border-slate-700">
          <p className="text-xs text-slate-500">Pulsa [I] para cerrar • [Q/E/R] Slots rápidos</p>
        </div>
      </motion.div>
    </motion.div>
  );
}

function StatRow({ icon, label, value, color, small = false }) {
  return (
    <div className={`flex items-center justify-between ${small ? 'text-xs' : 'text-sm'}`}>
      <div className="flex items-center gap-2">
        <span className={`${color} ${small ? 'text-xs' : 'text-sm'}`}>{icon}</span>
        <span className="text-slate-400">{label}</span>
      </div>
      <span className={`font-bold ${color}`}>{value}</span>
    </div>
  );
}

function calculateEquipmentBonus(equipment, stat) {
  if (!equipment) return 0;
  return Object.values(equipment).reduce((total, item) => {
    if (item?.stats?.[stat]) {
      return total + item.stats[stat];
    }
    return total;
  }, 0);
}

// Equipment slot component with medieval icons
function EquipSlot({ slot, equipment, onUnequip, getRarityColor, getRarityTextColor }) {
  const equipped = equipment?.[slot];
  const icon = SLOT_ICONS?.[slot] || '?';
  const slotName = EQUIPMENT_SLOTS[slot]?.name || slot;
  
  return (
    <div 
      className={`relative rounded-lg border-2 p-2 min-h-[70px] transition-all hover:brightness-110 cursor-pointer ${
        equipped ? getRarityColor(equipped.rarity) : 'border-slate-600/50 bg-slate-800/30'
      }`}
      onClick={() => equipped && onUnequip(slot)}
      title={equipped ? `${equipped.name} - Click para desequipar` : slotName}
    >
      <div className="flex flex-col items-center justify-center h-full text-center">
        <div className={`text-2xl mb-1 ${equipped ? '' : 'opacity-40'}`}>
          {equipped?.symbol || icon}
        </div>
        <p className={`text-[10px] truncate w-full font-medium ${equipped ? getRarityTextColor(equipped.rarity) : 'text-slate-500'}`}>
          {equipped ? equipped.name : slotName}
        </p>
        {equipped && equipped.stats && (
          <div className="flex flex-wrap justify-center gap-1 mt-1">
            {equipped.stats.attack && <span className="text-[8px] text-orange-400">+{equipped.stats.attack}†</span>}
            {equipped.stats.defense && <span className="text-[8px] text-cyan-400">+{equipped.stats.defense}⛨</span>}
            {equipped.stats.maxHp && <span className="text-[8px] text-pink-400">+{equipped.stats.maxHp}♥</span>}
          </div>
        )}
      </div>
      {equipped && (
        <button 
          className="absolute top-1 right-1 w-4 h-4 bg-red-900/80 rounded text-red-300 hover:bg-red-800 text-[10px] flex items-center justify-center"
          onClick={(e) => { e.stopPropagation(); onUnequip(slot); }}
        >
          ✕
        </button>
      )}
    </div>
  );
}