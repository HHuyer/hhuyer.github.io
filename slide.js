import { deductBet, updateBalance, showToast } from './main.js';

const COLORS = {
  GREEN: '#4CAF50',
  RED: '#f44336',
  BLACK: '#2196F3'
};

const MULTIPLIERS = {
  GREEN: 14,
  RED: 2,
  BLACK: 2
};

let currentBets = {
  green: [],
  red: [],
  black: []
};

let selectedSide = null;
let spinTimeout;
let countdown;
let nextSpinTime = Date.now() + 20000;
let isSpinning = false;

function generateSlideSpots() {
  const slideInner = document.querySelector('.slide-inner');
  slideInner.innerHTML = '';
  
  // Generate 100 spots with proper distribution
  for (let i = 0; i < 100; i++) {
    const spot = document.createElement('div');
    spot.className = 'slide-spot';
    const random = Math.random();
    if (random < 1/15) {
      spot.style.background = COLORS.GREEN;
    } else if (random < 8/15) {
      spot.style.background = COLORS.RED;
    } else {
      spot.style.background = COLORS.BLACK;
    }
    slideInner.appendChild(spot);
  }
}

function spin() {
  if (isSpinning) return;
  isSpinning = true;
  
  // Generate random result
  const random = Math.random();
  let result;
  if (random < 1/15) {
    result = 'green';
  } else if (random < 8/15) {
    result = 'red';
  } else {
    result = 'black';
  }
  
  // Calculate winnings for all bets
  currentBets[result].forEach(bet => {
    const winAmount = bet.amount * MULTIPLIERS[result.toUpperCase()];
    if (winAmount > 0 && bet.username === room.party.client.username) {
      updateBalance(winAmount);
    }
  });
  
  // Animate the slide
  const slideInner = document.querySelector('.slide-inner');
  // Calculate finalOffset to ensure green lands in middle for next round
  const spotWidth = 80; // Width of each spot
  const containerWidth = document.querySelector('.roulette-slide').offsetWidth;
  const centerOffset = (containerWidth / 2) - (spotWidth / 2);
  const finalOffset = -Math.floor(Math.random() * 30) - 35; // Random offset that keeps result near center
  
  gsap.to(slideInner, {
    x: finalOffset + '%',
    duration: 5,
    ease: "power2.out",
    onComplete: () => {
      // Update history
      updateHistory(result);
      
      // Wait 5 seconds before starting next countdown
      setTimeout(async () => {
        try {
          // Delete all bets from database
          const allBets = await room.collection('slide_bets').getList();
          for (const bet of allBets) {
            await room.collection('slide_bets').delete(bet.id);
          }
        } catch (err) {
          console.error('Error clearing bets:', err);
        }
        
        // Clear local bet state
        currentBets = {
          green: [],
          red: [],
          black: []
        };
        updateBetsList();
        
        // Reset form inputs
        document.querySelectorAll('.bet-input').forEach(input => {
          input.value = 0;
          input.min = 0;
        });
        
        // Reset for next round
        isSpinning = false;
        document.getElementById('place-bets').disabled = false;
        
        // Reset betting restrictions
        selectedSide = null;
        updateInputRestrictions();
        
        // Generate new spots and reset position to center green
        generateSlideSpots();
        gsap.set(slideInner, { x: '0%' });
        
        // Start next countdown
        nextSpinTime = Date.now() + 20000;
      }, 5000);
    }
  });
}

export function initSlide() {
  const container = document.querySelector('.slide-container');
  container.innerHTML = `
    <div class="game-header">
      <div class="timer">Next spin in: <span id="countdown">20</span>s</div>
    </div>
    <div class="roulette-slide">
      <div class="slide-inner"></div>
      <div class="center-line"></div>
    </div>
    <div class="betting-spots">
      <div class="bet-spot" data-color="green" style="background: ${COLORS.GREEN}">
        <div class="multiplier">14x</div>
        <div class="input-container">
          <input type="number" min="0" value="0" class="bet-input" data-color="green">
        </div>
      </div>
      <div class="bet-spot" data-color="red" style="background: ${COLORS.RED}">
        <div class="multiplier">2x</div>
        <div class="input-container">
          <input type="number" min="0" value="0" class="bet-input" data-color="red">
        </div>
      </div>
      <div class="bet-spot" data-color="black" style="background: ${COLORS.BLACK}">
        <div class="multiplier">2x</div>
        <div class="input-container">
          <input type="number" min="0" value="0" class="bet-input" data-color="black">
        </div>
      </div>
    </div>
    <button id="place-bets" class="place-bets-btn">Place Bets</button>
    
    <div class="bets-list">
      <div class="bets-column">
        <h3 style="color: ${COLORS.GREEN}">Green Bets</h3>
        <div id="green-bets" class="bet-entries"></div>
      </div>
      <div class="bets-column">
        <h3 style="color: ${COLORS.RED}">Red Bets</h3>
        <div id="red-bets" class="bet-entries"></div>
      </div>
      <div class="bets-column">
        <h3 style="color: ${COLORS.BLACK}">Black Bets</h3>
        <div id="black-bets" class="bet-entries"></div>
      </div>
    </div>
    
    <div class="history"></div>
  `;

  // Setup bet input event listeners for color restrictions
  setupBetInputs();

  // Generate initial slide spots
  generateSlideSpots();
  
  // Start automatic spins
  startAutoSpin();
  
  // Add event listener for placing bets
  document.getElementById('place-bets').addEventListener('click', placeBets);
  
  // Update countdown every second
  setInterval(updateCountdown, 1000);

  // Setup WebSocket subscription for bets
  // room.collection('slide_bets').subscribe((bets) => {
  //   currentBets = {
  //     green: [],
  //     red: [],
  //     black: []
  //   };
    
  //   bets.forEach(bet => {
  //     if (!bet.color || !bet.amount || !bet.username) return;
  //     currentBets[bet.color].push({
  //       username: bet.username,
  //       amount: bet.amount
  //     });
  //   });
    
  //   updateBetsList();
  // });
  
  // Reset bet inputs to 100
  document.querySelectorAll('.bet-input').forEach(input => {
    input.value = 100;
  });
}

