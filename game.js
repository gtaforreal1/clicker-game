// Game State
const gameState = {
    coins: 0,
    clicks: 0,
    perClick: 1,
    cheatsBlocked: 0,
    playerName: localStorage.getItem('playerName') || 'Anonymous',
    upgrades: {
        clickMultiplier: { level: 0, cost: 10, name: '🔥 Click x2', baseMultiplier: 2, icon: '🔥' },
        passiveIncome: { level: 0, cost: 50, name: '💵 Passive +1/sec', baseIncome: 1, icon: '💵' },
        clickMultiplierV2: { level: 0, cost: 100, name: '⚡ Click x3', baseMultiplier: 3, icon: '⚡' },
        megaPassive: { level: 0, cost: 500, name: '🤑 Passive +10/sec', baseIncome: 10, icon: '🤑' },
        autoClick: { level: 0, cost: 1000, name: '🤖 Auto +1/10s', baseAutoClick: 0.1, icon: '🤖' },
    }
};

// Anti-Cheat Variables
let isMousePressed = false;
let lastClickTime = 0;
let lastClickCoords = { x: 0, y: 0 };
let passiveIncomeInterval = null;
let autoClickInterval = null;
let leaderboardUpdateInterval = null;
let cheatsAttempted = 0;

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadGameState();
    initializeUpgrades();
    startPassiveIncome();
    startAutoClick();
    updateDisplay();
    updateLeaderboard();
    startLeaderboardRefresh();
    
    // Load player name if exists
    const savedName = localStorage.getItem('playerName');
    if (savedName) {
        document.getElementById('playerName').value = savedName;
    }
});

// Mouse detection for anti-cheat
document.addEventListener('mousedown', (e) => {
    isMousePressed = true;
    lastClickCoords = { x: e.clientX, y: e.clientY };
    lastClickTime = Date.now();
});

document.addEventListener('mouseup', () => {
    isMousePressed = false;
});

// Button mouse handlers
function handleMouseDown() {
    if (!isMousePressed) {
        detectCheat();
    }
}

function handleMouseUp() {
    // Click will be registered here
}

// Click Handler
document.getElementById('clickBtn').addEventListener('click', () => {
    if (!isMousePressed) {
        detectCheat();
        return;
    }
    
    // Legitimate click
    const coinsPerClick = gameState.perClick;
    gameState.coins += coinsPerClick;
    gameState.clicks++;
    
    updateDisplay();
    animateClick();
    saveGameState();
    submitScore();
});

// Anti-Cheat Detection
function detectCheat() {
    gameState.cheatsBlocked++;
    cheatsAttempted++;
    
    showCheatWarning();
    updateDisplay();
    saveGameState();
}

function showCheatWarning() {
    const warning = document.getElementById('cheatWarning');
    warning.style.display = 'block';
    
    setTimeout(() => {
        warning.style.display = 'none';
    }, 3000);
}

// Passive Income
function startPassiveIncome() {
    if (passiveIncomeInterval) clearInterval(passiveIncomeInterval);
    
    passiveIncomeInterval = setInterval(() => {
        const totalPassive = (gameState.upgrades.passiveIncome.level * gameState.upgrades.passiveIncome.baseIncome) +
                           (gameState.upgrades.megaPassive.level * gameState.upgrades.megaPassive.baseIncome);
        
        if (totalPassive > 0) {
            gameState.coins += totalPassive;
            updateDisplay();
            saveGameState();
        }
    }, 1000);
}

// Auto Click (legitimately adds coins, not simulating clicks)
function startAutoClick() {
    if (autoClickInterval) clearInterval(autoClickInterval);
    
    autoClickInterval = setInterval(() => {
        const autoClickRate = gameState.upgrades.autoClick.level * gameState.upgrades.autoClick.baseAutoClick;
        
        if (autoClickRate > 0) {
            gameState.coins += autoClickRate;
            updateDisplay();
            saveGameState();
        }
    }, 10000); // Every 10 seconds
}

// Upgrades
function initializeUpgrades() {
    const upgradesGrid = document.getElementById('upgradesGrid');
    upgradesGrid.innerHTML = '';
    
    Object.keys(gameState.upgrades).forEach(key => {
        const upgrade = gameState.upgrades[key];
        const card = document.createElement('button');
        card.className = 'upgrade-card';
        card.innerHTML = `
            <div class="upgrade-name">
                <span>${upgrade.icon} ${upgrade.name}</span>
                <span class="upgrade-level">Lvl: ${upgrade.level}</span>
            </div>
            <div class="upgrade-cost">Cost: ${upgrade.cost} coins</div>
        `;
        
        card.addEventListener('click', () => buyUpgrade(key));
        upgradesGrid.appendChild(card);
    });
    
    updateUpgradesDisplay();
}

