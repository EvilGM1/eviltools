import React, { useState } from 'react';
import { X, Download, Copy, Check, Users, User, Shield, BookOpen, Hammer, Sparkles, Database, FileCheck } from 'lucide-react';
import confetti from 'canvas-confetti';
import { exportCharacterJSON, exportRosterBackupJSON } from '../services/characterImporter.js';

export function ExportModal({ 
  isOpen, 
  onClose, 
  character, 
  characters = [], 
  downtimeProjects = [], 
  craftHistory = [], 
  scribeHistory = [],
  earningsHistory = []
}) {
  const [exportMode, setExportMode] = useState('single'); // 'single' | 'roster'
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentHero = character || characters[0];

  // Prepare payload for preview / clipboard
  const getSinglePayload = () => {
    if (!currentHero) return {};
    const safeName = (currentHero.name || 'Hero').replace(/[^a-zA-Z0-9_-]/g, '_');
    return {
      schema: 'eviltools-character-v1',
      exportedAt: new Date().toISOString(),
      version: '1.0',
      character: {
        ...currentHero,
        id: currentHero.id || `char-${Date.now()}`
      },
      downtimeProjects: downtimeProjects.filter(p => p.characterId ? p.characterId === currentHero.id : true),
      craftHistory: craftHistory.filter(h => h.characterId ? h.characterId === currentHero.id : true),
      scribeHistory: scribeHistory.filter(s => s.characterId ? s.characterId === currentHero.id : true),
      earningsHistory: earningsHistory.filter(e => e.characterId ? e.characterId === currentHero.id : true)
    };
  };

  const getRosterPayload = () => {
    return {
      schema: 'eviltools-roster-v1',
      exportedAt: new Date().toISOString(),
      version: '1.0',
      characters,
      downtimeProjects,
      craftHistory,
      scribeHistory,
      earningsHistory
    };
  };

  const currentPayload = exportMode === 'single' ? getSinglePayload() : getRosterPayload();
  const jsonString = JSON.stringify(currentPayload, null, 2);
  const jsonSizeKb = (new TextEncoder().encode(jsonString).length / 1024).toFixed(1);

  const safeFilename = exportMode === 'single'
    ? `${(currentHero?.name || 'Hero').replace(/[^a-zA-Z0-9_-]/g, '_')}_Lvl${currentHero?.level || 1}_EvilTools.json`
    : `EvilTools_PartyBackup_${new Date().toISOString().slice(0, 10)}.json`;

  const handleDownload = () => {
    if (exportMode === 'single') {
      exportCharacterJSON(currentHero, downtimeProjects, craftHistory, scribeHistory, earningsHistory);
    } else {
      exportRosterBackupJSON(characters, downtimeProjects, craftHistory, scribeHistory, earningsHistory);
    }
    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.7 }
    });
  };

  const handleCopyClipboard = () => {
    navigator.clipboard.writeText(jsonString).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }).catch(err => {
      console.error('Clipboard copy failed:', err);
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-parchment-50 border-2 border-gold-500 rounded-2xl max-w-xl w-full p-6 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-parchment-300">
          <div className="flex items-center gap-2">
            <Download className="w-5 h-5 text-gold-600" />
            <h3 className="font-serif font-bold text-lg text-arcane-950">
              Export Character & Party Data (JSON)
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
          {/* Mode Selection Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setExportMode('single')}
              className={`p-3.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                exportMode === 'single'
                  ? 'bg-gold-50/80 border-gold-600 shadow-md ring-1 ring-gold-500'
                  : 'bg-white border-parchment-300 hover:border-gold-400 hover:bg-parchment-100/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${exportMode === 'single' ? 'bg-gold-500 text-arcane-950' : 'bg-parchment-200 text-stone-700'}`}>
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-arcane-950">
                    Active Hero Only
                  </h4>
                  <span className="text-[11px] text-stone-500 block">
                    {currentHero?.name || 'Current Character'}
                  </span>
                </div>
              </div>
              <p className="text-xs text-parchment-600">
                Exports stats, spells, formulas & projects for this hero.
              </p>
            </button>

            <button
              type="button"
              onClick={() => setExportMode('roster')}
              className={`p-3.5 rounded-xl text-left border-2 transition-all flex flex-col justify-between ${
                exportMode === 'roster'
                  ? 'bg-gold-50/80 border-gold-600 shadow-md ring-1 ring-gold-500'
                  : 'bg-white border-parchment-300 hover:border-gold-400 hover:bg-parchment-100/50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`p-2 rounded-lg ${exportMode === 'roster' ? 'bg-gold-500 text-arcane-950' : 'bg-parchment-200 text-stone-700'}`}>
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-serif font-bold text-sm text-arcane-950">
                    Full Party Backup
                  </h4>
                  <span className="text-[11px] text-stone-500 block">
                    {characters.length} Character{characters.length === 1 ? '' : 's'} + All Data
                  </span>
                </div>
              </div>
              <p className="text-xs text-parchment-600">
                Complete archive of all heroes, downtime crafting & history.
              </p>
            </button>
          </div>

          {/* Export Payload Summary Card */}
          <div className="bg-white p-4 rounded-xl border border-parchment-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-emerald-600" />
                <span className="font-mono text-xs font-bold text-stone-800 break-all">
                  {safeFilename}
                </span>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-parchment-100 text-stone-600 border border-parchment-300">
                {jsonSizeKb} KB
              </span>
            </div>

            {/* Details breakdown */}
            {exportMode === 'single' && currentHero && (
              <div className="space-y-2 pt-2 border-t border-parchment-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-medium">Hero:</span>
                  <span className="font-bold text-arcane-950">
                    {currentHero.name} (Lvl {currentHero.level} {currentHero.characterClass})
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-forge-50 border border-forge-200 text-forge-800 font-semibold">
                    🔨 {currentHero.formulas?.length || 0} Formulas
                  </span>
                  <span className="px-2 py-0.5 rounded bg-arcane-50 border border-arcane-200 text-arcane-800 font-semibold">
                    ✨ {currentHero.learnedSpells?.length || 0} Learned Spells
                  </span>
                  <span className="px-2 py-0.5 rounded bg-gold-50 border border-gold-200 text-gold-800 font-semibold">
                    💰 {currentHero.wealth?.gp || 0} GP ({currentHero.wealth?.totalCopper ? `${(currentHero.wealth.totalCopper / 100).toFixed(2)} gp total` : '0 gp'})
                  </span>
                </div>
              </div>
            )}

            {exportMode === 'roster' && (
              <div className="space-y-2 pt-2 border-t border-parchment-200">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-stone-600 font-medium">Included Roster:</span>
                  <span className="font-bold text-arcane-950">
                    {characters.map(c => c.name).join(', ')}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-purple-50 border border-purple-200 text-purple-800 font-semibold">
                    👥 {characters.length} Characters
                  </span>
                  <span className="px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-blue-800 font-semibold">
                    ⏳ {downtimeProjects.length} Downtime Projects
                  </span>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold">
                    📜 {craftHistory.length + scribeHistory.length + earningsHistory.length} History Logs
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Cross-device Instructions */}
          <div className="p-3 bg-arcane-900/5 rounded-xl border border-arcane-900/10 text-xs text-parchment-700 space-y-1">
            <p className="font-bold text-arcane-950 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-gold-600" />
              Cross-Device Portability
            </p>
            <p className="text-[11px] leading-relaxed text-stone-600">
              Download this JSON file or copy its text to transfer your characters to your phone, tablet, or another browser. In EvilTools on the other device, click <strong className="text-stone-800 font-bold">Import JSON</strong> and select or paste this file.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="pt-3 border-t border-parchment-300 flex flex-col-reverse sm:flex-row items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-4 py-2 rounded-xl border border-parchment-400 text-stone-700 hover:bg-parchment-200 font-semibold text-sm transition-colors"
          >
            Close
          </button>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleCopyClipboard}
              className="flex-1 sm:flex-none px-3.5 py-2 rounded-xl bg-parchment-200 hover:bg-parchment-300 text-stone-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors border border-parchment-400"
              title="Copy JSON text to clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-600" />
                  <span className="text-emerald-700">Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-stone-600" />
                  <span>Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="flex-1 sm:flex-none px-5 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-arcane-950 font-bold text-sm shadow-md transition-all flex items-center justify-center gap-1.5"
            >
              <Download className="w-4 h-4" />
              <span>Download JSON</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
