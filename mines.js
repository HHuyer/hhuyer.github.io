import { deductBet, updateBalance, showResultModal } from './main.js';

let gameActive = false;
let currentBet = 0;
let minePositions = [];
let revealedCells = 0;
let safeSpots = 0;
let exactMultiplier = 1.0;

export function isMinesActive() {
  return gameActive;
}

export function initMines() {
  const grid = document.querySelector('.mines-grid');
  grid.innerHTML = '';

  for (let i = 0; i < 25; i++) {
    const cell = document.createElement('div');
    cell.className = 'cell';
    cell.setAttribute('data-index', i);
    cell.addEventListener('click', () => handleCellClick(i));
    grid.appendChild(cell);
  }

  document.getElementById('mines-multiplier').textContent = '1.00x';
  document.getElementById('mines-multiplier-container').style.display = 'none';
  document.getElementById('mines-potential-win').style.display = 'none';
}

function calculateMultiplier(revealed, mines) {
  const house_edge = 0.01;
  const safe_spots = 25 - mines;

  if (revealed > safe_spots) return 0;

  let probability = 1.0;
  for (let i = 0; i < revealed; i++) {
    probability *= (safe_spots - i) / (25 - i);
  }

  return (1 / probability) * (1 - house_edge);
}

export function startMines() {
  const bet = parseInt(document.getElementById('mines-bet').value);
  const mineCount = parseInt(document.getElementById('mines-count').value);

  if (mineCount < 1 || mineCount > 24) {
    alert('Please select between 1 and 24 mines.');
    return;
  }

  if (!deductBet(bet)) return;

  currentBet = bet;
  gameActive = true;
  revealedCells = 0;
  safeSpots = 25 - mineCount;

  document.getElementById('mines-multiplier-container').style.display = 'block';
  document.getElementById('mines-potential-win').style.display = 'block';

  minePositions = [];
  while (minePositions.length < mineCount) {
    const position = Math.floor(Math.random() * 25);
    if (!minePositions.includes(position)) {
      minePositions.push(position);
    }
  }

  document.getElementById('mines-cashout').disabled = false;
  document.getElementById('mines-start').disabled = true;
  document.querySelectorAll('.mines-grid .cell').forEach(cell => {
    cell.textContent = '';
    cell.style.background = 'var(--secondary)';
  });
  updateMultiplierDisplay();
  updatePotentialWin();
}

export function cashoutMines() {
  if (!gameActive) return;

  gameActive = false;
  document.getElementById('mines-cashout').disabled = true;
  document.getElementById('mines-start').disabled = false;

  const winAmount = currentBet * exactMultiplier;
  updateBalance(winAmount);

  revealMines();

  document.getElementById('mines-potential-win').style.display = 'none';

  showResultModal(true, winAmount - currentBet);
}

function updateMultiplierDisplay() {
  if (!gameActive) return;

  const mineCount = parseInt(document.getElementById('mines-count').value);
  exactMultiplier = calculateMultiplier(revealedCells, mineCount);
  document.getElementById('mines-multiplier').textContent = exactMultiplier.toFixed(2) + 'x';
}

function updatePotentialWin() {
  if (!gameActive) {
    document.getElementById('mines-potential-win').style.display = 'none';
    return;
  }

  const potentialWin = currentBet * exactMultiplier;
  const potentialWinElem = document.getElementById('mines-potential-win');
  potentialWinElem.style.display = 'block';
  potentialWinElem.textContent = `Cashout: $${potentialWin.toFixed(2)}`;
}

function handleCellClick(index) {
  if (!gameActive) return;

  const cell = document.querySelector(`.mines-grid [data-index="${index}"]`);
  if (cell.textContent !== '') return;

  if (minePositions.includes(index)) {
    gameActive = false;
    document.getElementById('mines-cashout').disabled = true;
    document.getElementById('mines-start').disabled = false;
    revealMines();

    document.getElementById('mines-potential-win').style.display = 'none';

    showResultModal(false, currentBet);
    return;
  }

  revealedCells++;
  cell.textContent = '💎';
  cell.style.background = 'var(--accent)';
  updateMultiplierDisplay();
  updatePotentialWin();

  if (revealedCells >= safeSpots) {
    cashoutMines();
  }
}

function revealMines() {
  minePositions.forEach(pos => {
    const cell = document.querySelector(`.mines-grid [data-index="${pos}"]`);
    cell.textContent = '💣';
    cell.style.background = '#ff4444';
  });
}