<?php
/**
 * H5P Drag and Drop Import Handler
 * Allows importing H5P Drag Question content files into the WordPress block
 *
 * @package ModularBlocks
 * @version 2.0.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class H5P_DragDrop_Importer {

    /**
     * Register AJAX handlers
     */
    public static function init() {
        add_action('wp_ajax_h5p_import_drag_drop', [__CLASS__, 'handle_import']);
    }

    /**
     * Handle the H5P file upload and conversion
     */
    public static function handle_import() {
        // Security check
        if (!check_ajax_referer('h5p_import_nonce', 'nonce', false)) {
            wp_send_json_error(['message' => __('Sicherheitsüberprüfung fehlgeschlagen.', 'modular-blocks-plugin')]);
        }

        // Permission check
        if (!current_user_can('edit_posts')) {
            wp_send_json_error(['message' => __('Sie haben keine Berechtigung für diese Aktion.', 'modular-blocks-plugin')]);
        }

        // Check for file
        if (empty($_FILES['h5p_file'])) {
            wp_send_json_error(['message' => __('Keine Datei hochgeladen.', 'modular-blocks-plugin')]);
        }

        $file = $_FILES['h5p_file'];

        // Validate file type
        $ext = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
        if ($ext !== 'h5p') {
            wp_send_json_error(['message' => __('Ungültiges Dateiformat. Bitte laden Sie eine .h5p-Datei hoch.', 'modular-blocks-plugin')]);
        }

        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            wp_send_json_error(['message' => __('Upload-Fehler aufgetreten.', 'modular-blocks-plugin')]);
        }

        try {
            $result = self::process_h5p_file($file['tmp_name']);
            wp_send_json_success($result);
        } catch (Exception $e) {
            wp_send_json_error(['message' => $e->getMessage()]);
        }
    }

    /**
     * Process the H5P file and extract content
     *
     * @param string $file_path Path to the uploaded H5P file
     * @return array Converted block attributes
     */
    private static function process_h5p_file($file_path) {
        $zip = new ZipArchive();

        if ($zip->open($file_path) !== true) {
            throw new Exception(__('Konnte die H5P-Datei nicht öffnen.', 'modular-blocks-plugin'));
        }

        // Create temp directory
        $temp_dir = get_temp_dir() . 'h5p_import_' . uniqid() . '/';
        wp_mkdir_p($temp_dir);

        // Extract ZIP
        $zip->extractTo($temp_dir);
        $zip->close();

        // Read content.json
        $content_file = $temp_dir . 'content/content.json';
        if (!file_exists($content_file)) {
            self::cleanup_temp($temp_dir);
            throw new Exception(__('content.json nicht in der H5P-Datei gefunden.', 'modular-blocks-plugin'));
        }

        $content_json = file_get_contents($content_file);
        $content = json_decode($content_json, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            self::cleanup_temp($temp_dir);
            throw new Exception(__('Fehler beim Parsen der H5P-Inhalte.', 'modular-blocks-plugin'));
        }

        // Read h5p.json for metadata
        $h5p_file = $temp_dir . 'h5p.json';
        $h5p_data = [];
        if (file_exists($h5p_file)) {
            $h5p_json = file_get_contents($h5p_file);
            $h5p_data = json_decode($h5p_json, true) ?: [];
        }

        // Convert H5P content to block attributes
        $result = self::convert_h5p_to_block($content, $temp_dir, $h5p_data);

        // Cleanup
        self::cleanup_temp($temp_dir);

        return $result;
    }

    /**
     * Convert H5P Drag Question content to block attributes
     *
     * @param array $content H5P content data
     * @param string $temp_dir Temporary directory with extracted files
     * @param array $h5p_data H5P metadata
     * @return array Block attributes
     */
    private static function convert_h5p_to_block($content, $temp_dir, $h5p_data) {
        $attributes = [
            'title' => '',
            'description' => '',
            'backgroundImage' => ['url' => '', 'alt' => '', 'id' => null],
            'draggables' => [],
            'dropZones' => [],
            'taskWidth' => 800,
            'taskHeight' => 400,
            'backgroundHeight' => 400
        ];

        // Get question text as title
        if (!empty($content['question']['settings']['questionTitle'])) {
            $attributes['title'] = sanitize_text_field($content['question']['settings']['questionTitle']);
        } elseif (!empty($h5p_data['title'])) {
            $attributes['title'] = sanitize_text_field($h5p_data['title']);
        }

        // Task settings
        $task = $content['question'] ?? $content;
        $settings = $task['settings'] ?? [];

        // Background image
        if (!empty($task['task']['settings']['background']['path'])) {
            $bg_path = $task['task']['settings']['background']['path'];
            $bg_file = $temp_dir . 'content/' . $bg_path;

            if (file_exists($bg_file)) {
                $uploaded = self::upload_media($bg_file, $bg_path);
                if ($uploaded) {
                    $attributes['backgroundImage'] = $uploaded;
                }
            }
        }

        // Task dimensions
        if (!empty($settings['size']['width'])) {
            $attributes['taskWidth'] = intval($settings['size']['width']);
        }
        if (!empty($settings['size']['height'])) {
            $attributes['taskHeight'] = intval($settings['size']['height']);
            $attributes['backgroundHeight'] = intval($settings['size']['height']);
        }

        // Process draggables (elements)
        $elements = $task['task']['elements'] ?? [];
        $index = 0;

        foreach ($elements as $element) {
            $draggable = self::convert_draggable($element, $temp_dir, $index);
            if ($draggable) {
                $attributes['draggables'][] = $draggable;
                $index++;
            }
        }

        // Process drop zones
        $dropZones = $task['task']['dropZones'] ?? [];
        $zoneIndex = 0;

        foreach ($dropZones as $zone) {
            $dropZone = self::convert_drop_zone($zone, $zoneIndex, $attributes['taskWidth'], $attributes['taskHeight']);
            if ($dropZone) {
                $attributes['dropZones'][] = $dropZone;
                $zoneIndex++;
            }
        }

        // Behavior settings
        $behaviour = $task['behaviour'] ?? $settings['behaviour'] ?? [];

        if (isset($behaviour['enableRetry'])) {
            $attributes['showRetry'] = (bool) $behaviour['enableRetry'];
        }
        if (isset($behaviour['enableSolutionsButton'])) {
            $attributes['showSolution'] = (bool) $behaviour['enableSolutionsButton'];
        }
        if (isset($behaviour['instantFeedback'])) {
            $attributes['instantFeedback'] = (bool) $behaviour['instantFeedback'];
        }
        if (isset($behaviour['showScorePoints'])) {
            $attributes['showScore'] = (bool) $behaviour['showScorePoints'];
        }
        if (isset($behaviour['applyPenalties'])) {
            $attributes['applyPenalty'] = (bool) $behaviour['applyPenalties'];
        }
        if (isset($behaviour['singlePoint'])) {
            $attributes['allowPartialScore'] = !$behaviour['singlePoint'];
        }
        if (isset($behaviour['backgroundOpacity'])) {
            // H5P uses 0-100
            $attributes['backgroundOpacity'] = intval($behaviour['backgroundOpacity']);
        }

        // Localization / feedback texts
        $l10n = $task['l10n'] ?? $settings['l10n'] ?? [];
        if (!empty($l10n['showSolution'])) {
            $attributes['solutionButtonText'] = sanitize_text_field($l10n['showSolution']);
        }
        if (!empty($l10n['tryAgain'])) {
            $attributes['retryButtonText'] = sanitize_text_field($l10n['tryAgain']);
        }
        if (!empty($l10n['checkAnswer'])) {
            $attributes['checkButtonText'] = sanitize_text_field($l10n['checkAnswer']);
        }

        // Overall feedback
        $overallFeedback = $task['overallFeedback'] ?? [];
        if (!empty($overallFeedback)) {
            $feedbackRanges = [];
            foreach ($overallFeedback as $fb) {
                if (isset($fb['from']) && isset($fb['to']) && !empty($fb['feedback'])) {
                    $feedbackRanges[] = [
                        'from' => intval($fb['from']),
                        'to' => intval($fb['to']),
                        'feedback' => sanitize_text_field($fb['feedback'])
                    ];
                }
            }
            if (!empty($feedbackRanges)) {
                $attributes['feedbackRanges'] = $feedbackRanges;
            }
        }

        return $attributes;
    }

    /**
     * Convert H5P element to draggable
     *
     * @param array $element H5P element data
     * @param string $temp_dir Temporary directory
     * @param int $index Element index
     * @return array|null Draggable data
     */
    private static function convert_draggable($element, $temp_dir, $index) {
        $type = $element['type']['library'] ?? '';

        // Skip non-draggable elements
        if (strpos($type, 'H5P.DragText') !== false) {
            return null; // Text is embedded differently
        }

        $draggable = [
            'id' => 'h5p_drag_' . $index,
            'type' => 'text',
            'content' => '',
            'image' => ['url' => '', 'alt' => '', 'id' => null],
            'correctZones' => [],
            'color' => self::get_color_from_index($index),
            'size' => 'medium',
            'opacity' => 100,
            'infinite' => false,
            'tip' => ''
        ];

        // Text content
        if (!empty($element['type']['params']['text'])) {
            $draggable['content'] = wp_strip_all_tags($element['type']['params']['text']);
            $draggable['type'] = 'text';
        }

        // Image content
        if (!empty($element['type']['params']['file']['path'])) {
            $img_path = $element['type']['params']['file']['path'];
            $img_file = $temp_dir . 'content/' . $img_path;

            if (file_exists($img_file)) {
                $uploaded = self::upload_media($img_file, $img_path);
                if ($uploaded) {
                    $draggable['image'] = $uploaded;
                    $draggable['type'] = empty($draggable['content']) ? 'image' : 'both';
                }
            }
        }

        // Alternative text for images
        if (!empty($element['type']['params']['alt'])) {
            $draggable['image']['alt'] = sanitize_text_field($element['type']['params']['alt']);
        }

        // Drop zones this element belongs to
        if (!empty($element['dropZones'])) {
            foreach ($element['dropZones'] as $zoneIndex) {
                $draggable['correctZones'][] = 'h5p_zone_' . $zoneIndex;
            }
        }

        // Multiple option (infinite in our implementation)
        if (!empty($element['multiple'])) {
            $draggable['infinite'] = true;
        }

        // Background color from H5P
        if (!empty($element['backgroundOpacity'])) {
            $draggable['opacity'] = intval($element['backgroundOpacity']);
        }

        return $draggable;
    }

    /**
     * Convert H5P drop zone to our format
     *
     * @param array $zone H5P zone data
     * @param int $index Zone index
     * @param int $taskWidth Task width for percentage conversion
     * @param int $taskHeight Task height for percentage conversion
     * @return array Drop zone data
     */
    private static function convert_drop_zone($zone, $index, $taskWidth, $taskHeight) {
        $dropZone = [
            'id' => 'h5p_zone_' . $index,
            'label' => '',
            'showLabel' => true,
            'x' => 0,
            'y' => 0,
            'width' => 150,
            'height' => 100,
            'acceptMultiple' => false,
            'backgroundColor' => 'rgba(0, 115, 170, 0.1)',
            'borderColor' => self::get_color_from_index($index),
            'opacity' => 100,
            'autoAlign' => true,
            'alignSpacing' => 8,
            'tipCorrect' => '',
            'tipIncorrect' => ''
        ];

        // Label
        if (!empty($zone['label'])) {
            $dropZone['label'] = wp_strip_all_tags($zone['label']);
        } else {
            $dropZone['label'] = 'Zone ' . ($index + 1);
        }

        // Show label setting
        if (isset($zone['showLabel'])) {
            $dropZone['showLabel'] = (bool) $zone['showLabel'];
        }

        // Position - H5P uses percentages or pixels, we use percentages
        if (isset($zone['x'])) {
            // If the value looks like pixels, convert to percentage
            $x = floatval($zone['x']);
            if ($x > 100 && $taskWidth > 0) {
                $dropZone['x'] = round(($x / $taskWidth) * 100, 1);
            } else {
                $dropZone['x'] = $x;
            }
        }

        if (isset($zone['y'])) {
            $y = floatval($zone['y']);
            if ($y > 100 && $taskHeight > 0) {
                $dropZone['y'] = round(($y / $taskHeight) * 100, 1);
            } else {
                $dropZone['y'] = $y;
            }
        }

        // Size
        if (isset($zone['width'])) {
            $dropZone['width'] = intval($zone['width']);
        }
        if (isset($zone['height'])) {
            $dropZone['height'] = intval($zone['height']);
        }

        // Multiple elements
        if (!empty($zone['single']) && $zone['single'] === false) {
            $dropZone['acceptMultiple'] = true;
        }

        // Auto-align
        if (isset($zone['autoAlign'])) {
            $dropZone['autoAlign'] = (bool) $zone['autoAlign'];
        }

        // Opacity
        if (isset($zone['backgroundOpacity'])) {
            $dropZone['opacity'] = intval($zone['backgroundOpacity']);
        }

        // Tip texts
        if (!empty($zone['tipsAndFeedback']['tipLabel'])) {
            $dropZone['tipIncorrect'] = sanitize_text_field($zone['tipsAndFeedback']['tipLabel']);
        }

        return $dropZone;
    }

    /**
     * Upload a media file to WordPress media library
     *
     * @param string $file_path Path to the file
     * @param string $file_name Original filename
     * @return array|null Media data or null on failure
     */
    private static function upload_media($file_path, $file_name) {
        require_once(ABSPATH . 'wp-admin/includes/file.php');
        require_once(ABSPATH . 'wp-admin/includes/media.php');
        require_once(ABSPATH . 'wp-admin/includes/image.php');

        // Prepare file array
        $file_array = [
            'name' => basename($file_name),
            'tmp_name' => $file_path
        ];

        // Copy file to avoid issues with temp file deletion
        $temp_file = get_temp_dir() . 'h5p_media_' . basename($file_name);
        copy($file_path, $temp_file);
        $file_array['tmp_name'] = $temp_file;

        // Upload to media library
        $attachment_id = media_handle_sideload($file_array, 0, null);

        // Cleanup temp file
        @unlink($temp_file);

        if (is_wp_error($attachment_id)) {
            return null;
        }

        // Get attachment data
        $attachment = wp_get_attachment_image_src($attachment_id, 'full');
        $alt = get_post_meta($attachment_id, '_wp_attachment_image_alt', true);

        return [
            'url' => $attachment ? $attachment[0] : '',
            'alt' => $alt ?: '',
            'id' => $attachment_id
        ];
    }

    /**
     * Get a color from a predefined palette based on index
     *
     * @param int $index Element index
     * @return string Hex color
     */
    private static function get_color_from_index($index) {
        $colors = [
            '#0073aa', '#d63638', '#00a32a', '#e24614',
            '#8b5cf6', '#eab308', '#6b7280', '#1e1e1e',
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444'
        ];
        return $colors[$index % count($colors)];
    }

    /**
     * Cleanup temporary directory
     *
     * @param string $dir Directory path
     */
    private static function cleanup_temp($dir) {
        if (!is_dir($dir)) {
            return;
        }

        $files = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
            RecursiveIteratorIterator::CHILD_FIRST
        );

        foreach ($files as $file) {
            if ($file->isDir()) {
                rmdir($file->getRealPath());
            } else {
                unlink($file->getRealPath());
            }
        }

        rmdir($dir);
    }
}

// Initialize the importer
add_action('init', ['H5P_DragDrop_Importer', 'init']);
