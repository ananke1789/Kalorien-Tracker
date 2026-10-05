# PROGRESS – Tagesplan (Kalorien- & Makro-Tracker PWA)

**Arbeitszweig:** `claude/amazing-bardeen-vfo9eo` – nach jeder fertigen Änderung Pull Request nach `main` anlegen (Nutzer merged)

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
- [x] a) Lebensmittel-Typ pro 100 g / pro Portion, neue Nährwert-Reihenfolge (kcal, Fett, Carbs, Protein) überall, DB-Migration + Import-Migration inkl. Tests
- [x] b) Training: Datenmodell, Übungskatalog, alle 11 Standardpläne
- [x] c) Training starten und erfassen (Auswahl, Sondertraining-Menü, Typen, Varianten, Stufen, Skalen, Autosave, letzte Werte, Progressionshinweis)
- [x] d) Verlauf mit Bearbeiten und Löschen
- [x] e) Statistik
- [x] f) Plan-Editor und Katalog-Bearbeitung
- [x] g) Export/Import erweitern, Tests, CACHE_VERSION, README und CLAUDE.md

## Nächster Schritt
Phase 2 abgeschlossen. Nächstes: Praxistest auf dem Handy, dann PR durch den Nutzer. Offen/optional: Demo-Daten um Beispieltrainings ergänzen; ggf. 8. Sondertraining, falls es nachgereicht wird.

## Plan / Architektur
- `index.html` (Gerüst, SVG-Symbole), `styles.css`, ES-Module in `js/`:
  - `util.js` reine Funktionen (Zahlen, Datum, Berechnungen) – mit Node testbar
  - `db.js` IndexedDB (Stores `foods`, `entries` mit Index `date`, `meta`)
  - `core.js` Zustand, Navigation, Bottom-Sheet, Bestätigung, Toast
  - `views/*.js` je Tab: `today`, `foods`, `stats`, `goals`; `charts.js` SVG-Diagramme
- `sw.js`, `manifest.webmanifest`, `icons/` (per `tools/make-icons.js` erzeugt)

