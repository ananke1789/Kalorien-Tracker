# Rezepte. Rollen: P = Proteinquelle (wird so skaliert, dass das Protein konstant bleibt),
# C = Kohlenhydratquelle (skaliert mit Kalorienstufe), F = Fettquelle (skaliert mit Kalorienstufe),
# X = feste Menge (Gemüse, Würzzutaten) – gleich in allen Stufen.
RECIPES = []

def R(id, name, diet, slot, minutes, ings, steps, spices='Salz, Pfeffer', note=None, desc=''):
    RECIPES.append(dict(id=id, name=name, diet=diet, slot=slot, minutes=minutes,
                        ings=ings, steps=steps, spices=spices, note=note, desc=desc))

# =============================== STANDARD (Mischkost) ===============================
R('std-f1', 'Skyr-Müsli mit Apfel & Walnüssen', 'standard', 'fruehstueck', 4,
  [('skyr', 300, 'P'), ('haferflocken', 50, 'C'), ('milch15', 100, 'X'), ('apfel', 120, 'X'), ('walnuesse', 15, 'F')],
  ['Apfel waschen, entkernen und grob raspeln oder klein würfeln.',
   'Skyr mit der Milch in einer Schüssel glatt rühren.',
   'Haferflocken und Apfel unterheben.',
   'Walnüsse grob hacken, darüberstreuen und mit Zimt bestäuben.'],
  spices='Zimt', desc='Express-Frühstück ohne Herd.')

R('std-f2', 'Lachs-Rührei auf Vollkornbrot', 'standard', 'fruehstueck', 12,
  [('ei', 2, 'P'), ('eiklar', 100, 'P'), ('lachs', 70, 'P'), ('vollkornbrot', 80, 'C'), ('butter', 5, 'F'), ('tomaten', 150, 'X')],
  ['Lachsfilet in kleine Würfel schneiden (TK-Lachs am Vorabend auftauen).',
   'Eier und Eiklar mit Salz und Pfeffer verquirlen.',
   'Butter in einer Pfanne bei mittlerer Hitze schmelzen, Lachswürfel 2 Minuten anbraten.',
   'Eier dazugeben und unter langsamem Rühren cremig stocken lassen.',
   'Brot toasten, Rührei darauf verteilen, Tomaten in Scheiben dazu, mit Schnittlauch bestreuen.'],
  spices='Salz, Pfeffer, Schnittlauch')

R('std-f3', 'Overnight Oats mit Skyr & Heidelbeeren', 'standard', 'fruehstueck', 5,
  [('skyr', 250, 'P'), ('haferflocken', 60, 'C'), ('milch15', 150, 'X'), ('heidelbeeren', 100, 'X'), ('mandeln', 15, 'F')],
  ['Haferflocken, Skyr und Milch in einem Glas oder einer Dose verrühren.',
   'Abgedeckt über Nacht (mind. 4 Stunden) in den Kühlschrank stellen.',
   'Morgens Heidelbeeren daraufgeben, Mandeln grob hacken und darüberstreuen.'],
  spices='Zimt oder Vanille nach Geschmack', note='Zubereitungszeit 5 Min. + über Nacht ziehen lassen.')

R('std-f4', 'Kartoffel-Hash mit Putenbrust & Spiegelei', 'standard', 'fruehstueck', 20,
  [('pute', 100, 'P'), ('ei', 2, 'P'), ('kartoffeln', 200, 'C'), ('paprika', 100, 'X'), ('zwiebel', 40, 'X'), ('olivenoel', 5, 'F')],
  ['Kartoffeln waschen und ungeschält in 1 cm große Würfel schneiden; Paprika und Zwiebel würfeln, Putenbrust in Streifen schneiden.',
   'Öl in einer großen Pfanne erhitzen, Kartoffelwürfel bei mittlerer Hitze 10–12 Minuten goldbraun braten.',
   'Putenstreifen, Paprika und Zwiebel dazugeben und 4–5 Minuten mitbraten, würzen.',
   'Zwei Mulden formen, Eier hineinschlagen, Deckel auflegen und 3–4 Minuten stocken lassen.'],
  spices='Salz, Pfeffer, Paprikapulver')

R('std-f5', 'Protein-Pancakes mit Himbeeren', 'standard', 'fruehstueck', 15,
  [('haferflocken', 50, 'C'), ('banane', 60, 'C'), ('ei', 2, 'P'), ('magerquark', 150, 'P'), ('kokosoel', 5, 'F'), ('himbeeren', 100, 'X')],
  ['Haferflocken, Banane, Eier, Magerquark und 1 TL Backpulver im Mixer zu einem dicken Teig pürieren.',
   'Teig 2 Minuten quellen lassen.',
   'Kokosöl in einer beschichteten Pfanne bei mittlerer Hitze erhitzen, kleine Pancakes ausbacken (ca. 2 Minuten pro Seite).',
   'Mit Himbeeren servieren.'],
  spices='1 TL Backpulver, Zimt')

R('std-m1', 'Lachs mit Ofenkartoffeln, Brokkoli & Kräuter-Skyr', 'standard', 'mittag', 35,
  [('lachs', 150, 'P'), ('skyr', 150, 'P'), ('kartoffeln', 300, 'C'), ('brokkoli', 200, 'X'), ('olivenoel', 5, 'F')],
  ['Ofen auf 200 °C (Umluft 180 °C) vorheizen. Kartoffeln waschen, vierteln, mit dem Öl, Salz und Rosmarin mischen und 25 Minuten backen.',
   'Lachs salzen und für die letzten 12–15 Minuten mit aufs Blech legen.',
   'Brokkoli in Röschen teilen und 5 Minuten dämpfen oder in Salzwasser garen.',
   'Skyr mit Kräutern, Zitronensaft, Salz und Pfeffer zu einem Dip verrühren und dazu servieren.'],
  spices='Salz, Pfeffer, Rosmarin, Zitronensaft, Dill oder Schnittlauch')

R('std-m2', 'Hähnchen-Reis-Bowl mit Avocado', 'standard', 'mittag', 25,
  [('haehnchen', 200, 'P'), ('reis', 70, 'C'), ('avocado', 60, 'F'), ('olivenoel', 5, 'F'), ('paprika', 100, 'X'), ('gurke', 100, 'X')],
  ['Reis nach Packungsanweisung garen.',
   'Hähnchen in Streifen schneiden, würzen und im Öl 6–8 Minuten rundum durchbraten.',
   'Paprika und Gurke in Streifen schneiden, Avocado in Scheiben schneiden.',
   'Alles in einer Schüssel anrichten und mit Limettensaft beträufeln.'],
  spices='Salz, Pfeffer, Paprikapulver, Limettensaft')

R('std-m3', 'Chili con Carne mit Reis', 'standard', 'mittag', 35,
  [('hack5', 200, 'P'), ('kidney', 150, 'C'), ('reis', 50, 'C'), ('passata', 200, 'X'), ('paprika', 100, 'X'), ('zwiebel', 50, 'X'), ('olivenoel', 10, 'F')],
  ['Reis nach Packungsanweisung garen.',
   'Zwiebel und Paprika würfeln. Öl erhitzen, Hackfleisch krümelig anbraten, Zwiebel und Paprika 3 Minuten mitbraten.',
   'Passierte Tomaten und abgespülte Kidneybohnen dazugeben, mit Kreuzkümmel, Paprika und Chili würzen.',
   '15 Minuten offen köcheln lassen, abschmecken und mit dem Reis servieren.'],
  spices='Salz, Pfeffer, Kreuzkümmel, Paprikapulver, Chili, Oregano')

R('std-m4', 'Thunfisch-Kichererbsen-Salat mit Feta & Brot', 'standard', 'mittag', 10,
  [('thunfisch', 150, 'P'), ('kichererbsen', 150, 'X'), ('vollkornbrot', 60, 'C'), ('feta', 30, 'X'), ('gurke', 150, 'X'), ('tomaten', 150, 'X'), ('olivenoel', 15, 'F')],
  ['Kichererbsen abgießen und abspülen, Thunfisch abtropfen lassen.',
   'Gurke und Tomaten würfeln, Feta zerbröseln.',
   'Alles mit Olivenöl, Zitronensaft, Salz, Pfeffer und Oregano vermengen und mit dem Brot servieren.'],
  spices='Salz, Pfeffer, Oregano, Zitronensaft', desc='Express-Mittagessen, ideal zum Mitnehmen.')

R('std-m5', 'Vollkornpasta Bolognese', 'standard', 'mittag', 30,
  [('hack5', 180, 'P'), ('parmesan', 20, 'P'), ('vollkornnudeln', 90, 'C'), ('passata', 250, 'X'), ('zwiebel', 60, 'X'), ('karotte', 60, 'X'), ('olivenoel', 10, 'F')],
  ['Zwiebel und Karotte fein würfeln. Öl erhitzen, Hackfleisch krümelig anbraten, Gemüse 3 Minuten mitbraten.',
   'Passierte Tomaten dazugeben, mit Oregano, Salz und Pfeffer würzen und 15 Minuten köcheln lassen.',
   'Nudeln nach Packungsanweisung in Salzwasser garen.',
   'Nudeln mit der Sauce servieren und mit geriebenem Parmesan bestreuen.'],
  spices='Salz, Pfeffer, Oregano, Basilikum')

