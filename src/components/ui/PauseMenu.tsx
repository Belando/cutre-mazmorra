import React from 'react';
import { Button } from '@/components/ui/button';
import {
    GiCrossedSwords,
    GiBookCover,
    GiTrophy,
    GiCompass,
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
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md">
            <div className="w-96 relative">
                {/* ORNATE BORDER CONTAINER */}
                <div className="absolute -inset-1 bg-gradient-to-b from-amber-600 via-slate-700 to-amber-600 rounded-2xl blur opacity-30"></div>

                <div className="relative p-8 bg-slate-950/95 border border-slate-700 rounded-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] flex flex-col gap-5">

                    {/* HEADER */}
                    <div className="flex flex-col items-center justify-center gap-2 mb-2">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-t from-slate-900 to-slate-800 border-2 border-amber-500/50 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
                            <GiPauseButton className="w-8 h-8 text-amber-500" />
                        </div>
                        <h2 className="text-3xl font-bold tracking-[0.2em] uppercase font-fantasy text-amber-500 drop-shadow-[0_2px_4px_black] text-transparent bg-clip-text bg-gradient-to-b from-amber-300 to-amber-600">
                            PAUSA
                        </h2>
                        <div className="flex items-center gap-2 w-full opacity-50">
                            <div className="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1"></div>
                            <div className="w-2 h-2 rotate-45 border border-amber-500 bg-slate-900"></div>
                            <div className="h-px bg-gradient-to-r from-transparent via-amber-500 to-transparent flex-1"></div>
                        </div>
                    </div>

                    {/* MAIN ACTIONS */}
                    <Button onClick={onResume} className="w-full justify-center gap-2 h-14 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/30 hover:border-emerald-400 group transition-all">
                        <GiPauseButton className="w-5 h-5 rotate-90 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-lg font-bold text-emerald-100 group-hover:text-white tracking-wide">REANUDAR</span>
                    </Button>

                    <div className="grid grid-cols-2 gap-3">
                        <MenuButton icon={GiCrossedSwords} label="Equipo" sub="Inventario" onClick={onOpenInventory} color="text-amber-400" />
                        <MenuButton icon={GiBookCover} label="Talentos" sub="Habilidades" onClick={onOpenSkills} color="text-purple-400" />
                        <MenuButton icon={GiTrophy} label="Logros" sub="Misiones" onClick={onOpenQuests} color="text-blue-400" />
                        <MenuButton icon={GiCompass} label="Mundo" sub="Mapa" onClick={onOpenMap} color="text-emerald-400" />
                    </div>

                    {/* SEPARATOR */}
                    <div className="w-full h-px bg-slate-800 my-1"></div>

                    {/* SYSTEM ACTIONS */}
                    <div className="flex flex-col gap-2">
                        <Button onClick={onSave} variant="ghost" className="w-full justify-start gap-4 hover:bg-amber-900/10 hover:text-amber-400 text-slate-400 border border-transparent hover:border-amber-900/30">
                            <GiSave className="w-5 h-5" /> Guardar Partida
                        </Button>
                        <Button onClick={onLoad} variant="ghost" className="w-full justify-start gap-4 hover:bg-cyan-900/10 hover:text-cyan-400 text-slate-400 border border-transparent hover:border-cyan-900/30">
                            <GiLoad className="w-5 h-5" /> Cargar Partida
                        </Button>
                    </div>

                    {/* EXIT */}
                    <div className="pt-2">
                        <Button onClick={onExit} className="w-full justify-center gap-2 h-10 bg-red-950/20 hover:bg-red-900/40 border border-red-900/30 text-red-400 hover:text-red-200 uppercase tracking-widest text-xs font-bold">
                            <GiExitDoor className="w-4 h-4" /> Salir al Menú
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}

function MenuButton({ icon: Icon, label, sub, onClick, color }: any) {
    return (
        <Button
            onClick={onClick}
            className="w-full justify-start gap-3 h-14 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-600 text-slate-300 hover:text-white group transition-all relative overflow-hidden"
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${color.replace('text', 'bg')} opacity-0 group-hover:opacity-100 transition-opacity`}></div>
            <div className={`p-2 rounded bg-slate-950 border border-slate-800 group-hover:border-${color.split('-')[1]}-500/50 transition-colors`}>
                <Icon className={`w-5 h-5 ${color} group-hover:scale-110 transition-transform`} />
            </div>
            <div className="flex flex-col items-start gap-0.5 leading-none">
                <span className="text-sm font-bold tracking-wide uppercase">{label}</span>
                <span className="text-[10px] text-slate-500 font-mono tracking-tighter">{sub}</span>
            </div>
        </Button>
    )
}
