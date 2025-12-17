import { Entity, SpriteComponent } from "@/types";

export class AnimationSystem {
    update(dt: number, entities: Entity[]) {
        entities.forEach(entity => {
            if (entity.sprite) {
                this.updateSprite(dt, entity.sprite);
            }
        });
    }

    private updateSprite(dt: number, sprite: SpriteComponent) {
        sprite.frameTimer += dt;
        if (sprite.frameTimer >= sprite.frameDuration) {
            sprite.frameTimer -= sprite.frameDuration;
            sprite.currentFrameIndex++;

            const frames = sprite.anims[sprite.currentAnim];
            if (frames && sprite.currentFrameIndex >= frames.length) {
                sprite.currentFrameIndex = 0; // Loop
            }
        }
    }

    getFrame(sprite: SpriteComponent): { x: number, y: number, w: number, h: number } | null {
        const frames = sprite.anims[sprite.currentAnim];
        if (!frames) return null;

        const frameIndex = frames[sprite.currentFrameIndex] || 0;

        // Asumimos spritesheet horizontal por simplicidad, o grid si frameSize está definido
        // Para empezar, haremos una tira horizontal simple
        // Si frameSize es {32,32}, frame 0 es x=0, frame 1 es x=32...

        return {
            x: frameIndex * sprite.frameSize.x,
            y: 0,
            w: sprite.frameSize.x,
            h: sprite.frameSize.y
        };
    }
}

export const animationSystem = new AnimationSystem();