R('std-a1', 'Putenpfanne mit Reis & Gemüse', 'standard', 'abend', 25,
  [('pute', 200, 'P'), ('reis', 80, 'C'), ('brokkoli', 150, 'X'), ('paprika', 100, 'X'), ('sojasauce', 15, 'X'), ('olivenoel', 10, 'F')],
  ['Reis nach Packungsanweisung garen.',
   'Pute in Streifen schneiden, Brokkoli in kleine Röschen, Paprika in Streifen.',
   'Öl in einer großen Pfanne stark erhitzen, Pute 4 Minuten anbraten, Gemüse dazugeben und 5 Minuten weiterbraten.',
   'Mit Sojasauce und Ingwer abschmecken, mit dem Reis servieren.'],
  spices='Pfeffer, Ingwer, Knoblauch')

R('std-a2', 'Rindersteak mit Süßkartoffeln & grünen Bohnen', 'standard', 'abend', 30,
  [('steak', 220, 'P'), ('suesskartoffel', 350, 'C'), ('gruene_bohnen', 200, 'X'), ('butter', 10, 'F')],
  ['Ofen auf 200 °C vorheizen. Süßkartoffeln in Spalten schneiden, salzen und 25 Minuten auf Backpapier backen.',
   'Bohnen 8 Minuten in Salzwasser garen.',
   'Steak trocken tupfen, in einer sehr heißen Pfanne je Seite 2–3 Minuten braten, dann die Butter dazugeben und das Steak damit übergießen.',
   '3 Minuten ruhen lassen, salzen, pfeffern und mit Süßkartoffeln und Bohnen servieren.'],
  spices='Salz, Pfeffer, Thymian')

R('std-a3', 'Kabeljau mit Kartoffelpüree & Erbsen', 'standard', 'abend', 30,
  [('kabeljau', 220, 'P'), ('kartoffeln', 400, 'C'), ('milch15', 100, 'X'), ('erbsen', 150, 'X'), ('butter', 15, 'F')],
  ['Kartoffeln schälen, vierteln und 20 Minuten in Salzwasser weich kochen.',
   'Erbsen 4 Minuten garen.',
   'Kabeljau salzen und in der Hälfte der Butter je Seite 3 Minuten braten.',
   'Kartoffeln abgießen, mit warmer Milch und restlicher Butter zerstampfen, mit Muskat abschmecken und alles zusammen servieren.'],
  spices='Salz, Pfeffer, Muskat, Zitronensaft')

R('std-a4', 'Hähnchen-Curry mit Reis', 'standard', 'abend', 30,
  [('haehnchen', 200, 'P'), ('reis', 80, 'C'), ('kokosmilch', 80, 'F'), ('spinat', 100, 'X'), ('passata', 100, 'X'), ('zwiebel', 50, 'X')],
  ['Reis nach Packungsanweisung garen.',
   'Zwiebel würfeln, Hähnchen in Würfel schneiden.',
   'Hähnchen ohne zusätzliches Fett in einer beschichteten Pfanne anbraten, Zwiebel und Currypulver 1 Minute mitrösten.',
   'Kokosmilch und passierte Tomaten dazugeben, 10 Minuten köcheln lassen, Spinat unterheben, bis er zusammenfällt.',
   'Abschmecken und mit dem Reis servieren.'],
  spices='Currypulver, Kurkuma, Ingwer, Salz')

R('std-a5', 'Knoblauch-Garnelen-Reispfanne', 'standard', 'abend', 20,
  [('garnelen', 250, 'P'), ('reis', 80, 'C'), ('zucchini', 150, 'X'), ('erbsen', 100, 'X'), ('knoblauch', 6, 'X'), ('olivenoel', 10, 'F')],
  ['Reis nach Packungsanweisung garen (geht auch gut mit Reis vom Vortag).',
   'Zucchini würfeln, Knoblauch fein hacken, Garnelen auftauen und trocken tupfen.',
   'Öl erhitzen, Garnelen 2–3 Minuten braten und herausnehmen.',
   'Zucchini, Erbsen und Knoblauch 4 Minuten braten, Reis und Garnelen untermischen, mit Zitrone und Petersilie abschmecken.'],
  spices='Salz, Pfeffer, Chiliflocken, Zitrone, Petersilie')

# =============================== VEGETARISCH ===============================
R('veg-f1', 'Schoko-Quark mit Haferflocken & Banane', 'vegetarisch', 'fruehstueck', 3,
  [('magerquark', 330, 'P'), ('haferflocken', 50, 'C'), ('banane', 60, 'C'), ('kakao', 10, 'X'), ('erdnussmus', 15, 'F')],
  ['Magerquark mit Kakaopulver und einem Schuss Wasser cremig rühren.',
   'Haferflocken unterrühren, Banane in Scheiben schneiden und daraufgeben.',
   'Erdnussmus darüberträufeln.'],
  spices='Zimt nach Geschmack', desc='Das schnellste Frühstück der App: 3 Minuten, kein Herd.')

R('veg-f2', 'Spinat-Feta-Omelett mit Vollkornbrot', 'vegetarisch', 'fruehstueck', 12,
  [('ei', 2, 'P'), ('eiklar', 150, 'P'), ('feta', 30, 'X'), ('spinat', 100, 'X'), ('vollkornbrot', 70, 'C'), ('olivenoel', 5, 'F')],
  ['Eier und Eiklar mit Salz und Pfeffer verquirlen.',
   'Öl in einer Pfanne erhitzen, Spinat 1 Minute zusammenfallen lassen.',
   'Eimasse darübergießen, Feta darüberbröseln, bei mittlerer Hitze mit Deckel 4–5 Minuten stocken lassen.',
   'Zusammenklappen und mit dem Brot servieren.'],
  spices='Salz, Pfeffer, Muskat')

R('veg-f3', 'Skyr-Chia-Pudding mit Mango', 'vegetarisch', 'fruehstueck', 5,
  [('skyr', 300, 'P'), ('chiasamen', 15, 'F'), ('milch15', 100, 'X'), ('mango', 120, 'C'), ('haferflocken', 30, 'C')],
  ['Skyr, Milch, Chiasamen und Haferflocken verrühren.',
   'Mindestens 15 Minuten (oder über Nacht) quellen lassen.',
   'Mango würfeln und darauf verteilen.'],
  spices='Vanille, Limettenabrieb', note='5 Min. + 15 Min. Quellzeit (oder am Vorabend vorbereiten).')

R('veg-f4', 'Hüttenkäse-Avocado-Toast mit Ei', 'vegetarisch', 'fruehstueck', 10,
  [('huettenkaese', 200, 'P'), ('ei', 2, 'P'), ('vollkornbrot', 80, 'C'), ('avocado', 50, 'F'), ('tomaten', 100, 'X')],
  ['Eier 8 Minuten kochen, abschrecken und pellen (oder vorgekochte Eier verwenden).',
   'Brot toasten, Avocado darauf zerdrücken, salzen und pfeffern.',
   'Hüttenkäse daraufgeben, Eier und Tomaten in Scheiben darauflegen, mit Chiliflocken bestreuen.'],
  spices='Salz, Pfeffer, Chiliflocken')

R('veg-f5', 'Apfel-Zimt-Porridge mit Quark', 'vegetarisch', 'fruehstueck', 8,
  [('haferflocken', 60, 'C'), ('milch15', 200, 'X'), ('magerquark', 250, 'P'), ('apfel', 120, 'X'), ('mandelmus', 10, 'F')],
  ['Haferflocken mit der Milch aufkochen und unter Rühren 3–4 Minuten köcheln lassen.',
   'Apfel klein würfeln und die letzte Minute mitkochen.',
   'Vom Herd nehmen, Magerquark unterrühren (macht es cremig und eiweißreich).',
   'Mit Zimt bestreuen und Mandelmus darübergeben.'],
  spices='Zimt, Prise Salz')

R('veg-m1', 'Shakshuka mit Kichererbsen & Feta', 'vegetarisch', 'mittag', 25,
  [('ei', 3, 'P'), ('eiklar', 150, 'P'), ('feta', 40, 'P'), ('kichererbsen', 150, 'C'), ('vollkornbrot', 60, 'C'), ('passata', 300, 'X'), ('paprika', 150, 'X'), ('zwiebel', 60, 'X'), ('olivenoel', 10, 'F')],
  ['Zwiebel und Paprika würfeln und im Öl 5 Minuten weich dünsten.',
   'Passierte Tomaten, Kichererbsen, Kreuzkümmel und Paprikapulver dazugeben, 8 Minuten köcheln lassen.',
   'Mulden formen, Eier hineinschlagen und das Eiklar dazwischengießen, Deckel auflegen und 6–8 Minuten stocken lassen.',
   'Feta darüberbröseln, mit Petersilie bestreuen, mit dem Brot servieren.'],
  spices='Salz, Pfeffer, Kreuzkümmel, Paprikapulver, Chili, Petersilie')

R('veg-m2', 'Räuchertofu-Bolognese mit Linsen- & Vollkornnudeln und Parmesan', 'vegetarisch', 'mittag', 25,
  [('raeuchertofu', 150, 'P'), ('parmesan', 20, 'P'), ('linsennudeln', 30, 'P'), ('vollkornnudeln', 50, 'C'), ('passata', 200, 'X'), ('karotte', 60, 'X'), ('zwiebel', 40, 'X'), ('olivenoel', 5, 'F')],
  ['Räuchertofu mit einer Gabel fein zerbröseln (oder grob reiben), Zwiebel und Karotte fein würfeln.',
   'Öl erhitzen, Tofu 5 Minuten anbraten, Zwiebel und Karotte 3 Minuten mitbraten.',
   'Passierte Tomaten dazugeben, mit Oregano, Salz und Pfeffer würzen und 10 Minuten köcheln lassen.',
   'Linsen- und Vollkornnudeln zusammen in Salzwasser nach Packungsanweisung garen (ca. 8–10 Minuten).',
   'Mit der Sauce mischen und mit geriebenem Parmesan servieren.'],
  spices='Salz, Pfeffer, Oregano, Basilikum, Paprikapulver')

