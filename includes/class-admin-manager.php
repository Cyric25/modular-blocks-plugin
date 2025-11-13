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
        add_action('wp_ajax_modular_blocks_create_block', [$this, 'ajax_create_block']);
        add_action('wp_ajax_modular_blocks_delete_block', [$this, 'ajax_delete_block']);
        add_action('wp_ajax_modular_blocks_upload_block', [$this, 'ajax_upload_block']);
        add_action('wp_ajax_modular_blocks_clear_cache', [$this, 'ajax_clear_cache']);
    }

    /**
     * Add admin menu page
     */
    public function add_admin_menu() {
        // Main menu page
        add_menu_page(
            __('Modulare Blöcke', 'modular-blocks-plugin'),
            __('Modulare Blöcke', 'modular-blocks-plugin'),
            'manage_options',
            'modular-blocks',
            [$this, 'admin_page_callback'],
            'dashicons-block-default',
            30
        );

        // Settings submenu (same page with different tab)
        add_submenu_page(
            'modular-blocks',
            __('Einstellungen', 'modular-blocks-plugin'),
            __('Einstellungen', 'modular-blocks-plugin'),
            'manage_options',
            'modular-blocks',
            [$this, 'admin_page_callback']
        );

        // Diagnostics submenu
        add_submenu_page(
            'modular-blocks',
            __('Diagnose', 'modular-blocks-plugin'),
            __('Diagnose', 'modular-blocks-plugin'),
            'manage_options',
            'modular-blocks-diagnostics',
            [$this, 'diagnostics_page_callback']
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
        // Check if we're on one of our plugin pages
        // Hook can be 'toplevel_page_modular-blocks' or 'modulare-blocke_page_modular-blocks-diagnostics'
        if (strpos($hook, 'modular-blocks') === false) {
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
                <!-- Action Buttons -->
                <div class="admin-actions">
                    <button type="button" class="button button-primary" id="create-new-block">
                        <span class="dashicons dashicons-plus-alt"></span>
                        <?php _e('Neuer Block', 'modular-blocks-plugin'); ?>
                    </button>
                    <button type="button" class="button" id="upload-block-zip">
                        <span class="dashicons dashicons-upload"></span>
                        <?php _e('Block hochladen (ZIP)', 'modular-blocks-plugin'); ?>
                    </button>
                    <button type="button" class="button button-secondary" id="clear-cache-button" style="background: #f0f0f1; border-color: #d63638; color: #d63638;">
                        <span class="dashicons dashicons-update"></span>
                        <?php _e('Cache leeren', 'modular-blocks-plugin'); ?>
                    </button>
                </div>

                <div class="notice notice-info inline" style="margin: 15px 0;">
                    <p><strong><?php _e('Blöcke in falscher Kategorie?', 'modular-blocks-plugin'); ?></strong> <?php _e('Klicken Sie auf "Cache leeren" und laden Sie dann den Browser neu (Strg+Shift+R).', 'modular-blocks-plugin'); ?></p>
                </div>

                <div class="blocks-grid">
                    <h2><?php _e('Verfügbare Blöcke', 'modular-blocks-plugin'); ?></h2>

                    <?php if (empty($available_blocks)): ?>
                        <div class="notice notice-info">
                            <p><?php _e('Keine Blöcke gefunden. Erstellen Sie einen neuen Block oder laden Sie einen hoch.', 'modular-blocks-plugin'); ?></p>
                        </div>
                    <?php else: ?>
                        <div id="blocks-container" class="blocks-container">
                            <?php foreach ($available_blocks as $block): ?>
                                <div class="block-card" data-block="<?php echo esc_attr($block['name']); ?>">
                                    <div class="block-header">
                                        <h3><?php echo esc_html($block['title']); ?></h3>
                                        <div class="block-actions">
                                            <label class="toggle-switch">
                                                <input
                                                    type="checkbox"
                                                    class="block-toggle"
                                                    data-block="<?php echo esc_attr($block['name']); ?>"
                                                    <?php checked($block['enabled']); ?>
                                                >
                                                <span class="slider"></span>
                                            </label>
                                            <button type="button" class="button-link delete-block" data-block="<?php echo esc_attr($block['name']); ?>" title="<?php _e('Block löschen', 'modular-blocks-plugin'); ?>">
                                                <span class="dashicons dashicons-trash"></span>
                                            </button>
                                        </div>
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
                            <span><?php echo count(array_filter($available_blocks, function($block) { return $block['enabled']; })); ?></span>
                        </div>
                        <div class="info-item">
                            <strong><?php _e('Blocks Ordner:', 'modular-blocks-plugin'); ?></strong>
                            <span><code><?php echo esc_html(MODULAR_BLOCKS_PLUGIN_PATH . 'blocks/'); ?></code></span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal: Create New Block -->
        <div id="create-block-modal" class="modular-blocks-modal" style="display:none;">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2><?php _e('Neuen Block erstellen', 'modular-blocks-plugin'); ?></h2>
                    <button type="button" class="modal-close">
                        <span class="dashicons dashicons-no"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="create-block-form">
                        <p class="form-field">
                            <label for="block-slug"><?php _e('Block Slug (nur Kleinbuchstaben und Bindestriche)', 'modular-blocks-plugin'); ?> *</label>
                            <input type="text" id="block-slug" name="slug" required pattern="[a-z-]+" placeholder="my-custom-block">
                            <span class="description"><?php _e('Wird als Ordnername verwendet', 'modular-blocks-plugin'); ?></span>
                        </p>
                        <p class="form-field">
                            <label for="block-title"><?php _e('Block Titel', 'modular-blocks-plugin'); ?> *</label>
                            <input type="text" id="block-title" name="title" required placeholder="Mein Custom Block">
                        </p>
                        <p class="form-field">
                            <label for="block-description"><?php _e('Beschreibung', 'modular-blocks-plugin'); ?></label>
                            <textarea id="block-description" name="description" rows="3" placeholder="Eine kurze Beschreibung des Blocks..."></textarea>
                        </p>
                        <p class="form-field">
                            <label for="block-category"><?php _e('Kategorie', 'modular-blocks-plugin'); ?></label>
                            <select id="block-category" name="category">
                                <option value="text"><?php _e('Text', 'modular-blocks-plugin'); ?></option>
                                <option value="media"><?php _e('Medien', 'modular-blocks-plugin'); ?></option>
                                <option value="design"><?php _e('Design', 'modular-blocks-plugin'); ?></option>
                                <option value="widgets"><?php _e('Widgets', 'modular-blocks-plugin'); ?></option>
                                <option value="theme"><?php _e('Theme', 'modular-blocks-plugin'); ?></option>
                                <option value="embed"><?php _e('Einbetten', 'modular-blocks-plugin'); ?></option>
                            </select>
                        </p>
                        <p class="form-field">
                            <label for="block-icon"><?php _e('Icon (Dashicon Name)', 'modular-blocks-plugin'); ?></label>
                            <input type="text" id="block-icon" name="icon" placeholder="star-filled">
                            <span class="description">
                                <a href="https://developer.wordpress.org/resource/dashicons/" target="_blank"><?php _e('Dashicons anzeigen', 'modular-blocks-plugin'); ?></a>
                            </span>
                        </p>
                        <p class="form-field">
                            <label>
                                <input type="checkbox" id="block-dynamic" name="dynamic" value="1">
                                <?php _e('Dynamischer Block (mit PHP render.php)', 'modular-blocks-plugin'); ?>
                            </label>
                        </p>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="button modal-close"><?php _e('Abbrechen', 'modular-blocks-plugin'); ?></button>
                    <button type="submit" form="create-block-form" class="button button-primary"><?php _e('Block erstellen', 'modular-blocks-plugin'); ?></button>
                </div>
            </div>
        </div>

        <!-- Modal: Upload Block ZIP -->
        <div id="upload-block-modal" class="modular-blocks-modal" style="display:none;">
            <div class="modal-overlay"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2><?php _e('Block hochladen (ZIP)', 'modular-blocks-plugin'); ?></h2>
                    <button type="button" class="modal-close">
                        <span class="dashicons dashicons-no"></span>
                    </button>
                </div>
                <div class="modal-body">
                    <form id="upload-block-form" enctype="multipart/form-data">
                        <p class="form-field">
                            <label for="block-zip-file"><?php _e('Block ZIP-Datei', 'modular-blocks-plugin'); ?> *</label>
                            <input type="file" id="block-zip-file" name="block_zip" accept=".zip" required>
                            <span class="description">
                                <?php _e('ZIP-Datei muss block.json im Hauptverzeichnis enthalten', 'modular-blocks-plugin'); ?>
                            </span>
                        </p>
                        <div class="upload-info">
                            <p><strong><?php _e('Anforderungen:', 'modular-blocks-plugin'); ?></strong></p>
                            <ul>
                                <li><?php _e('ZIP muss einen Ordner mit block.json enthalten', 'modular-blocks-plugin'); ?></li>
                                <li><?php _e('Alle kompilierten JS/CSS Dateien müssen enthalten sein', 'modular-blocks-plugin'); ?></li>
                                <li><?php _e('Optional: render.php für dynamische Blöcke', 'modular-blocks-plugin'); ?></li>
                            </ul>
                        </div>
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="button modal-close"><?php _e('Abbrechen', 'modular-blocks-plugin'); ?></button>
                    <button type="submit" form="upload-block-form" class="button button-primary"><?php _e('Hochladen', 'modular-blocks-plugin'); ?></button>
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
            wp_send_json_error(__('Unzureichende Berechtigung.', 'modular-blocks-plugin'));
            return;
        }

        $block_name = sanitize_text_field($_POST['block_name'] ?? '');
        $enabled = filter_var($_POST['enabled'] ?? false, FILTER_VALIDATE_BOOLEAN);

        if (empty($block_name)) {
            wp_send_json_error(__('Ungültiger Block-Name.', 'modular-blocks-plugin'));
            return;
        }

        // Get current enabled blocks
        $enabled_blocks = get_option('modular_blocks_enabled_blocks', []);

        // Ensure it's an array
        if (!is_array($enabled_blocks)) {
            $enabled_blocks = [];
        }

        if ($enabled) {
            // Add block to enabled list
            if (!in_array($block_name, $enabled_blocks)) {
                $enabled_blocks[] = $block_name;
            }
        } else {
            // Remove block from enabled list
            $enabled_blocks = array_filter($enabled_blocks, function($block) use ($block_name) {
                return $block !== $block_name;
            });
        }

        // Update option - use array_values to reset keys
        $enabled_blocks = array_values($enabled_blocks);
        update_option('modular_blocks_enabled_blocks', $enabled_blocks);

        // Verify the option was saved correctly
        $saved_blocks = get_option('modular_blocks_enabled_blocks', []);
        $is_enabled = in_array($block_name, $saved_blocks);

        // Check if the desired state matches the saved state
        if ($is_enabled === $enabled) {
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

    /**
     * AJAX handler for creating new blocks
     */
    public function ajax_create_block() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unzureichende Berechtigung.', 'modular-blocks-plugin'));
            return;
        }

        // Rate limiting: Max 5 block creations per minute per user
        $user_id = get_current_user_id();
        $rate_limit_key = 'modular_blocks_create_limit_' . $user_id;
        $recent_creates = get_transient($rate_limit_key);

        if ($recent_creates && $recent_creates >= 5) {
            wp_send_json_error(__('Zu viele Anfragen. Bitte warten Sie eine Minute.', 'modular-blocks-plugin'));
            return;
        }

        // Increment rate limit counter
        set_transient($rate_limit_key, ($recent_creates ? $recent_creates + 1 : 1), 60);

        $slug = sanitize_title($_POST['slug'] ?? '');
        $title = sanitize_text_field($_POST['title'] ?? '');
        $description = sanitize_textarea_field($_POST['description'] ?? '');
        $category = sanitize_text_field($_POST['category'] ?? 'widgets');
        $icon = sanitize_text_field($_POST['icon'] ?? 'star-filled');
        $dynamic = !empty($_POST['dynamic']);

        if (empty($slug) || empty($title)) {
            wp_send_json_error(__('Slug und Titel sind erforderlich.', 'modular-blocks-plugin'));
            return;
        }

        $block_dir = MODULAR_BLOCKS_PLUGIN_PATH . 'blocks/' . $slug;

        if (file_exists($block_dir)) {
            wp_send_json_error(__('Ein Block mit diesem Slug existiert bereits.', 'modular-blocks-plugin'));
            return;
        }

        // Create block directory
        if (!wp_mkdir_p($block_dir)) {
            wp_send_json_error(__('Fehler beim Erstellen des Block-Ordners.', 'modular-blocks-plugin'));
            return;
        }

        // Create block files from templates
        $created_files = $this->create_block_files($block_dir, $slug, $title, $description, $category, $icon, $dynamic);

        if ($created_files) {
            wp_send_json_success([
                'message' => sprintf(__('Block "%s" erfolgreich erstellt!', 'modular-blocks-plugin'), $title),
                'block' => $slug
            ]);
        } else {
            wp_send_json_error(__('Fehler beim Erstellen der Block-Dateien.', 'modular-blocks-plugin'));
        }
    }

    /**
     * Create block files from templates
     */
    private function create_block_files($block_dir, $slug, $title, $description, $category, $icon, $dynamic) {
        $files_created = 0;

        // Create block.json
        $block_json = [
            'apiVersion' => 3,
            'name' => 'modular-blocks/' . $slug,
            'title' => $title,
            'category' => $category,
            'icon' => $icon,
            'description' => $description,
            'keywords' => [$slug],
            'textdomain' => 'modular-blocks-plugin',
            'editorScript' => 'file:./index.js',
            'editorStyle' => 'file:./editor.css',
            'style' => 'file:./style.css',
            'attributes' => [
                'content' => [
                    'type' => 'string',
                    'default' => ''
                ]
            ],
            'supports' => [
                'html' => false,
                'align' => ['wide', 'full']
            ]
        ];

        if ($dynamic) {
            $block_json['viewScript'] = 'file:./view.js';
        }

        $files_created += file_put_contents($block_dir . '/block.json', json_encode($block_json, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE)) !== false ? 1 : 0;

        // Create index.js
        $index_js = "import { registerBlockType } from '@wordpress/blocks';
import { useBlockProps, RichText } from '@wordpress/block-editor';
import { __ } from '@wordpress/i18n';

import './editor.css';
import './style.css';

registerBlockType('modular-blocks/{$slug}', {
\tedit: ({ attributes, setAttributes }) => {
\t\tconst blockProps = useBlockProps();

\t\treturn (
\t\t\t<div {...blockProps}>
\t\t\t\t<RichText
\t\t\t\t\ttagName=\"p\"
\t\t\t\t\tvalue={attributes.content}
\t\t\t\t\tonChange={(content) => setAttributes({ content })}
\t\t\t\t\tplaceholder={__('Inhalt eingeben...', 'modular-blocks-plugin')}
\t\t\t\t/>
\t\t\t</div>
\t\t);
\t},

\tsave: ({ attributes }) => {
\t\tconst blockProps = useBlockProps.save();

\t\treturn (
\t\t\t<div {...blockProps}>
\t\t\t\t<RichText.Content tagName=\"p\" value={attributes.content} />
\t\t\t</div>
\t\t);
\t},
});
";
        $files_created += file_put_contents($block_dir . '/index.js', $index_js) !== false ? 1 : 0;

        // Create editor.css
        $editor_css = "/**
 * {$title} - Editor Styles
 */

.wp-block-modular-blocks-{$slug} {
\tborder: 1px dashed #ddd;
\tpadding: 20px;
\tbackground: #f9f9f9;
}
";
        $files_created += file_put_contents($block_dir . '/editor.css', $editor_css) !== false ? 1 : 0;

        // Create style.css
        $style_css = "/**
 * {$title} - Frontend Styles
 */

.wp-block-modular-blocks-{$slug} {
\tpadding: 20px;
\tmargin: 20px 0;
}
";
        $files_created += file_put_contents($block_dir . '/style.css', $style_css) !== false ? 1 : 0;

        // Create render.php if dynamic
        if ($dynamic) {
            $render_php = "<?php
/**
 * {$title} - Server-side rendering
 *
 * @var array    \$block_attributes Block attributes
 * @var string   \$block_content    Block content
 * @var WP_Block \$block_object     Block object
 */

if (!defined('ABSPATH')) {
\texit;
}

\$content = \$block_attributes['content'] ?? '';
?>

<div class=\"wp-block-modular-blocks-{$slug}\">
\t<p><?php echo esc_html(\$content); ?></p>
</div>
";
            $files_created += file_put_contents($block_dir . '/render.php', $render_php) !== false ? 1 : 0;

            // Create view.js
            $view_js = "/**
 * {$title} - Frontend JavaScript
 */

(function() {
\t'use strict';

\tfunction init{$slug}Blocks() {
\t\tconst blocks = document.querySelectorAll('.wp-block-modular-blocks-{$slug}');
\t\t
\t\tblocks.forEach((block) => {
\t\t\t// Add your frontend interactivity here
\t\t\tconsole.log('Block loaded:', block);
\t\t});
\t}

\tif (document.readyState === 'loading') {
\t\tdocument.addEventListener('DOMContentLoaded', init{$slug}Blocks);
\t} else {
\t\tinit{$slug}Blocks();
\t}
})();
";
            $files_created += file_put_contents($block_dir . '/view.js', $view_js) !== false ? 1 : 0;
        }

        return $files_created >= 4; // At minimum: block.json, index.js, editor.css, style.css
    }

    /**
     * AJAX handler for deleting blocks
     */
    public function ajax_delete_block() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unzureichende Berechtigung.', 'modular-blocks-plugin'));
            return;
        }

        $block_name = sanitize_text_field($_POST['block_name'] ?? '');

        if (empty($block_name)) {
            wp_send_json_error(__('Ungültiger Block-Name.', 'modular-blocks-plugin'));
            return;
        }

        $block_dir = MODULAR_BLOCKS_PLUGIN_PATH . 'blocks/' . $block_name;

        if (!file_exists($block_dir)) {
            wp_send_json_error(__('Block-Ordner nicht gefunden.', 'modular-blocks-plugin'));
            return;
        }

        // Delete block directory recursively
        if ($this->delete_directory($block_dir)) {
            // Remove from enabled blocks
            $enabled_blocks = get_option('modular_blocks_enabled_blocks', []);
            $enabled_blocks = array_filter($enabled_blocks, function($block) use ($block_name) {
                return $block !== $block_name;
            });
            update_option('modular_blocks_enabled_blocks', array_values($enabled_blocks));

            wp_send_json_success([
                'message' => __('Block erfolgreich gelöscht.', 'modular-blocks-plugin')
            ]);
        } else {
            wp_send_json_error(__('Fehler beim Löschen des Blocks.', 'modular-blocks-plugin'));
        }
    }

    /**
     * Recursively delete a directory
     */
    private function delete_directory($dir) {
        // SECURITY: Validate path is within plugin directory to prevent path traversal attacks
        $plugin_path = realpath(MODULAR_BLOCKS_PLUGIN_PATH);
        $dir_real = realpath($dir);

        // If realpath returns false, path doesn't exist or is invalid
        if ($dir_real === false) {
            // Try with parent directory for paths that don't exist yet
            $parent_dir = dirname($dir);
            $parent_real = realpath($parent_dir);

            if ($parent_real === false || strpos($parent_real, $plugin_path) !== 0) {
                error_log('Modular Blocks: Attempted to delete invalid path: ' . $dir);
                return false;
            }

            // Path doesn't exist, consider it "deleted"
            return true;
        }

        // Ensure the real path is within the plugin directory
        if (strpos($dir_real, $plugin_path) !== 0) {
            error_log('Modular Blocks: Attempted to delete directory outside plugin: ' . $dir);
            return false;
        }

        if (!file_exists($dir_real)) {
            return true;
        }

        if (!is_dir($dir_real)) {
            return unlink($dir_real);
        }

        // Use RecursiveIteratorIterator for safer deletion
        try {
            $iterator = new RecursiveIteratorIterator(
                new RecursiveDirectoryIterator($dir_real, RecursiveDirectoryIterator::SKIP_DOTS),
                RecursiveIteratorIterator::CHILD_FIRST
            );

            foreach ($iterator as $file) {
                if ($file->isDir()) {
                    rmdir($file->getRealPath());
                } else {
                    unlink($file->getRealPath());
                }
            }

            return rmdir($dir_real);
        } catch (Exception $e) {
            error_log('Modular Blocks: Error deleting directory: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * AJAX handler for uploading block ZIP files
     */
    public function ajax_upload_block() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unzureichende Berechtigung.', 'modular-blocks-plugin'));
            return;
        }

        if (empty($_FILES['block_zip'])) {
            wp_send_json_error(__('Keine Datei hochgeladen.', 'modular-blocks-plugin'));
            return;
        }

        $file = $_FILES['block_zip'];

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            wp_send_json_error(__('Fehler beim Hochladen der Datei.', 'modular-blocks-plugin'));
            return;
        }

        // Check file type - both extension and MIME type
        $file_type = wp_check_filetype($file['name']);
        $allowed_mime = array('application/zip', 'application/x-zip-compressed', 'application/x-zip');

        if ($file_type['ext'] !== 'zip') {
            wp_send_json_error(__('Nur ZIP-Dateien sind erlaubt.', 'modular-blocks-plugin'));
            return;
        }

        // Verify MIME type from $_FILES
        if (!in_array($file['type'], $allowed_mime, true)) {
            wp_send_json_error(__('Ung\u00fcltiger Dateityp. Nur ZIP-Dateien sind erlaubt.', 'modular-blocks-plugin'));
            return;
        }

        // Additional check: Verify actual file content using finfo
        if (function_exists('finfo_open')) {
            $finfo = finfo_open(FILEINFO_MIME_TYPE);
            $mime = finfo_file($finfo, $file['tmp_name']);
            finfo_close($finfo);

            if (!in_array($mime, $allowed_mime, true)) {
                wp_send_json_error(__('Die hochgeladene Datei ist keine g\u00fcltige ZIP-Datei.', 'modular-blocks-plugin'));
                return;
            }
        }

        // Load WordPress file system
        require_once ABSPATH . 'wp-admin/includes/file.php';
        WP_Filesystem();
        global $wp_filesystem;

        // Create temporary directory with secure random ID
        $temp_dir = MODULAR_BLOCKS_PLUGIN_PATH . 'temp-' . bin2hex(random_bytes(8));
        wp_mkdir_p($temp_dir);

        // Unzip file
        $unzip_result = unzip_file($file['tmp_name'], $temp_dir);

        if (is_wp_error($unzip_result)) {
            $this->delete_directory($temp_dir);
            wp_send_json_error(__('Fehler beim Entpacken der ZIP-Datei.', 'modular-blocks-plugin'));
            return;
        }

        // Find block.json in extracted files
        $block_dir_found = false;
        $block_name = '';

        // Check if there's a single directory in temp
        $temp_contents = scandir($temp_dir);
        $temp_contents = array_diff($temp_contents, ['.', '..']);

        if (count($temp_contents) === 1) {
            $first_item = reset($temp_contents);
            $potential_block_dir = $temp_dir . '/' . $first_item;

            if (is_dir($potential_block_dir) && file_exists($potential_block_dir . '/block.json')) {
                $block_dir_found = $potential_block_dir;
                $block_name = $first_item;
            }
        }

        // Check root level for block.json
        if (!$block_dir_found && file_exists($temp_dir . '/block.json')) {
            $block_dir_found = $temp_dir;
            // Get block name from block.json
            $block_json = json_decode(file_get_contents($temp_dir . '/block.json'), true);
            if (isset($block_json['name'])) {
                $block_name = str_replace('modular-blocks/', '', $block_json['name']);
            }
        }

        if (!$block_dir_found) {
            $this->delete_directory($temp_dir);
            wp_send_json_error(__('Keine gültige Block-Struktur gefunden. block.json fehlt.', 'modular-blocks-plugin'));
            return;
        }

        // Move to blocks directory
        $target_dir = MODULAR_BLOCKS_PLUGIN_PATH . 'blocks/' . $block_name;

        if (file_exists($target_dir)) {
            $this->delete_directory($temp_dir);
            wp_send_json_error(sprintf(__('Block "%s" existiert bereits.', 'modular-blocks-plugin'), $block_name));
            return;
        }

        if (!rename($block_dir_found, $target_dir)) {
            $this->delete_directory($temp_dir);
            wp_send_json_error(__('Fehler beim Verschieben des Blocks.', 'modular-blocks-plugin'));
            return;
        }

        // Clean up temp directory
        $this->delete_directory($temp_dir);

        wp_send_json_success([
            'message' => sprintf(__('Block "%s" erfolgreich hochgeladen!', 'modular-blocks-plugin'), $block_name),
            'block' => $block_name
        ]);
    }

    /**
     * Diagnostics page callback
     */
    public function diagnostics_page_callback() {
        if (!class_exists('ModularBlocks_Diagnostics')) {
            require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-diagnostics.php';
        }

        $diagnostics = new ModularBlocks_Diagnostics();
        $diagnostics->render_diagnostics_page();
    }

    /**
     * AJAX: Clear WordPress caches
     */
    public function ajax_clear_cache() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Keine Berechtigung.', 'modular-blocks-plugin'));
            return;
        }

        // Clear WordPress object cache
        wp_cache_flush();

        // Clear transients
        global $wpdb;
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_transient_') . '%'
        ));
        $wpdb->query($wpdb->prepare(
            "DELETE FROM {$wpdb->options} WHERE option_name LIKE %s",
            $wpdb->esc_like('_site_transient_') . '%'
        ));

        // Clear block type registry (this forces re-registration)
        if (function_exists('WP_Block_Type_Registry')) {
            $registry = WP_Block_Type_Registry::get_instance();
            // We can't directly clear it, but we can trigger a refresh by touching the plugin file
            touch(MODULAR_BLOCKS_PLUGIN_PATH . 'modular-blocks-plugin.php');
        }

        wp_send_json_success([
            'message' => __('Cache erfolgreich geleert! Bitte laden Sie den Browser neu (Strg+Shift+R).', 'modular-blocks-plugin')
        ]);
    }
}