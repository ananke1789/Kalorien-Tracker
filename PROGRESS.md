# PROGRESS – Tagesplan (Kalorien- & Makro-Tracker PWA)

**Arbeitszweig:** `claude/amazing-bardeen-vfo9eo` (nur pushen, kein PR – den erstellt der Nutzer)

## Stand (Phase 1, gemergt als PR #1)
- [x] a) Grundgerüst, Datenmodell (IndexedDB), Navigation (Tab-Leiste)
- [x] b) Lebensmittel: anlegen, bearbeiten, löschen, alphabetisch, A–Z, Suche, Portionen, Plausibilität
- [x] c) Heute: Datumsnavigation, Mahlzeiten, Einträge (Gramm/Portion, Vorschau), bearbeiten/löschen/kopieren, Mahlzeit von gestern, Tagesstand
- [x] d) Ziele-Ansicht + Tagesauswertung (Ringe, Makroverteilung)
- [x] e) Wochenauswertung
- [x] f) PWA: Manifest, Service Worker, Icons (Skript), Offline
- [x] g) Export/Import, Backup-Hinweis (14 Tage), Demo-Daten
- [x] h) Design-Feinschliff, README

## Phase 2 (Lebensmittel-Typen + Training)
- [ ] a) Lebensmittel-Typ pro 100 g / pro Portion, neue Nährwert-Reihenfolge (kcal, Fett, Carbs, Protein) überall, DB-Migration + Import-Migration inkl. Tests
- [ ] b) Training: Datenmodell, Übungskatalog, alle 11 Standardpläne
- [ ] c) Training starten und erfassen (Auswahl, Sondertraining-Menü, Typen, Varianten, Stufen, Skalen, Autosave, letzte Werte, Progressionshinweis)
- [ ] d) Verlauf mit Bearbeiten und Löschen
- [ ] e) Statistik
- [ ] f) Plan-Editor und Katalog-Bearbeitung
- [ ] g) Export/Import erweitern, Tests, CACHE_VERSION, README und CLAUDE.md

## Nächster Schritt
Phase 2, Meilenstein a.

## Plan / Architektur
- `index.html` (Gerüst, SVG-Symbole), `styles.css`, ES-Module in `js/`:
  - `util.js` reine Funktionen (Zahlen, Datum, Berechnungen) – mit Node testbar
  - `db.js` IndexedDB (Stores `foods`, `entries` mit Index `date`, `meta`)
  - `core.js` Zustand, Navigation, Bottom-Sheet, Bestätigung, Toast
  - `views/*.js` je Tab: `today`, `foods`, `stats`, `goals`; `charts.js` SVG-Diagramme
- `sw.js`, `manifest.webmanifest`, `icons/` (per `tools/make-icons.js` erzeugt)

## Entscheidungen
- Eintrag speichert Snapshot `per100` + `foodName`; `foodId` bleibt auch nach Löschen des Lebensmittels.
- Eingaben: Komma oder Punkt als Dezimaltrenner; kein Tausendertrenner bei Eingabe ("2.900" = 2,9).
- Anzeige: kcal ganzzahlig, Makros 1 Nachkommastelle, Tausenderpunkt.
- "Plan erfüllt": Protein ≥ Ziel, Fett ≥ Ziel, kcal zwischen 90 % und 110 % des Ziels.
- kcal/Carbs ab > 110 % des Ziels dezent (grau, kursiv) markiert; Protein/Fett-Übererfüllung immer positiv (Gold).
- Plausibilitätswarnung bei Abweichung > max(20 kcal, 15 %).
- Doppelte Lebensmittelnamen: Hinweis, zweites Tippen auf Speichern speichert trotzdem.
- A–Z-Leiste erst ab > 8 Lebensmitteln.
- "Von gestern" und Kopieren legen neue Einträge mit gleichem Snapshot an (mit Rückgängig-Toast).
- Zuletzt verwendet: Feld `lastUsed` am Lebensmittel, Top 5 beim Hinzufügen.
- Ziele: Speichern blockiert, wenn Carbs-Rest negativ wäre.
- Diagrammfarben: kcal Anthrazit, Protein Rot, Fett Gold, Carbs Grau.
- Wochendurchschnitt nur über Tage mit Einträgen; "Ziel erreicht" = Plan erfüllt (s. o.).
- Wochenbalken: Tag mit erreichtem Ziel voll/gold, sonst gedämpft.
- Service Worker: Cache-first, versionierter Cache (`CACHE_VERSION` in `sw.js`), alte Caches werden gelöscht; Update-Toast "Neu laden".
- `npm test` prüft auch, dass alle ausgelieferten Dateien im SW-Cache stehen.
- Demo-Daten: Lebensmittel/Einträge mit `demo: true` (IDs `demo-…`); Löschen entfernt nur diese. Bearbeitete/kopierte Demo-Einträge gelten als eigene.
- Backup-Hinweis: Referenz ist letztes Backup bzw. erster Start (`firstUse`), nur wenn Lebensmittel existieren.
- Woche beginnt Montag; Datumsschlüssel `YYYY-MM-DD` lokal.

## Bekannte Probleme
- keine

## Testhinweise
- Inaktive Views werden beim Tabwechsel geleert (sonst doppelte IDs wie `#err`).
- E2E-Schritte in `tests/e2e-steps.js`, Reihenfolge über `ORDER`; `tap()` scrollt mittig und blendet Toasts aus.

## Lokal testen
```
python3 -m http.server 8080   # dann http://localhost:8080 öffnen
npm test                      # Berechnungen (Node)
node tests/e2e.js             # Browser-Test (Playwright/Chromium)
```
