/**
 * Character Importer Service for EvilTools
 * Supports Foundry VTT PF2e Actor JSON & Pathbuilder 2e JSON exports
 */

/**
 * Normalizes copper value into PP, GP, SP, CP
 */
export function copperToWealth(copper = 0) {
  const total = Math.max(0, Math.round(copper));
  const pp = Math.floor(total / 1000);
  const remPP = total % 1000;
  const gp = Math.floor(remPP / 100);
  const remGP = remPP % 100;
  const sp = Math.floor(remGP / 10);
  const cp = remGP % 10;
  return { pp, gp, sp, cp, totalCopper: total };
}

/**
 * Converts PP, GP, SP, CP to total copper
 */
export function wealthToCopper(wealth = { pp: 0, gp: 0, sp: 0, cp: 0 }) {
  return (wealth.pp || 0) * 1000 + (wealth.gp || 0) * 100 + (wealth.sp || 0) * 10 + (wealth.cp || 0);
}

/**
 * Formats wealth into a readable string
 */
export function formatWealth(wealth = { pp: 0, gp: 0, sp: 0, cp: 0 }) {
  const parts = [];
  if (wealth.pp > 0) parts.push(`${wealth.pp} pp`);
  if (wealth.gp > 0) parts.push(`${wealth.gp} gp`);
  if (wealth.sp > 0) parts.push(`${wealth.sp} sp`);
  if (wealth.cp > 0 || parts.length === 0) parts.push(`${wealth.cp || 0} cp`);
  return parts.join(', ');
}

/**
 * Translates rank number (0..4 or 0..8) to standard rank (0=Untrained, 1=Trained, 2=Expert, 3=Master, 4=Legendary)
 */
export function normalizeRank(rawRank = 0) {
  const r = Number(rawRank) || 0;
  if (r >= 8) return 4; // Legendary (Pathbuilder 8)
  if (r >= 6) return 3; // Master (Pathbuilder 6)
  if (r >= 4) return 2; // Expert (Pathbuilder 4)
  if (r >= 2) return 1; // Trained (Pathbuilder 2)
  if (r === 1) return 1; // Trained (Foundry 1)
  return 0; // Untrained
}

export const RANK_NAMES = ['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'];

/**
 * Downloads data as a JSON file in the browser
 */
