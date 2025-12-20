
import { useEffect, useState, useRef } from 'react';
import { useGamepadControls } from '@/hooks/useGamepadControls';
import { MousePointer2 } from 'lucide-react';

interface VirtualCursorProps {
    isActive: boolean;
}

export default function VirtualCursor({ isActive }: VirtualCursorProps) {
    const [position, setPosition] = useState({ x: window.innerWidth / 2, y: window.innerHeight / 2 });
    const [isVisible, setIsVisible] = useState(false);
    const { getRightStick, isPressing, pollGamepad } = useGamepadControls();

    // We use a ref for position to avoid stale state in the animation loop
    const posRef = useRef(position);
    // Track if we are in "cursor mode" (user moved the stick)
    const activeRef = useRef(false);

    useEffect(() => {
        if (!isActive) {
            setIsVisible(false);
            return;
        }

        let animationFrameId: number;
        let lastTime = 0;

        const handleGameLoop = (time: number) => {
            if (lastTime === 0) lastTime = time;
            // delta unused
            lastTime = time;

            // Poll gamepad state
            pollGamepad();
            const stick = getRightStick();

            // If stick moved, activate cursor
            if (stick.x !== 0 || stick.y !== 0) {
                if (!activeRef.current) {
                    activeRef.current = true;
                    setIsVisible(true);
                }

                // Update position
                const speed = 15; // Speed factor
                let newX = posRef.current.x + stick.x * speed;
                let newY = posRef.current.y + stick.y * speed;

                // Clamp to screen
                newX = Math.max(0, Math.min(newX, window.innerWidth));
                newY = Math.max(0, Math.min(newY, window.innerHeight));

                posRef.current = { x: newX, y: newY };
                setPosition({ x: newX, y: newY });

                // Simulate hover?
                // document.elementFromPoint(newX, newY)?.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
                // Triggering real mouse events is risky/complex. CSS :hover won't work.
                // But for "clicking", we just need the coords.
            }

            // Click handling (mapped to Right Trigger or R3 or A?)
            // Let's use Right Stick Click (Button 11? No wait, standard is Buttons[10/11])
            // Or maybe just Button A (Main Action) if cursor is active?
            // If we use Button A, it might conflict with normal navigation A.
            // But if cursor is active, maybe we prioritize cursor click?
            // Let's us Button RT (Right Trigger) or R1 for "Mouse Click" feel.

            // Check for click triggers
            // We need to access buttons directly or update useGamepadControls to expose triggers
            // Currently isPressing handles buttons. Let's use 'r1' (Button 5) for Click

            if (activeRef.current && isPressing('r1')) {
                const element = document.elementFromPoint(posRef.current.x, posRef.current.y);
                if (element) {
                    // Click the element
                    (element as HTMLElement).click();

                    // Visual feedback?
                    const ripple = document.createElement('div');
                    ripple.className = 'fixed w-4 h-4 bg-white/50 rounded-full animate-ping pointer-events-none z-[100]';
                    ripple.style.left = `${posRef.current.x - 8}px`;
                    ripple.style.top = `${posRef.current.y - 8}px`;
                    document.body.appendChild(ripple);
                    setTimeout(() => ripple.remove(), 500);
                }
            }

            animationFrameId = requestAnimationFrame(handleGameLoop);
        };

        animationFrameId = requestAnimationFrame(handleGameLoop);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, getRightStick, isPressing, pollGamepad]);

    if (!isVisible) return null;

    return (
        <div
            className="fixed z-[9999] pointer-events-none text-white drop-shadow-md"
            style={{
                left: position.x,
                top: position.y,
                transform: 'translate(-5px, -5px)' // Offset to center pointer tip? Standard cursors are top-left based.
            }}
        >
            <MousePointer2 className="w-6 h-6 fill-blue-500 text-black" />
            <div className="absolute top-full left-5 text-[9px] bg-black/80 px-1 rounded text-white font-mono whitespace-nowrap">
                R1 Click
            </div>
        </div>
    );
}
