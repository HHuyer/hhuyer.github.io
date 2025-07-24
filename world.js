// New file
import { Block } from './block.js';
import { BLOCK_DEFINITIONS } from './block-definitions.js';

export class World {
    constructor(game) {
        this.game = game;
        this.blockSize = 40;
        this.gridWidth = 7;
        this.barrierWidth = 40;
        this.generatedRows = 0;
        
        this.fixedStartX = null;
        this.fixedLeftBarrierX = null;
        this.fixedRightBarrierX = null;
        
        this.coalClusterChance = 0.4;
        this.andesiteClusterChance = 0.6;

        // Lava spawn chance (smaller than water by 10×)
        this.lavaChance = 0.01;

        this.generationQueue = [];

        // Spatial Grid for collision optimization
        this.spatialGrid = new Map();
        this.gridCellSize = this.blockSize * 2; // Check a smaller, more focused area
        
        this.caveExpansion = new Set();
        this.caveExpansionQueue = [];
    }

    _getGridKey(x, y) {
        const cellX = Math.floor(x / this.gridCellSize);
        const cellY = Math.floor(y / this.gridCellSize);
        return `${cellX},${cellY}`;
    }

    _addBlockToGrid(block) {
        const key = this._getGridKey(block.x, block.y);
        if (!this.spatialGrid.has(key)) {
            this.spatialGrid.set(key, []);
        }
        this.spatialGrid.get(key).push(block);
    }
    
    removeBlockFromGrid(block) {
        const key = this._getGridKey(block.x, block.y);
        if (this.spatialGrid.has(key)) {
            const cell = this.spatialGrid.get(key);
            const index = cell.indexOf(block);
            if (index > -1) {
                cell.splice(index, 1);
            }
        }
    }
    
    getBlockAt(x, y) {
        const key = this._getGridKey(x, y);
        if (this.spatialGrid.has(key)) {
            const blocksInCell = this.spatialGrid.get(key);
            for (const block of blocksInCell) {
                if (!block.destroyed &&
                    x >= block.x && x <= block.x + block.width &&
                    y >= block.y && y <= block.y + block.height) {
                    return block;
                }
            }
        }
        return null;
    }

    getNearbyBlocks(x, y, width, height) {
        const nearby = new Set();
        const startX = Math.floor(x / this.gridCellSize);
        const startY = Math.floor(y / this.gridCellSize);
        const endX = Math.floor((x + width) / this.gridCellSize);
        const endY = Math.floor((y + height) / this.gridCellSize);

        for (let i = startX; i <= endX; i++) {
            for (let j = startY; j <= endY; j++) {
                const key = `${i},${j}`;
                if (this.spatialGrid.has(key)) {
                    this.spatialGrid.get(key).forEach(block => {
                        if (!block.destroyed) {
                           nearby.add(block);
                        }
                    });
                }
            }
        }
        return [...nearby];
    }

    initializeBlocks() {
        this.game.blocks = [];
        this.spatialGrid.clear();
        this.generatedRows = 0;
        
        const centerX = this.game.canvas.width / 2;
        const gridPixelWidth = this.gridWidth * this.blockSize;
        this.fixedStartX = centerX - (gridPixelWidth / 2);
        
        this.fixedLeftBarrierX = this.fixedStartX - this.barrierWidth;
        this.fixedRightBarrierX = this.fixedStartX + (this.gridWidth * this.blockSize);
        
        this.game.pickaxe.x = this.game.canvas.width / 2 - this.game.pickaxe.width / 2;
        this.game.pickaxe.initialX = this.game.pickaxe.x;
        
        const initialRows = this.game.state.summerEventActive ? 50 : 30;
        for (let row = 0; row < initialRows; row++) {
            this.generateRow(row);
        }
        this.generatedRows = initialRows;
    }

