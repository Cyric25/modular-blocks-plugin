/**
 * Admin JavaScript for Modular Blocks Plugin
 */

(function($) {
    'use strict';

    class ModularBlocksAdmin {
        constructor() {
            this.init();
        }

        init() {
            this.bindEvents();
        }

        bindEvents() {
            // Block toggle switches
            $(document).on('change', '.block-toggle', (e) => {
                this.toggleBlock(e);
            });
        }

        toggleBlock(e) {
            const $toggle = $(e.target);
            const $card = $toggle.closest('.block-card');
            const blockName = $toggle.data('block');
            const enabled = $toggle.is(':checked');

            // Add loading state
            $card.addClass('loading');
            $toggle.prop('disabled', true);

            // AJAX request
            $.ajax({
                url: modularBlocksAdmin.ajaxUrl,
                method: 'POST',
                data: {
                    action: 'modular_blocks_toggle_block',
                    block_name: blockName,
                    enabled: enabled,
                    nonce: modularBlocksAdmin.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.updateBlockCard($card, enabled);
                        this.showNotice(response.data.message, 'success');
                    } else {
                        this.showNotice(response.data || modularBlocksAdmin.strings.error, 'error');
                        // Revert toggle state
                        $toggle.prop('checked', !enabled);
                    }
                },
                error: (xhr, status, error) => {
                    console.error('AJAX Error:', error);
                    this.showNotice(modularBlocksAdmin.strings.error, 'error');
                    // Revert toggle state
                    $toggle.prop('checked', !enabled);
                },
                complete: () => {
                    // Remove loading state
                    $card.removeClass('loading');
                    $toggle.prop('disabled', false);
                }
            });
        }

        updateBlockCard($card, enabled) {
            const $statusIndicator = $card.find('.status-indicator');

            // Update card classes
            $card.removeClass('enabled disabled').addClass(enabled ? 'enabled' : 'disabled');

            // Update status indicator
            $statusIndicator
                .removeClass('enabled disabled')
                .addClass(enabled ? 'enabled' : 'disabled')
                .text(enabled ? 'Aktiviert' : 'Deaktiviert');
        }

        showNotice(message, type = 'info') {
            // Remove existing notices
            $('.modular-blocks-notice').remove();

            // Create new notice
            const $notice = $(`
                <div class="notice notice-${type} modular-blocks-notice is-dismissible">
                    <p>${message}</p>
                </div>
            `);

            // Insert notice
            $('.wrap h1').after($notice);

            // Auto-dismiss success notices
            if (type === 'success') {
                setTimeout(() => {
                    $notice.fadeOut(() => {
                        $notice.remove();
                    });
                }, 3000);
            }

            // Scroll to notice
            $('html, body').animate({
                scrollTop: $notice.offset().top - 100
            }, 300);
        }
    }

    // Initialize when document is ready
    $(document).ready(() => {
        new ModularBlocksAdmin();
    });

})(jQuery);