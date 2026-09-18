import React, { useState, useMemo } from 'react';
import { 
  BookOpen, 
  Search, 
  Sparkles, 
  Clock, 
  Coins, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  Zap, 
  Crown, 
  ChevronRight, 
  Shield, 
  Layers, 
  BookMarked,
  FileText
} from 'lucide-react';
import { spellsIndex as spellsData, fetchSpellDescription } from '../services/compendiumLoader.js';
import { 
  LEARN_A_SPELL_TABLE, 
  calculateSpellDC, 
  calculateScribingTime, 
  TRADITION_SKILLS, 
  TRADITION_LABELS,
  SKILL_LABELS,
  SCROLL_MARKET_PRICES
} from '../services/scribeEngine.js';
import { copperToWealth, wealthToCopper, formatWealth } from '../services/characterImporter.js';
import { DiceRollerModal } from './DiceRollerModal.jsx';

export function ScribeSuite({
  character,
  onUpdateCharacter,
  scribeHistory = [],
  onUpdateHistory
}) {
  // Determine caster archetype from character class
  const rawClass = (character?.characterClass || 'Wizard').toLowerCase();
  
  let casterType = 'wizard'; // 'wizard', 'witch', 'magus', 'prepared_full', 'spontaneous', 'necromancer', 'archetype'
  let casterTypeLabel = 'Prepared (Spellbook)';
  let grimoireTitle = 'Spellbook';
  let learnActionLabel = 'Roll Learn a Spell (Scribe into Spellbook)';
  let outcomeDesc = 'In your spellbook. Ready to prepare tomorrow.';

  if (rawClass.includes('witch')) {
    casterType = 'witch';
    casterTypeLabel = 'Prepared (Familiar Grimoire)';
    grimoireTitle = 'Familiar Grimoire';
    learnActionLabel = 'Roll Learn a Spell (Teach to Familiar)';
    outcomeDesc = 'Taught to familiar. Ready to prepare tomorrow.';
  } else if (rawClass.includes('magus')) {
    casterType = 'magus';
    casterTypeLabel = 'Bounded Prepared (Spellbook)';
    grimoireTitle = 'Magus Spellbook';
    learnActionLabel = 'Roll Learn a Spell (Scribe into Spellbook)';
    outcomeDesc = 'In your spellbook. Ready to prepare in available slots tomorrow.';
  } else if (rawClass.includes('cleric') || rawClass.includes('druid') || rawClass.includes('animist')) {
    casterType = 'prepared_full';
    casterTypeLabel = 'Prepared (Full List)';
    grimoireTitle = 'Tradition Prepared Access (Uncommon/Rare)';
    learnActionLabel = 'Roll Learn a Spell (Add to Tradition List)';
    outcomeDesc = 'Permanently joins your tradition list. Ready to prepare tomorrow.';
  } else if (rawClass.includes('bard') || rawClass.includes('sorcerer') || rawClass.includes('oracle') || rawClass.includes('psychic') || rawClass.includes('summoner')) {
    casterType = 'spontaneous';
    casterTypeLabel = 'Spontaneous Repertoire';
    grimoireTitle = 'Repertoire Eligibility Pool';
    learnActionLabel = 'Roll Learn a Spell (Unlock for Repertoire)';
    outcomeDesc = 'Unlocked! Eligible to choose on next level-up or spell swap / retraining.';
  } else if (rawClass.includes('necromancer')) {
    casterType = 'necromancer';
    casterTypeLabel = 'Bounded Prepared (Dirge)';
    grimoireTitle = 'Dirge Eligibility Pool';
    learnActionLabel = 'Roll Learn a Spell (Unlock for Dirge)';
    outcomeDesc = 'Unlocked! Eligible for one of your 2 Dirge spell picks on level-up.';
  } else if (rawClass.includes('wizard')) {
    casterType = 'wizard';
    casterTypeLabel = 'Prepared (Spellbook)';
    grimoireTitle = 'Wizard Spellbook';
    learnActionLabel = 'Roll Learn a Spell (Scribe into Spellbook)';
    outcomeDesc = 'In your spellbook. Ready to prepare tomorrow.';
  } else {
    casterType = 'archetype';
    casterTypeLabel = 'Archetype Spellcasting';
    grimoireTitle = 'Archetype Known Spells';
    learnActionLabel = 'Roll Learn a Spell';
    outcomeDesc = 'Learned for your archetype tradition.';
  }

  // Determine primary tradition from character if available
  const initialTradition = character?.spellcasting?.traditions?.[0] || 'arcane';
  const [selectedTradition, setSelectedTradition] = useState(initialTradition);
  const [selectedRank, setSelectedRank] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSpell, setSelectedSpell] = useState(spellsData[0]);
  const [spellDescription, setSpellDescription] = useState('');

  // Sync tradition when active character changes
  React.useEffect(() => {
    const charTrad = character?.spellcasting?.traditions?.[0];
    if (charTrad && ['arcane', 'occult', 'divine', 'primal'].includes(charTrad.toLowerCase())) {
      setSelectedTradition(charTrad.toLowerCase());
    }
  }, [character?.id, character?.spellcasting?.traditions]);

  // Load description dynamically
  React.useEffect(() => {
    let active = true;
    if (selectedSpell?.id) {
      fetchSpellDescription(selectedSpell.id).then(desc => {
        if (active) setSpellDescription(desc);
      });
    } else {
      setSpellDescription(selectedSpell?.description || '');
    }
    return () => { active = false; };
  }, [selectedSpell?.id]);

  // Custom Spell Modal
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customSpell, setCustomSpell] = useState({
    name: '',
    rank: 1,
    traditions: ['arcane'],
    rarity: 'common',
    traits: []
  });

  // Dice Roller Modal
  const [diceModalOpen, setDiceModalOpen] = useState(false);

  // Active tradition skill
  const skillKey = TRADITION_SKILLS[selectedTradition] || 'arcana';
  const skillData = character?.skills?.[skillKey] || { rank: 1, mod: 7, rankName: 'Trained' };
  const skillLabel = SKILL_LABELS[skillKey] || 'Arcana';

  // Filtered Spells
  const filteredSpells = useMemo(() => {
    return spellsData.filter(spell => {
      const matchesSearch = (spell.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (spell.traits || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesTradition = selectedTradition === 'all' || (spell.traditions || []).includes(selectedTradition);
      const matchesRank = selectedRank === 'all' || spell.rank === Number(selectedRank);
      return matchesSearch && matchesTradition && matchesRank;
    });
  }, [searchQuery, selectedTradition, selectedRank]);

  // Math for Selected Spell
  const spellRank = selectedSpell?.rank ?? 1;
  const spellRarity = selectedSpell?.rarity || 'common';
  const targetDC = calculateSpellDC(spellRank, spellRarity);
  const rankTable = LEARN_A_SPELL_TABLE[spellRank] || LEARN_A_SPELL_TABLE[1];
  const basePriceCopper = rankTable.priceInCopper;
  const timeInfo = calculateScribingTime(character, spellRank);

  // Check if character already knows this spell
  const allKnownSpells = useMemo(() => {
    const fromEntries = (character?.spellcasting?.entries || []).flatMap(e => e.spells || []);
    const fromCustom = character?.learnedSpells || [];
    return Array.from(new Set([...fromEntries, ...fromCustom]));
  }, [character]);

  const isSpellKnown = (selectedSpell?.name && allKnownSpells.includes(selectedSpell.name)) || false;

  // Feat checks
  const hasShorthand = !!character?.feats?.magicalShorthand;
  const hasProdigy = !!character?.feats?.spellbookProdigy;

  // Custom Spell Submission
  const handleCreateCustomSpell = (e) => {
    e.preventDefault();
    if (!customSpell.name.trim()) return;
    const newSpell = {
      id: `custom-spell-${Date.now()}`,
      name: customSpell.name.trim(),
      rank: Number(customSpell.rank) || 1,
      traditions: customSpell.traditions || [selectedTradition],
      rarity: customSpell.rarity || 'common',
      traits: customSpell.traits || []
    };
    setSelectedSpell(newSpell);
    setShowCustomModal(false);
  };

  // Dice Result Handler
  const handleApplyDiceResult = (rollResult) => {
    const characterCopper = wealthToCopper(character.wealth);
    const isCritSuccess = rollResult.finalDegree === 'criticalSuccess';
    const isSuccess = rollResult.finalDegree === 'success';
    const isFailure = rollResult.finalDegree === 'failure';
    const isCritFailure = rollResult.finalDegree === 'criticalFailure';

    if (isCritSuccess || isSuccess) {
      const costToPay = isCritSuccess ? Math.round(basePriceCopper / 2) : basePriceCopper;
      
      if (characterCopper < costToPay) {
        alert(`Insufficient funds for ink/materials! Needed: ${formatWealth(copperToWealth(costToPay))}, but you only have ${formatWealth(character.wealth)}.`);
        return;
      }

      const updatedWealth = copperToWealth(characterCopper - costToPay);
      const updatedLearned = Array.from(new Set([...(character.learnedSpells || []), selectedSpell.name]));

      onUpdateCharacter({
        ...character,
        wealth: updatedWealth,
        learnedSpells: updatedLearned
      });

      const newLog = {
        id: `scribe-${Date.now()}`,
        spellName: selectedSpell.name,
        rank: spellRank,
        tradition: selectedTradition,
        date: new Date().toLocaleDateString(),
        costPaid: formatWealth(copperToWealth(costToPay)),
        goldSaved: isCritSuccess ? `+${formatWealth(copperToWealth(basePriceCopper - costToPay))} (50% Crit Discount)` : '0 gp',
        timeSpent: timeInfo.formatted,
        status: isCritSuccess ? 'Critical Success' : 'Success',
        degree: rollResult.finalDegree
      };
      onUpdateHistory([newLog, ...scribeHistory]);
    } else if (isCritFailure) {
      // Lose normal cost in ruined materials unless prevented
      const costToPay = basePriceCopper;
      const newCopper = Math.max(0, characterCopper - costToPay);
      onUpdateCharacter({ ...character, wealth: copperToWealth(newCopper) });

      const newLog = {
        id: `scribe-${Date.now()}`,
        spellName: selectedSpell.name,
        rank: spellRank,
        tradition: selectedTradition,
        date: new Date().toLocaleDateString(),
        costPaid: formatWealth(copperToWealth(costToPay)),
        goldSaved: '0 gp (Materials Ruined)',
        timeSpent: timeInfo.formatted,
        status: 'Critical Failure (1-Week Lockout)',
        degree: rollResult.finalDegree
      };
      onUpdateHistory([newLog, ...scribeHistory]);
      alert(`Critical Failure! Scribing failed and ruined ${formatWealth(copperToWealth(costToPay))} in rare inks.`);
    } else if (isFailure) {
      // 0 materials lost
      const newLog = {
        id: `scribe-${Date.now()}`,
        spellName: selectedSpell.name,
        rank: spellRank,
        tradition: selectedTradition,
        date: new Date().toLocaleDateString(),
        costPaid: '0 gp',
        goldSaved: 'Materials Preserved',
        timeSpent: timeInfo.formatted,
        status: 'Failure (1-Week Lockout)',
        degree: rollResult.finalDegree
      };
      onUpdateHistory([newLog, ...scribeHistory]);
    }
  };

  // Witch Familiar Feeding Action (1 Hour, 100% Guaranteed, consumes scroll without roll)
  const handleFeedScrollToFamiliar = () => {
    if (!selectedSpell) return;
    const scrollPrice = SCROLL_MARKET_PRICES[spellRank] || 400;
    const characterCopper = wealthToCopper(character.wealth);

    if (characterCopper < scrollPrice) {
      alert(`Insufficient funds for scroll! Needed: ${formatWealth(copperToWealth(scrollPrice))}, but you only have ${formatWealth(character.wealth)}.`);
      return;
    }

    if (!window.confirm(`Feed a Scroll of ${selectedSpell.name} (${formatWealth(copperToWealth(scrollPrice))}) to your familiar? This takes 1 hour of downtime and is 100% GUARANTEED without rolling a check. The scroll is consumed.`)) {
      return;
    }

    const updatedWealth = copperToWealth(characterCopper - scrollPrice);
    const updatedLearned = Array.from(new Set([...(character.learnedSpells || []), selectedSpell.name]));

    onUpdateCharacter({
      ...character,
      wealth: updatedWealth,
      learnedSpells: updatedLearned
    });

    const newLog = {
      id: `scribe-${Date.now()}`,
      spellName: selectedSpell.name,
      rank: spellRank,
      tradition: selectedTradition,
      date: new Date().toLocaleDateString(),
      costPaid: formatWealth(copperToWealth(scrollPrice)),
      goldSaved: '100% Guaranteed (No Check Needed)',
      timeSpent: '1 hour (Familiar Meal)',
      status: 'Success (Scroll Fed & Consumed)',
      degree: 'success'
    };
    onUpdateHistory([newLog, ...scribeHistory]);
  };

  const handleRemoveLearnedSpell = (spellNameToRemove) => {
    const updatedLearned = (character.learnedSpells || []).filter(s => s !== spellNameToRemove);
    const updatedEntries = (character?.spellcasting?.entries || []).map(entry => ({
      ...entry,
      spells: (entry.spells || []).filter(s => s !== spellNameToRemove)
    }));

    onUpdateCharacter({
      ...character,
      learnedSpells: updatedLearned,
      spellcasting: {
        ...(character.spellcasting || {}),
        entries: updatedEntries
      }
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Top Banner / Scribe Header */}
      <div className="bg-gradient-to-r from-arcane-950 via-purple-950 to-arcane-900 border-2 border-arcane-600 rounded-2xl p-4 sm:p-6 text-parchment-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-arcane-800 border-2 border-purple-400 flex items-center justify-center shadow-lg">
            <BookOpen className="w-6 h-6 text-purple-300" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-parchment-100 flex items-center gap-2">
              EvilScribe Grimoire
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-purple-900 border border-purple-500 text-purple-300 font-bold">
                {casterTypeLabel}
              </span>
            </h2>
            <p className="text-xs text-parchment-400">
              {character.name}&apos;s {grimoireTitle} • PF2e Remaster Spell Learning Engine
            </p>
          </div>
        </div>

        {/* Feats & Skills Badges */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs">
          <div className="bg-arcane-900/90 px-3 py-1.5 rounded-xl border border-arcane-700">
            <span className="text-parchment-400 block font-semibold">{skillLabel} Skill Mod</span>
            <span className="font-mono text-sm font-bold text-purple-300">+{skillData.mod} ({skillData.rankName})</span>
          </div>

          {hasShorthand && (
            <div className="bg-blue-950 px-3 py-1.5 rounded-xl border border-blue-600 text-blue-200 flex items-center gap-1.5 shadow" title="Magical Shorthand active: 10 min scribing + Success -> Crit Success">
              <Zap className="w-4 h-4 text-yellow-400" />
              <span className="font-bold">Shorthand (10 min)</span>
            </div>
          )}

          {hasProdigy && (
            <div className="bg-purple-950 px-3 py-1.5 rounded-xl border border-purple-600 text-purple-200 flex items-center gap-1.5 shadow" title="Spellbook Prodigy active: Crit Failures become Normal Failures">
              <Crown className="w-4 h-4 text-gold-300" />
              <span className="font-bold">Spellbook Prodigy</span>
            </div>
          )}

          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-purple-800 to-arcane-700 hover:from-purple-700 hover:to-arcane-600 border border-purple-400 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Custom Spell</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Spell Browser | Right Scribing Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Spell Catalog & Filter (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-parchment-300 shadow-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-arcane-950 flex items-center gap-2">
                <Search className="w-4 h-4 text-arcane-700" />
                <span>Spell Compendium</span>
              </h3>
              <span className="text-xs text-parchment-600 font-semibold">
                {filteredSpells.length} spells
              </span>
            </div>

            {/* Tradition Tabs */}
            <div className="flex rounded-xl bg-parchment-100 p-1 border border-parchment-200 text-xs">
              {['arcane', 'occult', 'divine', 'primal', 'all'].map(trad => (
                <button
                  key={trad}
                  type="button"
                  onClick={() => setSelectedTradition(trad)}
                  className={`flex-1 py-1.5 font-bold rounded-lg capitalize transition-all ${
                    selectedTradition === trad
                      ? 'bg-arcane-900 text-gold-300 shadow'
                      : 'text-stone-700 hover:text-stone-950'
                  }`}
                >
                  {trad}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-parchment-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search spells by name or trait..."
                className="w-full pl-9 pr-3 py-2 bg-parchment-50 border border-parchment-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>

            {/* Rank Selector */}
            <div className="flex flex-wrap gap-1">
              <button
                type="button"
                onClick={() => setSelectedRank('all')}
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  selectedRank === 'all' ? 'bg-purple-800 text-white' : 'bg-parchment-100 text-stone-700 hover:bg-parchment-200'
                }`}
              >
                All Ranks
              </button>
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(rnk => (
                <button
                  key={rnk}
                  type="button"
                  onClick={() => setSelectedRank(String(rnk))}
                  className={`px-2 py-1 rounded text-xs font-semibold ${
                    selectedRank === String(rnk)
                      ? 'bg-purple-800 text-white'
                      : 'bg-parchment-100 text-stone-700 hover:bg-parchment-200'
                  }`}
                >
                  {rnk === 0 ? 'Cantrip' : `R${rnk}`}
                </button>
              ))}
            </div>

            {/* Spell List */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredSpells.map(spell => {
                const isSelected = selectedSpell?.id === spell.id;
                const known = allKnownSpells.includes(spell.name);

                return (
                  <div
                    key={spell.id}
                    onClick={() => setSelectedSpell(spell)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-purple-50/90 border-purple-500 ring-2 ring-purple-400/50 shadow-sm'
                        : 'bg-parchment-50/70 hover:bg-parchment-100 border-parchment-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 truncate">{spell.name}</span>
                        {known && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-800 font-bold border border-purple-300 flex-shrink-0">
                            Learned
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-parchment-600">
                        <span className="font-semibold text-purple-900">
                          {spell.rank === 0 ? 'Cantrip' : `Rank ${spell.rank}`}
                        </span>
                        <span>&bull;</span>
                        <span className="capitalize text-stone-700">
                          {spell.traditions?.join(', ') || 'Arcane'}
                        </span>
                        <span>&bull;</span>
                        <span className="capitalize">{spell.rarity || 'common'}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-parchment-400 flex-shrink-0 ${isSelected ? 'text-purple-600 font-bold' : ''}`} />
                  </div>
                );
              })}

              {filteredSpells.length === 0 && (
                <div className="text-center py-8 text-xs text-parchment-500">
                  No spells found for tradition: {selectedTradition}.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Scribing Workbench & Spellbook (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedSpell && (
            <div className="bg-white rounded-2xl border-2 border-purple-500 shadow-xl p-5 space-y-5">
              
              {/* Target Spell Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-parchment-200">
                <div className="space-y-1">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-purple-700">Target Spell</span>
                  <h3 className="text-xl font-serif font-black text-arcane-950 flex items-center gap-2">
                    {selectedSpell.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-900 font-bold border border-purple-300">
                      {spellRank === 0 ? 'Cantrip' : `Rank ${spellRank}`}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-arcane-100 text-arcane-900 font-bold border border-arcane-300">
                      {selectedSpell.traditions?.map(t => TRADITION_LABELS[t] || t).join(', ')}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize border border-slate-300">
                      {spellRarity}
                    </span>
                  </div>
                  <div className="pt-1">
                    <span className="text-[11px] font-semibold text-purple-900 bg-purple-100/90 px-2.5 py-1 rounded-lg border border-purple-300 inline-block">
                      <strong>Target Outcome:</strong> {outcomeDesc}
                    </span>
                  </div>
                </div>

                {/* Scribe DC Badge */}
                <div className="text-right sm:text-center bg-gradient-to-br from-arcane-950 to-purple-950 text-parchment-100 px-4 py-2.5 rounded-xl border border-purple-500 shadow">
                  <span className="text-[10px] text-parchment-400 uppercase font-bold block">Learn a Spell DC</span>
                  <span className="text-2xl font-mono font-black text-gold-300">DC {targetDC}</span>
                </div>
              </div>

              {/* Smart Remaster Rule Advisories for Specific Caster Types */}
              {spellRarity === 'common' && casterType === 'prepared_full' && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-300 text-xs text-amber-950 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-amber-900">Common Spell — Already Prepared for Free</span>
                    <p className="text-amber-800 mt-0.5 leading-relaxed text-[11px]">
                      Under PF2e Remaster rules, Clerics, Druids, and Animists already prepare all Common spells in their tradition for free during daily preparations. Learn a Spell is only needed for <strong>Uncommon or Rare</strong> spells granted by your GM or deity.
                    </p>
                  </div>
                </div>
              )}

              {spellRarity === 'common' && casterType === 'spontaneous' && (
                <div className="p-3 rounded-xl bg-blue-50 border border-blue-300 text-xs text-blue-950 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-blue-900">Common Spell — Already Eligible on Level-Up</span>
                    <p className="text-blue-800 mt-0.5 leading-relaxed text-[11px]">
                      Spontaneous casters (Bards, Sorcerers, Oracles, Psychics, Summoners) already choose from all Common spells when leveling up or retraining. Scribing does not grant extra daily slots; it is only needed to unlock <strong>Uncommon or Rare</strong> spells for future swaps.
                    </p>
                  </div>
                </div>
              )}

              {spellRarity === 'common' && casterType === 'necromancer' && (
                <div className="p-3 rounded-xl bg-purple-50 border border-purple-300 text-xs text-purple-950 flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-purple-900">Common Spell — Direct Dirge Pick</span>
                    <p className="text-purple-800 mt-0.5 leading-relaxed text-[11px]">
                      Necromancers add 2 spells directly into their Dirge on level-up. Scribing is only needed to make <strong>Uncommon or Rare</strong> occult spells eligible for your Dirge slots.
                    </p>
                  </div>
                </div>
              )}

              {/* Learning Math & Scribing Requirements Breakdown */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div className="bg-parchment-50 p-3 rounded-xl border border-parchment-200">
                  <span className="text-parchment-600 block font-semibold">Material / Ink Cost</span>
                  <span className="font-mono text-base font-bold text-gold-800">
                    {formatWealth(copperToWealth(basePriceCopper))}
                  </span>
                  <span className="text-[10px] text-parchment-500 block">50% on Critical Success</span>
                </div>

                <div className="bg-parchment-50 p-3 rounded-xl border border-parchment-200">
                  <span className="text-parchment-600 block font-semibold">Time Required</span>
                  <span className="font-mono text-base font-bold text-purple-900">
                    {timeInfo.formatted}
                  </span>
                  <span className="text-[10px] text-parchment-500 block">{timeInfo.timePerRank}</span>
                </div>

                <div className="bg-parchment-50 p-3 rounded-xl border border-parchment-200">
                  <span className="text-parchment-600 block font-semibold">Roll Check Skill</span>
                  <span className="font-mono text-base font-bold text-blue-900">
                    +{skillData.mod} ({skillLabel})
                  </span>
                  <span className="text-[10px] text-parchment-500 block">Tradition: {selectedTradition}</span>
                </div>
              </div>

              {/* Spell Description & Rules Card */}
              {spellDescription && (
                <div className="p-3.5 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-serif font-bold text-arcane-950">
                    <FileText className="w-4 h-4 text-purple-700" />
                    <span>Spell Description & Rules</span>
                  </div>
                  <div 
                    className="text-stone-700 text-xs leading-relaxed max-h-48 overflow-y-auto pr-1 prose-sm prose-stone [&_p]:mb-1.5 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h4]:text-xs [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4"
                    dangerouslySetInnerHTML={{ __html: spellDescription }}
                  />
                </div>
              )}

              {/* Feats & Remaster Rules Active Indicators */}
              <div className="bg-gradient-to-br from-arcane-950 to-purple-950 p-4 rounded-xl text-parchment-100 border border-purple-500/50 space-y-2">
                <span className="text-xs font-serif font-bold text-gold-300 block">
                  Active Remaster Scribing Perks
                </span>
                <div className="space-y-1.5 text-xs text-parchment-200">
                  {hasShorthand ? (
                    <div className="flex items-center gap-2 text-blue-300 font-semibold">
                      <Zap className="w-4 h-4 text-yellow-300 flex-shrink-0" />
                      <span><strong>Magical Shorthand:</strong> Takes flat 10 min & any normal Success automatically becomes a Critical Success (50% gold savings)!</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-parchment-400">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span>Standard Scribing: Takes 1 hour per spell rank ({spellRank} hours total).</span>
                    </div>
                  )}

                  {hasProdigy ? (
                    <div className="flex items-center gap-2 text-purple-300 font-semibold">
                      <Crown className="w-4 h-4 text-gold-300 flex-shrink-0" />
                      <span><strong>Spellbook Prodigy:</strong> Critical Failures are reduced to standard Failures (0 ink/materials lost).</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-parchment-400">
                      <Shield className="w-4 h-4 flex-shrink-0" />
                      <span>Standard Rule: Critical Failure ruins materials worth full standard price ({formatWealth(copperToWealth(basePriceCopper))}).</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Scribe Action Buttons */}
              <div>
                {casterType === 'witch' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setDiceModalOpen(true)}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-arcane-700 to-purple-800 hover:from-purple-600 hover:to-arcane-600 text-white font-serif font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
                    >
                      <Sparkles className="w-4 h-4 text-gold-300" />
                      <span>Roll Learn a Spell (+{skillData.mod} vs DC {targetDC})</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleFeedScrollToFamiliar}
                      className="py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-700 via-teal-800 to-emerald-800 hover:from-emerald-600 hover:to-teal-700 text-white font-serif font-bold text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
                    >
                      <BookOpen className="w-4 h-4 text-emerald-300" />
                      <span>Feed Scroll to Familiar (1 Hr, Guaranteed)</span>
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDiceModalOpen(true)}
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-700 via-arcane-700 to-purple-800 hover:from-purple-600 hover:to-arcane-600 text-white font-serif font-bold text-sm sm:text-base shadow-lg transition-all flex items-center justify-center gap-2 transform active:scale-98"
                  >
                    <Sparkles className="w-5 h-5 text-gold-300" />
                    <span>{learnActionLabel} (+{skillData.mod} {skillLabel} vs DC {targetDC})</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Learned Grimoire / Familiar Spells Book */}
          <div className="bg-white rounded-2xl border border-parchment-300 shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-parchment-200">
              <div className="flex items-center gap-2">
                <BookMarked className="w-5 h-5 text-purple-800" />
                <h3 className="font-serif font-bold text-base text-arcane-950">
                  {character.name}&apos;s {grimoireTitle} ({allKnownSpells.length} spells)
                </h3>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 max-h-56 overflow-y-auto pr-1">
              {allKnownSpells.map((spName, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-300 text-xs font-semibold text-purple-950 shadow-sm"
                >
                  <span>{spName}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveLearnedSpell(spName)}
                    className="text-red-500 hover:text-red-700 ml-1 text-sm font-bold"
                    title="Remove spell"
                  >
                    &times;
                  </button>
                </span>
              ))}

              {allKnownSpells.length === 0 && (
                <div className="text-center py-6 w-full text-xs text-parchment-500 italic">
                  No spells learned yet. Select a spell above to attempt learning it!
                </div>
              )}
            </div>
          </div>

          {/* Scribe History & Lockout Tracker */}
          {scribeHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-parchment-300 shadow-md p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-parchment-200">
                <h3 className="font-serif font-bold text-base text-arcane-950 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-700" />
                  <span>Scribing & Learning History ({scribeHistory.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onUpdateHistory([])}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear History
                </button>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {scribeHistory.map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-parchment-50 border border-parchment-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-stone-900">{log.spellName} (Rank {log.rank})</span>
                      <div className="text-[11px] text-parchment-600">
                        {log.date} &bull; Time: {log.timeSpent} &bull; Paid: {log.costPaid} &bull; <span className="text-emerald-700 font-semibold">{log.goldSaved}</span>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] border ${
                      log.status.includes('Success')
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-red-100 text-red-800 border-red-300'
                    }`}>
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Spell Creator Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-parchment-50 border-2 border-gold-500 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-arcane-950">Add Custom Spell</h3>
            <form onSubmit={handleCreateCustomSpell} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Spell Name</label>
                <input
                  type="text"
                  value={customSpell.name}
                  onChange={(e) => setCustomSpell({ ...customSpell, name: e.target.value })}
                  placeholder="e.g. Eldritch Blast, Custom Hex..."
                  required
                  className="w-full p-2 bg-white border border-parchment-300 rounded-lg text-stone-900 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Rank (0=Cantrip, 1-10)</label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={customSpell.rank}
                    onChange={(e) => setCustomSpell({ ...customSpell, rank: parseInt(e.target.value, 10) || 1 })}
                    className="w-full p-2 bg-white border border-parchment-300 rounded-lg text-stone-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Rarity</label>
                  <select
                    value={customSpell.rarity}
                    onChange={(e) => setCustomSpell({ ...customSpell, rarity: e.target.value })}
                    className="w-full p-2 bg-white border border-parchment-300 rounded-lg text-stone-800 font-semibold"
                  >
                    <option value="common">Common (+0 DC)</option>
                    <option value="uncommon">Uncommon (+2 DC)</option>
                    <option value="rare">Rare (+5 DC)</option>
                    <option value="unique">Unique (+10 DC)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block font-bold text-stone-800 mb-1">Tradition</label>
                <select
                  value={customSpell.traditions[0]}
                  onChange={(e) => setCustomSpell({ ...customSpell, traditions: [e.target.value] })}
                  className="w-full p-2 bg-white border border-parchment-300 rounded-lg text-stone-800 font-semibold"
                >
                  <option value="arcane">Arcane</option>
                  <option value="occult">Occult</option>
                  <option value="divine">Divine</option>
                  <option value="primal">Primal</option>
                </select>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCustomModal(false)}
                  className="px-4 py-1.5 rounded-lg border border-parchment-400 text-stone-700 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-lg bg-purple-800 hover:bg-purple-700 text-white font-bold text-xs shadow"
                >
                  Save & Select
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={diceModalOpen}
        onClose={() => setDiceModalOpen(false)}
        title={`Learn a Spell: ${selectedSpell?.name}`}
        subtitle={`Rank ${spellRank} ${spellRarity} • ${selectedTradition.toUpperCase()} • DC ${targetDC}`}
        skillName={skillLabel}
        skillMod={skillData.mod}
        targetDC={targetDC}
        mode="scribe"
        character={character}
        onApplyResult={handleApplyDiceResult}
      />
    </div>
  );
}
