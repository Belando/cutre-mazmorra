import React, { useState } from 'react';
import PlayerStats from '@/components/ui/PlayerStats';
import MiniMap from '@/components/game/MiniMap';
import MessageLog from '@/components/ui/MessageLog';
import SkillBar from '@/components/ui/SkillBar';
import QuickSlots from '@/components/ui/QuickSlots';

interface GameHUDProps {
    gameState: any;
    uiState: any;
    actions: any;
    messages: any;
    mapExpanded: boolean;
    onExpandMap: (expanded: boolean) => void;
    isInputDisabled: boolean;
    chatOpen?: boolean;
    onChatOpenChange?: (open: boolean) => void;
}

export default function GameHUD({
    gameState,
    uiState,
    actions,
    messages,
    mapExpanded,
    onExpandMap,
    isInputDisabled,
    chatOpen,
    onChatOpenChange
}: GameHUDProps) {
    return (
        <div className="absolute inset-0 pointer-events-none">
            {/* TOP LEFT: Player Stats */}
            <div className="absolute top-4 left-4 z-20 w-64">
                <div className="pointer-events-auto">
                    <PlayerStats player={gameState?.player} dungeonLevel={gameState?.level} />
                </div>
            </div>

            {/* TOP RIGHT: Minimap */}
            <div className="absolute top-4 right-4 z-20 flex flex-col items-end gap-2">
                <div className="pointer-events-auto">
                    <MiniMap gameState={gameState} expanded={mapExpanded} onExpandChange={onExpandMap} />
                </div>
            </div>

            {/* BOTTOM LEFT: Message Log & Chat */}
            <div className="absolute bottom-4 left-4 z-20 w-[400px]">
                <div className="h-40 overflow-hidden pointer-events-auto mb-2">
                    <MessageLog
                        messages={messages}
                        onCommand={actions.processCommand}
                        isFocused={chatOpen}
                        onFocusChange={onChatOpenChange}
                    />
                </div>
            </div>

            {/* BOTTOM CENTER: Skills & QuickSlots */}
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-end gap-4">
                <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-700/50 backdrop-blur-sm shadow-xl flex items-center gap-4 pointer-events-auto px-6">
                    <SkillBar disabled={isInputDisabled} />
                    <div className="w-px h-8 bg-slate-700/50"></div>
                    <QuickSlots quickSlots={uiState.quickSlots} onUseSlot={actions.useQuickSlot} disabled={isInputDisabled} inventory={gameState?.inventory} />
                </div>
            </div>
        </div>
    );
}