R('veg-m3', 'Bauernfrühstück mit Hüttenkäse', 'vegetarisch', 'mittag', 25,
  [('ei', 4, 'P'), ('huettenkaese', 150, 'P'), ('kartoffeln', 300, 'C'), ('zwiebel', 60, 'X'), ('paprika', 100, 'X'), ('butter', 10, 'F')],
  ['Kartoffeln waschen, in dünne Scheiben schneiden und in der Butter 12–15 Minuten goldbraun braten.',
   'Zwiebel und Paprika würfeln und 3 Minuten mitbraten.',
   'Eier verquirlen, würzen, darübergießen und stocken lassen.',
   'Mit Hüttenkäse und Schnittlauch servieren.'],
  spices='Salz, Pfeffer, Majoran, Schnittlauch')

R('veg-m4', 'Griechischer Bauernsalat mit Hüttenkäse & Kichererbsen', 'vegetarisch', 'mittag', 10,
  [('huettenkaese', 250, 'P'), ('feta', 50, 'P'), ('kichererbsen', 200, 'C'), ('gurke', 150, 'X'), ('tomaten', 150, 'X'), ('paprika', 100, 'X'), ('olivenoel', 15, 'F')],
  ['Gurke, Tomaten und Paprika grob würfeln, Kichererbsen abspülen.',
   'Mit Olivenöl, Zitronensaft, Oregano, Salz und Pfeffer vermengen.',
   'Hüttenkäse daraufgeben und Feta darüberbröseln.'],
  spices='Salz, Pfeffer, Oregano, Zitronensaft, rote Zwiebel nach Geschmack', desc='Express-Mittagessen ohne Kochen.')

R('veg-m5', 'Caprese-Quinoa-Salat mit Hüttenkäse & Ei', 'vegetarisch', 'mittag', 20,
  [('mozzarella', 100, 'P'), ('huettenkaese', 150, 'P'), ('ei', 1, 'P'), ('quinoa', 70, 'C'), ('tomaten', 200, 'X'), ('salat', 50, 'X'), ('olivenoel', 10, 'F')],
  ['Quinoa heiß abspülen und in der doppelten Menge Salzwasser 12–15 Minuten garen, abkühlen lassen.',
   'Eier 8 Minuten kochen, abschrecken, pellen und vierteln.',
   'Tomaten und Mozzarella würfeln, mit Rucola, Quinoa, Olivenöl, Balsamico, Salz und Pfeffer mischen.',
   'Mit Hüttenkäse, Ei und Basilikum anrichten.'],
  spices='Salz, Pfeffer, Balsamico, Basilikum')

R('veg-a1', 'Linsen-Dal mit Reis & Skyr-Topping', 'vegetarisch', 'abend', 30,
  [('linsen_rot', 60, 'P'), ('skyr', 280, 'P'), ('reis', 60, 'C'), ('spinat', 100, 'X'), ('passata', 150, 'X'), ('zwiebel', 50, 'X'), ('butter', 10, 'F')],
  ['Reis nach Packungsanweisung garen.',
   'Zwiebel würfeln, in der Butter mit Currypulver, Kurkuma und Kreuzkümmel 2 Minuten andünsten.',
   'Gewaschene Linsen, passierte Tomaten und 300 ml Wasser dazugeben, 15 Minuten köcheln lassen.',
   'Spinat unterheben, abschmecken und mit Reis und einem Klecks Skyr (mit Salz und Zitrone verrührt) servieren.'],
  spices='Currypulver, Kurkuma, Kreuzkümmel, Ingwer, Salz, Zitrone')

R('veg-a2', 'Pellkartoffeln mit Kräuterquark & Leinöl', 'vegetarisch', 'abend', 25,
  [('magerquark', 400, 'P'), ('kartoffeln', 450, 'C'), ('leinoel', 10, 'F'), ('gurke', 150, 'X')],
  ['Kartoffeln waschen und in Salzwasser 20–25 Minuten kochen.',
   'Magerquark mit etwas Wasser, Kräutern, Salz und Pfeffer cremig rühren.',
   'Gurke in Scheiben schneiden.',
   'Kartoffeln mit Quark servieren und das Leinöl darüberträufeln (nicht erhitzen).'],
  spices='Salz, Pfeffer, Schnittlauch, Petersilie, Dill')

R('veg-a3', 'Ofen-Süßkartoffel mit Hüttenkäse & Bohnen', 'vegetarisch', 'abend', 45,
  [('suesskartoffel', 400, 'C'), ('huettenkaese', 250, 'P'), ('kidney', 150, 'P'), ('avocado', 40, 'F'), ('tomaten', 100, 'X')],
  ['Ofen auf 200 °C vorheizen. Süßkartoffeln längs halbieren, mit der Schnittfläche nach unten 35–40 Minuten backen.',
   'Kidneybohnen abspülen, mit gewürfelten Tomaten, Kreuzkümmel, Salz und Limette mischen.',
   'Süßkartoffeln mit einer Gabel auflockern, Bohnen und Hüttenkäse daraufgeben.',
   'Mit Avocadoscheiben und Koriander servieren.'],
  spices='Salz, Kreuzkümmel, Limette, Chili, Koriander', note='Aktive Zeit nur ca. 10 Minuten, Rest Backzeit.')

R('veg-a4', 'Gebratener Reis mit Ei & Edamame', 'vegetarisch', 'abend', 20,
  [('reis', 80, 'C'), ('ei', 3, 'P'), ('edamame', 150, 'P'), ('erbsen', 100, 'X'), ('karotte', 80, 'X'), ('sojasauce', 15, 'X'), ('olivenoel', 10, 'F')],
  ['Reis garen und abkühlen lassen (am besten Reis vom Vortag).',
   'Karotte fein würfeln. Öl in einer großen Pfanne erhitzen, Karotte, Erbsen und Edamame 4 Minuten braten.',
   'Gemüse zur Seite schieben, Eier hineinschlagen und verrührt stocken lassen.',
   'Reis dazugeben, 3 Minuten mitbraten, mit Sojasauce, Ingwer und Frühlingszwiebeln abschmecken.'],
  spices='Ingwer, Knoblauch, Frühlingszwiebel')

R('veg-a5', 'Abendbrot: Vollkornbrot, Hüttenkäse & Ei', 'vegetarisch', 'abend', 10,
  [('vollkornbrot', 150, 'C'), ('huettenkaese', 250, 'P'), ('ei', 2, 'P'), ('tomaten', 150, 'X'), ('gurke', 150, 'X'), ('butter', 10, 'F')],
  ['Eier 8 Minuten kochen und pellen (oder vorgekochte Eier verwenden).',
   'Brot dünn mit Butter bestreichen.',
   'Hüttenkäse daraufgeben, Eier, Tomaten und Gurke in Scheiben darauflegen, salzen, pfeffern, mit Schnittlauch bestreuen.'],
  spices='Salz, Pfeffer, Schnittlauch', desc='Klassisches Abendbrot, in 10 Minuten fertig.')

# =============================== VEGAN ===============================
R('vgn-f1', 'Tofu-Scramble mit Vollkornbrot', 'vegan', 'fruehstueck', 12,
  [('tofu', 250, 'P'), ('spinat', 100, 'X'), ('tomaten', 100, 'X'), ('vollkornbrot', 70, 'C'), ('olivenoel', 5, 'F')],
  ['Tofu mit den Händen in eine Pfanne bröseln.',
   'Mit dem Öl 5 Minuten anbraten, mit Kurkuma, Paprika, Salz und Kala Namak (Eigeschmack) würzen.',
   'Gewürfelte Tomaten und Spinat dazugeben, 2 Minuten mitgaren.',
   'Mit getoastetem Brot servieren.'],
  spices='Kurkuma, Paprikapulver, Salz, Pfeffer, optional Kala Namak und Hefeflocken')

R('vgn-f2', 'Protein-Overnight-Oats mit Heidelbeeren', 'vegan', 'fruehstueck', 5,
  [('haferflocken', 60, 'C'), ('sojamilch', 250, 'X'), ('proteinpulver_vegan', 25, 'P'), ('sojajoghurt', 100, 'X'), ('hanfsamen', 15, 'F'), ('heidelbeeren', 100, 'X')],
  ['Proteinpulver mit dem Sojadrink klümpchenfrei verrühren.',
   'Haferflocken und Sojajoghurt unterrühren, abgedeckt über Nacht kühl stellen.',
   'Morgens mit Heidelbeeren und Hanfsamen toppen.'],
  spices='Zimt, Vanille', note='5 Min. + über Nacht ziehen lassen. Eines von nur zwei veganen Rezepten mit Proteinpulver.')

