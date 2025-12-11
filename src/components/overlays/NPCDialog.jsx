import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Coins, ShoppingBasket, HandCoins, ScrollText, MessageSquareQuote } from 'lucide-react';
import { Button } from '@/components/ui/button';
// --- CORRECCIÓN AQUÍ: Importamos QUESTS correctamente ---
import { NPC_TYPES, getAvailableQuests, checkQuestProgress, QUESTS } from '@/engine/systems/NPCSystem';
import { getItemIcon } from '@/data/icons';

function getSellPrice(item) {
  const rarityMultiplier = { common: 5, uncommon: 15, rare: 40, epic: 100, legendary: 250 };
  const base = rarityMultiplier[item.rarity] || 5;
  const statBonus = (item.stats?.attack || 0) * 3 + (item.stats?.defense || 0) * 3 + (item.stats?.maxHp || 0);
  return Math.floor((base + statBonus) * (item.quantity || 1));
}

function getRarityTextColor(rarity) {
  switch (rarity) {
    case 'common': return 'text-slate-300';
    case 'uncommon': return 'text-green-400';
    case 'rare': return 'text-blue-400';
    case 'epic': return 'text-purple-400';
    case 'legendary': return 'text-yellow-400';
    default: return 'text-slate-300';
  }
}

const IconWrapper = ({ item, className }) => {
  const Icon = getItemIcon(item);
  return <Icon className={className} />;
};

