import { deductBet, updateBalance, showResultModal } from './main.js';

let gameActive = false;
let currentBet = 0;
let currentLevel = 0;
let deadSquares = new Set();
let multiplier = 1;

const BASE_MULTIPLIERS = {
  1: 1.08,
  2: 1.17,
  3: 1.26,
  4: 1.36,
  5: 1.47
};

export function initCrossy() {
  const container = document.querySelector('.crossy-container');
  container.innerHTML = `
    <div class="game-header">
      <div class="multiplier-display" id="crossy-multiplier-container" style="display:none;">
        Next: <span id="crossy-multiplier">1.00x</span>
      </div>
      <div class="potential-win" id="crossy-potential-win" style="display:none;"></div>
    </div>
    <div class="crossy-grid"></div>
    <div class="controls centered-controls">
      <div class="input-container">
        <input type="number" id="crossy-bet" value="10" min="1">
      </div>
      <button onclick="startCrossy()" id="crossy-start">Start Game</button>
      <button onclick="cashoutCrossy()" disabled id="crossy-cashout">Cashout</button>
    </div>
  `;

  generateGrid();
}

function generateGrid() {
  const grid = document.querySelector('.crossy-grid');
  grid.innerHTML = '';
  
  const rowDiv = document.createElement('div');
  rowDiv.className = 'crossy-row';
  
  for (let col = 0; col < 5; col++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('data-index', col);
    
    if (col === currentLevel) {
      const tag = document.createElement('div');
      tag.className = 'multiplier-tag';
      const nextMultiplier = BASE_MULTIPLIERS[currentLevel + 1];
      if (nextMultiplier) {
        tag.textContent = nextMultiplier.toFixed(2) + 'x';
      }
      cell.appendChild(tag);
    }
    
    const coin = document.createElement('div');
    coin.className = 'crossy-coin';
    coin.textContent = '🪙';
    cell.appendChild(coin);
    
    const roadElement = document.createElement('div');
    roadElement.className = 'road-element';
    
    const laneMarking = document.createElement('div');
    laneMarking.className = 'lane-marking';
    roadElement.appendChild(laneMarking);
    
    cell.appendChild(roadElement);
    cell.addEventListener('click', () => handleCellClick(col));
    rowDiv.appendChild(cell);
  }
  
  grid.appendChild(rowDiv);
}

function handleCellClick(index) {
  if (!gameActive) return;
  
  if (index !== currentLevel) return;
  
  const cell = document.querySelector(`.cell[data-index="${index}"]`);
  if (cell.classList.contains('revealed')) return;
  
  if (deadSquares.has(index)) {
    cell.classList.add('revealed', 'dead');
    gameActive = false;
    document.getElementById('crossy-cashout').disabled = true;
    document.getElementById('crossy-start').disabled = false;
    document.getElementById('crossy-potential-win').style.display = 'none';
    
    deadSquares.forEach(deadIndex => {
      const deadCell = document.querySelector(`.cell[data-index="${deadIndex}"]`);
      if (!deadCell.classList.contains('revealed')) {
        deadCell.classList.add('revealed', 'dead');
      }
    });

    showResultModal(false, currentBet);
  } else {
    cell.classList.add('revealed', 'safe');
    currentLevel++;
    multiplier = BASE_MULTIPLIERS[currentLevel];
    
    document.querySelectorAll('.cell').forEach(cell => {
      const cellIndex = parseInt(cell.getAttribute('data-index'));
      
      const oldTag = cell.querySelector('.multiplier-tag');
      if (oldTag) {
        cell.removeChild(oldTag);
      }
      
      if (cellIndex === currentLevel) {
        const nextMultiplier = BASE_MULTIPLIERS[currentLevel + 1];
        if (nextMultiplier) {
          const tag = document.createElement('div');
          tag.className = 'multiplier-tag';
          tag.textContent = nextMultiplier.toFixed(2) + 'x';
          cell.appendChild(tag);
        }
      }
    });
    
    if (currentLevel === 5) {
      cashoutCrossy();
    } else {
      generateDeadSquares();
      updateMultiplierDisplay();
      updatePotentialWin();
    }
  }
}

function generateDeadSquares() {
  deadSquares.clear();
  deadSquares.add(currentLevel);
}

function updateMultiplierDisplay() {
  const nextMultiplier = BASE_MULTIPLIERS[currentLevel + 1] || multiplier;
  document.getElementById('crossy-multiplier').textContent = nextMultiplier.toFixed(2);
}

function updatePotentialWin() {
  if (!gameActive) {
    document.getElementById('crossy-potential-win').style.display = 'none';
    return;
  }
  
  const potentialWin = currentBet * multiplier;
  document.getElementById('crossy-potential-win').style.display = 'block';
  document.getElementById('crossy-potential-win').textContent = 
    `Cashout: $${potentialWin.toFixed(2)}`;
}

export function startCrossy() {
  const bet = parseInt(document.getElementById('crossy-bet').value);
  if (!deductBet(bet)) return;
  
  currentBet = bet;
  currentLevel = 0;
  gameActive = true;
  deadSquares.clear();
  multiplier = 1;
  
  document.querySelectorAll('.crossy-grid .cell').forEach(cell => {
    cell.className = 'cell';
    
    const coin = cell.querySelector('.crossy-coin');
    while (cell.firstChild) {
      cell.removeChild(cell.firstChild);
    }
    cell.appendChild(coin);
    
    const roadElement = document.createElement('div');
    roadElement.className = 'road-element';
    const laneMarking = document.createElement('div');
    laneMarking.className = 'lane-marking';
    roadElement.appendChild(laneMarking);
    cell.appendChild(roadElement);
    
    const index = parseInt(cell.getAttribute('data-index'));
    if (index === 0) {
      const tag = document.createElement('div');
      tag.className = 'multiplier-tag';
      tag.textContent = BASE_MULTIPLIERS[1].toFixed(2) + 'x';
      cell.appendChild(tag);
    }
  });
  
  generateDeadSquares();
  
  document.getElementById('crossy-cashout').disabled = false;
  document.getElementById('crossy-start').disabled = true;
  
  document.getElementById('crossy-multiplier-container').style.display = 'block';
  updateMultiplierDisplay();
  updatePotentialWin();
}

export function cashoutCrossy() {
  if (!gameActive) return;
  
  gameActive = false;
  document.getElementById('crossy-cashout').disabled = true;
  document.getElementById('crossy-start').disabled = false;
  
  const winAmount = currentBet * multiplier;
  updateBalance(winAmount);
  
  document.getElementById('crossy-potential-win').style.display = 'none';
  
  deadSquares.forEach(index => {
    const cell = document.querySelector(`.cell[data-index="${index}"]`);
    if (!cell.classList.contains('revealed')) {
      cell.classList.add('revealed', 'dead');
    }
  });

  showResultModal(true, winAmount - currentBet);
}

window.startCrossy = startCrossy;
window.cashoutCrossy = cashoutCrossy;