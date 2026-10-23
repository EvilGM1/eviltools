import React, { useState, useEffect, useMemo } from 'react';
import { X, Save, Shield, Hammer, BookOpen, Plus, Trash2, Coins, Sparkles, Wand2, Download, Search, Check, Sliders, RotateCcw } from 'lucide-react';
import { RANK_NAMES, wealthToCopper, copperToWealth, exportCharacterJSON } from '../services/characterImporter.js';
import { itemsIndex as itemsData } from '../services/compendiumLoader.js';

export const PF2E_CLASSES = [
  'Alchemist',
  'Animist',
  'Barbarian',
  'Bard',
  'Champion',
  'Cleric',
  'Commander',
  'Druid',
  'Exemplar',
  'Fighter',
  'Guardian',
  'Gunslinger',
  'Inventor',
  'Investigator',
  'Kineticist',
  'Magus',
  'Monk',
  'Necromancer',
  'Oracle',
  'Psychic',
  'Ranger',
  'Rogue',
  'Runesmith',
  'Sorcerer',
  'Summoner',
  'Swashbuckler',
  'Thaumaturge',
  'Witch',
  'Wizard',
  'Custom'
];

export const SPELLCASTER_CLASSES = [
  'Animist',
  'Bard',
  'Cleric',
  'Druid',
  'Magus',
  'Necromancer',
  'Oracle',
  'Psychic',
  'Sorcerer',
  'Summoner',
  'Witch',
  'Wizard'
];

export const TRADITION_OPTIONS = [
  { value: 'arcane', label: 'Arcane (Arcana)', desc: 'Wizards (Spellbook), Magi, & Arcane Witches' },
  { value: 'occult', label: 'Occult (Occultism)', desc: 'Occult Witches (The Duke / Familiar Grimoire)' },
  { value: 'divine', label: 'Divine (Religion)', desc: 'Divine Witches (Familiar Grimoire)' },
  { value: 'primal', label: 'Primal (Nature)', desc: 'Primal Witches (Familiar Grimoire)' },
  { value: 'none', label: 'None / Non-Scribing', desc: 'Crafters, Martials & Spontaneous Casters (Sorcerer, Bard, etc.)' }
];

export const ATTRIBUTE_META = [
  { key: 'str', label: 'STR', full: 'Strength', note: 'Melee & Athletics' },
  { key: 'dex', label: 'DEX', full: 'Dexterity', note: 'AC, Reflex & Finesse' },
  { key: 'con', label: 'CON', full: 'Constitution', note: 'HP & Fortitude' },
  { key: 'int', label: 'INT', full: 'Intelligence', note: 'Crafting, Arcana, Occultism, Lore', highlight: true },
  { key: 'wis', label: 'WIS', full: 'Wisdom', note: 'Nature, Religion & Will', highlight: true },
  { key: 'cha', label: 'CHA', full: 'Charisma', note: 'Performance & Social', highlight: true }
];

export const SKILL_ATTR_MAP = {
  crafting: { attr: 'int', label: 'INT' },
  arcana: { attr: 'int', label: 'INT' },
  occultism: { attr: 'int', label: 'INT' },
  nature: { attr: 'wis', label: 'WIS' },
  religion: { attr: 'wis', label: 'WIS' },
  performance: { attr: 'cha', label: 'CHA' }
};

export function getClassDefaultAttributes(cls = 'Wizard') {
  const c = (cls || '').toLowerCase();
  if (['wizard', 'witch', 'alchemist', 'inventor', 'investigator', 'runesmith', 'commander', 'necromancer', 'magus', 'psychic'].includes(c)) {
    return { str: 0, dex: 2, con: 2, int: 4, wis: 1, cha: 0 };
  }
  if (['cleric', 'druid', 'animist', 'ranger', 'monk'].includes(c)) {
    return { str: 1, dex: 2, con: 2, int: 1, wis: 4, cha: 0 };
  }
  if (['bard', 'sorcerer', 'oracle', 'summoner', 'thaumaturge', 'swashbuckler'].includes(c)) {
    return { str: 0, dex: 2, con: 2, int: 1, wis: 0, cha: 4 };
  }
  if (['rogue', 'gunslinger'].includes(c)) {
    return { str: 0, dex: 4, con: 2, int: 2, wis: 1, cha: 0 };
  }
  return { str: 4, dex: 1, con: 3, int: 1, wis: 0, cha: 0 };
}

export function inferCharacterAttributes(character, parsedClass = 'Wizard') {
  if (character?.attributes && typeof character.attributes.int === 'number') {
    return {
      str: Number(character.attributes.str ?? 0),
      dex: Number(character.attributes.dex ?? 1),
      con: Number(character.attributes.con ?? 1),
      int: Number(character.attributes.int ?? 4),
      wis: Number(character.attributes.wis ?? 1),
      cha: Number(character.attributes.cha ?? 0)
    };
  }

  const defaults = getClassDefaultAttributes(parsedClass);
  const lvl = Number(character?.level) || 1;
  const sk = character?.skills || {};

  const inferFromSkill = (skillObj, fallback) => {
    if (!skillObj) return fallback;
    const r = Number(skillObj.rank) || 0;
    const m = Number(skillObj.mod) || 0;
    const item = Number(skillObj.itemBonus) || 0;
    if (r > 0) {
      return Math.max(-3, Math.min(10, m - (r * 2 + lvl) - item));
    }
    return fallback;
  };

  const intInferred = sk.crafting?.rank > 0
    ? inferFromSkill(sk.crafting, defaults.int)
    : sk.arcana?.rank > 0
      ? inferFromSkill(sk.arcana, defaults.int)
      : defaults.int;

  const wisInferred = sk.nature?.rank > 0
    ? inferFromSkill(sk.nature, defaults.wis)
    : sk.religion?.rank > 0
      ? inferFromSkill(sk.religion, defaults.wis)
      : defaults.wis;

  const chaInferred = sk.performance?.rank > 0
    ? inferFromSkill(sk.performance, defaults.cha)
    : defaults.cha;

  return {
    str: defaults.str,
    dex: defaults.dex,
    con: defaults.con,
    int: intInferred,
    wis: wisInferred,
    cha: chaInferred
  };
}

export function computeSkillMod(rank, level, attrMod, itemBonus = 0) {
  const r = Number(rank) || 0;
  const lvl = Math.max(1, Math.min(20, Number(level) || 1));
  const a = Number(attrMod) || 0;
  const item = Number(itemBonus) || 0;
  const profBonus = r > 0 ? (r * 2) + lvl : 0;
  return profBonus + a + item;
}

