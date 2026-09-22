# EvilTools: PF2e Remaster Craft, Scribe & Earn Suite

**EvilTools** is an all-in-one, responsive web application uniting **EvilCraft** (Pathfinder 2e Remaster Item Crafting Suite), **EvilScribe** (Wizard & Witch Spell Learning Suite), and **EvilEarnings** (Downtime Earn Income Suite) with instant **Pathbuilder 2e and Foundry VTT PF2e Character Ingestion**.

Built with **React**, **Vite**, and **Tailwind CSS**, EvilTools runs 100% in-browser offline with zero external server dependencies, and can be deployed directly to GitHub Pages or run locally.

---

## Key Features

### 1. Universal Character Ingestion & Persistence
- **Pathbuilder 2e JSON Ingestion**: Automatically extracts level, class, abilities, skill proficiencies, purse coins, feats, and known formula books from Pathbuilder `build` files.
- **Foundry VTT PF2e Actor Ingestion**: Ingests Foundry `Actor` JSON files, accurately mapping items, currency items (PP/GP/SP/CP), embedded spellcasting entries, known spells, crafting formulas, and lore skills.
- **Local Persistence & Character Switcher**: Persists multiple characters, formulas, downtime projects, and crafting/scribing/earnings histories in browser `localStorage`.
- **Character Editor Modal**: Fully customize or create custom characters, level, skill ranks/modifiers, Lore skills manager, coin purse, and feat perks.

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

### 4. EvilEarnings (Remaster Downtime Earn Income Suite)
- **Official PF2e Remaster Earn Income Engine**:
  - Full Task Level scaling (Level 0 through 20) with Level-Based DCs (DC 14 to DC 40).
  - Remaster daily income rate matrix supporting Untrained, Trained, Expert, Master, and Legendary ranks.
  - Critical Success (Task Level + 1 rate), Success (Task Level rate), Failure (Task Level Untrained rate), and Critical Failure (0 cp / fired).
- **Multi-Trade Skill Selection**:
  - **Crafting**: Put artisan knowledge to work with Specialty Crafting circumstance bonuses (+1 / +2).
  - **Performance**: Street busking and stage performance with Virtuosic Performer bonus (+2).
  - **Lore Skills**: Put specialized Lore skills (Warfare Lore, Academia Lore, Underworld Lore, etc.) to work or add custom lores directly.
- **Settlement Presets & Durations**:
  - Quick settlement caps: Hamlet (Lvl 0), Village (Lvl 1), Small Town (Lvl 2), Town (Lvl 4), City (Lvl 7), Metropolis (Lvl 10).
  - Flexible work duration presets: 1 Day, 7 Days (1 Week), 14 Days (2 Weeks), 30 Days (1 Month), or custom days.
- **Assurance & Feat Automations**:
  - **Experienced Professional**: Automatically upgrades Successes to Critical Successes and Critical Failures to normal Failures on Lore checks.
  - **Assurance Feat**: Claim guaranteed steady income (flat 10 + proficiency bonus) without risk on lower-level tasks.
- **One-Click Character Purse Deposit**:
  - Instantly adds earned coins into character purse with automatic platinum/gold/silver/copper normalization.
  - Persistent downtime job log with metrics on total days worked and total gold accumulated.

---

### 5. Interactive Dice Roller
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

## Legal & Disclaimers

### Open Source License
This software is licensed under the [MIT License](LICENSE).

### Paizo Community Use & ORC License Notice
This application uses trademarks and/or copyrights owned by **Paizo Inc.**, used under Paizo's Community Use Policy ([paizo.com/communityuse](https://paizo.com/communityuse)). We are expressly prohibited from charging you to use or access this content. This application is not published, endorsed, or specifically approved by Paizo. For more information about Paizo Inc. and Paizo products, visit [paizo.com](https://paizo.com).

Pathfinder and associated marks and logos are trademarks of Paizo Inc. Pathfinder 2e Remaster game mechanics, rules text, and reference tables are used under the **Open RPG Creative (ORC) License** ([paizo.com/orclicense](https://paizo.com/orclicense)).

