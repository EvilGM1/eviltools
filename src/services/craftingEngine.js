/**
 * Crafting Calculation Engine for EvilTools
 * Full Pathfinder 2e Remaster Rules for Instant and Downtime Crafting
 */
import { wealthToCopper, copperToWealth, formatWealth } from './characterImporter.js';

export const LEVEL_DCS = [
  14, 15, 16, 18, 19, 20, 22, 23, 24, 26,
  27, 28, 30, 31, 32, 34, 35, 36, 38, 39, 40
];

export const RARITY_DC_MODIFIERS = {
  common: 0,
  uncommon: 2,
  rare: 5,
  unique: 10
};

/**
 * Earn Income Table (daily copper reduction by crafter level & proficiency)
 * [Untrained, Trained, Expert, Master, Legendary]
 */
export const EARN_INCOME_TABLE = {
  0:  [1,   5,   5,   5,   5],
  1:  [2,   20,  20,  20,  20],
  2:  [4,   30,  30,  30,  30],
  3:  [8,   50,  50,  50,  50],
  4:  [10,  70,  80,  80,  80],
  5:  [20,  90,  100, 100, 100],
  6:  [30,  150, 200, 200, 200],
  7:  [40,  200, 250, 250, 250],
  8:  [50,  250, 300, 300, 300],
  9:  [60,  300, 400, 400, 400],
  10: [70,  400, 500, 600, 600],
  11: [80,  500, 600, 800, 800],
  12: [90,  600, 800, 1000, 1000],
  13: [100, 700, 1000, 1500, 1500],
  14: [150, 800, 1500, 2000, 2000],
  15: [200, 1000, 2000, 2800, 2800],
  16: [250, 1300, 2500, 3600, 4000],
  17: [300, 1500, 3000, 4500, 5500],
  18: [400, 2000, 4500, 7000, 9000],
  19: [600, 3000, 6000, 10000, 13000],
  20: [800, 4000, 7500, 15000, 20000]
};

/**
 * Calculates Crafting DC based on item level and rarity
 */
export function calculateCraftingDC(level = 0, rarity = 'common') {
  const baseDC = LEVEL_DCS[Math.max(0, Math.min(20, Number(level) || 0))] || 14;
  const mod = RARITY_DC_MODIFIERS[rarity.toLowerCase()] || 0;
  return baseDC + mod;
}

/**
 * Gets daily reduction rate in copper
 * Critical Success uses the Earn Income value for level + 1 (Remaster Crafting rules)
 */
export function getDailyEarnIncomeRate(level = 1, rank = 1, isCrit = false) {
  const baseLevel = Number(level) || 0;
  const effectiveLevel = isCrit ? Math.min(20, baseLevel + 1) : Math.max(0, Math.min(20, baseLevel));
  const safeRank = Math.max(0, Math.min(4, Number(rank) || 0));
  const row = EARN_INCOME_TABLE[effectiveLevel] || EARN_INCOME_TABLE[0];
  return row[safeRank] || 5;
}

/**
 * Parses price string (e.g. "60 gp", "4 gp", "2 sp") into copper value
 */
export function priceToCopper(priceStr = '0 gp') {
  if (typeof priceStr === 'number') return priceStr;
  if (!priceStr || typeof priceStr !== 'string') return 0;

  const clean = priceStr.toLowerCase().replace(/,/g, '');
  let copper = 0;

  const gpMatch = clean.match(/(\d+)\s*gp/);
  const spMatch = clean.match(/(\d+)\s*sp/);
  const cpMatch = clean.match(/(\d+)\s*cp/);
  const ppMatch = clean.match(/(\d+)\s*pp/);

  if (ppMatch) copper += parseInt(ppMatch[1], 10) * 1000;
  if (gpMatch) copper += parseInt(gpMatch[1], 10) * 100;
  if (spMatch) copper += parseInt(spMatch[1], 10) * 10;
  if (cpMatch) copper += parseInt(cpMatch[1], 10);

  if (!gpMatch && !spMatch && !cpMatch && !ppMatch) {
    const rawNum = parseInt(clean.replace(/[^\d]/g, ''), 10);
    if (!isNaN(rawNum)) copper = rawNum * 100; // Default to GP
  }

  return copper;
}

