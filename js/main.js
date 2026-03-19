const Game = {
    // State
    cookies: 0,
    cookiesAllTime: 0,
    clicks: 0,
    cps: 0,
    cpc: 1, 
    buildingsOwned: {}, 
    upgradesOwned: [], 
    achievementsOwned: [],
    heavenlyChips: 0, 
    
    settings: {
        bakeryName: "Player",
        autosave: true,
        particles: true,
        cursors: true,
        prestigeCount: 0
    },

    buffs: {}, 
    goldenCookieVisible: false,
    goldenCookieNextSpawn: 0, 

    lastFrameTime: performance.now(),
    achievementCheckTimer: 0,

    elements: {},

    init() {
        this.cacheElements();
        this.initData(); 
        this.load(); 
        this.renderStore();
        this.bindEvents();
        this.recalculateCPS();
        this.scheduleGoldenCookie();
        this.updateCursorRing();
        this.updateAchievementsView();
        this.updateStatsView();
        this.updateUI();
        
        requestAnimationFrame((time) => this.loop(time));
    },

    cacheElements() {
        this.elements.cookieCount = document.getElementById('cookie-count');
        this.elements.cpsValue = document.getElementById('cps-value');
        this.elements.bigCookie = document.getElementById('big-cookie');
        this.elements.storeItems = document.getElementById('store-items');
        this.elements.upgradesContainer = document.getElementById('upgrades-container');
        this.elements.buildingsContainer = document.getElementById('buildings-container');
        this.elements.goldenCookie = document.getElementById('golden-cookie');
        this.elements.newsText = document.getElementById('news-text');
        this.elements.cursorRing = document.getElementById('cursor-ring');
        this.elements.bakeryName = document.getElementById('bakery-name');
        
        this.elements.middleNav = document.getElementById('middle-nav');
        this.elements.middleContent = document.getElementById('middle-content');
        this.elements.statsContainer = document.getElementById('stats-container');
        this.elements.achievementsContainer = document.getElementById('achievements-container');
        
        this.elements.tooltip = document.getElementById('custom-tooltip');
    },

    initData() {
        GameData.buildings.forEach(b => {
            if (this.buildingsOwned[b.id] === undefined) {
                this.buildingsOwned[b.id] = 0;
            }
        });
    },

    bindEvents() {
        this.elements.bigCookie.addEventListener('contextmenu', e => e.preventDefault());
        this.elements.bigCookie.addEventListener('mousedown', (e) => this.clickCookie(e));
        this.elements.bigCookie.addEventListener('keydown', (e) => {
            if(e.key === 'Enter' || e.key === ' ') e.preventDefault();
        });

        // Store click delegation
        this.elements.storeItems.addEventListener('click', (e) => {
            const item = e.target.closest('.store-item');
            if (!item) return;
            const id = item.dataset.id;
            this.buyBuilding(id);
        });

        this.elements.upgradesContainer.addEventListener('click', (e) => {
            const item = e.target.closest('.upgrade-item');
            if (!item || item.classList.contains('locked')) return;
            const id = item.dataset.id;
            this.buyUpgrade(id);
        });

        this.elements.goldenCookie.addEventListener('click', (e) => this.clickGoldenCookie(e));
        
        // Settings Buttons
        document.getElementById('btn-save').addEventListener('click', () => this.save(true));
        document.getElementById('btn-load').addEventListener('click', () => { this.load(); location.reload(); });
        document.getElementById('btn-wipe').addEventListener('click', () => this.wipeSave());
        
        const toggleA = document.getElementById('toggle-autosave');
        const toggleP = document.getElementById('toggle-particles');
        const toggleC = document.getElementById('toggle-cursors');
        
        toggleA.checked = this.settings.autosave !== false; // true default
        toggleP.checked = this.settings.particles;
        toggleC.checked = this.settings.cursors;
        
        toggleA.addEventListener('change', (e) => {
            this.settings.autosave = e.target.checked;
            this.save();
        });
        
        toggleP.addEventListener('change', (e) => {
            this.settings.particles = e.target.checked;
            this.save();
        });
        toggleC.addEventListener('change', (e) => {
            this.settings.cursors = e.target.checked;
            this.elements.cursorRing.style.display = this.settings.cursors ? 'block' : 'none';
            this.save();
        });
        
        this.elements.bakeryName.addEventListener('blur', (e) => {
            let name = e.target.textContent.trim();
            if (!name) name = "Player";
            this.settings.bakeryName = name;
            e.target.textContent = name;
            this.save();
        });
        this.elements.bakeryName.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                this.elements.bakeryName.blur();
            }
        });
        
        this.elements.middleNav.addEventListener('click', (e) => {
            if (e.target.classList.contains('nav-btn')) {
                document.querySelectorAll('.nav-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
                
                e.target.classList.add('active');
                const targetId = e.target.dataset.target;
                document.getElementById(targetId).classList.add('active');
                
                if (targetId === 'stats-container') this.updateStatsView();
                if (targetId === 'achievements-container') this.updateAchievementsView();
            }
        });

        // Tooltip logic
        document.addEventListener('mouseover', (e) => this.handleTooltipHover(e));
        document.addEventListener('mousemove', (e) => this.handleTooltipMove(e));
        document.addEventListener('mouseout', (e) => this.handleTooltipOut(e));
        
        // Secret Cheat Code Listener ("opensesame")
        const secretCode = ['o','p','e','n','s','e','s','a','m','e'];
        let secretIndex = 0;
        document.addEventListener('keydown', (e) => {
            if (e.key.toLowerCase() === secretCode[secretIndex]) {
                secretIndex++;
                if (secretIndex === secretCode.length) {
                    this.earn(1000000000000000); // 1 quadrillion
                    this.elements.newsText.textContent = "CHEAT CODE ACTIVATED: Unlimited Power!";
                    this.updateUI();
                    secretIndex = 0;
                }
            } else {
                secretIndex = 0;
            }
        });
    },

    handleTooltipHover(e) {
        const target = e.target.closest('[data-tooltip-title]');
        if (target) {
            const title = target.getAttribute('data-tooltip-title');
            const desc = target.getAttribute('data-tooltip-desc');
            const cost = target.getAttribute('data-tooltip-cost');
            
            let html = `<div class="tooltip-title">${title}</div>`;
            if (cost) html += `<div class="tooltip-cost">${cost} cookies</div>`;
            if (desc) html += `<div class="tooltip-desc">${desc.replace(/\n/g, '<br>')}</div>`;
            
            this.elements.tooltip.innerHTML = html;
            this.elements.tooltip.style.display = 'block';
            this.moveTooltip(e);
        }
    },

    handleTooltipMove(e) {
        if (this.elements.tooltip.style.display === 'block') {
            this.moveTooltip(e);
        }
    },

    handleTooltipOut(e) {
        const target = e.target.closest('[data-tooltip-title]');
        if (target) {
            this.elements.tooltip.style.display = 'none';
        }
    },

    moveTooltip(e) {
        let x = e.clientX + 15;
        let y = e.clientY + 15;
        
        // Prevent overflow
        const rect = this.elements.tooltip.getBoundingClientRect();
        if (x + rect.width > window.innerWidth) x = window.innerWidth - rect.width - 15;
        if (y + rect.height > window.innerHeight) y = window.innerHeight - rect.height - 15;
        
        this.elements.tooltip.style.left = x + 'px';
        this.elements.tooltip.style.top = y + 'px';
    },

    save(manual = false) {
        const payload = {
            cookies: this.cookies,
            cookiesAllTime: this.cookiesAllTime,
            clicks: this.clicks,
            buildingsOwned: this.buildingsOwned,
            upgradesOwned: this.upgradesOwned,
            achievementsOwned: this.achievementsOwned,
            heavenlyChips: this.heavenlyChips,
            settings: this.settings
        };
        localStorage.setItem('cookieCloneSave', JSON.stringify(payload));
        if (manual) this.elements.newsText.textContent = "Game saved!";
    },

    load() {
        const data = localStorage.getItem('cookieCloneSave');
        if (data) {
            try {
                const parsed = JSON.parse(data);
                this.cookies = parsed.cookies || 0;
                this.cookiesAllTime = parsed.cookiesAllTime || 0;
                this.clicks = parsed.clicks || 0;
                this.buildingsOwned = parsed.buildingsOwned || {};
                this.upgradesOwned = parsed.upgradesOwned || [];
                this.achievementsOwned = parsed.achievementsOwned || [];
                this.heavenlyChips = parsed.heavenlyChips || 0;
                if (parsed.settings) {
                    this.settings = Object.assign(this.settings, parsed.settings);
                    if (this.settings.bakeryName) {
                        this.elements.bakeryName.textContent = this.settings.bakeryName;
                    }
                }
                this.elements.newsText.textContent = "Save loaded!";
                
                if (this.elements.cursorRing) {
                    this.elements.cursorRing.style.display = this.settings.cursors ? 'block' : 'none';
                }
            } catch (e) {
                console.error("Save load failed", e);
            }
        }
    },

    wipeSave() {
        if (confirm("Are you sure you want to completely wipe your save? This cannot be undone!")) {
            localStorage.removeItem('cookieCloneSave');
            location.reload();
        }
    },

    ascend() {
        const chipsGained = Math.floor(Math.sqrt(this.cookiesAllTime / 1000000000000));
        if (chipsGained > 0) {
            if (confirm(`Are you ready to ascend? You will forfeit your bakery, but gain ${GameUtils.formatNumber(chipsGained)} Heavenly Chips for a permanent boost! \n\n(Note: Current run stats will wipe!)`)) {
                this.heavenlyChips += chipsGained;
                this.cookies = 0;
                this.cookiesAllTime = 0; // Or keep it for total? Cookie clicker keeps total baked. Let's reset cookies to 0, start fresh! Wait, cookiesAllTime persists in original game for chip math, but the formula is on *all time*.
                // Original: cookiesBakedAllTime persists. We'll keep cookiesAllTime, but wipe current bank and buildings.
                this.cookies = 0;
                this.clicks = 0;
                Object.keys(this.buildingsOwned).forEach(k => this.buildingsOwned[k] = 0);
                // Lose upgrades except heavenly
                this.upgradesOwned = this.upgradesOwned.filter(id => id.startsWith('upg_heavenly')); // Future proof logic
                // Keep achievements!
                this.settings.prestigeCount++;
                
                this.save();
                location.reload();
            }
        } else {
            alert(`You need to bake at least 1 trillion cookies all time to earn a Heavenly Chip! (You have ${GameUtils.formatNumber(this.cookiesAllTime)}).`);
        }
    },

    scheduleGoldenCookie() {
        const spawnDelay = GameUtils.random(300000, 900000); 
        this.goldenCookieNextSpawn = performance.now() + spawnDelay;
    },

    spawnGoldenCookie() {
        if (this.goldenCookieVisible) return;
        this.goldenCookieVisible = true;
        this.elements.goldenCookie.classList.remove('hidden');
        
        const x = GameUtils.random(50, window.innerWidth - 130);
        const y = GameUtils.random(50, window.innerHeight - 130);
        
        this.elements.goldenCookie.style.left = `${x}px`;
        this.elements.goldenCookie.style.top = `${y}px`;

        this.goldenCookieDespawnTimer = setTimeout(() => {
            this.hideGoldenCookie();
        }, 13000);
    },

    hideGoldenCookie() {
        this.goldenCookieVisible = false;
        this.elements.goldenCookie.classList.add('hidden');
        clearTimeout(this.goldenCookieDespawnTimer);
        this.scheduleGoldenCookie();
    },

    clickGoldenCookie(e) {
        this.hideGoldenCookie();
        
        const effects = ['frenzy', 'lucky', 'click_frenzy'];
        const effect = effects[Math.floor(Math.random() * effects.length)];
        const now = performance.now();

        if (effect === 'frenzy') {
            this.buffs.frenzy = { expiresAt: now + 77000 }; 
            this.elements.newsText.textContent = "Frenzy! Cookie production x7 for 77 seconds!";
        } else if (effect === 'click_frenzy') {
            this.buffs.clickFrenzy = { expiresAt: now + 13000 };
            this.elements.newsText.textContent = "Click Frenzy! Clicking power x777 for 13 seconds!";
        } else if (effect === 'lucky') {
            const reward = Math.min(this.cookies * 0.15, this.cps * 900) + 13;
            const finalReward = Math.max(reward, 100); 
            this.earn(finalReward);
            this.spawnFloatingNumber(e.clientX, e.clientY, finalReward);
            this.elements.newsText.textContent = `Lucky! You found ${GameUtils.formatNumber(finalReward)} cookies!`;
        }

        this.recalculateCPS();
        this.updateUI();
    },

    clickCookie(e) {
        this.clicks++;
        this.earn(this.cpc);
        this.spawnFloatingNumber(e.clientX, e.clientY, this.cpc);
        this.updateUI();
    },

    earn(amount) {
        this.cookies += amount;
        this.cookiesAllTime += amount;
    },

    spend(amount) {
        this.cookies -= amount;
    },

    getBuildingCost(id) {
        const buildingInfo = GameData.buildings.find(b => b.id === id);
        const owned = this.buildingsOwned[id];
        return Math.ceil(buildingInfo.baseCost * Math.pow(1.15, owned));
    },

    buyBuilding(id) {
        const cost = this.getBuildingCost(id);
        if (this.cookies >= cost) {
            this.spend(cost);
            this.buildingsOwned[id] += 1;
            this.recalculateCPS();
            this.updateStoreUI();
            this.updateBuildingsView();
            if (id === 'cursor') this.updateCursorRing();
            this.updateUI();
        }
    },

    buyUpgrade(id) {
        if (id === 'upg_legacy') {
            this.ascend();
            return;
        }

        const upg = GameData.upgrades.find(u => u.id === id);
        if (this.cookies >= upg.cost && !this.upgradesOwned.includes(id)) {
            this.elements.tooltip.style.display = 'none'; // hide tooltip on purchase
            this.spend(upg.cost);
            this.upgradesOwned.push(id);
            this.recalculateCPS();
            this.updateStoreUI(); 
            this.updateUI();
        }
    },

    recalculateCPS() {
        let totalCps = 0;
        
        const buildingMults = {};
        GameData.buildings.forEach(b => buildingMults[b.id] = 1);
        
        let cursorScaleBonus = 0;
        let kittenMultiplier = 0;

        this.upgradesOwned.forEach(upgId => {
            const upg = GameData.upgrades.find(u => u.id === upgId);
            if (upg.type === 'building') {
                buildingMults[upg.target] *= 2;
            } else if (upg.type === 'cursor_scale') {
                cursorScaleBonus += upg.value;
            } else if (upg.type === 'kitten') {
                kittenMultiplier += 0.05; // 5% extra milk power per kitten upgrade
            }
        });

        let nonCursorObjects = 0;
        GameData.buildings.forEach(b => {
             if (b.id !== 'cursor') nonCursorObjects += this.buildingsOwned[b.id];
        });

        GameData.buildings.forEach(b => {
             let bCps = b.baseCps * buildingMults[b.id];
             if (b.id === 'cursor') {
                 bCps += (nonCursorObjects * cursorScaleBonus);
             }
             totalCps += this.buildingsOwned[b.id] * bCps;
        });

        if (this.buffs.frenzy && performance.now() < this.buffs.frenzy.expiresAt) {
            totalCps *= 7;
        }

        // Milk multiplier from achievements
        // Base: 1% per achievement. Kittens add multiplicative to this.
        let milkFactor = this.achievementsOwned.length * (0.01 + kittenMultiplier);
        
        // Final math
        let finalCps = totalCps * (1 + milkFactor);

        // Prestige Heavenly Chips (+1% CPS per chip)
        finalCps *= (1 + (this.heavenlyChips * 0.01));

        this.cps = finalCps;

        let baseCpc = 1 + finalCps * 0.05; 
        if (this.buffs.clickFrenzy && performance.now() < this.buffs.clickFrenzy.expiresAt) {
            baseCpc *= 777;
        }

        this.cpc = Math.floor(baseCpc); 
    },

    checkAchievements() {
        let newAchieve = false;
        GameData.achievements.forEach(a => {
            if (this.achievementsOwned.includes(a.id)) return;
            
            let unlocked = false;
            if (a.reqType === 'clicks' && this.clicks >= a.reqAmount) unlocked = true;
            if (a.reqType === 'cookiesAllTime' && this.cookiesAllTime >= a.reqAmount) unlocked = true;
            if (a.reqType === 'building' && this.buildingsOwned[a.reqTarget] >= a.reqAmount) unlocked = true;
            
            if (unlocked) {
                this.achievementsOwned.push(a.id);
                this.elements.newsText.textContent = `Achievement Unlocked: ${a.name}!`;
                newAchieve = true;
            }
        });
        
        if (newAchieve) {
            this.recalculateCPS();
            this.updateAchievementsView();
        }
    },

    updateCursorRing() {
        if (!this.elements.cursorRing) return;
        this.elements.cursorRing.innerHTML = '';
        const cursorsToShow = Math.min(50, this.buildingsOwned['cursor'] || 0);
        if (cursorsToShow === 0) return;
        
        const radius = 160;
        const center = 160; 
        
        for (let i = 0; i < cursorsToShow; i++) {
            const angle = (i / cursorsToShow) * 2 * Math.PI;
            const x = center + radius * Math.cos(angle);
            const y = center + radius * Math.sin(angle);
            
            const cursor = document.createElement('div');
            cursor.className = 'orbit-cursor';
            
            // Adjust so 👆 points to the center
            const rot = (angle * 180 / Math.PI) - 90;
            
            const hand = document.createElement('div');
            hand.textContent = '👆';
            hand.style.transform = `rotate(${rot}deg)`;
            hand.style.filter = "drop-shadow(0px 2px 5px rgba(0,0,0,0.8))";
            
            cursor.appendChild(hand);
            
            cursor.style.left = `${x}px`;
            cursor.style.top = `${y}px`;
            
            this.elements.cursorRing.appendChild(cursor);
        }
    },

    renderStore() {
        this.elements.storeItems.innerHTML = '';
        GameData.buildings.forEach(b => {
            const cost = this.getBuildingCost(b.id);
            const owned = this.buildingsOwned[b.id];
            
            const div = document.createElement('div');
            div.className = 'store-item locked';
            div.dataset.id = b.id;
            div.dataset.tooltipTitle = b.name;
            div.dataset.tooltipCost = GameUtils.formatNumber(cost);
            div.dataset.tooltipDesc = `${b.desc}\nProduces ${GameUtils.formatNumber(b.baseCps, true)} CPS.`;
            
            div.innerHTML = `
                <div class="item-icon">${b.icon || '❔'}</div>
                <div class="item-details">
                    <div class="item-name">${b.name}</div>
                    <div class="item-cost">${GameUtils.formatNumber(cost)}</div>
                </div>
                <div class="item-count">${owned > 0 ? owned : ''}</div>
            `;
            b.node = div;
            b.costNode = div.querySelector('.item-cost');
            b.countNode = div.querySelector('.item-count');
            
            this.elements.storeItems.appendChild(div);
        });
    },

    updateStoreUI() {
        GameData.buildings.forEach(b => {
            const cost = this.getBuildingCost(b.id);
            const owned = this.buildingsOwned[b.id];
            
            b.costNode.textContent = GameUtils.formatNumber(cost);
            b.countNode.textContent = owned > 0 ? owned : '';
            b.node.dataset.tooltipCost = GameUtils.formatNumber(cost);
            
            if (this.cookies >= cost) {
                b.node.classList.remove('locked');
            } else {
                b.node.classList.add('locked');
            }
        });

        let upgradesHtml = '';
        GameData.upgrades.forEach(u => {
            if (this.upgradesOwned.includes(u.id)) return;
            
            let unlocked = false;
            if (u.reqType === 'building') {
                if (this.buildingsOwned[u.reqTarget] >= u.reqAmount) unlocked = true;
            } else if (u.reqType === 'achievements') {
                if (this.achievementsOwned.length >= u.reqAmount) unlocked = true;
            } else if (u.reqType === 'cookiesAllTime') {
                if (this.cookiesAllTime >= u.reqAmount) unlocked = true;
            }
            
            if (unlocked) {
                const isAffordable = this.cookies >= u.cost;
                const clazz = isAffordable ? 'upgrade-item' : 'upgrade-item locked';
                upgradesHtml += `
                    <div class="${clazz}" data-id="${u.id}" data-tooltip-title="${u.name}" data-tooltip-cost="${GameUtils.formatNumber(u.cost)}" data-tooltip-desc="${u.desc}">
                        ${u.icon || '🛠️'}
                    </div>
                `;
            }
        });
        
        this.elements.upgradesContainer.innerHTML = upgradesHtml;
    },

    updateBuildingsView() {
        let html = '';
        GameData.buildings.forEach(b => {
            const owned = this.buildingsOwned[b.id];
            if (owned > 0) {
                html += `
                    <div style="padding: 10px; margin: 5px; background: rgba(255,255,255,0.05); border-radius: 5px; display: flex; align-items: center;">
                        <span style="font-size: 1.5rem; margin-right: 15px; background: rgba(0,0,0,0.3); padding: 5px 15px; border-radius: 5px;">${b.icon || '❔'}</span>
                        <div>
                            <div style="font-weight: 800">${b.name}</div>
                            <div style="font-size: 0.9em; opacity: 0.6;">Owned: ${owned}</div>
                        </div>
                    </div>
                `;
            }
        });
        
        if (html === '') {
            html = '<div class="placeholder-text">Buy buildings to see them here!</div>';
        }
        
        this.elements.buildingsContainer.innerHTML = html;
    },

    updateAchievementsView() {
        let html = `<div style="margin-bottom:10px;">Unlocked: ${this.achievementsOwned.length} / ${GameData.achievements.length}</div>`;
        html += '<div class="achievements-grid">';
        
        GameData.achievements.forEach(a => {
            const owned = this.achievementsOwned.includes(a.id);
            const clazz = owned ? "achieve-item" : "achieve-item locked";
            const desc = owned ? a.desc : "Locked.";
            const title = owned ? a.name : "Locked";
            const icon = owned ? (a.icon || '🏆') : '❔';
            
            html += `
                <div class="${clazz}" data-tooltip-title="${title}" data-tooltip-desc="${desc}">
                    ${icon}
                </div>
            `;
        });
        
        html += '</div>';
        this.elements.achievementsContainer.innerHTML = html;
    },

    updateStatsView() {
        const potentialChips = Math.floor(Math.sqrt(this.cookiesAllTime / 1000000000000));
        
        const html = `
            <div class="settings-group">
                <h3>General</h3>
                <div><strong>Cookies in bank:</strong> ${GameUtils.formatNumber(Math.floor(this.cookies))}</div>
                <div><strong>Cookies baked (all time):</strong> ${GameUtils.formatNumber(Math.floor(this.cookiesAllTime))}</div>
                <div><strong>Run started:</strong> Just now (v1)</div>
                <div style="margin-top:10px;"><strong>Buildings owned:</strong> ${Object.values(this.buildingsOwned).reduce((a, b) => a + b, 0)}</div>
                <div><strong>Cookies per second:</strong> ${GameUtils.formatNumber(this.cps, true)}</div>
                <div><strong>Cookies per click:</strong> ${GameUtils.formatNumber(this.cpc)}</div>
                <div><strong>Hand-made cookie clicks:</strong> ${GameUtils.formatNumber(this.clicks)}</div>
            </div>
            
            <div class="settings-group">
                <h3>Prestige</h3>
                <div><strong>Ascension Level:</strong> ${this.settings.prestigeCount}</div>
                <div><strong>Heavenly Chips:</strong> ${GameUtils.formatNumber(this.heavenlyChips)} (+${GameUtils.formatNumber(this.heavenlyChips)}% CPS)</div>
                <div style="margin-top: 5px; color: var(--text-secondary);">Ascending now would yield: <strong>${GameUtils.formatNumber(potentialChips)} chips</strong></div>
            </div>

            <div class="settings-group">
                <h3>Upgrades & Achievements</h3>
                <div><strong>Upgrades unlocked:</strong> ${this.upgradesOwned.length} / ${GameData.upgrades.length}</div>
                <div><strong>Achievements unlocked:</strong> ${this.achievementsOwned.length} / ${GameData.achievements.length}</div>
                <div><strong>Milk factor:</strong> +${GameUtils.formatNumber(this.achievementsOwned.length * 1)}% CPS base boost</div>
            </div>
        `;
        this.elements.statsContainer.innerHTML = html;
    },

    spawnFloatingNumber(x, y, amount) {
        if (!this.settings.particles) return;
        
        const floater = document.createElement('div');
        floater.classList.add('floating-number');
        floater.textContent = `+${GameUtils.formatNumber(amount)}`;
        
        const handAnim = document.createElement('span');
        handAnim.innerText = "👆";
        handAnim.style.fontSize = "0.6em";
        handAnim.style.marginLeft = "4px";
        floater.appendChild(handAnim);
        
        const offsetX = GameUtils.random(-20, 20);
        const offsetY = GameUtils.random(-20, 20);
        
        floater.style.left = `${x + offsetX}px`;
        floater.style.top = `${y + offsetY}px`;
        
        document.body.appendChild(floater);
        setTimeout(() => floater.remove(), 1000);
    },

    updateUI() {
        this.elements.cookieCount.textContent = GameUtils.formatNumber(Math.floor(this.cookies));
        this.elements.cpsValue.textContent = GameUtils.formatNumber(this.cps, true);
        
        this.updateStoreUI();
        
        document.title = `${GameUtils.formatNumber(Math.floor(this.cookies))} cookies - Cookie Clicker Clone`;
    },

    loop(currentTime) {
        const deltaMs = currentTime - this.lastFrameTime;
        this.lastFrameTime = currentTime;
        
        if (!this.lastSaveTime) this.lastSaveTime = currentTime;
        if (this.settings.autosave !== false && currentTime - this.lastSaveTime > 30000) {
            this.save();
            this.lastSaveTime = currentTime;
        }

        this.achievementCheckTimer += deltaMs;
        if (this.achievementCheckTimer > 1000) {
            this.checkAchievements();
            this.achievementCheckTimer = 0;
        }

        if (this.cps > 0) {
            const cookiesThisFrame = this.cps * (deltaMs / 1000);
            this.earn(cookiesThisFrame);
            this.updateUI(); 
        }

        if (!this.goldenCookieVisible && performance.now() >= this.goldenCookieNextSpawn) {
            this.spawnGoldenCookie();
        }

        let needRecalc = false;
        if (this.buffs.frenzy && performance.now() >= this.buffs.frenzy.expiresAt) {
            delete this.buffs.frenzy;
            needRecalc = true;
        }
        if (this.buffs.clickFrenzy && performance.now() >= this.buffs.clickFrenzy.expiresAt) {
            delete this.buffs.clickFrenzy;
            needRecalc = true;
        }
        
        if (needRecalc) {
            this.recalculateCPS();
            this.updateUI();
        }
        
        requestAnimationFrame((time) => this.loop(time));
    }
};

window.addEventListener('DOMContentLoaded', () => {
    Game.init();
});
