export class ShopUI {
    constructor(shop, assetLoader) {
        this.shop = shop;
        this.assetLoader = assetLoader;
        this.backgroundCache = null;
        this.summerBackgroundCache = null;
    }

    draw(ctx, canvas) {
        // Use a cached background to prevent re-drawing it every frame
        const activeCache = this.shop.state.summerEventActive ? this.summerBackgroundCache : this.backgroundCache;
        const cacheCreationMethod = this.shop.state.summerEventActive ? 'createSandBlockWallBackground' : 'createBlockWallBackground';
        const cacheProperty = this.shop.state.summerEventActive ? 'summerBackgroundCache' : 'backgroundCache';

        if (!activeCache) {
            this[cacheCreationMethod](canvas);
            ctx.drawImage(this[cacheProperty], 0, 0);
        } else {
            ctx.drawImage(activeCache, 0, 0);
        }

        // Check if summer event is active - show different interface
        if (this.shop.state.summerEventActive) {
            this.drawSummerEventShop(ctx, canvas);
            // Draw scroll buttons only for the regular shop for now.
            // If summer event shop also becomes scrollable, this needs to be adjusted.
            this.drawScrollButtons(ctx, canvas);
            return;
        }

        // --- DYNAMICALLY CALCULATE CONTENT HEIGHT ---
        let totalContentHeight = 120; // starting Y
        // Add exchange section height first
        totalContentHeight += 200; // Exchange section height
        totalContentHeight += 100; // Spacing after exchange

        const resources = ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'sand', 'sandstone'];
        totalContentHeight += 70 + (resources.length * 105);
        totalContentHeight += 100; // Spacing

        totalContentHeight += 120 + (['copper', 'iron', 'gold'].length * 105); // Smelting section
        totalContentHeight += 100; // Increased spacing between sections

        totalContentHeight += 70 + (['copper', 'iron', 'gold'].length * 105); // Ingot section
        totalContentHeight += 100; // Increased spacing between sections

        totalContentHeight += 70 + (['efficiency', 'unbreaking', 'fortune'].length * 120); // Enchantment section
        totalContentHeight += 100; // Increased spacing between sections

        totalContentHeight += 70 + (['wooden', 'stone', 'iron', 'golden', 'diamond', 'obsidian', 'netherite'].length * 120); // Pickaxe section
        
        const eventPickaxes = ['lava', 'blaze', 'fish'];
        const unlockedEventPickaxes = eventPickaxes.filter(key => this.shop.state.pickaxePrices[key].unlocked);

        if (unlockedEventPickaxes.length > 0) {
            totalContentHeight += 100; // Spacing for event pickaxe section
            totalContentHeight += 70 + (unlockedEventPickaxes.length * 120); // Event pickaxe section
        }

        totalContentHeight += 50; // Padding at the bottom
        totalContentHeight += 80; // Add space for scroll buttons at the bottom

        // Calculate max scroll based on dynamic content height and viewable area
        const scrollableAreaHeight = canvas.height - 100; // Account for fixed header
        this.shop.maxShopScrollY = Math.max(0, totalContentHeight - scrollableAreaHeight);

        // Draw fixed header
        this.drawHeader(ctx, canvas);
        
        // Save context for scrolling content
        ctx.save();
        
        // Create clipping region for scrollable content
        ctx.beginPath();
        ctx.rect(0, 100, canvas.width, canvas.height - 100);
        ctx.clip();

        // Apply scroll offset
        ctx.translate(0, -this.shop.shopScrollY);

        // Calculate card layout - move to left side
        const margin = 20;
        const cardWidth = Math.min(550, canvas.width * 0.9); 
        const leftX = margin; 
        
        let currentY = 120;

        // Check for narrow screen (mobile portrait)
        const isNarrow = canvas.width < 450;

        // Draw exchange section first
        this.drawExchangeSection(ctx, canvas, leftX + cardWidth/2 - 150, currentY);
        currentY += 200; // Exchange section height + spacing

        // Draw sections
        currentY = this.drawResourceSection(ctx, canvas, leftX, cardWidth, currentY, isNarrow);
        currentY += 100; // Increased spacing between sections
        
        currentY = this.drawSmeltingSection(ctx, canvas, leftX, cardWidth, currentY, isNarrow);
        currentY += 100; // Increased spacing between sections
        
        currentY = this.drawIngotSection(ctx, canvas, leftX, cardWidth, currentY, isNarrow);
        currentY += 100; // Increased spacing between sections
        
        currentY = this.drawEnchantmentSection(ctx, canvas, leftX, cardWidth, currentY);
        currentY += 100; // Increased spacing between sections
        
        currentY = this.drawPickaxeSection(ctx, canvas, leftX, cardWidth, currentY);

        if (unlockedEventPickaxes.length > 0) {
            currentY += 100;
            this.drawEventPickaxeSection(ctx, canvas, leftX, cardWidth, currentY, unlockedEventPickaxes);
        }

        ctx.restore();

