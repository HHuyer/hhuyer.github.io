import { Vector2 } from './vector2.js';

export class Pickaxe {
    constructor(x, y, game) {
        this.game = game;
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.width = 50;
        this.height = 50;
        this.velocity = new Vector2(0, 0);
        this.rotation = 0;
        this.angularVelocity = 0;
        this.isDropped = false;
        this.gravity = 0.5;
        this.bounce = 0.7;
        this.friction = 0.98;
        this.isBroken = false;
        
        // Properties for pre-drop movement
        this.initialX = x;
        this.initialY = y;
        this.swaySpeed = 0.03;
        this.swayAmplitude = 100; // Will be set from game
        this.swayAngle = 0;
        this.swayRange = { min: 0, max: 0 };
        this.centerSwayX = 0;
        
        this.abilityTimer = 0;
        
        // Burning effect system
        this.burning = {
            active: false,
            timer: 0,
            maxTimer: 5.0, // 5 seconds
            inLava: false,
            fireEffectTimer: 0
        };
        
        this.variants = [
            {
                name: 'wooden',
                image: null,
                power: 1,
                bounce: 0.5,
                gravity: 0.4,
                maxDurability: 35, // Reduced from 50
                durability: 35,
                stability: 1
            },
            {
                name: 'stone',
                image: null,
                power: 1, // Reduced from 2
                bounce: 0.6,
                gravity: 0.45,
                maxDurability: 70, // Reduced from 100
                durability: 70,
                stability: 1.5
            },
            {
                name: 'iron',
                image: null,
                power: 2, // Reduced from 3
                bounce: 0.7,
                gravity: 0.5,
                maxDurability: 100, // Reduced from 150
                durability: 100,
                stability: 2
            },
            {
                name: 'golden',
                image: null,
                power: 5, // Reduced from 2
                bounce: 0.9,
                gravity: 0.3,
                maxDurability: 50, // Reduced from 75
                durability: 50,
                stability: 1.2
            },
            {
                name: 'diamond',
                image: null,
                power: 3, // Reduced from 4
                bounce: 0.8,
                gravity: 0.55,
                maxDurability: 200, // Reduced from 300
                durability: 200,
                stability: 2.5
            },
            {
                name: 'obsidian',
                image: null,
                power: 3.5,
                bounce: 0.75,
                gravity: 0.58,
                maxDurability: 250,
                durability: 250,
                stability: 2.2
            },
            {
                name: 'netherite',
                image: null,
                power: 4, // Reduced from 5
                bounce: 0.8,
                gravity: 0.6,
                maxDurability: 350, // Reduced from 500
                durability: 350,
                stability: 3
            },
            {
                name: 'lava',
                image: null,
                power: 6,
                bounce: 0.9,
                gravity: 0.4,
                maxDurability: 200,
                durability: 200,
                ability: 'lava_particles',
                abilityCooldown: 2, // seconds
                stability: 1.8
            },
            {
                name: 'blaze',
                image: null,
                power: 4,
                bounce: 0.7,
                gravity: 0.3,
                maxDurability: 300,
                durability: 300,
                ability: 'blaze_rod_rain',
                abilityCooldown: 5, // seconds
                stability: 2.0
            },
            {
                name: 'fish',
                image: null,
                power: 3,
                bounce: 0.95,
                gravity: 0.4,
                maxDurability: 150,
                durability: 150,
                ability: 'bouncy_ball',
                abilityCooldown: 1, 
                stability: 2.0
            }
        ];
        this.currentVariant = 0;
    }

    loadPickaxeImages() {
        this.variants[0].image = this.game.assetLoader.getAsset('woodenPickaxe');
        this.variants[1].image = this.game.assetLoader.getAsset('stonePickaxe');
        this.variants[2].image = this.game.assetLoader.getAsset('ironPickaxe');
        this.variants[3].image = this.game.assetLoader.getAsset('goldenPickaxe');
        this.variants[4].image = this.game.assetLoader.getAsset('diamondPickaxe');
        this.variants[5].image = this.game.assetLoader.getAsset('obsidianPickaxe');
        this.variants[6].image = this.game.assetLoader.getAsset('netheritePickaxe');
        this.variants[7].image = this.game.assetLoader.getAsset('lavaPickaxe');
        this.variants[8].image = this.game.assetLoader.getAsset('blazePickaxe');
        this.variants[9].image = this.game.assetLoader.getAsset('fishPickaxe');
    }

