import { useState, useEffect, useRef } from 'react';
import { useGamepadControls } from './useGamepadControls';

interface UseMenuNavigationProps {
    itemsCount: number;
    cols?: number;
    initialIndex?: number;
    loop?: boolean;
    onSelect?: (index: number) => void;
    onBack?: () => void;
    isActive?: boolean;
}

export function useMenuNavigation({
    itemsCount,
    cols = 1,
    initialIndex = 0,
    loop = false,
    onSelect,
    onBack,
    isActive = true
}: UseMenuNavigationProps) {
    const [selectedIndex, setSelectedIndex] = useState(initialIndex);
    const { pollGamepad, isPressing } = useGamepadControls();

    // We need a ref to track if we've already handled an action in this "frame" of polling 
    // or rely on isPressing's internal throttle. isPressing has a delay.

    useEffect(() => {
        if (!isActive) return;

        let animationFrameId: number;

        const checkInput = () => {
            const state = pollGamepad();
            if (state) {
                // Navigation
                if (isPressing('dpadDown')) {
                    setSelectedIndex(prev => {
                        const next = prev + cols;
                        if (next >= itemsCount) {
                            return loop ? next % itemsCount : prev; // Wrap or clamp? Grid wrap is weird.
                        }
                        return next;
                    });
                }
                if (isPressing('dpadUp')) {
                    setSelectedIndex(prev => {
                        const next = prev - cols;
                        if (next < 0) return prev;
                        return next;
                    });
                }
                if (isPressing('dpadRight')) {
                    setSelectedIndex(prev => {
                        if (cols === 1) return loop ? (prev + 1) % itemsCount : Math.min(prev + 1, itemsCount - 1);
                        // In grid, right moves +1 but shouldn't wrap to next row usually, but simpler is +1
                        const next = prev + 1;
                        if (next >= itemsCount) return loop ? 0 : prev;
                        return next;
                    });
                }
                if (isPressing('dpadLeft')) {
                    setSelectedIndex(prev => {
                        const next = prev - 1;
                        if (next < 0) return loop ? itemsCount - 1 : 0;
                        return next;
                    });
                }

                // Actions
                if (isPressing('buttonA')) {
                    // We need the CURRENT selectedIndex provided by state, but inside this closure 
                    // state is stale? No, setState callback uses latest. 
                    // But onSelect(selectedIndex) uses the selectedIndex from closure scope.
                    // We need a ref for selectedIndex.
                }

                if (isPressing('buttonB')) {
                    if (onBack) onBack();
                }
            }
            animationFrameId = requestAnimationFrame(checkInput);
        };

        animationFrameId = requestAnimationFrame(checkInput);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, itemsCount, cols, loop, onBack]); // Removed onSelect/selectedIndex dependencies to avoid re-binding loop

    // Separate effect for selection to access latest index
    useEffect(() => {
        if (!isActive) return;
        let animationFrameId: number;

        const checkAction = () => {
            const state = pollGamepad();
            if (state && isPressing('buttonA')) {
                if (onSelect) onSelect(selectedIndex);
            }
            animationFrameId = requestAnimationFrame(checkAction);
        }
        animationFrameId = requestAnimationFrame(checkAction);
        return () => cancelAnimationFrame(animationFrameId);
    }, [isActive, onSelect, selectedIndex]); // This one depends on selectedIndex

    return { selectedIndex, setSelectedIndex };
}
