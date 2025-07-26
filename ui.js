// New file
export class UI {
    constructor(game) {
        this.game = game;
        this.backgroundPattern = null;
    }
    
    draw(ctx) {
        // Clear only the game canvas, background is static
        ctx.clearRect(0, 0, this.game.canvas.width, this.game.canvas.height);
    }
    
    drawBackground(ctx) {
        const isDarkMode = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        ctx.fillStyle = isDarkMode ? '#111' : '#EFEFEF';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        this.drawAnimatedGrid(ctx, isDarkMode);
    }

    createBackgroundPattern(isDarkMode) {
        const patternCanvas = document.createElement('canvas');
        const patternCtx = patternCanvas.getContext('2d');
        const gridSize = 40;
        patternCanvas.width = gridSize;
        patternCanvas.height = gridSize;

        patternCtx.fillStyle = isDarkMode ? '#111' : '#EFEFEF';
        patternCtx.fillRect(0, 0, gridSize, gridSize);
        patternCtx.strokeStyle = isDarkMode ? 'rgba(80, 80, 80, 0.2)' : 'rgba(200, 200, 200, 0.4)';
        patternCtx.lineWidth = 1;
        
        patternCtx.beginPath();
        patternCtx.moveTo(gridSize - 0.5, 0);
        patternCtx.lineTo(gridSize - 0.5, gridSize);
        patternCtx.stroke();
        
        patternCtx.beginPath();
        patternCtx.moveTo(0, gridSize - 0.5);
        patternCtx.lineTo(gridSize, gridSize - 0.5);
        patternCtx.stroke();
        
        this.backgroundPattern = this.game.backgroundCtx.createPattern(patternCanvas, 'repeat');
    }

    drawOverlays(ctx) {
        // Calculate if we're on a narrow screen (mobile)
        const isNarrow = this.game.canvas.width < 450;
        
        // Adjust button sizes for mobile
        const buttonWidth = isNarrow ? 50 : 70;
        const buttonHeight = isNarrow ? 24 : 30;
        const fontSize = isNarrow ? '11px' : '14px';
        
        // Draw shop button
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(this.game.canvas.width - (buttonWidth + 10), 10, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize} system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'CỬA HÀNG', this.game.canvas.width - (buttonWidth/2 + 10), 10 + (buttonHeight/2) + 4, 'rgba(0,0,0,0.7)', 'white', 1, 1);
        ctx.textAlign = 'left';

