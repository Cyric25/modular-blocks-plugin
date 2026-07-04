(function(window, document) {
    'use strict';

    const ChemVizMoleculeViewer = {
        viewers: new Map(),
        spinState: new Map(),  // Track spin state per viewer
        intersectionObserver: null,
        resizeHandlerAttached: false,

        init: function() {
            if (typeof window.$3Dmol === 'undefined') {
                console.error('ChemViz: 3Dmol.js library not loaded');
                return;
            }

            const viewerElements = document.querySelectorAll('[data-chemviz-viewer]');

            if (viewerElements.length === 0) {
                return;
            }

            this.setupIntersectionObserver();

            viewerElements.forEach(element => {
                this.initSingleViewer(element);
            });
        },

        setupIntersectionObserver: function() {
            if ('IntersectionObserver' in window) {
                this.intersectionObserver = new IntersectionObserver(
                    (entries) => {
                        entries.forEach(entry => {
                            if (entry.isIntersecting && !entry.target.dataset.loaded) {
                                this.loadViewer(entry.target);
                                entry.target.dataset.loaded = 'true';
                            }
                        });
                    },
                    { threshold: 0.1 }
                );
            }
        },

        initSingleViewer: function(element) {
            // DOM-Guard gegen Doppel-Initialisierung: wenn die Datei zweimal
            // lädt (Block + Shortcode auf einer Seite), läuft das IIFE erneut —
            // Map-basierte Guards überleben das nicht.
            if (element.dataset.initialized === 'true') return;
            element.dataset.initialized = 'true';

            const config = this.parseConfig(element);

            if (this.intersectionObserver) {
                this.intersectionObserver.observe(element);
            } else {
                this.loadViewer(element);
            }

            this.attachControlListeners(element, config);
            this.setupKeyboardNav(element);
        },

        parseConfig: function(element) {
            return {
                sourceType: element.dataset.sourceType || 'pdb',
                pdbId: element.dataset.pdbId || '',
                pubchemQuery: element.dataset.pubchemQuery || '',
                pubchemType: element.dataset.pubchemType || 'name',
                smiles: element.dataset.smiles || '',
                alphafoldId: element.dataset.alphafoldId || '',
                structureUrl: element.dataset.structureUrl || '',
                displayStyle: element.dataset.displayStyle || 'stick',
                colorScheme: element.dataset.colorScheme || 'default',
                backgroundColor: element.dataset.backgroundColor || '#000000',
                enableSpin: element.dataset.enableSpin === 'true'
            };
        },

        loadViewer: function(element) {
            const config = this.parseConfig(element);
            const canvas = element.querySelector('.chemviz-viewer__canvas');
            const loadingEl = element.querySelector('.chemviz-viewer__loading');

            if (!canvas) {
                this.showError(element, 'Canvas element not found');
                return;
            }

            // Generate unique ID if not present
            if (!canvas.id) {
                canvas.id = 'chemviz-' + Math.random().toString(36).substr(2, 9);
            }

            // Show loading
            if (loadingEl) {
                loadingEl.style.display = 'block';
            }

            try {
                const viewer = window.$3Dmol.createViewer(canvas, {
                    backgroundColor: config.backgroundColor
                });

                // Load structure based on source type
                this.loadStructure(viewer, config, element, loadingEl);

                this.viewers.set(canvas.id, viewer);
                this.setupGlobalResizeHandler();

            } catch (error) {
                console.error('ChemViz Viewer Error:', error);
                this.showError(element, error.message);
            }
        },

        loadStructure: function(viewer, config, element, loadingEl) {
            const self = this;
            const canvas = element.querySelector('.chemviz-viewer__canvas');

            const hideLoading = () => {
                if (loadingEl) {
                    loadingEl.style.display = 'none';
                }
            };

            const onSuccess = (data, format) => {
                viewer.addModel(data, format);
                self.applyStyle(viewer, config);
                viewer.zoomTo();
                viewer.render();

                if (config.enableSpin) {
                    viewer.spin(true);
                    // Track initial spin state
                    if (canvas && canvas.id) {
                        self.spinState.set(canvas.id, true);
                    }
                }

                hideLoading();
            };

            const onError = (message) => {
                console.error('ChemViz:', message);
                this.showError(element, message);
                hideLoading();
            };

            switch (config.sourceType) {
                case 'pdb':
                    if (config.pdbId) {
                        this.loadFromPDB(config.pdbId, onSuccess, onError);
                    } else {
                        onError('Keine PDB-ID angegeben');
                    }
                    break;

                case 'pubchem':
                    if (config.pubchemQuery) {
                        this.loadFromPubChem(config.pubchemQuery, config.pubchemType, onSuccess, onError);
                    } else {
                        onError('Keine PubChem-Abfrage angegeben');
                    }
                    break;

                case 'smiles':
                    if (config.smiles) {
                        this.loadFromSMILES(config.smiles, onSuccess, onError);
                    } else {
                        onError('Kein SMILES-String angegeben');
                    }
                    break;

                case 'alphafold':
                    if (config.alphafoldId) {
                        this.loadFromAlphaFold(config.alphafoldId, onSuccess, onError);
                    } else {
                        onError('Keine UniProt-ID angegeben');
                    }
                    break;

                case 'url':
                case 'upload':
                    if (config.structureUrl) {
                        this.loadFromURL(config.structureUrl, onSuccess, onError);
                    } else {
                        onError('Keine URL angegeben');
                    }
                    break;

                default:
                    onError('Unbekannter Quelltyp: ' + config.sourceType);
            }
        },

        loadFromPDB: function(pdbId, onSuccess, onError) {
            fetch(`https://files.rcsb.org/download/${pdbId}.pdb`)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`PDB ${pdbId} nicht gefunden (HTTP ${response.status})`);
                    }
                    return response.text();
                })
                .then(data => onSuccess(data, 'pdb'))
                .catch(error => onError(`Fehler beim Laden von PDB ${pdbId}: ${error.message}`));
        },

        // German to English molecule name translation
        moleculeTranslations: {
            // Grundchemikalien
            'wasser': 'water', 'schwefelsäure': 'sulfuric acid', 'salzsäure': 'hydrochloric acid',
            'salpetersäure': 'nitric acid', 'phosphorsäure': 'phosphoric acid',
            'kohlensäure': 'carbonic acid', 'flusssäure': 'hydrofluoric acid',
            'blausäure': 'hydrogen cyanide', 'natronlauge': 'sodium hydroxide',
            'kalilauge': 'potassium hydroxide', 'ammoniak': 'ammonia',
            'wasserstoffperoxid': 'hydrogen peroxide', 'kochsalz': 'sodium chloride',
            'natriumchlorid': 'sodium chloride', 'kaliumchlorid': 'potassium chloride',
            'calciumcarbonat': 'calcium carbonate', 'natriumhydrogencarbonat': 'sodium bicarbonate',
            'natriumcarbonat': 'sodium carbonate', 'kaliumnitrat': 'potassium nitrate',
            'silbernitrat': 'silver nitrate', 'kupfersulfat': 'copper sulfate',
            'eisenchlorid': 'iron chloride', 'magnesiumoxid': 'magnesium oxide',
            'calciumoxid': 'calcium oxide', 'aluminiumoxid': 'aluminum oxide',
            'kohlenstoffdioxid': 'carbon dioxide', 'kohlenstoffmonoxid': 'carbon monoxide',
            'schwefeldioxid': 'sulfur dioxide', 'stickstoffdioxid': 'nitrogen dioxide',
            'distickstoffmonoxid': 'nitrous oxide', 'lachgas': 'nitrous oxide',
            'ozon': 'ozone', 'sauerstoff': 'oxygen', 'stickstoff': 'nitrogen',
            'wasserstoff': 'hydrogen', 'chlor': 'chlorine', 'brom': 'bromine',
            'iod': 'iodine', 'jod': 'iodine',
            // Organische Chemie - Alkohole
            'methanol': 'methanol', 'ethanol': 'ethanol', 'propanol': 'propanol',
            'butanol': 'butanol', 'isopropanol': 'isopropanol', 'glycerin': 'glycerol',
            'glykol': 'ethylene glycol', 'ethylenglykol': 'ethylene glycol',
            // Organische Säuren
            'essigsäure': 'acetic acid', 'ameisensäure': 'formic acid',
            'zitronensäure': 'citric acid', 'milchsäure': 'lactic acid',
            'oxalsäure': 'oxalic acid', 'weinsäure': 'tartaric acid',
            'benzoesäure': 'benzoic acid', 'salicylsäure': 'salicylic acid',
            'bernsteinsäure': 'succinic acid', 'buttersäure': 'butyric acid',
            'propionsäure': 'propionic acid', 'acrylsäure': 'acrylic acid',
            'stearinsäure': 'stearic acid', 'ölsäure': 'oleic acid',
            'palmitinsäure': 'palmitic acid', 'linolsäure': 'linoleic acid',
            // Ketone, Aldehyde, Ester
            'aceton': 'acetone', 'formaldehyd': 'formaldehyde', 'acetaldehyd': 'acetaldehyde',
            'ethylacetat': 'ethyl acetate', 'methylacetat': 'methyl acetate',
            // Kohlenwasserstoffe
            'methan': 'methane', 'ethan': 'ethane', 'propan': 'propane', 'butan': 'butane',
            'pentan': 'pentane', 'hexan': 'hexane', 'heptan': 'heptane', 'oktan': 'octane',
            'ethen': 'ethylene', 'ethylen': 'ethylene', 'propen': 'propylene',
            'ethin': 'acetylene', 'acetylen': 'acetylene',
            'benzol': 'benzene', 'toluol': 'toluene', 'xylol': 'xylene',
            'naphthalin': 'naphthalene', 'anthracen': 'anthracene',
            'cyclohexan': 'cyclohexane', 'cyclopentan': 'cyclopentane',
            'styrol': 'styrene', 'phenol': 'phenol',
            // Amine & Stickstoffverbindungen
            'harnstoff': 'urea', 'anilin': 'aniline', 'pyridin': 'pyridine',
            'histamin': 'histamine', 'serotonin': 'serotonin', 'dopamin': 'dopamine',
            'adrenalin': 'epinephrine', 'noradrenalin': 'norepinephrine',
            'nikotin': 'nicotine', 'koffein': 'caffeine', 'theobromin': 'theobromine',
            // Zucker & Kohlenhydrate
            'glukose': 'glucose', 'glucose': 'glucose', 'traubenzucker': 'glucose',
            'fruktose': 'fructose', 'fruchtzucker': 'fructose',
            'saccharose': 'sucrose', 'rohrzucker': 'sucrose', 'haushaltszucker': 'sucrose',
            'maltose': 'maltose', 'malzzucker': 'maltose',
            'laktose': 'lactose', 'milchzucker': 'lactose',
            'galaktose': 'galactose', 'ribose': 'ribose', 'desoxyribose': 'deoxyribose',
            'stärke': 'starch', 'zellulose': 'cellulose',
            // Aminosäuren
            'glycin': 'glycine', 'alanin': 'alanine', 'valin': 'valine',
            'leucin': 'leucine', 'isoleucin': 'isoleucine', 'prolin': 'proline',
            'phenylalanin': 'phenylalanine', 'tryptophan': 'tryptophan',
            'methionin': 'methionine', 'serin': 'serine', 'threonin': 'threonine',
            'cystein': 'cysteine', 'tyrosin': 'tyrosine', 'asparagin': 'asparagine',
            'glutamin': 'glutamine', 'asparaginsäure': 'aspartic acid',
            'glutaminsäure': 'glutamic acid', 'lysin': 'lysine',
            'arginin': 'arginine', 'histidin': 'histidine',
            // Nucleotide & Basen
            'adenin': 'adenine', 'guanin': 'guanine', 'cytosin': 'cytosine',
            'thymin': 'thymine', 'uracil': 'uracil',
            // Vitamine
            'ascorbinsäure': 'ascorbic acid', 'retinol': 'retinol',
            'cholecalciferol': 'cholecalciferol', 'tocopherol': 'tocopherol',
            'riboflavin': 'riboflavin', 'thiamin': 'thiamine',
            'folsäure': 'folic acid', 'biotin': 'biotin',
            'pantothensäure': 'pantothenic acid', 'niacin': 'niacin',
            // Medikamente & bekannte Substanzen
            'aspirin': 'aspirin', 'paracetamol': 'acetaminophen', 'ibuprofen': 'ibuprofen',
            'penicillin': 'penicillin', 'insulin': 'insulin', 'morphin': 'morphine',
            'codein': 'codeine', 'atropin': 'atropine', 'chinin': 'quinine',
            // Fette & Lipide
            'cholesterin': 'cholesterol', 'cholesterol': 'cholesterol',
            'triglycerid': 'triglyceride', 'lecithin': 'lecithin',
            // Polymere & Sonstige
            'ethylenoxid': 'ethylene oxide', 'propylenoxid': 'propylene oxide',
            'dimethylsulfoxid': 'dimethyl sulfoxide', 'chloroform': 'chloroform',
            'dichlormethan': 'dichloromethane', 'tetrachlorkohlenstoff': 'carbon tetrachloride',
            'diethylether': 'diethyl ether', 'tetrahydrofuran': 'tetrahydrofuran',
            'essigsäureanhydrid': 'acetic anhydride', 'glycerinaldehyd': 'glyceraldehyde',
            'brenztraubensäure': 'pyruvic acid', 'acetessigsäure': 'acetoacetic acid',
        },

        translateMoleculeName: function(name) {
            const lower = name.toLowerCase().trim();
            return this.moleculeTranslations[lower] || name;
        },

        loadFromPubChem: function(query, type, onSuccess, onError) {
            // Translate German molecule name to English
            const searchQuery = (type === 'name') ? this.translateMoleculeName(query) : query;

            // PubChem API URL construction
            let url;
            if (type === 'cid') {
                url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${searchQuery}/SDF?record_type=3d`;
            } else {
                url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(searchQuery)}/SDF?record_type=3d`;
            }

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        // Try 2D if 3D not available
                        const url2d = type === 'cid'
                            ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${searchQuery}/SDF`
                            : `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(searchQuery)}/SDF`;

                        return fetch(url2d).then(res => {
                            if (!res.ok) {
                                throw new Error(`Molekül "${query}" nicht gefunden`);
                            }
                            return res.text();
                        });
                    }
                    return response.text();
                })
                .then(data => onSuccess(data, 'sdf'))
                .catch(error => onError(`Fehler beim Laden von PubChem: ${error.message}`));
        },

        loadFromSMILES: function(smiles, onSuccess, onError) {
            // Use PubChem's SMILES to 3D/2D conversion
            const url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF?record_type=3d`;

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        // Fallback to 2D
                        return fetch(`https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/smiles/${encodeURIComponent(smiles)}/SDF`)
                            .then(res => {
                                if (!res.ok) {
                                    throw new Error('SMILES konnte nicht konvertiert werden');
                                }
                                return res.text();
                            });
                    }
                    return response.text();
                })
                .then(data => onSuccess(data, 'sdf'))
                .catch(error => onError(`Fehler bei SMILES-Konvertierung: ${error.message}`));
        },

        loadFromAlphaFold: function(uniprotId, onSuccess, onError) {
            // AlphaFold API
            const url = `https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v4.pdb`;

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        // Try older version
                        return fetch(`https://alphafold.ebi.ac.uk/files/AF-${uniprotId}-F1-model_v3.pdb`)
                            .then(res => {
                                if (!res.ok) {
                                    throw new Error(`AlphaFold-Struktur für ${uniprotId} nicht gefunden`);
                                }
                                return res.text();
                            });
                    }
                    return response.text();
                })
                .then(data => onSuccess(data, 'pdb'))
                .catch(error => onError(`Fehler beim Laden von AlphaFold: ${error.message}`));
        },

        loadFromURL: function(url, onSuccess, onError) {
            const format = this.getFormatFromUrl(url);

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        throw new Error(`HTTP error! status: ${response.status}`);
                    }
                    return response.text();
                })
                .then(data => onSuccess(data, format))
                .catch(error => onError(`Fehler beim Laden von URL: ${error.message}`));
        },

        applyStyle: function(viewer, config) {
            const styleConfig = {};

            // Color scheme
            switch (config.colorScheme) {
                case 'carbon':
                    styleConfig.colorscheme = 'greenCarbon';
                    break;
                case 'spectrum':
                    styleConfig.colorscheme = 'spectrum';
                    break;
                case 'chain':
                    styleConfig.colorscheme = 'chain';
                    break;
                case 'ss':
                    styleConfig.colorscheme = 'ssPyMOL';
                    break;
                default:
                    styleConfig.colorscheme = 'default';
            }

            // Display style
            if (config.displayStyle === 'ballstick') {
                // Ball and stick combination
                viewer.setStyle({}, {
                    stick: { radius: 0.15, colorscheme: styleConfig.colorscheme },
                    sphere: { radius: 0.4, colorscheme: styleConfig.colorscheme }
                });
            } else if (config.displayStyle === 'line') {
                // Thicker lines for better visibility
                styleConfig.linewidth = 3;
                viewer.setStyle({}, { line: styleConfig });
            } else {
                viewer.setStyle({}, {[config.displayStyle]: styleConfig});
            }
        },

        getFormatFromUrl: function(url) {
            const extension = url.split('.').pop().toLowerCase().split('?')[0];
            const formatMap = {
                'pdb': 'pdb',
                'sdf': 'sdf',
                'mol': 'mol',
                'mol2': 'mol2',
                'xyz': 'xyz',
                'cif': 'cif',
                'mmcif': 'cif'
            };
            return formatMap[extension] || 'pdb';
        },

        attachControlListeners: function(element, config) {
            const self = this;
            const controls = element.querySelectorAll('.chemviz-viewer__button');
            const canvas = element.querySelector('.chemviz-viewer__canvas');
            const styleSelect = element.querySelector('.chemviz-viewer__style-select');

            // Hover effects for theme-colored buttons and select
            const interactiveEls = element.querySelectorAll('.chemviz-viewer__button, .chemviz-viewer__style-select');
            interactiveEls.forEach(el => {
                const hoverColor = el.dataset.hoverColor;
                const baseColor = el.dataset.baseColor;
                if (hoverColor && baseColor) {
                    el.addEventListener('mouseenter', () => {
                        el.style.backgroundColor = hoverColor;
                        el.style.background = hoverColor;
                    });
                    el.addEventListener('mouseleave', () => {
                        el.style.backgroundColor = baseColor;
                        el.style.background = baseColor;
                    });
                }
            });

            // Style switcher dropdown
            if (styleSelect) {
                styleSelect.addEventListener('change', () => {
                    const viewer = canvas.id ? self.viewers.get(canvas.id) : null;
                    if (!viewer) return;

                    const newStyle = styleSelect.value;
                    const updatedConfig = Object.assign({}, config, { displayStyle: newStyle });
                    self.applyStyle(viewer, updatedConfig);
                    viewer.render();
                    // Update config for subsequent operations
                    config.displayStyle = newStyle;
                });
            }

            controls.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = button.dataset.action;

                    // Get viewer at click time (ID might not exist when listener was attached)
                    const viewer = canvas.id ? self.viewers.get(canvas.id) : null;

                    if (!viewer) {
                        console.warn('ChemViz: Viewer not ready yet');
                        return;
                    }

                    switch (action) {
                        case 'reset':
                            viewer.zoomTo();
                            viewer.render();
                            break;
                        case 'spin':
                            const currentlySpinning = self.spinState.get(canvas.id) || false;
                            const newSpinState = !currentlySpinning;
                            viewer.spin(newSpinState);
                            self.spinState.set(canvas.id, newSpinState);
                            button.textContent = newSpinState ? 'Stop' : 'Drehen';
                            break;
                        case 'toggle-bg':
                            const container = element.querySelector('.chemviz-viewer__container');
                            // Store original bg from data attribute on first toggle
                            if (!element._originalBg) {
                                element._originalBg = element.dataset.backgroundColor || '#000000';
                            }
                            const isOriginal = config.backgroundColor === element._originalBg;
                            // Toggle: original → opposite (black↔white), opposite → original
                            const opposite = (element._originalBg === '#ffffff' || element._originalBg === '#fff') ? '#000000' : '#ffffff';
                            const newBg = isOriginal ? opposite : element._originalBg;
                            config.backgroundColor = newBg;
                            viewer.setBackgroundColor(newBg);
                            if (container) {
                                container.style.backgroundColor = newBg;
                            }
                            viewer.render();
                            break;
                        case 'fullscreen':
                            if (element.requestFullscreen) {
                                element.requestFullscreen();
                            } else if (element.webkitRequestFullscreen) {
                                element.webkitRequestFullscreen();
                            } else if (element.mozRequestFullScreen) {
                                element.mozRequestFullScreen();
                            }
                            break;
                    }
                });
            });
        },

        setupGlobalResizeHandler: function() {
            // Only attach once for all viewers
            if (this.resizeHandlerAttached) return;
            this.resizeHandlerAttached = true;

            let resizeTimeout;
            const self = this;

            // Debounced resize for window resize events
            const debouncedResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    self.resizeAllViewers();
                }, 150);
            };

            // Immediate resize for fullscreen changes
            const handleFullscreenChange = () => {
                // Use requestAnimationFrame for smooth transition
                requestAnimationFrame(() => {
                    // Small delay to let CSS transitions complete
                    setTimeout(() => {
                        self.resizeAllViewers();
                    }, 50);
                });
            };

            window.addEventListener('resize', debouncedResize);
            document.addEventListener('fullscreenchange', handleFullscreenChange);
            document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
            document.addEventListener('mozfullscreenchange', handleFullscreenChange);
        },

        resizeAllViewers: function() {
            this.viewers.forEach((viewer) => {
                try {
                    viewer.resize();
                    viewer.render();
                } catch (e) {
                    console.warn('ChemViz: Resize error', e);
                }
            });
        },

        setupKeyboardNav: function(element) {
            const canvas = element.querySelector('.chemviz-viewer__canvas');

            canvas.setAttribute('tabindex', '0');

            canvas.addEventListener('keydown', (e) => {
                const viewer = this.viewers.get(canvas.id);
                if (!viewer) return;

                switch (e.key) {
                    case 'ArrowUp':
                        viewer.rotate(10, 'x');
                        e.preventDefault();
                        break;
                    case 'ArrowDown':
                        viewer.rotate(-10, 'x');
                        e.preventDefault();
                        break;
                    case 'ArrowLeft':
                        viewer.rotate(10, 'y');
                        e.preventDefault();
                        break;
                    case 'ArrowRight':
                        viewer.rotate(-10, 'y');
                        e.preventDefault();
                        break;
                    case '+':
                    case '=':
                        viewer.zoom(1.2);
                        e.preventDefault();
                        break;
                    case '-':
                        viewer.zoom(0.8);
                        e.preventDefault();
                        break;
                    case 'r':
                    case 'R':
                        viewer.zoomTo();
                        e.preventDefault();
                        break;
                }
                viewer.render();
            });
        },

        showError: function(element, message) {
            const container = element.querySelector('.chemviz-viewer__container');
            const loadingEl = element.querySelector('.chemviz-viewer__loading');

            if (loadingEl) {
                loadingEl.style.display = 'none';
            }

            if (container) {
                const errorDiv = document.createElement('div');
                errorDiv.className = 'chemviz-viewer__error';
                errorDiv.innerHTML = `
                    <strong>Fehler beim Laden der Molekülstruktur</strong>
                    <p>${message}</p>
                `;
                container.appendChild(errorDiv);
            }
        }
    };

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => ChemVizMoleculeViewer.init());
    } else {
        ChemVizMoleculeViewer.init();
    }

    // Export for debugging
    window.ChemVizMoleculeViewer = ChemVizMoleculeViewer;

})(window, document);
