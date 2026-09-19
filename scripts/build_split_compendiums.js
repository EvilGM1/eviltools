import { ClassicLevel } from 'classic-level';
import fs from 'fs';
import path from 'path';

const equipmentPath = 'C:/Users/hisas/.gemini/antigravity/brain/66a2a09a-40b3-4b98-9728-c8034f3103ef/scratch/equipment';
const spellsPath = 'C:/Users/hisas/.gemini/antigravity/brain/66a2a09a-40b3-4b98-9728-c8034f3103ef/scratch/spells';

async function buildSplitCompendiums() {
  console.log('--- Processing Equipment ---');
  const eqDb = new ClassicLevel(equipmentPath, { valueEncoding: 'json' });
  await eqDb.open();
  
  const rawItems = [];
  for await (const value of eqDb.values()) {
    if (value && typeof value === 'object' && value.name && value.system) {
      rawItems.push(value);
    }
  }
  await eqDb.close();

  const itemsIndex = [];
  const itemsDescriptions = {};

  for (const doc of rawItems) {
    const sys = doc.system || {};
    const traits = sys.traits?.value || [];
    const rarity = sys.traits?.rarity || sys.rarity?.value || sys.rarity || 'common';
    const level = Number(sys.level?.value ?? sys.level ?? 0);

    const priceVal = sys.price?.value || sys.price || {};
    let priceStr = '0 gp';
    if (typeof priceVal === 'string') {
      priceStr = priceVal;
    } else {
      const parts = [];
      if (priceVal.pp) parts.push(`${priceVal.pp} pp`);
      if (priceVal.gp) parts.push(`${priceVal.gp} gp`);
      if (priceVal.sp) parts.push(`${priceVal.sp} sp`);
      if (priceVal.cp || parts.length === 0) parts.push(`${priceVal.cp || 0} cp`);
      priceStr = parts.join(', ');
    }

    const type = doc.type || 'equipment';
    const isWand = traits.includes('wand') || doc.name.toLowerCase().includes('magic wand') || doc.name.toLowerCase().includes('wand of');
    const isScroll = traits.includes('scroll') || doc.name.toLowerCase().includes('scroll of');
    const id = doc._id;

    let spellRank = null;
    if (isScroll || isWand) {
      const nameMatch = doc.name.match(/(\d+)(?:st|nd|rd|th)?-?(?:rank|level)/i);
      if (nameMatch) {
        spellRank = parseInt(nameMatch[1], 10);
      } else if (isScroll) {
        spellRank = Math.max(1, Math.min(10, Math.floor((level + 1) / 2)));
      } else if (isWand) {
        spellRank = Math.max(1, Math.min(9, Math.floor((level - 1) / 2)));
      }
    }

    itemsIndex.push({
      id,
      name: doc.name,
      level,
      price: priceStr,
      rarity: String(rarity).toLowerCase(),
      type,
      category: isWand ? 'wand' : isScroll ? 'scroll' : type,
      traits: Array.isArray(traits) ? traits : [],
      isWand,
      isScroll,
      spellRank
    });

    if (sys.description?.value) {
      itemsDescriptions[id] = sys.description.value;
    }
  }

  itemsIndex.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  fs.writeFileSync('./src/data/itemsIndex.json', JSON.stringify(itemsIndex), 'utf-8');
  fs.writeFileSync('./src/data/itemsDescriptions.json', JSON.stringify(itemsDescriptions), 'utf-8');
  console.log(`Saved ${itemsIndex.length} items to itemsIndex.json & itemsDescriptions.json`);

  console.log('\n--- Processing Spells ---');
  const spDb = new ClassicLevel(spellsPath, { valueEncoding: 'json' });
  await spDb.open();
  
  const rawSpells = [];
  for await (const value of spDb.values()) {
    if (value && typeof value === 'object' && value.name && value.system) {
      rawSpells.push(value);
    }
  }
  await spDb.close();

  const spellsIndex = [];
  const spellsDescriptions = {};

  for (const doc of rawSpells) {
    const sys = doc.system || {};
    const traits = sys.traits?.value || [];
    const traditions = sys.traits?.traditions || [];
    const rarity = sys.traits?.rarity || sys.rarity?.value || sys.rarity || 'common';
    const rank = Number(sys.level?.value ?? sys.rank?.value ?? sys.level ?? 1);
    const rawCost = typeof sys.cost?.value === 'string' ? sys.cost.value : (typeof sys.cost === 'string' ? sys.cost : '');
    const cost = rawCost.trim() || null;
    const id = doc._id;

    spellsIndex.push({
      id,
      name: doc.name,
      rank,
      traditions: Array.isArray(traditions) ? traditions.map(t => t.toLowerCase()) : ['arcane'],
      rarity: String(rarity).toLowerCase(),
      traits: Array.isArray(traits) ? traits : [],
      cost
    });

    if (sys.description?.value) {
      spellsDescriptions[id] = sys.description.value;
    }
  }

  spellsIndex.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

  fs.writeFileSync('./src/data/spellsIndex.json', JSON.stringify(spellsIndex), 'utf-8');
  fs.writeFileSync('./src/data/spellsDescriptions.json', JSON.stringify(spellsDescriptions), 'utf-8');
  console.log(`Saved ${spellsIndex.length} spells to spellsIndex.json & spellsDescriptions.json`);
}

buildSplitCompendiums().catch(console.error);
