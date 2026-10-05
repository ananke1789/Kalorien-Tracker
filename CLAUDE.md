# Hinweise für Claude

Lies zu Beginn jeder Sitzung zuerst PROGRESS.md und die README. Wenn der Nutzer 'mach weiter' schreibt, arbeite ohne Rückfragen beim dort genannten nächsten Schritt weiter. Halte PROGRESS.md aktuell.

- Arbeitszweig: `claude/amazing-bardeen-vfo9eo` (nur dorthin pushen, keinen PR erstellen).
- Reines HTML/CSS/JS ohne Build-Tools und ohne externe Ressourcen. Alle Pfade relativ.
- Bei Änderungen an ausgelieferten Dateien: `CACHE_VERSION` in `sw.js` erhöhen und neue Dateien in die Cache-Liste aufnehmen.
- Tests: `npm test` (Berechnungen, Migration, Trainingslogik, SW-Dateiliste) und `node tests/e2e.js` (Browser-Test mit Playwright; Schritte in `tests/e2e-steps.js`, Reihenfolge über `ORDER`).
- Nutzerdaten nie verlieren: Schemaänderungen nur per IndexedDB-Versions-Upgrade mit Migration (`js/db.js`, `migrateFoods` in `js/util.js`) und Import-Migration für alte Backups (`BACKUP_VERSION`). Einträge/Trainings speichern Snapshots – Historie nicht umrechnen.
- Nährwert-Reihenfolge überall: kcal, Fett, Carbs, Protein (`NUTRIENTS`, `MACROS`).
- Training: reine Logik in `js/training/model.js` (mit Node testen), Standardkatalog/-pläne in `catalog.js`/`plans.js`; Pläne verweisen nur auf Katalog-IDs. Neue Training-Unterbereiche über `registerTrainingSub` und Import in `app.js` nach `training.js`.
- Icons neu erzeugen: `node tools/make-icons.js`.
