# Beispiel-Molekülstrukturen

Dieses Verzeichnis enthält Beispiel-Molekülstrukturen für das ChemViz Plugin.

## Verfügbare Strukturen

### water.pdb
- **Molekül**: Wasser (H₂O)
- **Format**: PDB
- **Verwendung**: Einfaches Beispiel für kleine Moleküle

**Shortcode-Beispiel**:
```
[chemviz_molecule url="/wp-content/plugins/modular-blocks-plugin/assets/structures/water.pdb" style="stick"]
```

### ethanol.pdb
- **Molekül**: Ethanol (C₂H₆O)
- **Format**: PDB
- **Verwendung**: Organisches Molekül mit funktioneller Gruppe

**Shortcode-Beispiel**:
```
[chemviz_molecule url="/wp-content/plugins/modular-blocks-plugin/assets/structures/ethanol.pdb" style="stick"]
```

## Eigene Strukturen hinzufügen

Sie können eigene Molekülstrukturen in folgenden Formaten hinzufügen:

- **.pdb** - Protein Data Bank Format
- **.sdf** - Structure Data File
- **.mol** - MDL Molfile
- **.mol2** - Sybyl Mol2
- **.xyz** - XYZ Format
- **.cif** - Crystallographic Information File

### Quellen für Molekülstrukturen

1. **PDB (Protein Data Bank)**
   - URL: https://www.rcsb.org/
   - Für Proteine, DNA, RNA
   - Direkter Download via PDB-ID im Plugin

2. **PubChem**
   - URL: https://pubchem.ncbi.nlm.nih.gov/
   - Für kleine organische Moleküle
   - Download als SDF-Datei

3. **ChemSpider**
   - URL: http://www.chemspider.com/
   - Chemische Strukturdatenbank
   - Verschiedene Export-Formate

4. **Selbst erstellen**
   - Mit ChemDraw, Avogadro, PyMOL
   - Export als PDB oder MOL

## Upload via WordPress Media Library

Benutzer können auch über die WordPress Media Library Strukturdateien hochladen:

1. Im Block-Editor: Block einfügen
2. Quelle: "Upload" wählen
3. "Datei hochladen" klicken
4. Struktur-Datei auswählen

Die hochgeladenen Dateien werden in `/wp-content/uploads/` gespeichert.
