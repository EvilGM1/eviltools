import { ClassicLevel } from 'classic-level';
import fs from 'fs';
import path from 'path';

const equipmentPath = 'C:/Users/hisas/.gemini/antigravity/brain/66a2a09a-40b3-4b98-9728-c8034f3103ef/scratch/equipment';
const spellsPath = 'C:/Users/hisas/.gemini/antigravity/brain/66a2a09a-40b3-4b98-9728-c8034f3103ef/scratch/spells';

async function extractCompendiums() {
  console.log('--- Extracting Equipment Compendium ---');
  const eqDb = new ClassicLevel(equipmentPath, { valueEncoding: 'json' });
  await eqDb.open();
  
  const rawItems = [];
  for await (const value of eqDb.values()) {
    if (value && typeof value === 'object' && value.name && value.system) {
      rawItems.push(value);
    }
  }
  await eqDb.close();
  console.log(`Found ${rawItems.length} equipment items in Foundry pack!`);

  // Normalize items for EvilTools
  const items = rawItems.map(doc => {
    const sys = doc.system || {};
    const traits = sys.traits?.value || [];
    const rarity = sys.traits?.rarity || sys.rarity?.value || sys.rarity || 'common';
    const level = Number(sys.level?.value ?? sys.level ?? 0);

    // Format price
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
    const isWand = traits.includes('wand') || doc.name.toLowerCase().includes('magic wand');
    const isScroll = traits.includes('scroll') || doc.name.toLowerCase().includes('scroll of');

    return {
      id: doc._id || `item-${Date.now()}-${Math.random()}`,
      name: doc.name,
      level,
      price: priceStr,
      rarity: String(rarity).toLowerCase(),
      type,
      category: isWand ? 'wand' : isScroll ? 'scroll' : type,
      traits: Array.isArray(traits) ? traits : [],
      isWand,
      isScroll,
      spellRank: isWand || isScroll ? (level >= 3 ? Math.floor((level - 1) / 2) : 1) : null
    };
  });

  // Sort by level then name
  items.sort((a, b) => a.level - b.level || a.name.localeCompare(b.name));

  const itemsOutPath = path.resolve('./src/data/itemsCompendium.json');
  fs.writeFileSync(itemsOutPath, JSON.stringify(items, null, 2), 'utf-8');
  console.log(`Wrote ${items.length} items to ${itemsOutPath}`);

  console.log('\n--- Extracting Spells Compendium ---');
  const spDb = new ClassicLevel(spellsPath, { valueEncoding: 'json' });
  await spDb.open();
  
  const rawSpells = [];
  for await (const value of spDb.values()) {
    if (value && typeof value === 'object' && value.name && value.system) {
      rawSpells.push(value);
    }
  }
  await spDb.close();
  console.log(`Found ${rawSpells.length} spells in Foundry pack!`);

  const spells = rawSpells.map(doc => {
    const sys = doc.system || {};
    const traits = sys.traits?.value || [];
    const traditions = sys.traits?.traditions || [];
    const rarity = sys.traits?.rarity || sys.rarity?.value || sys.rarity || 'common';
    const rank = Number(sys.level?.value ?? sys.rank?.value ?? sys.level ?? 1);

    return {
      id: doc._id || `spell-${Date.now()}-${Math.random()}`,
      name: doc.name,
      rank,
      traditions: Array.isArray(traditions) ? traditions.map(t => t.toLowerCase()) : ['arcane'],
      rarity: String(rarity).toLowerCase(),
      traits: Array.isArray(traits) ? traits : []
    };
  });

  spells.sort((a, b) => a.rank - b.rank || a.name.localeCompare(b.name));

  const spellsOutPath = path.resolve('./src/data/spellsCompendium.json');
  fs.writeFileSync(spellsOutPath, JSON.stringify(spells, null, 2), 'utf-8');
  console.log(`Wrote ${spells.length} spells to ${spellsOutPath}`);

  // Test Sylor's formulas matching against the new items catalog!
  const sylorFormulas = [
    "Reading Ring", "Traveling Companion's Chair", "Traveler's Chair", "Olfactory Stimulators", 
    "Magical Prosthetic Eye", "Magical Hearing Aid", "Impulse Control", "Guide Harness", 
    "Cantrip Deck (full pack)", "Cloak of Feline Rest", "Ring of Discretion", "Ring of Sigils", 
    "Versatile Tinderbox", "Memoir Map", "Mortal Chronicle", "Navigator's Star", "Eye Slash", 
    "Predictable Silver Piece", "Everlight Crystal", "Purifying Spoon (Tablespoon)", 
    "Weapon Striking", "Armor Potency +1", "Weapon Potency +1", "Reinforcing (Minor)", "Ghost Touch"
  ];

  console.log('\n--- Checking Sylor 25 Formulas Matches ---');
  let matchedCount = 0;
  for (const form of sylorFormulas) {
    const fClean = form.toLowerCase().replace(/[^a-z0-9]/g, '');
    const found = items.filter(it => {
      const itClean = it.name.toLowerCase().replace(/[^a-z0-9]/g, '');
      return itClean === fClean || itClean.includes(fClean) || fClean.includes(itClean);
    });
    if (found.length > 0) {
      matchedCount++;
      console.log(`✓ "${form}" matched: ${found.map(i => i.name).slice(0, 2).join(', ')}`);
    } else {
      console.log(`✗ "${form}" NOT FOUND`);
    }
  }
  console.log(`\nTotal matched: ${matchedCount} / ${sylorFormulas.length}`);
}

extractCompendiums().catch(console.error);
