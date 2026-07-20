# Plan i18n — open-cowork : ajout de 15 langues supplémentaires

**Statut** : dépôt lié, branche de travail créée — prêt pour exécution
**Exécutant prévu** : MiniMax M3 (modèle peu gourmand en tokens)
**Cible finale** : Pull Request(s) sur `https://github.com/OpenCoworkAI/open-cowork`, **branche cible `main`** (voir correction ci-dessous)
**Méthode** : reproduction de la méthodologie validée sur OpenCode (`d:\App\OpenCode\opencode`), documentée dans le vault Obsidian sous `Methode-i18n-Traduction-Autonome-MultiIA-2026-07-17.md` et `Session-2026-07-17-i18n-Fork-16-Locales-Complet.md`.

Ce document est un **runbook mécanique**. Chaque étape est explicite (commande exacte, code exact, chemin exact) pour minimiser la charge de raisonnement de l'agent exécutant. Ne pas improviser en dehors de ce qui est décrit — en cas de doute, s'arrêter et demander (`BLOCKED`), ne jamais deviner.

### ⚠️ Correction post-audit (2026-07-19) — `dev` ≠ branche cible réelle

`CONTRIBUTING.md` affirme "Target `dev` for all feature/fix PRs". **C'est faux en pratique** : vérifié via `gh pr list --repo OpenCoworkAI/open-cowork --state merged` — les 15 dernières PR mergées ciblent **toutes `main`**, aucune `dev`. De plus, la branche `dev` s'est révélée structurellement très différente et à la traîne (pas de `.github/` ni `CONTRIBUTING.md`, composants réorganisés en une seule structure plate, `en.json` à 810 clés au lieu de 845, `toolHelpers.tsx` inexistant — sa logique est inlinée dans `MessageCard.tsx`). Toutes les instructions de ce plan (§2, §5, §8) ont été vérifiées et sont exactes **pour `main`**. Le dépôt local (`D:\App\open-cowork-main`) est déjà configuré en conséquence (voir §-1).

## -1. État du dépôt local (déjà fait, ne pas refaire)

