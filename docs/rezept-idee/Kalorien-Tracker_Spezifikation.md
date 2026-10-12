# Kalorien-Tracker – Spezifikation & Rezeptdatenbank für Claude Code

> **An Claude Code:** Dieses Dokument ist die vollständige Spezifikation für die App. Lies es komplett, bevor du anfängst.
> Die Rezepte liegen zusätzlich maschinenlesbar in `recipes.json` (90 Rezepte × 5 Kalorienstufen) und die Nährwerte in
> `ingredients.json`. **Diese beiden JSON-Dateien sind die einzige Datenquelle (Source of Truth)** – kopiere sie nach
> `src/data/` und tippe keine Rezepte aus diesem Dokument ab. Die Rezepttabellen unten sind die menschenlesbare Fassung derselben Daten.
> Im Ordner `tools/` liegt der Python-Generator, mit dem die Mengen berechnet wurden (für spätere neue Rezepte).

---

## 1. Produktidee

Eine installierbare Web-App (PWA) fürs Handy, die Kalorien-Tracking mit einem Kochbuch verbindet:

1. Man wählt **eine Kalorienstufe**: 1750, 2250, 2600, 2900 oder 3200 kcal pro Tag.
2. Man bekommt **Rezepte für Frühstück, Mittagessen und Abendessen**. Jedes Rezept hat für jede Stufe eigene, bereits umgerechnete Mengen.
3. **Egal welches Frühstück, Mittag- und Abendessen man kombiniert, man landet immer auf seinem Tagesziel** (Kalorien ±5 %, Protein konstant, Fett ≥ 60 g).
4. Man kann nach **Ernährungsform** filtern (Standard, Vegetarisch, Vegan, Low Carb, Ketogen, Ray Peat) und nach **schnellen Gerichten** (Express ≤ 10 Minuten).
5. Gekochte Mahlzeiten werden abgehakt, die App zeigt den Tagesstand.

Ziele bei den Rezepten: gesund, lecker, schnell, möglichst unverarbeitete Lebensmittel, hochwertiges Protein (nicht primär Weizenprotein).

---

## 2. Ernährungslogik (wichtig – nicht verändern)

### 2.1 Kalorienverteilung pro Mahlzeit

| Stufe | Frühstück (25 %) | Mittagessen (37,5 %) | Abendessen (37,5 %) |
|---|---|---|---|
| 1750 kcal | 438 kcal | 656 kcal | 656 kcal |
| 2250 kcal | 562 kcal | 844 kcal | 844 kcal |
| 2600 kcal | 650 kcal | 975 kcal | 975 kcal |
| 2900 kcal | 725 kcal | 1088 kcal | 1088 kcal |
| 3200 kcal | 800 kcal | 1200 kcal | 1200 kcal |

### 2.2 Makro-Regeln

- **Protein ist in allen Stufen gleich:** Frühstück ≈ 35 g, Mittagessen ≈ 55 g, Abendessen ≈ 55 g → **≈ 145 g pro Tag**.
  Bei höheren Stufen steigen nur Kohlenhydrate und Fett. (Die Proteinquelle wird bei höheren Stufen teilweise sogar
  etwas kleiner, weil Haferflocken, Brot, Kartoffeln usw. selbst Protein mitbringen.)
- **Harte Grenzen für jede mögliche Tageskombination:** Protein **≥ 120 g und ≤ 190 g**, Fett **≥ 60 g**.
- **Fett ist ein Minimalziel, kein Maximum.** Es gibt **kein Maximalfettziel** und **kein Mindest-Kohlenhydratziel**.
  Mehr Fett ist ausdrücklich in Ordnung (vor allem bei Low Carb und Keto).
- Mittagessen enthält tendenziell das meiste Fett, Abendessen die meisten Kohlenhydrate (Regeneration). Ausnahme: Keto.
- Fett-Mindestmenge pro Mahlzeit (damit **jede** Kombination ≥ 60 g ergibt): Frühstück ≥ 15 g, Mittag ≥ 25 g, Abend ≥ 20 g.

| Ernährungsform | Kohlenhydrate | Fett |
|---|---|---|
| Standard, Vegetarisch, Vegan, Ray Peat | Rest der Kalorien | Ziel ca. 66 g (1750) bis 106 g (3200), Minimum 60 g |
| Low Carb | ca. 15 % der Kalorien (≈ 65–140 g/Tag) | füllt den Rest auf |
| Ketogen | ≈ 10–40 g/Tag (nur aus Gemüse, Milchprodukten, Nüssen) | füllt den Rest auf |

### 2.3 In der App gespeicherte Ziele (Einstellungen)

| Wert | Standard | Bedeutung |
|---|---|---|
| `kcalLevel` | 2600 | Gewählte Stufe (1750/2250/2600/2900/3200) |
| `minProtein` | 120 g | Mindestproteinziel – Tagesanzeige wird rot, wenn darunter |
| `maxProtein` | 190 g | Obergrenze Protein (nur Warnung) |
| `minFat` | 60 g | Mindestfettziel – **kein** Maximalfettziel |
| `dietFilter` | `alle` | Zuletzt gewählte Ernährungsform |

Kohlenhydrate haben **kein Ziel**, sie werden nur angezeigt. Die Werte `minProtein`, `maxProtein` und `minFat` sind in den Einstellungen änderbar.

### 2.4 Geprüfte Garantien (automatisch nachgerechnet)

Alle 30 × 30 × 30 = 27.000 möglichen Kombinationen aus **allen** 90 Rezepten (also auch gemischt über Ernährungsformen hinweg) wurden pro Stufe nachgerechnet:

| Stufe | kcal (min–max) | Protein (min–max) | Fett (min) |
|---|---|---|---|
| 1750 | 1735–1771 | 137–148 g | 60 g |
| 2250 | 2237–2264 | 142–148 g | 68 g |
| 2600 | 2579–2617 | 142–151 g | 73 g |
| 2900 | 2871–2912 | 143–154 g | 82 g |
| 3200 | 3125–3215 | 145–155 g | 88 g |

Pro Ernährungsform (nur Rezepte dieser Form kombiniert):

| Form | Stufe | kcal | Protein | Fett (min) | Kohlenhydrate |
|---|---|---|---|---|---|
| Standard (Mischkost) | 1750 | 1741–1756 | 142–145 g | 62 g | 118–148 g |
| Standard (Mischkost) | 2250 | 2240–2254 | 143–147 g | 71 g | 212–241 g |
| Standard (Mischkost) | 2600 | 2589–2605 | 144–147 g | 83 g | 276–308 g |
| Standard (Mischkost) | 2900 | 2888–2910 | 144–149 g | 93 g | 315–357 g |
| Standard (Mischkost) | 3200 | 3166–3203 | 145–153 g | 100 g | 327–409 g |
| Vegetarisch | 1750 | 1743–1766 | 139–147 g | 62 g | 109–135 g |
| Vegetarisch | 2250 | 2243–2262 | 143–145 g | 69 g | 192–235 g |
| Vegetarisch | 2600 | 2584–2610 | 145–150 g | 76 g | 237–305 g |
| Vegetarisch | 2900 | 2875–2904 | 144–154 g | 85 g | 252–357 g |
| Vegetarisch | 3200 | 3135–3203 | 146–154 g | 88 g | 256–418 g |
| Vegan | 1750 | 1744–1765 | 141–145 g | 62 g | 108–128 g |
| Vegan | 2250 | 2244–2260 | 144–145 g | 72 g | 200–239 g |
| Vegan | 2600 | 2596–2614 | 144–147 g | 75 g | 258–308 g |
| Vegan | 2900 | 2891–2904 | 145–150 g | 87 g | 299–347 g |
| Vegan | 3200 | 3176–3206 | 145–154 g | 95 g | 343–408 g |
| Low Carb | 1750 | 1742–1757 | 144–147 g | 90 g | 37–69 g |
| Low Carb | 2250 | 2245–2255 | 143–145 g | 135 g | 48–91 g |
| Low Carb | 2600 | 2593–2605 | 143–145 g | 165 g | 56–99 g |
| Low Carb | 2900 | 2888–2906 | 145–147 g | 189 g | 62–126 g |
| Low Carb | 3200 | 3147–3208 | 145–150 g | 215 g | 67–150 g |
| Ketogen | 1750 | 1735–1762 | 141–146 g | 116 g | 10–27 g |
| Ketogen | 2250 | 2241–2262 | 143–147 g | 166 g | 13–33 g |
| Ketogen | 2600 | 2594–2617 | 143–147 g | 201 g | 17–36 g |
| Ketogen | 2900 | 2892–2906 | 145–148 g | 234 g | 19–41 g |
| Ketogen | 3200 | 3186–3214 | 145–147 g | 266 g | 22–41 g |
| Ray Peat | 1750 | 1749–1760 | 145–147 g | 62 g | 125–150 g |
| Ray Peat | 2250 | 2241–2254 | 145–147 g | 71 g | 214–257 g |
| Ray Peat | 2600 | 2589–2605 | 145–149 g | 82 g | 266–322 g |
| Ray Peat | 2900 | 2889–2905 | 144–148 g | 95 g | 304–364 g |
| Ray Peat | 3200 | 3162–3209 | 145–148 g | 102 g | 325–420 g |

**Claude Code muss einen automatisierten Test schreiben**, der genau diese Prüfung durchführt (siehe Abschnitt 6), damit spätere Änderungen an Rezepten die Garantien nicht brechen.

---

## 3. Funktionen & Bildschirme

Alle Texte auf Deutsch. Mobile-first (Zielbreite 360–430 px), große Touch-Flächen, Hell- und Dunkelmodus.

### 3.1 Erster Start (Onboarding)
- Kalorienstufe wählen (5 große Buttons).
- Optional Ernährungsform vorauswählen.
- Danach direkt zum Tagesplan. Alles später in den Einstellungen änderbar.

### 3.2 Startseite „Heute"
- Oben: Tagesstand mit vier Werten 🔥 kcal · 🍗 Protein · 🥑 Fett · 🍞 Kohlenhydrate. Jeweils „gegessen / Ziel" und „noch offen". Protein und Fett mit Fortschrittsbalken bis zum Mindestziel.
- Darunter drei Karten: **Frühstück**, **Mittagessen**, **Abendessen**. Ist noch nichts gewählt: Button „Gericht auswählen". Ist ein Gericht gewählt: Rezeptkarte und Häkchen „Gegessen".
- Button „Zufälliger Tag" würfelt passend zum aktiven Filter ein Gericht pro Mahlzeit.

### 3.3 Rezeptübersicht (Liste)
- Tabs oder Segmente: Frühstück / Mittagessen / Abendessen.
- Filterleiste oben (siehe 3.5).
- **Rezeptkarte, genau in dieser Hierarchie:**
  1. **Name des Gerichts – groß und fett** (Hauptelement).
  2. Darunter die Makros für die gewählte Stufe in einer Zeile: `🔥 650 kcal · 🍗 35 g · 🥑 20 g · 🍞 70 g`.
  3. Darunter die Dauer: `⏱ 12 Min.`, bei ≤ 10 Minuten zusätzlich ein Badge **„Express"**.
  4. Kleine Tags: vegan / vegetarisch.
- Sortierung: Standard alphabetisch, optional „schnellste zuerst".

### 3.4 Rezeptdetail
- Name, Makros, Dauer wie auf der Karte.
- **Zutatenliste für die aktuell gewählte Kalorienstufe** (Name + Menge). Ein kleiner Umschalter zeigt die Mengen der anderen Stufen.
- Gewürze, „nach Geschmack" (nicht in den Makros enthalten).
- **Button „Zubereitung anzeigen"**: klappt die nummerierten Kochschritte auf. Standardmäßig zugeklappt.
- Hinweis-Feld (z. B. „über Nacht ziehen lassen", „Leber max. 1× pro Woche").
- Buttons: „Für heute als Frühstück/Mittag/Abend wählen", „Favorit ★".

### 3.5 Filter
- **Ernährungsform** (Einfachauswahl): Alle · Standard · Vegetarisch · Vegan · Low Carb · Ketogen · Ray Peat.
  Die Filter sind **exklusiv**: Jede Form zeigt genau ihre eigenen 5 Rezepte pro Mahlzeit.
  „Alle" zeigt alle 90 Rezepte. Das ist erlaubt, weil jede Kombination die Ziele trifft (siehe 2.4).
- **Express** (Schalter): nur Gerichte ≤ 10 Minuten.
- **Favoriten** (Schalter).
- Die Filterwahl wird gespeichert.

### 3.6 Verlauf
- Kalender oder Liste der letzten Tage mit gewählten Gerichten und Tagessummen. Ein Tag gilt als „erfüllt", wenn alle drei Mahlzeiten abgehakt sind.

### 3.7 Einstellungen
- Kalorienstufe, Mindestprotein, Maximalprotein, Mindestfett (Abschnitt 2.3).
- Daten exportieren/importieren (JSON-Datei, Backup), da alles lokal gespeichert wird.
- Hinweis: „Nährwerte sind Durchschnittswerte und können je nach Produkt abweichen."

### 3.8 Später (Phase 2, nicht im MVP)
- Einkaufsliste aus den gewählten Gerichten der Woche (Mengen zusammenrechnen).
- Eigene Rezepte hinzufügen (mit automatischer Skalierung wie in `tools/build.py`).
- Freies Tracking zusätzlicher Lebensmittel (Snacks) über `ingredients.json`.

---

## 4. Technik