    generateRow(row) {
        const y = 300 + row * this.blockSize;
        
        for (let col = 0; col < this.gridWidth; col++) {
            const x = this.fixedStartX + col * this.blockSize;
            
            // Check if this position should be a cave (air pocket)
            if (this.isCavePosition(row, col)) {
                // 10% chance to fill cave cell with water block
                if (Math.random() < 0.1) {
                    const waterBlock = new Block(x, y, this.blockSize, this.blockSize, 'water');
                    this.game.blocks.push(waterBlock);
                    this._addBlockToGrid(waterBlock);
                }
                continue;
            }
            
            if (this.game.state.summerEventActive) {
                // Summer event mode: 1% chance for chest, 3% for TNT
                const chestChance = Math.random();
                if (chestChance < 0.01) {
                    const block = new Block(x, y, this.blockSize, this.blockSize, 'chest');
                    this.game.blocks.push(block);
                    this._addBlockToGrid(block);
                    continue;
                }
                
                const tntChance = Math.random();
                if (tntChance < 0.03) {
                    const block = new Block(x, y, this.blockSize, this.blockSize, 'tnt');
                    this.game.blocks.push(block);
                    this._addBlockToGrid(block);
                    continue;
                }
                
                const sandTypeRand = Math.random();
                const blockType = sandTypeRand < 0.7 ? 'sand' : 'sandstone';
                const block = new Block(x, y, this.blockSize, this.blockSize, blockType);
                this.game.blocks.push(block);
                this._addBlockToGrid(block);
                continue;
            } else {
                // Regular mode: 0.1% chance for chest (10 times lower than summer event)
                const chestChance = Math.random();
                if (chestChance < 0.001) {
                    const block = new Block(x, y, this.blockSize, this.blockSize, 'chest');
                    this.game.blocks.push(block);
                    this._addBlockToGrid(block);
                    continue;
                }
            }
            
            const blockType = this.determineBlockType(row, col);
            
            // Add chance for experience bottle
            const bottleChance = 0.01; // 1% chance for any block to have a bottle
            if (Math.random() < bottleChance && blockType !== 'bedrock' && blockType !== 'obsidian') {
                const block = new Block(x, y, this.blockSize, this.blockSize, blockType);
                block.hasExperienceBottle = true;
                this.game.blocks.push(block);
                this._addBlockToGrid(block);
                continue;
            }
            
            // Normal block
            const block = new Block(x, y, this.blockSize, this.blockSize, blockType);
            this.game.blocks.push(block);
            this._addBlockToGrid(block);

            // Lava spawns on top of blocks at a low rate
            if (row > 0 && Math.random() < this.lavaChance) {
                const lavaBlock = new Block(
                    x,
                    y - this.blockSize,
                    this.blockSize,
                    this.blockSize,
                    'lava'
                );
                this.game.blocks.push(lavaBlock);
                this._addBlockToGrid(lavaBlock);
            }
        }
    }

    isCavePosition(row, col) {
        // Only generate caves below certain depth
        if (row < 8) return false;
        
        // Cave expansion tracking
        if (!this.caveExpansion) {
            this.caveExpansion = new Set();
            this.caveExpansionQueue = [];
        }
        
        // Check if this position is already part of a cave
        const key = `${row},${col}`;
        if (this.caveExpansion.has(key)) {
            return true;
        }
        
        // Check if this position is already processed
        if (this.caveExpansion.has(key + '_processed')) {
            return false;
        }
        
        // Start new caves with 0.5% chance
        const startChance = 0.005;
        if (Math.random() < startChance && !this.caveExpansion.has(key)) {
            this.caveExpansion.add(key);
            this.caveExpansionQueue.push({row, col, depth: 0});

            // 2% chance for water in caves (reduced from 10%)
            if (Math.random() < 0.01) { // <-- changed from 0.02 to 0.01 (50 % less)
                const x = this.fixedStartX + col * this.blockSize;
                const y = 300 + row * this.blockSize;
                const waterBlock = new Block(x, y, this.blockSize, this.blockSize, 'water');
                this.game.blocks.push(waterBlock);
                this._addBlockToGrid(waterBlock);
            }
            
            // Process cave expansion
            this.processCaveExpansion();
            return true;
        }
        
        return false;
    }

