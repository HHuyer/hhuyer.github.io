import { deductBet, updateBalance, showResultModal } from './main.js';

let deck = [];
let playerHands = [[]];
let currentHand = 0;
let dealerHand = [];
let currentBet = 0;
let gameActive = false;
let hasDoubled = false;
let insuranceBet = 0;

const suits = ['♠', '♥', '♦', '♣'];
const values = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

export function initBlackjack() {
  deck = [];
  playerHands = [[]];
  currentHand = 0;
  dealerHand = [];
  currentBet = 0;
  gameActive = false;
  hasDoubled = false;
  insuranceBet = 0;
  
  const container = document.querySelector('.blackjack-container');
  container.innerHTML = `
    <div class="blackjack-table">
      <div class="dealer-hand">
        <h3>Dealer's Hand (<span id="dealer-total">0</span>)</h3>
        <div class="cards" id="dealer-cards"></div>
      </div>
      <div class="player-hands">
        <div class="player-hand">
          <h3>Your Hand (<span class="player-total">0</span>)</h3>
          <div class="cards" id="player-cards"></div>
        </div>
      </div>
    </div>
    <div class="controls centered-controls">
      <div class="input-container">
        <input type="number" id="blackjack-bet" value="100" min="1">
      </div>
      <button id="blackjack-deal" onclick="startBlackjack()">Deal</button>
      <button id="blackjack-hit" onclick="hit()" disabled>Hit</button>
      <button id="blackjack-stand" onclick="stand()" disabled>Stand</button>
      <button id="blackjack-double" onclick="double()" disabled>Double</button>
      <button id="blackjack-split" onclick="split()" disabled>Split</button>
    </div>
  `;
  
  renderHands();
}

function createDeck() {
  deck = [];
  for (let suit of suits) {
    for (let value of values) {
      deck.push({ suit, value });
    }
  }
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
}

function getCardValue(card) {
  if (!card) return 0;
  if (['J', 'Q', 'K'].includes(card.value)) return 10;
  if (card.value === 'A') return 11;
  return parseInt(card.value);
}

function getHandValue(hand = []) {
  let total = 0;
  let aces = 0;
  
  for (let card of hand) {
    if (!card) continue;
    if (card.value === 'A') {
      aces++;
    } else {
      total += getCardValue(card);
    }
  }
  
  let aceValue = '';
  for (let i = 0; i < aces; i++) {
    if (total >= 11) {
      total += 1;
      continue;
    }
    
    if (total + 11 <= 21) {
      total += 11;
      aceValue = '/1';
    } else {
      total += 1;
    }
  }
  
  return { total, aceValue };
}

function renderCard(card, hidden = false) {
  if (!card) return '';
  const color = card.suit === '♥' || card.suit === '♦' ? 'red' : 'black';
  return `
    <div class="card ${hidden ? 'hidden' : ''}" style="color: ${color}">
      ${hidden ? `
        <div class="card-back">
          <div class="back-pattern"></div>
        </div>
      ` : `
        <div class="card-value">${card.value}</div>
        <div class="card-suit">${card.suit}</div>
      `}
    </div>
  `;
}

function renderHands() {
  const dealerCards = document.getElementById('dealer-cards');
  const showAllDealerCards = !gameActive || currentHand >= playerHands.length;
  
  dealerCards.innerHTML = dealerHand.map((card, index) => 
    renderCard(card, !showAllDealerCards && index === 1)
  ).join('');

  const dealerTotal = document.getElementById('dealer-total');
  if (showAllDealerCards) {
    const { total, aceValue } = getHandValue(dealerHand);
    const isDealerBJ = dealerHand.length === 2 && total === 21;
    dealerTotal.textContent = isDealerBJ ? 'BJ' : (aceValue ? `${total}/${total-10}` : total);
  } else {
    dealerTotal.textContent = getCardValue(dealerHand[0]);
  }

  const playerHandsDiv = document.querySelector('.player-hands');
  playerHandsDiv.innerHTML = playerHands.map((hand, index) => {
    const { total, aceValue } = getHandValue(hand);
    const isBlackjack = hand.length === 2 && total === 21;
    return `
      <div class="player-hand ${index === currentHand ? 'active' : ''}">
        <h3>Your Hand ${playerHands.length > 1 ? (index + 1) : ''} 
        (<span class="player-total">${isBlackjack ? 'BJ' : (aceValue ? `${total}/${total-10}` : total)}</span>)</h3>
        <div class="cards">
          ${hand.map(card => renderCard(card)).join('')}
        </div>
      </div>
    `;
  }).join('');
}

