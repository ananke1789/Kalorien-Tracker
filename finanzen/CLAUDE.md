# Hinweise für Claude (Finanzplaner)

Dieser Ordner ist eine **eigenständige App**, getrennt vom Kalorien-Tracker im Repo-Hauptverzeichnis. Nichts mit dem Kalorien-Tracker teilen oder zusammenführen (keine Imports von `../`, eigene DB, eigener Service Worker). Ziel: später 1:1 in ein eigenes Repo umziehbar.

Lies zu Beginn PROGRESS.md und README.md in diesem Ordner und halte PROGRESS.md aktuell.

- Reines HTML/CSS/JS ohne Build-Tools und ohne externe Ressourcen. Alle Pfade relativ.
- Bei Änderungen an ausgelieferten Dateien: `CACHE_VERSION` in `sw.js` erhöhen, neue Dateien in `FILES` aufnehmen.
- Tests (in diesem Ordner): `npm test` und `node tests/e2e.js`.
- Beträge in Cent (Ganzzahl), Datumsschlüssel `YYYY-MM-DD` lokal, Woche beginnt Montag.
- Nutzerdaten nie verlieren: Schemaänderungen nur per IndexedDB-Versions-Upgrade mit Migration (`js/db.js`) und Import-Migration für alte Backups (`BACKUP_VERSION` in `calc.js`).
- Fixkosten-Beträge sind Historie (`amounts: [{from, amount}]`) – Änderungen gelten ab Datum, Vergangenheit nicht umrechnen.
- Reine Logik gehört nach `js/calc.js` und wird in `tests/calc.test.js` getestet.
