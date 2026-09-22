import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { CraftingSuite } from './components/CraftingSuite.jsx';
import { ScribeSuite } from './components/ScribeSuite.jsx';
import { EarningsSuite } from './components/EarningsSuite.jsx';
import { ImportModal } from './components/ImportModal.jsx';
import { ExportModal } from './components/ExportModal.jsx';
import { CharacterEditorModal } from './components/CharacterEditorModal.jsx';
import { PasscodeGate } from './components/PasscodeGate.jsx';

// Default Preset Characters (Gin - Wizard, The Duke - Occult Witch, Sylor - Runesmith)
const DEFAULT_CHARACTERS = [
  {
    id: 'char-preset-gin',
    name: 'Gin',
    level: 5,
    characterClass: 'Wizard',
    source: 'preset',
    wealth: { pp: 0, gp: 45, sp: 8, cp: 0 },
    skills: {
      crafting: { rank: 1, mod: 9, rankName: 'Trained' },
      performance: { rank: 0, mod: 1, rankName: 'Untrained' },
      arcana: { rank: 2, mod: 13, rankName: 'Expert' },
      nature: { rank: 0, mod: 1, rankName: 'Untrained' },
      occultism: { rank: 1, mod: 11, rankName: 'Trained' },
      religion: { rank: 0, mod: 1, rankName: 'Untrained' }
    },
    loreSkills: [
      { id: 'lore-gin-1', name: 'Academia Lore', rank: 2, mod: 13, rankName: 'Expert' },
      { id: 'lore-gin-2', name: 'Architecture Lore', rank: 1, mod: 11, rankName: 'Trained' }
    ],
    feats: {
      magicalCrafting: true,
      alchemicalCrafting: false,
      snareCrafting: false,
      magicalShorthand: false,
      spellbookProdigy: true,
      specialtyCrafting: false,
      experiencedProfessional: true,
      virtuosicPerformer: false
    },
    formulas: [
      'Magic Wand (1st-Rank Spell)',
      'Scroll of 1st-Rank Spell',
      'Minor Healing Potion',
      'Lesser Healing Potion'
    ],
    spellcasting: {
      traditions: ['arcane'],
      entries: [
        {
          id: 'wizard-spellbook',
          name: 'Wizard Spellbook',
          tradition: 'arcane',
          isWizard: true,
          isWitch: false,
          spells: ['Electric Arc', 'Force Barrage', 'Breathe Fire', 'Dispel Magic', 'Fireball', 'Slow']
        }
      ]
    },
    learnedSpells: ['Electric Arc', 'Force Barrage', 'Breathe Fire', 'Dispel Magic', 'Fireball', 'Slow']
  },
  {
    id: 'char-preset-the-duke',
    name: 'The Duke',
    level: 5,
    characterClass: 'Occult Witch',
    source: 'preset',
    wealth: { pp: 0, gp: 62, sp: 5, cp: 0 },
    skills: {
      crafting: { rank: 1, mod: 9, rankName: 'Trained' },
      performance: { rank: 1, mod: 9, rankName: 'Trained' },
      arcana: { rank: 0, mod: 2, rankName: 'Untrained' },
      nature: { rank: 0, mod: 1, rankName: 'Untrained' },
      occultism: { rank: 2, mod: 13, rankName: 'Expert' },
      religion: { rank: 1, mod: 9, rankName: 'Trained' }
    },
    loreSkills: [
      { id: 'lore-duke-1', name: 'Underworld Lore', rank: 2, mod: 13, rankName: 'Expert' },
      { id: 'lore-duke-2', name: 'Fortune-Telling Lore', rank: 1, mod: 11, rankName: 'Trained' }
    ],
    feats: {
      magicalCrafting: true,
      alchemicalCrafting: false,
      snareCrafting: false,
      magicalShorthand: true,
      spellbookProdigy: false,
      specialtyCrafting: false,
      experiencedProfessional: true,
      virtuosicPerformer: false
    },
    formulas: [
      'Magic Wand (2nd-Rank Spell)',
      'Scroll of 2nd-Rank Spell',
      'Potion of Expeditious Retreat'
    ],
    spellcasting: {
      traditions: ['occult'],
      entries: [
        {
          id: 'witch-familiar',
          name: 'Familiar Grimoire',
          tradition: 'occult',
          isWizard: false,
          isWitch: true,
          spells: ['Void Warp', 'Soothe', 'Phantom Pain', 'Paralyze', 'Grim Tendrils', 'Heroism']
        }
      ]
    },
    learnedSpells: ['Void Warp', 'Soothe', 'Phantom Pain', 'Paralyze', 'Grim Tendrils', 'Heroism']
  },
  {
    id: 'char-preset-sylor',
    name: 'Sylor Ironveil',
    level: 5,
    characterClass: 'Runesmith / Crafter',
    source: 'preset',
    wealth: { pp: 0, gp: 88, sp: 0, cp: 0 },
    skills: {
      crafting: { rank: 2, mod: 13, rankName: 'Expert' },
      performance: { rank: 0, mod: 0, rankName: 'Untrained' },
      arcana: { rank: 1, mod: 9, rankName: 'Trained' },
      nature: { rank: 0, mod: 0, rankName: 'Untrained' },
      occultism: { rank: 0, mod: 0, rankName: 'Untrained' },
      religion: { rank: 0, mod: 0, rankName: 'Untrained' }
    },
    loreSkills: [
      { id: 'lore-sylor-1', name: 'Blacksmithing Lore', rank: 2, mod: 13, rankName: 'Expert' },
      { id: 'lore-sylor-2', name: 'Mining Lore', rank: 1, mod: 11, rankName: 'Trained' }
    ],
    feats: {
      magicalCrafting: true,
      alchemicalCrafting: true,
      snareCrafting: false,
      magicalShorthand: false,
      spellbookProdigy: false,
      specialtyCrafting: true,
      experiencedProfessional: false,
      virtuosicPerformer: false
    },
    formulas: [
      'Striking Rune',
      '+1 Weapon Potency Rune',
      '+1 Armor Potency Rune',
      'Lesser Healing Potion',
      'Alchemist\'s Fire (Lesser)',
      'Everburning Torch'
    ],
    spellcasting: {
      traditions: [],
      entries: []
    },
    learnedSpells: []
  }
];