    processCaveExpansion() {
        while (this.caveExpansionQueue.length > 0) {
            const {row, col, depth} = this.caveExpansionQueue.shift();
            
            // Mark as processed
            const processedKey = `${row},${col}_processed`;
            this.caveExpansion.add(processedKey);
            
            // Check adjacent blocks for expansion
            const adjacentBlocks = [
                {row: row - 1, col: col}, // Up
                {row: row + 1, col: col}, // Down
                {row: row, col: col - 1}, // Left
                {row: row, col: col + 1}  // Right
            ];
            
            for (const adj of adjacentBlocks) {
                const adjKey = `${adj.row},${adj.col}`;
                
                // Skip if already part of cave or processed
                if (this.caveExpansion.has(adjKey) || this.caveExpansion.has(adjKey + '_processed')) {
                    continue;
                }
                
                // 75% chance to expand cave
                if (Math.random() < 0.75) {
                    this.caveExpansion.add(adjKey);
                    
                    // Continue expansion if depth allows
                    if (depth < 3) { // Maximum expansion depth
                        this.caveExpansionQueue.push({
                            row: adj.row, 
                            col: adj.col, 
                            depth: depth + 1
                        });
                    }
                }
            }
        }
    }

    // Simple 2D noise function (pseudo-Perlin noise) - made more random
    noise2D(x, y) {
        const seed = 12345 + Math.random() * 0.1; // Add randomness to seed
        const n = Math.sin(x * 12.9898 + y * 78.233 + seed) * 43758.5453123;
        return (n - Math.floor(n)) * 2 - 1; // Return value between -1 and 1
    }

    determineBlockType(row, col) {
        // First, check if this position is part of a cave
        if (this.isCavePosition(row, col)) {
            return null; // Return null to indicate air/empty cave
        }

        const depth = row;
        const isDeepslate = this.isDeepslateLayer(depth);
        const adjacentInfo = {
            coal: this.hasAdjacentBlock(row, col, ['coal_ore', 'deepslate_coal_ore']),
            andesite: this.hasAdjacentBlock(row, col, ['andesite']),
            diorite: this.hasAdjacentBlock(row, col, ['diorite']),
            granite: this.hasAdjacentBlock(row, col, ['granite']),
        };

        if (!isDeepslate) {
            if (adjacentInfo.andesite && Math.random() < this.andesiteClusterChance) return 'andesite';
            if (adjacentInfo.diorite && Math.random() < this.andesiteClusterChance) return 'diorite';
            if (adjacentInfo.granite && Math.random() < this.andesiteClusterChance) return 'granite';
        }
        if (adjacentInfo.coal && Math.random() < this.coalClusterChance) {
            return isDeepslate ? 'deepslate_coal_ore' : 'coal_ore';
        }

        const obsidianChance = depth > 70 ? (depth - 70) * 0.0005 : 0;
        if (Math.random() < obsidianChance) return 'obsidian';

        const oreType = this.chooseOreByDepth(depth);
        if (oreType && Math.random() < 0.55) {
            const oreDef = BLOCK_DEFINITIONS[oreType + '_ore'];
            if (isDeepslate && oreDef && oreDef.deepslateVariant) {
                return 'deepslate_' + oreType + '_ore';
            }
            return oreType + '_ore';
        }
        
        if (isDeepslate) return 'deepslate';
        
        const stoneTypeRand = Math.random();
        if (stoneTypeRand < 0.15) return 'andesite';
        if (stoneTypeRand < 0.30) return 'diorite';
        if (stoneTypeRand < 0.45) return 'granite';
        return 'stone';
    }

    isDeepslateLayer(depth) {
        let isDeepslate = depth >= 45;
        if (depth >= 40 && depth < 50) {
            const transitionFactor = (depth - 40) / 10;
            const randomChance = Math.random();
            if (depth < 45) {
                isDeepslate = randomChance < transitionFactor * 0.2;
            } else {
                isDeepslate = randomChance < 0.8 + transitionFactor * 0.2;
            }
        }
        return isDeepslate;
    }

