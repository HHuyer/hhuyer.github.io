import { BLOCK_DEFINITIONS } from './block-definitions.js';

export class Block {
    constructor(x, y, width, height, blockType = 'stone') {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.blockType = blockType;
        this.destroyed = false;
        this.hasExperienceBottle = false;

        const definition = BLOCK_DEFINITIONS[blockType] || BLOCK_DEFINITIONS['stone'];
        this.health = definition.health;
        this.maxHealth = definition.health;
        this.isDeepslate = definition.isDeepslate || false;
        
        this.damageState = 0;
        // Initialize horizontal spread count for water blocks
        if (blockType === 'water') {
            this.horizontalSpreadCount = 0;
        }
    }

    takeDamage(damage) {
        if (this.destroyed) return;
        
        // Special handling for TNT - explode on first hit
        if (this.blockType === 'tnt') {
            this.health = 0;
            this.destroyed = true;
            return;
        }
        
        this.health -= damage;
        
        const damageRatio = Math.max(0, 1 - this.health / this.maxHealth);
        this.damageState = Math.min(window.damageSprites.length, Math.floor(damageRatio * (window.damageSprites.length + 1)));

        if (this.health <= 0) {
            this.health = 0;
            this.destroyed = true;
        }
    }

    draw(ctx) {
        if (this.destroyed) return;
        
        const definition = BLOCK_DEFINITIONS[this.blockType] || BLOCK_DEFINITIONS['stone'];
        const baseImage = window[definition.textureKey];
        
        if (baseImage && baseImage.complete) {
            ctx.drawImage(baseImage, this.x, this.y, this.width, this.height);
        } else {
            ctx.fillStyle = definition.fallbackColor || '#8B4513';
            ctx.fillRect(this.x, this.y, this.width, this.height);
        }
        
        if (this.damageState > 0) {
            const spriteIndex = this.damageState - 1;
            if (spriteIndex < window.damageSprites.length) {
                const damageSprite = window.damageSprites[spriteIndex];
                if (damageSprite && damageSprite.complete) {
                    ctx.globalAlpha = 0.8;
                    ctx.drawImage(damageSprite, this.x, this.y, this.width, this.height);
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }

    intersects(pickaxe) {
        return pickaxe.x < this.x + this.width &&
               pickaxe.x + pickaxe.width > this.x &&
               pickaxe.y < this.y + this.height &&
               pickaxe.y + pickaxe.height > this.y;
    }

    // New method for Swept AABB intersection to prevent tunneling
    sweptIntersects(pickaxe) {
        // Broad-phase check: If the bounding boxes of the swept areas don't intersect, no collision.
        const broadphaseBox = {
            x: Math.min(pickaxe.x, pickaxe.prevX),
            y: Math.min(pickaxe.y, pickaxe.prevY),
            width: Math.abs(pickaxe.x - pickaxe.prevX) + pickaxe.width,
            height: Math.abs(pickaxe.y - pickaxe.prevY) + pickaxe.height
        };

        if (broadphaseBox.x > this.x + this.width ||
            broadphaseBox.x + broadphaseBox.width < this.x ||
            broadphaseBox.y > this.y + this.height ||
            broadphaseBox.y + broadphaseBox.height < this.y) {
            return false;
        }

        // Narrow-phase check: Test against the current position. If it intersects, it's a definite collision.
        // This handles cases where the pickaxe is already inside a block.
        if (this.intersects(pickaxe)) {
            return true;
        }
        
        // If it was not intersecting at the end, and the broadphase check passed,
        // it means a high-speed collision (tunneling) might have occurred.
        // The collision resolution logic in game.js which resets to prevX/prevY
        // will handle this case correctly now that we've detected the possibility.
        // A simple AABB check on the sweep is sufficient for detection here.
        return true; 
    }
}