import React from 'react';

interface TurnTimerProps {
    duration: number;
    trigger: any;
}

export default function TurnTimer({ duration, trigger }: TurnTimerProps) {
    return (
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700 shadow-inner opacity-80">
            <div
                key={trigger}
                className="h-full bg-gradient-to-r from-amber-500 to-red-600 origin-left"
                style={{
                    animation: `shrink ${duration}ms linear forwards`
                }}
            />
            <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
        </div>
    );
}
