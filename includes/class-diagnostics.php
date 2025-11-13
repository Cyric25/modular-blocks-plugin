<?php
/**
 * Diagnostics Class
 *
 * Provides diagnostic tools for block registration and file verification
 */

if (!defined('ABSPATH')) {
    exit;
}

class ModularBlocks_Diagnostics {

    private $blocks_path;

    public function __construct() {
        $this->blocks_path = MODULAR_BLOCKS_PLUGIN_PATH . 'blocks/';
    }

    /**
     * Get diagnostic data for all blocks
     */
    public function get_diagnostics() {
        $data = [
            'plugin_info' => $this->get_plugin_info(),
            'blocks' => $this->scan_blocks(),
            'recommendations' => $this->get_recommendations()
        ];

        return $data;
    }

    /**
     * Get plugin information
     */
    private function get_plugin_info() {
        return [
            'plugin_path' => MODULAR_BLOCKS_PLUGIN_PATH,
            'blocks_path' => $this->blocks_path,
            'blocks_path_exists' => is_dir($this->blocks_path),
            'php_version' => phpversion(),
            'wp_version' => get_bloginfo('version'),
            'plugin_version' => MODULAR_BLOCKS_PLUGIN_VERSION
        ];
    }

    /**
     * Scan and analyze all blocks
     */
    private function scan_blocks() {
        if (!is_dir($this->blocks_path)) {
            return [];
        }

        $blocks = [];
        $items = scandir($this->blocks_path);

        foreach ($items as $item) {
            if ($item === '.' || $item === '..') {
                continue;
            }

            $block_path = $this->blocks_path . $item;
            if (is_dir($block_path)) {
                $blocks[$item] = $this->analyze_block($block_path, $item);
            }
        }

        return $blocks;
    }

    /**
     * Analyze a single block
     */
    private function analyze_block($block_path, $block_name) {
        $analysis = [
            'name' => $block_name,
            'path' => $block_path,
            'files' => [],
            'status' => 'valid',
            'issues' => []
        ];

        // Required and optional files
        $files_to_check = [
            'block.json' => ['required' => true, 'description' => 'Block metadata'],
            'index.js' => ['required' => true, 'description' => 'Editor JavaScript (compiled)'],
            'index.css' => ['required' => false, 'description' => 'Editor CSS (compiled)'],
            'style-index.css' => ['required' => false, 'description' => 'Frontend CSS (compiled)'],
            'view.js' => ['required' => false, 'description' => 'Frontend JavaScript'],
            'render.php' => ['required' => false, 'description' => 'Server rendering']
        ];

        foreach ($files_to_check as $file => $info) {
            $file_path = $block_path . '/' . $file;
            $exists = file_exists($file_path);

            $analysis['files'][$file] = [
                'exists' => $exists,
                'size' => $exists ? filesize($file_path) : 0,
                'required' => $info['required'],
                'description' => $info['description']
            ];

            if ($info['required'] && !$exists) {
                $analysis['status'] = 'invalid';
                $analysis['issues'][] = sprintf('Missing required file: %s', $file);
            }
        }

        // Check block.json content
        $block_json_path = $block_path . '/block.json';
        if (file_exists($block_json_path)) {
            $block_json_content = file_get_contents($block_json_path);
            $block_data = json_decode($block_json_content, true);

            if ($block_data) {
                $analysis['block_data'] = [
                    'name' => $block_data['name'] ?? 'NOT SET',
                    'title' => $block_data['title'] ?? 'NOT SET',
                    'category' => $block_data['category'] ?? 'NOT SET',
                    'editorScript' => $block_data['editorScript'] ?? 'NOT SET',
                    'editorStyle' => $block_data['editorStyle'] ?? 'NOT SET',
                    'style' => $block_data['style'] ?? 'NOT SET',
                    'viewScript' => $block_data['viewScript'] ?? 'NOT SET'
                ];

                // Check if category is correct
                if (isset($block_data['category']) && $block_data['category'] !== 'modular-blocks') {
                    $analysis['issues'][] = sprintf('Category is "%s" instead of "modular-blocks"', $block_data['category']);
                }
            } else {
                $analysis['status'] = 'invalid';
                $analysis['issues'][] = 'Invalid JSON in block.json';
            }
        }

        return $analysis;
    }