R('vgn-f3', 'Tempeh-Avocado-Brot', 'vegan', 'fruehstueck', 12,
  [('tempeh', 150, 'P'), ('vollkornbrot', 90, 'C'), ('avocado', 40, 'F'), ('tomaten', 100, 'X'), ('sojasauce', 10, 'X')],
  ['Tempeh in dünne Scheiben schneiden.',
   'In einer beschichteten Pfanne ohne Fett je Seite 2–3 Minuten knusprig braten, mit Sojasauce ablöschen.',
   'Brot toasten, Avocado darauf zerdrücken, salzen.',
   'Tempeh und Tomatenscheiben darauflegen.'],
  spices='Salz, Pfeffer, Paprikapulver (geräuchert)')

R('vgn-f4', 'Schoko-Seidentofu-Bowl', 'vegan', 'fruehstueck', 5,
  [('seidentofu', 300, 'P'), ('proteinpulver_vegan', 20, 'P'), ('kakao', 10, 'X'), ('banane', 100, 'C'), ('haferflocken', 40, 'C'), ('erdnussmus', 15, 'F')],
  ['Seidentofu, Proteinpulver, Kakao und die Hälfte der Banane im Mixer cremig pürieren.',
   'In eine Schüssel geben, Haferflocken unterrühren.',
   'Mit restlicher Banane in Scheiben und Erdnussmus toppen.'],
  spices='Zimt, Prise Salz', desc='Express-Frühstück in 5 Minuten.')

R('vgn-f5', 'Baked Beans mit Räuchertofu auf Toast', 'vegan', 'fruehstueck', 15,
  [('raeuchertofu', 180, 'P'), ('weisse_bohnen', 150, 'P'), ('vollkornbrot', 70, 'C'), ('passata', 150, 'X'), ('zwiebel', 40, 'X'), ('olivenoel', 5, 'F')],
  ['Zwiebel fein würfeln und im Öl 3 Minuten andünsten.',
   'Passierte Tomaten, abgespülte Bohnen, Paprikapulver und etwas Senf dazugeben, 8 Minuten köcheln lassen.',
   'Räuchertofu würfeln und in einer zweiten Pfanne ohne Fett knusprig braten.',
   'Brot toasten, Bohnen und Tofu darauf servieren.'],
  spices='Salz, Pfeffer, Paprikapulver (geräuchert), Senf, Prise Zucker optional')

R('vgn-m1', 'Tofu-Erdnuss-Curry mit Reis', 'vegan', 'mittag', 30,
  [('tofu', 300, 'P'), ('edamame', 100, 'P'), ('reis', 60, 'C'), ('kokosmilch', 80, 'F'), ('erdnussmus', 15, 'F'), ('brokkoli', 150, 'X'), ('paprika', 100, 'X')],
  ['Reis nach Packungsanweisung garen.',
   'Tofu würfeln und in einer beschichteten Pfanne ohne Fett rundum goldbraun braten.',
   'Brokkoli und Paprika dazugeben, 3 Minuten braten.',
   'Kokosmilch, Erdnussmus, Currypaste und 100 ml Wasser einrühren, Edamame zugeben und 8 Minuten köcheln lassen.',
   'Mit Limette und Sojasauce abschmecken und mit Reis servieren.'],
  spices='rote Currypaste, Ingwer, Knoblauch, Limette, Sojasauce')

R('vgn-m2', 'Tofu-Soja-Bolognese mit Linsen- & Vollkornnudeln', 'vegan', 'mittag', 25,
  [('raeuchertofu', 150, 'P'), ('sojaschnetzel', 25, 'P'), ('linsennudeln', 30, 'P'), ('vollkornnudeln', 50, 'C'), ('passata', 200, 'X'), ('karotte', 60, 'X'), ('zwiebel', 40, 'X'), ('olivenoel', 5, 'F')],
  ['Sojaschnetzel 10 Minuten in heißer Gemüsebrühe einweichen und gut ausdrücken; Räuchertofu fein zerbröseln.',
   'Zwiebel und Karotte würfeln. Öl erhitzen, Tofu und Sojaschnetzel 5 Minuten anbraten, Gemüse 3 Minuten mitbraten.',
   'Passierte Tomaten dazugeben, mit Oregano, Salz und Pfeffer 10 Minuten köcheln lassen.',
   'Linsen- und Vollkornnudeln zusammen nach Packungsanweisung garen, mit der Sauce mischen.'],
  spices='Gemüsebrühe, Salz, Pfeffer, Oregano, Basilikum, Hefeflocken optional')

R('vgn-m3', 'Tempeh-Quinoa-Bowl mit Avocado', 'vegan', 'mittag', 25,
  [('tempeh', 200, 'P'), ('edamame', 80, 'P'), ('quinoa', 70, 'C'), ('avocado', 60, 'F'), ('gurke', 100, 'X'), ('sojasauce', 15, 'X')],
  ['Quinoa heiß abspülen und in der doppelten Menge Salzwasser 12–15 Minuten garen.',
   'Tempeh würfeln, in einer beschichteten Pfanne knusprig braten, mit Sojasauce ablöschen.',
   'Edamame 3 Minuten in kochendem Wasser garen.',
   'Quinoa, Tempeh, Edamame, Gurke und Avocado in einer Schüssel anrichten, mit Sesam und Limette verfeinern.'],
  spices='Limette, Sesam, Chiliflocken')

R('vgn-m4', 'Räuchertofu-Kichererbsen-Salat mit Tahin', 'vegan', 'mittag', 10,
  [('raeuchertofu', 200, 'P'), ('kichererbsen', 150, 'X'), ('vollkornbrot', 60, 'C'), ('gurke', 150, 'X'), ('tomaten', 150, 'X'), ('tahin', 20, 'F')],
  ['Räuchertofu würfeln, Kichererbsen abspülen, Gurke und Tomaten würfeln.',
   'Tahin mit Zitronensaft, 2–3 EL Wasser, Salz und Knoblauch zu einem Dressing rühren.',
   'Alles vermengen, mit Petersilie bestreuen und mit dem Brot servieren.'],
  spices='Zitronensaft, Knoblauch, Salz, Petersilie, Kreuzkümmel', desc='Express-Mittagessen ohne Kochen.')

R('vgn-m5', 'Chili sin Carne mit Tempeh & Reis', 'vegan', 'mittag', 35,
  [('tempeh', 120, 'P'), ('sojaschnetzel', 40, 'P'), ('kidney', 150, 'C'), ('reis', 40, 'C'), ('passata', 200, 'X'), ('paprika', 120, 'X'), ('zwiebel', 40, 'X'), ('olivenoel', 5, 'F'), ('avocado', 50, 'F')],
  ['Sojaschnetzel 10 Minuten in heißer Gemüsebrühe einweichen und ausdrücken. Reis garen.',
   'Tempeh fein zerbröseln. Zwiebel und Paprika würfeln, im Öl andünsten, Tempeh und Sojaschnetzel 5 Minuten mitbraten.',
   'Passierte Tomaten, Kidneybohnen und Gewürze dazugeben, 15 Minuten köcheln lassen.',
   'Mit Reis und Avocadowürfeln servieren.'],
  spices='Gemüsebrühe, Kreuzkümmel, Paprikapulver, Chili, Oregano, Salz, etwas Kakao')

R('vgn-a1', 'Linsen-Tofu-Dal mit Reis', 'vegan', 'abend', 30,
  [('linsen_rot', 70, 'P'), ('tofu', 250, 'P'), ('reis', 60, 'C'), ('spinat', 150, 'X'), ('passata', 150, 'X'), ('kokosoel', 5, 'F')],
  ['Reis nach Packungsanweisung garen.',
   'Gewürze im Kokosöl 1 Minute anrösten, gewaschene Linsen, passierte Tomaten und 350 ml Wasser dazugeben, 15 Minuten köcheln.',
   'Tofu würfeln, in einer beschichteten Pfanne goldbraun braten.',
   'Spinat ins Dal rühren, abschmecken, mit Tofu und Reis servieren.'],
  spices='Currypulver, Kurkuma, Kreuzkümmel, Ingwer, Knoblauch, Salz, Zitrone')

R('vgn-a2', 'Gebratener Reis mit Tofu & Edamame', 'vegan', 'abend', 20,
  [('tofu', 200, 'P'), ('edamame', 150, 'P'), ('reis', 90, 'C'), ('erbsen', 100, 'X'), ('karotte', 80, 'X'), ('sojasauce', 20, 'X'), ('olivenoel', 5, 'F')],
  ['Reis garen und abkühlen lassen (ideal: Reis vom Vortag).',
   'Tofu zerbröseln oder würfeln und im Öl 5 Minuten knusprig braten.',
   'Karotte, Erbsen und Edamame dazugeben, 4 Minuten braten.',
   'Reis untermischen, 3 Minuten mitbraten, mit Sojasauce und Ingwer abschmecken.'],
  spices='Ingwer, Knoblauch, Frühlingszwiebel, Chili')

R('vgn-a3', 'Ofen-Süßkartoffel mit Kichererbsen & Räuchertofu', 'vegan', 'abend', 35,
  [('suesskartoffel', 350, 'C'), ('kichererbsen', 200, 'P'), ('raeuchertofu', 150, 'P'), ('brokkoli', 150, 'X'), ('tahin', 15, 'F')],
  ['Ofen auf 200 °C vorheizen. Süßkartoffel würfeln, mit Kichererbsen, Paprika und Kreuzkümmel auf ein Blech geben, 25 Minuten backen.',
   'Räuchertofu und Brokkoli für die letzten 12 Minuten mit aufs Blech geben.',
   'Tahin mit Zitrone, Wasser und Salz zu einer Sauce rühren und darübergeben.'],
  spices='Paprikapulver, Kreuzkümmel, Salz, Zitrone')