        // Draw settings button
        const settingsButtonX = this.game.canvas.width - (buttonWidth * 2 + 25);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(settingsButtonX, 10, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize} system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'CÀI ĐẶT', settingsButtonX + (buttonWidth/2), 10 + (buttonHeight/2) + 4, 'rgba(0,0,0,0.7)', 'white', 1, 1);
        ctx.textAlign = 'left';

        // Draw stats button
        const statsButtonX = this.game.canvas.width - (buttonWidth * 3 + 40);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(statsButtonX, 10, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize} system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'THỐNG KÊ', statsButtonX + (buttonWidth/2), 10 + (buttonHeight/2) + 4, 'rgba(0,0,0,0.7)', 'white', 1, 1);
        ctx.textAlign = 'left';

        // Draw collect button
        const collectButtonX = this.game.canvas.width - (buttonWidth * 4 + 55);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(collectButtonX, 10, buttonWidth, buttonHeight);
        ctx.fillStyle = 'white';
        ctx.font = `bold ${fontSize} system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'SƯU TẬP', collectButtonX + (buttonWidth/2), 10 + (buttonHeight/2) + 4, 'rgba(0,0,0,0.7)', 'white', 1, 1);
        ctx.textAlign = 'left';

        // Calculate UI layout
        let currentUIY = 10;
        const uiMargin = isNarrow ? 5 : 10;
        
        // Make resource panel narrower on small screens
        const boxWidth = isNarrow ? 140 : 250;
        
        let boxHeight = this.game.state.summerEventActive ? (isNarrow ? 60 : 84) : (isNarrow ? 240 : 318);
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(uiMargin, currentUIY, boxWidth, boxHeight);
        
        this.drawResources(ctx, currentUIY, uiMargin, boxWidth, isNarrow);
        
        currentUIY += boxHeight + 5;
        
        if (!this.game.pickaxe.isBroken) {
            this.drawDurabilityBar(ctx, currentUIY, uiMargin, boxWidth, isNarrow);
            currentUIY += (isNarrow ? 35 : 45) + 5;
        }

        this.drawSummerEventButton(ctx, currentUIY, uiMargin, isNarrow);

        // Draw TNT purchase button
        const now = Date.now();
        const canShowTNT = this.game.state.tntCollected > 0;
        
        if (canShowTNT) {
            const summerY = this.getSummerEventButtonY();
            const isNarrow = this.game.canvas.width < 450;
            const buttonWidth = isNarrow ? 80 : 100;
            const buttonHeight = isNarrow ? 36 : 48;
            const tntBtnY = summerY + (isNarrow ? 30 : 38) + 8;
            const uiMargin = isNarrow ? 5 : 10;

            // Gradient background
            const gradient = ctx.createLinearGradient(uiMargin, tntBtnY, uiMargin, tntBtnY + buttonHeight);
            gradient.addColorStop(0, 'rgba(255, 68, 68, 0.9)');
            gradient.addColorStop(1, 'rgba(204, 0, 0, 0.9)');
            ctx.fillStyle = gradient;
            ctx.fillRect(uiMargin, tntBtnY, buttonWidth, buttonHeight);

            // Animated border
            ctx.strokeStyle = 'rgba(255, 102, 102, 0.8)';
            ctx.lineWidth = 2;
            ctx.strokeRect(uiMargin, tntBtnY, buttonWidth, buttonHeight);

            // Inner highlight
            ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
            ctx.fillRect(uiMargin + 2, tntBtnY + 2, buttonWidth - 4, 4);

            // Draw TNT icon
            const tntIcon = this.game.assetLoader.getAsset('tnt');
            const iconSize = isNarrow ? 24 : 32;
            const iconX = uiMargin + (buttonWidth - iconSize) / 2;
            const iconY = tntBtnY + (buttonHeight - iconSize) / 2 - 6;

            if (tntIcon && tntIcon.complete) {
                ctx.drawImage(tntIcon, iconX, iconY, iconSize, iconSize);
            }

            // Cost text
            ctx.fillStyle = 'white';
            ctx.font = `bold ${isNarrow ? '12px' : '16px'} system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            this.drawTextWithShadow(
                ctx,
                `💣 Thả (${this.game.state.tntCollected})`,
                uiMargin + buttonWidth / 2,
                tntBtnY + buttonHeight - (isNarrow ? 6 : 10),
                'rgba(0,0,0,0.8)',
                'white',
                2,
                2
            );
            ctx.textAlign = 'left';
        }

        if (this.game.gameOver) {
            this.drawGameOverScreen(ctx, isNarrow);
        }
    }
    
    drawResources(ctx, currentUIY, uiMargin, boxWidth, isNarrow = false) {
        const titleFontSize = isNarrow ? '11px' : '14px';
        const itemFontSize = isNarrow ? '10px' : '13px';
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${titleFontSize} system-ui, -apple-system, sans-serif`;
        this.drawTextWithShadow(ctx, 'Tài nguyên', 15, currentUIY + (isNarrow ? 14 : 18), 'rgba(0,0,0,0.7)', 'rgba(255, 255, 255, 0.9)', 1, 1);
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(15, currentUIY + (isNarrow ? 18 : 24));
        ctx.lineTo(boxWidth - 5, currentUIY + (isNarrow ? 18 : 24));
        ctx.stroke();

        const itemHeight = isNarrow ? 18 : 22;
        const iconSize = isNarrow ? 12 : 16;
        const textOffset = isNarrow ? 18 : 25;
        let itemY = currentUIY + (isNarrow ? 22 : 32);

        const resourcesToDraw = this.game.state.summerEventActive ? 
            ['sand', 'sandstone'] : 
            ['coal', 'copper', 'iron', 'gold', 'redstone', 'diamond', 'lapis', 'emerald', 'stone', 'obsidian'];

        resourcesToDraw.forEach(res => {
            const iconKey = res === 'stone' ? 'stone' : res === 'obsidian' ? 'obsidian' : res === 'sand' ? 'sand' : res === 'sandstone' ? 'sandstone' : `${res}Icon`;
            const icon = this.game.assetLoader.getAsset(iconKey);
            if (icon && icon.complete) {
                ctx.drawImage(icon, 15, itemY, iconSize, iconSize);
            } else {
                ctx.fillStyle = '#666';
                ctx.fillRect(15, itemY, iconSize, iconSize);
            }

            const nameMap = {
                coal: "Than", copper: "Đồng", iron: "Sắt", gold: "Vàng", redstone: "Đá Đỏ",
                diamond: "Kim Cương", lapis: "Lưu Ly", emerald: "Ngọc Lục Bảo", stone: "Đá", 
                obsidian: "Hắc曜石", sand: "Cát", sandstone: "Đá Cát"
            };
            const name = nameMap[res] || (res.charAt(0).toUpperCase() + res.slice(1));

            ctx.fillStyle = 'white';
            ctx.font = `${itemFontSize} system-ui, -apple-system, sans-serif`;
            this.drawTextWithShadow(ctx, name, 15 + textOffset, itemY + (iconSize/2) + 3, 'rgba(0,0,0,0.7)', 'white', 1, 1);

            ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
            ctx.font = `bold ${itemFontSize} system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'right';
            this.drawTextWithShadow(ctx, `${this.formatNumber(this.game.state.resources[res])}`, boxWidth - 5, itemY + (iconSize/2) + 3, 'rgba(0,0,0,0.7)', 'rgba(255, 255, 255, 0.8)', 1, 1);
            ctx.textAlign = 'left';

            itemY += itemHeight;
        });
    }

    drawDurabilityBar(ctx, currentUIY, uiMargin, boxWidth, isNarrow = false) {
        const durabilityBarHeight = isNarrow ? 35 : 45;
        const fontSize = isNarrow ? '10px' : '12px';
        const smallFontSize = isNarrow ? '8px' : '10px';
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(uiMargin, currentUIY, boxWidth, durabilityBarHeight);
        
        const variant = this.game.pickaxe.getCurrentVariant();
        ctx.fillStyle = 'white';
        ctx.font = `${fontSize} system-ui, -apple-system, sans-serif`;
        this.drawTextWithShadow(ctx, `Cúp ${variant.name.charAt(0).toUpperCase() + variant.name.slice(1)}`, 15, currentUIY + (isNarrow ? 12 : 15), 'rgba(0,0,0,0.7)', 'white', 1, 1);
        
        const barY = currentUIY + (isNarrow ? 16 : 20);
        const barHeight = isNarrow ? 12 : 15;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.fillRect(15, barY, boxWidth - 20, barHeight);
        
        const durabilityPercent = this.game.pickaxe.getDurabilityPercent();
        const fillWidth = (boxWidth - 20) * durabilityPercent;
        
        if (durabilityPercent > 0.5) ctx.fillStyle = '#4CAF50';
        else if (durabilityPercent > 0.25) ctx.fillStyle = '#FF9800';
        else ctx.fillStyle = '#F44336';
        
        ctx.fillRect(15, barY, fillWidth, barHeight);
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `bold ${smallFontSize} system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        // Display durability as {current}/{max}
        const displayDurability = Math.max(0, Math.floor(variant.durability));
        const displayMaxDurability = Math.floor(variant.maxDurability);
        this.drawTextWithShadow(ctx, `${displayDurability}/${displayMaxDurability}`, uiMargin + boxWidth / 2, barY + (barHeight/2) + 3, 'rgba(0,0,0,0.9)', 'rgba(255, 255, 255, 0.9)', 1, 1);
        ctx.textAlign = 'left';
    }

    drawSummerEventButton(ctx, currentUIY, uiMargin, isNarrow = false) {
        const summerButtonHeight = isNarrow ? 24 : 30;
        const buttonWidth = isNarrow ? 55 : 70;
        const fontSize = isNarrow ? '8px' : '10px';
        const iconSize = isNarrow ? 18 : 24;
        
        ctx.fillStyle = this.game.state.summerEventActive ? 'rgba(255, 165, 0, 0.85)' : 'rgba(0, 0, 0, 0.85)';
        ctx.fillRect(uiMargin, currentUIY, buttonWidth, summerButtonHeight);
        
        const iceCreamIcon = this.game.assetLoader.getAsset('iceCreamIcon');
        const textColor = this.game.state.summerEventActive ? 'black' : 'white';
        if (iceCreamIcon && iceCreamIcon.complete) {
            const iconY = currentUIY + (summerButtonHeight - iconSize) / 2;
            ctx.drawImage(iceCreamIcon, 15, iconY, iconSize, iconSize);
            ctx.fillStyle = textColor;
            ctx.font = `bold ${fontSize} system-ui, -apple-system, sans-serif`;
            const textX = 15 + iconSize + (isNarrow ? 2 : 3);
            this.drawTextWithShadow(ctx, 'SỰ KIỆN', textX, currentUIY + (summerButtonHeight/2) - 3, 'rgba(0,0,0,0.7)', textColor, 1, 1);
            this.drawTextWithShadow(ctx, 'MÙA HÈ', textX, currentUIY + (summerButtonHeight/2) + 7, 'rgba(0,0,0,0.7)', textColor, 1, 1);
        } else {
            ctx.fillStyle = textColor;
            ctx.font = `bold ${fontSize} system-ui, -apple-system, sans-serif`;
            ctx.textAlign = 'center';
            this.drawTextWithShadow(ctx, 'SỰ KIỆN', uiMargin + buttonWidth/2, currentUIY + (summerButtonHeight/2) - 3, 'rgba(0,0,0,0.7)', textColor, 1, 1);
            this.drawTextWithShadow(ctx, 'MÙA HÈ', uiMargin + buttonWidth/2, currentUIY + (summerButtonHeight/2) + 7, 'rgba(0,0,0,0.7)', textColor, 1, 1);
            ctx.textAlign = 'left';
        }
    }
    
    drawGameOverScreen(ctx, isNarrow = false) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, this.game.canvas.width, this.game.canvas.height);
        
        const titleFontSize = isNarrow ? '32px' : '48px';
        const subtitleFontSize = isNarrow ? '18px' : '24px';
        const infoFontSize = isNarrow ? '14px' : '18px';
        
        ctx.fillStyle = 'white';
        ctx.font = `bold ${titleFontSize} system-ui, -apple-system, sans-serif`;
        ctx.textAlign = 'center';
        this.drawTextWithShadow(ctx, 'CÚP ĐÃ BỂ!', this.game.canvas.width / 2, this.game.canvas.height / 2 - (isNarrow ? 30 : 50), 'rgba(0,0,0,0.7)', 'white', 2, 2);
        
        ctx.font = `${subtitleFontSize} system-ui, -apple-system, sans-serif`;
        this.drawTextWithShadow(ctx, 'Nhấn để bắt đầu lại với cúp mới', this.game.canvas.width / 2, this.game.canvas.height / 2 + 10, 'rgba(0,0,0,0.7)', 'white', 2, 2);
        
        ctx.font = `${infoFontSize} system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        this.drawTextWithShadow(ctx, 'Tài nguyên của bạn đã được lưu!', this.game.canvas.width / 2, this.game.canvas.height / 2 + (isNarrow ? 35 : 50), 'rgba(0,0,0,0.7)', 'rgba(255, 255, 255, 0.8)', 1, 1);
        
        ctx.textAlign = 'left';
    }

    formatNumber(num) {
        if (num === null || num === undefined || isNaN(num)) return '0';
        if (num >= 1000000000) return (num / 1000000000).toFixed(1).replace(/\.0$/, '') + 'B';
        if (num >= 1000000) return (num / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
        if (num >= 1000) return (num / 1000).toFixed(1).replace(/\.0$/, '') + 'K';
        return num.toString();
    }

    drawAnimatedGrid(ctx, isDarkMode) {
        if (!this.backgroundPattern) {
            this.createBackgroundPattern(isDarkMode);
        }
        
        const pattern = this.backgroundPattern;
        if (pattern) {
            const offsetX = (this.game.camera.x * 0.1) % 40;
            const offsetY = (this.game.camera.y * 0.1) % 40;
            ctx.save();
            ctx.translate(-offsetX, -offsetY);
            ctx.fillStyle = pattern;
            ctx.fillRect(offsetX, offsetY, this.game.canvas.width + 40, this.game.canvas.height + 40);
            ctx.restore();
        }
    }

    drawTextWithShadow(ctx, text, x, y, shadowColor, textColor, shadowX = 1, shadowY = 1) {
        ctx.fillStyle = shadowColor;
        ctx.fillText(text, x + shadowX, y + shadowY);
        ctx.fillStyle = textColor;
        ctx.fillText(text, x, y);
    }

    getSummerEventButtonY() {
        const isNarrow = this.game.canvas.width < 450;
        let buttonY = 10;
        buttonY += this.game.state.summerEventActive ? (isNarrow ? 60 : 84) : (isNarrow ? 240 : 318);
        buttonY += 5;
        if (!this.game.pickaxe.isBroken) {
            buttonY += (isNarrow ? 35 : 45) + 5;
        }
        return buttonY;
    }
}