| Thema | Entscheidung |
|---|---|
| Framework | **React + TypeScript + Vite** |
| PWA | `vite-plugin-pwa` (Manifest, Service Worker, offlinefähig, „Zum Startbildschirm hinzufügen") |
| Styling | Tailwind CSS |
| Routing | `react-router` mit **HashRouter** (funktioniert auf GitHub Pages ohne Server-Konfiguration) |
| Speicherung | `localStorage` (Einstellungen, Tagespläne, Favoriten), gekapselt in einem kleinen Storage-Modul mit try/catch |
| Backend | **keins**. Alle Daten sind statisch im Bundle |
| Tests | Vitest |
| Hosting | **GitHub Pages**, automatisches Deployment per GitHub Actions bei jedem Push auf `main` |

### 4.1 Repo-Struktur

```
kalorien-tracker/
├─ .github/workflows/deploy.yml   # Build + Deploy auf GitHub Pages
├─ public/icons/                  # App-Icons 192/512 px, maskable
├─ src/
│  ├─ data/recipes.json           # aus diesem Paket kopieren
│  ├─ data/ingredients.json       # aus diesem Paket kopieren
│  ├─ lib/types.ts                # Typen (siehe 4.2)
│  ├─ lib/nutrition.ts            # Summen, „noch offen", Zielprüfung
│  ├─ lib/storage.ts              # localStorage-Wrapper
│  ├─ components/                 # RecipeCard, MacroLine, FilterBar, DaySummary …
│  ├─ pages/                      # Today, RecipeList, RecipeDetail, History, Settings, Onboarding
│  └─ main.tsx
├─ tests/data.test.ts             # Datenprüfung (Abschnitt 6)
├─ tools/                         # Python-Generator (optional, nur für neue Rezepte)
├─ vite.config.ts                 # base: '/kalorien-tracker/' (Repo-Name!)
└─ README.md
```

### 4.2 Datenmodell (TypeScript)

```ts
type Slot = 'fruehstueck' | 'mittag' | 'abend';
type Diet = 'standard' | 'vegetarisch' | 'vegan' | 'lowcarb' | 'keto' | 'raypeat';
type KcalLevel = '1750' | '2250' | '2600' | '2900' | '3200';

interface Macros { kcal: number; protein: number; fat: number; carbs: number; }

interface RecipeIngredient {
  key: string;        // Schlüssel in ingredients.json
  name: string;       // Anzeigename
  amount: number;     // Zahl für die Anzeige
  unit: 'g' | 'ml' | 'Stück';
  grams: number;      // Gewicht in g (bei Stück umgerechnet)
  display: string;    // fertiger Text, z. B. "3 Stück" oder "250 g"
}

interface RecipeLevel { ingredients: RecipeIngredient[]; macros: Macros; target: { kcal: number }; }

interface Recipe {
  id: string;               // z. B. "veg-f1"
  name: string;
  diet: Diet;
  slot: Slot;
  minutes: number;          // Gesamtdauer der aktiven Zubereitung
  express: boolean;         // minutes <= 10
  vegan: boolean;
  vegetarisch: boolean;
  description: string;
  note: string | null;      // Zusatzhinweis (Quellzeit, Leber-Hinweis …)
  spices: string;           // Gewürze „nach Geschmack“, ohne Makros
  steps: string[];          // Zubereitungsschritte
  levels: Record<KcalLevel, RecipeLevel>;
}

interface Ingredient {      // ingredients.json, Werte pro 100 g bzw. 100 ml
  name: string; kcal: number; protein: number; carbs: number; fat: number;
  vegan: boolean; vegetarisch: boolean; unit: 'g' | 'ml' | 'Stück'; gramsPerPiece: number | null;
}

interface DayPlan {          // gespeichert pro Datum (YYYY-MM-DD)
  date: string; kcalLevel: KcalLevel;
  meals: Record<Slot, { recipeId: string | null; eaten: boolean }>;
}
```

Die Makros pro Stufe stehen schon fertig in `recipes.json` (`levels[stufe].macros`). Die App rechnet nicht selbst um, sie zeigt diese Werte an und summiert sie.

### 4.3 Deployment über GitHub
1. Repo `kalorien-tracker` auf GitHub (öffentlich, damit GitHub Pages kostenlos läuft).
2. Workflow `deploy.yml`: `npm ci` → `npm run test` → `npm run build` → Upload nach GitHub Pages (`actions/deploy-pages`). Schlägt der Test fehl, wird nicht deployt.
3. In den Repo-Einstellungen: Pages → Source „GitHub Actions".
4. Die App ist danach unter `https://<github-name>.github.io/kalorien-tracker/` erreichbar.
5. Installation: iPhone → Safari → Teilen → „Zum Home-Bildschirm"; Android → Chrome → Menü → „App installieren".

Claude Code soll im README eine kurze Schritt-für-Schritt-Anleitung für genau diese Punkte hinterlegen. Der Nutzer hat keine Programmiererfahrung.

---

## 5. Design-Hinweise

- Ruhige, „gesunde" Farbwelt (z. B. Grün-/Salbeiton als Akzent), viel Weißraum, abgerundete Karten.
- Makro-Emojis überall einheitlich: 🔥 kcal · 🍗 Protein · 🥑 Fett · 🍞 Kohlenhydrate; ⏱ für Dauer.
- Zahlen ohne Nachkommastellen anzeigen.
- Unten eine Tab-Leiste: Heute · Rezepte · Verlauf · Einstellungen.
- Barrierefreiheit: Kontrast ≥ 4,5:1, Schriftgröße mindestens 16 px im Fließtext.

---

## 6. Umsetzungsplan für Claude Code

Arbeite in diesen Schritten und committe nach jedem Schritt:

1. **Projekt aufsetzen:** Vite + React + TS + Tailwind + vite-plugin-pwa + Vitest, HashRouter, Grundlayout mit Tab-Leiste.
2. **Daten einbinden:** `recipes.json` und `ingredients.json` nach `src/data/`, Typen aus 4.2.
3. **Datentest (`tests/data.test.ts`):**
   - Jedes Rezept hat alle 5 Stufen, mind. 1 Zutat, mind. 1 Schritt, `minutes > 0`.
   - Für jede Stufe: Makros aus `ingredients.json` × `grams` neu berechnen. Die Abweichung zu `levels[...].macros` muss ≤ 1 sein (Rundung).
   - Für jede Ernährungsform gibt es genau 5 Rezepte pro Mahlzeit.
   - Für jede Stufe alle Kombinationen Frühstück × Mittag × Abend über **alle** Rezepte prüfen: Protein 120–190 g, Fett ≥ 60 g, kcal innerhalb ±6 % des Ziels.
   - `vegan`-Rezepte enthalten nur vegane Zutaten, `vegetarisch`-Rezepte nur vegetarische.
4. **Rezeptliste + Filter + Rezeptkarte** (3.3, 3.5).
5. **Rezeptdetail** mit aufklappbarer Zubereitung (3.4).
6. **Startseite „Heute"** mit Auswahl, Abhaken, Tagesstand und „noch offen" (3.2).
7. **Einstellungen & Onboarding** (2.3, 3.1, 3.7).
8. **Verlauf** (3.6).
9. **PWA:** Manifest (Name „Kalorien-Tracker", Kurzname „Tracker", Theme-Farbe, Icons), Offline-Cache, Test auf dem Handy.
10. **GitHub Pages Deployment** + README-Anleitung (4.3).

**Akzeptanzkriterien MVP:** App lässt sich aufs Handy installieren und funktioniert offline. Stufe wählbar, Filter funktionieren, Karten zeigen Name groß, darunter Makros und Dauer. Die Zubereitung ist per Button aufklappbar. Ein Tag mit 3 abgehakten Mahlzeiten zeigt Summen im Zielbereich. Der Datentest ist grün.

---

## 7. Rezepte

Legende: 🔥 kcal · 🍗 Protein · 🥑 Fett · 🍞 Kohlenhydrate · ⏱ Dauer. Die Mengen gelten pro Portion (= eine Mahlzeit für eine Person).
Gewichte sind Rohgewichte bzw. Trockengewichte (Reis, Nudeln, Linsen, Haferflocken). Gewürze sind nicht eingerechnet.
Fehlt eine Zutat in einer Stufe („–"), wird sie dort weggelassen.


## 7.1 Standard (Mischkost)

### Standard (Mischkost) – Frühstück

#### Skyr-Müsli mit Apfel & Walnüssen

`std-f1` · ⏱ 4 Min. · **Express** · vegetarisch

Express-Frühstück ohne Herd.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Skyr natur | 240 g | 200 g | 150 g | 150 g | 150 g |
| Haferflocken (Vollkorn) | 20 g | 55 g | 85 g | 85 g | 80 g |
| Milch 1,5 % | 75 ml | 90 ml | 100 ml | 100 ml | 100 ml |
| Apfel | 90 g | 110 g | 120 g | 120 g | 120 g |
| Walnüsse | 20 g | 20 g | 20 g | 30 g | 45 g |
| **🔥 kcal** | **440** | **562** | **652** | **717** | **797** |
| **🍗 Protein** | **35 g** | **36 g** | **35 g** | **36 g** | **38 g** |
| **🥑 Fett** | **16 g** | **19 g** | **21 g** | **27 g** | **37 g** |
| **🍞 Kohlenhydrate** | **37 g** | **59 g** | **76 g** | **77 g** | **75 g** |

**Gewürze/nach Geschmack:** Zimt

**Zubereitung:**

1. Apfel waschen, entkernen und grob raspeln oder klein würfeln.
2. Skyr mit der Milch in einer Schüssel glatt rühren.
3. Haferflocken und Apfel unterheben.
4. Walnüsse grob hacken, darüberstreuen und mit Zimt bestäuben.

#### Lachs-Rührei auf Vollkornbrot

`std-f2` · ⏱ 12 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 2 Stück | 1 Stück | 1 Stück | 1 Stück | 1 Stück |
| Eiklar | 65 g | 85 g | 65 g | 60 g | 50 g |
| Lachsfilet (frisch/TK) | 45 g | 45 g | 45 g | 35 g | 35 g |
| Roggenvollkornbrot | 65 g | 120 g | 165 g | 195 g | 230 g |
| Tomaten | 110 g | 135 g | 150 g | 150 g | 150 g |
| Butter | – | 10 g | 10 g | 15 g | 15 g |
| **🔥 kcal** | **437** | **563** | **650** | **728** | **796** |
| **🍗 Protein** | **35 g** | **34 g** | **35 g** | **35 g** | **36 g** |
| **🥑 Fett** | **17 g** | **21 g** | **22 g** | **25 g** | **25 g** |
| **🍞 Kohlenhydrate** | **29 g** | **50 g** | **68 g** | **79 g** | **92 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Schnittlauch

**Zubereitung:**

1. Lachsfilet in kleine Würfel schneiden (TK-Lachs am Vorabend auftauen).
2. Eier und Eiklar mit Salz und Pfeffer verquirlen.
3. Butter in einer Pfanne bei mittlerer Hitze schmelzen, Lachswürfel 2 Minuten anbraten.
4. Eier dazugeben und unter langsamem Rühren cremig stocken lassen.
5. Brot toasten, Rührei darauf verteilen, Tomaten in Scheiben dazu, mit Schnittlauch bestreuen.

#### Overnight Oats mit Skyr & Heidelbeeren

`std-f3` · ⏱ 5 Min. · **Express** · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Skyr natur | 210 g | 150 g | 120 g | 120 g | 120 g |
| Haferflocken (Vollkorn) | 20 g | 60 g | 85 g | 90 g | 115 g |
| Milch 1,5 % | 110 ml | 135 ml | 150 ml | 150 ml | 150 ml |
| Heidelbeeren (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Mandeln | 25 g | 25 g | 25 g | 35 g | 30 g |
| **🔥 kcal** | **434** | **563** | **648** | **724** | **788** |
| **🍗 Protein** | **35 g** | **35 g** | **36 g** | **38 g** | **41 g** |
| **🥑 Fett** | **16 g** | **20 g** | **22 g** | **27 g** | **26 g** |
| **🍞 Kohlenhydrate** | **33 g** | **56 g** | **71 g** | **74 g** | **89 g** |

**Gewürze/nach Geschmack:** Zimt oder Vanille nach Geschmack

**Zubereitung:**

1. Haferflocken, Skyr und Milch in einem Glas oder einer Dose verrühren.
2. Abgedeckt über Nacht (mind. 4 Stunden) in den Kühlschrank stellen.
3. Morgens Heidelbeeren daraufgeben, Mandeln grob hacken und darüberstreuen.

> Hinweis: Zubereitungszeit 5 Min. + über Nacht ziehen lassen.

#### Kartoffel-Hash mit Putenbrust & Spiegelei

`std-f4` · ⏱ 20 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Putenbrustfilet | 65 g | 85 g | 75 g | 70 g | 60 g |
| Eier (Größe M) | 2 Stück | 1 Stück | 1 Stück | 1 Stück | 1 Stück |
| Kartoffeln (roh) | 190 g | 310 g | 440 g | 490 g | 610 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Zwiebel | 30 g | 35 g | 40 g | 40 g | 40 g |
| Olivenöl (nativ extra) | 5 g | 15 g | 15 g | 20 g | 20 g |
| **🔥 kcal** | **437** | **560** | **648** | **723** | **799** |
| **🍗 Protein** | **34 g** | **35 g** | **35 g** | **35 g** | **35 g** |
| **🥑 Fett** | **17 g** | **22 g** | **22 g** | **27 g** | **27 g** |
| **🍞 Kohlenhydrate** | **35 g** | **53 g** | **73 g** | **81 g** | **99 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver

**Zubereitung:**

1. Kartoffeln waschen und ungeschält in 1 cm große Würfel schneiden; Paprika und Zwiebel würfeln, Putenbrust in Streifen schneiden.
2. Öl in einer großen Pfanne erhitzen, Kartoffelwürfel bei mittlerer Hitze 10–12 Minuten goldbraun braten.
3. Putenstreifen, Paprika und Zwiebel dazugeben und 4–5 Minuten mitbraten, würzen.
4. Zwei Mulden formen, Eier hineinschlagen, Deckel auflegen und 3–4 Minuten stocken lassen.

#### Protein-Pancakes mit Himbeeren

`std-f5` · ⏱ 15 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Haferflocken (Vollkorn) | 25 g | 50 g | 80 g | 95 g | 105 g |
| Banane (geschält) | 35 g | 85 g | 80 g | 115 g | 115 g |
| Eier (Größe M) | 2 Stück | 2 Stück | 1 Stück | 1 Stück | 1 Stück |
| Magerquark | 130 g | 100 g | 120 g | 100 g | 90 g |
| Kokosöl | 5 g | 5 g | 10 g | 10 g | 15 g |
| Himbeeren (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| **🔥 kcal** | **440** | **564** | **652** | **726** | **800** |
| **🍗 Protein** | **34 g** | **35 g** | **34 g** | **34 g** | **35 g** |
| **🥑 Fett** | **18 g** | **20 g** | **22 g** | **23 g** | **28 g** |
| **🍞 Kohlenhydrate** | **31 g** | **55 g** | **73 g** | **88 g** | **93 g** |

**Gewürze/nach Geschmack:** 1 TL Backpulver, Zimt

**Zubereitung:**

1. Haferflocken, Banane, Eier, Magerquark und 1 TL Backpulver im Mixer zu einem dicken Teig pürieren.
2. Teig 2 Minuten quellen lassen.
3. Kokosöl in einer beschichteten Pfanne bei mittlerer Hitze erhitzen, kleine Pancakes ausbacken (ca. 2 Minuten pro Seite).
4. Mit Himbeeren servieren.

### Standard (Mischkost) – Mittagessen

#### Lachs mit Ofenkartoffeln, Brokkoli & Kräuter-Skyr

`std-m1` · ⏱ 35 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Lachsfilet (frisch/TK) | 150 g | 125 g | 130 g | 125 g | 115 g |
| Skyr natur | 140 g | 140 g | 90 g | 80 g | 80 g |
| Kartoffeln (roh) | 250 g | 440 g | 650 g | 760 g | 890 g |
| Brokkoli (frisch/TK) | 150 g | 180 g | 200 g | 200 g | 200 g |
| Olivenöl (nativ extra) | 5 g | 15 g | 15 g | 20 g | 25 g |
| **🔥 kcal** | **657** | **842** | **977** | **1084** | **1202** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **26 g** | **33 g** | **34 g** | **38 g** | **42 g** |
| **🍞 Kohlenhydrate** | **47 g** | **76 g** | **106 g** | **123 g** | **142 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Rosmarin, Zitronensaft, Dill oder Schnittlauch

**Zubereitung:**

1. Ofen auf 200 °C (Umluft 180 °C) vorheizen. Kartoffeln waschen, vierteln, mit dem Öl, Salz und Rosmarin mischen und 25 Minuten backen.
2. Lachs salzen und für die letzten 12–15 Minuten mit aufs Blech legen.
3. Brokkoli in Röschen teilen und 5 Minuten dämpfen oder in Salzwasser garen.
4. Skyr mit Kräutern, Zitronensaft, Salz und Pfeffer zu einem Dip verrühren und dazu servieren.

#### Hähnchen-Reis-Bowl mit Avocado

`std-m2` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hähnchenbrustfilet | 205 g | 185 g | 175 g | 165 g | 155 g |
| Basmatireis (trocken) | 40 g | 90 g | 120 g | 140 g | 165 g |
| Avocado (Fruchtfleisch) | 105 g | 125 g | 145 g | 150 g | 175 g |
| Olivenöl (nativ extra) | 10 g | 10 g | 10 g | 15 g | 15 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Salatgurke | 75 g | 90 g | 100 g | 100 g | 100 g |
| **🔥 kcal** | **653** | **844** | **974** | **1085** | **1202** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **29 g** | **32 g** | **35 g** | **41 g** | **45 g** |
| **🍞 Kohlenhydrate** | **38 g** | **79 g** | **103 g** | **119 g** | **139 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver, Limettensaft

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Hähnchen in Streifen schneiden, würzen und im Öl 6–8 Minuten rundum durchbraten.
3. Paprika und Gurke in Streifen schneiden, Avocado in Scheiben schneiden.
4. Alles in einer Schüssel anrichten und mit Limettensaft beträufeln.

#### Chili con Carne mit Reis

`std-m3` · ⏱ 35 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhack mager (ca. 5 % Fett, Tatar) | 210 g | 170 g | 145 g | 125 g | 105 g |
| Kidneybohnen (Glas/Dose, abgetropft) | 75 g | 150 g | 205 g | 245 g | 300 g |
| Basmatireis (trocken) | 30 g | 60 g | 75 g | 90 g | 100 g |
| Passierte Tomaten | 150 ml | 180 ml | 200 ml | 200 ml | 200 ml |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Zwiebel | 40 g | 45 g | 50 g | 50 g | 50 g |
| Olivenöl (nativ extra) | 15 g | 20 g | 25 g | 30 g | 35 g |
| **🔥 kcal** | **654** | **843** | **974** | **1086** | **1195** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **26 g** | **29 g** | **34 g** | **38 g** | **43 g** |
| **🍞 Kohlenhydrate** | **45 g** | **80 g** | **100 g** | **116 g** | **130 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Kreuzkümmel, Paprikapulver, Chili, Oregano

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Zwiebel und Paprika würfeln. Öl erhitzen, Hackfleisch krümelig anbraten, Zwiebel und Paprika 3 Minuten mitbraten.
3. Passierte Tomaten und abgespülte Kidneybohnen dazugeben, mit Kreuzkümmel, Paprika und Chili würzen.
4. 15 Minuten offen köcheln lassen, abschmecken und mit dem Reis servieren.

#### Thunfisch-Kichererbsen-Salat mit Feta & Brot

`std-m4` · ⏱ 10 Min. · **Express**

Express-Mittagessen, ideal zum Mitnehmen.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Thunfisch im eigenen Saft (abgetropft) | 150 g | 120 g | 100 g | 90 g | 95 g |
| Kichererbsen (Glas/Dose, abgetropft) | 110 g | 135 g | 150 g | 150 g | 150 g |
| Roggenvollkornbrot | 40 g | 120 g | 175 g | 215 g | 200 g |
| Feta | 20 g | 25 g | 30 g | 30 g | 30 g |
| Salatgurke | 110 g | 135 g | 150 g | 150 g | 150 g |
| Tomaten | 110 g | 135 g | 150 g | 150 g | 150 g |
| Olivenöl (nativ extra) | 20 g | 20 g | 20 g | 25 g | 40 g |
| **🔥 kcal** | **655** | **841** | **971** | **1088** | **1194** |
| **🍗 Protein** | **54 g** | **54 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **30 g** | **32 g** | **34 g** | **40 g** | **54 g** |
| **🍞 Kohlenhydrate** | **34 g** | **69 g** | **93 g** | **108 g** | **102 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Oregano, Zitronensaft

**Zubereitung:**

1. Kichererbsen abgießen und abspülen, Thunfisch abtropfen lassen.
2. Gurke und Tomaten würfeln, Feta zerbröseln.
3. Alles mit Olivenöl, Zitronensaft, Salz, Pfeffer und Oregano vermengen und mit dem Brot servieren.

#### Vollkornpasta Bolognese

`std-m5` · ⏱ 30 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhack mager (ca. 5 % Fett, Tatar) | 180 g | 155 g | 135 g | 120 g | 105 g |
| Parmesan | 20 g | 15 g | 15 g | 15 g | 15 g |
| Vollkornnudeln (trocken) | 50 g | 100 g | 130 g | 155 g | 180 g |
| Passierte Tomaten | 190 ml | 225 ml | 250 ml | 250 ml | 250 ml |
| Zwiebel | 45 g | 55 g | 60 g | 60 g | 60 g |
| Karotten | 45 g | 55 g | 60 g | 60 g | 60 g |
| Olivenöl (nativ extra) | 10 g | 15 g | 20 g | 25 g | 30 g |
| **🔥 kcal** | **656** | **841** | **975** | **1088** | **1200** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **56 g** | **56 g** |
| **🥑 Fett** | **26 g** | **29 g** | **34 g** | **39 g** | **44 g** |
| **🍞 Kohlenhydrate** | **44 g** | **78 g** | **98 g** | **113 g** | **129 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Oregano, Basilikum

**Zubereitung:**

1. Zwiebel und Karotte fein würfeln. Öl erhitzen, Hackfleisch krümelig anbraten, Gemüse 3 Minuten mitbraten.
2. Passierte Tomaten dazugeben, mit Oregano, Salz und Pfeffer würzen und 15 Minuten köcheln lassen.
3. Nudeln nach Packungsanweisung in Salzwasser garen.
4. Nudeln mit der Sauce servieren und mit geriebenem Parmesan bestreuen.

### Standard (Mischkost) – Abendessen

#### Putenpfanne mit Reis & Gemüse

`std-a1` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Putenbrustfilet | 185 g | 165 g | 155 g | 145 g | 135 g |
| Basmatireis (trocken) | 65 g | 120 g | 145 g | 170 g | 200 g |
| Brokkoli (frisch/TK) | 110 g | 135 g | 150 g | 150 g | 150 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Sojasauce | 10 ml | 15 ml | 15 ml | 15 ml | 15 ml |
| Olivenöl (nativ extra) | 20 g | 20 g | 25 g | 30 g | 30 g |
| **🔥 kcal** | **659** | **845** | **973** | **1094** | **1189** |
| **🍗 Protein** | **54 g** | **55 g** | **56 g** | **55 g** | **55 g** |
| **🥑 Fett** | **23 g** | **23 g** | **28 g** | **33 g** | **34 g** |
| **🍞 Kohlenhydrate** | **58 g** | **102 g** | **123 g** | **142 g** | **166 g** |

**Gewürze/nach Geschmack:** Pfeffer, Ingwer, Knoblauch

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Pute in Streifen schneiden, Brokkoli in kleine Röschen, Paprika in Streifen.
3. Öl in einer großen Pfanne stark erhitzen, Pute 4 Minuten anbraten, Gemüse dazugeben und 5 Minuten weiterbraten.
4. Mit Sojasauce und Ingwer abschmecken, mit dem Reis servieren.

#### Rindersteak mit Süßkartoffeln & grünen Bohnen

`std-a2` · ⏱ 30 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhüftsteak | 215 g | 200 g | 190 g | 180 g | 185 g |
| Süßkartoffel (roh) | 280 g | 460 g | 580 g | 680 g | 700 g |
| Grüne Bohnen (frisch/TK) | 150 g | 180 g | 200 g | 200 g | 200 g |
| Butter | 15 g | 20 g | 25 g | 30 g | 40 g |
| **🔥 kcal** | **658** | **841** | **976** | **1087** | **1184** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **21 g** | **24 g** | **28 g** | **32 g** | **41 g** |
| **🍞 Kohlenhydrate** | **64 g** | **101 g** | **126 g** | **146 g** | **150 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Thymian

**Zubereitung:**

1. Ofen auf 200 °C vorheizen. Süßkartoffeln in Spalten schneiden, salzen und 25 Minuten auf Backpapier backen.
2. Bohnen 8 Minuten in Salzwasser garen.
3. Steak trocken tupfen, in einer sehr heißen Pfanne je Seite 2–3 Minuten braten, dann die Butter dazugeben und das Steak damit übergießen.
4. 3 Minuten ruhen lassen, salzen, pfeffern und mit Süßkartoffeln und Bohnen servieren.

#### Kabeljau mit Kartoffelpüree & Erbsen

`std-a3` · ⏱ 30 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Kabeljau- oder Seelachsfilet | 225 g | 195 g | 170 g | 160 g | 145 g |
| Kartoffeln (roh) | 280 g | 490 g | 620 g | 740 g | 900 g |
| Milch 1,5 % | 75 ml | 90 ml | 100 ml | 100 ml | 100 ml |
| Erbsen (TK) | 110 g | 135 g | 150 g | 150 g | 150 g |
| Butter | 20 g | 25 g | 30 g | 35 g | 35 g |
| **🔥 kcal** | **654** | **846** | **973** | **1089** | **1192** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **20 g** | **24 g** | **29 g** | **33 g** | **33 g** |
| **🍞 Kohlenhydrate** | **58 g** | **93 g** | **115 g** | **133 g** | **157 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Muskat, Zitronensaft

**Zubereitung:**

1. Kartoffeln schälen, vierteln und 20 Minuten in Salzwasser weich kochen.
2. Erbsen 4 Minuten garen.
3. Kabeljau salzen und in der Hälfte der Butter je Seite 3 Minuten braten.
4. Kartoffeln abgießen, mit warmer Milch und restlicher Butter zerstampfen, mit Muskat abschmecken und alles zusammen servieren.

#### Hähnchen-Curry mit Reis

`std-a4` · ⏱ 30 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hähnchenbrustfilet | 190 g | 170 g | 155 g | 145 g | 135 g |
| Basmatireis (trocken) | 65 g | 115 g | 145 g | 170 g | 200 g |
| Kokosmilch (vollfett, Dose) | 85 ml | 100 ml | 115 ml | 135 ml | 145 ml |
| Blattspinat (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Passierte Tomaten | 75 ml | 90 ml | 100 ml | 100 ml | 100 ml |
| Zwiebel | 40 g | 45 g | 50 g | 50 g | 50 g |
| **🔥 kcal** | **655** | **846** | **971** | **1087** | **1201** |
| **🍗 Protein** | **55 g** | **56 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **22 g** | **25 g** | **28 g** | **32 g** | **34 g** |
| **🍞 Kohlenhydrate** | **59 g** | **99 g** | **124 g** | **144 g** | **168 g** |

**Gewürze/nach Geschmack:** Currypulver, Kurkuma, Ingwer, Salz

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Zwiebel würfeln, Hähnchen in Würfel schneiden.
3. Hähnchen ohne zusätzliches Fett in einer beschichteten Pfanne anbraten, Zwiebel und Currypulver 1 Minute mitrösten.
4. Kokosmilch und passierte Tomaten dazugeben, 10 Minuten köcheln lassen, Spinat unterheben, bis er zusammenfällt.
5. Abschmecken und mit dem Reis servieren.

#### Knoblauch-Garnelen-Reispfanne

`std-a5` · ⏱ 20 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Garnelen (roh, geschält, TK) | 245 g | 215 g | 200 g | 185 g | 170 g |
| Basmatireis (trocken) | 55 g | 110 g | 135 g | 160 g | 195 g |
| Zucchini | 110 g | 135 g | 150 g | 150 g | 150 g |
| Erbsen (TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Knoblauch | 5 g | 5 g | 5 g | 5 g | 5 g |
| Olivenöl (nativ extra) | 20 g | 20 g | 25 g | 30 g | 30 g |
| **🔥 kcal** | **654** | **839** | **970** | **1090** | **1200** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **23 g** | **23 g** | **28 g** | **33 g** | **33 g** |
| **🍞 Kohlenhydrate** | **55 g** | **100 g** | **121 g** | **140 g** | **168 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Chiliflocken, Zitrone, Petersilie

**Zubereitung:**

1. Reis nach Packungsanweisung garen (geht auch gut mit Reis vom Vortag).
2. Zucchini würfeln, Knoblauch fein hacken, Garnelen auftauen und trocken tupfen.
3. Öl erhitzen, Garnelen 2–3 Minuten braten und herausnehmen.
4. Zucchini, Erbsen und Knoblauch 4 Minuten braten, Reis und Garnelen untermischen, mit Zitrone und Petersilie abschmecken.


## 7.2 Vegetarisch

### Vegetarisch – Frühstück

#### Schoko-Quark mit Haferflocken & Banane

`veg-f1` · ⏱ 3 Min. · **Express** · vegetarisch

Das schnellste Frühstück der App: 3 Minuten, kein Herd.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Magerquark | 190 g | 160 g | 160 g | 160 g | 160 g |
| Haferflocken (Vollkorn) | 25 g | 60 g | 85 g | 120 g | 120 g |
| Banane (geschält) | 35 g | 85 g | 110 g | 85 g | 165 g |
| Kakaopulver (stark entölt, ungesüßt) | 10 g | 10 g | 10 g | 10 g | 10 g |
| Erdnussmus (100 % Erdnüsse) | 25 g | 20 g | 15 g | 10 g | 10 g |
| **🔥 kcal** | **435** | **561** | **647** | **723** | **798** |
| **🍗 Protein** | **35 g** | **35 g** | **38 g** | **41 g** | **42 g** |
| **🥑 Fett** | **16 g** | **16 g** | **15 g** | **15 g** | **15 g** |
| **🍞 Kohlenhydrate** | **33 g** | **62 g** | **81 g** | **96 g** | **112 g** |

**Gewürze/nach Geschmack:** Zimt nach Geschmack

**Zubereitung:**

1. Magerquark mit Kakaopulver und einem Schuss Wasser cremig rühren.
2. Haferflocken unterrühren, Banane in Scheiben schneiden und daraufgeben.
3. Erdnussmus darüberträufeln.

#### Spinat-Feta-Omelett mit Vollkornbrot

`veg-f2` · ⏱ 12 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 2 Stück | 1 Stück | 1 Stück | 1 Stück | 1 Stück |
| Eiklar | 120 g | 105 g | 75 g | 75 g | 75 g |
| Feta | 20 g | 25 g | 30 g | 30 g | 30 g |
| Blattspinat (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Roggenvollkornbrot | 70 g | 145 g | 185 g | 200 g | 215 g |
| Olivenöl (nativ extra) | – | 5 g | 5 g | 10 g | 15 g |
| **🔥 kcal** | **435** | **566** | **650** | **726** | **801** |
| **🍗 Protein** | **37 g** | **35 g** | **35 g** | **36 g** | **37 g** |
| **🥑 Fett** | **16 g** | **18 g** | **20 g** | **25 g** | **30 g** |
| **🍞 Kohlenhydrate** | **29 g** | **57 g** | **72 g** | **78 g** | **83 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Muskat

**Zubereitung:**

1. Eier und Eiklar mit Salz und Pfeffer verquirlen.
2. Öl in einer Pfanne erhitzen, Spinat 1 Minute zusammenfallen lassen.
3. Eimasse darübergießen, Feta darüberbröseln, bei mittlerer Hitze mit Deckel 4–5 Minuten stocken lassen.
4. Zusammenklappen und mit dem Brot servieren.

#### Skyr-Chia-Pudding mit Mango

`veg-f3` · ⏱ 5 Min. · **Express** · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Skyr natur | 220 g | 170 g | 150 g | 150 g | 150 g |
| Chiasamen | 40 g | 40 g | 40 g | 40 g | 35 g |
| Milch 1,5 % | 75 ml | 90 ml | 100 ml | 100 ml | 100 ml |
| Mango (frisch/TK) | 45 g | 135 g | 200 g | 290 g | 300 g |
| Haferflocken (Vollkorn) | 15 g | 40 g | 55 g | 60 g | 85 g |
| **🔥 kcal** | **437** | **561** | **649** | **723** | **800** |
| **🍗 Protein** | **36 g** | **35 g** | **35 g** | **37 g** | **39 g** |
| **🥑 Fett** | **15 g** | **17 g** | **19 g** | **20 g** | **20 g** |
| **🍞 Kohlenhydrate** | **29 g** | **53 g** | **70 g** | **84 g** | **100 g** |

**Gewürze/nach Geschmack:** Vanille, Limettenabrieb

**Zubereitung:**

1. Skyr, Milch, Chiasamen und Haferflocken verrühren.
2. Mindestens 15 Minuten (oder über Nacht) quellen lassen.
3. Mango würfeln und darauf verteilen.

> Hinweis: 5 Min. + 15 Min. Quellzeit (oder am Vorabend vorbereiten).

#### Hüttenkäse-Avocado-Toast mit Ei

`veg-f4` · ⏱ 10 Min. · **Express** · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hüttenkäse (körniger Frischkäse) | 130 g | 150 g | 120 g | 110 g | 100 g |
| Eier (Größe M) | 2 Stück | 1 Stück | 1 Stück | 1 Stück | 1 Stück |
| Roggenvollkornbrot | 65 g | 125 g | 165 g | 190 g | 205 g |
| Tomaten | 75 g | 90 g | 100 g | 100 g | 100 g |
| Avocado (Fruchtfleisch) | – | 35 g | 55 g | 75 g | 110 g |
| **🔥 kcal** | **435** | **560** | **649** | **723** | **801** |
| **🍗 Protein** | **35 g** | **35 g** | **35 g** | **35 g** | **36 g** |
| **🥑 Fett** | **17 g** | **18 g** | **21 g** | **23 g** | **28 g** |
| **🍞 Kohlenhydrate** | **31 g** | **55 g** | **70 g** | **80 g** | **86 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Chiliflocken

**Zubereitung:**

1. Eier 8 Minuten kochen, abschrecken und pellen (oder vorgekochte Eier verwenden).
2. Brot toasten, Avocado darauf zerdrücken, salzen und pfeffern.
3. Hüttenkäse daraufgeben, Eier und Tomaten in Scheiben darauflegen, mit Chiliflocken bestreuen.

#### Apfel-Zimt-Porridge mit Quark

`veg-f5` · ⏱ 8 Min. · **Express** · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Haferflocken (Vollkorn) | 20 g | 55 g | 70 g | 80 g | 90 g |
| Milch 1,5 % | 150 ml | 180 ml | 200 ml | 200 ml | 200 ml |
| Magerquark | 180 g | 140 g | 120 g | 120 g | 120 g |
| Apfel | 90 g | 110 g | 120 g | 120 g | 120 g |
| Mandelmus (100 % Mandeln) | 20 g | 20 g | 25 g | 30 g | 35 g |
| **🔥 kcal** | **438** | **565** | **653** | **721** | **789** |
| **🍗 Protein** | **34 g** | **35 g** | **37 g** | **39 g** | **41 g** |
| **🥑 Fett** | **15 g** | **18 g** | **22 g** | **26 g** | **29 g** |
| **🍞 Kohlenhydrate** | **38 g** | **60 g** | **71 g** | **77 g** | **83 g** |

**Gewürze/nach Geschmack:** Zimt, Prise Salz

**Zubereitung:**

1. Haferflocken mit der Milch aufkochen und unter Rühren 3–4 Minuten köcheln lassen.
2. Apfel klein würfeln und die letzte Minute mitkochen.
3. Vom Herd nehmen, Magerquark unterrühren (macht es cremig und eiweißreich).
4. Mit Zimt bestreuen und Mandelmus darübergeben.

### Vegetarisch – Mittagessen

#### Shakshuka mit Kichererbsen & Feta

`veg-m1` · ⏱ 25 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 3 Stück | 2 Stück | 2 Stück | 2 Stück | 2 Stück |
| Eiklar | 155 g | 145 g | 85 g | 75 g | 75 g |
| Feta | 40 g | 30 g | 30 g | 20 g | 20 g |
| Kichererbsen (Glas/Dose, abgetropft) | 55 g | 145 g | 220 g | 240 g | 200 g |
| Roggenvollkornbrot | 25 g | 60 g | 85 g | 120 g | 155 g |
| Passierte Tomaten | 225 ml | 270 ml | 300 ml | 300 ml | 300 ml |
| Paprika | 110 g | 135 g | 150 g | 150 g | 150 g |
| Zwiebel | 45 g | 55 g | 60 g | 60 g | 60 g |
| Olivenöl (nativ extra) | – | 10 g | 10 g | 15 g | 25 g |
| **🔥 kcal** | **657** | **845** | **975** | **1086** | **1198** |
| **🍗 Protein** | **55 g** | **54 g** | **55 g** | **56 g** | **56 g** |
| **🥑 Fett** | **27 g** | **33 g** | **35 g** | **39 g** | **48 g** |
| **🍞 Kohlenhydrate** | **37 g** | **65 g** | **86 g** | **102 g** | **110 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Kreuzkümmel, Paprikapulver, Chili, Petersilie

**Zubereitung:**

1. Zwiebel und Paprika würfeln und im Öl 5 Minuten weich dünsten.
2. Passierte Tomaten, Kichererbsen, Kreuzkümmel und Paprikapulver dazugeben, 8 Minuten köcheln lassen.
3. Mulden formen, Eier hineinschlagen und das Eiklar dazwischengießen, Deckel auflegen und 6–8 Minuten stocken lassen.
4. Feta darüberbröseln, mit Petersilie bestreuen, mit dem Brot servieren.

#### Räuchertofu-Bolognese mit Linsen- & Vollkornnudeln und Parmesan

`veg-m2` · ⏱ 25 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Räuchertofu | 180 g | 165 g | 145 g | 125 g | 100 g |
| Parmesan | 30 g | 20 g | 15 g | 20 g | 20 g |
| Nudeln aus roten Linsen (trocken, 100 % Linsenmehl) | 30 g | 25 g | 35 g | 15 g | 15 g |
| Vollkornnudeln (trocken) | 20 g | 80 g | 95 g | 150 g | 180 g |
| Passierte Tomaten | 150 ml | 180 ml | 200 ml | 200 ml | 200 ml |
| Karotten | 45 g | 55 g | 60 g | 60 g | 60 g |
| Zwiebel | 30 g | 35 g | 40 g | 40 g | 40 g |
| Olivenöl (nativ extra) | – | 5 g | 15 g | 15 g | 20 g |
| **🔥 kcal** | **661** | **846** | **977** | **1088** | **1195** |
| **🍗 Protein** | **54 g** | **55 g** | **55 g** | **56 g** | **55 g** |
| **🥑 Fett** | **28 g** | **30 g** | **38 g** | **38 g** | **41 g** |
| **🍞 Kohlenhydrate** | **40 g** | **77 g** | **92 g** | **116 g** | **134 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Oregano, Basilikum, Paprikapulver

**Zubereitung:**

1. Räuchertofu mit einer Gabel fein zerbröseln (oder grob reiben), Zwiebel und Karotte fein würfeln.
2. Öl erhitzen, Tofu 5 Minuten anbraten, Zwiebel und Karotte 3 Minuten mitbraten.
3. Passierte Tomaten dazugeben, mit Oregano, Salz und Pfeffer würzen und 10 Minuten köcheln lassen.
4. Linsen- und Vollkornnudeln zusammen in Salzwasser nach Packungsanweisung garen (ca. 8–10 Minuten).
5. Mit der Sauce mischen und mit geriebenem Parmesan servieren.

#### Bauernfrühstück mit Hüttenkäse

`veg-m3` · ⏱ 25 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 4 Stück | 4 Stück | 4 Stück | 3 Stück | 3 Stück |
| Hüttenkäse (körniger Frischkäse) | 180 g | 140 g | 110 g | 140 g | 120 g |
| Kartoffeln (roh) | 180 g | 430 g | 600 g | 720 g | 850 g |
| Zwiebel | 45 g | 55 g | 60 g | 60 g | 60 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Butter | – | 5 g | 10 g | 20 g | 25 g |
| **🔥 kcal** | **656** | **842** | **976** | **1088** | **1199** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **29 g** | **32 g** | **35 g** | **39 g** | **43 g** |
| **🍞 Kohlenhydrate** | **39 g** | **77 g** | **102 g** | **121 g** | **140 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Majoran, Schnittlauch

**Zubereitung:**

1. Kartoffeln waschen, in dünne Scheiben schneiden und in der Butter 12–15 Minuten goldbraun braten.
2. Zwiebel und Paprika würfeln und 3 Minuten mitbraten.
3. Eier verquirlen, würzen, darübergießen und stocken lassen.
4. Mit Hüttenkäse und Schnittlauch servieren.

#### Griechischer Bauernsalat mit Hüttenkäse & Kichererbsen

`veg-m4` · ⏱ 10 Min. · **Express** · vegetarisch

Express-Mittagessen ohne Kochen.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hüttenkäse (körniger Frischkäse) | 260 g | 210 g | 220 g | 210 g | 220 g |
| Feta | 50 g | 25 g | 30 g | 25 g | 25 g |
| Kichererbsen (Glas/Dose, abgetropft) | 170 g | 300 g | 300 g | 300 g | 300 g |
| Salatgurke | 110 g | 135 g | 150 g | 150 g | 150 g |
| Tomaten | 110 g | 135 g | 150 g | 150 g | 150 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Olivenöl (nativ extra) | – | 15 g | 25 g | 40 g | 50 g |
| **🔥 kcal** | **655** | **847** | **966** | **1075** | **1173** |
| **🍗 Protein** | **55 g** | **54 g** | **57 g** | **54 g** | **56 g** |
| **🥑 Fett** | **27 g** | **38 g** | **50 g** | **63 g** | **74 g** |
| **🍞 Kohlenhydrate** | **38 g** | **55 g** | **57 g** | **56 g** | **56 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Oregano, Zitronensaft, rote Zwiebel nach Geschmack

**Zubereitung:**

1. Gurke, Tomaten und Paprika grob würfeln, Kichererbsen abspülen.
2. Mit Olivenöl, Zitronensaft, Oregano, Salz und Pfeffer vermengen.
3. Hüttenkäse daraufgeben und Feta darüberbröseln.

#### Caprese-Quinoa-Salat mit Hüttenkäse & Ei

`veg-m5` · ⏱ 20 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Mozzarella | 75 g | 75 g | 70 g | 60 g | 50 g |
| Hüttenkäse (körniger Frischkäse) | 220 g | 130 g | 100 g | 80 g | 90 g |
| Eier (Größe M) | 1 Stück | 1 Stück | 1 Stück | 1 Stück | 1 Stück |
| Quinoa (trocken) | 40 g | 115 g | 150 g | 180 g | 180 g |
| Tomaten | 150 g | 180 g | 200 g | 200 g | 200 g |
| Blattsalat (z. B. Romana, Rucola) | 40 g | 45 g | 50 g | 50 g | 50 g |
| Olivenöl (nativ extra) | – | – | 5 g | 10 g | 25 g |
| **🔥 kcal** | **656** | **844** | **977** | **1085** | **1203** |
| **🍗 Protein** | **55 g** | **55 g** | **56 g** | **55 g** | **55 g** |
| **🥑 Fett** | **32 g** | **32 g** | **37 g** | **41 g** | **55 g** |
| **🍞 Kohlenhydrate** | **34 g** | **75 g** | **95 g** | **112 g** | **112 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Balsamico, Basilikum

**Zubereitung:**

1. Quinoa heiß abspülen und in der doppelten Menge Salzwasser 12–15 Minuten garen, abkühlen lassen.
2. Eier 8 Minuten kochen, abschrecken, pellen und vierteln.
3. Tomaten und Mozzarella würfeln, mit Rucola, Quinoa, Olivenöl, Balsamico, Salz und Pfeffer mischen.
4. Mit Hüttenkäse, Ei und Basilikum anrichten.

### Vegetarisch – Abendessen

#### Linsen-Dal mit Reis & Skyr-Topping

`veg-a1` · ⏱ 30 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rote Linsen (trocken) | 30 g | 60 g | 60 g | 50 g | 45 g |
| Skyr natur | 380 g | 280 g | 250 g | 250 g | 230 g |
| Basmatireis (trocken) | 20 g | 60 g | 90 g | 120 g | 160 g |
| Blattspinat (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Passierte Tomaten | 110 ml | 135 ml | 150 ml | 150 ml | 150 ml |
| Zwiebel | 40 g | 45 g | 50 g | 50 g | 50 g |
| Butter | 25 g | 25 g | 30 g | 35 g | 35 g |
| **🔥 kcal** | **658** | **849** | **980** | **1088** | **1199** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **23 g** | **23 g** | **28 g** | **32 g** | **32 g** |
| **🍞 Kohlenhydrate** | **53 g** | **96 g** | **120 g** | **138 g** | **166 g** |

**Gewürze/nach Geschmack:** Currypulver, Kurkuma, Kreuzkümmel, Ingwer, Salz, Zitrone

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Zwiebel würfeln, in der Butter mit Currypulver, Kurkuma und Kreuzkümmel 2 Minuten andünsten.
3. Gewaschene Linsen, passierte Tomaten und 300 ml Wasser dazugeben, 15 Minuten köcheln lassen.
4. Spinat unterheben, abschmecken und mit Reis und einem Klecks Skyr (mit Salz und Zitrone verrührt) servieren.

#### Pellkartoffeln mit Kräuterquark & Leinöl

`veg-a2` · ⏱ 25 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Magerquark | 410 g | 370 g | 330 g | 310 g | 310 g |
| Kartoffeln (roh) | 260 g | 500 g | 710 g | 830 g | 900 g |
| Leinöl | 20 g | 25 g | 25 g | 30 g | 35 g |
| Salatgurke | 110 g | 135 g | 150 g | 150 g | 150 g |
| **🔥 kcal** | **653** | **846** | **973** | **1090** | **1185** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **22 g** | **27 g** | **27 g** | **32 g** | **37 g** |
| **🍞 Kohlenhydrate** | **57 g** | **92 g** | **122 g** | **140 g** | **150 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Schnittlauch, Petersilie, Dill

**Zubereitung:**

1. Kartoffeln waschen und in Salzwasser 20–25 Minuten kochen.
2. Magerquark mit etwas Wasser, Kräutern, Salz und Pfeffer cremig rühren.
3. Gurke in Scheiben schneiden.
4. Kartoffeln mit Quark servieren und das Leinöl darüberträufeln (nicht erhitzen).

#### Ofen-Süßkartoffel mit Hüttenkäse & Bohnen

`veg-a3` · ⏱ 45 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Süßkartoffel (roh) | 140 g | 280 g | 420 g | 530 g | 630 g |
| Hüttenkäse (körniger Frischkäse) | 330 g | 290 g | 270 g | 260 g | 240 g |
| Kidneybohnen (Glas/Dose, abgetropft) | 145 g | 175 g | 165 g | 150 g | 155 g |
| Avocado (Fruchtfleisch) | 35 g | 80 g | 105 g | 130 g | 155 g |
| Tomaten | 75 g | 90 g | 100 g | 100 g | 100 g |
| **🔥 kcal** | **658** | **844** | **977** | **1087** | **1198** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **20 g** | **26 g** | **28 g** | **32 g** | **35 g** |
| **🍞 Kohlenhydrate** | **57 g** | **88 g** | **116 g** | **136 g** | **157 g** |

**Gewürze/nach Geschmack:** Salz, Kreuzkümmel, Limette, Chili, Koriander

**Zubereitung:**

1. Ofen auf 200 °C vorheizen. Süßkartoffeln längs halbieren, mit der Schnittfläche nach unten 35–40 Minuten backen.
2. Kidneybohnen abspülen, mit gewürfelten Tomaten, Kreuzkümmel, Salz und Limette mischen.
3. Süßkartoffeln mit einer Gabel auflockern, Bohnen und Hüttenkäse daraufgeben.
4. Mit Avocadoscheiben und Koriander servieren.

> Hinweis: Aktive Zeit nur ca. 10 Minuten, Rest Backzeit.

#### Gebratener Reis mit Ei & Edamame

`veg-a4` · ⏱ 20 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Basmatireis (trocken) | 30 g | 85 g | 110 g | 135 g | 175 g |
| Eier (Größe M) | 3 Stück | 3 Stück | 3 Stück | 3 Stück | 3 Stück |
| Edamame (TK, geschält) | 190 g | 165 g | 150 g | 135 g | 115 g |
| Erbsen (TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Karotten | 60 g | 70 g | 80 g | 80 g | 80 g |
| Sojasauce | 10 ml | 15 ml | 15 ml | 15 ml | 15 ml |
| Olivenöl (nativ extra) | – | – | 5 g | 10 g | 10 g |
| **🔥 kcal** | **667** | **847** | **971** | **1084** | **1199** |
| **🍗 Protein** | **51 g** | **54 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **26 g** | **25 g** | **29 g** | **34 g** | **33 g** |
| **🍞 Kohlenhydrate** | **46 g** | **90 g** | **110 g** | **129 g** | **159 g** |

**Gewürze/nach Geschmack:** Ingwer, Knoblauch, Frühlingszwiebel

**Zubereitung:**

1. Reis garen und abkühlen lassen (am besten Reis vom Vortag).
2. Karotte fein würfeln. Öl in einer großen Pfanne erhitzen, Karotte, Erbsen und Edamame 4 Minuten braten.
3. Gemüse zur Seite schieben, Eier hineinschlagen und verrührt stocken lassen.
4. Reis dazugeben, 3 Minuten mitbraten, mit Sojasauce, Ingwer und Frühlingszwiebeln abschmecken.

#### Abendbrot: Vollkornbrot, Hüttenkäse & Ei

`veg-a5` · ⏱ 10 Min. · **Express** · vegetarisch

Klassisches Abendbrot, in 10 Minuten fertig.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Roggenvollkornbrot | 100 g | 190 g | 270 g | 280 g | 280 g |
| Hüttenkäse (körniger Frischkäse) | 260 g | 210 g | 170 g | 180 g | 120 g |
| Eier (Größe M) | 2 Stück | 2 Stück | 2 Stück | 2 Stück | 3 Stück |
| Tomaten | 110 g | 135 g | 150 g | 150 g | 150 g |
| Salatgurke | 110 g | 135 g | 150 g | 150 g | 150 g |
| Butter | – | 5 g | 5 g | 15 g | 25 g |
| **🔥 kcal** | **656** | **841** | **974** | **1079** | **1173** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **57 g** | **56 g** |
| **🥑 Fett** | **23 g** | **26 g** | **26 g** | **35 g** | **46 g** |
| **🍞 Kohlenhydrate** | **50 g** | **84 g** | **114 g** | **119 g** | **117 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Schnittlauch

**Zubereitung:**

1. Eier 8 Minuten kochen und pellen (oder vorgekochte Eier verwenden).
2. Brot dünn mit Butter bestreichen.
3. Hüttenkäse daraufgeben, Eier, Tomaten und Gurke in Scheiben darauflegen, salzen, pfeffern, mit Schnittlauch bestreuen.


## 7.3 Vegan

> Protein vor allem aus Tofu, Tempeh, Sojaschnetzel, Edamame, Linsen und Bohnen (kombiniert mit Getreide für eine vollständige Aminosäurebilanz). Proteinpulver nur in 2 von 15 Rezepten und dort sparsam (Erbsenprotein). Wichtig für Veganer: Vitamin B12 supplementieren.

### Vegan – Frühstück

#### Tofu-Scramble mit Vollkornbrot

`vgn-f1` · ⏱ 12 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Tofu natur | 195 g | 170 g | 145 g | 130 g | 125 g |
| Blattspinat (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Tomaten | 75 g | 90 g | 100 g | 100 g | 100 g |
| Roggenvollkornbrot | 75 g | 125 g | 160 g | 205 g | 220 g |
| Olivenöl (nativ extra) | – | 5 g | 10 g | 10 g | 15 g |
| **🔥 kcal** | **440** | **562** | **651** | **726** | **795** |
| **🍗 Protein** | **35 g** | **35 g** | **34 g** | **35 g** | **36 g** |
| **🥑 Fett** | **16 g** | **20 g** | **23 g** | **23 g** | **28 g** |
| **🍞 Kohlenhydrate** | **34 g** | **53 g** | **66 g** | **83 g** | **89 g** |

**Gewürze/nach Geschmack:** Kurkuma, Paprikapulver, Salz, Pfeffer, optional Kala Namak und Hefeflocken

**Zubereitung:**

1. Tofu mit den Händen in eine Pfanne bröseln.
2. Mit dem Öl 5 Minuten anbraten, mit Kurkuma, Paprika, Salz und Kala Namak (Eigeschmack) würzen.
3. Gewürfelte Tomaten und Spinat dazugeben, 2 Minuten mitgaren.
4. Mit getoastetem Brot servieren.

#### Protein-Overnight-Oats mit Heidelbeeren

`vgn-f2` · ⏱ 5 Min. · **Express** · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Haferflocken (Vollkorn) | 40 g | 85 g | 120 g | 130 g | 140 g |
| Sojadrink ungesüßt | 190 ml | 225 ml | 250 ml | 250 ml | 250 ml |
| Veganes Proteinpulver (Erbsenprotein, ungesüßt) | 20 g | 10 g | 10 g | 10 g | 10 g |
| Sojajoghurt natur ungesüßt | 75 g | 90 g | 100 g | 100 g | 100 g |
| Hanfsamen geschält | 15 g | 10 g | – | 5 g | 10 g |
| Heidelbeeren (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| **🔥 kcal** | **441** | **567** | **656** | **722** | **788** |
| **🍗 Protein** | **35 g** | **34 g** | **37 g** | **40 g** | **43 g** |
| **🥑 Fett** | **17 g** | **18 g** | **16 g** | **20 g** | **23 g** |
| **🍞 Kohlenhydrate** | **33 g** | **60 g** | **81 g** | **87 g** | **93 g** |

**Gewürze/nach Geschmack:** Zimt, Vanille

**Zubereitung:**

1. Proteinpulver mit dem Sojadrink klümpchenfrei verrühren.
2. Haferflocken und Sojajoghurt unterrühren, abgedeckt über Nacht kühl stellen.
3. Morgens mit Heidelbeeren und Hanfsamen toppen.

> Hinweis: 5 Min. + über Nacht ziehen lassen. Eines von nur zwei veganen Rezepten mit Proteinpulver.

#### Tempeh-Avocado-Brot

`vgn-f3` · ⏱ 12 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Tempeh | 145 g | 125 g | 110 g | 100 g | 85 g |
| Roggenvollkornbrot | 65 g | 120 g | 160 g | 185 g | 220 g |
| Tomaten | 75 g | 90 g | 100 g | 100 g | 100 g |
| Sojasauce | 10 ml | 10 ml | 10 ml | 10 ml | 10 ml |
| Avocado (Fruchtfleisch) | – | 30 g | 50 g | 75 g | 95 g |
| **🔥 kcal** | **434** | **562** | **651** | **724** | **801** |
| **🍗 Protein** | **35 g** | **35 g** | **35 g** | **35 g** | **35 g** |
| **🥑 Fett** | **17 g** | **20 g** | **21 g** | **24 g** | **26 g** |
| **🍞 Kohlenhydrate** | **33 g** | **54 g** | **69 g** | **79 g** | **92 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver (geräuchert)

**Zubereitung:**

1. Tempeh in dünne Scheiben schneiden.
2. In einer beschichteten Pfanne ohne Fett je Seite 2–3 Minuten knusprig braten, mit Sojasauce ablöschen.
3. Brot toasten, Avocado darauf zerdrücken, salzen.
4. Tempeh und Tomatenscheiben darauflegen.

#### Schoko-Seidentofu-Bowl

`vgn-f4` · ⏱ 5 Min. · **Express** · vegan

Express-Frühstück in 5 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Seidentofu | 270 g | 180 g | 180 g | 150 g | 150 g |
| Veganes Proteinpulver (Erbsenprotein, ungesüßt) | 15 g | 15 g | 10 g | 10 g | 10 g |
| Kakaopulver (stark entölt, ungesüßt) | 10 g | 10 g | 10 g | 10 g | 10 g |
| Banane (geschält) | 50 g | 125 g | 150 g | 185 g | 220 g |
| Haferflocken (Vollkorn) | 25 g | 45 g | 60 g | 75 g | 95 g |
| Erdnussmus (100 % Erdnüsse) | 10 g | 15 g | 20 g | 20 g | 15 g |
| **🔥 kcal** | **438** | **562** | **652** | **723** | **800** |
| **🍗 Protein** | **35 g** | **35 g** | **35 g** | **35 g** | **37 g** |
| **🥑 Fett** | **17 g** | **18 g** | **22 g** | **22 g** | **21 g** |
| **🍞 Kohlenhydrate** | **30 g** | **56 g** | **70 g** | **86 g** | **104 g** |

**Gewürze/nach Geschmack:** Zimt, Prise Salz

**Zubereitung:**

1. Seidentofu, Proteinpulver, Kakao und die Hälfte der Banane im Mixer cremig pürieren.
2. In eine Schüssel geben, Haferflocken unterrühren.
3. Mit restlicher Banane in Scheiben und Erdnussmus toppen.

#### Baked Beans mit Räuchertofu auf Toast

`vgn-f5` · ⏱ 15 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Räuchertofu | 145 g | 120 g | 110 g | 95 g | 90 g |
| Weiße Bohnen (Glas/Dose, abgetropft) | 110 g | 105 g | 85 g | 90 g | 75 g |
| Roggenvollkornbrot | 25 g | 80 g | 115 g | 160 g | 185 g |
| Passierte Tomaten | 110 ml | 135 ml | 150 ml | 150 ml | 150 ml |
| Zwiebel | 30 g | 35 g | 40 g | 40 g | 40 g |
| Olivenöl (nativ extra) | – | 5 g | 10 g | 10 g | 15 g |
| **🔥 kcal** | **439** | **562** | **650** | **725** | **799** |
| **🍗 Protein** | **35 g** | **35 g** | **34 g** | **35 g** | **35 g** |
| **🥑 Fett** | **16 g** | **19 g** | **23 g** | **22 g** | **27 g** |
| **🍞 Kohlenhydrate** | **31 g** | **53 g** | **64 g** | **82 g** | **89 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver (geräuchert), Senf, Prise Zucker optional

**Zubereitung:**

1. Zwiebel fein würfeln und im Öl 3 Minuten andünsten.
2. Passierte Tomaten, abgespülte Bohnen, Paprikapulver und etwas Senf dazugeben, 8 Minuten köcheln lassen.
3. Räuchertofu würfeln und in einer zweiten Pfanne ohne Fett knusprig braten.
4. Brot toasten, Bohnen und Tofu darauf servieren.

### Vegan – Mittagessen

#### Tofu-Erdnuss-Curry mit Reis

`vgn-m1` · ⏱ 30 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Tofu natur | 275 g | 235 g | 195 g | 185 g | 175 g |
| Edamame (TK, geschält) | 80 g | 70 g | 85 g | 65 g | 55 g |
| Basmatireis (trocken) | 35 g | 85 g | 110 g | 130 g | 160 g |
| Kokosmilch (vollfett, Dose) | 10 ml | 30 ml | 50 ml | 75 ml | 90 ml |
| Brokkoli (frisch/TK) | 110 g | 135 g | 150 g | 150 g | 150 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Erdnussmus (100 % Erdnüsse) | – | 5 g | 10 g | 15 g | 15 g |
| **🔥 kcal** | **654** | **845** | **976** | **1088** | **1197** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **28 g** | **31 g** | **36 g** | **42 g** | **44 g** |
| **🍞 Kohlenhydrate** | **42 g** | **83 g** | **104 g** | **120 g** | **143 g** |

**Gewürze/nach Geschmack:** rote Currypaste, Ingwer, Knoblauch, Limette, Sojasauce

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Tofu würfeln und in einer beschichteten Pfanne ohne Fett rundum goldbraun braten.
3. Brokkoli und Paprika dazugeben, 3 Minuten braten.
4. Kokosmilch, Erdnussmus, Currypaste und 100 ml Wasser einrühren, Edamame zugeben und 8 Minuten köcheln lassen.
5. Mit Limette und Sojasauce abschmecken und mit Reis servieren.

#### Tofu-Soja-Bolognese mit Linsen- & Vollkornnudeln

`vgn-m2` · ⏱ 25 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Räuchertofu | 160 g | 140 g | 130 g | 115 g | 105 g |
| Sojaschnetzel (trocken) | 35 g | 25 g | 15 g | 15 g | 10 g |
| Nudeln aus roten Linsen (trocken, 100 % Linsenmehl) | 15 g | 30 g | 30 g | 20 g | 25 g |
| Vollkornnudeln (trocken) | 20 g | 60 g | 110 g | 145 g | 170 g |
| Passierte Tomaten | 150 ml | 180 ml | 200 ml | 200 ml | 200 ml |
| Karotten | 45 g | 55 g | 60 g | 60 g | 60 g |
| Zwiebel | 30 g | 35 g | 40 g | 40 g | 40 g |
| Olivenöl (nativ extra) | 10 g | 15 g | 15 g | 20 g | 25 g |
| **🔥 kcal** | **663** | **845** | **978** | **1085** | **1200** |
| **🍗 Protein** | **54 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **28 g** | **32 g** | **32 g** | **36 g** | **41 g** |
| **🍞 Kohlenhydrate** | **38 g** | **70 g** | **101 g** | **118 g** | **135 g** |

**Gewürze/nach Geschmack:** Gemüsebrühe, Salz, Pfeffer, Oregano, Basilikum, Hefeflocken optional

**Zubereitung:**

1. Sojaschnetzel 10 Minuten in heißer Gemüsebrühe einweichen und gut ausdrücken; Räuchertofu fein zerbröseln.
2. Zwiebel und Karotte würfeln. Öl erhitzen, Tofu und Sojaschnetzel 5 Minuten anbraten, Gemüse 3 Minuten mitbraten.
3. Passierte Tomaten dazugeben, mit Oregano, Salz und Pfeffer 10 Minuten köcheln lassen.
4. Linsen- und Vollkornnudeln zusammen nach Packungsanweisung garen, mit der Sauce mischen.

#### Tempeh-Quinoa-Bowl mit Avocado

`vgn-m3` · ⏱ 25 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Tempeh | 190 g | 150 g | 125 g | 105 g | 100 g |
| Edamame (TK, geschält) | 70 g | 60 g | 55 g | 45 g | 40 g |
| Quinoa (trocken) | 50 g | 110 g | 145 g | 175 g | 180 g |
| Avocado (Fruchtfleisch) | 5 g | 40 g | 75 g | 110 g | 175 g |
| Salatgurke | 75 g | 90 g | 100 g | 100 g | 100 g |
| Sojasauce | 10 ml | 15 ml | 15 ml | 15 ml | 15 ml |
| **🔥 kcal** | **656** | **844** | **973** | **1086** | **1192** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **28 g** | **32 g** | **36 g** | **41 g** | **50 g** |
| **🍞 Kohlenhydrate** | **42 g** | **75 g** | **94 g** | **111 g** | **115 g** |

**Gewürze/nach Geschmack:** Limette, Sesam, Chiliflocken

**Zubereitung:**

1. Quinoa heiß abspülen und in der doppelten Menge Salzwasser 12–15 Minuten garen.
2. Tempeh würfeln, in einer beschichteten Pfanne knusprig braten, mit Sojasauce ablöschen.
3. Edamame 3 Minuten in kochendem Wasser garen.
4. Quinoa, Tempeh, Edamame, Gurke und Avocado in einer Schüssel anrichten, mit Sesam und Limette verfeinern.

#### Räuchertofu-Kichererbsen-Salat mit Tahin

`vgn-m4` · ⏱ 10 Min. · **Express** · vegan

Express-Mittagessen ohne Kochen.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Räuchertofu | 255 g | 205 g | 165 g | 135 g | 110 g |
| Kichererbsen (Glas/Dose, abgetropft) | 110 g | 135 g | 150 g | 150 g | 150 g |
| Roggenvollkornbrot | 30 g | 110 g | 150 g | 195 g | 255 g |
| Salatgurke | 110 g | 135 g | 150 g | 150 g | 150 g |
| Tomaten | 110 g | 135 g | 150 g | 150 g | 150 g |
| Tahin (Sesammus) | – | 10 g | 25 g | 35 g | 40 g |
| **🔥 kcal** | **655** | **842** | **976** | **1083** | **1199** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **29 g** | **31 g** | **37 g** | **40 g** | **41 g** |
| **🍞 Kohlenhydrate** | **34 g** | **69 g** | **86 g** | **103 g** | **126 g** |

**Gewürze/nach Geschmack:** Zitronensaft, Knoblauch, Salz, Petersilie, Kreuzkümmel

**Zubereitung:**

1. Räuchertofu würfeln, Kichererbsen abspülen, Gurke und Tomaten würfeln.
2. Tahin mit Zitronensaft, 2–3 EL Wasser, Salz und Knoblauch zu einem Dressing rühren.
3. Alles vermengen, mit Petersilie bestreuen und mit dem Brot servieren.

#### Chili sin Carne mit Tempeh & Reis

`vgn-m5` · ⏱ 35 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Tempeh | 130 g | 105 g | 85 g | 70 g | 60 g |
| Sojaschnetzel (trocken) | 40 g | 35 g | 30 g | 25 g | 20 g |
| Kidneybohnen (Glas/Dose, abgetropft) | 50 g | 120 g | 180 g | 230 g | 280 g |
| Basmatireis (trocken) | 15 g | 30 g | 50 g | 65 g | 75 g |
| Passierte Tomaten | 150 ml | 180 ml | 200 ml | 200 ml | 200 ml |
| Paprika | 90 g | 110 g | 120 g | 120 g | 120 g |
| Zwiebel | 30 g | 35 g | 40 g | 40 g | 40 g |
| Olivenöl (nativ extra) | 5 g | 10 g | 10 g | 10 g | 15 g |
| Avocado (Fruchtfleisch) | 30 g | 70 g | 100 g | 135 g | 145 g |
| **🔥 kcal** | **660** | **842** | **975** | **1088** | **1197** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **25 g** | **34 g** | **36 g** | **40 g** | **46 g** |
| **🍞 Kohlenhydrate** | **42 g** | **64 g** | **88 g** | **105 g** | **117 g** |

**Gewürze/nach Geschmack:** Gemüsebrühe, Kreuzkümmel, Paprikapulver, Chili, Oregano, Salz, etwas Kakao

**Zubereitung:**

1. Sojaschnetzel 10 Minuten in heißer Gemüsebrühe einweichen und ausdrücken. Reis garen.
2. Tempeh fein zerbröseln. Zwiebel und Paprika würfeln, im Öl andünsten, Tempeh und Sojaschnetzel 5 Minuten mitbraten.
3. Passierte Tomaten, Kidneybohnen und Gewürze dazugeben, 15 Minuten köcheln lassen.
4. Mit Reis und Avocadowürfeln servieren.

### Vegan – Abendessen

#### Linsen-Tofu-Dal mit Reis

`vgn-a1` · ⏱ 30 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rote Linsen (trocken) | 55 g | 55 g | 55 g | 50 g | 45 g |
| Tofu natur | 235 g | 215 g | 190 g | 185 g | 175 g |
| Basmatireis (trocken) | 20 g | 75 g | 110 g | 135 g | 165 g |
| Blattspinat (frisch/TK) | 110 g | 135 g | 150 g | 150 g | 150 g |
| Passierte Tomaten | 110 ml | 135 ml | 150 ml | 150 ml | 150 ml |
| Kokosöl | 5 g | 5 g | 10 g | 15 g | 20 g |
| **🔥 kcal** | **661** | **840** | **980** | **1087** | **1205** |
| **🍗 Protein** | **52 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **24 g** | **23 g** | **27 g** | **31 g** | **36 g** |
| **🍞 Kohlenhydrate** | **52 g** | **96 g** | **123 g** | **140 g** | **161 g** |

**Gewürze/nach Geschmack:** Currypulver, Kurkuma, Kreuzkümmel, Ingwer, Knoblauch, Salz, Zitrone

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Gewürze im Kokosöl 1 Minute anrösten, gewaschene Linsen, passierte Tomaten und 350 ml Wasser dazugeben, 15 Minuten köcheln.
3. Tofu würfeln, in einer beschichteten Pfanne goldbraun braten.
4. Spinat ins Dal rühren, abschmecken, mit Tofu und Reis servieren.

#### Gebratener Reis mit Tofu & Edamame

`vgn-a2` · ⏱ 20 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Tofu natur | 185 g | 175 g | 170 g | 160 g | 135 g |
| Edamame (TK, geschält) | 175 g | 135 g | 115 g | 110 g | 125 g |
| Basmatireis (trocken) | 30 g | 85 g | 115 g | 140 g | 175 g |
| Erbsen (TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Karotten | 60 g | 70 g | 80 g | 80 g | 80 g |
| Sojasauce | 15 ml | 20 ml | 20 ml | 20 ml | 20 ml |
| Olivenöl (nativ extra) | – | 5 g | 10 g | 15 g | 15 g |
| **🔥 kcal** | **656** | **848** | **977** | **1090** | **1199** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **23 g** | **26 g** | **30 g** | **34 g** | **33 g** |
| **🍞 Kohlenhydrate** | **47 g** | **90 g** | **114 g** | **133 g** | **161 g** |

**Gewürze/nach Geschmack:** Ingwer, Knoblauch, Frühlingszwiebel, Chili

**Zubereitung:**

1. Reis garen und abkühlen lassen (ideal: Reis vom Vortag).
2. Tofu zerbröseln oder würfeln und im Öl 5 Minuten knusprig braten.
3. Karotte, Erbsen und Edamame dazugeben, 4 Minuten braten.
4. Reis untermischen, 3 Minuten mitbraten, mit Sojasauce und Ingwer abschmecken.

#### Ofen-Süßkartoffel mit Kichererbsen & Räuchertofu

`vgn-a3` · ⏱ 35 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Süßkartoffel (roh) | 120 g | 240 g | 390 g | 490 g | 620 g |
| Kichererbsen (Glas/Dose, abgetropft) | 100 g | 240 g | 215 g | 205 g | 170 g |
| Räuchertofu | 240 g | 180 g | 160 g | 145 g | 135 g |
| Brokkoli (frisch/TK) | 110 g | 135 g | 150 g | 150 g | 150 g |
| Tahin (Sesammus) | – | – | 10 g | 20 g | 30 g |
| **🔥 kcal** | **657** | **844** | **975** | **1086** | **1199** |
| **🍗 Protein** | **53 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **27 g** | **25 g** | **28 g** | **32 g** | **36 g** |
| **🍞 Kohlenhydrate** | **44 g** | **86 g** | **113 g** | **131 g** | **153 g** |

**Gewürze/nach Geschmack:** Paprikapulver, Kreuzkümmel, Salz, Zitrone

**Zubereitung:**

1. Ofen auf 200 °C vorheizen. Süßkartoffel würfeln, mit Kichererbsen, Paprika und Kreuzkümmel auf ein Blech geben, 25 Minuten backen.
2. Räuchertofu und Brokkoli für die letzten 12 Minuten mit aufs Blech geben.
3. Tahin mit Zitrone, Wasser und Salz zu einer Sauce rühren und darübergeben.

#### Linsen-Vollkorn-Pasta mit cremiger Tomaten-Seidentofu-Sauce

`vgn-a4` · ⏱ 12 Min. · vegan

Express-Abendessen in 12 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Nudeln aus roten Linsen (trocken, 100 % Linsenmehl) | 20 g | 65 g | 80 g | 80 g | 50 g |
| Vollkornnudeln (trocken) | 15 g | 40 g | 70 g | 85 g | 145 g |
| Edamame (TK, geschält) | 190 g | 110 g | 90 g | 75 g | 75 g |
| Seidentofu | 350 g | 240 g | 130 g | 120 g | 120 g |
| Erbsen (TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Passierte Tomaten | 150 ml | 180 ml | 200 ml | 200 ml | 200 ml |
| Olivenöl (nativ extra) | – | 10 g | 15 g | 25 g | 25 g |
| **🔥 kcal** | **656** | **845** | **973** | **1090** | **1196** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **21 g** | **26 g** | **28 g** | **37 g** | **38 g** |
| **🍞 Kohlenhydrate** | **47 g** | **83 g** | **108 g** | **117 g** | **139 g** |

**Gewürze/nach Geschmack:** Knoblauch, Salz, Oregano, Basilikum, Chili

**Zubereitung:**

1. Linsen- und Vollkornnudeln zusammen in Salzwasser nach Packungsanweisung garen (ca. 8–10 Minuten), Erbsen und Edamame die letzten 3 Minuten mitkochen.
2. Parallel passierte Tomaten mit Knoblauch, Salz und Oregano 5 Minuten köcheln lassen, dann den Seidentofu einrühren und mit dem Pürierstab cremig mixen.
3. Alles mischen und mit Olivenöl und Basilikum servieren.

#### Soja-Tofu-Gulasch mit Kartoffeln

`vgn-a5` · ⏱ 35 Min. · vegan

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Sojaschnetzel (trocken) | 40 g | 35 g | 35 g | 30 g | 30 g |
| Räuchertofu | 165 g | 145 g | 125 g | 125 g | 105 g |
| Kartoffeln (roh) | 150 g | 390 g | 540 g | 660 g | 860 g |
| Paprika | 110 g | 135 g | 150 g | 150 g | 150 g |
| Zwiebel | 60 g | 70 g | 80 g | 80 g | 80 g |
| Passierte Tomaten | 110 ml | 135 ml | 150 ml | 150 ml | 150 ml |
| Tomatenmark | 15 g | 20 g | 20 g | 20 g | 20 g |
| Olivenöl (nativ extra) | 5 g | 10 g | 15 g | 20 g | 20 g |
| **🔥 kcal** | **656** | **845** | **976** | **1090** | **1201** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **23 g** | **26 g** | **30 g** | **35 g** | **33 g** |
| **🍞 Kohlenhydrate** | **46 g** | **85 g** | **109 g** | **126 g** | **156 g** |

**Gewürze/nach Geschmack:** Gemüsebrühe, Paprikapulver edelsüß & rosenscharf, Kümmel, Majoran, Salz

**Zubereitung:**

1. Sojaschnetzel 10 Minuten in heißer Gemüsebrühe einweichen und gut ausdrücken.
2. Kartoffeln schälen, würfeln und 15–20 Minuten in Salzwasser kochen.
3. Räuchertofu würfeln. Zwiebel und Paprika würfeln, im Öl anbraten, Sojaschnetzel, Tofu und Tomatenmark 4 Minuten mitrösten.
4. Passierte Tomaten und 150 ml Wasser dazugeben, mit Paprikapulver und Kümmel 15 Minuten schmoren, mit den Kartoffeln servieren.


## 7.4 Low Carb

> Kohlenhydrate ≈ 15 % der Kalorien. Ein kleiner Teil kommt aus Kartoffeln, Reis, Hülsenfrüchten oder Beeren, der Rest wird über Fett gedeckt.

### Low Carb – Frühstück

#### Lachs-Rührei mit Avocado

`lc-f1` · ⏱ 12 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 3 Stück | 3 Stück | 2 Stück | 2 Stück | 3 Stück |
| Lachsfilet (frisch/TK) | 65 g | 50 g | 80 g | 75 g | 40 g |
| Avocado (Fruchtfleisch) | 35 g | 110 g | 130 g | 160 g | 225 g |
| Blattspinat (frisch/TK) | 60 g | 70 g | 80 g | 80 g | 80 g |
| Butter | – | 5 g | 15 g | 20 g | 15 g |
| **🔥 kcal** | **434** | **563** | **652** | **728** | **803** |
| **🍗 Protein** | **36 g** | **35 g** | **35 g** | **35 g** | **36 g** |
| **🥑 Fett** | **30 g** | **43 g** | **53 g** | **61 g** | **67 g** |
| **🍞 Kohlenhydrate** | **2 g** | **4 g** | **4 g** | **5 g** | **6 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Dill

**Zubereitung:**

1. Lachs würfeln, Eier mit Salz und Pfeffer verquirlen.
2. Butter erhitzen, Lachs 2 Minuten braten, Spinat zusammenfallen lassen.
3. Eier dazugeben und cremig stocken lassen.
4. Mit Avocadoscheiben servieren.

#### Quark-Beeren-Bowl mit Walnüssen

`lc-f2` · ⏱ 3 Min. · **Express** · vegetarisch

Express-Frühstück in 3 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Magerquark | 230 g | 180 g | 150 g | 150 g | 150 g |
| Himbeeren (frisch/TK) | 105 g | 210 g | 265 g | 280 g | 170 g |
| Walnüsse | 25 g | 30 g | 35 g | 55 g | 60 g |
| Leinsamen (geschrotet) | 10 g | 15 g | 20 g | 20 g | 30 g |
| Mandelmus (100 % Mandeln) | 5 g | 15 g | 20 g | 10 g | 15 g |
| **🔥 kcal** | **437** | **562** | **651** | **725** | **800** |
| **🍗 Protein** | **36 g** | **35 g** | **35 g** | **36 g** | **38 g** |
| **🥑 Fett** | **24 g** | **35 g** | **43 g** | **51 g** | **61 g** |
| **🍞 Kohlenhydrate** | **16 g** | **21 g** | **23 g** | **24 g** | **20 g** |

**Gewürze/nach Geschmack:** Zimt, Vanille

**Zubereitung:**

1. Magerquark mit einem Schuss Wasser cremig rühren.
2. Himbeeren (TK kurz antauen lassen) darauf verteilen.
3. Walnüsse hacken und mit Leinsamen darüberstreuen, Mandelmus darüberträufeln.

#### Hüttenkäse-Gemüse-Omelett

`lc-f3` · ⏱ 12 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 1 Stück | 1 Stück | 1 Stück | 1 Stück | 1 Stück |
| Eiklar | 75 g | 70 g | 55 g | 50 g | 50 g |
| Hüttenkäse (körniger Frischkäse) | 100 g | 80 g | 60 g | 60 g | 60 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Zucchini | 75 g | 90 g | 100 g | 100 g | 100 g |
| Olivenöl (nativ extra) | 5 g | 10 g | 10 g | 15 g | 15 g |
| Feta | 30 g | 45 g | 65 g | 65 g | 60 g |
| Avocado (Fruchtfleisch) | 40 g | 75 g | 110 g | 130 g | 185 g |
| **🔥 kcal** | **439** | **563** | **650** | **723** | **798** |
| **🍗 Protein** | **35 g** | **35 g** | **35 g** | **35 g** | **35 g** |
| **🥑 Fett** | **28 g** | **40 g** | **49 g** | **57 g** | **64 g** |
| **🍞 Kohlenhydrate** | **10 g** | **11 g** | **12 g** | **13 g** | **14 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Kräuter der Provence

**Zubereitung:**

1. Paprika und Zucchini klein würfeln und im Öl 4 Minuten braten.
2. Eier und Eiklar mit Hüttenkäse, Salz und Pfeffer verquirlen.
3. Über das Gemüse gießen, Feta darüberbröseln, mit Deckel bei mittlerer Hitze 5 Minuten stocken lassen.
4. Mit Avocadoscheiben servieren.

#### Skyr-Joghurt mit Mandeln & Heidelbeeren

`lc-f4` · ⏱ 3 Min. · **Express** · vegetarisch

Express-Frühstück in 3 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Skyr natur | 220 g | 160 g | 130 g | 120 g | 120 g |
| Griechischer Joghurt 10 % | 115 g | 185 g | 215 g | 240 g | 250 g |
| Mandeln | 25 g | 35 g | 45 g | 45 g | 50 g |
| Heidelbeeren (frisch/TK) | 30 g | 80 g | 105 g | 220 g | 295 g |
| **🔥 kcal** | **436** | **563** | **649** | **722** | **794** |
| **🍗 Protein** | **35 g** | **35 g** | **35 g** | **36 g** | **38 g** |
| **🥑 Fett** | **25 g** | **37 g** | **45 g** | **48 g** | **52 g** |
| **🍞 Kohlenhydrate** | **17 g** | **22 g** | **24 g** | **33 g** | **40 g** |

**Gewürze/nach Geschmack:** Zimt

**Zubereitung:**

1. Skyr und griechischen Joghurt verrühren.
2. Heidelbeeren daraufgeben.
3. Mandeln grob hacken und darüberstreuen.

#### Chia-Skyr-Pudding mit Kokos & Himbeeren

`lc-f5` · ⏱ 5 Min. · **Express** · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Skyr natur | 250 g | 190 g | 150 g | 150 g | 150 g |
| Chiasamen | 20 g | 30 g | 35 g | 35 g | 40 g |
| Kokosraspeln | 10 g | 15 g | 15 g | 25 g | 40 g |
| Mandeln | 15 g | 25 g | 35 g | 35 g | 30 g |
| Himbeeren (frisch/TK) | 105 g | 185 g | 275 g | 300 g | 255 g |
| **🔥 kcal** | **437** | **564** | **652** | **726** | **800** |
| **🍗 Protein** | **36 g** | **35 g** | **34 g** | **35 g** | **36 g** |
| **🥑 Fett** | **21 g** | **32 g** | **39 g** | **45 g** | **54 g** |
| **🍞 Kohlenhydrate** | **17 g** | **20 g** | **24 g** | **26 g** | **24 g** |

**Gewürze/nach Geschmack:** Vanille

**Zubereitung:**

1. Skyr mit Chiasamen und 50 ml Wasser verrühren.
2. Mindestens 15 Minuten (oder über Nacht) quellen lassen.
3. Mit Himbeeren, Kokosraspeln und gehackten Mandeln toppen.

> Hinweis: 5 Min. + 15 Min. Quellzeit.

### Low Carb – Mittagessen

#### Lachs & Garnelen mit Brokkoli-Blumenkohl in Kräuter-Sahne

`lc-m1` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Lachsfilet (frisch/TK) | 150 g | 120 g | 120 g | 110 g | 105 g |
| Garnelen (roh, geschält, TK) | 75 g | 80 g | 70 g | 70 g | 65 g |
| Brokkoli (frisch/TK) | 150 g | 180 g | 200 g | 200 g | 200 g |
| Blumenkohl (frisch/TK) | 150 g | 180 g | 200 g | 200 g | 200 g |
| Butter | 5 g | 10 g | 20 g | 20 g | 25 g |
| Schlagsahne 30 % | 30 ml | 75 ml | 85 ml | 120 ml | 140 ml |
| Mandeln | 15 g | 25 g | 30 g | 35 g | 40 g |
| **🔥 kcal** | **654** | **841** | **976** | **1088** | **1198** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **42 g** | **61 g** | **75 g** | **86 g** | **98 g** |
| **🍞 Kohlenhydrate** | **9 g** | **13 g** | **15 g** | **16 g** | **17 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Knoblauch, Petersilie, Zitrone

**Zubereitung:**

1. Brokkoli und Blumenkohl in Röschen teilen und 6–8 Minuten dämpfen.
2. Lachs salzen und in einer Pfanne auf der Hautseite 4 Minuten, dann 2 Minuten auf der anderen Seite braten.
3. Garnelen in der Pfanne 2–3 Minuten mitbraten.
4. Butter mit Knoblauch in der Pfanne aufschäumen, Sahne dazugeben und 2 Minuten zu einer Kräuter-Sahnesauce einkochen.
5. Über Fisch und Gemüse geben und mit gehobelten, kurz gerösteten Mandeln bestreuen.

#### Hähnchen-Caesar-Salat mit Avocado & Walnüssen

`lc-m2` · ⏱ 20 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hähnchenbrustfilet | 175 g | 155 g | 145 g | 120 g | 105 g |
| Parmesan | 15 g | 15 g | 15 g | 15 g | 15 g |
| Blattsalat (z. B. Romana, Rucola) | 110 g | 135 g | 150 g | 150 g | 150 g |
| Olivenöl (nativ extra) | 10 g | 15 g | 20 g | 20 g | 20 g |
| Griechischer Joghurt 10 % | 55 g | 95 g | 120 g | 215 g | 250 g |
| Avocado (Fruchtfleisch) | 60 g | 90 g | 110 g | 105 g | 120 g |
| Walnüsse | 20 g | 30 g | 35 g | 40 g | 50 g |
| **🔥 kcal** | **654** | **843** | **974** | **1087** | **1203** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **45 g** | **64 g** | **78 g** | **90 g** | **102 g** |
| **🍞 Kohlenhydrate** | **6 g** | **10 g** | **12 g** | **16 g** | **18 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Senf, Knoblauch, Zitronensaft, optional Sardellen

**Zubereitung:**

1. Hähnchen würzen und in einer beschichteten Pfanne mit etwas vom Öl 6–8 Minuten braten, in Streifen schneiden.
2. Griechischen Joghurt mit restlichem Öl, Zitronensaft, Senf, Knoblauch und der Hälfte des geriebenen Parmesans zu einem Dressing rühren.
3. Romana zerkleinern, mit Dressing mischen, Hähnchen, Avocadowürfel, Walnüsse und restlichen Parmesan daraufgeben.

#### Rinderhack-Gemüse-Pfanne mit Feta & Bohnen

`lc-m3` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhack mager (ca. 5 % Fett, Tatar) | 180 g | 165 g | 145 g | 125 g | 115 g |
| Feta | 40 g | 25 g | 30 g | 25 g | 30 g |
| Kidneybohnen (Glas/Dose, abgetropft) | 35 g | 45 g | 45 g | 110 g | 130 g |
| Zucchini | 150 g | 180 g | 200 g | 200 g | 200 g |
| Paprika | 110 g | 135 g | 150 g | 150 g | 150 g |
| Zwiebel | 40 g | 45 g | 50 g | 50 g | 50 g |
| Olivenöl (nativ extra) | 10 g | 25 g | 30 g | 40 g | 50 g |
| Griechischer Joghurt 10 % | 105 g | 180 g | 250 g | 250 g | 250 g |
| **🔥 kcal** | **655** | **845** | **972** | **1088** | **1197** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **38 g** | **57 g** | **69 g** | **78 g** | **89 g** |
| **🍞 Kohlenhydrate** | **19 g** | **26 g** | **30 g** | **38 g** | **40 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver, Kreuzkümmel, Oregano

**Zubereitung:**

1. Zwiebel, Zucchini und Paprika würfeln.
2. Öl erhitzen, Hack krümelig anbraten, Gemüse dazugeben und 6 Minuten braten.
3. Kidneybohnen untermischen, mit Paprika, Kreuzkümmel, Salz und Pfeffer würzen.
4. Feta darüberbröseln und mit einem Klecks griechischem Joghurt (mit Knoblauch und Salz verrührt) servieren.

#### Thunfisch-Avocado-Salat mit Ei

`lc-m4` · ⏱ 10 Min. · **Express**

Express-Mittagessen.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Thunfisch im eigenen Saft (abgetropft) | 145 g | 135 g | 130 g | 130 g | 135 g |
| Eier (Größe M) | 2 Stück | 2 Stück | 2 Stück | 2 Stück | 2 Stück |
| Avocado (Fruchtfleisch) | 115 g | 180 g | 235 g | 250 g | 250 g |
| Olivenöl (nativ extra) | 15 g | 25 g | 30 g | 40 g | 50 g |
| Blattsalat (z. B. Romana, Rucola) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Salatgurke | 75 g | 90 g | 100 g | 100 g | 100 g |
| **🔥 kcal** | **660** | **846** | **975** | **1088** | **1182** |
| **🍗 Protein** | **55 g** | **54 g** | **54 g** | **55 g** | **56 g** |
| **🥑 Fett** | **44 g** | **64 g** | **77 g** | **89 g** | **99 g** |
| **🍞 Kohlenhydrate** | **6 g** | **7 g** | **9 g** | **9 g** | **9 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Zitronensaft, rote Zwiebel optional

**Zubereitung:**

1. Eier 8 Minuten kochen (oder vorgekochte nehmen), pellen und vierteln.
2. Salat und Gurke zerkleinern, Avocado würfeln, Thunfisch abtropfen lassen.
3. Alles mit Olivenöl, Zitronensaft, Salz und Pfeffer vermengen.

#### Hähnchen-Kokos-Curry mit Blumenkohlreis

`lc-m5` · ⏱ 30 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hähnchenbrustfilet | 175 g | 160 g | 145 g | 135 g | 120 g |
| Blumenkohl (frisch/TK) | 225 g | 270 g | 300 g | 300 g | 300 g |
| Blattspinat (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Zwiebel | 30 g | 35 g | 40 g | 40 g | 40 g |
| Kokosmilch (vollfett, Dose) | 165 ml | 255 ml | 320 ml | 375 ml | 400 ml |
| Erbsen (TK) | 70 g | 85 g | 95 g | 115 g | 200 g |
| **🔥 kcal** | **655** | **844** | **975** | **1089** | **1190** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **39 g** | **58 g** | **71 g** | **83 g** | **88 g** |
| **🍞 Kohlenhydrate** | **19 g** | **25 g** | **29 g** | **33 g** | **43 g** |

**Gewürze/nach Geschmack:** Currypaste, Ingwer, Knoblauch, Salz, Limette

**Zubereitung:**

1. Blumenkohl in der Küchenmaschine oder mit einer Reibe zu "Reis" zerkleinern.
2. Hähnchen würfeln und in einer beschichteten Pfanne anbraten, Zwiebel und Currypaste 1 Minute mitrösten.
3. Kokosmilch und Erbsen dazugeben, 8 Minuten köcheln lassen, Spinat unterheben.
4. Blumenkohlreis in einer zweiten Pfanne 4–5 Minuten dünsten, salzen und zum Curry servieren.

### Low Carb – Abendessen

#### Rindersteak mit Ofengemüse, Süßkartoffel & Joghurt-Dip

`lc-a1` · ⏱ 30 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhüftsteak | 205 g | 180 g | 170 g | 170 g | 165 g |
| Süßkartoffel (roh) | 80 g | 100 g | 110 g | 170 g | 200 g |
| Zucchini | 110 g | 135 g | 150 g | 150 g | 150 g |
| Paprika | 110 g | 135 g | 150 g | 150 g | 150 g |
| Olivenöl (nativ extra) | 15 g | 25 g | 35 g | 40 g | 50 g |
| Griechischer Joghurt 10 % | 130 g | 210 g | 245 g | 250 g | 250 g |
| **🔥 kcal** | **658** | **843** | **977** | **1079** | **1188** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **56 g** | **55 g** |
| **🥑 Fett** | **36 g** | **53 g** | **66 g** | **72 g** | **82 g** |
| **🍞 Kohlenhydrate** | **29 g** | **38 g** | **43 g** | **55 g** | **61 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Rosmarin, Thymian, Knoblauch, Zitrone

**Zubereitung:**

1. Ofen auf 200 °C vorheizen. Süßkartoffel, Zucchini und Paprika in Stücke schneiden, mit dem Öl, Salz und Rosmarin mischen, 25 Minuten backen.
2. Steak in einer sehr heißen Pfanne je Seite 2–3 Minuten braten, 3 Minuten ruhen lassen.
3. Griechischen Joghurt mit Knoblauch, Zitrone und Salz verrühren.
4. Steak in Scheiben schneiden und mit Gemüse und Dip servieren.

#### Kabeljau in Senf-Sahne mit Brokkoli & Kartoffeln

`lc-a2` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Kabeljau- oder Seelachsfilet | 245 g | 230 g | 220 g | 210 g | 205 g |
| Kartoffeln (roh) | 150 g | 180 g | 220 g | 250 g | 270 g |
| Brokkoli (frisch/TK) | 190 g | 225 g | 250 g | 250 g | 250 g |
| Schlagsahne 30 % | 75 ml | 120 ml | 155 ml | 190 ml | 225 ml |
| Butter | 10 g | 15 g | 15 g | 15 g | 15 g |
| **🔥 kcal** | **654** | **843** | **973** | **1089** | **1202** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **33 g** | **51 g** | **62 g** | **72 g** | **83 g** |
| **🍞 Kohlenhydrate** | **30 g** | **37 g** | **45 g** | **50 g** | **55 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Senf, Dill, Zitrone

**Zubereitung:**

1. Kartoffeln würfeln und 15 Minuten in Salzwasser kochen, Brokkoli die letzten 5 Minuten mitgaren.
2. Kabeljau salzen und in der Butter je Seite 3 Minuten braten, herausnehmen.
3. Sahne mit 1 TL Senf in die Pfanne geben, kurz aufkochen, mit Dill abschmecken.
4. Fisch mit Sauce, Kartoffeln und Brokkoli servieren.

#### Putenbrust mit Kräuterquark, Gemüse & Kichererbsen

`lc-a3` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Putenbrustfilet | 135 g | 115 g | 100 g | 100 g | 90 g |
| Magerquark | 80 g | 80 g | 80 g | 60 g | 60 g |
| Kichererbsen (Glas/Dose, abgetropft) | 125 g | 170 g | 200 g | 235 g | 260 g |
| Zucchini | 150 g | 180 g | 200 g | 200 g | 200 g |
| Paprika | 110 g | 135 g | 150 g | 150 g | 150 g |
| Olivenöl (nativ extra) | 15 g | 20 g | 25 g | 30 g | 35 g |
| Avocado (Fruchtfleisch) | 70 g | 130 g | 165 g | 190 g | 220 g |
| **🔥 kcal** | **656** | **844** | **974** | **1088** | **1201** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **31 g** | **46 g** | **57 g** | **66 g** | **76 g** |
| **🍞 Kohlenhydrate** | **30 g** | **39 g** | **44 g** | **49 g** | **52 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver, Kräuter, Knoblauch

**Zubereitung:**

1. Zucchini und Paprika in Streifen schneiden, Kichererbsen abspülen.
2. Pute würzen und im Öl je Seite 4–5 Minuten braten, herausnehmen.
3. Gemüse und Kichererbsen in der Pfanne 6 Minuten braten.
4. Quark mit Kräutern, Knoblauch, Salz und etwas Wasser verrühren und mit Avocadoscheiben dazu servieren.

#### Garnelen-Zucchini-Pfanne mit Feta & etwas Reis

`lc-a4` · ⏱ 15 Min.

Schnelles Abendessen in 15 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Garnelen (roh, geschält, TK) | 205 g | 170 g | 170 g | 165 g | 160 g |
| Basmatireis (trocken) | 30 g | 40 g | 40 g | 45 g | 70 g |
| Zucchini | 225 g | 270 g | 300 g | 300 g | 300 g |
| Tomaten | 110 g | 135 g | 150 g | 150 g | 150 g |
| Knoblauch | 5 g | 5 g | 5 g | 5 g | 5 g |
| Olivenöl (nativ extra) | 15 g | 25 g | 40 g | 50 g | 50 g |
| Feta | 70 g | 100 g | 95 g | 100 g | 100 g |
| **🔥 kcal** | **657** | **845** | **972** | **1088** | **1171** |
| **🍗 Protein** | **56 g** | **55 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **33 g** | **50 g** | **64 g** | **75 g** | **75 g** |
| **🍞 Kohlenhydrate** | **33 g** | **43 g** | **44 g** | **48 g** | **67 g** |

**Gewürze/nach Geschmack:** Salz, Chiliflocken, Zitrone, Petersilie

**Zubereitung:**

1. Reis nach Packungsanweisung garen (oder Reis vom Vortag nutzen).
2. Zucchini würfeln, Tomaten vierteln, Knoblauch hacken.
3. Öl erhitzen, Garnelen 2–3 Minuten braten, Zucchini, Tomaten und Knoblauch dazugeben, 5 Minuten braten.
4. Feta darüberbröseln, mit Zitrone, Chili und Petersilie abschmecken, mit Reis servieren.

#### Hähnchen-Brokkoli-Auflauf mit Mozzarella

`lc-a5` · ⏱ 35 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hähnchenbrustfilet | 145 g | 135 g | 125 g | 120 g | 115 g |
| Mozzarella | 50 g | 45 g | 50 g | 45 g | 45 g |
| Brokkoli (frisch/TK) | 225 g | 270 g | 300 g | 300 g | 300 g |
| Kartoffeln (roh) | 140 g | 170 g | 200 g | 240 g | 260 g |
| Schlagsahne 30 % | 70 ml | 130 ml | 165 ml | 200 ml | 235 ml |
| **🔥 kcal** | **655** | **842** | **976** | **1089** | **1200** |
| **🍗 Protein** | **54 g** | **54 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **34 g** | **51 g** | **62 g** | **72 g** | **82 g** |
| **🍞 Kohlenhydrate** | **30 g** | **37 g** | **44 g** | **51 g** | **55 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Muskat, Knoblauch

**Zubereitung:**

1. Ofen auf 200 °C vorheizen. Kartoffeln in dünne Scheiben schneiden, Brokkoli in Röschen, Hähnchen in Würfel.
2. Alles in eine Auflaufform geben, Sahne mit Salz, Pfeffer, Muskat und Knoblauch verrühren und darübergießen.
3. Mit Mozzarella belegen und 25 Minuten backen, bis die Kartoffeln weich sind.


## 7.5 Ketogen

> Kohlenhydrate pro Tag bei jeder Kombination ≈ 10–40 g. Das Fett steigt mit der Kalorienstufe stark an. Das ist bei Keto gewollt.

### Ketogen – Frühstück

#### Rührei mit Bacon & Avocado

`keto-f1` · ⏱ 12 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 3 Stück | 3 Stück | 3 Stück | 3 Stück | 3 Stück |
| Eiklar | 100 g | 90 g | 90 g | 85 g | 80 g |
| Bauchspeck / Bacon (am Stück oder Scheiben) | 20 g | 20 g | 20 g | 20 g | 20 g |
| Avocado (Fruchtfleisch) | 20 g | 80 g | 110 g | 135 g | 160 g |
| Butter | 5 g | 10 g | 15 g | 20 g | 25 g |
| **🔥 kcal** | **437** | **565** | **650** | **724** | **799** |
| **🍗 Protein** | **35 g** | **35 g** | **36 g** | **36 g** | **36 g** |
| **🥑 Fett** | **31 g** | **44 g** | **52 g** | **60 g** | **68 g** |
| **🍞 Kohlenhydrate** | **2 g** | **3 g** | **4 g** | **5 g** | **5 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Schnittlauch

**Zubereitung:**

1. Bacon in einer Pfanne ohne Fett knusprig braten, herausnehmen.
2. Eier und Eiklar verquirlen, Butter in die Pfanne geben, Eimasse cremig stocken lassen.
3. Mit Bacon und Avocadoscheiben servieren.

#### Hüttenkäse-Bowl mit Walnüssen, Kokos & Himbeeren

`keto-f2` · ⏱ 3 Min. · **Express** · vegetarisch

Express-Frühstück in 3 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hüttenkäse (körniger Frischkäse) | 260 g | 230 g | 230 g | 210 g | 200 g |
| Schlagsahne 30 % | 15 ml | 20 ml | 30 ml | 50 ml | 55 ml |
| Walnüsse | 10 g | 30 g | 25 g | 40 g | 45 g |
| Kokosraspeln | 10 g | 10 g | 25 g | 15 g | 20 g |
| Himbeeren (frisch/TK) | 30 g | 35 g | 40 g | 40 g | 40 g |
| **🔥 kcal** | **440** | **558** | **653** | **725** | **795** |
| **🍗 Protein** | **35 g** | **35 g** | **35 g** | **35 g** | **35 g** |
| **🥑 Fett** | **29 g** | **42 g** | **51 g** | **60 g** | **67 g** |
| **🍞 Kohlenhydrate** | **10 g** | **11 g** | **12 g** | **13 g** | **13 g** |

**Gewürze/nach Geschmack:** Zimt, Vanille

**Zubereitung:**

1. Hüttenkäse mit der Sahne verrühren.
2. Walnüsse hacken und mit Kokosraspeln und Himbeeren darübergeben.

#### Käse-Spinat-Omelett

`keto-f3` · ⏱ 10 Min. · **Express** · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 3 Stück | 3 Stück | 3 Stück | 3 Stück | 3 Stück |
| Gouda (mittelalt) | 40 g | 40 g | 40 g | 40 g | 40 g |
| Blattspinat (frisch/TK) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Butter | 5 g | 15 g | 25 g | 30 g | 35 g |
| Schlagsahne 30 % | – | 20 ml | 25 ml | 35 ml | 50 ml |
| **🔥 kcal** | **430** | **566** | **657** | **723** | **804** |
| **🍗 Protein** | **33 g** | **34 g** | **34 g** | **35 g** | **35 g** |
| **🥑 Fett** | **31 g** | **46 g** | **56 g** | **63 g** | **71 g** |
| **🍞 Kohlenhydrate** | **2 g** | **2 g** | **3 g** | **3 g** | **4 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Muskat

**Zubereitung:**

1. Eier mit Sahne, Salz und Pfeffer verquirlen.
2. Butter erhitzen, Spinat zusammenfallen lassen, Eimasse darübergießen.
3. Geriebenen Gouda darüberstreuen, mit Deckel 4–5 Minuten stocken lassen und zusammenklappen.

#### Avocado-Hüttenkäse-Bowl mit Ei

`keto-f4` · ⏱ 10 Min. · **Express** · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hüttenkäse (körniger Frischkäse) | 160 g | 140 g | 140 g | 140 g | 130 g |
| Eier (Größe M) | 2 Stück | 2 Stück | 2 Stück | 2 Stück | 2 Stück |
| Avocado (Fruchtfleisch) | 45 g | 135 g | 160 g | 180 g | 235 g |
| Olivenöl (nativ extra) | 5 g | 5 g | 10 g | 15 g | 15 g |
| Salatgurke | 60 g | 70 g | 80 g | 80 g | 80 g |
| **🔥 kcal** | **438** | **564** | **649** | **726** | **804** |
| **🍗 Protein** | **35 g** | **34 g** | **35 g** | **35 g** | **35 g** |
| **🥑 Fett** | **29 g** | **41 g** | **50 g** | **58 g** | **66 g** |
| **🍞 Kohlenhydrate** | **7 g** | **8 g** | **9 g** | **9 g** | **10 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Chiliflocken, Schnittlauch

**Zubereitung:**

1. Eier 8 Minuten kochen (oder vorgekochte nehmen), pellen und vierteln.
2. Avocado und Gurke würfeln.
3. Hüttenkäse in eine Schüssel geben, Avocado, Gurke und Eier daraufgeben, mit Olivenöl beträufeln, salzen, pfeffern und mit Chiliflocken bestreuen.

#### Lachs-Ei-Teller mit Frischkäse

`keto-f5` · ⏱ 15 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Lachsfilet (frisch/TK) | 100 g | 85 g | 80 g | 70 g | 65 g |
| Eier (Größe M) | 2 Stück | 2 Stück | 2 Stück | 2 Stück | 2 Stück |
| Salatgurke | 75 g | 90 g | 100 g | 100 g | 100 g |
| Frischkäse Doppelrahmstufe | 10 g | 50 g | 70 g | 105 g | 120 g |
| Olivenöl (nativ extra) | 5 g | 10 g | 15 g | 15 g | 20 g |
| **🔥 kcal** | **438** | **562** | **652** | **726** | **801** |
| **🍗 Protein** | **35 g** | **34 g** | **35 g** | **35 g** | **35 g** |
| **🥑 Fett** | **31 g** | **45 g** | **54 g** | **62 g** | **70 g** |
| **🍞 Kohlenhydrate** | **2 g** | **4 g** | **5 g** | **6 g** | **6 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Dill, Zitrone

**Zubereitung:**

1. Eier 8 Minuten kochen, abschrecken und pellen.
2. Lachs salzen und im Öl je Seite 3 Minuten braten.
3. Mit Eiern, Gurkenscheiben und Frischkäse (mit Dill verrührt) anrichten.

### Ketogen – Mittagessen

#### Lachs in Spinat-Sahne mit Parmesan

`keto-m1` · ⏱ 20 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Lachsfilet (frisch/TK) | 210 g | 205 g | 205 g | 205 g | 200 g |
| Parmesan | 20 g | 20 g | 15 g | 15 g | 15 g |
| Blattspinat (frisch/TK) | 150 g | 180 g | 200 g | 200 g | 200 g |
| Schlagsahne 30 % | 30 ml | 70 ml | 110 ml | 135 ml | 165 ml |
| Butter | 5 g | 15 g | 20 g | 25 g | 30 g |
| **🔥 kcal** | **656** | **843** | **980** | **1090** | **1205** |
| **🍗 Protein** | **54 g** | **55 g** | **55 g** | **56 g** | **55 g** |
| **🥑 Fett** | **47 g** | **67 g** | **81 g** | **93 g** | **106 g** |
| **🍞 Kohlenhydrate** | **2 g** | **3 g** | **5 g** | **6 g** | **7 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Knoblauch, Muskat, Zitrone

**Zubereitung:**

1. Lachs salzen und in der Butter je Seite 3–4 Minuten braten, herausnehmen.
2. Knoblauch und Spinat in die Pfanne geben, zusammenfallen lassen.
3. Sahne und geriebenen Parmesan einrühren, 2 Minuten einkochen lassen.
4. Lachs zurück in die Sauce legen und servieren.

#### Burger-Bowl ohne Brötchen

`keto-m2` · ⏱ 20 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhackfleisch (ca. 15–20 % Fett) | 225 g | 230 g | 230 g | 215 g | 215 g |
| Gouda (mittelalt) | 40 g | 40 g | 35 g | 40 g | 35 g |
| Blattsalat (z. B. Romana, Rucola) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Tomaten | 75 g | 90 g | 100 g | 100 g | 100 g |
| Salatgurke | 60 g | 70 g | 80 g | 80 g | 80 g |
| Avocado (Fruchtfleisch) | – | 75 g | 110 g | 190 g | 215 g |
| Olivenöl (nativ extra) | – | 5 g | 15 g | 15 g | 25 g |
| **🔥 kcal** | **662** | **844** | **975** | **1089** | **1199** |
| **🍗 Protein** | **53 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **48 g** | **65 g** | **78 g** | **89 g** | **101 g** |
| **🍞 Kohlenhydrate** | **4 g** | **6 g** | **8 g** | **9 g** | **10 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Senf, Essiggurke

**Zubereitung:**

1. Hackfleisch würzen, zu 2 Patties formen und im Öl je Seite 3–4 Minuten braten; zum Schluss Gouda darauf schmelzen lassen.
2. Salat, Tomaten, Gurke und Avocado schneiden und in einer Schüssel anrichten.
3. Patties daraufsetzen, mit Senf und Essiggurke servieren.

#### Ofen-Hähnchenschenkel mit Brokkoli, Kräuter-Frischkäse & Mandeln

`keto-m3` · ⏱ 35 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hähnchenschenkel ohne Haut & Knochen | 205 g | 185 g | 160 g | 145 g | 140 g |
| Brokkoli (frisch/TK) | 190 g | 225 g | 250 g | 250 g | 250 g |
| Butter | 10 g | 20 g | 25 g | 30 g | 40 g |
| Frischkäse Doppelrahmstufe | 50 g | 75 g | 95 g | 110 g | 115 g |
| Mandeln | 25 g | 35 g | 45 g | 55 g | 60 g |
| **🔥 kcal** | **657** | **843** | **970** | **1087** | **1198** |
| **🍗 Protein** | **55 g** | **56 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **44 g** | **63 g** | **76 g** | **89 g** | **100 g** |
| **🍞 Kohlenhydrate** | **8 g** | **11 g** | **12 g** | **14 g** | **14 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver, Knoblauch, Petersilie

**Zubereitung:**

1. Ofen auf 200 °C vorheizen. Hähnchenschenkel mit Salz, Paprika und Knoblauch würzen, 25–30 Minuten backen.
2. Brokkoli die letzten 12 Minuten mit aufs Blech geben.
3. Frischkäse mit gehackten Kräutern, Knoblauch und 2 EL Wasser glatt rühren; Butter schmelzen.
4. Fleisch und Brokkoli mit Butter beträufeln, Kräuter-Frischkäse dazu reichen, mit gehackten Mandeln bestreuen.

> Hinweis: Aktive Zeit ca. 10 Minuten.

#### Thunfisch-Mozzarella-Salat mit Avocado

`keto-m4` · ⏱ 8 Min. · **Express**

Express-Mittagessen in 8 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Thunfisch im eigenen Saft (abgetropft) | 120 g | 115 g | 115 g | 110 g | 105 g |
| Mozzarella | 110 g | 105 g | 95 g | 95 g | 90 g |
| Blattsalat (z. B. Romana, Rucola) | 75 g | 90 g | 100 g | 100 g | 100 g |
| Tomaten | 75 g | 90 g | 100 g | 100 g | 100 g |
| Olivenöl (nativ extra) | 10 g | 20 g | 25 g | 30 g | 35 g |
| Avocado (Fruchtfleisch) | 45 g | 95 g | 120 g | 145 g | 180 g |
| Walnüsse | 10 g | 15 g | 25 g | 30 g | 35 g |
| **🔥 kcal** | **657** | **846** | **974** | **1085** | **1200** |
| **🍗 Protein** | **55 g** | **55 g** | **56 g** | **56 g** | **55 g** |
| **🥑 Fett** | **46 g** | **65 g** | **79 g** | **90 g** | **103 g** |
| **🍞 Kohlenhydrate** | **6 g** | **8 g** | **9 g** | **10 g** | **11 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Balsamico (1 TL), Basilikum

**Zubereitung:**

1. Salat zerkleinern, Tomaten, Avocado und Mozzarella würfeln, Thunfisch abtropfen lassen.
2. Alles mit Olivenöl, Balsamico, Salz, Pfeffer und Basilikum vermengen, gehackte Walnüsse darüberstreuen.

#### Putengeschnetzeltes in Champignon-Rahm

`keto-m5` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Putenbrustfilet | 200 g | 190 g | 185 g | 180 g | 180 g |
| Champignons | 150 g | 180 g | 200 g | 200 g | 200 g |
| Zwiebel | 20 g | 25 g | 30 g | 30 g | 30 g |
| Schlagsahne 30 % | 100 ml | 155 ml | 185 ml | 225 ml | 250 ml |
| Butter | 15 g | 20 g | 25 g | 25 g | 30 g |
| **🔥 kcal** | **653** | **848** | **974** | **1085** | **1195** |
| **🍗 Protein** | **55 g** | **55 g** | **56 g** | **55 g** | **56 g** |
| **🥑 Fett** | **45 g** | **66 g** | **79 g** | **91 g** | **102 g** |
| **🍞 Kohlenhydrate** | **5 g** | **7 g** | **9 g** | **10 g** | **11 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver, Petersilie

**Zubereitung:**

1. Pute in Streifen schneiden, Champignons in Scheiben, Zwiebel fein würfeln.
2. Pute in der Butter 4 Minuten scharf anbraten, herausnehmen.
3. Champignons und Zwiebel 5 Minuten braten, Sahne dazugeben, 3 Minuten einkochen lassen.
4. Pute zurückgeben, mit Salz, Pfeffer und Petersilie abschmecken.

### Ketogen – Abendessen

#### Rindersteak mit Speckbohnen, Mandeln & Kräuterbutter

`keto-a1` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhüftsteak | 195 g | 170 g | 160 g | 135 g | 135 g |
| Grüne Bohnen (frisch/TK) | 150 g | 180 g | 200 g | 200 g | 200 g |
| Butter | 15 g | 25 g | 35 g | 35 g | 50 g |
| Bauchspeck / Bacon (am Stück oder Scheiben) | 30 g | 55 g | 65 g | 70 g | 65 g |
| Mandeln | 25 g | 30 g | 35 g | 55 g | 60 g |
| **🔥 kcal** | **658** | **841** | **978** | **1084** | **1204** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **44 g** | **64 g** | **78 g** | **89 g** | **102 g** |
| **🍞 Kohlenhydrate** | **9 g** | **11 g** | **12 g** | **14 g** | **14 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Knoblauch, Thymian, Petersilie

**Zubereitung:**

1. Bohnen 8 Minuten in Salzwasser garen und abgießen.
2. Bacon würfeln und knusprig braten, Bohnen und gehobelte Mandeln darin 2 Minuten schwenken.
3. Steak in einer sehr heißen Pfanne je Seite 2–3 Minuten braten, 3 Minuten ruhen lassen.
4. Butter mit gehackten Kräutern und Knoblauch verkneten oder in der Pfanne aufschäumen und über Steak und Bohnen geben.

#### Lachs mit Zucchini-Nudeln & Walnuss-Pesto

`keto-a2` · ⏱ 20 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Lachsfilet (frisch/TK) | 195 g | 185 g | 175 g | 175 g | 160 g |
| Parmesan | 30 g | 25 g | 25 g | 25 g | 30 g |
| Zucchini | 225 g | 270 g | 300 g | 300 g | 300 g |
| Walnüsse | 15 g | 35 g | 45 g | 55 g | 60 g |
| Olivenöl (nativ extra) | – | 10 g | 20 g | 25 g | 35 g |
| **🔥 kcal** | **652** | **840** | **979** | **1089** | **1200** |
| **🍗 Protein** | **55 g** | **54 g** | **54 g** | **56 g** | **55 g** |
| **🥑 Fett** | **44 g** | **65 g** | **80 g** | **92 g** | **104 g** |
| **🍞 Kohlenhydrate** | **6 g** | **8 g** | **10 g** | **10 g** | **11 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Basilikum, Knoblauch, Zitrone

**Zubereitung:**

1. Zucchini mit einem Spiralschneider oder Sparschäler zu Nudeln schneiden.
2. Lachs salzen und mit etwas Öl je Seite 3–4 Minuten braten.
3. Zucchini-Nudeln 2 Minuten in der Pfanne schwenken.
4. Restliches Öl mit Walnüssen, Basilikum, Knoblauch und geriebenem Parmesan zu einem Pesto mixen und darübergeben.

#### Hähnchen-Brokkoli-Käse-Auflauf

`keto-a3` · ⏱ 35 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hähnchenbrustfilet | 160 g | 160 g | 150 g | 150 g | 145 g |
| Gouda (mittelalt) | 45 g | 40 g | 40 g | 40 g | 40 g |
| Brokkoli (frisch/TK) | 150 g | 180 g | 200 g | 200 g | 200 g |
| Schlagsahne 30 % | 70 ml | 110 ml | 145 ml | 170 ml | 200 ml |
| Butter | 10 g | 20 g | 25 g | 30 g | 35 g |
| **🔥 kcal** | **660** | **842** | **976** | **1086** | **1205** |
| **🍗 Protein** | **55 g** | **56 g** | **55 g** | **56 g** | **55 g** |
| **🥑 Fett** | **45 g** | **64 g** | **78 g** | **90 g** | **103 g** |
| **🍞 Kohlenhydrate** | **6 g** | **8 g** | **10 g** | **11 g** | **12 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Muskat, Knoblauch

**Zubereitung:**

1. Ofen auf 200 °C vorheizen. Hähnchen würfeln, Brokkoli in Röschen teilen.
2. Form mit der Butter ausstreichen, Hähnchen und Brokkoli hineingeben, Sahne mit Salz, Pfeffer, Muskat und Knoblauch würzen und darübergießen.
3. Mit geriebenem Gouda bestreuen und 25 Minuten backen.

#### Knoblauch-Rahm-Garnelen mit Spinat

`keto-a4` · ⏱ 12 Min.

Express-Abendessen in 12 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Garnelen (roh, geschält, TK) | 265 g | 245 g | 240 g | 240 g | 235 g |
| Blattspinat (frisch/TK) | 150 g | 180 g | 200 g | 200 g | 200 g |
| Knoblauch | 10 g | 10 g | 10 g | 10 g | 10 g |
| Butter | 20 g | 30 g | 40 g | 45 g | 50 g |
| Schlagsahne 30 % | 85 ml | 130 ml | 150 ml | 175 ml | 200 ml |
| **🔥 kcal** | **652** | **848** | **980** | **1090** | **1196** |
| **🍗 Protein** | **56 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **45 g** | **67 g** | **81 g** | **93 g** | **104 g** |
| **🍞 Kohlenhydrate** | **7 g** | **8 g** | **9 g** | **10 g** | **11 g** |

**Gewürze/nach Geschmack:** Salz, Chiliflocken, Zitrone, Petersilie

**Zubereitung:**

1. Garnelen auftauen und trocken tupfen, Knoblauch fein hacken.
2. Butter in einer Pfanne aufschäumen, Garnelen und Knoblauch 3 Minuten braten.
3. Sahne angießen, Spinat dazugeben und zusammenfallen lassen, 2 Minuten einkochen, mit Zitrone und Chili abschmecken.

#### Hackpfanne mit Zucchini, Feta & Avocado

`keto-a5` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhack mager (ca. 5 % Fett, Tatar) | 205 g | 200 g | 195 g | 185 g | 175 g |
| Feta | 50 g | 45 g | 45 g | 50 g | 65 g |
| Zucchini | 150 g | 180 g | 200 g | 200 g | 200 g |
| Paprika | 45 g | 55 g | 60 g | 60 g | 60 g |
| Olivenöl (nativ extra) | 10 g | 20 g | 25 g | 30 g | 40 g |
| Avocado (Fruchtfleisch) | 85 g | 155 g | 210 g | 250 g | 250 g |
| **🔥 kcal** | **654** | **844** | **975** | **1084** | **1199** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **43 g** | **62 g** | **75 g** | **87 g** | **100 g** |
| **🍞 Kohlenhydrate** | **8 g** | **10 g** | **12 g** | **13 g** | **13 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Oregano, Paprikapulver

**Zubereitung:**

1. Zucchini und Paprika würfeln.
2. Öl erhitzen, Hack krümelig anbraten, Gemüse dazugeben und 6–8 Minuten braten.
3. Mit Oregano, Paprika, Salz und Pfeffer würzen, Feta darüberbröseln.
4. Mit Avocadowürfeln servieren.


## 7.6 Ray Peat

> Nach Ray Peat: viel Milchprodukte, Eier, Gelatine, Obst/Säfte, Honig, Kartoffeln, weißer Reis, Masa, Schalentiere, weißer Fisch, Rind. Keine Pflanzenöle mit vielen mehrfach ungesättigten Fettsäuren (Fett nur aus Butter, Kokosöl, Milchfett), keine Nüsse/Samen, keine Hülsenfrüchte, kein Getreide außer Reis und Masa.

### Ray Peat – Frühstück

#### Eier, Hüttenkäse & frischer Orangensaft

`rp-f1` · ⏱ 10 Min. · **Express** · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Eier (Größe M) | 2 Stück | 2 Stück | 3 Stück | 3 Stück | 3 Stück |
| Hüttenkäse (körniger Frischkäse) | 150 g | 150 g | 110 g | 110 g | 100 g |
| Orangensaft (frisch gepresst / Direktsaft) | 300 ml | 490 ml | 500 ml | 500 ml | 500 ml |
| Butter | – | 5 g | 10 g | 20 g | 30 g |
| **🔥 kcal** | **439** | **562** | **643** | **717** | **781** |
| **🍗 Protein** | **35 g** | **36 g** | **38 g** | **38 g** | **37 g** |
| **🥑 Fett** | **18 g** | **22 g** | **30 g** | **38 g** | **46 g** |
| **🍞 Kohlenhydrate** | **32 g** | **49 g** | **49 g** | **49 g** | **49 g** |

**Gewürze/nach Geschmack:** Salz

**Zubereitung:**

1. Butter in einer Pfanne schmelzen, Eier als Spiegel- oder Rührei bei mittlerer Hitze zubereiten.
2. Mit Hüttenkäse anrichten, salzen.
3. Orangensaft frisch pressen und dazu trinken.

#### Honig-Quark mit Mango

`rp-f2` · ⏱ 3 Min. · **Express** · vegetarisch

Express-Frühstück in 3 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Magerquark | 260 g | 250 g | 240 g | 230 g | 240 g |
| Vollmilch 3,5 % | 75 ml | 90 ml | 100 ml | 100 ml | 100 ml |
| Mango (frisch/TK) | 85 g | 185 g | 255 g | 315 g | 350 g |
| Honig | 15 g | 30 g | 35 g | 45 g | 50 g |
| Schlagsahne 30 % | 40 ml | 45 ml | 55 ml | 60 ml | 70 ml |
| **🔥 kcal** | **437** | **562** | **650** | **725** | **798** |
| **🍗 Protein** | **35 g** | **35 g** | **35 g** | **34 g** | **36 g** |
| **🥑 Fett** | **16 g** | **18 g** | **22 g** | **24 g** | **27 g** |
| **🍞 Kohlenhydrate** | **38 g** | **63 g** | **76 g** | **91 g** | **100 g** |

**Gewürze/nach Geschmack:** Prise Salz

**Zubereitung:**

1. Magerquark mit Milch und Sahne cremig rühren.
2. Mango würfeln und daraufgeben.
3. Mit Honig beträufeln.

#### Kartoffel-Rösti mit Spiegelei, Käse & Hüttenkäse

`rp-f3` · ⏱ 20 Min. · vegetarisch

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Kartoffeln (roh) | 170 g | 380 g | 450 g | 520 g | 650 g |
| Eier (Größe M) | 2 Stück | 2 Stück | 1 Stück | 1 Stück | 1 Stück |
| Gouda (mittelalt) | 15 g | 15 g | 15 g | 15 g | 15 g |
| Hüttenkäse (körniger Frischkäse) | 110 g | 80 g | 120 g | 110 g | 90 g |
| Butter | – | – | 10 g | 15 g | 15 g |
| **🔥 kcal** | **441** | **563** | **648** | **725** | **799** |
| **🍗 Protein** | **35 g** | **35 g** | **35 g** | **35 g** | **35 g** |
| **🥑 Fett** | **20 g** | **18 g** | **23 g** | **27 g** | **26 g** |
| **🍞 Kohlenhydrate** | **29 g** | **60 g** | **71 g** | **81 g** | **100 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer

**Zubereitung:**

1. Kartoffeln schälen, grob raspeln und gut ausdrücken, salzen.
2. Butter erhitzen, Kartoffelmasse als flache Rösti hineingeben, je Seite 5–6 Minuten goldbraun braten.
3. Geriebenen Gouda daraufstreuen, Eier daneben als Spiegelei braten und mit dem Hüttenkäse servieren.

#### Schoko-Milch-Gelatine-Pudding

`rp-f4` · ⏱ 10 Min. · **Express**

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Vollmilch 3,5 % | 340 ml | 350 ml | 350 ml | 350 ml | 380 ml |
| Gelatinepulver | 15 g | 15 g | 15 g | 15 g | 15 g |
| Magerquark | 70 g | 60 g | 60 g | 60 g | 50 g |
| Kakaopulver (stark entölt, ungesüßt) | 10 g | 10 g | 10 g | 10 g | 10 g |
| Honig | 20 g | 50 g | 50 g | 50 g | 50 g |
| Schlagsahne 30 % | 10 ml | 20 ml | 50 ml | 75 ml | 95 ml |
| **🔥 kcal** | **440** | **560** | **648** | **721** | **792** |
| **🍗 Protein** | **35 g** | **35 g** | **36 g** | **36 g** | **36 g** |
| **🥑 Fett** | **17 g** | **20 g** | **29 g** | **36 g** | **43 g** |
| **🍞 Kohlenhydrate** | **37 g** | **61 g** | **62 g** | **63 g** | **64 g** |

**Gewürze/nach Geschmack:** Prise Salz, Vanille

**Zubereitung:**

1. Gelatine in 50 ml kalter Milch 5 Minuten quellen lassen.
2. Restliche Milch mit Kakao, Honig und Sahne erwärmen (nicht kochen), Gelatine darin auflösen.
3. Etwas abkühlen lassen, Magerquark einrühren, in Gläser füllen und mind. 2 Stunden (oder über Nacht) kühlen.

> Hinweis: 10 Min. + 2 Std. Kühlzeit – ideal am Vorabend zubereiten.

#### Hüttenkäse-Obstteller mit Honig

`rp-f5` · ⏱ 5 Min. · **Express** · vegetarisch

Express-Frühstück in 5 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Hüttenkäse (körniger Frischkäse) | 240 g | 220 g | 210 g | 200 g | 200 g |
| Vollmilch 3,5 % | 150 ml | 180 ml | 200 ml | 200 ml | 200 ml |
| Ananas (frisch) | 140 g | 280 g | 350 g | 385 g | 400 g |
| Honig | 10 g | 15 g | 30 g | 30 g | 40 g |
| Kokosraspeln | – | 5 g | 5 g | 15 g | 20 g |
| **🔥 kcal** | **439** | **563** | **650** | **724** | **796** |
| **🍗 Protein** | **36 g** | **35 g** | **35 g** | **35 g** | **35 g** |
| **🥑 Fett** | **16 g** | **20 g** | **20 g** | **26 g** | **29 g** |
| **🍞 Kohlenhydrate** | **39 g** | **61 g** | **83 g** | **88 g** | **98 g** |

**Gewürze/nach Geschmack:** –

**Zubereitung:**

1. Ananas schälen und würfeln.
2. Hüttenkäse in eine Schale geben, Ananas daraufgeben, mit Honig beträufeln und Kokosraspeln bestreuen.
3. Milch dazu trinken.

### Ray Peat – Mittagessen

#### Rinderhack-Kartoffel-Pfanne mit Käse

`rp-m1` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhack mager (ca. 5 % Fett, Tatar) | 190 g | 165 g | 160 g | 150 g | 135 g |
| Gouda (mittelalt) | 35 g | 35 g | 30 g | 30 g | 30 g |
| Kartoffeln (roh) | 290 g | 540 g | 650 g | 770 g | 900 g |
| Zwiebel | 40 g | 45 g | 50 g | 50 g | 50 g |
| Butter | 10 g | 15 g | 25 g | 30 g | 35 g |
| **🔥 kcal** | **658** | **846** | **977** | **1088** | **1199** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **27 g** | **30 g** | **37 g** | **41 g** | **45 g** |
| **🍞 Kohlenhydrate** | **46 g** | **83 g** | **100 g** | **118 g** | **138 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Paprikapulver, Petersilie

**Zubereitung:**

1. Kartoffeln schälen, würfeln und 10 Minuten in Salzwasser vorkochen.
2. Butter erhitzen, Kartoffeln 8 Minuten goldbraun braten, herausnehmen.
3. Hack mit Zwiebel krümelig anbraten, Kartoffeln zurückgeben.
4. Mit geriebenem Gouda bestreuen, schmelzen lassen.

#### Garnelen in Kokos-Tomatensauce mit Reis

`rp-m2` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Garnelen (roh, geschält, TK) | 255 g | 230 g | 215 g | 200 g | 190 g |
| Basmatireis (trocken) | 55 g | 100 g | 130 g | 150 g | 175 g |
| Passierte Tomaten | 110 ml | 135 ml | 150 ml | 150 ml | 150 ml |
| Kokosmilch (vollfett, Dose) | 115 ml | 135 ml | 155 ml | 180 ml | 200 ml |
| **🔥 kcal** | **656** | **840** | **977** | **1085** | **1204** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **27 g** | **31 g** | **35 g** | **41 g** | **45 g** |
| **🍞 Kohlenhydrate** | **51 g** | **88 g** | **112 g** | **129 g** | **149 g** |

**Gewürze/nach Geschmack:** Salz, Knoblauch, Ingwer, Limette, Koriander

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Passierte Tomaten mit Kokosmilch, Knoblauch, Ingwer und Salz aufkochen, 5 Minuten köcheln lassen.
3. Garnelen hineingeben und 3–4 Minuten gar ziehen lassen.
4. Mit Limette abschmecken und mit dem Reis servieren.

#### Kabeljau mit Kartoffelpüree & Butter-Karotten

`rp-m3` · ⏱ 30 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Kabeljau- oder Seelachsfilet | 255 g | 230 g | 210 g | 200 g | 185 g |
| Kartoffeln (roh) | 250 g | 460 g | 600 g | 710 g | 830 g |
| Vollmilch 3,5 % | 75 ml | 90 ml | 100 ml | 100 ml | 100 ml |
| Karotten | 110 g | 135 g | 150 g | 150 g | 150 g |
| Butter | 25 g | 30 g | 35 g | 40 g | 45 g |
| **🔥 kcal** | **657** | **844** | **977** | **1086** | **1197** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **26 g** | **30 g** | **35 g** | **39 g** | **43 g** |
| **🍞 Kohlenhydrate** | **47 g** | **80 g** | **102 g** | **119 g** | **137 g** |

**Gewürze/nach Geschmack:** Salz, Muskat, Petersilie, Zitrone

**Zubereitung:**

1. Kartoffeln schälen, vierteln und 20 Minuten in Salzwasser kochen; Karotten in Scheiben 10 Minuten mitkochen oder dämpfen.
2. Kabeljau salzen und in einem Teil der Butter je Seite 3 Minuten braten.
3. Kartoffeln mit warmer Milch und Butter zu Püree stampfen, Karotten in restlicher Butter schwenken.

#### Masa-Tortillas mit Rindersteak & Käse

`rp-m4` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhüftsteak | 190 g | 170 g | 160 g | 145 g | 145 g |
| Gouda (mittelalt) | 30 g | 25 g | 25 g | 30 g | 25 g |
| Masa Harina (nixtamalisiertes Maismehl) | 55 g | 115 g | 145 g | 165 g | 180 g |
| Tomaten | 75 g | 90 g | 100 g | 100 g | 100 g |
| Butter | 15 g | 15 g | 20 g | 25 g | 35 g |
| **🔥 kcal** | **660** | **840** | **976** | **1086** | **1197** |
| **🍗 Protein** | **55 g** | **55 g** | **56 g** | **55 g** | **55 g** |
| **🥑 Fett** | **30 g** | **30 g** | **35 g** | **41 g** | **48 g** |
| **🍞 Kohlenhydrate** | **43 g** | **88 g** | **110 g** | **125 g** | **136 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Limette, Koriander

**Zubereitung:**

1. Masa Harina mit Salz und etwa gleicher Menge warmem Wasser zu einem geschmeidigen Teig kneten, 5 Minuten ruhen lassen.
2. Kleine Kugeln formen, zwischen Backpapier flach drücken und in einer heißen, trockenen Pfanne je Seite 1 Minute backen.
3. Steak in der Butter je Seite 2–3 Minuten braten, ruhen lassen, in Streifen schneiden.
4. Tortillas mit Steak, geriebenem Käse und Tomatenwürfeln füllen.

#### Leber-Zwiebel-Pfanne mit Kartoffelpüree

`rp-m5` · ⏱ 30 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderleber | 140 g | 125 g | 125 g | 105 g | 95 g |
| Rinderhack mager (ca. 5 % Fett, Tatar) | 95 g | 85 g | 70 g | 75 g | 70 g |
| Kartoffeln (roh) | 190 g | 430 g | 570 g | 710 g | 840 g |
| Vollmilch 3,5 % | 60 ml | 70 ml | 80 ml | 80 ml | 80 ml |
| Zwiebel | 75 g | 90 g | 100 g | 100 g | 100 g |
| Butter | 20 g | 25 g | 30 g | 35 g | 40 g |
| **🔥 kcal** | **656** | **844** | **973** | **1090** | **1201** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **28 g** | **32 g** | **36 g** | **40 g** | **44 g** |
| **🍞 Kohlenhydrate** | **41 g** | **77 g** | **99 g** | **120 g** | **139 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Majoran, Apfelstücke optional

**Zubereitung:**

1. Kartoffeln schälen und 20 Minuten in Salzwasser kochen, mit Milch und einem Teil der Butter zu Püree stampfen.
2. Zwiebeln in Ringe schneiden und in Butter goldbraun braten, Hack dazugeben und krümelig braten.
3. Leber in Streifen schneiden, 2–3 Minuten mitbraten (innen leicht rosa), erst danach salzen.

> Hinweis: Leber wegen des hohen Vitamin-A-Gehalts max. 1× pro Woche.

### Ray Peat – Abendessen

#### Weißer Fisch mit Reis & Karottensalat

`rp-a1` · ⏱ 25 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Kabeljau- oder Seelachsfilet | 270 g | 250 g | 230 g | 225 g | 210 g |
| Basmatireis (trocken) | 65 g | 120 g | 150 g | 170 g | 195 g |
| Karotten | 110 g | 135 g | 150 g | 150 g | 150 g |
| Kokosöl | 20 g | 20 g | 25 g | 30 g | 35 g |
| **🔥 kcal** | **656** | **841** | **978** | **1088** | **1206** |
| **🍗 Protein** | **55 g** | **56 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **22 g** | **23 g** | **28 g** | **33 g** | **38 g** |
| **🍞 Kohlenhydrate** | **56 g** | **100 g** | **124 g** | **140 g** | **159 g** |

**Gewürze/nach Geschmack:** Salz, Apfelessig, Zitrone

**Zubereitung:**

1. Reis nach Packungsanweisung garen.
2. Karotten fein raspeln, mit etwas Kokosöl (geschmolzen), Essig und Salz zum klassischen Peat-Karottensalat mischen.
3. Fisch salzen und im restlichen Kokosöl je Seite 3 Minuten braten.
4. Mit Reis und Karottensalat servieren.

#### Rindergulasch mit Kartoffeln

`rp-a2` · ⏱ 60 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rindergulasch (mager, aus der Keule) | 180 g | 175 g | 160 g | 145 g | 140 g |
| Gelatinepulver | 10 g | 5 g | 5 g | 5 g | 5 g |
| Kartoffeln (roh) | 330 g | 550 g | 700 g | 830 g | 890 g |
| Zwiebel | 75 g | 90 g | 100 g | 100 g | 100 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Tomatenmark | 15 g | 20 g | 20 g | 20 g | 20 g |
| Butter | 15 g | 20 g | 25 g | 30 g | 40 g |
| **🔥 kcal** | **658** | **843** | **976** | **1088** | **1200** |
| **🍗 Protein** | **56 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **20 g** | **25 g** | **28 g** | **32 g** | **40 g** |
| **🍞 Kohlenhydrate** | **59 g** | **94 g** | **118 g** | **137 g** | **146 g** |

**Gewürze/nach Geschmack:** Salz, Paprikapulver edelsüß, Kümmel, Majoran, Lorbeer

**Zubereitung:**

1. Fleisch in Würfel schneiden, in der Butter portionsweise scharf anbraten.
2. Zwiebel und Paprika würfeln, mitbraten, Tomatenmark 1 Minute mitrösten.
3. Mit 300 ml Wasser ablöschen, Gelatine einrühren (macht die Sauce sämig), würzen und zugedeckt 50 Minuten schmoren (Schnellkochtopf: 20 Minuten).
4. Kartoffeln schälen und 20 Minuten kochen, mit dem Gulasch servieren.

> Hinweis: Gut in größerer Menge vorzukochen. Aktive Zeit ca. 15 Minuten.

#### Garnelen-Reispfanne mit Ananas

`rp-a3` · ⏱ 20 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Garnelen (roh, geschält, TK) | 265 g | 240 g | 230 g | 220 g | 210 g |
| Basmatireis (trocken) | 60 g | 110 g | 130 g | 150 g | 180 g |
| Ananas (frisch) | 75 g | 125 g | 170 g | 180 g | 210 g |
| Paprika | 75 g | 90 g | 100 g | 100 g | 100 g |
| Kokosöl | 20 g | 20 g | 25 g | 30 g | 30 g |
| **🔥 kcal** | **657** | **843** | **976** | **1087** | **1200** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **23 g** | **23 g** | **28 g** | **33 g** | **33 g** |
| **🍞 Kohlenhydrate** | **60 g** | **106 g** | **127 g** | **144 g** | **171 g** |

**Gewürze/nach Geschmack:** Salz, Ingwer, Limette, Chili

**Zubereitung:**

1. Reis garen (oder Reis vom Vortag verwenden).
2. Paprika und Ananas würfeln.
3. Kokosöl erhitzen, Garnelen 2–3 Minuten braten, Paprika und Ananas 3 Minuten mitbraten.
4. Reis untermischen, mit Salz, Ingwer und Limette abschmecken.

#### Quark-Obst-Teller mit Orangensaft

`rp-a4` · ⏱ 5 Min. · **Express** · vegetarisch

Express-Abendessen in 5 Minuten.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Magerquark | 410 g | 390 g | 380 g | 370 g | 370 g |
| Vollmilch 3,5 % | 75 ml | 90 ml | 100 ml | 100 ml | 100 ml |
| Mango (frisch/TK) | 120 g | 245 g | 325 g | 340 g | 350 g |
| Orangensaft (frisch gepresst / Direktsaft) | 120 ml | 240 ml | 320 ml | 400 ml | 500 ml |
| Honig | 10 g | 25 g | 35 g | 45 g | 50 g |
| Schlagsahne 30 % | 60 ml | 65 ml | 70 ml | 85 ml | 100 ml |
| **🔥 kcal** | **657** | **845** | **975** | **1088** | **1198** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **56 g** |
| **🥑 Fett** | **23 g** | **25 g** | **28 g** | **32 g** | **37 g** |
| **🍞 Kohlenhydrate** | **56 g** | **94 g** | **120 g** | **137 g** | **152 g** |

**Gewürze/nach Geschmack:** Prise Salz

**Zubereitung:**

1. Magerquark mit Milch und Sahne cremig rühren.
2. Mango würfeln und daraufgeben, mit Honig beträufeln.
3. Orangensaft dazu trinken.

#### Rindersteak mit Ofen-Pommes & Karottensalat

`rp-a5` · ⏱ 35 Min.

| Zutat | 1750 kcal | 2250 kcal | 2600 kcal | 2900 kcal | 3200 kcal |
|---|---|---|---|---|---|
| Rinderhüftsteak | 215 g | 195 g | 175 g | 165 g | 165 g |
| Kartoffeln (roh) | 340 g | 560 g | 770 g | 890 g | 900 g |
| Kokosöl | 15 g | 20 g | 20 g | 25 g | 35 g |
| Karotten | 75 g | 90 g | 100 g | 100 g | 100 g |
| **🔥 kcal** | **659** | **842** | **973** | **1090** | **1184** |
| **🍗 Protein** | **55 g** | **55 g** | **55 g** | **55 g** | **55 g** |
| **🥑 Fett** | **23 g** | **28 g** | **27 g** | **32 g** | **42 g** |
| **🍞 Kohlenhydrate** | **55 g** | **88 g** | **120 g** | **138 g** | **140 g** |

**Gewürze/nach Geschmack:** Salz, Pfeffer, Apfelessig

**Zubereitung:**

1. Ofen auf 220 °C vorheizen. Kartoffeln in Stäbchen schneiden, mit geschmolzenem Kokosöl und Salz mischen, 25–30 Minuten backen (einmal wenden).
2. Karotten raspeln und mit Essig und Salz anmachen.
3. Steak in einer heißen Pfanne je Seite 2–3 Minuten braten, ruhen lassen und mit Pommes und Karottensalat servieren.


---

## 8. Anhang: Nährwertdatenbank (pro 100 g bzw. 100 ml)

Kohlenhydrate = verwertbare Kohlenhydrate (EU-Kennzeichnung, ohne Ballaststoffe). Durchschnittswerte aus gängigen Nährwerttabellen und Herstellerangaben.

| Schlüssel | Lebensmittel | kcal | Protein | KH | Fett | vegan |
|---|---|---|---|---|---|---|
| `magerquark` | Magerquark | 67 | 12.0 | 4.0 | 0.3 | nein |
| `skyr` | Skyr natur | 63 | 11.0 | 4.0 | 0.2 | nein |
| `huettenkaese` | Hüttenkäse (körniger Frischkäse) | 98 | 12.5 | 2.6 | 4.3 | nein |
| `griech_joghurt` | Griechischer Joghurt 10 % | 122 | 5.0 | 4.0 | 10.0 | nein |
| `milch` | Vollmilch 3,5 % | 64 | 3.4 | 4.8 | 3.6 | nein |
| `milch15` | Milch 1,5 % | 47 | 3.4 | 4.9 | 1.5 | nein |
| `ei` | Eier (Größe M) | 143 | 12.6 | 0.7 | 9.5 | nein |
| `eiklar` | Eiklar | 52 | 11.0 | 0.7 | 0.2 | nein |
| `parmesan` | Parmesan | 405 | 36.0 | 0.0 | 29.0 | nein |
| `feta` | Feta | 265 | 16.0 | 0.7 | 22.0 | nein |
| `mozzarella` | Mozzarella | 245 | 18.0 | 1.0 | 19.0 | nein |
| `gouda` | Gouda (mittelalt) | 356 | 25.0 | 0.0 | 28.0 | nein |
| `butter` | Butter | 741 | 0.7 | 0.6 | 83.0 | nein |
| `sahne` | Schlagsahne 30 % | 292 | 2.4 | 3.2 | 30.0 | nein |
| `frischkaese` | Frischkäse Doppelrahmstufe | 270 | 6.0 | 3.0 | 26.0 | nein |
| `gelatine` | Gelatinepulver | 350 | 87.0 | 0.0 | 0.1 | nein |
| `haehnchen` | Hähnchenbrustfilet | 110 | 23.5 | 0.0 | 1.5 | nein |
| `haehnchenschenkel` | Hähnchenschenkel ohne Haut & Knochen | 120 | 20.0 | 0.0 | 4.5 | nein |
| `pute` | Putenbrustfilet | 105 | 24.0 | 0.0 | 1.0 | nein |
| `hack5` | Rinderhack mager (ca. 5 % Fett, Tatar) | 125 | 21.0 | 0.0 | 4.5 | nein |
| `hack20` | Rinderhackfleisch (ca. 15–20 % Fett) | 216 | 18.0 | 0.0 | 16.0 | nein |
| `steak` | Rinderhüftsteak | 120 | 22.0 | 0.0 | 3.5 | nein |
| `rindergulasch` | Rindergulasch (mager, aus der Keule) | 120 | 21.0 | 0.0 | 4.0 | nein |
| `leber` | Rinderleber | 135 | 20.0 | 3.9 | 3.6 | nein |
| `lachs` | Lachsfilet (frisch/TK) | 200 | 20.0 | 0.0 | 13.0 | nein |
| `kabeljau` | Kabeljau- oder Seelachsfilet | 80 | 18.0 | 0.0 | 0.7 | nein |
| `garnelen` | Garnelen (roh, geschält, TK) | 80 | 18.5 | 0.0 | 0.8 | nein |
| `thunfisch` | Thunfisch im eigenen Saft (abgetropft) | 113 | 26.0 | 0.0 | 1.0 | nein |
| `bacon` | Bauchspeck / Bacon (am Stück oder Scheiben) | 400 | 13.0 | 0.0 | 39.0 | nein |
| `tofu` | Tofu natur | 130 | 14.0 | 1.5 | 7.5 | ja |
| `raeuchertofu` | Räuchertofu | 165 | 17.0 | 1.5 | 10.0 | ja |
| `seidentofu` | Seidentofu | 55 | 5.5 | 1.0 | 3.0 | ja |
| `tempeh` | Tempeh | 192 | 20.0 | 4.0 | 10.8 | ja |
| `linsen_rot` | Rote Linsen (trocken) | 340 | 24.0 | 49.0 | 1.5 | ja |
| `kichererbsen` | Kichererbsen (Glas/Dose, abgetropft) | 125 | 7.0 | 13.0 | 2.6 | ja |
| `kidney` | Kidneybohnen (Glas/Dose, abgetropft) | 100 | 7.0 | 12.0 | 0.5 | ja |
| `weisse_bohnen` | Weiße Bohnen (Glas/Dose, abgetropft) | 95 | 6.6 | 12.0 | 0.5 | ja |
| `edamame` | Edamame (TK, geschält) | 125 | 12.0 | 5.0 | 5.0 | ja |
| `sojamilch` | Sojadrink ungesüßt | 33 | 3.3 | 0.5 | 1.8 | ja |
| `sojajoghurt` | Sojajoghurt natur ungesüßt | 50 | 4.0 | 2.0 | 2.3 | ja |
| `proteinpulver_vegan` | Veganes Proteinpulver (Erbsenprotein, ungesüßt) | 380 | 78.0 | 3.0 | 7.0 | ja |
| `sojaschnetzel` | Sojaschnetzel (trocken) | 340 | 50.0 | 15.0 | 1.5 | ja |
| `linsennudeln` | Nudeln aus roten Linsen (trocken, 100 % Linsenmehl) | 340 | 25.0 | 49.0 | 2.0 | ja |
| `hanfsamen` | Hanfsamen geschält | 570 | 31.0 | 3.0 | 49.0 | ja |
| `erdnussmus` | Erdnussmus (100 % Erdnüsse) | 600 | 25.0 | 9.0 | 50.0 | ja |
| `mandelmus` | Mandelmus (100 % Mandeln) | 620 | 22.0 | 6.0 | 55.0 | ja |
| `tahin` | Tahin (Sesammus) | 620 | 18.0 | 3.0 | 55.0 | ja |
| `haferflocken` | Haferflocken (Vollkorn) | 370 | 13.5 | 58.7 | 7.0 | ja |
| `reis` | Basmatireis (trocken) | 350 | 8.0 | 78.0 | 0.6 | ja |
| `kartoffeln` | Kartoffeln (roh) | 72 | 2.0 | 15.0 | 0.1 | ja |
| `suesskartoffel` | Süßkartoffel (roh) | 86 | 1.6 | 20.0 | 0.1 | ja |
| `vollkornnudeln` | Vollkornnudeln (trocken) | 348 | 13.0 | 62.0 | 2.5 | ja |
| `vollkornbrot` | Roggenvollkornbrot | 210 | 6.5 | 38.0 | 1.2 | ja |
| `quinoa` | Quinoa (trocken) | 360 | 14.0 | 57.0 | 6.0 | ja |
| `masa` | Masa Harina (nixtamalisiertes Maismehl) | 365 | 9.0 | 74.0 | 3.8 | ja |
| `banane` | Banane (geschält) | 93 | 1.2 | 20.0 | 0.2 | ja |
| `heidelbeeren` | Heidelbeeren (frisch/TK) | 42 | 0.6 | 7.4 | 0.6 | ja |
| `himbeeren` | Himbeeren (frisch/TK) | 36 | 1.3 | 4.8 | 0.3 | ja |
| `apfel` | Apfel | 54 | 0.3 | 11.4 | 0.2 | ja |
| `orangensaft` | Orangensaft (frisch gepresst / Direktsaft) | 45 | 0.7 | 9.0 | 0.2 | ja |
| `mango` | Mango (frisch/TK) | 62 | 0.6 | 12.5 | 0.4 | ja |
| `ananas` | Ananas (frisch) | 55 | 0.5 | 12.4 | 0.2 | ja |
| `honig` | Honig | 304 | 0.3 | 80.0 | 0.0 | nein |
| `kakao` | Kakaopulver (stark entölt, ungesüßt) | 330 | 21.0 | 11.0 | 11.0 | ja |
| `spinat` | Blattspinat (frisch/TK) | 20 | 2.9 | 0.6 | 0.4 | ja |
| `brokkoli` | Brokkoli (frisch/TK) | 30 | 3.0 | 2.7 | 0.4 | ja |
| `zucchini` | Zucchini | 19 | 1.2 | 2.2 | 0.3 | ja |
| `paprika` | Paprika | 28 | 1.0 | 5.0 | 0.3 | ja |
| `tomaten` | Tomaten | 18 | 0.9 | 2.6 | 0.2 | ja |
| `passata` | Passierte Tomaten | 30 | 1.4 | 4.5 | 0.2 | ja |
| `tomatenmark` | Tomatenmark | 80 | 4.3 | 13.0 | 0.5 | ja |
| `zwiebel` | Zwiebel | 33 | 1.2 | 5.0 | 0.2 | ja |
| `knoblauch` | Knoblauch | 140 | 6.4 | 28.0 | 0.5 | ja |
| `karotte` | Karotten | 36 | 0.9 | 4.8 | 0.2 | ja |
| `champignons` | Champignons | 22 | 3.1 | 0.6 | 0.3 | ja |
| `gurke` | Salatgurke | 13 | 0.6 | 1.8 | 0.2 | ja |
| `salat` | Blattsalat (z. B. Romana, Rucola) | 17 | 1.5 | 1.5 | 0.3 | ja |
| `blumenkohl` | Blumenkohl (frisch/TK) | 25 | 1.9 | 2.3 | 0.3 | ja |
| `gruene_bohnen` | Grüne Bohnen (frisch/TK) | 32 | 2.0 | 5.0 | 0.2 | ja |
| `erbsen` | Erbsen (TK) | 81 | 5.4 | 11.0 | 0.4 | ja |
| `avocado` | Avocado (Fruchtfleisch) | 160 | 2.0 | 2.0 | 14.7 | ja |
| `kokosmilch` | Kokosmilch (vollfett, Dose) | 197 | 2.0 | 2.8 | 21.0 | ja |
| `kokosoel` | Kokosöl | 862 | 0.0 | 0.0 | 99.8 | ja |
| `olivenoel` | Olivenöl (nativ extra) | 884 | 0.0 | 0.0 | 100.0 | ja |
| `leinoel` | Leinöl | 884 | 0.0 | 0.0 | 100.0 | ja |
| `walnuesse` | Walnüsse | 654 | 15.0 | 7.0 | 65.0 | ja |
| `mandeln` | Mandeln | 580 | 21.0 | 6.0 | 50.0 | ja |
| `chiasamen` | Chiasamen | 450 | 17.0 | 4.0 | 31.0 | ja |
| `leinsamen` | Leinsamen (geschrotet) | 510 | 18.0 | 2.0 | 42.0 | ja |
| `kokosraspeln` | Kokosraspeln | 650 | 7.0 | 7.0 | 63.0 | ja |
| `sojasauce` | Sojasauce | 60 | 8.0 | 5.0 | 0.5 | ja |

Eier: 1 Stück (Größe M, ohne Schale) = 55 g.

---

## 9. Anhang: Werkzeuge (`tools/`)

- `data_db.py`: Nährwertdatenbank.
- `data_recipes.py`: Rezepte mit Grundmengen und Rollen (P = Proteinquelle, C = Kohlenhydratquelle, F = Fettquelle, X = feste Menge).
- `build.py`: berechnet für jede Kalorienstufe die Mengen (Protein konstant, Kalorien-/Fettziel je Stufe), rundet auf praktische Schritte und erzeugt `recipes.json` und `ingredients.json`.
- `verify.py`: prüft alle Kombinationen gegen die Grenzen aus Abschnitt 2.

Neue Rezepte: in `data_recipes.py` ergänzen → `python3 build.py && python3 verify.py` → neue JSONs in die App kopieren.