    /**
     * Get recommendations based on diagnostics
     */
    private function get_recommendations() {
        $blocks = $this->scan_blocks();
        $recommendations = [];

        $valid_blocks = 0;
        $total_blocks = count($blocks);

        foreach ($blocks as $block) {
            if ($block['status'] === 'valid') {
                $valid_blocks++;
            }
        }

        if ($valid_blocks === 0) {
            $recommendations[] = [
                'type' => 'critical',
                'message' => 'No valid blocks found. The ZIP may not have included compiled files.',
                'solution' => 'Run <code>npm run build</code> locally, then <code>npm run plugin-zip</code> to create a new ZIP with compiled files.'
            ];
        } elseif ($valid_blocks < $total_blocks) {
            $recommendations[] = [
                'type' => 'warning',
                'message' => 'Some blocks are missing compiled files.',
                'solution' => 'Rebuild the plugin with <code>npm run build && npm run plugin-zip</code>'
            ];
        } else {
            $recommendations[] = [
                'type' => 'success',
                'message' => 'All blocks have required files.',
                'solution' => 'Check WordPress debug.log at <code>/wp-content/debug.log</code> for registration errors.'
            ];
        }

        // Check if blocks directory exists
        if (!is_dir($this->blocks_path)) {
            $recommendations[] = [
                'type' => 'critical',
                'message' => 'Blocks directory not found!',
                'solution' => 'Make sure the plugin was installed correctly.'
            ];
        }

        return $recommendations;
    }

    /**
     * Format file size
     */
    private function format_size($bytes) {
        if ($bytes < 1024) return $bytes . ' B';
        if ($bytes < 1048576) return round($bytes / 1024, 2) . ' KB';
        return round($bytes / 1048576, 2) . ' MB';
    }

