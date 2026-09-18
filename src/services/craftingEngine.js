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
 */
export function getDailyEarnIncomeRate(level = 1, rank = 1) {
  const safeLevel = Math.max(0, Math.min(20, Number(level) || 0));
  const safeRank = Math.max(0, Math.min(4, Number(rank) || 0));
  const row = EARN_INCOME_TABLE[safeLevel] || EARN_INCOME_TABLE[0];
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

/**
 * Checks if item requires formula and whether crafter knows it
 */
export function checkHasFormula(item, character) {
  if (!character || !item) return false;
  const formulas = character.formulas || [];
  const itemName = (item.name || '').toLowerCase().trim();
  const itemId = (item.id || '').toLowerCase().trim();

  return formulas.some(f => {
    const fStr = String(f).toLowerCase().trim();
    return fStr === itemName || fStr === itemId || itemName.includes(fStr) || fStr.includes(itemName);
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
