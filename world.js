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

        this.generationQueue = [];

        // Spatial Grid for collision optimization
        this.spatialGrid = new Map();
        this.gridCellSize = this.blockSize * 2; // Check a smaller, more focused area
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
            const block = new Block(x, y, this.blockSize, this.blockSize, blockType);
            
            // Add chance for experience bottle
            const bottleChance = 0.01; // 1% chance for any block to have a bottle
            if (Math.random() < bottleChance && block.blockType !== 'bedrock' && block.blockType !== 'obsidian') {
                block.hasExperienceBottle = true;
            }

            this.game.blocks.push(block);
            this._addBlockToGrid(block);
        }
    }

    determineBlockType(row, col) {
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