export function CharacterEditorModal({ isOpen, onClose, character, onSave }) {
  if (!isOpen || !character) return null;

  const [name, setName] = useState(character.name || '');
  const [level, setLevel] = useState(character.level || 1);
  
  // Class & Archetype split
  const [selectedClass, setSelectedClass] = useState('Wizard');
  const [customClass, setCustomClass] = useState('');
  const [archetype, setArchetype] = useState('');

  // Spellcasting Tradition
  const [tradition, setTradition] = useState('arcane');
  const [showArchetypeCasting, setShowArchetypeCasting] = useState(false);

  // Attributes (Ability Modifiers)
  const [attributes, setAttributes] = useState({
    str: 0,
    dex: 2,
    con: 1,
    int: 4,
    wis: 1,
    cha: 0
  });

  // Wealth
  const [pp, setPp] = useState(character.wealth?.pp || 0);
  const [gp, setGp] = useState(character.wealth?.gp || 0);
  const [sp, setSp] = useState(character.wealth?.sp || 0);
  const [cp, setCp] = useState(character.wealth?.cp || 0);

  // Skills
  const [skills, setSkills] = useState({
    crafting: { rank: 1, mod: 7, itemBonus: 0, rankName: 'Trained', ...(character.skills?.crafting || {}) },
    performance: { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained', ...(character.skills?.performance || {}) },
    arcana: { rank: 1, mod: 7, itemBonus: 0, rankName: 'Trained', ...(character.skills?.arcana || {}) },
    nature: { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained', ...(character.skills?.nature || {}) },
    occultism: { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained', ...(character.skills?.occultism || {}) },
    religion: { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained', ...(character.skills?.religion || {}) }
  });

  // Lore Skills
  const [loreSkills, setLoreSkills] = useState(Array.isArray(character.loreSkills) ? [...character.loreSkills] : []);
  const [editorNewLoreName, setEditorNewLoreName] = useState('');
  const [editorNewLoreRank, setEditorNewLoreRank] = useState(1);
  const [editorNewLoreMod, setEditorNewLoreMod] = useState(7);

  // Feats
  const [feats, setFeats] = useState({
    magicalShorthand: !!character.feats?.magicalShorthand,
    spellbookProdigy: !!character.feats?.spellbookProdigy,
    magicalCrafting: !!character.feats?.magicalCrafting,
    alchemicalCrafting: !!character.feats?.alchemicalCrafting,
    snareCrafting: !!character.feats?.snareCrafting,
    specialtyCrafting: !!character.feats?.specialtyCrafting,
    impeccableCrafting: !!character.feats?.impeccableCrafting,
    experiencedProfessional: !!character.feats?.experiencedProfessional,
    virtuosicPerformer: !!character.feats?.virtuosicPerformer,
    craftAnything: !!character.feats?.craftAnything,
    inventor: !!character.feats?.inventor,
    communalCrafting: !!character.feats?.communalCrafting
  });

  // Formulas & Compendium Formula Picker state
  const [formulas, setFormulas] = useState([...(character.formulas || [])]);
  const [formulaSearch, setFormulaSearch] = useState('');
  const [formulaCategory, setFormulaCategory] = useState('all');
  const [formulaMaxLevelOnly, setFormulaMaxLevelOnly] = useState(true);

  // Helper to extract base class and archetype
  const parseClassAndArchetype = (rawClass = '') => {
    const raw = (rawClass || '').trim();
    if (!raw) return { cls: 'Wizard', custom: '', arch: '' };

    const direct = PF2E_CLASSES.find(c => c.toLowerCase() === raw.toLowerCase());
    if (direct && direct !== 'Custom') {
      return { cls: direct, custom: '', arch: '' };
    }

    if (raw.includes('/')) {
      const parts = raw.split('/').map(p => p.trim());
      const matched = PF2E_CLASSES.find(c => c.toLowerCase() === parts[0].toLowerCase() || c.toLowerCase() === parts[1].toLowerCase());
      if (matched && direct !== 'Custom') {
        const archPart = parts[0].toLowerCase() === matched.toLowerCase() ? parts[1] : parts[0];
        return { cls: matched, custom: '', arch: archPart };
      }
      return { cls: 'Custom', custom: parts[0], arch: parts[1] };
    }

    const words = raw.split(/\s+/);
    for (const word of words) {
      const matched = PF2E_CLASSES.find(c => c.toLowerCase() === word.toLowerCase() && c !== 'Custom');
      if (matched) {
        const remaining = raw.replace(new RegExp(matched, 'i'), '').trim().replace(/^[()-]+|[()-]+$/g, '').trim();
        return { cls: matched, custom: '', arch: remaining };
      }
    }

    return { cls: 'Custom', custom: raw, arch: '' };
  };

  // Recalculate all skills and lore modifiers from level + attributes + ranks + item bonuses
  const recalculateSkillsWithState = (nextLevel, nextAttributes, currentSkills, currentLores) => {
    const safeLvl = Math.max(1, Math.min(20, Number(nextLevel) || 1));
    const updatedSkills = {};

    for (const [key, skData] of Object.entries(currentSkills)) {
      const attrKey = SKILL_ATTR_MAP[key]?.attr || 'int';
      const attrMod = Number(nextAttributes[attrKey]) || 0;
      const rank = Number(skData.rank) || 0;
      const itemBonus = Number(skData.itemBonus) || 0;
      const newMod = computeSkillMod(rank, safeLvl, attrMod, itemBonus);
      updatedSkills[key] = {
        ...skData,
        rank,
        itemBonus,
        mod: newMod,
        rankName: RANK_NAMES[rank] || 'Untrained'
      };
    }

    const intMod = Number(nextAttributes.int) || 0;
    const updatedLores = (currentLores || []).map(l => {
      const r = Number(l.rank) || 1;
      const itemB = Number(l.itemBonus) || 0;
      return {
        ...l,
        rank: r,
        mod: computeSkillMod(r, safeLvl, intMod, itemB),
        rankName: RANK_NAMES[r] || 'Trained'
      };
    });

    setSkills(updatedSkills);
    setLoreSkills(updatedLores);
    setEditorNewLoreMod(computeSkillMod(editorNewLoreRank, safeLvl, intMod, 0));
  };

  // Sync state when character or modal visibility changes
  useEffect(() => {
    if (character && isOpen) {
      setName(character.name || '');
      const initLvl = Number(character.level) || 1;
      setLevel(initLvl);

      const parsed = parseClassAndArchetype(character.characterClass);
      setSelectedClass(parsed.cls);
      setCustomClass(parsed.custom);
      setArchetype(parsed.arch);

      const inferredAttrs = inferCharacterAttributes(character, parsed.cls);
      setAttributes(inferredAttrs);

      // Tradition detection
      const charTrad = character.spellcasting?.traditions?.[0];
      const isCaster = SPELLCASTER_CLASSES.includes(parsed.cls);

      if (charTrad && ['arcane', 'occult', 'divine', 'primal'].includes(charTrad.toLowerCase())) {
        setTradition(charTrad.toLowerCase());
        setShowArchetypeCasting(!isCaster);
      } else if (character.spellcasting?.traditions?.length === 0 || !isCaster) {
        setTradition('none');
        setShowArchetypeCasting(false);
      } else {
        if (parsed.cls === 'Wizard' || parsed.cls === 'Magus') setTradition('arcane');
        else if (parsed.cls === 'Druid') setTradition('primal');
        else if (parsed.cls === 'Cleric' || parsed.cls === 'Champion' || parsed.cls === 'Oracle') setTradition('divine');
        else if (parsed.cls === 'Bard' || parsed.cls === 'Psychic' || parsed.cls === 'Necromancer') setTradition('occult');
        else if (parsed.cls === 'Witch') setTradition('occult');
        else setTradition('arcane');
        setShowArchetypeCasting(false);
      }

      setPp(character.wealth?.pp || 0);
      setGp(character.wealth?.gp || 0);
      setSp(character.wealth?.sp || 0);
      setCp(character.wealth?.cp || 0);

      const initSkills = {
        crafting: { rank: 1, mod: 7, itemBonus: 0, rankName: 'Trained', ...(character.skills?.crafting || {}) },
        performance: { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained', ...(character.skills?.performance || {}) },
        arcana: { rank: 1, mod: 7, itemBonus: 0, rankName: 'Trained', ...(character.skills?.arcana || {}) },
        nature: { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained', ...(character.skills?.nature || {}) },
        occultism: { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained', ...(character.skills?.occultism || {}) },
        religion: { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained', ...(character.skills?.religion || {}) }
      };
      setSkills(initSkills);

      const initLores = Array.isArray(character.loreSkills) ? [...character.loreSkills] : [];
      setLoreSkills(initLores);
      setEditorNewLoreName('');
      setEditorNewLoreRank(1);
      setEditorNewLoreMod(computeSkillMod(1, initLvl, inferredAttrs.int, 0));

      setFeats({
        magicalShorthand: !!character.feats?.magicalShorthand,
        spellbookProdigy: !!character.feats?.spellbookProdigy,
        magicalCrafting: !!character.feats?.magicalCrafting,
        alchemicalCrafting: !!character.feats?.alchemicalCrafting,
        snareCrafting: !!character.feats?.snareCrafting,
        specialtyCrafting: !!character.feats?.specialtyCrafting,
        impeccableCrafting: !!character.feats?.impeccableCrafting,
        experiencedProfessional: !!character.feats?.experiencedProfessional,
        virtuosicPerformer: !!character.feats?.virtuosicPerformer,
        craftAnything: !!character.feats?.craftAnything,
        inventor: !!character.feats?.inventor,
        communalCrafting: !!character.feats?.communalCrafting
      });

      setFormulas([...(character.formulas || [])]);
      setFormulaSearch('');
      setFormulaCategory('all');
    }
  }, [character, isOpen]);

  // Handle Level change -> auto-recalculate skills
  const handleLevelChange = (newLvlVal) => {
    const parsedLvl = Math.max(1, Math.min(20, Number(newLvlVal) || 1));
    setLevel(newLvlVal);
    recalculateSkillsWithState(parsedLvl, attributes, skills, loreSkills);
  };

  // Handle Attribute change -> auto-recalculate skills
  const handleAttributeChange = (attrKey, newVal) => {
    const clamped = Math.max(-5, Math.min(12, Number(newVal) || 0));
    const nextAttrs = {
      ...attributes,
      [attrKey]: clamped
    };
    setAttributes(nextAttrs);
    recalculateSkillsWithState(level, nextAttrs, skills, loreSkills);
  };

  // Apply Class Default Attributes
  const handleApplyClassAttributes = (targetClass = selectedClass) => {
    const classDefaults = getClassDefaultAttributes(targetClass);
    setAttributes(classDefaults);
    recalculateSkillsWithState(level, classDefaults, skills, loreSkills);
  };

  // Handle Class change auto-suggestions
  const handleClassChange = (newCls) => {
    setSelectedClass(newCls);
    const nextAttrs = getClassDefaultAttributes(newCls);
    setAttributes(nextAttrs);

    let nextSkills = { ...skills };

    if (newCls === 'Wizard' || newCls === 'Magus') {
      setTradition('arcane');
      setShowArchetypeCasting(false);
    } else if (newCls === 'Druid') {
      setTradition('primal');
      setShowArchetypeCasting(false);
    } else if (newCls === 'Cleric' || newCls === 'Champion' || newCls === 'Oracle') {
      setTradition('divine');
      setShowArchetypeCasting(false);
    } else if (newCls === 'Bard' || newCls === 'Psychic' || newCls === 'Necromancer' || newCls === 'Witch') {
      setTradition('occult');
      setShowArchetypeCasting(false);
    } else if (newCls === 'Runesmith' || newCls === 'Alchemist' || newCls === 'Inventor') {
      if (nextSkills.crafting.rank === 0) {
        nextSkills.crafting = { ...nextSkills.crafting, rank: 1, rankName: 'Trained' };
      }
      setTradition('none');
      setShowArchetypeCasting(false);
    } else {
      setTradition('none');
      setShowArchetypeCasting(false);
    }

    recalculateSkillsWithState(level, nextAttrs, nextSkills, loreSkills);
  };

  const handleSkillChange = (skillKey, field, value) => {
    setSkills(prev => {
      const current = prev[skillKey] || { rank: 0, mod: 0, itemBonus: 0, rankName: 'Untrained' };
      const attrKey = SKILL_ATTR_MAP[skillKey]?.attr || 'int';
      const attrMod = Number(attributes[attrKey]) || 0;

      let updatedRank = Number(current.rank) || 0;
      let updatedItemBonus = Number(current.itemBonus) || 0;
      let updatedMod = Number(current.mod) || 0;

      if (field === 'rank') {
        updatedRank = Number(value);
        updatedMod = computeSkillMod(updatedRank, level, attrMod, updatedItemBonus);
      } else if (field === 'itemBonus') {
        updatedItemBonus = Number(value);
        updatedMod = computeSkillMod(updatedRank, level, attrMod, updatedItemBonus);
      } else if (field === 'mod') {
        updatedMod = Number(value);
      }

      return {
        ...prev,
        [skillKey]: {
          rank: updatedRank,
          itemBonus: updatedItemBonus,
          mod: updatedMod,
          rankName: RANK_NAMES[updatedRank] || 'Untrained'
        }
      };
    });
  };

  // Compendium Formula Filtering
  const filteredCompendiumFormulas = useMemo(() => {
    const q = formulaSearch.trim().toLowerCase();
    const charLvl = Math.max(1, Math.min(20, Number(level) || 1));

    return itemsData
      .filter(item => {
        if (!item.name) return false;
        if (formulaMaxLevelOnly && (item.level ?? 0) > charLvl) return false;

        if (formulaCategory !== 'all') {
          if (formulaCategory === 'wand' && !item.isWand) return false;
          if (formulaCategory === 'scroll' && !item.isScroll) return false;
          if (formulaCategory !== 'wand' && formulaCategory !== 'scroll') {
            if (item.category !== formulaCategory && item.type !== formulaCategory) return false;
          }
        }

        if (q) {
          const matchesName = item.name.toLowerCase().includes(q);
          const matchesTrait = (item.traits || []).some(t => String(t).toLowerCase().includes(q));
          return matchesName || matchesTrait;
        }
        return true;
      })
      .slice(0, 50);
  }, [formulaSearch, formulaCategory, formulaMaxLevelOnly, level]);

  const handleToggleCompendiumFormula = (itemName) => {
    const clean = (itemName || '').trim();
    if (!clean) return;
    const exists = formulas.some(f => f.toLowerCase() === clean.toLowerCase());
    if (exists) {
      setFormulas(formulas.filter(f => f.toLowerCase() !== clean.toLowerCase()));
    } else {
      setFormulas([...formulas, clean]);
    }
  };

  const handleAddCustomFormula = (e) => {
    e.preventDefault();
    const clean = formulaSearch.trim();
    if (clean && !formulas.some(f => f.toLowerCase() === clean.toLowerCase())) {
      setFormulas([...formulas, clean]);
      setFormulaSearch('');
    }
  };

  const handleRemoveFormula = (index) => {
    setFormulas(formulas.filter((_, idx) => idx !== index));
  };

  // Map known formulas to compendium info if available
  const enrichedKnownFormulas = useMemo(() => {
    return formulas.map((fName, index) => {
      const match = itemsData.find(i => i.name?.toLowerCase() === String(fName).toLowerCase() || i.id === fName);
      return {
        index,
        rawName: fName,
        displayName: match ? match.name : fName,
        level: match?.level ?? null,
        price: match?.price ?? null,
        category: match?.category ?? null
      };
    });
  }, [formulas]);

  const buildUpdatedCharacter = () => {
    const finalClass = selectedClass === 'Custom'
      ? (customClass.trim() || 'Adventurer')
      : selectedClass;

    const fullClassName = archetype.trim() 
      ? `${finalClass} (${archetype.trim()})`
      : finalClass;

    const isWitch = finalClass.toLowerCase().includes('witch');
    const isWizard = finalClass.toLowerCase().includes('wizard');

    // Update spellcasting entries tradition
    const updatedEntries = (character.spellcasting?.entries || []).map(entry => ({
      ...entry,
      tradition: tradition !== 'none' ? tradition : entry.tradition || 'arcane',
      isWitch,
      isWizard
    }));

    if (updatedEntries.length === 0 && tradition !== 'none') {
      updatedEntries.push({
        id: `entry-${Date.now()}`,
        name: `${finalClass} Spellcasting`,
        tradition: tradition,
        isWitch,
        isWizard,
        spells: character.learnedSpells || []
      });
    }

    return {
      ...character,
      name: name.trim() || 'Hero',
      level: Math.max(1, Math.min(20, Number(level) || 1)),
      characterClass: fullClassName,
      attributes: { ...attributes },
      wealth: {
        pp: Math.max(0, Number(pp) || 0),
        gp: Math.max(0, Number(gp) || 0),
        sp: Math.max(0, Number(sp) || 0),
        cp: Math.max(0, Number(cp) || 0)
      },
      skills,
      loreSkills,
      feats: {
        ...character.feats,
        ...feats
      },
      formulas,
      spellcasting: {
        ...(character.spellcasting || {}),
        traditions: tradition !== 'none' ? [tradition] : [],
        entries: updatedEntries
      }
    };
  };

  const handleSave = () => {
    const updated = buildUpdatedCharacter();
    onSave(updated);
    onClose();
  };

  const handleExport = () => {
    const updated = buildUpdatedCharacter();
    onSave(updated);
    exportCharacterJSON(updated);
  };

  const isBaseSpellcaster = SPELLCASTER_CLASSES.includes(selectedClass);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-parchment-50 border-2 border-gold-500 rounded-2xl max-w-4xl w-full p-4 sm:p-6 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-parchment-300">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-arcane-800" />
            <h3 className="font-serif font-bold text-lg text-arcane-950">
              Edit Character: {name || character.name}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-parchment-600 hover:text-parchment-900 hover:bg-parchment-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="py-4 space-y-5 overflow-y-auto flex-1 pr-1 text-xs sm:text-sm">
          {/* Identity, Class & Tradition */}
          <div className="bg-white p-3.5 rounded-xl border border-parchment-300 space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Character Name */}
              <div className="sm:col-span-4">
                <label className="block text-xs font-bold text-parchment-700 uppercase mb-1">Character Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2 bg-parchment-50 border border-parchment-300 rounded-lg focus:ring-2 focus:ring-gold-500 font-semibold text-stone-900"
                />
              </div>

              {/* Class Dropdown */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-parchment-700 uppercase mb-1">Primary Class</label>
                <select
                  value={selectedClass}
                  onChange={(e) => handleClassChange(e.target.value)}
                  className="w-full p-2 bg-parchment-50 border border-parchment-300 rounded-lg focus:ring-2 focus:ring-gold-500 font-bold text-stone-900 cursor-pointer"
                >
                  {PF2E_CLASSES.map(cls => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))}
                </select>
              </div>

              {/* Archetype / Subclass (Optional) */}
              <div className="sm:col-span-3">
                <label className="block text-xs font-bold text-parchment-700 uppercase mb-1">Archetype / Subclass</label>
                <input
                  type="text"
                  value={archetype}
                  onChange={(e) => setArchetype(e.target.value)}
                  placeholder="e.g. Occult Patron, Runesmith"
                  className="w-full p-2 bg-parchment-50 border border-parchment-300 rounded-lg focus:ring-2 focus:ring-gold-500 font-semibold text-stone-900"
                />
              </div>

              {/* Level */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold text-parchment-700 uppercase mb-1">Level (1-20)</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={level}
                  onChange={(e) => handleLevelChange(e.target.value)}
                  className="w-full p-2 bg-parchment-50 border border-parchment-300 rounded-lg focus:ring-2 focus:ring-gold-500 font-bold text-stone-900 text-center"
                />
              </div>
            </div>

            {/* Custom Class Name if 'Custom' selected */}
            {selectedClass === 'Custom' && (
              <div>
                <label className="block text-xs font-bold text-parchment-700 uppercase mb-1">Custom Class Name</label>
                <input
                  type="text"
                  value={customClass}
                  onChange={(e) => setCustomClass(e.target.value)}
                  placeholder="Enter custom class title..."
                  className="w-full p-2 bg-parchment-50 border border-parchment-300 rounded-lg font-semibold text-stone-900"
                />
              </div>
            )}

            {/* Spellcasting Tradition Selector */}
            <div className="pt-2 border-t border-parchment-200">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold text-purple-900 uppercase flex items-center gap-1.5">
                  <Wand2 className="w-4 h-4 text-purple-700" />
                  <span>Spellcasting Tradition & Scribing Skill Alignment</span>
                </label>
                {!isBaseSpellcaster && (showArchetypeCasting || tradition !== 'none') && (
                  <button
                    type="button"
                    onClick={() => { setTradition('none'); setShowArchetypeCasting(false); }}
                    className="text-[11px] text-stone-500 hover:text-red-700 font-semibold underline"
                  >
                    Remove Archetype Tradition
                  </button>
                )}
              </div>

              {!isBaseSpellcaster && tradition === 'none' && !showArchetypeCasting ? (
                <div className="flex items-center justify-between p-3 rounded-lg bg-parchment-100 border border-parchment-200">
                  <div>
                    <span className="text-xs font-bold text-stone-800 block">Non-Spellcaster (Crafting Focus)</span>
                    <span className="text-[11px] text-stone-600">Pure martial or artisan class. No base scribing or spellbook required.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowArchetypeCasting(true); setTradition('arcane'); }}
                    className="text-xs text-purple-800 hover:text-purple-950 font-bold bg-purple-50 hover:bg-purple-100 px-2.5 py-1.5 rounded-lg border border-purple-300 transition-colors shrink-0"
                  >
                    + Add Spellcasting Archetype (Dedication)
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {TRADITION_OPTIONS.map(opt => (
                    <label
                      key={opt.value}
                      className={`flex items-start gap-2 p-2 rounded-lg border cursor-pointer transition-all ${
                        tradition === opt.value
                          ? 'bg-purple-100 border-purple-600 ring-2 ring-purple-400/40'
                          : 'bg-parchment-50 border-parchment-200 hover:bg-parchment-100'
                      }`}
                    >
                      <input
                        type="radio"
                        name="tradition"
                        value={opt.value}
                        checked={tradition === opt.value}
                        onChange={(e) => setTradition(e.target.value)}
                        className="mt-0.5 text-purple-600 focus:ring-purple-500"
                      />
                      <div>
                        <span className="font-bold text-stone-900 block text-xs">{opt.label}</span>
                        <span className="text-[11px] text-parchment-600 leading-tight block">{opt.desc}</span>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Core Attributes / Ability Modifiers (STR, DEX, CON, INT, WIS, CHA) */}
          <div className="bg-white p-3.5 rounded-xl border border-parchment-300 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-arcane-950">
                <Sliders className="w-4 h-4 text-arcane-700" />
                <span>Core Attributes / Ability Modifiers (Stats)</span>
              </div>
              <button
                type="button"
                onClick={() => handleApplyClassAttributes(selectedClass)}
                className="text-[11px] font-bold text-arcane-800 hover:text-arcane-950 bg-arcane-50 hover:bg-arcane-100 border border-arcane-300 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors"
                title="Reset attributes to typical starting stats for the selected class"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Apply {selectedClass} Preset Stats</span>
              </button>
            </div>
            <p className="text-[11px] text-stone-600">
              Adjusting <strong>INT</strong>, <strong>WIS</strong>, or <strong>CHA</strong> (or Character Level) automatically recalculates your Crafting, Scribing, and Lore skill modifiers below.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
              {ATTRIBUTE_META.map(attr => {
                const val = Number(attributes[attr.key]) || 0;
                const formatted = val >= 0 ? `+${val}` : `${val}`;
                return (
                  <div
                    key={attr.key}
                    className={`p-2.5 rounded-xl border flex flex-col items-center text-center transition-all ${
                      attr.highlight
                        ? 'bg-amber-50/70 border-amber-300 shadow-sm'
                        : 'bg-parchment-50 border-parchment-200'
                    }`}
                  >
                    <span className="text-xs font-black tracking-wider text-arcane-950">{attr.label}</span>
                    <span className="text-[10px] text-stone-500 mb-1.5 truncate max-w-full" title={attr.note}>
                      {attr.full}
                    </span>

                    <div className="flex items-center gap-1 w-full justify-center">
                      <button
                        type="button"
                        onClick={() => handleAttributeChange(attr.key, val - 1)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-parchment-200 border border-parchment-300 font-bold text-stone-800 flex items-center justify-center shadow-sm active:scale-95"
                        title={`Decrease ${attr.full}`}
                      >
                        &minus;
                      </button>
                      <select
                        value={val}
                        onChange={(e) => handleAttributeChange(attr.key, Number(e.target.value))}
                        aria-label={`${attr.full} Modifier`}
                        className="w-14 h-7 bg-white border border-parchment-300 rounded-lg font-mono font-black text-xs text-center text-stone-900 cursor-pointer"
                      >
                        {[-3, -2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(n => (
                          <option key={n} value={n}>{n >= 0 ? `+${n}` : `${n}`}</option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={() => handleAttributeChange(attr.key, val + 1)}
                        className="w-7 h-7 rounded-lg bg-white hover:bg-parchment-200 border border-parchment-300 font-bold text-stone-800 flex items-center justify-center shadow-sm active:scale-95"
                        title={`Increase ${attr.full}`}
                      >
                        +
                      </button>
                    </div>
                    <span className="text-[9px] text-stone-500 mt-1 leading-tight">{attr.note}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Purse Wealth with Platinum (pp) */}
          <div className="bg-white p-3 rounded-xl border border-parchment-300">
            <div className="flex items-center gap-1.5 mb-2 font-serif font-bold text-sm text-arcane-950">
              <Coins className="w-4 h-4 text-gold-600" />
              <span>Coin Purse</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-purple-800 mb-1">Platinum (pp)</label>
                <input
                  type="number"
                  min="0"
                  value={pp}
                  onChange={(e) => setPp(e.target.value)}
                  className="w-full p-2 bg-purple-50/60 border border-purple-300 rounded-lg font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gold-700 mb-1">Gold (gp)</label>
                <input
                  type="number"
                  min="0"
                  value={gp}
                  onChange={(e) => setGp(e.target.value)}
                  className="w-full p-2 bg-gold-50/50 border border-gold-300 rounded-lg font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Silver (sp)</label>
                <input
                  type="number"
                  min="0"
                  value={sp}
                  onChange={(e) => setSp(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1">Copper (cp)</label>
                <input
                  type="number"
                  min="0"
                  value={cp}
                  onChange={(e) => setCp(e.target.value)}
                  className="w-full p-2 bg-amber-50 border border-amber-300 rounded-lg font-bold text-stone-900"
                />
              </div>
            </div>
          </div>

          {/* Skill Modifiers & Proficiencies */}
          <div className="bg-white p-3.5 rounded-xl border border-parchment-300 space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-arcane-950">
                <Hammer className="w-4 h-4 text-forge-600" />
                <span>Skills & Modifiers</span>
              </div>
              <span className="text-[11px] text-stone-500">
                Auto-calculates: <strong>Proficiency + Attribute + Item Bonus</strong>
              </span>
            </div>
            <div className="space-y-2">
              {Object.entries(skills).map(([key, data]) => {
                const meta = SKILL_ATTR_MAP[key] || { attr: 'int', label: 'INT' };
                const attrVal = Number(attributes[meta.attr]) || 0;
                const rank = Number(data.rank) || 0;
                const itemB = Number(data.itemBonus) || 0;
                const profBonus = rank > 0 ? (rank * 2) + (Number(level) || 1) : 0;

                return (
                  <div key={key} className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-parchment-50 border border-parchment-200">
                    <div className="min-w-[130px]">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold capitalize text-stone-900 text-xs sm:text-sm">{key}</span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                          {meta.label} {attrVal >= 0 ? `+${attrVal}` : attrVal}
                        </span>
                      </div>
                      <span className="text-[10px] text-stone-500 block">
                        Prof: +{profBonus} {itemB > 0 ? `• Item: +${itemB}` : ''}
                      </span>
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                      <div className="flex items-center gap-1.5">
                        <label className="text-[11px] text-parchment-700 font-semibold">Rank:</label>
                        <select
                          value={data.rank}
                          onChange={(e) => handleSkillChange(key, 'rank', e.target.value)}
                          className="bg-white border border-parchment-300 rounded-lg px-2 py-1 text-xs font-bold text-stone-800 cursor-pointer"
                        >
                          <option value="0">Untrained (0)</option>
                          <option value="1">Trained (+2+L)</option>
                          <option value="2">Expert (+4+L)</option>
                          <option value="3">Master (+6+L)</option>
                          <option value="4">Legendary (+8+L)</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <label className="text-[11px] text-parchment-700 font-semibold">Item:</label>
                        <select
                          value={itemB}
                          onChange={(e) => handleSkillChange(key, 'itemBonus', e.target.value)}
                          className="bg-white border border-parchment-300 rounded-lg px-1.5 py-1 text-xs font-bold text-stone-800 cursor-pointer"
                          title="Item bonus from tools, potency crystals, or worn items"
                        >
                          <option value="0">+0</option>
                          <option value="1">+1</option>
                          <option value="2">+2</option>
                          <option value="3">+3</option>
                          <option value="4">+4</option>
                        </select>
                      </div>

                      <div className="flex items-center gap-1">
                        <label className="text-[11px] text-parchment-700 font-semibold">Total:</label>
                        <input
                          type="number"
                          value={data.mod}
                          onChange={(e) => handleSkillChange(key, 'mod', e.target.value)}
                          className="w-16 p-1 bg-white border-2 border-gold-400 rounded-lg text-center font-mono font-black text-stone-900 text-xs sm:text-sm"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Lore Skills Manager */}
          <div className="bg-white p-3 rounded-xl border border-parchment-300 space-y-2">
            <div className="flex items-center justify-between font-serif font-bold text-sm text-arcane-950">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Lore Skills ({loreSkills.length})</span>
              </div>
              <span className="text-[11px] font-mono text-stone-500">Used for Downtime Earn Income (INT Based)</span>
            </div>
            
            {/* Existing Lore Skills */}
            <div className="space-y-1.5">
              {loreSkills.map((lore, idx) => (
                <div key={lore.id || idx} className="flex flex-wrap items-center justify-between gap-2 p-2 rounded bg-emerald-50/50 border border-emerald-200">
                  <span className="font-bold text-stone-800 text-xs flex-1 min-w-[120px] truncate">{lore.name}</span>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-[11px] text-stone-500">Rank:</label>
                    <select
                      value={lore.rank}
                      onChange={(e) => {
                        const newRank = Number(e.target.value);
                        const newMod = computeSkillMod(newRank, level, attributes.int, lore.itemBonus || 0);
                        setLoreSkills(loreSkills.map((l, i) => i === idx ? { ...l, rank: newRank, mod: newMod, rankName: RANK_NAMES[newRank] } : l));
                      }}
                      className="bg-white border border-parchment-300 rounded px-1.5 py-0.5 text-xs font-semibold text-stone-800"
                    >
                      <option value={1}>Trained</option>
                      <option value={2}>Expert</option>
                      <option value={3}>Master</option>
                      <option value={4}>Legendary</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-[11px] text-stone-500">Mod:</label>
                    <input
                      type="number"
                      value={lore.mod}
                      onChange={(e) => {
                        const newMod = Number(e.target.value);
                        setLoreSkills(loreSkills.map((l, i) => i === idx ? { ...l, mod: newMod } : l));
                      }}
                      className="w-14 p-0.5 bg-white border border-parchment-300 rounded text-center font-bold text-xs text-stone-900"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => setLoreSkills(loreSkills.filter((_, i) => i !== idx))}
                    className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                    title="Delete Lore Skill"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Lore Row */}
            <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-parchment-200">
              <input
                type="text"
                placeholder="New Lore (e.g. Blacksmithing Lore, Herbalism Lore)"
                value={editorNewLoreName}
                onChange={(e) => setEditorNewLoreName(e.target.value)}
                className="flex-1 min-w-[140px] border border-parchment-300 rounded-lg px-2 py-1 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
              />
              <select
                value={editorNewLoreRank}
                onChange={(e) => {
                  const r = Number(e.target.value);
                  setEditorNewLoreRank(r);
                  setEditorNewLoreMod(computeSkillMod(r, level, attributes.int, 0));
                }}
                className="border border-parchment-300 rounded-lg px-1.5 py-1 text-xs"
              >
                <option value={1}>Trained</option>
                <option value={2}>Expert</option>
                <option value={3}>Master</option>
                <option value={4}>Legendary</option>
              </select>
              <input
                type="number"
                placeholder="Mod"
                value={editorNewLoreMod}
                onChange={(e) => setEditorNewLoreMod(Number(e.target.value))}
                className="w-14 border border-parchment-300 rounded-lg px-1 py-1 text-xs text-center font-bold"
              />
              <button
                type="button"
                onClick={() => {
                  if (!editorNewLoreName.trim()) return;
                  setLoreSkills([...loreSkills, {
                    id: `lore-ed-${Date.now()}`,
                    name: editorNewLoreName.trim(),
                    rank: editorNewLoreRank,
                    mod: editorNewLoreMod,
                    rankName: RANK_NAMES[editorNewLoreRank]
                  }]);
                  setEditorNewLoreName('');
                }}
                className="px-2.5 py-1 bg-emerald-700 text-white rounded-lg text-xs font-bold hover:bg-emerald-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </div>
          </div>

          {/* Feats & Remaster Perks */}
          <div className="bg-white p-3 rounded-xl border border-parchment-300">
            <div className="flex items-center gap-1.5 mb-2 font-serif font-bold text-sm text-arcane-950">
              <Sparkles className="w-4 h-4 text-purple-600" />
              <span>Feats & Remaster Perks</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.experiencedProfessional}
                  onChange={(e) => setFeats({ ...feats, experiencedProfessional: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Experienced Professional</span>
                  <p className="text-[11px] text-parchment-600">Lore Earn Income: Success &rarr; Crit Success; Crit Fail &rarr; Failure</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.virtuosicPerformer}
                  onChange={(e) => setFeats({ ...feats, virtuosicPerformer: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Virtuosic Performer</span>
                  <p className="text-[11px] text-parchment-600">+2 circumstance bonus on Performance checks</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.magicalShorthand}
                  onChange={(e) => setFeats({ ...feats, magicalShorthand: e.target.checked })}
                  className="rounded text-arcane-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Magical Shorthand</span>
                  <p className="text-[11px] text-parchment-600">Flat 10-min scribing + Successes upgrade to Crit Success</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.spellbookProdigy}
                  onChange={(e) => setFeats({ ...feats, spellbookProdigy: e.target.checked })}
                  className="rounded text-arcane-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Spellbook Prodigy</span>
                  <p className="text-[11px] text-parchment-600">Converts Critical Failures into Failures (0 lost materials)</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.magicalCrafting}
                  onChange={(e) => setFeats({ ...feats, magicalCrafting: e.target.checked })}
                  className="rounded text-forge-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Magical Crafting</span>
                  <p className="text-[11px] text-parchment-600">Allows crafting magic items, wands, and scrolls</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.alchemicalCrafting}
                  onChange={(e) => setFeats({ ...feats, alchemicalCrafting: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Alchemical Crafting</span>
                  <p className="text-[11px] text-parchment-600">Allows crafting alchemical items, elixirs, and bombs</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.specialtyCrafting}
                  onChange={(e) => setFeats({ ...feats, specialtyCrafting: e.target.checked })}
                  className="rounded text-amber-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Specialty Crafting</span>
                  <p className="text-[11px] text-parchment-600">+1 / +2 circumstance bonus on specialty crafting jobs</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.impeccableCrafting}
                  onChange={(e) => setFeats({ ...feats, impeccableCrafting: e.target.checked })}
                  className="rounded text-gold-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Impeccable Crafting (Master)</span>
                  <p className="text-[11px] text-parchment-600">Successes on specialty craft become Critical Successes</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.craftAnything}
                  onChange={(e) => setFeats({ ...feats, craftAnything: e.target.checked })}
                  className="rounded text-purple-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Craft Anything (Legendary)</span>
                  <p className="text-[11px] text-parchment-600">Ignore special requirements like casting required spells</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.snareCrafting}
                  onChange={(e) => setFeats({ ...feats, snareCrafting: e.target.checked })}
                  className="rounded text-stone-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Snare Crafting</span>
                  <p className="text-[11px] text-parchment-600">Allows crafting complex snares and traps</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.inventor}
                  onChange={(e) => setFeats({ ...feats, inventor: e.target.checked })}
                  className="rounded text-cyan-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Inventor</span>
                  <p className="text-[11px] text-parchment-600">Create new formulas for items without buying them</p>
                </div>
              </label>

              <label className="flex items-center gap-2 p-2 rounded bg-parchment-50 border border-parchment-200 cursor-pointer hover:bg-parchment-100">
                <input
                  type="checkbox"
                  checked={feats.communalCrafting}
                  onChange={(e) => setFeats({ ...feats, communalCrafting: e.target.checked })}
                  className="rounded text-blue-600 focus:ring-gold-500"
                />
                <div>
                  <span className="font-bold text-stone-900">Communal Crafting</span>
                  <p className="text-[11px] text-parchment-600">Allies can aid in downtime reduction</p>
                </div>
              </label>
            </div>
          </div>

          {/* Known Formulas & Compendium Formula Picker */}
          <div className="bg-white p-3.5 rounded-xl border border-parchment-300 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-arcane-950">
                <BookOpen className="w-4 h-4 text-gold-700" />
                <span>Formula Book & Compendium Formula Selector ({formulas.length} Known)</span>
              </div>
              <label className="flex items-center gap-1.5 text-xs text-stone-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formulaMaxLevelOnly}
                  onChange={(e) => setFormulaMaxLevelOnly(e.target.checked)}
                  className="rounded text-forge-600 focus:ring-gold-500"
                />
                <span>Filter &le; Character Level ({level})</span>
              </label>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
              <div className="sm:col-span-7 relative">
                <Search className="w-4 h-4 text-parchment-500 absolute left-2.5 top-2.5" />
                <input
                  type="text"
                  value={formulaSearch}
                  onChange={(e) => setFormulaSearch(e.target.value)}
                  placeholder="Search 5,000+ PF2e formulas (e.g. Longsword, Striking, Healing Potion, Alchemist's Fire)..."
                  className="w-full pl-8 pr-3 py-2 bg-parchment-50 border border-parchment-300 rounded-lg text-xs text-stone-900 font-semibold focus:ring-2 focus:ring-gold-500 focus:outline-none"
                />
              </div>

              <div className="sm:col-span-5 flex gap-2">
                <select
                  value={formulaCategory}
                  onChange={(e) => setFormulaCategory(e.target.value)}
                  className="flex-1 p-2 bg-parchment-50 border border-parchment-300 rounded-lg text-xs font-bold text-stone-800 cursor-pointer"
                >
                  <option value="all">All Item Categories</option>
                  <option value="weapon">Weapons & Runes</option>
                  <option value="armor">Armor</option>
                  <option value="shield">Shields</option>
                  <option value="alchemical">Alchemical Items</option>
                  <option value="potion">Potions & Oils</option>
                  <option value="wand">Magic Wands</option>
                  <option value="scroll">Scrolls</option>
                  <option value="consumable">Consumables</option>
                  <option value="held">Worn & Held Gear</option>
                </select>

                {formulaSearch.trim() && !itemsData.some(i => i.name?.toLowerCase() === formulaSearch.trim().toLowerCase()) && (
                  <button
                    type="button"
                    onClick={handleAddCustomFormula}
                    className="px-2.5 py-1.5 bg-arcane-800 hover:bg-arcane-700 text-white font-bold rounded-lg text-xs shrink-0 flex items-center gap-1"
                    title="Add custom formula name"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Custom</span>
                  </button>
                )}
              </div>
            </div>

            {/* Compendium Formula Picker List */}
            <div className="border border-parchment-300 rounded-xl bg-parchment-50/70 max-h-48 overflow-y-auto divide-y divide-parchment-200">
              {filteredCompendiumFormulas.map(item => {
                const isKnown = formulas.some(f => String(f).toLowerCase() === item.name.toLowerCase() || f === item.id);
                return (
                  <div
                    key={item.id}
                    onClick={() => handleToggleCompendiumFormula(item.name)}
                    className={`px-3 py-2 flex items-center justify-between gap-2 cursor-pointer transition-colors text-xs ${
                      isKnown ? 'bg-emerald-50/90 hover:bg-emerald-100/80' : 'hover:bg-parchment-100'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-stone-900 truncate">{item.name}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-parchment-200 text-stone-700 font-semibold capitalize">
                          {item.category || item.type}
                        </span>
                      </div>
                      <div className="text-[11px] text-parchment-600 flex items-center gap-2 mt-0.5">
                        <span className="font-bold text-forge-800">Lvl {item.level}</span>
                        <span>&bull;</span>
                        <span className="font-mono font-semibold text-gold-800">{item.price}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{item.rarity || 'common'}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggleCompendiumFormula(item.name);
                      }}
                      className={`px-2.5 py-1 rounded-lg font-bold text-xs flex items-center gap-1 shrink-0 transition-colors ${
                        isKnown
                          ? 'bg-emerald-600 text-white hover:bg-red-600'
                          : 'bg-forge-700 hover:bg-forge-600 text-white'
                      }`}
                    >
                      {isKnown ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          <span>Known</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add Formula</span>
                        </>
                      )}
                    </button>
                  </div>
                );
              })}

              {filteredCompendiumFormulas.length === 0 && (
                <div className="p-4 text-center text-xs text-parchment-500 italic">
                  No matching compendium items found. Try unchecking the level filter or click &ldquo;+ Custom&rdquo; to add a custom formula.
                </div>
              )}
            </div>

            {/* Recorded Formulas Pill List */}
            <div>
              <span className="block text-[11px] font-bold text-stone-700 uppercase mb-1.5">
                Recorded in Character&apos;s Formula Book ({enrichedKnownFormulas.length}):
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1">
                {enrichedKnownFormulas.map((fItem) => (
                  <span
                    key={fItem.index}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-300 text-stone-900 text-xs font-semibold shadow-sm"
                  >
                    <span>{fItem.displayName}</span>
                    {fItem.level !== null && (
                      <span className="text-[10px] px-1 rounded bg-emerald-200/80 text-emerald-950 font-bold">
                        Lvl {fItem.level}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveFormula(fItem.index)}
                      className="text-stone-400 hover:text-red-600 font-bold ml-0.5"
                      title="Remove formula"
                    >
                      &times;
                    </button>
                  </span>
                ))}
                {enrichedKnownFormulas.length === 0 && (
                  <span className="text-xs text-parchment-500 italic">
                    No formulas recorded yet. Click &ldquo;+ Add Formula&rdquo; on any compendium item above!
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-parchment-300 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleExport}
            title="Download this character as a JSON file"
            className="px-3.5 py-2 rounded-xl bg-parchment-200 hover:bg-parchment-300 text-stone-800 border border-parchment-400 font-bold text-xs sm:text-sm transition-colors flex items-center gap-1.5"
          >
            <Download className="w-4 h-4 text-stone-600" />
            <span>Export JSON</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-parchment-400 text-stone-700 hover:bg-parchment-200 font-semibold text-sm transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-arcane-950 font-bold text-sm shadow-md transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
