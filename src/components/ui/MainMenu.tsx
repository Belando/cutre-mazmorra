import React from 'react';
import { Button } from "@/components/ui/button";
import { GiBackpack, GiTreeGrowth, GiSave, GiExitDoor, GiPlayButton } from 'react-icons/gi';

interface MainMenuProps {
    isOpen: boolean;
    onClose: () => void;
    onOpenInventory: () => void;
    onOpenSkills: () => void;
    onSave: () => void;
    onQuit: () => void; // Reloads window for now
}

export default function MainMenu({
    isOpen,
    onClose,
    onOpenInventory,
    onOpenSkills,
    onSave,
    onQuit
}: MainMenuProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 p-6 rounded-2xl shadow-2xl w-80 flex flex-col gap-4">
                <h2 className="text-2xl font-bold text-center text-emerald-400 mb-2 font-serif tracking-wide border-b border-slate-800 pb-4">
                    PAUSA
                </h2>

                <Button onClick={onClose} className="w-full justify-start gap-4 h-12 text-lg bg-emerald-900/50 hover:bg-emerald-800 border-emerald-700/50">
                    <GiPlayButton className="w-6 h-6" /> Continuar
                </Button>

                <Button onClick={() => { onOpenInventory(); onClose(); }} className="w-full justify-start gap-4 h-12 text-lg bg-slate-800 hover:bg-slate-700 border-slate-600">
                    <GiBackpack className="w-6 h-6" /> Inventario [I]
                </Button>

                <Button onClick={() => { onOpenSkills(); onClose(); }} className="w-full justify-start gap-4 h-12 text-lg bg-purple-900/50 hover:bg-purple-800 border-purple-700/50">
                    <GiTreeGrowth className="w-6 h-6" /> Habilidades [T]
                </Button>

                <Button onClick={onSave} className="w-full justify-start gap-4 h-12 text-lg bg-blue-900/50 hover:bg-blue-800 border-blue-700/50">
                    <GiSave className="w-6 h-6" /> Guardar [G]
                </Button>

                <div className="h-px bg-slate-800 my-2" />

                <Button onClick={onQuit} variant="destructive" className="w-full justify-start gap-4 h-12 text-lg border-red-900/50">
                    <GiExitDoor className="w-6 h-6" /> Salir del Juego
                </Button>
            </div>
        </div>
    );
}
