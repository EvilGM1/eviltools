/**
 * EvilEmporium Engine for EvilTools
 * PF2e Remaster Dynamic Shop & Merchant Generator Engine
 */

export const SETTLEMENT_TIERS = {
  hamlet: { key: 'hamlet', label: 'Hamlet (Level 0)', level: 0 },
  village: { key: 'village', label: 'Village (Level 1)', level: 1 },
  town: { key: 'town', label: 'Town (Level 4)', level: 4 },
  city: { key: 'city', label: 'City (Level 7)', level: 7 },
  metropolis: { key: 'metropolis', label: 'Metropolis (Level 10)', level: 10 },
  custom: { key: 'custom', label: 'Custom Level Override', level: 1 }
};

export const SHOP_ARCHETYPES = {
  all: {
    key: 'all',
    label: 'All Items / Eclectic Bazaar',
    description: 'Unfiltered mix of gear, supplies, weapons, and curiosities.',
    types: ['weapon', 'armor', 'shield', 'consumable', 'equipment', 'backpack', 'treasure'],
    traits: []
  },
  general: {
    key: 'general',
    label: 'General Store / Outfitter',
    description: 'Everyday adventuring gear, provisions, tools, backpacks, and basic weapons.',
    types: ['equipment', 'backpack', 'consumable', 'weapon', 'armor'],
    traits: ['adventuring-gear', 'mundane', 'tool', 'consumable']
  },
  blacksmith: {
    key: 'blacksmith',
    label: 'Blacksmith / Armory',
    description: 'Weapons, armor, shields, and martial combat gear.',
    types: ['weapon', 'armor', 'shield'],
    traits: ['metal', 'iron', 'steel']
  },
  alchemist: {
    key: 'alchemist',
    label: 'Alchemist / Apothecary',
    description: 'Elixirs, potions, bombs, antidotes, and alchemical crafting tools.',
    types: ['consumable', 'equipment'],
    traits: ['alchemical', 'potion', 'elixir', 'bomb', 'poison', 'oil', 'healing']
  },
  magic: {
    key: 'magic',
    label: 'Magic Broker / Arcanist',
    description: 'Scrolls, wands, staves, talismans, and wondrous magical baubles.',
    types: ['consumable', 'equipment'],
    traits: ['magical', 'scroll', 'wand', 'staff', 'talisman', 'arcane', 'occult']
  },
  temple: {
    key: 'temple',
    label: 'Temple / Reliquary',
    description: 'Holy water, divine scrolls, healing draughts, and consecrated relics.',
    types: ['consumable', 'equipment'],
    traits: ['divine', 'holy', 'unholy', 'healing', 'vitality']
  },
  fletcher: {
    key: 'fletcher',
    label: 'Fletcher / Bowyer',
    description: 'Bows, crossbows, specialty ammunition, quivers, and ranged accessories.',
    types: ['weapon', 'consumable', 'equipment'],
    traits: ['bow', 'crossbow', 'ammunition', 'ranged', 'thrown']
  },
  curio: {
    key: 'curio',
    label: 'Curio Shop / Oddities',
    description: 'Rare trinkets, clockwork contraptions, eccentric relics, and unusual artifacts.',
    types: ['equipment', 'consumable', 'treasure'],
    traits: ['clockwork', 'uncommon', 'rare', 'artifact']
  }
};

export const SHOP_SIZES = {
  small: { key: 'small', label: 'Small (4–6 items)', min: 4, max: 6 },
  medium: { key: 'medium', label: 'Medium (7–10 items)', min: 7, max: 10 },
  large: { key: 'large', label: 'Large (11–16 items)', min: 11, max: 16 },
  custom: { key: 'custom', label: 'Custom Count', min: 1, max: 30 }
};

export const MERCHANT_ATTITUDES = {
  unfriendly: {
    key: 'unfriendly',
    label: 'Unfriendly',
    dcMod: 2,
    defaultVariance: 'fleece',
    flavor: 'Distrustful or sour. Drives a hard bargain and expects payment upfront.'
  },
  indifferent: {
    key: 'indifferent',
    label: 'Indifferent',
    dcMod: 0,
    defaultVariance: 'standard',
    flavor: 'Strictly business. Respects coin and adheres to fair-market prices.'
  },
  friendly: {
    key: 'friendly',
    label: 'Friendly',
    dcMod: -2,
    defaultVariance: 'motivated',
    flavor: 'Warm and accommodating. Willing to cut deals for trusted adventurers.'
  }
};