R('vgn-a4', 'Linsen-Vollkorn-Pasta mit cremiger Tomaten-Seidentofu-Sauce', 'vegan', 'abend', 12,
  [('linsennudeln', 50, 'C'), ('vollkornnudeln', 40, 'C'), ('edamame', 150, 'P'), ('seidentofu', 250, 'P'), ('erbsen', 100, 'X'), ('passata', 200, 'X'), ('olivenoel', 10, 'F')],
  ['Linsen- und Vollkornnudeln zusammen in Salzwasser nach Packungsanweisung garen (ca. 8–10 Minuten), Erbsen und Edamame die letzten 3 Minuten mitkochen.',
   'Parallel passierte Tomaten mit Knoblauch, Salz und Oregano 5 Minuten köcheln lassen, dann den Seidentofu einrühren und mit dem Pürierstab cremig mixen.',
   'Alles mischen und mit Olivenöl und Basilikum servieren.'],
  spices='Knoblauch, Salz, Oregano, Basilikum, Chili', desc='Express-Abendessen in 12 Minuten.')

R('vgn-a5', 'Soja-Tofu-Gulasch mit Kartoffeln', 'vegan', 'abend', 35,
  [('sojaschnetzel', 40, 'P'), ('raeuchertofu', 150, 'P'), ('kartoffeln', 400, 'C'), ('paprika', 150, 'X'), ('zwiebel', 80, 'X'), ('passata', 150, 'X'), ('tomatenmark', 20, 'X'), ('olivenoel', 10, 'F')],
  ['Sojaschnetzel 10 Minuten in heißer Gemüsebrühe einweichen und gut ausdrücken.',
   'Kartoffeln schälen, würfeln und 15–20 Minuten in Salzwasser kochen.',
   'Räuchertofu würfeln. Zwiebel und Paprika würfeln, im Öl anbraten, Sojaschnetzel, Tofu und Tomatenmark 4 Minuten mitrösten.',
   'Passierte Tomaten und 150 ml Wasser dazugeben, mit Paprikapulver und Kümmel 15 Minuten schmoren, mit den Kartoffeln servieren.'],
  spices='Gemüsebrühe, Paprikapulver edelsüß & rosenscharf, Kümmel, Majoran, Salz')

# =============================== LOW CARB ===============================
R('lc-f1', 'Lachs-Rührei mit Avocado', 'lowcarb', 'fruehstueck', 12,
  [('ei', 3, 'P'), ('lachs', 80, 'P'), ('avocado', 50, 'F'), ('spinat', 80, 'X'), ('butter', 5, 'F')],
  ['Lachs würfeln, Eier mit Salz und Pfeffer verquirlen.',
   'Butter erhitzen, Lachs 2 Minuten braten, Spinat zusammenfallen lassen.',
   'Eier dazugeben und cremig stocken lassen.',
   'Mit Avocadoscheiben servieren.'],
  spices='Salz, Pfeffer, Dill')

R('lc-f2', 'Quark-Beeren-Bowl mit Walnüssen', 'lowcarb', 'fruehstueck', 3,
  [('magerquark', 300, 'P'), ('himbeeren', 120, 'C'), ('walnuesse', 20, 'F'), ('leinsamen', 10, 'F'), ('mandelmus', 10, 'F')],
  ['Magerquark mit einem Schuss Wasser cremig rühren.',
   'Himbeeren (TK kurz antauen lassen) darauf verteilen.',
   'Walnüsse hacken und mit Leinsamen darüberstreuen, Mandelmus darüberträufeln.'],
  spices='Zimt, Vanille', desc='Express-Frühstück in 3 Minuten.')

R('lc-f3', 'Hüttenkäse-Gemüse-Omelett', 'lowcarb', 'fruehstueck', 12,
  [('ei', 2, 'P'), ('eiklar', 100, 'P'), ('huettenkaese', 120, 'P'), ('paprika', 100, 'X'), ('zucchini', 100, 'X'), ('olivenoel', 5, 'F'), ('feta', 30, 'F'), ('avocado', 50, 'F')],
  ['Paprika und Zucchini klein würfeln und im Öl 4 Minuten braten.',
   'Eier und Eiklar mit Hüttenkäse, Salz und Pfeffer verquirlen.',
   'Über das Gemüse gießen, Feta darüberbröseln, mit Deckel bei mittlerer Hitze 5 Minuten stocken lassen.',
   'Mit Avocadoscheiben servieren.'],
  spices='Salz, Pfeffer, Kräuter der Provence')

R('lc-f4', 'Skyr-Joghurt mit Mandeln & Heidelbeeren', 'lowcarb', 'fruehstueck', 3,
  [('skyr', 250, 'P'), ('griech_joghurt', 100, 'F'), ('mandeln', 20, 'F'), ('heidelbeeren', 80, 'C')],
  ['Skyr und griechischen Joghurt verrühren.',
   'Heidelbeeren daraufgeben.',
   'Mandeln grob hacken und darüberstreuen.'],
  spices='Zimt', desc='Express-Frühstück in 3 Minuten.')

R('lc-f5', 'Chia-Skyr-Pudding mit Kokos & Himbeeren', 'lowcarb', 'fruehstueck', 5,
  [('skyr', 300, 'P'), ('chiasamen', 20, 'F'), ('kokosraspeln', 10, 'F'), ('mandeln', 15, 'F'), ('himbeeren', 80, 'C')],
  ['Skyr mit Chiasamen und 50 ml Wasser verrühren.',
   'Mindestens 15 Minuten (oder über Nacht) quellen lassen.',
   'Mit Himbeeren, Kokosraspeln und gehackten Mandeln toppen.'],
  spices='Vanille', note='5 Min. + 15 Min. Quellzeit.')

R('lc-m1', 'Lachs & Garnelen mit Brokkoli-Blumenkohl in Kräuter-Sahne', 'lowcarb', 'mittag', 25,
  [('lachs', 180, 'P'), ('garnelen', 100, 'P'), ('brokkoli', 200, 'X'), ('blumenkohl', 200, 'X'), ('butter', 10, 'F'), ('sahne', 50, 'F'), ('mandeln', 15, 'F')],
  ['Brokkoli und Blumenkohl in Röschen teilen und 6–8 Minuten dämpfen.',
   'Lachs salzen und in einer Pfanne auf der Hautseite 4 Minuten, dann 2 Minuten auf der anderen Seite braten.',
   'Garnelen in der Pfanne 2–3 Minuten mitbraten.',
   'Butter mit Knoblauch in der Pfanne aufschäumen, Sahne dazugeben und 2 Minuten zu einer Kräuter-Sahnesauce einkochen.',
   'Über Fisch und Gemüse geben und mit gehobelten, kurz gerösteten Mandeln bestreuen.'],
  spices='Salz, Pfeffer, Knoblauch, Petersilie, Zitrone')

R('lc-m2', 'Hähnchen-Caesar-Salat mit Avocado & Walnüssen', 'lowcarb', 'mittag', 20,
  [('haehnchen', 200, 'P'), ('parmesan', 20, 'P'), ('salat', 150, 'X'), ('olivenoel', 10, 'F'), ('griech_joghurt', 50, 'F'), ('avocado', 60, 'F'), ('walnuesse', 15, 'F')],
  ['Hähnchen würzen und in einer beschichteten Pfanne mit etwas vom Öl 6–8 Minuten braten, in Streifen schneiden.',
   'Griechischen Joghurt mit restlichem Öl, Zitronensaft, Senf, Knoblauch und der Hälfte des geriebenen Parmesans zu einem Dressing rühren.',
   'Romana zerkleinern, mit Dressing mischen, Hähnchen, Avocadowürfel, Walnüsse und restlichen Parmesan daraufgeben.'],
  spices='Salz, Pfeffer, Senf, Knoblauch, Zitronensaft, optional Sardellen')

R('lc-m3', 'Rinderhack-Gemüse-Pfanne mit Feta & Bohnen', 'lowcarb', 'mittag', 25,
  [('hack5', 220, 'P'), ('feta', 40, 'P'), ('kidney', 80, 'C'), ('zucchini', 200, 'X'), ('paprika', 150, 'X'), ('zwiebel', 50, 'X'), ('olivenoel', 10, 'F'), ('griech_joghurt', 80, 'F')],
  ['Zwiebel, Zucchini und Paprika würfeln.',
   'Öl erhitzen, Hack krümelig anbraten, Gemüse dazugeben und 6 Minuten braten.',
   'Kidneybohnen untermischen, mit Paprika, Kreuzkümmel, Salz und Pfeffer würzen.',
   'Feta darüberbröseln und mit einem Klecks griechischem Joghurt (mit Knoblauch und Salz verrührt) servieren.'],
  spices='Salz, Pfeffer, Paprikapulver, Kreuzkümmel, Oregano')

R('lc-m4', 'Thunfisch-Avocado-Salat mit Ei', 'lowcarb', 'mittag', 10,
  [('thunfisch', 150, 'P'), ('ei', 2, 'P'), ('avocado', 80, 'F'), ('olivenoel', 10, 'F'), ('salat', 100, 'X'), ('gurke', 100, 'X')],
  ['Eier 8 Minuten kochen (oder vorgekochte nehmen), pellen und vierteln.',
   'Salat und Gurke zerkleinern, Avocado würfeln, Thunfisch abtropfen lassen.',
   'Alles mit Olivenöl, Zitronensaft, Salz und Pfeffer vermengen.'],
  spices='Salz, Pfeffer, Zitronensaft, rote Zwiebel optional', desc='Express-Mittagessen.')

