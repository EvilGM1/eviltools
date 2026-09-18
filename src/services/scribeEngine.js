/**
 * Spell Learning & Scribing Engine for EvilTools
 * Official Pathfinder 2e Remaster Rules for Wizards and Witches
 */
import { RARITY_DC_MODIFIERS } from './craftingEngine.js';

export const TRADITION_SKILLS = {
  arcane: 'arcana',
  divine: 'religion',
  occult: 'occultism',
  primal: 'nature'
};

export const TRADITION_LABELS = {
  arcane: 'Arcane',
  divine: 'Divine',
  occult: 'Occult',
  primal: 'Primal'
};

export const SKILL_LABELS = {
  arcana: 'Arcana',
  religion: 'Religion',
  occultism: 'Occultism',
  nature: 'Nature',
  crafting: 'Crafting'
};

/**
 * Official Player Core Learn a Spell Table
 */
export const LEARN_A_SPELL_TABLE = {
  0: { rank: 0, label: 'Cantrip', priceInCopper: 200,   dc: 15, baseHours: 1 },
  1: { rank: 1, label: 'Rank 1',  priceInCopper: 200,   dc: 15, baseHours: 1 },
  2: { rank: 2, label: 'Rank 2',  priceInCopper: 600,   dc: 18, baseHours: 2 },
  3: { rank: 3, label: 'Rank 3',  priceInCopper: 1600,  dc: 20, baseHours: 3 },
  4: { rank: 4, label: 'Rank 4',  priceInCopper: 3600,  dc: 23, baseHours: 4 },
  5: { rank: 5, label: 'Rank 5',  priceInCopper: 7000,  dc: 26, baseHours: 5 },
  6: { rank: 6, label: 'Rank 6',  priceInCopper: 14000, dc: 28, baseHours: 6 },
  7: { rank: 7, label: 'Rank 7',  priceInCopper: 30000, dc: 31, baseHours: 7 },
  8: { rank: 8, label: 'Rank 8',  priceInCopper: 65000, dc: 34, baseHours: 8 },
  9: { rank: 9, label: 'Rank 9',  priceInCopper: 150000, dc: 36, baseHours: 9 },
  10: { rank: 10, label: 'Rank 10', priceInCopper: 700000, dc: 41, baseHours: 10 }
};

export const SCROLL_MARKET_PRICES = [300, 400, 1200, 3000, 7000, 15000, 30000, 60000, 130000, 300000, 800000];

/**
 * Calculates Target DC for a spell
 */
export function calculateSpellDC(rank = 1, rarity = 'common') {
  const safeRank = Math.max(0, Math.min(10, Number(rank) || 0));
  const tableData = LEARN_A_SPELL_TABLE[safeRank] || LEARN_A_SPELL_TABLE[1];
  const mod = RARITY_DC_MODIFIERS[rarity.toLowerCase()] || 0;
  return tableData.dc + mod;
}

/**
 * Calculates Time required for Learn a Spell
 * Remaster Rule: Magical Shorthand makes scribing a flat 10 minutes regardless of spell rank!
 */
export function calculateScribingTime(character, rank = 1) {
  const hasShorthand = character?.feats?.magicalShorthand || character?.feats?.spellbookProdigy;

  if (hasShorthand) {
    return {
      totalMinutes: 10,
      formatted: '10 minutes',
      timePerRank: '10 min (Magical Shorthand)'
    };
  }

  const safeRank = Math.max(0, Math.min(10, Number(rank) || 0));
  const hours = safeRank === 0 ? 1 : safeRank;
  return {
    totalMinutes: hours * 60,
    formatted: `${hours} hour${hours > 1 ? 's' : ''}`,
    timePerRank: '1 hour / rank'
  };
}