export const MARKET_VARIANCES = {
  fleece: {
    key: 'fleece',
    label: 'Fleece (125%)',
    multiplier: 1.25,
    description: 'High demand, local scarcity, or sour merchant pricing.'
  },
  standard: {
    key: 'standard',
    label: 'Standard (100%)',
    multiplier: 1.0,
    description: 'Baseline RAW PF2e market economy.'
  },
  motivated: {
    key: 'motivated',
    label: 'Motivated Seller (80%)',
    multiplier: 0.8,
    description: 'Surplus clearance, off-season stock, or bargained via Critical Success on Request.'
  }
};

// GM Core Table 2-11: Level-Based DCs
export const LEVEL_DCS = {
  0: 14, 1: 15, 2: 16, 3: 18, 4: 19, 5: 20,
  6: 22, 7: 23, 8: 24, 9: 26, 10: 27, 11: 28,
  12: 30, 13: 31, 14: 32, 15: 34, 16: 35, 17: 36,
  18: 38, 19: 39, 20: 40, 21: 42, 22: 44, 23: 46, 24: 48, 25: 50
};

export const PROCEDURAL_NAMES = {
  firstNames: [
    'Alden', 'Bree', 'Corin', 'Daelen', 'Elowen', 'Fintan', 'Garrick', 'Hestia',
    'Ignis', 'Jarek', 'Kaelen', 'Lysandra', 'Morgran', 'Nesta', 'Orin', 'Perrin',
    'Quin', 'Rhonen', 'Sylvie', 'Theron', 'Ulfric', 'Vesper', 'Wren', 'Xander',
    'Yvaine', 'Zephyr', 'Bramble', 'Gimlet', 'Brinna', 'Krag', 'Orik', 'Vael',
    'Kaelith', 'Zul', 'Torvin', 'Sariel', 'Fenwick', 'Beldon', 'Cassian', 'Mira'
  ],
  surnames: [
    'Ironbender', 'Brightwhistle', 'Copperkettle', 'Nightbreeze', 'Silverleaf',
    'Stonecutter', 'Gallowglass', 'Goldseeker', 'Rustmender', 'Ashford',
    'Clearwater', 'Oakhaven', 'Deepforge', 'Quickfinger', 'Emberfall',
    'Shadowstep', 'Highpeak', 'Stormstrider', 'Winterborn', 'Brassweaver',
    'Featherstone', 'Ironhoof', 'Sunwatcher', 'Pennyworth', 'Locke'
  ],
  shopTemplates: [
    'The {adj} {noun}',
    "{name}'s {specialty}",
    "The {creature}'s {noun}",
    '{adj} {specialty} Emporium',
    '{name} & Sons {specialty}'
  ],
  adjectives: [
    'Gilded', 'Brazen', 'Dusty', 'Singing', 'Iron', 'Velvet', 'Curious',
    'Rusty', 'Cunning', 'Silver', 'Shimmering', 'Sturdy', 'Prancing',
    'Hidden', 'Wandering', 'Midnight', 'Ancient', 'Thrifty', 'Gleaming'
  ],
  nouns: [
    'Anvil', 'Flask', 'Grimoire', 'Arrow', 'Kettle', 'Purse', 'Lantern',
    'Compass', 'Mortar', 'Cauldron', 'Scale', 'Bellows', 'Chisel',
    'Hourglass', 'Shield', 'Tankard', 'Coin', 'Thimble', 'Quill'
  ],
  creatures: [
    'Griffon', 'Dragon', 'Kobold', 'Raven', 'Badger', 'Manticore',
    'Owl', 'Hydra', 'Drake', 'Chimera', 'Goblin', 'Wyvern', 'Basilisk'
  ],
  specialties: [
    'Sundries', 'Oddities', 'Armory', 'Surplus', 'Concoctions', 'Relics',
    'Provisions', 'Apothecary', 'Emporium', 'Foundry', 'Outfitters', 'Treasures'
  ],
  quirks: [
    'Constantly polishing spectacles on an oily rag.',
    'Taps fingers rhythmically on the counter whenever coins jingle.',
    'Squints suspiciously at every coin before biting it to test purity.',
    'Speaks in an exaggerated theatrical whisper as if sharing state secrets.',
    'Has a friendly pet ferret nesting inside their wide coat sleeve.',
    'Constantly sniffs dried herbs from a fragrant pouch around their neck.',
    'Mutters lively commentary in Undercommon under their breath.',
    'Boasts relentlessly about having sold gear to famous Pathfinder heroes.',
    'Keeps a massive, notched warhammer prominently mounted behind the counter.',
    'Offers complimentary bitter herbal tea that smells like damp forest floor.',
    'Counts inventory items out loud in a nervous, rapid cadence.',
    'Insists that all merchandise was acquired through strictly legitimate salvage.',
    'Always wears heavy leather welder goggles, even indoors in dim candlelight.',
    'Chuckles heartily at their own jokes before finishing the punchline.'
  ]
};

