import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from './button';
import { SKILL_TREES } from '@/data/skills';
import { PLAYER_APPEARANCES } from '@/data/player';

interface CharacterSelectProps {
    onSelect: (appearanceKey: string, appearanceData: any) => void;
    playerName: string;
    onNameChange: (name: string) => void;
}

import { useMenuNavigation } from '@/hooks/useMenuNavigation';

export default function CharacterSelect({ onSelect, playerName, onNameChange }: CharacterSelectProps) {
    const appearanceKeys = Object.keys(PLAYER_APPEARANCES);

    // We lift the state control to the hook, or sync them.
    // The hook manages its own index. We can use that.
    const { selectedIndex, setSelectedIndex } = useMenuNavigation({
        itemsCount: appearanceKeys.length,
        cols: 1, // Horizontal list behaves like 1 col if we map left/right to up/down or change hook? 
        // My hook maps Up/Down to +/- cols and Left/Right to +/- 1. 
        // So default Left/Right works for 1D list.
        loop: true,
        onSelect: (index) => {
            const key = appearanceKeys[index];
            const appearance = (PLAYER_APPEARANCES as any)[key];
            onSelect(key, appearance);
        }
    });

    const currentKey = appearanceKeys[selectedIndex];
    const currentAppearance = (PLAYER_APPEARANCES as any)[currentKey];

    const prevCharacter = () => {
        setSelectedIndex((prev) => (prev - 1 + appearanceKeys.length) % appearanceKeys.length);
    };

    const nextCharacter = () => {
        setSelectedIndex((prev) => (prev + 1) % appearanceKeys.length);
    };

    const treeInfo = (SKILL_TREES as any)[currentAppearance?.class] || SKILL_TREES.warrior;
    const ClassIcon = treeInfo.icon;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg mx-auto text-center"
        >
            <h1 className="mb-2 text-3xl font-bold text-white">
                Cutre<span className="text-blue-500">Mazmorra</span>
            </h1>
            <p className="mb-6 text-sm text-slate-400">Elige tu clase</p>

            <div className="flex items-center justify-center gap-4 mb-4">
                <Button variant="ghost" size="icon" onClick={prevCharacter} className="text-slate-400 hover:text-white">
                    <ChevronLeft className="w-6 h-6" />
                </Button>

                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700 min-w-[220px] flex flex-col items-center shadow-2xl">
                    <div
                        className="w-32 h-32 mb-4 rounded-full flex items-center justify-center border-4 shadow-[0_0_20px_rgba(0,0,0,0.5)] bg-slate-900/50"
                        style={{ borderColor: treeInfo.color }}
                    >
                        <ClassIcon className="w-20 h-20" style={{ color: treeInfo.color }} />
                    </div>

                    <h2 className="text-2xl font-bold text-white mb-2" style={{ color: treeInfo.color }}>
                        {treeInfo.name}
                    </h2>

                    <p className="text-xs text-slate-400 min-h-[40px] leading-relaxed">
                        {currentAppearance?.description || ''}
                    </p>

                    <p className="text-[10px] text-amber-500 mt-4 font-medium bg-amber-950/30 px-3 py-1 rounded-full border border-amber-900/50">
                        ¡Al nivel 10 podrás evolucionar!
                    </p>
                </div>

                <Button variant="ghost" size="icon" onClick={nextCharacter} className="text-slate-400 hover:text-white">
                    <ChevronRight className="w-6 h-6" />
                </Button>
            </div>

            <div className="flex justify-center gap-2 mb-6">
                {appearanceKeys.map((_, i) => (
                    <div
                        key={i}
                        className={`w-2 h-2 rounded-full transition-colors ${i === selectedIndex ? 'bg-blue-500 scale-125' : 'bg-slate-600'}`}
                    />
                ))}
            </div>

            <div className="mb-4">
                <input
                    type="text"
                    value={playerName}
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="Nombre del héroe..."
                    maxLength={16}
                    className="w-full px-4 py-3 text-center text-white border rounded-lg bg-slate-800 border-slate-600 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder:text-slate-500"
                />
            </div>

            <Button
                onClick={() => onSelect(currentKey, currentAppearance)}
                className="w-full h-12 text-lg font-bold shadow-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500"
            >
                <Play className="w-5 h-5 mr-2" />
                Comenzar Aventura <span className="ml-2 text-xs opacity-70">(A)</span>
            </Button>

            <div className="mt-6 text-[10px] text-slate-500 flex flex-wrap justify-center gap-3 opacity-60">
                <span>🎮 D-Pad: Cambiar Clase</span>
                <span>🎮 A: Seleccionar</span>
                <span>WASD: Mover</span>
                <span>I: Inventario</span>
                <span>C: Artesanía</span>
                <span>T: Habilidades</span>
            </div>
        </motion.div>
    );
}
