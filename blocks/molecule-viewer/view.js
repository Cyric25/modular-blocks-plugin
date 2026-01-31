(function(window, document) {
    'use strict';

    const ChemVizMoleculeViewer = {
        viewers: new Map(),
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
            const hideLoading = () => {
                if (loadingEl) {
                    loadingEl.style.display = 'none';
                }
            };

            const onSuccess = (data, format) => {
                viewer.addModel(data, format);
                this.applyStyle(viewer, config);
                viewer.zoomTo();
                viewer.render();

                if (config.enableSpin) {
                    viewer.spin(true);
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
                        this.loadFromSMILES(config.smiles, viewer, config, hideLoading, onError);
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

        loadFromPubChem: function(query, type, onSuccess, onError) {
            // PubChem API URL construction
            let url;
            if (type === 'cid') {
                // Direct CID lookup
                url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${query}/SDF?record_type=3d`;
            } else {
                // Name lookup
                url = `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/SDF?record_type=3d`;
            }

            fetch(url)
                .then(response => {
                    if (!response.ok) {
                        // Try 2D if 3D not available
                        const url2d = type === 'cid'
                            ? `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/cid/${query}/SDF`
                            : `https://pubchem.ncbi.nlm.nih.gov/rest/pug/compound/name/${encodeURIComponent(query)}/SDF`;

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

        loadFromSMILES: function(smiles, viewer, config, hideLoading, onError) {
            // Use 3Dmol's built-in SMILES support or PubChem for conversion
            // First try PubChem's SMILES to 3D conversion
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
                .then(data => {
                    viewer.addModel(data, 'sdf');
                    this.applyStyle(viewer, config);
                    viewer.zoomTo();
                    viewer.render();

                    if (config.enableSpin) {
                        viewer.spin(true);
                    }

                    hideLoading();
                })
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
            const controls = element.querySelectorAll('.chemviz-viewer__button');
            const canvas = element.querySelector('.chemviz-viewer__canvas');

            controls.forEach(button => {
                button.addEventListener('click', (e) => {
                    e.preventDefault();
                    const action = button.dataset.action;
                    const viewer = this.viewers.get(canvas.id);

                    if (!viewer) return;

                    switch (action) {
                        case 'reset':
                            viewer.zoomTo();
                            viewer.render();
                            break;
                        case 'spin':
                            const isSpinning = viewer.isAnimated();
                            viewer.spin(!isSpinning);
                            button.textContent = isSpinning ? 'Drehen' : 'Stop';
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
