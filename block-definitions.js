export const BLOCK_DEFINITIONS = {
    // Stones
    stone: { health: 3, textureKey: 'stoneImage', fallbackColor: '#8B8B8B' },
    andesite: { health: 3, textureKey: 'andesiteImage', fallbackColor: '#A0A0A0' },
    diorite: { health: 3, textureKey: 'dioriteImage', fallbackColor: '#C0C0C0' },
    granite: { health: 3, textureKey: 'graniteImage', fallbackColor: '#C8997A' },
    deepslate: { health: 5, textureKey: 'deepslateImage', fallbackColor: '#2C2C2C', isDeepslate: true },
    obsidian: { health: 50, textureKey: 'obsidianImage', fallbackColor: '#1e1b29' },
    sand: { health: 1.5, textureKey: 'sandImage', fallbackColor: '#F4E4BC' },
    sandstone: { health: 2.5, textureKey: 'sandstoneImage', fallbackColor: '#F2D2A7' },
    bedrock: { health: Infinity, textureKey: 'bedrockImage', fallbackColor: '#4A4A4A' },

    // Ores
    coal_ore: { health: 5, textureKey: 'coalOreImage', fallbackColor: '#2C2C2C', deepslateVariant: true },
    copper_ore: { health: 5, textureKey: 'copperOreImage', fallbackColor: '#B87333', deepslateVariant: true },
    iron_ore: { health: 6, textureKey: 'ironOreImage', fallbackColor: '#D4A574', deepslateVariant: true },
    gold_ore: { health: 8, textureKey: 'goldOreImage', fallbackColor: '#FFD700', deepslateVariant: true },
    redstone_ore: { health: 6, textureKey: 'redstoneOreImage', fallbackColor: '#FF4444', deepslateVariant: true },
    lapis_ore: { health: 6, textureKey: 'lapisOreImage', fallbackColor: '#1E90FF', deepslateVariant: true },
    diamond_ore: { health: 12, textureKey: 'diamondOreImage', fallbackColor: '#40E0D0', deepslateVariant: true },
    emerald_ore: { health: 10, textureKey: 'emeraldOreImage', fallbackColor: '#2ecc71', deepslateVariant: true },

    // Deepslate Ores
    deepslate_coal_ore: { health: 6, textureKey: 'deepslateCoalOreImage', fallbackColor: '#2C2C2C', isDeepslate: true },
    deepslate_copper_ore: { health: 6, textureKey: 'deepslateCopperOreImage', fallbackColor: '#B87333', isDeepslate: true },
    deepslate_iron_ore: { health: 8, textureKey: 'deepslateIronOreImage', fallbackColor: '#D4A574', isDeepslate: true },
    deepslate_gold_ore: { health: 10, textureKey: 'deepslateGoldOreImage', fallbackColor: '#FFD700', isDeepslate: true },
    deepslate_redstone_ore: { health: 8, textureKey: 'deepslateRedstoneOreImage', fallbackColor: '#FF4444', isDeepslate: true },
    deepslate_lapis_ore: { health: 8, textureKey: 'deepslateLapisOreImage', fallbackColor: '#1E90FF', isDeepslate: true },
    deepslate_diamond_ore: { health: 15, textureKey: 'deepslateDiamondOreImage', fallbackColor: '#40E0D0', isDeepslate: true },
    deepslate_emerald_ore: { health: 12, textureKey: 'deepslateEmeraldOreImage', fallbackColor: '#2ecc71', isDeepslate: true },

    // Special blocks
    chest: { health: 8, textureKey: 'chestImage', fallbackColor: '#8B4513' },
    tnt: { health: 3, textureKey: 'tntImage', fallbackColor: '#FF4444' },
    water: { health: Infinity, textureKey: null, fallbackColor: '#4F90FF' }
};