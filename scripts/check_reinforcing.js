import fs from 'fs';
const items = JSON.parse(fs.readFileSync('./src/data/itemsCompendium.json', 'utf-8'));
const reinf = items.filter(i => i.name.toLowerCase().includes('reinforcing'));
console.log('Reinforcing items:', reinf.map(i => i.name));
