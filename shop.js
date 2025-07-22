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

        // Define resource and pickaxe lists for consistent iteration
        this.resourceKeys = ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'sand', 'sandstone'];
        this.smeltableResourceKeys = ['copper', 'iron', 'gold'];
        this.enchantmentTypes = ['efficiency', 'unbreaking', 'fortune'];
        this.pickaxeTypes = ['wooden', 'stone', 'iron', 'golden', 'diamond', 'obsidian', 'netherite'];
        this.eventPickaxeKeys = ['lava', 'blaze', 'fish'];
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
        const margin = 20;
        const cardWidth = Math.min(550, this.game.canvas.width * 0.9); 
        const leftX = margin; 
        const buttonWidth = 70; // Consistent button sizes for most actions
        const buttonHeight = 30;
        const cardPadding = 15; // Define cardPadding here

        // --- Fixed Header Elements (NOT affected by scroll context) ---
        // Exit shop button
        const exitButtonX = this.game.canvas.width - 120;
        const exitButtonY = 20;
        if (clickX >= exitButtonX && clickX <= exitButtonX + 100 &&
            clickY >= exitButtonY && clickY <= exitButtonY + 40) {
            this.hide();
            return;
        }

        // Scroll buttons (fixed position at bottom of canvas)
        const scrollBtnWidth = 60;
        const scrollBtnHeight = 30;
        const scrollBtnY = this.game.canvas.height - 40;
        const scrollUpX = this.game.canvas.width / 2 - scrollBtnWidth - 10;
        const scrollDownX = this.game.canvas.width / 2 + 10;

        if (clickX >= scrollUpX && clickX <= scrollUpX + scrollBtnWidth &&
            clickY >= scrollBtnY && clickY <= scrollBtnY + scrollBtnHeight) {
            this.handleScroll(-200); // Scroll up by 200 pixels
            return;
        }

        if (clickX >= scrollDownX && clickX <= scrollDownX + scrollBtnWidth &&
            clickY >= scrollBtnY && clickY <= scrollBtnY + scrollBtnHeight) {
            this.handleScroll(200); // Scroll down by 200 pixels
            return;
        }

        // Handle summer event clicks (which has its own logic and fixed positions)
        if (this.state.summerEventActive) {
            this.handleSummerEventClick(clickX, clickY);
            return;
        }

        // --- All content below the fixed header is scrollable ---
        // Adjust clickY to be relative to the translated canvas context
        let clickedYInScrollableContext = clickY;
        if (clickY > 100) { // Check if click is below the fixed header (height 100px)
            clickedYInScrollableContext += this.shopScrollY;
        }
        
        // Replicate the 'currentY' progression from ShopUI.draw to match positions
        let currentShopContentY = 120; // This is the starting Y in the translated context


        // --- Exchange Section Buttons ---
        const exchangeSectionWidth = 300; // From ShopUI.drawExchangeSection
        const exchangeSectionXOffsetForDrawing = leftX + cardWidth / 2 - 150; // The 'x' param passed to drawExchangeSection
        const exchangeButtonYOffsetInCard = 110; // buttonY in drawExchangeSection is y + 110
        
        // Exchange 1 button
        const exchange1BtnX = exchangeSectionXOffsetForDrawing + (exchangeSectionWidth / 2) - buttonWidth - 10;
        const exchange1BtnY = currentShopContentY + exchangeButtonYOffsetInCard;
        if (clickX >= exchange1BtnX && clickX <= exchange1BtnX + buttonWidth &&
            clickedYInScrollableContext >= exchange1BtnY && clickedYInScrollableContext <= exchange1BtnY + buttonHeight) {
            this.game.exchangeMoney(1);
            return;
        }

        // Exchange All button
        const exchangeAllBtnX = exchangeSectionXOffsetForDrawing + (exchangeSectionWidth / 2) + 10;
        const exchangeAllBtnY = currentShopContentY + exchangeButtonYOffsetInCard;
        if (clickX >= exchangeAllBtnX && clickX <= exchangeAllBtnX + buttonWidth &&
            clickedYInScrollableContext >= exchangeAllBtnY && clickedYInScrollableContext <= exchangeAllBtnY + buttonHeight) {
            this.game.exchangeMoney(Infinity);
            return;
        }

        currentShopContentY += 200; // Move past exchange section height


        // --- Resource selling buttons ---
        let resourceCardStartY = currentShopContentY + 70; // Offset for section title
        this.resourceKeys.forEach((resource, index) => {
            const cardY = resourceCardStartY + index * 105; // Each card is 105px tall
            
            // Sell 1 button
            const sell1X = leftX + cardWidth - cardPadding - (isNarrow ? buttonWidth : 150);
            const sell1Y = isNarrow ? cardY + 15 : cardY + 25; // Button Y relative to card top
            if (clickX >= sell1X && clickX <= sell1X + buttonWidth &&
                clickedYInScrollableContext >= sell1Y && clickedYInScrollableContext <= sell1Y + buttonHeight) {
                this.sellResource(resource, 1);
                return; 
            }
            
            // Sell All button
            const sellAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const sellAllY = isNarrow ? cardY + 55 : cardY + 25; // Button Y relative to card top
            if (clickX >= sellAllX && clickX <= sellAllX + buttonWidth &&
                clickedYInScrollableContext >= sellAllY && clickedYInScrollableContext <= sellAllY + buttonHeight) {
                this.sellResource(resource, this.state.resources[resource]);
                return;
            }
        });
        currentShopContentY = resourceCardStartY + this.resourceKeys.length * 105;
        currentShopContentY += 100; // Spacing after section


        // --- Smelting buttons ---
        let smeltingCardStartY = currentShopContentY + 120; // Offset for section title and info box
        this.smeltableResourceKeys.forEach((resource, index) => {
            const cardY = smeltingCardStartY + index * 105;
            
            // Smelt 1 button
            const smelt1X = leftX + cardWidth - cardPadding - (isNarrow ? buttonWidth : 150);
            const smelt1Y = isNarrow ? cardY + 15 : cardY + 25;
            if (clickX >= smelt1X && clickX <= smelt1X + buttonWidth &&
                clickedYInScrollableContext >= smelt1Y && clickedYInScrollableContext <= smelt1Y + buttonHeight) {
                this.smeltResource(resource, 1);
                return;
            }
            
            // Smelt All button
            const smeltAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const smeltAllY = isNarrow ? cardY + 55 : cardY + 25;
            if (clickX >= smeltAllX && clickX <= smeltAllX + buttonWidth &&
                clickedYInScrollableContext >= smeltAllY && clickedYInScrollableContext <= smeltAllY + buttonHeight) {
                const coalPerItem = this.state.smeltingCost.coal || 1;
                const maxSmeltFromCoal = this.state.resources.coal > 0 ? Math.floor(this.state.resources.coal / coalPerItem) : 0;
                const maxSmelt = Math.min(this.state.resources[resource], maxSmeltFromCoal);
                this.smeltResource(resource, maxSmelt);
                return;
            }
        });
        currentShopContentY = smeltingCardStartY + this.smeltableResourceKeys.length * 105;
        currentShopContentY += 100; // Spacing after section
        

        // --- Smelted resource selling buttons ---
        let ingotCardStartY = currentShopContentY + 70; // Offset for section title
        this.smeltableResourceKeys.forEach((resource, index) => {
            const cardY = ingotCardStartY + index * 105;
            
            // Sell 1 smelted button
            const sell1X = leftX + cardWidth - cardPadding - (isNarrow ? buttonWidth : 150);
            const sell1Y = isNarrow ? cardY + 15 : cardY + 25;
            if (clickX >= sell1X && clickX <= sell1X + buttonWidth &&
                clickedYInScrollableContext >= sell1Y && clickedYInScrollableContext <= sell1Y + buttonHeight) {
                this.sellSmeltedResource(resource, 1);
                return;
            }
            
            // Sell All smelted button
            const sellAllX = leftX + cardWidth - cardPadding - buttonWidth;
            const sellAllY = isNarrow ? cardY + 55 : cardY + 25;
            if (clickX >= sellAllX && clickX <= sellAllX + buttonWidth &&
                clickedYInScrollableContext >= sellAllY && clickedYInScrollableContext <= sellAllY + buttonHeight) {
                this.sellSmeltedResource(resource, this.state.smeltedResources[resource]);
                return;
            }
        });
        currentShopContentY = ingotCardStartY + this.smeltableResourceKeys.length * 105;
        currentShopContentY += 100; // Spacing after section


        // --- Enchantment upgrade buttons ---
        let enchantmentCardStartY = currentShopContentY + 70; // Offset for section title
        this.enchantmentTypes.forEach((type, index) => {
            const cardY = enchantmentCardStartY + index * 120; // Each card is 120px tall
            const buttonY = cardY + 30; // Button is at y + 30 relative to card

            const currentLevel = this.state.enchantmentLevels[type];
            const maxLevel = this.state.maxEnchantmentLevels[type];
            
            if (currentLevel < maxLevel) {
                const upgradeButtonWidth = 75; // specific for enchantment button
                const upgradeButtonHeight = 30;
                const buttonX = leftX + cardWidth - cardPadding - upgradeButtonWidth - 5; 
                if (clickX >= buttonX && clickX <= buttonX + upgradeButtonWidth &&
                    clickedYInScrollableContext >= buttonY && clickedYInScrollableContext <= buttonY + upgradeButtonHeight) {
                    this.buyEnchantment(type);
                    return;
                }
            }
        });
        currentShopContentY = enchantmentCardStartY + this.enchantmentTypes.length * 120;
        currentShopContentY += 100; // Spacing after section


        // --- Pickaxe purchase/equip buttons ---
        let pickaxeCardStartY = currentShopContentY + 70; // Offset for section title
        this.pickaxeTypes.forEach((type, index) => {
            const cardY = pickaxeCardStartY + index * 120;
            const buttonY = cardY + 30; 
            
            const pickaxeData = this.state.pickaxePrices[type];
            const buttonX = leftX + cardWidth - cardPadding - buttonWidth - 5;
            
            if (!pickaxeData.unlocked) {
                // Buy button
                if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                    clickedYInScrollableContext >= buttonY && clickedYInScrollableContext <= buttonY + buttonHeight) {
                    this.buyPickaxe(type);
                    return;
                }
            } else {
                // Equip button
                if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                    clickedYInScrollableContext >= buttonY && clickedYInScrollableContext <= buttonY + buttonHeight) {
                    this.equipPickaxe(type, index);
                    return;
                }
            }
        });
        currentShopContentY = pickaxeCardStartY + this.pickaxeTypes.length * 120;


        // --- Event Pickaxe Section ---
        const unlockedEventPickaxes = this.eventPickaxeKeys.filter(key => this.state.pickaxePrices[key].unlocked);

        if (unlockedEventPickaxes.length > 0) {
            currentShopContentY += 100; // Spacing for event pickaxe section
            let eventPickaxeCardStartY = currentShopContentY + 70; // Offset for section title
            const eventPickaxeMap = { lava: 7, blaze: 8, fish: 9 };

            unlockedEventPickaxes.forEach((type) => {
                const index = eventPickaxeMap[type];
                const cardY = eventPickaxeCardStartY; // Each event pickaxe is drawn below the previous one
                const buttonY = cardY + 30;
                const buttonX = leftX + cardWidth - cardPadding - buttonWidth - 5;

                // Equip button for event pickaxe
                if (clickX >= buttonX && clickX <= buttonX + buttonWidth &&
                    clickedYInScrollableContext >= buttonY && clickedYInScrollableContext <= buttonY + buttonHeight) {
                    this.equipPickaxe(type, index);
                    return;
                }
                eventPickaxeCardStartY += 120; // Move down for next card
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
        const cardPadding = 15; // Also define it here for summer event click handling
        const buttonWidth = 75;
        const buttonHeight = 30;
        let currentY = 120; // This is the starting Y for summer content in screen coordinates

        // Lava Pickaxe button
        const lavaCardY = currentY;
        const lavaButtonY = lavaCardY + 40; // Button drawn at y + 40
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
            return;
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
            return;
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
            return;
        }
        currentY += 130;

        // Sand selling buttons
        const sandCardY = currentY;
        const sandButtonY = sandCardY + 30; // Button drawn at y + 30
        
        // Sand sell 1 button
        const sandSell1X = leftX + cardWidth - cardPadding - 150;
        if (clickX >= sandSell1X && clickX <= sandSell1X + buttonWidth &&
            clickY >= sandButtonY && clickY <= sandButtonY + buttonHeight) {
            this.sellResource('sand', 1);
            return;
        }
        
        // Sand sell all button
        const sandSellAllX = leftX + cardWidth - cardPadding - 75;
        if (clickX >= sandSellAllX && clickX <= sandSellAllX + buttonWidth &&
            clickY >= sandButtonY && clickY <= sandButtonY + buttonHeight) {
            this.sellResource('sand', this.state.resources.sand);
            return;
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
            return;
        }
        
        // Sandstone sell all button
        const sandstoneSellAllX = leftX + cardWidth - cardPadding - 75;
        if (clickX >= sandstoneSellAllX && clickX <= sandstoneSellAllX + buttonWidth &&
            clickY >= sandstoneButtonY && clickY <= sandstoneButtonY + buttonHeight) {
            this.sellResource('sandstone', this.state.resources.sandstone);
            return;
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
        const scrollSpeed = 1; // Default sensitivity
        const scrollAmount = deltaY * scrollSpeed;
        this.shopScrollY += scrollAmount;
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