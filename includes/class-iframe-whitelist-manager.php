<?php
/**
 * Iframe Whitelist Manager Class
 *
 * Handles whitelist management for the iframe-whitelist block
 */

if (!defined('ABSPATH')) {
    exit;
}

class ModularBlocks_Iframe_Whitelist_Manager {

    /**
     * Option name for storing the whitelist
     */
    const OPTION_NAME = 'modular_blocks_iframe_whitelist';

    /**
     * Initialize the manager
     */
    public function init() {
        // Register AJAX handlers
        add_action('wp_ajax_modular_blocks_whitelist_add', [$this, 'ajax_add_entry']);
        add_action('wp_ajax_modular_blocks_whitelist_update', [$this, 'ajax_update_entry']);
        add_action('wp_ajax_modular_blocks_whitelist_delete', [$this, 'ajax_delete_entry']);
        add_action('wp_ajax_modular_blocks_whitelist_validate', [$this, 'ajax_validate_url']);

        // Pass whitelist data to block editor
        add_action('enqueue_block_editor_assets', [$this, 'enqueue_editor_data']);
    }

    /**
     * Get the whitelist
     *
     * @return array
     */
    public function get_whitelist() {
        $whitelist = get_option(self::OPTION_NAME, []);

        if (!is_array($whitelist)) {
            return [];
        }

        return $whitelist;
    }

    /**
     * Save the whitelist
     *
     * @param array $whitelist
     * @return bool
     */
    public function save_whitelist($whitelist) {
        return update_option(self::OPTION_NAME, $whitelist);
    }

    /**
     * Add an entry to the whitelist
     *
     * @param string $name Display name
     * @param string $value URL or domain
     * @param string $type 'domain' or 'exact'
     * @param string $description Optional description
     * @return array|WP_Error
     */
    public function add_entry($name, $value, $type = 'domain', $description = '') {
        // Validate inputs
        $name = sanitize_text_field($name);
        $value = esc_url_raw($value);
        $type = in_array($type, ['domain', 'exact']) ? $type : 'domain';
        $description = sanitize_textarea_field($description);

        if (empty($name) || empty($value)) {
            return new WP_Error('invalid_input', __('Name und URL sind erforderlich.', 'modular-blocks-plugin'));
        }

        // Validate URL format
        if (!filter_var($value, FILTER_VALIDATE_URL)) {
            return new WP_Error('invalid_url', __('Ungültiges URL-Format.', 'modular-blocks-plugin'));
        }

        // Check for duplicates
        $whitelist = $this->get_whitelist();
        foreach ($whitelist as $entry) {
            if ($entry['value'] === $value) {
                return new WP_Error('duplicate', __('Diese URL existiert bereits in der Whitelist.', 'modular-blocks-plugin'));
            }
        }

        // Generate unique ID
        $id = wp_generate_uuid4();

        // Create entry
        $entry = [
            'id'          => $id,
            'name'        => $name,
            'value'       => $value,
            'type'        => $type,
            'description' => $description,
            'created'     => current_time('mysql'),
        ];

        // Add to whitelist
        $whitelist[] = $entry;
        $this->save_whitelist($whitelist);

        return $entry;
    }

    /**
     * Update an entry in the whitelist
     *
     * @param string $id Entry ID
     * @param array $data Updated data
     * @return array|WP_Error
     */
    public function update_entry($id, $data) {
        $whitelist = $this->get_whitelist();
        $found = false;

        foreach ($whitelist as $index => $entry) {
            if ($entry['id'] === $id) {
                // Validate inputs
                if (isset($data['name'])) {
                    $whitelist[$index]['name'] = sanitize_text_field($data['name']);
                }
                if (isset($data['value'])) {
                    $value = esc_url_raw($data['value']);
                    if (!filter_var($value, FILTER_VALIDATE_URL)) {
                        return new WP_Error('invalid_url', __('Ungültiges URL-Format.', 'modular-blocks-plugin'));
                    }
                    $whitelist[$index]['value'] = $value;
                }
                if (isset($data['type'])) {
                    $whitelist[$index]['type'] = in_array($data['type'], ['domain', 'exact']) ? $data['type'] : 'domain';
                }
                if (isset($data['description'])) {
                    $whitelist[$index]['description'] = sanitize_textarea_field($data['description']);
                }
                $whitelist[$index]['updated'] = current_time('mysql');
                $found = true;
                break;
            }
        }

        if (!$found) {
            return new WP_Error('not_found', __('Eintrag nicht gefunden.', 'modular-blocks-plugin'));
        }

        $this->save_whitelist($whitelist);
        return $whitelist[$index];
    }

    /**
     * Delete an entry from the whitelist
     *
     * @param string $id Entry ID
     * @return bool|WP_Error
     */
    public function delete_entry($id) {
        $whitelist = $this->get_whitelist();
        $initial_count = count($whitelist);

        $whitelist = array_filter($whitelist, function($entry) use ($id) {
            return $entry['id'] !== $id;
        });

        if (count($whitelist) === $initial_count) {
            return new WP_Error('not_found', __('Eintrag nicht gefunden.', 'modular-blocks-plugin'));
        }

        // Reindex array
        $whitelist = array_values($whitelist);
        $this->save_whitelist($whitelist);

        return true;
    }

