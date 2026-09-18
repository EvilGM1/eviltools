import fs from 'fs';

const items = JSON.parse(fs.readFileSync('./src/data/itemsCompendium.json', 'utf-8'));

const sylorFormulas = [
  "Reading Ring", "Traveling Companion's Chair", "Traveler's Chair", "Olfactory Stimulators", 
  "Magical Prosthetic Eye", "Magical Hearing Aid", "Impulse Control", "Guide Harness", 
  "Cantrip Deck (full pack)", "Cloak of Feline Rest", "Ring of Discretion", "Ring of Sigils", 
  "Versatile Tinderbox", "Memoir Map", "Mortal Chronicle", "Navigator's Star", "Eye Slash", 
  "Predictable Silver Piece", "Everlight Crystal", "Purifying Spoon (Tablespoon)", 
  "Weapon Striking", "Armor Potency +1", "Weapon Potency +1", "Reinforcing (Minor)", "Ghost Touch"
];

function cleanTokens(str) {
  return str
    .toLowerCase()
    .replace(/[+()]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 0 && !['the', 'a', 'an', 'of', 'rune'].includes(t));
}

function checkHasFormula(item, formulas) {
  const itemName = (item.name || '').toLowerCase().trim();
  const itemId = (item.id || '').toLowerCase().trim();
  const itemTokens = cleanTokens(item.name || '');

  return formulas.some(f => {
    const fStr = String(f).toLowerCase().trim();
    if (fStr === itemName || fStr === itemId || itemName.includes(fStr) || fStr.includes(itemName)) {
      return true;
    }

    const fTokens = cleanTokens(fStr);
    if (fTokens.length > 0 && fTokens.every(t => itemTokens.includes(t))) {
      return true;
    }

    return false;
  });
}

console.log('--- Matching All 25 Formulas ---');
const matchedItems = [];
for (const form of sylorFormulas) {
  const matches = items.filter(it => checkHasFormula(it, [form]));
  console.log(`Formula: "${form}" -> ${matches.length} items found: ${matches.map(m => m.name).slice(0, 3).join(', ')}`);
  matchedItems.push(...matches);
}

const uniqueMatched = Array.from(new Set(matchedItems.map(m => m.id)));
console.log(`\nUnique items matching Sylor's 25 formulas in catalog: ${uniqueMatched.length}`);
