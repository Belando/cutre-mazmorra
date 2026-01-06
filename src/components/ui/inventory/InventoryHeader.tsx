import { GiBackpack, GiCoins, GiWoodPile, GiStoneBlock } from 'react-icons/gi';

interface InventoryHeaderProps {
    materialCounts: Record<string, number>;
    formattedGold: string;
}

export function InventoryHeader({ materialCounts, formattedGold }: InventoryHeaderProps) {
    return (
        <div className="flex items-center justify-between p-4 border-b border-white/5 bg-slate-900/40 backdrop-blur-sm">
            <h2 className="flex items-center gap-3 text-2xl font-bold text-amber-500 font-fantasy tracking-wider drop-shadow-md">
                <GiBackpack className="w-8 h-8" /> Mochila
            </h2>

            <div className="flex items-center gap-4">
                {/* Resources */}
                <div className="flex items-center gap-4 px-4 py-1.5 border rounded-full bg-black/40 border-white/10 shadow-inner backdrop-blur-sm">
                    <div className="flex items-center gap-2" title="Madera">
                        <GiWoodPile className="w-5 h-5 text-amber-700" />
                        <span className="text-sm font-bold text-slate-300 font-mono">{materialCounts.wood || 0}</span>
                    </div>
                    <div className="w-px h-4 bg-white/10"></div>
                    <div className="flex items-center gap-2" title="Piedra">
                        <GiStoneBlock className="w-4 h-4 text-slate-500" />
                        <span className="text-sm font-bold text-slate-300 font-mono">{materialCounts.stone || 0}</span>
                    </div>
                </div>

                {/* Gold */}
                <div className="flex items-center gap-2 px-4 py-1.5 border rounded-full bg-gradient-to-r from-amber-950/40 to-black/40 border-amber-500/30 backdrop-blur-sm">
                    <GiCoins className="w-5 h-5 text-yellow-500 drop-shadow-sm" />
                    <span className="font-mono text-lg font-bold text-yellow-100">{formattedGold}</span>
                </div>
            </div>
        </div>
    );
}
