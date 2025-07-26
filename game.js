import { Vector2 } from './vector2.js';
import { Block } from './block.js';
import { Pickaxe } from './pickaxe.js';
import { AssetLoader } from './assets.js';
import { Shop } from './shop.js';
import { World } from './world.js';
import { UI } from './ui.js';
import { GameState } from './game-state.js';
import { MusicPlayer } from './music-player.js';
import { BLOCK_DEFINITIONS } from './block-definitions.js';

export class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.backgroundCanvas = document.getElementById('backgroundCanvas');
        this.backgroundCtx = this.backgroundCanvas.getContext('2d');
        
        this.gameOver = false;
        
        // Audio context
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.sfxGainNode = this.audioContext.createGain();
        this.sfxGainNode.connect(this.audioContext.destination);

        // Add global error handlers
        this.setupErrorHandlers();

        // Set canvas to fullscreen before initializing modules that might need canvas dimensions
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.backgroundCanvas.width = window.innerWidth;
        this.backgroundCanvas.height = window.innerHeight;
        
        // Disable image smoothing for pixel art
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        this.blocks = [];
        this.camera = { x: 0, y: 0 };
        this.isLoading = true;
        this.lastTNTFlash = 0; // Add this line
        
        // Core Modules - Initialized in dependency order
        this.state = new GameState();
        this.assetLoader = new AssetLoader(this.audioContext);
        this.world = new World(this);
        this.pickaxe = new Pickaxe(380, 50, this); 
        this.ui = new UI(this);
        this.shop = new Shop(this);
        this.musicPlayer = new MusicPlayer();
        
        // Stats popup elements
        this.statsPopup = document.getElementById('stats-popup');
        this.statsCloseButton = document.getElementById('stats-close-button');
        
        // Collect popup elements
        this.collectPopup = document.getElementById('collect-popup');
        this.collectCloseButton = document.getElementById('collect-close-button');
        
        // Settings popup elements
        this.settingsPopup = document.getElementById('settings-popup');
        this.settingsCloseButton = document.getElementById('settings-close-button');
        this.musicVolumeSlider = document.getElementById('music-volume');
        this.sfxVolumeSlider = document.getElementById('sfx-volume');
        this.languageSelect = document.getElementById('language-select');
        this.resetProgressButton = document.getElementById('reset-progress-button');
        
        // Set up resize listener and perform initial resize
        this.resizeCanvas(); // Now that all modules are initialized, do an initial resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Initialize game systems
        this.initializeGameSystems();
        
        // Game loop timing
        this.lastTime = 0;
        this.accumulator = 0;
        this.fixedDeltaTime = 1 / 144; // Target 144 updates per second
        this.maxAccumulatedTime = 0.1; // Prevent spiral of death
        
        this.init();
    }

    initializeGameSystems() {
        // Ability systems
        this.activeAbilities = [];
        this.lavaParticles = [];
        this.blazeRods = [];
        this.bouncyBalls = [];
        
        // Effects that were previously DOM-based
        this.enchantmentSparkles = [];
        this.collectibleEffects = [];
        this.impactSparkles = [];
        
        // TNT system
        this.activeTNT = [];
        
        // Notification system
        this.notifications = [];
        
        // Pickaxe power-ups
        this.pickaxeSizeBuff = {
            active: false,
            timer: 0,
            duration: 5, // 5 seconds
            originalSize: { width: this.pickaxe.width, height: this.pickaxe.height }
        };
    }

    triggerAbility(abilityType, position) {
        if (abilityType === 'blaze_aura') {
            const aura = {
                type: 'blaze_aura',
                x: position.x,
                y: position.y,
                life: 1.0, // seconds
                duration: 1.0,
                radius: 0,
                maxRadius: 100, // Insta-break radius
            };
            this.activeAbilities.push(aura);

            // Insta-break blocks within the radius
            const blocksToBreak = this.world.getNearbyBlocks(aura.x - aura.maxRadius, aura.y - aura.maxRadius, aura.maxRadius * 2, aura.maxRadius * 2).filter(block => {
                if (block.destroyed) return false;
                const blockCenterX = block.x + block.width / 2;
                const blockCenterY = block.y + block.height / 2;
                const distance = Math.sqrt(Math.pow(blockCenterX - aura.x, 2) + Math.pow(blockCenterY - aura.y, 2));
                return distance < aura.maxRadius && block.blockType !== 'bedrock';
            });

            blocksToBreak.forEach(block => {
                if (block.destroyed) return;
                block.health = 0; // Directly destroy
                block.destroyed = true;
                this.handleBlockDestruction(block, true); // Pass 'true' for fromAbility
            });

        } else if (abilityType === 'lava_particles') {
            const particleCount = 20;
            for (let i = 0; i < particleCount; i++) {
                this.lavaParticles.push({
                    x: position.x + (Math.random() - 0.5) * 20,
                    y: position.y,
                    vx: (Math.random() - 0.5) * 4,
                    vy: -Math.random() * 5,
                    life: 2.0, // seconds
                });
            }
        } else if (abilityType === 'blaze_rod_rain') {
            const rodCount = 5;
            const spawnWidth = this.world.gridWidth * this.world.blockSize;
            for (let i = 0; i < rodCount; i++) {
                this.blazeRods.push({
                    x: this.world.fixedStartX + (Math.random() * spawnWidth),
                    y: position.y - 200 - (Math.random() * 200),
                    vx: (Math.random() - 0.5) * 2,
                    vy: 5 + Math.random() * 3,
                    rotation: Math.random() * Math.PI * 2,
                    angularVelocity: (Math.random() - 0.5) * 0.1,
                    bounces: 0,
                    maxBounces: 2,
                    width: 40,
                    height: 40,
                });
            }
        } else if (abilityType === 'bouncy_ball') {
            const ballCount = 1;
            for (let i = 0; i < ballCount; i++) {
                this.bouncyBalls.push({
                    x: position.x - 30, // center it
                    y: position.y - 30,
                    vx: (Math.random() - 0.5) * 8,
                    vy: -8 - Math.random() * 4,
                    rotation: 0,
                    angularVelocity: (Math.random() - 0.5) * 0.2,
                    bounces: 0,
                    maxBounces: 8, // a few less bounces, but more impactful
                    width: 60,
                    height: 60,
                    damage: 2,
                    aoeDamage: 1, // new property for area damage
                });
            }
        }
    }

    setupErrorHandlers() {
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            event.preventDefault(); // Prevent the default behavior
        });

        // Handle general errors
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
        });
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        this.backgroundCanvas.width = window.innerWidth;
        this.backgroundCanvas.height = window.innerHeight;
        
        // Disable image smoothing for pixel art after resize
        this.ctx.imageSmoothingEnabled = false;
        this.ctx.webkitImageSmoothingEnabled = false;
        this.ctx.mozImageSmoothingEnabled = false;
        this.ctx.msImageSmoothingEnabled = false;
        
        // When resizing, we no longer re-center the block grid.
        // It's initialized once in a central position and stays there.
        // This 'if' block is intentionally left empty to prevent grid movement on resize.
        if (this.blocks && this.blocks.length > 0 && this.world.fixedStartX !== null) {
            // Grid position is now static after initialization.
        } else if (this.isLoading === false) { // To handle initial setup after loading
             this.world.initializeBlocks();
        }
        
        // Re-draw the static background on resize
        if (this.ui) {
            this.ui.drawBackground(this.backgroundCtx);
        }
        
        // Update pickaxe sway range but NOT its direct position if it hasn't been dropped.
        // This prevents the pickaxe from snapping to a new centered position on resize.
        const centerX = this.canvas.width / 2;
        const swayWidth = Math.min(300, this.canvas.width * 0.4); // e.g., 40% of screen, max 300px
        const minSwayX = centerX - this.pickaxe.width / 2 - swayWidth / 2;
        const maxSwayX = centerX - this.pickaxe.width / 2 + swayWidth / 2;
        this.pickaxe.setSwayRange(minSwayX, maxSwayX);
    }

    async init() {
        this.setupLoadingProgress();
        
        try {
            await this.assetLoader.loadAssets();
            this.pickaxe.loadPickaxeImages();
            this.ui.drawBackground(this.backgroundCtx); // Pre-draw the background
            this.applySettings();
            this.hideLoadingScreenAndShowTitle();
        } catch (error) {
            console.error('Failed to load assets:', error);
            // Show error message to user
            const loadingText = document.getElementById('loadingText');
            if (loadingText) {
                loadingText.textContent = 'Tải tài nguyên game thất bại. Vui lòng tải lại trang.';
            }
        }
    }

    setupLoadingProgress() {
        const loadingProgress = document.getElementById('loadingProgress');
        const loadingText = document.getElementById('loadingText');
        
        if (loadingProgress && loadingText) {
            this.assetLoader.onProgress = (loaded, total) => {
                const percentage = Math.floor((loaded / total) * 100);
                loadingProgress.style.width = percentage + '%';
                loadingText.textContent = `Đang tải tài nguyên... ${percentage}%`;
            };
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
    }

    hideTitleScreenAndStart() {
        const titleScreen = document.getElementById('titleScreen');
        const canvas = document.getElementById('gameCanvas');
        
        if (titleScreen) {
            titleScreen.style.display = 'none';
        }
        if (canvas) {
            canvas.style.display = 'block';
        }
        this.isLoading = false;
        
        // Start the game loop with a stable time reference
        this.lastTime = performance.now(); 

        this.syncPickaxeWithState();
        this.world.initializeBlocks();
        this.setupEventListeners();
        this.gameLoop();
    }

    hideLoadingScreenAndShowTitle() {
        const loadingScreen = document.getElementById('loadingScreen');
        const titleScreen = document.getElementById('titleScreen');
        
        if (loadingScreen) {
            loadingScreen.style.display = 'none';
        }
        
        // Check if device has 1:1 aspect ratio (square screen)
        const aspectRatio = window.innerWidth / window.innerHeight;
        const isSquareScreen = Math.abs(aspectRatio - 1.0) < 0.1; // Within 10% of 1:1 ratio
        
        if (isSquareScreen && titleScreen) {
            titleScreen.style.display = 'flex';
            const startHandler = () => {
                // Resume audio context on first user interaction
                if (this.audioContext.state === 'suspended') {
                    this.audioContext.resume();
                }
                this.musicPlayer.play();
                this.hideTitleScreenAndStart();
            };
            // Use pointerdown for unified input
            titleScreen.addEventListener('pointerdown', startHandler, { once: true });
            
            document.addEventListener('keydown', (e) => {
                 if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { // Support Ctrl+D and Cmd+D
                    e.preventDefault();
                    const debugInfo = document.getElementById('debug-info');
                    debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
                }
            });
        } else {
            // For non-square screens (desktop), skip title screen and start directly
            if (this.audioContext.state === 'suspended') {
                // Try to resume audio context immediately for desktop
                this.audioContext.resume().catch(() => {
                    // If it fails, it will be resumed on first user interaction
                });
            }
            this.musicPlayer.play();
            this.hideTitleScreenAndStart();
            
            document.addEventListener('keydown', (e) => {
                 if (e.key === 'd' && (e.ctrlKey || e.metaKey)) { // Support Ctrl+D and Cmd+D
                    e.preventDefault();
                    const debugInfo = document.getElementById('debug-info');
                    debugInfo.style.display = debugInfo.style.display === 'none' ? 'block' : 'none';
                }
            });
        }
    }

    updateCamera() {
        const targetY = this.pickaxe.y - this.canvas.height / 3;
        this.camera.y += (targetY - this.camera.y) * 0.05;
        this.camera.x = 0;
    }

    setupEventListeners() {
        // Use a single pointerdown event for unified click/touch handling
        this.canvas.addEventListener('pointerdown', (e) => {
            // Resume audio context on any user interaction to enable sounds
            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            const rect = this.canvas.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const clickY = e.clientY - rect.top;

            if (this.shop.showShop) {
                this.shop.handleClick(clickX, clickY);
                return;
            }

            if (this.gameOver) {
                this.reset();
                return;
            }
            
            // Check if clicking shop button - adjust for mobile
            const isNarrow = this.canvas.width < 450;
            const buttonWidth = isNarrow ? 50 : 70;
            const buttonHeight = isNarrow ? 24 : 30;
            
            if (clickX >= this.canvas.width - (buttonWidth + 10) && clickX <= this.canvas.width - 10 &&
                clickY >= 10 && clickY <= 10 + buttonHeight) {
                this.shop.show();
                return;
            }

            // Check if clicking settings button
            const settingsButtonX = this.canvas.width - (buttonWidth * 2 + 25);
            if (clickX >= settingsButtonX && clickX <= settingsButtonX + buttonWidth &&
                clickY >= 10 && clickY <= 10 + buttonHeight) {
                this.showSettings();
                return;
            }

            // Check if clicking stats button - adjust for mobile
            const statsButtonX = this.canvas.width - (buttonWidth * 3 + 40);
            if (clickX >= statsButtonX && clickX <= statsButtonX + buttonWidth &&
                clickY >= 10 && clickY <= 10 + buttonHeight) {
                this.showStats();
                return;
            }

            // Check if clicking collect button - adjust for mobile
            const collectButtonX = this.canvas.width - (buttonWidth * 4 + 55);
            if (clickX >= collectButtonX && clickX <= collectButtonX + buttonWidth &&
                clickY >= 10 && clickY <= 10 + buttonHeight) {
                this.showCollect();
                return;
            }
            
            // Check if clicking summer event button
            const summerButtonY = this.ui.getSummerEventButtonY();
            const summerButtonWidth = isNarrow ? 55 : 70;
            const summerButtonHeight = isNarrow ? 24 : 30;
            const uiMargin = isNarrow ? 5 : 10;
            if (clickX >= uiMargin && clickX <= uiMargin + summerButtonWidth &&
                clickY >= summerButtonY && clickY <= summerButtonY + summerButtonHeight) {
                this.toggleSummerEvent();
                return;
            }

            // Check if clicking TNT purchase button
            const tntCost = 100;
            const tntBtnY = summerButtonY + summerButtonHeight + 5;
            const tntBtnWidth = isNarrow ? 55 : 70;
            const tntBtnHeight = isNarrow ? 24 : 30;
            if (this.state.money >= tntCost &&
                clickX >= uiMargin && clickX <= uiMargin + tntBtnWidth &&
                clickY >= tntBtnY && clickY <= tntBtnY + tntBtnHeight) {
                this.purchaseTNT();
                return;
            }

            // Check if clicking summer event button - adjust for mobile
            const summerButtonY2 = this.ui.getSummerEventButtonY();
            const summerButtonWidth2 = isNarrow ? 55 : 70;
            const summerButtonHeight2 = isNarrow ? 24 : 30;
            const uiMargin2 = isNarrow ? 5 : 10;
            
            if (clickX >= uiMargin2 && clickX <= uiMargin2 + summerButtonWidth2 &&
                clickY >= summerButtonY2 && clickY <= summerButtonY2 + summerButtonHeight2) {
                this.toggleSummerEvent();
                return;
            }
            
            if (!this.pickaxe.isDropped && !this.pickaxe.isBroken) {
                const pickaxeScreenX = this.pickaxe.x - this.camera.x;
                const pickaxeScreenY = this.pickaxe.y - this.camera.y;
                
                if (clickX >= pickaxeScreenX && clickX <= pickaxeScreenX + this.pickaxe.width &&
                    clickY >= pickaxeScreenY && clickY <= pickaxeScreenY + this.pickaxe.height) {
                    this.pickaxe.nextVariant();
                } else {
                    this.pickaxe.drop();
                }
            } else if (Math.abs(this.pickaxe.velocity.x) < 0.1 && 
                      Math.abs(this.pickaxe.velocity.y) < 0.1) {
                this.reset();
            }
        });

        // Add pointer events for shop scrolling
        let touchStartY = 0;
        let isDragging = false;
        
        this.canvas.addEventListener('pointerdown', (e) => {
            if (this.shop.showShop) {
                isDragging = true;
                touchStartY = e.clientY;
                // Capture pointer to ensure pointermove/up events are received
                this.canvas.setPointerCapture(e.pointerId);
            }
        });

        this.canvas.addEventListener('pointermove', (e) => {
            if (this.shop.showShop && isDragging) {
                e.preventDefault();
                const touchY = e.clientY;
                const deltaY = touchStartY - touchY;
                this.shop.handleTouchScroll(deltaY);
                touchStartY = touchY;
            }
        });
        
        const stopDrag = (e) => {
            if (this.shop.showShop && isDragging) {
                isDragging = false;
                this.canvas.releasePointerCapture(e.pointerId);
            }
        };

        this.canvas.addEventListener('pointerup', stopDrag);
        this.canvas.addEventListener('pointercancel', stopDrag);

        // Stats popup listener
        this.statsCloseButton.addEventListener('click', () => this.hideStats());

        // Collect popup listener
        this.collectCloseButton.addEventListener('click', () => this.hideCollect());
        
        // Settings popup listeners
        this.settingsCloseButton.addEventListener('click', () => this.hideSettings());
        this.musicVolumeSlider.addEventListener('input', (e) => this.updateMusicVolume(e.target.value));
        this.sfxVolumeSlider.addEventListener('input', (e) => this.updateSfxVolume(e.target.value));
        this.languageSelect.addEventListener('change', (e) => {
            this.state.settings.language = e.target.value;
            this.state.saveSettings();
        });
        this.resetProgressButton.addEventListener('click', () => {
             if (window.confirm("Bạn có chắc muốn đặt lại toàn bộ tiến trình không?")) {
                this.resetProgress();
            }
        });

        // ← New currency‐exchange listeners
        const exchangeOneBtn = document.getElementById('exchange-one-button');
        const exchangeAllBtn = document.getElementById('exchange-all-button');
        if (exchangeOneBtn && exchangeAllBtn) {
            exchangeOneBtn.addEventListener('click', () => this.exchangeMoney(1));
            exchangeAllBtn.addEventListener('click', () => this.exchangeMoney(Infinity));
        }

        // Add mouse wheel listener for shop scrolling on desktop
        this.canvas.addEventListener('wheel', (e) => {
            if (this.shop.showShop) {
                e.preventDefault();
                this.shop.handleScroll(e.deltaY);
            }
        });
    }

    toggleSummerEvent() {
        this.state.summerEventActive = !this.state.summerEventActive;
        this.state.saveAllState(); // Save all state when toggling summer event
        
        // Reset the world to apply the new block generation rules.
        this.reset();
    }

    resetProgress() {
        this.state.resetProgress();
        this.syncPickaxeWithState();
        this.pickaxe.reset(this.canvas.width / 2 - this.pickaxe.width / 2, 50);
        this.shop.hide();
        this.state.saveAllState(); // Save state after progress reset
    }

    reset() {
        if (!this.gameOver) { // Only count if a pickaxe actually breaks
            this.state.stats.pickaxesBroken++;
            this.state.saveStats();
        }

        this.gameOver = false;
        this.pickaxe.reset(this.canvas.width / 2 - this.pickaxe.width / 2, 50);
        this.camera = { x: 0, y: 0 };
        this.world.initializeBlocks();
        this.world.generationQueue = []; // Clear generation queue on reset
        this.activeAbilities = [];
        this.lavaParticles = [];
        this.blazeRods = [];
        this.bouncyBalls = [];
        this.accumulator = 0;
    }

    update(dt) {
        if (this.gameOver) return;
        
        this.pickaxe.update(dt);

        // Slow pickaxe falling when in water
        if (this.pickaxe.isDropped) {
            const px = this.pickaxe.x + this.pickaxe.width / 2;
            const py = this.pickaxe.y + this.pickaxe.height / 2;
            const water = this.world.getBlockAt(px, py);
            if (water && water.blockType === 'water') {
                this.pickaxe.velocity.y *= 0.6;
            }
        }

        if (this.pickaxe.isDropped) {
            // Update deepest depth stat
            const currentDepth = Math.max(0, Math.floor((this.pickaxe.y - 300) / this.world.blockSize));
            if (currentDepth > this.state.stats.deepestDepth) {
                this.state.stats.deepestDepth = currentDepth;
            }
        }
        
        this.updateCamera();
        this.world.generateMoreBlocks();
        this.world.processGenerationQueue();
        // simulate water flow in cave cells
        this.world.updateWater();
        this.checkCollisions();
        this.updateAbilityEffects(dt);
        this.updateProjectiles(dt);
        this.updateBuffs(dt);
        this.updateCanvasEffects(dt);
        this.updateTNT(dt);
        this.updateNotifications(dt);
    }

    updateTNT(dt) {
        for (let i = this.activeTNT.length - 1; i >= 0; i--) {
            const tnt = this.activeTNT[i];
            tnt.timer -= dt;

            // Flash effect
            const flashRate = Math.max(0.1, tnt.timer / 2);
            tnt.flashTimer -= dt;
            if (tnt.flashTimer <= 0) {
                tnt.isFlashing = !tnt.isFlashing;
                tnt.flashTimer = flashRate;

                if (tnt.isFlashing && tnt.timer > 0.1) {
                    this.playSound(this.assetLoader.getAudioAsset('tntExplode'), 0.5);
                }
            }

            // Gravity for TNT (only after first hit)
            if (!tnt.isFixed) {
                tnt.velocityY = (tnt.velocityY || 0) + 0.5; // gravity
                tnt.block.y += tnt.velocityY;

                // Check collision with blocks below
                const blockBelow = this.world.getBlockAt(tnt.block.x, tnt.block.y + tnt.block.height);
                if (blockBelow && !blockBelow.destroyed) {
                    tnt.velocityY = 0;
                    tnt.block.y = blockBelow.y - tnt.block.height; // snap to top
                }
            }

            if (tnt.timer <= 0) {
                this.explodeTNT(tnt);
                this.activeTNT.splice(i, 1);
            }
        }
    }

    explodeTNT(tnt) {
        const explosionRadius = 160; // Increased explosion radius
        
        // Destroy nearby blocks
        const nearbyBlocks = this.world.getNearbyBlocks(
            tnt.block.x - explosionRadius, 
            tnt.block.y - explosionRadius, 
            explosionRadius * 2, 
            explosionRadius * 2
        ).filter(block => {
            if (block.destroyed || block.blockType === 'bedrock') return false;
            const distance = Math.sqrt(
                Math.pow(block.x + block.width/2 - (tnt.block.x + tnt.block.width/2), 2) +
                Math.pow(block.y + block.height/2 - (tnt.block.y + tnt.block.height/2), 2)
            );
            return distance < explosionRadius;
        });

        nearbyBlocks.forEach(block => {
            if (!block.destroyed) {
                block.health = 0;
                block.destroyed = true;
                this.handleBlockDestruction(block, true);
            }
        });

        // Create explosion effect
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * explosionRadius;
            const x = tnt.block.x + tnt.block.width/2 + Math.cos(angle) * distance;
            const y = tnt.block.y + tnt.block.height/2 + Math.sin(angle) * distance;
            
            this.impactSparkles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * (3 + Math.random() * 5),
                vy: Math.sin(angle) * (3 + Math.random() * 5),
                life: 1.0 + Math.random() * 0.5,
                color: Math.random() < 0.5 ? '#FF4500' : '#FFFF00'
            });
        }

        // Knock back pickaxe if nearby
        const pickaxeDistance = Math.sqrt(
            Math.pow(this.pickaxe.x + this.pickaxe.width/2 - (tnt.block.x + tnt.block.width/2), 2) +
            Math.pow(this.pickaxe.y + this.pickaxe.height/2 - (tnt.block.y + tnt.block.height/2), 2)
        );
        
        if (pickaxeDistance < explosionRadius * 1.5) {
            const knockbackForce = (explosionRadius * 1.5 - pickaxeDistance) / (explosionRadius * 1.5) * 20;
            const angle = Math.atan2(
                this.pickaxe.y + this.pickaxe.height/2 - (tnt.block.y + tnt.block.height/2),
                this.pickaxe.x + this.pickaxe.width/2 - (tnt.block.x + tnt.block.width/2)
            );
            
            this.pickaxe.velocity.x += Math.cos(angle) * knockbackForce;
            this.pickaxe.velocity.y += Math.sin(angle) * knockbackForce - 5; // Extra upward force
            this.pickaxe.angularVelocity += (Math.random() - 0.5) * 2;
        }

        // Play explosion sound (reuse block break sound with lower pitch)
        this.playSound(this.assetLoader.getAudioAsset('blockBreak'), 0.5);
    }

    updateNotifications(dt) {
        for (let i = this.notifications.length - 1; i >= 0; i--) {
            const notification = this.notifications[i];
            notification.life -= dt;
            notification.y -= 30 * dt; // Float upward
            
            if (notification.life <= 0) {
                this.notifications.splice(i, 1);
            }
        }
    }

    updateBuffs(dt) {
        if (this.pickaxeSizeBuff.active) {
            this.pickaxeSizeBuff.timer -= dt;
            if (this.pickaxeSizeBuff.timer <= 0) {
                // Buff expired, reset pickaxe size
                this.pickaxeSizeBuff.active = false;
                this.pickaxe.width = this.pickaxeSizeBuff.originalSize.width;
                this.pickaxe.height = this.pickaxeSizeBuff.originalSize.height;
            }
        }
    }

    updateCanvasEffects(dt) {
        // Update enchantment sparkles (screen space)
        for (let i = this.enchantmentSparkles.length - 1; i >= 0; i--) {
            const s = this.enchantmentSparkles[i];
            s.x += s.vx * dt;
            s.y += s.vy * dt;
            s.life -= dt;
            if (s.life <= 0) {
                this.enchantmentSparkles.splice(i, 1);
            }
        }

        // Update collectible effects (world space)
        for (let i = this.collectibleEffects.length - 1; i >= 0; i--) {
            const e = this.collectibleEffects[i];
            e.y += e.vy * dt;
            e.life -= dt;
            if (e.life <= 0) {
                this.collectibleEffects.splice(i, 1);
            }
        }
        
        // Update impact sparkles
        for (let i = this.impactSparkles.length - 1; i >= 0; i--) {
            const p = this.impactSparkles[i];
            p.vx *= 0.95; // air friction
            p.vy += 0.2; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;
            if (p.life <= 0) {
                this.impactSparkles.splice(i, 1);
            }
        }
    }

    updateAbilityEffects(dt) {
        // Update ability visual effects
        for (let i = this.activeAbilities.length - 1; i >= 0; i--) {
            const ability = this.activeAbilities[i];
            ability.life -= dt;
            if (ability.type === 'blaze_aura') {
                ability.radius = (1 - (ability.life / ability.duration)) * ability.maxRadius;
            }
            if (ability.life <= 0) {
                this.activeAbilities.splice(i, 1);
            }
        }

        // Update lava particles
        this.updateLavaParticles(dt);
    }

    updateLavaParticles(dt) {
        for (let i = this.lavaParticles.length - 1; i >= 0; i--) {
            const p = this.lavaParticles[i];
            p.vy += 0.1; // gravity
            p.x += p.vx;
            p.y += p.vy;
            p.life -= dt;

            let shouldRemove = p.life <= 0 || p.y > this.camera.y + this.canvas.height + 50;

            if (!shouldRemove) {
                const block = this.world.getBlockAt(p.x, p.y);
                if (block && !block.destroyed) {
                    block.takeDamage(0.5); // Lava particles deal small damage
                    this.handleBlockDestruction(block, true);
                    shouldRemove = true; // Particle is destroyed on impact
                }
            }
            
            if (shouldRemove) {
                this.lavaParticles.splice(i, 1);
            }
        }
    }

    updateProjectiles(dt) {
        this.updateBlazeRods(dt);
        this.updateBouncyBalls(dt);
    }

    updateBouncyBalls(dt) {
        const gravity = 0.3;
        const bounceFactor = 0.9;
        const friction = 0.99;
    
        for (let i = this.bouncyBalls.length - 1; i >= 0; i--) {
            const ball = this.bouncyBalls[i];
            ball.vy += gravity;
            ball.vx *= friction;
    
            const prevX = ball.x;
            const prevY = ball.y;
    
            ball.x += ball.vx;
            ball.y += ball.vy;
            ball.rotation += ball.angularVelocity;
    
            // Wall collisions
            if (ball.x < this.world.fixedLeftBarrierX + this.world.barrierWidth) {
                ball.x = this.world.fixedLeftBarrierX + this.world.barrierWidth;
                ball.vx *= -bounceFactor;
                ball.bounces++;
                ball.angularVelocity *= -1;
                this.playSound(this.assetLoader.getAudioAsset('bounce'), 1.0 + (Math.random() - 0.5) * 0.2);
            }
            if (ball.x + ball.width > this.world.fixedRightBarrierX) {
                ball.x = this.world.fixedRightBarrierX - ball.width;
                ball.vx *= -bounceFactor;
                ball.bounces++;
                ball.angularVelocity *= -1;
                this.playSound(this.assetLoader.getAudioAsset('bounce'), 1.0 + (Math.random() - 0.5) * 0.2);
            }

            // Block collision
            const entity = {
                x: prevX,
                y: prevY,
                width: ball.width,
                height: ball.height,
                vx: ball.vx,
                vy: ball.vy,
            };
            const nearbyBlocks = this.world.getNearbyBlocks(entity.x, entity.y, entity.width + Math.abs(entity.vx), entity.height + Math.abs(entity.vy));
            
            let closestCollision = { time: Infinity };

            for (const block of nearbyBlocks) {
                if (block.destroyed) continue;
                const collision = this.sweptAABB(entity, block);
                if (collision.hit && collision.time < closestCollision.time) {
                    closestCollision = { ...collision, block };
                }
            }

            if (closestCollision.time < 1) {
                const { time, normalX, normalY, block } = closestCollision;
                ball.bounces++;
                
                // Move entity to point of collision
                ball.x = prevX + ball.vx * time;
                ball.y = prevY + ball.vy * time;

                if (normalX !== 0) { // Horizontal collision
                    ball.vx *= -bounceFactor;
                    ball.angularVelocity += (ball.vy / 50) * Math.sign(ball.vx);
                }
                if (normalY !== 0) { // Vertical collision
                    if (ball.vy > 0) { // Hitting top of a block
                        ball.vy = -14; // Strong upward bounce
                        ball.vx += (Math.random() - 0.5) * 10;
                        ball.angularVelocity += (Math.random() - 0.5) * 0.5;
                    } else { // Hitting bottom of a block
                        ball.vy *= -bounceFactor;
                    }
                }
                
                // Damage block
                block.takeDamage(ball.damage);
                this.handleBlockDestruction(block, true);
                this.playSound(this.assetLoader.getAudioAsset('bounce'), 0.8 + (Math.random() - 0.5) * 0.2);
                
                // --- NEW: AOE Damage and Effect ---
                this.createImpactSparkles(ball.x + ball.width / 2, ball.y + ball.height / 2);

                const adjacentPositions = [
                    { dx: -this.world.blockSize, dy: 0 }, { dx: this.world.blockSize, dy: 0 },
                    { dx: 0, dy: -this.world.blockSize }, { dx: 0, dy: this.world.blockSize }
                ];

                adjacentPositions.forEach(pos => {
                    const adjBlock = this.world.getBlockAt(block.x + pos.dx, block.y + pos.dy);
                    if (adjBlock && !adjBlock.destroyed) {
                        adjBlock.takeDamage(ball.aoeDamage);
                        this.handleBlockDestruction(adjBlock, true);
                    }
                });
            }
    
            const shouldRemove = ball.bounces >= ball.maxBounces || ball.y > this.camera.y + this.canvas.height + 100;
            if (shouldRemove) {
                this.bouncyBalls.splice(i, 1);
            }
        }
    }

    createImpactSparkles(x, y) {
        const count = 10 + Math.floor(Math.random() * 5);
        for(let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 2 + Math.random() * 4;
            this.impactSparkles.push({
                x: x,
                y: y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.5 + Math.random() * 0.5,
                color: Math.random() < 0.7 ? '#FFFFFF' : '#ADD8E6'
            });
        }
    }

    updateBlazeRods(dt) {
        const gravity = 0.4;
        const bounceFactor = 0.9; 
        const friction = 0.98;

        for (let i = this.blazeRods.length - 1; i >= 0; i--) {
            const rod = this.blazeRods[i];
            rod.vy += gravity;
            rod.vx *= friction;

            const prevX = rod.x;
            const prevY = rod.y;

            rod.x += rod.vx;
            rod.y += rod.vy;
            rod.rotation += rod.angularVelocity;

            // Check for wall collisions
            if (rod.x < this.world.fixedLeftBarrierX + this.world.barrierWidth) {
                rod.x = this.world.fixedLeftBarrierX + this.world.barrierWidth;
                rod.vx *= -bounceFactor;
                rod.bounces++;
            }
            if (rod.x + rod.width > this.world.fixedRightBarrierX) {
                rod.x = this.world.fixedRightBarrierX - rod.width;
                rod.vx *= -bounceFactor;
                rod.bounces++;
            }

            // Check for block collisions using CCD
            const entity = {
                x: prevX,
                y: prevY,
                width: rod.width,
                height: rod.height,
                vx: rod.vx,
                vy: rod.vy,
            };
            const nearbyBlocks = this.world.getNearbyBlocks(entity.x, entity.y, entity.width + Math.abs(entity.vx), entity.height + Math.abs(entity.vy));
            
            let closestCollision = { time: Infinity };

            for (const block of nearbyBlocks) {
                if (block.destroyed) continue;
                const collision = this.sweptAABB(entity, block);
                if (collision.hit && collision.time < closestCollision.time) {
                    closestCollision = { ...collision, block };
                }
            }

            if (closestCollision.time < 1) {
                const { time, normalX, normalY, block } = closestCollision;
                rod.bounces++;
                
                // Move entity to point of collision
                rod.x = prevX + rod.vx * time;
                rod.y = prevY + rod.vy * time;

                if (normalX !== 0) {
                    rod.vx *= -bounceFactor;
                    rod.angularVelocity += (rod.vy / 50) * Math.sign(rod.vx);
                }
                if (normalY !== 0) {
                     if (rod.vy > 0) { // Hitting top of a block
                        rod.vy = -14; // Strong upward velocity like the pickaxe
                        rod.vx += (Math.random() - 0.5) * 10;
                        rod.angularVelocity += (Math.random() - 0.5) * 0.5;
                    } else { // Hitting bottom of a block
                        rod.vy *= -bounceFactor;
                    }
                }

                // Damage block
                block.takeDamage(1.5); // Blaze rods deal some damage
                this.handleBlockDestruction(block, true);
                this.playSound(this.assetLoader.getAudioAsset('blockBreak'), 1.2 + Math.random() * 0.2);
                this.createImpactSparkles(rod.x + rod.width / 2, rod.y + rod.height / 2);
            }

            const shouldRemove = rod.bounces >= rod.maxBounces || rod.y > this.camera.y + this.canvas.height + 100;
            if (shouldRemove) {
                this.blazeRods.splice(i, 1);
            }
        }
    }

    // --- NEW: Continuous Collision Detection (CCD) ---
    // This function calculates if and when a moving object (entity) will hit a static block.
    sweptAABB(entity, block) {
        // No collision if entity isn't moving
        if (entity.vx === 0 && entity.vy === 0) {
            return { hit: false };
        }
    
        // Calculate the inverse of the entry and exit times for collision on each axis
        const invEntryX = entity.vx > 0 ? block.x - (entity.x + entity.width) : (block.x + block.width) - entity.x;
        const invEntryY = entity.vy > 0 ? block.y - (entity.y + entity.height) : (block.y + block.height) - entity.y;
    
        const invExitX = entity.vx > 0 ? (block.x + block.width) - entity.x : block.x - (entity.x + entity.width);
        const invExitY = entity.vy > 0 ? (block.y + block.height) - entity.y : block.y - (entity.y + block.height);
    
        // Calculate the time of collision (t) on each axis
        const entryTimeX = entity.vx === 0 ? -Infinity : invEntryX / entity.vx;
        const entryTimeY = entity.vy === 0 ? -Infinity : invEntryY / entity.vy;
    
        const exitTimeX = entity.vx === 0 ? Infinity : invExitX / entity.vx;
        const exitTimeY = entity.vy === 0 ? Infinity : invExitY / entity.vy;
    
        // Find the latest entry time and earliest exit time
        const entryTime = Math.max(entryTimeX, entryTimeY);
        const exitTime = Math.min(exitTimeX, exitTimeY);
    
        // If there's no overlap in collision times, no collision occurred
        if (entryTime > exitTime || entryTimeX < 0 && entryTimeY < 0 || entryTime > 1) {
            return { hit: false };
        }
    
        // Determine the normal of the surface that was hit
        let normalX = 0;
        let normalY = 0;
        if (entryTimeX > entryTimeY) {
            normalX = entity.vx > 0 ? -1 : 1;
        } else {
            normalY = entity.vy > 0 ? -1 : 1;
        }
    
        return {
            hit: true,
            time: entryTime,
            normalX: normalX,
            normalY: normalY,
        };
    }

    lineIntersectsBlock(x1, y1, x2, y2, block) {
        const bx = block.x;
        const by = block.y;
        const bw = block.width;
        const bh = block.height;
    
        // Check if line intersects any of the 4 block edges
        const top = this.lineIntersectsLine(x1, y1, x2, y2, bx, by, bx + bw, by);
        const bottom = this.lineIntersectsLine(x1, y1, x2, y2, bx, by + bh, bx + bw, by + bh);
        const left = this.lineIntersectsLine(x1, y1, x2, y2, bx, by, bx, by + bh);
        const right = this.lineIntersectsLine(x1, y1, x2, y2, bx + bw, by, bx + bw, by + bh);
    
        return top || bottom || left || right;
    }
    
    lineIntersectsLine(x1, y1, x2, y2, x3, y3, x4, y4) {
        const den = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4);
        if (den === 0) {
            return false; // Lines are parallel
        }
    
        const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / den;
        const u = -((x1 - x2) * (y1 - y2) - (y1 - y2) * (x1 - x3)) / den;
    
        return t > 0 && t < 1 && u > 0 && u < 1;
    }

    checkCollisions() {
        if (this.pickaxe.isBroken || !this.pickaxe.isDropped) return;

        // --- Barrier Collisions ---
        // These are simple and can be handled before block collisions.
        // Left barrier
        if (this.pickaxe.x < this.world.fixedLeftBarrierX + this.world.barrierWidth) {
            this.pickaxe.x = this.world.fixedLeftBarrierX + this.world.barrierWidth;
            this.pickaxe.velocity.x *= -this.pickaxe.bounce;
        }
        // Right barrier
        if (this.pickaxe.x + this.pickaxe.width > this.world.fixedRightBarrierX) {
            this.pickaxe.x = this.world.fixedRightBarrierX - this.pickaxe.width;
            this.pickaxe.velocity.x *= -this.pickaxe.bounce;
        }

        // --- Block Collisions using swept AABB ---
        this.handleBlockCollisions();
    }

    handleBlockCollisions() {
        // Get blocks that might collide with the pickaxe
        const sweepBox = {
            x: Math.min(this.pickaxe.x, this.pickaxe.prevX) - 5,
            y: Math.min(this.pickaxe.y, this.pickaxe.prevY) - 5,
            width: Math.abs(this.pickaxe.x - this.pickaxe.prevX) + this.pickaxe.width + 10,
            height: Math.abs(this.pickaxe.y - this.pickaxe.prevY) + this.pickaxe.height + 10
        };
        
        const nearbyBlocks = this.world.getNearbyBlocks(sweepBox.x, sweepBox.y, sweepBox.width, sweepBox.height);
        
        // Check for collisions with each block
        for (const block of nearbyBlocks) {
            // Skip destroyed, water blocks, and lava blocks (pickaxe passes through water and lava)
            if (block.destroyed || block.blockType === 'water' || block.blockType === 'lava') continue;
            
            const collision = this.checkPickaxeBlockCollision(block);
            if (collision.hit) {
                this.resolvePickaxeBlockCollision(block, collision);
            }
        }
    }

    checkPickaxeBlockCollision(block) {
        // Simple AABB collision check first
        if (this.pickaxe.x >= block.x + block.width ||
            this.pickaxe.x + this.pickaxe.width <= block.x ||
            this.pickaxe.y >= block.y + block.height ||
            this.pickaxe.y + this.pickaxe.height <= block.y) {
            return { hit: false };
        }

        // Calculate overlap on each axis
        const overlapX = Math.min(this.pickaxe.x + this.pickaxe.width - block.x, block.x + block.width - this.pickaxe.x);
        const overlapY = Math.min(this.pickaxe.y + this.pickaxe.height - block.y, block.y + block.height - this.pickaxe.y);

        // Determine collision direction based on smallest overlap and velocity
        let normalX = 0;
        let normalY = 0;

        if (overlapX < overlapY) {
            // Horizontal collision
            if (this.pickaxe.x < block.x) {
                normalX = -1; // Hit from left
            } else {
                normalX = 1;  // Hit from right
            }
        } else {
            // Vertical collision
            if (this.pickaxe.y < block.y) {
                normalY = -1; // Hit from above
            } else {
                normalY = 1;  // Hit from below
            }
        }

        return {
            hit: true,
            normalX: normalX,
            normalY: normalY,
            overlapX: overlapX,
            overlapY: overlapY
        };
    }

    resolvePickaxeBlockCollision(block, collision) {
        const { normalX, normalY, overlapX, overlapY } = collision;

        // Move pickaxe out of the block
        if (normalX !== 0) {
            this.pickaxe.x += normalX * overlapX;
            this.pickaxe.velocity.x *= -this.pickaxe.bounce;
            this.pickaxe.angularVelocity += (this.pickaxe.velocity.y / 50) * Math.sign(this.pickaxe.velocity.x);
        }
        
        if (normalY !== 0) {
            this.pickaxe.y += normalY * overlapY;
            
            if (normalY < 0) {
                // Hitting top of block from above - give strong upward bounce
                this.pickaxe.velocity.y = -14;
                
                const stability = this.pickaxe.getCurrentVariant().stability || 1;
                const chaosFactor = 10 / stability;
                const spinFactor = 0.5 / stability;
                
                this.pickaxe.velocity.x += (Math.random() - 0.5) * chaosFactor;
                this.pickaxe.angularVelocity += (Math.random() - 0.5) * spinFactor;
            } else {
                // Hitting bottom of block from below
                this.pickaxe.velocity.y *= -this.pickaxe.bounce;
            }
        }

        // Handle block damage and destruction
        this.handleBlockHit(block);
    }

    handleBlockHit(block) {
        const wasAlive = !block.destroyed;
        const pickaxeVariant = this.pickaxe.getCurrentVariant();
        
        // --- Trigger abilities on hit ---
        if (pickaxeVariant.ability && this.pickaxe.abilityTimer >= pickaxeVariant.abilityCooldown) {
            this.pickaxe.abilityTimer = 0; // Reset cooldown
            this.triggerAbility(pickaxeVariant.ability, { x: block.x + block.width / 2, y: block.y + block.height / 2 });
        }
        
        // Always apply damage on hit
        const efficiencyBonus = this.state.enchantmentLevels.efficiency * 0.5;
        const totalPower = pickaxeVariant.power + efficiencyBonus;
        block.takeDamage(totalPower);
        
        // If the block was just destroyed
        this.handleBlockDestruction(block);
        
        // Special handling for TNT
        if (block.blockType === 'tnt' && !block.destroyed) {
            block.health = 0;
            block.destroyed = true;
            this.activeTNT.push({
                block: block,
                timer: 2.0, // 2 second fuse
                flashTimer: 0.2,
                isFlashing: false
            });
            this.playSound(this.assetLoader.getAudioAsset('tntExplode'), 0.5);
            return; // Skip normal destruction for TNT
        }

        // Create impact sparkles on hit
        this.createImpactSparkles(this.pickaxe.x + this.pickaxe.width / 2, this.pickaxe.y + this.pickaxe.height / 2);
        
        if (wasAlive && !block.destroyed) {
            // Block was hit but not destroyed, play a 'hit' sound with a higher pitch
            const hitPitch = 1.5 + (Math.random() - 0.5) * 0.4;
            this.playSound(this.assetLoader.getAudioAsset('blockBreak'), hitPitch);
        }
    }

    resolveMovement(entity, remainingTime, depth = 0) {
        // Stop resolving after a few bounces to prevent infinite loops and improve performance
        if (remainingTime <= 1e-4 || depth > 4) {
            return;
        }

        let closestCollision = { time: Infinity };

        // Swept AABB requires the entity's state at the beginning of the time slice
        const motion = {
            x: entity.x,
            y: entity.y,
            width: entity.width,
            height: entity.height,
            vx: entity.velocity.x * remainingTime, // Scale velocity by the time slice
            vy: entity.velocity.y * remainingTime,
        };

        // Create a sweep box for the *full remaining time slice* to find potential collisions
        const sweepBox = {
            x: Math.min(motion.x, motion.x + motion.vx),
            y: Math.min(motion.y, motion.y + motion.vy),
            width: Math.abs(motion.vx) + motion.width,
            height: Math.abs(motion.vy) + motion.height
        };
        const nearbyBlocks = this.world.getNearbyBlocks(sweepBox.x, sweepBox.y, sweepBox.width, sweepBox.height);

        for (const block of nearbyBlocks) {
            if (block.destroyed) continue;
            const collision = this.sweptAABB(motion, block);

            if (collision.hit && collision.time < closestCollision.time) {
                closestCollision = { ...collision, block };
            }
        }

        if (closestCollision.time < 1.0) { // A collision will occur within this motion step
            const { time, normalX, normalY, block } = closestCollision;

            // --- Move entity to the precise point of impact ---
            // Use a small epsilon to avoid getting stuck in the geometry
            const epsilon = 1e-4;
            entity.x += entity.velocity.x * (time - epsilon);
            entity.y += entity.velocity.y * (time - epsilon);

            // --- Handle Block Damage & Effects ---
            this.handleCollision(block);
            
            // --- Slide along the surface for the rest of the frame ---
            const remainingCollisionTime = remainingTime * (1.0 - time);
            
            // Dot product of velocity and the normal vector
            const dotProduct = entity.velocity.x * normalX + entity.velocity.y * normalY;
            
            // The new velocity is the original velocity minus the bounce impulse.
            // This makes the pickaxe slide along the surface.
            entity.velocity.x -= (1 + entity.bounce) * dotProduct * normalX;
            entity.velocity.y -= (1 + entity.bounce) * dotProduct * normalY;

             // Special bounce for hitting top of a block
            if (normalY < 0 && entity.velocity.y > -13) {
                entity.velocity.y = -14; // Strong upward velocity for high jump                   
                const stability = entity.getCurrentVariant().stability || 1;
                const chaosFactor = 10 / stability;
                const spinFactor = 0.5 / stability;
                entity.velocity.x += (Math.random() - 0.5) * chaosFactor;
                entity.angularVelocity += (Math.random() - 0.5) * spinFactor;
            }

            // Recursively resolve for the rest of the frame with the new velocity
            this.resolveMovement(entity, remainingCollisionTime, depth + 1);

        } else {
             // No collision, entity moves for the full remaining time
            entity.x += entity.velocity.x * remainingTime;
            entity.y += entity.velocity.y * remainingTime;
        }
    }

    handleCollision(block) {
        const wasAlive = !block.destroyed;
        const pickaxeVariant = this.pickaxe.getCurrentVariant();
        
        // --- Trigger abilities on hit ---
        if (pickaxeVariant.ability && this.pickaxe.abilityTimer >= pickaxeVariant.abilityCooldown) {
            this.pickaxe.abilityTimer = 0; // Reset cooldown
            this.triggerAbility(pickaxeVariant.ability, { x: block.x + block.width / 2, y: block.y + block.height / 2 });
        }
        
        // Always apply damage on hit
        const efficiencyBonus = this.state.enchantmentLevels.efficiency * 0.5;
        const totalPower = pickaxeVariant.power + efficiencyBonus;
        block.takeDamage(totalPower);
        
        // If the block was just destroyed
        this.handleBlockDestruction(block);

        // Create impact sparkles on hit
        this.createImpactSparkles(this.pickaxe.x + this.pickaxe.width / 2, this.pickaxe.y + this.pickaxe.height / 2);
        
        if (wasAlive && !block.destroyed) {
            // Block was hit but not destroyed, play a 'hit' sound with a higher pitch
            const hitPitch = 1.5 + (Math.random() - 0.5) * 0.4;
            this.playSound(this.assetLoader.getAudioAsset('blockBreak'), hitPitch);
        }
    }

    handleBlockDestruction(block, fromAbility = false) {
        if (!block.destroyed) return;

        // Remove block from spatial grid
        this.world.removeBlockFromGrid(block);

        // Award resources and update stats
        this.state.stats.totalBlocksBroken = (this.state.stats.totalBlocksBroken || 0) + 1;
        this.state.stats.blocksBrokenByType = this.state.stats.blocksBrokenByType || {};
        this.state.stats.blocksBrokenByType[block.blockType] = (this.state.stats.blocksBrokenByType[block.blockType] || 0) + 1;

        // Special handling for chest blocks
        if (block.blockType === 'chest') {
            this.handleChestLoot();
        } else if (block.blockType === 'tnt') {
            // Start TNT countdown
            this.activeTNT.push({
                block: block,
                timer: 2.0, // 2 second fuse
                flashTimer: 0.2,
                isFlashing: false
            });
            return; // Don't process normal resource drops for TNT
        } else {
            // Award resources based on block type
            const baseResource = this.getResourceFromBlockType(block.blockType);
            if (baseResource) {
                let amount = 1;
                
                // Apply fortune enchantment
                const fortuneLevel = this.state.enchantmentLevels.fortune;
                if (fortuneLevel > 0 && Math.random() < 0.3 * fortuneLevel) {
                    amount += Math.floor(Math.random() * fortuneLevel) + 1;
                }

                this.state.resources[baseResource] = (this.state.resources[baseResource] || 0) + amount;
                this.state.stats.resourcesCollected = this.state.stats.resourcesCollected || {};
                this.state.stats.resourcesCollected[baseResource] = (this.state.stats.resourcesCollected[baseResource] || 0) + amount;
            }
        }

        // Handle experience bottle
        if (block.hasExperienceBottle) {
            this.collectibleEffects.push({
                type: 'experience_bottle',
                x: block.x + block.width / 2,
                y: block.y + block.height / 2,
                vy: -2,
                life: 1.0,
                duration: 1.0
            });
        }

        // Play break sound
        if (!fromAbility) {
            this.playSound(this.assetLoader.getAudioAsset('blockBreak'), 1.0 + (Math.random() - 0.5) * 0.2);
        }

        // Damage pickaxe if it's not from an ability
        if (!fromAbility) {
            const unbreakingLevel = this.state.enchantmentLevels.unbreaking;
            const damageChance = 1 / (unbreakingLevel + 1);
            if (Math.random() < damageChance) {
                this.pickaxe.takeDamage(1);
                if (this.pickaxe.isBroken) {
                    this.gameOver = true;
                }
            }
        }

        // 1% chance to get TNT
        if (Math.random() < 0.01) {
            this.state.tntCollected = (this.state.tntCollected || 0) + 1;
            this.state.saveTntCollected();
        }

        // Save stats periodically
        if (Math.random() < 0.1) { // 10% chance to save on each block break
            this.state.saveStats();
        }
    }

    handleChestLoot() {
        // Generate random ore rewards from chest
        const possibleOres = ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald'];
        const lootCount = 1 + Math.floor(Math.random() * 3); // 1-3 items
        const lootItems = [];
        
        for (let i = 0; i < lootCount; i++) {
            const randomOre = possibleOres[Math.floor(Math.random() * possibleOres.length)];
            const amount = 1 + Math.floor(Math.random() * 2); // 1-2 of each ore
            
            this.state.resources[randomOre] = (this.state.resources[randomOre] || 0) + amount;
            this.state.stats.resourcesCollected = this.state.stats.resourcesCollected || {};
            this.state.stats.resourcesCollected[randomOre] = (this.state.stats.resourcesCollected[randomOre] || 0) + amount;
            
            lootItems.push({ name: this.getResourceDisplayName(randomOre), amount });
        }
        
        // Create notification
        const lootText = lootItems.map(item => `${item.amount} ${item.name}`).join(', ');
        this.notifications.push({
            text: `Tìm thấy: ${lootText}`,
            x: this.pickaxe.x + this.pickaxe.width / 2,
            y: this.pickaxe.y,
            life: 3.0,
            maxLife: 3.0
        });
        
        // Show visual effect for chest opening
        this.createChestSparkles();
    }

    getResourceDisplayName(resource) {
        const nameMap = {
            coal: 'Than',
            copper: 'Đồng', 
            iron: 'Sắt',
            gold: 'Vàng',
            redstone: 'Đá Đỏ',
            diamond: 'Kim Cương',
            lapis: 'Lưu Ly',
            emerald: 'Ngọc Lục Bảo'
        };
        return nameMap[resource] || resource;
    }

    createChestSparkles() {
        const sparkleCount = 20;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkleCount;
            const radius = 30 + Math.random() * 60;
            const x = this.pickaxe.x + this.pickaxe.width / 2 + Math.cos(angle) * radius;
            const y = this.pickaxe.y + this.pickaxe.height / 2 + Math.sin(angle) * radius;
            
            this.impactSparkles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                life: 1.0,
                color: '#FFD700' // Gold color for treasure
            });
        }
    }

    getResourceFromBlockType(blockType) {
        const resourceMap = {
            'stone': 'stone',
            'andesite': 'stone',
            'diorite': 'stone',
            'granite': 'stone',
            'deepslate': 'stone',
            'coal_ore': 'coal',
            'deepslate_coal_ore': 'coal',
            'copper_ore': 'copper',
            'deepslate_copper_ore': 'copper',
            'iron_ore': 'iron',
            'deepslate_iron_ore': 'iron',
            'gold_ore': 'gold',
            'deepslate_gold_ore': 'gold',
            'redstone_ore': 'redstone',
            'deepslate_redstone_ore': 'redstone',
            'diamond_ore': 'diamond',
            'deepslate_diamond_ore': 'diamond',
            'lapis_ore': 'lapis',
            'deepslate_lapis_ore': 'lapis',
            'emerald_ore': 'emerald',
            'deepslate_emerald_ore': 'emerald',
            'obsidian': 'obsidian',
            'sand': 'sand',
            'sandstone': 'sandstone',
            'chest': null // Special handling for chests
        };
        return resourceMap[blockType] || null;
    }

    playSound(audioBuffer, playbackRate = 1.0) {
        if (!audioBuffer || !this.audioContext) return;
        
        try {
            const source = this.audioContext.createBufferSource();
            source.buffer = audioBuffer;
            source.playbackRate.value = playbackRate;
            source.connect(this.sfxGainNode);
            source.start();
        } catch (error) {
            console.warn('Failed to play sound:', error);
        }
    }

    createEnchantmentSparkles() {
        const sparkleCount = 15;
        for (let i = 0; i < sparkleCount; i++) {
            const angle = (Math.PI * 2 * i) / sparkleCount;
            const radius = 50 + Math.random() * 100;
            const x = this.canvas.width / 2 + Math.cos(angle) * radius;
            const y = this.canvas.height / 2 + Math.sin(angle) * radius;
            
            this.enchantmentSparkles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                size: 2 + Math.random() * 6,
                life: 0.7,
                duration: 0.7
            });
        }
    }

    draw() {
        // Delegate drawing to the UI module
        this.ui.draw(this.ctx);
        
        if (this.shop.showShop) {
            this.shop.draw(this.ctx, this.canvas);
            return;
        }

        this.ctx.save();
        this.ctx.translate(-this.camera.x, -this.camera.y);
        
        // Draw world elements
        this.world.draw(this.ctx);
        
        // Draw visible blocks using the spatial grid for optimization
        const visibleBlocks = this.world.getNearbyBlocks(this.camera.x, this.camera.y, this.canvas.width, this.canvas.height);

        visibleBlocks.forEach(block => {
            if (!block.destroyed) { // The grid already filters for visible area
                block.draw(this.ctx);
            }
        });
        
        // Draw flashing TNT blocks
        this.activeTNT.forEach(tnt => {
            if (tnt.isFlashing) {
                this.ctx.save();
                this.ctx.globalAlpha = 0.7;
                this.ctx.fillStyle = '#FFFF00';
                this.ctx.fillRect(tnt.block.x - 2, tnt.block.y - 2, tnt.block.width + 4, tnt.block.height + 4);
                this.ctx.restore();
            }
        });
        
        // Draw bouncy balls
        const bouncyBallImage = this.assetLoader.getAsset('bouncyBall');
        if (bouncyBallImage && bouncyBallImage.complete) {
            this.bouncyBalls.forEach(ball => {
                this.ctx.save();
                this.ctx.translate(ball.x + ball.width / 2, ball.y + ball.height / 2);
                this.ctx.rotate(ball.rotation);
                this.ctx.drawImage(bouncyBallImage, -ball.width / 2, -ball.height / 2, ball.width, ball.height);
                this.ctx.restore();
            });
        }
        
        // Draw blaze rods
        const blazeRodImage = this.assetLoader.getAsset('blazeRod');
        if (blazeRodImage && blazeRodImage.complete) {
            this.blazeRods.forEach(rod => {
                this.ctx.save();
                this.ctx.translate(rod.x + rod.width / 2, rod.y + rod.height / 2);
                this.ctx.rotate(rod.rotation);
                this.ctx.drawImage(blazeRodImage, -rod.width / 2, -rod.height / 2, rod.width, rod.height);
                this.ctx.restore();
            });
        }
        
        // Draw ability effects
        this.activeAbilities.forEach(ability => {
            // Drawing logic for any remaining abilities would go here
        });

        // Draw impact sparkles
        this.impactSparkles.forEach(p => {
            const size = 1 + p.life * 4; // particle shrinks as it dies
            this.ctx.fillStyle = p.color;
            this.ctx.globalAlpha = p.life > 0.5 ? 1 : p.life * 2;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, size/2, 0, Math.PI * 2);
            this.ctx.fill();
            this.ctx.globalAlpha = 1.0;
        });

        // Draw lava particles
        this.lavaParticles.forEach(p => {
            const size = 3 + p.life; // particle shrinks as it dies
            this.ctx.fillStyle = Math.random() < 0.5 ? '#ff4500' : '#ffa500';
            this.ctx.fillRect(p.x - size / 2, p.y - size / 2, size, size);
        });
        
        // Draw collectible effects
        const expBottleImage = this.assetLoader.getAsset('experience_bottle');
        if (expBottleImage && expBottleImage.complete) {
            this.collectibleEffects.forEach(e => {
                if (e.type === 'experience_bottle') {
                    const progress = 1 - (e.life / e.duration);
                    const scale = 1.0 - (progress * 0.8); // shrinks to 20%
                    const alpha = 1.0 - progress;
                    const width = 32 * scale;
                    const height = 32 * scale;
                    
                    this.ctx.globalAlpha = alpha;
                    this.ctx.drawImage(expBottleImage, e.x - width / 2, e.y - height / 2, width, height);
                    this.ctx.globalAlpha = 1.0;
                }
            });
        }
        
        this.pickaxe.draw(this.ctx);
        
        // Draw trajectory line
        if (!this.pickaxe.isDropped && !this.pickaxe.isBroken) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.setLineDash([5, 5]);
            this.ctx.beginPath();
            this.ctx.moveTo(this.pickaxe.x + this.pickaxe.width/2, this.pickaxe.y + this.pickaxe.height);
            this.ctx.lineTo(this.pickaxe.x + this.pickaxe.width/2, this.pickaxe.y + 2000);
            this.ctx.stroke();
            this.ctx.setLineDash([]);
        }
        
        // Draw notifications
        this.notifications.forEach(notification => {
            const alpha = Math.min(1, notification.life / notification.maxLife);
            this.ctx.globalAlpha = alpha;
            
            // Background
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
            const textWidth = this.ctx.measureText(notification.text).width + 20;
            this.ctx.fillRect(notification.x - textWidth/2, notification.y - 15, textWidth, 30);
            
            // Text
            this.ctx.fillStyle = '#FFD700';
            this.ctx.font = 'bold 14px system-ui, -apple-system, sans-serif';
            this.ctx.textAlign = 'center';
            this.ctx.fillText(notification.text, notification.x, notification.y + 5);
            
            this.ctx.globalAlpha = 1.0;
        });
        
        this.ctx.restore();
        
        // Draw UI overlays
        this.ui.drawOverlays(this.ctx);

        // Draw screen-space effects like sparkles
        this.enchantmentSparkles.forEach(s => {
            const progress = 1 - (s.life / s.duration);
            const scale = 0.5 + progress;
            const alpha = 1.0 - progress;
            
            this.ctx.fillStyle = `rgba(255, 0, 255, ${alpha})`;
            this.ctx.beginPath();
            this.ctx.arc(s.x, s.y, s.size * scale / 2, 0, Math.PI * 2);
            this.ctx.fill();
        });
    }

    gameLoop(timestamp) {
        if (!this.lastTime) {
            this.lastTime = timestamp;
        }
        // Use performance.now() for a more reliable time source
        const currentTime = performance.now();
        const dt = (currentTime - this.lastTime) / 1000; // delta time in seconds
        this.lastTime = currentTime;

        // Update playtime stat
        this.state.stats.playTime = (this.state.stats.playTime || 0) + dt;

        if (this.isLoading) {
            requestAnimationFrame((t) => this.gameLoop(t));
            return;
        }

        // Prevent large DT spikes (e.g., from tab switching)
        this.accumulator += Math.min(dt, this.maxAccumulatedTime);

        // Run a fixed number of updates to prevent the loop from getting stuck
        let updates = 0;
        while (this.accumulator >= this.fixedDeltaTime && updates < 5) {
            this.update(this.fixedDeltaTime);
            this.accumulator -= this.fixedDeltaTime;
            updates++;
        }
        
        // If the accumulator is still too high, just reset it to avoid "spiral of death"
        if (this.accumulator > this.maxAccumulatedTime) {
            this.accumulator = 0;
        }

        this.draw();

        // Debug info
        const debugInfo = document.getElementById('debug-info');
        if (debugInfo.style.display !== 'none') {
            const fps = (1 / dt).toFixed(1);
            debugInfo.textContent = `FPS: ${fps} | Blocks: ${this.blocks.length} | Particles: ${this.lavaParticles.length} | Rods: ${this.blazeRods.length} | Balls: ${this.bouncyBalls.length} | Sparkles: ${this.impactSparkles.length}`;
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    syncPickaxeWithState() {
        let variantIndex = this.state.currentPickaxeVariant;
        if (variantIndex >= 0 && variantIndex < this.pickaxe.variants.length) {
            const variantName = this.pickaxe.variants[variantIndex].name;
            if (this.state.pickaxePrices[variantName] && this.state.pickaxePrices[variantName].unlocked) {
                this.pickaxe.currentVariant = variantIndex;
            } else {
                this.pickaxe.currentVariant = 0; // Default to wooden if not unlocked
                this.state.currentPickaxeVariant = 0;
                this.state.saveCurrentPickaxeVariant();
            }
        } else {
             this.pickaxe.currentVariant = 0; // Default to wooden if not unlocked
             this.state.currentPickaxeVariant = 0;
             this.state.saveCurrentPickaxeVariant();
        }
        this.pickaxe.updateProperties();
    }

    showStats() {
        this.updateStatsDisplay();
        this.statsPopup.style.display = 'flex';
    }

    hideStats() {
        this.statsPopup.style.display = 'none';
    }

    showCollect() {
        this.updateCollectDisplay();
        this.collectPopup.style.display = 'flex';
    }

    hideCollect() {
        this.collectPopup.style.display = 'none';
    }

    updateStatsDisplay() {
        const stats = this.state.stats;
        const grid = document.getElementById('stats-grid');
        grid.innerHTML = '';

        const formatTime = (seconds) => {
            const h = Math.floor(seconds / 3600);
            const m = Math.floor((seconds % 3600) / 60);
            const s = Math.floor(seconds % 60);
            return [
                h > 0 ? `${h}h` : '',
                m > 0 ? `${m}m` : '',
                `${s}s`
            ].filter(Boolean).join(' ');
        };

        const statsToShow = [
            { label: 'Tổng Số Khối Đã Phá', value: stats.totalBlocksBroken || 0 },
            { label: 'Độ Sâu Lớn Nhất', value: `${stats.deepestDepth || 0} khối` },
            { label: 'Tổng Thời Gian Chơi', value: formatTime(stats.playTime || 0) },
            { label: 'Tổng Tiền Kiếm Được', value: `${stats.moneyEarned || 0} xu` },
            { label: 'Số Cúp Bị Hỏng', value: stats.pickaxesBroken || 0 }
        ];

        statsToShow.forEach(stat => {
            const statItem = document.createElement('div');
            statItem.className = 'stat-item';
            statItem.innerHTML = `<span class="stat-label">${stat.label}</span><span class="stat-value">${stat.value}</span>`;
            grid.appendChild(statItem);
        });
    }

    updateCollectDisplay() {
        const grid = document.getElementById('collect-grid');
        grid.innerHTML = '';

        const brokenStats = this.state.stats.blocksBrokenByType || {};
        const blockTypes = Object.keys(BLOCK_DEFINITIONS);

        blockTypes.forEach(blockType => {
            const count = brokenStats[blockType] || 0;
            const isDiscovered = count > 0;
            const definition = BLOCK_DEFINITIONS[blockType];

            const itemDiv = document.createElement('div');
            itemDiv.className = 'collect-item';

            // Create icon
            const iconImg = document.createElement('img');
            iconImg.className = 'collect-item-icon';
            let asset = null;

            if (blockType === 'dirt') {
                // Use IMG_0104.jpeg for dirt blocks in collection
                asset = this.assetLoader.getAsset('dirtImage');
            } else {
                const textureKey = definition.textureKey;
                if (textureKey) {
                    asset = this.assetLoader.getAsset(textureKey.replace('Image', ''));
                }
            }

            if (asset && asset.complete) {
                iconImg.src = asset.src;
            } else {
                // Fallback for missing images
                const fallbackCanvas = document.createElement('canvas');
                fallbackCanvas.width = 16;
                fallbackCanvas.height = 16;
                const fbCtx = fallbackCanvas.getContext('2d');
                fbCtx.fillStyle = definition.fallbackColor || '#808080';
                fbCtx.fillRect(0,0,16,16);
                iconImg.src = fallbackCanvas.toDataURL();
            }

            if (!isDiscovered) {
                iconImg.classList.add('locked');
            }
            itemDiv.appendChild(iconImg);

            // Create name label
            const nameSpan = document.createElement('span');
            nameSpan.className = 'collect-item-name';
            const displayName = blockType === 'dirt' ? 'Đất' : blockType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
            nameSpan.textContent = isDiscovered ? displayName : '???';
            itemDiv.appendChild(nameSpan);

            // Create count label (only if discovered)
            if (isDiscovered) {
                const countSpan = document.createElement('span');
                countSpan.className = 'collect-item-count';
                countSpan.textContent = this.ui.formatNumber(count);
                itemDiv.appendChild(countSpan);
            }

            grid.appendChild(itemDiv);
        });
    }

    showSettings() {
        this.updateBigMoneyDisplay();
        this.settingsPopup.style.display = 'flex';
    }

    hideSettings() {
        this.settingsPopup.style.display = 'none';
        this.state.saveSettings();
    }

    applySettings() {
        this.musicVolumeSlider.value = this.state.settings.musicVolume;
        this.updateMusicVolume(this.state.settings.musicVolume);

        this.sfxVolumeSlider.value = this.state.settings.sfxVolume;
        this.updateSfxVolume(this.state.settings.sfxVolume);

        this.languageSelect.value = 'vi';
        this.state.settings.language = 'vi';
    }
    
    updateMusicVolume(value) {
        this.state.settings.musicVolume = value;
        if (this.musicPlayer && this.musicPlayer.audioElement) {
            this.musicPlayer.audioElement.volume = value;
        }
    }

    updateSfxVolume(value) {
        this.state.settings.sfxVolume = value;
        this.sfxGainNode.gain.value = value;
    }

    // New methods for exchange and display update
    exchangeMoney(count) {
        const costPerUnit = 1;
        const maxUnits = Math.floor(this.state.money / costPerUnit);
        let units = count === Infinity ? maxUnits : count;
        if (units <= 0) return;
        if (units > maxUnits) units = maxUnits;

        this.state.money -= units * costPerUnit;
        this.state.bigMoney = (this.state.bigMoney || 0) + units * 10;
        this.state.saveAllState();
        this.updateBigMoneyDisplay();
    }

    updateBigMoneyDisplay() {
        const el = document.getElementById('big-money-count');
        if (el) el.textContent = this.state.bigMoney.toString();
    }

    // New method: purchase and drop TNT
    purchaseTNT() {
        if (this.state.tntCollected <= 0 || this.state.money < 100) return; // Require 100 money + 1 TNT
        this.state.tntCollected--;
        this.state.money -= 100; // Deduct 100 money
        this.state.saveAllState();
        this.spawnTNT();
        this.notifications.push({
            text: `💣 TNT đã được thả! (${this.state.tntCollected} còn lại)`,
            x: this.canvas.width / 2,
            y: this.canvas.height / 2,
            life: 2.0,
            maxLife: 2.0
        });
    }

    spawnTNT() {
        // Create a TNT block at the pickaxe's current position
        const x = this.pickaxe.x;
        const y = this.pickaxe.y;
        const size = this.world.blockSize;
        const tntBlock = new Block(x, y, size, size, 'tnt');
        this.blocks.push(tntBlock); // Add to the main game blocks array
        this.world._addBlockToGrid(tntBlock);
        // Start TNT fuse
        this.activeTNT.push({
            block: tntBlock,
            timer: 2.0,
            flashTimer: 0.2,
            isFlashing: false
        });
    }
}

// Start the game when the page loads
window.addEventListener('load', () => {
    const game = new Game();
});