R('lc-m5', 'Hähnchen-Kokos-Curry mit Blumenkohlreis', 'lowcarb', 'mittag', 30,
  [('haehnchen', 220, 'P'), ('blumenkohl', 300, 'X'), ('spinat', 100, 'X'), ('zwiebel', 40, 'X'), ('kokosmilch', 120, 'F'), ('erbsen', 80, 'C')],
  ['Blumenkohl in der Küchenmaschine oder mit einer Reibe zu "Reis" zerkleinern.',
   'Hähnchen würfeln und in einer beschichteten Pfanne anbraten, Zwiebel und Currypaste 1 Minute mitrösten.',
   'Kokosmilch und Erbsen dazugeben, 8 Minuten köcheln lassen, Spinat unterheben.',
   'Blumenkohlreis in einer zweiten Pfanne 4–5 Minuten dünsten, salzen und zum Curry servieren.'],
  spices='Currypaste, Ingwer, Knoblauch, Salz, Limette')

R('lc-a1', 'Rindersteak mit Ofengemüse, Süßkartoffel & Joghurt-Dip', 'lowcarb', 'abend', 30,
  [('steak', 230, 'P'), ('suesskartoffel', 150, 'C'), ('zucchini', 150, 'X'), ('paprika', 150, 'X'), ('olivenoel', 10, 'F'), ('griech_joghurt', 80, 'F')],
  ['Ofen auf 200 °C vorheizen. Süßkartoffel, Zucchini und Paprika in Stücke schneiden, mit dem Öl, Salz und Rosmarin mischen, 25 Minuten backen.',
   'Steak in einer sehr heißen Pfanne je Seite 2–3 Minuten braten, 3 Minuten ruhen lassen.',
   'Griechischen Joghurt mit Knoblauch, Zitrone und Salz verrühren.',
   'Steak in Scheiben schneiden und mit Gemüse und Dip servieren.'],
  spices='Salz, Pfeffer, Rosmarin, Thymian, Knoblauch, Zitrone')

R('lc-a2', 'Kabeljau in Senf-Sahne mit Brokkoli & Kartoffeln', 'lowcarb', 'abend', 25,
  [('kabeljau', 300, 'P'), ('kartoffeln', 150, 'C'), ('brokkoli', 250, 'X'), ('sahne', 50, 'F'), ('butter', 5, 'F')],
  ['Kartoffeln würfeln und 15 Minuten in Salzwasser kochen, Brokkoli die letzten 5 Minuten mitgaren.',
   'Kabeljau salzen und in der Butter je Seite 3 Minuten braten, herausnehmen.',
   'Sahne mit 1 TL Senf in die Pfanne geben, kurz aufkochen, mit Dill abschmecken.',
   'Fisch mit Sauce, Kartoffeln und Brokkoli servieren.'],
  spices='Salz, Pfeffer, Senf, Dill, Zitrone')

R('lc-a3', 'Putenbrust mit Kräuterquark, Gemüse & Kichererbsen', 'lowcarb', 'abend', 25,
  [('pute', 180, 'P'), ('magerquark', 120, 'P'), ('kichererbsen', 100, 'C'), ('zucchini', 200, 'X'), ('paprika', 150, 'X'), ('olivenoel', 10, 'F'), ('avocado', 60, 'F')],
  ['Zucchini und Paprika in Streifen schneiden, Kichererbsen abspülen.',
   'Pute würzen und im Öl je Seite 4–5 Minuten braten, herausnehmen.',
   'Gemüse und Kichererbsen in der Pfanne 6 Minuten braten.',
   'Quark mit Kräutern, Knoblauch, Salz und etwas Wasser verrühren und mit Avocadoscheiben dazu servieren.'],
  spices='Salz, Pfeffer, Paprikapulver, Kräuter, Knoblauch')

R('lc-a4', 'Garnelen-Zucchini-Pfanne mit Feta & etwas Reis', 'lowcarb', 'abend', 15,
  [('garnelen', 250, 'P'), ('reis', 40, 'C'), ('zucchini', 300, 'X'), ('tomaten', 150, 'X'), ('knoblauch', 6, 'X'), ('olivenoel', 10, 'F'), ('feta', 50, 'F')],
  ['Reis nach Packungsanweisung garen (oder Reis vom Vortag nutzen).',
   'Zucchini würfeln, Tomaten vierteln, Knoblauch hacken.',
   'Öl erhitzen, Garnelen 2–3 Minuten braten, Zucchini, Tomaten und Knoblauch dazugeben, 5 Minuten braten.',
   'Feta darüberbröseln, mit Zitrone, Chili und Petersilie abschmecken, mit Reis servieren.'],
  spices='Salz, Chiliflocken, Zitrone, Petersilie', desc='Schnelles Abendessen in 15 Minuten.')

R('lc-a5', 'Hähnchen-Brokkoli-Auflauf mit Mozzarella', 'lowcarb', 'abend', 35,
  [('haehnchen', 180, 'P'), ('mozzarella', 60, 'P'), ('brokkoli', 300, 'X'), ('kartoffeln', 150, 'C'), ('sahne', 40, 'F')],
  ['Ofen auf 200 °C vorheizen. Kartoffeln in dünne Scheiben schneiden, Brokkoli in Röschen, Hähnchen in Würfel.',
   'Alles in eine Auflaufform geben, Sahne mit Salz, Pfeffer, Muskat und Knoblauch verrühren und darübergießen.',
   'Mit Mozzarella belegen und 25 Minuten backen, bis die Kartoffeln weich sind.'],
  spices='Salz, Pfeffer, Muskat, Knoblauch')

# =============================== KETO ===============================
R('keto-f1', 'Rührei mit Bacon & Avocado', 'keto', 'fruehstueck', 12,
  [('ei', 3, 'P'), ('eiklar', 120, 'P'), ('bacon', 30, 'P'), ('avocado', 60, 'F'), ('butter', 10, 'F')],
  ['Bacon in einer Pfanne ohne Fett knusprig braten, herausnehmen.',
   'Eier und Eiklar verquirlen, Butter in die Pfanne geben, Eimasse cremig stocken lassen.',
   'Mit Bacon und Avocadoscheiben servieren.'],
  spices='Salz, Pfeffer, Schnittlauch')

R('keto-f2', 'Hüttenkäse-Bowl mit Walnüssen, Kokos & Himbeeren', 'keto', 'fruehstueck', 3,
  [('huettenkaese', 280, 'P'), ('sahne', 30, 'F'), ('walnuesse', 25, 'F'), ('kokosraspeln', 15, 'F'), ('himbeeren', 40, 'X')],
  ['Hüttenkäse mit der Sahne verrühren.',
   'Walnüsse hacken und mit Kokosraspeln und Himbeeren darübergeben.'],
  spices='Zimt, Vanille', desc='Express-Frühstück in 3 Minuten.')

R('keto-f3', 'Käse-Spinat-Omelett', 'keto', 'fruehstueck', 10,
  [('ei', 4, 'P'), ('gouda', 40, 'P'), ('spinat', 100, 'X'), ('butter', 15, 'F'), ('sahne', 20, 'F')],
  ['Eier mit Sahne, Salz und Pfeffer verquirlen.',
   'Butter erhitzen, Spinat zusammenfallen lassen, Eimasse darübergießen.',
   'Geriebenen Gouda darüberstreuen, mit Deckel 4–5 Minuten stocken lassen und zusammenklappen.'],
  spices='Salz, Pfeffer, Muskat')

R('keto-f4', 'Avocado-Hüttenkäse-Bowl mit Ei', 'keto', 'fruehstueck', 10,
  [('huettenkaese', 200, 'P'), ('ei', 2, 'P'), ('avocado', 60, 'F'), ('olivenoel', 5, 'F'), ('gurke', 80, 'X')],
  ['Eier 8 Minuten kochen (oder vorgekochte nehmen), pellen und vierteln.',
   'Avocado und Gurke würfeln.',
   'Hüttenkäse in eine Schüssel geben, Avocado, Gurke und Eier daraufgeben, mit Olivenöl beträufeln, salzen, pfeffern und mit Chiliflocken bestreuen.'],
  spices='Salz, Pfeffer, Chiliflocken, Schnittlauch')

R('keto-f5', 'Lachs-Ei-Teller mit Frischkäse', 'keto', 'fruehstueck', 15,
  [('lachs', 100, 'P'), ('ei', 3, 'P'), ('gurke', 100, 'X'), ('frischkaese', 30, 'F'), ('olivenoel', 5, 'F')],
  ['Eier 8 Minuten kochen, abschrecken und pellen.',
   'Lachs salzen und im Öl je Seite 3 Minuten braten.',
   'Mit Eiern, Gurkenscheiben und Frischkäse (mit Dill verrührt) anrichten.'],
  spices='Salz, Pfeffer, Dill, Zitrone')

R('keto-m1', 'Lachs in Spinat-Sahne mit Parmesan', 'keto', 'mittag', 20,
  [('lachs', 230, 'P'), ('parmesan', 20, 'P'), ('spinat', 200, 'X'), ('sahne', 60, 'F'), ('butter', 10, 'F')],
  ['Lachs salzen und in der Butter je Seite 3–4 Minuten braten, herausnehmen.',
   'Knoblauch und Spinat in die Pfanne geben, zusammenfallen lassen.',
   'Sahne und geriebenen Parmesan einrühren, 2 Minuten einkochen lassen.',
   'Lachs zurück in die Sauce legen und servieren.'],
  spices='Salz, Pfeffer, Knoblauch, Muskat, Zitrone')

