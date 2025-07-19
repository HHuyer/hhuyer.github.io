import { ShopUI } from './shop-ui.js';

export class Shop {
    constructor(game) {
        this.game = game;
        this.state = game.state;
        this.ui = new ShopUI(this, game.assetLoader);
        this.showShop = false;
        this.shopScrollY = 0;
        this.maxShopScrollY = 0;
        this.isScrolling = false;
    }

    show() {
        this.showShop = true;
        this.shopScrollY = 0;
        this.ui.backgroundCache = null; // Invalidate cache to redraw
        this.ui.summerBackgroundCache = null;
    }

    hide() {
        this.showShop = false;
        this.shopScrollY = 0;
    }

    handleClick(clickX, clickY) {
        const isNarrow = this.game.canvas.width < 450;

        // Check if summer event is active - handle different clicks
        if (this.state.summerEventActive) {
            this.handleSummerEventClick(clickX, clickY);
            return;
        }

        const margin = 20;
        const cardWidth = Math.min(550, this.game.canvas.width * 0.9); 
        const leftX = margin; 
        
        // Exit shop button (fixed position, not affected by scroll)
        const exitButtonX = this.game.canvas.width - 120;
        const exitButtonY = 20;
        if (clickX >= exitButtonX && clickX <= exitButtonX + 100 &&
            clickY >= exitButtonY && clickY <= exitButtonY + 40) {
            this.hide();
            return;
        }

        // Reset progress button (fixed position, not affected by scroll)
        const resetButtonX = 20;
        const resetButtonY = 20;
        if (clickX >= resetButtonX && clickX <= resetButtonX + 100 &&
            clickY >= resetButtonY && clickY <= resetButtonY + 40) {
            if (window.confirm("Are you sure you want to reset all your progress? This cannot be undone.")) {
                this.game.resetProgress();
            }
            return;
        }

        // Exchange Xu to New Money buttons (fixed UI above scroll area)
        // These clicks are now handled by the shop-ui's drawExchangeSection logic for accurate button positions
        // This old logic can be removed as they are now part of the scrollable content or specifically handled in UI
        /*
        const exchangeX = 20;
        const exchangeY = 70;
        const btnWidth = 70;
        const btnHeight = 30;
        if (clickX >= exchangeX && clickX <= exchangeX + btnWidth &&
            clickY >= exchangeY && clickY <= exchangeY + btnHeight) {
            this.game.exchangeMoney(1);
            return;
        }
        if (clickX >= exchangeX + btnWidth + 10 && clickX <= exchangeX + 2 * btnWidth + 10 &&
            clickY >= exchangeY && clickY <= exchangeY + btnHeight) {
            this.game.exchangeMoney(Infinity);
            return;
        }
        */

        let scrolledClickY = clickY;
        // Only adjust clickY for scrollable content (below header)
        // The fixed-position exchange section is now drawn on the right, still needs to be checked.
        const exchangeSectionX = this.game.canvas.width - 320; // Matches UI for shop-ui.js
        const exchangeSectionY = 100;
        const exchangeSectionWidth = 300;
        const exchangeSectionHeight = 180;
        const buttonWidth = 70;
        const buttonHeight = 30;
        const buttonYOffset = 110; // Corresponds to y + 110 in drawExchangeSection
        
        // Check "Đổi 1" button in exchange section
        const exchange1BtnX = exchangeSectionX + exchangeSectionWidth / 2 - buttonWidth - 10;
        const exchange1BtnY = exchangeSectionY + buttonYOffset;
        if (clickX >= exchange1BtnX && clickX <= exchange1BtnX + buttonWidth &&
            clickY >= exchange1BtnY && clickY <= exchange1BtnY + buttonHeight) {
            this.game.exchangeMoney(1);
            return;
        }

        // Check "Đổi Tất" button in exchange section
        const exchangeAllBtnX = exchangeSectionX + exchangeSectionWidth / 2 + 10;
        const exchangeAllBtnY = exchangeSectionY + buttonYOffset;
        if (clickX >= exchangeAllBtnX && clickX <= exchangeAllBtnX + buttonWidth &&
            clickY >= exchangeAllBtnY && clickY <= exchangeAllBtnY + buttonHeight) {
            this.game.exchangeMoney(Infinity);
            return;
        }

        // Now handle scrolling for the *main* shop content, which starts lower
        if (clickY > 100) { // Main content starts below header (100px fixed header height)
            scrolledClickY += this.shopScrollY;
        }

        // --- SECTION VARIABLES ---
        const cardPadding = 15;
        // const buttonWidth = 70; // Already defined above for consistency
        // const buttonHeight = 30; // Already defined above for consistency
        let currentY = 120; // This is the Y for the first *scrollable* section

        // --- Resource selling buttons ---
        let resourceSectionY = currentY + 70;
        const resources = ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'sand', 'sandstone'];
        resources.forEach((resource, index) => {
            const cardY = resourceSectionY + index * 105;
            
            // Sell 1 button
            const sell1X = leftX + cardWidth - cardPadding - (isNarrow ? buttonWidth : 150);
            const sell1Y = isNarrow ? cardY + 15 : cardY + 25;
            if (clickX >= sell1X && clickX <= sell1X + buttonWidth &&
                scrolledClickY >= sell1Y && scrolledClickY <= sell1Y + buttonHeight) {
                this.sellResource(resource, 1);
            }
            
            // Sell All button
            const sellAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const sellAllY = isNarrow ? cardY + 55 : cardY + 25;
            if (clickX >= sellAllX && clickX <= sellAllX + buttonWidth &&
                scrolledClickY >= sellAllY && scrolledClickY <= sellAllY + buttonHeight) {
                this.sellResource(resource, this.state.resources[resource]);
            }
        });
        currentY = resourceSectionY + resources.length * 105;
        currentY += 100;

