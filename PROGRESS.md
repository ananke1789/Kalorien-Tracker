# PROGRESS – Tagesplan (Kalorien- & Makro-Tracker PWA)

**Arbeitszweig:** `claude/amazing-bardeen-vfo9eo` (nur pushen, kein PR – den erstellt der Nutzer)

## Stand
- [x] a) Grundgerüst, Datenmodell (IndexedDB), Navigation (Tab-Leiste)
- [x] b) Lebensmittel: anlegen, bearbeiten, löschen, alphabetisch, A–Z, Suche, Portionen, Plausibilität
- [x] c) Heute: Datumsnavigation, Mahlzeiten, Einträge (Gramm/Portion, Vorschau), bearbeiten/löschen/kopieren, Mahlzeit von gestern, Tagesstand
- [ ] d) Ziele-Ansicht + Tagesauswertung (Ringe, Makroverteilung)
- [ ] e) Wochenauswertung
- [ ] f) PWA: Manifest, Service Worker, Icons (Skript), Offline
- [ ] g) Export/Import, Backup-Hinweis (14 Tage), Demo-Daten
- [ ] h) Design-Feinschliff, README

## Nächster Schritt
Meilenstein d: `js/views/goals.js` (Ziele mit Live-Rest-Carbs) und `js/charts.js` + `js/views/stats.js` Tagesüberblick (Ringe, Makroverteilung).

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
- Woche beginnt Montag; Datumsschlüssel `YYYY-MM-DD` lokal.

## Bekannte Probleme
- keine

## Lokal testen
```
python3 -m http.server 8080   # dann http://localhost:8080 öffnen
npm test                      # Berechnungen (Node)
node tests/e2e.js             # Browser-Test (Playwright/Chromium)
```
