/**
 * Earnings Calculation Engine for EvilTools
 * Full Pathfinder 2e Remaster Rules for Downtime Earn Income Activity
 */
import { LEVEL_DCS, EARN_INCOME_TABLE } from './craftingEngine.js';
import { copperToWealth, formatWealth } from './characterImporter.js';

export const SETTLEMENT_PRESETS = [
  { id: 'hamlet', name: 'Hamlet / Outpost', maxTaskLevel: 0, dc: 14, desc: 'Isolated villages, farming hamlets, frontier camps (Task Lvl 0)' },
  { id: 'village', name: 'Village', maxTaskLevel: 1, dc: 15, desc: 'Small rural communities (Task Lvl 1)' },
  { id: 'small_town', name: 'Small Town', maxTaskLevel: 2, dc: 16, desc: 'Minor river outposts, small trade junctions (Task Lvl 2)' },
  { id: 'town', name: 'Town', maxTaskLevel: 4, dc: 19, desc: 'Fortified regional trade hubs, mining settlements (Task Lvl 4)' },
  { id: 'city', name: 'City', maxTaskLevel: 7, dc: 23, desc: 'Major commercial centers & regional capitals (Task Lvl 7)' },
  { id: 'metropolis', name: 'Metropolis', maxTaskLevel: 10, dc: 27, desc: 'Sprawling continental hubs (Absalom, Katapesh, etc.) (Task Lvl 10)' },
  { id: 'planar', name: 'Planar Metropolis', maxTaskLevel: 15, dc: 34, desc: 'Extradimensional trade capitals (Axis, City of Brass) (Task Lvl 15)' },
  { id: 'custom', name: 'Custom Task Level', maxTaskLevel: 20, dc: 40, desc: 'Directly select any task level 0–20' }
];

/**
 * Calculates Earn Income DC based on task level (0-20)
 */
export function calculateEarnIncomeDC(taskLevel = 0) {
  const safeLvl = Math.max(0, Math.min(20, Number(taskLevel) || 0));
  return LEVEL_DCS[safeLvl] || 14;
}

/**
 * Gets daily earning rate in copper for a given task level, proficiency rank, and degree of success.
 * Remaster Rules:
 * - Critical Success: Earns at Task Level + 1 at the character's proficiency rank.
 * - Success: Earns at Task Level at the character's proficiency rank.
 * - Failure: Earns at Task Level at the Untrained rate (index 0).
 * - Critical Failure: Earns 0 copper.
 */
export function getDailyIncomeRate(taskLevel = 0, rank = 1, degreeOfSuccess = 'success') {
  const safeLvl = Math.max(0, Math.min(20, Number(taskLevel) || 0));
  const safeRank = Math.max(0, Math.min(4, Number(rank) || 0));

  if (degreeOfSuccess === 'criticalFailure') {
    return 0;
  }

  if (degreeOfSuccess === 'failure') {
    // Untrained rate for the task's level
    const row = EARN_INCOME_TABLE[safeLvl] || EARN_INCOME_TABLE[0];
    return row[0] || 1;
  }

  if (degreeOfSuccess === 'criticalSuccess') {
    // Task Level + 1 at character's rank (capped at 20)
    const effectiveLvl = Math.min(20, safeLvl + 1);
    const row = EARN_INCOME_TABLE[effectiveLvl] || EARN_INCOME_TABLE[20];
    return row[safeRank] || 5;
  }

  // Standard Success
  const row = EARN_INCOME_TABLE[safeLvl] || EARN_INCOME_TABLE[0];
  return row[safeRank] || 5;
}

/**
 * Computes job payout in copper and wealth breakdown for a given number of days.
 */
export function calculateJobPayout(dailyCopper = 0, days = 1) {
  const safeDays = Math.max(1, Number(days) || 1);
  const totalCopper = Math.max(0, Math.round(dailyCopper * safeDays));
  const wealth = copperToWealth(totalCopper);

  return {
    dailyCopper,
    days: safeDays,
    totalCopper,
    wealth,
    formatted: formatWealth(wealth)
  };
}

/**
 * Generates preview table of all 4 potential outcomes for the selected task level & rank.
 */
export function getPotentialOutcomesTable(taskLevel = 0, rank = 1, days = 1) {
  const degrees = ['criticalSuccess', 'success', 'failure', 'criticalFailure'];
  const labels = {
    criticalSuccess: 'Critical Success',
    success: 'Success',
    failure: 'Failure',
    criticalFailure: 'Critical Failure'
  };

  const descriptions = {
    criticalSuccess: `Earns at Task Level ${Math.min(20, taskLevel + 1)} rate`,
    success: `Earns at Task Level ${taskLevel} rate`,
    failure: `Earns at Task Level ${taskLevel} (Untrained rate)`,
    criticalFailure: 'Earns 0 cp & fired/lost job'
  };

  const results = {};
  for (const deg of degrees) {
    const dailyCopper = getDailyIncomeRate(taskLevel, rank, deg);
    const payout = calculateJobPayout(dailyCopper, days);
    results[deg] = {
      degree: deg,
      label: labels[deg],
      description: descriptions[deg],
      dailyCopper,
      dailyFormatted: formatWealth(copperToWealth(dailyCopper)),
      totalCopper: payout.totalCopper,
      totalWealth: payout.wealth,
      totalFormatted: payout.formatted
    };
  }
  return results;
}

/**
 * Assurance calculation:
 * Result is a flat 10 + proficiency bonus (rank * 2 + level) without rolling.
 */
export function calculateAssuranceScore(characterLevel = 1, rank = 1) {
  const safeRank = Math.max(0, Math.min(4, Number(rank) || 0));
  const safeLevel = Math.max(1, Math.min(20, Number(characterLevel) || 1));
  if (safeRank === 0) return 10; // Untrained cannot use Assurance
  const profBonus = (safeRank * 2) + safeLevel;
  return 10 + profBonus;
}

/**
 * Checks whether Assurance meets the DC
 */
export function evaluateAssurance(characterLevel = 1, rank = 1, targetDC = 15) {
  const score = calculateAssuranceScore(characterLevel, rank);
  const success = score >= targetDC;
  return {
    score,
    targetDC,
    meetsDC: success,
    degree: success ? 'success' : 'failure'
  };
}