export default function NPCDialog({ 
  npc, player, onClose, onBuy, onSell, onAcceptQuest, onCompleteQuest,
  activeQuests = [], completedQuests = [], gameState = {}, inventory = []
}) {
  const [activeMode, setActiveMode] = useState(null); 
  const [currentDialogue, setCurrentDialogue] = useState('');

  useEffect(() => {
    if (npc) {
      setCurrentDialogue(npc.dialogue?.greeting || "...");
      if (npc.type === NPC_TYPES.MERCHANT) setActiveMode('shop');
      if (npc.type === NPC_TYPES.QUEST_GIVER) setActiveMode('quests');
    }
  }, [npc]);

  if (!npc) return null;

  const availableQuests = getAvailableQuests(player.floor || 1, completedQuests, activeQuests);

  const handleBuy = (item) => {
    onBuy(item);
    setCurrentDialogue(npc.dialogue?.thanks || "¡Gracias!");
    setTimeout(() => setCurrentDialogue(npc.dialogue?.greeting), 3000);
  };

  const handleSell = (i, price) => {
    onSell(i, price);
    setCurrentDialogue("Interesante objeto... Aquí tienes tu oro.");
    setTimeout(() => setCurrentDialogue(npc.dialogue?.greeting), 3000);
  };

  const renderActionButtons = () => (
    <div className="flex gap-2 mb-4">
      {npc.type === NPC_TYPES.MERCHANT && (
        <>
          <ActionButton 
            icon={ShoppingBasket} 
            label="Comprar" 
            isActive={activeMode === 'shop'} 
            onClick={() => setActiveMode('shop')} 
            color="text-amber-400"
          />
          <ActionButton 
            icon={HandCoins} 
            label="Vender" 
            isActive={activeMode === 'sell'} 
            onClick={() => setActiveMode('sell')} 
            color="text-green-400"
          />
        </>
      )}
      {npc.type === NPC_TYPES.QUEST_GIVER && (
        <ActionButton 
          icon={ScrollText} 
          label="Misiones" 
          isActive={activeMode === 'quests'} 
          onClick={() => setActiveMode('quests')} 
          color="text-blue-400"
        />
      )}
      {npc.dialogue?.lore && (
        <ActionButton 
          icon={MessageSquareQuote} 
          label="Saber" 
          isActive={activeMode === 'lore'} 
          onClick={() => { setActiveMode('lore'); setCurrentDialogue(npc.dialogue.lore); }} 
          color="text-purple-400"
        />
      )}
    </div>
  );

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
        <div className="relative p-6 pb-2 text-center border-b border-slate-800 bg-gradient-to-b from-slate-800/50 to-slate-900">
          <div className="absolute top-4 right-4">
            <Button variant="ghost" size="icon" onClick={onClose} className="text-slate-500 hover:text-white hover:bg-slate-800">
              <X className="w-5 h-5" />
            </Button>
          </div>
          
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center justify-center w-16 h-16 mb-3 text-4xl border-2 rounded-full shadow-lg bg-slate-950" style={{ borderColor: npc.color, color: npc.color }}>
              {npc.symbol}
            </div>
            <h2 className="text-xl font-bold text-white">{npc.name}</h2>
            <p className="text-xs font-medium tracking-wider uppercase text-slate-500">
              {npc.type === NPC_TYPES.MERCHANT ? 'Mercader' : npc.type === NPC_TYPES.QUEST_GIVER ? 'Dador de Misiones' : npc.type === NPC_TYPES.BLACKSMITH ? 'Herrero' : 'Sabio'}
            </p>
          </div>
        </div>

        <div className="px-6 py-4 bg-slate-900">
          <div className="relative p-4 border rounded-xl bg-slate-800/60 border-slate-700/50">
            <div className="absolute w-4 h-4 rotate-45 border-t border-l -top-2 left-1/2 -translate-x-1/2 bg-slate-800 border-slate-700/50"></div>
            <p className="text-sm italic leading-relaxed text-center text-slate-300">
              "{currentDialogue}"
            </p>
          </div>
        </div>

        <div className="px-6 pb-2">
          {renderActionButtons()}
        </div>

        <div className="px-6 pb-6 h-[280px] overflow-y-auto custom-scrollbar border-t border-slate-800/50 pt-4 bg-slate-950/30">
          
          {activeMode === 'shop' && npc.inventory && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase">
                <span>Inventario</span>
                <span className="flex items-center gap-1 text-yellow-400"><Coins className="w-3 h-3" /> {player.gold}</span>
              </div>
              <div className="grid gap-2">
                {npc.inventory.map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-2 transition-colors border rounded-lg bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-md bg-slate-900 border border-slate-700 ${getRarityTextColor(item.rarity)}`}>
                        <IconWrapper item={item} className="w-5 h-5" />
                      </div>
                      <div>
                        <div className={`text-sm font-medium ${getRarityTextColor(item.rarity)}`}>{item.name}</div>
                        <div className="text-[10px] text-slate-500">
                           {item.stats?.attack && `ATK +${item.stats.attack} `}
                           {item.stats?.defense && `DEF +${item.stats.defense} `}
                           {item.stats?.health && `HP +${item.stats.health}`}
                        </div>
                      </div>
                    </div>
                    <Button size="sm" className="h-7 text-xs bg-amber-700 hover:bg-amber-600 border-amber-600"
                      disabled={player.gold < item.price}
                      onClick={() => handleBuy(item)}
                    >
                      <Coins className="w-3 h-3 mr-1.5" /> {item.price}
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeMode === 'sell' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-3 text-xs font-bold text-slate-400 uppercase">
                <span>Tu Inventario</span>
                <span className="flex items-center gap-1 text-yellow-400"><Coins className="w-3 h-3" /> {player.gold}</span>
              </div>
              {inventory.length === 0 ? (
                <div className="py-8 text-center text-slate-600 text-sm">Tu mochila está vacía.</div>
              ) : (
                <div className="grid gap-2">
                  {inventory.map((item, i) => {
                    const price = getSellPrice(item);
                    return (
                      <div key={i} className="flex items-center justify-between p-2 transition-colors border rounded-lg bg-slate-800/40 border-slate-700/50 hover:bg-slate-800 hover:border-slate-600">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-md bg-slate-900 border border-slate-700 ${getRarityTextColor(item.rarity)}`}>
                            <IconWrapper item={item} className="w-5 h-5" />
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${getRarityTextColor(item.rarity)}`}>{item.name} {item.quantity > 1 && `x${item.quantity}`}</div>
                            <div className="text-[10px] text-slate-500 capitalize">{item.category}</div>
                          </div>
                        </div>
                        <Button size="sm" className="h-7 text-xs bg-emerald-900/50 hover:bg-emerald-800 text-emerald-400 border border-emerald-800/50"
                          onClick={() => handleSell(i, price)}
                        >
                          + {price} <Coins className="w-3 h-3 ml-1" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {activeMode === 'quests' && (
            <div className="space-y-3">
              {activeQuests.length === 0 && availableQuests.length === 0 && (
                <div className="py-8 text-center text-slate-600 text-sm">No hay misiones disponibles por ahora.</div>
              )}

              {activeQuests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">En Progreso</h4>
                  {activeQuests.map(qId => {
                    // --- CORRECCIÓN: Usamos la constante importada arriba ---
                    const quest = QUESTS[qId]; 
                    if (!quest) return null;
                    const progress = checkQuestProgress(quest, gameState);
                    
                    return (
                      <div key={qId} className="p-3 border rounded-lg bg-slate-800/60 border-slate-700">
                        <div className="flex justify-between items-start mb-1">
                          <h5 className="text-sm font-bold text-white">{quest.name}</h5>
                          {progress.complete ? (
                            <span className="text-[10px] bg-green-900 text-green-300 px-2 py-0.5 rounded">¡Completada!</span>
                          ) : (
                            <span className="text-[10px] text-slate-400">{progress.progress} / {progress.target}</span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mb-2">{quest.description}</p>
                        {progress.complete && (
                          <Button size="sm" onClick={() => onCompleteQuest(quest)} className="w-full h-7 text-xs bg-green-600 hover:bg-green-500">
                            Reclamar Recompensa
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              {availableQuests.length > 0 && (
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Disponibles</h4>
                  {availableQuests.map(quest => (
                    <div key={quest.id} className="p-3 border border-dashed rounded-lg bg-slate-900/50 border-slate-700 hover:border-slate-500 transition-colors">
                      <div className="flex justify-between items-start mb-1">
                        <h5 className={`text-sm font-bold ${quest.type === 'main' ? 'text-amber-400' : 'text-blue-300'}`}>
                          {quest.type === 'main' ? '★ ' : ''}{quest.name}
                        </h5>
                      </div>
                      <p className="text-xs text-slate-400 mb-2">{quest.description}</p>
                      <div className="flex items-center justify-between mt-2">
                        <div className="flex gap-2 text-[10px] text-slate-500">
                           {quest.reward?.gold && <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-500"/> {quest.reward.gold}</span>}
                           {quest.reward?.exp && <span className="flex items-center gap-1">✨ {quest.reward.exp} XP</span>}
                        </div>
                        <Button size="sm" onClick={() => onAcceptQuest(quest)} className="h-6 text-xs border border-slate-600 bg-slate-800 hover:bg-slate-700">
                          Aceptar
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeMode === 'lore' && (
             <div className="flex items-center justify-center h-full text-center text-slate-500 text-sm italic">
                (El personaje te observa en silencio...)
             </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

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