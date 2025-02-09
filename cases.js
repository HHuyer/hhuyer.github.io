import { deductBet, updateBalance, getBalance } from './main.js';

const CASE_TYPES = {
  basic: {
    name: "Basic Case",
    price: 10,
    items: [
      { name: "Common", chance: 0.7, multiplier: 0.5 },
      { name: "Rare", chance: 0.2, multiplier: 2 },
      { name: "Epic", chance: 0.08, multiplier: 5 },
      { name: "Legendary", chance: 0.02, multiplier: 25 }
    ]
  },
  premium: {
    name: "Premium Case",
    price: 50,
    items: [
      { name: "Rare", chance: 0.7, multiplier: 0.8 },
      { name: "Epic", chance: 0.2, multiplier: 3 },
      { name: "Legendary", chance: 0.08, multiplier: 8 },
      { name: "Mythical", chance: 0.02, multiplier: 40 }
    ]
  },
  elite: {
    name: "Elite Case",
    price: 100,
    items: [
      { name: "Epic", chance: 0.7, multiplier: 1.2 },
      { name: "Legendary", chance: 0.2, multiplier: 4 },
      { name: "Mythical", chance: 0.08, multiplier: 10 },
      { name: "Divine", chance: 0.02, multiplier: 60 }
    ]
  }
};

let selectedCase = 'basic';
let isOpening = false;

export function initCases() {
  const container = document.querySelector('#cases');
  // Reset case input to 100
  document.getElementById('cases-bet').value = 100;
  
  // Create case selector wheel
  const selectorContainer = document.createElement('div');
  selectorContainer.className = 'cases-selector';
  
  for (const [caseId, caseInfo] of Object.entries(CASE_TYPES)) {
    const caseOption = document.createElement('div');
    caseOption.className = `case-option ${caseId === selectedCase ? 'selected' : ''}`;
    caseOption.onclick = () => selectCase(caseId);
    caseOption.innerHTML = `
      <div class="case-name">${caseInfo.name}</div>
      <div></div>
      <div class="case-price">$${caseInfo.price}</div>
    `;
    selectorContainer.appendChild(caseOption);
  }
  
  const casesContainer = document.querySelector('#cases');
  casesContainer.insertBefore(selectorContainer, casesContainer.querySelector('.controls'));
  
  const display = document.querySelector('.cases-display');
  display.innerHTML = '';
  
  // Update bet input with selected case price
  document.getElementById('cases-bet').value = CASE_TYPES[selectedCase].price;
  document.getElementById('cases-bet').disabled = true;
}

function selectCase(caseId) {
  if (isOpening) return;
  
  selectedCase = caseId;
  document.querySelectorAll('.case-option').forEach(option => {
    option.classList.toggle('selected', option.querySelector('.case-name').textContent === CASE_TYPES[caseId].name);
  });
  
  document.getElementById('cases-bet').value = CASE_TYPES[caseId].price;
}

export function isCasesOpening() {
  return isOpening;
}

export function startCases() {
  if (isOpening) return;
  
  const caseInfo = CASE_TYPES[selectedCase];
  if (!deductBet(caseInfo.price)) return;
  
  const display = document.querySelector('.cases-display');
  display.innerHTML = '<div class="case"></div>';
  
  isOpening = true;
  document.getElementById('cases-start').disabled = true;
  
  const random = Math.random();
  let selectedItem;
  let currentChance = 0;
  
  for (const item of caseInfo.items) {
    currentChance += item.chance;
    if (random <= currentChance) {
      selectedItem = item;
      break;
    }
  }
  
  const caseElement = display.querySelector('.case');
  caseElement.classList.add('opening');
  
  setTimeout(() => {
    onCaseOpened(selectedItem, caseInfo);
    
    isOpening = false;
    document.getElementById('cases-start').disabled = false;
    
    setTimeout(() => {
      display.innerHTML = '';
    }, 1000);
  }, 1000);
}

function onCaseOpened(selectedItem, caseInfo) {
  const winAmount = (caseInfo.price * selectedItem.multiplier);
  updateBalance(winAmount); // Update with exact amount
  
  const display = document.querySelector('.cases-display');
  display.innerHTML = `
    <div class="case-result" style="color: ${getColorForItem(selectedItem.name)}">
      ${selectedItem.name}
      <br>
      Win: $${winAmount.toFixed(2)}
    </div>
  `;
}

function getColorForItem(name) {
  switch (name) {
    case "Common": return "#ffffff";
    case "Rare": return "#4a90e2";
    case "Epic": return "#9b4ae2";
    case "Legendary": return "#e24a4a";
    case "Mythical": return "#e2a44a";
    case "Divine": return "#44e2e2";
    default: return "#ffffff";
  }
}

// Remove the initCasesBetInput as it's no longer needed since price is fixed
export function initCasesBetInput() {}