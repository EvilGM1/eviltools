import React from 'react';
import { 
  Store, 
  User, 
  Sparkles, 
  RotateCw, 
  Shield, 
  MessageSquare, 
  Handshake, 
  Info,
  CheckSquare,
  Square
} from 'lucide-react';
import { MERCHANT_ATTITUDES } from '../services/emporiumEngine.js';

export function MerchantCard({
  shop,
  onUpdateShop,
  onRerollShopName,
  onRerollMerchantName,
  onRerollQuirk
}) {
  if (!shop || !shop.merchant) return null;

  const { merchant, socialProfile } = shop;

  const handleAttitudeChange = (e) => {
    const newAttKey = e.target.value;
    const attObj = MERCHANT_ATTITUDES[newAttKey] || MERCHANT_ATTITUDES.indifferent;
    
    // Automatically suggest variance if changing attitude
    const suggestedVariance = attObj.defaultVariance || 'standard';

    onUpdateShop({
      ...shop,
      varianceKey: suggestedVariance,
      merchant: {
        ...merchant,
        attitudeKey: newAttKey,
        attitudeLabel: attObj.label,
        attitudeFlavor: attObj.flavor
      },
      socialProfile: {
        ...socialProfile,
        makeImpressionDC: socialProfile.totalWillDC + attObj.dcMod,
        requestDC: socialProfile.totalWillDC + attObj.dcMod
      }
    });
  };

  const handleShrewdToggle = () => {
    const newShrewd = !merchant.isShrewd;
    const modDiff = newShrewd ? 2 : -2;
    const attObj = MERCHANT_ATTITUDES[merchant.attitudeKey] || MERCHANT_ATTITUDES.indifferent;

    onUpdateShop({
      ...shop,
      merchant: {
        ...merchant,
        isShrewd: newShrewd
      },
      socialProfile: {
        ...socialProfile,
        totalWillDC: socialProfile.totalWillDC + modDiff,
        makeImpressionDC: socialProfile.totalWillDC + modDiff + attObj.dcMod,
        requestDC: socialProfile.totalWillDC + modDiff + attObj.dcMod
      }
    });
  };

  const getAttitudeColor = (key) => {
    if (key === 'unfriendly') return 'bg-red-950/80 text-red-300 border-red-700/80';
    if (key === 'friendly') return 'bg-emerald-950/80 text-emerald-300 border-emerald-700/80';
    return 'bg-amber-950/80 text-amber-300 border-amber-700/80';
  };

  return (
    <div className="bg-arcane-900/70 border border-gold-600/40 rounded-xl p-4 sm:p-5 shadow-lg backdrop-blur-sm flex flex-col gap-4">
      {/* Shop & Merchant Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-arcane-700/80 pb-3">
        <div className="flex items-center gap-2 flex-1">
          <Store className="w-5 h-5 text-gold-400 shrink-0" />
          <input
            type="text"
            value={shop.shopName}
            onChange={(e) => onUpdateShop({ ...shop, shopName: e.target.value })}
            className="bg-transparent border-b border-dashed border-gold-500/50 hover:border-gold-400 text-lg sm:text-xl font-serif font-bold text-parchment-100 px-1 py-0.5 focus:bg-arcane-950 focus:outline-none w-full sm:w-auto"
            title="Click to edit shop name"
          />
          <button
            type="button"
            onClick={onRerollShopName}
            className="p-1.5 rounded-lg hover:bg-arcane-800 text-parchment-400 hover:text-gold-300 transition-colors"
            title="Reroll Shop Name"
          >
            <RotateCw className="w-4 h-4" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-cyan-950/80 text-cyan-300 border border-cyan-700/80">
            Level {shop.settlement?.level} Settlement
          </span>
          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-700/80">
            {shop.archetypeLabel}
          </span>
        </div>
      </div>

      {/* Merchant Persona Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Merchant Name & Attitude */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-gold-400 shrink-0" />
            <span className="text-xs uppercase font-bold tracking-wider text-parchment-400">Proprietor:</span>
            <input
              type="text"
              value={merchant.name}
              onChange={(e) => onUpdateShop({
                ...shop,
                merchant: { ...merchant, name: e.target.value }
              })}
              className="bg-arcane-950/60 border border-arcane-700/80 rounded px-2 py-1 text-sm font-semibold text-parchment-200 flex-1 focus:outline-none focus:border-gold-500"
            />
            <button
              type="button"
              onClick={onRerollMerchantName}
              className="p-1 rounded hover:bg-arcane-800 text-parchment-400 hover:text-gold-300"
              title="Reroll Merchant Name"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs uppercase font-bold tracking-wider text-parchment-400">Attitude:</span>
            <select
              value={merchant.attitudeKey}
              onChange={handleAttitudeChange}
              className={`px-2 py-1 text-xs font-bold rounded border ${getAttitudeColor(merchant.attitudeKey)} focus:outline-none`}
            >
              {Object.values(MERCHANT_ATTITUDES).map(att => (
                <option key={att.key} value={att.key} className="bg-arcane-900 text-parchment-100">
                  {att.label} ({att.dcMod >= 0 ? `+${att.dcMod}` : att.dcMod} DC)
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Quirk */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-xs uppercase font-bold tracking-wider text-parchment-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-400" /> Behavioral Quirk:
            </span>
            <button
              type="button"
              onClick={onRerollQuirk}
              className="text-xs text-parchment-400 hover:text-gold-300 flex items-center gap-1"
              title="Reroll Quirk"
            >
              <RotateCw className="w-3 h-3" /> Reroll
            </button>
          </div>
          <input
            type="text"
            value={merchant.quirk}
            onChange={(e) => onUpdateShop({
              ...shop,
              merchant: { ...merchant, quirk: e.target.value }
            })}
            className="bg-arcane-950/60 border border-arcane-700/80 rounded px-2.5 py-1.5 text-xs text-parchment-300 italic focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      {/* RAW Social Bargaining Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-arcane-950/80 border border-arcane-800 rounded-xl p-3">
        {/* Base Will DC & Shrewd */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-arcane-900/60 border border-arcane-800/80 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-parchment-400 flex items-center gap-1">
            <Shield className="w-3.5 h-3.5 text-cyan-400" /> Will DC
          </span>
          <span className="text-2xl font-serif font-black text-cyan-300 my-0.5">
            DC {socialProfile.totalWillDC}
          </span>
          <button
            type="button"
            onClick={handleShrewdToggle}
            className="flex items-center gap-1 text-[11px] text-parchment-300 hover:text-gold-300 transition-colors mt-1"
          >
            {merchant.isShrewd ? (
              <CheckSquare className="w-3.5 h-3.5 text-gold-400" />
            ) : (
              <Square className="w-3.5 h-3.5 text-parchment-500" />
            )}
            <span>Shrewd Merchant (+2)</span>
          </button>
        </div>

        {/* Make an Impression */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-arcane-900/60 border border-arcane-800/80 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-parchment-400 flex items-center gap-1">
            <MessageSquare className="w-3.5 h-3.5 text-purple-400" /> Make Impression
          </span>
          <span className="text-2xl font-serif font-black text-purple-300 my-0.5">
            DC {socialProfile.makeImpressionDC}
          </span>
          <span className="text-[11px] text-parchment-400">
            Diplomacy &bull; Shift Attitude
          </span>
        </div>

        {/* Request Discount */}
        <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-arcane-900/60 border border-arcane-800/80 text-center">
          <span className="text-[11px] font-bold uppercase tracking-wider text-parchment-400 flex items-center gap-1">
            <Handshake className="w-3.5 h-3.5 text-emerald-400" /> Request Discount
          </span>
          <span className="text-2xl font-serif font-black text-emerald-300 my-0.5">
            DC {socialProfile.requestDC}
          </span>
          <span className="text-[11px] text-parchment-400">
            Diplomacy &bull; Unlock Deals
          </span>
        </div>
      </div>

      {/* Merchant Flavor Note */}
      <div className="text-[11px] text-parchment-400 italic flex items-center gap-1.5 px-1">
        <Info className="w-3.5 h-3.5 text-gold-400 shrink-0" />
        <span>{merchant.attitudeFlavor}</span>
      </div>
    </div>
  );
}