## Entscheidungen
- Laufendes Training abbrechen: Knopf "Abbrechen" oben in jedem Schritt (neben dem Plannamen) und im Abschluss-Schritt. Rückfrage nennt die Anzahl bereits eingetragener Sätze; "Weiter trainieren" bricht ab, "Training abbrechen" löscht das laufende Training (Store `active`), nichts landet im Verlauf. `confirmDialog` hat dafür eine Option `cancel` (Beschriftung des Abbrechen-Knopfs).
- Laufendes Training Schritt für Schritt (Wunsch: wenig Arbeitsspeicher, Absturzsicherheit): Es wird nur der aktuelle Schritt (Einzelübung oder Superset) gerendert; Schrittleiste oben zum Springen, letzter Schritt = Abschluss (Notiz, Übersicht, Abschließen/Verwerfen). "Fertig – weiter" markiert die Übungen (`doneAt`), speichert sofort (`saveActive`) und springt zur nächsten offenen Übung danach. Position `w.pos` wird mitgespeichert -> nach Absturz/Neustart geht es dort weiter (Toast "Training fortgesetzt – weiter bei …"). Zahlenfelder speichern zusätzlich sofort beim Verlassen des Feldes. Logik: `workoutSteps`, `stepDone`, `resumeStep`, `completeStep` in model.js. Bearbeiten im Verlauf zeigt weiterhin alle Übungen.
- Phase 2g Backup `version: 3` enthält zusätzlich `exercises`, `plans`, `workouts`, `active`. Import: Version < 2 -> Lebensmittel-Migration; fehlen Trainingsdaten im Backup, bleiben die vorhandenen Trainingsdaten erhalten (Hinweis im Bestätigungsdialog). Danach `loadTraining()` (ergänzt fehlende Standardpläne/-übungen).
- Phase 2f Plan-Editor (`js/views/tplans.js`): Änderungen werden automatisch gespeichert (Text mit 300 ms Verzögerung). Positionen auf-/zuklappbar; Hoch/Runter, Entfernen (mit Bestätigung), Übung aus Katalog oder neu, Abschnitte. "Auf Standard zurücksetzen" nur für Standardpläne. Katalog: Name, Gruppe, Varianten (Typ, KH, pro Seite, Stufen, Nächste Stufe ab); Verweis-Varianten nur entfernbar.
- Phase 2e Statistik: Punkte zeitlich skaliert, Linien verbunden, Stufenwechsel als goldene gestrichelte Linie mit Stufenname; Tipp auf Punkt öffnet Details nur der Sätze dieser Übung/Variante. Gemischte KG-Volumen (ohne/mit Zusatzgewicht) bleiben pro Training nach Spezifikation und werden mit Einheit pro Wert gekennzeichnet.
- Phase 2c: Trainingsansicht `js/views/workout.js` (wiederverwendbar für laufend/bearbeiten). Zahlenfelder speichern per `input` (Debounce 250 ms, beim Ausblenden sofort), ohne Neuaufbau. Strukturänderungen (Satz +/−, Variante, Überspringen) speichern sofort und zeichnen neu.
- Variante pro Übung (Auswahl oben, gilt für alle Sätze) und pro Satz (Chip im Satzkopf); Stufe ebenso. Bei Variantenwechsel ohne ausgefüllte Sätze werden die Satzzeilen neu erzeugt (z. B. pro Seite).
- "Wie letztes Mal"-Chip übernimmt die Werte des gleichen Satzindex vom letzten Training dieser Übung/Variante; Platzhalter zeigen sie vorab.
- "Zuletzt genutzte Variante" = zuletzt mit ausgefüllten Sätzen genutzt.
- Phase 2b Training: Katalog `js/training/catalog.js` (Übung -> Varianten mit Typ G/KG/Z/E, `stages`, `nextAt`, `perHand`, `perSide`, `progress`). Variante mit `ref` verweist auf eigenständige Übung (z. B. Schulterübung -> Pike Pushups, Untere Brust -> Dips) => gemeinsamer Verlauf/Statistik über Schlüssel `exId/variantId` (`resolve`, `statKey`).
- Pläne `js/training/plans.js`: Positionen mit `group` (Superset-Buchstabe), Nummern werden berechnet (`itemLabels`). Abschnitte als `{kind:'section'}`.
- Spezifikation nennt "11 Pläne (3 + 8 Sondertrainings)", beschreibt aber nur 7 Sondertrainings (4a–4g) -> 10 Pläne angelegt. Weitere Pläne können später ergänzt werden.
- Training speichert `planSnapshot` (Positionen) und `catalogSnap` (verwendete Übungen inkl. Verweisen) -> Historie unabhängig von späteren Änderungen.
- DB v3: Stores `exercises`, `plans`, `workouts` (Index `date`), `active` (laufendes Training, id `current`). Standardkatalog/-pläne werden beim Laden ergänzt (fehlende IDs), Nutzeränderungen bleiben.
- Statistik-Volumen: G = Σ kg×Wdh.; KG ohne Zusatzgewicht = Σ Wdh., KG mit Zusatzgewicht = Σ Zusatz-kg×Wdh.; Z = Σ Sekunden.
- "Plan erfüllt"-Stern im Training: alle Sätze nicht übersprungener, nicht optionaler Übungen ausgefüllt.
- Phase 2a: Lebensmittel haben `type: 'per100' | 'portion'`; Portion: `portionName`, Werte pro Portion, kein Gramm. Alte `portions[]` entfallen.
- Einträge: pro 100 g -> `per100` + `grams`; pro Portion -> `perPortion` + `portionName` + `count`. Alte Einträge (`per100` + `grams` + `portion{name,grams,count}`) bleiben unverändert und werden weiter korrekt berechnet/angezeigt.
- Migration (`migrateFoods` in util.js, idempotent): DB-Upgrade v1->v2 und Import von Backups mit `version < 2`. Weitere Portionen -> neues Lebensmittel "Name (Portion)", ID `<alteId>-p2`, `-p3` …
- Backup-Format `version: 2`.
- Nährwert-Reihenfolge überall kcal, Fett, Carbs, Protein (`NUTRIENTS`, `MACROS`, `macroText`). Ziele-Seite: kcal, Fett, Carbs (Rest), Protein.
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
- Behoben (nach Phase 2): Endlos drehendes Zahnrad beim ersten Start einer neuen Version, wenn die alte Version noch in einem Tab/als App offen ist (IndexedDB-Upgrade blockiert). Jetzt: Meldung "Update wartet" + Knöpfe "Neu laden"/"App-Dateien erneuern" (Hinweis nach 10 s), und jede Instanz schließt die DB bei `versionchange` selbst und lädt neu.
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
