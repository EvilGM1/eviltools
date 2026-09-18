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
    .filter(t => t.length > 1 && !['the', 'of', 'rune'].includes(t));
}

export function checkHasFormula(item, character) {
  if (!character || !item) return false;
  const formulas = character.formulas || [];
  const itemName = (item.name || '').toLowerCase().trim();
  const itemId = (item.id || '').toLowerCase().trim();
  const itemTokens = cleanTokens(item.name || '');

  return formulas.some(f => {
    const fStr = String(f).toLowerCase().trim();
    if (fStr === itemName || fStr === itemId || itemName.includes(fStr) || fStr.includes(itemName)) {
      return true;
    }

    const fTokens = cleanTokens(fStr);
    if (fTokens.length >= 2 && fTokens.every(t => itemTokens.includes(t))) {
      return true;
    }
    if (fTokens.length === 1 && itemTokens.includes(fTokens[0]) && itemTokens.length <= 2) {
      return true;
    }

    return false;
  });
}

console.log('--- Testing Accurate Matcher ---');
for (const form of sylorFormulas) {
  const matches = items.filter(it => checkHasFormula(it, { formulas: [form] }));
  console.log(`Formula: "${form}" -> ${matches.length} items: [${matches.map(m => m.name).join(', ')}]`);
}