function buyUpgrade(key) {
    const upgrade = gameState.upgrades[key];
    
    if (gameState.coins < upgrade.cost) {
        alert('Not enough coins!');
        return;
    }
    
    gameState.coins -= upgrade.cost;
    upgrade.level++;
    
    // Apply upgrade effects
    if (key === 'clickMultiplier') {
        gameState.perClick += 1;
    } else if (key === 'clickMultiplierV2') {
        gameState.perClick += 2;
    }
    
    // Increase cost for next level
    upgrade.cost = Math.floor(upgrade.cost * 1.15);
    
    // Restart income timers if needed
    startPassiveIncome();
    startAutoClick();
    
    updateDisplay();
    updateUpgradesDisplay();
    saveGameState();
}

function updateUpgradesDisplay() {
    const cards = document.querySelectorAll('.upgrade-card');
    const keys = Object.keys(gameState.upgrades);
    
    cards.forEach((card, index) => {
        const key = keys[index];
        const upgrade = gameState.upgrades[key];
        
        if (gameState.coins >= upgrade.cost) {
            card.disabled = false;
            card.style.opacity = '1';
        } else {
            card.disabled = true;
            card.style.opacity = '0.5';
        }
        
        // Update text
        card.innerHTML = `
            <div class="upgrade-name">
                <span>${upgrade.icon} ${upgrade.name}</span>
                <span class="upgrade-level">Lvl: ${upgrade.level}</span>
            </div>
            <div class="upgrade-cost">Cost: ${upgrade.cost} coins</div>
        `;
    });
}

// Display Updates
function updateDisplay() {
    document.getElementById('coinCount').textContent = formatNumber(gameState.coins);
    document.getElementById('clickCount').textContent = gameState.clicks;
    document.getElementById('perClick').textContent = gameState.perClick;
    document.getElementById('cheatsBlocked').textContent = gameState.cheatsBlocked;
    
    updateUpgradesDisplay();
}

function formatNumber(num) {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return Math.floor(num).toString();
}

function animateClick() {
    const btn = document.getElementById('clickBtn');
    const coinCount = document.getElementById('coinCount');
    
    coinCount.style.animation = 'none';
    setTimeout(() => {
        coinCount.style.animation = 'coinPulse 0.3s ease-in-out';
    }, 10);
}

// Leaderboard
function submitScore() {
    const scores = JSON.parse(localStorage.getItem('leaderboardScores')) || [];
    
    const playerScore = {
        name: gameState.playerName,
        coins: gameState.coins,
        timestamp: Date.now()
    };
    
    // Update or add player score
    const existingIndex = scores.findIndex(s => s.name === gameState.playerName);
    if (existingIndex !== -1) {
        scores[existingIndex] = playerScore;
    } else {
        scores.push(playerScore);
    }
    
    localStorage.setItem('leaderboardScores', JSON.stringify(scores));
}

function updateLeaderboard() {
    const scores = JSON.parse(localStorage.getItem('leaderboardScores')) || [];
    const sortedScores = scores.sort((a, b) => b.coins - a.coins).slice(0, 10);
    
    const leaderboard = document.getElementById('leaderboard');
    leaderboard.innerHTML = '';
    
    if (sortedScores.length === 0) {
        leaderboard.innerHTML = '<div class="leaderboard-placeholder">No scores yet. Start clicking!</div>';
        return;
    }
    
    sortedScores.forEach((score, index) => {
        const entry = document.createElement('div');
        entry.className = 'leaderboard-entry';
        
        if (score.name === gameState.playerName) {
            entry.classList.add('user-entry');
        }
        
        const rankClass = index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? 'bronze' : '';
        const rankEmoji = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `#${index + 1}`;
        
        entry.innerHTML = `
            <div class="leaderboard-rank ${rankClass}">${rankEmoji}</div>
            <div class="leaderboard-player">${score.name}</div>
            <div class="leaderboard-coins">${formatNumber(score.coins)} 💰</div>
        `;
        
        leaderboard.appendChild(entry);
    });
    
    // Update user rank
    const userRank = sortedScores.findIndex(s => s.name === gameState.playerName);
    document.getElementById('userRank').textContent = userRank !== -1 ? `#${userRank + 1}` : '-';
}

function startLeaderboardRefresh() {
    if (leaderboardUpdateInterval) clearInterval(leaderboardUpdateInterval);
    
    leaderboardUpdateInterval = setInterval(() => {
        updateLeaderboard();
    }, 90000); // Every 90 seconds
}

function setPlayerName() {
    const nameInput = document.getElementById('playerName');
    const newName = nameInput.value.trim();
    
    if (newName && newName.length > 0) {
        gameState.playerName = newName;
        localStorage.setItem('playerName', newName);
        submitScore();
        updateLeaderboard();
        alert('Name saved!');
    }
}

// Save/Load Game State
function saveGameState() {
    localStorage.setItem('gameState', JSON.stringify(gameState));
}

function loadGameState() {
    const saved = localStorage.getItem('gameState');
    if (saved) {
        Object.assign(gameState, JSON.parse(saved));
    }
}

// Auto-save every 10 seconds
setInterval(saveGameState, 10000);