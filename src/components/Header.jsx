import React from 'react';
import { 
  Hammer, 
  BookOpen, 
  Upload, 
  Download,
  Coins, 
  User, 
  Sparkles, 
  Plus, 
  Edit3, 
  Trash2,
  CheckCircle2,
  Crown,
  Zap
} from 'lucide-react';
import { formatWealth } from '../services/characterImporter.js';

export function Header({ 
  activeTab, 
  setActiveTab, 
  characters, 
  activeCharacterId, 
  setActiveCharacterId,
  onOpenImport,
  onOpenExport,
  onOpenEdit,
  onOpenNew,
  onDeleteCharacter
}) {
  const activeChar = characters.find(c => c.id === activeCharacterId) || characters[0];

  return (
    <header className="bg-gradient-to-r from-arcane-950 via-arcane-900 to-forge-950 text-parchment-100 border-b-2 border-gold-600 shadow-xl sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        {/* Top Branding & Character Bar */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-forge-700 to-arcane-700 border-2 border-gold-400 flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform">
              <Hammer className="w-5 h-5 text-gold-300 transform -rotate-12" />
              <BookOpen className="w-5 h-5 text-arcane-100 -ml-2" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-serif font-black tracking-wide bg-gradient-to-r from-gold-300 via-parchment-100 to-gold-400 bg-clip-text text-transparent">
                EvilTools
              </h1>
              <p className="text-xs text-parchment-400 font-sans tracking-wider uppercase font-semibold">
                PF2e Remaster Craft & Scribe Suite
              </p>
            </div>
          </div>

          {/* Character Selector & Actions */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 bg-arcane-900/80 p-2 rounded-xl border border-arcane-700/60 shadow-inner">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4 text-gold-400" />
              <select
                value={activeChar?.id || ''}
                onChange={(e) => setActiveCharacterId(e.target.value)}
                className="bg-arcane-950 border border-arcane-600 text-parchment-100 text-sm font-semibold rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-gold-400 cursor-pointer min-w-[150px]"
              >
                {characters.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} (Lvl {c.level} {c.characterClass || ''})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={onOpenEdit}
                title="Edit Current Character Stats"
                className="p-1.5 rounded-lg bg-arcane-800 hover:bg-arcane-700 text-parchment-200 hover:text-white border border-arcane-600 text-xs flex items-center gap-1 transition-colors"
              >
                <Edit3 className="w-3.5 h-3.5 text-gold-300" />
                <span className="hidden sm:inline">Edit</span>
              </button>

              <button
                type="button"
                onClick={onOpenImport}
                title="Import from Pathbuilder 2e or Foundry VTT JSON"
                className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-arcane-950 font-bold text-xs flex items-center gap-1 shadow transition-all"
              >
                <Upload className="w-3.5 h-3.5" />
                <span>Import JSON</span>
              </button>

              <button
                type="button"
                onClick={onOpenExport}
                title="Export Character or Full Party Data (JSON)"
                className="px-2.5 py-1.5 rounded-lg bg-arcane-800 hover:bg-arcane-700 text-gold-300 hover:text-gold-200 border border-gold-600/60 font-bold text-xs flex items-center gap-1 shadow transition-all"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Export JSON</span>
              </button>

              <button
                type="button"
                onClick={onOpenNew}
                title="Create a New Character"
                className="p-1.5 rounded-lg bg-arcane-800 hover:bg-arcane-700 text-parchment-200 hover:text-white border border-arcane-600 text-xs transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>

              {characters.length > 1 && (
                <button
                  type="button"
                  onClick={() => onDeleteCharacter(activeChar?.id)}
                  title="Delete this Character"
                  className="p-1.5 rounded-lg bg-red-950/40 hover:bg-red-900/60 text-red-300 border border-red-800/60 text-xs transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Character Quick Info & Badges Bar */}
        {activeChar && (
          <div className="mt-3 pt-2.5 border-t border-arcane-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-arcane-800 border border-arcane-600 font-semibold text-blue-200">
                Level {activeChar.level}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gold-950/70 border border-gold-600/60 text-gold-300 font-semibold">
                <Coins className="w-3.5 h-3.5 text-gold-400" />
                {formatWealth(activeChar.wealth)}
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-forge-900 border border-forge-700 text-orange-200">
                <Hammer className="w-3 h-3 text-orange-400" />
                Crafting: +{activeChar.skills?.crafting?.mod ?? 0} ({activeChar.skills?.crafting?.rankName || 'Untrained'})
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-950 border border-purple-700 text-purple-200">
                <Sparkles className="w-3 h-3 text-purple-400" />
                Arcana: +{activeChar.skills?.arcana?.mod ?? 0} &bull; Occult: +{activeChar.skills?.occultism?.mod ?? 0}
              </span>
            </div>

            {/* Feat Badges */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {activeChar.feats?.spellbookProdigy && (
                <span className="px-2 py-0.5 rounded bg-purple-900/80 border border-purple-500 text-purple-200 font-medium text-[11px] flex items-center gap-1" title="Spellbook Prodigy: Crit fail converted to normal fail">
                  <Crown className="w-3 h-3 text-gold-300" /> Prodigy
                </span>
              )}
              {activeChar.feats?.magicalShorthand && (
                <span className="px-2 py-0.5 rounded bg-blue-900/80 border border-blue-500 text-blue-200 font-medium text-[11px] flex items-center gap-1" title="Magical Shorthand: Flat 10 min scribing + Success upgraded to Crit Success">
                  <Zap className="w-3 h-3 text-yellow-300" /> Shorthand (10 min)
                </span>
              )}
              {activeChar.feats?.magicalCrafting && (
                <span className="px-2 py-0.5 rounded bg-forge-900 border border-forge-500 text-orange-200 font-medium text-[11px]">
                  Magical Crafting
                </span>
              )}
              {activeChar.feats?.alchemicalCrafting && (
                <span className="px-2 py-0.5 rounded bg-emerald-950 border border-emerald-600 text-emerald-200 font-medium text-[11px]">
                  Alchemical
                </span>
              )}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="mt-3 flex gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('crafting')}
            className={`flex-1 py-2.5 px-2 sm:px-4 rounded-t-xl font-serif font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all border-t-2 border-x-2 ${
              activeTab === 'crafting'
                ? 'bg-parchment-100 text-forge-900 border-gold-500 shadow-lg'
                : 'bg-arcane-950/70 text-parchment-400 hover:text-parchment-200 border-transparent hover:bg-arcane-900'
            }`}
          >
            <Hammer className={`w-4 h-4 ${activeTab === 'crafting' ? 'text-forge-700' : 'text-parchment-400'}`} />
            <span className="truncate">EvilCraft (Crafting)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('scribe')}
            className={`flex-1 py-2.5 px-2 sm:px-4 rounded-t-xl font-serif font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all border-t-2 border-x-2 ${
              activeTab === 'scribe'
                ? 'bg-parchment-100 text-arcane-950 border-gold-500 shadow-lg'
                : 'bg-arcane-950/70 text-parchment-400 hover:text-parchment-200 border-transparent hover:bg-arcane-900'
            }`}
          >
            <BookOpen className={`w-4 h-4 ${activeTab === 'scribe' ? 'text-arcane-600' : 'text-parchment-400'}`} />
            <span className="truncate">EvilScribe (Spell Learning)</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('earnings')}
            className={`flex-1 py-2.5 px-2 sm:px-4 rounded-t-xl font-serif font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 sm:gap-2 transition-all border-t-2 border-x-2 ${
              activeTab === 'earnings'
                ? 'bg-parchment-100 text-emerald-950 border-gold-500 shadow-lg'
                : 'bg-arcane-950/70 text-parchment-400 hover:text-parchment-200 border-transparent hover:bg-arcane-900'
            }`}
          >
            <Coins className={`w-4 h-4 ${activeTab === 'earnings' ? 'text-emerald-600' : 'text-parchment-400'}`} />
            <span className="truncate">EvilEarnings (Earn Income)</span>
          </button>
        </div>
      </div>
    </header>
  );
}