    /**
     * Render diagnostics page
     */
    public function render_diagnostics_page() {
        $diagnostics = $this->get_diagnostics();
        ?>
        <div class="wrap modular-blocks-diagnostics">
            <h1><?php _e('Block Diagnostics', 'modular-blocks-plugin'); ?></h1>

            <!-- Plugin Info -->
            <div class="card">
                <h2><?php _e('Plugin Information', 'modular-blocks-plugin'); ?></h2>
                <table class="widefat">
                    <tbody>
                        <tr>
                            <th><?php _e('Plugin Path', 'modular-blocks-plugin'); ?></th>
                            <td><code><?php echo esc_html($diagnostics['plugin_info']['plugin_path']); ?></code></td>
                        </tr>
                        <tr>
                            <th><?php _e('Blocks Path', 'modular-blocks-plugin'); ?></th>
                            <td>
                                <code><?php echo esc_html($diagnostics['plugin_info']['blocks_path']); ?></code>
                                <?php if ($diagnostics['plugin_info']['blocks_path_exists']): ?>
                                    <span class="dashicons dashicons-yes-alt" style="color: #00a32a;"></span>
                                <?php else: ?>
                                    <span class="dashicons dashicons-dismiss" style="color: #d63638;"></span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <tr>
                            <th><?php _e('PHP Version', 'modular-blocks-plugin'); ?></th>
                            <td><?php echo esc_html($diagnostics['plugin_info']['php_version']); ?></td>
                        </tr>
                        <tr>
                            <th><?php _e('WordPress Version', 'modular-blocks-plugin'); ?></th>
                            <td><?php echo esc_html($diagnostics['plugin_info']['wp_version']); ?></td>
                        </tr>
                        <tr>
                            <th><?php _e('Plugin Version', 'modular-blocks-plugin'); ?></th>
                            <td><?php echo esc_html($diagnostics['plugin_info']['plugin_version']); ?></td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <!-- Blocks Overview -->
            <div class="card" style="margin-top: 20px;">
                <h2><?php _e('Available Blocks', 'modular-blocks-plugin'); ?></h2>
                <table class="widefat striped">
                    <thead>
                        <tr>
                            <th><?php _e('Block Name', 'modular-blocks-plugin'); ?></th>
                            <th><?php _e('block.json', 'modular-blocks-plugin'); ?></th>
                            <th><?php _e('index.js', 'modular-blocks-plugin'); ?></th>
                            <th><?php _e('CSS Files', 'modular-blocks-plugin'); ?></th>
                            <th><?php _e('Status', 'modular-blocks-plugin'); ?></th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach ($diagnostics['blocks'] as $block): ?>
                        <tr>
                            <td><strong><?php echo esc_html($block['name']); ?></strong></td>
                            <td>
                                <?php if ($block['files']['block.json']['exists']): ?>
                                    <span class="dashicons dashicons-yes-alt" style="color: #00a32a;"></span>
                                    <?php echo esc_html($this->format_size($block['files']['block.json']['size'])); ?>
                                <?php else: ?>
                                    <span class="dashicons dashicons-dismiss" style="color: #d63638;"></span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($block['files']['index.js']['exists']): ?>
                                    <span class="dashicons dashicons-yes-alt" style="color: #00a32a;"></span>
                                    <?php echo esc_html($this->format_size($block['files']['index.js']['size'])); ?>
                                <?php else: ?>
                                    <span class="dashicons dashicons-dismiss" style="color: #d63638;"></span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php
                                $has_css = $block['files']['index.css']['exists'] || $block['files']['style-index.css']['exists'];
                                if ($has_css): ?>
                                    <span class="dashicons dashicons-yes-alt" style="color: #00a32a;"></span>
                                <?php else: ?>
                                    <span class="dashicons dashicons-minus" style="color: #999;"></span>
                                <?php endif; ?>
                            </td>
                            <td>
                                <?php if ($block['status'] === 'valid'): ?>
                                    <span style="color: #00a32a;">✅ <?php _e('Valid', 'modular-blocks-plugin'); ?></span>
                                <?php else: ?>
                                    <span style="color: #d63638;">❌ <?php _e('Invalid', 'modular-blocks-plugin'); ?></span>
                                <?php endif; ?>
                            </td>
                        </tr>
                        <?php if (!empty($block['issues'])): ?>
                        <tr>
                            <td colspan="5" style="background: #fff3cd; padding: 10px;">
                                <strong><?php _e('Issues:', 'modular-blocks-plugin'); ?></strong>
                                <ul style="margin: 5px 0 0 20px;">
                                    <?php foreach ($block['issues'] as $issue): ?>
                                        <li><?php echo esc_html($issue); ?></li>
                                    <?php endforeach; ?>
                                </ul>
                            </td>
                        </tr>
                        <?php endif; ?>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>

            <!-- Recommendations -->
            <div class="card" style="margin-top: 20px;">
                <h2><?php _e('Recommendations', 'modular-blocks-plugin'); ?></h2>
                <?php foreach ($diagnostics['recommendations'] as $rec): ?>
                    <div class="notice notice-<?php echo esc_attr($rec['type'] === 'critical' ? 'error' : ($rec['type'] === 'success' ? 'success' : 'warning')); ?> inline">
                        <p><strong><?php echo wp_kses_post($rec['message']); ?></strong></p>
                        <p><?php echo wp_kses_post($rec['solution']); ?></p>
                    </div>
                <?php endforeach; ?>
            </div>

            <!-- Debug Info -->
            <div class="card" style="margin-top: 20px;">
                <h2><?php _e('Debug Information', 'modular-blocks-plugin'); ?></h2>
                <p><?php _e('If blocks are still not appearing:', 'modular-blocks-plugin'); ?></p>
                <ul style="list-style: disc; margin-left: 20px;">
                    <li><?php _e('Check browser console (F12) for JavaScript errors', 'modular-blocks-plugin'); ?></li>
                    <li><?php _e('Check WordPress debug.log at:', 'modular-blocks-plugin'); ?> <code>/wp-content/debug.log</code></li>
                    <li><?php _e('Try deactivating and reactivating the plugin', 'modular-blocks-plugin'); ?></li>
                    <li><?php _e('Clear browser cache with Ctrl+Shift+R (or Cmd+Shift+R on Mac)', 'modular-blocks-plugin'); ?></li>
                </ul>
            </div>
        </div>

        <style>
            .modular-blocks-diagnostics .card {
                background: #fff;
                border: 1px solid #c3c4c7;
                border-radius: 4px;
                padding: 20px;
                box-shadow: 0 1px 1px rgba(0,0,0,.04);
            }
            .modular-blocks-diagnostics .card h2 {
                margin-top: 0;
                font-size: 18px;
            }
            .modular-blocks-diagnostics .widefat th {
                font-weight: 600;
            }
        </style>
        <?php
    }
}
