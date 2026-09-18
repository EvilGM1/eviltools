import itemsIndex from '../data/itemsIndex.json';
import spellsIndex from '../data/spellsIndex.json';

export { itemsIndex, spellsIndex };

let itemsDescCache = null;
let spellsDescCache = null;

/**
 * Loads full item description asynchronously on demand
 * @param {string} itemId 
 * @returns {Promise<string>}
 */
export async function fetchItemDescription(itemId) {
  if (!itemId) return '';
  if (!itemsDescCache) {
    try {
      const module = await import('../data/itemsDescriptions.json');
      itemsDescCache = module.default || module;
    } catch (e) {
      console.warn('Could not load item descriptions chunk', e);
      return '';
    }
  }
  return itemsDescCache[itemId] || '';
}

/**
 * Loads full spell description asynchronously on demand
 * @param {string} spellId 
 * @returns {Promise<string>}
 */
export async function fetchSpellDescription(spellId) {
  if (!spellId) return '';
  if (!spellsDescCache) {
    try {
      const module = await import('../data/spellsDescriptions.json');
      spellsDescCache = module.default || module;
    } catch (e) {
      console.warn('Could not load spell descriptions chunk', e);
      return '';
    }
  }
  return spellsDescCache[spellId] || '';
}