async function dealCard(isPlayer = true, handIndex = 0) {
  if (deck.length === 0) createDeck();
  
  const card = deck.pop();
  if (!card) return null;

  if (isPlayer) {
    playerHands[handIndex].push(card);
  } else {
    dealerHand.push(card);
  }
  
  const tempCard = document.createElement('div');
  tempCard.className = 'dealing-card';
  
  const color = card.suit === '♥' || card.suit === '♦' ? 'red' : 'black';
  
  if (!(!isPlayer && dealerHand.length === 2)) {
    tempCard.innerHTML = `
      <div class="card-value" style="color: ${color}">${card.value}</div>
      <div class="card-suit" style="color: ${color}">${card.suit}</div>
    `;
  } else {
    tempCard.className = 'dealing-card hidden';
    tempCard.style.background = 'var(--accent)';
  }
  
  document.body.appendChild(tempCard);

  const targetContainer = isPlayer ? 
    document.querySelector(`.player-hand:nth-child(${handIndex + 1}) .cards`) :
    document.getElementById('dealer-cards');
  
  if (!targetContainer) {
    document.body.removeChild(tempCard);
    return card;
  }

  const targetRect = targetContainer.getBoundingClientRect();
  const existingCards = targetContainer.querySelectorAll('.card').length;
  
  const startX = window.innerWidth;
  const startY = window.innerHeight / 2;
  
  const cardWidth = 100;
  const cardSpacing = 10;
  const containerCenter = targetRect.left + (targetRect.width / 2);
  const totalCardsWidth = (existingCards + 1) * (cardWidth + cardSpacing) - cardSpacing;
  const targetX = containerCenter - (totalCardsWidth / 2) + (existingCards * (cardWidth + cardSpacing));
  const targetY = targetRect.top;

  tempCard.style.left = `${startX}px`;
  tempCard.style.top = `${startY}px`;
  
  return new Promise(resolve => {
    gsap.to(tempCard, {
      left: targetX,
      top: targetY,
      rotation: Math.random() * 0.4 - 0.2,
      duration: 0.6,
      ease: "power1.inOut",
      onComplete: () => {
        document.body.removeChild(tempCard);
        renderHands();
        resolve(card);
      }
    });
  });
}

async function dealInitialCards() {
  await dealCard(true);  
  await dealCard(false); 
  await dealCard(true);  
  await dealCard(false);
  
  if (dealerHand[0].value === 'A') {
    offerInsurance();
  }
  
  document.getElementById('blackjack-hit').disabled = false;
  document.getElementById('blackjack-stand').disabled = false;
  document.getElementById('blackjack-double').disabled = false;
  
  const canSplitHand = canSplit();
  document.getElementById('blackjack-split').disabled = !canSplitHand;
  
  if (getHandValue(playerHands[0]).total === 21) {
    await stand();
  }
}

function offerInsurance() {
  const playerHasBlackjack = getHandValue(playerHands[0]).total === 21 && playerHands[0].length === 2;
  
  const insuranceModal = document.createElement('div');
  insuranceModal.className = 'insurance-modal';
  insuranceModal.innerHTML = `
    <div class="insurance-content">
      ${playerHasBlackjack ? `
        <p>Take Even Money?</p>
        <p>Guaranteed 2x payout</p>
      ` : `
        <p>Insurance?</p>
        <p>Cost: $${(currentBet/2).toFixed(2)}</p>
      `}
      <div class="insurance-buttons">
        <button onclick="takeInsurance()">Yes</button>
        <button onclick="declineInsurance()">No</button>
      </div>
    </div>
  `;
  document.body.appendChild(insuranceModal);
}

export async function takeInsurance() {
  const playerHasBlackjack = getHandValue(playerHands[0]).total === 21 && playerHands[0].length === 2;
  
  if (playerHasBlackjack) {
    updateBalance(currentBet * 2);
    document.querySelector('.insurance-modal').remove();
    gameActive = false;
    document.getElementById('blackjack-deal').disabled = false;
    return;
  }

  const insuranceCost = currentBet/2;
  if (!deductBet(insuranceCost)) {
    declineInsurance();
    return;
  }
  
  insuranceBet = insuranceCost;
  document.querySelector('.insurance-modal').remove();
  
  if (getHandValue(dealerHand).total === 21) {
    updateBalance(insuranceBet * 3);
  }
}

