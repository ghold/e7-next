# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Epic Seven (第七史诗) equipment analysis tool. Users import equipment JSON data, the app scores each piece against a CSV-based rule engine, and displays ranked results.

## Environment

**Node.js:** v20 (use `nvm use 20` or ensure `node -v` reports v20.x before running any commands)

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Run production server
npm run lint     # ESLint
npm run test     # Run all tests (vitest)
npx vitest run src/__tests__/rule-engine.test.ts           # Run single test file
npx vitest run src/__tests__/rule-engine.test.ts --reporter=verbose  # Verbose output with console.log
```

## Architecture

**Stack:** Next.js 16 (App Router), React 19, Tailwind CSS v4, shadcn/ui (base-nova style), TypeScript.

**Core domain flow:**
1. User imports equipment JSON → `equipment-parser.ts` parses raw data, applies reforge calculations for lv85 gear
2. `useRules` hook fetches `public/rules.csv` via `/api/rules` route, parses into `EquipmentRule[]`
3. `rule-engine.ts` (`RuleEngine` class) matches each equipment against rules by checking set/position/mainStat/subStat filters, then evaluates score conditions and multipliers
4. `equipment-scoring.ts` calculates base score with weighted stat formula: `speed×2`, `cdmg×(9/8)`, `crit×(9/6)`, flat stats scaled by their ratios, percent stats at face value
5. Results cached in localStorage via `cache.ts`

**Key paths:**
- `src/lib/rule-engine.ts` — CSV parsing, rule matching, condition evaluation (Chinese condition strings like `速度>=27`, `分数[65-73]`)
- `src/lib/equipment-scoring.ts` — stat-to-score formula
- `src/lib/expression-eval.ts` — safe math evaluator for multiplier expressions (supports `score`, `speed`, `effectiveScore` variables)
- `src/lib/reforge-calculator.ts` — reforge value calculation for lv85 equipment
- `src/lib/conversion-utils.ts` — substat conversion limit lookup and potential score calculation
- `src/constants/` — all domain enums (`StatType`, `SetType`, `EquipmentType`, `RankType`) and display/mapping tables
- `src/constants/substat-modification.ts` — conversion limits per level (88/90) and allowed substats per equipment type
- `src/types/rule-engine.ts` — TypeScript interfaces for rules, conditions, filters
- `src/hooks/` — `useEquipment` (import/cache/stats), `useRules` (fetch/parse CSV with dedup)
- `src/components/equipment/` — UI for file import, equipment list, detail sheet, stats summary

**Path alias:** `@/*` → `./src/*`

**UI design system:** Dark tactical HUD aesthetic — charcoal background (`oklch(0.175)`), amber/gold accents (`gold-400`/`gold-500`), steel grays for secondary text. Components use `font-mono` for data, HUD corner decorations, and section headers with colored indicator bars. Maintain this style when adding UI.

## Scoring Mechanics

**Base score** (`calculateEquipmentScore`): sum of weighted substats. Speed×2, cdmg×9/8, crit×9/6, flat stats scaled by conversion ratios, percent stats at face value.

**Effective score** (`calculateActOnScore`): same formula but zeros out substats NOT in the rule's `validStats` list. Used for `act_on` and `act_on_special` rules. For boots with speed in valid stats, speed multiplier is 1.4 instead of 2.

**Rule matching** (`matchSingleRule`): checks set → position → mainStat → validStat filters in sequence. All must pass for the rule to match. Then evaluates condition sets (first matching condition wins) and applies the multiplier expression.

**SubStatFilter types:**
- `all` — no substat filtering
- `have` — equipment must have at least one of the specified substats
- `act_on` — score only matching substats (effective score)
- `act_on_special` — same as act_on plus special validation checks:
  - `special_check_one`: requires effectiveness or resistance in main stat, set, or substats
  - `special_check_three`: AttackPercent, Effectiveness, and Resistance cannot ALL three coexist simultaneously (2 of 3 is OK). HIT_SET provides Effectiveness implicitly, RESIST_SET provides Resistance implicitly.

**"速度" (speed) check item gate:** speed score is zeroed unless at least one of 9 dependency check items (输出, 输出（必爆）, 抗坦(坦克), 纯肉(坦克), 命坦(双效), 双效, 半肉(血防), 半肉, 半肉(白字)) has score > 0.

**Substat conversion analysis:** both the converter page (`src/app/converter/page.tsx`) and equipment detail drawer (`src/components/equipment/equipment-detail.tsx`) calculate potential conversions. Conversions include same-type upgrades (e.g., Speed → Speed at higher value). Conversion limits are defined in `src/constants/substat-modification.ts` per level (88/90), indexed by rolls-1.

## Constraints

- **`public/rules.csv` is read-only** — do not modify, regenerate, or overwrite this file. It is the canonical rule set and must be preserved as-is.

## Domain Notes

- Rule conditions use Chinese text patterns: `速度` (speed), `分数` (score), `有效分数` (effective score), `全部` (all)
- Equipment data comes from an external tool (likely E7 gear exporter); the JSON format includes fields like `code`, `ct`, `e`, `f`, `g`, `mg`, `op`, `s` which are passed through as-is
- Display mappings in `src/constants/` convert internal enum values to Chinese: `SetTypeDisplay`, `EquipmentTypeDisplay`, `StatTypeDisplay`, `positionDisplay`. Rule engine stores English keys (e.g. `WEAPON`, `AttackPercent`, `SpeedSet`); UI layer translates for display.
- Level 85 equipment is reforged to level 90 stats; conversion limits use level 90 data for level 85
- `statMap` in `src/constants/rule-engine.ts` maps Chinese stat names (both short and long forms like `攻击%` and `攻击力%`) to `StatType` enum values