export function App() {
  const isLocalhost = typeof window !== 'undefined' && (
    window.location.hostname === 'localhost' || 
    window.location.hostname === '127.0.0.1' ||
    window.location.hostname === ''
  );

  const [isUnlocked, setIsUnlocked] = useState(() => {
    if (isLocalhost) return true;
    try {
      return localStorage.getItem('eviltools_auth_unlocked') === 'true';
    } catch (e) {
      return false;
    }
  });

  // Characters State with localStorage persistence
  const [characters, setCharacters] = useState(() => {
    try {
      const saved = localStorage.getItem('eviltools_characters');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch (e) {
      console.warn('Failed to load characters from localStorage', e);
    }
    return DEFAULT_CHARACTERS;
  });

  const [activeCharacterId, setActiveCharacterId] = useState(() => {
    const savedId = localStorage.getItem('eviltools_active_char_id');
    const exists = characters.some(c => c.id === savedId);
    return exists ? savedId : (characters[0]?.id || DEFAULT_CHARACTERS[0].id);
  });

  const [activeTab, setActiveTab] = useState('crafting'); // 'crafting' or 'scribe'

  // Downtime Projects Persistence
  const [downtimeProjects, setDowntimeProjects] = useState(() => {
    try {
      const saved = localStorage.getItem('eviltools_projects');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // History Persistence
  const [craftHistory, setCraftHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('eviltools_craft_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [scribeHistory, setScribeHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('eviltools_scribe_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  const [earningsHistory, setEarningsHistory] = useState(() => {
    try {
      const saved = localStorage.getItem('eviltools_earnings_history');
      if (saved) return JSON.parse(saved);
    } catch (e) {}
    return [];
  });

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingCharacter, setEditingCharacter] = useState(null);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('eviltools_characters', JSON.stringify(characters));
  }, [characters]);

  useEffect(() => {
    if (activeCharacterId) {
      localStorage.setItem('eviltools_active_char_id', activeCharacterId);
    }
  }, [activeCharacterId]);

  useEffect(() => {
    localStorage.setItem('eviltools_projects', JSON.stringify(downtimeProjects));
  }, [downtimeProjects]);

  useEffect(() => {
    localStorage.setItem('eviltools_craft_history', JSON.stringify(craftHistory));
  }, [craftHistory]);

  useEffect(() => {
    localStorage.setItem('eviltools_scribe_history', JSON.stringify(scribeHistory));
  }, [scribeHistory]);

  useEffect(() => {
    localStorage.setItem('eviltools_earnings_history', JSON.stringify(earningsHistory));
  }, [earningsHistory]);

  const activeCharacter = characters.find(c => c.id === activeCharacterId) || characters[0];

  // Character Management Handlers
  const handleUpdateActiveCharacter = (updated) => {
    setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleImportSuccess = (importedData) => {
    // 1. Roster Backup Restore
    if (importedData.isRoster) {
      if (Array.isArray(importedData.characters) && importedData.characters.length > 0) {
        setCharacters(importedData.characters);
        setActiveCharacterId(importedData.characters[0].id);
      }
      if (Array.isArray(importedData.downtimeProjects)) {
        setDowntimeProjects(importedData.downtimeProjects);
      }
      if (Array.isArray(importedData.craftHistory)) {
        setCraftHistory(importedData.craftHistory);
      }
      if (Array.isArray(importedData.scribeHistory)) {
        setScribeHistory(importedData.scribeHistory);
      }
      if (Array.isArray(importedData.earningsHistory)) {
        setEarningsHistory(importedData.earningsHistory);
      }
      return;
    }

    // 2. Single Character Import
    const importedCharacter = importedData;
    const existingIdx = characters.findIndex(
      c => (importedCharacter.id && c.id === importedCharacter.id) || 
           c.name.toLowerCase() === importedCharacter.name.toLowerCase()
    );

    if (existingIdx >= 0) {
      const updated = [...characters];
      updated[existingIdx] = { ...importedCharacter, id: characters[existingIdx].id };
      setCharacters(updated);
      setActiveCharacterId(characters[existingIdx].id);
    } else {
      setCharacters([importedCharacter, ...characters]);
      setActiveCharacterId(importedCharacter.id);
    }

    // Merge any bundled downtime projects
    if (Array.isArray(importedCharacter.importedProjects) && importedCharacter.importedProjects.length > 0) {
      setDowntimeProjects(prev => {
        const existingIds = new Set(prev.map(p => p.id));
        const newProjects = importedCharacter.importedProjects.filter(p => !existingIds.has(p.id));
        return [...prev, ...newProjects];
      });
    }

    // Merge any bundled craft history
    if (Array.isArray(importedCharacter.importedCraftHistory) && importedCharacter.importedCraftHistory.length > 0) {
      setCraftHistory(prev => {
        const existingIds = new Set(prev.map(h => h.id));
        const newHist = importedCharacter.importedCraftHistory.filter(h => !existingIds.has(h.id));
        return [...prev, ...newHist];
      });
    }

    // Merge any bundled scribe history
    if (Array.isArray(importedCharacter.importedScribeHistory) && importedCharacter.importedScribeHistory.length > 0) {
      setScribeHistory(prev => {
        const existingIds = new Set(prev.map(h => h.id));
        const newHist = importedCharacter.importedScribeHistory.filter(h => !existingIds.has(h.id));
        return [...prev, ...newHist];
      });
    }

    // Merge any bundled earnings history
    if (Array.isArray(importedCharacter.importedEarningsHistory) && importedCharacter.importedEarningsHistory.length > 0) {
      setEarningsHistory(prev => {
        const existingIds = new Set(prev.map(h => h.id));
        const newHist = importedCharacter.importedEarningsHistory.filter(h => !existingIds.has(h.id));
        return [...prev, ...newHist];
      });
    }
  };

  const handleOpenEditModal = () => {
    setEditingCharacter(activeCharacter);
    setIsEditOpen(true);
  };

  const handleCreateNewCharacter = () => {
    const newChar = {
      id: `char-custom-${Date.now()}`,
      name: 'New Hero',
      level: 1,
      characterClass: 'Wizard',
      source: 'custom',
      wealth: { pp: 0, gp: 15, sp: 0, cp: 0 },
      skills: {
        crafting: { rank: 1, mod: 5, rankName: 'Trained' },
        performance: { rank: 0, mod: 0, rankName: 'Untrained' },
        arcana: { rank: 1, mod: 5, rankName: 'Trained' },
        nature: { rank: 0, mod: 0, rankName: 'Untrained' },
        occultism: { rank: 0, mod: 0, rankName: 'Untrained' },
        religion: { rank: 0, mod: 0, rankName: 'Untrained' }
      },
      loreSkills: [],
      feats: {
        magicalCrafting: false,
        alchemicalCrafting: false,
        snareCrafting: false,
        magicalShorthand: false,
        spellbookProdigy: false,
        specialtyCrafting: false,
        experiencedProfessional: false,
        virtuosicPerformer: false
      },
      formulas: [],
      spellcasting: {
        traditions: ['arcane'],
        entries: []
      },
      learnedSpells: []
    };
    setCharacters([newChar, ...characters]);
    setActiveCharacterId(newChar.id);
    setEditingCharacter(newChar);
    setIsEditOpen(true);
  };

  const handleDeleteCharacter = (charId) => {
    if (window.confirm('Are you sure you want to delete this character?')) {
      const remaining = characters.filter(c => c.id !== charId);
      if (remaining.length === 0) {
        const freshChar = {
          id: `char-custom-${Date.now()}`,
          name: 'New Hero',
          level: 1,
          characterClass: 'Adventurer',
          source: 'custom',
          wealth: { pp: 0, gp: 15, sp: 0, cp: 0 },
          skills: {
            crafting: { rank: 1, mod: 5, rankName: 'Trained' },
            performance: { rank: 0, mod: 0, rankName: 'Untrained' },
            arcana: { rank: 1, mod: 5, rankName: 'Trained' },
            nature: { rank: 0, mod: 0, rankName: 'Untrained' },
            occultism: { rank: 0, mod: 0, rankName: 'Untrained' },
            religion: { rank: 0, mod: 0, rankName: 'Untrained' }
          },
          loreSkills: [],
          feats: {},
          formulas: [],
          spellcasting: { traditions: ['arcane'], entries: [] },
          learnedSpells: []
        };
        setCharacters([freshChar]);
        setActiveCharacterId(freshChar.id);
      } else {
        setCharacters(remaining);
        if (activeCharacterId === charId) {
          setActiveCharacterId(remaining[0].id);
        }
      }
    }
  };

  if (!isUnlocked) {
    return <PasscodeGate onUnlock={() => setIsUnlocked(true)} />;
  }

  return (
    <div className="min-h-screen bg-parchment-100 text-stone-900 flex flex-col font-sans selection:bg-gold-500 selection:text-white">
      {/* Header Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        characters={characters}
        activeCharacterId={activeCharacterId}
        setActiveCharacterId={setActiveCharacterId}
        onOpenImport={() => setIsImportOpen(true)}
        onOpenExport={() => setIsExportOpen(true)}
        onOpenEdit={handleOpenEditModal}
        onOpenNew={handleCreateNewCharacter}
        onDeleteCharacter={handleDeleteCharacter}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {activeTab === 'crafting' ? (
          <CraftingSuite
            character={activeCharacter}
            onUpdateCharacter={handleUpdateActiveCharacter}
            downtimeProjects={downtimeProjects}
            onUpdateProjects={setDowntimeProjects}
            craftHistory={craftHistory}
            onUpdateHistory={setCraftHistory}
          />
        ) : activeTab === 'scribe' ? (
          <ScribeSuite
            character={activeCharacter}
            onUpdateCharacter={handleUpdateActiveCharacter}
            scribeHistory={scribeHistory}
            onUpdateHistory={setScribeHistory}
          />
        ) : (
          <EarningsSuite
            character={activeCharacter}
            onUpdateCharacter={handleUpdateActiveCharacter}
            earningsHistory={earningsHistory}
            onUpdateHistory={setEarningsHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-arcane-950 text-parchment-400 border-t border-gold-600/40 py-4 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-gold-300">EvilTools Suite</span>
            <span>&bull;</span>
            <span>Pathfinder 2e Remaster Crafting, Scribing & Earn Income Engine</span>
          </div>
          <div className="text-parchment-500 text-[11px]">
            Compatible with Pathbuilder 2e & Foundry VTT PF2e JSON exports
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ImportModal
        isOpen={isImportOpen}
        onClose={() => setIsImportOpen(false)}
        onImportSuccess={handleImportSuccess}
      />

      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        character={activeCharacter}
        characters={characters}
        downtimeProjects={downtimeProjects}
        craftHistory={craftHistory}
        scribeHistory={scribeHistory}
        earningsHistory={earningsHistory}
      />

      <CharacterEditorModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditingCharacter(null);
        }}
        character={editingCharacter || activeCharacter}
        onSave={handleUpdateActiveCharacter}
      />
    </div>
  );
}
export default App;