export function declineInsurance() {
  document.querySelector('.insurance-modal').remove();
}

export async function startBlackjack() {
  const bet = parseInt(document.getElementById('blackjack-bet').value);
  if (!deductBet(bet)) return;
  
  document.getElementById('dealer-cards').innerHTML = '';
  document.querySelectorAll('.player-hands .cards').forEach(el => {
    el.innerHTML = '';
  });
  document.getElementById('dealer-total').textContent = '0';
  document.querySelectorAll('.player-total').forEach(el => {
    el.textContent = '0';
  });
  
  currentBet = bet;
  gameActive = true;
  hasDoubled = false;
  currentHand = 0;
  playerHands = [[]];
  dealerHand = [];
  insuranceBet = 0;
  
  createDeck();
  document.getElementById('blackjack-deal').disabled = true;
  document.getElementById('blackjack-split').disabled = true;
  
  await new Promise(resolve => setTimeout(resolve, 100));
  
  await dealInitialCards();
}

export async function hit() {
  if (!gameActive) return;
  
  await dealCard(true, currentHand);
  
  const value = getHandValue(playerHands[currentHand]).total;
  if (value > 21) {
    if (currentHand < playerHands.length - 1) {
      currentHand++;
      document.getElementById('blackjack-double').disabled = false;
      renderHands();
    } else {
      await stand();
    }
  } else if (value === 21) {
    if (currentHand < playerHands.length - 1) {
      currentHand++;
      document.getElementById('blackjack-double').disabled = false;
      renderHands();
    } else {
      await stand();
    }
  }
  
  document.getElementById('blackjack-double').disabled = true;
  document.getElementById('blackjack-split').disabled = true;
}

export async function stand() {
  if (!gameActive) return;
  
  document.getElementById('blackjack-hit').disabled = true;
  document.getElementById('blackjack-stand').disabled = true;
  document.getElementById('blackjack-double').disabled = true;
  document.getElementById('blackjack-split').disabled = true;
  
  if (currentHand < playerHands.length - 1) {
    currentHand++;
    renderHands();
    return;
  }
  
  gameActive = false;
  
  renderHands();
  
  await new Promise(resolve => setTimeout(resolve, 500));
  
  while (getHandValue(dealerHand).total < 17) {
    await dealCard(false);
  }
  
  const dealerValue = getHandValue(dealerHand).total;
  let totalWin = 0;
  let totalBet = currentBet;
  
  playerHands.forEach((hand, index) => {
    const playerValue = getHandValue(hand).total;
    const betAmount = hasDoubled && index === playerHands.length - 1 ? currentBet * 2 : currentBet;
    totalBet = betAmount;
    
    if (playerValue <= 21) {
      if (dealerValue > 21 || playerValue > dealerValue) {
        if (playerValue === 21 && hand.length === 2) {
          totalWin += betAmount * 2.5; 
        } else {
          totalWin += betAmount * 2; 
        }
      } else if (playerValue === dealerValue) {
        totalWin += betAmount; 
      }
    }
  });
  
  if (totalWin > 0) {
    updateBalance(totalWin); 
    showResultModal(true, totalWin - totalBet);
  } else {
    showResultModal(false, totalBet);
  }
  
  document.getElementById('blackjack-deal').disabled = false;
  
  renderHands();
}

export async function double() {
  if (!gameActive || !deductBet(currentBet)) return;
  
  document.getElementById('blackjack-hit').disabled = true;
  document.getElementById('blackjack-stand').disabled = true;
  document.getElementById('blackjack-double').disabled = true;
  document.getElementById('blackjack-split').disabled = true;
  
  hasDoubled = true;
  await dealCard(true, currentHand);
  await stand();
}

export async function split() {
  if (!gameActive || !canSplit() || !deductBet(currentBet)) return;
  
  const card = playerHands[currentHand].pop();
  playerHands.push([card]);
  
  await dealCard(true, currentHand);
  await dealCard(true, playerHands.length - 1);
  
  document.getElementById('blackjack-split').disabled = true;
  renderHands();
}

function canSplit() {
  const hand = playerHands[currentHand];
  if (!hand || hand.length !== 2) return false;
  return getCardValue(hand[0]) === getCardValue(hand[1]) && playerHands.length < 4;
}

window.startBlackjack = startBlackjack;
window.hit = hit;
window.stand = stand;
window.double = double;
window.split = split;
window.takeInsurance = takeInsurance;
window.declineInsurance = declineInsurance;