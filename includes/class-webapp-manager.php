<?php
/**
 * Web-App Manager Class
 *
 * Handles upload, extraction, and management of web applications
 *
 * @package ModularBlocksPlugin
 * @since 1.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

class ModularBlocks_WebApp_Manager {

    /**
     * Get web-apps directory path
     */
    public function get_webapps_dir() {
        return MODULAR_BLOCKS_PLUGIN_PATH . 'web-apps/';
    }

    /**
     * Get web-apps directory URL
     */
    public function get_webapps_url() {
        return MODULAR_BLOCKS_PLUGIN_URL . 'web-apps/';
    }

    /**
     * Initialize web-apps directory
     */
    public function init_webapps_directory() {
        $dir = $this->get_webapps_dir();

        if (!file_exists($dir)) {
            wp_mkdir_p($dir);
            $this->create_htaccess($dir);
            $this->create_index_php($dir);
        }
    }

    /**
     * Create .htaccess for security
     */
    private function create_htaccess($dir) {
        $htaccess_content = <<<'HTACCESS'
# Prevent PHP execution
<FilesMatch "\.(php|phtml|php3|php4|php5|pl|py|jsp|asp|sh|cgi)$">
    Deny from all
</FilesMatch>

# Allow CORS for web-apps
<IfModule mod_headers.c>
    Header set Access-Control-Allow-Origin "*"
    Header set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header set Access-Control-Allow-Headers "Content-Type"
</IfModule>

# Enable caching for static assets
<IfModule mod_expires.c>
    ExpiresActive On
    ExpiresByType text/html "access plus 1 hour"
    ExpiresByType text/css "access plus 1 month"
    ExpiresByType application/javascript "access plus 1 month"
    ExpiresByType image/png "access plus 1 year"
    ExpiresByType image/jpeg "access plus 1 year"
    ExpiresByType image/gif "access plus 1 year"
    ExpiresByType image/svg+xml "access plus 1 year"
</IfModule>
HTACCESS;

        file_put_contents($dir . '.htaccess', $htaccess_content);
    }

    /**
     * Create index.php to prevent directory listing
     */
    private function create_index_php($dir) {
        $index_content = "<?php\n// Silence is golden.\n";
        file_put_contents($dir . 'index.php', $index_content);
    }

    /**
     * Upload and extract web-app from ZIP
     *
     * @param array $file Uploaded file array from $_FILES
     * @return array Result with success/error
     */
    public function upload_webapp($file) {
        // Validate file
        $validation = $this->validate_upload($file);
        if (!$validation['valid']) {
            return $validation;
        }

        // Generate safe app name from filename
        $filename = sanitize_file_name($file['name']);
        $app_name = $this->generate_app_name($filename);

        // Check if app already exists
        $app_dir = $this->get_webapps_dir() . $app_name;
        if (file_exists($app_dir)) {
            return [
                'success' => false,
                'message' => 'Eine Web-App mit diesem Namen existiert bereits. Bitte umbenennen oder vorhandene App löschen.'
            ];
        }

        // Extract ZIP
        $extract_result = $this->extract_zip($file['tmp_name'], $app_dir);
        if (!$extract_result['success']) {
            return $extract_result;
        }

        // Validate extracted content
        $content_validation = $this->validate_webapp_content($app_dir);
        if (!$content_validation['valid']) {
            // Clean up on validation failure
            $this->delete_webapp($app_name);
            return [
                'success' => false,
                'message' => $content_validation['message']
            ];
        }

        return [
            'success' => true,
            'message' => 'Web-App erfolgreich hochgeladen!',
            'app_name' => $app_name,
            'url' => $this->get_webapp_url($app_name)
        ];
    }

    /**
     * Validate uploaded file
     */
    private function validate_upload($file) {
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            return [
                'valid' => false,
                'message' => 'Upload-Fehler: ' . $file['error']
            ];
        }

        // Check file size (max 50 MB)
        $max_size = 50 * 1024 * 1024; // 50 MB
        if ($file['size'] > $max_size) {
            return [
                'valid' => false,
                'message' => 'Datei zu groß. Maximum: 50 MB'
            ];
        }

        // Check if it's a ZIP file
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime_type = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);

        $allowed_types = ['application/zip', 'application/x-zip-compressed'];
        if (!in_array($mime_type, $allowed_types)) {
            return [
                'valid' => false,
                'message' => 'Nur ZIP-Dateien sind erlaubt'
            ];
        }

        return ['valid' => true];
    }

    /**
     * Generate safe app name from filename
     */
    private function generate_app_name($filename) {
        // Remove .zip extension
        $name = preg_replace('/\.zip$/i', '', $filename);

        // Convert to lowercase
        $name = strtolower($name);

        // Replace spaces and special chars with hyphens
        $name = preg_replace('/[^a-z0-9]+/', '-', $name);

        // Remove leading/trailing hyphens
        $name = trim($name, '-');

        return $name;
    }

    /**
     * Extract ZIP file
     */
    private function extract_zip($zip_path, $destination) {
        WP_Filesystem();
        global $wp_filesystem;

        // Use WordPress unzip_file function
        $result = unzip_file($zip_path, $destination);

        if (is_wp_error($result)) {
            return [
                'success' => false,
                'message' => 'Fehler beim Entpacken: ' . $result->get_error_message()
            ];
        }

        return ['success' => true];
    }

    /**
     * Validate extracted web-app content
     */
    private function validate_webapp_content($app_dir) {
        // Check if index.html exists
        $index_file = $app_dir . '/index.html';
        if (!file_exists($index_file)) {
            return [
                'valid' => false,
                'message' => 'Keine index.html gefunden. Web-App muss eine index.html Datei enthalten.'
            ];
        }

        // Check for dangerous files
        $dangerous = $this->scan_for_dangerous_files($app_dir);
        if (!empty($dangerous)) {
            return [
                'valid' => false,
                'message' => 'Gefährliche Dateien gefunden: ' . implode(', ', $dangerous)
            ];
        }

        return ['valid' => true];
    }

    /**
     * Scan for dangerous file types
     */
    private function scan_for_dangerous_files($dir) {
        $dangerous_extensions = ['php', 'phtml', 'php3', 'php4', 'php5', 'pl', 'py', 'jsp', 'asp', 'sh', 'cgi', 'exe'];
        $dangerous_files = [];

        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $ext = strtolower($file->getExtension());
                if (in_array($ext, $dangerous_extensions)) {
                    $dangerous_files[] = $file->getFilename();
                }
            }
        }

        return $dangerous_files;
    }

    /**
     * Get list of all web-apps
     */
    public function list_webapps() {
        $webapps_dir = $this->get_webapps_dir();
        $apps = [];

        if (!file_exists($webapps_dir)) {
            return $apps;
        }

        $dirs = scandir($webapps_dir);

        foreach ($dirs as $dir) {
            if ($dir === '.' || $dir === '..' || $dir === 'index.php' || $dir === '.htaccess') {
                continue;
            }

            $app_path = $webapps_dir . $dir;
            if (is_dir($app_path)) {
                $apps[] = [
                    'name' => $dir,
                    'path' => $app_path,
                    'url' => $this->get_webapp_url($dir),
                    'size' => $this->get_directory_size($app_path),
                    'created' => filectime($app_path)
                ];
            }
        }

        return $apps;
    }

    /**
     * Get directory size
     */
    private function get_directory_size($dir) {
        $size = 0;
        $iterator = new RecursiveIteratorIterator(
            new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS)
        );

        foreach ($iterator as $file) {
            if ($file->isFile()) {
                $size += $file->getSize();
            }
        }

        return $size;
    }

    /**
     * Format file size
     */
    public function format_size($bytes) {
        $units = ['B', 'KB', 'MB', 'GB'];
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        $bytes /= pow(1024, $pow);

        return round($bytes, 2) . ' ' . $units[$pow];
    }

    /**
     * Get web-app URL
     */
    public function get_webapp_url($app_name) {
        return $this->get_webapps_url() . $app_name . '/index.html';
    }

    /**
     * Delete web-app
     */
    public function delete_webapp($app_name) {
        $app_dir = $this->get_webapps_dir() . $app_name;

        if (!file_exists($app_dir)) {
            return [
                'success' => false,
                'message' => 'Web-App nicht gefunden'
            ];
        }

        // Recursive delete
        $this->delete_directory($app_dir);

        return [
            'success' => true,
            'message' => 'Web-App erfolgreich gelöscht'
        ];
    }

    /**
     * Recursively delete directory
     */
    private function delete_directory($dir) {
        if (!file_exists($dir)) {
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
