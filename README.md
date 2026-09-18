# EvilTools: PF2e Remaster Craft & Scribe Suite

**EvilTools** is an all-in-one, responsive web application uniting **EvilCraft** (Pathfinder 2e Remaster Item Crafting Suite) and **EvilScribe** (Wizard & Witch Spell Learning Suite) with instant **Pathbuilder 2e and Foundry VTT PF2e Character Ingestion**.

Built with **React**, **Vite**, and **Tailwind CSS**, EvilTools runs 100% in-browser offline with zero external server dependencies, and can be deployed directly to GitHub Pages or run locally.

---

## Key Features

### 1. Universal Character Ingestion & Persistence
- **Pathbuilder 2e JSON Ingestion**: Automatically extracts level, class, abilities, skill proficiencies, purse coins, feats, and known formula books from Pathbuilder `build` files.
- **Foundry VTT PF2e Actor Ingestion**: Ingests Foundry `Actor` JSON files, accurately mapping items, currency items (PP/GP/SP/CP), embedded spellcasting entries, known spells, and crafting formulas.
- **Local Persistence & Character Switcher**: Persists multiple characters, formulas, downtime projects, and crafting/scribing histories in browser `localStorage`.
- **Character Editor Modal**: Fully customize or create custom characters, level, skill ranks/modifiers, coin purse, and feat perks.

---

### 2. EvilCraft (Remaster Crafting Workbench)
- **Official PF2e Remaster Crafting Rules**: Full support for standard and rare item DCs, formula requirements, setup preparation times (1 day with formula / 2 days without), and Earn Income scaling.
- **Instant Rush vs Downtime Tracking**:
  - **Instant Rush**: Roll Crafting check and pay the full 100% price upfront to finish immediately on success.
  - **Downtime Projects**: Pay 50% upfront for raw materials, track daily work progress with `+1 Day` or `+7 Days` buttons, and reduce remaining balance according to daily Earn Income rates.
  - **Positive Savings Display**: Always clearly displays total gold saved as a positive bonus (e.g. `+1 gp, 8 sp Saved`).
  - **Cancel & Salvage**: Salvage 100% of raw materials if canceled.
- **Wand & Scroll Imbuing**: Embed specific spells from the compendium into magic wands and scrolls during crafting.
- **Batch Sizing**: Multiply consumables or ammunition quantities with dynamic price scaling.
- **Custom Item Creator**: Add homebrew items, runes, weapons, or elixirs with custom level, price, and rarity.

---

### 3. EvilScribe (Remaster Spell Grimoire & Familiar Learning)
- **Wizard & Witch Support**: Full tradition alignment:
  - **Arcane** -> Arcana
  - **Occult** -> Occultism (supports Witch occult patrons)
  - **Divine** -> Religion
  - **Primal** -> Nature
- **Player Core Learn a Spell Table**: Built-in pricing (Cantrips through Rank 10) and DCs (Common to Unique).
- **Remaster Feat Automations**:
  - **Magical Shorthand**: Scribing takes a flat **10 minutes** (instead of 1 hr/rank), and standard Successes automatically upgrade to **Critical Successes** (50% material discount).
  - **Spellbook Prodigy**: Converts Critical Failures into normal Failures (0 ink/materials lost).
- **Interactive Grimoire / Familiar Memory**: View and manage all learned spells grouped by rank, with 1-week lockout tracking on failed attempts.
- **Custom Spell Creator**: Add homebrew spells to learn or scribe.

---

### 4. Interactive Dice Roller
- Roll virtual d20 with animated rolls or type your physical d20 result.
- Automatically calculates degree of success (Critical Success, Success, Failure, Critical Failure) with Nat 20/Nat 1 adjustments and feat upgrades.
- One-click outcome application to character wealth, inventory, and project logs.

---

## Getting Started

### Local Development
```bash
# 1. Navigate to the project directory
cd eviltools

# 2. Install dependencies
npm install

# 3. Start local development server
npm run dev
```

### Production Build
```bash
npm run build
```
The compiled, self-contained single-page application is built into the `dist/` directory, ready to deploy to GitHub Pages, Netlify, Vercel, or any static host.

---

## Project Structure
```
eviltools/
├── index.html
├── package.json
├── vite.config.js
├── tailwind.config.js
├── postcss.config.js
├── public/
│   └── favicon.svg
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── components/
    │   ├── Header.jsx
    │   ├── CraftingSuite.jsx
    │   ├── ScribeSuite.jsx
    │   ├── ImportModal.jsx
    │   ├── CharacterEditorModal.jsx
    │   └── DiceRollerModal.jsx
    ├── data/
    │   ├── itemsCompendium.json
    │   └── spellsCompendium.json
    └── services/
        ├── characterImporter.js
        ├── craftingEngine.js
        └── scribeEngine.js
```

---

## License
MIT License. Pathfinder 2e and associated rules/terminology are copyright Paizo Inc. and used under the Open Game License / ORC License.