export function downloadJSON(data, filename = 'character.json') {
  const jsonStr = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports a single character to an EvilTools JSON file
 */
export function exportCharacterJSON(character, projects = [], craftHistory = [], scribeHistory = [], earningsHistory = []) {
  if (!character) return null;
  const safeName = (character.name || 'Hero').replace(/[^a-zA-Z0-9_-]/g, '_');
  const filename = `${safeName}_Lvl${character.level || 1}_EvilTools.json`;

  const payload = {
    schema: 'eviltools-character-v1',
    exportedAt: new Date().toISOString(),
    version: '1.0',
    character: {
      ...character,
      id: character.id || `char-${Date.now()}`
    },
    downtimeProjects: projects.filter(p => p.characterId ? p.characterId === character.id : true),
    craftHistory,
    scribeHistory,
    earningsHistory
  };

  downloadJSON(payload, filename);
  return payload;
}

/**
 * Exports all characters & downtime records to a complete party backup JSON file
 */
export function exportRosterBackupJSON(characters = [], downtimeProjects = [], craftHistory = [], scribeHistory = [], earningsHistory = []) {
  const filename = `EvilTools_PartyBackup_${new Date().toISOString().slice(0, 10)}.json`;

  const payload = {
    schema: 'eviltools-roster-v1',
    exportedAt: new Date().toISOString(),
    version: '1.0',
    characters,
    downtimeProjects,
    craftHistory,
    scribeHistory,
    earningsHistory
  };

  downloadJSON(payload, filename);
  return payload;
}

/**
 * Parses native EvilTools Character format
 */
function parseEvilToolsCharacter(char, root = {}) {
  const pp = Number(char.wealth?.pp) || 0;
  const gp = Number(char.wealth?.gp) || 0;
  const sp = Number(char.wealth?.sp) || 0;
  const cp = Number(char.wealth?.cp) || 0;
  const totalCopper = pp * 1000 + gp * 100 + sp * 10 + cp;

  return {
    id: char.id || `char-eviltools-${Date.now()}`,
    name: char.name || 'Hero',
    level: Math.max(1, Math.min(20, Number(char.level) || 1)),
    characterClass: char.characterClass || 'Adventurer',
    source: 'eviltools',
    avatar: char.avatar || '',
    wealth: { pp, gp, sp, cp, totalCopper },
    skills: {
      crafting: { ...(char.skills?.crafting || { rank: 1, mod: 7, rankName: 'Trained' }) },
      performance: { ...(char.skills?.performance || { rank: 0, mod: 0, rankName: 'Untrained' }) },
      arcana: { ...(char.skills?.arcana || { rank: 1, mod: 7, rankName: 'Trained' }) },
      nature: { ...(char.skills?.nature || { rank: 0, mod: 0, rankName: 'Untrained' }) },
      occultism: { ...(char.skills?.occultism || { rank: 0, mod: 0, rankName: 'Untrained' }) },
      religion: { ...(char.skills?.religion || { rank: 0, mod: 0, rankName: 'Untrained' }) }
    },
    loreSkills: Array.isArray(char.loreSkills) ? char.loreSkills.map(l => ({ ...l })) : [],
    feats: {
      alchemicalCrafting: !!char.feats?.alchemicalCrafting,
      magicalCrafting: !!char.feats?.magicalCrafting,
      snareCrafting: !!char.feats?.snareCrafting,
      magicalShorthand: !!char.feats?.magicalShorthand,
      spellbookProdigy: !!char.feats?.spellbookProdigy,
      specialtyCrafting: !!char.feats?.specialtyCrafting,
      impeccableCrafting: !!char.feats?.impeccableCrafting,
      experiencedProfessional: !!char.feats?.experiencedProfessional,
      virtuosicPerformer: !!char.feats?.virtuosicPerformer,
      craftAnything: !!char.feats?.craftAnything,
      inventor: !!char.feats?.inventor,
      communalCrafting: !!char.feats?.communalCrafting,
      signatureCrafting: !!char.feats?.signatureCrafting,
      magicalScrounger: !!char.feats?.magicalScrounger,
      allFeatNames: char.feats?.allFeatNames || []
    },
    formulas: Array.isArray(char.formulas) ? [...char.formulas] : [],
    learnedSpells: Array.isArray(char.learnedSpells) ? [...char.learnedSpells] : [],
    spellcasting: {
      traditions: Array.isArray(char.spellcasting?.traditions) ? [...char.spellcasting.traditions] : [],
      entries: Array.isArray(char.spellcasting?.entries) ? [...char.spellcasting.entries] : []
    },
    importedProjects: root.downtimeProjects || [],
    importedCraftHistory: root.craftHistory || [],
    importedScribeHistory: root.scribeHistory || [],
    importedEarningsHistory: root.earningsHistory || []
  };
}

/**
 * Main parser entry point
 * @param {object|string} rawData 
 * @returns {object} Normalized Character Profile or Roster
 */
export function importCharacterJSON(rawData) {
  let json = rawData;
  if (typeof rawData === 'string') {
    try {
      json = JSON.parse(rawData);
    } catch (err) {
      throw new Error('Invalid JSON format: Could not parse character data.');
    }
  }

  if (!json || typeof json !== 'object') {
    throw new Error('Empty or invalid character payload.');
  }

  // 1. EvilTools Full Roster Backup
  if (json.schema === 'eviltools-roster-v1' || (Array.isArray(json.characters) && json.characters.length > 0)) {
    return {
      isRoster: true,
      characters: json.characters.map(c => parseEvilToolsCharacter(c)),
      downtimeProjects: json.downtimeProjects || [],
      craftHistory: json.craftHistory || [],
      scribeHistory: json.scribeHistory || [],
      earningsHistory: json.earningsHistory || []
    };
  }

  // 2. EvilTools Single Character export
  if (json.schema === 'eviltools-character-v1' || json.character) {
    return parseEvilToolsCharacter(json.character || json, json);
  }

  // 3. Direct EvilTools Character format
  if (json.skills && json.name && json.wealth && json.skills.crafting) {
    return parseEvilToolsCharacter(json);
  }

  // 4. Pathbuilder 2e JSON
  if (json.build) {
    return parsePathbuilderJSON(json.build);
  }

  // 5. Foundry VTT PF2e JSON
  if (json.system && (json.type === 'character' || json.name)) {
    return parseFoundryPF2eJSON(json);
  }

  throw new Error('Unrecognized format. Please provide a valid EvilTools, Pathbuilder 2e, or Foundry PF2e JSON file.');
}

/**
 * Parses Pathbuilder 2e JSON format
 */
function parsePathbuilderJSON(b) {
  const name = b.name || 'Pathbuilder Adventurer';
  const level = Number(b.level) || 1;
  const abilities = b.abilities || {};
  
  // Calculate ability modifiers
  const getMod = (score) => Math.floor(((Number(score) || 10) - 10) / 2);
  const intMod = getMod(abilities.int || 10);
  const wisMod = getMod(abilities.wis || 10);
  const chaMod = getMod(abilities.cha || 10);
  const dexMod = getMod(abilities.dex || 10);
  const strMod = getMod(abilities.str || 10);

  const profs = b.proficiencies || {};

  // Helper for skill modifier: (rankBonus + level) + abilityMod
  const calculateSkill = (skillKey, abilityMod) => {
    const rawRank = profs[skillKey] ?? 0;
    const rank = normalizeRank(rawRank);
    const profBonus = rank > 0 ? (rank * 2) + level : 0;
    const itemBonus = b.mods?.[skillKey.charAt(0).toUpperCase() + skillKey.slice(1)]?.['Item Bonus'] || 0;
    const totalMod = profBonus + abilityMod + itemBonus;
    return { rank, mod: totalMod, rankName: RANK_NAMES[rank] };
  };

  const skills = {
    crafting: calculateSkill('crafting', intMod),
    performance: calculateSkill('performance', chaMod),
    arcana: calculateSkill('arcana', intMod),
    nature: calculateSkill('nature', wisMod),
    occultism: calculateSkill('occultism', intMod),
    religion: calculateSkill('religion', wisMod)
  };

  // Lore skills from b.lores
  const loreSkills = [];
  if (Array.isArray(b.lores)) {
    for (let idx = 0; idx < b.lores.length; idx++) {
      const l = b.lores[idx];
      const lName = Array.isArray(l) ? l[0] : (l?.name || String(l));
      const rawRank = Array.isArray(l) ? l[1] : (l?.rank ?? 2);
      const rank = normalizeRank(rawRank);
      const profBonus = rank > 0 ? (rank * 2) + level : 0;
      const mod = profBonus + intMod;
      loreSkills.push({
        id: `lore-pb-${idx + 1}`,
        name: lName,
        rank,
        mod,
        rankName: RANK_NAMES[rank]
      });
    }
  }

  // Money
  const money = b.money || {};
  const pp = Number(money.pp) || 0;
  const gp = Number(money.gp) || 0;
  const sp = Number(money.sp) || 0;
  const cp = Number(money.cp) || 0;
  const totalCopper = pp * 1000 + gp * 100 + sp * 10 + cp;
  const wealth = { pp, gp, sp, cp, totalCopper };

  // Feats
  const rawFeats = (b.feats || []).map(f => Array.isArray(f) ? f[0] : (f.name || f));
  const specials = b.specials || [];
  const allFeatNames = [...rawFeats, ...specials].map(f => String(f).trim());

  const hasFeat = (query) => {
    const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    return allFeatNames.some(f => f.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q));
  };

  const feats = {
    alchemicalCrafting: hasFeat('Alchemical Crafting'),
    magicalCrafting: hasFeat('Magical Crafting'),
    snareCrafting: hasFeat('Snare Crafting'),
    magicalShorthand: hasFeat('Magical Shorthand'),
    spellbookProdigy: hasFeat('Spellbook Prodigy'),
    specialtyCrafting: hasFeat('Specialty Crafting'),
    impeccableCrafting: hasFeat('Impeccable Crafting'),
    experiencedProfessional: hasFeat('Experienced Professional'),
    virtuosicPerformer: hasFeat('Virtuosic Performer'),
    craftAnything: hasFeat('Craft Anything'),
    inventor: hasFeat('Inventor'),
    communalCrafting: hasFeat('Communal Crafting'),
    signatureCrafting: hasFeat('Signature Crafting'),
    magicalScrounger: hasFeat('Magical Scrounger'),
    craftersAppraisal: hasFeat("Crafter's Appraisal"),
    allFeatNames
  };

  // Formulas
  const formulas = [];
  if (Array.isArray(b.formula)) {
    for (const group of b.formula) {
      if (Array.isArray(group.known)) {
        formulas.push(...group.known);
      }
    }
  }

  // Spellcasting
  const spellcastingEntries = [];
  const traditions = new Set();

  if (Array.isArray(b.spellCasters)) {
    for (const sc of b.spellCasters) {
      const trad = (sc.magicTradition || 'arcane').toLowerCase();
      traditions.add(trad);
      const isWitch = (b.class || '').toLowerCase().includes('witch') || (sc.name || '').toLowerCase().includes('witch');
      const isWizard = (b.class || '').toLowerCase().includes('wizard') || (sc.name || '').toLowerCase().includes('wizard');
      
      const spellsKnown = [];
      if (Array.isArray(sc.spells)) {
        for (const spGroup of sc.spells) {
          if (Array.isArray(spGroup.list)) {
            spellsKnown.push(...spGroup.list);
          }
        }
      }

      spellcastingEntries.push({
        id: sc.name || `entry-${spellcastingEntries.length + 1}`,
        name: sc.name || `${b.class} Spellcasting`,
        tradition: trad,
        isWitch,
        isWizard,
        spells: spellsKnown
      });
    }
  }

  return {
    id: `char-pb-${Date.now()}`,
    name,
    level,
    characterClass: b.class || 'Adventurer',
    source: 'pathbuilder',
    avatar: '',
    wealth,
    skills,
    loreSkills,
    feats,
    formulas,
    spellcasting: {
      traditions: Array.from(traditions),
      entries: spellcastingEntries
    }
  };
}

