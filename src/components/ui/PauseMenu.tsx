import React from 'react';
import { Button } from '@/components/ui/button';
import {
    GiBackpack,
    GiTreeGrowth,
    GiScrollQuill,
    GiTreasureMap,
    GiSave,
    GiLoad,
    GiExitDoor,
    GiPauseButton
} from 'react-icons/gi';

interface PauseMenuProps {
    isOpen: boolean;
    onResume: () => void;
    onOpenInventory: () => void;
    onOpenSkills: () => void;
    onOpenQuests: () => void;
    onOpenMap: () => void;
    onSave: () => void;
    onLoad: () => void;
    onExit: () => void;
}

export default function PauseMenu({
    isOpen,
    onResume,
    onOpenInventory,
    onOpenSkills,
    onOpenQuests,
    onOpenMap,
    onSave,
    onLoad,
    onExit
}: PauseMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="w-80 p-6 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col gap-4">
                <div className="flex items-center justify-center gap-3 mb-2 text-slate-200">
                    <GiPauseButton className="w-8 h-8" />
                    <h2 className="text-2xl font-bold tracking-widest uppercase">PAUSA</h2>
                </div>

                <div className="w-full h-px bg-slate-700/50 mb-2"></div>

                <Button onClick={onResume} className="w-full justify-start gap-4 text-base h-12 bg-emerald-700 hover:bg-emerald-600 border-emerald-500/50">
                    <GiPauseButton className="w-5 h-5 rotate-90" /> Reanudar Partida
                </Button>

                <div className="grid grid-cols-2 gap-3">
                    <Button onClick={onOpenInventory} className="w-full justify-start gap-2 h-10 bg-slate-800 hover:bg-slate-700 border-slate-600/50">
                        <GiBackpack className="w-4 h-4 text-amber-400" /> Inventario
                    </Button>
                    <Button onClick={onOpenSkills} className="w-full justify-start gap-2 h-10 bg-slate-800 hover:bg-slate-700 border-slate-600/50">
                        <GiTreeGrowth className="w-4 h-4 text-purple-400" /> Habilidades
                    </Button>
                    <Button onClick={onOpenQuests} className="w-full justify-start gap-2 h-10 bg-slate-800 hover:bg-slate-700 border-slate-600/50">
                        <GiScrollQuill className="w-4 h-4 text-blue-400" /> Misiones
                    </Button>
                    <Button onClick={onOpenMap} className="w-full justify-start gap-2 h-10 bg-slate-800 hover:bg-slate-700 border-slate-600/50">
                        <GiTreasureMap className="w-4 h-4 text-emerald-500" /> Mapa
                    </Button>
                </div>

                <div className="w-full h-px bg-slate-700/50 my-1"></div>

                <div className="flex flex-col gap-2">
                    <Button onClick={onSave} className="w-full justify-start gap-4 bg-slate-800 hover:bg-slate-700 border-slate-600/50">
                        <GiSave className="w-5 h-5 text-yellow-500" /> Guardar Partida
                    </Button>
                    <Button onClick={onLoad} className="w-full justify-start gap-4 bg-slate-800 hover:bg-slate-700 border-slate-600/50">
                        <GiLoad className="w-5 h-5 text-cyan-500" /> Cargar Partida
                    </Button>
                </div>

                <div className="w-full h-px bg-slate-700/50 my-1"></div>

                <Button onClick={onExit} className="w-full justify-start gap-4 bg-red-900/40 hover:bg-red-900/60 border-red-800/30 text-red-100">
                    <GiExitDoor className="w-5 h-5" /> Menú Principal
                </Button>
            </div>
        </div>
    );
}
