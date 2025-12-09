import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Hammer, ArrowUp, Package } from 'lucide-react';
import { Button } from '../ui/button';
import { RECIPES, MATERIAL_TYPES, UPGRADE_COSTS, canCraft } from '@/engine/systems/CraftingSystem';
import { getItemIcon } from '@/data/icons'; // Importamos el helper de iconos

export default function CraftingPanel({ 
  isOpen, 
  onClose, 
  materials, 
  inventory, 
  equipment,
  gold,
  onCraft,
  onUpgrade,
}) {
  const [tab, setTab] = useState('craft');
  
  if (!isOpen) return null;
  
  const rarityColors = {
    common: 'text-slate-400',
    uncommon: 'text-green-400',
    rare: 'text-blue-400',
    epic: 'text-purple-400',
    legendary: 'text-yellow-400',
  };
  
  const equippedItems = Object.entries(equipment || {})
    .filter(([_, item]) => item)
    .map(([slot, item]) => ({ ...item, slot }));

  // Helper para renderizar iconos de forma segura
  const IconWrapper = ({ item, className }) => {
    const Icon = getItemIcon(item);
    return <Icon className={className} />;
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
        className="w-full max-w-lg overflow-hidden border bg-slate-900 rounded-xl border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <Hammer className="w-5 h-5 text-orange-400" />
            <h3 className="font-bold text-white">Artesanía y Mejoras</h3>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          <button
            onClick={() => setTab('craft')}
            className={`flex-1 py-2 text-xs font-medium ${tab === 'craft' ? 'text-orange-400 border-b-2 border-orange-400' : 'text-slate-400'}`}
          >
            <Hammer className="inline w-3 h-3 mr-1" />Crear
          </button>
          <button
            onClick={() => setTab('upgrade')}
            className={`flex-1 py-2 text-xs font-medium ${tab === 'upgrade' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400'}`}
          >
            <ArrowUp className="inline w-3 h-3 mr-1" />Mejorar
          </button>
          <button
            onClick={() => setTab('materials')}
            className={`flex-1 py-2 text-xs font-medium ${tab === 'materials' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
          >
            <Package className="inline w-3 h-3 mr-1" />Materiales
          </button>
        </div>
        
        {/* Content */}
        <div className="p-3 overflow-y-auto max-h-80">
          {tab === 'craft' && (
            <div className="space-y-2">
              {Object.entries(RECIPES).map(([key, recipe]) => {
                const canMake = canCraft(recipe, inventory); // Corregido: usa inventory, no materials
                
                // Construimos objetos dummy para obtener los iconos correctos
                const resultItem = { ...recipe, templateKey: key };
                
                return (
                  <div key={key} className={`p-2 rounded border ${canMake ? 'bg-slate-800/50 border-slate-600' : 'bg-slate-900/50 border-slate-800 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Icono del resultado */}
                        <div className={`p-1 rounded bg-slate-950/50 ${rarityColors[recipe.rarity]}`}>
                           <IconWrapper item={resultItem} className="w-6 h-6" />
                        </div>
                        
                        <div>
                          <p className={`text-xs font-medium ${rarityColors[recipe.rarity]}`}>{recipe.name}</p>
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-1">
                            {Object.entries(recipe.materials).map(([matKey, count]) => {
                              // Buscar en inventario la cantidad real
                              const invItem = inventory.find(i => i.templateKey === matKey);
                              const have = invItem ? invItem.quantity : 0;
                              // Dummy item para el icono del material
                              const matItemDummy = { category: 'material', templateKey: matKey };
                              
                              return (
                                <span key={matKey} className={`flex items-center gap-1 ${have >= count ? 'text-green-400' : 'text-red-400'}`}>
                                  <IconWrapper item={matItemDummy} className="w-3 h-3" /> 
                                  {have}/{count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-6 text-[10px]"
                        disabled={!canMake}
                        onClick={() => onCraft(key)}
                      >
                        Crear
                      </Button>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 pl-10">
                      {recipe.result.attack && `+${recipe.result.attack} ATK `}
                      {recipe.result.defense && `+${recipe.result.defense} DEF `}
                      {recipe.result.maxHp && `+${recipe.result.maxHp} Vida `}
                      {recipe.result.health && `Cura ${recipe.result.health} `}
                      {recipe.result.damage && `${recipe.result.damage} daño `}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {tab === 'upgrade' && (
            <div className="space-y-2">
              {equippedItems.length === 0 ? (
                <p className="py-4 text-xs text-center text-slate-500">Equipa items para mejorarlos</p>
              ) : (
                equippedItems.map(item => {
                  const level = item.upgradeLevel || 0;
                  const nextCost = UPGRADE_COSTS[level + 1];
                  const canUpgrade = level < 5 && nextCost && gold >= nextCost.gold;
                  
                  return (
                    <div key={item.slot} className="p-2 border rounded bg-slate-800/50 border-slate-600">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-1 rounded bg-slate-950/50 ${rarityColors[item.rarity]}`}>
                             <IconWrapper item={item} className="w-6 h-6" />
                          </div>
                          <div>
                            <p className={`text-xs font-medium ${rarityColors[item.rarity]}`}>
                              {item.name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Nivel {level}/5
                              {item.stats?.attack && ` | +${item.stats.attack} ATK`}
                              {item.stats?.defense && ` | +${item.stats.defense} DEF`}
                            </p>
                          </div>
                        </div>
                        {level < 5 && nextCost && (
                          <Button
                            size="sm"
                            className="h-6 text-[10px] bg-green-600 hover:bg-green-500"
                            disabled={!canUpgrade}
                            onClick={() => onUpgrade(item.slot)}
                          >
                            +1 ({nextCost.gold}g)
                          </Button>
                        )}
                        {level >= 5 && (
                          <span className="text-[10px] text-yellow-400">MAX</span>
                        )}
                      </div>
                      {nextCost && level < 5 && (
                        <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-2 pl-9">
                          Materiales: 
                          {Object.entries(nextCost.materials).map(([matKey, count]) => {
                            const invItem = inventory.find(i => i.templateKey === matKey);
                            const have = invItem ? invItem.quantity : 0;
                            const matItemDummy = { category: 'material', templateKey: matKey };
                            
                            return (
                              <span key={matKey} className={`flex items-center gap-1 ${have >= count ? 'text-green-400' : 'text-red-400'}`}>
                                <IconWrapper item={matItemDummy} className="w-3 h-3" />
                                {have}/{count}
                              </span>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          )}
          
          {tab === 'materials' && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MATERIAL_TYPES).map(([key, mat]) => {
                // Buscamos cantidad real en inventario
                const invItem = inventory.find(i => i.templateKey === key);
                const count = invItem ? invItem.quantity : 0;
                const matItemDummy = { category: 'material', templateKey: key };

                return (
                  <div key={key} className="flex items-center gap-2 p-2 border rounded bg-slate-800/50 border-slate-700">
                    <div className="p-1 rounded bg-slate-950/50 text-slate-400">
                        <IconWrapper item={matItemDummy} className="w-5 h-5" />
                    </div>
                    <div>
                      <p className={`text-xs ${rarityColors[mat.rarity]}`}>{mat.name}</p>
                      <p className="text-sm font-bold text-white">{count}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Footer */}
        <div className="p-2 text-center border-t border-slate-700 bg-slate-800/30">
          <p className="text-[10px] text-slate-500">Oro: {gold} | [ESC] para cerrar</p>
        </div>
      </motion.div>
    </motion.div>
  );
}