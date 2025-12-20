import React from 'react';
import { motion } from 'framer-motion';
import { Button } from "@/components/ui/button";

interface VictoryScreenProps {
    stats: any;
    onRestart: () => void;
}

export default function VictoryScreen({ stats, onRestart }: VictoryScreenProps) {
    return (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm">
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="max-w-md p-8 text-center border-2 border-yellow-500 rounded-lg shadow-2xl bg-zinc-900"
            >
                <div className="mb-6 text-6xl">🏆</div>
                <h2 className="mb-2 text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">
                    ¡VICTORIA!
                </h2>
                <p className="mb-8 text-lg text-yellow-200">
                    Has derrotado al Dragón Ancestral y liberado la mazmorra.
                </p>

                <div className="grid grid-cols-2 gap-4 mb-8 text-left">
                    <div className="p-3 rounded bg-zinc-800">
                        <div className="text-xs text-zinc-400">Nivel Alcanzado</div>
                        <div className="text-xl font-bold text-white">{stats.level || 1}</div>
                    </div>
                    <div className="p-3 rounded bg-zinc-800">
                        <div className="text-xs text-zinc-400">Enemigos Derrotados</div>
                        <div className="text-xl font-bold text-white">{stats.kills || 0}</div>
                    </div>
                    <div className="p-3 rounded bg-zinc-800">
                        <div className="text-xs text-zinc-400">Turnos</div>
                        <div className="text-xl font-bold text-white">{stats.turns || 0}</div>
                    </div>
                    <div className="p-3 rounded bg-zinc-800">
                        <div className="text-xs text-zinc-400">Daño Total</div>
                        <div className="text-xl font-bold text-white">{stats.damageDealt || 0}</div>
                    </div>
                </div>

                <Button
                    onClick={onRestart}
                    className="w-full py-6 text-xl font-bold text-black bg-yellow-500 hover:bg-yellow-400"
                >
                    Jugar de Nuevo
                </Button>
            </motion.div>
        </div>
    );
}