function cleanTokens(str) {
  return str
    .toLowerCase()
    .replace(/[+()]/g, ' ')
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(t => t.length > 0 && !['the', 'a', 'an', 'of', 'rune'].includes(t));
}

/**
 * Checks if item requires formula and whether crafter knows it
 */
export function checkHasFormula(item, character) {
  if (!character || !item) return false;
  const formulas = character.formulas || [];
  const itemName = (item.name || '').toLowerCase().trim();
  const itemId = (item.id || '').toLowerCase().trim();
  const itemTokens = cleanTokens(item.name || '');

  return formulas.some(f => {
    const fStr = String(f).toLowerCase().trim();
    if (fStr === itemName || fStr === itemId) return true;

    const fTokens = cleanTokens(fStr);
    if (fTokens.length === 0) return false;

    // 1. All formula tokens match in item name
    const allTokensMatch = fTokens.every(t => itemTokens.includes(t));
    if (allTokensMatch) return true;

    // 2. All item tokens match in formula tokens
    const allItemTokensMatch = itemTokens.length >= 2 && itemTokens.every(t => fTokens.includes(t));
    if (allItemTokensMatch) return true;

    // 3. Single specific item token matches (e.g. "Striking" for "Weapon Striking")
    if (itemTokens.length === 1 && fTokens.includes(itemTokens[0]) && !['potion', 'oil', 'scroll', 'wand', 'weapon', 'armor', 'shield', 'ring', 'cloak', 'deck'].includes(itemTokens[0])) {
      return true;
    }

    return false;
  });
}

/**
 * Evaluates d20 roll against DC
 */
export function evaluateDegree(rollTotal, dieResult, targetDC) {
  const diff = rollTotal - targetDC;
  let degree = 'failure';

  if (diff >= 10) degree = 'criticalSuccess';
  else if (diff >= 0) degree = 'success';
  else if (diff <= -10) degree = 'criticalFailure';
  else degree = 'failure';

  // Natural 20 / Natural 1 adjust degree by 1 step
  if (dieResult === 20) {
    if (degree === 'criticalFailure') degree = 'failure';
    else if (degree === 'failure') degree = 'success';
    else if (degree === 'success') degree = 'criticalSuccess';
  } else if (dieResult === 1) {
    if (degree === 'criticalSuccess') degree = 'success';
    else if (degree === 'success') degree = 'failure';
    else if (degree === 'failure') degree = 'criticalFailure';
  }

  return degree;
}

/**
 * Extracts / computes the material component cost in GP for spells with special cost entries
 * E.g. Raise Dead (Rank 6: 200 gp * target lvl, Rank 7: 400 gp * target lvl, etc.)
 */
export function extractSpellCostGp(spell, targetLevel = 1) {
  if (!spell || !spell.cost) return 0;
  const costStr = spell.cost.toLowerCase();
  
  // Specific handler for Raise Dead
  if (spell.name.toLowerCase() === 'raise dead') {
    const rank = Number(spell.rank) || 6;
    let multiplier = 200;
    if (rank === 7) multiplier = 400;
    else if (rank === 8) multiplier = 800;
    else if (rank === 9) multiplier = 1600;
    else if (rank === 10) multiplier = 3200;
    return Math.max(1, Number(targetLevel) || 1) * multiplier;
  }

  // Multiplier formulas (e.g. '10 gp x the target's level', '20 gp × the target's level', '15 gp per spell rank')
  const multMatch = costStr.match(/(\d+(?:,\d+)?)\s*gp\s*[×x*]\s*(?:the\s*)?(?:target|spell|caster|your|node|settlement|ritual)/i) ||
                    costStr.match(/(?:target|spell|caster|your|node|settlement|ritual)[^0-9]*[×x*]\s*(\d+(?:,\d+)?)\s*gp/i);
  if (multMatch) {
    const unitGp = parseFloat(multMatch[1].replace(/,/g, ''));
    return Math.max(1, Number(targetLevel) || 1) * unitGp;
  }

  // Check for simple flat gp: '(\d+) gp'
  const flatMatch = costStr.match(/(\d+(?:,\d+)?)\s*gp/i);
  if (flatMatch) {
    return parseFloat(flatMatch[1].replace(/,/g, ''));
  }

  // Check for sp: '(\d+) sp'
  const spMatch = costStr.match(/(\d+)\s*sp/i);
  if (spMatch) {
    return parseFloat(spMatch[1]) / 10;
  }

  return 0;
}