        // Draw scroll indicator
        this.drawScrollIndicator(ctx, canvas);
        // Draw scroll buttons
        this.drawScrollButtons(ctx, canvas);
    }

    drawSummerEventShop(ctx, canvas) {
        // Draw sand block wall background for summer event from cache
        if (!this.summerBackgroundCache) {
            this.createSandBlockWallBackground(canvas);
        }
        ctx.drawImage(this.summerBackgroundCache, 0, 0);

        // Draw summer event header
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'CỬA HÀNG SỰ KIỆN MÙA HÈ', canvas.width / 2, 42, 'rgba(0,0,0,0.7)', '#FFFFFF', 2, 2);

        const moneyWidth = 180;
        const moneyHeight = 36;
        const moneyX = canvas.width / 2 - moneyWidth / 2;
        const moneyY = 52;
        
        ctx.fillStyle = '#FFF700'; 
        ctx.font = 'bold 18px system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';

        const moneyIcon = this.assetLoader.getAsset('moneyIcon');
        const moneyText = `${this.shop.state.money}`;
        ctx.textAlign = 'center';

        const textWidth = ctx.measureText(moneyText).width;
        const iconSize = 24;
        const padding = 5;
        const totalContentWidth = (moneyIcon && moneyIcon.complete ? iconSize + padding : 0) + textWidth;
        const startX = moneyX + moneyWidth / 2 - totalContentWidth / 2;

        let textDrawX = startX;
        if (moneyIcon && moneyIcon.complete) {
            ctx.drawImage(moneyIcon, startX, moneyY + 12, iconSize, iconSize);
            textDrawX = startX + iconSize + padding;
        } else {
             this.drawTextWithShadow(ctx, '💰', startX, moneyY + 24, '#3a1e00', '#FFF700', 1, 1);
             textDrawX = startX + 24 + padding;
        }
        
        ctx.textAlign = 'left';
        this.drawTextWithShadow(ctx, moneyText, textDrawX, moneyY + 24, '#3a1e00', '#FFF700', 1, 1);

        // Close button
        this.drawMinecraftButton(ctx, canvas.width - 120, 20, 100, 40, 'ĐÓNG', '#1976D2');

        // Draw summer pickaxe cards
        const margin = 20;
        const cardWidth = Math.min(550, canvas.width * 0.9);
        const leftX = margin;
        let currentY = 120;

        // Lava Pickaxe
        this.drawSummerPickaxeCard(ctx, leftX, cardWidth, currentY, {
            name: 'Cúp Dung Nham',
            key: 'lava',
            icon: this.assetLoader.getAsset('lavaPickaxe'),
            power: 6,
            durability: 200,
            price: 500,
            index: 7
        });

        currentY += 130;

        // Blaze Pickaxe
        this.drawSummerPickaxeCard(ctx, leftX, cardWidth, currentY, {
            name: 'Cúp Quỷ Lửa', 
            key: 'blaze',
            icon: this.assetLoader.getAsset('blazePickaxe'),
            power: 4,
            durability: 300,
            price: 750,
            index: 8
        });

        currentY += 130;

        // Fish Pickaxe
        this.drawSummerPickaxeCard(ctx, leftX, cardWidth, currentY, {
            name: 'Cúp Cá',
            key: 'fish',
            icon: this.assetLoader.getAsset('fishPickaxe'),
            power: 3,
            durability: 150,
            price: 600,
            index: 9
        });

        currentY += 130;

        // Sand resource card
        this.drawSummerResourceCard(ctx, leftX, cardWidth, currentY, {
            name: 'Cát',
            key: 'sand',
            icon: this.assetLoader.getAsset('sand'),
            amount: this.shop.state.resources.sand,
            price: this.shop.state.sellPrices.sand
        });

        currentY += 105;

        // Sandstone resource card
        this.drawSummerResourceCard(ctx, leftX, cardWidth, currentY, {
            name: 'Đá Cát',
            key: 'sandstone',
            icon: this.assetLoader.getAsset('sandstone'),
            amount: this.shop.state.resources.sandstone,
            price: this.shop.state.sellPrices.sandstone
        });

        ctx.textAlign = 'left';
    }

    drawSummerResourceCard(ctx, leftX, cardWidth, y, resource) {
        const cardPadding = 15;
        
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)';
        ctx.fillRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 90);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = 2;
        ctx.strokeRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 90);

        const iconX = leftX + cardPadding + 15;
        const iconY = y + 20;
        const iconSize = 50;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);

        if (resource.icon && resource.icon.complete) {
            ctx.drawImage(resource.icon, iconX + 8, iconY + 8, iconSize - 16, iconSize - 16);
        }

        const textX = iconX + iconSize + 15;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        this.drawTextWithShadow(ctx, resource.name, textX, y + 35, 'rgba(0,0,0,0.8)', '#FFFFFF', 2, 2);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        this.drawTextWithShadow(ctx, `Sở hữu: ${resource.amount}`, textX, y + 55, 'rgba(0,0,0,0.6)', '#FFFFFF', 1, 1);

        const totalValue = resource.amount * resource.price;
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        if (resource.amount > 0) {
            this.drawTextWithShadow(ctx, `${resource.price} xu mỗi (Tổng: ${totalValue})`, textX, y + 75, 'rgba(0,0,0,0.6)', '#FFFFFF', 1, 1);
        } else {
            this.drawTextWithShadow(ctx, `${resource.price} xu mỗi`, textX, y + 75, 'rgba(0,0,0,0.6)', '#FFFFFF', 1, 1);
        }

        const buttonHeight = 30;
        const buttonWidth = 75;
        const hasItems = resource.amount > 0;
        
        this.drawEnhancedMinecraftButton(ctx, leftX + cardWidth - cardPadding - 150, y + 30, buttonWidth, buttonHeight, 'BÁN 1', hasItems ? '#388E3C' : '#616161', hasItems);
        this.drawEnhancedMinecraftButton(ctx, leftX + cardWidth - cardPadding - 75, y + 30, buttonWidth, buttonHeight, 'BÁN TẤT CẢ', hasItems ? '#2E7D32' : '#616161', hasItems);
    }

    drawSandBlockWallBackground(ctx, canvas) {
        const blockSize = 40;
        const blocksX = Math.ceil(canvas.width / blockSize) + 1;
        const blocksY = Math.ceil(canvas.height / blockSize) + 1;
        
        const offsetX = 0;
        const offsetY = 0;
        
        const blockTypes = [
            { asset: 'sand', probability: 0.7 },
            { asset: 'sandstone', probability: 0.3 }
        ];
        
        for (let x = 0; x < blocksX; x++) {
            for (let y = 0; y < blocksY; y++) {
                const drawX = x * blockSize - offsetX;
                const drawY = y * blockSize - offsetY;
                
                const seed = x * 1000 + y;
                const random = (Math.sin(seed) + 1) / 2;
                
                let selectedBlockType = 'sand';
                if (random > 0.7) {
                    selectedBlockType = 'sandstone';
                }
                
                const blockImage = this.assetLoader.getAsset(selectedBlockType);
                if (blockImage && blockImage.complete) {
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(blockImage, drawX, drawY, blockSize, blockSize);
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.globalAlpha = 0.5;
                    if (selectedBlockType === 'sand') {
                        ctx.fillStyle = '#F4E4BC';
                    } else {
                        ctx.fillStyle = '#F2D2A7';
                    }
                    ctx.fillRect(drawX, drawY, blockSize, blockSize);
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }

    createSandBlockWallBackground(canvas) {
        this.summerBackgroundCache = document.createElement('canvas');
        this.summerBackgroundCache.width = canvas.width;
        this.summerBackgroundCache.height = canvas.height;
        const ctx = this.summerBackgroundCache.getContext('2d');
        this.drawSandBlockWallBackground(ctx, canvas);
    }

    drawBlockWallBackground(ctx, canvas) {
        const blockSize = 40;
        const blocksX = Math.ceil(canvas.width / blockSize) + 1;
        const blocksY = Math.ceil(canvas.height / blockSize) + 1;
        
        const offsetX = 0;
        const offsetY = 0;
        
        const blockTypes = [
            { asset: 'stone', probability: 0.5 },
            { asset: 'andesite', probability: 0.15 },
            { asset: 'diorite', probability: 0.15 },
            { asset: 'granite', probability: 0.1 },
            { asset: 'deepslate', probability: 0.1 }
        ];
        
        for (let x = 0; x < blocksX; x++) {
            for (let y = 0; y < blocksY; y++) {
                const drawX = x * blockSize - offsetX;
                const drawY = y * blockSize - offsetY;
                
                const seed = x * 1000 + y;
                const random = (Math.sin(seed) + 1) / 2;
                
                let cumulativeProb = 0;
                let selectedBlockType = 'stone';
                
                for (const blockType of blockTypes) {
                    cumulativeProb += blockType.probability;
                    if (random < cumulativeProb) {
                        selectedBlockType = blockType.asset;
                        break;
                    }
                }
                
                const blockImage = this.assetLoader.getAsset(selectedBlockType);
                if (blockImage && blockImage.complete) {
                    ctx.globalAlpha = 0.5;
                    ctx.drawImage(blockImage, drawX, drawY, blockSize, blockSize);
                    ctx.globalAlpha = 1.0;
                } else {
                    ctx.globalAlpha = 0.5;
                    switch (selectedBlockType) {
                        case 'stone':
                            ctx.fillStyle = '#8B8B8B';
                            break;
                        case 'andesite':
                            ctx.fillStyle = '#A0A0A0';
                            break;
                        case 'diorite':
                            ctx.fillStyle = '#C0C0C0';
                            break;
                        case 'granite':
                            ctx.fillStyle = '#C8997A';
                            break;
                        case 'deepslate':
                            ctx.fillStyle = '#2C2C2C';
                            break;
                    }
                    ctx.fillRect(drawX, drawY, blockSize, blockSize);
                    ctx.globalAlpha = 1.0;
                }
            }
        }
    }

    createBlockWallBackground(canvas) {
        this.backgroundCache = document.createElement('canvas');
        this.backgroundCache.width = canvas.width;
        this.backgroundCache.height = canvas.height;
        const ctx = this.backgroundCache.getContext('2d');
        this.drawBlockWallBackground(ctx, canvas);
    }

    drawMinecraftBackground(ctx, canvas) {
        this.drawBlockWallBackground(ctx, canvas);
    }

    drawHeader(ctx, canvas) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 32px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'CỬA HÀNG', canvas.width / 2, 42, 'rgba(0,0,0,0.7)', '#FFFFFF', 2, 2);

        const moneyWidth = 180;
        const moneyHeight = 36;
        const moneyX = canvas.width / 2 - moneyWidth / 2;
        const moneyY = 52;
        
        ctx.fillStyle = '#FFF700'; 
        ctx.font = 'bold 18px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';

        const moneyIcon = this.assetLoader.getAsset('moneyIcon');
        const moneyText = `${this.shop.state.money}`;
        ctx.textAlign = 'center';

        const textWidth = ctx.measureText(moneyText).width;
        const iconSize = 24;
        const padding = 5;
        const totalContentWidth = (moneyIcon && moneyIcon.complete ? iconSize + padding : 0) + textWidth;
        const startX = moneyX + moneyWidth / 2 - totalContentWidth / 2;

        let textDrawX = startX;
        if (moneyIcon && moneyIcon.complete) {
            ctx.drawImage(moneyIcon, startX, moneyY + 12, iconSize, iconSize);
            textDrawX = startX + iconSize + padding;
        } else {
             this.drawTextWithShadow(ctx, '💰', startX, moneyY + 24, '#3a1e00', '#FFF700', 1, 1);
             textDrawX = startX + 24 + padding;
        }
        
        ctx.textAlign = 'left';
        this.drawTextWithShadow(ctx, moneyText, textDrawX, moneyY + 24, '#3a1e00', '#FFF700', 1, 1);

        this.drawMinecraftButton(ctx, canvas.width - 120, 20, 100, 40, 'ĐÓNG', '#1976D2'); 

        ctx.textAlign = 'left';
    }

    drawShopContent(ctx, canvas) {
        // --- CUỐI CÙNG: PHẦN ĐỔI TIỀN MỚI ---
        const exchangeSectionY = currentY + 40;
        this.drawExchangeSection(ctx, canvas, exchangeSectionY);
    }

    drawExchangeSection(ctx, canvas, x, y) {
        const sectionWidth = 300; // Increased width for better spacing
        const sectionHeight = 180; // Increased height
        const cardPadding = 15; // Consistent with other cards

        // Card background (consistent with other cards)
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.filter = 'blur(5px)';
        ctx.fillRect(x + cardPadding, y, sectionWidth - (cardPadding * 2), sectionHeight);
        ctx.filter = 'none';
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + cardPadding, y, sectionWidth - (cardPadding * 2), sectionHeight);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + cardPadding + 1, y + 1, sectionWidth - (cardPadding * 2) - 2, sectionHeight - 2);

        // Title
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 20px "Minecraft Seven", monospace';
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'ĐỔI XU', x + sectionWidth / 2, y + 35, 'rgba(0,0,0,0.5)', '#000000', 1, 1);
        
        // Current Big Money (Xu) display
        const bigMoneyIcon = this.assetLoader.getAsset('moneyIcon'); // Assuming 'moneyIcon' is the pixel art stack of money
        const bigMoneyText = `${this.shop.state.bigMoney}`;
        const bigMoneyFontSize = '16px';
        ctx.font = `bold ${bigMoneyFontSize} "Minecraft Seven", monospace`;

        ctx.textAlign = 'center';
        const textWidth = ctx.measureText(bigMoneyText).width;
        const iconSize = 24; // Consistent size for money icon
        const padding = 5;
        const totalContentWidth = (bigMoneyIcon && bigMoneyIcon.complete ? iconSize + padding : 0) + textWidth;
        const startX = x + sectionWidth / 2 - totalContentWidth / 2;

        let textDrawX = startX;
        if (bigMoneyIcon && bigMoneyIcon.complete) {
            ctx.drawImage(bigMoneyIcon, startX, y + 50, iconSize, iconSize);
            textDrawX = startX + iconSize + padding;
        } else {
             // Fallback if icon not loaded
             this.drawTextWithShadow(ctx, '💰', startX, y + 68, 'rgba(0,0,0,0.7)', '#FFD700', 1, 1);
             textDrawX = startX + 24 + padding; // Approx icon size
        }
        this.drawTextWithShadow(ctx, bigMoneyText, textDrawX, y + 68, 'rgba(0,0,0,0.7)', '#FFD700', 1, 1);
        ctx.textAlign = 'left';

        // Exchange buttons
        const buttonWidth = 70;
        const buttonHeight = 30;
        const buttonY = y + 110; // Adjusted Y position for more space

        const canExchange1 = this.shop.state.money >= 1;
        const canExchangeAll = this.shop.state.money >= 1;

        // Exchange 1 button
        this.drawEnhancedMinecraftButton(
            ctx, 
            x + sectionWidth / 2 - buttonWidth - 10, // Centered left
            buttonY, 
            buttonWidth, 
            buttonHeight, 
            'Đổi 1', 
            canExchange1 ? '#1976D2' : '#616161', 
            canExchange1
        );

        // Exchange all button
        this.drawEnhancedMinecraftButton(
            ctx, 
            x + sectionWidth / 2 + 10, // Centered right
            buttonY, 
            buttonWidth, 
            buttonHeight, 
            'Đổi Tất', 
            canExchangeAll ? '#1976D2' : '#616161', 
            canExchangeAll
        );

        // Exchange rate info at the bottom
        ctx.fillStyle = '#3a3a3a';
        ctx.font = '14px "Minecraft Seven", monospace';
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, '1 tiền = 10 xu', x + sectionWidth / 2, y + sectionHeight - 15, 'rgba(0,0,0,0.7)', '#3a3a3a', 1, 1);
        ctx.textAlign = 'left'; // Reset alignment
    }

    drawResourceSection(ctx, canvas, leftX, cardWidth, startY, isNarrow) {
        const totalResources = Object.values(this.shop.state.resources).reduce((sum, count) => sum + count, 0);
        this.drawSectionTitle(ctx, leftX, cardWidth, startY, `TÀI NGUYÊN THÔ (${totalResources} vật phẩm)`, '#3498db');
        
        const resources = [
            { name: 'Than', key: 'coal', icon: this.assetLoader.getAsset('coalIcon'), color: '#2c3e50', rarity: 'common' },
            { name: 'Đồng', key: 'copper', icon: this.assetLoader.getAsset('copperIcon'), color: '#d35400', rarity: 'common' },
            { name: 'Sắt', key: 'iron', icon: this.assetLoader.getAsset('ironIcon'), color: '#95a5a6', rarity: 'uncommon' },
            { name: 'Vàng', key: 'gold', icon: this.assetLoader.getAsset('goldIcon'), color: '#f39c12', rarity: 'rare' },
            { name: 'Đá Đỏ', key: 'redstone', icon: this.assetLoader.getAsset('redstoneIcon'), color: '#e74c3c', rarity: 'uncommon' },
            { name: 'Kim Cương', key: 'diamond', icon: this.assetLoader.getAsset('diamondIcon'), color: '#3498db', rarity: 'epic' },
            { name: 'Lưu Ly', key: 'lapis', icon: this.assetLoader.getAsset('lapisIcon'), color: '#2980b9', rarity: 'uncommon' },
            { name: 'Ngọc Lục Bảo', key: 'emerald', icon: this.assetLoader.getAsset('emeraldIcon'), color: '#2ecc71', rarity: 'epic' },
            { name: 'Đá', key: 'stone', icon: this.assetLoader.getAsset('stone'), color: '#7f8c8d', rarity: 'common' },
            { name: 'Cát', key: 'sand', icon: this.assetLoader.getAsset('sand'), color: '#f4e4bc', rarity: 'common' },
            { name: 'Đá Cát', key: 'sandstone', icon: this.assetLoader.getAsset('sandstone'), color: '#f2d2a7', rarity: 'common' }
        ];

        let currentY = startY + 70;
        
        resources.forEach((resource, index) => {
            this.drawResourceCard(ctx, leftX, cardWidth, currentY, resource, this.shop.state.resources[resource.key], this.shop.state.sellPrices[resource.key], 'sell', false, isNarrow);
            currentY += 105; 
        });

        return currentY;
    }

    drawSmeltingSection(ctx, canvas, leftX, cardWidth, startY, isNarrow) {
        const totalRawSmeltable = this.shop.state.resources.copper + this.shop.state.resources.iron + this.shop.state.resources.gold;
        this.drawSectionTitle(ctx, leftX, cardWidth, startY, `LÒ NUNG (${totalRawSmeltable} quặng thô)`, '#e67e22');
        
        const infoBoxY = startY + 55;
        ctx.fillStyle = 'rgba(44, 62, 80, 0.7)';
        ctx.fillRect(leftX + 10, infoBoxY, cardWidth - 20, 50);

        ctx.fillStyle = '#ecf0f1';
        ctx.font = 'bold 14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`Chi phí nung: ${this.shop.state.smeltingCost.coal} Than mỗi vật phẩm`, leftX + cardWidth / 2, infoBoxY + 20);

        ctx.font = '12px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.fillStyle = '#bdc3c7';
        ctx.fillText(`(Chỉ có thể nung Đồng, Sắt và Vàng)`, leftX + cardWidth / 2, infoBoxY + 40);

        const smeltableResources = [
            { name: 'Đồng', key: 'copper', icon: this.assetLoader.getAsset('copperIcon'), color: '#d35400', rarity: 'common' },
            { name: 'Sắt', key: 'iron', icon: this.assetLoader.getAsset('ironIcon'), color: '#95a5a6', rarity: 'uncommon' },
            { name: 'Vàng', key: 'gold', icon: this.assetLoader.getAsset('goldIcon'), color: '#f39c12', rarity: 'rare' }
        ];

        let currentY = startY + 120;
        
        smeltableResources.forEach((resource, index) => {
            this.drawSmeltingCard(ctx, leftX, cardWidth, currentY, resource, isNarrow);
            currentY += 105; 
        });

        return currentY;
    }

    drawIngotSection(ctx, canvas, leftX, cardWidth, startY, isNarrow) {
        const totalIngots = Object.values(this.shop.state.smeltedResources).reduce((sum, count) => sum + count, 0);
        this.drawSectionTitle(ctx, leftX, cardWidth, startY, `THỎI KIM LOẠI (${totalIngots} vật phẩm)`, '#95a5a6');

        const ingotResources = [
            { name: 'Đồng', key: 'copper', icon: this.assetLoader.getAsset('copperIngotIcon'), color: '#d35400', rarity: 'common' },
            { name: 'Sắt', key: 'iron', icon: this.assetLoader.getAsset('ironIngotIcon'), color: '#95a5a6', rarity: 'uncommon' },
            { name: 'Vàng', key: 'gold', icon: this.assetLoader.getAsset('goldIngotIcon'), color: '#f39c12', rarity: 'rare' }
        ];

        let currentY = startY + 70;
        
        ingotResources.forEach((resource, index) => {
            this.drawResourceCard(ctx, leftX, cardWidth, currentY, resource, this.shop.state.smeltedResources[resource.key], this.shop.state.smeltedSellPrices[resource.key], 'sell', true, isNarrow);
            currentY += 105; 
        });

        return currentY;
    }

    drawEnchantmentSection(ctx, canvas, leftX, cardWidth, startY) {
        this.drawSectionTitle(ctx, leftX, cardWidth, startY, `PHÙ PHÉP`, '#d13bff');

        const enchantments = [
            { 
                name: 'Hiệu Suất', 
                key: 'efficiency', 
                description: 'Tăng tốc độ đào.', 
                icon: this.assetLoader.getAsset('enchantedBook'), 
                rarity: 'uncommon' 
            },
            { 
                name: 'Bền', 
                key: 'unbreaking', 
                description: 'Cơ hội không mất độ bền.', 
                icon: this.assetLoader.getAsset('enchantedBook'), 
                rarity: 'rare' 
            },
            { 
                name: 'Gia Tài', 
                key: 'fortune', 
                description: 'Tăng số lượng quặng rơi ra.', 
                icon: this.assetLoader.getAsset('enchantedBook'), 
                rarity: 'epic' 
            }
        ];

        let currentY = startY + 70;
        
        enchantments.forEach((enchantment) => {
            this.drawEnchantmentCard(ctx, leftX, cardWidth, currentY, enchantment);
            currentY += 120;
        });

        return currentY;
    }

    drawPickaxeSection(ctx, canvas, leftX, cardWidth, startY) {
        const unlockedCount = Object.values(this.shop.state.pickaxePrices).filter(p => p.unlocked && !p.requiresSummerEvent).length;
        const totalPickaxes = Object.keys(this.shop.state.pickaxePrices).filter(k => !this.shop.state.pickaxePrices[k].requiresSummerEvent).length;
        this.drawSectionTitle(ctx, leftX, cardWidth, startY, `KHO CÚP (${unlockedCount}/${totalPickaxes} đã mở khóa)`, '#9b59b6');

        const pickaxes = [
            { name: 'Cúp Gỗ', key: 'wooden', icon: this.assetLoader.getAsset('woodenPickaxe'), power: 1, durability: 35, color: '#8b4513', rarity: 'common' },
            { name: 'Cúp Đá', key: 'stone', icon: this.assetLoader.getAsset('stonePickaxe'), power: 1, durability: 70, color: '#7f8c8d', rarity: 'common' },
            { name: 'Cúp Sắt', key: 'iron', icon: this.assetLoader.getAsset('ironPickaxe'), power: 2, durability: 100, color: '#95a5a6', rarity: 'uncommon' },
            { name: 'Cúp Vàng', key: 'golden', icon: this.assetLoader.getAsset('goldenPickaxe'), power: 5, durability: 50, color: '#f39c12', rarity: 'rare' },
            { name: 'Cúp Kim Cương', key: 'diamond', icon: this.assetLoader.getAsset('diamondPickaxe'), power: 3, durability: 200, color: '#3498db', rarity: 'epic' },
            { name: 'Cúp Hắc曜石', key: 'obsidian', icon: this.assetLoader.getAsset('obsidianPickaxe'), power: 3.5, durability: 250, color: '#4b0082', rarity: 'epic' },
            { name: 'Cúp Netherite', key: 'netherite', icon: this.assetLoader.getAsset('netheritePickaxe'), power: 4, durability: 350, color: '#2c3e50', rarity: 'legendary' }
        ];

        let currentY = startY + 70;
        
        pickaxes.forEach((pickaxe, index) => {
            this.drawPickaxeCard(ctx, leftX, cardWidth, currentY, pickaxe, index);
            currentY += 120; 
        });

        return currentY;
    }

    drawEventPickaxeSection(ctx, canvas, leftX, cardWidth, startY, unlockedEventPickaxes) {
        this.drawSectionTitle(ctx, leftX, cardWidth, startY, `CÚP SỰ KIỆN (${unlockedEventPickaxes.length} đã mở khóa)`, '#ff6b35');

        const eventPickaxes = [
            { name: 'Cúp Dung Nham', key: 'lava', icon: this.assetLoader.getAsset('lavaPickaxe'), power: 6, durability: 200, color: '#FF4500', rarity: 'legendary', index: 7 },
            { name: 'Cúp Quỷ Lửa', key: 'blaze', icon: this.assetLoader.getAsset('blazePickaxe'), power: 4, durability: 300, color: '#FFD700', rarity: 'legendary', index: 8 },
            { name: 'Cúp Cá', key: 'fish', icon: this.assetLoader.getAsset('fishPickaxe'), power: 3, durability: 150, color: '#00BFFF', rarity: 'epic', index: 9 }
        ];

        let currentY = startY + 70;
        
        eventPickaxes.forEach((pickaxe) => {
            if (unlockedEventPickaxes.includes(pickaxe.key)) {
                this.drawPickaxeCard(ctx, leftX, cardWidth, currentY, pickaxe, pickaxe.index);
                currentY += 120;
            }
        });

        return currentY;
    }

    drawSectionTitle(ctx, leftX, cardWidth, y, title, color) {
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 20px "Minecraft Seven", monospace'; 
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, title, leftX + cardWidth / 2, y + 32, 'rgba(0,0,0,0.8)', '#FFFFFF', 3, 3);
        ctx.textAlign = 'left';

        ctx.fillStyle = color;
        ctx.fillRect(leftX + cardWidth * 0.25, y + 42, cardWidth * 0.5, 3);
    }

    drawResourceCard(ctx, leftX, cardWidth, y, resource, amount, price, actionType, isIngot = false, isNarrow = false) {
        const cardPadding = 15; 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; 
        ctx.filter = 'blur(5px)';
        ctx.fillRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 90); 
        ctx.filter = 'none';
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 90);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX + cardPadding + 1, y + 1, cardWidth - (cardPadding * 2) - 2, 88);

        const iconX = leftX + cardPadding + 15;
        const iconY = y + 10; 
        const iconSize = 60; 
        ctx.fillStyle = 'rgba(34, 34, 34, 0.9)';
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        ctx.strokeStyle = '#C6C6C6';
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);

        if (resource.rarity) {
            const rarityColors = {
                'common': '#9E9E9E',
                'uncommon': '#4CAF50',
                'rare': '#2196F3',
                'epic': '#9C27B0',
                'legendary': '#FF9800'
            };
            ctx.strokeStyle = rarityColors[resource.rarity] || '#9E9E9E';
            ctx.lineWidth = 3;
            ctx.strokeRect(iconX - 1, iconY - 1, iconSize + 2, iconSize + 2);
        }
    
        if (resource.icon && resource.icon.complete) {
            ctx.drawImage(resource.icon, iconX + 8, iconY + 8, iconSize - 16, iconSize - 16); 
        }

        const textX = iconX + iconSize + 15; 
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        let displayName = resource.name + (isIngot ? ' Thỏi' : '');
        this.drawTextWithShadow(ctx, displayName, textX, y + 28, 'rgba(0,0,0,0.5)', '#000000', 1, 1);
        
        ctx.fillStyle = '#222222';
        ctx.font = '14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        this.drawTextWithShadow(ctx, `Sở hữu: ${amount}`, textX, y + 48, 'rgba(0,0,0,0.6)', '#222222', 1, 1);
        
        const totalValue = amount * price;
        ctx.fillStyle = '#3a3a3a';
        ctx.font = 'bold 14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        if (amount > 0) {
            this.drawTextWithShadow(ctx, `${price} xu mỗi (Tổng: ${totalValue})`, textX, y + 68, 'rgba(0,0,0,0.5)', '#3a3a3a', 1, 1);
        } else {
            this.drawTextWithShadow(ctx, `${price} xu mỗi`, textX, y + 68, 'rgba(0,0,0,0.5)', '#3a3a3a', 1, 1);
        }

        const hasItems = amount > 0;
        const buttonY = y + 25;
        const buttonHeight = 30;
        const buttonWidth = 70;
        const sell1X = leftX + cardWidth - cardPadding - (isNarrow ? buttonWidth : 150);
        const sell1Y = isNarrow ? y + 15 : buttonY;
        const sellAllX = leftX + cardWidth - cardPadding - buttonWidth;
        const sellAllY = isNarrow ? y + 55 : buttonY;

        this.drawEnhancedMinecraftButton(ctx, sell1X, sell1Y, buttonWidth, buttonHeight, 'BÁN 1', hasItems ? '#388E3C' : '#616161', hasItems);
        this.drawEnhancedMinecraftButton(ctx, sellAllX, sellAllY, buttonWidth, buttonHeight, 'BÁN TẤT CẢ', hasItems ? '#2E7D32' : '#616161', hasItems);
    }

    drawSmeltingCard(ctx, leftX, cardWidth, y, resource, isNarrow = false) {
        const rawAmount = this.shop.state.resources[resource.key];
        const smeltedAmount = this.shop.state.smeltedResources[resource.key];
        const cost = this.shop.state.smeltingCost;
    
        const cardPadding = 15;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; 
        ctx.filter = 'blur(5px)';
        ctx.fillRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 90);
        ctx.filter = 'none';
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 90);
        
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX + cardPadding + 1, y + 1, cardWidth - (cardPadding * 2) - 2, 88);
    
        const iconX = leftX + cardPadding + 15;
        const iconY = y + 10;
        const iconSize = 60;
        ctx.fillStyle = 'rgba(34, 34, 34, 0.9)';
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        ctx.strokeStyle = '#C6C6C6';
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);
        
        ctx.strokeStyle = '#373737';
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX + 1, iconY + 1, iconSize - 2, iconSize - 2);

        if (resource.rarity) {
            const rarityColors = {
                'common': '#9E9E9E',
                'uncommon': '#4CAF50',
                'rare': '#2196F3'
            };
            ctx.strokeStyle = rarityColors[resource.rarity] || '#9E9E9E';
            ctx.lineWidth = 3;
            ctx.strokeRect(iconX - 1, iconY - 1, iconSize + 2, iconSize + 2);
        }
    
        if (resource.icon && resource.icon.complete) {
            ctx.drawImage(resource.icon, iconX + 8, iconY + 8, iconSize - 16, iconSize - 16);
        }
    
        const textX = iconX + iconSize + 15;
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        this.drawTextWithShadow(ctx, `Quặng ${resource.name}`, textX, y + 28, 'rgba(0,0,0,0.5)', '#000000', 1, 1);
        
        ctx.fillStyle = '#222222';
        ctx.font = '14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        this.drawTextWithShadow(ctx, `Thô: ${rawAmount} | Thỏi: ${smeltedAmount}`, textX, y + 48, 'rgba(0,0,0,0.5)', '#222222', 1, 1);
        
        ctx.fillStyle = '#3a3a3a';
        ctx.font = 'bold 14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        this.drawTextWithShadow(ctx, `Chi phí: ${cost.coal} Than/vật phẩm`, textX, y + 68, 'rgba(0,0,0,0.5)', '#3a3a3a', 1, 1);
    
        const canSmeltOne = rawAmount > 0 && this.shop.state.resources.coal >= cost.coal;
        const maxSmeltFromCoal = this.shop.state.resources.coal > 0 ? Math.floor(this.shop.state.resources.coal / cost.coal) : 0;
        const maxSmelt = Math.min(rawAmount, maxSmeltFromCoal);
        const canSmeltAll = maxSmelt > 0;
        
        const buttonY = y + 25;
        const buttonHeight = 30;
        const buttonWidth = 70;
        
        const smelt1X = leftX + cardWidth - cardPadding - (isNarrow ? buttonWidth : 150);
        const smelt1Y = isNarrow ? y + 15 : buttonY;
        const smeltAllX = leftX + cardWidth - cardPadding - buttonWidth;
        const smeltAllY = isNarrow ? y + 55 : buttonY;
        
        this.drawEnhancedMinecraftButton(ctx, smelt1X, smelt1Y, buttonWidth, buttonHeight, 'NUNG 1', '#FFA000', canSmeltOne);
        this.drawEnhancedMinecraftButton(ctx, smeltAllX, smeltAllY, buttonWidth, buttonHeight, 'NUNG TẤT CẢ', '#F57C00', canSmeltAll);
    }

    drawEnchantmentCard(ctx, leftX, cardWidth, y, enchantment) {
        const currentLevel = this.shop.state.enchantmentLevels[enchantment.key];
        const maxLevel = this.shop.state.maxEnchantmentLevels[enchantment.key];
        const isMaxLevel = currentLevel >= maxLevel;
        const cost = isMaxLevel ? { money: 0, lapis: 0 } : this.shop.state.getEnchantmentCost(enchantment.key, currentLevel);
        
        const cardPadding = 15;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; 
        ctx.filter = 'blur(5px)';
        ctx.fillRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 100);
        ctx.filter = 'none';

        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 100);
        
        ctx.strokeStyle = '#373737';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX + cardPadding + 2, y + 2, cardWidth - (cardPadding * 2) - 4, 96);

        const iconX = leftX + cardPadding + 15;
        const iconY = y + 20;
        const iconSize = 60;
        ctx.fillStyle = 'rgba(34, 34, 34, 0.9)';
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        ctx.strokeStyle = '#C6C6C6';
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);

        if (enchantment.icon && enchantment.icon.complete) {
            ctx.drawImage(enchantment.icon, iconX + 8, iconY + 8, iconSize - 16, iconSize - 16);
        }
        ctx.textAlign = 'left';

        const textX = iconX + iconSize + 15;
        
        ctx.fillStyle = '#000000';
        ctx.font = 'bold 18px "Minecraft Seven", monospace'; 
        this.drawTextWithShadow(ctx, enchantment.name, textX, y + 25, 'rgba(0,0,0,0.5)', '#000000', 1, 1);
        
        ctx.fillStyle = '#222222';
        ctx.font = '14px "Minecraft Seven", monospace'; 
        this.drawTextWithShadow(ctx, enchantment.description, textX, y + 45, 'rgba(0,0,0,0.5)', '#222222', 1, 1);

        ctx.fillStyle = '#d13bff';
        ctx.font = 'bold 14px "Minecraft Seven", monospace'; 
        this.drawTextWithShadow(ctx, `Cấp: ${currentLevel} / ${maxLevel}`, textX, y + 65, 'rgba(0,0,0,0.5)', '#d13bff', 1, 1);

        if (!isMaxLevel) {
            const canAfford = this.shop.state.money >= cost.money && this.shop.state.resources.lapis >= cost.lapis;
            const hasEnoughMoney = this.shop.state.money >= cost.money;
            const hasEnoughLapis = this.shop.state.resources.lapis >= cost.lapis;
            
            this.drawCostWithIcons(ctx, textX, y + 85, [
                { type: 'money', amount: cost.money, has: hasEnoughMoney },
                { type: 'lapis', amount: cost.lapis, has: hasEnoughLapis }
            ]);
            
            this.drawEnhancedMinecraftButton(
                ctx, leftX + cardWidth - cardPadding - 80, y + 30, 75, 30, 
                'NÂNG CẤP', canAfford ? '#d13bff' : '#D32F2F', canAfford
            );
        } else {
            ctx.fillStyle = '#4CAF50';
            ctx.font = 'bold 14px "Minecraft Seven", monospace'; 
            ctx.textAlign = 'right';
            this.drawTextWithShadow(ctx, 'CẤP TỐI ĐA', leftX + cardWidth - cardPadding - 20, y + 45, 'rgba(0,0,0,0.5)', '#4CAF50', 1, 1);
            ctx.textAlign = 'left';
        }
    }

    drawPickaxeCard(ctx, leftX, cardWidth, y, pickaxe, index) {
        const pickaxeData = this.shop.state.pickaxePrices[pickaxe.key];
        const isCurrentPickaxe = this.shop.game.pickaxe.currentVariant === index;
        const isUnlocked = pickaxeData.unlocked;

        const cardPadding = 15; 
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)'; 
        ctx.filter = 'blur(5px)';
        ctx.fillRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 100); 
        ctx.filter = 'none';
        
        ctx.strokeStyle = isCurrentPickaxe ? '#4CAF50' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = isCurrentPickaxe ? 2 : 1;
        ctx.strokeRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 100);
        
        ctx.strokeStyle = isCurrentPickaxe ? '#2E7D32' : 'rgba(0, 0, 0, 0.1)';
        ctx.lineWidth = 1;
        ctx.strokeRect(leftX + cardPadding + 2, y + 2, cardWidth - (cardPadding * 2) - 4, 96);

        const iconX = leftX + cardPadding + 15;
        const iconY = y + 20; 
        const iconSize = 60; 
        ctx.fillStyle = 'rgba(34, 34, 34, 0.9)';
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        ctx.strokeStyle = '#C6C6C6';
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);
        
        ctx.strokeStyle = '#373737';
        ctx.lineWidth = 1;
        ctx.strokeRect(iconX + 1, iconY + 1, iconSize - 2, iconSize - 2);

        if (pickaxe.rarity) {
            const rarityColors = {
                'common': '#9E9E9E',
                'uncommon': '#4CAF50',
                'rare': '#2196F3',
                'epic': '#9C27B0',
                'legendary': '#FF9800'
            };
            ctx.strokeStyle = rarityColors[pickaxe.rarity] || '#9E9E9E';
            ctx.lineWidth = 3;
            ctx.strokeRect(iconX - 1, iconY - 1, iconSize + 2, iconSize + 2);
        }

        if (pickaxe.icon && pickaxe.icon.complete) {
            ctx.drawImage(pickaxe.icon, iconX + 8, iconY + 8, iconSize - 16, iconSize - 16); 
        }

        const textX = iconX + iconSize + 15; 
        
        ctx.fillStyle = isUnlocked ? '#000000' : '#555555';
        ctx.font = 'bold 18px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        let displayName = pickaxe.name;
        this.drawTextWithShadow(ctx, displayName, textX, y + 25, 'rgba(0,0,0,0.4)', isUnlocked ? '#000000' : '#555555', 1, 1);
        
        ctx.fillStyle = '#222222';
        ctx.font = '14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        this.drawTextWithShadow(ctx, `Sức mạnh: ${pickaxe.power} | Độ bền: ${pickaxe.durability}`, textX, y + 45, 'rgba(0,0,0,0.4)', '#222222', 1, 1);

        ctx.fillStyle = isUnlocked ? '#4CAF50' : '#555555';
        ctx.font = 'bold 14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        this.drawTextWithShadow(ctx, isUnlocked ? 'Sở hữu: Có' : 'Sở hữu: Không', textX, y + 62, 'rgba(0,0,0,0.4)', isUnlocked ? '#4CAF50' : '#555555', 1, 1);

        ctx.fillStyle = '#3a3a3a';
        ctx.font = '12px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';

        let canAfford = this.shop.state.money >= pickaxeData.price;
        const requirements = [];

        // Money requirement
        requirements.push({ type: 'money', amount: pickaxeData.price, has: this.shop.state.money >= pickaxeData.price });
        
        // Ingot/Resource requirements
        for (const [itemType, amount] of Object.entries(pickaxeData.requirements || {})) {
            let userAmount;
            let hasAmount;
            if (this.shop.state.nonSmeltableResources.includes(itemType)) {
                userAmount = this.shop.state.resources[itemType];
            } else { // All other requirements are ingots from smelted resources
                const rawType = itemType.replace('_ingot', '');
                userAmount = this.shop.state.smeltedResources[rawType];
            }
            hasAmount = userAmount >= amount;
            if (!hasAmount) canAfford = false;
            requirements.push({ type: itemType, amount: amount, has: hasAmount });
        }
        
        this.drawCostWithIcons(ctx, textX, y + 80, requirements);
        
        const buttonHeight = 30;
        const buttonWidth = 75;
        
        if (isUnlocked) {
            const buttonColor = isCurrentPickaxe ? '#4CAF50' : '#1976D2';
            const buttonText = isCurrentPickaxe ? 'ĐÃ TRANG BỊ' : 'TRANG BỊ';
            this.drawEnhancedMinecraftButton(ctx, leftX + cardWidth - cardPadding - buttonWidth - 5, y + 30, buttonWidth, buttonHeight, buttonText, buttonColor, !isCurrentPickaxe);
        } else {
            const buttonColor = canAfford ? '#1976D2' : '#D32F2F';
            const buttonText = 'MUA';
            this.drawEnhancedMinecraftButton(ctx, leftX + cardWidth - cardPadding - buttonWidth - 5, y + 30, buttonWidth, buttonHeight, buttonText, buttonColor, canAfford);
        }
    }

    drawEnhancedMinecraftButton(ctx, x, y, width, height, text, bgColor, enabled = true) {
        if (!enabled) {
            bgColor = '#616161';
        }
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, width, height);
        
        ctx.strokeStyle = enabled ? this.lightenColor(bgColor, 0.4) : '#757575';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, y + height);
        ctx.lineTo(x, y);
        ctx.lineTo(x + width, y);
        ctx.stroke();
        
        ctx.strokeStyle = enabled ? this.darkenColor(bgColor, 0.4) : '#424242';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x + width, y);
        ctx.lineTo(x + width, y + height);
        ctx.lineTo(x, y + height);
        ctx.stroke();
        
        ctx.strokeStyle = enabled ? this.lightenColor(bgColor, 0.2) : '#666666';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + 1, y + height - 1);
        ctx.lineTo(x + 1, y + 1);
        ctx.lineTo(x + width - 1, y + 1);
        ctx.stroke();
        
        ctx.strokeStyle = enabled ? this.darkenColor(bgColor, 0.2) : '#555555';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + width - 1, y + 1);
        ctx.lineTo(x + width - 1, y + height - 1);
        ctx.lineTo(x + 1, y + height - 1);
        ctx.stroke();
        
        ctx.fillStyle = enabled ? '#FFFFFF' : '#AAAAAA';
        ctx.font = 'bold 12px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'center';
        
        ctx.fillStyle = enabled ? 'rgba(0, 0, 0, 0.5)' : 'rgba(0, 0, 0, 0.3)';
        ctx.fillText(text, x + width/2 + 1, y + height/2 + 5);
        
        ctx.fillStyle = enabled ? '#FFFFFF' : '#AAAAAA';
        ctx.fillText(text, x + width/2, y + height/2 + 4);
        ctx.textAlign = 'left';
    }

    drawMinecraftButton(ctx, x, y, width, height, text, bgColor, enabled = true) {
        this.drawEnhancedMinecraftButton(ctx, x, y, width, height, text, bgColor, enabled);
    }

    drawModernButton(ctx, x, y, width, height, text, bgColor, hoverColor, enabled = true) {
        this.drawMinecraftButton(ctx, x, y, width, height, text, bgColor, enabled);
    }

    drawTextWithShadow(ctx, text, x, y, shadowColor, textColor, shadowX = 1, shadowY = 1) {
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, x + shadowX, y + shadowY);
        ctx.fillStyle = textColor;
        ctx.fillText(text, x, y);
    }

    drawButton(ctx, x, y, width, height, text, color, enabled = true) {
        this.drawMinecraftButton(ctx, x, y, width, height, text, color, enabled);
    }

    darkenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.max(0, Math.floor(r * (1 - factor)));
        const newG = Math.max(0, Math.floor(g * (1 - factor)));
        const newB = Math.max(0, Math.floor(b * (1 - factor)));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    lightenColor(hex, factor) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        
        const newR = Math.min(255, Math.floor(r + (255 - r) * factor));
        const newG = Math.min(255, Math.floor(g + (255 - g) * factor));
        const newB = Math.min(255, Math.floor(b + (255 - b) * factor));
        
        return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
    }

    drawSummerPickaxeCard(ctx, leftX, cardWidth, y, pickaxe) {
        const isCurrentPickaxe = this.shop.game.pickaxe.currentVariant === pickaxe.index;
        const pickaxeData = this.shop.state.pickaxePrices[pickaxe.key];
        const isUnlocked = pickaxeData.unlocked;
        const canAfford = this.shop.state.money >= pickaxeData.price;

        const cardPadding = 15;
        ctx.fillStyle = 'rgba(255, 165, 0, 0.8)'; 
        ctx.fillRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 110);
        
        ctx.strokeStyle = isCurrentPickaxe ? '#FF6B35' : 'rgba(255, 255, 255, 0.4)';
        ctx.lineWidth = isCurrentPickaxe ? 3 : 2;
        ctx.strokeRect(leftX + cardPadding, y, cardWidth - (cardPadding * 2), 110);

        const iconX = leftX + cardPadding + 15;
        const iconY = y + 25;
        const iconSize = 60;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(iconX, iconY, iconSize, iconSize);
        
        ctx.strokeStyle = '#FF6B35';
        ctx.lineWidth = 2;
        ctx.strokeRect(iconX, iconY, iconSize, iconSize);

        if (pickaxe.icon && pickaxe.icon.complete) {
            ctx.drawImage(pickaxe.icon, iconX + 8, iconY + 8, iconSize - 16, iconSize - 16);
        }

        const textX = iconX + iconSize + 15;
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 18px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        ctx.textAlign = 'left';
        this.drawTextWithShadow(ctx, pickaxe.name, textX, y + 35, 'rgba(0,0,0,0.8)', '#FFFFFF', 2, 2);
        
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        this.drawTextWithShadow(ctx, `Sức mạnh: ${pickaxe.power} | Độ bền: ${pickaxe.durability}`, textX, y + 55, 'rgba(0,0,0,0.6)', '#FFFFFF', 1, 1);

        ctx.fillStyle = isUnlocked ? '#4CAF50' : '#FFFFFF';
        ctx.font = 'bold 14px "Minecraft Seven", monospace, system-ui, -apple-system, sans-serif';
        const priceText = isUnlocked ? "ĐÃ MỞ KHÓA" : `Giá: ${pickaxeData.price} xu`;
        this.drawTextWithShadow(ctx, priceText, textX, y + 75, 'rgba(0,0,0,0.6)', isUnlocked ? '#4CAF50' : '#FFFFFF', 1, 1);

        const buttonHeight = 30;
        const buttonWidth = 75;
        
        if (isUnlocked) {
            const buttonColor = isCurrentPickaxe ? '#4CAF50' : '#1976D2';
            const buttonText = isCurrentPickaxe ? 'ĐÃ TRANG BỊ' : 'TRANG BỊ';
            this.drawEnhancedMinecraftButton(ctx, leftX + cardWidth - cardPadding - buttonWidth - 5, y + 40, buttonWidth, buttonHeight, buttonText, buttonColor, !isCurrentPickaxe);
        } else {
            const buttonColor = canAfford ? '#FF6B35' : '#D32F2F';
            const buttonText = 'MUA';
            this.drawEnhancedMinecraftButton(ctx, leftX + cardWidth - cardPadding - buttonWidth - 5, y + 40, buttonWidth, buttonHeight, buttonText, buttonColor, canAfford);
        }
    }

    drawCostWithIcons(ctx, startX, y, costs) {
        ctx.font = '12px "Minecraft Seven", monospace';
        let currentX = startX;
        const iconSize = 12;
        const padding = 4;

        costs.forEach((cost, index) => {
            const iconKeyMap = {
                money: 'moneyIcon',
                lapis: 'lapisIcon',
                stone: 'stone',
                obsidian: 'obsidian',
                diamond: 'diamondIcon',
                iron_ingot: 'ironIngotIcon',
                gold_ingot: 'goldIngotIcon',
                copper_ingot: 'copperIngotIcon',
            };
            const iconKey = iconKeyMap[cost.type];
            const icon = this.assetLoader.getAsset(iconKey);

            if (icon && icon.complete) {
                ctx.drawImage(icon, currentX, y - iconSize, iconSize, iconSize);
                currentX += iconSize + padding / 2;
            }

            ctx.fillStyle = cost.has ? '#3a3a3a' : '#D32F2F';
            const text = `${cost.amount}`;
            ctx.fillText(text, currentX, y);
            currentX += ctx.measureText(text).width + padding * 2;
            
            if (index < costs.length - 1) {
                ctx.fillStyle = '#3a3a3a';
                ctx.fillText('+', currentX, y);
                currentX += ctx.measureText('+').width + padding * 2;
            }
        });
    }

    drawScrollIndicator(ctx, canvas) {
        if (this.shop.maxShopScrollY > 0) {
            const scrollBarX = canvas.width - 12;
            const scrollBarY = 100;
            const scrollBarHeight = canvas.height - 100;
            const scrollBarWidth = 8;
            
            ctx.fillStyle = 'rgba(54, 54, 54, 0.8)';
            ctx.fillRect(scrollBarX, scrollBarY, scrollBarWidth, scrollBarHeight);
            
            const thumbHeight = Math.max(20, scrollBarHeight * (scrollBarHeight / (scrollBarHeight + this.shop.maxShopScrollY)));
            const thumbY = scrollBarY + (this.shop.shopScrollY / this.shop.maxShopScrollY) * (scrollBarHeight - thumbHeight);
            
            ctx.fillStyle = '#8B8B8B';
            ctx.fillRect(scrollBarX, thumbY, scrollBarWidth, thumbHeight);
            
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 1;
            ctx.strokeRect(scrollBarX, thumbY, scrollBarWidth, thumbHeight);
        }
    }

    drawScrollButtons(ctx, canvas) {
        if (this.shop.maxShopScrollY > 0) {
            const buttonWidth = 60;
            const buttonHeight = 30;
            const centerX = canvas.width / 2;
            const bottomY = canvas.height - 40; // Position at the bottom

            // Scroll Up button
            const scrollUpX = centerX - buttonWidth - 10;
            this.drawEnhancedMinecraftButton(ctx, scrollUpX, bottomY, buttonWidth, buttonHeight, 'LÊN', '#4CAF50', this.shop.shopScrollY > 0);
            
            // Scroll Down button
            const scrollDownX = centerX + 10;
            this.drawEnhancedMinecraftButton(ctx, scrollDownX, bottomY, buttonWidth, buttonHeight, 'XUỐNG', '#F44336', this.shop.shopScrollY < this.shop.maxShopScrollY);
        }
    }
}