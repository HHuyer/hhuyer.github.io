import { deductBet, updateBalance, showResultModal } from './main.js';

let isFlipping = false;

export function initCoinflip() {
  const container = document.querySelector('.coinflip-container');
  container.innerHTML = `
    <div class="coin">
      <div class="heads">H</div>
      <div class="tails">T</div>
    </div>
    <div class="coinflip-controls">
      <div class="input-container">
        <input type="number" id="coinflip-bet" value="100" min="1">
      </div>
      <select id="coinflip-choice">
        <option value="heads">Heads</option>
        <option value="tails">Tails</option>
      </select>
      <button onclick="startCoinflip()" id="coinflip-start">Flip Coin</button>
    </div>
  `;

  const coin = document.querySelector('.coin');
  gsap.set(coin, { rotationX: 0 });
}

export function isCoinflipActive() {
  return isFlipping;
}

export function startCoinflip() {
  if (isFlipping) return;
  
  const bet = parseInt(document.getElementById('coinflip-bet').value);
  if (!deductBet(bet)) return;
  
  const choice = document.getElementById('coinflip-choice').value;
  const coin = document.querySelector('.coin');
  
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  
  isFlipping = true;
  document.getElementById('coinflip-start').disabled = true;
  
  gsap.killTweensOf(coin);
  gsap.set(coin, { rotationX: 0 });

  const tl = gsap.timeline({
    onComplete: () => {
      isFlipping = false;
      document.getElementById('coinflip-start').disabled = false;
      
      const won = result === choice;
      if (won) {
        const winAmount = bet * 2;
        updateBalance(winAmount);
      }
      showResultModal(won, bet);
    }
  });

  const numFlips = Math.floor(Math.random() * 4) + Math.floor(Math.random() * 3) + 2;
  const flipDuration = 0.25;
  
  const finalRotation = numFlips * 180 + (result === 'tails' ? 180 : 0);

  tl.to(coin, {
    rotationX: finalRotation,
    duration: numFlips * flipDuration,
    ease: "none"
  });
}

window.startCoinflip = startCoinflip;