function setupBetInputs() {
  const inputs = document.querySelectorAll('.bet-input');
  
  inputs.forEach(input => {
    input.min = 0;  // Set minimum value
    
    input.addEventListener('input', (e) => {
      // Force non-negative values
      if (e.target.value < 0) {
        e.target.value = 0;
      }
      
      const amount = parseInt(e.target.value) || 0;
      const color = e.target.dataset.color;
      
      if (amount > 0) {
        if (selectedSide === null) {
          // First bet, set the side
          selectedSide = color === 'green' ? 'both' : (color === 'red' ? 'red' : 'black');
          updateInputRestrictions();
        }
      } else if (!anyActiveBets()) {
        // Reset selection if no active bets
        selectedSide = null;
        updateInputRestrictions();
      }
    });
  });
}

function anyActiveBets() {
  const inputs = document.querySelectorAll('.bet-input');
  return Array.from(inputs).some(input => (parseInt(input.value) || 0) > 0);
}

function updateInputRestrictions() {
  const inputs = document.querySelectorAll('.bet-input');
  
  inputs.forEach(input => {
    const color = input.dataset.color;
    
    if (selectedSide === null) {
      // No restrictions when no side selected
      input.disabled = false;
      input.parentElement.style.opacity = '1';
    } else if (selectedSide === 'both') {
      // Only allow green bets
      input.disabled = false;
      input.parentElement.style.opacity = '1';
    } else {
      // Allow betting on selected side and green only
      if (color === 'green' || color === selectedSide) {
        input.disabled = false;
        input.parentElement.style.opacity = '1';
      } else {
        input.disabled = true;
        input.value = 0;
        input.parentElement.style.opacity = '0.5';
      }
    }
  });
}

async function placeBets() {
  if (isSpinning) return;
  
  const inputs = document.querySelectorAll('.bet-input');
  let totalBet = 0;
  let hasValidBet = false;
  
  inputs.forEach(input => {
    const amount = parseInt(input.value) || 0;
    if (amount <= 0) {
      input.value = 0;
    } else {
      hasValidBet = true;
      totalBet += amount;
    }
  });
  
  if (!hasValidBet || totalBet <= 0) {
    showToast('Please place a bet greater than $0', 'warning');
    return;
  }
  
  if (!deductBet(totalBet)) {
    showToast('Insufficient balance!', 'error');
    return;
  }
  
  document.getElementById('place-bets').disabled = true;
  
  // Reset betting state
  selectedSide = null;
  updateInputRestrictions();
}

function updateBetsList() {
  // Update green bets
  const greenBets = document.getElementById('green-bets');
  greenBets.innerHTML = currentBets.green.map(bet => `
    <div class="bet-entry">
      <span class="bet-username">@${bet.username}</span>
      <span class="bet-amount">$${bet.amount}</span>
    </div>
  `).join('');

  // Update red bets
  const redBets = document.getElementById('red-bets');
  redBets.innerHTML = currentBets.red.map(bet => `
    <div class="bet-entry">
      <span class="bet-username">@${bet.username}</span>
      <span class="bet-amount">$${bet.amount}</span>
    </div>
  `).join('');

  // Update black bets
  const blackBets = document.getElementById('black-bets');
  blackBets.innerHTML = currentBets.black.map(bet => `
    <div class="bet-entry">
      <span class="bet-username">@${bet.username}</span>
      <span class="bet-amount">$${bet.amount}</span>
    </div>
  `).join('');
}

function startAutoSpin() {
  spinTimeout = setTimeout(() => {
    spin();
    startAutoSpin();
  }, getTimeUntilNextSpin());
}

function getTimeUntilNextSpin() {
  return Math.max(0, nextSpinTime - Date.now());
}

function updateCountdown() {
  const timeLeft = Math.ceil(getTimeUntilNextSpin() / 1000);
  document.getElementById('countdown').textContent = timeLeft;
}

function updateHistory(result) {
  const history = document.querySelector('.history');
  const dot = document.createElement('div');
  dot.className = 'history-dot';
  dot.style.background = COLORS[result.toUpperCase()];
  
  if (history.children.length >= 10) {
    history.removeChild(history.firstChild);
  }
  
  history.appendChild(dot);
}