export function getSettlementDC(level = 0) {
  const clamped = Math.max(0, Math.min(25, Number(level) || 0));
  return LEVEL_DCS[clamped] ?? (14 + clamped * 2);
}

export function priceToCopper(priceStr) {
  if (!priceStr) return 0;
  if (typeof priceStr === 'number') return priceStr;
  let total = 0;
  const parts = String(priceStr).split(/[,+]/);
  for (const part of parts) {
    const trimmed = part.trim();
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (match) {
      const amount = parseFloat(match[1]);
      const unit = match[2].toLowerCase();
      if (unit === 'pp') total += amount * 1000;
      else if (unit === 'gp') total += amount * 100;
      else if (unit === 'sp') total += amount * 10;
      else if (unit === 'cp') total += amount;
    }
  }
  return Math.round(total);
}

export function copperToCoins(copper = 0) {
  const total = Math.max(0, Math.round(Number(copper) || 0));
  const gp = Math.floor(total / 100);
  const rem1 = total % 100;
  const sp = Math.floor(rem1 / 10);
  const cp = rem1 % 10;

  const parts = [];
  if (gp > 0) parts.push(`${gp} gp`);
  if (sp > 0) parts.push(`${sp} sp`);
  if (cp > 0 || parts.length === 0) parts.push(`${cp} cp`);

  return {
    gp,
    sp,
    cp,
    totalCopper: total,
    str: parts.join(', ')
  };
}

export function calculateAdjustedPrice(baseCopper = 0, varianceKey = 'standard') {
  const variance = MARKET_VARIANCES[varianceKey] || MARKET_VARIANCES.standard;
  const multiplier = variance.multiplier;
  const adjustedCopper = Math.max(1, Math.round(baseCopper * multiplier));
  return {
    adjustedCopper,
    coins: copperToCoins(adjustedCopper),
    multiplier,
    varianceKey: variance.key,
    varianceLabel: variance.label
  };
}