R('keto-m2', 'Burger-Bowl ohne Brötchen', 'keto', 'mittag', 20,
  [('hack20', 250, 'P'), ('gouda', 40, 'P'), ('salat', 100, 'X'), ('tomaten', 100, 'X'), ('gurke', 80, 'X'), ('avocado', 50, 'F'), ('olivenoel', 5, 'F')],
  ['Hackfleisch würzen, zu 2 Patties formen und im Öl je Seite 3–4 Minuten braten; zum Schluss Gouda darauf schmelzen lassen.',
   'Salat, Tomaten, Gurke und Avocado schneiden und in einer Schüssel anrichten.',
   'Patties daraufsetzen, mit Senf und Essiggurke servieren.'],
  spices='Salz, Pfeffer, Senf, Essiggurke')

R('keto-m3', 'Ofen-Hähnchenschenkel mit Brokkoli, Kräuter-Frischkäse & Mandeln', 'keto', 'mittag', 35,
  [('haehnchenschenkel', 260, 'P'), ('brokkoli', 250, 'X'), ('butter', 10, 'F'), ('frischkaese', 40, 'F'), ('mandeln', 20, 'F')],
  ['Ofen auf 200 °C vorheizen. Hähnchenschenkel mit Salz, Paprika und Knoblauch würzen, 25–30 Minuten backen.',
   'Brokkoli die letzten 12 Minuten mit aufs Blech geben.',
   'Frischkäse mit gehackten Kräutern, Knoblauch und 2 EL Wasser glatt rühren; Butter schmelzen.',
   'Fleisch und Brokkoli mit Butter beträufeln, Kräuter-Frischkäse dazu reichen, mit gehackten Mandeln bestreuen.'],
  spices='Salz, Pfeffer, Paprikapulver, Knoblauch, Petersilie', note='Aktive Zeit ca. 10 Minuten.')

R('keto-m4', 'Thunfisch-Mozzarella-Salat mit Avocado', 'keto', 'mittag', 8,
  [('thunfisch', 140, 'P'), ('mozzarella', 125, 'P'), ('salat', 100, 'X'), ('tomaten', 100, 'X'), ('olivenoel', 15, 'F'), ('avocado', 80, 'F'), ('walnuesse', 15, 'F')],
  ['Salat zerkleinern, Tomaten, Avocado und Mozzarella würfeln, Thunfisch abtropfen lassen.',
   'Alles mit Olivenöl, Balsamico, Salz, Pfeffer und Basilikum vermengen, gehackte Walnüsse darüberstreuen.'],
  spices='Salz, Pfeffer, Balsamico (1 TL), Basilikum', desc='Express-Mittagessen in 8 Minuten.')

R('keto-m5', 'Putengeschnetzeltes in Champignon-Rahm', 'keto', 'mittag', 25,
  [('pute', 230, 'P'), ('champignons', 200, 'X'), ('zwiebel', 30, 'X'), ('sahne', 80, 'F'), ('butter', 10, 'F')],
  ['Pute in Streifen schneiden, Champignons in Scheiben, Zwiebel fein würfeln.',
   'Pute in der Butter 4 Minuten scharf anbraten, herausnehmen.',
   'Champignons und Zwiebel 5 Minuten braten, Sahne dazugeben, 3 Minuten einkochen lassen.',
   'Pute zurückgeben, mit Salz, Pfeffer und Petersilie abschmecken.'],
  spices='Salz, Pfeffer, Paprikapulver, Petersilie')

R('keto-a1', 'Rindersteak mit Speckbohnen, Mandeln & Kräuterbutter', 'keto', 'abend', 25,
  [('steak', 240, 'P'), ('gruene_bohnen', 200, 'X'), ('butter', 15, 'F'), ('bacon', 30, 'F'), ('mandeln', 20, 'F')],
  ['Bohnen 8 Minuten in Salzwasser garen und abgießen.',
   'Bacon würfeln und knusprig braten, Bohnen und gehobelte Mandeln darin 2 Minuten schwenken.',
   'Steak in einer sehr heißen Pfanne je Seite 2–3 Minuten braten, 3 Minuten ruhen lassen.',
   'Butter mit gehackten Kräutern und Knoblauch verkneten oder in der Pfanne aufschäumen und über Steak und Bohnen geben.'],
  spices='Salz, Pfeffer, Knoblauch, Thymian, Petersilie')

R('keto-a2', 'Lachs mit Zucchini-Nudeln & Walnuss-Pesto', 'keto', 'abend', 20,
  [('lachs', 200, 'P'), ('parmesan', 30, 'P'), ('zucchini', 300, 'X'), ('olivenoel', 10, 'F'), ('walnuesse', 25, 'F')],
  ['Zucchini mit einem Spiralschneider oder Sparschäler zu Nudeln schneiden.',
   'Lachs salzen und mit etwas Öl je Seite 3–4 Minuten braten.',
   'Zucchini-Nudeln 2 Minuten in der Pfanne schwenken.',
   'Restliches Öl mit Walnüssen, Basilikum, Knoblauch und geriebenem Parmesan zu einem Pesto mixen und darübergeben.'],
  spices='Salz, Pfeffer, Basilikum, Knoblauch, Zitrone')

R('keto-a3', 'Hähnchen-Brokkoli-Käse-Auflauf', 'keto', 'abend', 35,
  [('haehnchen', 180, 'P'), ('gouda', 50, 'P'), ('brokkoli', 200, 'X'), ('sahne', 60, 'F'), ('butter', 10, 'F')],
  ['Ofen auf 200 °C vorheizen. Hähnchen würfeln, Brokkoli in Röschen teilen.',
   'Form mit der Butter ausstreichen, Hähnchen und Brokkoli hineingeben, Sahne mit Salz, Pfeffer, Muskat und Knoblauch würzen und darübergießen.',
   'Mit geriebenem Gouda bestreuen und 25 Minuten backen.'],
  spices='Salz, Pfeffer, Muskat, Knoblauch')

R('keto-a4', 'Knoblauch-Rahm-Garnelen mit Spinat', 'keto', 'abend', 12,
  [('garnelen', 280, 'P'), ('spinat', 200, 'X'), ('knoblauch', 10, 'X'), ('butter', 15, 'F'), ('sahne', 60, 'F')],
  ['Garnelen auftauen und trocken tupfen, Knoblauch fein hacken.',
   'Butter in einer Pfanne aufschäumen, Garnelen und Knoblauch 3 Minuten braten.',
   'Sahne angießen, Spinat dazugeben und zusammenfallen lassen, 2 Minuten einkochen, mit Zitrone und Chili abschmecken.'],
  spices='Salz, Chiliflocken, Zitrone, Petersilie', desc='Express-Abendessen in 12 Minuten.')

R('keto-a5', 'Hackpfanne mit Zucchini, Feta & Avocado', 'keto', 'abend', 25,
  [('hack5', 220, 'P'), ('feta', 50, 'P'), ('zucchini', 200, 'X'), ('paprika', 60, 'X'), ('olivenoel', 10, 'F'), ('avocado', 80, 'F')],
  ['Zucchini und Paprika würfeln.',
   'Öl erhitzen, Hack krümelig anbraten, Gemüse dazugeben und 6–8 Minuten braten.',
   'Mit Oregano, Paprika, Salz und Pfeffer würzen, Feta darüberbröseln.',
   'Mit Avocadowürfeln servieren.'],
  spices='Salz, Pfeffer, Oregano, Paprikapulver')

# =============================== RAY PEAT ===============================
R('rp-f1', 'Eier, Hüttenkäse & frischer Orangensaft', 'raypeat', 'fruehstueck', 10,
  [('ei', 2, 'P'), ('huettenkaese', 200, 'P'), ('orangensaft', 250, 'C'), ('butter', 10, 'F')],
  ['Butter in einer Pfanne schmelzen, Eier als Spiegel- oder Rührei bei mittlerer Hitze zubereiten.',
   'Mit Hüttenkäse anrichten, salzen.',
   'Orangensaft frisch pressen und dazu trinken.'],
  spices='Salz')

R('rp-f2', 'Honig-Quark mit Mango', 'raypeat', 'fruehstueck', 3,
  [('magerquark', 300, 'P'), ('milch', 100, 'X'), ('mango', 150, 'C'), ('honig', 20, 'C'), ('sahne', 20, 'F')],
  ['Magerquark mit Milch und Sahne cremig rühren.',
   'Mango würfeln und daraufgeben.',
   'Mit Honig beträufeln.'],
  spices='Prise Salz', desc='Express-Frühstück in 3 Minuten.')

R('rp-f3', 'Kartoffel-Rösti mit Spiegelei, Käse & Hüttenkäse', 'raypeat', 'fruehstueck', 20,
  [('kartoffeln', 250, 'C'), ('ei', 2, 'P'), ('gouda', 20, 'P'), ('huettenkaese', 120, 'P'), ('butter', 10, 'F')],
  ['Kartoffeln schälen, grob raspeln und gut ausdrücken, salzen.',
   'Butter erhitzen, Kartoffelmasse als flache Rösti hineingeben, je Seite 5–6 Minuten goldbraun braten.',
   'Geriebenen Gouda daraufstreuen, Eier daneben als Spiegelei braten und mit dem Hüttenkäse servieren.'],
  spices='Salz, Pfeffer')