`D:\App\open-cowork-main` est maintenant un vrai clone git :
- `origin` → `https://github.com/Rwanbt/open-cowork.git` (le fork de l'utilisateur)
- `upstream` → `https://github.com/OpenCoworkAI/open-cowork.git` (le dépôt officiel)
- Branche courante : **`traduction`**, créée depuis `main` (= `origin/main` = `upstream/main`, même commit)
- Ce fichier de plan est présent à la racine du repo, non commité (`git status` le montre en `Untracked`)
- L'ancien contenu du dossier (extraction ZIP sans historique git) a été sauvegardé dans `D:\App\open-cowork-main.pre-git-backup` par précaution — à supprimer une fois ce chantier terminé et validé, pas avant.

Toute la suite du plan s'exécute directement dans `D:\App\open-cowork-main`, sur la branche `traduction`, sans re-cloner.

---

## 0. Contexte — ce qui existe déjà (NE PAS RECRÉER)

`open-cowork` a **déjà** un système i18n fonctionnel et quasi complet. Ce n'est **pas** une tâche d'introduction d'i18n from scratch — c'est une **extension incrémentale**.

- **Stack** : `i18next` (25.10.1) + `react-i18next` (16.6.0) + `i18next-browser-languagedetector` (8.2.1) — déjà dans `package.json`, ne rien installer de nouveau.
- **Fichiers existants** :
  - `src/renderer/i18n/config.ts` — initialisation i18next
  - `src/renderer/i18n/locales/en.json` — **845 clés**, source de vérité, structure JSON imbriquée par namespace (`common`, `welcome`, `settings`, `general`, `memory`, `language`, `api`, `mcp`, `credentials`, etc.)
  - `src/renderer/i18n/locales/zh.json` — 845 clés, parité complète avec `en.json`
- **Langues actuellement supportées** : `en`, `zh` uniquement (2 langues).
- **Adoption dans le code** : `useTranslation` est utilisé dans 44/53 fichiers `.tsx` du renderer, ~800 appels `t(...)`. Le rollout applicatif est quasi terminé.
- **Un seul gap de chaînes en dur confirmé** (voir §2).
- **`src/renderer/i18n/README.md` est partiellement obsolète** : il documente un composant `LanguageSwitcher` qui n'existe pas dans le code. Le vrai sélecteur de langue est inline dans `src/renderer/components/settings/SettingsGeneral.tsx`. Ne pas se fier à ce README pour l'implémentation réelle.

**Objectif de ce plan** : porter le nombre de langues de 2 → **17**, en alignement avec la liste de langues déjà validée et testée dans OpenCode (17 locales : `ar, br(pt-BR), bs, da, de, en, es, fr, ja, ko, no(nb), pl, ru, th, tr, zh, zht(zh-TW)`).

---

## 1. Mapping des codes de langue (OpenCode → open-cowork/i18next)

open-cowork utilise déjà les codes `en` / `zh`. Pour les 15 nouvelles langues, utiliser ces codes i18next-compatibles (BCP-47), avec l'autonyme natif tel qu'affiché dans le sélecteur :

| Code i18next | Langue | Autonyme natif (`nativeName`) |
|---|---|---|
| `ar` | Arabe | العربية |
| `pt-BR` | Portugais (Brésil) | Português (Brasil) |
| `bs` | Bosniaque | Bosanski |
| `da` | Danois | Dansk |
| `de` | Allemand | Deutsch |
| `es` | Espagnol | Español |
| `fr` | Français | Français |
| `ja` | Japonais | 日本語 |
| `ko` | Coréen | 한국어 |
| `nb` | Norvégien (Bokmål) | Norsk bokmål |
| `pl` | Polonais | Polski |
| `ru` | Russe | Русский |
| `th` | Thaï | ไทย |
| `tr` | Turc | Türkçe |
| `zh-TW` | Chinois traditionnel | 繁體中文 |

(déjà présents : `en` → English, `zh` → 中文)

Ces codes seront utilisés tels quels comme : (a) nom de fichier `locales/<code>.json`, (b) clé dans `config.ts` `resources`, (c) entrée dans `supportedLngs`, (d) valeur `code` dans le tableau `languages` de `SettingsGeneral.tsx`.

---

## 2. Combler le gap de chaînes en dur AVANT de dupliquer les langues

**Pourquoi en premier** : si on scaffold les 15 nouveaux fichiers de langue avant de corriger ce gap, il faudra ensuite ajouter les nouvelles clés dans 15 fichiers a posteriori. En le faisant AVANT, le clonage de `en.json` (étape 4) inclut déjà les nouvelles clés dans les 15 langues dès le départ.

### 2.1 Fichier concerné : `src/renderer/components/message/toolHelpers.tsx`

La fonction `getToolLabel(name, input, displayName)` (lignes 40-80) retourne des libellés 100% anglais en dur (`'Read file'`, `'Write file'`, `` `Run command` ``, etc.), affichés dans chaque bulle de tool-call du chat, quelle que soit la langue sélectionnée. C'est une fonction utilitaire pure (pas un composant React), elle ne peut donc pas appeler `useTranslation()` elle-même — il faut lui **injecter** la fonction `t` en paramètre depuis les composants appelants.

### 2.2 Ajouter le namespace `toolLabels` dans `src/renderer/i18n/locales/en.json`

Ajouter cet objet au niveau racine du JSON (ordre alphabétique parmi les autres namespaces, ou à la fin — peu importe, JSON n'a pas d'ordre sémantique) :

```json
"toolLabels": {
  "readFile": "Read file",
  "readPath": "Read {{path}}",
  "writeFile": "Write file",
  "writePath": "Write {{path}}",
  "editFile": "Edit file",
  "editPath": "Edit {{path}}",
  "runCommand": "Run command",
  "runCommandWith": "$ {{command}}",
  "glob": "Glob",
  "globPattern": "Glob {{pattern}}",
  "grepPattern": "Grep \"{{pattern}}\"",
  "webSearch": "Web search",
  "webSearchQuery": "Search \"{{query}}\"",
  "fetchUrl": "Fetch URL",
  "fetchUrlWith": "Fetch {{url}}",
  "screenshotCaptured": "Screenshot captured"
}
```

Ajouter la **même structure traduite en chinois** dans `src/renderer/i18n/locales/zh.json` (16 clés seulement, à traduire manuellement à ce stade — ne pas déléguer ce micro-lot à part) :

```json
"toolLabels": {
  "readFile": "读取文件",
  "readPath": "读取 {{path}}",
  "writeFile": "写入文件",
  "writePath": "写入 {{path}}",
  "editFile": "编辑文件",
  "editPath": "编辑 {{path}}",
  "runCommand": "运行命令",
  "runCommandWith": "$ {{command}}",
  "glob": "文件匹配",
  "globPattern": "匹配 {{pattern}}",
  "grepPattern": "搜索 \"{{pattern}}\"",
  "webSearch": "网页搜索",
  "webSearchQuery": "搜索 \"{{query}}\"",
  "fetchUrl": "获取网址",
  "fetchUrlWith": "获取 {{url}}",
  "screenshotCaptured": "已截图"
}
```

### 2.3 Modifier `toolHelpers.tsx`

Changer la signature de `getToolLabel` pour accepter `t` en dernier paramètre, et l'utiliser :

```tsx
import type { TFunction } from 'i18next';

export function getToolLabel(
  name: string,
  input: Record<string, unknown>,
  displayName: string | undefined,
  t: TFunction
): string {
  const inp = input || {};
  if (name.startsWith('mcp__')) {
    return getMcpToolDisplayName(name, displayName);
  }

  const nameLower = name.toLowerCase();
  if (nameLower === 'read' || nameLower === 'read_file') {
    const p = String(inp.file_path || inp.path || '');
    return p ? t('toolLabels.readPath', { path: shortenPath(p) }) : t('toolLabels.readFile');
  }
  if (nameLower === 'write' || nameLower === 'write_file') {
    const p = String(inp.file_path || inp.path || '');
    return p ? t('toolLabels.writePath', { path: shortenPath(p) }) : t('toolLabels.writeFile');
  }
  if (nameLower === 'edit' || nameLower === 'edit_file') {
    const p = String(inp.file_path || inp.path || '');
    return p ? t('toolLabels.editPath', { path: shortenPath(p) }) : t('toolLabels.editFile');
  }
  if (nameLower === 'bash' || nameLower === 'execute_command') {
    const cmd = String(inp.command || inp.cmd || '');
    if (cmd) {
      const short = cmd.length > 60 ? cmd.substring(0, 57) + '...' : cmd;
      return t('toolLabels.runCommandWith', { command: short });
    }
    return t('toolLabels.runCommand');
  }
  if (nameLower === 'glob') return inp.pattern ? t('toolLabels.globPattern', { pattern: String(inp.pattern) }) : t('toolLabels.glob');
  if (nameLower === 'grep') return inp.pattern ? t('toolLabels.grepPattern', { pattern: String(inp.pattern) }) : name;
  if (nameLower === 'websearch') return inp.query ? t('toolLabels.webSearchQuery', { query: String(inp.query) }) : t('toolLabels.webSearch');
  if (nameLower === 'webfetch') {
    const url = String(inp.url || '');
    return url ? t('toolLabels.fetchUrlWith', { url: url.length > 50 ? url.substring(0, 47) + '...' : url }) : t('toolLabels.fetchUrl');
  }
  return name;
}
```

`getToolIcon`, `shortenPath`, `getMcpToolDisplayName` ne changent pas.

### 2.4 Modifier les appelants

**`src/renderer/components/message/ToolUseBlock.tsx`** :
- Ajouter `import { useTranslation } from 'react-i18next';` en haut du fichier.
- Dans le composant, ajouter `const { t } = useTranslation();`.
- Ligne ~73 : `const label = getToolLabel(block.name, block.input, block.displayName);` → `const label = getToolLabel(block.name, block.input, block.displayName, t);`
- Ligne ~84 : `if (shouldUseScreenshotSummary(block.name, content)) return 'Screenshot captured';` → `return t('toolLabels.screenshotCaptured');`

**`src/renderer/components/message/ToolResultBlock.tsx`** :
- Ajouter `import { useTranslation } from 'react-i18next';` et `const { t } = useTranslation();` dans le composant.
- Ligne ~78 : `if (shouldUseScreenshotSummary(toolName, content)) return 'Screenshot captured';` → `return t('toolLabels.screenshotCaptured');`

Vérifier avant modification que ces deux fichiers sont bien des composants fonctionnels React (contiennent déjà un `export function` avec du JSX) — c'est le cas d'après l'audit, mais à reconfirmer par lecture directe du fichier avant édition (règle : ne jamais affirmer sans avoir lu).

### 2.5 Validation de cette étape

```bash
npx tsc --noEmit
npm run lint
npm run test
```
Doit passer sans erreur avant de continuer.

---

## 3. Outillage — 6 scripts Node (zéro dépendance externe)

Créer le dossier `scripts/i18n/` (le dossier `scripts/` existe déjà à la racine du repo). Ces scripts adaptent la méthode éprouvée sur OpenCode (fichiers TS plats) au format JSON imbriqué d'open-cowork. Ils sont **idempotents** et **ne peuvent jamais créer de nouvelle clé** — seulement lire, scaffolder un fichier entier, ou remplacer des valeurs à des chemins déjà existants.

### 3.1 `scripts/i18n/_util.js`

```js
const fs = require('fs');

function readJson(file) {
  return JSON.parse(fs.readFileSync(file, 'utf-8'));
}

function writeJson(file, obj) {
  fs.writeFileSync(file, JSON.stringify(obj, null, 2) + '\n', 'utf-8');
}

function flatten(obj, prefix = '') {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const flatKey = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      Object.assign(out, flatten(value, flatKey));
    } else {
      out[flatKey] = value;
    }
  }
  return out;
}

function setAtPath(obj, dotKey, value) {
  const parts = dotKey.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
      cur[parts[i]] = {};
    }
    cur = cur[parts[i]];
  }
  cur[parts[parts.length - 1]] = value;
}

function extractPlaceholders(str) {
  if (typeof str !== 'string') return [];
  const matches = str.match(/\{\{\s*[\w.-]+\s*\}\}/g) || [];
  return matches.map((m) => m.replace(/\s+/g, '')).sort();
}

module.exports = { readJson, writeJson, flatten, setAtPath, extractPlaceholders };
```

### 3.2 `scripts/i18n/scaffold_locale.js`

```js
#!/usr/bin/env node
// Usage: node scripts/i18n/scaffold_locale.js <localeCode>
const path = require('path');
const fs = require('fs');
const { readJson, writeJson } = require('./_util');

const code = process.argv[2];
if (!code) {
  console.error('Usage: node scaffold_locale.js <localeCode>');
  process.exit(1);
}

const localesDir = path.resolve(__dirname, '../../src/renderer/i18n/locales');
const enPath = path.join(localesDir, 'en.json');
const targetPath = path.join(localesDir, `${code}.json`);

if (fs.existsSync(targetPath)) {
  console.error(`Refusing to overwrite existing file: ${targetPath}`);
  process.exit(1);
}

const en = readJson(enPath);
writeJson(targetPath, en);
console.log(`Created ${targetPath} as an English-fallback skeleton.`);
```

### 3.3 `scripts/i18n/extract_backlog.js`

```js
#!/usr/bin/env node
// Usage: node scripts/i18n/extract_backlog.js <localeCode> [batchSize=80]
const path = require('path');
const fs = require('fs');
const { readJson, flatten } = require('./_util');

const code = process.argv[2];
const batchSize = parseInt(process.argv[3] || '80', 10);
if (!code) {
  console.error('Usage: node extract_backlog.js <localeCode> [batchSize]');
  process.exit(1);
}

// Keys whose value is a bare proper noun / brand name: leaving them
// identical to English across all locales is correct, not a translation gap.
const ALLOWLIST = new Set([
  'welcome.chromeRequired',
  'welcome.notionRequired',
]);

const localesDir = path.resolve(__dirname, '../../src/renderer/i18n/locales');
const en = flatten(readJson(path.join(localesDir, 'en.json')));
const localePath = path.join(localesDir, `${code}.json`);
if (!fs.existsSync(localePath)) {
  console.error(`Locale file not found: ${localePath}. Run scaffold_locale.js first.`);
  process.exit(1);
}
const locale = flatten(readJson(localePath));

const backlog = {};
for (const [key, enValue] of Object.entries(en)) {
  if (ALLOWLIST.has(key)) continue;
  if (typeof enValue !== 'string') continue;
  const localeValue = locale[key];
  if (localeValue === undefined || localeValue === enValue) {
    backlog[key] = enValue;
  }
}

const keys = Object.keys(backlog);
const outDir = path.resolve(__dirname, `../../.i18n-work/${code}`);
fs.mkdirSync(outDir, { recursive: true });

let batchCount = 0;
for (let i = 0; i < keys.length; i += batchSize) {
  batchCount++;
  const batchKeys = keys.slice(i, i + batchSize);
  const batch = {};
  for (const k of batchKeys) batch[k] = backlog[k];
  const file = path.join(outDir, `batch-${String(batchCount).padStart(3, '0')}.json`);
  fs.writeFileSync(file, JSON.stringify(batch, null, 2) + '\n', 'utf-8');
}

console.log(`${code}: ${keys.length} keys to translate, ${batchCount} batch file(s) written to ${outDir}`);
```

### 3.4 `scripts/i18n/apply_translations.js`

```js
#!/usr/bin/env node
// Usage: node scripts/i18n/apply_translations.js <localeCode> <translatedBatchFile.json>
const path = require('path');
const { readJson, writeJson, flatten, setAtPath } = require('./_util');

const code = process.argv[2];
const batchFile = process.argv[3];
if (!code || !batchFile) {
  console.error('Usage: node apply_translations.js <localeCode> <translatedBatchFile.json>');
  process.exit(1);
}

const localesDir = path.resolve(__dirname, '../../src/renderer/i18n/locales');
const localePath = path.join(localesDir, `${code}.json`);
const locale = readJson(localePath);
const enFlat = flatten(readJson(path.join(localesDir, 'en.json')));
const translations = readJson(path.resolve(batchFile));

const notFound = [];
let applied = 0;
for (const [key, value] of Object.entries(translations)) {
  if (!(key in enFlat)) {
    notFound.push(key);
    continue;
  }
  if (typeof value !== 'string' || value.trim() === '') {
    console.warn(`Skipping empty/non-string translation for ${key}`);
    continue;
  }
  setAtPath(locale, key, value);
  applied++;
}

writeJson(localePath, locale);
console.log(`${code}: applied ${applied} translations.`);
if (notFound.length) {
  console.warn(`${code}: ${notFound.length} keys not found in en.json (skipped):`, notFound);
}
```

### 3.5 `scripts/i18n/check_locale.js`

```js
#!/usr/bin/env node
// Usage: node scripts/i18n/check_locale.js <localeCode>
const path = require('path');
const fs = require('fs');
const { readJson, flatten } = require('./_util');

const code = process.argv[2];
if (!code) {
  console.error('Usage: node check_locale.js <localeCode>');
  process.exit(1);
}

const ALLOWLIST = new Set([
  'welcome.chromeRequired',
  'welcome.notionRequired',
]);

const localesDir = path.resolve(__dirname, '../../src/renderer/i18n/locales');
const en = flatten(readJson(path.join(localesDir, 'en.json')));
const localePath = path.join(localesDir, `${code}.json`);
if (!fs.existsSync(localePath)) {
  console.error(`FAIL: ${localePath} does not exist.`);
  process.exit(1);
}
const locale = flatten(readJson(localePath));

let ok = true;
const enKeys = Object.keys(en);
const localeKeys = Object.keys(locale);

const missing = enKeys.filter((k) => !(k in locale));
const extra = localeKeys.filter((k) => !(k in en));
if (missing.length) {
  ok = false;
  console.error(`MISSING keys (${missing.length}):`, missing);
}
if (extra.length) {
  ok = false;
  console.error(`EXTRA keys not in en.json (${extra.length}):`, extra);
}

const stillEnglish = enKeys.filter((k) => !ALLOWLIST.has(k) && locale[k] === en[k]);

console.log(`${code}: ${enKeys.length} total keys, ${missing.length} missing, ${extra.length} extra, ${stillEnglish.length} still identical to English.`);
if (stillEnglish.length) {
  console.log('Untranslated keys:', stillEnglish.slice(0, 50), stillEnglish.length > 50 ? `... (+${stillEnglish.length - 50} more)` : '');
}

console.log(ok && stillEnglish.length === 0 ? 'VERDICT: PASS' : 'VERDICT: FAIL');
process.exit(ok && stillEnglish.length === 0 ? 0 : 1);
```

### 3.6 `scripts/i18n/check_placeholders.js`

```js
#!/usr/bin/env node
// Usage: node scripts/i18n/check_placeholders.js <localeCode>
const path = require('path');
const { readJson, flatten, extractPlaceholders } = require('./_util');

const code = process.argv[2];
if (!code) {
  console.error('Usage: node check_placeholders.js <localeCode>');
  process.exit(1);
}

const localesDir = path.resolve(__dirname, '../../src/renderer/i18n/locales');
const en = flatten(readJson(path.join(localesDir, 'en.json')));
const locale = flatten(readJson(path.join(localesDir, `${code}.json`)));

let mismatches = 0;
for (const [key, enValue] of Object.entries(en)) {
  const localeValue = locale[key];
  if (localeValue === undefined) continue;
  const enPh = extractPlaceholders(enValue).join(',');
  const localePh = extractPlaceholders(localeValue).join(',');
  if (enPh !== localePh) {
    mismatches++;
    console.error(`MISMATCH ${key}: en=[${enPh}] ${code}=[${localePh}]`);
  }
}

console.log(mismatches === 0 ? 'VERDICT: PASS (all placeholders match)' : `VERDICT: FAIL (${mismatches} mismatches)`);
process.exit(mismatches === 0 ? 0 : 1);
```

**Important pour `apply_translations.js` et `check_locale.js`** : le champ `pastedImageAlt` et toute clé avec suffixe `_plural` (pluriels i18next, ex: `mcp.toolsAvailable_plural`) sont traités comme des clés normales par le flatten — aucun traitement spécial requis, le regex `{{...}}` gère aussi bien `{{index}}` que `{{count}}`.

---

## 4. Scaffold des 15 nouveaux fichiers de langue

Une fois §2 terminé (donc `en.json` et `zh.json` contiennent déjà le namespace `toolLabels`), exécuter :

```bash
node scripts/i18n/scaffold_locale.js ar
node scripts/i18n/scaffold_locale.js pt-BR
node scripts/i18n/scaffold_locale.js bs
node scripts/i18n/scaffold_locale.js da
node scripts/i18n/scaffold_locale.js de
node scripts/i18n/scaffold_locale.js es
node scripts/i18n/scaffold_locale.js fr
node scripts/i18n/scaffold_locale.js ja
node scripts/i18n/scaffold_locale.js ko
node scripts/i18n/scaffold_locale.js nb
node scripts/i18n/scaffold_locale.js pl
node scripts/i18n/scaffold_locale.js ru
node scripts/i18n/scaffold_locale.js th
node scripts/i18n/scaffold_locale.js tr
node scripts/i18n/scaffold_locale.js zh-TW
```

Cela crée 15 fichiers `src/renderer/i18n/locales/<code>.json`, chacun étant une copie exacte de `en.json` (861 clés : 845 + 16 `toolLabels`). C'est un état **intermédiaire valide et non cassant** : i18next affichera l'anglais pour toute langue pas encore traduite (comportement de fallback normal), donc l'app fonctionne et build correctement même avant traduction réelle.

---

## 5. Câblage dans le code (`config.ts` + `SettingsGeneral.tsx`)

### 5.1 `src/renderer/i18n/config.ts`

Remplacer le fichier entier par :

```ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enTranslations from './locales/en.json';
import zhTranslations from './locales/zh.json';
import arTranslations from './locales/ar.json';
import ptBRTranslations from './locales/pt-BR.json';
import bsTranslations from './locales/bs.json';
import daTranslations from './locales/da.json';
import deTranslations from './locales/de.json';
import esTranslations from './locales/es.json';
import frTranslations from './locales/fr.json';
import jaTranslations from './locales/ja.json';
import koTranslations from './locales/ko.json';
import nbTranslations from './locales/nb.json';
import plTranslations from './locales/pl.json';
import ruTranslations from './locales/ru.json';
import thTranslations from './locales/th.json';
import trTranslations from './locales/tr.json';
import zhTWTranslations from './locales/zh-TW.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      zh: { translation: zhTranslations },
      ar: { translation: arTranslations },
      'pt-BR': { translation: ptBRTranslations },
      bs: { translation: bsTranslations },
      da: { translation: daTranslations },
      de: { translation: deTranslations },
      es: { translation: esTranslations },
      fr: { translation: frTranslations },
      ja: { translation: jaTranslations },
      ko: { translation: koTranslations },
      nb: { translation: nbTranslations },
      pl: { translation: plTranslations },
      ru: { translation: ruTranslations },
      th: { translation: thTranslations },
      tr: { translation: trTranslations },
      'zh-TW': { translation: zhTWTranslations },
    },
    fallbackLng: 'en',
    supportedLngs: [
      'en', 'zh', 'ar', 'pt-BR', 'bs', 'da', 'de', 'es', 'fr',
      'ja', 'ko', 'nb', 'pl', 'ru', 'th', 'tr', 'zh-TW',
    ],
    interpolation: {
      escapeValue: false,
    },
    pluralSeparator: '_',
    contextSeparator: '_',
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
```

(Les commentaires en chinois de la version d'origine sont retirés — convention du repo : anglais uniquement dans le code, cf. `CONTRIBUTING.md`.)

### 5.2 `src/renderer/components/settings/SettingsGeneral.tsx`

Remplacer uniquement le tableau `languages` (lignes 21-24) par :

```tsx
const languages = [
  { code: 'en', nativeName: 'English' },
  { code: 'zh', nativeName: '中文' },
  { code: 'ar', nativeName: 'العربية' },
  { code: 'pt-BR', nativeName: 'Português (Brasil)' },
  { code: 'bs', nativeName: 'Bosanski' },
  { code: 'da', nativeName: 'Dansk' },
  { code: 'de', nativeName: 'Deutsch' },
  { code: 'es', nativeName: 'Español' },
  { code: 'fr', nativeName: 'Français' },
  { code: 'ja', nativeName: '日本語' },
  { code: 'ko', nativeName: '한국어' },
  { code: 'nb', nativeName: 'Norsk bokmål' },
  { code: 'pl', nativeName: 'Polski' },
  { code: 'ru', nativeName: 'Русский' },
  { code: 'th', nativeName: 'ไทย' },
  { code: 'tr', nativeName: 'Türkçe' },
  { code: 'zh-TW', nativeName: '繁體中文' },
];
```

Ne rien changer d'autre dans ce fichier. Note : `currentLang` (ligne 9) fait actuellement `i18n.language.startsWith('zh') ? 'zh' : 'en'` pour dériver la langue active affichée comme sélectionnée — avec 17 langues ce calcul est insuffisant (toute langue ≠ zh retombera visuellement sur "en" sélectionné même si `fr` est actif). **Corriger cette ligne** :

```tsx
const currentLang = languages.some((l) => l.code === i18n.language) ? i18n.language : 'en';
```
(à placer après la déclaration de `languages`, donc réordonner : déclarer `languages` avant `currentLang`).

Avec 17 boutons dans une seule `flex gap-2` (ligne 57), l'affichage va déborder horizontalement ou se tasser. Passer le conteneur en grille pour rester lisible :

```tsx
<div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
```
(remplace le `<div className="flex gap-2">` qui entoure `languages.map(...)`, ligne 57 uniquement — ne pas toucher le bloc Theme juste au-dessus qui reste `flex gap-2` avec 3 options).

### 5.3 Validation

```bash
npx tsc --noEmit
npm run lint
npm run test
npm run build
```
Le build doit réussir et l'app doit se lancer avec le sélecteur de langue affichant 17 options (toutes en anglais tant que non traduites, sauf `zh`).

---

## 6. Boucle de délégation à MiniMax M3 — traduction langue par langue

Pour **chacune** des 15 langues (`ar`, `pt-BR`, `bs`, `da`, `de`, `es`, `fr`, `ja`, `ko`, `nb`, `pl`, `ru`, `th`, `tr`, `zh-TW`), répéter :

### 6.1 Générer les lots

```bash
node scripts/i18n/extract_backlog.js <code> 80
```
→ écrit `.i18n-work/<code>/batch-001.json`, `batch-002.json`, ... (≈860 clés / 80 par lot ≈ 11 lots par langue).

### 6.2 Pour chaque fichier de lot, faire traduire par MiniMax M3

Copier-coller ce prompt (remplacer `<LANGUE>` et `<CONTENU_DU_BATCH>`) :

```
Tu es un traducteur technique professionnel EN → <LANGUE>.

Voici un objet JSON de type {"clé.pointée": "texte anglais"} extrait de
l'interface d'une application de bureau (Electron/React) nommée "Open Cowork".
Traduis UNIQUEMENT les valeurs (jamais les clés) vers <LANGUE>.

RÈGLES STRICTES :
1. Réponds avec UN SEUL objet JSON valide, mêmes clés, valeurs traduites.
   Aucun texte avant/après, pas de balises markdown ```, juste le JSON brut.
2. Ne traduis JAMAIS les tokens entre doubles accolades, ex: {{path}}, {{count}},
   {{provider}} — recopie-les à l'identique, à la même position logique dans la phrase.
3. Ne traduis jamais les noms de marque/produit : "Open Cowork", "MCP", "Chrome",
   "Notion", "Gmail", "GitHub", "Feishu", "Slack", "OpenAI", "Anthropic", "Gemini",
   "DeepSeek", "HuggingFace", "Ollama" — laisse-les tels quels même au milieu
   d'une phrase traduite.
4. Préserve la ponctuation finale (points de suspension "...", points d'exclamation,
   deux-points) et la casse des acronymes (API, URL, MCP...).
5. Ton neutre, professionnel, cohérent avec une interface logicielle (pas de
   traduction littérale mot-à-mot si ça sonne mal — privilégie l'usage naturel
   dans une UI <LANGUE> professionnelle).
6. Si une valeur contient des caractères d'échappement JSON (\", \n), conserve-les
   correctement échappés dans ta sortie.
7. Ne rajoute et ne supprime aucune clé. Le nombre de clés en sortie doit être
   IDENTIQUE au nombre de clés en entrée.

JSON à traduire :
<CONTENU_DU_BATCH>
```

Sauvegarder la réponse de MiniMax dans `.i18n-work/<code>/batch-001.translated.json` (même nom que le batch + `.translated`), en vérifiant d'abord que c'est du JSON strictement valide (`node -e "JSON.parse(require('fs').readFileSync(process.argv[1]))"` doit ne rien afficher et sortir en code 0).

### 6.3 Appliquer

```bash
node scripts/i18n/apply_translations.js <code> .i18n-work/<code>/batch-001.translated.json
```
Répéter 6.2 et 6.3 pour chaque `batch-NNN.json` de la langue.

### 6.4 Vérifier la langue complète

```bash
node scripts/i18n/check_locale.js <code>
node scripts/i18n/check_placeholders.js <code>
```
**Les deux doivent afficher `VERDICT: PASS`.** Si `check_locale.js` échoue avec des clés "still identical to English" restantes, relancer `extract_backlog.js <code>` (idempotent — ne redemande que ce qui manque encore) et refaire un lot. Si `check_placeholders.js` échoue, corriger manuellement la ou les clés en mismatch dans `src/renderer/i18n/locales/<code>.json` (ne jamais supprimer un `{{token}}`, l'ajouter s'il manque, le dédupliquer s'il apparaît deux fois).

**Ne jamais passer à la langue suivante tant que les deux verdicts ne sont pas PASS.**

---

## 7. Vérification finale globale (avant toute PR)

```bash
npx tsc --noEmit
npm run lint
npm run test:coverage
npm run build
```

Puis, pour toutes les 17 langues (`en zh ar pt-BR bs da de es fr ja ko nb pl ru th tr zh-TW`) :
```bash
for c in en zh ar pt-BR bs da de es fr ja ko nb pl ru th tr zh-TW; do
  node scripts/i18n/check_locale.js "$c" || echo "FAIL: $c"
  node scripts/i18n/check_placeholders.js "$c" || echo "FAIL: $c"
done
```
(`en` échouera intentionnellement le test "still identical to English" de `check_locale.js` — c'est normal, c'est la langue source. Ignorer ce faux positif uniquement pour `en`.)

### 7.1 Test manuel obligatoire — GATE BLOQUANT, ne pas sauter

Lancer l'app réellement (`npm run dev`, ou `npm run build` + lancer l'exécutable packagé), puis :
1. Ouvrir Settings → General et vérifier que les 17 langues apparaissent dans le sélecteur, sans débordement visuel cassé (cf. la grille `grid-cols-3 sm:grid-cols-4` du §5.2).
2. Sélectionner tour à tour **au moins 5 langues** parmi les 15 nouvelles (pas seulement 3-4 au hasard — inclure au moins une langue RTL si `ar` est disponible, pour vérifier que l'interface ne casse pas visuellement en right-to-left).
3. Sur chaque langue sélectionnée, parcourir concrètement les écrans Welcome, Settings (tous les onglets), et déclencher au moins un vrai tool-call dans le Chat (ex: demander à l'agent de lire un fichier) pour visualiser le libellé traduit du §2 en conditions réelles — pas juste lire le JSON.
4. Vérifier qu'aucun texte ne reste en anglais de façon injustifiée, qu'aucune valeur `{{token}}` ne s'affiche brute (interpolation cassée), et qu'aucune régression visuelle n'apparaît en `en`/`zh` (les deux langues déjà existantes ne doivent pas avoir changé de comportement).

**Aucune Pull Request (§8) ne doit être ouverte — ni même préparée en branche prête à pousser — tant que ce test manuel n'a pas été effectué et explicitement validé par Erwan.** Les scripts automatiques (`check_locale.js`, `check_placeholders.js`, `tsc`, `lint`, `test:coverage`, `build`) démontrent que le code compile et que les données sont structurellement correctes — ils ne démontrent PAS que l'app fonctionne réellement à l'usage. Un `VERDICT: PASS` partout n'est pas une autorisation à passer au §8.

À l'issue de §7, l'agent (MiniMax ou autre) doit s'arrêter et rapporter l'état de la checklist (§10) à Erwan, puis attendre un feu vert explicite avant toute action git (commit inclus) liée au §8.

---

## 8. Découpage en Pull Requests

Ne pas tout mettre dans une seule PR géante. Découpage recommandé, dans cet ordre :

### PR #1 — Infrastructure (obligatoirement en premier, les autres PR en dépendent)
`feat(i18n): scaffold 15 additional locales and fix hardcoded tool-call labels`
- §2 (fix `toolHelpers.tsx` + nouveau namespace `toolLabels` dans `en.json`/`zh.json`)
- §3 (les 6 scripts `scripts/i18n/*.js`)
- §4 (scaffold des 15 fichiers `locales/<code>.json`, encore en anglais à ce stade — assumé et mentionné dans la description de la PR)
- §5 (`config.ts` + `SettingsGeneral.tsx`)
- Description de PR : préciser explicitement que les 15 nouvelles langues sont pour l'instant un fallback anglais (comportement i18next normal, non cassant), et que des PR de contenu séparées vont suivre pour les traduire réellement.

### PR #2 à #6 — Contenu, par lots de 3 langues (aucune modification de code, uniquement les fichiers `locales/<code>.json`)
- PR #2 : `feat(i18n): complete French, Spanish, German translations` (`fr`, `es`, `de`)
- PR #3 : `feat(i18n): complete Japanese, Korean, Russian translations` (`ja`, `ko`, `ru`)
- PR #4 : `feat(i18n): complete Portuguese, Arabic, Turkish translations` (`pt-BR`, `ar`, `tr`)
- PR #5 : `feat(i18n): complete Polish, Danish, Bosnian translations` (`pl`, `da`, `bs`)
- PR #6 : `feat(i18n): complete Thai and Traditional Chinese translations` (`th`, `zh-TW`)

Chaque PR de contenu est petite, à faible risque, et review indépendamment — un traducteur natif peut valider une langue sans bloquer les autres.

### Conventions à respecter (vérifiées le 2026-07-19 sur `main`, voir correction en tête de document)
- Le dépôt est déjà lié (§-1) : `D:\App\open-cowork-main` est un clone git avec `origin` = fork `Rwanbt/open-cowork`, `upstream` = `OpenCoworkAI/open-cowork`, branche courante `traduction` créée depuis `main`. Ne pas re-cloner, travailler directement dedans.
- **Branche cible des PR : `main`** (pas `dev` — voir correction en tête de document ; `CONTRIBUTING.md` dit `dev` mais les 15 dernières PR mergées ciblent toutes `main` en pratique).
- Pour chaque PR de la liste ci-dessus, créer une sous-branche dédiée à partir de `traduction` (qui sert de branche d'intégration locale pour tout le chantier), par exemple :
  ```bash
  git checkout traduction
  git checkout -b feat/i18n-scaffold-15-locales
  # ... faire les changements de la PR #1 (§2 à §5) ...
  git add -A
  git commit -m "feat(i18n): scaffold 15 additional locales and fix hardcoded tool-call labels"
  git push -u origin feat/i18n-scaffold-15-locales
  gh pr create --repo OpenCoworkAI/open-cowork --base main --head Rwanbt:feat/i18n-scaffold-15-locales --title "feat(i18n): scaffold 15 additional locales and fix hardcoded tool-call labels" --body "..."
  ```
  Puis pour chaque PR de contenu (#2 à #6), repartir de `traduction` (remis à jour après merge de la PR précédente si besoin) avec une nouvelle sous-branche (`feat/i18n-fr-es-de`, `feat/i18n-ja-ko-ru`, etc.).
- Commits : Conventional Commits, type `feat` ou `fix`, en anglais, header ≤100 caractères (ex: `feat(i18n): add French, Spanish, German locales`).
- CI (`.github/workflows/ci.yml`, présent sur `main`) exécute : `npm ci --ignore-scripts`, `npx patch-package`, `npm run lint`, `npx tsc --noEmit`, `npm run test:coverage` — tout doit passer localement avant push.
- Remplir le template `.github/PULL_REQUEST_TEMPLATE.md` (case à cocher "New user-facing strings added to i18n files (en + zh)" — reformuler en cochant et précisant "+ 15 additional locales" dans le résumé).
- Fichiers composants plafonnés à 500 lignes (CONTRIBUTING.md) — sans objet ici, seuls des fichiers JSON de données et 3 petits fichiers `.tsx`/`.ts` sont touchés.
- **Ne jamais pousser (`git push`) ni ouvrir de PR sans validation explicite de l'utilisateur au préalable** — ce plan prépare le travail localement, la décision de publier reste humaine.

---

## 9. Hors périmètre (ne pas faire, sauf demande explicite)

- **Chargement paresseux (`import()` dynamique) des locales** : actuellement `config.ts` importe statiquement tous les JSON, ce qui alourdit un peu le bundle initial (17 fichiers ~45-50 Ko chacun). OpenCode fait du lazy-loading par langue, mais c'est un changement d'architecture plus risqué (gestion async, état `ready`) hors scope de ce plan incrémental. Ne pas y toucher sans validation explicite préalable.
- **Traduction du site de documentation** (`website/`, VitePress) — système totalement séparé (fichiers `.md`/`.vitepress`), non couvert par ce plan.
- **Composant `LanguageSwitcher` mentionné dans `src/renderer/i18n/README.md`** — n'existe pas, ne pas le créer ; mettre à jour ce README pour refléter la réalité (`SettingsGeneral.tsx`) est un nice-to-have optionnel, pas requis pour la PR.
- Ne jamais modifier `en.json` autrement qu'à l'étape §2 (ajout du namespace `toolLabels`) — c'est la source de vérité, toute dérive casse la parité de toutes les langues.

---

## 10. Checklist finale avant de considérer le plan terminé

- [ ] `toolHelpers.tsx` + `ToolUseBlock.tsx` + `ToolResultBlock.tsx` : plus aucune chaîne anglaise en dur, `npx tsc --noEmit` clean
- [ ] `en.json` et `zh.json` contiennent le namespace `toolLabels` (16 clés), parité `zh` confirmée par `check_locale.js zh` → PASS
- [ ] 15 fichiers `locales/<code>.json` créés, `config.ts` et `SettingsGeneral.tsx` mis à jour, build OK
- [ ] Pour chacune des 15 langues : `check_locale.js` → PASS et `check_placeholders.js` → PASS
- [ ] `npm run lint`, `npx tsc --noEmit`, `npm run test:coverage`, `npm run build` : tous verts
- [ ] Test manuel réel dans l'app (§7.1) sur au moins 5 langues différentes dont une RTL, écrans Welcome/Settings/Chat + un vrai tool-call, aucun texte anglais résiduel injustifié, aucun `{{token}}` brut affiché, `en`/`zh` non régressés
- [ ] **GATE — validation explicite d'Erwan reçue confirmant que le test manuel du §7.1 est concluant** (rien avant cette étape ne doit déclencher un commit ou push)
- [ ] Une fois seulement le gate ci-dessus franchi : commits + 6 PR ouvertes dans l'ordre décrit en §8 (branche cible `main`), template PR rempli, CI verte sur chacune
