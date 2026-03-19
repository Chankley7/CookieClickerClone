const GameData = {
    buildings: [
        { id: "cursor", name: "Cursor", baseCost: 15, baseCps: 0.1, desc: "Autoclicks once every 10 seconds.", icon: "👆" },
        { id: "grandma", name: "Grandma", baseCost: 100, baseCps: 1, desc: "A nice grandma to bake more cookies.", icon: "👵" },
        { id: "farm", name: "Farm", baseCost: 1100, baseCps: 8, desc: "Grows cookie plants from cookie seeds.", icon: "🌱" },
        { id: "mine", name: "Mine", baseCost: 12000, baseCps: 47, desc: "Mines out cookie dough and chocolate chips.", icon: "⛏️" },
        { id: "factory", name: "Factory", baseCost: 130000, baseCps: 260, desc: "Produces large quantities of cookies.", icon: "🏭" },
        { id: "bank", name: "Bank", baseCost: 1400000, baseCps: 1400, desc: "Generates cookies from interest.", icon: "🏦" },
        { id: "temple", name: "Temple", baseCost: 20000000, baseCps: 7800, desc: "Full of precious, ancient chocolate.", icon: "🏛️" },
        { id: "wizard_tower", name: "Wizard Tower", baseCost: 330000000, baseCps: 44000, desc: "Summons cookies with magic spells.", icon: "🧙" },
        { id: "shipment", name: "Shipment", baseCost: 5100000000, baseCps: 260000, desc: "Brings in fresh cookies from the cookie planet.", icon: "🚀" },
        { id: "alchemy_lab", name: "Alchemy Lab", baseCost: 75000000000, baseCps: 1600000, desc: "Turns gold into cookies!", icon: "⚗️" },
        { id: "portal", name: "Portal", baseCost: 1000000000000, baseCps: 10000000, desc: "Opens a door to the Cookieverse.", icon: "🌀" },
        { id: "time_machine", name: "Time Machine", baseCost: 14000000000000, baseCps: 65000000, desc: "Brings cookies from the past, before they were even eaten.", icon: "⏳" },
        { id: "am_condenser", name: "Antimatter Condenser", baseCost: 170000000000000, baseCps: 430000000, desc: "Condenses the antimatter in the universe into cookies.", icon: "⚛️" },
        { id: "prism", name: "Prism", baseCost: 2100000000000000, baseCps: 2900000000, desc: "Converts light itself into cookies.", icon: "🌈" },
        { id: "chancemaker", name: "Chancemaker", baseCost: 26000000000000000, baseCps: 21000000000, desc: "Generates cookies out of thin air through sheer luck.", icon: "🍀" },
        { id: "fractal", name: "Fractal Engine", baseCost: 310000000000000000, baseCps: 150000000000, desc: "Turns cookies into even more cookies.", icon: "❄️" },
        { id: "js_console", name: "Javascript Console", baseCost: 7100000000000000000, baseCps: 1100000000000, desc: "Creates cookies from the very code this game was written in.", icon: "💻" },
        { id: "idleverse", name: "Idleverse", baseCost: 120000000000000000000, baseCps: 8300000000000, desc: "There's been countless other idle universes running alongside our own. You've finally found a way to hijack their production.", icon: "🌌" },
        { id: "cortex_baker", name: "Cortex Baker", baseCost: 1900000000000000000000, baseCps: 64000000000000, desc: "These artificial brains the size of planets are capable of simply dreaming up cookies into existence.", icon: "🧠" }
    ],
    upgrades: [],
    achievements: []
};

// Generate tiered building upgrades
const tiers = [1, 5, 25, 50, 100, 150, 200, 250, 300, 400, 500];
GameData.buildings.forEach(b => {
    tiers.forEach((reqTarget, i) => {
        const costMulti = Math.pow(10, i + 1); 
        GameData.upgrades.push({
            id: `upg_${b.id}_${reqTarget}`,
            name: `${b.name} Tier ${i+1}`,
            desc: `${b.name}s are twice as efficient.`,
            cost: b.baseCost * costMulti,
            type: 'building',
            target: b.id,
            reqType: 'building',
            reqTarget: b.id,
            reqAmount: reqTarget,
            icon: b.icon
        });
    });
});

// Cursor scaling
const cursorCostScale = [100000, 10000000, 1000000000, 100000000000];
const cursorValues = [0.1, 0.5, 5, 50];
cursorCostScale.forEach((cost, i) => {
    GameData.upgrades.push({
        id: `upg_cursor_scale_${i}`,
        name: `Cursor Scaling ${i+1}`,
        desc: `The mouse and cursors gain +${cursorValues[i]} cookies for each non-cursor object owned.`,
        cost: cost,
        type: 'cursor_scale',
        value: cursorValues[i],
        reqType: 'building',
        reqTarget: 'cursor',
        reqAmount: 1,
        icon: "👆"
    });
});

// Kitten upgrades (Milk multipliers)
const kittenCosts = [900000, 9000000, 900000000, 90000000000];
const kittenNames = ["Kitten helpers", "Kitten workers", "Kitten engineers", "Kitten overseers"];
kittenCosts.forEach((cost, i) => {
    GameData.upgrades.push({
        id: `upg_kitten_${i}`,
        name: kittenNames[i],
        desc: `You gain more CPS the more milk you have (amplifies achievement boosts).`,
        cost: cost,
        type: 'kitten', // Handled in CPS math
        reqType: 'achievements', // unlock based on amount of achievements
        reqAmount: (i + 1) * 10,
        icon: "🐱"
    });
});

// Prestige upgrade (triggers on buy to unlock prestige mechanics)
GameData.upgrades.push({
    id: `upg_legacy`,
    name: "Legacy",
    desc: "Permanently unlocks the Prestige menu. Requires 1 trillion cookies baked all time.",
    cost: 0,
    type: 'legacy',
    reqType: 'cookiesAllTime',
    reqAmount: 1000000000000,
    icon: "🌟"
});

// Generate achievements
const clicks = [1, 100, 1000, 10000];
clicks.forEach((c, i) => {
    GameData.achievements.push({ id: `ach_click_${c}`, name: `Click Fest ${i+1}`, desc: `Click the big cookie ${c} times.`, reqType: 'clicks', reqAmount: c, icon: '🖱️' });
});

const bakes = [100, 10000, 1000000, 100000000];
bakes.forEach((b, i) => {
    GameData.achievements.push({ id: `ach_bake_${b}`, name: `Bake Master ${i+1}`, desc: `Bake ${b} cookies all time.`, reqType: 'cookiesAllTime', reqAmount: b, icon: '🍪' });
});

GameData.buildings.forEach(b => {
    [1, 50, 100].forEach(amt => {
        GameData.achievements.push({ id: `ach_build_${b.id}_${amt}`, name: `${b.name} Owner ${amt}`, desc: `Own ${amt} ${b.name}s.`, reqType: 'building', reqTarget: b.id, reqAmount: amt, icon: '🏢' });
    });
});
