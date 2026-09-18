import React, { useState } from 'react';
import { X, Save, Shield, Hammer, BookOpen, Plus, Trash2, Coins, Sparkles } from 'lucide-react';
import { RANK_NAMES, wealthToCopper, copperToWealth } from '../services/characterImporter.js';

export function CharacterEditorModal({ isOpen, onClose, character, onSave }) {
  if (!isOpen || !character) return null;

  const [name, setName] = useState(character.name || '');
  const [level, setLevel] = useState(character.level || 1);
  const [characterClass, setCharacterClass] = useState(character.characterClass || 'Wizard');
  
  // Wealth
  const [gp, setGp] = useState(character.wealth?.gp || 0);
  const [sp, setSp] = useState(character.wealth?.sp || 0);
  const [cp, setCp] = useState(character.wealth?.cp || 0);

  // Skills
  const [skills, setSkills] = useState({
    crafting: { ...(character.skills?.crafting || { rank: 1, mod: 7, rankName: 'Trained' }) },
    arcana: { ...(character.skills?.arcana || { rank: 1, mod: 7, rankName: 'Trained' }) },
    nature: { ...(character.skills?.nature || { rank: 0, mod: 0, rankName: 'Untrained' }) },
    occultism: { ...(character.skills?.occultism || { rank: 0, mod: 0, rankName: 'Untrained' }) },
    religion: { ...(character.skills?.religion || { rank: 0, mod: 0, rankName: 'Untrained' }) }
  });

  // Feats
  const [feats, setFeats] = useState({
    magicalShorthand: !!character.feats?.magicalShorthand,
    spellbookProdigy: !!character.feats?.spellbookProdigy,
    magicalCrafting: !!character.feats?.magicalCrafting,
    alchemicalCrafting: !!character.feats?.alchemicalCrafting,
    snareCrafting: !!character.feats?.snareCrafting,
    specialtyCrafting: !!character.feats?.specialtyCrafting
  });

  // Formulas
  const [formulas, setFormulas] = useState([...(character.formulas || [])]);
  const [newFormula, setNewFormula] = useState('');

  const handleSkillChange = (skillKey, field, value) => {
    setSkills(prev => {
      const current = prev[skillKey] || { rank: 0, mod: 0, rankName: 'Untrained' };
      let updatedRank = current.rank;
      let updatedMod = current.mod;

      if (field === 'rank') {
        updatedRank = Number(value);
      } else if (field === 'mod') {
        updatedMod = Number(value);
      }

      return {
        ...prev,
        [skillKey]: {
          rank: updatedRank,
          mod: updatedMod,
          rankName: RANK_NAMES[updatedRank] || 'Untrained'
        }
      };
    });
  };

  const handleAddFormula = (e) => {
    e.preventDefault();
    if (newFormula.trim() && !formulas.includes(newFormula.trim())) {
      setFormulas([...formulas, newFormula.trim()]);
      setNewFormula('');
    }
  };

  const handleRemoveFormula = (index) => {
    setFormulas(formulas.filter((_, idx) => idx !== index));
  };

  const handleSave = () => {
    const updated = {
      ...character,
      name: name.trim() || 'Hero',
      level: Math.max(1, Math.min(20, Number(level) || 1)),
      characterClass: characterClass.trim() || 'Adventurer',
      wealth: {
        gp: Math.max(0, Number(gp) || 0),
        sp: Math.max(0, Number(sp) || 0),
        cp: Math.max(0, Number(cp) || 0)
      },
      skills,
      feats: {
        ...character.feats,
        ...feats
      },
      formulas
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-parchment-50 border-2 border-gold-500 rounded-2xl max-w-3xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-parchment-300">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-arcane-800" />
            <h3 className="font-serif font-bold text-lg text-arcane-950">
              Edit Character: {character.name}
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
          {/* Identity & Level */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-parchment-300">
            <div>
              <label className="block text-xs font-bold text-parchment-700 uppercase mb-1">Character Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-2 bg-parchment-50 border border-parchment-300 rounded-lg focus:ring-2 focus:ring-gold-500 font-semibold text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-parchment-700 uppercase mb-1">Class / Archetype</label>
              <input
                type="text"
                value={characterClass}
                onChange={(e) => setCharacterClass(e.target.value)}
                className="w-full p-2 bg-parchment-50 border border-parchment-300 rounded-lg focus:ring-2 focus:ring-gold-500 font-semibold text-stone-900"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-parchment-700 uppercase mb-1">Level (1 - 20)</label>
              <input
                type="number"
                min="1"
                max="20"
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full p-2 bg-parchment-50 border border-parchment-300 rounded-lg focus:ring-2 focus:ring-gold-500 font-bold text-stone-900"
              />
            </div>
          </div>

          {/* Purse Wealth */}
          <div className="bg-white p-3 rounded-xl border border-parchment-300">
            <div className="flex items-center gap-1.5 mb-2 font-serif font-bold text-sm text-arcane-950">
              <Coins className="w-4 h-4 text-gold-600" />
              <span>Coin Purse</span>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-gold-700 mb-1">Gold Pieces (gp)</label>
                <input
                  type="number"
                  min="0"
                  value={gp}
                  onChange={(e) => setGp(e.target.value)}
                  className="w-full p-2 bg-gold-50/50 border border-gold-300 rounded-lg font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Silver Pieces (sp)</label>
                <input
                  type="number"
                  min="0"
                  value={sp}
                  onChange={(e) => setSp(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded-lg font-bold text-stone-900"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-amber-700 mb-1">Copper Pieces (cp)</label>
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
          <div className="bg-white p-3 rounded-xl border border-parchment-300">
            <div className="flex items-center gap-1.5 mb-2 font-serif font-bold text-sm text-arcane-950">
              <Hammer className="w-4 h-4 text-forge-600" />
              <span>Skills & Modifiers</span>
            </div>
            <div className="space-y-2">
              {Object.entries(skills).map(([key, data]) => (
                <div key={key} className="flex items-center justify-between gap-2 p-2 rounded bg-parchment-50 border border-parchment-200">
                  <span className="font-bold capitalize text-stone-800 w-28">{key}</span>
                  
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-parchment-600">Rank:</label>
                    <select
                      value={data.rank}
                      onChange={(e) => handleSkillChange(key, 'rank', e.target.value)}
                      className="bg-white border border-parchment-300 rounded px-2 py-1 text-xs font-semibold text-stone-800"
                    >
                      <option value="0">Untrained (0)</option>
                      <option value="1">Trained (+2+L)</option>
                      <option value="2">Expert (+4+L)</option>
                      <option value="3">Master (+6+L)</option>
                      <option value="4">Legendary (+8+L)</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <label className="text-xs text-parchment-600">Total Mod:</label>
                    <input
                      type="number"
                      value={data.mod}
                      onChange={(e) => handleSkillChange(key, 'mod', e.target.value)}
                      className="w-16 p-1 bg-white border border-parchment-300 rounded text-center font-bold text-stone-900"
                    />
                  </div>
                </div>
              ))}
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
            </div>
          </div>

          {/* Known Formulas */}
          <div className="bg-white p-3 rounded-xl border border-parchment-300">
            <div className="flex items-center justify-between mb-2 font-serif font-bold text-sm text-arcane-950">
              <div className="flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-gold-700" />
                <span>Known Formulas ({formulas.length})</span>
              </div>
            </div>

            <form onSubmit={handleAddFormula} className="flex gap-2 mb-2">
              <input
                type="text"
                value={newFormula}
                onChange={(e) => setNewFormula(e.target.value)}
                placeholder="Add formula (e.g. Minor Healing Potion, Magic Wand...)"
                className="flex-1 p-2 bg-parchment-50 border border-parchment-300 rounded-lg text-xs text-stone-800"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-arcane-800 hover:bg-arcane-700 text-white font-bold rounded-lg text-xs flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            </form>

            <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1">
              {formulas.map((form, idx) => (
                <span
                  key={idx}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-parchment-100 border border-parchment-300 text-stone-800 text-xs"
                >
                  <span>{form}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveFormula(idx)}
                    className="text-red-500 hover:text-red-700 ml-1"
                  >
                    &times;
                  </button>
                </span>
              ))}
              {formulas.length === 0 && (
                <span className="text-xs text-parchment-500 italic">No formulas recorded yet.</span>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-parchment-300 flex justify-end gap-2">
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
  );
}