/**
 * Precious Materials Dictionary (Pathfinder 2e Remaster + Special Materials)
 * Prices stored in copper (1 gp = 100 cp)
 */
export const PRECIOUS_MATERIALS = {
  none: {
    id: 'none',
    name: 'Standard (Iron / Steel / Wood / Leather)',
    traits: [],
    grades: {
      standard: {
        id: 'standard',
        name: 'Standard',
        level: 0,
        weaponPrice: null,
        armorPrice: null,
        shieldPrice: null,
        minProficiency: 0
      }
    }
  },
  silver: {
    id: 'silver',
    name: 'Silver',
    description: 'Exploits weaknesses of werecreatures and undead, and bypasses devil resistances.',
    traits: ['silver'],
    types: ['weapon', 'armor', 'shield'],
    grades: {
      low: {
        id: 'low',
        name: 'Low-Grade',
        level: 2,
        weaponPrice: 4000, // 40 gp
        armorPrice: 14000, // 140 gp (Lvl 5 for armor)
        armorLevel: 5,
        shieldPrice: 4000,
        minProficiency: 2 // Expert
      },
      standard: {
        id: 'standard',
        name: 'Standard-Grade',
        level: 10,
        weaponPrice: 88000, // 880 gp
        armorPrice: 120000, // 1,200 gp (Lvl 11 for armor)
        armorLevel: 11,
        shieldPrice: 44000,
        minProficiency: 3 // Master
      },
      high: {
        id: 'high',
        name: 'High-Grade',
        level: 16,
        weaponPrice: 900000, // 9,000 gp
        armorPrice: 1400000, // 14,000 gp (Lvl 17 for armor)
        armorLevel: 17,
        shieldPrice: 900000,
        minProficiency: 4 // Legendary
      }
    }
  },
  obsidian: {
    id: 'obsidian',
    name: 'Obsidian (Volcanic Glass)',
    description: 'Honed to a microscopic razor edge. Yields deadly sharp blades and non-metallic protective stone armor.',
    traits: ['obsidian'],
    types: ['weapon', 'armor', 'shield'],
    grades: {
      low: {
        id: 'low',
        name: 'Low-Grade',
        level: 2,
        weaponPrice: 3500, // 35 gp
        armorPrice: 12000, // 120 gp (Lvl 5 for armor)
        armorLevel: 5,
        shieldPrice: 3500,
        minProficiency: 2 // Expert
      },
      standard: {
        id: 'standard',
        name: 'Standard-Grade',
        level: 9,
        weaponPrice: 70000, // 700 gp
        armorPrice: 100000, // 1,000 gp (Lvl 11 for armor)
        armorLevel: 11,
        shieldPrice: 40000,
        minProficiency: 3 // Master
      },
      high: {
        id: 'high',
        name: 'High-Grade',
        level: 16,
        weaponPrice: 800000, // 8,000 gp
        armorPrice: 1300000, // 13,000 gp (Lvl 17 for armor)
        armorLevel: 17,
        shieldPrice: 800000,
        minProficiency: 4 // Legendary
      }
    }
  },
  'cold-iron': {
    id: 'cold-iron',
    name: 'Cold Iron',
    description: 'Iron mined deep underground and forged at low heat; deals severe harm to demons and fey.',
    traits: ['cold-iron'],
    types: ['weapon', 'armor', 'shield'],
    grades: {
      low: {
        id: 'low',
        name: 'Low-Grade',
        level: 2,
        weaponPrice: 4000, // 40 gp
        armorPrice: 14000, // 140 gp (Lvl 5 for armor)
        armorLevel: 5,
        shieldPrice: 4000,
        minProficiency: 2
      },
      standard: {
        id: 'standard',
        name: 'Standard-Grade',
        level: 10,
        weaponPrice: 88000, // 880 gp
        armorPrice: 120000, // 1,200 gp (Lvl 11 for armor)
        armorLevel: 11,
        shieldPrice: 44000,
        minProficiency: 3
      },
      high: {
        id: 'high',
        name: 'High-Grade',
        level: 16,
        weaponPrice: 900000, // 9,000 gp
        armorPrice: 1400000, // 14,000 gp (Lvl 17 for armor)
        armorLevel: 17,
        shieldPrice: 900000,
        minProficiency: 4
      }
    }
  },
  adamantine: {
    id: 'adamantine',
    name: 'Adamantine',
    description: 'Ultra-dense black skymetal. Weapons slice through object hardness; armor dampens critical impacts.',
    traits: ['adamantine'],
    types: ['weapon', 'armor', 'shield'],
    grades: {
      standard: {
        id: 'standard',
        name: 'Standard-Grade',
        level: 11,
        weaponPrice: 140000, // 1,400 gp
        armorPrice: 160000, // 1,600 gp (Lvl 12 for armor)
        armorLevel: 12,
        shieldPrice: 140000,
        minProficiency: 3
      },
      high: {
        id: 'high',
        name: 'High-Grade',
        level: 17,
        weaponPrice: 1350000, // 13,500 gp
        armorPrice: 2100000, // 21,000 gp (Lvl 18 for armor)
        armorLevel: 18,
        shieldPrice: 1350000,
        minProficiency: 4
      }
    }
  },
  dawnsilver: {
    id: 'dawnsilver',
    name: 'Dawnsilver (Mithral)',
    description: 'Featherlight gleaming silver metal. Reduces bulk and strength requirements for armor.',
    traits: ['dawnsilver', 'mithral'],
    types: ['weapon', 'armor', 'shield'],
    grades: {
      standard: {
        id: 'standard',
        name: 'Standard-Grade',
        level: 11,
        weaponPrice: 140000, // 1,400 gp
        armorPrice: 160000, // 1,600 gp (Lvl 12 for armor)
        armorLevel: 12,
        shieldPrice: 140000,
        minProficiency: 3
      },
      high: {
        id: 'high',
        name: 'High-Grade',
        level: 17,
        weaponPrice: 1350000, // 13,500 gp
        armorPrice: 2100000, // 21,000 gp (Lvl 18 for armor)
        armorLevel: 18,
        shieldPrice: 1350000,
        minProficiency: 4
      }
    }
  },
  darkwood: {
    id: 'darkwood',
    name: 'Darkwood (Duskwood)',
    description: 'Wood that rivals forged steel in tensile strength while floating like cork; favored for bows and wooden shields.',
    traits: ['darkwood'],
    types: ['weapon', 'armor', 'shield'],
    grades: {
      standard: {
        id: 'standard',
        name: 'Standard-Grade',
        level: 8,
        weaponPrice: 44000, // 440 gp
        armorPrice: 60000, // 600 gp (Lvl 9 for armor)
        armorLevel: 9,
        shieldPrice: 44000,
        minProficiency: 3
      },
      high: {
        id: 'high',
        name: 'High-Grade',
        level: 15,
        weaponPrice: 580000, // 5,800 gp
        armorPrice: 900000, // 9,000 gp (Lvl 16 for armor)
        armorLevel: 16,
        shieldPrice: 580000,
        minProficiency: 4
      }
    }
  },
  dragonhide: {
    id: 'dragonhide',
    name: 'Dragonhide',
    description: 'Impenetrable cured scales harvested from true dragons. Non-metal with inherent elemental resistance.',
    traits: ['dragonhide'],
    types: ['armor', 'shield'],
    grades: {
      standard: {
        id: 'standard',
        name: 'Standard-Grade',
        level: 8,
        weaponPrice: 44000,
        armorPrice: 44000, // 440 gp
        armorLevel: 8,
        shieldPrice: 44000,
        minProficiency: 3
      },
      high: {
        id: 'high',
        name: 'High-Grade',
        level: 15,
        weaponPrice: 580000,
        armorPrice: 580000, // 5,800 gp
        armorLevel: 15,
        shieldPrice: 580000,
        minProficiency: 4
      }
    }
  },
  orichalcum: {
    id: 'orichalcum',
    name: 'Orichalcum',
    description: 'Inscrutable coppery skymetal saturated with planar time. Grants extra runes and rapid initiative.',
    traits: ['orichalcum'],
    types: ['weapon', 'armor', 'shield'],
    grades: {
      high: {
        id: 'high',
        name: 'High-Grade',
        level: 17,
        weaponPrice: 1800000, // 18,000 gp
        armorPrice: 2200000, // 22,000 gp (Lvl 18 for armor)
        armorLevel: 18,
        shieldPrice: 1800000,
        minProficiency: 4
      }
    }
  }
};

