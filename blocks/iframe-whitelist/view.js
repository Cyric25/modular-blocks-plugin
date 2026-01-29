/**
 * Iframe Whitelist Block - Frontend JavaScript
 */
(function() {
    'use strict';

    function init() {
        document.querySelectorAll('.wp-block-modular-blocks-iframe-whitelist').forEach(function(block) {
            setupBlock(block);
        });
    }

    function setupBlock(block) {
        const fullscreenButton = block.querySelector('.iframe-fullscreen-button');
        const iframe = block.querySelector('.iframe-whitelist-frame');

        if (!fullscreenButton || !iframe) {
            return;
        }

        // Fullscreen button click
        fullscreenButton.addEventListener('click', function(e) {
            e.preventDefault();
            toggleFullscreen(block);
        });

        // ESC key to exit fullscreen
        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape' && block.classList.contains('is-fullscreen')) {
                exitFullscreen(block);
            }
        });

        // Handle native fullscreen change
        document.addEventListener('fullscreenchange', function() {
            if (!document.fullscreenElement && block.classList.contains('is-fullscreen')) {
                block.classList.remove('is-fullscreen');
                updateButtonState(fullscreenButton, false);
            }
        });

        // Iframe load handler
        iframe.addEventListener('load', function() {
            iframe.removeAttribute('data-loading');
        });
    }

    function toggleFullscreen(block) {
        if (block.classList.contains('is-fullscreen')) {
            exitFullscreen(block);
        } else {
            enterFullscreen(block);
        }
    }

    function enterFullscreen(block) {
        const button = block.querySelector('.iframe-fullscreen-button');

        // Try native fullscreen API first
        if (block.requestFullscreen) {
            block.requestFullscreen().then(function() {
                block.classList.add('is-fullscreen');
                updateButtonState(button, true);
            }).catch(function() {
                // Fallback to CSS fullscreen
                block.classList.add('is-fullscreen');
                updateButtonState(button, true);
                document.body.style.overflow = 'hidden';
            });
        } else if (block.webkitRequestFullscreen) {
            block.webkitRequestFullscreen();
            block.classList.add('is-fullscreen');
            updateButtonState(button, true);
        } else if (block.msRequestFullscreen) {
            block.msRequestFullscreen();
            block.classList.add('is-fullscreen');
            updateButtonState(button, true);
        } else {
            // CSS-only fullscreen
            block.classList.add('is-fullscreen');
            updateButtonState(button, true);
            document.body.style.overflow = 'hidden';
        }
    }

    function exitFullscreen(block) {
        const button = block.querySelector('.iframe-fullscreen-button');

        if (document.fullscreenElement) {
            document.exitFullscreen().catch(function() {});
        } else if (document.webkitFullscreenElement) {
            document.webkitExitFullscreen();
        } else if (document.msFullscreenElement) {
            document.msExitFullscreen();
        }

        block.classList.remove('is-fullscreen');
        updateButtonState(button, false);
        document.body.style.overflow = '';
    }

    function updateButtonState(button, isFullscreen) {
        if (!button) return;

        const icon = button.querySelector('.dashicons');
        const textSpan = button.querySelector('.iframe-button-text');

        if (icon) {
            if (isFullscreen) {
                icon.classList.remove('dashicons-fullscreen-alt');
                icon.classList.add('dashicons-fullscreen-exit-alt');
            } else {
                icon.classList.remove('dashicons-fullscreen-exit-alt');
                icon.classList.add('dashicons-fullscreen-alt');
            }
        }

        if (textSpan) {
            textSpan.textContent = isFullscreen ? 'Schließen' : 'Vollbild';
        }

        button.setAttribute('aria-label', isFullscreen ? 'Vollbild beenden' : 'Vollbild');
    }

    // Initialize on DOM ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

    // Handle dynamically added blocks
    if (typeof MutationObserver !== 'undefined') {
        new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                mutation.addedNodes.forEach(function(node) {
                    if (node.nodeType === 1) {
                        if (node.classList && node.classList.contains('wp-block-modular-blocks-iframe-whitelist')) {
                            setupBlock(node);
                        }
                        const blocks = node.querySelectorAll && node.querySelectorAll('.wp-block-modular-blocks-iframe-whitelist');
                        if (blocks) {
                            blocks.forEach(setupBlock);
                        }
                    }
                });
            });
        }).observe(document.body, { childList: true, subtree: true });
    }
})();
