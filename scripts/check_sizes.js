import fs from 'fs';

const items = JSON.parse(fs.readFileSync('./src/data/itemsCompendium.json', 'utf-8'));
const spells = JSON.parse(fs.readFileSync('./src/data/spellsCompendium.json', 'utf-8'));

console.log('Total items:', items.length);
console.log('Total spells:', spells.length);

const itemsNoDesc = items.map(i => ({
  id: i.id,
  name: i.name,
  level: i.level,
  price: i.price,
  rarity: i.rarity,
  type: i.type,
  category: i.category,
  traits: i.traits,
  isWand: i.isWand,
  isScroll: i.isScroll,
  spellRank: i.spellRank
}));

const spellsNoDesc = spells.map(s => ({
  id: s.id,
  name: s.name,
  rank: s.rank,
  traditions: s.traditions,
  rarity: s.rarity,
  traits: s.traits
}));

const noDescItemsSize = Buffer.byteLength(JSON.stringify(itemsNoDesc));
const noDescSpellsSize = Buffer.byteLength(JSON.stringify(spellsNoDesc));

console.log('Index size items without descriptions:', (noDescItemsSize / 1024).toFixed(1), 'KB');
console.log('Index size spells without descriptions:', (noDescSpellsSize / 1024).toFixed(1), 'KB');
