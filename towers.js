import { deductBet, updateBalance } from './main.js';

let gameActive = false;
let currentBet = 0;
let currentLevel = 0;
let multiplier = 1;
const LEVELS = 8;
let wrongPositions = new Set();
let selectedCells = new Set();

// Define multipliers for each level and difficulty (based on Stake.com towers)
const MULTIPLIERS = {
  easy: [1.31, 1.74, 2.32, 3.10, 4.14, 5.51, 7.34, 9.79, 13.05],
  medium: [1.47, 2.21, 3.31, 4.96, 7.44, 11.16, 16.74, 25.11, 37.67],
  hard: [2.94, 8.82, 26.46, 79.38, 238.14, 714.42, 2143.26, 6429.78, 19289.34]
};

export function initTowers() {
  const grid = document.querySelector('.towers-grid');
  grid.innerHTML = '';
  
  for (let i = 0; i < LEVELS * 4; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('data-index', i);
    cell.addEventListener('click', () => handleCellClick(i));
    grid.appendChild(cell);
  }
  
  // Add difficulty change listener
  document.getElementById('towers-difficulty').addEventListener('change', function() {
    if (gameActive) {
      // Reset selection if game is active
      this.value = this.dataset.currentDifficulty;
      return;
    }
    
    // Store current difficulty
    this.dataset.currentDifficulty = this.value;
    
    const towersGrid = document.querySelector('.towers-grid');
    towersGrid.classList.toggle('three-columns', this.value !== 'easy');
  });
  
  // Set initial difficulty data attribute
  document.getElementById('towers-difficulty').dataset.currentDifficulty = 'easy';
  
  // Hide multiplier and potential win on init
  document.getElementById('towers-multiplier-container').style.display = 'none';
  document.getElementById('towers-potential-win').style.display = 'none';
}

export function startTowers() {
  const bet = parseInt(document.getElementById('towers-bet').value);
  const difficulty = document.getElementById('towers-difficulty').value;
  
  if (!deductBet(bet)) return;
  
  currentBet = bet;
  gameActive = true;
  currentLevel = 0;
  multiplier = 1;
  selectedCells.clear();
  wrongPositions.clear();
  
  // Disable difficulty selector during game
  document.getElementById('towers-difficulty').disabled = true;
  
  // Calculate number of wrong tiles based on difficulty
  let wrongTilesPerLevel;
  switch(difficulty) {
    case 'easy':
      wrongTilesPerLevel = 1; // 1/4 wrong (4 tiles)
      break;
    case 'medium':
      wrongTilesPerLevel = 1; // 1/3 wrong (3 tiles)
      break;
    case 'hard':
      wrongTilesPerLevel = 2; // 2/3 wrong (3 tiles)
      break;
  }
  
  // Generate wrong positions
  for (let level = 0; level < LEVELS; level++) {
    const levelCells = new Set();
    while (levelCells.size < wrongTilesPerLevel) {
      const pos = level * 4 + Math.floor(Math.random() * (difficulty === 'easy' ? 4 : 3));
      levelCells.add(pos);
    }
    levelCells.forEach(pos => wrongPositions.add(pos));
  }
  
  // Show/hide tiles based on difficulty
  document.querySelectorAll('.towers-grid .cell').forEach(cell => {
    const index = parseInt(cell.getAttribute('data-index'));
    if (index % 4 === 3) { // The fourth tile in each row
      cell.style.visibility = difficulty === 'easy' ? 'visible' : 'hidden';
      cell.style.display = difficulty === 'easy' ? 'block' : 'none';
    } else {
      cell.style.visibility = 'visible';
      cell.style.display = 'block';
    }
    cell.style.background = 'var(--secondary)';
  });
  
  // Show multiplier and potential win when game starts
  const multiplierElem = document.getElementById('towers-multiplier-container');
  const potentialWinElem = document.getElementById('towers-potential-win');
  multiplierElem.style.display = 'block';
  potentialWinElem.style.display = 'block';
  
  document.getElementById('towers-cashout').disabled = false;
  document.getElementById('towers-start').disabled = true;
  updateMultiplierDisplay();
  updatePotentialWin();
}

export function cashoutTowers() {
  if (!gameActive) return;
  
  // Get the exact multiplier currently being displayed
  const multiplier = parseFloat(document.getElementById('towers-multiplier').innerText);
  
  gameActive = false;
  document.getElementById('towers-cashout').disabled = true;
  document.getElementById('towers-start').disabled = false;
  document.getElementById('towers-difficulty').disabled = false;
  
  // Calculate win amount using the displayed multiplier
  const winAmount = (currentBet * multiplier);
  updateBalance(winAmount);
  
  // Hide potential win display but keep multiplier visible
  document.getElementById('towers-potential-win').style.display = 'none';
  
  // Show all wrong tiles when cashing out
  revealWrongTiles();
}

export function isTowersActive() {
  return gameActive;
}

function updateMultiplierDisplay() {
  const difficulty = document.getElementById('towers-difficulty').value;
  // Start at 1.00 if no level completed, otherwise show next level's multiplier
  multiplier = currentLevel === 0 ? 1.00 : MULTIPLIERS[difficulty][currentLevel - 1];
  document.getElementById('towers-multiplier').innerText = multiplier.toFixed(2);
}

function updatePotentialWin() {
  if (!gameActive) {
    document.getElementById('towers-potential-win').style.display = 'none';
    return;
  }
  const difficulty = document.getElementById('towers-difficulty').value;
  const currentMultiplier = currentLevel === 0 ? 1.00 : MULTIPLIERS[difficulty][currentLevel - 1];
  const potentialWin = (currentBet * currentMultiplier);
  document.getElementById('towers-potential-win').style.display = 'block';
  document.getElementById('towers-potential-win').textContent = 
    `Cashout: $${potentialWin.toFixed(2)}`;
}

function revealWrongTiles() {
  wrongPositions.forEach(pos => {
    const cell = document.querySelector(`.towers-grid [data-index="${pos}"]`);
    if (!selectedCells.has(pos)) {
      cell.style.background = '#ff4444';
    }
  });
}

function handleCellClick(index) {
  if (!gameActive) return;
  if (Math.floor(index / 4) !== currentLevel) return;
  if (selectedCells.has(index)) return;
  
  const cell = document.querySelector(`.towers-grid [data-index="${index}"]`);
  
  if (wrongPositions.has(index)) {
    // Hit a wrong tile
    cell.style.background = '#ff4444';
    selectedCells.add(index);
    gameActive = false;
    document.getElementById('towers-cashout').disabled = true;
    document.getElementById('towers-start').disabled = false;
    document.getElementById('towers-difficulty').disabled = false;
    document.getElementById('towers-potential-win').style.display = 'none';
    // Reveal all wrong tiles
    revealWrongTiles();
  } else {
    // Success
    cell.style.background = '#44ff44';
    selectedCells.add(index);
    currentLevel++;
    updateMultiplierDisplay();
    updatePotentialWin();
    
    if (currentLevel === LEVELS) {
      // Won the game 
      cashoutTowers();
    }
  }
}