import React, { useState, useEffect, useMemo } from 'react';
import { 
  Store, 
  Dice5, 
  RotateCw, 
  Plus, 
  Trash2, 
  ShoppingCart, 
  DollarSign, 
  Tag, 
  Filter, 
  Building2, 
  Sparkles, 
  Check, 
  Copy,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { itemsIndex as itemsData } from '../services/compendiumLoader.js';
import { 
  SETTLEMENT_TIERS, 
  SHOP_ARCHETYPES, 
  SHOP_SIZES, 
  MARKET_VARIANCES,
  generateEmporiumShop,
  generateShopName,
  generateMerchantName,
  generateQuirk,
  calculateAdjustedPrice,
  priceToCopper,
  copperToCoins
} from '../services/emporiumEngine.js';
import { MerchantCard } from './MerchantCard.jsx';
import { wealthToCopper, copperToWealth, formatWealth } from '../services/characterImporter.js';

export function EmporiumSuite({ character, onUpdateCharacter }) {
  const [settlementTier, setSettlementTier] = useState('town');
  const [customSettlementLevel, setCustomSettlementLevel] = useState(4);
  const [archetypeKey, setArchetypeKey] = useState('general');
  const [shopSizeKey, setShopSizeKey] = useState('medium');
  const [customCount, setCustomCount] = useState(8);
  const [varianceKey, setVarianceKey] = useState('standard');
  const [includeRarity, setIncludeRarity] = useState('uncommon'); // 'common', 'uncommon', 'rare'

  const [shop, setShop] = useState(null);
  const [copied, setCopied] = useState(false);

  const effectiveSettlementLevel = useMemo(() => {
    if (settlementTier === 'custom') return Math.max(0, Math.min(25, Number(customSettlementLevel) || 0));
    return SETTLEMENT_TIERS[settlementTier]?.level ?? 4;
  }, [settlementTier, customSettlementLevel]);

  const allowedRarities = useMemo(() => {
    const list = ['common'];
    if (includeRarity === 'uncommon' || includeRarity === 'rare') list.push('uncommon');
    if (includeRarity === 'rare') list.push('rare');
    return list;
  }, [includeRarity]);

  // Initial shop generation on mount
  useEffect(() => {
    handleGenerateNewShop();
  }, []);

  const handleGenerateNewShop = () => {
    const newShop = generateEmporiumShop({
      itemsData,
      settlementTier,
      settlementLevel: effectiveSettlementLevel,
      archetypeKey,
      shopSizeKey,
      customItemCount: customCount,
      isShrewd: Math.random() < 0.25,
      forcedAttitude: Math.random() < 0.25 ? 'unfriendly' : Math.random() < 0.75 ? 'indifferent' : 'friendly',
      forcedVariance: varianceKey,
      allowedRarities
    });
    setShop(newShop);
  };

  // Sync variance changes to inventory prices immediately
  const handleVarianceChange = (newVariance) => {
    setVarianceKey(newVariance);
    if (!shop) return;

    const updatedItems = shop.items.map(item => {
      const adj = calculateAdjustedPrice(item.baseCopper, newVariance);
      return {
        ...item,
        adjustedCopper: adj.adjustedCopper,
        adjustedPriceStr: adj.coins.str
      };
    });

    setShop({
      ...shop,
      varianceKey: newVariance,
      varianceLabel: MARKET_VARIANCES[newVariance]?.label || 'Standard (100%)',
      items: updatedItems
    });
  };

  const handleRerollShopName = () => {
    if (!shop) return;
    const newName = generateShopName(archetypeKey, shop.merchant?.name);
    setShop({ ...shop, shopName: newName });
  };

  const handleRerollMerchantName = () => {
    if (!shop) return;
    const newMerchantName = generateMerchantName();
    setShop({
      ...shop,
      merchant: { ...shop.merchant, name: newMerchantName }
    });
  };

  const handleRerollQuirk = () => {
    if (!shop) return;
    setShop({
      ...shop,
      merchant: { ...shop.merchant, quirk: generateQuirk() }
    });
  };

  const handleRerollSingleItem = (index) => {
    if (!shop || !shop.items[index]) return;

    // Filter candidate pool excluding items currently stocked
    const currentIds = new Set(shop.items.map(i => i.id));
    const pool = itemsData.filter(i => 
      !currentIds.has(i.id) &&
      i.level <= effectiveSettlementLevel &&
      allowedRarities.includes((i.rarity || 'common').toLowerCase()) &&
      priceToCopper(i.price) > 0
    );

    if (pool.length === 0) return;

    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    const baseCopper = priceToCopper(randomItem.price);
    const adj = calculateAdjustedPrice(baseCopper, shop.varianceKey);

    const newItem = {
      id: randomItem.id,
      name: randomItem.name,
      level: randomItem.level,
      rarity: randomItem.rarity,
      type: randomItem.type,
      traits: randomItem.traits || [],
      basePrice: randomItem.price,
      baseCopper,
      adjustedCopper: adj.adjustedCopper,
      adjustedPriceStr: adj.coins.str
    };

    const updated = [...shop.items];
    updated[index] = newItem;
    setShop({ ...shop, items: updated });
  };

  const handleDeleteItem = (index) => {
    if (!shop) return;
    const updated = shop.items.filter((_, i) => i !== index);
    setShop({ ...shop, items: updated });
  };

  const handleAddRandomItem = () => {
    if (!shop) return;
    const currentIds = new Set(shop.items.map(i => i.id));
    const pool = itemsData.filter(i => 
      !currentIds.has(i.id) &&
      i.level <= effectiveSettlementLevel &&
      allowedRarities.includes((i.rarity || 'common').toLowerCase()) &&
      priceToCopper(i.price) > 0
    );

    if (pool.length === 0) return;

    const randomItem = pool[Math.floor(Math.random() * pool.length)];
    const baseCopper = priceToCopper(randomItem.price);
    const adj = calculateAdjustedPrice(baseCopper, shop.varianceKey);

    const newItem = {
      id: randomItem.id,
      name: randomItem.name,
      level: randomItem.level,
      rarity: randomItem.rarity,
      type: randomItem.type,
      traits: randomItem.traits || [],
      basePrice: randomItem.price,
      baseCopper,
      adjustedCopper: adj.adjustedCopper,
      adjustedPriceStr: adj.coins.str
    };

    setShop({ ...shop, items: [...shop.items, newItem] });
  };

  // 1-Click Purchase for the active character
  const handleBuyItem = (item) => {
    if (!character || !onUpdateCharacter) return;
    const charWealthCopper = wealthToCopper(character.wealth);
    if (charWealthCopper < item.adjustedCopper) {
      alert(`${character.name} cannot afford ${item.name} (${item.adjustedPriceStr} required, has ${formatWealth(character.wealth)})!`);
      return;
    }

    const remainingCopper = charWealthCopper - item.adjustedCopper;
    const newWealth = copperToWealth(remainingCopper);

    onUpdateCharacter({
      ...character,
      wealth: newWealth
    });

    alert(`Purchased ${item.name} for ${item.adjustedPriceStr}! Coins deducted from ${character.name}.`);
  };

  // Copy Shop Summary to Clipboard
  const handleCopyShopMarkdown = () => {
    if (!shop) return;
    let md = `### ${shop.shopName}\n`;
    md += `**Proprietor:** ${shop.merchant.name} (${shop.merchant.attitudeLabel})\n`;
    md += `**Quirk:** *"${shop.merchant.quirk}"*\n`;
    md += `**Settlement:** Level ${shop.settlement.level} | **Will DC:** ${shop.socialProfile.totalWillDC} | **Make Impression / Request DC:** ${shop.socialProfile.requestDC}\n`;
    md += `**Pricing:** ${shop.varianceLabel}\n\n`;
    md += `| Item | Lvl | Rarity | Price |\n`;
    md += `| :--- | :--: | :---: | :--- |\n`;
    for (const item of shop.items) {
      md += `| ${item.name} | ${item.level} | ${item.rarity} | ${item.adjustedPriceStr} |\n`;
    }

    navigator.clipboard.writeText(md).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Top Generator Controls Bar */}
      <div className="bg-arcane-900/80 border border-gold-600/40 rounded-xl p-4 sm:p-5 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Settlement Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-parchment-400 flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5 text-gold-400" /> Settlement
            </label>
            <select
              value={settlementTier}
              onChange={(e) => setSettlementTier(e.target.value)}
              className="bg-arcane-950 border border-arcane-700/80 text-parchment-100 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-gold-500"
            >
              {Object.values(SETTLEMENT_TIERS).map(tier => (
                <option key={tier.key} value={tier.key}>
                  {tier.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Level */}
          {settlementTier === 'custom' && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-parchment-400">
                Level
              </label>
              <input
                type="number"
                min="0"
                max="25"
                value={customSettlementLevel}
                onChange={(e) => setCustomSettlementLevel(parseInt(e.target.value, 10) || 0)}
                className="w-16 bg-arcane-950 border border-arcane-700/80 text-parchment-100 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
              />
            </div>
          )}

          {/* Archetype Selector */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-parchment-400 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-gold-400" /> Archetype
            </label>
            <select
              value={archetypeKey}
              onChange={(e) => setArchetypeKey(e.target.value)}
              className="bg-arcane-950 border border-arcane-700/80 text-parchment-100 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-gold-500"
            >
              {Object.values(SHOP_ARCHETYPES).map(arch => (
                <option key={arch.key} value={arch.key}>
                  {arch.label}
                </option>
              ))}
            </select>
          </div>

          {/* Shop Size */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-parchment-400 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-gold-400" /> Stock Size
            </label>
            <select
              value={shopSizeKey}
              onChange={(e) => setShopSizeKey(e.target.value)}
              className="bg-arcane-950 border border-arcane-700/80 text-parchment-100 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-gold-500"
            >
              {Object.values(SHOP_SIZES).map(s => (
                <option key={s.key} value={s.key}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Stock Count */}
          {shopSizeKey === 'custom' && (
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-bold uppercase tracking-wider text-parchment-400">
                Count
              </label>
              <input
                type="number"
                min="1"
                max="30"
                value={customCount}
                onChange={(e) => setCustomCount(parseInt(e.target.value, 10) || 8)}
                className="w-16 bg-arcane-950 border border-arcane-700/80 text-parchment-100 rounded-lg px-2 py-1.5 text-xs font-semibold focus:outline-none"
              />
            </div>
          )}

          {/* Rarity Filter */}
          <div className="flex flex-col gap-1">
            <label className="text-[11px] font-bold uppercase tracking-wider text-parchment-400 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5 text-gold-400" /> Rarities
            </label>
            <select
              value={includeRarity}
              onChange={(e) => setIncludeRarity(e.target.value)}
              className="bg-arcane-950 border border-arcane-700/80 text-parchment-100 rounded-lg px-3 py-1.5 text-xs font-semibold focus:outline-none"
            >
              <option value="common">Common Only</option>
              <option value="uncommon">Common & Uncommon</option>
              <option value="rare">Common, Uncommon & Rare</option>
            </select>
          </div>
        </div>

        {/* Generate Button */}
        <button
          type="button"
          onClick={handleGenerateNewShop}
          className="px-5 py-2.5 rounded-xl font-serif font-bold text-sm bg-gradient-to-r from-forge-700 to-arcane-700 hover:from-forge-600 hover:to-arcane-600 text-parchment-100 border border-gold-500/80 shadow-lg flex items-center gap-2 transform active:scale-95 transition-all"
        >
          <Dice5 className="w-4 h-4 text-gold-300" />
          <span>Generate Shop</span>
        </button>
      </div>

      {/* Main Shop View */}
      {shop && (
        <div className="flex flex-col gap-6">
          {/* Merchant Persona & Social Card */}
          <MerchantCard
            shop={shop}
            onUpdateShop={setShop}
            onRerollShopName={handleRerollShopName}
            onRerollMerchantName={handleRerollMerchantName}
            onRerollQuirk={handleRerollQuirk}
          />

          {/* Market Variance Selector Bar */}
          <div className="bg-arcane-900/70 border border-gold-600/40 rounded-xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 shadow-md">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-gold-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-parchment-300">
                Market Variance:
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {Object.values(MARKET_VARIANCES).map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => handleVarianceChange(v.key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all border ${
                    varianceKey === v.key
                      ? v.key === 'fleece'
                        ? 'bg-red-900 text-red-100 border-red-500 shadow-md scale-105'
                        : v.key === 'motivated'
                        ? 'bg-emerald-900 text-emerald-100 border-emerald-500 shadow-md scale-105'
                        : 'bg-arcane-700 text-parchment-100 border-gold-500 shadow-md scale-105'
                      : 'bg-arcane-950/60 text-parchment-400 hover:text-parchment-200 border-arcane-800'
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={handleCopyShopMarkdown}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-arcane-800/80 hover:bg-arcane-700 text-parchment-200 border border-arcane-600/60 flex items-center gap-1.5 transition-colors"
                title="Copy Shop & Inventory as Markdown"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied!' : 'Copy Summary'}</span>
              </button>
            </div>
          </div>

          {/* Inventory Table */}
          <div className="bg-arcane-900/70 border border-gold-600/40 rounded-xl overflow-hidden shadow-xl">
            <div className="p-4 bg-arcane-950/80 border-b border-arcane-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Store className="w-4 h-4 text-gold-400" />
                <h3 className="font-serif font-bold text-parchment-100 text-sm sm:text-base">
                  Stocked Inventory ({shop.items.length} items)
                </h3>
                <span className="text-xs text-parchment-500">
                  &bull; {shop.poolCount} candidate items matching settlement level {effectiveSettlementLevel}
                </span>
              </div>
              <button
                type="button"
                onClick={handleAddRandomItem}
                className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-arcane-800 hover:bg-arcane-700 text-gold-300 border border-gold-600/50 flex items-center gap-1 transition-colors"
                title="Add another random item to the shop"
              >
                <Plus className="w-3.5 h-3.5" /> Add Item
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-arcane-950 text-parchment-400 uppercase text-[10px] tracking-wider border-b border-arcane-800">
                    <th className="py-2.5 px-4 font-bold">Item Name</th>
                    <th className="py-2.5 px-3 font-bold text-center">Level</th>
                    <th className="py-2.5 px-3 font-bold text-center">Rarity</th>
                    <th className="py-2.5 px-3 font-bold text-center">Type</th>
                    <th className="py-2.5 px-3 font-bold text-right">Base MSRP</th>
                    <th className="py-2.5 px-4 font-bold text-right">Shop Price</th>
                    <th className="py-2.5 px-4 font-bold text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-arcane-800/60">
                  {shop.items.map((item, idx) => (
                    <tr key={`${item.id}-${idx}`} className="hover:bg-arcane-800/40 transition-colors">
                      <td className="py-2.5 px-4 font-semibold text-parchment-100">
                        <div className="flex flex-col">
                          <span>{item.name}</span>
                          {item.traits && item.traits.length > 0 && (
                            <div className="flex gap-1 flex-wrap mt-0.5">
                              {item.traits.slice(0, 3).map(trait => (
                                <span key={trait} className="px-1 py-0.2 rounded text-[9px] bg-arcane-800 text-parchment-400">
                                  {trait}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded bg-arcane-800 text-parchment-300 font-semibold text-[11px]">
                          Lvl {item.level}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          item.rarity === 'uncommon'
                            ? 'bg-orange-950 text-orange-300 border border-orange-700/80'
                            : item.rarity === 'rare'
                            ? 'bg-blue-950 text-blue-300 border border-blue-700/80'
                            : 'bg-arcane-800 text-parchment-400'
                        }`}>
                          {item.rarity}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center text-parchment-400 capitalize">
                        {item.type}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {shop.varianceKey === 'standard' ? (
                          <span className="text-parchment-400">{item.basePrice}</span>
                        ) : (
                          <span className="line-through text-parchment-500 text-[11px]">{item.basePrice}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-right font-bold text-gold-300 text-sm">
                        {item.adjustedPriceStr}
                      </td>
                      <td className="py-2.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {character && (
                            <button
                              type="button"
                              onClick={() => handleBuyItem(item)}
                              className="px-2 py-1 rounded bg-emerald-900/80 hover:bg-emerald-800 text-emerald-200 border border-emerald-600/60 font-semibold text-[11px] flex items-center gap-1 transition-colors"
                              title={`Buy item and deduct coins from ${character.name}`}
                            >
                              <ShoppingCart className="w-3 h-3" /> Buy
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleRerollSingleItem(idx)}
                            className="p-1 rounded hover:bg-arcane-800 text-parchment-400 hover:text-gold-300 transition-colors"
                            title="Reroll this item"
                          >
                            <RotateCw className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteItem(idx)}
                            className="p-1 rounded hover:bg-arcane-800 text-parchment-400 hover:text-red-400 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
