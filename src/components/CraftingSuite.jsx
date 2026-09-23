import React, { useState, useMemo } from 'react';
import { 
  Hammer, 
  Search, 
  Filter, 
  Coins, 
  Calendar, 
  Zap, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Plus, 
  Trash2, 
  RotateCcw,
  Sparkles,
  Layers,
  ChevronRight,
  ShieldAlert,
  BookOpen,
  FileText,
  Gem,
  FastForward
} from 'lucide-react';
import { itemsIndex as itemsData, spellsIndex as spellsData, fetchItemDescription } from '../services/compendiumLoader.js';
import { 
  calculateCraftingDC, 
  getDailyEarnIncomeRate, 
  priceToCopper, 
  checkHasFormula,
  extractSpellCostGp,
  PRECIOUS_MATERIALS,
  isMaterialEligible,
  getItemEquipmentType,
  getPreciousMaterialDetails
} from '../services/craftingEngine.js';
import { copperToWealth, wealthToCopper, formatWealth } from '../services/characterImporter.js';
import { DiceRollerModal } from './DiceRollerModal.jsx';

export function CraftingSuite({ 
  character, 
  onUpdateCharacter,
  downtimeProjects = [],
  onUpdateProjects,
  craftHistory = [],
  onUpdateHistory
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [formulasOnly, setFormulasOnly] = useState(false);
  const [craftableOnly, setCraftableOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedItem, setSelectedItem] = useState(itemsData[0]);
  const [itemDescription, setItemDescription] = useState('');
  const [batchQuantity, setBatchQuantity] = useState(1);
  const [selectedImbuedSpell, setSelectedImbuedSpell] = useState('');
  const [spellTargetLevel, setSpellTargetLevel] = useState(1);
  const [extraMaterialCostGp, setExtraMaterialCostGp] = useState(0);
  const [selectedMaterial, setSelectedMaterial] = useState('none');
  const [selectedMaterialGrade, setSelectedMaterialGrade] = useState('standard');

  // Selected spell object
  const selectedSpellObj = useMemo(() => {
    if (!selectedImbuedSpell) return null;
    return spellsData.find(s => s.name === selectedImbuedSpell) || null;
  }, [selectedImbuedSpell]);

  // When selectedItem changes, reset imbued spell, extra cost, & materials
  React.useEffect(() => {
    setSelectedImbuedSpell('');
    setExtraMaterialCostGp(0);
    setSpellTargetLevel(1);
    setSelectedMaterial('none');
    setSelectedMaterialGrade('standard');
  }, [selectedItem?.id]);

  // When imbued spell or target level changes, automatically compute extra material cost
  React.useEffect(() => {
    if (selectedSpellObj?.cost) {
      const computed = extractSpellCostGp(selectedSpellObj, spellTargetLevel);
      setExtraMaterialCostGp(computed);
    } else {
      setExtraMaterialCostGp(0);
    }
  }, [selectedSpellObj, spellTargetLevel]);
  
  // Custom item creation state
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [customItem, setCustomItem] = useState({
    name: '',
    level: 1,
    price: '10 gp',
    rarity: 'common',
    category: 'custom',
    traits: ['magical']
  });

  // Load description dynamically
  React.useEffect(() => {
    let active = true;
    if (selectedItem?.id) {
      fetchItemDescription(selectedItem.id).then(desc => {
        if (active) setItemDescription(desc);
      });
    } else {
      setItemDescription(selectedItem?.description || '');
    }
    return () => { active = false; };
  }, [selectedItem?.id]);

  // Dice Roller Modal state
  const [diceModalOpen, setDiceModalOpen] = useState(false);
  const [activeCheckTarget, setActiveCheckTarget] = useState(null); // 'instant' or 'downtime-start'

  // Categories list
  const categories = [
    { id: 'all', label: 'All Items' },
    { id: 'wand', label: 'Magic Wands' },
    { id: 'scroll', label: 'Scrolls' },
    { id: 'potion', label: 'Potions & Oils' },
    { id: 'alchemical', label: 'Alchemical' },
    { id: 'weapon', label: 'Weapons & Runes' },
    { id: 'armor', label: 'Armor & Shields' },
    { id: 'consumable', label: 'Consumables' },
    { id: 'held', label: 'Worn & Held' }
  ];

  const knownFormulasCount = character?.formulas?.length || 0;

  // Filtered compendium items
  const filteredItems = useMemo(() => {
    const charLevel = character?.level ?? 20;
    return itemsData.filter(item => {
      const matchesSearch = (item.name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.traits || []).some(t => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || 
        (selectedCategory === 'wand' && item.isWand) ||
        (selectedCategory === 'scroll' && item.isScroll) ||
        item.category === selectedCategory ||
        item.type === selectedCategory;
      const matchesLevel = !craftableOnly || (item.level ?? 0) <= charLevel;
      const matchesFormula = !formulasOnly || checkHasFormula(item, character);
      return matchesSearch && matchesCategory && matchesLevel && matchesFormula;
    });
  }, [searchQuery, selectedCategory, craftableOnly, formulasOnly, character]);

  // Material calculations
  const isEligibleForMaterial = useMemo(() => isMaterialEligible(selectedItem), [selectedItem]);
  const materialDetails = useMemo(() => {
    if (!isEligibleForMaterial) {
      return {
        material: PRECIOUS_MATERIALS.none,
        grade: PRECIOUS_MATERIALS.none.grades.standard,
        effectivePriceCopper: priceToCopper(selectedItem?.price || '0 gp'),
        effectiveLevel: selectedItem?.level ?? 0,
        displayName: selectedItem?.name || 'Item',
        materialTraits: [],
        minProficiency: 0
      };
    }
    return getPreciousMaterialDetails(
      selectedMaterial,
      selectedMaterialGrade,
      selectedItem,
      priceToCopper(selectedItem?.price || '0 gp'),
      selectedItem?.level ?? 0
    );
  }, [isEligibleForMaterial, selectedMaterial, selectedMaterialGrade, selectedItem]);

  // Materials compatible with the selected item's equipment type
  const availableMaterials = useMemo(() => {
    if (!selectedItem) return [];
    const equipType = getItemEquipmentType(selectedItem);
    return Object.values(PRECIOUS_MATERIALS).filter(m => {
      if (m.id === 'none') return true;
      return !m.types || m.types.includes(equipType);
    });
  }, [selectedItem]);

  // Crafting calculations for selected item
  const itemLevel = materialDetails.effectiveLevel;
  const itemRarity = selectedItem?.rarity || 'common';
  const targetDC = calculateCraftingDC(itemLevel, itemRarity);
  const hasFormula = checkHasFormula(selectedItem, character);

  const baseItemPriceCopper = materialDetails.effectivePriceCopper;
  const extraComponentCopper = Math.max(0, Math.round((Number(extraMaterialCostGp) || 0) * 100));
  const totalItemPriceCopper = baseItemPriceCopper + extraComponentCopper;
  const totalPriceCopper = totalItemPriceCopper * batchQuantity;
  const rawMaterialsCopper = (Math.round(baseItemPriceCopper / 2) + extraComponentCopper) * batchQuantity;
  const remainingCostCopper = (baseItemPriceCopper - Math.round(baseItemPriceCopper / 2)) * batchQuantity;

  // Crafter skill & reduction rate
  const crafterRank = character?.skills?.crafting?.rank ?? 1;
  const crafterMod = character?.skills?.crafting?.mod ?? 0;
  const crafterLevel = character?.level ?? 1;
  const dailyReductionCopper = getDailyEarnIncomeRate(crafterLevel, crafterRank);

  // Specialty Crafting active job toggle
  const [specialtyApplied, setSpecialtyApplied] = useState(false);
  const hasSpecialtyFeat = !!character?.feats?.specialtyCrafting;
  const hasImpeccableFeat = !!character?.feats?.impeccableCrafting;
  const specialtyBonus = specialtyApplied ? (crafterRank >= 3 ? 2 : (crafterRank >= 1 ? 1 : 0)) : 0;
  const isImpeccableActive = specialtyApplied && hasImpeccableFeat;

  // Available spells for wand/scroll imbuing
  const availableImbueSpells = useMemo(() => {
    if (!selectedItem?.isWand && !selectedItem?.isScroll) return [];
    const targetRank = selectedItem.spellRank ?? 1;
    return spellsData.filter(s => s.rank === targetRank);
  }, [selectedItem]);

  // Handle custom item submission
  const handleCreateCustomItem = (e) => {
    e.preventDefault();
    if (!customItem.name.trim()) return;
    const newItem = {
      id: `custom-${Date.now()}`,
      name: customItem.name.trim(),
      level: Number(customItem.level) || 0,
      price: customItem.price.trim() || '1 gp',
      rarity: customItem.rarity || 'common',
      category: customItem.category || 'custom',
      traits: customItem.traits || ['custom']
    };
    setSelectedItem(newItem);
    setShowCustomModal(false);
  };

  // Trigger craft roll
  const handleOpenCraftCheck = (targetMode) => {
    setActiveCheckTarget(targetMode);
    setDiceModalOpen(true);
  };

  // Apply check result
  const handleApplyDiceResult = (rollResult) => {
    const isSuccess = rollResult.finalDegree === 'success' || rollResult.finalDegree === 'criticalSuccess';
    const isCrit = rollResult.finalDegree === 'criticalSuccess';
    const characterCopper = wealthToCopper(character.wealth);

    const effectiveDisplayName = selectedImbuedSpell 
      ? `${materialDetails.displayName} (${selectedImbuedSpell})`
      : materialDetails.displayName;

    if (activeCheckTarget === 'instant') {
      if (isSuccess) {
        // Deduct full price (rush)
        if (characterCopper < totalPriceCopper) {
          alert(`Insufficient funds! Total cost is ${formatWealth(copperToWealth(totalPriceCopper))}, but you only have ${formatWealth(character.wealth)}.`);
          return;
        }
        const updatedWealth = copperToWealth(characterCopper - totalPriceCopper);
        onUpdateCharacter({ ...character, wealth: updatedWealth });

        const newLog = {
          id: `craft-${Date.now()}`,
          itemName: effectiveDisplayName,
          quantity: batchQuantity,
          date: new Date().toLocaleDateString(),
          costPaid: formatWealth(copperToWealth(totalPriceCopper)),
          goldSaved: isCrit ? 'Critical Craft Mastery' : '0 gp (Instant Rush)',
          status: isCrit ? 'Completed (Critical Rush)' : 'Completed (Rush)',
          degree: rollResult.finalDegree,
          material: selectedMaterial !== 'none' ? `${materialDetails.material.name} (${materialDetails.grade.name})` : null
        };
        onUpdateHistory([newLog, ...craftHistory]);
      } else if (rollResult.finalDegree === 'criticalFailure') {
        // Ruin 10% of raw materials
        const lossCopper = Math.round(rawMaterialsCopper * 0.1);
        const newCopper = Math.max(0, characterCopper - lossCopper);
        onUpdateCharacter({ ...character, wealth: copperToWealth(newCopper) });
        alert(`Critical Failure! You ruined materials worth ${formatWealth(copperToWealth(lossCopper))}.`);
      }
    } else if (activeCheckTarget === 'downtime-start') {
      if (isSuccess) {
        // Start downtime project: Pay 50% initial raw materials
        if (characterCopper < rawMaterialsCopper) {
          alert(`Insufficient funds for raw materials! Needed: ${formatWealth(copperToWealth(rawMaterialsCopper))}.`);
          return;
        }
        const updatedWealth = copperToWealth(characterCopper - rawMaterialsCopper);
        onUpdateCharacter({ ...character, wealth: updatedWealth });

        // Critical success Earn Income rate uses level + 1 (Remaster rules)
        const projectDailyRate = getDailyEarnIncomeRate(crafterLevel, crafterRank, isCrit);
        const setupDays = hasFormula ? 1 : 2;

        const newProject = {
          id: `proj-${Date.now()}`,
          itemName: effectiveDisplayName,
          itemLevel,
          rarity: itemRarity,
          quantity: batchQuantity,
          totalPriceCopper,
          rawMaterialsCopper,
          remainingBalanceCopper: remainingCostCopper,
          setupDays,
          daysWorked: 0,
          dailyReductionCopper: projectDailyRate,
          accumulatedSavingsCopper: 0,
          degree: rollResult.finalDegree,
          specialtyApplied,
          dateStarted: new Date().toLocaleDateString(),
          material: selectedMaterial !== 'none' ? `${materialDetails.material.name} (${materialDetails.grade.name})` : null
        };
        onUpdateProjects([newProject, ...downtimeProjects]);
      } else if (rollResult.finalDegree === 'criticalFailure') {
        const lossCopper = Math.round(rawMaterialsCopper * 0.1);
        const newCopper = Math.max(0, characterCopper - lossCopper);
        onUpdateCharacter({ ...character, wealth: copperToWealth(newCopper) });
        alert(`Critical Failure! Crafting failed and ruined ${formatWealth(copperToWealth(lossCopper))} in raw materials.`);
      }
    }
  };

  // Downtime Project Actions
  const handleAdvanceDays = (projectId, daysToAdd) => {
    onUpdateProjects(downtimeProjects.map(proj => {
      if (proj.id !== projectId) return proj;

      const currentSaved = proj.accumulatedSavingsCopper || 0;
      const remainingToPay = Math.max(0, proj.remainingBalanceCopper - currentSaved);
      if (remainingToPay <= 0) return proj;

      const daysNeeded = proj.dailyReductionCopper > 0 ? Math.ceil(remainingToPay / proj.dailyReductionCopper) : 0;
      const effectiveDays = daysNeeded > 0 ? Math.min(daysToAdd, daysNeeded) : daysToAdd;

      const newDays = proj.daysWorked + effectiveDays;
      const additionalReduction = proj.dailyReductionCopper * effectiveDays;
      const newSavings = Math.min(proj.remainingBalanceCopper, currentSaved + additionalReduction);
      const newRemainingCost = Math.max(0, proj.remainingBalanceCopper - newSavings);

      return {
        ...proj,
        daysWorked: newDays,
        accumulatedSavingsCopper: newSavings,
        currentRemainingCostCopper: newRemainingCost
      };
    }));
  };

  const handleCompleteProject = (proj) => {
    const remainingToPay = Math.max(0, (proj.currentRemainingCostCopper !== undefined ? proj.currentRemainingCostCopper : (proj.remainingBalanceCopper - proj.accumulatedSavingsCopper)));
    const characterCopper = wealthToCopper(character.wealth);

    if (characterCopper < remainingToPay) {
      alert(`Insufficient funds to pay final balance of ${formatWealth(copperToWealth(remainingToPay))}!`);
      return;
    }

    const updatedWealth = copperToWealth(characterCopper - remainingToPay);
    onUpdateCharacter({ ...character, wealth: updatedWealth });

    // Remove from active projects
    onUpdateProjects(downtimeProjects.filter(p => p.id !== proj.id));

    // Add to history
    const totalPaidCopper = proj.rawMaterialsCopper + remainingToPay;
    const totalSavedCopper = proj.accumulatedSavingsCopper;
    const setupDays = proj.setupDays || 1;
    const totalDays = setupDays + (proj.daysWorked || 0);

    const newLog = {
      id: `craft-${Date.now()}`,
      itemName: proj.itemName,
      quantity: proj.quantity,
      date: new Date().toLocaleDateString(),
      setupDays,
      daysWorked: proj.daysWorked || 0,
      totalDays,
      costPaid: formatWealth(copperToWealth(totalPaidCopper)),
      goldSaved: `+${formatWealth(copperToWealth(totalSavedCopper))}`,
      status: `Completed (Downtime • ${totalDays}d total)`,
      degree: proj.degree,
      material: proj.material || null
    };
    onUpdateHistory([newLog, ...craftHistory]);
  };

  const handleCancelProject = (proj) => {
    if (!window.confirm(`Cancel this crafting project? You will salvage and recover 100% of your initial raw materials (${formatWealth(copperToWealth(proj.rawMaterialsCopper))}).`)) {
      return;
    }
    // Salvage 100% raw materials
    const characterCopper = wealthToCopper(character.wealth);
    const updatedWealth = copperToWealth(characterCopper + proj.rawMaterialsCopper);
    onUpdateCharacter({ ...character, wealth: updatedWealth });

    onUpdateProjects(downtimeProjects.filter(p => p.id !== proj.id));
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6 animate-fadeIn">
      {/* Top Banner / Crafter Header */}
      <div className="bg-gradient-to-r from-forge-950 via-arcane-950 to-forge-900 border-2 border-forge-600 rounded-2xl p-4 sm:p-6 text-parchment-100 shadow-xl flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-xl bg-forge-800 border-2 border-orange-400 flex items-center justify-center shadow-lg">
            <Hammer className="w-6 h-6 text-orange-300" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-serif font-black text-parchment-100 flex items-center gap-2">
              EvilCraft Workbench
              <span className="text-xs font-sans px-2.5 py-0.5 rounded-full bg-forge-900 border border-orange-500 text-orange-300 font-bold">
                PF2e Remaster
              </span>
            </h2>
            <p className="text-xs text-parchment-400">
              Instant Rush & Downtime Crafting Engine with Automatic Positive Savings & Daily Earn Income
            </p>
          </div>
        </div>

        {/* Crafter stats overview */}
        <div className="flex flex-wrap items-center gap-3 text-xs">
          <div className="bg-arcane-900/90 px-3 py-1.5 rounded-xl border border-arcane-700">
            <span className="text-parchment-400 block font-semibold">Crafting Mod</span>
            <span className="font-mono text-sm font-bold text-orange-300">+{crafterMod} ({character?.skills?.crafting?.rankName || 'Untrained'})</span>
          </div>
          <div className="bg-arcane-900/90 px-3 py-1.5 rounded-xl border border-arcane-700">
            <span className="text-parchment-400 block font-semibold">Daily Reduction</span>
            <span className="font-mono text-sm font-bold text-gold-300">+{formatWealth(copperToWealth(dailyReductionCopper))}/day</span>
          </div>
          <button
            type="button"
            onClick={() => setShowCustomModal(true)}
            className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-forge-700 to-forge-600 hover:from-forge-600 hover:to-forge-500 border border-orange-400 text-white font-bold text-xs flex items-center gap-1.5 shadow transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Custom Item</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Item Browser | Right Workbench Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left: Item Compendium & Search (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-2xl border border-parchment-300 shadow-md p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-serif font-bold text-base text-arcane-950 flex items-center gap-2">
                <Search className="w-4 h-4 text-forge-700" />
                <span>Item Catalog</span>
              </h3>
              <span className="text-xs text-parchment-600 font-semibold">
                {filteredItems.length} items
              </span>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-parchment-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, wands, scrolls, traits..."
                className="w-full pl-9 pr-3 py-2 bg-parchment-50 border border-parchment-300 rounded-xl text-xs font-semibold text-stone-900 focus:outline-none focus:ring-2 focus:ring-forge-500"
              />
            </div>

            {/* Quick Toggle Filters: Known Formulas & Craftable Only */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              <button
                type="button"
                onClick={() => setFormulasOnly(!formulasOnly)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  formulasOnly
                    ? 'bg-emerald-800 text-white border-emerald-600 shadow-sm'
                    : 'bg-emerald-50 text-emerald-900 border-emerald-300 hover:bg-emerald-100'
                }`}
                title="Show only items you have in your known formula book"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Known Formulas Only ({knownFormulasCount})</span>
              </button>

              <button
                type="button"
                onClick={() => setCraftableOnly(!craftableOnly)}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border ${
                  craftableOnly
                    ? 'bg-forge-800 text-white border-forge-600 shadow-sm'
                    : 'bg-forge-50 text-forge-900 border-forge-300 hover:bg-forge-100'
                }`}
                title={`Show only items at or below your character level (${character?.level || 1})`}
              >
                <Filter className="w-3.5 h-3.5" />
                <span>Craftable (&le; Lvl {character?.level || 1})</span>
              </button>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pr-1 pt-1 border-t border-parchment-200">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === cat.id
                      ? 'bg-forge-800 text-white shadow-sm'
                      : 'bg-parchment-100 text-stone-700 hover:bg-parchment-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Item List */}
            <div className="space-y-1.5 max-h-[420px] overflow-y-auto pr-1">
              {filteredItems.map(item => {
                const isSelected = selectedItem?.id === item.id;
                const isKnown = checkHasFormula(item, character);

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      setSelectedItem(item);
                      setSelectedImbuedSpell('');
                    }}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'bg-forge-50/90 border-forge-500 ring-2 ring-forge-400/50 shadow-sm'
                        : 'bg-parchment-50/70 hover:bg-parchment-100 border-parchment-200'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-stone-900 truncate">{item.name}</span>
                        {isKnown && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-bold border border-emerald-300 flex-shrink-0">
                            Formula
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-parchment-600">
                        <span className="font-semibold text-forge-800">Lvl {item.level}</span>
                        <span>&bull;</span>
                        <span className="font-mono font-bold text-gold-700">{item.price}</span>
                        <span>&bull;</span>
                        <span className="capitalize">{item.rarity || 'common'}</span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 text-parchment-400 flex-shrink-0 ${isSelected ? 'text-forge-600 font-bold' : ''}`} />
                  </div>
                );
              })}

              {filteredItems.length === 0 && (
                <div className="text-center py-8 text-xs text-parchment-500">
                  No items found matching your filters.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right: Crafting Console / Workbench (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {selectedItem && (
            <div className="bg-white rounded-2xl border-2 border-forge-500 shadow-xl p-5 space-y-5">
              
              {/* Target Item Header Card */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-parchment-200">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-forge-700">Target Item</span>
                  <h3 className="text-xl font-serif font-black text-arcane-950 flex items-center gap-2">
                    {materialDetails.displayName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="px-2 py-0.5 rounded bg-arcane-100 text-arcane-800 font-bold border border-arcane-300">
                      Level {itemLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gold-100 text-gold-900 font-bold border border-gold-300">
                      Price: {formatWealth(copperToWealth(baseItemPriceCopper))}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize border border-slate-300">
                      {itemRarity}
                    </span>
                    {selectedMaterial !== 'none' && (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-900 font-bold border border-amber-300 flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-amber-600" />
                        {materialDetails.material.name} ({materialDetails.grade.name})
                      </span>
                    )}
                  </div>
                </div>

                {/* Target DC Badge */}
                <div className="text-right sm:text-center bg-gradient-to-br from-forge-900 to-arcane-950 text-parchment-100 px-4 py-2.5 rounded-xl border border-forge-500 shadow">
                  <span className="text-[10px] text-parchment-400 uppercase font-bold block">Crafting DC</span>
                  <span className="text-2xl font-mono font-black text-gold-300">DC {targetDC}</span>
                </div>
              </div>

              {/* Special Options: Wand/Scroll Spell Imbuing & Batch Quantity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-parchment-50 p-3.5 rounded-xl border border-parchment-200 text-xs">
                {/* Batch Sizing */}
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Batch Crafting Quantity</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min="1"
                      max="100"
                      value={batchQuantity}
                      onChange={(e) => setBatchQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-20 p-1.5 bg-white border border-parchment-300 rounded-lg font-bold text-center text-stone-900"
                    />
                    <span className="text-parchment-600">
                      {batchQuantity > 1 ? `(${batchQuantity} items crafted together)` : '(Single item)'}
                    </span>
                  </div>
                </div>

                {/* Wand / Scroll Imbuing Dropdown */}
                {(selectedItem.isWand || selectedItem.isScroll) && (
                  <div className="space-y-2.5">
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        Imbue Spell (Rank {selectedItem.spellRank})
                      </label>
                      <select
                        value={selectedImbuedSpell}
                        onChange={(e) => setSelectedImbuedSpell(e.target.value)}
                        className="w-full p-1.5 bg-white border border-parchment-300 rounded-lg font-semibold text-stone-800"
                      >
                        <option value="">Select a Rank {selectedItem.spellRank} Spell...</option>
                        {availableImbueSpells.map(sp => (
                          <option key={sp.id} value={sp.name}>
                            {sp.name} ({sp.traditions?.join(', ') || 'arcane'}){sp.cost ? ' 💎 [Component Cost]' : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Spell Material Component & Cost Configuration */}
                    {selectedSpellObj && (selectedSpellObj.cost || extraComponentCopper > 0) && (
                      <div className="p-3 bg-gold-100/80 border border-gold-400 rounded-xl space-y-2 text-xs animate-fadeIn shadow-sm">
                        <div className="flex items-center gap-1.5 font-bold text-arcane-950">
                          <Gem className="w-4 h-4 text-gold-700" />
                          <span>Spell Material Component Required</span>
                        </div>
                        {selectedSpellObj.cost && (
                          <p className="text-stone-700 italic bg-white/80 p-2 rounded border border-gold-300/70 leading-snug">
                            &ldquo;{selectedSpellObj.cost}&rdquo;
                          </p>
                        )}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {/* If cost formula depends on target level */}
                          {selectedSpellObj.cost && /(target|level|node|caster|settlement)/i.test(selectedSpellObj.cost) && (
                            <div>
                              <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                                Target / Node Level:
                              </label>
                              <input
                                type="number"
                                min="1"
                                max="20"
                                value={spellTargetLevel}
                                onChange={(e) => setSpellTargetLevel(Math.max(1, parseInt(e.target.value, 10) || 1))}
                                className="w-full p-1.5 bg-white border border-gold-400 rounded font-bold text-center text-stone-900"
                              />
                            </div>
                          )}
                          <div className={selectedSpellObj.cost && /(target|level|node|caster|settlement)/i.test(selectedSpellObj.cost) ? '' : 'col-span-2'}>
                            <label className="block text-[11px] font-bold text-stone-700 mb-0.5">
                              Component Cost (GP per item):
                            </label>
                            <div className="flex items-center gap-1">
                              <input
                                type="number"
                                min="0"
                                step="1"
                                value={extraMaterialCostGp}
                                onChange={(e) => setExtraMaterialCostGp(Math.max(0, parseFloat(e.target.value) || 0))}
                                className="w-full p-1.5 bg-white border border-gold-400 rounded font-bold text-stone-900"
                              />
                              <span className="font-bold text-gold-800">gp</span>
                            </div>
                          </div>
                        </div>
                        <p className="text-[10px] text-stone-600 leading-tight">
                          * 100% of the spell&apos;s physical cost is added directly to upfront raw materials and cannot be reduced by downtime.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Precious & Special Material Selection (Weapons, Armor, Shields) */}
              {isEligibleForMaterial && (
                <div className="bg-gradient-to-br from-amber-50 to-parchment-100 p-3.5 rounded-xl border border-amber-300 space-y-3 text-xs">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1.5 font-serif font-bold text-amber-950">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Precious & Special Material (Silver, Obsidian, Skymetals)</span>
                    </div>
                    {selectedMaterial !== 'none' && (
                      <span className="text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-full border border-amber-400">
                        {materialDetails.grade.name} {materialDetails.material.name}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Material Type Dropdown */}
                    <div>
                      <label className="block font-bold text-stone-800 mb-1">
                        Select Material
                      </label>
                      <select
                        value={selectedMaterial}
                        onChange={(e) => {
                          const matId = e.target.value;
                          setSelectedMaterial(matId);
                          const matObj = PRECIOUS_MATERIALS[matId];
                          const grades = Object.keys(matObj?.grades || {});
                          if (!grades.includes(selectedMaterialGrade)) {
                            setSelectedMaterialGrade(grades[0] || 'standard');
                          }
                        }}
                        className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                      >
                        {availableMaterials.map(mat => (
                          <option key={mat.id} value={mat.id}>
                            {mat.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Grade Selector (if material is not 'none') */}
                    {selectedMaterial !== 'none' ? (
                      <div>
                        <label className="block font-bold text-stone-800 mb-1">
                          Material Grade
                        </label>
                        <select
                          value={selectedMaterialGrade}
                          onChange={(e) => setSelectedMaterialGrade(e.target.value)}
                          className="w-full p-2 bg-white border border-amber-300 rounded-lg font-semibold text-stone-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                        >
                          {Object.values(PRECIOUS_MATERIALS[selectedMaterial]?.grades || {}).map(g => (
                            <option key={g.id} value={g.id}>
                              {g.name} (Lvl {g.level}{g.armorLevel && g.armorLevel !== g.level ? ` / Armor Lvl ${g.armorLevel}` : ''})
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="flex items-center text-stone-500 italic text-[11px] pt-4">
                        Standard mundane materials (standard item price and level).
                      </div>
                    )}
                  </div>

                  {/* Material Description & Proficiency Notice */}
                  {selectedMaterial !== 'none' && (
                    <div className="bg-white/90 p-2.5 rounded-lg border border-amber-200 text-[11px] space-y-1.5">
                      <p className="text-stone-700 leading-relaxed">
                        <span className="font-bold text-stone-900">{materialDetails.material.name}:</span> {materialDetails.material.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-3 pt-1 border-t border-amber-100 text-[10px]">
                        <span className="font-semibold text-stone-700">
                          Min. Crafting: <strong className="text-arcane-900">{['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'][materialDetails.minProficiency] || 'Trained'}</strong>
                        </span>
                        {crafterRank < materialDetails.minProficiency && (
                          <span className="text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded border border-red-300">
                            Prerequisite Warning: Requires {['Untrained', 'Trained', 'Expert', 'Master', 'Legendary'][materialDetails.minProficiency]} proficiency!
                          </span>
                        )}
                        <span className="text-stone-500">
                          Base Price: <strong className="font-mono text-gold-900">{formatWealth(copperToWealth(materialDetails.effectivePriceCopper))}</strong>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Formula & Remaster Requirement Check */}
              <div className="p-3 rounded-xl bg-parchment-100 border border-parchment-300 flex items-start gap-2.5 text-xs">
                {hasFormula ? (
                  <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                )}
                <div>
                  <span className="font-bold text-stone-900">
                    {hasFormula ? 'Known Formula in Formula Book' : 'Formula Not in Character Records'}
                  </span>
                  <p className="text-stone-600 mt-0.5 leading-relaxed">
                    {hasFormula 
                      ? 'You possess the formula. Initial setup takes 1 day of crafting preparation.'
                      : 'Under Remaster RAW, crafting an item without a known formula requires 2 days of initial setup and GM approval (or formula purchase).'
                    }
                  </p>
                </div>
              </div>

              {/* Specialty Crafting & Trade Match Toggle */}
              <div className="p-3 rounded-xl bg-amber-50/80 border border-amber-300 flex items-center justify-between gap-3 text-xs">
                <label className="flex items-start gap-2.5 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={specialtyApplied}
                    onChange={(e) => setSpecialtyApplied(e.target.checked)}
                    className="mt-0.5 rounded text-amber-600 focus:ring-amber-500 w-4 h-4"
                  />
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-stone-900">Apply Specialty Crafting</span>
                      {hasSpecialtyFeat && (
                        <span className="px-1.5 py-0.2 rounded bg-amber-200 text-amber-900 font-bold text-[10px] border border-amber-400">
                          Feat Trained
                        </span>
                      )}
                      {hasImpeccableFeat && (
                        <span className="px-1.5 py-0.2 rounded bg-gold-200 text-gold-950 font-bold text-[10px] border border-gold-400">
                          Impeccable (Success &rarr; Crit)
                        </span>
                      )}
                    </div>
                    <p className="text-stone-600 mt-0.5 text-[11px] leading-tight">
                      Check if this item belongs to your trade specialty (e.g. blacksmithing, alchemy, woodworking). Applies <strong>+{crafterRank >= 3 ? 2 : (crafterRank >= 1 ? 1 : 0)} circumstance bonus</strong> to the Crafting check.
                    </p>
                  </div>
                </label>
                {specialtyApplied && (
                  <span className="font-mono font-bold text-amber-800 bg-amber-100 border border-amber-400 px-2.5 py-1 rounded-lg shrink-0 text-xs">
                    +{crafterRank >= 3 ? 2 : (crafterRank >= 1 ? 1 : 0)} Bonus
                  </span>
                )}
              </div>

              {/* Item Description & Lore Card */}
              {itemDescription && (
                <div className="p-3.5 rounded-xl bg-parchment-50 border border-parchment-200 text-xs space-y-1.5">
                  <div className="flex items-center gap-1.5 font-serif font-bold text-arcane-950">
                    <FileText className="w-4 h-4 text-forge-700" />
                    <span>Item Description & Effects</span>
                  </div>
                  <div 
                    className="text-stone-700 text-xs leading-relaxed max-h-48 overflow-y-auto pr-1 prose-sm prose-stone [&_p]:mb-1.5 [&_h1]:text-sm [&_h2]:text-xs [&_h3]:text-xs [&_h4]:text-xs [&_strong]:font-bold [&_em]:italic [&_ul]:list-disc [&_ul]:pl-4"
                    dangerouslySetInnerHTML={{ __html: itemDescription }}
                  />
                </div>
              )}

              {/* Material Costs & Math Breakdown */}
              <div className="bg-gradient-to-br from-arcane-950 to-forge-950 p-4 rounded-xl text-parchment-100 border border-gold-600/50 space-y-3">
                <div className="flex items-center justify-between text-xs font-serif font-bold text-gold-300 pb-2 border-b border-arcane-800">
                  <span>Crafting Cost & Economics</span>
                  <div className="text-right">
                    <span className="font-mono text-parchment-200 text-xs sm:text-sm font-bold">
                      Batch Total: {formatWealth(copperToWealth(totalPriceCopper))}
                    </span>
                    {extraComponentCopper > 0 && (
                      <span className="block text-[10px] text-parchment-400 font-sans font-normal">
                        ({formatWealth(copperToWealth(baseItemPriceCopper * batchQuantity))} base + {formatWealth(copperToWealth(extraComponentCopper * batchQuantity))} component)
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-arcane-900/80 p-2.5 rounded-lg border border-arcane-700">
                    <span className="text-parchment-400 block text-[11px]">
                      Upfront Materials {extraComponentCopper > 0 ? '(50% Base + Component)' : '(50%)'}
                    </span>
                    <span className="font-mono text-sm font-bold text-gold-300">
                      {formatWealth(copperToWealth(rawMaterialsCopper))}
                    </span>
                  </div>
                  <div className="bg-arcane-900/80 p-2.5 rounded-lg border border-arcane-700">
                    <span className="text-parchment-400 block text-[11px]">Reducible Half (50% Base)</span>
                    <span className="font-mono text-sm font-bold text-parchment-200">
                      {formatWealth(copperToWealth(remainingCostCopper))}
                    </span>
                  </div>
                  <div className="bg-arcane-900/80 p-2.5 rounded-lg border border-arcane-700 col-span-2 sm:col-span-1">
                    <span className="text-parchment-400 block text-[11px]">Daily Reduction Rate</span>
                    <span className="font-mono text-sm font-bold text-emerald-400">
                      +{formatWealth(copperToWealth(dailyReductionCopper))}/day
                    </span>
                  </div>
                </div>
              </div>

              {/* Crafting Actions: Instant Rush vs Downtime Project */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* Instant Rush */}
                <div className="p-4 rounded-xl border border-forge-300 bg-forge-50/50 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-forge-900">
                      <Zap className="w-4 h-4 text-orange-600" />
                      <span>Instant Rush Crafting</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Roll Crafting check and pay the full 100% price ({formatWealth(copperToWealth(totalPriceCopper))}) immediately upon success.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenCraftCheck('instant')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-forge-700 to-forge-600 hover:from-forge-600 hover:to-forge-500 text-white font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Hammer className="w-4 h-4" />
                    <span>Roll & Rush Complete</span>
                  </button>
                </div>

                {/* Start Downtime Project */}
                <div className="p-4 rounded-xl border border-gold-300 bg-gold-50/40 flex flex-col justify-between space-y-3">
                  <div>
                    <div className="flex items-center gap-1.5 font-serif font-bold text-sm text-gold-900">
                      <Calendar className="w-4 h-4 text-gold-700" />
                      <span>Downtime Project</span>
                    </div>
                    <p className="text-xs text-stone-600 mt-1">
                      Pay 50% upfront ({formatWealth(copperToWealth(rawMaterialsCopper))}) and spend downtime days to reduce remaining cost to 0 gp{dailyReductionCopper > 0 && remainingCostCopper > 0 ? ` (approx. ${Math.ceil(remainingCostCopper / dailyReductionCopper)} days)` : ''}.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleOpenCraftCheck('downtime-start')}
                    className="w-full py-2.5 px-3 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-arcane-950 font-bold text-xs shadow-md transition-all flex items-center justify-center gap-1.5"
                  >
                    <Clock className="w-4 h-4" />
                    <span>Roll & Start Downtime</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Active Downtime Projects List */}
          <div className="bg-white rounded-2xl border border-parchment-300 shadow-md p-5 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-parchment-200">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-arcane-800" />
                <h3 className="font-serif font-bold text-base text-arcane-950">
                  Active Downtime Projects ({downtimeProjects.length})
                </h3>
              </div>
            </div>

            {downtimeProjects.map(proj => {
              const currentSaved = proj.accumulatedSavingsCopper || 0;
              const remainingToPay = Math.max(0, proj.remainingBalanceCopper - currentSaved);
              const progressPct = Math.min(100, Math.round((currentSaved / proj.remainingBalanceCopper) * 100)) || 0;
              const daysToFree = proj.dailyReductionCopper > 0 ? Math.ceil(remainingToPay / proj.dailyReductionCopper) : 0;

              return (
                <div key={proj.id} className="p-4 rounded-xl border-2 border-gold-400 bg-gradient-to-br from-parchment-50 to-white shadow-sm space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <h4 className="font-serif font-black text-base text-arcane-950">
                        {proj.itemName} {proj.quantity > 1 && `(x${proj.quantity})`}
                      </h4>
                      <div className="flex items-center gap-2 text-xs text-parchment-600">
                        <span>Started: {proj.dateStarted}</span>
                        <span>&bull;</span>
                        <span className="font-semibold text-forge-800">
                          {(proj.setupDays || 1) + (proj.daysWorked || 0)} Total Day{((proj.setupDays || 1) + (proj.daysWorked || 0)) !== 1 ? 's' : ''} ({proj.setupDays || 1} Setup + {proj.daysWorked || 0} Downtime Worked)
                        </span>
                        {daysToFree > 0 && (
                          <>
                            <span>&bull;</span>
                            <span className="text-stone-500 font-medium">({daysToFree}d until free)</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Positive Gold Saved Badge */}
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-100 border border-emerald-300 px-2.5 py-1 rounded-full inline-block shadow-sm">
                        +{formatWealth(copperToWealth(currentSaved))} Saved
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <div className="flex justify-between text-xs font-semibold text-stone-700 mb-1">
                      <span>Cost Reduction Progress</span>
                      <span className="font-mono text-gold-800">
                        Remaining to Finish: {remainingToPay === 0 ? <span className="text-emerald-700 font-bold">0 cp (Free)</span> : formatWealth(copperToWealth(remainingToPay))}
                      </span>
                    </div>
                    <div className="w-full bg-parchment-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-gold-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Downtime Actions: +1 Day, +7 Days, Max Days to Free, Cancel & Salvage, Complete Item */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-parchment-200">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <button
                        type="button"
                        disabled={remainingToPay <= 0}
                        onClick={() => handleAdvanceDays(proj.id, 1)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          remainingToPay <= 0
                            ? 'bg-parchment-200 text-parchment-400 cursor-not-allowed border border-parchment-300'
                            : 'bg-arcane-800 hover:bg-arcane-700 text-white'
                        }`}
                        title={remainingToPay <= 0 ? 'Already free to finish' : 'Advance 1 day of crafting downtime'}
                      >
                        +1 Day
                      </button>
                      <button
                        type="button"
                        disabled={remainingToPay <= 0}
                        onClick={() => handleAdvanceDays(proj.id, 7)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-colors ${
                          remainingToPay <= 0
                            ? 'bg-parchment-200 text-parchment-400 cursor-not-allowed border border-parchment-300'
                            : 'bg-arcane-800 hover:bg-arcane-700 text-white'
                        }`}
                        title={remainingToPay <= 0 ? 'Already free to finish' : 'Advance 7 days of crafting downtime'}
                      >
                        +7 Days
                      </button>
                      <button
                        type="button"
                        disabled={daysToFree <= 0}
                        onClick={() => handleAdvanceDays(proj.id, daysToFree)}
                        className={`px-2.5 py-1.5 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 ${
                          daysToFree <= 0
                            ? 'bg-parchment-200 text-parchment-400 cursor-not-allowed border border-parchment-300'
                            : 'bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-arcane-950 shadow-sm border border-gold-400 active:scale-95'
                        }`}
                        title={
                          daysToFree > 0
                            ? `Spend ${daysToFree} day${daysToFree > 1 ? 's' : ''} to reduce remaining cost to 0 gp`
                            : 'Item is already free to finish'
                        }
                      >
                        <FastForward className="w-3.5 h-3.5" />
                        <span>Max Days to Free {daysToFree > 0 ? `(+${daysToFree}d)` : '(0d)'}</span>
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCancelProject(proj)}
                        className="px-2.5 py-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-800 border border-red-300 text-xs font-semibold transition-colors"
                      >
                        Cancel & Salvage
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCompleteProject(proj)}
                        className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white font-bold text-xs shadow transition-all flex items-center gap-1"
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        <span>Complete Item ({remainingToPay === 0 ? 'Free' : formatWealth(copperToWealth(remainingToPay))})</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {downtimeProjects.length === 0 && (
              <div className="text-center py-6 text-xs text-parchment-500 italic">
                No active downtime projects. Select an item above and start crafting!
              </div>
            )}
          </div>

          {/* Crafting History Log */}
          {craftHistory.length > 0 && (
            <div className="bg-white rounded-2xl border border-parchment-300 shadow-md p-5 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-parchment-200">
                <h3 className="font-serif font-bold text-base text-arcane-950 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  <span>Completed Crafts History ({craftHistory.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => onUpdateHistory([])}
                  className="text-xs text-red-600 hover:underline"
                >
                  Clear Log
                </button>
              </div>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1 text-xs">
                {craftHistory.map(log => (
                  <div key={log.id} className="p-2.5 rounded-lg bg-parchment-50 border border-parchment-200 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-bold text-stone-900">{log.itemName}</span>
                      <div className="text-[11px] text-parchment-600">
                        {log.date} &bull; Paid: {log.costPaid} &bull; <span className="text-emerald-700 font-semibold">{log.goldSaved}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold text-[10px] border border-emerald-300">
                      {log.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Custom Item Creator Modal */}
      {showCustomModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-parchment-50 border-2 border-gold-500 rounded-2xl max-w-md w-full p-5 shadow-2xl space-y-4">
            <h3 className="font-serif font-bold text-lg text-arcane-950">Create Custom Item</h3>
            <form onSubmit={handleCreateCustomItem} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-stone-800 mb-1">Item Name</label>
                <input
                  type="text"
                  value={customItem.name}
                  onChange={(e) => setCustomItem({ ...customItem, name: e.target.value })}
                  placeholder="e.g. Masterwork Greatsword, Custom Elixir..."
                  required
                  className="w-full p-2 bg-white border border-parchment-300 rounded-lg text-stone-900 font-semibold"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Level (0-20)</label>
                  <input
                    type="number"
                    min="0"
                    max="20"
                    value={customItem.level}
                    onChange={(e) => setCustomItem({ ...customItem, level: parseInt(e.target.value, 10) || 0 })}
                    className="w-full p-2 bg-white border border-parchment-300 rounded-lg text-stone-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-800 mb-1">Price (e.g. 50 gp)</label>
                  <input
                    type="text"
                    value={customItem.price}
                    onChange={(e) => setCustomItem({ ...customItem, price: e.target.value })}
                    className="w-full p-2 bg-white border border-parchment-300 rounded-lg text-stone-900 font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-bold text-stone-800 mb-1">Rarity</label>
                <select
                  value={customItem.rarity}
                  onChange={(e) => setCustomItem({ ...customItem, rarity: e.target.value })}
                  className="w-full p-2 bg-white border border-parchment-300 rounded-lg text-stone-800 font-semibold"
                >
                  <option value="common">Common (+0 DC)</option>
                  <option value="uncommon">Uncommon (+2 DC)</option>
                  <option value="rare">Rare (+5 DC)</option>
                  <option value="unique">Unique (+10 DC)</option>
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
                  className="px-4 py-1.5 rounded-lg bg-forge-800 hover:bg-forge-700 text-white font-bold text-xs shadow"
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
        title={`Crafting Check: ${materialDetails.displayName}`}
        subtitle={`Level ${itemLevel} ${itemRarity} Item • DC ${targetDC}${specialtyBonus > 0 ? ` • +${specialtyBonus} Specialty Bonus` : ''}`}
        skillName="Crafting"
        skillMod={crafterMod}
        circumstanceBonus={specialtyBonus}
        isSpecialtyActive={specialtyApplied}
        impeccableCraftingActive={isImpeccableActive}
        targetDC={targetDC}
        mode="craft"
        character={character}
        onApplyResult={handleApplyDiceResult}
      />
    </div>
  );
}
