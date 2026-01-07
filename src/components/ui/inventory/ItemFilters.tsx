

export type SortMethod = 'newest' | 'rarity' | 'type' | 'value';

interface ItemFiltersProps {
    currentFilter: string;
    onFilterChange: (category: string) => void;
    currentSort: SortMethod;
    onSortChange: (method: SortMethod) => void;
}

export function ItemFilters({ currentFilter, onFilterChange, currentSort, onSortChange }: ItemFiltersProps) {
    const categories = [
        { id: 'all', label: 'Todos' },
        { id: 'weapon', label: 'Armas' },
        { id: 'armor', label: 'Armadura' },
        { id: 'potion', label: 'Pociones' },
        { id: 'material', label: 'Materiales' }
    ];

    const sortMethods: { id: SortMethod; label: string }[] = [
        { id: 'newest', label: 'Reciente' },
        { id: 'rarity', label: 'Rareza' },
        { id: 'value', label: 'Valor' },
        { id: 'type', label: 'Tipo' }
    ];

    return (
        <div className="flex flex-col gap-2 p-4 border-b border-white/5 bg-slate-900/50">
            <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                {categories.map(cat => (
                    <button
                        key={cat.id}
                        onClick={() => onFilterChange(cat.id)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-colors whitespace-nowrap ${currentFilter === cat.id
                            ? 'bg-amber-500 text-black'
                            : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                            }`}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar items-center">
                <span className="text-xs text-slate-500 mr-1">Ordenar:</span>
                {sortMethods.map(method => (
                    <button
                        key={method.id}
                        onClick={() => onSortChange(method.id)}
                        className={`px-2 py-0.5 rounded text-[10px] uppercase tracking-wider transition-colors whitespace-nowrap ${currentSort === method.id
                            ? 'bg-slate-600 text-white'
                            : 'bg-slate-900/50 text-slate-500 hover:text-slate-300'
                            }`}
                    >
                        {method.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