    chooseOreByDepth(depth) {
        let chances = {
            coal: 0.12, copper: 0.10, iron: 0.08, gold: 0.06, 
            redstone: 0.05, diamond: 0.03, lapis: 0.04, emerald: 0.025
        };

        const depthMultiplier = 1 + (depth * 0.008);
        chances.coal *= depthMultiplier * 0.9;
        chances.copper *= depthMultiplier;
        chances.iron *= depthMultiplier;
        chances.gold *= depthMultiplier * 1.5;
        chances.redstone *= depthMultiplier * 1.8;
        chances.diamond *= depthMultiplier * 2.5;
        chances.lapis *= depthMultiplier * 1.2;
        chances.emerald *= depthMultiplier * 2.0;

        const oreProbArray = Object.entries(chances).sort((a, b) => b[1] - a[1]);
        const oreRand = Math.random();
        let cumulativeChance = 0;
        
        for(const [ore, chance] of oreProbArray) {
            if (oreRand < cumulativeChance + chance) {
                return ore;
            }
            cumulativeChance += chance;
        }
        return null;
    }

    hasAdjacentBlock(row, col, blockTypes) {
        const checkPositions = [
            { r: row, c: col - 1 }, { r: row, c: col + 1 }, { r: row - 1, c: col }
        ];

        for (const pos of checkPositions) {
            if (pos.c >= 0 && pos.c < this.gridWidth && pos.r >= 0) {
                const blockX = this.fixedStartX + pos.c * this.blockSize;
                const blockY = 300 + pos.r * this.blockSize;
                
                // Use the grid for a faster lookup
                const nearbyBlocks = this.getNearbyBlocks(blockX, blockY, this.blockSize, this.blockSize);
                const existingBlock = nearbyBlocks.find(b => 
                    !b.destroyed && Math.abs(b.x - blockX) < 1 && Math.abs(b.y - blockY) < 1
                );
                
                if (existingBlock && blockTypes.includes(existingBlock.blockType)) {
                    return true;
                }
            }
        }
        return false;
    }

    generateMoreBlocks() {
        const cameraBottom = this.game.camera.y + this.game.canvas.height;
        const lastBlockY = 300 + this.generatedRows * this.blockSize;

        // Generate more blocks if the camera is close to the bottom and queue is not full
        if (cameraBottom > lastBlockY - this.game.canvas.height * 1.5 && this.generationQueue.length < 40) {
            const rowsToGenerate = 20; // Generate a chunk of rows at a time
            for(let i = 0; i < rowsToGenerate; i++) {
                this.generationQueue.push(this.generatedRows + i);
            }
            this.generatedRows += rowsToGenerate;
        }
    }

