import { initMines, startMines, cashoutMines, isMinesActive } from './mines.js';
import { initTowers, startTowers, cashoutTowers, isTowersActive } from './towers.js';
import { initCases, startCases, isCasesOpening, initCasesBetInput } from './cases.js';
import { initSlide } from './slide.js';
import { initCoinflip, startCoinflip, isCoinflipActive } from './coinflip.js';
import { initBlackjack } from './blackjack.js';
import { initCrossy } from './crossy.js';

let balance = 1000; 
const balanceElement = document.getElementById('balance');
const faucetButton = document.createElement('button');
faucetButton.className = 'faucet-button';
faucetButton.innerHTML = '<i class="fa-solid fa-faucet"></i> Faucet';

export function updateBalance(amount) {
  balance += amount;
  balanceElement.textContent = balance.toFixed(2); 
  updateFaucetVisibility();
}

export function getBalance() {
  return balance;
}

export function deductBet(amount) {
  if (amount > balance) {
    alert('Insufficient balance!');
    return false;
  }
  balance -= amount;
  balanceElement.textContent = balance.toFixed(2); 
  updateFaucetVisibility();
  return true;
}

function canUseFaucet() {
  const hasActiveBet = 
    isMinesActive() || 
    isTowersActive() || 
    isCasesOpening() || 
    isCoinflipActive();
  
  return !hasActiveBet && balance < 50;
}

function updateFaucetVisibility() {
  const faucetBtn = document.querySelector('.faucet-button');
  const canUse = canUseFaucet();
  faucetBtn.disabled = !canUse;
  
  if (canUse) {
    faucetBtn.title = "Get $1000";
  } else {
    if (balance >= 50) {
      faucetBtn.title = "Only available when balance is under $50";
    } else {
      faucetBtn.title = "Cannot use faucet while a game is active";
    }
  }
}

export function claimFaucet() {
  if (!canUseFaucet()) return;
  
  balance += 500;
  balanceElement.textContent = balance.toFixed(2);
  updateFaucetVisibility();
}

function getBetValue(inputId) {
  return parseInt(document.getElementById(inputId).value) || 0;
}

function setBetValue(inputId, value) {
  const input = document.getElementById(inputId);
  input.value = Math.max(1, Math.floor(value));
}

function initBetModifiers() {
  document.querySelectorAll('.input-container').forEach(container => {
    if (container.querySelector('.bet-modifiers')) return;
    
    const input = container.querySelector('input[type="number"]');
    if (!input) return;
    
    input.value = 100;
    
    const modifiers = document.createElement('div');
    modifiers.className = 'bet-modifiers';
    
    const halfBtn = document.createElement('div');
    halfBtn.className = 'bet-modifier';
    halfBtn.textContent = '1/2';
    halfBtn.onclick = () => setBetValue(input.id, getBetValue(input.id) / 2);
    
    const doubleBtn = document.createElement('div');
    doubleBtn.className = 'bet-modifier';
    doubleBtn.textContent = '2x';
    doubleBtn.onclick = () => setBetValue(input.id, getBetValue(input.id) * 2);
    
    const maxBtn = document.createElement('div');
    maxBtn.className = 'bet-modifier';
    maxBtn.textContent = 'MAX';
    maxBtn.onclick = () => setBetValue(input.id, getBalance());
    
    modifiers.appendChild(halfBtn);
    modifiers.appendChild(doubleBtn);
    modifiers.appendChild(maxBtn);
    
    container.appendChild(modifiers);
  });
}

export function showResultModal(won, amount) {
  const modal = document.createElement('div');
  modal.className = 'result-modal';
  modal.innerHTML = `
    <div class="result-content ${won ? 'win' : 'lose'}">
      <p>${won ? 'You won $' : 'You lost $'}${amount.toFixed(2)}</p>
    </div>
  `;
  document.body.appendChild(modal);

  // Start fade out after display duration
  setTimeout(() => {
    modal.classList.add('fade-out');
    modal.addEventListener('animationend', () => {
      if (modal && modal.parentElement) {
        modal.remove();
      }
    });
  }, 1000); // Show for 1 second before fading out
}

function init() {
  balanceElement.textContent = balance.toFixed(2);
  
  initMines();
  initTowers();
  initCases();
  initCasesBetInput();
  initSlide();
  initCoinflip();
  initBlackjack();
  initCrossy();
  
  initBetModifiers();
  
  updateFaucetVisibility();
  faucetButton.addEventListener('click', claimFaucet);
}

export function showToast(message, type = 'info') {
  console.log(message);
}

window.switchGame = function(game) {
  if (isMinesActive() || isTowersActive() || isCasesOpening() || isCoinflipActive()) {
    alert('Please finish or cashout your current game first!');
    return;
  }
  
  document.querySelectorAll('.game').forEach(el => el.classList.remove('active'));
  document.getElementById(game).classList.add('active');
  document.querySelectorAll('nav button').forEach(btn => btn.classList.remove('active'));
  document.querySelector(`button[onclick="switchGame('${game}')"]`).classList.add('active');

  if (game === 'towers') {
    const difficulty = document.getElementById('towers-difficulty').value;
    const towersGrid = document.querySelector('.towers-grid');
    towersGrid.classList.toggle('three-columns', difficulty !== 'easy');
  }

  document.title = `${game.charAt(0).toUpperCase() + game.slice(1)} - Monkey's Casino`;
};

window.startMines = startMines;
window.cashoutMines = cashoutMines;
window.startTowers = startTowers;  
window.cashoutTowers = cashoutTowers;
window.startCases = startCases;
window.startCoinflip = startCoinflip;
window.addFaucetMoney = claimFaucet;

document.addEventListener('DOMContentLoaded', init);

window.claimFaucet = claimFaucet;