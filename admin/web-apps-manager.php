<?php
/**
 * Web-Apps Manager Admin Page
 *
 * @package ModularBlocksPlugin
 * @since 1.2.0
 */

if (!defined('ABSPATH')) {
    exit;
}

// Check user capabilities
if (!current_user_can('manage_options')) {
    wp_die(__('Sie haben keine Berechtigung für diese Seite.'));
}

// Initialize WebApp Manager
require_once MODULAR_BLOCKS_PLUGIN_PATH . 'includes/class-webapp-manager.php';
$webapp_manager = new ModularBlocks_WebApp_Manager();
$webapp_manager->init_webapps_directory();

// Handle form submissions
$message = '';
$message_type = '';

// Handle upload
if (isset($_POST['upload_webapp']) && isset($_FILES['webapp_zip'])) {
    check_admin_referer('upload_webapp_nonce');

    $result = $webapp_manager->upload_webapp($_FILES['webapp_zip']);

    if ($result['success']) {
        $message = $result['message'];
        $message_type = 'success';
    } else {
        $message = $result['message'];
        $message_type = 'error';
    }
}

// Handle delete
if (isset($_POST['delete_webapp']) && isset($_POST['app_name'])) {
    check_admin_referer('delete_webapp_nonce');

    $app_name = sanitize_text_field($_POST['app_name']);
    $result = $webapp_manager->delete_webapp($app_name);

    if ($result['success']) {
        $message = $result['message'];
        $message_type = 'success';
    } else {
        $message = $result['message'];
        $message_type = 'error';
    }
}

// Get list of web-apps
$webapps = $webapp_manager->list_webapps();
?>

<div class="wrap">
    <h1><?php echo esc_html(get_admin_page_title()); ?></h1>

    <?php if ($message): ?>
        <div class="notice notice-<?php echo esc_attr($message_type); ?> is-dismissible">
            <p><?php echo esc_html($message); ?></p>
        </div>
    <?php endif; ?>

    <div class="card" style="max-width: 100%; margin-top: 20px;">
        <h2>Web-App hochladen</h2>
        <p>
            Laden Sie eine Web-App als ZIP-Datei hoch. Die ZIP-Datei muss eine <code>index.html</code> enthalten.
        </p>

        <form method="post" enctype="multipart/form-data" style="margin-top: 20px;">
            <?php wp_nonce_field('upload_webapp_nonce'); ?>

            <table class="form-table">
                <tr>
                    <th scope="row">
                        <label for="webapp_zip">ZIP-Datei auswählen</label>
                    </th>
                    <td>
                        <input type="file"
                               name="webapp_zip"
                               id="webapp_zip"
                               accept=".zip"
                               required
                               style="margin-bottom: 10px;">
                        <p class="description">
                            Maximale Größe: 50 MB<br>
                            Erlaubte Dateitypen: .html, .css, .js, .json, .png, .jpg, .gif, .svg, .woff, .woff2
                        </p>
                    </td>
                </tr>
            </table>

            <?php submit_button('Web-App hochladen', 'primary', 'upload_webapp'); ?>
        </form>
    </div>

    <div class="card" style="max-width: 100%; margin-top: 20px;">
        <h2>Installierte Web-Apps</h2>

        <?php if (empty($webapps)): ?>
            <p>Keine Web-Apps installiert. Laden Sie eine ZIP-Datei hoch, um zu beginnen.</p>
        <?php else: ?>
            <table class="wp-list-table widefat fixed striped">
                <thead>
                    <tr>
                        <th scope="col" class="manage-column column-name column-primary">Name</th>
                        <th scope="col" class="manage-column">Größe</th>
                        <th scope="col" class="manage-column">Hochgeladen</th>
                        <th scope="col" class="manage-column">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach ($webapps as $app): ?>
                        <tr>
                            <td class="column-primary" data-colname="Name">
                                <strong><?php echo esc_html($app['name']); ?></strong>
                                <button type="button" class="toggle-row">
                                    <span class="screen-reader-text">Mehr Details anzeigen</span>
                                </button>
                            </td>
                            <td data-colname="Größe">
                                <?php echo esc_html($webapp_manager->format_size($app['size'])); ?>
                            </td>
                            <td data-colname="Hochgeladen">
                                <?php echo esc_html(date_i18n(get_option('date_format') . ' ' . get_option('time_format'), $app['created'])); ?>
                            </td>
                            <td data-colname="Aktionen">
                                <a href="<?php echo esc_url($app['url']); ?>"
                                   target="_blank"
                                   class="button button-small">
                                    Vorschau
                                </a>

                                <button type="button"
                                        class="button button-small button-link-delete"
                                        onclick="deleteWebApp('<?php echo esc_js($app['name']); ?>')">
                                    Löschen
                                </button>

                                <!-- Hidden delete form -->
                                <form method="post"
                                      id="delete-form-<?php echo esc_attr($app['name']); ?>"
                                      style="display: none;">
                                    <?php wp_nonce_field('delete_webapp_nonce'); ?>
                                    <input type="hidden" name="app_name" value="<?php echo esc_attr($app['name']); ?>">
                                    <input type="hidden" name="delete_webapp" value="1">
                                </form>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        <?php endif; ?>
    </div>

    <div class="card" style="max-width: 100%; margin-top: 20px;">
        <h2>Verwendung</h2>
        <p>So binden Sie eine Web-App auf einer Seite ein:</p>
        <ol>
            <li>Öffnen Sie eine Seite im Block-Editor</li>
            <li>Fügen Sie den Block <strong>"Web-App Embed"</strong> hinzu</li>
            <li>Wählen Sie eine Web-App aus der Liste aus</li>
            <li>Passen Sie die Einstellungen an (Höhe, Fullscreen, etc.)</li>
            <li>Veröffentlichen Sie die Seite</li>
        </ol>

        <h3>Anforderungen an Web-Apps</h3>
        <ul>
            <li>Die ZIP-Datei muss eine <code>index.html</code> im Hauptverzeichnis enthalten</li>
            <li>Relative Pfade verwenden (z.B. <code>./style.css</code> statt <code>/style.css</code>)</li>
            <li>Keine serverseitigen Skripte (PHP, Python, etc.)</li>
            <li>Alle Ressourcen müssen in der ZIP enthalten sein (kein externes Laden)</li>
        </ul>

        <h3>Sicherheit</h3>
        <p>
            Web-Apps laufen in einem sicheren iframe mit Sandbox-Attributen.
            Gefährliche Dateitypen (PHP, EXE, etc.) werden automatisch blockiert.
        </p>
    </div>
</div>

<script>
function deleteWebApp(appName) {
    if (confirm('Möchten Sie die Web-App "' + appName + '" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
        document.getElementById('delete-form-' + appName).submit();
    }
}
</script>

<style>
.button-link-delete {
    color: #b32d2e;
}
.button-link-delete:hover {
    color: #dc3232;
}
</style>
