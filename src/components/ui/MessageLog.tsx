import { useEffect, useRef } from 'react';
import { ScrollText } from 'lucide-react';
import { GameMessage } from '@/hooks/useGameEffects';

interface MessageLogProps {
    messages: GameMessage[];
}

export default function MessageLog({ messages }: MessageLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="h-full overflow-hidden border rounded-lg bg-slate-900/50 backdrop-blur-sm border-slate-700/50 relative">
            <style>{`
                .scrollbar-thin::-webkit-scrollbar { width: 6px; }
                .scrollbar-thin::-webkit-scrollbar-track { background: transparent; }
                .scrollbar-thin::-webkit-scrollbar-thumb { background-color: rgba(30, 41, 59, 0.8); border-radius: 3px; }
                .scrollbar-thin::-webkit-scrollbar-thumb:hover { background-color: rgba(51, 65, 85, 0.8); }
            `}</style>
            <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-700/50">
                <ScrollText className="w-3 h-3 text-slate-400" />
                <span className="text-xs font-medium text-slate-300">Registro de Combate</span>
            </div>
            <div
                ref={scrollRef}
                className="h-[calc(100%-28px)] overflow-y-auto p-2 space-y-0.5 scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent"
            >
                {messages.slice(-30).map((msg, i) => (
                    <p
                        key={i}
                        className={`text-xs ${getMessageColor(msg.type)} leading-relaxed`}
                    >
                        {msg.text}
                    </p>
                ))}
            </div>
        </div>
    );
}

function getMessageColor(type: string): string {
    switch (type) {
        case 'player_damage': return 'text-green-400';
        case 'enemy_damage': return 'text-red-400';
        case 'damage': return 'text-orange-400';
        case 'heal': return 'text-emerald-400';
        case 'pickup': return 'text-yellow-400';
        case 'levelup': return 'text-purple-400 font-semibold';
        case 'info': return 'text-blue-400';
        case 'death': return 'text-red-500 font-semibold';
        default: return 'text-slate-400';
    }
}
