import { soundManager } from "@/engine/systems/SoundSystem";

export function useInteractionActions(context) {
  const {
      player, updatePlayer,
      dungeon, setDungeon,
      inventory, setInventory, addItem,
      activeQuests, setActiveQuests,
      completedQuests, setCompletedQuests,
      gainExp, addMessage, effectsManager,
      spatialHash
  } = context;

  const interact = () => {
      const dirs = [[0, 1], [0, -1], [1, 0], [-1, 0]];
      for (const [dx, dy] of dirs) {
          const tx = player.x + dx;
          const ty = player.y + dy;

          // --- OPTIMIZACIÓN SPATIAL HASH ---
          const entities = spatialHash.get(tx, ty);

          // 1. Interactuar con Cofre
          const chestRef = entities.find(e => e.type === 'chest');
          if (chestRef) {
              const chestIdx = dungeon.chests.findIndex(c => c.x === tx && c.y === ty);
              
              if (chestIdx !== -1) {
                  const chest = dungeon.chests[chestIdx];
                  if (chest.isOpen) {
                      addMessage("Este cofre ya está vacío.", 'info');
                      return null;
                  }
                  soundManager.play('chest'); 
                  if (effectsManager.current) effectsManager.current.addSparkles(tx, ty, '#fbbf24');
                  const item = chest.item;
                  
                  if (item) {
                      const added = addItem(item);
                      if (added) {
                          addMessage(`Encontraste: ${item.name}`, 'pickup');
                          
                          let floatText = "ITEM";
                          if (typeof item.symbol === 'string') floatText = item.symbol;
                          else if (item.category === 'weapon') floatText = "⚔️";
                          else if (item.category === 'armor') floatText = "🛡️";
                          else if (item.category === 'potion') floatText = "♥";
                          
                          if (effectsManager.current) effectsManager.current.addText(tx, ty, floatText, '#fff');
                          setDungeon(prev => ({
                              ...prev,
                              chests: prev.chests.map((c, i) => i === chestIdx ? { ...c, isOpen: true } : c)
                          }));
                      } else {
                          addMessage("Inventario lleno.", 'info');
                          return null;
                      }
                  } else {
                      addMessage("El cofre estaba vacío...", 'info');
                      setDungeon(prev => ({
                          ...prev,
                          chests: prev.chests.map((c, i) => i === chestIdx ? { ...c, isOpen: true } : c)
                      }));
                  }
                  return { type: 'chest' };
              }
          }

          // 2. Interactuar con NPC
          const npcRef = entities.find(e => e.type === 'npc');
          if (npcRef) {
              soundManager.play('speech'); 
              return { type: 'npc', data: npcRef.ref };
          }
      }
      addMessage("No hay nada aquí para interactuar.", 'info');
      return null;
  };

  const buyItem = (item) => {
      if (player.gold >= item.price) {
          const success = addItem(item); 
          if (success) {
              updatePlayer({ gold: player.gold - item.price });
              addMessage(`Comprado: ${item.name}`, 'pickup');
              soundManager.play('pickup');
          } else {
              addMessage("Inventario lleno", 'info');
          }
      } else {
          addMessage("Oro insuficiente", 'info');
      }
  };

  const sellItem = (index, price) => {
      const newInv = [...inventory];
      const item = newInv[index];
      if (!item) return;
      newInv.splice(index, 1);
      setInventory(newInv);
      updatePlayer({ gold: player.gold + price });
      addMessage(`Vendido: ${item.name} (+${price} oro)`, 'pickup');
      soundManager.play('pickup');
  };

  const acceptQuest = (quest) => {
      if (!activeQuests.includes(quest.id) && !completedQuests.includes(quest.id)) {
          setActiveQuests(prev => [...prev, quest.id]);
          addMessage(`Misión aceptada: ${quest.name}`, 'info');
          soundManager.play('buff'); 
      }
  };

  const completeQuest = (quest) => {
      let rewardText = "";
      if (quest.reward) {
          if (quest.reward.gold) {
              updatePlayer({ gold: player.gold + quest.reward.gold });
              rewardText += ` +${quest.reward.gold} Oro`;
          }
          if (quest.reward.exp) {
              gainExp(quest.reward.exp);
              rewardText += ` +${quest.reward.exp} XP`;
          }
          if (quest.reward.item) {
              addItem(quest.reward.item);
              rewardText += ` +${quest.reward.item.name}`;
          }
      }
      setActiveQuests(prev => prev.filter(q => q !== quest.id));
      setCompletedQuests(prev => [...prev, quest.id]);
      addMessage(`¡Misión completada!${rewardText}`, 'levelup');
      soundManager.play('levelUp');
  };

  return { interact, buyItem, sellItem, acceptQuest, completeQuest };
}