    setSwayRange(minX, maxX) {
        this.swayRange = { min: minX, max: maxX };
        this.swayAmplitude = (maxX - minX) / 2;
        this.centerSwayX = minX + this.swayAmplitude;
    }

    nextVariant() {
        if (this.isDropped) return;
    
        let nextVariantIndex = (this.currentVariant + 1) % this.variants.length;
        for (let i = 0; i < this.variants.length; i++) {
            const variantName = this.variants[nextVariantIndex].name;
            const pickaxeData = this.game.state.pickaxePrices[variantName];
            
            if (pickaxeData && pickaxeData.unlocked) {
                this.currentVariant = nextVariantIndex;
                this.updateProperties();
                this.game.state.currentPickaxeVariant = this.currentVariant;
                this.game.state.saveAllState(); // Save all state when switching pickaxe variant
                return;
            }
            
            nextVariantIndex = (nextVariantIndex + 1) % this.variants.length;
        }
    }

    updateProperties() {
        const variant = this.variants[this.currentVariant];
        this.bounce = variant.bounce;
        this.gravity = variant.gravity;
        this.abilityTimer = 0; // Reset timer on switch
    }

    getCurrentVariant() {
        const variant = this.variants[this.currentVariant];
        // --- NEW: Boost power for lava pickaxe when burning ---
        if (this.currentVariant === 7 && this.burning.active) {
            return { ...variant, power: variant.power + 2 };
        }
        return variant;
    }

    update(dt) {
        // Store previous position before updating
        this.prevX = this.x;
        this.prevY = this.y;

        if (!this.isDropped) {
            // Swaying motion before drop
            this.swayAngle += this.swaySpeed;
            this.x = this.centerSwayX + Math.sin(this.swayAngle) * this.swayAmplitude;
            return; // Don't apply physics yet
        }

        if (this.isBroken) return;

        // Handle burning effect
        this.updateBurningEffect(dt);

        // Handle abilities
        const variant = this.getCurrentVariant();
        if (variant.ability) {
            this.abilityTimer += dt; // Cooldown timer always increments
            
            if (variant.ability === 'lava_particles') {
                if (this.abilityTimer >= variant.abilityCooldown) {
                    this.abilityTimer = 0;
                    this.game.triggerAbility(variant.ability, { x: this.x + this.width / 2, y: this.y + this.height / 2 });
                }
            }
        }

        // Apply gravity
        this.velocity.y += this.gravity;
        
        // Update position
        this.x += this.velocity.x;
        this.y += this.velocity.y;
        
        // Update rotation
        this.rotation += this.angularVelocity;
        this.angularVelocity *= 0.99;
    }