        // --- Smelting buttons ---
        const smeltingSectionStart = currentY;
        const smeltableResources = ['copper', 'iron', 'gold'];
        let smeltingSectionContentY = smeltingSectionStart + 120;
        smeltableResources.forEach((resource, index) => {
            const cardY = smeltingSectionContentY + index * 105;
            
            // Smelt 1 button
            const smelt1X = leftX + cardWidth - cardPadding - (isNarrow ? buttonWidth : 150);
            const smelt1Y = isNarrow ? cardY + 15 : cardY + 25;
            if (clickX >= smelt1X && clickX <= smelt1X + buttonWidth &&
                scrolledClickY >= smelt1Y && scrolledClickY <= smelt1Y + buttonHeight) {
                this.smeltResource(resource, 1);
            }
            
            // Smelt All button
            const smeltAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const smeltAllY = isNarrow ? cardY + 55 : cardY + 25;
            if (clickX >= smeltAllX && clickX <= smeltAllX + buttonWidth &&
                scrolledClickY >= smeltAllY && scrolledClickY <= smeltAllY + buttonHeight) {
                const coalPerItem = this.state.smeltingCost.coal || 1;
                const maxSmeltFromCoal = this.state.resources.coal > 0 ? Math.floor(this.state.resources.coal / coalPerItem) : 0;
                const maxSmelt = Math.min(this.state.resources[resource], maxSmeltFromCoal);
                this.smeltResource(resource, maxSmelt);
            }
        });
        currentY = smeltingSectionContentY + smeltableResources.length * 105;
        currentY += 100;

        // --- Smelted resource selling buttons ---
        const ingotSectionStart = currentY;
        let ingotSectionContentY = ingotSectionStart + 70;
        smeltableResources.forEach((resource, index) => {
            const cardY = ingotSectionContentY + index * 105;
            
            // Sell 1 smelted button
            const sell1X = leftX + cardWidth - cardPadding - (isNarrow ? buttonWidth : 150);
            const sell1Y = isNarrow ? cardY + 15 : cardY + 25;
            if (clickX >= sell1X && clickX <= sell1X + buttonWidth &&
                scrolledClickY >= sell1Y && scrolledClickY <= sell1Y + buttonHeight) {
                this.sellSmeltedResource(resource, 1);
            }
            
            // Sell All smelted button
            const sellAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const sellAllY = isNarrow ? cardY + 55 : cardY + 25;
            if (clickX >= sellAllX && clickX <= sellAllX + buttonWidth &&
                scrolledClickY >= sellAllY && scrolledClickY <= sellAllY + buttonHeight) {
                this.sellSmeltedResource(resource, this.state.smeltedResources[resource]);
            }
        });
        currentY = ingotSectionContentY + smeltableResources.length * 105;
        currentY += 100;

