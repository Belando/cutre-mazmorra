import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Trash2, Shield, Sword, Heart, Zap, ChevronsRight, ArrowRight, ArrowDown } from 'lucide-react';
import { Button } from '../ui/button';
import { getItemIcon, EQUIPMENT_SLOTS } from '@/data/icons';
import { canClassEquip, getMissingRequirement, canAssignToQuickSlot } from '@/engine/systems/ItemSystem';
import { GiBackpack, GiCoins } from 'react-icons/gi';

// --- COMPONENTES AUXILIARES ---

const ItemSlot = ({ item, onClick, isSelected, isEmpty }) => {
  const Icon = getItemIcon(item);
  
  if (isEmpty) {
    return <div className="w-10 h-10 rounded bg-slate-950/50 border border-slate-800/60 shadow-inner" />;
  }

  const rarityStyles = {
    common: 'border-slate-600 bg-slate-800/80',
    uncommon: 'border-emerald-600 bg-emerald-950/60 text-emerald-400',
    rare: 'border-blue-600 bg-blue-950/60 text-blue-400 shadow-[0_0_10px_rgba(37,99,235,0.2)]',
    epic: 'border-purple-600 bg-purple-950/60 text-purple-400 shadow-[0_0_10px_rgba(147,51,234,0.2)]',
    legendary: 'border-amber-500 bg-amber-950/60 text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]',
  }[item.rarity] || 'border-slate-600';

  return (
    <button
      onClick={onClick}
      className={`relative w-10 h-10 rounded border-2 flex items-center justify-center transition-all group ${rarityStyles} ${isSelected ? 'ring-2 ring-white scale-110 z-10' : 'hover:scale-105 hover:brightness-110'}`}
    >
      <Icon className="w-6 h-6 drop-shadow-md" />
      {item.quantity > 1 && (
        <span className="absolute bottom-0 right-0 text-[9px] bg-black/90 px-1 rounded-tl text-white font-bold border-t border-l border-slate-700 leading-none">
          {item.quantity}
        </span>
      )}
      {item.upgradeLevel > 0 && (
        <span className="absolute top-0 left-0 text-[8px] text-yellow-300 font-bold drop-shadow-md leading-none bg-black/50 px-0.5 rounded">
          +{item.upgradeLevel}
        </span>
      )}
    </button>
  );
};

// Modificado: Recibe onSelect en lugar de onUnequip directo
const EquipSlot = ({ slotKey, equipment, onSelect, isSelected }) => {
  const item = equipment[slotKey];
  const slotInfo = EQUIPMENT_SLOTS[slotKey];
  const SlotIcon = slotInfo.icon;

  const styles = item ? ({
    common: 'border-slate-500 bg-slate-800',
    uncommon: 'border-emerald-500 bg-emerald-900/30 text-emerald-400',
    rare: 'border-blue-500 bg-blue-900/30 text-blue-400',
    epic: 'border-purple-500 bg-purple-900/30 text-purple-400',
    legendary: 'border-amber-500 bg-amber-900/30 text-amber-400',
  }[item.rarity]) : 'border-dashed border-slate-700 bg-slate-950/30 text-slate-700';

  return (
    <div 
      className={`relative w-14 h-14 rounded-lg border-2 flex items-center justify-center transition-all ${styles} 
      ${item ? 'cursor-pointer hover:brightness-110' : ''}
      ${isSelected ? 'ring-2 ring-white scale-105 z-10' : ''}`}
      onClick={() => item && onSelect(item)}
      title={item ? item.name : slotInfo.name}
    >
      {item ? <div className="text-3xl"><ItemIconWrapper item={item} /></div> : <SlotIcon className="w-8 h-8 opacity-20" />}
    </div>
  );
};

const ItemIconWrapper = ({ item }) => {
  const Icon = getItemIcon(item);
  return <Icon />;
};

const StatRow = ({ label, value, icon, color }) => (
  <div className="flex justify-between items-center p-1.5 rounded hover:bg-white/5 transition-colors">
    <div className={`flex items-center gap-2 text-xs ${color || 'text-slate-400'}`}>
      {icon} {label}
    </div>
    <span className="font-bold text-white text-sm">{value}</span>
  </div>
);

// --- COMPONENTE PRINCIPAL ---

