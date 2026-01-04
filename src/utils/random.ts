/**
 * Seeded Random Number Generator using Mulberry32 algorithm.
 * Deterministic output based on a 32-bit integer seed.
 */
export class SeededRandom {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a float between 0 (inclusive) and 1 (exclusive).
     * Equivalent to Math.random()
     */
    next(): number {
        let t = this.seed += 0x6D2B79F5;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    }

    /**
     * Returns an integer between min and max (inclusive of min, exclusive of max).
     */
    range(min: number, max: number): number {
        return Math.floor(this.next() * (max - min) + min);
    }

    /**
     * Returns an integer between min and max (inclusive of both).
     */
    int(min: number, max: number): number {
        return Math.floor(this.next() * (max - min + 1) + min);
    }

    /**
     * Returns true if the next value is less than the probability.
     * @param probability 0 to 1
     */
    chance(probability: number): boolean {
        return this.next() < probability;
    }

    /**
     * Returns a random element from an array.
     */
    pick<T>(array: T[]): T | undefined {
        if (array.length === 0) return undefined;
        return array[this.int(0, array.length - 1)];
    }

    /**
     * Shuffles an array in place using Fisher-Yates.
     */
    shuffle<T>(array: T[]): T[] {
        for (let i = array.length - 1; i > 0; i--) {
            const j = this.int(0, i);
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }
}
