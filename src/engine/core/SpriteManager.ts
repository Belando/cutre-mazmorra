export class SpriteManager {
    private static instance: SpriteManager;
    private cache: Map<string, CanvasImageSource>; // Cambiado a CanvasImageSource
    private loading: Map<string, Promise<CanvasImageSource>>;

    private constructor() {
        this.cache = new Map();
        this.loading = new Map();
    }

    public static getInstance(): SpriteManager {
        if (!SpriteManager.instance) {
            SpriteManager.instance = new SpriteManager();
        }
        return SpriteManager.instance;
    }

    public load(key: string, src: string): Promise<CanvasImageSource> {
        if (this.cache.has(key)) {
            return Promise.resolve(this.cache.get(key)!);
        }

        if (this.loading.has(key)) {
            return this.loading.get(key)!;
        }

        const promise = new Promise<CanvasImageSource>((resolve, reject) => {
            const img = new Image();
            img.src = src;
            img.onload = () => {
                // AUTO-PROCESS: Eliminar fondo blanco/gris para warrior, door y decor
                if (key.startsWith('warrior') || key.startsWith('door') ||
                    ['bones', 'rubble', 'bloodstain', 'crack'].includes(key)) {
                    try {
                        const processed = this.removeWhiteBackground(img);
                        this.cache.set(key, processed);
                        this.loading.delete(key);
                        resolve(processed);
                    } catch (e) {
                        console.error("Error processing transparency", e);
                        // Fallback a imagen normal
                        this.cache.set(key, img);
                        this.loading.delete(key);
                        resolve(img);
                    }
                } else {
                    this.cache.set(key, img);
                    this.loading.delete(key);
                    resolve(img);
                }
            };
            img.onerror = (err) => {
                console.error(`Failed to load sprite: ${src}`, err);
                this.loading.delete(key);
                reject(err);
            };
        });

        this.loading.set(key, promise);
        return promise;
    }

    public get(key: string): CanvasImageSource | undefined {
        return this.cache.get(key);
    }

    private removeWhiteBackground(img: HTMLImageElement): HTMLCanvasElement {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context failed");

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Tolerancia para blanco y grises claros (Checkerboard típico de editores)
        // El checkerboard suele ser blanco (255) y gris (204 o similares)

        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            // 1. Filtrar Blanco casi puro
            const isWhite = r > 230 && g > 230 && b > 230;

            // 2. Filtrar "Gris Checkerboard" (R=G=B y están en rango amplio)
            // Bajamos el umbral a > 50 para coger grises más oscuros
            const isGrey = (Math.abs(r - g) < 15 && Math.abs(g - b) < 15) && (r > 50);

            if (isWhite || isGrey) {
                data[i + 3] = 0; // Alpha a 0
            }
        }

        ctx.putImageData(imageData, 0, 0);
        return canvas;
    }
}

export const spriteManager = SpriteManager.getInstance();