    updateWater() {
        // Modified to handle lava removal and water-lava interaction
        const waterBlocks = this.game.blocks.filter(b => !b.destroyed && b.blockType === 'water');
        const lavaBlocks = this.game.blocks.filter(b => !b.destroyed && b.blockType === 'lava');

        // Process water blocks
        for (let i = waterBlocks.length - 1; i >= 0; i--) {
            const water = waterBlocks[i];
            this.removeBlockFromGrid(water);
            const belowBlock = this.getBlockAt(water.x, water.y + this.blockSize);
            const hasSupportBelow = belowBlock && !belowBlock.destroyed && belowBlock.blockType !== 'water' && belowBlock.blockType !== 'lava';

            if (!hasSupportBelow) {
                water.y += this.blockSize;
                this._addBlockToGrid(water);
            } else {
                this._addBlockToGrid(water);
                if (typeof water.horizontalSpreadCount !== 'number') {
                    water.horizontalSpreadCount = 0;
                }
                if (water.horizontalSpreadCount < 1) {
                    for (const dx of [-this.blockSize, this.blockSize]) {
                        if (water.horizontalSpreadCount >= 1) break;
                        const nx = water.x + dx;
                        const ny = water.y;
                        if (nx < this.fixedStartX || nx >= this.fixedStartX + this.gridWidth * this.blockSize) continue;
                        if (!this.getBlockAt(nx, ny)) {
                            const newWater = new Block(nx, ny, this.blockSize, this.blockSize, 'water');
                            this.game.blocks.push(newWater);
                            this._addBlockToGrid(newWater);
                            water.horizontalSpreadCount++;
                        }
                    }
                }
            }

            // Check for adjacent lava blocks and convert them
            const adjacentPositions = [
                { dx: 0, dy: -this.blockSize }, // Up
                { dx: 0, dy: this.blockSize },  // Down
                { dx: -this.blockSize, dy: 0 }, // Left
                { dx: this.blockSize, dy: 0 },  // Right
                { dx: -this.blockSize, dy: -this.blockSize }, // Top-left
                { dx: this.blockSize, dy: -this.blockSize },  // Top-right
                { dx: -this.blockSize, dy: this.blockSize }, // Bottom-left
                { dx: this.blockSize, dy: this.blockSize }   // Bottom-right
            ];

            for (const pos of adjacentPositions) {
                const adjacentLava = this.getBlockAt(water.x + pos.dx, water.y + pos.dy);
                if (adjacentLava && adjacentLava.blockType === 'lava' && !adjacentLava.destroyed) {
                    // Convert lava to obsidian (10%) or stone (90%)
                    const random = Math.random();
                    const newBlockType = random < 0.1 ? 'obsidian' : 'stone';
                    
                    // Create new block at lava position
                    const newBlock = new Block(adjacentLava.x, adjacentLava.y, this.blockSize, this.blockSize, newBlockType);
                    this.game.blocks.push(newBlock);
                    this._addBlockToGrid(newBlock);
                    
                    // Mark lava as destroyed
                    adjacentLava.destroyed = true;
                    this.removeBlockFromGrid(adjacentLava);
                }
            }
        }

        // New: Process lava blocks - remove if no solid neighbor
        for (let i = lavaBlocks.length - 1; i >= 0; i--) {
            const lava = lavaBlocks[i];
            const x = lava.x;
            const y = lava.y;

            // Check all 8 neighbors
            let hasSolidNeighbor = false;
            for (let dy = -this.blockSize; dy <= this.blockSize; dy += this.blockSize) {
                for (let dx = -this.blockSize; dx <= this.blockSize; dx += this.blockSize) {
                    if (dx === 0 && dy === 0) continue; // Skip self
                    const neighbor = this.getBlockAt(x + dx, y + dy);
                    if (neighbor && !neighbor.destroyed && neighbor.blockType !== 'lava' && neighbor.blockType !== 'water') {
                        hasSolidNeighbor = true;
                        break;
                    }
                }
                if (hasSolidNeighbor) break;
            }

            if (!hasSolidNeighbor) {
                // Remove lava block
                lava.destroyed = true;
                this.removeBlockFromGrid(lava);
            }
        }
    }

    draw(ctx) {
        const bedrockImage = this.game.assetLoader.getAsset('bedrock');
        const cameraTop = this.game.camera.y;
        const cameraBottom = cameraTop + this.game.canvas.height;

        const startY = Math.floor(cameraTop / this.blockSize) * this.blockSize;
        const endY = Math.ceil(cameraBottom / this.blockSize) * this.blockSize;
        
        if (bedrockImage && bedrockImage.complete) {
            for (let y = startY; y < endY; y += this.blockSize) {
                ctx.drawImage(bedrockImage, this.fixedLeftBarrierX, y, this.barrierWidth, this.blockSize);
                ctx.drawImage(bedrockImage, this.fixedRightBarrierX, y, this.barrierWidth, this.blockSize);
            }
        } else {
            ctx.fillStyle = '#4A4A4A';
            const height = endY - startY;
            ctx.fillRect(this.fixedLeftBarrierX, startY, this.barrierWidth, height);
            ctx.fillRect(this.fixedRightBarrierX, startY, this.barrierWidth, height);
        }
    }

    processGenerationQueue() {
        // Process a few rows per frame to spread the load
        const rowsPerFrame = 2; 
        for (let i = 0; i < rowsPerFrame && this.generationQueue.length > 0; i++) {
            const row = this.generationQueue.shift();
            if (row !== undefined) {
                this.generateRow(row);
            }
        }
    }
}