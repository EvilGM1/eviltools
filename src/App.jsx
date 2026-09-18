import React, { useState, useEffect } from 'react';
import { Header } from './components/Header.jsx';
import { CraftingSuite } from './components/CraftingSuite.jsx';
import { ScribeSuite } from './components/ScribeSuite.jsx';
import { ImportModal } from './components/ImportModal.jsx';
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
      arcana: { rank: 2, mod: 13, rankName: 'Expert' },
      nature: { rank: 0, mod: 1, rankName: 'Untrained' },
      occultism: { rank: 1, mod: 11, rankName: 'Trained' },
      religion: { rank: 0, mod: 1, rankName: 'Untrained' }
    },
    feats: {
      magicalCrafting: true,
      alchemicalCrafting: false,
      snareCrafting: false,
      magicalShorthand: false,
      spellbookProdigy: true,
      specialtyCrafting: false
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
      arcana: { rank: 0, mod: 2, rankName: 'Untrained' },
      nature: { rank: 0, mod: 1, rankName: 'Untrained' },
      occultism: { rank: 2, mod: 13, rankName: 'Expert' },
      religion: { rank: 1, mod: 9, rankName: 'Trained' }
    },
    feats: {
      magicalCrafting: true,
      alchemicalCrafting: false,
      snareCrafting: false,
      magicalShorthand: true,
      spellbookProdigy: false,
      specialtyCrafting: false
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
      arcana: { rank: 1, mod: 9, rankName: 'Trained' },
      nature: { rank: 0, mod: 0, rankName: 'Untrained' },
      occultism: { rank: 0, mod: 0, rankName: 'Untrained' },
      religion: { rank: 0, mod: 0, rankName: 'Untrained' }
    },
    feats: {
      magicalCrafting: true,
      alchemicalCrafting: true,
      snareCrafting: false,
      magicalShorthand: false,
      spellbookProdigy: false,
      specialtyCrafting: true
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

  // Modals state
  const [isImportOpen, setIsImportOpen] = useState(false);
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

  const activeCharacter = characters.find(c => c.id === activeCharacterId) || characters[0];

  // Character Management Handlers
  const handleUpdateActiveCharacter = (updated) => {
    setCharacters(prev => prev.map(c => c.id === updated.id ? updated : c));
  };

  const handleImportSuccess = (importedCharacter) => {
    // Check if character already exists by name
    const existingIdx = characters.findIndex(c => c.name.toLowerCase() === importedCharacter.name.toLowerCase());
    if (existingIdx >= 0) {
      const updated = [...characters];
      updated[existingIdx] = { ...importedCharacter, id: characters[existingIdx].id };
      setCharacters(updated);
      setActiveCharacterId(characters[existingIdx].id);
    } else {
      setCharacters([importedCharacter, ...characters]);
      setActiveCharacterId(importedCharacter.id);
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
        arcana: { rank: 1, mod: 5, rankName: 'Trained' },
        nature: { rank: 0, mod: 0, rankName: 'Untrained' },
        occultism: { rank: 0, mod: 0, rankName: 'Untrained' },
        religion: { rank: 0, mod: 0, rankName: 'Untrained' }
      },
      feats: {
        magicalCrafting: false,
        alchemicalCrafting: false,
        snareCrafting: false,
        magicalShorthand: false,
        spellbookProdigy: false,
        specialtyCrafting: false
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
            arcana: { rank: 1, mod: 5, rankName: 'Trained' },
            nature: { rank: 0, mod: 0, rankName: 'Untrained' },
            occultism: { rank: 0, mod: 0, rankName: 'Untrained' },
            religion: { rank: 0, mod: 0, rankName: 'Untrained' }
          },
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
        ) : (
          <ScribeSuite
            character={activeCharacter}
            onUpdateCharacter={handleUpdateActiveCharacter}
            scribeHistory={scribeHistory}
            onUpdateHistory={setScribeHistory}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-arcane-950 text-parchment-400 border-t border-gold-600/40 py-4 px-4 text-center text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-serif font-bold text-gold-300">EvilTools Suite</span>
            <span>&bull;</span>
            <span>Pathfinder 2e Remaster Crafting & Scribing Engine</span>
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
