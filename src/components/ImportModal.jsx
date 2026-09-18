import React, { useState, useRef } from 'react';
import { X, Upload, FileText, CheckCircle, AlertCircle, Sparkles, Users, Database } from 'lucide-react';
import confetti from 'canvas-confetti';
import { importCharacterJSON, formatWealth } from '../services/characterImporter.js';

export function ImportModal({ isOpen, onClose, onImportSuccess }) {
  const [pastedJson, setPastedJson] = useState('');
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleProcessJSON = (jsonStr) => {
    setError('');
    setPreview(null);
    try {
      const parsed = importCharacterJSON(jsonStr);
      setPreview(parsed);
    } catch (err) {
      setError(err.message || 'Could not parse character file.');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target.result;
      setPastedJson(text);
      handleProcessJSON(text);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target.result;
        setPastedJson(text);
        handleProcessJSON(text);
      };
      reader.readAsText(file);
    }
  };

  const handleConfirmImport = () => {
    if (!preview) return;
    try {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 }
      });
      onImportSuccess(preview);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-parchment-50 border-2 border-gold-500 rounded-2xl max-w-2xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-parchment-300">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-gold-600" />
            <h3 className="font-serif font-bold text-lg text-arcane-950">
              Import Character or Party Data (JSON)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-parchment-600 hover:text-parchment-900 hover:bg-parchment-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="py-4 space-y-4 overflow-y-auto flex-1">
          {/* Dropzone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
              dragOver
                ? 'border-gold-500 bg-gold-50/50 scale-[1.01]'
                : 'border-parchment-400 hover:border-gold-500 bg-parchment-100/60 hover:bg-parchment-100'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept=".json,application/json"
              className="hidden"
            />
            <FileText className="w-10 h-10 mx-auto text-arcane-700 mb-2" />
            <p className="font-bold text-arcane-950 text-sm">
              Click to select or drag & drop your character or roster JSON file here
            </p>
            <p className="text-xs text-parchment-600 mt-1">
              Supports EvilTools JSON, Pathbuilder 2e export & Foundry VTT PF2e Actor exports
            </p>
          </div>

          {/* Paste JSON Area */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-parchment-700 mb-1">
              Or paste raw JSON:
            </label>
            <textarea
              value={pastedJson}
              onChange={(e) => {
                setPastedJson(e.target.value);
                if (e.target.value.trim()) handleProcessJSON(e.target.value);
              }}
              rows={4}
              placeholder="Paste EvilTools, Pathbuilder or Foundry JSON here..."
              className="w-full text-xs font-mono p-3 bg-white border border-parchment-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-500 text-stone-800"
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-100 border border-red-300 rounded-lg text-red-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Roster Preview */}
          {preview && preview.isRoster && (
            <div className="bg-white p-4 rounded-xl border border-gold-400 shadow-sm space-y-3 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gold-100 rounded-lg text-gold-800 border border-gold-300">
                    <Users className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-serif font-black text-lg text-arcane-950">
                      Party Roster Backup
                    </h4>
                    <span className="text-xs text-parchment-600">
                      {preview.characters?.length || 0} Hero Profiles &bull; Complete Workspace Restore
                    </span>
                  </div>
                </div>
                <span className="text-xs font-mono px-2.5 py-1 rounded-full bg-arcane-900 text-gold-300 font-bold">
                  eviltools-roster-v1
                </span>
              </div>

              {/* Characters summary list */}
              <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                {preview.characters?.map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-parchment-100/70 border border-parchment-300 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-arcane-950">{c.name}</span>
                      <span className="text-[11px] px-2 py-0.5 rounded bg-arcane-100 text-arcane-800 border border-arcane-300">
                        Lvl {c.level} {c.characterClass}
                      </span>
                    </div>
                    <span className="text-gold-700 font-bold">
                      {formatWealth(c.wealth)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Stats badges */}
              <div className="flex flex-wrap gap-2 pt-2 border-t border-parchment-200 text-xs">
                <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-medium">
                  ⏳ {preview.downtimeProjects?.length || 0} Downtime Projects
                </span>
                <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 font-medium">
                  📜 {preview.craftHistory?.length || 0} Craft Logs
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-medium">
                  ✨ {preview.scribeHistory?.length || 0} Scribe Logs
                </span>
              </div>
            </div>
          )}

          {/* Single Character Preview */}
          {preview && !preview.isRoster && (
            <div className="bg-white p-4 rounded-xl border border-gold-400 shadow-sm space-y-2.5 animate-fadeIn">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-serif font-black text-lg text-arcane-950 flex items-center gap-2">
                    {preview.name}
                    <span className="text-xs font-sans px-2 py-0.5 rounded-full bg-arcane-100 text-arcane-800 font-bold border border-arcane-300">
                      Level {preview.level} {preview.characterClass}
                    </span>
                  </h4>
                  <span className="text-xs text-parchment-600">
                    Source: {preview.source === 'pathbuilder' ? 'Pathbuilder 2e' : preview.source === 'foundry' ? 'Foundry VTT PF2e' : 'EvilTools JSON'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gold-700 block">
                    {formatWealth(preview.wealth)}
                  </span>
                  <span className="text-xs text-parchment-500">Purse Wealth</span>
                </div>
              </div>

              {/* Skills summary */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-2 border-t border-parchment-200 text-xs">
                <div className="bg-parchment-100 p-2 rounded border border-parchment-300">
                  <span className="font-semibold text-stone-600 block">Crafting</span>
                  <span className="font-bold text-forge-800">+{preview.skills?.crafting?.mod ?? 0} ({preview.skills?.crafting?.rankName || 'Untrained'})</span>
                </div>
                <div className="bg-parchment-100 p-2 rounded border border-parchment-300">
                  <span className="font-semibold text-stone-600 block">Arcana</span>
                  <span className="font-bold text-arcane-800">+{preview.skills?.arcana?.mod ?? 0} ({preview.skills?.arcana?.rankName || 'Untrained'})</span>
                </div>
                <div className="bg-parchment-100 p-2 rounded border border-parchment-300">
                  <span className="font-semibold text-stone-600 block">Occultism</span>
                  <span className="font-bold text-purple-800">+{preview.skills?.occultism?.mod ?? 0} ({preview.skills?.occultism?.rankName || 'Untrained'})</span>
                </div>
              </div>

              {/* Extra Detected Info */}
              <div className="flex flex-wrap gap-2 pt-1 text-[11px] text-stone-600">
                {preview.formulas?.length > 0 && (
                  <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-medium border border-emerald-300">
                    ✓ {preview.formulas.length} Known Formulas
                  </span>
                )}
                {preview.learnedSpells?.length > 0 && (
                  <span className="bg-arcane-100 text-arcane-800 px-2 py-0.5 rounded font-medium border border-arcane-300">
                    ✨ {preview.learnedSpells.length} Learned Spells
                  </span>
                )}
                {preview.feats?.magicalShorthand && (
                  <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-medium border border-blue-300">
                    ⚡ Magical Shorthand
                  </span>
                )}
                {preview.feats?.spellbookProdigy && (
                  <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded font-medium border border-purple-300">
                    👑 Spellbook Prodigy
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Actions */}
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
            onClick={handleConfirmImport}
            disabled={!preview}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-arcane-950 font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            <CheckCircle className="w-4 h-4" />
            <span>{preview?.isRoster ? 'Confirm & Restore Party Roster' : 'Confirm & Load Character'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