R('rp-f4', 'Schoko-Milch-Gelatine-Pudding', 'raypeat', 'fruehstueck', 10,
  [('milch', 400, 'P'), ('gelatine', 15, 'P'), ('magerquark', 100, 'P'), ('kakao', 10, 'X'), ('honig', 25, 'C'), ('sahne', 20, 'F')],
  ['Gelatine in 50 ml kalter Milch 5 Minuten quellen lassen.',
   'Restliche Milch mit Kakao, Honig und Sahne erwärmen (nicht kochen), Gelatine darin auflösen.',
   'Etwas abkühlen lassen, Magerquark einrühren, in Gläser füllen und mind. 2 Stunden (oder über Nacht) kühlen.'],
  spices='Prise Salz, Vanille', note='10 Min. + 2 Std. Kühlzeit – ideal am Vorabend zubereiten.')

R('rp-f5', 'Hüttenkäse-Obstteller mit Honig', 'raypeat', 'fruehstueck', 5,
  [('huettenkaese', 250, 'P'), ('milch', 200, 'X'), ('ananas', 150, 'C'), ('honig', 10, 'C'), ('kokosraspeln', 10, 'F')],
  ['Ananas schälen und würfeln.',
   'Hüttenkäse in eine Schale geben, Ananas daraufgeben, mit Honig beträufeln und Kokosraspeln bestreuen.',
   'Milch dazu trinken.'],
  spices='–', desc='Express-Frühstück in 5 Minuten.')

R('rp-m1', 'Rinderhack-Kartoffel-Pfanne mit Käse', 'raypeat', 'mittag', 25,
  [('hack5', 200, 'P'), ('gouda', 40, 'P'), ('kartoffeln', 300, 'C'), ('zwiebel', 50, 'X'), ('butter', 10, 'F')],
  ['Kartoffeln schälen, würfeln und 10 Minuten in Salzwasser vorkochen.',
   'Butter erhitzen, Kartoffeln 8 Minuten goldbraun braten, herausnehmen.',
   'Hack mit Zwiebel krümelig anbraten, Kartoffeln zurückgeben.',
   'Mit geriebenem Gouda bestreuen, schmelzen lassen.'],
  spices='Salz, Pfeffer, Paprikapulver, Petersilie')

R('rp-m2', 'Garnelen in Kokos-Tomatensauce mit Reis', 'raypeat', 'mittag', 25,
  [('garnelen', 250, 'P'), ('reis', 70, 'C'), ('passata', 150, 'X'), ('kokosmilch', 100, 'F')],
  ['Reis nach Packungsanweisung garen.',
   'Passierte Tomaten mit Kokosmilch, Knoblauch, Ingwer und Salz aufkochen, 5 Minuten köcheln lassen.',
   'Garnelen hineingeben und 3–4 Minuten gar ziehen lassen.',
   'Mit Limette abschmecken und mit dem Reis servieren.'],
  spices='Salz, Knoblauch, Ingwer, Limette, Koriander')

R('rp-m3', 'Kabeljau mit Kartoffelpüree & Butter-Karotten', 'raypeat', 'mittag', 30,
  [('kabeljau', 250, 'P'), ('kartoffeln', 400, 'C'), ('milch', 100, 'X'), ('karotte', 150, 'X'), ('butter', 20, 'F')],
  ['Kartoffeln schälen, vierteln und 20 Minuten in Salzwasser kochen; Karotten in Scheiben 10 Minuten mitkochen oder dämpfen.',
   'Kabeljau salzen und in einem Teil der Butter je Seite 3 Minuten braten.',
   'Kartoffeln mit warmer Milch und Butter zu Püree stampfen, Karotten in restlicher Butter schwenken.'],
  spices='Salz, Muskat, Petersilie, Zitrone')

R('rp-m4', 'Masa-Tortillas mit Rindersteak & Käse', 'raypeat', 'mittag', 25,
  [('steak', 200, 'P'), ('gouda', 30, 'P'), ('masa', 80, 'C'), ('tomaten', 100, 'X'), ('butter', 10, 'F')],
  ['Masa Harina mit Salz und etwa gleicher Menge warmem Wasser zu einem geschmeidigen Teig kneten, 5 Minuten ruhen lassen.',
   'Kleine Kugeln formen, zwischen Backpapier flach drücken und in einer heißen, trockenen Pfanne je Seite 1 Minute backen.',
   'Steak in der Butter je Seite 2–3 Minuten braten, ruhen lassen, in Streifen schneiden.',
   'Tortillas mit Steak, geriebenem Käse und Tomatenwürfeln füllen.'],
  spices='Salz, Pfeffer, Limette, Koriander')

R('rp-m5', 'Leber-Zwiebel-Pfanne mit Kartoffelpüree', 'raypeat', 'mittag', 30,
  [('leber', 150, 'P'), ('hack5', 100, 'P'), ('kartoffeln', 350, 'C'), ('milch', 80, 'X'), ('zwiebel', 100, 'X'), ('butter', 15, 'F')],
  ['Kartoffeln schälen und 20 Minuten in Salzwasser kochen, mit Milch und einem Teil der Butter zu Püree stampfen.',
   'Zwiebeln in Ringe schneiden und in Butter goldbraun braten, Hack dazugeben und krümelig braten.',
   'Leber in Streifen schneiden, 2–3 Minuten mitbraten (innen leicht rosa), erst danach salzen.'],
  spices='Salz, Pfeffer, Majoran, Apfelstücke optional', note='Leber wegen des hohen Vitamin-A-Gehalts max. 1× pro Woche.')

R('rp-a1', 'Weißer Fisch mit Reis & Karottensalat', 'raypeat', 'abend', 25,
  [('kabeljau', 280, 'P'), ('reis', 80, 'C'), ('karotte', 150, 'X'), ('kokosoel', 10, 'F')],
  ['Reis nach Packungsanweisung garen.',
   'Karotten fein raspeln, mit etwas Kokosöl (geschmolzen), Essig und Salz zum klassischen Peat-Karottensalat mischen.',
   'Fisch salzen und im restlichen Kokosöl je Seite 3 Minuten braten.',
   'Mit Reis und Karottensalat servieren.'],
  spices='Salz, Apfelessig, Zitrone')

R('rp-a2', 'Rindergulasch mit Kartoffeln', 'raypeat', 'abend', 60,
  [('rindergulasch', 220, 'P'), ('gelatine', 10, 'P'), ('kartoffeln', 400, 'C'), ('zwiebel', 100, 'X'), ('paprika', 100, 'X'), ('tomatenmark', 20, 'X'), ('butter', 10, 'F')],
  ['Fleisch in Würfel schneiden, in der Butter portionsweise scharf anbraten.',
   'Zwiebel und Paprika würfeln, mitbraten, Tomatenmark 1 Minute mitrösten.',
   'Mit 300 ml Wasser ablöschen, Gelatine einrühren (macht die Sauce sämig), würzen und zugedeckt 50 Minuten schmoren (Schnellkochtopf: 20 Minuten).',
   'Kartoffeln schälen und 20 Minuten kochen, mit dem Gulasch servieren.'],
  spices='Salz, Paprikapulver edelsüß, Kümmel, Majoran, Lorbeer', note='Gut in größerer Menge vorzukochen. Aktive Zeit ca. 15 Minuten.')

R('rp-a3', 'Garnelen-Reispfanne mit Ananas', 'raypeat', 'abend', 20,
  [('garnelen', 280, 'P'), ('reis', 80, 'C'), ('ananas', 100, 'C'), ('paprika', 100, 'X'), ('kokosoel', 10, 'F')],
  ['Reis garen (oder Reis vom Vortag verwenden).',
   'Paprika und Ananas würfeln.',
   'Kokosöl erhitzen, Garnelen 2–3 Minuten braten, Paprika und Ananas 3 Minuten mitbraten.',
   'Reis untermischen, mit Salz, Ingwer und Limette abschmecken.'],
  spices='Salz, Ingwer, Limette, Chili')

R('rp-a4', 'Quark-Obst-Teller mit Orangensaft', 'raypeat', 'abend', 5,
  [('magerquark', 400, 'P'), ('milch', 100, 'X'), ('mango', 200, 'C'), ('orangensaft', 200, 'C'), ('honig', 20, 'C'), ('sahne', 30, 'F')],
  ['Magerquark mit Milch und Sahne cremig rühren.',
   'Mango würfeln und daraufgeben, mit Honig beträufeln.',
   'Orangensaft dazu trinken.'],
  spices='Prise Salz', desc='Express-Abendessen in 5 Minuten.')

R('rp-a5', 'Rindersteak mit Ofen-Pommes & Karottensalat', 'raypeat', 'abend', 35,
  [('steak', 230, 'P'), ('kartoffeln', 400, 'C'), ('kokosoel', 10, 'F'), ('karotte', 100, 'X')],
  ['Ofen auf 220 °C vorheizen. Kartoffeln in Stäbchen schneiden, mit geschmolzenem Kokosöl und Salz mischen, 25–30 Minuten backen (einmal wenden).',
   'Karotten raspeln und mit Essig und Salz anmachen.',
   'Steak in einer heißen Pfanne je Seite 2–3 Minuten braten, ruhen lassen und mit Pommes und Karottensalat servieren.'],
  spices='Salz, Pfeffer, Apfelessig')