    updateBurningEffect(dt) {
        if (!this.isDropped) return;

        // Determine if any part of the pickaxe overlaps fluid blocks
        const overlapping = this.game.world.getNearbyBlocks(this.x, this.y, this.width, this.height);
        const isInLava = overlapping.some(b => !b.destroyed && b.blockType === 'lava');
        const isInWater = overlapping.some(b => !b.destroyed && b.blockType === 'water');

        // Stop burning immediately if in water
        if (isInWater && this.burning.active) {
            this.burning.active = false;
            this.burning.timer = 0;
            this.burning.inLava = false;
        }

        // --- NEW: Lava Pickaxe (index 7) special behavior ---
        const isLavaPickaxe = this.currentVariant === 7;
        if (isLavaPickaxe && isInLava) {
            // Regenerate 1% durability per second
            const variant = this.variants[this.currentVariant];
            const healAmount = variant.maxDurability * 0.01 * dt;
            variant.durability = Math.min(variant.maxDurability, variant.durability + healAmount);
            this.burning.active = true; // Still show the visual effect
        } else {
            // Original burning logic for non-lava pickaxes
            if (isInLava && !isLavaPickaxe) {
                this.burning.active = true;
                this.burning.inLava = true;
                this.burning.timer = this.burning.maxTimer; // Reset timer while in lava
                
                // Deal 15% durability damage per second while in lava
                const variant = this.variants[this.currentVariant];
                const damage = variant.maxDurability * 0.15 * dt;
                this.takeDamage(damage);
            } else if (this.burning.active && !isLavaPickaxe) {
                this.burning.inLava = false;
                this.burning.timer -= dt;
                
                // Deal 2% durability damage per second after leaving lava
                const variant = this.variants[this.currentVariant];
                const damage = variant.maxDurability * 0.02 * dt;
                this.takeDamage(damage);
                
                // Stop burning when timer expires
                if (this.burning.timer <= 0) {
                    this.burning.active = false;
                }
            }
        }

        // Update fire effect timer for animation
        if (this.burning.active) {
            this.burning.fireEffectTimer += dt;
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width/2, this.y + this.height/2);
        ctx.rotate(this.rotation);
        
        const variant = this.getCurrentVariant();
        // Draw pickaxe image
        if (variant.image && variant.image.complete) {
            // Apply red tint if broken
            if (this.isBroken) {
                ctx.filter = 'hue-rotate(0deg) saturate(0.3) brightness(0.7)';
            }
            ctx.drawImage(variant.image, -this.width/2, -this.height/2, this.width, this.height);
            ctx.filter = 'none';
        } else {
            // Fallback drawing
            ctx.fillStyle = this.isBroken ? '#4A2C2A' : '#8B4513';
            ctx.fillRect(-5, -25, 10, 50);
            ctx.fillStyle = this.isBroken ? '#666666' : '#C0C0C0';
            ctx.fillRect(-20, -30, 40, 15);
        }
        
        // Draw fire effect if burning
        if (this.burning.active) {
            const fireImage = this.game.assetLoader.getAsset('fireEffect');
            if (fireImage && fireImage.complete) {
                // Create flickering effect
                const flicker = 0.8 + 0.2 * Math.sin(this.burning.fireEffectTimer * 10);
                ctx.globalAlpha = flicker;
                
                // Smaller fire effect
                const fireSize = this.width * 0.35; // reduced from 0.7
                ctx.drawImage(fireImage, -fireSize/2, -fireSize/2 - 8, fireSize, fireSize);
                
                ctx.globalAlpha = 1.0;
            } else {
                // Fallback fire effect
                ctx.globalAlpha = 0.7 + 0.3 * Math.sin(this.burning.fireEffectTimer * 8);
                ctx.fillStyle = '#FF4500';
                ctx.beginPath();
                ctx.arc(0, -6, this.width * 0.25, 0, Math.PI * 2); // reduced from 0.4
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
        
        ctx.restore();
    }

    drop() {
        if (this.isDropped) return;
        this.isDropped = true;
        // Start with a small downward velocity and a bit of spin
        this.velocity = new Vector2(0, 1);
        this.angularVelocity = (Math.random() - 0.5) * 0.2;
    }

    reset(x = 380, y = 50) {
        this.initialX = x;
        this.initialY = y;
        this.x = x;
        this.y = y;
        this.prevX = x;
        this.prevY = y;
        this.velocity = new Vector2(0, 0);
        this.rotation = 0;
        this.angularVelocity = 0;
        this.isDropped = false;
        this.isBroken = false;
        this.swayAngle = 0; // Reset sway angle
        this.abilityTimer = 0;
        
        // Reset burning effect
        this.burning = {
            active: false,
            timer: 0,
            maxTimer: 5.0,
            inLava: false,
            fireEffectTimer: 0
        };
        
        // Reset size to default
        this.width = 50;
        this.height = 50;

        // Reset all pickaxe durabilities
        this.variants.forEach(variant => {
            variant.durability = variant.maxDurability;
        });
        
        this.updateProperties();
    }

    takeDamage(amount = 1) {
        if (this.isBroken) return;
        
        const variant = this.variants[this.currentVariant];
        variant.durability -= amount; // Damage is now passed from Game logic
        
        if (variant.durability < 1) { // Changed from <= 0 to < 1
            this.isBroken = true;
            variant.durability = 0;
        }
    }

    getDurabilityPercent() {
        const variant = this.variants[this.currentVariant];
        if (variant.maxDurability === 0) return 1;
        return variant.durability / variant.maxDurability;
    }
}