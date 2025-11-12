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

            // Create new block button
            $('#create-new-block').on('click', () => {
                this.openModal('#create-block-modal');
            });

            // Upload block ZIP button
            $('#upload-block-zip').on('click', () => {
                this.openModal('#upload-block-modal');
            });

            // Delete block button
            $(document).on('click', '.delete-block', (e) => {
                this.deleteBlock(e);
            });

            // Modal close buttons
            $('.modal-close, .modal-overlay').on('click', (e) => {
                this.closeModals();
            });

            // Create block form submit
            $('#create-block-form').on('submit', (e) => {
                e.preventDefault();
                this.createBlock();
            });

            // Upload block form submit
            $('#upload-block-form').on('submit', (e) => {
                e.preventDefault();
                this.uploadBlock();
            });

            // Auto-generate slug from title
            $('#block-title').on('input', (e) => {
                const title = $(e.target).val();
                const slug = title.toLowerCase()
                    .replace(/[^a-z0-9\s-]/g, '')
                    .replace(/\s+/g, '-')
                    .replace(/-+/g, '-')
                    .replace(/^-+|-+$/g, '');
                $('#block-slug').val(slug);
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

        createBlock() {
            const $form = $('#create-block-form');
            const formData = {
                action: 'modular_blocks_create_block',
                nonce: modularBlocksAdmin.nonce,
                slug: $('#block-slug').val(),
                title: $('#block-title').val(),
                description: $('#block-description').val(),
                category: $('#block-category').val(),
                icon: $('#block-icon').val() || 'star-filled',
                dynamic: $('#block-dynamic').is(':checked') ? 1 : 0
            };

            // Show loading
            const $submitBtn = $form.find('[type="submit"]');
            const originalText = $submitBtn.text();
            $submitBtn.prop('disabled', true).text('Erstelle...');

            $.ajax({
                url: modularBlocksAdmin.ajaxUrl,
                method: 'POST',
                data: formData,
                success: (response) => {
                    if (response.success) {
                        this.showNotice(response.data.message, 'success');
                        this.closeModals();
                        $form[0].reset();

                        // Reload page to show new block
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    } else {
                        this.showNotice(response.data || 'Fehler beim Erstellen des Blocks.', 'error');
                    }
                },
                error: (xhr, status, error) => {
                    console.error('AJAX Error:', error);
                    this.showNotice('Fehler beim Erstellen des Blocks.', 'error');
                },
                complete: () => {
                    $submitBtn.prop('disabled', false).text(originalText);
                }
            });
        }

        uploadBlock() {
            const $form = $('#upload-block-form');
            const fileInput = document.getElementById('block-zip-file');
            const file = fileInput.files[0];

            if (!file) {
                this.showNotice('Bitte wählen Sie eine ZIP-Datei aus.', 'error');
                return;
            }

            const formData = new FormData();
            formData.append('action', 'modular_blocks_upload_block');
            formData.append('nonce', modularBlocksAdmin.nonce);
            formData.append('block_zip', file);

            // Show loading
            const $submitBtn = $form.find('[type="submit"]');
            const originalText = $submitBtn.text();
            $submitBtn.prop('disabled', true).text('Lade hoch...');

            $.ajax({
                url: modularBlocksAdmin.ajaxUrl,
                method: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: (response) => {
                    if (response.success) {
                        this.showNotice(response.data.message, 'success');
                        this.closeModals();
                        $form[0].reset();

                        // Reload page to show new block
                        setTimeout(() => {
                            location.reload();
                        }, 1500);
                    } else {
                        this.showNotice(response.data || 'Fehler beim Hochladen des Blocks.', 'error');
                    }
                },
                error: (xhr, status, error) => {
                    console.error('AJAX Error:', error);
                    this.showNotice('Fehler beim Hochladen des Blocks.', 'error');
                },
                complete: () => {
                    $submitBtn.prop('disabled', false).text(originalText);
                }
            });
        }

        deleteBlock(e) {
            const $button = $(e.currentTarget);
            const blockName = $button.data('block');
            const $card = $button.closest('.block-card');

            if (!confirm('Möchten Sie diesen Block wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
                return;
            }

            // Add loading state
            $card.addClass('loading');
            $button.prop('disabled', true);

            $.ajax({
                url: modularBlocksAdmin.ajaxUrl,
                method: 'POST',
                data: {
                    action: 'modular_blocks_delete_block',
                    block_name: blockName,
                    nonce: modularBlocksAdmin.nonce
                },
                success: (response) => {
                    if (response.success) {
                        this.showNotice(response.data.message, 'success');
                        $card.fadeOut(300, function() {
                            $(this).remove();
                        });
                    } else {
                        this.showNotice(response.data || 'Fehler beim Löschen des Blocks.', 'error');
                        $card.removeClass('loading');
                        $button.prop('disabled', false);
                    }
                },
                error: (xhr, status, error) => {
                    console.error('AJAX Error:', error);
                    this.showNotice('Fehler beim Löschen des Blocks.', 'error');
                    $card.removeClass('loading');
                    $button.prop('disabled', false);
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

        openModal(selector) {
            $(selector).fadeIn(200);
        }

        closeModals() {
            $('.modular-blocks-modal').fadeOut(200);
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