        // --- Enchantment upgrade buttons ---
        const enchantmentSectionStart = currentY;
        const enchantmentTypes = ['efficiency', 'unbreaking', 'fortune'];
        let enchantmentSectionContentY = enchantmentSectionStart + 70;
        enchantmentTypes.forEach((type, index) => {
            const cardY = enchantmentSectionContentY + index * 120;
            const buttonY = cardY + 30;

            const currentLevel = this.state.enchantmentLevels[type];
            const maxLevel = this.state.maxEnchantmentLevels[type];
            
            if (currentLevel < maxLevel) {
                const buttonX = leftX + cardWidth - cardPadding - 80;
                if (clickX >= buttonX && clickX <= buttonX + 75 &&
                    scrolledClickY >= buttonY && scrolledClickY <= buttonY + 30) {
                    this.buyEnchantment(type);
                }
            }
        });
        currentY = enchantmentSectionContentY + enchantmentTypes.length * 120;
        currentY += 100;

        // --- Pickaxe purchase/equip buttons ---
        const pickaxeSectionStart = currentY;
        const pickaxeTypes = ['wooden', 'stone', 'iron', 'golden', 'diamond', 'obsidian', 'netherite'];
        let pickaxeSectionContentY = pickaxeSectionStart + 70;
        pickaxeTypes.forEach((type, index) => {
            const cardY = pickaxeSectionContentY + index * 120;
            const buttonY = cardY + 30;
            
            const pickaxeData = this.state.pickaxePrices[type];
            const buttonX = leftX + cardWidth - cardPadding - buttonWidth - 5;
            
            if (!pickaxeData.unlocked) {
                // Buy button
                if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                    scrolledClickY >= buttonY && scrolledClickY <= buttonY + buttonHeight) {
                    this.buyPickaxe(type);
                }
            } else {
                // Equip button
                if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                    scrolledClickY >= buttonY && scrolledClickY <= buttonY + buttonHeight) {
                    this.equipPickaxe(type, index);
                }
            }
        });
        currentY = pickaxeSectionContentY + pickaxeTypes.length * 120;

        // Check for unlocked event pickaxes to handle their clicks
        const eventPickaxes = ['lava', 'blaze', 'fish'];
        const unlockedEventPickaxes = eventPickaxes.filter(key => this.state.pickaxePrices[key].unlocked);

        if (unlockedEventPickaxes.length > 0) {
            currentY += 100; // Spacing for event pickaxe section
            let eventPickaxeSectionContentY = currentY + 70;
            const eventPickaxeMap = { lava: 7, blaze: 8, fish: 9 };

            unlockedEventPickaxes.forEach((type) => {
                const index = eventPickaxeMap[type];
                const cardY = eventPickaxeSectionContentY;
                const buttonY = cardY + 30;
                const buttonX = leftX + cardWidth - cardPadding - buttonWidth - 5;

                // Equip button for event pickaxe
                if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                    scrolledClickY >= buttonY && scrolledClickY <= buttonY + buttonHeight) {
                    this.equipPickaxe(type, index);
                }
                eventPickaxeSectionContentY += 120;
            });
        }
    }

    handleSummerEventClick(clickX, clickY) {
        // Close button
        const exitButtonX = this.game.canvas.width - 120;
        const exitButtonY = 20;
        if (clickX >= exitButtonX && clickX <= exitButtonX + 100 &&
            clickY >= exitButtonY && clickY <= exitButtonY + 40) {
            this.hide();
            return;
        }

        const margin = 20;
        const cardWidth = Math.min(550, this.game.canvas.width * 0.9);
        const leftX = margin;

        // --- Summer Event Layout Variables ---
        const cardPadding = 15;
        const buttonWidth = 75;
        const buttonHeight = 30;
        let currentY = 120;

        // Lava Pickaxe button
        const lavaCardY = currentY;
        const lavaButtonY = lavaCardY + 40;
        const lavaButtonX = leftX + cardWidth - cardPadding - buttonWidth - 5;
        const lavaData = this.state.pickaxePrices.lava;
        
        if (clickX >= lavaButtonX && clickX <= lavaButtonX + buttonWidth &&
            clickY >= lavaButtonY && clickY <= lavaButtonY + buttonHeight) {
            if (lavaData.unlocked) {
                if (this.game.pickaxe.currentVariant !== 7) this.equipPickaxe('lava', 7);
            } else if (this.state.money >= lavaData.price) {
                this.state.money -= lavaData.price;
                lavaData.unlocked = true;
                this.equipPickaxe('lava', 7);
                this.state.savePickaxeUnlocks();
                this.state.saveAllState();
            }
        }
        currentY += 130;

        // Blaze Pickaxe button
        const blazeCardY = currentY;
        const blazeButtonY = blazeCardY + 40;
        const blazeButtonX = leftX + cardWidth - cardPadding - buttonWidth - 5;
        const blazeData = this.state.pickaxePrices.blaze;
        
        if (clickX >= blazeButtonX && clickX <= blazeButtonX + buttonWidth &&
            clickY >= blazeButtonY && clickY <= blazeButtonY + buttonHeight) {
            if (blazeData.unlocked) {
                if (this.game.pickaxe.currentVariant !== 8) this.equipPickaxe('blaze', 8);
            } else if (this.state.money >= blazeData.price) {
                this.state.money -= blazeData.price;
                blazeData.unlocked = true;
                this.equipPickaxe('blaze', 8);
                this.state.savePickaxeUnlocks();
                this.state.saveAllState();
            }
        }
        currentY += 130;

        // Fish Pickaxe button
        const fishCardY = currentY;
        const fishButtonY = fishCardY + 40;
        const fishButtonX = leftX + cardWidth - cardPadding - buttonWidth - 5;
        const fishData = this.state.pickaxePrices.fish;

        if (clickX >= fishButtonX && clickX <= fishButtonX + buttonWidth &&
            clickY >= fishButtonY && clickY <= fishButtonY + buttonHeight) {
            if (fishData.unlocked) {
                if (this.game.pickaxe.currentVariant !== 9) this.equipPickaxe('fish', 9);
            } else if (this.state.money >= fishData.price) {
                this.state.money -= fishData.price;
                fishData.unlocked = true;
                this.equipPickaxe('fish', 9);
                this.state.savePickaxeUnlocks();
                this.state.saveAllState();
            }
        }
        currentY += 130;

        // Sand selling buttons
        const sandCardY = currentY;
        const sandButtonY = sandCardY + 30; // Centered Y for button in the card
        
        // Sand sell 1 button
        const sandSell1X = leftX + cardWidth - cardPadding - 150;
        if (clickX >= sandSell1X && clickX <= sandSell1X + buttonWidth &&
            clickY >= sandButtonY && clickY <= sandButtonY + buttonHeight) {
            this.sellResource('sand', 1);
        }
        
        // Sand sell all button
        const sandSellAllX = leftX + cardWidth - cardPadding - 75;
        if (clickX >= sandSellAllX && clickX <= sandSellAllX + buttonWidth &&
            clickY >= sandButtonY && clickY <= sandButtonY + buttonHeight) {
            this.sellResource('sand', this.state.resources.sand);
        }
        currentY += 105;

        // Sandstone selling buttons
        const sandstoneCardY = currentY;
        const sandstoneButtonY = sandstoneCardY + 30;
        
        // Sandstone sell 1 button
        const sandstoneSell1X = leftX + cardWidth - cardPadding - 150;
        if (clickX >= sandstoneSell1X && clickX <= sandstoneSell1X + buttonWidth &&
            clickY >= sandstoneButtonY && clickY <= sandstoneButtonY + buttonHeight) {
            this.sellResource('sandstone', 1);
        }
        
        // Sandstone sell all button
        const sandstoneSellAllX = leftX + cardWidth - cardPadding - 75;
        if (clickX >= sandstoneSellAllX && clickX <= sandstoneSellAllX + buttonWidth &&
            clickY >= sandstoneButtonY && clickY <= sandstoneButtonY + buttonHeight) {
            this.sellResource('sandstone', this.state.resources.sandstone);
        }
    }

    sellResource(resource, amount) {
        if (amount <= 0 || !this.state.resources[resource] || this.state.resources[resource] < amount) return;
        
        const earnings = amount * this.state.sellPrices[resource];
        this.state.resources[resource] -= amount;
        this.state.money += earnings;
        this.state.stats.moneyEarned = (this.state.stats.moneyEarned || 0) + earnings;
        this.state.saveAllState(); // Save all state after selling
    }

    smeltResource(resource, amount) {
        const coalPerItem = this.state.smeltingCost.coal || 1;
        const totalCoalCost = amount * coalPerItem;

        if (amount <= 0 || this.state.resources[resource] < amount || this.state.resources.coal < totalCoalCost) return;
        
        this.state.resources[resource] -= amount;
        this.state.smeltedResources[resource] += amount;
        this.state.resources.coal -= totalCoalCost;
        this.state.saveAllState(); // Save all state after smelting
    }

    sellSmeltedResource(resource, amount) {
        if (amount <= 0 || this.state.smeltedResources[resource] < amount) return;
        
        const earnings = amount * this.state.smeltedSellPrices[resource];
        this.state.smeltedResources[resource] -= amount;
        this.state.money += earnings;
        this.state.stats.moneyEarned = (this.state.stats.moneyEarned || 0) + earnings;
        this.state.saveAllState(); // Save all state after selling smelted resources
    }

    buyEnchantment(type) {
        const currentLevel = this.state.enchantmentLevels[type];
        const maxLevel = this.state.maxEnchantmentLevels[type];
        
        if (currentLevel >= maxLevel) return;

        const cost = this.state.getEnchantmentCost(type, currentLevel);
        if (this.state.money >= cost.money && this.state.resources.lapis >= cost.lapis) {
            this.state.money -= cost.money;
            this.state.resources.lapis -= cost.lapis;
            this.state.enchantmentLevels[type]++;
            this.state.saveAllState(); // Save all state after buying enchantment
            this.game.createEnchantmentSparkles(); // Visual feedback
        }
    }

    buyPickaxe(type) {
        const pickaxeData = this.state.pickaxePrices[type];
        if (pickaxeData.unlocked) return;
        
        // Check if player has enough money and required items
        let canAfford = this.state.money >= pickaxeData.price;
        for (const [itemType, amount] of Object.entries(pickaxeData.requirements || {})) {
            let userAmount;
            if (this.state.nonSmeltableResources.includes(itemType)) {
                userAmount = this.state.resources[itemType];
            } else { // Assumes it's an ingot
                const rawType = itemType.replace('_ingot', '');
                userAmount = this.state.smeltedResources[rawType];
            }
            if (!userAmount || userAmount < amount) canAfford = false;
        }
        
        if (canAfford) {
            this.state.money -= pickaxeData.price;
            
            // Consume required items
            for (const [itemType, amount] of Object.entries(pickaxeData.requirements || {})) {
                if (this.state.nonSmeltableResources.includes(itemType)) {
                    this.state.resources[itemType] -= amount;
                } else {
                    const rawType = itemType.replace('_ingot', '');
                    this.state.smeltedResources[rawType] -= amount;
                }
            }
            
            pickaxeData.unlocked = true;
            this.state.saveAllState(); // Save all state after buying pickaxe
        }
    }

    equipPickaxe(type, index) {
        if (this.state.pickaxePrices[type].unlocked && this.game.pickaxe.currentVariant !== index) {
            this.game.pickaxe.currentVariant = index;
            this.game.pickaxe.updateProperties();
            this.state.currentPickaxeVariant = index;
            this.state.saveAllState(); // Save all state after equipping pickaxe
        }
    }

    handleScroll(deltaY) {
        if (!this.showShop) return;
        const scrollSpeed = 1;
        this.shopScrollY += deltaY * scrollSpeed;
        this.shopScrollY = Math.max(0, Math.min(this.maxShopScrollY, this.shopScrollY));
    }

    handleTouchScroll(deltaY) {
        if (!this.showShop) return;
        const scrollSpeed = 1.5;
        this.shopScrollY += deltaY * scrollSpeed;
        this.shopScrollY = Math.max(0, Math.min(this.maxShopScrollY, this.shopScrollY));
    }

    draw(ctx, canvas) {
        if (!this.showShop) return;
        this.ui.draw(ctx, canvas);
    }
}