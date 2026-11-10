# Finanzplaner – Haushaltsbuch mit Prognose

Eigenständige Progressive Web App (PWA) für die private Finanzplanung. Reines HTML, CSS und JavaScript – ohne Framework, ohne Build-Schritt, ohne externe Ressourcen. Läuft komplett offline, **alle Daten bleiben auf dem Gerät** (IndexedDB, Datenbank `finanzplaner`).

> Dieser Ordner ist eine **eigene App** und hat nichts mit dem Kalorien-Tracker im übergeordneten Ordner zu tun (keine gemeinsamen Dateien, Daten oder Service Worker). Er kann jederzeit 1:1 in ein eigenes Repository verschoben werden – siehe unten.

## Funktionen

- **Übersicht:** Prognose für das Monatsende. Mit eingetragenem Kontostand: erwarteter Kontostand am Monatsende; ohne: erwartete Monatsbilanz. Aufschlüsselung Einnahmen – Fixkosten – variable Ausgaben bisher – erwartete variable Ausgaben (Ø pro Tag × restliche Tage). „Frei verfügbar“ pro Tag / Woche bis Monatsende. Kategorien mit Ist, Prognose, Durchschnitt und optionalem Budget. Nächste Fixkosten/Einnahmen (30 Tage). Erinnerung, wenn die letzte Woche noch nicht abgeschlossen ist.
- **Woche:** Kontoeinzüge Woche für Woche eintragen (Mo–So, Kalenderwoche). Pro Tag „+“, Schnelleingabe „Speichern + weitere“, Fixkosten der Woche werden mit angezeigt. Wochensumme im Vergleich zum Durchschnitt, „Woche abschließen“, Kontostand abgleichen (zeigt Abweichung zum erwarteten Stand).
- **Fixkosten:** wiederkehrende Ausgaben und Einnahmen (monatlich, vierteljährlich, halbjährlich, jährlich) mit Fälligkeitstag, Gruppe, Start/Ende. Betragsänderungen gelten „ab Datum“ – vergangene Monate bleiben unverändert. „Ab heute beenden“ für gekündigte Verträge.
- **Auswertung:** Monat mit Einnahmen, Fixkosten, Variabel, Bilanz; Kategorien im Vergleich zum Durchschnitt; Verlauf der letzten 6 Monate (Diagramm + Tabelle).
- **Mehr:** Kategorien anlegen, umbenennen, sortieren, Monatsbudget, archivieren, löschen bzw. Zahlungen in eine andere Kategorie verschieben. Prognose-Basis (Ø über 1/3/6/12 Monate). Export/Import als JSON.

Standardkategorien für Einzelzahlungen: Restaurant & Imbiss, Amazon Uni & Arbeit, Amazon Spaß, Kleidung, Sonstige Online-Einkäufe, Supermarkt, Fitness & Supplements, Bücher, Sonstige Offline-Einkäufe.

## So rechnet die Prognose

- **Durchschnitt** der variablen Ausgaben pro Tag: die letzten *N* vollständigen Monate (Standard 3, ohne laufenden Monat), frühestens ab dem ersten Eintrag. Gibt es dort weniger als 14 Tage, zählt der laufende Monat bis heute mit („noch wenig Daten“).
- **Monatsbilanz** = Einnahmen (fix + einzeln) − Fixkosten des Monats − bisherige variable Ausgaben − Ø pro Tag × Tage nach heute.
- **Kontostand Monatsende** = letzter eingetragener Kontostand + alle Buchungen danach (Einzelzahlungen und fällige Fixkosten/Einnahmen) bis Monatsende − erwartete variable Ausgaben. Einträge vom selben Tag wie der Kontostand gelten als darin enthalten.
- **Frei verfügbar pro Tag** = (erwarteter Kontostand bzw. Einnahmen nach allen Fixkosten bis Monatsende) ÷ restliche Tage inkl. heute.

## Veröffentlichen und auf dem Handy installieren

Solange der Ordner im Kalorien-Tracker-Repo liegt, ist die App über GitHub Pages unter `https://<nutzername>.github.io/<repo-name>/finanzen/` erreichbar. In Chrome (Android) öffnen → Menü ⋮ → **App installieren**. Die App wird separat als „Finanzen“ installiert.

**Daten sichern:** Die Daten liegen nur auf dem Handy. Unter *Mehr → Daten & Sicherung* regelmäßig **Exportieren** (JSON-Datei, z. B. in Google Drive ablegen).

## In ein eigenes Repository umziehen

1. Neues Repo anlegen und den **Inhalt** dieses Ordners ins Hauptverzeichnis kopieren.
2. GitHub Pages für das neue Repo aktivieren (Branch `main`, Ordner `/ (root)`).
3. Achtung: Daten liegen pro Webadresse. Vor dem Umzug in der alten App exportieren und in der neuen App importieren.

## Lokal starten und testen (in diesem Ordner)

```bash
python3 -m http.server 8090   # dann http://localhost:8090 öffnen
npm test                      # Rechenlogik + Service-Worker-Dateiliste (Node)
node tests/e2e.js             # Browser-Test mit Playwright/Chromium inkl. Offline
node tools/make-icons.js      # App-Icons neu erzeugen
```

## Aufbau

| Datei | Inhalt |
|---|---|
| `index.html`, `styles.css` | Gerüst, SVG-Symbole, Design |
| `js/calc.js` | Geld, Datum, Fälligkeiten, Durchschnitt, Prognose (rein, mit Node getestet) |
| `js/db.js` | IndexedDB (`categories`, `txs`, `recs`, `balances`, `meta`), Export/Import |
| `js/core.js` | Zustand, Navigation, Bottom-Sheet, Dialoge, Formulare für Zahlung und Kontostand |
| `js/views/*.js` | `overview`, `week`, `fixed`, `stats`, `more` |
| `sw.js`, `manifest.webmanifest`, `icons/` | PWA (eigener Cache `finanzplaner-*`) |

Bei Änderungen an ausgelieferten Dateien `CACHE_VERSION` in `sw.js` erhöhen.
