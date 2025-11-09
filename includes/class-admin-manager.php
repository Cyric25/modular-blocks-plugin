<?php
/**
 * Admin Manager Class
 *
 * Handles admin interface for block management
 */

if (!defined('ABSPATH')) {
    exit;
}

class ModularBlocks_Admin_Manager {

    private $block_manager;

    public function __construct() {
        // Block manager will be set later to avoid circular dependencies
    }

    public function init() {
        add_action('admin_menu', [$this, 'add_admin_menu']);
        add_action('admin_init', [$this, 'register_settings']);
        add_action('admin_enqueue_scripts', [$this, 'enqueue_admin_scripts']);
        add_action('wp_ajax_modular_blocks_toggle_block', [$this, 'ajax_toggle_block']);
    }

    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        add_options_page(
            __('Modulare Blöcke', 'modular-blocks-plugin'),
            __('Modulare Blöcke', 'modular-blocks-plugin'),
            'manage_options',
            'modular-blocks-settings',
            [$this, 'admin_page_callback']
        );
    }

    /**
     * Register plugin settings
     */
    public function register_settings() {
        register_setting(
            'modular_blocks_settings',
            'modular_blocks_enabled_blocks',
            [
                'type' => 'array',
                'sanitize_callback' => [$this, 'sanitize_enabled_blocks']
            ]
        );
    }

    /**
     * Sanitize enabled blocks setting
     */
    public function sanitize_enabled_blocks($input) {
        if (!is_array($input)) {
            return [];
        }

        return array_map('sanitize_text_field', $input);
    }

    /**
     * Enqueue admin scripts and styles
     */
    public function enqueue_admin_scripts($hook) {
        if ($hook !== 'settings_page_modular-blocks-settings') {
            return;
        }

        wp_enqueue_style(
            'modular-blocks-admin',
            MODULAR_BLOCKS_PLUGIN_URL . 'admin/admin.css',
            [],
            MODULAR_BLOCKS_PLUGIN_VERSION
        );

        wp_enqueue_script(
            'modular-blocks-admin',
            MODULAR_BLOCKS_PLUGIN_URL . 'admin/admin.js',
            ['jquery'],
            MODULAR_BLOCKS_PLUGIN_VERSION,
            true
        );

        wp_localize_script('modular-blocks-admin', 'modularBlocksAdmin', [
            'ajaxUrl' => admin_url('admin-ajax.php'),
            'nonce' => wp_create_nonce('modular_blocks_admin'),
            'strings' => [
                'error' => __('Ein Fehler ist aufgetreten.', 'modular-blocks-plugin'),
                'saved' => __('Einstellungen gespeichert.', 'modular-blocks-plugin'),
            ]
        ]);
    }

    /**
     * Admin page callback
     */
    public function admin_page_callback() {
        // Get block manager instance
        $plugin_instance = ModularBlocksPlugin::get_instance();
        $this->block_manager = new ModularBlocks_Block_Manager();

        $available_blocks = $this->block_manager->get_available_blocks();
        ?>
        <div class="wrap">
            <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

            <div class="modular-blocks-admin">
                <div class="blocks-grid">
                    <h2><?php _e('Verfügbare Blöcke', 'modular-blocks-plugin'); ?></h2>

                    <?php if (empty($available_blocks)): ?>
                        <div class="notice notice-info">
                            <p><?php _e('Keine Blöcke gefunden. Fügen Sie Blöcke in den /blocks/ Ordner hinzu.', 'modular-blocks-plugin'); ?></p>
                        </div>
                    <?php else: ?>
                        <div id="blocks-container" class="blocks-container">
                            <?php foreach ($available_blocks as $block): ?>
                                <div class="block-card" data-block="<?php echo esc_attr($block['name']); ?>">
                                    <div class="block-header">
                                        <h3><?php echo esc_html($block['title']); ?></h3>
                                        <label class="toggle-switch">
                                            <input
                                                type="checkbox"
                                                class="block-toggle"
                                                data-block="<?php echo esc_attr($block['name']); ?>"
                                                <?php checked($block['enabled']); ?>
                                            >
                                            <span class="slider"></span>
                                        </label>
                                    </div>

                                    <div class="block-info">
                                        <p class="block-description">
                                            <?php echo esc_html($block['description'] ?: __('Keine Beschreibung verfügbar.', 'modular-blocks-plugin')); ?>
                                        </p>
                                        <div class="block-meta">
                                            <span class="block-category"><?php echo esc_html($block['category']); ?></span>
                                            <span class="block-name"><?php echo esc_html($block['name']); ?></span>
                                        </div>
                                    </div>

                                    <div class="block-status">
                                        <span class="status-indicator <?php echo $block['enabled'] ? 'enabled' : 'disabled'; ?>">
                                            <?php echo $block['enabled'] ? __('Aktiviert', 'modular-blocks-plugin') : __('Deaktiviert', 'modular-blocks-plugin'); ?>
                                        </span>
                                    </div>
                                </div>
                            <?php endforeach; ?>
                        </div>
                    <?php endif; ?>
                </div>

                <div class="plugin-info">
                    <h3><?php _e('Plugin Information', 'modular-blocks-plugin'); ?></h3>
                    <div class="info-grid">
                        <div class="info-item">
                            <strong><?php _e('Version:', 'modular-blocks-plugin'); ?></strong>
                            <span><?php echo MODULAR_BLOCKS_PLUGIN_VERSION; ?></span>
                        </div>
                        <div class="info-item">
                            <strong><?php _e('Verfügbare Blöcke:', 'modular-blocks-plugin'); ?></strong>
                            <span><?php echo count($available_blocks); ?></span>
                        </div>
                        <div class="info-item">
                            <strong><?php _e('Aktivierte Blöcke:', 'modular-blocks-plugin'); ?></strong>
                            <span><?php echo count(array_filter($available_blocks, fn($block) => $block['enabled'])); ?></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <?php
    }

    /**
     * AJAX handler for toggling blocks
     */
    public function ajax_toggle_block() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_die(__('Unzureichende Berechtigung.', 'modular-blocks-plugin'));
        }

        $block_name = sanitize_text_field($_POST['block_name'] ?? '');
        $enabled = filter_var($_POST['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (empty($block_name)) {
            wp_send_json_error(__('Ungültiger Block-Name.', 'modular-blocks-plugin'));
        }

        // Get current enabled blocks
        $enabled_blocks = get_option('modular_blocks_enabled_blocks', []);

        if ($enabled) {
            // Add block to enabled list
            if (!in_array($block_name, $enabled_blocks)) {
                $enabled_blocks[] = $block_name;
            }
        } else {
            // Remove block from enabled list
            $enabled_blocks = array_filter($enabled_blocks, fn($block) => $block !== $block_name);
        }

        // Update option
        $success = update_option('modular_blocks_enabled_blocks', array_values($enabled_blocks));

        if ($success) {
            wp_send_json_success([
                'message' => $enabled
                    ? __('Block aktiviert.', 'modular-blocks-plugin')
                    : __('Block deaktiviert.', 'modular-blocks-plugin'),
                'enabled' => $enabled
            ]);
        } else {
            wp_send_json_error(__('Fehler beim Speichern der Einstellungen.', 'modular-blocks-plugin'));
        }
    }
}