/**
 * Checks if an item is eligible for precious material selection (weapons, armors, shields).
 */
export function isMaterialEligible(item) {
  if (!item) return false;
  const type = (item.type || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const traits = (item.traits || []).map(t => String(t).toLowerCase());
  const name = (item.name || '').toLowerCase();

  // Exclude wands and scrolls
  if (item.isWand || item.isScroll || traits.includes('wand') || traits.includes('scroll')) return false;

  if (type === 'weapon' || cat === 'weapon' || traits.includes('weapon')) return true;
  if (type === 'armor' || cat === 'armor' || traits.includes('armor')) return true;
  if (type === 'shield' || cat === 'shield' || traits.includes('shield') || name.includes('shield')) return true;

  return false;
}

/**
 * Returns item classification: 'weapon', 'armor', or 'shield'
 */
export function getItemEquipmentType(item) {
  if (!item) return 'weapon';
  const type = (item.type || '').toLowerCase();
  const cat = (item.category || '').toLowerCase();
  const traits = (item.traits || []).map(t => String(t).toLowerCase());
  const name = (item.name || '').toLowerCase();

  if (type === 'shield' || cat === 'shield' || traits.includes('shield') || name.includes('shield')) {
    return 'shield';
  }
  if (type === 'armor' || cat === 'armor' || traits.includes('armor')) {
    return 'armor';
  }
  return 'weapon';
}

/**
 * Computes precious material attributes for an item.
 */
export function getPreciousMaterialDetails(materialId = 'none', gradeId = 'standard', item, basePriceCopper = 0, baseLevel = 0) {
  const material = PRECIOUS_MATERIALS[materialId] || PRECIOUS_MATERIALS.none;
  if (materialId === 'none') {
    return {
      material,
      grade: material.grades.standard,
      effectivePriceCopper: basePriceCopper,
      effectiveLevel: baseLevel,
      displayName: item?.name || 'Item',
      materialTraits: [],
      minProficiency: 0
    };
  }

  // Find grade
  const availableGrades = Object.values(material.grades);
  const grade = material.grades[gradeId] || availableGrades[0];
  const equipType = getItemEquipmentType(item);

  // Grade level
  let gradeLevel = grade.level;
  if (equipType === 'armor' && grade.armorLevel) {
    gradeLevel = grade.armorLevel;
  }
  const effectiveLevel = Math.max(Number(baseLevel) || 0, gradeLevel);

  // Grade price
  let gradePrice = grade.weaponPrice;
  if (equipType === 'armor' && grade.armorPrice) {
    gradePrice = grade.armorPrice;
  } else if (equipType === 'shield' && grade.shieldPrice) {
    gradePrice = grade.shieldPrice;
  }
  const effectivePriceCopper = gradePrice !== null ? Math.max(basePriceCopper, gradePrice) : basePriceCopper;

  // Formatted display name
  const cleanBaseName = item?.name || 'Item';
  const displayName = `${material.name.split(' ')[0]} ${cleanBaseName} (${grade.name})`;

  return {
    material,
    grade,
    effectivePriceCopper,
    effectiveLevel,
    displayName,
    materialTraits: material.traits || [],
    minProficiency: grade.minProficiency || 0
  };
}