    /**
     * Check if a URL is whitelisted
     *
     * @param string $url URL to check
     * @return bool
     */
    public function is_url_whitelisted($url) {
        if (empty($url)) {
            return false;
        }

        $whitelist = $this->get_whitelist();

        foreach ($whitelist as $entry) {
            if ($entry['type'] === 'domain') {
                // Domain-prefix match
                if (strpos($url, $entry['value']) === 0) {
                    return true;
                }
            } else {
                // Exact match (with optional trailing slash)
                $normalized_url = rtrim($url, '/');
                $normalized_entry = rtrim($entry['value'], '/');

                if ($normalized_url === $normalized_entry ||
                    strpos($normalized_url, $normalized_entry . '/') === 0) {
                    return true;
                }
            }
        }

        return false;
    }

    /**
     * Get matching whitelist entry for a URL
     *
     * @param string $url URL to check
     * @return array|null
     */
    public function get_matching_entry($url) {
        if (empty($url)) {
            return null;
        }

        $whitelist = $this->get_whitelist();

        foreach ($whitelist as $entry) {
            if ($entry['type'] === 'domain') {
                if (strpos($url, $entry['value']) === 0) {
                    return $entry;
                }
            } else {
                $normalized_url = rtrim($url, '/');
                $normalized_entry = rtrim($entry['value'], '/');

                if ($normalized_url === $normalized_entry ||
                    strpos($normalized_url, $normalized_entry . '/') === 0) {
                    return $entry;
                }
            }
        }

        return null;
    }

    /**
     * Enqueue whitelist data for the block editor
     */
    public function enqueue_editor_data() {
        $whitelist = $this->get_whitelist();

        // Only pass safe data to frontend
        $safe_whitelist = array_map(function($entry) {
            return [
                'id'    => $entry['id'],
                'name'  => $entry['name'],
                'value' => $entry['value'],
                'type'  => $entry['type'],
            ];
        }, $whitelist);

        wp_localize_script(
            'wp-blocks',
            'modularBlocksIframeWhitelist',
            [
                'whitelist' => $safe_whitelist,
                'nonce'     => wp_create_nonce('modular_blocks_admin'),
            ]
        );
    }

    /**
     * AJAX: Add whitelist entry
     */
    public function ajax_add_entry() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unzureichende Berechtigung.', 'modular-blocks-plugin'));
            return;
        }

        $name = sanitize_text_field($_POST['name'] ?? '');
        $value = esc_url_raw($_POST['value'] ?? '');
        $type = sanitize_text_field($_POST['type'] ?? 'domain');
        $description = sanitize_textarea_field($_POST['description'] ?? '');

        $result = $this->add_entry($name, $value, $type, $description);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success([
                'message' => __('Eintrag erfolgreich hinzugefügt.', 'modular-blocks-plugin'),
                'entry'   => $result,
            ]);
        }
    }

    /**
     * AJAX: Update whitelist entry
     */
    public function ajax_update_entry() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unzureichende Berechtigung.', 'modular-blocks-plugin'));
            return;
        }

        $id = sanitize_text_field($_POST['id'] ?? '');
        $data = [
            'name'        => sanitize_text_field($_POST['name'] ?? ''),
            'value'       => esc_url_raw($_POST['value'] ?? ''),
            'type'        => sanitize_text_field($_POST['type'] ?? 'domain'),
            'description' => sanitize_textarea_field($_POST['description'] ?? ''),
        ];

        $result = $this->update_entry($id, $data);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success([
                'message' => __('Eintrag erfolgreich aktualisiert.', 'modular-blocks-plugin'),
                'entry'   => $result,
            ]);
        }
    }

    /**
     * AJAX: Delete whitelist entry
     */
    public function ajax_delete_entry() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        if (!current_user_can('manage_options')) {
            wp_send_json_error(__('Unzureichende Berechtigung.', 'modular-blocks-plugin'));
            return;
        }

        $id = sanitize_text_field($_POST['id'] ?? '');

        $result = $this->delete_entry($id);

        if (is_wp_error($result)) {
            wp_send_json_error($result->get_error_message());
        } else {
            wp_send_json_success([
                'message' => __('Eintrag erfolgreich gelöscht.', 'modular-blocks-plugin'),
            ]);
        }
    }

    /**
     * AJAX: Validate URL against whitelist
     */
    public function ajax_validate_url() {
        check_ajax_referer('modular_blocks_admin', 'nonce');

        $url = esc_url_raw($_POST['url'] ?? '');

        if (empty($url)) {
            wp_send_json_error(__('Keine URL angegeben.', 'modular-blocks-plugin'));
            return;
        }

        $is_valid = $this->is_url_whitelisted($url);
        $matching_entry = $this->get_matching_entry($url);

        wp_send_json_success([
            'valid' => $is_valid,
            'entry' => $matching_entry ? [
                'name' => $matching_entry['name'],
                'type' => $matching_entry['type'],
            ] : null,
        ]);
    }
}
