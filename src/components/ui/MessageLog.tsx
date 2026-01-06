import React, { useEffect, useRef } from 'react';
import { ScrollText } from 'lucide-react';
import { GameMessage } from '@/hooks/useGameEffects';

interface MessageLogProps {
    messages: GameMessage[];
    onCommand?: (cmd: string) => void;
    isFocused?: boolean;
    onFocusChange?: (focused: boolean) => void;
}

export default function MessageLog({ messages, onCommand, isFocused, onFocusChange }: MessageLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = React.useState('');

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    useEffect(() => {
        if (isFocused && inputRef.current) {
            inputRef.current.focus();
        } else if (!isFocused && inputRef.current) {
            inputRef.current.blur();
        }
    }, [isFocused]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (inputValue.trim() && onCommand) {
            onCommand(inputValue);
            setInputValue('');
        }
        // Always blur on submit (close chat)
        if (onFocusChange) onFocusChange(false);
    };

    return (
        <div className="h-full overflow-hidden border rounded-lg bg-black/60 backdrop-blur-md border-slate-700/50 flex flex-col">
            <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-700/50 bg-slate-900/80">
                <ScrollText className="w-3 h-3 text-slate-400" />
                <span className="text-xs font-bold text-slate-300 font-fantasy tracking-wider uppercase">Registro de Combate</span>
            </div>
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-2 space-y-0.5 custom-scrollbar min-h-0"
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

            {/* Command Input */}
            <form onSubmit={handleSubmit} className="p-1 border-t border-slate-700/50 bg-slate-900/40">
                <input
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Escribe un comando..."
                    className="w-full bg-transparent border-none text-xs text-white placeholder-slate-600 focus:ring-0 px-2 py-1"
                />
            </form>
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
