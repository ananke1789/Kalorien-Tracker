# Hinweise für Claude

Lies zu Beginn jeder Sitzung zuerst PROGRESS.md und die README. Wenn der Nutzer 'mach weiter' schreibt, arbeite ohne Rückfragen beim dort genannten nächsten Schritt weiter. Halte PROGRESS.md aktuell.

- Arbeitszweig: `claude/amazing-bardeen-vfo9eo` (nur dorthin pushen, keinen PR erstellen).
- Reines HTML/CSS/JS ohne Build-Tools und ohne externe Ressourcen. Alle Pfade relativ.
- Bei Änderungen an ausgelieferten Dateien: `CACHE_VERSION` in `sw.js` erhöhen und neue Dateien in die Cache-Liste aufnehmen.
- Tests: `npm test` (Berechnungen) und `node tests/e2e.js` (Browser-Test mit Playwright).
