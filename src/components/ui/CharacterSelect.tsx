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
        <div className="flex items-center justify-center min-h-screen bg-[#020617] bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-900 via-[#020617] to-black">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-4xl p-8"
            >
                <div className="text-center mb-12 relative">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.2, duration: 0.8 }}
                    >
                        <h1 className="text-6xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-b from-amber-200 via-amber-500 to-amber-700 font-fantasy drop-shadow-[0_5px_5px_rgba(0,0,0,0.8)] filter">
                            CUTRE<br />MAZMORRA
                        </h1>
                        <div className="h-1 w-32 mx-auto bg-gradient-to-r from-transparent via-amber-500 to-transparent mt-4"></div>
                        <p className="mt-4 text-xl text-slate-400 font-fantasy tracking-[0.2em] uppercase">Edición Roguelite</p>
                    </motion.div>
                </div>

                <div className="flex flex-col md:flex-row items-center justify-center gap-12">
                    {/* LEFT ARROW */}
                    <Button variant="ghost" size="icon" onClick={prevCharacter} className="hidden md:flex text-slate-500 hover:text-amber-400 hover:bg-transparent hover:scale-125 transition-all">
                        <ChevronLeft className="w-12 h-12" />
                    </Button>

                    {/* CARD */}
                    <motion.div
                        key={currentKey}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="relative group"
                    >
                        {/* Card Frame */}
                        <div className="w-[320px] h-[480px] bg-slate-950/80 backdrop-blur-md border-[3px] border-slate-800 rounded-xl relative overflow-hidden shadow-2xl flex flex-col items-center pt-8 hover:border-amber-700/50 transition-colors duration-500">
                            {/* Background glow based on class color */}
                            <div className="absolute inset-0 opacity-10" style={{ background: `radial-gradient(circle at center, ${treeInfo.color}, transparent 70%)` }}></div>

                            {/* Icon Circle */}
                            <div className="w-32 h-32 rounded-full border-4 border-slate-800 bg-slate-900/80 flex items-center justify-center shadow-[0_0_30px_rgba(0,0,0,0.5)] z-10 mb-6 group-hover:scale-105 transition-transform duration-300"
                                style={{ borderColor: treeInfo.color }}>
                                <ClassIcon className="w-20 h-20 drop-shadow-lg" style={{ color: treeInfo.color }} />
                            </div>

                            {/* Name */}
                            <h2 className="text-3xl font-bold font-fantasy uppercase tracking-wider mb-2 z-10 drop-shadow-md" style={{ color: treeInfo.color }}>
                                {treeInfo.name}
                            </h2>

                            <div className="w-16 h-1 bg-slate-800 mb-4 z-10"></div>

                            {/* Description */}
                            <p className="text-sm text-slate-400 text-center px-6 leading-relaxed italic z-10 h-24 flex items-center justify-center">
                                "{currentAppearance?.description}"
                            </p>

                            {/* Stats or Flavor */}
                            <div className="mt-auto mb-8 flex gap-2 z-10">
                                <span className="px-3 py-1 bg-black/40 rounded text-xs text-slate-500 border border-slate-800 uppercase tracking-widest font-bold">
                                    Clase Inicial
                                </span>
                            </div>
                        </div>

                        {/* Mobile Arrows inside card area equivalent? No, keep separate */}
                    </motion.div>

                    {/* RIGHT ARROW */}
                    <Button variant="ghost" size="icon" onClick={nextCharacter} className="hidden md:flex text-slate-500 hover:text-amber-400 hover:bg-transparent hover:scale-125 transition-all">
                        <ChevronRight className="w-12 h-12" />
                    </Button>
                </div>

                {/* Mobile Navigation */}
                <div className="flex md:hidden justify-center gap-8 my-6">
                    <Button variant="outline" onClick={prevCharacter}><ChevronLeft /></Button>
                    <Button variant="outline" onClick={nextCharacter}><ChevronRight /></Button>
                </div>

                {/* DOTS */}
                <div className="flex justify-center gap-3 mt-8 mb-8">
                    {appearanceKeys.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setSelectedIndex(i)}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${i === selectedIndex ? 'bg-amber-500 w-8' : 'bg-slate-700 hover:bg-slate-500'}`}
                        />
                    ))}
                </div>

                {/* INPUT & PLAY */}
                <div className="max-w-md mx-auto space-y-4">
                    <div className="relative group">
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => onNameChange(e.target.value)}
                            placeholder="Nombre del Héroe"
                            maxLength={16}
                            className="w-full bg-slate-950/50 border-2 border-slate-800 text-center text-xl py-4 rounded-lg focus:outline-none focus:border-amber-600 focus:ring-1 focus:ring-amber-600 transition-all font-fantasy tracking-wide text-slate-200 placeholder:text-slate-700"
                        />
                        <div className="absolute inset-0 rounded-lg pointer-events-none border border-white/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    </div>

                    <Button
                        onClick={() => onSelect(currentKey, currentAppearance)}
                        className="w-full h-16 text-2xl font-fantasy font-bold relative overflow-hidden group bg-transparent border-0"
                    >
                        <div className="absolute inset-0 bg-gradient-to-r from-amber-700 via-amber-600 to-amber-700 transition-all duration-300 group-hover:scale-105"></div>
                        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-10"></div>
                        <span className="relative z-10 flex items-center justify-center gap-3 text-amber-50 drop-shadow-md">
                            <Play className="fill-current" /> JUGAR
                        </span>
                        {/* Shimmer effect */}
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-shimmer bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"></div>
                    </Button>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em]">
                        WASD Mover • Click Atacar • I Inventario
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
