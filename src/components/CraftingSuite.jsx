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
  BookOpen
} from 'lucide-react';
import itemsData from '../data/itemsCompendium.json';
import spellsData from '../data/spellsCompendium.json';
import { 
  calculateCraftingDC, 
  getDailyEarnIncomeRate, 
  priceToCopper, 
  checkHasFormula 
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
  const [batchQuantity, setBatchQuantity] = useState(1);
  const [selectedImbuedSpell, setSelectedImbuedSpell] = useState('');
  
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

  // Crafting calculations for selected item
  const itemLevel = selectedItem?.level ?? 0;
  const itemRarity = selectedItem?.rarity || 'common';
  const targetDC = calculateCraftingDC(itemLevel, itemRarity);
  const hasFormula = checkHasFormula(selectedItem, character);

  const basePriceCopper = priceToCopper(selectedItem?.price || '0 gp');
  const totalPriceCopper = basePriceCopper * batchQuantity;
  const rawMaterialsCopper = Math.round(totalPriceCopper / 2);
  const remainingCostCopper = totalPriceCopper - rawMaterialsCopper;

  // Crafter skill & reduction rate
  const crafterRank = character?.skills?.crafting?.rank ?? 1;
  const crafterMod = character?.skills?.crafting?.mod ?? 0;
  const crafterLevel = character?.level ?? 1;
  const dailyReductionCopper = getDailyEarnIncomeRate(crafterLevel, crafterRank);

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
    const characterCopper = wealthToCopper(character.wealth);

    if (activeCheckTarget === 'instant') {
      if (isSuccess) {
        // Deduct full price (rush)
        if (characterCopper < totalPriceCopper) {
          alert(`Insufficient funds! Total cost is ${formatWealth(copperToWealth(totalPriceCopper))}, but you only have ${formatWealth(character.wealth)}.`);
          return;
        }
        const updatedWealth = copperToWealth(characterCopper - totalPriceCopper);
        onUpdateCharacter({ ...character, wealth: updatedWealth });

        const displayName = selectedImbuedSpell 
          ? `${selectedItem.name} (${selectedImbuedSpell})`
          : selectedItem.name;

        const newLog = {
          id: `craft-${Date.now()}`,
          itemName: displayName,
          quantity: batchQuantity,
          date: new Date().toLocaleDateString(),
          costPaid: formatWealth(copperToWealth(totalPriceCopper)),
          goldSaved: '0 gp (Instant Rush)',
          status: 'Completed (Rush)',
          degree: rollResult.finalDegree
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

        const displayName = selectedImbuedSpell 
          ? `${selectedItem.name} (${selectedImbuedSpell})`
          : selectedItem.name;

        const newProject = {
          id: `proj-${Date.now()}`,
          itemName: displayName,
          itemLevel,
          rarity: itemRarity,
          quantity: batchQuantity,
          totalPriceCopper,
          rawMaterialsCopper,
          remainingBalanceCopper: remainingCostCopper,
          daysWorked: 0,
          dailyReductionCopper,
          accumulatedSavingsCopper: 0,
          degree: rollResult.finalDegree,
          dateStarted: new Date().toLocaleDateString()
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

      const newDays = proj.daysWorked + daysToAdd;
      const additionalReduction = proj.dailyReductionCopper * daysToAdd;
      const newSavings = Math.min(proj.remainingBalanceCopper, proj.accumulatedSavingsCopper + additionalReduction);
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

    const newLog = {
      id: `craft-${Date.now()}`,
      itemName: proj.itemName,
      quantity: proj.quantity,
      date: new Date().toLocaleDateString(),
      daysWorked: proj.daysWorked,
      costPaid: formatWealth(copperToWealth(totalPaidCopper)),
      goldSaved: `+${formatWealth(copperToWealth(totalSavedCopper))}`,
      status: 'Completed (Downtime)',
      degree: proj.degree
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
                    {selectedItem.name}
                  </h3>
                  <div className="flex flex-wrap items-center gap-2 mt-1 text-xs">
                    <span className="px-2 py-0.5 rounded bg-arcane-100 text-arcane-800 font-bold border border-arcane-300">
                      Level {itemLevel}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-gold-100 text-gold-900 font-bold border border-gold-300">
                      Price: {selectedItem.price}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium capitalize border border-slate-300">
                      {itemRarity}
                    </span>
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
                        <option key={sp.id} value={sp.name}>{sp.name} ({sp.traditions?.join(', ')})</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

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

              {/* Material Costs & Math Breakdown */}
              <div className="bg-gradient-to-br from-arcane-950 to-forge-950 p-4 rounded-xl text-parchment-100 border border-gold-600/50 space-y-3">
                <div className="flex items-center justify-between text-xs font-serif font-bold text-gold-300 pb-2 border-b border-arcane-800">
                  <span>Crafting Cost & Economics</span>
                  <span className="font-mono text-parchment-300">Batch Total: {formatWealth(copperToWealth(totalPriceCopper))}</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-arcane-900/80 p-2.5 rounded-lg border border-arcane-700">
                    <span className="text-parchment-400 block">Upfront Materials (50%)</span>
                    <span className="font-mono text-sm font-bold text-gold-300">
                      {formatWealth(copperToWealth(rawMaterialsCopper))}
                    </span>
                  </div>
                  <div className="bg-arcane-900/80 p-2.5 rounded-lg border border-arcane-700">
                    <span className="text-parchment-400 block">Remaining Half (50%)</span>
                    <span className="font-mono text-sm font-bold text-parchment-200">
                      {formatWealth(copperToWealth(remainingCostCopper))}
                    </span>
                  </div>
                  <div className="bg-arcane-900/80 p-2.5 rounded-lg border border-arcane-700 col-span-2 sm:col-span-1">
                    <span className="text-parchment-400 block">Daily Reduction Rate</span>
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
                      Pay 50% upfront ({formatWealth(copperToWealth(rawMaterialsCopper))}) and spend downtime days to reduce remaining cost to 0 gp.
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
                        <span className="font-semibold text-forge-800">{proj.daysWorked} Days Worked</span>
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
                      <span className="font-mono text-gold-800">Remaining to Finish: {formatWealth(copperToWealth(remainingToPay))}</span>
                    </div>
                    <div className="w-full bg-parchment-200 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-gold-500 h-2.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      ></div>
                    </div>
                  </div>

                  {/* Downtime Actions: +1 Day, +7 Days, Finish Now, Cancel & Salvage */}
                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-parchment-200">
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAdvanceDays(proj.id, 1)}
                        className="px-2.5 py-1.5 rounded-lg bg-arcane-800 hover:bg-arcane-700 text-white font-bold text-xs transition-colors"
                      >
                        +1 Day
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAdvanceDays(proj.id, 7)}
                        className="px-2.5 py-1.5 rounded-lg bg-arcane-800 hover:bg-arcane-700 text-white font-bold text-xs transition-colors"
                      >
                        +7 Days
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
                        <span>Complete Item ({formatWealth(copperToWealth(remainingToPay))})</span>
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
        title={`Crafting Check: ${selectedItem?.name}`}
        subtitle={`Level ${itemLevel} ${itemRarity} Item • DC ${targetDC}`}
        skillName="Crafting"
        skillMod={crafterMod}
        targetDC={targetDC}
        mode="craft"
        character={character}
        onApplyResult={handleApplyDiceResult}
      />
    </div>
  );
}
