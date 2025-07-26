export class AssetLoader {
    constructor(audioContext) {
        this.assets = {};
        this.audioAssets = {};
        this.damageSprites = [];
        this.loadedCount = 0;
        this.totalAssets = 0;
        this.onProgress = null;
        this.audioContext = audioContext;
        this.iconAssets = {}; // For non-block images like pickaxes, icons, etc.
    }

    async loadAssets() {
        // Count total assets to load
        this.totalAssets = 57; // Increased from 56 for fire effect asset
        this.loadedCount = 0;

        const assetPromises = [];

        // Load sounds
        assetPromises.push(this.loadAudioWithProgress('stone.wav', 'blockBreak'));
        assetPromises.push(this.loadAudioWithProgress('bounce.mp3', 'bounce'));
        assetPromises.push(this.loadAudioWithProgress('bouncy_ball_spawn.mp3', 'bouncyBallSpawn'));

        // Load block textures
        assetPromises.push(this.loadImageWithProgress('stone.png', 'stone'));
        assetPromises.push(this.loadImageWithProgress('andesite.png', 'andesite'));
        assetPromises.push(this.loadImageWithProgress('diorite.png', 'diorite'));
        assetPromises.push(this.loadImageWithProgress('granite.png', 'granite'));
        // Load dirt texture (full-row dirt)
        assetPromises.push(this.loadImageWithProgress('IMG_0104.jpeg', 'dirtImage'));
        assetPromises.push(this.loadImageWithProgress('coal_ore.png', 'coalOre'));
        assetPromises.push(this.loadImageWithProgress('copper_ore.png', 'copperOre'));
        assetPromises.push(this.loadImageWithProgress('iron_ore.png', 'ironOre'));
        assetPromises.push(this.loadImageWithProgress('gold_ore.png', 'goldOre'));
        assetPromises.push(this.loadImageWithProgress('bedrock.png', 'bedrock'));
        assetPromises.push(this.loadImageWithProgress('obsidian.png', 'obsidian'));

        // Load deepslate textures
        assetPromises.push(this.loadImageWithProgress('deepslate.png', 'deepslate'));
        assetPromises.push(this.loadImageWithProgress('deepslate_coal_ore.png', 'deepslateCoalOre'));
        assetPromises.push(this.loadImageWithProgress('deepslate_copper_ore.png', 'deepslateCopperOre'));
        assetPromises.push(this.loadImageWithProgress('deepslate_iron_ore.png', 'deepslateIronOre'));
        assetPromises.push(this.loadImageWithProgress('deepslate_gold_ore.png', 'deepslateGoldOre'));
        assetPromises.push(this.loadImageWithProgress('deepslate_redstone_ore.png', 'deepslateRedstoneOre'));
        assetPromises.push(this.loadImageWithProgress('deepslate_diamond_ore.png', 'deepslateDiamondOre'));
        assetPromises.push(this.loadImageWithProgress('deepslate_lapis_ore.png', 'deepslateLapisOre'));

        // Load redstone ore
        assetPromises.push(this.loadImageWithProgress('redstone_ore.png', 'redstoneOre'));
        assetPromises.push(this.loadImageWithProgress('diamond_ore.png', 'diamondOre'));
        assetPromises.push(this.loadImageWithProgress('lapis_ore.png', 'lapisOre'));

        // Load emerald textures
        assetPromises.push(this.loadImageWithProgress('emerald_ore.png', 'emeraldOre'));
        assetPromises.push(this.loadImageWithProgress('deepslate_emerald_ore (2).png', 'deepslateEmeraldOre'));

        // Load summer event textures
        assetPromises.push(this.loadImageWithProgress('sand (1).png', 'sand'));
        assetPromises.push(this.loadImageWithProgress('sandstone (1).png', 'sandstone'));
        assetPromises.push(this.loadImageWithProgress('4237953594.webp', 'iceCreamIcon'));

        // Load resource icons
        assetPromises.push(this.loadImageWithProgress('coal.png', 'coalIcon'));
        assetPromises.push(this.loadImageWithProgress('raw_copper.png', 'copperIcon'));
        assetPromises.push(this.loadImageWithProgress('raw_iron.png', 'ironIcon'));
        assetPromises.push(this.loadImageWithProgress('raw_gold.png', 'goldIcon'));
        assetPromises.push(this.loadImageWithProgress('redstone.png', 'redstoneIcon'));
        assetPromises.push(this.loadImageWithProgress('diamond.png', 'diamondIcon'));
        assetPromises.push(this.loadImageWithProgress('lapis_lazuli.png', 'lapisIcon'));
        assetPromises.push(this.loadImageWithProgress('emerald.png', 'emeraldIcon'));
        assetPromises.push(this.loadImageWithProgress('18461548-newpiskel_m-Photoroom.png', 'moneyIcon'));
        assetPromises.push(this.loadImageWithProgress('copper_ingot.png', 'copperIngotIcon'));
        assetPromises.push(this.loadImageWithProgress('iron_ingot.png', 'ironIngotIcon'));
        assetPromises.push(this.loadImageWithProgress('gold_ingot.png', 'goldIngotIcon'));

        // Load pickaxe images
        assetPromises.push(this.loadImageWithProgress('wooden_pickaxe.png', 'woodenPickaxe'));
        assetPromises.push(this.loadImageWithProgress('stone_pickaxe.png', 'stonePickaxe'));
        assetPromises.push(this.loadImageWithProgress('iron_pickaxe.png', 'ironPickaxe'));
        assetPromises.push(this.loadImageWithProgress('golden_pickaxe.png', 'goldenPickaxe'));
        assetPromises.push(this.loadImageWithProgress('diamond_pickaxe.png', 'diamondPickaxe'));
        assetPromises.push(this.loadImageWithProgress('Grid_Obsidian_Pickaxe.png', 'obsidianPickaxe'));
        assetPromises.push(this.loadImageWithProgress('netherite_pickaxe.png', 'netheritePickaxe'));
        assetPromises.push(this.loadImageWithProgress('blaze_rod.png', 'blazeRod'));
        assetPromises.push(this.loadImageWithProgress('lava pickaxe.png', 'lavaPickaxe'));
        assetPromises.push(this.loadImageWithProgress('snd pickaxe.webp', 'blazePickaxe'));
        assetPromises.push(this.loadImageWithProgress('sprite_4 (1).png', 'fishPickaxe'));
        assetPromises.push(this.loadImageWithProgress('beach-ball-pixel-art-free-png (1).webp', 'bouncyBall'));

        // Load experience bottle
        assetPromises.push(this.loadImageWithProgress('experience_bottle.png', 'experience_bottle'));

        // Load chest asset
        assetPromises.push(this.loadImageWithProgress('chest-front.jpg', 'chest'));

        // Load TNT asset
        assetPromises.push(this.loadImageWithProgress('tnt.png', 'tnt'));

        // Load enchantment book
        assetPromises.push(this.loadImageWithProgress('enchanted_book.png', 'enchantedBook'));

        // Load fire effect for burning pickaxe
        assetPromises.push(this.loadImageWithProgress('fire.webp', 'fireEffect'));

        // Load damage state sprites
        const damageSpritePaths = [
            'sprite - 2025-06-20T113201.201.png', // damage 1
            'sprite - 2025-06-20T113200.409.png', // damage 2
            'sprite - 2025-06-20T113159.673.png', // damage 3
            'sprite - 2025-06-20T113158.740.png', // damage 4
            'sprite - 2025-06-20T113157.764.png', // damage 5
            'sprite - 2025-06-20T113155.665.png'  // damage 6
        ];

        // This makes totalAssets dynamic based on what we are actually loading.
        this.totalAssets = assetPromises.length + damageSpritePaths.length;
        
        for (let i = 0; i < damageSpritePaths.length; i++) {
            assetPromises.push(this.loadDamageSpriteWithProgress(damageSpritePaths[i], i));
        }

        await Promise.all(assetPromises);

        // Set global references for backward compatibility with block.js
        window.stoneImage = this.assets.stone;
        window.andesiteImage = this.assets.andesite;
        window.dioriteImage = this.assets.diorite;
        window.graniteImage = this.assets.granite;
        window.coalOreImage = this.assets.coalOre;
        window.copperOreImage = this.assets.copperOre;
        window.ironOreImage = this.assets.ironOre;
        window.goldOreImage = this.assets.goldOre;
        window.bedrockImage = this.assets.bedrock;
        window.deepslateImage = this.assets.deepslate;
        window.deepslateCoalOreImage = this.assets.deepslateCoalOre;
        window.deepslateCopperOreImage = this.assets.deepslateCopperOre;
        window.deepslateIronOreImage = this.assets.deepslateIronOre;
        window.deepslateGoldOreImage = this.assets.deepslateGoldOre;
        window.redstoneOreImage = this.assets.redstoneOre;
        window.deepslateRedstoneOreImage = this.assets.deepslateRedstoneOre;
        window.diamondOreImage = this.assets.diamondOre;
        window.deepslateDiamondOreImage = this.assets.deepslateDiamondOre;
        window.lapisOreImage = this.assets.lapisOre;
        window.deepslateLapisOreImage = this.assets.deepslateLapisOre;
        window.emeraldOreImage = this.assets.emeraldOre;
        window.deepslateEmeraldOreImage = this.assets.deepslateEmeraldOre;
        window.obsidianImage = this.assets.obsidian;
        window.sandImage = this.assets.sand;
        window.sandstoneImage = this.assets.sandstone;
        window.chestImage = this.assets.chest;
        window.tntImage = this.assets.tnt;
        window.dirtImage = this.assets.dirtImage;
        // Lava texture for lava blocks
        window.lavaTexture = this.assets.lava_texture;
        window.damageSprites = this.damageSprites;
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    async loadImageWithProgress(src, key) {
        try {
            const img = await this.loadImage(src);
            if (key.endsWith('Icon') || key.endsWith('Pickaxe') || key === 'blazeRod' || key === 'enchantedBook' || key === 'bouncyBall' || key === 'experience_bottle') {
                this.iconAssets[key] = img;
            } else {
                this.assets[key] = img;
            }
        } catch (error) {
            console.error(`Failed to load image: ${src}`, error);
            // Create a fallback image or continue without it
        } finally {
            this.loadedCount++;
            this.updateProgress();
        }
    }

    async loadAudioWithProgress(src, key) {
        if (!this.audioContext) {
            this.loadedCount++;
            this.updateProgress();
            return;
        }
        
        try {
            const response = await fetch(src);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${response.status}`);
            }
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            this.audioAssets[key] = audioBuffer;
        } catch (error) {
            console.error(`Failed to load audio: ${src}`, error);
            // Don't throw, just log and continue
        } finally {
            this.loadedCount++;
            this.updateProgress();
        }
    }

    async loadDamageSpriteWithProgress(src, index) {
        try {
            const img = await this.loadImage(src);
            this.damageSprites[index] = img;
        } catch (error) {
            console.error(`Failed to load damage sprite: ${src}`, error);
            // Continue without this damage sprite
        } finally {
            this.loadedCount++;
            this.updateProgress();
        }
    }

    updateProgress() {
        if (this.onProgress) {
            this.onProgress(this.loadedCount, this.totalAssets);
        }
    }

    getAsset(name) {
        return this.assets[name] || this.iconAssets[name];
    }

    getAudioAsset(name) {
        return this.audioAssets[name];
    }

    getDamageSprite(index) {
        return this.damageSprites[index];
    }
}