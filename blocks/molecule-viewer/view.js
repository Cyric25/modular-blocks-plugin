(function(window, document) {
    'use strict';

    const ChemVizMoleculeViewer = {
        viewers: new Map(),
        intersectionObserver: null,

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

            if (!canvas) {
                this.showError(element, 'Canvas element not found');
                return;
            }

            try {
                const viewer = window.$3Dmol.createViewer(canvas, {
                    backgroundColor: config.backgroundColor
                });

                // Load structure based on source type
                if (config.sourceType === 'pdb' && config.pdbId) {
                    fetch(`https://files.rcsb.org/download/${config.pdbId}.pdb`)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.text();
                        })
                        .then(data => {
                            viewer.addModel(data, 'pdb');
                            this.applyStyle(viewer, config);
                            viewer.zoomTo();
                            viewer.render();

                            if (config.enableSpin) {
                                viewer.spin(true);
                            }
                        })
                        .catch(error => {
                            console.error('ChemViz: Error loading PDB', error);
                            this.showError(element, `Failed to load PDB: ${config.pdbId}`);
                        });
                } else if (config.structureUrl) {
                    const format = this.getFormatFromUrl(config.structureUrl);
                    fetch(config.structureUrl)
                        .then(response => {
                            if (!response.ok) {
                                throw new Error(`HTTP error! status: ${response.status}`);
                            }
                            return response.text();
                        })
                        .then(data => {
                            viewer.addModel(data, format);
                            this.applyStyle(viewer, config);
                            viewer.zoomTo();
                            viewer.render();

                            if (config.enableSpin) {
                                viewer.spin(true);
                            }
                        })
                        .catch(error => {
                            console.error('ChemViz: Error loading structure from URL', error);
                            this.showError(element, 'Failed to load structure from URL');
                        });
                }

                this.viewers.set(canvas.id, viewer);
                this.setupResizeHandler(viewer);

            } catch (error) {
                console.error('ChemViz Viewer Error:', error);
                this.showError(element, error.message);
            }
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
            viewer.setStyle({}, {[config.displayStyle]: styleConfig});
        },

        getFormatFromUrl: function(url) {
            const extension = url.split('.').pop().toLowerCase();
            const formatMap = {
                'pdb': 'pdb',
                'sdf': 'sdf',
                'mol': 'mol',
                'mol2': 'mol2',
                'xyz': 'xyz',
                'cif': 'cif'
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

        setupResizeHandler: function(viewer) {
            let resizeTimeout;
            const debouncedResize = () => {
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    viewer.resize();
                    viewer.render();
                }, 250);
            };

            window.addEventListener('resize', debouncedResize);
            document.addEventListener('fullscreenchange', debouncedResize);
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
            if (container) {
                container.innerHTML = `
                    <div class="chemviz-viewer__error">
                        <strong>Fehler beim Laden der Molekülstruktur</strong>
                        <p>${message}</p>
                    </div>
                `;
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
