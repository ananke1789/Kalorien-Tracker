# PROGRESS – Finanzplaner

## Stand
- [x] Recherche: übliche Funktionen von Haushaltsbuch-/Budget-Apps (eigene Kategorien, Fixkosten/Verträge, Kontostand-Prognose zum Monatsende, „Safe to spend“, Budgets, Export)
- [x] Version 1: Übersicht mit Prognose, Wochen-Erfassung, Fixkosten, Auswertung, Kategorien/Einstellungen/Backup, PWA offline, Tests

## Nächster Schritt
Praxistest auf dem Handy. Ideen für später: Sparziele/Rücklagen (z. B. für jährliche Zahlungen), CSV-Export, Suche in Zahlungen, Tags, mehrere Konten, Erinnerungs-Benachrichtigung zum Wochenabschluss.

## Entscheidungen
- Eigener Ordner `finanzen/` im Kalorien-Tracker-Repo, aber vollständig getrennt (Nutzerwunsch: nicht fusionieren). Eigene IndexedDB `finanzplaner`, eigener SW-Cache `finanzplaner-*` (SW sucht nur im eigenen Cache).
- Einzelzahlungen: `{id, at, date, amount (Cent), type 'out'|'in', catId, note}`. Einnahmen ohne Kategorie.
- Fixkosten: `{id, name, type, every (1/3/6/12 Monate), day, start, end, group, amounts:[{from, amount}]}`. Tag > Monatslänge -> letzter Tag. Rhythmus ab Monat der ersten Zahlung. Löschen entfernt auch die Vergangenheit, daher zusätzlich „Ab heute beenden“.
- Kontostand: `{id, at, date, amount}`; der jüngste Stand bis heute ist Anker der Prognose. Einträge vom selben Datum gelten als enthalten.
- Durchschnitt: letzte N vollständige Monate (Einstellung, Standard 3) ab erstem Eintrag; < 14 Tage -> inkl. laufender Monat bis heute.
- „Woche abschließen“ in meta `weeksDone` (Montag als Schlüssel). Erinnerung in der Übersicht für die Vorwoche, sobald es Einträge bis dahin gibt.
- Kategorien: löschen nur ohne Zahlungen, sonst verschieben+löschen oder archivieren. Budget optional pro Monat.
- Diagramm: nur eine Farbe pro Bedeutung (Variabel rot, Fix grau, Einnahmen goldene Linie) + Tabelle; Kategorien per Text, nicht per Farbe.