/**
 * Parses Foundry VTT PF2e Actor JSON format
 */
function parseFoundryPF2eJSON(f) {
  const name = f.name || 'Foundry Character';
  const level = Number(f.system?.details?.level?.value) || 1;
  const img = f.img || f.prototypeToken?.texture?.src || '';

  // Extract skills
  const sysSkills = f.system?.skills || {};
  const abilities = f.system?.abilities || {};

  const getAbilityMod = (key) => Number(abilities[key]?.mod) || 0;

  const parseSkill = (key, abilityKey) => {
    const sk = sysSkills[key] || {};
    const rank = normalizeRank(sk.rank ?? 0);
    const profBonus = rank > 0 ? (rank * 2) + level : 0;
    const abilityMod = getAbilityMod(abilityKey);
    const itemBonus = Number(sk.item) || 0;
    const totalMod = sk.value ?? (profBonus + abilityMod + itemBonus);

    return { rank, mod: totalMod, rankName: RANK_NAMES[rank] };
  };

  const skills = {
    crafting: parseSkill('crafting', 'int'),
    performance: parseSkill('performance', 'cha'),
    arcana: parseSkill('arcana', 'int'),
    nature: parseSkill('nature', 'wis'),
    occultism: parseSkill('occultism', 'int'),
    religion: parseSkill('religion', 'wis')
  };

  // Money / Coins from items
  const items = Array.isArray(f.items) ? f.items : [];
  let pp = 0, gp = 0, sp = 0, cp = 0;

  for (const it of items) {
    if (it.type === 'treasure' && (it.system?.category === 'coin' || it.isCoin || it.name.toLowerCase().includes('piece'))) {
      const itName = (it.name || '').toLowerCase();
      const qty = Number(it.system?.quantity) || 1;
      if (itName.includes('platinum') || itName.includes('pp')) pp += qty;
      else if (itName.includes('gold') || itName.includes('gp')) gp += qty;
      else if (itName.includes('silver') || itName.includes('sp')) sp += qty;
      else if (itName.includes('copper') || itName.includes('cp')) cp += qty;
    }
  }
  const totalCopper = pp * 1000 + gp * 100 + sp * 10 + cp;
  const wealth = { pp, gp, sp, cp, totalCopper };

  // Feats
  const featItems = items.filter(it => it.type === 'feat');
  const allFeatNames = featItems.map(it => it.name.trim());

  const hasFeat = (query) => {
    const q = query.toLowerCase().replace(/[^a-z0-9]/g, '');
    return allFeatNames.some(f => f.toLowerCase().replace(/[^a-z0-9]/g, '').includes(q));
  };

  const feats = {
    alchemicalCrafting: hasFeat('Alchemical Crafting'),
    magicalCrafting: hasFeat('Magical Crafting'),
    snareCrafting: hasFeat('Snare Crafting'),
    magicalShorthand: hasFeat('Magical Shorthand'),
    spellbookProdigy: hasFeat('Spellbook Prodigy'),
    specialtyCrafting: hasFeat('Specialty Crafting'),
    impeccableCrafting: hasFeat('Impeccable Crafting'),
    experiencedProfessional: hasFeat('Experienced Professional'),
    virtuosicPerformer: hasFeat('Virtuosic Performer'),
    craftAnything: hasFeat('Craft Anything'),
    inventor: hasFeat('Inventor'),
    communalCrafting: hasFeat('Communal Crafting'),
    signatureCrafting: hasFeat('Signature Crafting'),
    magicalScrounger: hasFeat('Magical Scrounger'),
    craftersAppraisal: hasFeat("Crafter's Appraisal"),
    allFeatNames
  };

  // Known Formulas
  const formulas = [];
  const rawFormulas = f.system?.crafting?.formulas || [];
  for (const form of rawFormulas) {
    if (form.uuid) formulas.push(form.uuid);
    else if (typeof form === 'string') formulas.push(form);
  }
  // Also check items with type formula or formula books
  for (const it of items) {
    if (it.type === 'formula') formulas.push(it.name);
  }

  // Lore skills from Foundry items (type === 'lore')
  const loreItems = items.filter(it => it.type === 'lore');
  const loreSkills = loreItems.map((it, idx) => {
    const rawRank = it.system?.proficient?.value ?? 1;
    const rank = normalizeRank(rawRank);
    const mod = Number(it.system?.mod?.value) || (rank > 0 ? (rank * 2) + level + getAbilityMod('int') : 0);
    return {
      id: it._id || it.id || `lore-fvtt-${idx + 1}`,
      name: it.name || 'Lore',
      rank,
      mod,
      rankName: RANK_NAMES[rank]
    };
  });

  // Spellcasting entries & Known Spells
  const spellcastingEntries = [];
  const traditions = new Set();
  const spellEntries = items.filter(it => it.type === 'spellcastingEntry');
  const spells = items.filter(it => it.type === 'spell');

  // Detect class
  const classItem = items.find(it => it.type === 'class');
  const className = classItem?.name || (hasFeat('Wizard') ? 'Wizard' : hasFeat('Witch') ? 'Witch' : 'Adventurer');

  for (const se of spellEntries) {
    const trad = (se.system?.tradition?.value || se.tradition || 'arcane').toLowerCase();
    traditions.add(trad);
    const seName = se.name || '';
    const isWitch = seName.toLowerCase().includes('witch') || className.toLowerCase().includes('witch') || seName.toLowerCase().includes('familiar');
    const isWizard = seName.toLowerCase().includes('wizard') || className.toLowerCase().includes('wizard') || seName.toLowerCase().includes('spellbook');

    const entrySpells = spells
      .filter(sp => sp.system?.location?.value === se._id || sp.system?.location?.value === se.id)
      .map(sp => sp.name);

    spellcastingEntries.push({
      id: se._id || se.id,
      name: se.name,
      tradition: trad,
      isWitch,
      isWizard,
      spells: entrySpells
    });
  }

  return {
    id: `char-fvtt-${Date.now()}`,
    name,
    level,
    characterClass: className,
    source: 'foundry',
    avatar: img,
    wealth,
    skills,
    loreSkills,
    feats,
    formulas,
    spellcasting: {
      traditions: Array.from(traditions),
      entries: spellcastingEntries
    }
  };
}
