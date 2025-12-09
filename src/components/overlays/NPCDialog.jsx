import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Coins, ShoppingBag, Scroll, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NPC_TYPES, QUESTS, getAvailableQuests, checkQuestProgress } from '@/engine/systems/NPCSystem';
import { getItemIcon } from '@/data/icons'; // Importamos el helper de iconos

function getSellPrice(item) {
  const rarityMultiplier = {
    common: 5,
    uncommon: 15,
    rare: 40,
    epic: 100,
    legendary: 250,
  };
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

// Helper para renderizar iconos de forma segura
const IconWrapper = ({ item, className }) => {
  const Icon = getItemIcon(item);
  return <Icon className={className} />;
};

export default function NPCDialog({ 
  npc, 
  player, 
  onClose, 
  onBuy, 
  onSell,
  onAcceptQuest, 
  onCompleteQuest,
  activeQuests = [],
  completedQuests = [],
  questProgress = {},
  gameState = {},
  inventory = [],
}) {
  const [tab, setTab] = useState(npc.type === NPC_TYPES.MERCHANT ? 'shop' : 'talk');
  
  if (!npc) return null;

  const availableQuests = getAvailableQuests(player.floor || 1, completedQuests, activeQuests);

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
        className="w-full max-w-md overflow-hidden border bg-slate-900 rounded-xl border-slate-700"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-3 border-b border-slate-700 bg-slate-800/50">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{npc.symbol}</span>
            <div>
              <h3 className="text-sm font-bold text-white">{npc.name}</h3>
              <p className="text-xs text-slate-400">{npc.type === NPC_TYPES.MERCHANT ? 'Comerciante' : 'NPC'}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="w-8 h-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Tabs */}
        {npc.type === NPC_TYPES.MERCHANT && (
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setTab('talk')}
              className={`flex-1 py-2 text-xs font-medium ${tab === 'talk' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
            >
              <MessageCircle className="inline w-3 h-3 mr-1" />Hablar
            </button>
            <button
              onClick={() => setTab('shop')}
              className={`flex-1 py-2 text-xs font-medium ${tab === 'shop' ? 'text-yellow-400 border-b-2 border-yellow-400' : 'text-slate-400'}`}
            >
              <ShoppingBag className="inline w-3 h-3 mr-1" />Comprar
            </button>
            <button
              onClick={() => setTab('sell')}
              className={`flex-1 py-2 text-xs font-medium ${tab === 'sell' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400'}`}
            >
              <Coins className="inline w-3 h-3 mr-1" />Vender
            </button>
          </div>
        )}

        {npc.type === NPC_TYPES.QUEST_GIVER && (
          <div className="flex border-b border-slate-700">
            <button
              onClick={() => setTab('talk')}
              className={`flex-1 py-2 text-xs font-medium ${tab === 'talk' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400'}`}
            >
              <MessageCircle className="inline w-3 h-3 mr-1" />Hablar
            </button>
            <button
              onClick={() => setTab('quests')}
              className={`flex-1 py-2 text-xs font-medium ${tab === 'quests' ? 'text-green-400 border-b-2 border-green-400' : 'text-slate-400'}`}
            >
              <Scroll className="inline w-3 h-3 mr-1" />Misiones
            </button>
          </div>
        )}

        {/* Content */}
        <div className="p-3 overflow-y-auto max-h-64">
          {tab === 'talk' && (
            <div className="space-y-2">
              <p className="p-2 text-sm rounded text-slate-300 bg-slate-800/50">
                "{npc.dialogue?.greeting || '...'}"
              </p>
              {npc.dialogue?.lore && (
                <p className="p-2 text-xs italic rounded text-slate-400 bg-slate-800/30">
                  "{npc.dialogue.lore}"
                </p>
              )}
            </div>
          )}

          {tab === 'shop' && npc.inventory && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                <span>Tu oro:</span>
                <span className="flex items-center gap-1 font-bold text-yellow-400">
                  <Coins className="w-3 h-3" />{player.gold}
                </span>
              </div>
              {npc.inventory.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                  <div className="flex items-center gap-2">
                    {/* CAMBIO: Icono real en lugar de texto */}
                    <div className={`p-1 rounded bg-slate-950/50 ${getRarityTextColor(item.rarity)}`}>
                        <IconWrapper item={item} className="w-6 h-6" />
                    </div>
                    <div>
                      <p className={`text-xs font-medium ${getRarityTextColor(item.rarity)}`}>{item.name}</p>
                      <p className="text-[10px] text-slate-400">
                        {item.stats?.attack && `+${item.stats.attack} ATK `}
                        {item.stats?.defense && `+${item.stats.defense} DEF `}
                        {item.stats?.health && `+${item.stats.health} HP `}
                        {item.stats?.maxHp && `+${item.stats.maxHp} Vida Max`}
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="h-6 text-xs bg-yellow-600 hover:bg-yellow-500"
                    disabled={player.gold < item.price}
                    onClick={() => onBuy(item)}
                  >
                    <Coins className="w-3 h-3 mr-1" />{item.price}
                  </Button>
                </div>
              ))}
            </div>
          )}

          {tab === 'sell' && (
            <div className="space-y-2">
              <div className="flex items-center justify-between mb-2 text-xs text-slate-400">
                <span>Tu oro:</span>
                <span className="flex items-center gap-1 font-bold text-yellow-400">
                  <Coins className="w-3 h-3" />{player.gold}
                </span>
              </div>
              {inventory.length === 0 ? (
                <p className="py-4 text-xs text-center text-slate-500">No tienes objetos para vender.</p>
              ) : (
                inventory.map((item, i) => {
                  const sellPrice = getSellPrice(item);
                  return (
                    <div key={i} className="flex items-center justify-between p-2 rounded bg-slate-800/50">
                      <div className="flex items-center gap-2">
                        {/* CAMBIO: Icono real en lugar de texto */}
                        <div className={`p-1 rounded bg-slate-950/50 ${getRarityTextColor(item.rarity)}`}>
                            <IconWrapper item={item} className="w-6 h-6" />
                        </div>
                        <div>
                          <p className={`text-xs font-medium ${getRarityTextColor(item.rarity)}`}>{item.name}</p>
                          <p className="text-[10px] text-slate-400">
                            {item.stats?.attack && `+${item.stats.attack} ATK `}
                            {item.stats?.defense && `+${item.stats.defense} DEF `}
                            {item.quantity > 1 && `x${item.quantity}`}
                          </p>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        className="h-6 text-xs bg-green-600 hover:bg-green-500"
                        onClick={() => onSell(i, sellPrice)}
                      >
                        <Coins className="w-3 h-3 mr-1" />+{sellPrice}
                      </Button>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {tab === 'quests' && (
            <div className="space-y-2">
              {/* Active quests */}
              {activeQuests.length > 0 && (
                <div className="mb-3">
                  <p className="mb-1 text-xs text-slate-500">Misiones Activas:</p>
                  {activeQuests.map(qId => {
                    const quest = QUESTS[qId];
                    if (!quest) return null;
                    const progress = checkQuestProgress(quest, gameState);
                    return (
                      <div key={qId} className={`p-2 rounded mb-1 border ${progress.complete ? 'bg-green-900/30 border-green-700/50' : 'bg-slate-800/50 border-slate-700/50'}`}>
                        <p className={`text-xs font-medium ${quest.type === 'main' ? 'text-yellow-400' : 'text-green-400'}`}>
                          {quest.type === 'main' && '★ '}{quest.name}
                        </p>
                        <p className="text-[10px] text-slate-400">{quest.description}</p>
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-[10px] text-slate-500">
                            {progress.type === 'multi_kill' ? progress.progress : `${progress.progress}/${progress.target}`}
                          </span>
                          {progress.complete && (
                            <Button size="sm" className="h-5 text-[10px] bg-green-600" onClick={() => onCompleteQuest(quest)}>
                              Completar
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              
              {/* Available quests */}
              {availableQuests.length > 0 ? (
                availableQuests.map(quest => (
                  <div key={quest.id} className={`p-2 rounded border ${quest.type === 'main' ? 'bg-yellow-900/20 border-yellow-700/50' : 'bg-slate-800/50 border-slate-700'}`}>
                    <p className={`text-xs font-medium ${quest.type === 'main' ? 'text-yellow-400' : 'text-white'}`}>
                      {quest.type === 'main' && '★ '}{quest.name}
                    </p>
                    <p className="text-[10px] text-slate-400">{quest.description}</p>
                    {quest.reward && (
                      <p className="text-[10px] text-yellow-400 mt-1">
                        Recompensa: {quest.reward.gold && `${quest.reward.gold} oro `}
                        {quest.reward.exp && `+${quest.reward.exp} XP `}
                        {quest.reward.item && `+${quest.reward.item.name}`}
                      </p>
                    )}
                    <Button
                      size="sm"
                      className={`h-5 text-[10px] mt-1 ${quest.type === 'main' ? 'bg-yellow-600 hover:bg-yellow-500' : 'bg-blue-600'}`}
                      onClick={() => onAcceptQuest(quest)}
                    >
                      Aceptar
                    </Button>
                  </div>
                ))
              ) : (
                <p className="text-xs text-center text-slate-500">No hay misiones disponibles.</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-slate-700 bg-slate-800/30">
          <p className="text-[10px] text-slate-500 text-center">
            "{npc.dialogue?.farewell || 'Hasta pronto.'}"
          </p>
        </div>
      </motion.div>
    </motion.div>
  );
}