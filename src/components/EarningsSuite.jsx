import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  TrendingUp, 
  Calendar, 
  CheckCircle2, 
  AlertTriangle, 
  XCircle, 
  Trophy, 
  Sparkles, 
  Plus, 
  Trash2, 
  Hammer, 
  Music, 
  BookOpen, 
  Clock, 
  ChevronRight, 
  RotateCcw, 
  Award, 
  Info,
  ShieldAlert,
  ArrowRight,
  User,
  Zap,
  Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { 
  SETTLEMENT_PRESETS, 
  calculateEarnIncomeDC, 
  getDailyIncomeRate, 
  calculateJobPayout, 
  getPotentialOutcomesTable, 
  calculateAssuranceScore, 
  evaluateAssurance 
} from '../services/earningsEngine.js';
import { copperToWealth, wealthToCopper, formatWealth, RANK_NAMES } from '../services/characterImporter.js';
import { DiceRollerModal } from './DiceRollerModal.jsx';

export function EarningsSuite({
  character,
  onUpdateCharacter,
  earningsHistory = [],
  onUpdateHistory
}) {
  // Skill choice: 'crafting' | 'performance' | 'lore'
  const [skillType, setSkillType] = useState('crafting');
  const [selectedLoreId, setSelectedLoreId] = useState('');
  
  // Custom lore inline creation
  const [isAddingLore, setIsAddingLore] = useState(false);
  const [newLoreName, setNewLoreName] = useState('');
  const [newLoreRank, setNewLoreRank] = useState(1);
  const [newLoreMod, setNewLoreMod] = useState(5);

  // Settlement & Task Level
  const [selectedSettlementId, setSelectedSettlementId] = useState('town');
  const [taskLevel, setTaskLevel] = useState(4);

  // Downtime Duration (Days)
  const [daysWorked, setDaysWorked] = useState(7);

  // Modifiers & Feats
  const [useAssurance, setUseAssurance] = useState(false);
  const [isSpecialtyBonusActive, setIsSpecialtyBonusActive] = useState(false);
  const [isVirtuosicBonusActive, setIsVirtuosicBonusActive] = useState(false);

  // Dice Roller Modal
  const [isDiceOpen, setIsDiceOpen] = useState(false);

  // Last Evaluated Job Result (pending deposit or just deposited)
  const [activeJobResult, setActiveJobResult] = useState(null);
  const [hasDepositedActiveJob, setHasDepositedActiveJob] = useState(false);

  // Character wealth in copper
  const characterPurseCopper = wealthToCopper(character?.wealth || { pp: 0, gp: 0, sp: 0, cp: 0 });

  // Known Lore skills
  const charLores = useMemo(() => {
    return Array.isArray(character?.loreSkills) ? character.loreSkills : [];
  }, [character?.loreSkills]);

  // Set default selected lore if available and none selected
  React.useEffect(() => {
    if (charLores.length > 0 && !selectedLoreId) {
      setSelectedLoreId(charLores[0].id);
    }
  }, [charLores, selectedLoreId]);

  // Determine active skill details
  const activeSkillDetails = useMemo(() => {
    if (skillType === 'crafting') {
      const sk = character?.skills?.crafting || { rank: 1, mod: 7, rankName: 'Trained' };
      return {
        key: 'crafting',
        name: 'Crafting',
        rank: sk.rank ?? 1,
        mod: sk.mod ?? 7,
        rankName: sk.rankName || RANK_NAMES[sk.rank ?? 1],
        isLore: false,
        icon: Hammer
      };
    }
    if (skillType === 'performance') {
      const sk = character?.skills?.performance || { rank: 0, mod: 0, rankName: 'Untrained' };
      return {
        key: 'performance',
        name: 'Performance',
        rank: sk.rank ?? 0,
        mod: sk.mod ?? 0,
        rankName: sk.rankName || RANK_NAMES[sk.rank ?? 0],
        isLore: false,
        icon: Music
      };
    }
    // Lore
    const currentLore = charLores.find(l => l.id === selectedLoreId) || charLores[0] || {
      id: 'default-lore',
      name: 'General Lore',
      rank: 1,
      mod: 5,
      rankName: 'Trained'
    };
    return {
      key: `lore-${currentLore.id}`,
      name: currentLore.name,
      rank: currentLore.rank ?? 1,
      mod: currentLore.mod ?? 5,
      rankName: currentLore.rankName || RANK_NAMES[currentLore.rank ?? 1],
      isLore: true,
      icon: BookOpen
    };
  }, [skillType, selectedLoreId, character?.skills, charLores]);

  // Circumstance bonus calculation
  const circumstanceBonus = useMemo(() => {
    if (skillType === 'crafting' && isSpecialtyBonusActive) {
      // Master in Crafting gives +2, else +1
      return (activeSkillDetails.rank >= 3) ? 2 : 1;
    }
    if (skillType === 'performance' && isVirtuosicBonusActive) {
      return 2;
    }
    return 0;
  }, [skillType, isSpecialtyBonusActive, isVirtuosicBonusActive, activeSkillDetails.rank]);

  const circumstanceBonusLabel = useMemo(() => {
    if (skillType === 'crafting' && isSpecialtyBonusActive) return 'Specialty Crafting';
    if (skillType === 'performance' && isVirtuosicBonusActive) return 'Virtuosic Performer';
    return '';
  }, [skillType, isSpecialtyBonusActive, isVirtuosicBonusActive]);

  // Target DC for the task
  const targetDC = calculateEarnIncomeDC(taskLevel);

  // Potential Outcomes Preview
  const outcomesPreview = useMemo(() => {
    return getPotentialOutcomesTable(taskLevel, activeSkillDetails.rank, daysWorked);
  }, [taskLevel, activeSkillDetails.rank, daysWorked]);

  // Assurance Evaluation
  const assuranceData = useMemo(() => {
    return evaluateAssurance(character?.level || 1, activeSkillDetails.rank, targetDC);
  }, [character?.level, activeSkillDetails.rank, targetDC]);

  // Handle Settlement selection
  const handleSelectSettlement = (preset) => {
    setSelectedSettlementId(preset.id);
    if (preset.id !== 'custom') {
      setTaskLevel(preset.maxTaskLevel);
    }
  };

  // Add new custom lore to character
  const handleSaveNewLore = () => {
    if (!newLoreName.trim()) return;
    const newLore = {
      id: `lore-custom-${Date.now()}`,
      name: newLoreName.trim(),
      rank: Number(newLoreRank),
      mod: Number(newLoreMod),
      rankName: RANK_NAMES[Number(newLoreRank)]
    };
    const updated = {
      ...character,
      loreSkills: [...charLores, newLore]
    };
    onUpdateCharacter(updated);
    setSelectedLoreId(newLore.id);
    setNewLoreName('');
    setIsAddingLore(false);
  };

  // Handle Assurance Payout Claim
  const handleClaimAssurance = () => {
    const finalDegree = assuranceData.meetsDC ? 'success' : 'failure';
    const dailyCopper = getDailyIncomeRate(taskLevel, activeSkillDetails.rank, finalDegree);
    const payout = calculateJobPayout(dailyCopper, daysWorked);

    const resultObj = {
      id: `job-${Date.now()}`,
      timestamp: new Date().toISOString(),
      characterId: character.id,
      characterName: character.name,
      jobSkillName: activeSkillDetails.name,
      skillRank: activeSkillDetails.rank,
      skillRankName: activeSkillDetails.rankName,
      isAssurance: true,
      rollTotal: assuranceData.score,
      d20: null,
      targetDC,
      finalDegree,
      daysWorked,
      dailyCopper,
      totalCopper: payout.totalCopper,
      formattedPayout: payout.formatted,
      wealthPayout: payout.wealth,
      notes: [`Assurance used (Score ${assuranceData.score} vs DC ${targetDC})`]
    };

    setActiveJobResult(resultObj);
    setHasDepositedActiveJob(false);

    if (finalDegree === 'success') {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 }
      });
    }
  };

  // Handle Dice Roller Callback
  const handleApplyDiceResult = (rollOutcome) => {
    const finalDegree = rollOutcome.finalDegree;
    const dailyCopper = getDailyIncomeRate(taskLevel, activeSkillDetails.rank, finalDegree);
    const payout = calculateJobPayout(dailyCopper, daysWorked);

    const resultObj = {
      id: `job-${Date.now()}`,
      timestamp: new Date().toISOString(),
      characterId: character.id,
      characterName: character.name,
      jobSkillName: activeSkillDetails.name,
      skillRank: activeSkillDetails.rank,
      skillRankName: activeSkillDetails.rankName,
      isAssurance: false,
      rollTotal: rollOutcome.rollTotal,
      d20: rollOutcome.dieResult,
      targetDC,
      finalDegree,
      daysWorked,
      dailyCopper,
      totalCopper: payout.totalCopper,
      formattedPayout: payout.formatted,
      wealthPayout: payout.wealth,
      notes: rollOutcome.featNotes || []
    };

    setActiveJobResult(resultObj);
    setHasDepositedActiveJob(false);
  };

  // Deposit coins into Character's purse
  const handleDepositCoins = () => {
    if (!activeJobResult || hasDepositedActiveJob) return;

    const payoutCopper = activeJobResult.totalCopper;
    const newTotalCopper = characterPurseCopper + payoutCopper;
    const updatedWealth = copperToWealth(newTotalCopper);

    // Update character
    const updatedCharacter = {
      ...character,
      wealth: updatedWealth
    };
    onUpdateCharacter(updatedCharacter);

    // Append to history
    onUpdateHistory([activeJobResult, ...earningsHistory]);
    setHasDepositedActiveJob(true);

    confetti({
      particleCount: 90,
      spread: 70,
      origin: { y: 0.65 }
    });
  };

  // Clear single history entry
  const handleDeleteHistory = (jobId) => {
    onUpdateHistory(earningsHistory.filter(h => h.id !== jobId));
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (window.confirm('Are you sure you want to clear all Earn Income downtime logs?')) {
      onUpdateHistory([]);
    }
  };

  // Filter history for current character or all
  const characterHistory = earningsHistory.filter(h => h.characterId ? h.characterId === character?.id : true);
  const totalEarnedCopper = characterHistory.reduce((acc, h) => acc + (h.totalCopper || 0), 0);
  const totalDaysDowntime = characterHistory.reduce((acc, h) => acc + (h.daysWorked || 0), 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
      {/* Top Banner: Character Purse & Suite Introduction */}
      <div className="bg-gradient-to-r from-emerald-950 via-arcane-950 to-emerald-950 border-2 border-emerald-500/50 rounded-2xl p-5 shadow-xl text-parchment-100 flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 shadow-inner">
            <Coins className="w-8 h-8 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-serif font-bold text-emerald-200">
                EvilEarnings Suite
              </h2>
              <span className="text-xs font-mono uppercase tracking-wider bg-emerald-900/60 border border-emerald-500/40 px-2 py-0.5 rounded text-emerald-300">
                PF2e Remaster
              </span>
            </div>
            <p className="text-xs sm:text-sm text-parchment-400 max-w-xl">
              Official downtime <strong className="text-emerald-300">Earn Income</strong> engine. Put {character.name}&apos;s trade skills and lore knowledge to work during downtime!
            </p>
          </div>
        </div>

        {/* Live Purse Display */}
        <div className="flex items-center gap-4 bg-black/40 border border-emerald-500/30 rounded-xl px-4 py-2.5 shadow-inner">
          <div className="text-right">
            <span className="text-[10px] uppercase font-mono tracking-wider text-emerald-400 block">
              {character.name}&apos;s Purse
            </span>
            <div className="font-serif font-bold text-base sm:text-lg text-gold-300">
              {formatWealth(character?.wealth || { pp: 0, gp: 0, sp: 0, cp: 0 })}
            </div>
          </div>
          <div className="h-8 w-px bg-emerald-500/20" />
          <div className="text-center">
            <span className="text-[10px] uppercase font-mono tracking-wider text-parchment-400 block">
              Downtime Jobs
            </span>
            <div className="font-mono font-bold text-sm text-emerald-300">
              {characterHistory.length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Left Setup & Right Outcomes/History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Job Configuration (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-white/80 backdrop-blur-sm border border-parchment-300 rounded-2xl p-5 shadow-sm space-y-5">
            <h3 className="font-serif font-bold text-lg text-arcane-950 flex items-center gap-2 border-b border-parchment-200 pb-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>1. Select Trade Skill or Lore</span>
            </h3>

            {/* Skill Selector Tabs */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setSkillType('crafting')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  skillType === 'crafting'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-parchment-50 border-parchment-300 text-stone-700 hover:bg-parchment-100'
                }`}
              >
                <Hammer className={`w-5 h-5 mb-1 ${skillType === 'crafting' ? 'text-emerald-700' : 'text-stone-500'}`} />
                <span className="font-bold text-xs">Crafting</span>
                <span className="text-[10px] font-mono text-stone-500">
                  +{character?.skills?.crafting?.mod ?? 0} ({character?.skills?.crafting?.rankName ?? 'Trained'})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSkillType('performance')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  skillType === 'performance'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-parchment-50 border-parchment-300 text-stone-700 hover:bg-parchment-100'
                }`}
              >
                <Music className={`w-5 h-5 mb-1 ${skillType === 'performance' ? 'text-emerald-700' : 'text-stone-500'}`} />
                <span className="font-bold text-xs">Performance</span>
                <span className="text-[10px] font-mono text-stone-500">
                  +{character?.skills?.performance?.mod ?? 0} ({character?.skills?.performance?.rankName ?? 'Untrained'})
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSkillType('lore')}
                className={`flex flex-col items-center justify-center p-3 rounded-xl border text-center transition-all ${
                  skillType === 'lore'
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950 shadow-sm ring-2 ring-emerald-500/30'
                    : 'bg-parchment-50 border-parchment-300 text-stone-700 hover:bg-parchment-100'
                }`}
              >
                <BookOpen className={`w-5 h-5 mb-1 ${skillType === 'lore' ? 'text-emerald-700' : 'text-stone-500'}`} />
                <span className="font-bold text-xs">Lore Skills</span>
                <span className="text-[10px] font-mono text-stone-500">
                  {charLores.length} Known
                </span>
              </button>
            </div>

            {/* If Lore chosen: dropdown + Add Lore option */}
            {skillType === 'lore' && (
              <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-emerald-950">Active Lore Knowledge:</label>
                  <button
                    type="button"
                    onClick={() => setIsAddingLore(true)}
                    className="text-xs text-emerald-700 hover:text-emerald-900 font-bold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Lore</span>
                  </button>
                </div>

                {charLores.length > 0 ? (
                  <select
                    value={selectedLoreId}
                    onChange={(e) => setSelectedLoreId(e.target.value)}
                    className="w-full bg-white border border-emerald-300 rounded-lg p-2 text-sm text-stone-800 font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    {charLores.map(l => (
                      <option key={l.id} value={l.id}>
                        {l.name} (+{l.mod} • {l.rankName})
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-xs text-stone-600 italic bg-white p-2.5 rounded-lg border border-emerald-200 text-center">
                    No Lore skills listed yet. Click &quot;Add Lore&quot; to add one (e.g. Sailing Lore, Warfare Lore, Underworld Lore)!
                  </div>
                )}

                {/* Inline Lore Creator Form */}
                {isAddingLore && (
                  <div className="bg-white border-2 border-emerald-400 rounded-xl p-3 space-y-2.5 animate-fadeIn">
                    <span className="text-xs font-bold text-emerald-950 block">Create Custom Lore Skill</span>
                    <input
                      type="text"
                      placeholder="e.g. Sailing Lore, Warfare Lore"
                      value={newLoreName}
                      onChange={(e) => setNewLoreName(e.target.value)}
                      className="w-full border border-stone-300 rounded-lg p-1.5 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block">Proficiency Rank</label>
                        <select
                          value={newLoreRank}
                          onChange={(e) => setNewLoreRank(Number(e.target.value))}
                          className="w-full border border-stone-300 rounded-lg p-1 text-xs"
                        >
                          <option value={1}>Trained</option>
                          <option value={2}>Expert</option>
                          <option value={3}>Master</option>
                          <option value={4}>Legendary</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-stone-600 block">Total Modifier (+)</label>
                        <input
                          type="number"
                          value={newLoreMod}
                          onChange={(e) => setNewLoreMod(Number(e.target.value))}
                          className="w-full border border-stone-300 rounded-lg p-1 text-xs"
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingLore(false)}
                        className="px-2.5 py-1 rounded text-xs text-stone-600 hover:bg-stone-100"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleSaveNewLore}
                        className="px-3 py-1 rounded bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                      >
                        Save Lore
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Feat Automations & Circumstance Toggles */}
            <div className="space-y-2 pt-1">
              {/* Specialty Crafting Toggle */}
              {skillType === 'crafting' && character?.feats?.specialtyCrafting && (
                <label className="flex items-center gap-2 text-xs text-stone-800 bg-parchment-100 p-2.5 rounded-xl border border-parchment-300 cursor-pointer hover:bg-parchment-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={isSpecialtyBonusActive}
                    onChange={(e) => setIsSpecialtyBonusActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Specialty Crafting (+{activeSkillDetails.rank >= 3 ? 2 : 1} Circumstance Bonus)
                    </span>
                    <span className="text-[11px] text-stone-600">
                      Applies if this job falls within your specialty craft.
                    </span>
                  </div>
                </label>
              )}

              {/* Virtuosic Performer Toggle */}
              {skillType === 'performance' && character?.feats?.virtuosicPerformer && (
                <label className="flex items-center gap-2 text-xs text-stone-800 bg-parchment-100 p-2.5 rounded-xl border border-parchment-300 cursor-pointer hover:bg-parchment-200 transition-colors">
                  <input
                    type="checkbox"
                    checked={isVirtuosicBonusActive}
                    onChange={(e) => setIsVirtuosicBonusActive(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4"
                  />
                  <div>
                    <span className="font-bold text-stone-900 block">
                      Virtuosic Performer (+2 Circumstance Bonus)
                    </span>
                    <span className="text-[11px] text-stone-600">
                      Applies if busking/performing in your designated artistic specialty.
                    </span>
                  </div>
                </label>
              )}

              {/* Experienced Professional Banner */}
              {skillType === 'lore' && character?.feats?.experiencedProfessional && (
                <div className="flex items-start gap-2 bg-emerald-100/70 border border-emerald-400/60 rounded-xl p-2.5 text-xs text-emerald-950">
                  <Zap className="w-4 h-4 text-emerald-700 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block text-emerald-900">
                      Experienced Professional Feat Active
                    </span>
                    <span className="text-[11px] text-emerald-800">
                      Successes upgrade to <strong>Critical Successes</strong>! Critical Failures upgrade to normal <strong>Failures</strong> (you still get paid the untrained rate).
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Active Skill & Modifier Badge */}
            <div className="bg-emerald-950 text-parchment-100 rounded-xl p-3 flex items-center justify-between border border-emerald-500/40">
              <div className="flex items-center gap-2.5">
                <activeSkillDetails.icon className="w-5 h-5 text-emerald-400" />
                <div>
                  <span className="text-xs font-mono text-emerald-300 block uppercase">Selected Skill</span>
                  <span className="font-serif font-bold text-sm text-parchment-100">{activeSkillDetails.name}</span>
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-mono text-emerald-400 block">{activeSkillDetails.rankName}</span>
                <span className="font-mono font-bold text-base text-gold-300">
                  +{activeSkillDetails.mod + circumstanceBonus}
                  {circumstanceBonus > 0 && (
                    <span className="text-xs text-emerald-400 ml-1">({activeSkillDetails.mod}+{circumstanceBonus})</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Settlement & Task Level Panel */}
          <div className="bg-white/80 backdrop-blur-sm border border-parchment-300 rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-serif font-bold text-lg text-arcane-950 flex items-center gap-2 border-b border-parchment-200 pb-2">
              <Clock className="w-5 h-5 text-emerald-600" />
              <span>2. Settlement & Task Level</span>
            </h3>

            {/* Quick Settlement Presets */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-stone-700 block">Settlement Size (Sets Max Task Level):</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {SETTLEMENT_PRESETS.slice(0, 6).map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectSettlement(preset)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                      selectedSettlementId === preset.id
                        ? 'bg-emerald-700 border-emerald-800 text-white font-bold shadow-sm'
                        : 'bg-parchment-50 border-parchment-300 text-stone-700 hover:bg-parchment-100'
                    }`}
                  >
                    <span className="block truncate">{preset.name}</span>
                    <span className={`text-[10px] font-mono block ${selectedSettlementId === preset.id ? 'text-emerald-200' : 'text-stone-500'}`}>
                      Max Lvl {preset.maxTaskLevel} • DC {preset.dc}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Task Level Slider & Target DC */}
            <div className="bg-parchment-100/70 border border-parchment-300 rounded-xl p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-stone-900 block">Task Level:</span>
                  <span className="text-[11px] text-stone-600">
                    {taskLevel === character.level 
                      ? 'Equal to character level (Standard challenge)' 
                      : taskLevel < character.level 
                        ? `${character.level - taskLevel} levels below character (Safer job)` 
                        : `${taskLevel - character.level} levels above character (Risky)`}
                  </span>
                </div>
                <div className="text-right">
                  <span className="font-serif font-bold text-xl text-emerald-800">Level {taskLevel}</span>
                  <div className="text-xs font-mono font-bold text-stone-700 bg-white border border-stone-300 px-2 py-0.5 rounded shadow-inner inline-block ml-2">
                    Target DC {targetDC}
                  </div>
                </div>
              </div>

              <input
                type="range"
                min="0"
                max="20"
                value={taskLevel}
                onChange={(e) => {
                  setTaskLevel(Number(e.target.value));
                  setSelectedSettlementId('custom');
                }}
                className="w-full accent-emerald-600 h-2 bg-stone-200 rounded-lg cursor-pointer"
              />

              <div className="flex justify-between text-[10px] font-mono text-stone-500">
                <span>0 (DC 14)</span>
                <span>5 (DC 20)</span>
                <span>10 (DC 27)</span>
                <span>15 (DC 34)</span>
                <span>20 (DC 40)</span>
              </div>
            </div>

            {/* Downtime Days Selector */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-stone-700 block">Downtime Duration (Days Worked):</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[1, 7, 14, 30].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setDaysWorked(d)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-bold border text-center transition-all ${
                      daysWorked === d
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-sm'
                        : 'bg-parchment-50 border-parchment-300 text-stone-700 hover:bg-parchment-100'
                    }`}
                  >
                    {d === 1 ? '1 Day' : d === 7 ? '1 Week' : d === 14 ? '2 Weeks' : '1 Month'}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-xs text-stone-600">Custom Days:</span>
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={daysWorked}
                  onChange={(e) => setDaysWorked(Math.max(1, Number(e.target.value) || 1))}
                  className="w-20 border border-parchment-300 rounded-lg px-2 py-1 text-xs font-mono font-bold text-center focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
                <span className="text-xs text-stone-500 font-mono">({daysWorked} work days)</span>
              </div>
            </div>

            {/* Assurance Toggle */}
            {activeSkillDetails.rank >= 1 && (
              <div className="pt-2 border-t border-parchment-200">
                <label className="flex items-start gap-2 text-xs text-stone-800 bg-amber-50/60 p-2.5 rounded-xl border border-amber-300 cursor-pointer hover:bg-amber-50 transition-colors">
                  <input
                    type="checkbox"
                    checked={useAssurance}
                    onChange={(e) => setUseAssurance(e.target.checked)}
                    className="rounded text-amber-600 focus:ring-amber-500 w-4 h-4 mt-0.5"
                  />
                  <div>
                    <span className="font-bold text-amber-950 flex items-center gap-1">
                      <span>Use Assurance Feat (Take 10)</span>
                      <span className="text-[10px] font-mono bg-amber-200 text-amber-900 px-1.5 py-0.2 rounded">
                        Guaranteed Score {assuranceData.score}
                      </span>
                    </span>
                    <span className="text-[11px] text-amber-800 block">
                      Skip rolling entirely. {assuranceData.meetsDC 
                        ? `Meets DC ${targetDC} -> Guaranteed standard Success payout!` 
                        : `Does NOT meet DC ${targetDC} (Guaranteed Failure). Choose a lower Task Level!`}
                    </span>
                  </div>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Potential Payouts, Roll CTA, & History (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Payout Matrix Card */}
          <div className="bg-white/80 backdrop-blur-sm border border-parchment-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-parchment-200 pb-2">
              <h3 className="font-serif font-bold text-lg text-arcane-950 flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <span>3. Projected Remaster Payouts</span>
              </h3>
              <span className="text-xs font-mono text-stone-500">
                {daysWorked} Day{daysWorked > 1 ? 's' : ''} of Labor
              </span>
            </div>

            {/* 4 Outcome Rows */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Critical Success */}
              <div className="border border-emerald-300 bg-emerald-50/60 rounded-xl p-3 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <Trophy className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Critical Success</span>
                  </span>
                  <span className="text-[11px] font-mono text-emerald-700 bg-emerald-200/60 px-1.5 py-0.5 rounded">
                    Level {Math.min(20, taskLevel + 1)} Rate
                  </span>
                </div>
                <div className="font-serif font-bold text-base text-emerald-950">
                  {outcomesPreview.criticalSuccess.totalFormatted}
                </div>
                <div className="text-[11px] text-emerald-700 font-mono">
                  {outcomesPreview.criticalSuccess.dailyFormatted} / day
                </div>
              </div>

              {/* Standard Success */}
              <div className="border border-teal-300 bg-teal-50/60 rounded-xl p-3 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-teal-900 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
                    <span>Success</span>
                  </span>
                  <span className="text-[11px] font-mono text-teal-700 bg-teal-200/60 px-1.5 py-0.5 rounded">
                    Level {taskLevel} Rate
                  </span>
                </div>
                <div className="font-serif font-bold text-base text-teal-950">
                  {outcomesPreview.success.totalFormatted}
                </div>
                <div className="text-[11px] text-teal-700 font-mono">
                  {outcomesPreview.success.dailyFormatted} / day
                </div>
              </div>

              {/* Failure */}
              <div className="border border-amber-300 bg-amber-50/60 rounded-xl p-3 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                    <span>Failure</span>
                  </span>
                  <span className="text-[11px] font-mono text-amber-700 bg-amber-200/60 px-1.5 py-0.5 rounded">
                    Untrained Rate
                  </span>
                </div>
                <div className="font-serif font-bold text-base text-amber-950">
                  {outcomesPreview.failure.totalFormatted}
                </div>
                <div className="text-[11px] text-amber-700 font-mono">
                  {outcomesPreview.failure.dailyFormatted} / day
                </div>
              </div>

              {/* Critical Failure */}
              <div className="border border-rose-300 bg-rose-50/60 rounded-xl p-3 shadow-xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-rose-900 flex items-center gap-1">
                    <XCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Critical Failure</span>
                  </span>
                  <span className="text-[11px] font-mono text-rose-700 bg-rose-200/60 px-1.5 py-0.5 rounded">
                    Fired
                  </span>
                </div>
                <div className="font-serif font-bold text-base text-rose-950">
                  0 cp
                </div>
                <div className="text-[11px] text-rose-700 font-mono">
                  Earns nothing & dismissed
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2">
              {useAssurance ? (
                <button
                  type="button"
                  onClick={handleClaimAssurance}
                  disabled={!assuranceData.meetsDC}
                  className={`w-full py-3.5 px-4 rounded-xl font-serif font-bold text-base flex items-center justify-center gap-2 shadow-lg transition-all ${
                    assuranceData.meetsDC
                      ? 'bg-gradient-to-r from-amber-600 to-amber-700 text-white hover:from-amber-500 hover:to-amber-600 cursor-pointer active:scale-[0.99]'
                      : 'bg-stone-300 text-stone-500 cursor-not-allowed'
                  }`}
                >
                  <Award className="w-5 h-5 text-amber-200" />
                  <span>
                    Claim Guaranteed Assurance Earnings ({assuranceData.score} vs DC {targetDC})
                  </span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsDiceOpen(true)}
                  className="w-full py-3.5 px-4 rounded-xl font-serif font-bold text-base bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white hover:from-emerald-500 hover:to-emerald-600 shadow-lg shadow-emerald-900/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                  <span>
                    Roll Earn Income Check (d20 + {activeSkillDetails.mod + circumstanceBonus} vs DC {targetDC})
                  </span>
                </button>
              )}
            </div>
          </div>

          {/* Active / Evaluated Job Result Box */}
          {activeJobResult && (
            <div className={`border-2 rounded-2xl p-5 shadow-md space-y-4 animate-fadeIn ${
              activeJobResult.finalDegree === 'criticalSuccess'
                ? 'bg-emerald-950 text-parchment-100 border-emerald-400'
                : activeJobResult.finalDegree === 'success'
                ? 'bg-teal-950 text-parchment-100 border-teal-400'
                : activeJobResult.finalDegree === 'failure'
                ? 'bg-amber-950 text-parchment-100 border-amber-400'
                : 'bg-rose-950 text-parchment-100 border-rose-500'
            }`}>
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-white/10 pb-3">
                <div className="flex items-center gap-2">
                  {activeJobResult.finalDegree === 'criticalSuccess' && <Trophy className="w-6 h-6 text-gold-400" />}
                  {activeJobResult.finalDegree === 'success' && <CheckCircle2 className="w-6 h-6 text-emerald-400" />}
                  {activeJobResult.finalDegree === 'failure' && <AlertTriangle className="w-6 h-6 text-amber-400" />}
                  {activeJobResult.finalDegree === 'criticalFailure' && <XCircle className="w-6 h-6 text-rose-400" />}
                  <div>
                    <h4 className="font-serif font-bold text-lg capitalize text-white">
                      {activeJobResult.finalDegree === 'criticalSuccess' ? 'Critical Success!' : activeJobResult.finalDegree}
                    </h4>
                    <span className="text-xs text-parchment-300">
                      {activeJobResult.jobSkillName} • Task Level {taskLevel} (DC {targetDC}) • {activeJobResult.daysWorked} Days Worked
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-mono text-parchment-400 block">Total Earned</span>
                  <span className="font-serif font-bold text-xl text-gold-300">
                    {activeJobResult.formattedPayout}
                  </span>
                </div>
              </div>

              {/* Roll & Feat Notes */}
              <div className="text-xs text-parchment-300 space-y-1">
                <div>
                  {activeJobResult.isAssurance ? (
                    <span>Resolved with <strong>Assurance</strong> (Flat Score {activeJobResult.rollTotal} vs DC {targetDC}).</span>
                  ) : (
                    <span>
                      d20 Roll: <strong>{activeJobResult.d20}</strong> + Modifier = <strong>{activeJobResult.rollTotal}</strong> vs DC {targetDC}.
                    </span>
                  )}
                </div>
                {activeJobResult.notes?.map((n, idx) => (
                  <div key={idx} className="text-emerald-300 flex items-center gap-1">
                    <Zap className="w-3 h-3 text-gold-400" />
                    <span>{n}</span>
                  </div>
                ))}
              </div>

              {/* Deposit Button */}
              <div>
                {hasDepositedActiveJob ? (
                  <div className="bg-white/10 border border-white/20 rounded-xl p-3 flex items-center justify-center gap-2 text-emerald-300 font-bold text-sm">
                    <Check className="w-5 h-5" />
                    <span>Successfully deposited {activeJobResult.formattedPayout} into {character.name}&apos;s purse!</span>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDepositCoins}
                    disabled={activeJobResult.totalCopper === 0}
                    className="w-full py-3 px-4 rounded-xl font-serif font-bold text-sm sm:text-base bg-gradient-to-r from-gold-500 to-amber-600 hover:from-gold-400 hover:to-amber-500 text-arcane-950 shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-[0.99]"
                  >
                    <Coins className="w-5 h-5 text-arcane-950" />
                    <span>
                      Deposit {activeJobResult.formattedPayout} into {character.name}&apos;s Purse
                    </span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Downtime History & Records */}
          <div className="bg-white/80 backdrop-blur-sm border border-parchment-300 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-parchment-200 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-emerald-600" />
                <h3 className="font-serif font-bold text-lg text-arcane-950">
                  Downtime Earnings History
                </h3>
                <span className="text-xs font-mono text-stone-500 bg-stone-100 px-2 py-0.5 rounded-full border">
                  {characterHistory.length}
                </span>
              </div>

              {characterHistory.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearAllHistory}
                  className="text-xs text-rose-600 hover:text-rose-800 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear All</span>
                </button>
              )}
            </div>

            {/* Total summary stats */}
            {characterHistory.length > 0 && (
              <div className="grid grid-cols-2 gap-3 bg-parchment-100/70 border border-parchment-300 rounded-xl p-3 text-center">
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 block">
                    Total Downtime Days
                  </span>
                  <span className="font-mono font-bold text-base text-stone-800">
                    {totalDaysDowntime} Days
                  </span>
                </div>
                <div>
                  <span className="text-[10px] uppercase font-mono tracking-wider text-stone-500 block">
                    Total Coins Earned
                  </span>
                  <span className="font-serif font-bold text-base text-emerald-800">
                    {formatWealth(copperToWealth(totalEarnedCopper))}
                  </span>
                </div>
              </div>
            )}

            {/* History List */}
            {characterHistory.length > 0 ? (
              <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                {characterHistory.map((item) => (
                  <div
                    key={item.id}
                    className="border border-parchment-300 bg-white/90 rounded-xl p-3 flex items-center justify-between gap-3 shadow-2xs hover:border-emerald-400 transition-all"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold uppercase px-1.5 py-0.5 rounded ${
                          item.finalDegree === 'criticalSuccess'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : item.finalDegree === 'success'
                            ? 'bg-teal-100 text-teal-800 border border-teal-300'
                            : item.finalDegree === 'failure'
                            ? 'bg-amber-100 text-amber-800 border border-amber-300'
                            : 'bg-rose-100 text-rose-800 border border-rose-300'
                        }`}>
                          {item.finalDegree}
                        </span>
                        <span className="font-serif font-bold text-sm text-stone-900">
                          {item.jobSkillName}
                        </span>
                        <span className="text-xs text-stone-500 font-mono">
                          • {item.daysWorked} Day{item.daysWorked > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div className="text-[11px] text-stone-500 font-mono flex items-center gap-2">
                        <span>Lvl {taskLevel} (DC {item.targetDC})</span>
                        <span>•</span>
                        <span>{item.isAssurance ? `Assurance (${item.rollTotal})` : `Roll ${item.rollTotal}`}</span>
                        <span>•</span>
                        <span>{new Date(item.timestamp).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <span className="font-serif font-bold text-sm text-emerald-800 block">
                          +{item.formattedPayout}
                        </span>
                        <span className="text-[10px] text-stone-400 font-mono block">
                          {formatWealth(copperToWealth(item.dailyCopper))}/day
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteHistory(item.id)}
                        className="text-stone-400 hover:text-rose-600 p-1 rounded transition-colors"
                        title="Delete log entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-stone-500 text-xs italic space-y-1">
                <Coins className="w-8 h-8 text-stone-300 mx-auto mb-2" />
                <p>No downtime earnings recorded for {character.name} yet.</p>
                <p className="text-stone-400">Configure a task on the left and roll to start earning coins!</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dice Roller Modal */}
      <DiceRollerModal
        isOpen={isDiceOpen}
        onClose={() => setIsDiceOpen(false)}
        title={`Earn Income: ${activeSkillDetails.name}`}
        subtitle={`Task Level ${taskLevel} • Target DC ${targetDC} • ${daysWorked} Days Worked`}
        skillName={activeSkillDetails.name}
        skillMod={activeSkillDetails.mod}
        targetDC={targetDC}
        mode="earnings"
        character={character}
        circumstanceBonus={circumstanceBonus}
        circumstanceBonusLabel={circumstanceBonusLabel}
        isLoreSkill={activeSkillDetails.isLore}
        onApplyResult={handleApplyDiceResult}
      />
    </div>
  );
}
