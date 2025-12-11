import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Hammer, ArrowUp, Package, Coins } from 'lucide-react';
import { Button } from '../ui/button';
import { RECIPES, MATERIAL_TYPES, UPGRADE_COSTS, canCraft } from '@/engine/systems/CraftingSystem';
import { getItemIcon } from '@/data/icons';

// Helpers visuales
const rarityColors = {
  common: 'text-slate-400',
  uncommon: 'text-green-400',
  rare: 'text-blue-400',
  epic: 'text-purple-400',
  legendary: 'text-yellow-400',
};

const IconWrapper = ({ item, className }) => {
  const Icon = getItemIcon(item);
  return <Icon className={className} />;
};

export default function CraftingPanel({ 
  isOpen, onClose, materials, inventory, equipment, gold, onCraft, onUpgrade, npc 
}) {
  const [activeMode, setActiveMode] = useState('craft'); // 'craft', 'upgrade', 'materials'
  const [currentDialogue, setCurrentDialogue] = useState('');

  // Configuración inicial del diálogo
  useEffect(() => {
    if (npc) {
      setCurrentDialogue(npc.dialogue?.greeting || "¡A trabajar el acero!");
    } else {
      // Fallback por si se abre sin NPC (futuro)
      setCurrentDialogue("Mesa de trabajo lista.");
    }
  }, [npc, isOpen]);

  if (!isOpen) return null;

  const equippedItems = Object.entries(equipment || {})
    .filter(([_, item]) => item)
    .map(([slot, item]) => ({ ...item, slot }));

  // Handlers con feedback de diálogo
  const handleCraft = (key, name) => {
    onCraft(key);
    setCurrentDialogue(`¡${name} forjado con éxito! Una pieza magnífica.`);
    setTimeout(() => setCurrentDialogue(npc?.dialogue?.greeting || "Listo para más trabajo."), 2500);
  };

  const handleUpgrade = (slot, name) => {
    onUpgrade(slot);
    setCurrentDialogue(`¡He reforzado tu ${name}! Ahora es más letal.`);
    setTimeout(() => setCurrentDialogue(npc?.dialogue?.greeting || "Listo para más trabajo."), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-lg overflow-hidden border shadow-2xl bg-slate-900 rounded-2xl border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* --- HEADER: NPC INFO --- */}
        <div className="relative p-6 pb-2 text-center border-b border-slate-800 bg-gradient-to-b from-slate-800/50 to-slate-900">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 mb-3 text-4xl border-2 rounded-full shadow-lg bg-slate-950" 
                 style={{ borderColor: npc?.color || '#f97316', color: npc?.color || '#f97316' }}>
              {npc ? npc.symbol : <Hammer />}
            </div>
            <h2 className="text-xl font-bold text-white">{npc ? npc.name : "Forja"}</h2>
            <p className="text-xs font-medium tracking-wider uppercase text-slate-500">
              {npc ? 'Herrero Maestro' : 'Estación de Crafteo'}
            </p>
          </div>
        </div>

        {/* --- DIALOGUE BUBBLE --- */}
        <div className="px-6 py-4 bg-slate-900">
          <div className="relative p-4 border rounded-xl bg-slate-800/60 border-slate-700/50">
            <div className="absolute w-4 h-4 rotate-45 border-t border-l -top-2 left-1/2 -translate-x-1/2 bg-slate-800 border-slate-700/50"></div>
            <p className="text-sm italic leading-relaxed text-center text-slate-300">
              "{currentDialogue}"
            </p>
          </div>
        </div>

        {/* --- ACTION BAR --- */}
        <div className="px-6 pb-2 flex gap-2">
          <ActionButton 
            icon={Hammer} 
            label="Forjar" 
            isActive={activeMode === 'craft'} 
            onClick={() => setActiveMode('craft')} 
            color="text-orange-400"
          />
          <ActionButton 
            icon={ArrowUp} 
            label="Mejorar" 
            isActive={activeMode === 'upgrade'} 
            onClick={() => setActiveMode('upgrade')} 
            color="text-emerald-400"
          />
          <ActionButton 
            icon={Package} 
            label="Materiales" 
            isActive={activeMode === 'materials'} 
            onClick={() => setActiveMode('materials')} 
            color="text-blue-400"
          />
        </div>

        {/* --- CONTENT AREA --- */}
        <div className="px-6 pb-6 h-[280px] overflow-y-auto custom-scrollbar border-t border-slate-800/50 pt-4 bg-slate-950/30">
          
          {/* MODO: FORJAR (CRAFT) */}
          {activeMode === 'craft' && (
            <div className="space-y-2">
              {Object.entries(RECIPES).map(([key, recipe]) => {
                const canMake = canCraft(recipe, inventory);
                const resultItem = { ...recipe, templateKey: key };
                
                return (
                  <div key={key} className={`p-2 rounded border transition-colors ${canMake ? 'bg-slate-800/60 border-slate-600 hover:border-slate-500' : 'bg-slate-900/40 border-slate-800 opacity-60'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-md bg-slate-900 border border-slate-700 ${rarityColors[recipe.rarity]}`}>
                           <IconWrapper item={resultItem} className="w-6 h-6" />
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${rarityColors[recipe.rarity]}`}>{recipe.name}</div>
                          {/* Lista de materiales requeridos */}
                          <div className="flex flex-wrap gap-2 text-[10px] text-slate-500 mt-1">
                            {Object.entries(recipe.materials).map(([matKey, count]) => {
                              const invItem = inventory.find(i => i.templateKey === matKey);
                              const have = invItem ? invItem.quantity : 0;
                              return (
                                <span key={matKey} className={`flex items-center gap-1 ${have >= count ? 'text-green-400' : 'text-red-400'}`}>
                                  {/* Icono pequeño del material */}
                                  <IconWrapper item={{category: 'material', templateKey: matKey}} className="w-3 h-3" />
                                  {have}/{count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-7 text-xs bg-orange-700 hover:bg-orange-600 border-orange-600"
                        disabled={!canMake}
                        onClick={() => handleCraft(key, recipe.name)}
                      >
                        Crear
                      </Button>
                    </div>
                    {/* Stats Preview */}
                    <div className="text-[10px] text-slate-400 mt-2 pl-12 border-t border-slate-700/50 pt-1 flex gap-2">
                      {recipe.result.attack && <span className="text-orange-300">ATK +{recipe.result.attack}</span>}
                      {recipe.result.defense && <span className="text-blue-300">DEF +{recipe.result.defense}</span>}
                      {recipe.result.maxHp && <span className="text-pink-300">HP +{recipe.result.maxHp}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          {/* MODO: MEJORAR (UPGRADE) */}
          {activeMode === 'upgrade' && (
            <div className="space-y-2">
              {equippedItems.length === 0 ? (
                <div className="py-8 text-center text-slate-600 text-sm">Equipa objetos para poder mejorarlos.</div>
              ) : (
                equippedItems.map(item => {
                  const level = item.upgradeLevel || 0;
                  const nextCost = UPGRADE_COSTS[level + 1];
                  const canUpgrade = level < 5 && nextCost && gold >= nextCost.gold;
                  
                  return (
                    <div key={item.slot} className="p-2 border rounded-lg bg-slate-800/60 border-slate-700">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md bg-slate-900 border border-slate-700 ${rarityColors[item.rarity]}`}>
                             <IconWrapper item={item} className="w-6 h-6" />
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${rarityColors[item.rarity]}`}>
                              {item.name} <span className="text-yellow-500 text-xs">+{level}</span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {item.stats?.attack && `ATK +${item.stats.attack} `}
                              {item.stats?.defense && `DEF +${item.stats.defense}`}
                            </div>
                          </div>
                        </div>
                        
                        {level < 5 && nextCost ? (
                          <Button
                            size="sm"
                            className="h-7 text-xs bg-emerald-700 hover:bg-emerald-600 border-emerald-600 flex flex-col items-center justify-center leading-none py-1"
                            disabled={!canUpgrade}
                            onClick={() => handleUpgrade(item.slot, item.name)}
                          >
                            <span className="font-bold">+1</span>
                            <span className="text-[9px] opacity-80 flex items-center gap-0.5">
                               <Coins className="w-2 h-2" /> {nextCost.gold}
                            </span>
                          </Button>
                        ) : (
                          <span className="text-xs font-bold text-yellow-500 px-3">MAX</span>
                        )}
                      </div>

                      {/* Materiales requeridos para mejora */}
                      {nextCost && level < 5 && (
                        <div className="mt-2 pl-12 pt-1 border-t border-slate-700/50 flex flex-wrap gap-2 text-[10px]">
                          {Object.entries(nextCost.materials).map(([matKey, count]) => {
                            const invItem = inventory.find(i => i.templateKey === matKey);
                            const have = invItem ? invItem.quantity : 0;
                            return (
                              <span key={matKey} className={`flex items-center gap-1 ${have >= count ? 'text-green-400' : 'text-red-400'}`}>
                                <IconWrapper item={{category: 'material', templateKey: matKey}} className="w-3 h-3" />
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
          
          {/* MODO: MATERIALES */}
          {activeMode === 'materials' && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(MATERIAL_TYPES).map(([key, mat]) => {
                const invItem = inventory.find(i => i.templateKey === key);
                const count = invItem ? invItem.quantity : 0;
                const matItemDummy = { category: 'material', templateKey: key };

                return (
                  <div key={key} className="flex items-center gap-2 p-2 border rounded-lg bg-slate-800/40 border-slate-700/50">
                    <div className="p-1.5 rounded bg-slate-900 border border-slate-700 text-slate-400">
                        <IconWrapper item={matItemDummy} className="w-5 h-5" />
                    </div>
                    <div>
                      <div className={`text-xs font-medium ${rarityColors[mat.rarity]}`}>{mat.name}</div>
                      <div className="text-sm font-bold text-white">{count}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Subcomponente de botón de acción (reutilizado)
function ActionButton({ icon: Icon, label, isActive, onClick, color }) {
  return (
    <button
      onClick={onClick}
      className={`flex-1 flex flex-col items-center justify-center py-2 px-1 rounded-lg transition-all ${
        isActive 
          ? 'bg-slate-800 border border-slate-600 shadow-inner' 
          : 'bg-transparent hover:bg-slate-800/50 border border-transparent'
      }`}
    >
      <Icon className={`w-5 h-5 mb-1 ${isActive ? color : 'text-slate-500'}`} />
      <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-white' : 'text-slate-500'}`}>
        {label}
      </span>
    </button>
  );
}