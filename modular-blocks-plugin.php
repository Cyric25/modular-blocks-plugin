<?php
/**
 * Plugin Name: Modulare Blöcke Plugin
 * Plugin URI: https://example.com/modular-blocks-plugin
 * Description: Ein modulares WordPress Plugin das dynamisch Gutenberg Blöcke aus Ordnern registriert
 * Version: 1.1.8
 * Author: Ihr Name
 * Text Domain: modular-blocks-plugin
 * Domain Path: /languages
 * Requires at least: 6.0
 * Tested up to: 6.8
 * Requires PHP: 8.0
 * License: GPL-2.0+
 * License URI: http://www.gnu.org/licenses/gpl-2.0.txt
 */

// Prevent direct access
if (!defined('ABSPATH')) {
    exit;
}

// Plugin constants
define('MODULAR_BLOCKS_PLUGIN_VERSION', '1.1.8');
define('MODULAR_BLOCKS_PLUGIN_URL', plugin_dir_url(__FILE__));
define('MODULAR_BLOCKS_PLUGIN_PATH', plugin_dir_path(__FILE__));
define('MODULAR_BLOCKS_PLUGIN_BASENAME', plugin_basename(__FILE__));

/**
 * Global debug logging function
 * Only logs when WP_DEBUG and WP_DEBUG_LOG are enabled
 *
 * @param string $message The message to log
 */
if (!function_exists('modular_blocks_debug_log')) {
    function modular_blocks_debug_log($message) {
        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('Modular Blocks: ' . $message);
        }
    }
}

// Main plugin class
class ModularBlocksPlugin {

    private static $instance = null;
    private $block_manager;
    private $admin_manager;

    public static function get_instance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    private function __construct() {
        $this->debug_log('Constructor called');
        $this->init_hooks();
        $this->load_dependencies();
        $this->debug_log('Dependencies loaded');
    }

    /**
     * Log debug messages only when WP_DEBUG is enabled
     *
     * @param string $message The message to log
     */
    private function debug_log($message) {
        if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
            error_log('Modular Blocks Plugin: ' . $message);
        }
    }

    private function init_hooks() {
        register_activation_hook(__FILE__, [$this, 'activate']);
        register_deactivation_hook(__FILE__, [$this, 'deactivate']);
        add_action('plugins_loaded', [$this, 'load_textdomain']);
        add_action('init', [$this, 'init']);
    }

    private function load_dependencies() {
        require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-block-manager.php';
        require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-admin-manager.php';
        require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-diagnostics.php';

        // ChemViz integration
        if (file_exists(MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-chemviz-enqueue.php')) {
            require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-chemviz-enqueue.php';
        }
        if (file_exists(MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-chemviz-shortcodes.php')) {
            require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-chemviz-shortcodes.php';
        }

        $this->block_manager = new ModularBlocks_Block_Manager();
        $this->admin_manager = new ModularBlocks_Admin_Manager();
    }

    public function init() {
        $this->debug_log('init() method called');
        $this->block_manager->init();
        $this->debug_log('Block manager initialized');
        $this->admin_manager->init();
        $this->debug_log('Admin manager initialized');

        // Initialize ChemViz features
        if (class_exists('ModularBlocks_ChemViz_Enqueue')) {
            $chemviz_enqueue = new ModularBlocks_ChemViz_Enqueue();
            $chemviz_enqueue->init();
        }

        if (class_exists('ModularBlocks_ChemViz_Shortcodes')) {
            $chemviz_shortcodes = new ModularBlocks_ChemViz_Shortcodes();
            $chemviz_shortcodes->init();
        }
        $this->debug_log('init() completed');
    }

    public function activate() {
        // Create default options
        add_option('modular_blocks_enabled_blocks', []);

        // Flush rewrite rules
        flush_rewrite_rules();
    }

    public function deactivate() {
        // Cleanup if needed
        flush_rewrite_rules();
    }

    public function load_textdomain() {
        load_plugin_textdomain(
            'modular-blocks-plugin',
            false,
            dirname(MODULAR_BLOCKS_PLUGIN_BASENAME) . '/languages'
        );
    }
}

// Initialize plugin
if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
    error_log('Modular Blocks Plugin: Initializing plugin instance...');
}
ModularBlocksPlugin::get_instance();
if (defined('WP_DEBUG') && WP_DEBUG && defined('WP_DEBUG_LOG') && WP_DEBUG_LOG) {
    error_log('Modular Blocks Plugin: Plugin instance created');
}