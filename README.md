# Tagesplan – Kalorien- & Makro-Tracker

Eine Progressive Web App (PWA) zum täglichen Erfassen von Kalorien, Protein, Fett und Carbs. Reines HTML, CSS und JavaScript – ohne Framework, ohne Build-Schritt, ohne externe Ressourcen. Läuft komplett offline, alle Daten bleiben auf dem Gerät (IndexedDB).

## Funktionen

- **Heute:** Datumsnavigation (auch rückwirkend), vier Mahlzeiten, Einträge in Gramm oder als Portion × Anzahl mit Live-Vorschau, Bearbeiten/Löschen/Kopieren, „Von gestern“ übernehmen, Tagesstand mit Ist, Ziel und „noch offen“.
- **Lebensmittel:** alphabetische Liste (deutsche Sortierung) mit A–Z-Schnellsprung und Suche, Werte pro 100 g, optionale Portionen, Plausibilitätshinweis.
- **Auswertung:** Tagesüberblick mit Fortschrittsringen und Kalorienverteilung; Wochenüberblick mit Balkendiagrammen, Ziellinie, Tagesdurchschnitt und Tagen mit erfülltem Plan.
- **Ziele:** kcal, Protein und Fett frei einstellbar (Standard 2900 kcal / min. 125 g Protein / min. 65 g Fett), Carbs als Rest. Export/Import als JSON, Backup-Hinweis nach 14 Tagen, Demo-Daten.

## Veröffentlichen über GitHub Pages

1. Repository auf GitHub öffnen → **Settings** → **Pages**.
2. Unter **Build and deployment** bei *Source* „Deploy from a branch“ wählen.
3. Branch (z. B. `main`) und Ordner **`/ (root)`** auswählen → **Save**.
4. Nach ein bis zwei Minuten ist die App erreichbar unter
   `https://<nutzername>.github.io/<repo-name>/`.

Alle Pfade sind relativ, die App funktioniert daher auch im Unterpfad. GitHub Pages liefert HTTPS – Voraussetzung für Service Worker und Installation.

## Auf dem Android-Handy installieren (Chrome)

1. Die GitHub-Pages-Adresse in **Chrome** öffnen.
2. Oben rechts auf das **Menü (⋮)** tippen.
3. **„App installieren“** bzw. **„Zum Startbildschirm hinzufügen“** wählen und bestätigen.
4. „Tagesplan“ erscheint als App auf dem Startbildschirm und startet im Vollbild – auch ohne Internet.

**Daten sichern:** Die Daten liegen nur auf dem Handy. Unter *Ziele → Daten & Backup* regelmäßig **Exportieren** (JSON-Datei, z. B. in Google Drive ablegen). Mit **Importieren** lässt sich ein Backup wiederherstellen – dabei werden alle aktuellen Daten überschrieben.

**Updates:** Nach einer neuen Version auf GitHub Pages lädt die App die Dateien beim nächsten Start im Hintergrund und bietet „Neu laden“ an.

## Lokal starten und testen

```bash
python3 -m http.server 8080        # dann http://localhost:8080 öffnen
npm test                           # Berechnungen + Service-Worker-Dateiliste (Node)
node tests/e2e.js                  # Browser-Test mit Playwright/Chromium inkl. Offline
node tools/make-icons.js           # App-Icons neu erzeugen
```

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html`, `styles.css` | Gerüst, SVG-Symbole, Design |
| `js/util.js` | Zahlen, Datum, Nährwertberechnung (rein, testbar) |
| `js/db.js` | IndexedDB-Speicher, Export/Import |
| `js/core.js` | Zustand, Navigation, Bottom-Sheet, Dialoge |
| `js/charts.js` | SVG-Diagramme (Ringe, Donut, Wochenbalken) |
| `js/views/*.js` | Heute, Lebensmittel, Auswertung, Ziele, Backup/Demo |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA |

Bei Änderungen an ausgelieferten Dateien `CACHE_VERSION` in `sw.js` erhöhen.