export default function InventoryPanel({ 
  isOpen, onClose, inventory, equipment, player,
  onUseItem, onEquipItem, onUnequipItem, onDropItem, onAssignQuickSlot 
}) {
  const [selectedItem, setSelectedItem] = useState(null);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4" onClick={onClose}>
      <motion.div 
        initial={{ scale: 0.95, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-[#0f172a] w-full max-w-6xl h-[650px] rounded-2xl border border-slate-700 shadow-2xl flex overflow-hidden ring-1 ring-white/10"
        onClick={e => e.stopPropagation()}
      >
        
        {/* COLUMNA 1: PERSONAJE (Equipo + Stats) */}
        <div className="w-72 bg-slate-900/80 border-r border-slate-700 flex flex-col">
          <div className="p-4 border-b border-slate-700 bg-slate-950/50">
            <h2 className="text-lg font-bold text-slate-200 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              {player.name || "Héroe"}
            </h2>
            <p className="text-xs text-slate-500 ml-4">Nivel {player.level} • {player.class}</p>
          </div>

          <div className="p-4 flex-1 overflow-y-auto custom-scrollbar">
            {/* Muñeca de Papel */}
            <div className="flex flex-col items-center gap-2 mb-6">
              {/* Pasamos isEquipped: true al seleccionar para saber que viene del equipo */}
              <EquipSlot slotKey="helmet" equipment={equipment} 
                onSelect={(item) => setSelectedItem({ ...item, slot: 'helmet', isEquipped: true })} 
                isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'helmet'} />
              
              <div className="flex gap-2">
                <EquipSlot slotKey="weapon" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'weapon', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'weapon'} />
                
                <EquipSlot slotKey="chest" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'chest', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'chest'} />
                
                <EquipSlot slotKey="offhand" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'offhand', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'offhand'} />
              </div>
              
              <div className="flex gap-2">
                <EquipSlot slotKey="gloves" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'gloves', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'gloves'} />
                
                <EquipSlot slotKey="legs" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'legs', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'legs'} />
                
                <EquipSlot slotKey="boots" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'boots', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'boots'} />
              </div>
              
              <div className="flex gap-2 mt-2 pt-2 border-t border-slate-800 w-full justify-center">
                <EquipSlot slotKey="necklace" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'necklace', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'necklace'} />
                
                <EquipSlot slotKey="ring" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'ring', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'ring'} />
                
                <EquipSlot slotKey="earring" equipment={equipment} 
                  onSelect={(item) => setSelectedItem({ ...item, slot: 'earring', isEquipped: true })} 
                  isSelected={selectedItem?.isEquipped && selectedItem?.slot === 'earring'} />
              </div>
            </div>

            {/* Estadísticas */}
            <div className="bg-slate-800/40 rounded-lg p-3 border border-slate-700/50 space-y-1">
              <h3 className="text-xs font-bold text-slate-500 uppercase mb-2">Atributos</h3>
              <StatRow label="Ataque" value={(player.baseAttack || 0) + (player.equipAttack || 0)} icon={<Sword className="w-3 h-3"/>} color="text-orange-400" />
              <StatRow label="Defensa" value={(player.baseDefense || 0) + (player.equipDefense || 0)} icon={<Shield className="w-3 h-3"/>} color="text-cyan-400" />
              <StatRow label="Vida" value={`${player.hp}/${player.maxHp}`} icon={<Heart className="w-3 h-3"/>} color="text-pink-400" />
              <StatRow label="Maná" value={`${player.mp}/${player.maxMp}`} icon={<Zap className="w-3 h-3"/>} color="text-blue-400" />
              <div className="h-px bg-slate-700 my-2" />
              <div className="grid grid-cols-3 gap-1 text-center">
                 <div className="bg-slate-900 rounded p-1"><div className="text-red-400 font-bold text-xs">{player.strength}</div><div className="text-[9px] text-slate-500">STR</div></div>
                 <div className="bg-slate-900 rounded p-1"><div className="text-green-400 font-bold text-xs">{player.dexterity}</div><div className="text-[9px] text-slate-500">DEX</div></div>
                 <div className="bg-slate-900 rounded p-1"><div className="text-blue-400 font-bold text-xs">{player.intelligence}</div><div className="text-[9px] text-slate-500">INT</div></div>
              </div>
            </div>
          </div>
        </div>

        {/* COLUMNA 2: MOCHILA (64 Slots) */}
        <div className="flex-1 flex flex-col bg-slate-900/30">
          <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900/80">
            <h2 className="text-lg font-bold text-amber-100 flex items-center gap-2">
              <GiBackpack className="w-6 h-6 text-amber-500" /> Mochila
            </h2>
            <div className="flex items-center gap-2 bg-black/40 px-3 py-1 rounded-full border border-amber-900/30">
              <GiCoins className="text-yellow-400 w-4 h-4" />
              <span className="text-yellow-100 font-bold font-mono">{player.gold}</span>
            </div>
          </div>

          <div className="p-6 overflow-y-auto custom-scrollbar">
            <div className="grid grid-cols-8 gap-2 auto-rows-max">
              {inventory.map((item, idx) => (
                <ItemSlot 
                  key={idx} 
                  item={item} 
                  onClick={() => setSelectedItem({ ...item, index: idx, isEquipped: false })}
                  isSelected={selectedItem?.index === idx && !selectedItem?.isEquipped}
                />
              ))}
              {/* Rellenar huecos hasta 64 */}
              {Array.from({ length: Math.max(0, 64 - inventory.length) }).map((_, i) => (
                <ItemSlot key={`empty-${i}`} isEmpty />
              ))}
            </div>
          </div>
        </div>

        {/* COLUMNA 3: INSPECTOR (Detalles + Acciones) */}
        <div className="w-80 bg-slate-950 border-l border-slate-700 flex flex-col relative shadow-2xl">
          <Button variant="ghost" size="icon" className="absolute top-2 right-2 text-slate-500 hover:text-white z-10" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>

          {!selectedItem ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-600 p-8 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-900 border-2 border-dashed border-slate-800 flex items-center justify-center mb-4">
                <GiBackpack className="w-8 h-8 opacity-20" />
              </div>
              <p className="text-sm font-medium">Selecciona un objeto</p>
              <p className="text-xs mt-2">Haz clic en un objeto del inventario o del equipo para ver sus detalles.</p>
            </div>
          ) : (
            <>
              {/* Cabecera del Item */}
              <div className="p-6 pb-4 border-b border-slate-800 bg-gradient-to-b from-slate-900 to-slate-950">
                <div className="flex justify-center mb-4">
                  <div className={`w-20 h-20 rounded-xl border-2 flex items-center justify-center bg-slate-900 shadow-lg ${
                    {
                      common: 'border-slate-600',
                      uncommon: 'border-emerald-500 shadow-emerald-500/20',
                      rare: 'border-blue-500 shadow-blue-500/20',
                      epic: 'border-purple-500 shadow-purple-500/20',
                      legendary: 'border-amber-500 shadow-amber-500/20',
                    }[selectedItem.rarity]
                  }`}>
                    {React.createElement(getItemIcon(selectedItem), { className: "w-12 h-12 text-white" })}
                  </div>
                </div>
                <div className="text-center">
                  <h3 className={`text-xl font-bold leading-tight ${
                    {
                      common: 'text-slate-200',
                      uncommon: 'text-emerald-400',
                      rare: 'text-blue-400',
                      epic: 'text-purple-400',
                      legendary: 'text-amber-400',
                    }[selectedItem.rarity]
                  }`}>
                    {selectedItem.name} {selectedItem.upgradeLevel > 0 && `+${selectedItem.upgradeLevel}`}
                  </h3>
                  <span className="text-xs text-slate-500 uppercase tracking-widest mt-1 block">
                    {selectedItem.rarity} • {selectedItem.category}
                  </span>
                </div>
              </div>

              {/* Cuerpo del Item */}
              <div className="p-6 flex-1 overflow-y-auto">
                
                {/* INDICADOR VISUAL DE SLOT */}
                {selectedItem.slot && EQUIPMENT_SLOTS[selectedItem.slot] && (
                  <div className="mb-4 p-3 bg-slate-900/80 border border-slate-700 rounded-lg flex items-center gap-3">
                    <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center border border-slate-600">
                       {React.createElement(EQUIPMENT_SLOTS[selectedItem.slot].icon, { className: "w-6 h-6 text-slate-400" })}
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-500 uppercase font-bold">
                        {selectedItem.isEquipped ? "Equipado en" : "Se equipa en"}
                      </p>
                      <p className="text-sm font-medium text-blue-300">{EQUIPMENT_SLOTS[selectedItem.slot].name}</p>
                    </div>
                    {/* Flecha indicativa */}
                    {selectedItem.isEquipped 
                      ? <ArrowDown className="ml-auto w-4 h-4 text-green-500" />
                      : <ArrowRight className="ml-auto w-4 h-4 text-slate-600" />
                    }
                  </div>
                )}

                {/* Stats */}
                {selectedItem.stats && (
                  <div className="space-y-2 mb-6">
                    {Object.entries(selectedItem.stats).map(([key, val]) => (
                      <div key={key} className="flex justify-between items-center p-2 rounded bg-slate-900 border border-slate-800">
                        <span className="text-slate-400 text-xs capitalize">{key}</span>
                        <span className="text-emerald-400 font-mono font-bold">{val > 0 ? `+${val}` : val}</span>
                      </div>
                    ))}
                  </div>
                )}

                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-800 text-sm text-slate-400 italic leading-relaxed">
                  "{selectedItem.description}"
                </div>

                {/* Requisitos */}
                {getMissingRequirement(selectedItem, player) && !selectedItem.isEquipped && (
                  <div className="mt-4 text-xs text-red-400 bg-red-950/30 p-2 rounded border border-red-900/50 flex items-center gap-2">
                    <X className="w-3 h-3" />
                    Requiere: {getMissingRequirement(selectedItem, player).attribute} {getMissingRequirement(selectedItem, player).required}
                  </div>
                )}
              </div>

              {/* Botones de Acción (LÓGICA MEJORADA) */}
              <div className="p-4 border-t border-slate-800 bg-slate-950 space-y-2">
                
                {/* 1. OBJETOS EQUIPABLES */}
                {(['weapon', 'armor', 'accessory'].includes(selectedItem.category) || selectedItem.slot) ? (
                  selectedItem.isEquipped ? (
                    // Botón para DESEQUIPAR
                    <Button 
                      className="w-full bg-slate-700 hover:bg-slate-600 text-slate-200"
                      onClick={() => { onUnequipItem(selectedItem.slot); setSelectedItem(null); }}
                    >
                      Desequipar
                    </Button>
                  ) : (
                    // Botón para EQUIPAR
                    <Button 
                      className={`w-full ${canClassEquip(selectedItem, player.class, player) ? 'bg-blue-600 hover:bg-blue-500' : 'bg-slate-700 cursor-not-allowed opacity-50'}`}
                      disabled={!canClassEquip(selectedItem, player.class, player)}
                      onClick={() => { onEquipItem(selectedItem.index); setSelectedItem(null); }}
                    >
                      {canClassEquip(selectedItem, player.class, player) ? 'Equipar' : 'No equipable'}
                    </Button>
                  )
                ) : (
                  // 2. CONSUMIBLES
                  <Button 
                    className="w-full bg-emerald-600 hover:bg-emerald-500"
                    onClick={() => { onUseItem(selectedItem.index); setSelectedItem(null); }}
                  >
                    Usar
                  </Button>
                )}

                {/* Slots Rápidos (Solo para inventario) */}
                {canAssignToQuickSlot(selectedItem) && !selectedItem.isEquipped && (
                  <div className="grid grid-cols-3 gap-1">
                    {['Q', 'E', 'R'].map((k, i) => (
                      <Button key={k} variant="outline" size="sm" className="text-xs border-slate-700 hover:bg-slate-800"
                        onClick={() => onAssignQuickSlot(i, selectedItem.id)}>
                        Slot {k}
                      </Button>
                    ))}
                  </div>
                )}

                {/* Botón Tirar (Solo inventario) */}
                {!selectedItem.isEquipped && (
                  <Button 
                    variant="ghost" 
                    className="w-full text-red-400 hover:text-red-300 hover:bg-red-950/30"
                    onClick={() => { onDropItem(selectedItem.index); setSelectedItem(null); }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" /> Tirar objeto
                  </Button>
                )}
              </div>
            </>
          )}
        </div>

      </motion.div>
    </div>
  );
}