export function sample(arr) {
  if (!arr || arr.length === 0) return null;
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateMerchantName() {
  const first = sample(PROCEDURAL_NAMES.firstNames) || 'Orik';
  const last = sample(PROCEDURAL_NAMES.surnames) || 'Copperkettle';
  return `${first} ${last}`;
}

export function generateQuirk() {
  return sample(PROCEDURAL_NAMES.quirks) || 'Constantly polishing spectacles on an oily rag.';
}

export function generateShopName(archetypeKey = 'general', merchantName = '') {
  const firstName = (merchantName.split(' ')[0]) || sample(PROCEDURAL_NAMES.firstNames);
  const adj = sample(PROCEDURAL_NAMES.adjectives);
  const noun = sample(PROCEDURAL_NAMES.nouns);
  const creature = sample(PROCEDURAL_NAMES.creatures);
  const specialty = sample(PROCEDURAL_NAMES.specialties);

  const template = sample(PROCEDURAL_NAMES.shopTemplates);
  return template
    .replace('{adj}', adj)
    .replace('{noun}', noun)
    .replace('{name}', firstName)
    .replace('{creature}', creature)
    .replace('{specialty}', specialty);
}

export function filterItemsForEmporium(items = [], {
  maxLevel = 4,
  archetypeKey = 'general',
  allowedRarities = ['common', 'uncommon']
} = {}) {
  const rarities = new Set(allowedRarities.map(r => r.toLowerCase()));
  const arch = SHOP_ARCHETYPES[archetypeKey] || SHOP_ARCHETYPES.all;

  return items.filter(item => {
    if (item.level > maxLevel) return false;
    const rarity = (item.rarity || 'common').toLowerCase();
    if (!rarities.has(rarity)) return false;

    const baseCopper = priceToCopper(item.price);
    if (baseCopper <= 0) return false;

    if (archetypeKey === 'all') return true;

    const typeMatch = arch.types.includes(item.type);
    const itemTraits = Array.isArray(item.traits) ? item.traits.map(t => String(t).toLowerCase()) : [];
    const itemName = item.name.toLowerCase();

    if (arch.traits.length > 0) {
      const traitMatch = arch.traits.some(t => 
        itemTraits.includes(t) || 
        itemName.includes(t) ||
        (t === 'uncommon' && rarity === 'uncommon') ||
        (t === 'rare' && rarity === 'rare')
      );

      if (archetypeKey === 'alchemist') {
        return typeMatch && (traitMatch || item.type === 'consumable');
      }
      if (archetypeKey === 'magic') {
        return traitMatch || itemTraits.includes('magical') || item.isWand || item.isScroll;
      }
      if (archetypeKey === 'blacksmith') {
        return typeMatch;
      }
      return typeMatch || traitMatch;
    }

    return typeMatch;
  });
}

/**
 * Rolls market variance based on merchant attitude tendencies.
 * @param {string} attitudeKey 'unfriendly' | 'indifferent' | 'friendly'
 * @returns {string} 'fleece' | 'standard' | 'motivated'
 */
export function rollVarianceForAttitude(attitudeKey = 'indifferent') {
  const roll = Math.random();
  if (attitudeKey === 'unfriendly') {
    // 75% Fleece, 25% Standard
    return roll < 0.75 ? 'fleece' : 'standard';
  }
  if (attitudeKey === 'friendly') {
    // 75% Motivated Seller, 25% Standard
    return roll < 0.75 ? 'motivated' : 'standard';
  }
  // Indifferent: 60% Standard, 20% Motivated, 20% Fleece
  if (roll < 0.20) return 'fleece';
  if (roll < 0.40) return 'motivated';
  return 'standard';
}

export function generateEmporiumShop({
  itemsData = [],
  settlementTier = 'town',
  settlementLevel = 4,
  archetypeKey = 'general',
  shopSizeKey = 'medium',
  customItemCount = 8,
  isShrewd = false,
  forcedAttitude = null,
  forcedVariance = null,
  allowedRarities = ['common', 'uncommon']
} = {}) {
  const candidatePool = filterItemsForEmporium(itemsData, {
    maxLevel: settlementLevel,
    archetypeKey,
    allowedRarities
  });

  const merchantName = generateMerchantName();
  const shopName = generateShopName(archetypeKey, merchantName);
  const quirk = generateQuirk();

  const attitudeKey = forcedAttitude || (
    Math.random() < 0.25 ? 'unfriendly' : Math.random() < 0.75 ? 'indifferent' : 'friendly'
  );
  const attitudeObj = MERCHANT_ATTITUDES[attitudeKey] || MERCHANT_ATTITUDES.indifferent;

  const varianceKey = forcedVariance || rollVarianceForAttitude(attitudeKey);

  let targetCount = 8;
  if (shopSizeKey === 'small') targetCount = Math.floor(Math.random() * 3) + 4;
  else if (shopSizeKey === 'medium') targetCount = Math.floor(Math.random() * 4) + 7;
  else if (shopSizeKey === 'large') targetCount = Math.floor(Math.random() * 6) + 11;
  else if (shopSizeKey === 'custom') targetCount = Math.max(1, Math.min(30, Number(customItemCount) || 8));

  // Shuffle pool
  const shuffled = [...candidatePool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  const selectedItems = shuffled.slice(0, Math.min(targetCount, shuffled.length)).map(item => {
    const baseCopper = priceToCopper(item.price);
    const adj = calculateAdjustedPrice(baseCopper, varianceKey);
    return {
      id: item.id,
      name: item.name,
      level: item.level,
      rarity: item.rarity,
      type: item.type,
      traits: item.traits || [],
      basePrice: item.price,
      baseCopper,
      adjustedCopper: adj.adjustedCopper,
      adjustedPriceStr: adj.coins.str
    };
  });

  const baseDC = getSettlementDC(settlementLevel);
  const shrewdBonus = isShrewd ? 2 : 0;
  const attitudeMod = attitudeObj.dcMod;

  return {
    shopId: Math.random().toString(36).substring(2, 9),
    shopName,
    merchant: {
      name: merchantName,
      quirk,
      attitudeKey,
      attitudeLabel: attitudeObj.label,
      attitudeFlavor: attitudeObj.flavor,
      isShrewd
    },
    settlement: {
      tierKey: settlementTier,
      level: settlementLevel
    },
    archetypeKey,
    archetypeLabel: SHOP_ARCHETYPES[archetypeKey]?.label || 'General Store',
    shopSizeKey,
    varianceKey,
    varianceLabel: MARKET_VARIANCES[varianceKey]?.label || 'Standard (100%)',
    socialProfile: {
      baseDC,
      totalWillDC: baseDC + shrewdBonus,
      makeImpressionDC: baseDC + shrewdBonus + attitudeMod,
      requestDC: baseDC + shrewdBonus + attitudeMod
    },
    items: selectedItems,
    poolCount: candidatePool.length
  };
}
