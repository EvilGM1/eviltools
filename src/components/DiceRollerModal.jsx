import React, { useState, useEffect } from 'react';
import { X, Dices, Sparkles, CheckCircle2, AlertTriangle, XCircle, Trophy, RefreshCw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { evaluateDegree } from '../services/craftingEngine.js';

export function DiceRollerModal({
  isOpen,
  onClose,
  title,
  subtitle,
  skillName,
  skillMod,
  targetDC,
  mode = 'craft', // 'craft', 'scribe', or 'earnings'
  character,
  circumstanceBonus = 0,
  circumstanceBonusLabel = '',
  isSpecialtyActive = false,
  impeccableCraftingActive = false,
  isLoreSkill = false,
  onApplyResult
}) {
  if (!isOpen) return null;

  const [dieResult, setDieResult] = useState(null);
  const [manualInput, setManualInput] = useState('');
  const [isRolling, setIsRolling] = useState(false);
  const [degreeOfSuccess, setDegreeOfSuccess] = useState(null);
  const [adjustedDegree, setAdjustedDegree] = useState(null);
  const [featNotes, setFeatNotes] = useState([]);

  const totalMod = skillMod + circumstanceBonus;
  const rollTotal = dieResult !== null ? dieResult + totalMod : null;

  const handleRoll = () => {
    setIsRolling(true);
    let count = 0;
    const interval = setInterval(() => {
      const tempRoll = Math.floor(Math.random() * 20) + 1;
      setDieResult(tempRoll);
      count++;
      if (count >= 10) {
        clearInterval(interval);
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        setDieResult(finalRoll);
        setManualInput(String(finalRoll));
        setIsRolling(false);
        evaluateFinalResult(finalRoll);
      }
    }, 45);
  };

  const handleManualChange = (val) => {
    setManualInput(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num >= 1 && num <= 20) {
      setDieResult(num);
      evaluateFinalResult(num);
    } else {
      setDieResult(null);
      setDegreeOfSuccess(null);
      setAdjustedDegree(null);
      setFeatNotes([]);
    }
  };

  const evaluateFinalResult = (d20) => {
    const rawTotal = d20 + totalMod;
    let baseDegree = evaluateDegree(rawTotal, d20, targetDC);
    let finalDegree = baseDegree;
    const notes = [];

    if (circumstanceBonus > 0) {
      const label = circumstanceBonusLabel || (mode === 'craft' ? 'Specialty Crafting' : 'Circumstance Bonus');
      notes.push(`${label}: +${circumstanceBonus} circumstance bonus applied.`);
    }

    // Feat evaluations
    if (mode === 'craft') {
      // Impeccable Crafting: only active if Specialty Crafting is on for this job
      if (impeccableCraftingActive && baseDegree === 'success') {
        finalDegree = 'criticalSuccess';
        notes.push('Impeccable Crafting: Success on specialty craft upgraded to Critical Success (faster/cheaper downtime rate)!');
      }
    } else if (mode === 'scribe') {
      // Spellbook Prodigy: Crit Fail -> Fail
      if (character?.feats?.spellbookProdigy && baseDegree === 'criticalFailure') {
        finalDegree = 'failure';
        notes.push('Spellbook Prodigy: Critical Failure upgraded to Failure (0 materials lost).');
      }

      // Magical Shorthand: Success -> Crit Success
      if (character?.feats?.magicalShorthand && baseDegree === 'success') {
        finalDegree = 'criticalSuccess';
        notes.push('Magical Shorthand: Success upgraded to Critical Success (50% material discount).');
      }
    } else if (mode === 'earnings') {
      // Experienced Professional: Lore skills Success -> Crit Success, Crit Fail -> Fail
      if (isLoreSkill && character?.feats?.experiencedProfessional) {
        if (baseDegree === 'success') {
          finalDegree = 'criticalSuccess';
          notes.push('Experienced Professional: Success on Lore check upgraded to Critical Success!');
        } else if (baseDegree === 'criticalFailure') {
          finalDegree = 'failure';
          notes.push('Experienced Professional: Critical Failure on Lore check upgraded to Failure (still earns untrained rate)!');
        }
      }
    }

    setDegreeOfSuccess(baseDegree);
    setAdjustedDegree(finalDegree);
    setFeatNotes(notes);

    if (finalDegree === 'criticalSuccess' || finalDegree === 'success') {
      confetti({
        particleCount: finalDegree === 'criticalSuccess' ? 100 : 50,
        spread: 70,
        origin: { y: 0.6 }
      });
    }
  };

  const handleConfirm = () => {
    if (!adjustedDegree) return;
    if (onApplyResult) {
      onApplyResult({
        dieResult,
        skillMod: totalMod,
        baseSkillMod: skillMod,
        circumstanceBonus,
        rollTotal,
        targetDC,
        rawDegree: degreeOfSuccess,
        finalDegree: adjustedDegree,
        featNotes
      });
    }
    onClose();
  };

  // Reset state on modal open
  useEffect(() => {
    setDieResult(null);
    setManualInput('');
    setDegreeOfSuccess(null);
    setAdjustedDegree(null);
    setFeatNotes([]);
  }, [isOpen, targetDC]);

  const getDegreeConfig = (deg) => {
    switch (deg) {
      case 'criticalSuccess':
        return {
          label: 'Critical Success!',
          color: 'text-amber-400 bg-amber-950/80 border-amber-500',
          icon: Trophy,
          desc: mode === 'scribe'
            ? 'You learn the spell in record time and pay only HALF the usual material costs!'
            : 'Outstanding mastery! You craft the item with perfection. You can complete it immediately or reduce cost further through downtime.'
        };
      case 'success':
        return {
          label: 'Success!',
          color: 'text-emerald-400 bg-emerald-950/80 border-emerald-500',
          icon: CheckCircle2,
          desc: mode === 'scribe'
            ? 'You successfully master and record the spell into your spellbook / familiar.'
            : 'You successfully craft the item. Pay the remaining half to finish now, or spend downtime days to reduce the cost.'
        };
      case 'failure':
        return {
          label: 'Failure',
          color: 'text-orange-400 bg-orange-950/80 border-orange-500',
          icon: AlertTriangle,
          desc: mode === 'scribe'
            ? 'You fail to learn the spell. None of your materials are wasted, but you cannot try again until you gain a level or 1 week passes.'
            : 'You fail to complete the item, but you salvage 100% of your raw materials without loss.'
        };
      case 'criticalFailure':
        return {
          label: 'Critical Failure',
          color: 'text-red-400 bg-red-950/80 border-red-500',
          icon: XCircle,
          desc: mode === 'scribe'
            ? 'You botch the ritual and ruin materials worth the standard cost! You cannot attempt to learn this spell again until your next level.'
            : 'Disaster at the anvil! You ruin 10% of the raw materials (the remaining 90% is salvaged).'
        };
      default:
        return null;
    }
  };

  const degreeConfig = adjustedDegree ? getDegreeConfig(adjustedDegree) : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div className="bg-gradient-to-b from-arcane-950 via-arcane-900 to-forge-950 border-2 border-gold-500 text-parchment-100 rounded-2xl max-w-lg w-full p-6 shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-arcane-800">
          <div className="flex items-center gap-2">
            <Dices className="w-5 h-5 text-gold-400" />
            <div>
              <h3 className="font-serif font-bold text-lg text-gold-300 leading-tight">
                {title || 'Skill Check'}
              </h3>
              {subtitle && <p className="text-xs text-parchment-400">{subtitle}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-parchment-400 hover:text-white hover:bg-arcane-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="py-5 space-y-5 text-center flex-1 overflow-y-auto">
          {/* Target DC & Modifier Banner */}
          <div className="flex items-center justify-center gap-4 text-sm bg-arcane-900/90 py-2.5 px-4 rounded-xl border border-arcane-700/80">
            <div>
              <span className="text-xs text-parchment-400 block uppercase font-bold">Skill ({skillName})</span>
              <span className="font-mono text-base font-black text-blue-300">+{skillMod}</span>
            </div>
            <div className="h-8 w-px bg-arcane-700"></div>
            <div>
              <span className="text-xs text-parchment-400 block uppercase font-bold">Target DC</span>
              <span className="font-mono text-base font-black text-gold-300">{targetDC}</span>
            </div>
          </div>

          {/* Dice Animation & Roll Display */}
          <div className="py-2">
            <div className="flex items-center justify-center gap-4 mb-4">
              <div
                className={`w-24 h-24 rounded-2xl border-2 flex flex-col items-center justify-center shadow-2xl transition-all transform ${
                  isRolling
                    ? 'animate-spin border-gold-400 bg-arcane-800'
                    : dieResult === 20
                    ? 'border-amber-400 bg-amber-950 scale-105 ring-4 ring-amber-400/50'
                    : dieResult === 1
                    ? 'border-red-500 bg-red-950 scale-105 ring-4 ring-red-500/50'
                    : dieResult !== null
                    ? 'border-gold-500 bg-arcane-950'
                    : 'border-arcane-700 bg-arcane-900'
                }`}
              >
                <span className="text-xs font-serif font-bold text-parchment-400 uppercase tracking-widest">
                  d20
                </span>
                <span
                  className={`text-4xl font-mono font-black ${
                    dieResult === 20
                      ? 'text-amber-300 animate-pulse'
                      : dieResult === 1
                      ? 'text-red-400'
                      : 'text-parchment-100'
                  }`}
                >
                  {dieResult !== null ? dieResult : '-'}
                </span>
              </div>
            </div>

            {/* Roll Controls */}
            <div className="flex items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleRoll}
                disabled={isRolling}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-gold-600 via-gold-500 to-gold-400 hover:from-gold-500 hover:to-gold-300 text-arcane-950 font-bold font-serif text-sm shadow-lg transform active:scale-95 transition-all flex items-center gap-2"
              >
                <Dices className="w-4 h-4" />
                <span>{isRolling ? 'Rolling...' : 'Roll Digital d20'}</span>
              </button>

              <div className="flex items-center gap-1.5 bg-arcane-900 px-3 py-1.5 rounded-xl border border-arcane-700">
                <label className="text-xs text-parchment-400 font-semibold">Physical d20:</label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={manualInput}
                  onChange={(e) => handleManualChange(e.target.value)}
                  placeholder="1-20"
                  className="w-14 p-1 text-center bg-arcane-950 border border-arcane-600 rounded text-sm font-bold text-gold-300 focus:outline-none focus:ring-1 focus:ring-gold-400"
                />
              </div>
            </div>
          </div>

          {/* Roll Breakdown & Degree Evaluation */}
          {dieResult !== null && degreeConfig && (
            <div className="space-y-3 animate-fadeIn">
              {/* Math breakdown */}
              <div className="text-sm font-mono text-parchment-200 bg-arcane-950/70 py-1.5 px-3 rounded-lg border border-arcane-800 inline-block">
                <span>Roll: {dieResult}</span>
                <span className="text-blue-300"> + {skillMod} (Skill)</span>
                <span className="font-bold text-gold-300"> = {rollTotal} </span>
                <span className="text-parchment-400"> vs DC {targetDC}</span>
                <span className="text-xs text-parchment-400 ml-1">
                  ({rollTotal >= targetDC ? `+${rollTotal - targetDC}` : rollTotal - targetDC})
                </span>
              </div>

              {/* Degree Card */}
              <div className={`p-4 rounded-xl border ${degreeConfig.color} shadow-lg space-y-1.5`}>
                <div className="flex items-center justify-center gap-2 text-base font-serif font-black">
                  <degreeConfig.icon className="w-5 h-5" />
                  <span>{degreeConfig.label}</span>
                </div>
                <p className="text-xs text-parchment-200 leading-relaxed max-w-md mx-auto">
                  {degreeConfig.desc}
                </p>

                {/* Feat Perks Callout */}
                {featNotes.length > 0 && (
                  <div className="pt-2 mt-2 border-t border-white/20 text-xs text-gold-300 flex items-center justify-center gap-1 font-semibold">
                    <Sparkles className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{featNotes.join(' ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-arcane-800 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-arcane-700 text-parchment-300 hover:bg-arcane-800 text-sm font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={dieResult === null}
            className="px-5 py-2 rounded-xl bg-gradient-to-r from-gold-600 to-gold-500 hover:from-gold-500 hover:to-gold-400 text-arcane-950 font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-1.5"
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>Apply Outcome</span>
          </button>
        </div>
      </div>
    </div>
  );
}
