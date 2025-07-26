export class GameState {
    constructor() {
        // Resource tracking
        const defaultResources = {
            coal: 0, copper: 0, iron: 0, gold: 0, redstone: 0,
            diamond: 0, lapis: 0, emerald: 0, stone: 0, obsidian: 0,
            sand: 0, sandstone: 0
        };
        this.resources = { ...defaultResources, ...(this.loadResources() || {}) };

        // Money system
        this.money = this.loadMoney() || 0;

        // Add new currency (big‐money)
        this.bigMoney = this.loadBigMoney() || 0;

        // Stats
        const defaultStats = {
            totalBlocksBroken: 0,
            blocksBrokenByType: {},
            resourcesCollected: {},
            deepestDepth: 0,
            playTime: 0, // in seconds
            pickaxesBroken: 0,
            moneyEarned: 0,
        };
        this.stats = this.loadStats() || defaultStats;

        // Shop prices for selling resources
        this.sellPrices = {
            coal: 3, copper: 10, iron: 18, gold: 35, redstone: 22,
            diamond: 70, lapis: 14, emerald: 45, stone: 1, sand: 2, sandstone: 3
        };

        // Enchantment system
        const defaultEnchants = { efficiency: 0, unbreaking: 0, fortune: 0 };
        this.enchantmentLevels = this.loadEnchantments() || defaultEnchants;
        this.maxEnchantmentLevels = { efficiency: 5, unbreaking: 3, fortune: 3 };

        // Settings
        const defaultSettings = { musicVolume: 1.0, sfxVolume: 1.0, language: 'en' };
        this.settings = this.loadSettings() || defaultSettings;

        // Summer event system
        this.summerEventActive = this.loadSummerEvent() || false;

        // Smelting system
        const defaultSmelted = { copper: 0, iron: 0, gold: 0 };
        this.smeltedResources = { ...defaultSmelted, ...(this.loadSmeltedResources() || {}) };
        
        this.smeltedSellPrices = { copper: 18, iron: 28, gold: 55 };
        this.smeltingCost = { coal: 1 };

        this.nonSmeltableResources = ['diamond', 'stone', 'obsidian'];

        // Pickaxe state
        this.pickaxePrices = {
            wooden: { price: 0, unlocked: true, requirements: {}, requiresSummerEvent: false },
            stone: { price: 50, unlocked: false, requirements: { stone: 20 }, requiresSummerEvent: false },
            iron: { price: 100, unlocked: false, requirements: { iron_ingot: 5 }, requiresSummerEvent: false },
            golden: { price: 80, unlocked: false, requirements: { gold_ingot: 3 }, requiresSummerEvent: false },
            diamond: { price: 200, unlocked: false, requirements: { diamond: 3 }, requiresSummerEvent: false },
            obsidian: { price: 350, unlocked: false, requirements: { diamond: 2, obsidian: 10 }, requiresSummerEvent: false },
            netherite: { price: 500, unlocked: false, requirements: { diamond: 4, gold_ingot: 4 }, requiresSummerEvent: false },
            lava: { price: 500, unlocked: false, requirements: {}, requiresSummerEvent: true },
            blaze: { price: 750, unlocked: false, requirements: {}, requiresSummerEvent: true },
            fish: { price: 600, unlocked: false, requirements: {}, requiresSummerEvent: true }
        };
        this.loadPickaxeUnlocks(); // This will modify this.pickaxePrices
        this.currentPickaxeVariant = this.loadCurrentPickaxeVariant();

        // Add TNT tracking
        this.tntCollected = this.loadTntCollected() || 0;
    }

    getEnchantmentCost(enchantment, level) {
        const baseCosts = {
            efficiency: { money: 150, lapis: 5 },
            unbreaking: { money: 250, lapis: 8 },
            fortune: { money: 400, lapis: 12 }
        };
        const costs = baseCosts[enchantment];
        return {
            money: Math.floor(costs.money * Math.pow(2.8, level)),
            lapis: Math.floor(costs.lapis * (level + 1))
        };
    }

    loadResources() {
        const saved = localStorage.getItem('pickaxe_resources');
        return saved ? JSON.parse(saved) : null;
    }

    saveResources() {
        localStorage.setItem('pickaxe_resources', JSON.stringify(this.resources));
    }

    loadSmeltedResources() {
        const saved = localStorage.getItem('pickaxe_smelted_resources');
        return saved ? JSON.parse(saved) : null;
    }

    saveSmeltedResources() {
        localStorage.setItem('pickaxe_smelted_resources', JSON.stringify(this.smeltedResources));
    }

    loadMoney() {
        const saved = localStorage.getItem('pickaxe_money');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveMoney() {
        localStorage.setItem('pickaxe_money', this.money.toString());
    }

    loadEnchantments() {
        const saved = localStorage.getItem('enchantments');
        if (saved) {
            return JSON.parse(saved);
        }
        return null;
    }
    
    saveEnchantments() {
        localStorage.setItem('enchantments', JSON.stringify(this.enchantmentLevels));
    }

    saveCurrentPickaxeVariant() {
        localStorage.setItem('current_pickaxe_variant', this.currentPickaxeVariant.toString());
    }

    loadCurrentPickaxeVariant() {
        const saved = localStorage.getItem('current_pickaxe_variant');
        if (saved !== null) {
            const variantIndex = parseInt(saved, 10);
            if (variantIndex >= 0) {
                return variantIndex;
            }
        }
        return 0; // Default to wooden
    }

    loadPickaxeUnlocks() {
        const saved = localStorage.getItem('pickaxe_unlocks');
        if (saved) {
            const unlocks = JSON.parse(saved);
            Object.keys(unlocks).forEach(key => {
                if (this.pickaxePrices[key]) {
                    this.pickaxePrices[key].unlocked = unlocks[key];
                }
            });
        }
    }

    savePickaxeUnlocks() {
        const unlocks = {};
        Object.keys(this.pickaxePrices).forEach(key => {
            unlocks[key] = this.pickaxePrices[key].unlocked;
        });
        localStorage.setItem('pickaxe_unlocks', JSON.stringify(unlocks));
    }

    loadSummerEvent() {
        const saved = localStorage.getItem('summer_event_active');
        return saved ? JSON.parse(saved) : false;
    }

    saveSummerEvent() {
        localStorage.setItem('summer_event_active', JSON.stringify(this.summerEventActive));
    }

    loadBigMoney() {
        const saved = localStorage.getItem('money');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveBigMoney() {
        localStorage.setItem('money', this.bigMoney.toString());
    }

    loadTntCollected() {
        const saved = localStorage.getItem('tnt_collected');
        return saved ? parseInt(saved, 10) : 0;
    }

    saveTntCollected() {
        localStorage.setItem('tnt_collected', this.tntCollected.toString());
    }

    // Add comprehensive save method to save all state at once
    saveAllState() {
        this.saveResources();
        this.saveSmeltedResources();
        this.saveMoney();
        this.saveBigMoney();
        this.saveEnchantments();
        this.saveCurrentPickaxeVariant();
        this.savePickaxeUnlocks();
        this.saveSummerEvent();
        this.saveStats();
        this.saveSettings();
        this.saveTntCollected();
    }

    resetProgress() {
        // Reset all resources
        this.resources = {
            coal: 0, copper: 0, iron: 0, gold: 0, redstone: 0,
            diamond: 0, lapis: 0, emerald: 0, stone: 0, obsidian: 0,
            sand: 0, sandstone: 0
        };
        this.money = 0;
        this.bigMoney = 0;
        this.smeltedResources = { copper: 0, iron: 0, gold: 0 };
        this.tntCollected = 0;
        
        // Reset pickaxe unlocks (keep wooden unlocked)
        Object.keys(this.pickaxePrices).forEach(key => {
            this.pickaxePrices[key].unlocked = key === 'wooden';
        });
        
        // Reset enchantments
        this.enchantmentLevels = { efficiency: 0, unbreaking: 0, fortune: 0 };
        
        // Reset stats
        this.stats = {
            totalBlocksBroken: 0,
            blocksBrokenByType: {},
            resourcesCollected: {},
            deepestDepth: 0,
            playTime: 0,
            pickaxesBroken: 0,
            moneyEarned: 0,
        };
        
        // Reset pickaxe to wooden
        this.currentPickaxeVariant = 0;
        
        // Save the reset state
        this.saveAllState();
    }

    loadStats() {
        const saved = localStorage.getItem('game_stats');
        return saved ? JSON.parse(saved) : null;
    }

    saveStats() {
        localStorage.setItem('game_stats', JSON.stringify(this.stats));
    }

    loadSettings() {
        const saved = localStorage.getItem('game_settings');
        return saved ? JSON.parse(saved) : null;
    }

    saveSettings() {
        localStorage.setItem('game_settings', JSON.stringify(this.settings));
    }
}