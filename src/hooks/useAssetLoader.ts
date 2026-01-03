import { useState, useEffect } from 'react';
import { spriteManager } from '@/engine/core/SpriteManager';

import { ASSET_MANIFEST } from '@/data/assets';

const REQUIRED_ASSETS = ASSET_MANIFEST;

export function useAssetLoader() {
    const [loading, setLoading] = useState(true);
    const [progress, setProgress] = useState(0);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        let loadedCount = 0;
        let isMounted = true;

        const loadAll = async () => {
            try {
                const promises = REQUIRED_ASSETS.map(async (asset) => {
                    await spriteManager.load(asset.key, asset.src);
                    if (isMounted) {
                        loadedCount++;
                        setProgress(Math.round((loadedCount / REQUIRED_ASSETS.length) * 100));
                    }
                });

                await Promise.all(promises);

                if (isMounted) {
                    setLoading(false);
                }
            } catch (err) {
                console.error("Failed to load assets", err);
                if (isMounted) {
                    setError(err);
                    setLoading(false);
                }
            }
        };

        loadAll();

        return () => {
            isMounted = false;
        };
    }, []);

    return { loading, progress, error };
}
