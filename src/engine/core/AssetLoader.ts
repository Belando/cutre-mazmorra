export class AssetLoader {
    private static instance: AssetLoader;
    private images: Map<string, HTMLImageElement>;
    private loading: Map<string, Promise<HTMLImageElement>>;

    private constructor() {
        this.images = new Map();
        this.loading = new Map();
    }

    public static getInstance(): AssetLoader {
        if (!AssetLoader.instance) {
            AssetLoader.instance = new AssetLoader();
        }
        return AssetLoader.instance;
    }

    public loadImage(key: string, src: string): Promise<HTMLImageElement> {
        if (this.images.has(key)) {
            return Promise.resolve(this.images.get(key)!);
        }

        if (this.loading.has(key)) {
            return this.loading.get(key)!;
        }

        const promise = new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => {
                this.images.set(key, img);
                this.loading.delete(key);
                resolve(img);
            };
            img.onerror = () => {
                console.warn(`Failed to load asset: ${key}, utilizing fallback.`);
                // Fallback to placeholder
                const placeholder = this.createPlaceholder(key);
                this.images.set(key, placeholder);
                this.loading.delete(key);
                resolve(placeholder);
            };
            img.src = src;
        });

        this.loading.set(key, promise);
        return promise;
    }

    private createPlaceholder(key: string): HTMLImageElement {
        const canvas = document.createElement('canvas');
        canvas.width = 32;
        canvas.height = 32;
        const ctx = canvas.getContext('2d');
        if (ctx) {
            // Generate color based on key hash
            let hash = 0;
            for (let i = 0; i < key.length; i++) {
                hash = key.charCodeAt(i) + ((hash << 5) - hash);
            }
            const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
            const color = '#' + '00000'.substring(0, 6 - c.length) + c;

            ctx.fillStyle = color;
            ctx.fillRect(0, 0, 32, 32);

            // Add border
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.strokeRect(0, 0, 32, 32);

            // Add Text
            ctx.fillStyle = 'white';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(key.substring(0, 3).toUpperCase(), 16, 16);
        }

        const img = new Image();
        img.src = canvas.toDataURL();
        return img;
    }

    public get(key: string): HTMLImageElement | undefined {
        return this.images.get(key);
    }

    public has(key: string): boolean {
        return this.images.has(key);
    }
}

export const assetLoader = AssetLoader.getInstance();
